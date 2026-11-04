
import os
from pathlib import Path

import requests
from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent

load_dotenv(BASE_DIR / ".env")


def subir_informe(ruta_pdf, ruta_storage):
    """
    Sube un informe PDF al bucket privado 'informes'
    de Supabase Storage.

    Si el archivo ya existe, lo actualiza.
    """

    url_supabase = os.getenv("SUPABASE_URL", "").rstrip("/")
    clave_servicio = os.getenv("SUPABASE_SERVICE_KEY", "")

    if not url_supabase or not clave_servicio:
        raise ValueError(
            "Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY. "
            "La subida requiere credenciales de servicio."
        )

    ruta_pdf = Path(ruta_pdf)

    if not ruta_pdf.is_file():
        raise FileNotFoundError(
            f"No existe el archivo PDF: {ruta_pdf}"
        )

    ruta_storage = ruta_storage.lstrip("/")

    if not ruta_storage.startswith("clases/"):
        raise ValueError(
            "Los informes deben guardarse dentro de clases/"
        )

    endpoint = (
        f"{url_supabase}/storage/v1/object/"
        f"informes/{ruta_storage}"
    )

    headers = {
    "apikey": clave_servicio,
    "Content-Type": "application/pdf",
    "x-upsert": "true",
    "Cache-Control": "no-cache"
}

# Las claves antiguas service_role son JWT.
# Las claves modernas sb_secret_ se envían como apikey.
    if not clave_servicio.startswith("sb_secret_"):
        headers["Authorization"] = f"Bearer {clave_servicio}"

        with ruta_pdf.open("rb") as archivo:
            respuesta = requests.post(
            endpoint,
            headers=headers,
            data=archivo,
            timeout=60
        )

    if not respuesta.ok:
        raise RuntimeError(
            f"Error al subir {ruta_pdf.name}: "
            f"{respuesta.status_code} - "
            f"{respuesta.text[:500]}"
        )

    print(
        f"PDF subido correctamente: "
        f"informes/{ruta_storage}"
    )

    return ruta_storage


if __name__ == "__main__":
    print(
        "Módulo de subida preparado. "
        "Debe llamarse desde el generador de informes."
    )
