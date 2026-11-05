
import os
from pathlib import Path

# Configurar las bibliotecas de WeasyPrint en Windows
if os.name == "nt":
    ruta_bibliotecas = Path(r"C:\msys64\ucrt64\bin")

    if ruta_bibliotecas.exists():
        os.environ["WEASYPRINT_DLL_DIRECTORIES"] = str(ruta_bibliotecas)

from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML


BASE_DIR = Path(__file__).resolve().parent


def generar_pdf(nombre_plantilla, datos, nombre_archivo):
    """
    Genera un informe PDF a partir de una plantilla HTML.

    nombre_plantilla: archivo HTML de Jinja2
    datos: diccionario con los datos del informe
    nombre_archivo: nombre del PDF resultante
    """

    entorno = Environment(
        loader=FileSystemLoader(BASE_DIR / "templates"),
        autoescape=True
    )

    plantilla = entorno.get_template(nombre_plantilla)

    html = plantilla.render(**datos)

    carpeta_salida = BASE_DIR / "output"
    carpeta_salida.mkdir(exist_ok=True)

    ruta_pdf = carpeta_salida / nombre_archivo

    HTML(
        string=html,
        base_url=str(BASE_DIR)
    ).write_pdf(str(ruta_pdf))

    print(f"PDF generado correctamente: {ruta_pdf}")

    return ruta_pdf
