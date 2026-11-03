"""Compara todas las combinaciones de modelos para las alertas (media de probabilidades).

Usa las predicciones fuera de fold ya guardadas: no reentrena nada.
Uso:
    python combinar.py   -> results/combinaciones.json
"""
import json
from itertools import combinations
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics import average_precision_score

from baselines import metricas, umbral_para_recall

RESULTS = Path("results")

base = pd.read_csv(RESULTS / "oof_baselines.csv")
red = pd.read_csv(RESULTS / "oof_red.csv")
assert len(base) == len(red), "Los ficheros de predicciones no coinciden: vuelve a ejecutar baselines.py y model.py"
assert (base["necesita_apoyo"].to_numpy() == red["necesita_apoyo"].to_numpy()).all(), "Filas desalineadas"

y = base["necesita_apoyo"]
g1 = base["G1"].to_numpy()
probs = {"red": red["prob_red"].to_numpy(),
         "logistica": base["prob_logistica"].to_numpy(),
         "lightgbm": base["prob_lightgbm"].to_numpy()}
recall_regla = json.loads((RESULTS / "baselines.json").read_text(encoding="utf-8"))["clasificacion"]["regla_G1"]["recall"]

filas = []
for n in (1, 2, 3):
    for combo in combinations(probs, n):
        p = np.mean([probs[m] for m in combo], axis=0)
        u = umbral_para_recall(y, p, recall_regla)
        pred = (p >= u).astype(int)
        m = metricas(y, pred, p)
        filas.append({"modelos": " + ".join(combo), "pr_auc": round(average_precision_score(y, p), 3),
                      "precision": m["precision"], "alertas": m["alertas"],
                      "g1_no_ve": int(((pred == 1) & (y == 1) & (g1 >= 10)).sum()), "umbral": round(u, 3)})

tabla = pd.DataFrame(filas).sort_values("pr_auc", ascending=False)
print(f"\nCon el mismo recall que la regla G1 ({recall_regla}); la regla G1 da 299 alertas\n")
print(tabla.to_string(index=False))
(RESULTS / "combinaciones.json").write_text(tabla.to_json(orient="records", force_ascii=False, indent=2),
                                            encoding="utf-8")
