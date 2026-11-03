"""Publica en Supabase los resultados de alerts.py (tablas prediccion, explicacion, alerta, analisis_clase).

Credenciales: archivo ml/.env (ignorado por Git) con dos líneas:
    SUPABASE_URL=https://xxxxxxxx.supabase.co
    SUPABASE_SERVICE_KEY=sb_secret_...
o variables de entorno con esos nombres (así se usará en GitHub Actions).

Uso:
    python publish.py --prueba     -> solo comprueba los archivos y la conexión, no escribe nada
    python publish.py              -> publica

Seguridad del trabajo de los profesores:
- prediccion y analisis_clase se actualizan (upsert) por su clave primaria.
- explicacion se reemplaza entera (nadie más escribe en ella).
- alerta: solo se borran las alertas en estado 'nueva' SIN acciones registradas; las revisadas,
  descartadas o con acciones se conservan, y no se vuelven a crear duplicadas.
"""
from __future__ import annotations

import argparse
import json
import math
import os
import sys
from pathlib import Path

import pandas as pd
import requests

SALIDA = Path("results/publicar")
LOTE = 500


def credenciales():
    env = Path(__file__).resolve().parent / ".env"
    if env.exists():
        crudo = env.read_bytes()
        texto = crudo.decode("utf-16") if crudo[:2] in (b"\xff\xfe", b"\xfe\xff") else crudo.decode("utf-8-sig")
        for linea in texto.splitlines():
            if "=" in linea and not linea.strip().startswith("#"):
                k, v = linea.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
    url, clave = os.environ.get("SUPABASE_URL", "").rstrip("/"), os.environ.get("SUPABASE_SERVICE_KEY", "")
    if not url.startswith("https://") or not clave:
        encontradas = [k for k in ("SUPABASE_URL", "SUPABASE_SERVICE_KEY") if os.environ.get(k)]
        sys.exit(f"Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY en ml/.env (existe el archivo: {env.exists()}; "
                 f"variables encontradas: {encontradas or 'ninguna'})")
    return url, clave


class Supabase:
    def __init__(self, url, clave):
        self.base = f"{url}/rest/v1"
        self.h = {"apikey": clave, "Content-Type": "application/json"}
        if not clave.startswith("sb_"):  # claves antiguas en formato JWT
            self.h["Authorization"] = f"Bearer {clave}"

    def _r(self, metodo, tabla, params=None, datos=None, extra=None):
        r = requests.request(metodo, f"{self.base}/{tabla}", params=params, json=datos,
                             headers=self.h | (extra or {}), timeout=60)
        if r.status_code >= 300:
            sys.exit(f"Error {r.status_code} en {metodo} {tabla}: {r.text[:500]}")
        return r

    def contar(self, tabla, params=None):
        r = self._r("GET", tabla, params=(params or {}) | {"select": "*", "limit": "1"},
                    extra={"Prefer": "count=exact", "Range": "0-0"})
        return int(r.headers.get("Content-Range", "*/0").split("/")[-1])

    def leer(self, tabla, params):
        return self._r("GET", tabla, params=params).json()

    def borrar(self, tabla, params):
        self._r("DELETE", tabla, params=params, extra={"Prefer": "return=minimal"})

    def insertar(self, tabla, filas, upsert_en=None):
        extra = {"Prefer": "return=minimal" + (",resolution=merge-duplicates" if upsert_en else "")}
        params = {"on_conflict": upsert_en} if upsert_en else None
        for i in range(0, len(filas), LOTE):
            self._r("POST", tabla, params=params, datos=filas[i:i + LOTE], extra=extra)
            print(f"    {tabla}: {min(i + LOTE, len(filas))}/{len(filas)}", end="\r")
        print()


def limpiar(v):
    if v is None or (isinstance(v, float) and math.isnan(v)):
        return None
    if hasattr(v, "item"):
        v = v.item()
    if isinstance(v, float) and v.is_integer():
        return int(v)
    return v


def filas_csv(nombre, json_cols=(), enteros=()):
    df = pd.read_csv(SALIDA / nombre)
    filas = []
    for reg in df.to_dict(orient="records"):
        f = {k: limpiar(v) for k, v in reg.items()}
        for c in json_cols:
            if isinstance(f.get(c), str):
                f[c] = json.loads(f[c])
        for c in enteros:
            if f.get(c) is not None:
                f[c] = int(f[c])
        filas.append(f)
    return filas


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--prueba", action="store_true", help="no escribe nada")
    args = ap.parse_args()

    pred = filas_csv("prediccion.csv", enteros=("alumno_id", "asignatura_id", "periodo"))
    for f in pred:  # numeric en la base de datos: no enviar enteros sin decimales como texto raro
        for c in ("prob_apoyo", "nota_final_estimada", "ic_inf", "ic_sup"):
            if f.get(c) is not None:
                f[c] = float(f[c])
    expl = filas_csv("explicacion.csv", enteros=("alumno_id", "clase_id", "asignatura_id", "orden"))
    for f in expl:
        f["valor_shap"] = float(f["valor_shap"])
        if f.get("valor_real") is not None:
            f["valor_real"] = str(f["valor_real"])
    alertas = filas_csv("alerta.csv", json_cols=("variables",),
                        enteros=("escuela_id", "asignatura_id", "clase_id", "alumno_id"))
    analisis = [json.loads(l) for l in (SALIDA / "analisis_clase.jsonl").read_text(encoding="utf-8").splitlines() if l]

    print(f"Archivos: prediccion {len(pred)} · explicacion {len(expl)} · alerta {len(alertas)} · analisis_clase {len(analisis)}")
    sb = Supabase(*credenciales())
    print("Conexión OK. Filas actuales en Supabase:",
          {t: sb.contar(t) for t in ("alumno", "prediccion", "explicacion", "alerta", "analisis_clase")})
    if args.prueba:
        print("Modo prueba: no se ha escrito nada.")
        return

    print("· prediccion (upsert)")
    sb.insertar("prediccion", pred, upsert_en="alumno_id,asignatura_id,periodo,modelo_version")

    print("· analisis_clase (upsert)")
    sb.insertar("analisis_clase", analisis, upsert_en="clase_id,asignatura_id")

    print("· explicacion (reemplazo completo)")
    sb.borrar("explicacion", {"id": "gt.0"})
    sb.insertar("explicacion", expl)

    print("· alerta (conservando el trabajo de los profesores)")
    con_accion = {a["alerta_id"] for a in sb.leer("accion", {"select": "alerta_id"})}
    nuevas = sb.leer("alerta", {"select": "id", "estado": "eq.nueva"})
    borrables = [a["id"] for a in nuevas if a["id"] not in con_accion]
    for i in range(0, len(borrables), 200):
        sb.borrar("alerta", {"id": f"in.({','.join(map(str, borrables[i:i + 200]))})"})
    clave = lambda a: (a["nivel"], a["asignatura_id"], a.get("clase_id"), a.get("alumno_id"), a["motivo"])
    existentes = {clave(a) for a in sb.leer("alerta", {"select": "nivel,asignatura_id,clase_id,alumno_id,motivo"})}
    por_crear = [a for a in alertas if clave(a) not in existentes]
    print(f"    borradas {len(borrables)} nuevas sin acciones · conservadas {len(existentes)} · a crear {len(por_crear)}")
    sb.insertar("alerta", por_crear)

    print("\nPublicado. Filas en Supabase:",
          {t: sb.contar(t) for t in ("prediccion", "explicacion", "alerta", "analisis_clase")})


if __name__ == "__main__":
    main()
