import os
from pathlib import Path

# Configuración de las bibliotecas nativas de WeasyPrint en Windows
if os.name == "nt":
    ruta_bibliotecas = Path(r"C:\msys64\ucrt64\bin")

    if ruta_bibliotecas.exists():
        os.environ["WEASYPRINT_DLL_DIRECTORIES"] = str(ruta_bibliotecas)

from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML


BASE_DIR = Path(__file__).resolve().parent

def generar_informe_clase():

    # Datos ficticios para comprobar el funcionamiento
    datos = {
        "clase": "3º A",
        "asignatura": "Matemáticas",
        "total_alumnos": 25,
        "total_alertas": 3,
        "alertas": [
            {
                "motivo": "Bajada de notas",
                "severidad": "Alta",
                "estado": "Nueva"
            },
            {
                "motivo": "Baja participación",
                "severidad": "Media",
                "estado": "Revisada"
            },
            {
                "motivo": "Faltas en aumento",
                "severidad": "Media",
                "estado": "Nueva"
            }
        ]
    }

    # Cargar la plantilla HTML
    entorno = Environment(
        loader=FileSystemLoader(BASE_DIR / "templates"),
        autoescape=True
    )

    plantilla = entorno.get_template("clase.html")

    # Sustituir las variables de la plantilla
    html = plantilla.render(**datos)

    # Crear la carpeta de salida
    salida = BASE_DIR / "output"
    salida.mkdir(exist_ok=True)

    # Convertir HTML a PDF
    ruta_pdf = salida / "informe_clase.pdf"

    HTML(string=html, base_url=str(BASE_DIR)).write_pdf(
        str(ruta_pdf)
    )

    print(f"PDF generado correctamente: {ruta_pdf}")


if __name__ == "__main__":
    generar_informe_clase()
