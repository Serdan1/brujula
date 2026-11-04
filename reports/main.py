
import argparse
import os
from pathlib import Path

from datos_informes import obtener_datos_clase_reales
from pdf_generator import generar_pdf
from supabase_client import SupabaseClient
from subir_informes import subir_informe


BASE_DIR = Path(__file__).resolve().parent


def crear_cliente():
    """
    En GitHub Actions usa SUPABASE_SERVICE_KEY (sin iniciar sesión).
    En local, si no está esa variable, usa el token de reports/.token.
    """

    if os.getenv("SUPABASE_SERVICE_KEY"):
        return SupabaseClient()

    ruta_token = BASE_DIR / ".token"

    if not ruta_token.exists():
        raise ValueError(
            "No existe el token. Ejecuta primero "
            "python reports/obtener_token.py"
        )

    token = ruta_token.read_text(encoding="utf-8").strip()

    return SupabaseClient(access_token=token)


def clases_disponibles(cliente, periodo):
    registros = cliente.consultar_resumen(
        vista="v_clase_resumen",
        columnas=["clase_id", "asignatura_id", "periodo"],
        filtros={"periodo": f"eq.{periodo}"}
    )

    return sorted({(r["clase_id"], r["asignatura_id"]) for r in registros})



def generar_informe_clase(
    cliente,
    clase_id,
    asignatura_id,
    periodo
):
    datos = obtener_datos_clase_reales(
        cliente=cliente,
        clase_id=clase_id,
        asignatura_id=asignatura_id,
        periodo=periodo
    )

    nombre_archivo = (
        f"informe_clase_{clase_id}_"
        f"{asignatura_id}_p{periodo}.pdf"
    )

    ruta_pdf = generar_pdf(
        nombre_plantilla="clase.html",
        datos=datos,
        nombre_archivo=nombre_archivo
    )

    # Solo publicar cuando se habilite expresamente.
    if os.getenv("PUBLICAR_INFORMES") == "true":
        ruta_storage = (
            f"clases/{clase_id}/"
            f"asignatura_{asignatura_id}/"
            f"periodo_{periodo}.pdf"
        )

        subir_informe(
            ruta_pdf=ruta_pdf,
            ruta_storage=ruta_storage
        )

    return ruta_pdf

def main():
    parser = argparse.ArgumentParser(description="Genera los informes de clase en PDF")
    parser.add_argument("--clase", type=int, help="Solo esta clase (para probar en local)")
    parser.add_argument("--asignatura", type=int, help="Solo esta asignatura")
    parser.add_argument("--periodo", type=int, default=1)
    args = parser.parse_args()

    cliente = crear_cliente()

    if args.clase and args.asignatura:
        pares = [(args.clase, args.asignatura)]
    else:
        pares = clases_disponibles(cliente, args.periodo)

    print(f"Generando {len(pares)} informes de clase...")

    for clase_id, asignatura_id in pares:
        generar_informe_clase(cliente, clase_id, asignatura_id, args.periodo)


if __name__ == "__main__":
    main()
