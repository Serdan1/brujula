"""Modelos de referencia para Brújula.

Clasificación (¿necesita apoyo?): regla G1 < 10, regresión logística y LightGBM.
Regresión (nota final): regla "G3 = G1", Ridge y LightGBM.
Validación: StratifiedGroupKFold por alumno (5 particiones), predicciones fuera de fold.

Uso:
    python baselines.py   -> results/baselines.json y results/oof_baselines.csv
"""
from __future__ import annotations

import json
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
from lightgbm import LGBMClassifier, LGBMRegressor
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.metrics import (average_precision_score, f1_score, mean_absolute_error,
                             precision_score, recall_score, roc_auc_score)
from sklearn.model_selection import GroupKFold, StratifiedGroupKFold
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

from features import cargar_uci, construir_variables

warnings.filterwarnings("ignore", category=UserWarning)
RESULTS = Path("results")
SEMILLA = 42


def oof_clasificacion(modelo_fn, X, y, grupos):
    prob = np.zeros(len(y))
    cv = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=SEMILLA)
    for tr, va in cv.split(X, y, grupos):
        m = modelo_fn()
        m.fit(X.iloc[tr], y.iloc[tr])
        prob[va] = m.predict_proba(X.iloc[va])[:, 1]
    return prob


def oof_regresion(modelo_fn, X, y, grupos):
    pred = np.zeros(len(y))
    for tr, va in GroupKFold(n_splits=5).split(X, y, grupos):
        m = modelo_fn()
        m.fit(X.iloc[tr], y.iloc[tr])
        pred[va] = m.predict(X.iloc[va])
    return np.clip(pred, 0, 20)


def umbral_para_recall(y, prob, recall_objetivo):
    """Umbral más alto que alcanza al menos el recall objetivo."""
    for u in np.sort(np.unique(prob))[::-1]:
        if recall_score(y, prob >= u) >= recall_objetivo:
            return float(u)
    return 0.0


def metricas(y, pred, prob=None):
    out = {"recall": recall_score(y, pred), "precision": precision_score(y, pred, zero_division=0),
           "f1": f1_score(y, pred), "alertas": int(pred.sum())}
    if prob is not None:
        out |= {"auc": roc_auc_score(y, prob), "pr_auc": average_precision_score(y, prob)}
    return {k: (v if k == "alertas" else round(float(v), 3)) for k, v in out.items()}


def equidad(y, pred, auditoria):
    filas = {}
    for col in auditoria.columns:
        for valor in sorted(auditoria[col].unique()):
            m = (auditoria[col] == valor).to_numpy()
            yt, yp = y[m], pred[m]
            fpr = ((yp == 1) & (yt == 0)).sum() / max((yt == 0).sum(), 1)
            filas[f"{col}={valor}"] = {"n": int(m.sum()), "recall": round(recall_score(yt, yp), 3),
                                       "falsas_alarmas": round(float(fpr), 3)}
    return filas


def main():
    df = cargar_uci()
    ds = construir_variables(df)
    X, y, g = ds.X, ds.y_apoyo, ds.grupos
    resultados = {"clasificacion": {}, "regresion": {}}

    # ---------- Clasificación ----------
    regla = (X["G1"] < 10).astype(int).to_numpy()
    resultados["clasificacion"]["regla_G1"] = metricas(y, regla)
    recall_regla = resultados["clasificacion"]["regla_G1"]["recall"]

    modelos = {
        "logistica": lambda: make_pipeline(StandardScaler(), LogisticRegression(
            class_weight="balanced", max_iter=1000)),
        "lightgbm": lambda: LGBMClassifier(n_estimators=300, learning_rate=0.05, num_leaves=15,
                                           min_child_samples=20, class_weight="balanced",
                                           random_state=SEMILLA, verbose=-1),
    }
    oof = pd.DataFrame({"alumno_id": g, "asignatura": ds.asignatura, "G1": X["G1"],
                        "necesita_apoyo": y, "regla_G1": regla})
    for nombre, fn in modelos.items():
        prob = oof_clasificacion(fn, X, y, g)
        oof[f"prob_{nombre}"] = prob
        u = umbral_para_recall(y, prob, recall_regla)
        pred = (prob >= u).astype(int)
        nuevos = int(((pred == 1) & (y == 1) & (X["G1"] >= 10)).sum())
        resultados["clasificacion"][nombre] = {
            "umbral_0.5": metricas(y, (prob >= 0.5).astype(int), prob),
            f"mismo_recall_que_regla (umbral {u:.3f})": metricas(y, pred, prob),
            "detectados_que_G1_no_ve": nuevos,
        }
        if nombre == "lightgbm":
            resultados["equidad_lightgbm"] = equidad(y.to_numpy(), pred, ds.auditoria)

    # ---------- Regresión (sin abandonos) ----------
    m = ds.y_nota.notna()
    Xr, yr, gr = X[m], ds.y_nota[m], g[m]
    resultados["regresion"]["regla_G3_igual_G1"] = round(mean_absolute_error(yr, Xr["G1"]), 3)
    reg = {
        "ridge": lambda: make_pipeline(StandardScaler(), Ridge(alpha=1.0)),
        "lightgbm": lambda: LGBMRegressor(n_estimators=300, learning_rate=0.05, num_leaves=15,
                                          min_child_samples=20, random_state=SEMILLA, verbose=-1),
    }
    for nombre, fn in reg.items():
        pred = oof_regresion(fn, Xr, yr, gr)
        resultados["regresion"][nombre] = round(mean_absolute_error(yr, pred), 3)

    RESULTS.mkdir(exist_ok=True)
    (RESULTS / "baselines.json").write_text(json.dumps(resultados, indent=2, ensure_ascii=False),
                                            encoding="utf-8")
    oof.to_csv(RESULTS / "oof_baselines.csv", index=False)

    # ---------- Resumen ----------
    c = resultados["clasificacion"]
    print("\nCLASIFICACIÓN (¿necesita apoyo?)")
    print(f"  Regla G1 < 10        -> {c['regla_G1']}")
    for nombre in modelos:
        claves = list(c[nombre])
        print(f"  {nombre:<12} umbral 0.5      -> {c[nombre]['umbral_0.5']}")
        print(f"  {nombre:<12} {claves[1]} -> {c[nombre][claves[1]]}")
        print(f"  {nombre:<12} detectados que G1 no ve: {c[nombre]['detectados_que_G1_no_ve']}")
    print("\nREGRESIÓN (MAE de la nota final, sin abandonos)")
    for k, v in resultados["regresion"].items():
        print(f"  {k:<20} {v}")
    print("\nEQUIDAD LightGBM (mismo recall que la regla)")
    for k, v in resultados["equidad_lightgbm"].items():
        print(f"  {k:<12} {v}")
    print(f"\nGuardado en {(RESULTS / 'baselines.json').resolve()}")


if __name__ == "__main__":
    main()
