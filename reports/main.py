
from pdf_generator import generar_pdf


def generar_informe_clase():

    # Datos ficticios de demostración
    datos = {
        "clase": "3º A",
        "asignatura": "Matemáticas",
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

    generar_pdf(
        nombre_plantilla="clase.html",
        datos=datos,
        nombre_archivo="informe_clase.pdf"
    )


if __name__ == "__main__":
    generar_informe_clase()
