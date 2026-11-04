
import os
from pathlib import Path

from dotenv import load_dotenv
from supabase_client import SupabaseClient


BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


def probar_conexion():
    token = os.getenv("SUPABASE_ACCESS_TOKEN")

    if not token:
        print("Falta SUPABASE_ACCESS_TOKEN en reports/.env")
        return

    cliente = SupabaseClient(access_token=token)

    if not cliente.esta_configurado():
        print("Falta configurar la URL o la clave pública.")
        return

    try:
        datos = cliente.consultar(
            "v_clase_resumen",
            {
                "select": (
                    "clase_id,curso,letra,asignatura_id,"
                    "periodo,n_alumnos,media_examen,"
                    "media_asistencia,alertas_activas"
                ),
                "limit": "5"
            }
        )

        print("Conexión con Supabase correcta.")
        print(f"Registros recibidos: {len(datos)}")

        for registro in datos:
            print(registro)

    except Exception as error:
        print(f"Error al consultar Supabase: {error}")


if __name__ == "__main__":
    probar_conexion()
