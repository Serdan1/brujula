
from datetime import date
from collections import defaultdict

from escala import sobre10


# =====================================================
# CONFIGURACIÓN GENERAL
# =====================================================

COLUMNAS_RESUMEN = [
    "escuela_id",
    "clase_id",
    "curso",
    "letra",
    "asignatura_id",
    "periodo",
    "n_alumnos",
    "media_examen",
    "media_asistencia",
    "alertas_activas"
]


def fecha_actual():
    return date.today().strftime("%d/%m/%Y")


def numero(valor, defecto=0):
    """
    Convierte valores numéricos recibidos de Supabase.
    """
    if valor is None:
        return defecto

    return float(valor)


def entero(valor):
    """
    Convierte contadores de Supabase a enteros.
    """
    if valor is None:
        return 0

    return int(valor)


def promedio_ponderado(pares):
    """
    Calcula una media ponderada.

    Cada elemento debe contener:
        (valor, peso)

    Ejemplo:
        [(8, 20), (6, 10)]

    Resultado:
        (8*20 + 6*10) / 30 = 7.33
    """

    validos = [
        (float(valor), int(peso))
        for valor, peso in pares
        if valor is not None
        and peso is not None
        and int(peso) > 0
    ]

    if not validos:
        return None

    suma_ponderada = sum(
        valor * peso
        for valor, peso in validos
    )

    total_pesos = sum(
        peso
        for _, peso in validos
    )

    return round(
        suma_ponderada / total_pesos,
        2
    )


def consultar_registros(cliente, periodo,
                        clase_id=None,
                        asignatura_id=None,
                        escuela_id=None):
    """
    Recupera los registros académicos desde
    la vista v_clase_resumen.
    """

    filtros = {
        "periodo": f"eq.{periodo}"
    }

    if clase_id is not None:
        filtros["clase_id"] = f"eq.{clase_id}"

    if asignatura_id is not None:
        filtros["asignatura_id"] = (
            f"eq.{asignatura_id}"
        )

    if escuela_id is not None:
        filtros["escuela_id"] = f"eq.{escuela_id}"

    return cliente.consultar_resumen(
        vista="v_clase_resumen",
        columnas=COLUMNAS_RESUMEN,
        filtros=filtros
    )


# =====================================================
# DATOS FICTICIOS PARA DEMOSTRACIÓN
# =====================================================

def obtener_datos_clase(modo="demo"):
    """
    Datos de ejemplo.
    No se utilizan en los informes reales.
    """

    if modo != "demo":
        raise NotImplementedError(
            "Utiliza obtener_datos_clase_reales "
            "para consultar Supabase."
        )

    return {
        "clase": "3º A",
        "asignatura": "Matemáticas",
        "periodo": "Periodo 1",
        "fecha": fecha_actual(),
        "fuente": "Datos ficticios de demostración",
        "total_alumnos": 25,
        "nota_media": 6.75,
        "asistencia_media": 92,
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
                "estado": "Nueva"
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
    Datos ficticios del centro.
    """

    if modo != "demo":
        raise NotImplementedError(
            "Utiliza obtener_datos_centro_reales "
            "para consultar Supabase."
        )

    return {
        "centro": "Escuela GP",
        "periodo": "Periodo 1",
        "fecha": fecha_actual(),
        "fuente": "Datos ficticios de demostración",
        "total_clases": 3,
        "total_alumnos": 75,
        "total_asignaturas": 2,
        "total_alertas": 8,
        "clases": [
            {
                "nombre": "3º A",
                "alumnos": 25,
                "nota_media": 6.75,
                "asistencia": 92,
                "alertas": 3
            },
            {
                "nombre": "3º B",
                "alumnos": 25,
                "nota_media": 7.1,
                "asistencia": 95,
                "alertas": 2
            },
            {
                "nombre": "3º C",
                "alumnos": 25,
                "nota_media": 6.4,
                "asistencia": 89,
                "alertas": 3
            }
        ],
        "equidad": None,
        "acciones": [],
        "observaciones": (
            "Informe generado con datos ficticios."
        )
    }


# =====================================================
# INFORME REAL DE CLASE
# =====================================================

def obtener_datos_clase_reales(
    cliente,
    clase_id,
    asignatura_id,
    periodo
):
    """
    Consulta el resumen académico de una clase,
    asignatura y periodo.
    """

    registros = consultar_registros(
        cliente=cliente,
        periodo=periodo,
        clase_id=clase_id,
        asignatura_id=asignatura_id
    )

    if not registros:
        raise ValueError(
            "No se encontraron datos para "
            "la clase, asignatura y periodo."
        )

    if len(registros) != 1:
        raise ValueError(
            "Se esperaba un único resumen para "
            "la clase, asignatura y periodo. "
            f"Se encontraron {len(registros)}. "
            "Revisa v_clase_resumen."
        )

    registro = registros[0]

    return {
        "clase": (
            f"{registro['curso']}º "
            f"{registro['letra']}"
        ),

        # Pendiente de consultar el nombre real
        # en la tabla de asignaturas.
        "asignatura": (
            f"Asignatura {registro['asignatura_id']}"
        ),

        "periodo": f"Periodo {periodo}",
        "fecha": fecha_actual(),

        "fuente": (
            "Supabase - v_clase_resumen"
        ),

        "total_alumnos": entero(
            registro["n_alumnos"]
        ),

        # Supabase guarda las notas sobre 20; el informe las muestra sobre 10
        "nota_media": sobre10(registro["media_examen"]),

        "asistencia_media": (
            round(float(registro["media_asistencia"]), 2)
            if registro["media_asistencia"] is not None
            else None
        ),

        "total_alertas": entero(
            registro["alertas_activas"]
        ),

        # No se inventan alertas individuales.
        "alertas": []
    }


# =====================================================
# INFORME REAL DEL CENTRO
# =====================================================

def obtener_datos_centro_reales(cliente, periodo, escuela_id=None):
    """
    Genera un resumen académico del centro.

    La fuente contiene una fila por combinación
    de clase, asignatura y periodo.

    IMPORTANTE:
    - No contiene identificadores de alumnos.
    - No contiene identificadores de alertas.
    - Las medias se ponderan por n_alumnos.
    - El número de alumnos por clase se estima
      con el máximo n_alumnos registrado.
    - Las alertas se agregan por asignatura,
      sin garantía de unicidad.
    """

    registros = consultar_registros(
        cliente=cliente,
        periodo=periodo,
        escuela_id=escuela_id
    )

    if not registros:
        raise ValueError(
            "No hay datos del centro "
            f"para el periodo {periodo}."
        )

    # -------------------------------------------------
    # VALIDAR COMBINACIONES DE CLASE Y ASIGNATURA
    # -------------------------------------------------

    combinaciones = set()

    for registro in registros:
        clave = (
            registro["clase_id"],
            registro["asignatura_id"],
            registro["periodo"]
        )

        if clave in combinaciones:
            raise ValueError(
                "Se ha detectado una combinación "
                "duplicada de clase, asignatura "
                "y periodo en v_clase_resumen: "
                f"{clave}"
            )

        combinaciones.add(clave)

    # -------------------------------------------------
    # AGRUPAR REGISTROS POR CLASE
    # -------------------------------------------------

    clases = defaultdict(
        lambda: {
            "nombre": "",
            "alumnos": 0,
            "notas": [],
            "asistencias": [],
            "alertas": 0
        }
    )

    asignaturas = set()

    for registro in registros:

        clase_id = registro["clase_id"]
        clase = clases[clase_id]

        clase["nombre"] = (
            f"{registro['curso']}º "
            f"{registro['letra']}"
        )

        asignaturas.add(
            registro["asignatura_id"]
        )

        n_alumnos = entero(
            registro["n_alumnos"]
        )

        # Estimación de alumnos por clase.
        # No sumar entre asignaturas porque
        # los estudiantes podrían repetirse.
        clase["alumnos"] = max(
            clase["alumnos"],
            n_alumnos
        )

        # Media de examen ponderada por
        # número de alumnos de la asignatura.
        if registro["media_examen"] is not None:
            clase["notas"].append(
                (
                    sobre10(registro["media_examen"]),
                    n_alumnos
                )
            )

        # Media de asistencia ponderada por
        # número de alumnos de la asignatura.
        if registro["media_asistencia"] is not None:
            clase["asistencias"].append(
                (
                    registro["media_asistencia"],
                    n_alumnos
                )
            )

        # Total de alertas por asignatura.
        # Puede haber alumnos repetidos.
        clase["alertas"] += entero(
            registro["alertas_activas"]
        )

    # -------------------------------------------------
    # CONSTRUIR RESUMEN POR CLASE
    # -------------------------------------------------

    resumen_clases = []

    for clase_id, clase in clases.items():

        resumen_clases.append({
            "clase_id": clase_id,
            "nombre": clase["nombre"],

            "alumnos": clase["alumnos"],

            "nota_media": promedio_ponderado(
                clase["notas"]
            ),

            "asistencia": promedio_ponderado(
                clase["asistencias"]
            ),

            "alertas": clase["alertas"]
        })

    resumen_clases.sort(
        key=lambda clase: clase["nombre"]
    )

    # -------------------------------------------------
    # INDICADORES GENERALES DEL CENTRO
    # -------------------------------------------------

    total_clases = len(clases)

    # Estimación basada en los máximos por clase.
    total_alumnos = sum(
        clase["alumnos"]
        for clase in resumen_clases
    )

    # Suma de alertas por clase/asignatura.
    # No equivale necesariamente a alertas únicas.
    total_alertas = sum(
        clase["alertas"]
        for clase in resumen_clases
    )

    total_asignaturas = len(asignaturas)

    # -------------------------------------------------
    # RESULTADO PARA LA PLANTILLA PDF
    # -------------------------------------------------

    return {
        # Pendiente de obtener el nombre del centro
        # desde la tabla correspondiente.
        "centro": "Centro educativo",

        "periodo": f"Periodo {periodo}",
        "fecha": fecha_actual(),

        "fuente": (
            "Supabase - v_clase_resumen"
        ),

        "total_clases": total_clases,
        "total_alumnos": total_alumnos,
        "total_asignaturas": total_asignaturas,
        "total_alertas": total_alertas,

        "clases": resumen_clases,

        # No hay datos reales de equidad
        # ni de acciones de seguimiento.
        "equidad": None,
        "acciones": [],

        "observaciones": (
            "El número de alumnos se estima "
            "a partir del máximo de estudiantes "
            "registrados por asignatura en cada "
            "clase. Las notas y asistencias son "
            "medias ponderadas por el número "
            "de alumnos de cada asignatura. "
            "Las alertas se suman por asignatura "
            "y podrían corresponder a alumnos "
            "repetidos. Estos indicadores deben "
            "validarse con los registros "
            "individuales de Supabase."
        )
    }
