
from datetime import date
from pdf_generator import generar_pdf


def generar_informe_centro():

    # Datos ficticios de demostración
    datos = {
        "centro": "Escuela GP",
        "periodo": "Periodo 1",
        "fecha": date.today().strftime("%d/%m/%Y"),

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

    generar_pdf(
        nombre_plantilla="centro.html",
        datos=datos,
        nombre_archivo="informe_centro.pdf"
    )


if __name__ == "__main__":
    generar_informe_centro()
