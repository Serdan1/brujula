// Español: idioma de referencia. Los demás diccionarios deben tener exactamente las mismas claves.
// Los textos con negritas se escriben como JSX (<>…<strong>…</strong>…</>).

const es = {
  comun: {
    idioma: 'Idioma',
    entrar: 'Entrar',
    probarDemo: 'Probar la demo',
    // Nombre de una clase: curso (4, 5 o 6) y letra
    clase: (curso: number, letra: string) => `${curso}.º Primaria ${letra}`,
    // Nombres de asignatura tal como están en la base de datos (en español)
    asignaturas: { Portugués: 'Portugués', Matemáticas: 'Matemáticas', Inglés: 'Inglés', Ciencias: 'Ciencias' } as Record<string, string>,
  },

  marco: {
    menu: { modelo: 'El modelo', recursos: 'Pocos recursos', llega: 'Cómo llega' },
    apartados: 'Apartados',
    cierre: 'Míralo con datos de ejemplo, sin instalar nada.',
    pie1: 'Proyecto para #hack4edu 2026, reto 13 de ProFuturo. Código abierto con licencia MIT.',
    pie2: 'Datos: dataset Student Performance (P. Cortez y A. Silva, UCI, CC BY 4.0), ampliado con datos sintéticos. Los nombres de alumnos y profesores son ficticios.',
  },

  portada: {
    titulo: 'Que ningún alumno necesite apoyo sin que nadie lo vea venir.',
    intro: 'Brújula convierte los datos que la escuela ya tiene en avisos claros para el profesorado, con el motivo de cada aviso y espacio para decidir qué hacer.',
    ejemplo: {
      aria: 'Ejemplo de la aplicación con datos ficticios',
      ventana: 'Brújula · Portugués',
      prioridadAlta: 'Prioridad alta',
      podriaApoyo: 'Podría necesitar apoyo',
      titulo: 'Podría necesitar apoyo en Portugués',
      alumna: 'Alumna de 4.º Primaria C · ejemplo ficticio',
      porQue: 'Por qué salta:',
      notaPrimer: 'Nota del primer periodo',
      nota: '4,5',
      asistencia: 'Asistencia',
      registrar: 'Registrar acción',
      descartar: 'Descartar con motivo',
    },
    acceso: {
      titulo: 'Entrar en la demo',
      correo: 'Correo',
      contrasena: 'Contraseña',
      error: 'Correo o contraseña incorrectos.',
      pista: 'Prueba con profesor.gp@example.com o director.gp@example.com. Todos los nombres de alumnos son ficticios.',
    },
    comoFunciona: 'Cómo funciona.',
    comoFuncionaSub: 'Tres pasos, y decide el profesor.',
    pasos: [
      { titulo: 'La escuela ya tiene los datos', texto: 'Notas, asistencia, prácticas y participación.' },
      { titulo: 'Brújula avisa y explica', texto: 'Quién podría necesitar apoyo y qué datos lo indican.' },
      { titulo: 'El profesor decide', texto: 'Actúa o descarta el aviso con un motivo.' },
    ],
  },

  elModelo: {
    titulo: 'El modelo, por dentro',
    entradilla: 'Al final de cada trimestre, Brújula estima para cada alumno y asignatura si podría necesitar apoyo para aprobar, y por qué, y su nota final con un margen.',
    usa: 'Usa:',
    datosQueUsa: 'Notas, faltas, asistencia, prácticas, participación y tiempo de estudio.',
    comoAcierta: 'Cómo de bien acierta',
    deCadaDiez: (n: number) => `${n} de cada 10`,
    cifra1: 'alumnos que acaban necesitando apoyo reciben un aviso al final del 1.º trimestre.',
    cifra2: 'avisos son de alumnos que de verdad acaban necesitando apoyo.',
    puntos: '0,5 puntos',
    cifra3: 'es lo que se desvía de media la nota estimada, sobre 10. El margen incluye la nota real 8 de cada 10 veces.',
    nota: 'Cifras medidas con datos de dos institutos portugueses (curso 2005-06), ampliados con datos sintéticos. Antes de usarlo en una escuela, hay que volver a entrenarlo con sus propios datos.',
    noHace: 'Lo que Brújula no hace',
    limites: [
      { titulo: 'Sin decisiones automáticas', texto: 'Cada aviso termina en una decisión humana, y queda registrado quién la tomó.' },
      { titulo: 'Sin rankings', texto: 'No hay listas de mejores y peores alumnos ni porcentajes de riesgo por alumno.' },
      { titulo: 'Solo lo necesario', texto: 'No se guardan datos familiares, económicos ni de hábitos personales.' },
      { titulo: 'Cada uno ve lo suyo', texto: 'Un profesor solo ve sus clases y sus asignaturas. La dirección, su centro.' },
    ],
  },

  pocosRecursos: {
    titulo: 'Pensada para escuelas con pocos recursos',
    entradilla: 'Donde hay menos orientadores y más alumnos por profesor, detectar a tiempo quién se está quedando atrás es más difícil y más importante.',
    p1: 'Brújula no pide sensores, plataformas caras ni personal técnico.',
    p2: 'También para centros con brechas de acceso: basta un navegador, en el ordenador o en el móvil.',
    ventajas: [
      { titulo: 'Datos que ya existen.', texto: 'Notas y asistencia bastan para empezar.' },
      { titulo: 'Sin instalar nada.', texto: 'Funciona en el navegador, también en el móvil.' },
      { titulo: 'Coste de infraestructura cero', texto: 'para empezar, con servicios en su capa gratuita.' },
      { titulo: 'Comprueba que es justa.', texto: 'Mide si el modelo acierta igual con chicas y chicos, con alumnado rural y urbano, y entre centros.' },
    ],
    movil: {
      cabecera: 'Portugués · 4.º Primaria C',
      prioridadAlta: 'Prioridad alta',
      podriaApoyo: 'Podría necesitar apoyo',
      asistencia: 'Asistencia',
      prioridadMedia: 'Prioridad media',
      bajaParticipacion: 'Baja la participación',
      grupo: 'Grupo de 4.º Primaria C',
    },
  },

  comoLlega: {
    titulo: 'Cómo llega a las escuelas',
    intro: 'Brújula es gratis para quien más lo necesita. Lo financian quienes gestionan muchos centros.',
    niveles: [
      { para: 'Centros públicos y en contextos vulnerables', condicion: 'Gratis', incluye: 'Todas las funciones para su centro.' },
      { para: 'Redes de centros y administraciones educativas', condicion: 'De pago', incluye: 'Varios centros a la vez, informes y soporte.' },
      { para: 'Fundaciones y ONG educativas', condicion: 'Implantación', incluye: 'Lo llevan a los centros que acompañan y ayudan a ponerlo en marcha.' },
    ],
    proximos: 'Próximos pasos',
    hojaDeRuta: [
      'Importar las notas desde Excel.',
      'Traducciones revisadas por docentes de cada país.',
    ],
  },

  comoFunciona: {
    titulo: 'Cómo funciona Brújula',
    tituloDetalle: 'Para quien quiera el detalle',
    intro: 'Qué datos usa, cómo elegimos el modelo y cómo comprobamos que es justo con todos los alumnos.',
    cifras: [
      { valor: '84 %', texto: 'de los alumnos que necesitarán apoyo, detectados al final del primer periodo' },
      { valor: '23', texto: 'falsas alarmas menos que la regla «suspende el primer periodo», detectando a los mismos alumnos' },
      { valor: '14', texto: 'alumnos que aprueban el primer periodo y aun así necesitarán apoyo: la regla no los ve' },
    ],
    datos: {
      titulo: 'Los datos',
      p1: <>La base es real: <strong>674 alumnos</strong> de dos institutos portugueses (dataset Student Performance de la UCI, CC BY 4.0), con sus notas de tres periodos, faltas y contexto.</>,
      p2: <>Para la demo se añadieron datos <strong>sintéticos</strong>: clases, profesores, Inglés y Ciencias, y la nota de prácticas, la participación y la asistencia por periodo, generadas a partir de las notas reales. Por eso aparecen marcadas con un asterisco. Lo medimos: sin ellas, el modelo sigue dando 14 falsas alarmas menos que la regla de las notas.</>,
    },
    noUsa: {
      titulo: 'Lo que el modelo no usa',
      p1: 'No usa consumo de alcohol, relaciones sentimentales o familiares, ni estudios o trabajo de los padres: señalar a un alumno por ellas sería estigmatizante. Sexo, zona y escuela tampoco entran al modelo; solo se usan para auditarlo.',
      p2: 'Tampoco usa las notas del segundo y tercer periodo: la alerta se genera con lo que se sabe al final del primero.',
    },
    eleccion: {
      titulo: 'Cómo elegimos el modelo',
      p1: 'Comparamos 7 combinaciones de modelos, todas detectando a los mismos alumnos que la regla «suspende el primer periodo» (299 alertas), y elegimos la que da menos falsas alarmas.',
      columnas: ['Modelo', 'Calidad (PR-AUC)', 'Acertadas', 'Alertas', 'Alumnos que la regla no ve'],
      elegido: ' (elegido)',
      // Piezas de los nombres de modelo
      logistica: 'Logística',
      redNeuronal: 'Red neuronal',
      p2: <>La <strong>red neuronal</strong> se usa donde es la mejor: estimar la nota final, con un error medio de 0,53 puntos sobre 10 (frente a 1,08 de Ridge y 1,13 de la regla «la nota final será la del primer periodo») y un intervalo que acierta el 80 % de las veces.</>,
    },
    equidad: {
      titulo: 'Equidad del modelo',
      p1: 'Medimos si el modelo acierta igual para todos los grupos.',
      columnas: ['Grupo', 'Alumnos', 'Detectados', 'Falsas alarmas'],
      grupos: { chicas: 'Chicas', chicos: 'Chicos', rural: 'Zona rural', urbana: 'Zona urbana', gp: 'Escuela GP', ms: 'Escuela MS' },
      p2: <>Detecta igual a todos los grupos, pero da más falsas alarmas en zona rural. No lo corregimos con un umbral distinto por zona, porque la decisión dependería de dónde vive el alumno. Por eso <strong>ninguna alerta decide nada</strong>: el profesorado la revisa y puede descartarla con un motivo.</>,
    },
    noHace: {
      titulo: 'Lo que Brújula no hace',
      p1: 'No etiqueta a los alumnos, no muestra puntuaciones de riesgo ni rankings, y no toma decisiones automáticas. Las alertas orientan; la decisión es siempre del profesor.',
    },
  },

  // ================= Web con sesión =================
  app: {
    cargando: 'Cargando...',
    cerrarSesion: 'Cerrar sesión',
    volverInicio: '← Inicio',
    volverAsignatura: '← Volver a la asignatura',
    volverClase: '← Volver a la clase',
    proximasRevisiones: 'Próximas revisiones',
    prioridadAlta: 'Prioridad alta',
    prioridadMedia: 'Prioridad media',
    modoClaro: '☀️ Modo claro',
    modoOscuro: '🌙 Modo oscuro',
    modoClaroAria: 'Cambiar a modo claro',
    modoOscuroAria: 'Cambiar a modo oscuro',
    alumnos: (n: number) => `${n} ${n === 1 ? 'alumno' : 'alumnos'}`,
    alertasPendientes: (n: number) => `${n} ${n === 1 ? 'alerta pendiente' : 'alertas pendientes'}`,
    trimestre: (n: number) => `${n}.º trimestre`,
    sinteticaUna: '* Variable sintética en esta demo.',
    comoFuncionaPregunta: '¿Cómo se eligió el modelo, qué datos usa y es justo con todos los alumnos?',
    comoFuncionaEnlace: 'Cómo funciona Brújula →',
    si: 'Sí',
    no: 'No',
  },

  // Motivos de alerta: nombre corto y frase para un grupo de n alumnos
  motivos: {
    riesgo_de_suspenso: { corto: 'Podría necesitar apoyo', grupo: (n: number) => (n === 1 ? 'podría necesitar apoyo' : 'podrían necesitar apoyo') },
    faltas_en_aumento: { corto: 'Asistencia baja', grupo: () => 'con asistencia baja' },
    practicas_por_debajo: { corto: 'Prácticas por debajo del aprobado', grupo: () => 'con prácticas por debajo del aprobado' },
    baja_participacion: { corto: 'Participación baja', grupo: () => 'con participación baja' },
    bajada_de_notas: { corto: 'Bajada de notas', grupo: () => 'con bajada de notas' },
    grupo_por_debajo_de_la_media: { corto: 'Grupo por encima de la media de alertas', grupo: () => 'en grupos por encima de la media' },
  } as Record<string, { corto: string; grupo: (n: number) => string }>,

  tiposAccion: {
    tutoría: 'Tutoría con el alumno',
    reunión_familia: 'Reunión con la familia',
    refuerzo: 'Material de refuerzo',
    seguimiento: 'Seguimiento en clase',
  } as Record<string, string>,

  tarjeta: {
    revisada: 'Revisada',
    verEnClase: 'Ver en la clase →',
    loReviso: 'Lo reviso',
    registrar: 'Registrar acción',
    descartar: 'Descartar con motivo',
    preguntaDescarte: '¿Por qué descartas esta alerta? (queda registrado)',
  },

  formulario: {
    titulo: 'Registrar acción',
    placeholder: 'Qué vas a hacer...',
    fechaRevision: 'Fecha de revisión',
    nota: 'La decisión es tuya: Brújula solo propone. La acción queda registrada.',
    cancelar: 'Cancelar',
    guardar: 'Guardar',
    guardando: 'Guardando...',
  },

  errores: {
    revisar: 'No se ha podido marcar como revisada: ',
    descartar: 'No se ha podido descartar: ',
    sinPerfil: 'No se encuentra tu perfil de profesor.',
    guardarAccion: 'Error al guardar la acción: ',
    guardar: 'No se ha podido guardar: ',
    reabrir: 'No se ha podido reabrir: ',
    informe: 'El informe todavía no está disponible. Se genera al publicar los resultados del modelo.',
  },

  informe: {
    descargar: 'Descargar informe (PDF)',
    centro: 'Informe del centro (PDF)',
    abriendo: 'Abriendo...',
  },

  inicio: {
    panel: 'Panel docente',
    hola: (nombre: string) => (nombre ? `Hola, ${nombre}` : 'Hola'),
    intro: 'Consulta las alertas educativas y realiza el seguimiento de tus alumnos.',
    indPendientes: 'Alertas de alumnos pendientes',
    indAltas: 'Alertas de prioridad alta',
    indAsignaturas: 'Mis asignaturas',
    importante: 'Lo más importante',
    importanteSub: 'Situaciones que conviene revisar primero',
    etiquetaPendientes: 'Alertas pendientes',
    cargandoAlertas: 'Cargando alertas...',
    sinAlertas: 'No hay alertas pendientes.',
    frase: (n: number, grupo: string, asignatura: string) => `${n} ${n === 1 ? 'alumno' : 'alumnos'} ${grupo} en ${asignatura}`,
    conAlta: (n: number) => `${n} con prioridad alta`,
    asignaturas: 'Mis asignaturas',
    asignaturasSub: 'Accede a tus clases y consulta su seguimiento',
  },

  director: {
    cabecera: (escuela: string) => `Dirección · ${escuela} · datos del primer periodo`,
    conAlerta: 'Alumnos con alguna alerta',
    de: (n: number) => `de ${n}`,
    conAlertaNota: 'En cualquier asignatura, sin contar dos veces al mismo alumno',
    conAlta: 'Con prioridad alta',
    alumnos: 'alumnos',
    conAltaNota: 'Conviene que su profesorado los revise primero',
    acciones: 'Acciones de seguimiento registradas',
    accionesNota: 'Tutorías, reuniones con familias, refuerzos y seguimientos decididos por el profesorado',
    avisosGrupo: 'Avisos de grupo',
    porAsignatura: 'Por asignatura',
    columnas: ['Asignatura', 'Clases', 'Alumnos', 'Nota media', 'Asistencia*', 'Alumnos con alerta'],
    notaTabla: '* Datos sintéticos en esta demo. Solo se muestran grupos de 5 alumnos o más.',
    clases: 'Clases',
    pendientes: (n: number) => `${n} ${n === 1 ? 'pendiente' : 'pendientes'}`,
  },

  asignatura: {
    misClases: 'Mis clases',
    cargandoClases: 'Cargando clases...',
    avisosGrupo: 'Avisos de grupo',
    alertasAlumnos: (n: number) => `Alertas de alumnos (${n})`,
    cargandoAlertas: 'Cargando alertas...',
    sinAlertas: 'No hay alertas de alumnos.',
    desplegar: (n: number) => `${n} ${n === 1 ? 'alerta' : 'alertas'} · pulsa para desplegar`,
    alumno: 'Alumno',
    pendiente: 'pendiente',
    revisada: 'revisada',
  },

  clase: {
    soloLectura: 'Vista de dirección (solo lectura). Las acciones las registra el profesor de la asignatura.',
    resumen: (alumnos: number, conAlerta: number) => `${alumnos} ${alumnos === 1 ? 'alumno' : 'alumnos'} · ${conAlerta} con alguna alerta · datos del primer periodo`,
    analisis: 'Análisis completo de la clase →',
    columnas: ['Alumno (ficticio)', 'Examen', 'Prácticas*', 'Participación*', 'Asistencia*', 'Alertas'],
    cargandoAlumnos: 'Cargando alumnos...',
    nota: '* Variables sintéticas en esta demo. La tabla no está ordenada por rendimiento. Pulsa en un alumno para ver su ficha.',
  },

  alumno: {
    estudio: { 1: 'Menos de 2 h', 2: 'De 2 a 5 h', 3: 'De 5 a 10 h', 4: 'Más de 10 h' } as Record<number, string>,
    trayecto: { 1: 'Menos de 15 min', 2: 'De 15 a 30 min', 3: 'De 30 a 60 min', 4: 'Más de 1 h' } as Record<number, string>,
    sinAcceso: 'No tienes acceso a los datos de este alumno en esta asignatura.',
    edad: (n: number) => `${n} años`,
    subtitulo: 'datos del primer periodo · alumno ficticio',
    frenteClase: 'Primer periodo frente a la clase',
    frenteClaseNota: 'La línea vertical marca la media de la clase. En ámbar, lo que está por debajo.',
    mediaClase: 'media de la clase',
    examen: 'Examen',
    practicas: 'Prácticas',
    participacion: 'Participación',
    asistencia: 'Asistencia',
    notaEstimada: 'Nota final estimada',
    valorCentral: 'Valor central:',
    estimadaNota: 'Estimación de la red neuronal con los datos del primer periodo. En 8 de cada 10 alumnos, la nota real queda dentro de este rango. Es orientativa: no es una calificación ni un pronóstico seguro.',
    sinEstimacion: 'No hay estimación disponible.',
    alertas: 'Alertas',
    sinAlertas: (asignatura: string) => `Este alumno no tiene alertas en ${asignatura}.`,
    contexto: 'Contexto',
    ctxEstudio: 'Tiempo de estudio semanal',
    ctxSuspensos: 'Suspensos previos',
    ctxTrayecto: 'Tiempo de trayecto',
    ctxApoyo: 'Apoyo educativo del centro',
    ctxActividades: 'Actividades extraescolares',
    sinContexto: 'Sin datos de contexto.',
    contextoNota: 'Datos reales del dataset de la UCI. No se muestran datos de salud, ocio ni familia.',
    acciones: 'Acciones registradas',
    sinAcciones: 'Todavía no has registrado ninguna acción con este alumno.',
    desde: (f: string) => `Desde ${f}`,
    revisarEl: (f: string) => ` · revisar el ${f}`,
    resultado: (r: string) => ` · resultado: ${r}`,
  },

  analisis: {
    cargando: 'Cargando análisis...',
    noDisponible: 'Análisis no disponible para esta clase.',
    titulo: (clase: string, asignatura: string) => `Análisis completo · ${clase} · ${asignatura}`,
    intro: 'Resultados del modelo al final del primer periodo. Son estimaciones para orientar, no diagnósticos.',
    podrianApoyo: 'Podrían necesitar apoyo',
    deTotal: (total: number, pct: string) => `de ${total} (${pct})`,
    conAlta: 'Con prioridad alta',
    revisarPrimero: 'Conviene revisarlos primero',
    notaMedia: 'Nota final estimada media',
    errorMedio: (e: string) => `Red neuronal · error medio ±${e} puntos`,
    pesa: 'Qué pesa más en las alertas de esta clase',
    pesaNota: 'Contribución media de cada variable al modelo (SHAP). Indica en qué se fija el modelo, no qué causa el resultado.',
    pesaSintetica: '* Variable sintética en esta demo: su peso refleja cómo se generó a partir de las notas, no es un hallazgo.',
    porQue: 'Alumnos que podrían necesitar apoyo y por qué',
    ninguno: 'Ningún alumno de esta clase tiene alerta del modelo.',
    alumnoN: (id: number) => `Alumno ${id}`,
    combinacion: 'Combinación de varios factores pequeños',
    orden: 'Ordenados por número de alumno, no por gravedad. La decisión es siempre del profesor.',
  },

  misAcciones: {
    titulo: 'Seguimiento de alertas',
    pestanaRevisiones: (n: number) => `Próximas revisiones (${n})`,
    pestanaDescartes: (n: number) => `Descartes (${n})`,
    cargando: 'Cargando registros...',
    sinAcciones: 'Todavía no has registrado ninguna acción.',
    hecha: 'Hecha',
    enSeguimiento: 'En seguimiento',
    revisarEl: (f: string) => `Revisar el ${f}`,
    alertaNoDisponible: 'Alerta no disponible',
    resultado: 'Resultado:',
    marcarHecha: 'Marcar como hecha y anotar el resultado',
    preguntaResultado: '¿Cómo ha ido? (queda registrado)',
    sinDescartes: 'No has descartado ninguna alerta.',
    descartada: 'Descartada',
    motivo: (m: string) => `Motivo: ${m}`,
    reabrir: 'Reabrir alerta',
    confirmarReabrir: 'La alerta volverá a estar pendiente y aparecerá de nuevo en Inicio. ¿Continuar?',
  },

  evolucion: {
    titulo: 'Cómo ha evolucionado la clase',
    privacidad: 'No se muestra la evolución de grupos de menos de 5 alumnos para proteger su privacidad.',
    terminado: 'Seguimiento retrospectivo: así terminó el curso. Medias de la clase en cada trimestre.',
    enMarcha: 'Curso en marcha: medias de la clase en cada trimestre registrado.',
    notas: 'Notas (sobre 10)',
    partAsis: 'Participación (sobre 10) y asistencia (%)',
    examen: 'Examen',
    practicas: 'Prácticas*',
    participacion: 'Participación*',
    asistencia: 'Asistencia*',
    sintetica: '* Variable sintética en esta demo. La nota de examen de Portugués y Matemáticas es real.',
    acertaron: '¿Acertaron los avisos del 1.º trimestre?',
    cuandoTermine: 'Se podrá comprobar cuando termine el curso.',
    gruposPequenos: 'No se muestra en grupos de menos de 5 alumnos.',
    // n en negrita: se pasa ya como elemento
    avisados: (avisados: number, aciertos: number, B: (n: number) => React.ReactNode) => {
      if (avisados === 0) return <>Brújula no avisó de ningún alumno de esta clase en el 1.º trimestre.</>;
      if (avisados === 1) return <>Brújula avisó de {B(1)} alumno en el 1.º trimestre: {aciertos === 1 ? 'acabó necesitando apoyo.' : 'no acabó necesitando apoyo.'}</>;
      const final = aciertos === 0 ? 'ninguno acabó necesitando apoyo.'
        : aciertos === avisados ? 'todos acabaron necesitando apoyo.'
        : aciertos === 1 ? <>{B(1)} acabó necesitando apoyo.</>
        : <>{B(aciertos)} acabaron necesitando apoyo.</>;
      return <>Brújula avisó de {B(avisados)} alumnos en el 1.º trimestre: {final}</>;
    },
    necesitaron: (necesitaron: number, aciertos: number, B: (n: number) => React.ReactNode) => {
      if (necesitaron === 0) return <>Ningún alumno de esta clase terminó el curso por debajo de 5.</>;
      if (necesitaron === 1) return <>{B(1)} alumno terminó el curso necesitando apoyo: {aciertos === 1 ? 'estaba avisado a tiempo.' : 'no estaba avisado.'}</>;
      const final = aciertos === 0 ? 'ninguno estaba avisado.'
        : aciertos === necesitaron ? 'todos estaban avisados a tiempo.'
        : aciertos === 1 ? <>{B(1)} estaba avisado a tiempo.</>
        : <>{B(aciertos)} estaban avisados a tiempo.</>;
      return <>{B(necesitaron)} alumnos terminaron el curso necesitando apoyo: {final}</>;
    },
    definicion: '«Necesitar apoyo» es terminar el curso con menos de 5 sobre 10 en el examen. Los avisos se calcularon sin que el modelo viera a estos alumnos al entrenar.',
    menosValor: (asignatura: string) => ` En ${asignatura}, todas las notas son sintéticas: esta comprobación tiene menos valor.`,
  },

  importar: {
    titulo: (falta: number | undefined) => (falta ? `Añadir datos del ${falta}.º trimestre` : 'Actualizar datos de un trimestre'),
    intro: 'Descarga la plantilla, rellénala en Excel y súbela. Brújula revisa los datos antes de guardar nada.',
    trimestre: 'Trimestre',
    plantilla: 'Descargar plantilla',
    importar: 'Importar .csv',
    resumen: (guardadas: number, total: number, detalle: string) =>
      `${guardadas} ${guardadas === 1 ? 'alumno guardado' : 'alumnos guardados'}, `
      + `${total === 0 ? 'ninguna alerta nueva' : `${total} ${total === 1 ? 'alerta nueva' : 'alertas nuevas'}`}`
      + `${detalle ? ` (${detalle})` : ''}.`,
    archivo: (n: number, periodo: number) => ` · ${n} ${n === 1 ? 'alumno' : 'alumnos'} del ${periodo}.º trimestre`,
    conProblemas: (n: number) => ` · ${n} ${n === 1 ? 'fila con problemas' : 'filas con problemas'}: corrígelas en el archivo y vuelve a importarlo.`,
    sinProblemas: ' · sin problemas.',
    columnas: ['Línea', 'Alumno', 'Examen', 'Prácticas', 'Participación', 'Asistencia', 'Faltas', 'Revisión'],
    correcta: 'Correcta',
    guardar: 'Guardar',
    guardando: 'Guardando…',
    cancelar: 'Cancelar',
    // Validación del CSV
    campos: {
      nota_examen: 'la nota de examen', nota_practicas: 'la nota de prácticas', participacion: 'la participación',
      asistencia: 'la asistencia', faltas: 'el número de faltas',
    } as Record<string, string>,
    faltaColumna: (cols: string[]) => (cols.length === 1 ? `Falta la columna ${cols[0]}` : `Faltan las columnas ${cols.join(', ')}`),
    usaPlantilla: '. Usa la plantilla para no equivocarte con las columnas.',
    sinId: 'Falta el número de alumno (alumno_id) o no es válido.',
    noEsDeLaClase: 'Este alumno no pertenece a la clase.',
    repetido: 'El alumno aparece más de una vez en el archivo.',
    otroTrimestre: (p: number, periodo: number) => `Esta fila es del ${p}.º trimestre, pero estás importando el ${periodo}.º.`,
    todoVacio: 'Faltan todos los datos de este alumno.',
    falta: (campo: string) => `Falta ${campo}.`,
    noNumero: (campo: string) => `${campo} no es un número.`,
    faltasEnteras: 'Las faltas deben ser un número entero, 0 o más.',
    rango: (campo: string, max: number) => `${campo} debe estar entre 0 y ${max}.`,
    vacio: 'El archivo no tiene alumnos.',
  },
};

export default es;
