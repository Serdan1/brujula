// Français. Mêmes clés que es.tsx.
import type { Diccionario } from '.';

// 4.º, 5.º y 6.º de Primaria en España equivalen por edad a CM1, CM2 y 6e en Francia
const NIVEAUX: Record<number, string> = { 4: 'CM1', 5: 'CM2', 6: '6e' };

const fr: Diccionario = {
  comun: {
    idioma: 'Langue',
    entrar: 'Se connecter',
    probarDemo: 'Essayer la démo',
    clase: (curso: number, letra: string) => `${NIVEAUX[curso] ?? `${curso}e`} ${letra}`,
    asignaturas: { Portugués: 'Portugais', Matemáticas: 'Mathématiques', Inglés: 'Anglais', Ciencias: 'Sciences' },
  },

  marco: {
    menu: { modelo: 'Le modèle', recursos: 'Peu de moyens', llega: 'Comment il arrive' },
    apartados: 'Rubriques',
    cierre: 'Découvrez-le avec des données d’exemple, sans rien installer.',
    pie1: 'Projet pour #hack4edu 2026, défi 13 de ProFuturo. Code ouvert sous licence MIT.',
    pie2: 'Données : jeu de données Student Performance (P. Cortez et A. Silva, UCI, CC BY 4.0), complété par des données synthétiques. Les noms des élèves et des enseignants sont fictifs.',
  },

  portada: {
    titulo: 'Qu’aucun élève n’ait besoin d’aide sans que personne ne le voie venir.',
    intro: 'Brújula transforme les données dont l’école dispose déjà en alertes claires pour les enseignants, avec la raison de chaque alerte et la place pour décider quoi faire.',
    ejemplo: {
      aria: 'Exemple de l’application avec des données fictives',
      ventana: 'Brújula · Portugais',
      prioridadAlta: 'Priorité haute',
      podriaApoyo: 'Pourrait avoir besoin d’aide',
      titulo: 'Pourrait avoir besoin d’aide en portugais',
      alumna: 'Élève de CM1 C · exemple fictif',
      porQue: 'Pourquoi cette alerte :',
      notaPrimer: 'Note du 1er trimestre',
      nota: '4,5',
      asistencia: 'Assiduité',
      registrar: 'Enregistrer une action',
      descartar: 'Écarter avec un motif',
    },
    acceso: {
      titulo: 'Accéder à la démo',
      correo: 'E-mail',
      contrasena: 'Mot de passe',
      error: 'E-mail ou mot de passe incorrect.',
      pista: 'Essayez avec profesor.gp@example.com ou director.gp@example.com. Tous les noms d’élèves sont fictifs.',
    },
    comoFunciona: 'Comment ça marche.',
    comoFuncionaSub: 'Trois étapes, et c’est l’enseignant qui décide.',
    pasos: [
      { titulo: 'L’école a déjà les données', texto: 'Notes, assiduité, travaux pratiques et participation.' },
      { titulo: 'Brújula alerte et explique', texto: 'Qui pourrait avoir besoin d’aide et quelles données l’indiquent.' },
      { titulo: 'L’enseignant décide', texto: 'Il agit ou écarte l’alerte avec un motif.' },
    ],
  },

  elModelo: {
    titulo: 'Le modèle, de l’intérieur',
    entradilla: 'À la fin de chaque trimestre, Brújula estime pour chaque élève et chaque matière s’il pourrait avoir besoin d’aide pour réussir, et pourquoi, ainsi que sa note finale avec une marge.',
    usa: 'Il utilise :',
    datosQueUsa: 'Notes, absences, assiduité, travaux pratiques, participation et temps d’étude.',
    comoAcierta: 'Sa fiabilité',
    deCadaDiez: (n: number) => `${n} sur 10`,
    cifra1: 'élèves qui finissent par avoir besoin d’aide reçoivent une alerte à la fin du 1er trimestre.',
    cifra2: 'alertes concernent des élèves qui ont vraiment fini par avoir besoin d’aide.',
    puntos: '0,5 point',
    cifra3: 'c’est l’écart moyen de la note estimée, sur 10. La marge contient la note réelle 8 fois sur 10.',
    nota: 'Chiffres mesurés avec les données de deux lycées portugais (année scolaire 2005-06), complétées par des données synthétiques. Avant de l’utiliser dans une école, il faut le réentraîner avec ses propres données.',
    noHace: 'Ce que Brújula ne fait pas',
    limites: [
      { titulo: 'Pas de décision automatique', texto: 'Chaque alerte aboutit à une décision humaine, et on garde la trace de qui l’a prise.' },
      { titulo: 'Pas de classement', texto: 'Pas de listes des meilleurs et des moins bons élèves, ni de pourcentage de risque par élève.' },
      { titulo: 'Le strict nécessaire', texto: 'Aucune donnée familiale, économique ou sur les habitudes personnelles n’est conservée.' },
      { titulo: 'Chacun voit ce qui le concerne', texto: 'Un enseignant ne voit que ses classes et ses matières. La direction, son établissement.' },
    ],
  },

  pocosRecursos: {
    titulo: 'Pensé pour les écoles qui ont peu de moyens',
    entradilla: 'Là où il y a moins de conseillers et plus d’élèves par enseignant, repérer à temps qui décroche est à la fois plus difficile et plus important.',
    p1: 'Brújula ne demande ni capteurs, ni plateformes coûteuses, ni personnel technique.',
    p2: 'Il convient aussi aux écoles qui ont un accès limité au numérique : un navigateur suffit, sur ordinateur ou sur téléphone.',
    ventajas: [
      { titulo: 'Des données qui existent déjà.', texto: 'Les notes et l’assiduité suffisent pour commencer.' },
      { titulo: 'Rien à installer.', texto: 'Il fonctionne dans le navigateur, y compris sur téléphone.' },
      { titulo: 'Zéro coût d’infrastructure', texto: 'pour démarrer, avec des services en offre gratuite.' },
      { titulo: 'Il vérifie qu’il est équitable.', texto: 'Il mesure si le modèle est aussi fiable pour les filles et les garçons, les élèves ruraux et urbains, et d’une école à l’autre.' },
    ],
    movil: {
      cabecera: 'Portugais · CM1 C',
      prioridadAlta: 'Priorité haute',
      podriaApoyo: 'Pourrait avoir besoin d’aide',
      asistencia: 'Assiduité',
      prioridadMedia: 'Priorité moyenne',
      bajaParticipacion: 'La participation baisse',
      grupo: 'Classe de CM1 C',
    },
  },

  comoLlega: {
    titulo: 'Comment il arrive dans les écoles',
    intro: 'Brújula est gratuit pour ceux qui en ont le plus besoin. Il est financé par ceux qui gèrent de nombreuses écoles.',
    niveles: [
      { para: 'Écoles publiques et en contexte vulnérable', condicion: 'Gratuit', incluye: 'Toutes les fonctions pour leur école.' },
      { para: 'Réseaux d’écoles et administrations de l’éducation', condicion: 'Payant', incluye: 'Plusieurs écoles à la fois, rapports et assistance.' },
      { para: 'Fondations et ONG éducatives', condicion: 'Déploiement', incluye: 'Elles l’apportent aux écoles qu’elles accompagnent et aident à le mettre en place.' },
    ],
    proximos: 'Prochaines étapes',
    hojaDeRuta: [
      'Importer les notes depuis Excel.',
      'Traductions relues par des enseignants de chaque pays.',
    ],
  },

  comoFunciona: {
    titulo: 'Comment fonctionne Brújula',
    tituloDetalle: 'Pour ceux qui veulent le détail',
    intro: 'Quelles données il utilise, comment nous avons choisi le modèle et comment nous vérifions qu’il est équitable envers tous les élèves.',
    cifras: [
      { valor: '84 %', texto: 'des élèves qui auront besoin d’aide, repérés à la fin du 1er trimestre' },
      { valor: '23', texto: 'fausses alertes de moins que la règle « échoue au 1er trimestre », en repérant les mêmes élèves' },
      { valor: '14', texto: 'élèves qui réussissent le 1er trimestre et auront pourtant besoin d’aide : la règle ne les voit pas' },
    ],
    datos: {
      titulo: 'Les données',
      p1: <>La base est réelle : <strong>674 élèves</strong> de deux lycées portugais (jeu de données Student Performance de l’UCI, CC BY 4.0), avec leurs notes sur trois trimestres, leurs absences et leur contexte.</>,
      p2: <>Pour la démo, nous avons ajouté des données <strong>synthétiques</strong> : classes, enseignants, anglais et sciences, ainsi que la note de travaux pratiques, la participation et l’assiduité par trimestre, générées à partir des notes réelles. C’est pourquoi elles sont marquées d’un astérisque. Nous l’avons mesuré : sans elles, le modèle donne toujours 14 fausses alertes de moins que la règle des notes.</>,
    },
    noUsa: {
      titulo: 'Ce que le modèle n’utilise pas',
      p1: 'Il n’utilise ni la consommation d’alcool, ni les relations amoureuses ou familiales, ni les études ou le métier des parents : signaler un élève pour ces raisons serait stigmatisant. Le sexe, la zone et l’école n’entrent pas non plus dans le modèle ; ils ne servent qu’à l’auditer.',
      p2: 'Il n’utilise pas non plus les notes des 2e et 3e trimestres : l’alerte est générée avec ce que l’on sait à la fin du premier.',
    },
    eleccion: {
      titulo: 'Comment nous avons choisi le modèle',
      p1: 'Nous avons comparé 7 combinaisons de modèles, toutes repérant les mêmes élèves que la règle « échoue au 1er trimestre » (299 alertes), et retenu celle qui donne le moins de fausses alertes.',
      columnas: ['Modèle', 'Qualité (PR-AUC)', 'Justes', 'Alertes', 'Élèves que la règle ne voit pas'],
      elegido: ' (retenu)',
      logistica: 'Logistique',
      redNeuronal: 'Réseau de neurones',
      p2: <>Le <strong>réseau de neurones</strong> est utilisé là où il est le meilleur : estimer la note finale, avec une erreur moyenne de 0,53 point sur 10 (contre 1,08 pour Ridge et 1,13 pour la règle « la note finale sera celle du 1er trimestre ») et un intervalle juste 80 % du temps.</>,
    },
    equidad: {
      titulo: 'Équité du modèle',
      p1: 'Nous avons mesuré si le modèle est aussi fiable pour tous les groupes.',
      columnas: ['Groupe', 'Élèves', 'Repérés', 'Fausses alertes'],
      grupos: { chicas: 'Filles', chicos: 'Garçons', rural: 'Zone rurale', urbana: 'Zone urbaine', gp: 'École GP', ms: 'École MS' },
      p2: <>Il repère aussi bien tous les groupes, mais donne plus de fausses alertes en zone rurale. Nous ne l’avons pas corrigé avec un seuil différent selon la zone, car la décision dépendrait alors du lieu où vit l’élève. C’est pourquoi <strong>aucune alerte ne décide rien</strong> : les enseignants la vérifient et peuvent l’écarter avec un motif.</>,
    },
    noHace: {
      titulo: 'Ce que Brújula ne fait pas',
      p1: 'Il n’étiquette pas les élèves, n’affiche ni score de risque ni classement, et ne prend aucune décision automatique. Les alertes orientent ; la décision revient toujours à l’enseignant.',
    },
  },

  app: {
    cargando: 'Chargement...',
    cerrarSesion: 'Se déconnecter',
    volverInicio: '← Accueil',
    volverAsignatura: '← Retour à la matière',
    volverClase: '← Retour à la classe',
    proximasRevisiones: 'Prochains suivis',
    prioridadAlta: 'Priorité haute',
    prioridadMedia: 'Priorité moyenne',
    modoClaro: '☀️ Mode clair',
    modoOscuro: '🌙 Mode sombre',
    modoClaroAria: 'Passer en mode clair',
    modoOscuroAria: 'Passer en mode sombre',
    alumnos: (n: number) => `${n} ${n === 1 ? 'élève' : 'élèves'}`,
    alertasPendientes: (n: number) => `${n} ${n === 1 ? 'alerte en attente' : 'alertes en attente'}`,
    trimestre: (n: number) => (n === 1 ? '1er trimestre' : `${n}e trimestre`),
    sinteticaUna: '* Variable synthétique dans cette démo.',
    comoFuncionaPregunta: 'Comment le modèle a-t-il été choisi, quelles données utilise-t-il et est-il équitable envers tous les élèves ?',
    comoFuncionaEnlace: 'Comment fonctionne Brújula →',
    si: 'Oui',
    no: 'Non',
  },

  motivos: {
    riesgo_de_suspenso: { corto: 'Pourrait avoir besoin d’aide', grupo: (n: number) => (n === 1 ? 'pourrait avoir besoin d’aide' : 'pourraient avoir besoin d’aide') },
    faltas_en_aumento: { corto: 'Assiduité faible', grupo: () => 'avec une assiduité faible' },
    practicas_por_debajo: { corto: 'Travaux pratiques sous la moyenne', grupo: () => 'avec des travaux pratiques sous la moyenne' },
    baja_participacion: { corto: 'Participation faible', grupo: () => 'avec une participation faible' },
    bajada_de_notas: { corto: 'Notes en baisse', grupo: () => 'avec des notes en baisse' },
    grupo_por_debajo_de_la_media: { corto: 'Classe au-dessus de la moyenne d’alertes', grupo: () => 'dans des classes au-dessus de la moyenne' },
  },

  tiposAccion: {
    tutoría: 'Entretien avec l’élève',
    reunión_familia: 'Rencontre avec la famille',
    refuerzo: 'Exercices de soutien',
    seguimiento: 'Suivi en classe',
  },

  tarjeta: {
    revisada: 'Vue',
    verEnClase: 'Voir dans la classe →',
    loReviso: 'Je m’en occupe',
    registrar: 'Enregistrer une action',
    descartar: 'Écarter avec un motif',
    preguntaDescarte: 'Pourquoi écartez-vous cette alerte ? (ce sera enregistré)',
  },

  formulario: {
    titulo: 'Enregistrer une action',
    placeholder: 'Ce que vous allez faire...',
    fechaRevision: 'Date de suivi',
    nota: 'La décision vous appartient : Brújula ne fait que proposer. L’action est enregistrée.',
    cancelar: 'Annuler',
    guardar: 'Enregistrer',
    guardando: 'Enregistrement...',
  },

  errores: {
    revisar: 'Impossible de marquer comme vue : ',
    descartar: 'Impossible d’écarter : ',
    sinPerfil: 'Votre profil d’enseignant est introuvable.',
    guardarAccion: 'Erreur lors de l’enregistrement de l’action : ',
    guardar: 'Impossible d’enregistrer : ',
    reabrir: 'Impossible de rouvrir : ',
    informe: 'Le rapport n’est pas encore disponible. Il est généré lors de la publication des résultats du modèle.',
  },

  informe: {
    descargar: 'Télécharger le rapport (PDF)',
    centro: 'Rapport de l’établissement (PDF)',
    abriendo: 'Ouverture...',
  },

  inicio: {
    panel: 'Espace enseignant',
    hola: (nombre: string) => (nombre ? `Bonjour, ${nombre}` : 'Bonjour'),
    intro: 'Consultez les alertes et assurez le suivi de vos élèves.',
    indPendientes: 'Alertes élèves en attente',
    indAltas: 'Alertes de priorité haute',
    indAsignaturas: 'Mes matières',
    importante: 'Le plus important',
    importanteSub: 'Les situations à examiner en premier',
    etiquetaPendientes: 'Alertes en attente',
    cargandoAlertas: 'Chargement des alertes...',
    sinAlertas: 'Aucune alerte en attente.',
    frase: (n: number, grupo: string, asignatura: string) => `${n} ${n === 1 ? 'élève' : 'élèves'} ${grupo} en ${asignatura.toLowerCase()}`,
    conAlta: (n: number) => `dont ${n} en priorité haute`,
    asignaturas: 'Mes matières',
    asignaturasSub: 'Accédez à vos classes et à leur suivi',
  },

  director: {
    cabecera: (escuela: string) => `Direction · ${escuela} · données du 1er trimestre`,
    conAlerta: 'Élèves avec au moins une alerte',
    de: (n: number) => `sur ${n}`,
    conAlertaNota: 'Toutes matières confondues, sans compter deux fois le même élève',
    conAlta: 'Priorité haute',
    alumnos: 'élèves',
    conAltaNota: 'Leurs enseignants devraient les examiner en premier',
    acciones: 'Actions de suivi enregistrées',
    accionesNota: 'Entretiens, rencontres avec les familles, soutien et suivis décidés par les enseignants',
    avisosGrupo: 'Alertes de classe',
    porAsignatura: 'Par matière',
    columnas: ['Matière', 'Classes', 'Élèves', 'Note moyenne', 'Assiduité*', 'Élèves avec alerte'],
    notaTabla: '* Données synthétiques dans cette démo. Seuls les groupes de 5 élèves ou plus sont affichés.',
    clases: 'Classes',
    pendientes: (n: number) => `${n} en attente`,
  },

  asignatura: {
    misClases: 'Mes classes',
    cargandoClases: 'Chargement des classes...',
    avisosGrupo: 'Alertes de classe',
    alertasAlumnos: (n: number) => `Alertes élèves (${n})`,
    cargandoAlertas: 'Chargement des alertes...',
    sinAlertas: 'Aucune alerte élève.',
    desplegar: (n: number) => `${n} ${n === 1 ? 'alerte' : 'alertes'} · cliquez pour déplier`,
    alumno: 'Élève',
    pendiente: 'en attente',
    revisada: 'vue',
  },

  clase: {
    soloLectura: 'Vue de la direction (lecture seule). Les actions sont enregistrées par l’enseignant de la matière.',
    resumen: (alumnos: number, conAlerta: number) => `${alumnos} ${alumnos === 1 ? 'élève' : 'élèves'} · ${conAlerta} avec au moins une alerte · données du 1er trimestre`,
    analisis: 'Analyse complète de la classe →',
    columnas: ['Élève (fictif)', 'Examen', 'TP*', 'Participation*', 'Assiduité*', 'Alertes'],
    cargandoAlumnos: 'Chargement des élèves...',
    nota: '* Variables synthétiques dans cette démo. Le tableau n’est pas trié par résultats. Cliquez sur un élève pour voir sa fiche.',
  },

  alumno: {
    estudio: { 1: 'Moins de 2 h', 2: 'De 2 à 5 h', 3: 'De 5 à 10 h', 4: 'Plus de 10 h' },
    trayecto: { 1: 'Moins de 15 min', 2: 'De 15 à 30 min', 3: 'De 30 à 60 min', 4: 'Plus d’1 h' },
    sinAcceso: 'Vous n’avez pas accès aux données de cet élève dans cette matière.',
    edad: (n: number) => `${n} ans`,
    subtitulo: 'données du 1er trimestre · élève fictif',
    frenteClase: '1er trimestre par rapport à la classe',
    frenteClaseNota: 'La ligne verticale indique la moyenne de la classe. En orange, ce qui est en dessous.',
    mediaClase: 'moyenne de la classe',
    examen: 'Examen',
    practicas: 'Travaux pratiques',
    participacion: 'Participation',
    asistencia: 'Assiduité',
    notaEstimada: 'Note finale estimée',
    valorCentral: 'Valeur centrale :',
    estimadaNota: 'Estimation du réseau de neurones à partir des données du 1er trimestre. Pour 8 élèves sur 10, la note réelle se situe dans cette fourchette. C’est indicatif : ni une note, ni une prévision certaine.',
    sinEstimacion: 'Aucune estimation disponible.',
    alertas: 'Alertes',
    sinAlertas: (asignatura: string) => `Cet élève n’a pas d’alerte en ${asignatura.toLowerCase()}.`,
    contexto: 'Contexte',
    ctxEstudio: 'Temps d’étude hebdomadaire',
    ctxSuspensos: 'Redoublements antérieurs',
    ctxTrayecto: 'Temps de trajet',
    ctxApoyo: 'Soutien scolaire de l’établissement',
    ctxActividades: 'Activités extrascolaires',
    sinContexto: 'Pas de données de contexte.',
    contextoNota: 'Données réelles du jeu de données de l’UCI. Aucune donnée de santé, de loisirs ou familiale n’est affichée.',
    acciones: 'Actions enregistrées',
    sinAcciones: 'Vous n’avez encore enregistré aucune action avec cet élève.',
    desde: (f: string) => `Depuis le ${f}`,
    revisarEl: (f: string) => ` · suivi le ${f}`,
    resultado: (r: string) => ` · résultat : ${r}`,
  },

  analisis: {
    cargando: 'Chargement de l’analyse...',
    noDisponible: 'Analyse non disponible pour cette classe.',
    titulo: (clase: string, asignatura: string) => `Analyse complète · ${clase} · ${asignatura}`,
    intro: 'Résultats du modèle à la fin du 1er trimestre. Ce sont des estimations pour orienter, pas des diagnostics.',
    podrianApoyo: 'Pourraient avoir besoin d’aide',
    deTotal: (total: number, pct: string) => `sur ${total} (${pct})`,
    conAlta: 'Priorité haute',
    revisarPrimero: 'À examiner en premier',
    notaMedia: 'Note finale estimée moyenne',
    errorMedio: (e: string) => `Réseau de neurones · erreur moyenne ±${e} point`,
    pesa: 'Ce qui pèse le plus dans les alertes de cette classe',
    pesaNota: 'Contribution moyenne de chaque variable au modèle (SHAP). Elle indique ce que regarde le modèle, pas la cause du résultat.',
    pesaSintetica: '* Variable synthétique dans cette démo : son poids reflète la façon dont elle a été générée à partir des notes, ce n’est pas un résultat.',
    porQue: 'Élèves qui pourraient avoir besoin d’aide, et pourquoi',
    ninguno: 'Aucun élève de cette classe n’a d’alerte du modèle.',
    alumnoN: (id: number) => `Élève ${id}`,
    combinacion: 'Une combinaison de plusieurs petits facteurs',
    orden: 'Triés par numéro d’élève, pas par gravité. La décision revient toujours à l’enseignant.',
  },

  misAcciones: {
    titulo: 'Suivi des alertes',
    pestanaRevisiones: (n: number) => `Prochains suivis (${n})`,
    pestanaDescartes: (n: number) => `Écartées (${n})`,
    cargando: 'Chargement des enregistrements...',
    sinAcciones: 'Vous n’avez encore enregistré aucune action.',
    hecha: 'Terminée',
    enSeguimiento: 'En cours',
    revisarEl: (f: string) => `Suivi le ${f}`,
    alertaNoDisponible: 'Alerte non disponible',
    resultado: 'Résultat :',
    marcarHecha: 'Marquer comme terminée et noter le résultat',
    preguntaResultado: 'Comment cela s’est-il passé ? (ce sera enregistré)',
    sinDescartes: 'Vous n’avez écarté aucune alerte.',
    descartada: 'Écartée',
    motivo: (m: string) => `Motif : ${m}`,
    reabrir: 'Rouvrir l’alerte',
    confirmarReabrir: 'L’alerte repassera en attente et réapparaîtra sur l’accueil. Continuer ?',
  },

  evolucion: {
    titulo: 'Comment la classe a évolué',
    privacidad: 'L’évolution n’est pas affichée pour les groupes de moins de 5 élèves, afin de protéger leur vie privée.',
    terminado: 'Bilan rétrospectif : voici comment l’année s’est terminée. Moyennes de la classe à chaque trimestre.',
    enMarcha: 'Année en cours : moyennes de la classe à chaque trimestre enregistré.',
    notas: 'Notes (sur 10)',
    partAsis: 'Participation (sur 10) et assiduité (%)',
    examen: 'Examen',
    practicas: 'TP*',
    participacion: 'Participation*',
    asistencia: 'Assiduité*',
    sintetica: '* Variable synthétique dans cette démo. La note d’examen de portugais et de mathématiques est réelle.',
    acertaron: 'Les alertes du 1er trimestre étaient-elles justes ?',
    cuandoTermine: 'On pourra le vérifier à la fin de l’année.',
    gruposPequenos: 'Non affiché pour les groupes de moins de 5 élèves.',
    avisados: (avisados: number, aciertos: number, B: (n: number) => React.ReactNode) => {
      if (avisados === 0) return <>Brújula n’a signalé aucun élève de cette classe au 1er trimestre.</>;
      if (avisados === 1) return <>Brújula a signalé {B(1)} élève au 1er trimestre : {aciertos === 1 ? 'il a fini par avoir besoin d’aide.' : 'il n’a pas eu besoin d’aide.'}</>;
      const final = aciertos === 0 ? 'aucun n’a fini par avoir besoin d’aide.'
        : aciertos === avisados ? 'tous ont fini par avoir besoin d’aide.'
        : aciertos === 1 ? <>{B(1)} a fini par avoir besoin d’aide.</>
        : <>{B(aciertos)} ont fini par avoir besoin d’aide.</>;
      return <>Brújula a signalé {B(avisados)} élèves au 1er trimestre : {final}</>;
    },
    necesitaron: (necesitaron: number, aciertos: number, B: (n: number) => React.ReactNode) => {
      if (necesitaron === 0) return <>Aucun élève de cette classe n’a terminé l’année sous 5.</>;
      if (necesitaron === 1) return <>{B(1)} élève a terminé l’année en ayant besoin d’aide : {aciertos === 1 ? 'il avait été signalé à temps.' : 'il n’avait pas été signalé.'}</>;
      const final = aciertos === 0 ? 'aucun n’avait été signalé.'
        : aciertos === necesitaron ? 'tous avaient été signalés à temps.'
        : aciertos === 1 ? <>{B(1)} avait été signalé à temps.</>
        : <>{B(aciertos)} avaient été signalés à temps.</>;
      return <>{B(necesitaron)} élèves ont terminé l’année en ayant besoin d’aide : {final}</>;
    },
    definicion: '« Avoir besoin d’aide », c’est terminer l’année avec moins de 5 sur 10 à l’examen. Les alertes ont été calculées sans que le modèle ait vu ces élèves pendant l’entraînement.',
    menosValor: (asignatura: string) => ` En ${asignatura.toLowerCase()}, toutes les notes sont synthétiques : cette vérification a moins de valeur.`,
  },

  importar: {
    titulo: (falta: number | undefined) => (falta ? `Ajouter les données du ${falta}e trimestre` : 'Mettre à jour les données d’un trimestre'),
    intro: 'Téléchargez le modèle, remplissez-le dans Excel et importez-le. Brújula vérifie les données avant de les enregistrer.',
    trimestre: 'Trimestre',
    plantilla: 'Télécharger le modèle',
    importar: 'Importer un .csv',
    resumen: (guardadas: number, total: number, detalle: string) =>
      `${guardadas} ${guardadas === 1 ? 'élève enregistré' : 'élèves enregistrés'}, `
      + `${total === 0 ? 'aucune nouvelle alerte' : `${total} ${total === 1 ? 'nouvelle alerte' : 'nouvelles alertes'}`}`
      + `${detalle ? ` (${detalle})` : ''}.`,
    archivo: (n: number, periodo: number) => ` · ${n} ${n === 1 ? 'élève' : 'élèves'} du ${periodo}e trimestre`,
    conProblemas: (n: number) => ` · ${n} ${n === 1 ? 'ligne à corriger' : 'lignes à corriger'} : corrigez-les dans le fichier puis importez-le à nouveau.`,
    sinProblemas: ' · aucun problème.',
    columnas: ['Ligne', 'Élève', 'Examen', 'TP', 'Participation', 'Assiduité', 'Absences', 'Vérification'],
    correcta: 'Correcte',
    guardar: 'Enregistrer',
    guardando: 'Enregistrement…',
    cancelar: 'Annuler',
    campos: {
      nota_examen: 'la note d’examen', nota_practicas: 'la note de travaux pratiques', participacion: 'la participation',
      asistencia: 'l’assiduité', faltas: 'le nombre d’absences',
    },
    faltaColumna: (cols: string[]) => (cols.length === 1 ? `Il manque la colonne ${cols[0]}` : `Il manque les colonnes ${cols.join(', ')}`),
    usaPlantilla: '. Utilisez le modèle pour ne pas vous tromper de colonnes.',
    sinId: 'Le numéro d’élève (alumno_id) manque ou n’est pas valide.',
    noEsDeLaClase: 'Cet élève n’appartient pas à la classe.',
    repetido: 'L’élève apparaît plusieurs fois dans le fichier.',
    otroTrimestre: (p: number, periodo: number) => `Cette ligne concerne le ${p}e trimestre, mais vous importez le ${periodo}e.`,
    todoVacio: 'Toutes les données de cet élève manquent.',
    falta: (campo: string) => `Il manque ${campo}.`,
    noNumero: (campo: string) => `${campo} n’est pas un nombre.`,
    faltasEnteras: 'Les absences doivent être un nombre entier, 0 ou plus.',
    rango: (campo: string, max: number) => `${campo} doit être entre 0 et ${max}.`,
    vacio: 'Le fichier ne contient aucun élève.',
  },

  alertas: {
    riesgo: (asig: string) => `Pourrait avoir besoin d’aide en ${asig.toLowerCase()}`,
    faltas: (asig: string) => `Assiduité faible en ${asig.toLowerCase()}`,
    practicas: (asig: string) => `Travaux pratiques sous la moyenne en ${asig.toLowerCase()}`,
    participacion: (asig: string) => `Participation faible en ${asig.toLowerCase()}`,
    bajada: (asig: string) => `Notes en baisse en ${asig.toLowerCase()}`,
    enTrimestre: (p: number) => ` au ${p === 1 ? '1er' : `${p}e`} trimestre`,
    clase: (clase: string, pct: string, asig: string) => `${clase} : ${pct} pourraient avoir besoin d’aide en ${asig.toLowerCase()}`,
    asignatura: (asig: string) => `${asig} : plus d’élèves avec alerte que la moyenne de l’établissement`,
    descClase: (con: number, n: number, pctCentro: string) => `${con} élèves sur ${n} avec une alerte ; la moyenne de l’établissement est de ${pctCentro}.`,
    descAsignatura: (pct: string, pctCentro: string) => `${pct} des élèves, contre ${pctCentro} dans l’établissement.`,
    combinacion: 'Une combinaison de plusieurs facteurs (voir l’analyse complète).',
  },

  variables: {
    G1: 'Note du 1er trimestre', failures: 'Redoublements antérieurs', studytime: 'Temps d’étude hebdomadaire',
    traveltime: 'Temps de trajet', age: 'Âge', faltas_log: 'Absences', schoolsup: 'Soutien scolaire de l’établissement',
    famsup: 'Soutien scolaire familial', paid: 'Cours particuliers', activities: 'Activités extrascolaires',
    higher: 'Veut faire des études supérieures', internet: 'Internet à la maison', es_matematicas: 'Matière (mathématiques)',
    nota_practicas: 'Note de travaux pratiques', participacion: 'Participation en classe', asistencia: 'Assiduité',
    nota_examen: 'Note d’examen', faltas: 'Absences',
  },

  valores: {
    deA: (a: string, b: string) => `de ${a} à ${b}`,
    faltasPeriodo1: (n: number) => `${n} absences au 1er trimestre`,
    si: 'oui',
    no: 'non',
  },
};

export default fr;
