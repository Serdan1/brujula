# Brújula — Estructura de los informes

**Hack4Edu 2026 · Reto 13**  
**Responsable:** Alex · Informes, diagramas y entrega  
**Estado:** propuesta de diseño

## Objetivo y criterios comunes

Los informes deben convertir alertas educativas explicables en información útil para docentes y directores. Utilizar azul petróleo `#174A55`, fondo arena `#F7F4ED`, ámbar `#E9B45C`, blanco `#FFFFFF`, texto `#24343A` y tipografía Inter. Incluir fecha de generación, periodo y fuente de datos. Diferenciar claramente datos reales UCI, datos sintéticos y resultados de modelos. Nunca mostrar rankings de alumnos ni porcentajes individuales de riesgo. Ordenar alertas por severidad y motivo, con explicación de por qué aparecen. No tratar predicciones como diagnósticos.

## A. Informe de clase — profesor

**Destinatario:** profesor autorizado de la clase.  
**Filtros:** escuela, asignatura, clase, periodo académico.  
**Extensión orientativa:** cinco páginas (ajustable según volumen de alertas).

### Página 1. Identificación y resumen
- Nombre de centro, asignatura, clase, periodo y fecha.
- Total de alumnos, asistencia media, nota media de examen y prácticas, participación media.
- Total de alertas, desglosadas por severidad alta y media; breve resumen narrativo.
- Fuentes: `escuela`, `asignatura`, `clase`, `alumno`, `rendimiento`, `alerta`.

### Página 2. Alertas por motivo
- Barras de recuento de alertas por motivo y severidad.
- Motivos contractuales: `faltas_en_aumento`, `bajada_de_notas`, `practicas_por_debajo`, `baja_participacion`, `riesgo_de_suspenso`, `grupo_por_debajo_de_la_media` (si corresponde al ámbito del informe).
- Texto explicativo del motivo y del periodo de observación.
- Fuente: `alerta`.

### Página 3. Variables más relevantes
- Importancia global de variables (SHAP) por clase/asignatura, con etiquetas legibles.
- Explicación breve: la importancia indica contribución al modelo, no causalidad.
- Si faltan resultados, indicar «Análisis no disponible» sin inventar valores.
- Fuentes: `analisis_clase`, `explicacion`.

### Página 4. Alumnos que podrían necesitar apoyo
- Identificación del alumno solo para profesorado autorizado; alertas ordenadas por severidad y motivo, no por probabilidad ni nota.
- Para cada alerta: título, descripción, motivo, severidad y hasta tres variables explicativas disponibles.
- Propuesta de seguimiento editorial, distinguida de las acciones efectivamente registradas.
- No mostrar `prob_apoyo` como porcentaje o puntuación individual.
- Fuentes: `alumno`, `alerta`, `explicacion`.

### Página 5. Acciones registradas
- Tabla con alerta vinculada, tipo de acción, descripción, fecha de inicio, fecha de revisión y resultado, si existe.
- Separar acciones con revisión pendiente de acciones con resultado documentado; no inventar un campo de estado de acción.
- Fuente: `accion`, enlazada con `alerta` y `profesor`.

## B. Informe de centro — director

**Destinatario:** director autorizado; únicamente información agregada de su escuela.  
**Filtros:** escuela y periodo.  
**Extensión orientativa:** cuatro páginas.

### Página 1. Resumen general del centro
- Nombre de centro, fecha y periodo.
- Total de clases, asignaturas y alumnos; recuento agregado de alertas por severidad y motivo.
- Fuentes: `escuela`, `clase`, `asignatura`, vistas agregadas autorizadas y `alerta` agregada.

### Página 2. Comparación entre clases y asignaturas
- Barras de alertas por clase/asignatura, preferiblemente con denominadores y tasas comparables cuando estén disponibles.
- Indicadores agregados de asistencia, rendimiento y participación.
- Ocultar grupos con menos de cinco alumnos, tal como exige el reparto de tareas.
- Fuentes: `v_clase_resumen`, `v_asignatura_resumen` (previstas), `analisis_clase` si procede.

### Página 3. Equidad del modelo
- Comparar recall y tasa de alertas por sexo, zona y escuela cuando existan muestras suficientes y métricas válidas.
- En un informe de una sola escuela, la comparación entre escuelas puede no ser aplicable; indicarlo en lugar de inventarla.
- Documentar tamaño de grupo, límites y cautelas; suprimir grupos pequeños.
- Fuentes: resultados agregados de `analisis_clase` y métricas entregadas por Daniel. No reconstruir datos sensibles desde el informe.

### Página 4. Acciones en curso
- Recuento agregado de acciones por tipo, fechas de revisión próximas y resultados registrados.
- No mostrar nombres de alumnos ni detalles que permitan reidentificarlos.
- «En curso» debe definirse con el equipo a partir de fechas y resultados disponibles; el contrato `accion` no incluye un estado explícito.
- Fuente: `accion`, mediante consultas/vistas agregadas autorizadas.

## Contrato de datos y dependencias

- **Aarón:** esquema final, claves foráneas, políticas RLS y vistas agregadas seguras.
- **Daniel:** registros de `alerta`, `explicacion`, `analisis_clase`, métricas, límites del modelo y ejemplos.
- **Iván:** botón «Descargar informe» y acceso desde el frontend con permisos apropiados.
- **Alex:** plantillas, generación PDF, pruebas de contenido y subida a Storage sin exponer informes privados públicamente.

