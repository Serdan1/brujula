"""Exploración del dataset Student Performance (UCI).

Uso (desde la carpeta ml/ con el entorno activado):
    python explore.py
"""
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd

RAW = Path("data/raw")
FIG = Path("results/figures")
FIG.mkdir(parents=True, exist_ok=True)

# Atributos que usa la propia UCI para identificar a los alumnos que están en ambos ficheros
CLAVES = ["school", "sex", "age", "address", "famsize", "Pstatus", "Medu", "Fedu",
          "Mjob", "Fjob", "reason", "nursery", "internet"]

datos = {
    "Matemáticas": pd.read_csv(RAW / "student-mat.csv", sep=";"),
    "Portugués": pd.read_csv(RAW / "student-por.csv", sep=";"),
}


def linea(t=""):
    print(f"\n{'=' * 70}\n{t}\n{'=' * 70}" if t else "-" * 70)


for nombre, df in datos.items():
    linea(f"{nombre}: {len(df)} alumnos")

    # 1. Desequilibrio del objetivo
    apoyo = (df["G3"] < 10).mean()
    print(f"1) Necesitan apoyo (G3 < 10): {apoyo:.1%}")

    # 2. Notas finales a cero (posibles abandonos)
    ceros = (df["G3"] == 0).sum()
    print(f"2) Alumnos con G3 = 0: {ceros} ({ceros / len(df):.1%}) "
          f"-> de ellos con G1 > 0: {((df['G3'] == 0) & (df['G1'] > 0)).sum()}")

    # 3. Faltas
    a = df["absences"]
    print(f"3) Faltas: media {a.mean():.1f}, mediana {a.median():.0f}, "
          f"máx {a.max()}, alumnos con 0 faltas: {(a == 0).mean():.1%}")

    # 4. Cuánto anticipa G1 la nota final
    print(f"4) Correlación G1-G3: {df['G1'].corr(df['G3']):.2f} | "
          f"G2-G3: {df['G2'].corr(df['G3']):.2f}")
    regla = df["G1"] < 10
    real = df["G3"] < 10
    recall = (regla & real).sum() / real.sum()
    precision = (regla & real).sum() / regla.sum()
    print(f"   Regla simple 'G1 < 10' para detectar apoyo: "
          f"recall {recall:.1%}, precisión {precision:.1%}  <- listón mínimo del modelo")

    # 5. Equidad: tasa de apoyo por grupo (variables de auditoría)
    print("5) Tasa de 'necesita apoyo' por grupo:")
    for col, etiquetas in [("sex", {"F": "chicas", "M": "chicos"}),
                           ("address", {"U": "urbana", "R": "rural"}),
                           ("school", {"GP": "Gabriel Pereira", "MS": "Mousinho da Silveira"})]:
        tasas = df.groupby(col)["G3"].apply(lambda s: (s < 10).mean())
        texto = ", ".join(f"{etiquetas.get(k, k)} {v:.1%} (n={(df[col] == k).sum()})"
                          for k, v in tasas.items())
        print(f"   - {col}: {texto}")

# 6. Alumnos que aparecen en ambos ficheros
comunes = datos["Matemáticas"].merge(datos["Portugués"], on=CLAVES, suffixes=("_mat", "_por"))
linea(f"Alumnos en ambos ficheros (según la UCI deberían ser unos 382): {len(comunes)}")

# Gráficas
fig, ejes = plt.subplots(1, 2, figsize=(11, 4))
for eje, (nombre, df) in zip(ejes, datos.items()):
    eje.scatter(df["G1"], df["G3"], alpha=0.4, s=14)
    eje.axhline(10, ls="--", lw=1)
    eje.axvline(10, ls="--", lw=1)
    eje.set(title=f"{nombre}: G1 frente a G3", xlabel="Nota periodo 1 (G1)", ylabel="Nota final (G3)")
fig.tight_layout()
fig.savefig(FIG / "g1_vs_g3.png", dpi=120)

fig, ejes = plt.subplots(1, 2, figsize=(11, 4))
for eje, (nombre, df) in zip(ejes, datos.items()):
    eje.hist(df["absences"], bins=30)
    eje.set(title=f"{nombre}: faltas", xlabel="Faltas", ylabel="Alumnos")
fig.tight_layout()
fig.savefig(FIG / "faltas.png", dpi=120)

linea()
print(f"Gráficas guardadas en {FIG.resolve()}")
