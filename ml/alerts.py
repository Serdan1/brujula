"""Genera los resultados que lee la web, con el formato exacto de las tablas de Aarón.

Momento de la alerta: final del PERIODO 1 (alerta temprana), para las 4 asignaturas.
- Alertas por alumno: modelo (logística + LightGBM) y reglas claras.
- Alertas por clase y por asignatura: porcentaje de alumnos con alerta frente a la media del centro.
- Nota final estimada con intervalo del 80 %: red neuronal.

Requisitos: haber ejecutado explain.py (modelos finales y combinaciones.json) y model.py (modelo_final.pt).
Uso:
    python alerts.py   -> results/publicar/{prediccion,explicacion,alerta}.csv y analisis_clase.jsonl
"""
from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import shap

from explain import MIN_SHAP, NO_EXPLICAR, NOMBRES, coherente, umbral_combinado, valor_legible
from features import TABLAS, cargar_datos, construir_variables

RESULTS = Path("results")
SALIDA = RESULTS / "publicar"
MODELO_VERSION = "v1.0"
PERIODO = 1

# Umbrales de las reglas (acordados en la reunión de contratos; cámbialos aquí si hace falta)
ASISTENCIA_MIN = 85.0          # % en el periodo 1 (≈ 5 % más bajo)
PRACTICAS_MIN = 6.5            # sobre 20 (≈ 5 % más bajo)
PARTICIPACION_MIN = 2.0        # sobre 10 (≈ 5 % más bajo)
PROB_ALTA = 0.85               # probabilidad a partir de la cual la alerta es de severidad alta
CLASE_PCT_MEDIA = 0.30         # % de alumnos con alerta para avisar de una clase
CLASE_PCT_ALTA = 0.40
MARGEN_SOBRE_CENTRO = 0.10     # o 10 puntos por encima de la media del centro


def nota_estimada(X: np.ndarray):
    """Nota final estimada con la red neuronal; si falta PyTorch, se omite."""
    try:
        import torch
        from model import CONFIG, Escalador, RedBrujula, predecir_mc
    except (ImportError, OSError):
        print("Aviso: PyTorch no disponible; se omite la nota estimada")
        return [None], [None], [None]
    ck = torch.load(RESULTS / "modelo_final.pt", weights_only=False)
    red = RedBrujula(X.shape[1], ck["config"]["ocultas"], ck["config"]["dropout"])
    red.load_state_dict(ck["estado"])
    esc = Escalador()
    esc.media, esc.desv = np.array(ck["media"]), np.array(ck["desv"])
    _, nota, inf, sup = predecir_mc(red, esc, X.astype(np.float32), ck["sigma_resid"], CONFIG["pasadas_mc"],
                                    (ck["objetivo_mu"], ck["objetivo_sd"]), ck["idx_g1"])
    return nota, inf, sup


def aplicar_fuera_de_muestra(df, p, nota, inf, sup):
    """Sustituye las predicciones de las filas reales por las de validación cruzada."""
    oof_base = pd.read_csv(RESULTS / "oof_baselines.csv")
    claves = list(zip(oof_base["alumno_id"], oof_base["asignatura"]))
    prob_oof = dict(zip(claves, (oof_base["prob_logistica"] + oof_base["prob_lightgbm"]) / 2))
    nota_oof = {}
    ruta_red = RESULTS / "oof_red.csv"
    if ruta_red.exists() and nota[0] is not None:
        oof_red = pd.read_csv(ruta_red)
        nota_oof = dict(zip(zip(oof_red["alumno_id"], oof_red["asignatura"]),
                            zip(oof_red["nota_estimada"], oof_red["ic_inf"], oof_red["ic_sup"])))

    p = np.array(p, dtype=float)
    if nota[0] is not None:
        nota, inf, sup = (np.array(v, dtype=float) for v in (nota, inf, sup))
    sustituidas = 0
    for i, clave in enumerate(zip(df["alumno_id"], df["asignatura"])):
        if clave in prob_oof:
            p[i] = prob_oof[clave]
            sustituidas += 1
            if clave in nota_oof:
                nota[i], inf[i], sup[i] = nota_oof[clave]
    print(f"Predicciones fuera de muestra en {sustituidas} filas de asignaturas reales")
    return p, nota, inf, sup


def motivos_del_modelo(sv_fila, x_fila, columnas, medias):
    """Variables que explican una alerta del modelo: accionables, coherentes y que la provocan."""
    out = []
    for j in np.argsort(-np.abs(sv_fila)):
        col = columnas[j]
        if col in NO_EXPLICAR or abs(sv_fila[j]) < MIN_SHAP or sv_fila[j] <= 0:
            continue
        if not coherente(col, x_fila[j], medias[j], sv_fila[j]):
            continue
        out.append({"variable": col, "nombre": NOMBRES.get(col, col), "valor": valor_legible(col, x_fila[j]),
                    "shap": round(float(sv_fila[j]), 4)})
        if len(out) == 3:
            break
    return out


def main():
    SALIDA.mkdir(parents=True, exist_ok=True)
    clase = pd.read_csv(TABLAS / "clase.csv").rename(columns={"id": "clase_id"})
    clase["nombre_clase"] = clase["curso"].astype(str) + ".º Primaria " + clase["letra"].astype(str)

    # Datos de entrenamiento (para el fondo de SHAP) y de predicción (4 asignaturas)
    ds_tr = construir_variables(cargar_datos())
    df = cargar_datos(incluir_sinteticas=True)
    ds = construir_variables(df)
    columnas = list(ds.X.columns)
    assert columnas == list(ds_tr.X.columns)
    X = ds.X.to_numpy(dtype=np.float64)

    logistica = joblib.load(RESULTS / "logistica_final.pkl")
    lgbm = joblib.load(RESULTS / "lgbm_final.pkl")

    def prob(Xa):
        Xd = pd.DataFrame(np.asarray(Xa, dtype=np.float64), columns=columnas)
        return (logistica.predict_proba(Xd)[:, 1] + lgbm.predict_proba(Xd)[:, 1]) / 2

    u = umbral_combinado()
    p = prob(X)
    nota, inf, sup = nota_estimada(X)

    # Predicciones FUERA DE MUESTRA para las asignaturas reales: cada alumno de Portugués y
    # Matemáticas se predice con el modelo de la validación cruzada que no lo vio al entrenar
    # (oof_baselines.csv y oof_red.csv). Inglés y Ciencias ya son fuera de muestra: el modelo
    # nunca se entrenó con ellas. Así, la comprobación de aciertos con las notas finales es honesta.
    p, nota, inf, sup = aplicar_fuera_de_muestra(df, p, nota, inf, sup)

    print(f"Calculando SHAP para {len(X)} filas alumno-asignatura (unos minutos)...")
    explicador = shap.KernelExplainer(prob, shap.kmeans(ds_tr.X.to_numpy(dtype=np.float64), 25))
    sv = np.asarray(explicador.shap_values(X, nsamples=200, silent=True))
    if sv.ndim == 3:
        sv = sv[..., -1] if sv.shape[-1] == 2 else sv[0]
    medias = ds_tr.X.to_numpy(dtype=np.float64).mean(axis=0)

    base = df[["alumno_id", "asignatura_id", "asignatura", "clase_id", "escuela_id", "nombre"]].copy() \
        if "nombre" in df.columns else df[["alumno_id", "asignatura_id", "asignatura", "clase_id", "escuela_id"]].copy()
    base = base.merge(clase[["clase_id", "nombre_clase"]], on="clase_id", how="left")
    base["prob"] = p
    base["alerta_modelo"] = p >= u

    # ---------- prediccion ----------
    pred = base[["alumno_id", "asignatura_id"]].assign(
        periodo=PERIODO, prob_apoyo=np.round(p, 4),
        nota_final_estimada=None if nota[0] is None else np.round(nota, 2),
        ic_inf=None if inf[0] is None else np.round(inf, 2),
        ic_sup=None if sup[0] is None else np.round(sup, 2),
        modelo_version=MODELO_VERSION)
    pred.to_csv(SALIDA / "prediccion.csv", index=False)

    # ---------- alertas por alumno y explicaciones ----------
    alertas, expl = [], []
    for i, fila in base.iterrows():
        comunes = {"escuela_id": int(fila.escuela_id), "asignatura_id": int(fila.asignatura_id),
                   "clase_id": int(fila.clase_id), "alumno_id": int(fila.alumno_id), "nivel": "alumno"}
        asig = fila.asignatura
        if fila.alerta_modelo:
            motivos = motivos_del_modelo(sv[i], X[i], columnas, medias)
            texto = "; ".join(f"{m['nombre'].lower()}: {m['valor']}" for m in motivos) \
                or "combinación de varios factores (ver Análisis completo)"
            alertas.append(comunes | {
                "motivo": "riesgo_de_suspenso", "severidad": "alta" if fila.prob >= PROB_ALTA else "media",
                "titulo": f"Podría necesitar apoyo en {asig}",
                "descripcion": f"Señales en el primer periodo: {texto}. Revisa el caso antes de decidir.",
                "variables": json.dumps(motivos, ensure_ascii=False)})
            for orden, m in enumerate(motivos, start=1):
                expl.append({"alumno_id": int(fila.alumno_id), "clase_id": None,
                             "asignatura_id": int(fila.asignatura_id), "variable": m["variable"],
                             "valor_shap": m["shap"], "valor_real": m["valor"], "orden": orden})
        # Las reglas solo avisan de lo que el modelo no marca: si ya hay alerta del modelo,
        # estas señales aparecen como motivos dentro de ella.
        if fila.alerta_modelo:
            continue
        severidad_regla = "media"
        asist = df.at[i, "asistencia"]
        if asist < ASISTENCIA_MIN:
            alertas.append(comunes | {
                "motivo": "faltas_en_aumento", "severidad": severidad_regla,
                "titulo": f"Asistencia baja en {asig}",
                "descripcion": f"Asistencia del {asist:.0f} % en el primer periodo (mínimo recomendado {ASISTENCIA_MIN:.0f} %).",
                "variables": json.dumps([{"variable": "asistencia", "valor": f"{asist:.0f} %"}], ensure_ascii=False)})
        prac = df.at[i, "nota_practicas"]
        if prac < PRACTICAS_MIN:
            alertas.append(comunes | {
                "motivo": "practicas_por_debajo", "severidad": severidad_regla,
                "titulo": f"Prácticas por debajo del aprobado en {asig}",
                "descripcion": f"Nota de prácticas de {prac:.1f} sobre 20 en el primer periodo.",
                "variables": json.dumps([{"variable": "nota_practicas", "valor": f"{prac:.1f}"}], ensure_ascii=False)})
        part = df.at[i, "participacion"]
        if part < PARTICIPACION_MIN:
            alertas.append(comunes | {
                "motivo": "baja_participacion", "severidad": severidad_regla,
                "titulo": f"Participación baja en {asig}",
                "descripcion": f"Participación de {part:.1f} sobre 10 en el primer periodo.",
                "variables": json.dumps([{"variable": "participacion", "valor": f"{part:.1f}"}], ensure_ascii=False)})

    # ---------- alertas por clase y por asignatura ----------
    media_centro = base.groupby("escuela_id")["alerta_modelo"].mean()
    por_clase = base.groupby(["escuela_id", "clase_id", "nombre_clase", "asignatura_id", "asignatura"]) \
        .agg(n=("alumno_id", "size"), con_alerta=("alerta_modelo", "sum")).reset_index()
    por_clase["pct"] = por_clase["con_alerta"] / por_clase["n"]
    for _, c in por_clase[por_clase["n"] >= 5].iterrows():
        mc = media_centro[c.escuela_id]
        if c.pct >= CLASE_PCT_MEDIA or c.pct >= mc + MARGEN_SOBRE_CENTRO:
            alertas.append({"nivel": "clase", "escuela_id": int(c.escuela_id), "asignatura_id": int(c.asignatura_id),
                            "clase_id": int(c.clase_id), "alumno_id": None, "motivo": "grupo_por_debajo_de_la_media",
                            "severidad": "alta" if c.pct >= CLASE_PCT_ALTA else "media",
                            "titulo": f"{c.nombre_clase}: el {c.pct:.0%} podría necesitar apoyo en {c.asignatura}",
                            "descripcion": f"{int(c.con_alerta)} de {int(c.n)} alumnos con alerta; la media del centro es del {mc:.0%}.",
                            "variables": json.dumps([{"pct_clase": round(float(c.pct), 3),
                                                      "pct_centro": round(float(mc), 3)}])})
    por_asig = base.groupby(["escuela_id", "asignatura_id", "asignatura"])["alerta_modelo"].mean().reset_index()
    for _, a in por_asig.iterrows():
        mc = media_centro[a.escuela_id]
        if a.alerta_modelo >= mc + 0.05:
            alertas.append({"nivel": "asignatura", "escuela_id": int(a.escuela_id), "asignatura_id": int(a.asignatura_id),
                            "clase_id": None, "alumno_id": None, "motivo": "grupo_por_debajo_de_la_media",
                            "severidad": "alta" if a.alerta_modelo >= mc + 0.10 else "media",
                            "titulo": f"{a.asignatura}: más alumnos con alertas que la media del centro",
                            "descripcion": f"El {a.alerta_modelo:.0%} de los alumnos frente al {mc:.0%} del centro.",
                            "variables": json.dumps([{"pct_asignatura": round(float(a.alerta_modelo), 3),
                                                      "pct_centro": round(float(mc), 3)}])})

    # ---------- explicaciones y análisis por clase ----------
    comparacion = json.loads((RESULTS / "combinaciones.json").read_text(encoding="utf-8"))
    equidad = json.loads((RESULTS / "equidad_combinado.json").read_text(encoding="utf-8"))
    red_nn = json.loads((RESULTS / "red_neuronal.json").read_text(encoding="utf-8"))["regresion"]
    analisis = []
    for (cid, aid), idx in base.groupby(["clase_id", "asignatura_id"]).groups.items():
        idx = np.array(list(idx))
        imp = np.abs(sv[idx]).mean(0)
        orden = [j for j in np.argsort(-imp) if columnas[j] not in NO_EXPLICAR][:8]
        for r, j in enumerate(orden, start=1):
            expl.append({"alumno_id": None, "clase_id": int(cid), "asignatura_id": int(aid),
                         "variable": columnas[j], "valor_shap": round(float(imp[j]), 4), "valor_real": None, "orden": r})
        sub = base.loc[idx]
        apoyo = sub[sub["alerta_modelo"]].sort_values("alumno_id")
        analisis.append({"clase_id": int(cid), "asignatura_id": int(aid), "resumen": {
            "n_alumnos": int(len(sub)), "n_con_alerta": int(sub["alerta_modelo"].sum()),
            "importancia": [{"variable": columnas[j], "nombre": NOMBRES.get(columnas[j], columnas[j]),
                             "valor": round(float(imp[j]), 4)} for j in orden],
            "nota_estimada_media": None if nota[0] is None else round(float(np.mean(nota[idx])), 2),
            "alumnos_apoyo": [{"alumno_id": int(a.alumno_id), "prob_apoyo": round(float(a.prob), 3),
                               "motivos": motivos_del_modelo(sv[k], X[k], columnas, medias)}
                              for k, a in apoyo.iterrows()],
            "comparacion_modelos": comparacion, "nota_red_neuronal": red_nn, "equidad": equidad,
            "modelo_version": MODELO_VERSION}})

    pd.DataFrame(alertas).to_csv(SALIDA / "alerta.csv", index=False)
    pd.DataFrame(expl).to_csv(SALIDA / "explicacion.csv", index=False)
    with open(SALIDA / "analisis_clase.jsonl", "w", encoding="utf-8") as f:
        for a in analisis:
            f.write(json.dumps(a, ensure_ascii=False) + "\n")

    # ---------- Resumen ----------
    al = pd.DataFrame(alertas)
    print(f"\nprediccion: {len(pred)} filas | explicacion: {len(expl)} | analisis_clase: {len(analisis)}")
    print(f"alerta: {len(al)} filas")
    print(al.groupby(["nivel", "motivo", "severidad"]).size().to_string())
    print("\nEjemplos:")
    for nivel in ("asignatura", "clase", "alumno"):
        e = al[al["nivel"] == nivel].head(1)
        if len(e):
            print(f"  [{nivel}] {e.iloc[0]['titulo']} — {e.iloc[0]['descripcion']}")
    print(f"\nGuardado en {SALIDA.resolve()}")


if __name__ == "__main__":
    main()
