"""
Brújula · data/prepare_uci.py
Descarga el dataset Student Performance de la UCI (CC BY 4.0), une a los
alumnos que aparecen en Matemáticas y en Portugués y deja dos CSV limpios:

  data/processed/uci_alumnos.csv  -> un alumno por fila (school, sex, age, address)
  data/processed/uci_notas.csv    -> una fila por alumno y asignatura
                                     (variables de contexto, absences, G1, G2, G3)

Las variables excluidas por ética se usan solo para emparejar y después se
eliminan: no llegan ni a los CSV procesados ni a Supabase.

Uso:  python data/prepare_uci.py
"""
from __future__ import annotations

import io
import urllib.request
import zipfile
from pathlib import Path

import pandas as pd

URL = "https://archive.ics.uci.edu/static/public/320/student+performance.zip"

DATA_DIR = Path(__file__).resolve().parent
RAW = DATA_DIR / "raw"
OUT = DATA_DIR / "processed"
FICHEROS = ("student-mat.csv", "student-por.csv")

# Atributos con los que la propia UCI identifica a un mismo alumno en los dos CSV
CLAVES = ["school", "sex", "age", "address", "famsize", "Pstatus", "Medu",
          "Fedu", "Mjob", "Fjob", "reason", "nursery", "internet"]

# Variables sensibles o socioeconómicas: no salen de este script
EXCLUIDAS = ["Dalc", "Walc", "romantic", "famrel", "Pstatus", "guardian",
             "Mjob", "Fjob", "Medu", "Fedu"]

BINARIAS = ["schoolsup", "famsup", "paid", "activities", "nursery", "higher", "internet"]
DATOS_ALUMNO = ["school", "sex", "age", "address"]


# ----------------------------------------------------------------------
# 1. Descarga
# ----------------------------------------------------------------------
def _extraer(zip_bytes: bytes, destino: Path) -> None:
    """Saca los dos CSV del zip (la UCI mete un zip dentro de otro)."""
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
        for nombre in z.namelist():
            base = Path(nombre).name
            if base in FICHEROS:
                (destino / base).write_bytes(z.read(nombre))
            elif base.endswith(".zip"):
                _extraer(z.read(nombre), destino)


def descargar() -> None:
    RAW.mkdir(parents=True, exist_ok=True)
    if all((RAW / f).exists() for f in FICHEROS):
        print("· CSV de la UCI ya descargados")
        return
    print("· Descargando dataset de la UCI...")
    with urllib.request.urlopen(URL, timeout=60) as r:
        _extraer(r.read(), RAW)
    faltan = [f for f in FICHEROS if not (RAW / f).exists()]
    if faltan:
        raise SystemExit(f"No se encontraron en el zip: {faltan}")


# ----------------------------------------------------------------------
# 2. Emparejar alumnos de Matemáticas y Portugués
# ----------------------------------------------------------------------
def emparejar(mat: pd.DataFrame, por: pd.DataFrame) -> tuple[pd.Series, pd.Series, pd.DataFrame]:
    """
    Devuelve el alumno_uid de cada fila de mat y de por.
    Si varias filas comparten las mismas claves, se emparejan por orden de
    aparición (1.ª con 1.ª, 2.ª con 2.ª...), así nunca se duplica un alumno.
    """
    m = mat[CLAVES].copy()
    p = por[CLAVES].copy()
    m["_n"] = m.groupby(CLAVES).cumcount()
    p["_n"] = p.groupby(CLAVES).cumcount()
    m["_fila_mat"] = range(len(m))
    p["_fila_por"] = range(len(p))

    pares = p.merge(m, on=CLAVES + ["_n"], how="outer")
    pares = pares.sort_values(["_fila_por", "_fila_mat"], na_position="last").reset_index(drop=True)
    pares["alumno_uid"] = range(1, len(pares) + 1)

    uid_mat = (pares.dropna(subset=["_fila_mat"])
                    .astype({"_fila_mat": int})
                    .set_index("_fila_mat")["alumno_uid"]
                    .sort_index())
    uid_por = (pares.dropna(subset=["_fila_por"])
                    .astype({"_fila_por": int})
                    .set_index("_fila_por")["alumno_uid"]
                    .sort_index())
    return uid_mat.to_numpy(), uid_por.to_numpy(), pares


# ----------------------------------------------------------------------
# 3. Programa principal
# ----------------------------------------------------------------------
def main() -> None:
    descargar()
    mat = pd.read_csv(RAW / "student-mat.csv", sep=";")
    por = pd.read_csv(RAW / "student-por.csv", sep=";")
    print(f"· Matemáticas: {len(mat)} filas · Portugués: {len(por)} filas")

    uid_mat, uid_por, pares = emparejar(mat, por)
    mat.insert(0, "alumno_uid", uid_mat)
    por.insert(0, "alumno_uid", uid_por)
    mat.insert(1, "asignatura", "Matemáticas")
    por.insert(1, "asignatura", "Portugués")

    # Tabla de alumnos (datos de Portugués primero, que tiene más alumnos)
    alumnos = (pd.concat([por, mat])[["alumno_uid"] + DATOS_ALUMNO]
                 .drop_duplicates("alumno_uid")
                 .sort_values("alumno_uid"))
    alumnos["en_mat"] = alumnos["alumno_uid"].isin(mat["alumno_uid"])
    alumnos["en_por"] = alumnos["alumno_uid"].isin(por["alumno_uid"])

    # Tabla larga de notas y contexto: sin datos personales ni variables excluidas
    notas = pd.concat([mat, por], ignore_index=True)
    notas = notas.drop(columns=EXCLUIDAS + DATOS_ALUMNO)
    for col in BINARIAS:
        notas[col] = notas[col].map({"yes": True, "no": False})

    # Comprobaciones básicas
    for g in ("G1", "G2", "G3"):
        assert notas[g].between(0, 20).all(), f"{g} fuera de 0-20"
    assert not notas.duplicated(["alumno_uid", "asignatura"]).any(), "alumno repetido en una asignatura"
    assert notas[BINARIAS].notna().all().all(), "valor yes/no inesperado"

    OUT.mkdir(parents=True, exist_ok=True)
    alumnos.to_csv(OUT / "uci_alumnos.csv", index=False)
    notas.to_csv(OUT / "uci_notas.csv", index=False)

    ambas = int((alumnos["en_mat"] & alumnos["en_por"]).sum())
    print(f"· Alumnos únicos: {len(alumnos)}")
    print(f"  - en las dos asignaturas: {ambas}")
    print(f"  - solo Matemáticas: {int((alumnos['en_mat'] & ~alumnos['en_por']).sum())}")
    print(f"  - solo Portugués:   {int((~alumnos['en_mat'] & alumnos['en_por']).sum())}")
    print(f"· Guardado en {OUT.relative_to(DATA_DIR.parent)}/")


if __name__ == "__main__":
    main()
