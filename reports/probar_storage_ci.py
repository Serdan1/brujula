
import os
from pathlib import Path

from weasyprint import HTML

from subir_informes import subir_informe


BASE_DIR = Path(__file__).resolve().parent


def main():
    if os.getenv("CONFIRMAR_PRUEBA_STORAGE") != "true":
        raise RuntimeError(
            "La prueba de Storage no está autorizada."
        )

    carpeta = BASE_DIR / "output"
    carpeta.mkdir(parents=True, exist_ok=True)

    ruta_pdf = carpeta / "prueba_storage_ci.pdf"

    html = """
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <title>Prueba de Supabase Storage</title>
    </head>
    <body>
        <h1>Brújula - Prueba de Storage</h1>
        <p>Documento ficticio de prueba.</p>
        <p>Generado desde GitHub Actions.</p>
        <p>No contiene datos académicos reales.</p>
    </body>
    </html>
    """

    HTML(string=html).write_pdf(str(ruta_pdf))

    print("PDF de prueba generado correctamente.")

    destino = "clases/pruebas-ci/prueba_storage_ci.pdf"

    subir_informe(
        ruta_pdf=ruta_pdf,
        ruta_storage=destino
    )

    print("Prueba de subida completada.")


if __name__ == "__main__":
    main()
