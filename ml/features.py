"""Preparación de variables para los modelos de Brújula.

Decisiones (ver exploración):
- Se unen Matemáticas y Portugués en una sola tabla con la columna `asignatura`.
- Cada alumno recibe un `alumno_id`; los 382 que están en ambos ficheros comparten id,
  para validar con GroupKFold sin que un alumno esté en entrenamiento y validación a la vez.
- Alerta temprana: solo se usa lo que se sabe al final del periodo 1 (nunca G2 ni G3).
- Variables sensibles excluidas como entrada; sex, address y school solo para auditar equidad.
- G3 = 0 se trata como abandono: cuenta como "necesita apoyo" y se excluye de la regresión.
- Las faltas se transforman con log1p. El escalado se hace dentro de cada modelo, no aquí.

Uso:
    python features.py            -> genera data/processed/dataset.csv y muestra un resumen
    from features import cargar_uci, construir_variables
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import numpy as np
import pandas as pd

RAW = Path("data/raw")
PROCESSED = Path("data/processed")
# Tablas del contrato generadas por Aarón (data/prepare_uci.py + data/extend.py)
TABLAS = Path(__file__).resolve().parent.parent / "data" / "processed" / "tablas"
REALES = ["Portugués", "Matemáticas"]

# Atributos con los que la UCI identifica a un mismo alumno en ambos ficheros
CLAVES_ALUMNO = ["school", "sex", "age", "address", "famsize", "Pstatus", "Medu", "Fedu",
                 "Mjob", "Fjob", "reason", "nursery", "internet"]

# Variables que NUNCA entran al modelo
EXCLUIDAS_SENSIBLES = ["Dalc", "Walc", "romantic", "famrel", "Pstatus", "guardian",
                       "Mjob", "Fjob", "Medu", "Fedu"]
EXCLUIDAS_FUTURO = ["G2", "G3"]          # no se conocen al final del periodo 1
AUDITORIA = ["sex", "address", "school"]  # solo para medir equidad

NUMERICAS = ["G1", "failures", "studytime", "traveltime", "age"]
BINARIAS = ["schoolsup", "famsup", "paid", "activities", "higher", "internet"]
# Llegarán de la ampliación sintética de Aarón; se usan si existen
OPCIONALES = ["nota_practicas", "participacion", "asistencia"]


@dataclass
class Dataset:
    X: pd.DataFrame          # variables de entrada (sin escalar)
    y_apoyo: pd.Series       # 1 si necesita apoyo (G3 < 10, incluye abandonos)
    y_nota: pd.Series        # G3; NaN en abandonos (no se usan en regresión)
    abandono: pd.Series      # 1 si G3 == 0
    grupos: pd.Series        # alumno_id, para GroupKFold
    auditoria: pd.DataFrame  # sex, address, school
    asignatura: pd.Series


def cargar_uci(raw: Path = RAW) -> pd.DataFrame:
    """Une ambos ficheros en formato largo y asigna alumno_id."""
    mat = pd.read_csv(raw / "student-mat.csv", sep=";").assign(asignatura="Matemáticas")
    por = pd.read_csv(raw / "student-por.csv", sep=";").assign(asignatura="Portugués")
    df = pd.concat([mat, por], ignore_index=True)
    df["alumno_id"] = df.groupby(CLAVES_ALUMNO, sort=False).ngroup()
    return df


def cargar_tablas(tablas: Path = TABLAS, incluir_sinteticas: bool = False) -> pd.DataFrame:
    """Lee las tablas de Aarón y devuelve el mismo formato que cargar_uci.

    Alerta temprana: G1, faltas, prácticas, participación y asistencia son las del PERIODO 1.
    G3 (objetivo) es la nota de examen del periodo 3. alumno_id y clase_id son los de la base de datos.
    """
    alumno = pd.read_csv(tablas / "alumno.csv")
    clase = pd.read_csv(tablas / "clase.csv")
    escuela = pd.read_csv(tablas / "escuela.csv").rename(columns={"id": "escuela_id", "nombre": "school"})
    asig = pd.read_csv(tablas / "asignatura.csv").rename(columns={"id": "asignatura_id", "nombre": "asignatura"})
    rend = pd.read_csv(tablas / "rendimiento.csv")
    ctx = pd.read_csv(tablas / "contexto_alumno.csv")

    p1 = rend[rend["periodo"] == 1].rename(columns={"nota_examen": "G1", "faltas": "absences"})
    p3 = rend[rend["periodo"] == 3][["alumno_id", "asignatura_id", "nota_examen"]].rename(columns={"nota_examen": "G3"})
    df = (p1[["alumno_id", "asignatura_id", "G1", "absences", "nota_practicas", "participacion", "asistencia"]]
          .merge(p3, on=["alumno_id", "asignatura_id"])
          .merge(ctx, on=["alumno_id", "asignatura_id"])
          .merge(alumno.rename(columns={"id": "alumno_id", "edad": "age", "sexo": "sex", "zona": "address"}),
                 on="alumno_id")
          .merge(clase.rename(columns={"id": "clase_id"})[["clase_id", "escuela_id"]], on="clase_id")
          .merge(escuela, on="escuela_id")
          .merge(asig, on="asignatura_id"))
    if not incluir_sinteticas:
        df = df[df["asignatura"].isin(REALES)]
    return df.sort_values(["alumno_id", "asignatura_id"]).reset_index(drop=True)


def cargar_datos(incluir_sinteticas: bool = False) -> pd.DataFrame:
    """Usa las tablas de Aarón si existen; si no, el dataset original de la UCI."""
    if (TABLAS / "rendimiento.csv").exists():
        return cargar_tablas(incluir_sinteticas=incluir_sinteticas)
    print("Aviso: no se encuentran las tablas de Aarón; se usa el dataset original de la UCI")
    return cargar_uci()


def construir_variables(df: pd.DataFrame) -> Dataset:
    X = pd.DataFrame(index=df.index)
    for col in NUMERICAS:
        X[col] = df[col].astype(float)
    X["faltas_log"] = np.log1p(df["absences"].astype(float))
    for col in BINARIAS:
        X[col] = df[col].isin(["yes", True, "True", "true"]).astype(int)
    X["es_matematicas"] = (df["asignatura"] == "Matemáticas").astype(int)
    for col in OPCIONALES:
        if col in df.columns:
            X[col] = df[col].astype(float)

    prohibidas = set(EXCLUIDAS_SENSIBLES + EXCLUIDAS_FUTURO + AUDITORIA) & set(X.columns)
    assert not prohibidas, f"Variables prohibidas en la entrada: {prohibidas}"

    abandono = (df["G3"] == 0).astype(int)
    return Dataset(
        X=X,
        y_apoyo=(df["G3"] < 10).astype(int),
        y_nota=df["G3"].where(abandono == 0).astype(float),
        abandono=abandono,
        grupos=df["alumno_id"],
        auditoria=df[AUDITORIA].copy(),
        asignatura=df["asignatura"],
    )


if __name__ == "__main__":
    df = cargar_datos()
    ds = construir_variables(df)

    PROCESSED.mkdir(parents=True, exist_ok=True)
    salida = pd.concat([ds.X, ds.auditoria, df[["alumno_id", "asignatura", "G3"]],
                        ds.y_apoyo.rename("necesita_apoyo"), ds.abandono.rename("abandono")], axis=1)
    salida.to_csv(PROCESSED / "dataset.csv", index=False)

    print(f"Filas: {len(ds.X)} | alumnos distintos: {ds.grupos.nunique()} "
          f"| en ambas asignaturas: {(ds.grupos.value_counts() == 2).sum()}")
    print(f"Variables de entrada ({ds.X.shape[1]}): {', '.join(ds.X.columns)}")
    print(f"Necesitan apoyo: {ds.y_apoyo.mean():.1%} | abandonos: {ds.abandono.sum()} "
          f"| filas para regresión: {ds.y_nota.notna().sum()}")
    print(f"Guardado en {(PROCESSED / 'dataset.csv').resolve()}")
