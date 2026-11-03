"""
Brújula · data/extend.py
Amplía el dataset de la UCI con datos sintéticos y genera un CSV por cada
tabla del contrato en data/processed/tablas/, listo para data/load.py.

Lo que es real (UCI):   alumnos, sexo, edad, zona, escuela, G1-G2-G3 de
                        Matemáticas y Portugués, faltas, variables de contexto.
Lo que es sintético:    clases, profesores, nombres, Inglés y Ciencias,
                        nota de prácticas, participación, reparto de faltas
                        por periodo y asistencia.

Todo usa la semilla SEMILLA: si se ejecuta dos veces, sale exactamente lo mismo.

Uso:  python data/extend.py      (antes: python data/prepare_uci.py)
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd
from faker import Faker

SEMILLA = 42
ALUMNOS_POR_CLASE = 25
SESIONES_POR_PERIODO = 40          # clases de una asignatura en un trimestre
PROFESORES_POR_ESCUELA = ["Portugués", "Matemáticas", "Inglés", "Ciencias", "Portugués"]

DATA_DIR = Path(__file__).resolve().parent
ENTRADA = DATA_DIR / "processed"
SALIDA = DATA_DIR / "processed" / "tablas"

ESCUELAS = {"GP": 1, "MS": 2}
ASIGNATURAS = {"Portugués": 1, "Matemáticas": 2, "Inglés": 3, "Ciencias": 4}
REALES = ["Portugués", "Matemáticas"]
SINTETICAS = ["Inglés", "Ciencias"]

COLS_CONTEXTO = ["famsize", "reason", "nursery", "traveltime", "studytime", "failures",
                 "schoolsup", "famsup", "paid", "activities", "higher", "internet",
                 "freetime", "goout", "health"]

rng = np.random.default_rng(SEMILLA)
fake = Faker("pt_PT")
Faker.seed(SEMILLA)


def curso_por_edad(edad: int) -> int:
    """Secundaria portuguesa: 10.º, 11.º y 12.º curso."""
    if edad <= 15:
        return 10
    if edad == 16:
        return 11
    return 12


# ----------------------------------------------------------------------
# 1. Clases y alumnos
# ----------------------------------------------------------------------
def crear_clases(alumnos: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    alumnos = alumnos.copy()
    alumnos["escuela_id"] = alumnos["school"].map(ESCUELAS)
    alumnos["curso"] = alumnos["age"].apply(curso_por_edad)

    clases, asignacion = [], {}
    clase_id = 1
    for (escuela_id, curso), grupo in alumnos.groupby(["escuela_id", "curso"], sort=True):
        uids = rng.permutation(grupo["alumno_uid"].to_numpy())
        n_clases = max(1, round(len(uids) / ALUMNOS_POR_CLASE))
        for i, trozo in enumerate(np.array_split(uids, n_clases)):
            clases.append({"id": clase_id, "escuela_id": escuela_id,
                           "curso": curso, "letra": "ABCDEFGHIJ"[i]})
            for uid in trozo:
                asignacion[uid] = clase_id
            clase_id += 1

    alumnos["clase_id"] = alumnos["alumno_uid"].map(asignacion)
    alumnos["nombre"] = [
        f"{fake.first_name_female() if s == 'F' else fake.first_name_male()} {fake.last_name()}"
        for s in alumnos["sex"]
    ]
    tabla_alumno = alumnos.rename(columns={"alumno_uid": "id", "sex": "sexo",
                                           "age": "edad", "address": "zona"})
    tabla_alumno = tabla_alumno[["id", "clase_id", "nombre", "sexo", "edad", "zona"]]
    return pd.DataFrame(clases), tabla_alumno


# ----------------------------------------------------------------------
# 2. Profesores e «imparte»
# ----------------------------------------------------------------------
def crear_profesores(clases: pd.DataFrame, notas: pd.DataFrame,
                     alumno: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    profesores, imparte = [], []
    pid = 1
    # Qué asignaturas tiene cada clase (Inglés y Ciencias las tienen todas)
    reales = notas.merge(alumno[["id", "clase_id"]], left_on="alumno_uid", right_on="id")
    asig_por_clase = reales.groupby("clase_id")["asignatura"].apply(set).to_dict()

    for escuela, escuela_id in ESCUELAS.items():
        de_la_escuela = []
        for asig in PROFESORES_POR_ESCUELA:
            profesores.append({"id": pid, "user_id": None, "nombre": fake.name(),
                               "escuela_id": escuela_id, "rol": "profesor"})
            de_la_escuela.append((pid, asig))
            pid += 1

        clases_esc = clases[clases["escuela_id"] == escuela_id].sort_values("id")
        for asig, asig_id in ASIGNATURAS.items():
            profes = [p for p, a in de_la_escuela if a == asig]
            for i, cid in enumerate(clases_esc["id"]):
                if asig in REALES and asig not in asig_por_clase.get(cid, set()):
                    continue   # nadie de esa clase cursa esa asignatura en la UCI
                imparte.append({"profesor_id": profes[i % len(profes)],
                                "asignatura_id": asig_id, "clase_id": cid})

        profesores.append({"id": pid, "user_id": None, "nombre": fake.name(),
                           "escuela_id": escuela_id, "rol": "director"})
        pid += 1

    return pd.DataFrame(profesores), pd.DataFrame(imparte)


# ----------------------------------------------------------------------
# 3. Notas sintéticas de Inglés y Ciencias
# ----------------------------------------------------------------------
def crear_sinteticas(notas: pd.DataFrame) -> pd.DataFrame:
    """Una fila por alumno y asignatura sintética, con la misma forma que notas."""
    base = notas.groupby("alumno_uid").agg(
        G1=("G1", "mean"), G2=("G2", "mean"), G3=("G3", "mean"),
        absences=("absences", "mean"))
    # Contexto: el de Portugués si existe, si no el de Matemáticas
    contexto = (notas.sort_values("asignatura", ascending=False)   # Portugués antes
                     .drop_duplicates("alumno_uid")
                     .set_index("alumno_uid")[COLS_CONTEXTO])

    filas = []
    for asig in SINTETICAS:
        efecto = rng.normal(0, 1.5, len(base))          # facilidad del alumno en esa asignatura
        df = contexto.copy()
        df["paid"] = False                              # no hay clases particulares inventadas
        df["asignatura"] = asig
        for g in ("G1", "G2", "G3"):
            nota = base[g].to_numpy() + efecto + rng.normal(0, 1.0, len(base))
            df[g] = np.clip(np.round(nota), 0, 20).astype(int)
        df["absences"] = np.round(base["absences"].to_numpy() * rng.uniform(0.6, 1.4, len(base))).astype(int)
        filas.append(df.reset_index())
    return pd.concat(filas, ignore_index=True)


# ----------------------------------------------------------------------
# 4. Rendimiento por periodo y contexto
# ----------------------------------------------------------------------
def crear_rendimiento(todas: pd.DataFrame) -> pd.DataFrame:
    filas = []
    for fila in todas.itertuples(index=False):
        # Las faltas del curso se reparten entre los 3 periodos al azar
        reparto = rng.multinomial(int(fila.absences), rng.dirichlet([2, 2, 2]))
        for periodo, (g, faltas) in enumerate(zip((fila.G1, fila.G2, fila.G3), reparto), start=1):
            practicas = 0.7 * g + 3.5 + 0.8 * (fila.studytime - 2) - 0.08 * faltas + rng.normal(0, 1.5)
            particip = 0.35 * g + 1.0 + 0.4 * (fila.studytime - 2) - 0.05 * faltas + rng.normal(0, 1.0)
            asistencia = 100 * (1 - faltas / SESIONES_POR_PERIODO)
            filas.append({
                "alumno_id": fila.alumno_uid,
                "asignatura_id": ASIGNATURAS[fila.asignatura],
                "periodo": periodo,
                "nota_examen": int(g),
                "nota_practicas": round(float(np.clip(practicas, 0, 20)), 1),
                "participacion": round(float(np.clip(particip, 0, 10)), 1),
                "asistencia": round(float(np.clip(asistencia, 0, 100)), 1),
                "faltas": int(faltas),
            })
    return pd.DataFrame(filas)


def crear_contexto(todas: pd.DataFrame) -> pd.DataFrame:
    ctx = todas[["alumno_uid", "asignatura"] + COLS_CONTEXTO].copy()
    ctx.insert(1, "asignatura_id", ctx.pop("asignatura").map(ASIGNATURAS))
    return ctx.rename(columns={"alumno_uid": "alumno_id"})


# ----------------------------------------------------------------------
# 5. Programa principal
# ----------------------------------------------------------------------
def main() -> None:
    alumnos_uci = pd.read_csv(ENTRADA / "uci_alumnos.csv")
    notas = pd.read_csv(ENTRADA / "uci_notas.csv")

    clase, alumno = crear_clases(alumnos_uci)
    profesor, imparte = crear_profesores(clase, notas, alumno)
    todas = pd.concat([notas, crear_sinteticas(notas)], ignore_index=True)
    rendimiento = crear_rendimiento(todas)
    contexto = crear_contexto(todas)

    tablas = {
        "escuela": pd.DataFrame([{"id": v, "nombre": k} for k, v in ESCUELAS.items()]),
        "asignatura": pd.DataFrame([{"id": v, "nombre": k} for k, v in ASIGNATURAS.items()]),
        "clase": clase,
        "profesor": profesor,
        "imparte": imparte,
        "alumno": alumno,
        "rendimiento": rendimiento,
        "contexto_alumno": contexto,
    }

    # Comprobaciones de coherencia con el contrato
    assert alumno["clase_id"].notna().all(), "alumno sin clase"
    assert not imparte.duplicated(["asignatura_id", "clase_id"]).any(), "clase con dos profesores en una asignatura"
    assert rendimiento["nota_practicas"].between(0, 20).all()
    assert rendimiento["participacion"].between(0, 10).all()
    assert rendimiento["asistencia"].between(0, 100).all()
    assert not rendimiento.duplicated(["alumno_id", "asignatura_id", "periodo"]).any()

    SALIDA.mkdir(parents=True, exist_ok=True)
    for nombre, df in tablas.items():
        df.to_csv(SALIDA / f"{nombre}.csv", index=False)
        print(f"· {nombre:<16} {len(df):>6} filas")

    tam = alumno.groupby("clase_id").size()
    print(f"· Alumnos por clase: mínimo {tam.min()}, media {tam.mean():.1f}, máximo {tam.max()}")
    print(f"· Guardado en {SALIDA.relative_to(DATA_DIR.parent)}/")


if __name__ == "__main__":
    main()
