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
};

export default es;
