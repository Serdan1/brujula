"""
Datos del modelo para los informes PDF: alertas individuales, avisos de grupo,
importancia de variables, nota estimada, equidad y acciones.

Reglas éticas (igual que en la web):
- Nunca se muestra prob_apoyo ni una puntuación individual.
- Las alertas se ordenan por prioridad y motivo, nunca por probabilidad ni por nota.
- Las variables sintéticas se marcan con un asterisco.
"""

from collections import Counter, defaultdict
from datetime import date

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
        "select": "nivel,motivo,severidad,estado,titulo,descripcion,variables,alumno_id,alumno(nombre)",
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
                "alumno_id": a.get("alumno_id"),
                "motivo_clave": a["motivo"],
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


# Ideas de actuación por motivo: orientan, no prescriben. La decisión es del profesor.
IDEAS = {
    "riesgo_de_suspenso": "Una conversación breve con el alumno y, si hace falta, refuerzo en los contenidos del trimestre.",
    "faltas_en_aumento": "Contactar con la familia para conocer el motivo de las faltas.",
    "practicas_por_debajo": "Revisar con el alumno las prácticas pendientes y ofrecer material de refuerzo.",
    "baja_participacion": "Proponer actividades en pequeño grupo que le faciliten participar.",
    "bajada_de_notas": "Hablar con el alumno para entender qué ha cambiado.",
}


def _esta_resuelta(accion):
    r = (accion.get("resultado") or "").strip()
    return bool(r) and r.lower() != "pendiente"


def _fecha(f):
    return "" if not f else f"{f[8:10]}/{f[5:7]}/{f[0:4]}"


def acciones_de_clase(cliente, clase_id, asignatura_id):
    filas = cliente.consultar("accion", {
        "select": "tipo,fecha_revision,resultado,alerta!inner(clase_id,asignatura_id,alumno_id,alumno(nombre))",
        "alerta.clase_id": f"eq.{clase_id}",
        "alerta.asignatura_id": f"eq.{asignatura_id}",
    })
    salida = []
    for a in filas:
        al = a.get("alerta") or {}
        salida.append({
            "alumno": (al.get("alumno") or {}).get("nombre", ""),
            "alumno_id": al.get("alumno_id"),
            "tipo": TIPOS_ACCION.get(a["tipo"], a["tipo"]),
            "revision": _fecha(a.get("fecha_revision")),
            "estado": "Resuelta" if _esta_resuelta(a) else "En seguimiento",
            "_orden": (_esta_resuelta(a), a.get("fecha_revision") or "9999"),
        })
    salida.sort(key=lambda x: x["_orden"])
    for a in salida:
        del a["_orden"]
    return salida


def enriquecer_informe_clase(cliente, datos, clase_id, asignatura_id):
    """Añade al diccionario de la plantilla de clase los datos del modelo."""
    alumnos, grupo = alertas_de_clase(cliente, clase_id, asignatura_id)
    datos["asignatura"] = nombre_asignatura(cliente, asignatura_id)
    datos["alertas"] = alumnos
    datos["avisos_grupo"] = grupo
    datos["alumnos_con_alerta"] = len({a["alumno"] for a in alumnos})
    datos.update(analisis_de_clase(cliente, clase_id, asignatura_id))

    # 3. Por dónde empezar: prioridad alta sin acciones, y acciones ya registradas
    acciones = acciones_de_clase(cliente, clase_id, asignatura_id)
    con_accion = {a["alumno_id"] for a in acciones}
    datos["sin_accion"] = [a for a in alumnos if a["alta"] and a["alumno_id"] not in con_accion]
    datos["acciones_clase"] = acciones

    # 4. Qué vigilar: alumnos por motivo, con una idea de actuación
    por_motivo = defaultdict(set)
    for a in alumnos:
        por_motivo[a["motivo_clave"]].add(a["alumno_id"])
    datos["vigilar"] = [{
        "motivo": MOTIVOS.get(m, m), "alumnos": len(ids), "idea": IDEAS.get(m, ""),
    } for m, ids in sorted(por_motivo.items(), key=lambda kv: -len(kv[1]))]
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

    # 3. Dónde poner el foco
    datos["foco_clases"] = sorted([c for c in datos["clases"] if c["alertas"]], key=lambda c: -c["alertas"])[:5]
    por_asig = cliente.consultar("alerta", {
        "select": "alumno_id,asignatura(nombre)", "escuela_id": f"eq.{escuela_id}",
        "nivel": "eq.alumno", "estado": "neq.descartada",
    })
    cuenta_asig = defaultdict(set)
    for a in por_asig:
        cuenta_asig[(a.get("asignatura") or {}).get("nombre", "")].add(a["alumno_id"])
    datos["foco_asignaturas"] = [{"asignatura": k, "alumnos": len(v)}
                                 for k, v in sorted(cuenta_asig.items(), key=lambda kv: -len(kv[1]))]
    grupo = cliente.consultar("alerta", {
        "select": "titulo,descripcion,severidad", "escuela_id": f"eq.{escuela_id}",
        "nivel": "neq.alumno", "estado": "neq.descartada",
    })
    datos["avisos_grupo"] = [{"titulo": g["titulo"], "descripcion": texto_sobre10(g.get("descripcion")) or "",
                              "alta": g.get("severidad") == "alta"}
                             for g in sorted(grupo, key=lambda g: ORDEN_SEVERIDAD.get(g.get("severidad"), 9))]
    datos["avisos_mas"] = max(0, len(datos["avisos_grupo"]) - 8)
    datos["avisos_grupo"] = datos["avisos_grupo"][:8]

    # 4. Seguimiento del profesorado
    estados = Counter(a["estado"] for a in cliente.consultar("alerta", {
        "select": "estado", "escuela_id": f"eq.{escuela_id}", "nivel": "eq.alumno",
    }))
    total = sum(estados.values())
    atendidas = estados.get("revisada", 0) + estados.get("descartada", 0)
    datos["seguimiento"] = {
        "pendientes": estados.get("nueva", 0), "revisadas": estados.get("revisada", 0),
        "descartadas": estados.get("descartada", 0), "total": total,
        "pct_atendidas": round(100 * atendidas / total) if total else 0,
    }
    acciones = [a for a in cliente.consultar("accion", {"select": "tipo,fecha_revision,resultado,alerta(escuela_id)"})
                if (a.get("alerta") or {}).get("escuela_id") == escuela_id]
    hoy = date.today().isoformat()
    datos["seguimiento"].update({
        "acciones": len(acciones),
        "resueltas": sum(1 for a in acciones if _esta_resuelta(a)),
        "vencidas": sum(1 for a in acciones if not _esta_resuelta(a) and a.get("fecha_revision") and a["fecha_revision"] < hoy),
    })
    cuenta = Counter(TIPOS_ACCION.get(a["tipo"], a["tipo"]) for a in acciones)
    datos["acciones"] = [{"tipo": t, "cantidad": n} for t, n in cuenta.most_common()]

    datos["observaciones"] = (
        "Las notas y asistencias son medias ponderadas por el número de alumnos de cada asignatura. "
        "La columna de alertas cuenta alumnos con al menos una alerta, sin repetir aunque tengan "
        "alertas en varias asignaturas."
    )
    return datos
