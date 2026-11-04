
from pathlib import Path

from datos_informes import obtener_datos_clase_reales
from pdf_generator import generar_pdf
from supabase_client import SupabaseClient


BASE_DIR = Path(__file__).resolve().parent


def generar_informe_clase():

    ruta_token = BASE_DIR / ".token"

    if not ruta_token.exists():
        raise ValueError(
            "No existe el token. Ejecuta primero "
            "python reports/obtener_token.py"
        )

    token = ruta_token.read_text(
        encoding="utf-8"
    ).strip()

    cliente = SupabaseClient(access_token=token)

    datos = obtener_datos_clase_reales(
        cliente=cliente,
        clase_id=1,
        asignatura_id=1,
        periodo=1
    )

    generar_pdf(
        nombre_plantilla="clase.html",
        datos=datos,
        nombre_archivo="informe_clase.pdf"
    )


if __name__ == "__main__":
    generar_informe_clase()
