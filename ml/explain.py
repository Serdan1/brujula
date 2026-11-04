"""Explicabilidad del modelo de alertas de Brújula (combinación regresión logística + LightGBM).

El modelo de alertas se eligió con combinar.py (mejor PR-AUC y menos falsas alarmas).
La red neuronal se usa para la nota estimada, no para las alertas.

- Entrena la logística y LightGBM finales con todos los datos.
- SHAP (KernelExplainer) sobre la probabilidad combinada de "necesita apoyo".
- Importancia global, por asignatura y por escuela; 3 variables principales por alumno.
- Equidad del modelo combinado (predicciones fuera de fold).

Uso:
    python explain.py
Salidas en results/: shap_alumnos.csv, importancia.json, equidad_combinado.json, figures/importancia_global.png
"""
from __future__ import annotations

import json
from pathlib import Path

import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import shap
from lightgbm import LGBMClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

from baselines import SEMILLA, equidad
from features import cargar_datos, construir_variables

RESULTS = Path("results")
FIG = RESULTS / "figures"

# Nombres que verá el profesor en la web
NOMBRES = {
    "G1": "Nota del primer periodo",
    "failures": "Suspensos previos",
    "studytime": "Tiempo de estudio semanal",
    "traveltime": "Tiempo de trayecto",
    "age": "Edad",
    "faltas_log": "Faltas",
    "schoolsup": "Apoyo educativo del centro",
    "famsup": "Apoyo educativo familiar",
    "paid": "Clases particulares",
    "activities": "Actividades extraescolares",
    "higher": "Quiere hacer estudios superiores",
    "internet": "Internet en casa",
    "es_matematicas": "Asignatura (Matemáticas)",
    "nota_practicas": "Nota de prácticas",
    "participacion": "Participación en clase",
    "asistencia": "Asistencia",
}


# Variables que siguen en el modelo pero no se muestran como motivo de una alerta (no accionables)
# Las de apoyo se excluyen por causalidad inversa: el apoyo se da a quien ya tiene dificultades.
NO_EXPLICAR = {"es_matematicas", "schoolsup", "famsup", "paid"}
MIN_SHAP = 0.01  # peso mínimo (1 punto porcentual de probabilidad) para mostrar un motivo
# Sentido esperado: +1 = valores altos aumentan la necesidad de apoyo; -1 = la reducen.
# Una explicación solo se muestra si su efecto es coherente con este sentido (evita artefactos
# como "0 faltas aumenta la necesidad de apoyo", causado por los abandonos sin faltas registradas).
SENTIDO = {"G1": -1, "failures": 1, "faltas_log": 1, "studytime": -1, "age": 1,
           "nota_practicas": -1, "participacion": -1, "asistencia": -1, "traveltime": 1, "activities": -1, "higher": -1, "internet": -1}


def coherente(col: str, valor: float, referencia: float, shap_v: float) -> bool:
    """Compara con la media del dataset (no la mediana, para evitar empates en variables como failures)."""
    if col not in SENTIDO:
        return True
    diferencia = valor - referencia
    if diferencia == 0:
        return False
    return np.sign(shap_v) == SENTIDO[col] * np.sign(diferencia)


MODELO_ALERTAS = "logistica + lightgbm"


def umbral_combinado() -> float:
    tabla = json.loads((RESULTS / "combinaciones.json").read_text(encoding="utf-8"))
    return float(next(f["umbral"] for f in tabla if f["modelos"] == MODELO_ALERTAS))


def valor_legible(col: str, v: float) -> str:
    if col == "faltas_log":
        return f"{int(round(np.expm1(v)))} faltas en el periodo 1"
    if col == "asistencia":
        return f"{v:.0f} %"
    if col in {"schoolsup", "famsup", "paid", "activities", "higher", "internet", "es_matematicas"}:
        return "sí" if v >= 0.5 else "no"
    if col == "studytime":
        return {1: "< 2 h", 2: "2–5 h", 3: "5–10 h", 4: "> 10 h"}.get(int(v), str(v))
    if col == "traveltime":
        return {1: "< 15 min", 2: "15–30 min", 3: "30–60 min", 4: "> 1 h"}.get(int(v), str(v))
    return f"{v:g}"


def importancia(shap_vals: np.ndarray, columnas, mascara=None):
    sv = shap_vals if mascara is None else shap_vals[mascara]
    imp = np.abs(sv).mean(0)
    orden = np.argsort(imp)[::-1]
    return [{"variable": columnas[i], "nombre": NOMBRES.get(columnas[i], columnas[i]),
             "importancia": round(float(imp[i]), 4)} for i in orden]


def main():
    df = cargar_datos()
    ds = construir_variables(df)
    columnas = list(ds.X.columns)
    X = ds.X.to_numpy(dtype=np.float64)
    y = ds.y_apoyo.to_numpy()

    # ---------- Modelos finales ----------
    lgbm = LGBMClassifier(n_estimators=300, learning_rate=0.05, num_leaves=15, min_child_samples=20,
                          class_weight="balanced", random_state=SEMILLA, verbose=-1)
    lgbm.fit(ds.X, y)
    joblib.dump(lgbm, RESULTS / "lgbm_final.pkl")
    logistica = make_pipeline(StandardScaler(), LogisticRegression(class_weight="balanced", max_iter=1000))
    logistica.fit(ds.X, y)
    joblib.dump(logistica, RESULTS / "logistica_final.pkl")

    def prob_combinada(Xa: np.ndarray) -> np.ndarray:
        Xd = pd.DataFrame(np.asarray(Xa, dtype=np.float64), columns=columnas)
        return (logistica.predict_proba(Xd)[:, 1] + lgbm.predict_proba(Xd)[:, 1]) / 2

    # ---------- SHAP ----------
    print("Calculando SHAP (1–3 minutos)...")
    fondo = shap.kmeans(X, 25)
    explicador = shap.KernelExplainer(prob_combinada, fondo)
    sv = np.asarray(explicador.shap_values(X, nsamples=200, silent=True))
    if sv.ndim == 3:  # por si alguna versión devuelve una dimensión extra
        sv = sv[..., -1] if sv.shape[-1] == 2 else sv[0]

    # Importancia global y por grupos (las clases se añadirán cuando Aarón las cree)
    imp = {"global": importancia(sv, columnas),
           "por_asignatura": {a: importancia(sv, columnas, (ds.asignatura == a).to_numpy())
                              for a in ds.asignatura.unique()},
           "por_escuela": {e: importancia(sv, columnas, (ds.auditoria["school"] == e).to_numpy())
                           for e in ds.auditoria["school"].unique()}}
    (RESULTS / "importancia.json").write_text(json.dumps(imp, indent=2, ensure_ascii=False), encoding="utf-8")

    # 3 variables principales por alumno, con su dirección
    prob = prob_combinada(X)
    prob_alerta = prob
    u = umbral_combinado()
    medias = X.mean(axis=0)
    filas, ocultadas = [], 0
    for i in range(len(X)):
        candidatas = [j for j in np.argsort(-np.abs(sv[i]))
                      if columnas[j] not in NO_EXPLICAR and abs(sv[i, j]) >= MIN_SHAP]
        con_alerta = prob_alerta[i] >= u
        top = [j for j in candidatas if coherente(columnas[j], X[i, j], medias[j], sv[i, j])
               and (not con_alerta or sv[i, j] > 0)][:3]  # en una alerta, solo lo que la provoca
        ocultadas += sum(1 for j in candidatas[:3] if j not in top)
        fila = {"alumno_id": int(ds.grupos.iloc[i]), "asignatura": ds.asignatura.iloc[i],
                "prob_apoyo": round(float(prob[i]), 3), "alerta": int(prob[i] >= u)}
        for r in (1, 2, 3):
            if r > len(top):
                for campo in ("", "_nombre", "_valor", "_shap", "_efecto"):
                    fila[f"var{r}{campo}"] = None
                continue
            j = top[r - 1]
            fila[f"var{r}"] = columnas[j]
            fila[f"var{r}_nombre"] = NOMBRES.get(columnas[j], columnas[j])
            fila[f"var{r}_valor"] = valor_legible(columnas[j], X[i, j])
            fila[f"var{r}_shap"] = round(float(sv[i, j]), 4)
            fila[f"var{r}_efecto"] = "aumenta la necesidad de apoyo" if sv[i, j] > 0 else "la reduce"
        filas.append(fila)
    pd.DataFrame(filas).to_csv(RESULTS / "shap_alumnos.csv", index=False)

    # ---------- Equidad del modelo combinado (fuera de fold) ----------
    oof_base = pd.read_csv(RESULTS / "oof_baselines.csv")
    comb = (oof_base["prob_logistica"].to_numpy() + oof_base["prob_lightgbm"].to_numpy()) / 2
    eq = equidad(y, (comb >= u).astype(int), ds.auditoria)
    (RESULTS / "equidad_combinado.json").write_text(json.dumps(eq, indent=2, ensure_ascii=False), encoding="utf-8")

    # ---------- Gráfica ----------
    FIG.mkdir(parents=True, exist_ok=True)
    g = imp["global"][::-1]
    plt.figure(figsize=(8, 5))
    plt.barh([d["nombre"] for d in g], [d["importancia"] for d in g])
    plt.xlabel("Importancia media (|SHAP| sobre la probabilidad de necesitar apoyo)")
    plt.title("Qué variables pesan más en las alertas")
    plt.tight_layout()
    plt.savefig(FIG / "importancia_global.png", dpi=120)

    # ---------- Resumen ----------
    print("\nIMPORTANCIA GLOBAL (de más a menos)")
    for d in imp["global"]:
        print(f"  {d['nombre']:<34} {d['importancia']:.4f}")
    for a, lista in imp["por_asignatura"].items():
        print(f"\nTop 3 en {a}: " + ", ".join(d["nombre"] for d in lista[:3]))
    print(f"\nExplicaciones ocultadas por no ser accionables o ser incoherentes: {ocultadas}")
    print(f"\nAlertas con el modelo final: {sum(f['alerta'] for f in filas)} de {len(filas)} (umbral {u:.3f})")
    con_motivo = [f for f in filas if f["alerta"] and f["var1"] is not None]
    ejemplo = next((f for f in con_motivo if f["var1"] != "G1"), con_motivo[0])
    print("\nEjemplo de explicación de una alerta:")
    for r in (1, 2, 3):
        if ejemplo[f"var{r}"] is None:
            continue
        print(f"  - {ejemplo[f'var{r}_nombre']}: {ejemplo[f'var{r}_valor']} -> {ejemplo[f'var{r}_efecto']}")
    print("\nEQUIDAD (modelo combinado)")
    for k, v in eq.items():
        print(f"  {k:<12} {v}")


if __name__ == "__main__":
    main()
