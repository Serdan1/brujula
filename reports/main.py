
from datos_informes import obtener_datos_clase
from pdf_generator import generar_pdf


def generar_informe_clase():

    datos = obtener_datos_clase(modo="demo")

    generar_pdf(
        nombre_plantilla="clase.html",
        datos=datos,
        nombre_archivo="informe_clase.pdf"
    )


if __name__ == "__main__":
    generar_informe_clase()
