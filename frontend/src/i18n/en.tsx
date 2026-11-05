// English. Same keys as es.tsx.
import type { Diccionario } from '.';

const en: Diccionario = {
  comun: {
    idioma: 'Language',
    entrar: 'Sign in',
    probarDemo: 'Try the demo',
    clase: (curso: number, letra: string) => `Grade ${curso}${letra}`,
    asignaturas: { Portugués: 'Portuguese', Matemáticas: 'Maths', Inglés: 'English', Ciencias: 'Science' },
  },

  marco: {
    menu: { modelo: 'The model', recursos: 'Low-resource schools', llega: 'How it reaches schools' },
    apartados: 'Sections',
    cierre: 'See it with sample data, nothing to install.',
    pie1: 'Project for #hack4edu 2026, ProFuturo challenge 13. Open source under the MIT licence.',
    pie2: 'Data: Student Performance dataset (P. Cortez and A. Silva, UCI, CC BY 4.0), extended with synthetic data. Student and teacher names are fictitious.',
  },

  portada: {
    titulo: 'No student should need support without anyone seeing it coming.',
    intro: 'Brújula turns the data a school already has into clear alerts for teachers, with the reason behind each alert and room to decide what to do.',
    ejemplo: {
      aria: 'Example of the app with fictitious data',
      ventana: 'Brújula · Portuguese',
      prioridadAlta: 'High priority',
      podriaApoyo: 'May need support',
      titulo: 'May need support in Portuguese',
      alumna: 'Student in Grade 4C · fictitious example',
      porQue: 'Why it was flagged:',
      notaPrimer: 'First-term grade',
      nota: '4.5',
      asistencia: 'Attendance',
      registrar: 'Log an action',
      descartar: 'Dismiss with a reason',
    },
    acceso: {
      titulo: 'Sign in to the demo',
      correo: 'Email',
      contrasena: 'Password',
      error: 'Incorrect email or password.',
      pista: 'Try profesor.gp@example.com or director.gp@example.com. All student names are fictitious.',
    },
    comoFunciona: 'How it works.',
    comoFuncionaSub: 'Three steps, and the teacher decides.',
    pasos: [
      { titulo: 'The school already has the data', texto: 'Grades, attendance, practical work and participation.' },
      { titulo: 'Brújula alerts and explains', texto: 'Who may need support and which data point to it.' },
      { titulo: 'The teacher decides', texto: 'Act on the alert, or dismiss it with a reason.' },
    ],
  },

  elModelo: {
    titulo: 'Inside the model',
    entradilla: 'At the end of each term, Brújula estimates for every student and subject whether they may need support to pass, and why, plus their final grade with a margin.',
    usa: 'It uses:',
    datosQueUsa: 'Grades, absences, attendance, practical work, participation and study time.',
    comoAcierta: 'How accurate it is',
    deCadaDiez: (n: number) => `${n} in 10`,
    cifra1: 'students who end up needing support get an alert at the end of the first term.',
    cifra2: 'alerts are for students who really do end up needing support.',
    puntos: '0.5 points',
    cifra3: 'is the average error of the estimated grade, out of 10. The margin contains the real grade 8 times out of 10.',
    nota: 'Figures measured with data from two Portuguese secondary schools (2005-06 school year), extended with synthetic data. Before using it in a school, it must be retrained with that school’s own data.',
    noHace: 'What Brújula does not do',
    limites: [
      { titulo: 'No automatic decisions', texto: 'Every alert ends in a human decision, and who made it is recorded.' },
      { titulo: 'No rankings', texto: 'No lists of best and worst students, and no risk percentages per student.' },
      { titulo: 'Only what is needed', texto: 'No family, financial or personal-habit data is stored.' },
      { titulo: 'Everyone sees their own', texto: 'A teacher only sees their own classes and subjects. School leaders, their school.' },
    ],
  },

  pocosRecursos: {
    titulo: 'Designed for low-resource schools',
    entradilla: 'Where there are fewer counsellors and more students per teacher, spotting in time who is falling behind is both harder and more important.',
    p1: 'Brújula needs no sensors, expensive platforms or technical staff.',
    p2: 'It also works for schools with limited access: all it takes is a browser, on a computer or a phone.',
    ventajas: [
      { titulo: 'Data that already exists.', texto: 'Grades and attendance are enough to start.' },
      { titulo: 'Nothing to install.', texto: 'It runs in the browser, on phones too.' },
      { titulo: 'Zero infrastructure cost', texto: 'to start, using free-tier services.' },
      { titulo: 'It checks that it is fair.', texto: 'It measures whether the model is equally accurate for girls and boys, rural and urban students, and across schools.' },
    ],
    movil: {
      cabecera: 'Portuguese · Grade 4C',
      prioridadAlta: 'High priority',
      podriaApoyo: 'May need support',
      asistencia: 'Attendance',
      prioridadMedia: 'Medium priority',
      bajaParticipacion: 'Participation is dropping',
      grupo: 'Class Grade 4C',
    },
  },

  comoLlega: {
    titulo: 'How it reaches schools',
    intro: 'Brújula is free for those who need it most. It is funded by those who run many schools.',
    niveles: [
      { para: 'Public schools and schools in vulnerable settings', condicion: 'Free', incluye: 'Every feature for their school.' },
      { para: 'School networks and education authorities', condicion: 'Paid', incluye: 'Several schools at once, reports and support.' },
      { para: 'Education foundations and NGOs', condicion: 'Roll-out', incluye: 'They bring it to the schools they work with and help get it running.' },
    ],
    proximos: 'Next steps',
    hojaDeRuta: [
      'Import grades from Excel.',
      'Translations reviewed by teachers from each country.',
    ],
  },

  comoFunciona: {
    titulo: 'How Brújula works',
    tituloDetalle: 'For those who want the details',
    intro: 'What data it uses, how we chose the model and how we check that it is fair to every student.',
    cifras: [
      { valor: '84%', texto: 'of the students who will need support, detected at the end of the first term' },
      { valor: '23', texto: 'fewer false alarms than the rule “fails the first term”, while detecting the same students' },
      { valor: '14', texto: 'students who pass the first term and will still need support: the rule misses them' },
    ],
    datos: {
      titulo: 'The data',
      p1: <>The base is real: <strong>674 students</strong> from two Portuguese secondary schools (UCI Student Performance dataset, CC BY 4.0), with their grades for three terms, absences and background.</>,
      p2: <>For the demo we added <strong>synthetic</strong> data: classes, teachers, English and Science, plus practical-work grades, participation and attendance per term, generated from the real grades. That is why they are marked with an asterisk. We measured it: without them, the model still gives 14 fewer false alarms than the grade rule.</>,
    },
    noUsa: {
      titulo: 'What the model does not use',
      p1: 'It does not use alcohol consumption, romantic or family relationships, or parents’ education or jobs: flagging a student for them would be stigmatising. Sex, area and school are not model inputs either; they are only used to audit it.',
      p2: 'Nor does it use second- and third-term grades: the alert is generated with what is known at the end of the first.',
    },
    eleccion: {
      titulo: 'How we chose the model',
      p1: 'We compared 7 model combinations, all detecting the same students as the rule “fails the first term” (299 alerts), and chose the one with the fewest false alarms.',
      columnas: ['Model', 'Quality (PR-AUC)', 'Correct', 'Alerts', 'Students the rule misses'],
      elegido: ' (chosen)',
      logistica: 'Logistic',
      redNeuronal: 'Neural network',
      p2: <>The <strong>neural network</strong> is used where it is best: estimating the final grade, with an average error of 0.53 points out of 10 (versus 1.08 for Ridge and 1.13 for the rule “the final grade will match the first term”) and an interval that is right 80% of the time.</>,
    },
    equidad: {
      titulo: 'Model fairness',
      p1: 'We measured whether the model is equally accurate for every group.',
      columnas: ['Group', 'Students', 'Detected', 'False alarms'],
      grupos: { chicas: 'Girls', chicos: 'Boys', rural: 'Rural area', urbana: 'Urban area', gp: 'GP school', ms: 'MS school' },
      p2: <>It detects every group equally well, but gives more false alarms in rural areas. We did not correct this with a different threshold per area, because the decision would then depend on where the student lives. That is why <strong>no alert decides anything</strong>: teachers review it and can dismiss it with a reason.</>,
    },
    noHace: {
      titulo: 'What Brújula does not do',
      p1: 'It does not label students, does not show risk scores or rankings, and makes no automatic decisions. Alerts guide; the decision always rests with the teacher.',
    },
  },
};

export default en;
