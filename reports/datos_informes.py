
from datetime import date


def obtener_datos_clase(modo="demo"):
    """
    Prepara los datos del informe de clase.
    """

    if modo != "demo":
        raise NotImplementedError(
            "La integración con Supabase todavía no está implementada."
        )

    return {
        "clase": "3º A",
        "asignatura": "Matemáticas",
        "periodo": "Periodo 1",
        "fecha": date.today().strftime("%d/%m/%Y"),
        "fuente": "Datos ficticios de demostración",

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


def obtener_datos_centro(modo="demo"):
    """
    Prepara los datos del informe de centro.
    """

    if modo != "demo":
        raise NotImplementedError(
            "La integración con Supabase todavía no está implementada."
        )

    return {
        "centro": "Escuela GP",
        "periodo": "Periodo 1",
        "fecha": date.today().strftime("%d/%m/%Y"),
        "fuente": "Datos ficticios de demostración",

        "total_clases": 3,
        "total_alumnos": 75,
        "total_asignaturas": 2,
        "total_alertas": 8,

        "clases": [
            {
                "nombre": "3º A",
                "alumnos": 25,
                "nota_media": 13.5,
                "asistencia": 92,
                "alertas": 3
            },
            {
                "nombre": "3º B",
                "alumnos": 25,
                "nota_media": 14.2,
                "asistencia": 95,
                "alertas": 2
            },
            {
                "nombre": "3º C",
                "alumnos": 25,
                "nota_media": 12.8,
                "asistencia": 89,
                "alertas": 3
            }
        ],

        "equidad": (
            "No hay métricas de equidad disponibles "
            "para este informe de demostración."
        ),

        "acciones": [
            {"tipo": "Tutoría individual", "cantidad": 4},
            {"tipo": "Refuerzo académico", "cantidad": 3},
            {"tipo": "Seguimiento de asistencia", "cantidad": 1}
        ]
    }

def obtener_datos_clase_reales(
    cliente,
    clase_id,
    asignatura_id,
    periodo
):
    """
    Consulta el resumen académico real de una clase.
    """

    registros = cliente.consultar_resumen(
        vista="v_clase_resumen",
        columnas=[
            "clase_id",
            "curso",
            "letra",
            "asignatura_id",
            "periodo",
            "n_alumnos",
            "media_examen",
            "media_asistencia",
            "alertas_activas"
        ],
        filtros={
            "clase_id": f"eq.{clase_id}",
            "asignatura_id": f"eq.{asignatura_id}",
            "periodo": f"eq.{periodo}"
        }
    )

    if not registros:
        raise ValueError(
            "No se encontraron datos accesibles "
            "para la clase, asignatura y periodo."
        )

    registro = registros[0]

    return {
        "clase": (
            f"{registro['curso']}º "
            f"{registro['letra']}"
        ),
        "asignatura": (
            f"Asignatura {registro['asignatura_id']}"
        ),
        "periodo": f"Periodo {registro['periodo']}",
        "fecha": date.today().strftime("%d/%m/%Y"),
        "fuente": "Supabase - datos académicos reales",

        "total_alumnos": registro["n_alumnos"],
        "nota_media": registro["media_examen"],
        "asistencia_media": registro["media_asistencia"],
        "total_alertas": registro["alertas_activas"],

        # Todavía no hemos consultado el detalle
        # de las alertas individuales.
        "alertas": []
    }

def obtener_datos_centro_reales(cliente, periodo):
    """
    Construye un resumen del centro a partir
    de la vista v_clase_resumen de Supabase.

    Cada registro representa una combinación
    de clase, asignatura y periodo.
    """

    registros = cliente.consultar_resumen(
        vista="v_clase_resumen",
        columnas=[
            "clase_id",
            "curso",
            "letra",
            "asignatura_id",
            "periodo",
            "n_alumnos",
            "media_examen",
            "media_asistencia",
            "alertas_activas"
        ],
        filtros={
            "periodo": f"eq.{periodo}"
        }
    )

    if not registros:
        raise ValueError(
            "No hay datos del centro para el periodo indicado."
        )

    clases = {}

    for registro in registros:
        clase_id = registro["clase_id"]

        if clase_id not in clases:
            clases[clase_id] = {
                "nombre": (
                    f"{registro['curso']}º "
                    f"{registro['letra']}"
                ),
                "alumnos": 0,
                "notas": [],
                "asistencias": [],
                "alertas": 0
            }

        clase = clases[clase_id]

        clase["alumnos"] = max(
            clase["alumnos"],
            registro["n_alumnos"] or 0
        )

        if registro["media_examen"] is not None:
            clase["notas"].append(
                float(registro["media_examen"])
            )

        if registro["media_asistencia"] is not None:
            clase["asistencias"].append(
                float(registro["media_asistencia"])
            )

        clase["alertas"] += (
            registro["alertas_activas"] or 0
        )

    def promedio(valores):
        if not valores:
            return None
        return round(sum(valores) / len(valores), 2)

    resumen_clases = []

    for clase in clases.values():
        resumen_clases.append({
            "nombre": clase["nombre"],
            "alumnos": clase["alumnos"],
            "nota_media": promedio(clase["notas"]),
            "asistencia": promedio(
                clase["asistencias"]
            ),
            "alertas": clase["alertas"]
        })

    resumen_clases.sort(key=lambda c: c["nombre"])

    total_alumnos = sum(
        clase["alumnos"]
        for clase in resumen_clases
    )

    total_alertas = sum(
        clase["alertas"]
        for clase in resumen_clases
    )

    asignaturas = {
        registro["asignatura_id"]
        for registro in registros
    }

    return {
        "centro": "Centro educativo",
        "periodo": f"Periodo {periodo}",
        "fecha": date.today().strftime("%d/%m/%Y"),
        "fuente": "Supabase - v_clase_resumen",
        "total_clases": len(clases),
        "total_alumnos": total_alumnos,
        "total_asignaturas": len(asignaturas),
        "total_alertas": total_alertas,
        "clases": resumen_clases,
        "equidad": (
            "No hay métricas de equidad disponibles "
            "en esta fuente de datos."
        ),
        "acciones": [],
        "observaciones": (
            "Las notas y asistencias son promedios "
            "de los resúmenes por asignatura. "
            "Las alertas son la suma de los "
            "registros disponibles y podrían "
            "repetirse entre asignaturas."
        )
    }
