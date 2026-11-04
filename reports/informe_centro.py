
from datos_informes import obtener_datos_centro
from pdf_generator import generar_pdf


def generar_informe_centro():

    datos = obtener_datos_centro(modo="demo")

    generar_pdf(
        nombre_plantilla="centro.html",
        datos=datos,
        nombre_archivo="informe_centro.pdf"
    )


if __name__ == "__main__":
    generar_informe_centro()
