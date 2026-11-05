
import argparse
import os
from pathlib import Path

from datos_informes import (
    obtener_datos_clase_reales,
    obtener_datos_centro_reales
)
from datos_modelo import enriquecer_informe_centro, enriquecer_informe_clase, escuelas
from pdf_generator import generar_pdf
from supabase_client import SupabaseClient
from subir_informes import subir_informe


BASE_DIR = Path(__file__).resolve().parent


def crear_cliente():
    if os.getenv("SUPABASE_SERVICE_KEY"):
        return SupabaseClient()

    ruta_token = BASE_DIR / ".token"

    if not ruta_token.exists():
        raise ValueError(
            "No existe el token. Ejecuta primero "
            "python reports/obtener_token.py"
        )

    token = ruta_token.read_text(
        encoding="utf-8"
    ).strip()

    return SupabaseClient(access_token=token)


def clases_disponibles(cliente, periodo):
    registros = cliente.consultar_resumen(
        vista="v_clase_resumen",
        columnas=[
            "clase_id",
            "asignatura_id",
            "periodo"
        ],
        filtros={
            "periodo": f"eq.{periodo}"
        }
    )

    return sorted({
        (r["clase_id"], r["asignatura_id"])
        for r in registros
    })


def publicar_si_corresponde(ruta_pdf, ruta_storage):
    if os.getenv("PUBLICAR_INFORMES") == "true":
        subir_informe(
            ruta_pdf=ruta_pdf,
            ruta_storage=ruta_storage
        )


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

    # Alertas individuales, nombre de la asignatura y resultados del modelo
    datos = enriquecer_informe_clase(cliente, datos, clase_id, asignatura_id)

    nombre_archivo = (
        f"informe_clase_{clase_id}_"
        f"{asignatura_id}_p{periodo}.pdf"
    )

    ruta_pdf = generar_pdf(
        nombre_plantilla="clase.html",
        datos=datos,
        nombre_archivo=nombre_archivo
    )

    ruta_storage = (
        f"clases/{clase_id}/"
        f"asignatura_{asignatura_id}/"
        f"periodo_{periodo}.pdf"
    )

    publicar_si_corresponde(
        ruta_pdf,
        ruta_storage
    )

    return ruta_pdf


def generar_informe_centro(cliente, periodo):
    """Un informe por escuela: cada director ve solo su centro."""
    rutas = []
    for escuela in escuelas(cliente):
        rutas.append(generar_informe_escuela(cliente, periodo, escuela["id"], escuela["nombre"]))
    return rutas


def generar_informe_escuela(cliente, periodo, escuela_id, nombre_escuela):
    datos = obtener_datos_centro_reales(
        cliente=cliente,
        periodo=periodo,
        escuela_id=escuela_id
    )

    datos = enriquecer_informe_centro(cliente, datos, escuela_id, nombre_escuela)

    nombre_archivo = (
        f"informe_centro_{escuela_id}_p{periodo}.pdf"
    )

    ruta_pdf = generar_pdf(
        nombre_plantilla="centro.html",
        datos=datos,
        nombre_archivo=nombre_archivo
    )

    ruta_storage = (
        f"centros/{escuela_id}/periodo_{periodo}.pdf"
    )

    publicar_si_corresponde(
        ruta_pdf,
        ruta_storage
    )

    return ruta_pdf


def main():
    parser = argparse.ArgumentParser(
        description="Generar informes Brújula"
    )

    parser.add_argument("--clase", type=int)
    parser.add_argument("--asignatura", type=int)
    parser.add_argument("--periodo", type=int, default=1)

    parser.add_argument(
        "--solo-centro",
        action="store_true",
        help="Generar únicamente el informe del centro"
    )

    args = parser.parse_args()

    cliente = crear_cliente()

    if args.solo_centro:
        generar_informe_centro(
            cliente,
            args.periodo
        )
        return

    if (args.clase is None) != (args.asignatura is None):
        parser.error(
            "--clase y --asignatura deben "
            "indicarse juntos"
        )

    if args.clase is not None:
        pares = [
            (args.clase, args.asignatura)
        ]
    else:
        pares = clases_disponibles(
            cliente,
            args.periodo
        )

    print(
        f"Generando {len(pares)} "
        "informes de clase..."
    )

    for clase_id, asignatura_id in pares:
        generar_informe_clase(
            cliente,
            clase_id,
            asignatura_id,
            args.periodo
        )

    # El informe general se genera solamente
    # en las ejecuciones completas.
    if args.clase is None:
        print("Generando informe del centro...")

        generar_informe_centro(
            cliente,
            args.periodo
        )

    print("Generación de informes finalizada.")


if __name__ == "__main__":
    main()
