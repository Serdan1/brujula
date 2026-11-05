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
};

export default fr;
