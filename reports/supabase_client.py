
import os
from pathlib import Path

import requests
from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent

# Cargar configuración local
load_dotenv(BASE_DIR / ".env")


class SupabaseClient:

    def __init__(self, access_token=None):
        self.url = os.getenv("SUPABASE_URL", "").rstrip("/")
        self.api_key = (
            os.getenv("SUPABASE_PUBLISHABLE_KEY")
            or os.getenv("SUPABASE_ANON_KEY")
        )
        self.access_token = access_token

    def esta_configurado(self):
        return bool(self.url and self.api_key)

    def consultar(self, tabla, filtros=None):
        """
        Consulta datos de Supabase mediante su API REST.
        Requiere una sesión autenticada.
        """

        if not self.esta_configurado():
            raise ValueError(
                "Supabase no está configurado. "
                "Comprueba el archivo reports/.env."
            )

        if not self.access_token:
            raise ValueError(
                "No hay una sesión autenticada de Supabase."
            )

        headers = {
            "apikey": self.api_key,
            "Authorization": f"Bearer {self.access_token}",
        }

        parametros = {"select": "*"}

        if filtros:
            parametros.update(filtros)

        respuesta = requests.get(
            f"{self.url}/rest/v1/{tabla}",
            headers=headers,
            params=parametros,
            timeout=30
        )

        respuesta.raise_for_status()

        return respuesta.json()

    def consultar_resumen(
        self,
        vista,
        columnas,
        filtros=None
    ):
        """
        Consulta vistas agregadas de Supabase.

        vista: nombre de la vista autorizada
        columnas: columnas que necesitamos
        filtros: condiciones PostgREST
        """

        vistas_permitidas = {
            "v_clase_resumen",
            "v_asignatura_resumen"
        }

        if vista not in vistas_permitidas:
            raise ValueError(
                "La vista solicitada no está permitida."
            )

        if not columnas:
            raise ValueError(
                "Debes indicar las columnas a consultar."
            )

        parametros = {
            "select": ",".join(columnas)
        }

        if filtros:
            parametros.update(filtros)

        # Reutilizamos el método de consulta existente.
        # Su parámetro select puede sobrescribirse.
        return self.consultar(vista, parametros)
