"""Red neuronal de Brújula: perceptrón multicapa multitarea en PyTorch.

Dos salidas a la vez:
  1) probabilidad de necesitar apoyo (G3 < 10, incluye abandonos)
  2) nota final estimada (sin abandonos), con intervalo del 80 % por MC Dropout

Validación idéntica a baselines.py (StratifiedGroupKFold por alumno, semilla 42),
así que las predicciones fuera de fold son comparables fila a fila.

Uso:
    python model.py   -> results/red_neuronal.json, results/oof_red.csv, results/modelo_final.pt
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd
import torch
from torch import nn
from sklearn.metrics import mean_absolute_error
from sklearn.model_selection import GroupShuffleSplit, StratifiedGroupKFold

from baselines import equidad, metricas, umbral_para_recall
from features import cargar_datos, construir_variables

RESULTS = Path("results")
SEMILLA = 42
Z80 = 1.2816  # cuantil normal para un intervalo del 80 %

CONFIG = {"ocultas": [64, 32], "dropout": 0.2, "lr": 1e-3, "weight_decay": 1e-4,
          "epocas_max": 400, "paciencia": 30, "batch": 64, "peso_nota": 1.0, "pasadas_mc": 50}

torch.set_num_threads(4)


class RedBrujula(nn.Module):
    def __init__(self, n_entradas: int, ocultas: list[int], dropout: float):
        super().__init__()
        capas, n = [], n_entradas
        for h in ocultas:
            capas += [nn.Linear(n, h), nn.ReLU(), nn.Dropout(dropout)]
            n = h
        self.tronco = nn.Sequential(*capas)
        self.cabeza_apoyo = nn.Linear(n, 1)
        self.cabeza_nota = nn.Linear(n, 1)

    def forward(self, x):
        h = self.tronco(x)
        return self.cabeza_apoyo(h).squeeze(-1), self.cabeza_nota(h).squeeze(-1)


class Escalador:
    """Estandarización ajustada solo con los datos de entrenamiento."""

    def fit(self, X: np.ndarray):
        self.media = X.mean(0)
        self.desv = X.std(0) + 1e-6
        return self

    def transform(self, X: np.ndarray) -> np.ndarray:
        return (X - self.media) / self.desv


def perdida(logit, nota_pred, y_apoyo, y_nota, pos_weight, peso_nota):
    l_apoyo = nn.functional.binary_cross_entropy_with_logits(logit, y_apoyo, pos_weight=pos_weight)
    mascara = ~torch.isnan(y_nota)
    if mascara.any():
        l_nota = nn.functional.smooth_l1_loss(nota_pred[mascara], y_nota[mascara])
    else:
        l_nota = torch.zeros((), device=logit.device)
    return l_apoyo + peso_nota * l_nota


def entrenar(X, y_apoyo, y_nota, grupos, semilla, idx_g1):
    """Entrena con parada temprana sobre un 15 % de alumnos reservados.

    La salida de nota predice el CAMBIO respecto a G1, estandarizado con los datos de entrenamiento.
    """
    torch.manual_seed(semilla)
    np.random.seed(semilla)
    gss = GroupShuffleSplit(n_splits=1, test_size=0.15, random_state=semilla)
    tr, va = next(gss.split(X, y_apoyo, grupos))

    esc = Escalador().fit(X[tr])
    t = lambda a: torch.tensor(a, dtype=torch.float32)
    Xtr, Xva = t(esc.transform(X[tr])), t(esc.transform(X[va]))
    atr, ava = t(y_apoyo[tr]), t(y_apoyo[va])
    delta = y_nota - X[:, idx_g1]
    mu, sd = float(np.nanmean(delta[tr])), float(np.nanstd(delta[tr])) + 1e-6
    dz = (delta - mu) / sd
    ntr, nva = t(dz[tr]), t(dz[va])
    pos_weight = t([(1 - y_apoyo[tr].mean()) / max(y_apoyo[tr].mean(), 1e-6)])

    red = RedBrujula(X.shape[1], CONFIG["ocultas"], CONFIG["dropout"])
    opt = torch.optim.Adam(red.parameters(), lr=CONFIG["lr"], weight_decay=CONFIG["weight_decay"])
    mejor, estado, sin_mejora = np.inf, None, 0

    for _ in range(CONFIG["epocas_max"]):
        red.train()
        orden = torch.randperm(len(Xtr))
        for i in range(0, len(orden), CONFIG["batch"]):
            idx = orden[i:i + CONFIG["batch"]]
            logit, nota = red(Xtr[idx])
            loss = perdida(logit, nota, atr[idx], ntr[idx], pos_weight, CONFIG["peso_nota"])
            opt.zero_grad()
            loss.backward()
            opt.step()
        red.eval()
        with torch.no_grad():
            logit, nota = red(Xva)
            l_va = perdida(logit, nota, ava, nva, pos_weight, CONFIG["peso_nota"]).item()
        if l_va < mejor - 1e-4:
            mejor, sin_mejora = l_va, 0
            estado = {k: v.clone() for k, v in red.state_dict().items()}
        else:
            sin_mejora += 1
            if sin_mejora >= CONFIG["paciencia"]:
                break

    red.load_state_dict(estado)

    # Desviación del error de la nota en los datos de entrenamiento (parte aleatoria del intervalo)
    red.eval()
    with torch.no_grad():
        _, nota_tr = red(Xtr)
    m = ~torch.isnan(ntr)
    sigma_resid = float((nota_tr[m] - ntr[m]).std()) * sd  # en puntos de nota
    return red, esc, sigma_resid, (mu, sd)


def predecir_mc(red, esc, X, sigma_resid, pasadas, objetivo, idx_g1):
    """MC Dropout: dropout activo en predicción para estimar la incertidumbre del modelo."""
    Xt = torch.tensor(esc.transform(X), dtype=torch.float32)
    red.train()  # activa el dropout
    probs, notas = [], []
    with torch.no_grad():
        for _ in range(pasadas):
            logit, nota = red(Xt)
            probs.append(torch.sigmoid(logit).numpy())
            notas.append(X[:, idx_g1] + nota.numpy() * objetivo[1] + objetivo[0])
    red.eval()
    probs, notas = np.stack(probs), np.stack(notas)
    media = notas.mean(0)
    desv = np.sqrt(notas.var(0) + sigma_resid ** 2)
    return (probs.mean(0), np.clip(media, 0, 20),
            np.clip(media - Z80 * desv, 0, 20), np.clip(media + Z80 * desv, 0, 20))


def main():
    df = cargar_datos()
    ds = construir_variables(df)
    X = ds.X.to_numpy(dtype=np.float32)
    y = ds.y_apoyo.to_numpy()
    y_nota = ds.y_nota.to_numpy(dtype=np.float32)
    g = ds.grupos.to_numpy()
    idx_g1 = list(ds.X.columns).index("G1")

    prob = np.zeros(len(y))
    nota, ic_inf, ic_sup = (np.zeros(len(y)) for _ in range(3))
    cv = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=SEMILLA)
    for k, (tr, va) in enumerate(cv.split(X, y, g), start=1):
        red, esc, sr, obj = entrenar(X[tr], y[tr], y_nota[tr], g[tr], SEMILLA + k, idx_g1)
        prob[va], nota[va], ic_inf[va], ic_sup[va] = predecir_mc(red, esc, X[va], sr, CONFIG["pasadas_mc"], obj, idx_g1)
        print(f"  partición {k}/5 lista")

    # ---------- Métricas ----------
    base = json.loads((RESULTS / "baselines.json").read_text(encoding="utf-8"))
    recall_regla = base["clasificacion"]["regla_G1"]["recall"]
    y_s = pd.Series(y)
    u = umbral_para_recall(y_s, prob, recall_regla)
    pred = (prob >= u).astype(int)
    G1 = ds.X["G1"].to_numpy()

    con_nota = ~np.isnan(y_nota)
    cobertura = float(((y_nota[con_nota] >= ic_inf[con_nota]) & (y_nota[con_nota] <= ic_sup[con_nota])).mean())

    res = {
        "config": CONFIG,
        "clasificacion": {
            "umbral_0.5": metricas(y_s, (prob >= 0.5).astype(int), prob),
            f"mismo_recall_que_regla (umbral {u:.3f})": metricas(y_s, pred, prob),
            "detectados_que_G1_no_ve": int(((pred == 1) & (y == 1) & (G1 >= 10)).sum()),
        },
        "regresion": {"mae": round(mean_absolute_error(y_nota[con_nota], nota[con_nota]), 3),
                      "cobertura_intervalo_80": round(cobertura, 3),
                      "ancho_medio_intervalo": round(float((ic_sup - ic_inf)[con_nota].mean()), 2)},
        "equidad": equidad(y, pred, ds.auditoria),
    }

    # Combinación con LightGBM (media de probabilidades), por si mejora a ambos
    oof_base = pd.read_csv(RESULTS / "oof_baselines.csv")
    if len(oof_base) == len(prob):
        comb = (prob + oof_base["prob_lightgbm"].to_numpy()) / 2
        uc = umbral_para_recall(y_s, comb, recall_regla)
        pc = (comb >= uc).astype(int)
        res["combinacion_red_lightgbm"] = {
            f"mismo_recall_que_regla (umbral {uc:.3f})": metricas(y_s, pc, comb),
            "detectados_que_G1_no_ve": int(((pc == 1) & (y == 1) & (G1 >= 10)).sum()),
        }

    RESULTS.mkdir(exist_ok=True)
    (RESULTS / "red_neuronal.json").write_text(json.dumps(res, indent=2, ensure_ascii=False), encoding="utf-8")
    pd.DataFrame({"alumno_id": g, "asignatura": ds.asignatura, "necesita_apoyo": y,
                  "prob_red": prob, "nota_estimada": nota, "ic_inf": ic_inf, "ic_sup": ic_sup}
                 ).to_csv(RESULTS / "oof_red.csv", index=False)

    # ---------- Modelo final con todos los datos (para SHAP y publicar) ----------
    red, esc, sr, obj = entrenar(X, y, y_nota, g, SEMILLA, idx_g1)
    torch.save({"estado": red.state_dict(), "media": esc.media.tolist(), "desv": esc.desv.tolist(),
                "sigma_resid": sr, "objetivo_mu": obj[0], "objetivo_sd": obj[1], "idx_g1": idx_g1, "columnas": list(ds.X.columns), "config": CONFIG,
                "umbral": u}, RESULTS / "modelo_final.pt")

    # ---------- Comparación ----------
    c = res["clasificacion"]
    clave = list(c)[1]
    bl = base["clasificacion"]["lightgbm"]
    clave_bl = [k for k in bl if k.startswith("mismo_recall")][0]
    print("\nCOMPARACIÓN CON EL MISMO RECALL QUE LA REGLA G1")
    print(f"  {'':<14}{'precisión':>10}{'alertas':>9}{'PR-AUC':>8}{'G1 no ve':>10}")
    fila = lambda n, m, d: print(f"  {n:<14}{m['precision']:>10}{m['alertas']:>9}{m.get('pr_auc', '-'):>8}{d:>10}")
    fila("Regla G1", base["clasificacion"]["regla_G1"], "-")
    fila("LightGBM", bl[clave_bl], bl["detectados_que_G1_no_ve"])
    fila("Red neuronal", c[clave], c["detectados_que_G1_no_ve"])
    if "combinacion_red_lightgbm" in res:
        cc = res["combinacion_red_lightgbm"]
        fila("Red + LGBM", cc[list(cc)[0]], cc["detectados_que_G1_no_ve"])
    r = res["regresion"]
    print(f"\nNOTA ESTIMADA  MAE red {r['mae']} (Ridge {base['regresion']['ridge']}) | "
          f"cobertura intervalo 80 %: {r['cobertura_intervalo_80']:.0%} | ancho medio {r['ancho_medio_intervalo']} puntos")
    print("\nEQUIDAD (red neuronal)")
    for k, v in res["equidad"].items():
        print(f"  {k:<12} {v}")
    print(f"\nGuardado en {RESULTS.resolve()}")


if __name__ == "__main__":
    main()
