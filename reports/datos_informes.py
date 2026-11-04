
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
