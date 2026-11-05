"""
Datos del modelo para los informes PDF: alertas individuales, avisos de grupo,
importancia de variables, nota estimada, equidad y acciones.

Reglas éticas (igual que en la web):
- Nunca se muestra prob_apoyo ni una puntuación individual.
- Las alertas se ordenan por prioridad y motivo, nunca por probabilidad ni por nota.
- Las variables sintéticas se marcan con un asterisco.
"""

from collections import Counter, defaultdict

from escala import sobre10, texto_sobre10, valor_nota

MOTIVOS = {
    "riesgo_de_suspenso": "Podría necesitar apoyo",
    "faltas_en_aumento": "Asistencia baja",
    "practicas_por_debajo": "Prácticas por debajo del aprobado",
    "baja_participacion": "Participación baja",
    "bajada_de_notas": "Bajada de notas",
    "grupo_por_debajo_de_la_media": "Grupo por encima de la media de alertas",
}

# Nombres para las alertas de reglas, que no traen "nombre" en variables
NOMBRES_VARIABLES = {
    "asistencia": "Asistencia",
    "nota_practicas": "Nota de prácticas",
    "participacion": "Participación en clase",
}

SINTETICAS = {"nota_practicas", "participacion", "asistencia"}

GRUPOS_EQUIDAD = {
    "sex=F": "Chicas", "sex=M": "Chicos",
    "address=R": "Zona rural", "address=U": "Zona urbana",
    "school=GP": "Escuela GP", "school=MS": "Escuela MS",
}

TIPOS_ACCION = {
    "tutoría": "Tutoría con el alumno",
    "reunión_familia": "Reunión con la familia",
    "refuerzo": "Material de refuerzo",
    "seguimiento": "Seguimiento en clase",
}

ORDEN_SEVERIDAD = {"alta": 0, "media": 1}

NOMBRES_ESCUELA = {
    "GP": "Escola Secundária Gabriel Pereira",
    "MS": "Escola Secundária Mousinho da Silveira",
}


def _uno(registros):
    return registros[0] if registros else None


def nombre_asignatura(cliente, asignatura_id):
    fila = _uno(cliente.consultar("asignatura", {"select": "nombre", "id": f"eq.{asignatura_id}"}))
    return fila["nombre"] if fila else f"Asignatura {asignatura_id}"


def escuelas(cliente):
    return sorted(cliente.consultar("escuela", {"select": "id,nombre"}), key=lambda e: e["id"])


def _motivos(alerta):
    salida = []
    for v in alerta.get("variables") or []:
        if not isinstance(v, dict) or not v.get("variable"):
            continue
        nombre = v.get("nombre") or NOMBRES_VARIABLES.get(v["variable"], v["variable"])
        marca = "*" if v["variable"] in SINTETICAS else ""
        salida.append(f"{nombre}{marca}: {valor_nota(v['variable'], v.get('valor', ''))}")
    return salida


def alertas_de_clase(cliente, clase_id, asignatura_id):
    """Alertas de alumnos y avisos de grupo de una clase y asignatura (sin las descartadas)."""
    filas = cliente.consultar("alerta", {
        "select": "nivel,motivo,severidad,estado,titulo,descripcion,variables,alumno(nombre)",
        "clase_id": f"eq.{clase_id}",
        "asignatura_id": f"eq.{asignatura_id}",
        "estado": "neq.descartada",
    })

    alumnos, grupo = [], []
    for a in filas:
        if a["nivel"] == "alumno":
            motivos = _motivos(a)
            alumnos.append({
                "alumno": (a.get("alumno") or {}).get("nombre", ""),
                "prioridad": "Alta" if a["severidad"] == "alta" else "Media",
                "alta": a["severidad"] == "alta",
                "motivo": MOTIVOS.get(a["motivo"], a["motivo"]),
                "detalle": motivos if motivos else [texto_sobre10(a.get("descripcion")) or ""],
                "estado": {"nueva": "Pendiente", "revisada": "Revisada"}.get(a["estado"], a["estado"]),
                "_orden": (ORDEN_SEVERIDAD.get(a["severidad"], 9), a["motivo"],
                           (a.get("alumno") or {}).get("nombre", "")),
            })
        else:
            grupo.append({"titulo": a["titulo"], "descripcion": texto_sobre10(a.get("descripcion")) or ""})

    alumnos.sort(key=lambda x: x["_orden"])
    for a in alumnos:
        del a["_orden"]
    return alumnos, grupo


def analisis_de_clase(cliente, clase_id, asignatura_id, max_variables=6):
    fila = _uno(cliente.consultar("analisis_clase", {
        "select": "resumen", "clase_id": f"eq.{clase_id}", "asignatura_id": f"eq.{asignatura_id}",
    }))
    if not fila:
        return {"analisis_disponible": False}

    r = fila["resumen"] or {}
    importancia = r.get("importancia") or []
    maximo = max((float(v.get("valor", 0)) for v in importancia), default=0) or 1
    red = r.get("nota_red_neuronal") or {}

    return {
        "analisis_disponible": True,
        "n_con_alerta_modelo": r.get("n_con_alerta"),
        "nota_estimada_media": sobre10(r.get("nota_estimada_media"), 1),
        "error_nota": sobre10(red.get("mae", 1.05)),
        "importancia": [{
            "nombre": v.get("nombre", v.get("variable")) + ("*" if v.get("variable") in SINTETICAS else ""),
            "porcentaje_barra": round(100 * float(v.get("valor", 0)) / maximo),
        } for v in importancia[:max_variables]],
    }


def enriquecer_informe_clase(cliente, datos, clase_id, asignatura_id):
    """Añade al diccionario de la plantilla de clase los datos del modelo."""
    alumnos, grupo = alertas_de_clase(cliente, clase_id, asignatura_id)
    datos["asignatura"] = nombre_asignatura(cliente, asignatura_id)
    datos["alertas"] = alumnos
    datos["avisos_grupo"] = grupo
    datos["alumnos_con_alerta"] = len({a["alumno"] for a in alumnos})
    datos.update(analisis_de_clase(cliente, clase_id, asignatura_id))
    return datos


def equidad_del_modelo(cliente):
    """Equidad global del modelo (igual en todas las clases): se lee de un análisis cualquiera."""
    fila = _uno(cliente.consultar("analisis_clase", {"select": "resumen", "limit": "1"}))
    eq = ((fila or {}).get("resumen") or {}).get("equidad") or {}
    return [{
        "grupo": GRUPOS_EQUIDAD.get(clave, clave),
        "n": v.get("n"),
        "detectados": round(100 * float(v.get("recall", 0))),
        "falsas_alarmas": round(100 * float(v.get("falsas_alarmas", 0))),
    } for clave, v in eq.items()]


def enriquecer_informe_centro(cliente, datos, escuela_id, nombre_escuela):
    """Nombre del centro, alumnos con alerta sin repetir, equidad y acciones."""
    filas = cliente.consultar("alerta", {
        "select": "alumno_id,clase_id",
        "escuela_id": f"eq.{escuela_id}",
        "nivel": "eq.alumno",
        "estado": "neq.descartada",
    })
    por_clase = defaultdict(set)
    for a in filas:
        por_clase[a["clase_id"]].add(a["alumno_id"])

    for c in datos["clases"]:
        c["alertas"] = len(por_clase.get(c.get("clase_id"), set()))

    datos["centro"] = NOMBRES_ESCUELA.get(nombre_escuela, nombre_escuela)
    datos["total_alertas"] = len({a["alumno_id"] for a in filas})
    datos["equidad"] = equidad_del_modelo(cliente)

    acciones = cliente.consultar("accion", {"select": "tipo,alerta(escuela_id)"})
    cuenta = Counter(TIPOS_ACCION.get(a["tipo"], a["tipo"]) for a in acciones
                     if (a.get("alerta") or {}).get("escuela_id") == escuela_id)
    datos["acciones"] = [{"tipo": t, "cantidad": n} for t, n in cuenta.most_common()]

    datos["observaciones"] = (
        "Las notas y asistencias son medias ponderadas por el número de alumnos de cada asignatura. "
        "La columna de alertas cuenta alumnos con al menos una alerta, sin repetir aunque tengan "
        "alertas en varias asignaturas. La equidad se calculó con los alumnos de los dos centros."
    )
    return datos
