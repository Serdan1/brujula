# Brújula — Estructura de los informes

**Hack4Edu 2026 · Reto 13**  
**Responsable:** Alex · Informes, diagramas y entrega  
**Estado:** especificación revisada conforme al contrato de datos de Supabase

## Objetivo y criterios comunes

Los informes convierten los datos académicos, las alertas educativas y los resultados de los modelos de inteligencia artificial en información comprensible y útil para profesores y directores.

**Diseño visual:** azul petróleo `#174A55`, fondo arena `#F7F4ED`, ámbar `#E9B45C`, blanco `#FFFFFF`, texto `#24343A` y tipografía Inter.

**Reglas generales:**

- Incluir fecha de generación, periodo académico, centro y fuente de información.
- Distinguir los datos académicos procedentes del conjunto UCI, los datos sintéticos y los resultados generados por modelos de inteligencia artificial.
- Identificar expresamente las variables de prácticas y participación como sintéticas cuando procedan de la generación de datos.
- No mostrar rankings de alumnos ni probabilidades individuales de riesgo.
- No incluir `prob_apoyo`, aunque esté presente en `resumen.alumnos_apoyo`.
- Presentar las predicciones como estimaciones orientativas, nunca como diagnósticos.
- Ordenar las alertas por severidad y motivo.
- Mostrar únicamente los datos autorizados para el usuario autenticado.
- No inventar indicadores, explicaciones ni resultados cuando falten datos.
- Suprimir los grupos de menos de cinco alumnos en las comparaciones agregadas.

---

## A. Informe de clase — Profesor

**Destinatario:** profesor autorizado de la clase y asignatura.

**Filtros:** escuela, asignatura, clase y periodo académico.

**Extensión orientativa:** cinco páginas.

### Página 1. Identificación y resumen académico

Mostrar:

- Nombre del centro.
- Curso y letra de la clase.
- Asignatura.
- Periodo académico y fecha.
- Número total de alumnos.
- Nota media de examen.
- Nota media de prácticas, identificada como sintética cuando corresponda.
- Asistencia media.
- Participación media, identificada como sintética cuando corresponda.
- Total de alertas activas y distribución por severidad.

**Predicción de la red neuronal:**

Incorporar `analisis_clase.resumen.nota_estimada_media` como indicador independiente de las notas académicas observadas.

Mostrar el texto:

**«Nota final estimada media de la clase. Predicción de la red neuronal. Error medio aproximado: ±1 punto».**

La nota estimada no debe confundirse con la nota media de examen ni presentarse como resultado definitivo.

**Fuentes:** `escuela`, `clase`, `asignatura`, `v_clase_resumen` y `analisis_clase`.

### Página 2. Alertas por motivo

Mostrar el número de alertas por motivo y severidad, utilizando los motivos que realmente genera el sistema:

- `riesgo_de_suspenso`
- `faltas_en_aumento`
- `practicas_por_debajo`
- `baja_participacion`
- `grupo_por_debajo_de_la_media`

No incluir `bajada_de_notas` en los gráficos ni en los ejemplos, porque las alertas disponibles corresponden al periodo 1 y ese motivo no se genera actualmente.

Distinguir las alertas individuales de las alertas agregadas de grupo o asignatura.

Para cada motivo, incluir una explicación breve y comprensible.

**Fuentes:** `alerta` y los resúmenes autorizados.

### Página 3. Variables más relevantes del modelo

Obtener la importancia de variables desde:

`analisis_clase.resumen.importancia`

Los nombres de las variables ya vienen preparados para su presentación y no requieren una conversión adicional.

Mostrar:

- Nombre legible de la variable.
- Importancia registrada.
- Representación gráfica.
- Explicación del significado de la importancia.

Identificar las variables de prácticas y participación como **datos sintéticos** cuando corresponda.

Incluir una advertencia metodológica:

«La importancia de una variable refleja su contribución al resultado del modelo, pero no demuestra una relación causal».

Si no hay análisis disponible, mostrar «Análisis no disponible».

**Fuente principal:** `analisis_clase`.

### Página 4. Alumnos que podrían necesitar apoyo

Mostrar información individual exclusivamente al profesorado autorizado.

Para cada alerta:

- Identificación del alumno, cuando esté autorizada.
- Motivo.
- Severidad.
- Descripción.
- Estado de revisión.
- Variables explicativas disponibles, cuando existan.

**Tratamiento de las explicaciones:**

Las alertas basadas en reglas pueden incluir un único dato en `variables` y no disponer de registros relacionados en `explicacion`.

En estos casos, utilizar directamente `alerta.descripcion` para explicar el motivo de la alerta.

No exigir registros en `explicacion` para mostrar una alerta válida.

Cuando existan explicaciones del modelo, mostrar hasta tres variables relevantes disponibles.

No mostrar `prob_apoyo` ni porcentajes individuales de riesgo, aunque aparezcan en `resumen.alumnos_apoyo`.

No ordenar a los alumnos según su probabilidad de riesgo.

**Fuentes:** `alumno`, `alerta`, `explicacion` y los análisis autorizados.

### Página 5. Acciones registradas

Mostrar las intervenciones educativas registradas:

- Tipo de acción.
- Alerta relacionada.
- Descripción.
- Fecha de inicio.
- Fecha de revisión.
- Resultado documentado, cuando exista.

Distinguir entre acciones pendientes de revisión y acciones con resultados registrados.

No inventar un estado de acción si no existe en la base de datos.

Las recomendaciones generales deben distinguirse claramente de las acciones que un profesor haya registrado realmente.

**Fuentes:** `accion`, `alerta` y `profesor`.

---

## B. Informe de centro — Director

**Destinatario:** director autorizado.

**Ámbito:** datos académicos agregados del centro y métricas globales del modelo claramente identificadas como tales.

**Filtros:** escuela y periodo académico.

**Extensión orientativa:** cuatro páginas.

### Página 1. Resumen general del centro

Mostrar:

- Nombre del centro.
- Periodo y fecha.
- Número de clases.
- Número de alumnos.
- Número de asignaturas.
- Nota media académica.
- Asistencia media.
- Número agregado de alertas por motivo y severidad.

No mostrar información identificable de alumnos.

**Fuentes:** `escuela`, `clase`, `asignatura`, `v_clase_resumen` y `v_asignatura_resumen`.

### Página 2. Comparación entre clases y asignaturas

Presentar indicadores agregados:

- Número de alumnos.
- Nota media de examen.
- Nota media de prácticas, identificada como sintética cuando corresponda.
- Participación media, identificada como sintética cuando corresponda.
- Asistencia media.
- Alertas activas.

Utilizar gráficos y tablas que permitan comparar los resultados.

Aplicar la supresión de grupos con menos de cinco alumnos.

No construir rankings individuales ni mostrar datos personales.

**Fuentes:**

- `v_clase_resumen`
- `v_asignatura_resumen`

Estas vistas están definidas en la migración:

`supabase/migrations/20261104090000_rls_vistas_auditoria.sql`

### Página 3. Equidad del modelo global

La información de equidad procede de:

`analisis_clase.resumen.equidad`

**Esta evaluación corresponde al modelo global y no es una evaluación específica del centro.**

Presentar exclusivamente las métricas disponibles de:

- **Recall:** capacidad del modelo para identificar los casos positivos reales.
- **Falsas alarmas:** casos señalados incorrectamente por el modelo, utilizando la definición y unidad de la métrica registrada.

Cuando existan desgloses por grupos, indicar claramente su ámbito y las limitaciones de interpretación.

No presentar estas métricas como resultados particulares de la escuela.

No incluir métricas de equidad adicionales que no formen parte de los resultados disponibles.

Si no hay información suficiente, indicar «Evaluación de equidad del modelo global no disponible».

### Página 4. Acciones de seguimiento

Presentar únicamente información agregada:

- Número de acciones registradas.
- Distribución por tipo.
- Acciones pendientes de revisión, cuando puedan determinarse.
- Acciones con resultados documentados.

No mostrar nombres de alumnos ni descripciones que permitan identificarlos.

El estado de seguimiento deberá deducirse de los campos realmente disponibles, sin inventar valores.

**Fuente:** `accion`, mediante consultas agregadas autorizadas.

---

## Contrato de datos y dependencias

**Aarón — Base de datos y seguridad**

- Esquema SQL.
- Relaciones entre tablas.
- Políticas RLS.
- Vistas agregadas `v_clase_resumen` y `v_asignatura_resumen`.
- Migración `20261104090000_rls_vistas_auditoria.sql`.

**Daniel — Inteligencia artificial y alertas**

- Resultados del modelo de red neuronal.
- `analisis_clase.resumen.nota_estimada_media`.
- `analisis_clase.resumen.importancia`.
- `analisis_clase.resumen.equidad`.
- Alertas, explicaciones y límites de interpretación.
- Identificación de variables sintéticas.

**Iván — Aplicación web**

- Acceso autenticado.
- Selección de clase, asignatura y periodo.
- Botón «Descargar informe».
- Integración con Supabase Storage.

**Alex — Generación de informes**

- Consultas autorizadas a Supabase.
- Preparación de datos mediante Python.
- Plantillas HTML con Jinja2.
- Generación PDF con WeasyPrint.
- Validación del contenido.
- Publicación segura de informes.

---

## Reglas de implementación

1. Mantener separados los informes de demostración y los informes con datos reales.
2. Consultar Supabase utilizando la sesión del usuario autorizado.
3. Utilizar los campos reales de `analisis_clase.resumen` sin inventar estructuras.
4. Diferenciar notas observadas de predicciones de la red neuronal.
5. No mostrar `prob_apoyo`.
6. Utilizar `alerta.descripcion` cuando no existan explicaciones adicionales.
7. Identificar las variables sintéticas.
8. Mostrar la equidad exclusivamente como evaluación del modelo global.
9. Respetar las restricciones RLS y la supresión de grupos pequeños.
10. Mantener privados los PDF con datos personales y controlar su descarga.