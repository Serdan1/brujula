
import os
from pathlib import Path

import requests
from dotenv import load_dotenv


# =====================================================
# CONFIGURACIÓN
# =====================================================

BASE_DIR = Path(__file__).resolve().parent

# Cargar configuración local desde reports/.env
load_dotenv(BASE_DIR / ".env")


class SupabaseClient:
    """
    Cliente para consultar Supabase mediante REST API.

    Permite dos modos de autenticación:

    1. Usuario autenticado:
       Utiliza el token del usuario y una clave pública.

    2. GitHub Actions:
       Utiliza SUPABASE_SERVICE_KEY.

    Incorpora paginación para recuperar todos los
    registros accesibles de una consulta.
    """

    def __init__(self, access_token=None):

        self.url = os.getenv(
            "SUPABASE_URL", ""
        ).rstrip("/")

        self.access_token = access_token

        # Clave secreta utilizada en GitHub Actions.
        clave_servicio = os.getenv(
            "SUPABASE_SERVICE_KEY"
        )

        # Activar modo servicio únicamente cuando
        # exista una clave secreta y no haya token.
        self.modo_servicio = (
            bool(clave_servicio)
            and not access_token
        )

        if self.modo_servicio:
            self.api_key = clave_servicio

        else:
            # Modo usuario: clave pública de Supabase.
            self.api_key = (
                os.getenv("SUPABASE_PUBLISHABLE_KEY")
                or os.getenv("SUPABASE_ANON_KEY")
            )

    # =====================================================
    # VALIDAR CONFIGURACIÓN
    # =====================================================

    def esta_configurado(self):
        """
        Comprueba que existen la URL de Supabase
        y la clave necesaria para consultar datos.
        """

        return bool(
            self.url
            and self.api_key
        )

    # =====================================================
    # CONSULTA CON PAGINACIÓN
    # =====================================================

    def consultar(self, tabla, filtros=None):
        """
        Consulta datos de Supabase mediante REST API.

        Características:
        - Autenticación con token o clave de servicio.
        - Filtros compatibles con PostgREST.
        - Paginación de 500 registros.
        - Recuperación de todas las páginas.
        - Comprobación de errores HTTP.

        Devuelve una lista con los registros obtenidos.
        """

        # Comprobar configuración.
        if not self.esta_configurado():
            raise ValueError(
                "Supabase no está configurado. "
                "Comprueba SUPABASE_URL y las claves."
            )

        # Comprobar autenticación.
        if (
            not self.access_token
            and not self.modo_servicio
        ):
            raise ValueError(
                "No hay una sesión autenticada "
                "de Supabase."
            )

        # Cabeceras de autenticación.
        headers = {
            "apikey": self.api_key
        }

        if self.access_token:

            headers["Authorization"] = (
                f"Bearer {self.access_token}"
            )

        elif not self.api_key.startswith("sb_"):

            # Compatibilidad con claves antiguas JWT.
            headers["Authorization"] = (
                f"Bearer {self.api_key}"
            )

        # Parámetros iniciales.
        parametros = {
            "select": "*"
        }

        if filtros:
            parametros.update(filtros)

        # Orden estable para paginar los resúmenes
        # de clases sin depender del orden por defecto.
        if (
            tabla == "v_clase_resumen"
            and "order" not in parametros
        ):
            parametros["order"] = (
                "clase_id.asc,"
                "asignatura_id.asc,"
                "periodo.asc"
            )

        # Configuración de paginación.
        tamano_pagina = 500
        inicio = 0

        registros = []

        # Recuperar páginas hasta que no queden datos.
        while True:

            # Copiar cabeceras para cada petición.
            headers_pagina = headers.copy()

            # Rango solicitado a Supabase.
            headers_pagina["Range-Unit"] = "items"

            headers_pagina["Range"] = (
                f"{inicio}-"
                f"{inicio + tamano_pagina - 1}"
            )

            # Ejecutar petición.
            respuesta = requests.get(
                f"{self.url}/rest/v1/{tabla}",
                headers=headers_pagina,
                params=parametros,
                timeout=30
            )

            # Detectar errores HTTP.
            respuesta.raise_for_status()

            # Convertir respuesta JSON.
            pagina = respuesta.json()

            if not isinstance(pagina, list):
                raise ValueError(
                    "Supabase no devolvió "
                    "una lista de registros."
                )

            # Añadir resultados.
            registros.extend(pagina)

            # Si devuelve menos de 500 registros,
            # hemos llegado a la última página.
            if len(pagina) < tamano_pagina:
                break

            # Continuar con la siguiente página.
            inicio += tamano_pagina

        return registros

    # =====================================================
    # CONSULTAR VISTAS ACADÉMICAS
    # =====================================================

    def consultar_resumen(
        self,
        vista,
        columnas,
        filtros=None
    ):
        """
        Consulta vistas agregadas de Supabase.

        Vistas permitidas:
        - v_clase_resumen
        - v_asignatura_resumen

        Parámetros:
        vista:
            Nombre de la vista académica.

        columnas:
            Lista de columnas a recuperar.

        filtros:
            Condiciones compatibles con PostgREST.

        Devuelve todos los registros accesibles,
        utilizando la paginación de consultar().
        """

        # Evitar consultar vistas no autorizadas.
        vistas_permitidas = {
            "v_clase_resumen",
            "v_asignatura_resumen"
        }

        if vista not in vistas_permitidas:
            raise ValueError(
                "La vista solicitada "
                "no está permitida."
            )

        if not columnas:
            raise ValueError(
                "Debes indicar las columnas "
                "a consultar."
            )

        # Seleccionar únicamente las columnas
        # necesarias para el informe.
        parametros = {
            "select": ",".join(columnas)
        }

        # Aplicar filtros.
        if filtros:
            parametros.update(filtros)

        # Consultar todas las páginas.
        return self.consultar(
            vista,
            parametros
        )
