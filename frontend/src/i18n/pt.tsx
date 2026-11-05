// Português (Portugal). Mesmas chaves que es.tsx.
import type { Diccionario } from '.';

const pt: Diccionario = {
  comun: {
    idioma: 'Idioma',
    entrar: 'Entrar',
    probarDemo: 'Experimentar a demo',
    clase: (curso: number, letra: string) => `${curso}.º ano ${letra}`,
    asignaturas: { Portugués: 'Português', Matemáticas: 'Matemática', Inglés: 'Inglês', Ciencias: 'Ciências' },
  },

  marco: {
    menu: { modelo: 'O modelo', recursos: 'Poucos recursos', llega: 'Como chega' },
    apartados: 'Secções',
    cierre: 'Veja com dados de exemplo, sem instalar nada.',
    pie1: 'Projeto para o #hack4edu 2026, desafio 13 da ProFuturo. Código aberto com licença MIT.',
    pie2: 'Dados: dataset Student Performance (P. Cortez e A. Silva, UCI, CC BY 4.0), alargado com dados sintéticos. Os nomes de alunos e professores são fictícios.',
  },

  portada: {
    titulo: 'Que nenhum aluno precise de apoio sem que ninguém o veja chegar.',
    intro: 'O Brújula transforma os dados que a escola já tem em avisos claros para os professores, com o motivo de cada aviso e espaço para decidir o que fazer.',
    ejemplo: {
      aria: 'Exemplo da aplicação com dados fictícios',
      ventana: 'Brújula · Português',
      prioridadAlta: 'Prioridade alta',
      podriaApoyo: 'Pode precisar de apoio',
      titulo: 'Pode precisar de apoio a Português',
      alumna: 'Aluna do 4.º ano C · exemplo fictício',
      porQue: 'Porque é que aparece:',
      notaPrimer: 'Nota do 1.º período',
      nota: '4,5',
      asistencia: 'Assiduidade',
      registrar: 'Registar ação',
      descartar: 'Descartar com motivo',
    },
    acceso: {
      titulo: 'Entrar na demo',
      correo: 'E-mail',
      contrasena: 'Palavra-passe',
      error: 'E-mail ou palavra-passe incorretos.',
      pista: 'Experimente com profesor.gp@example.com ou director.gp@example.com. Todos os nomes de alunos são fictícios.',
    },
    comoFunciona: 'Como funciona.',
    comoFuncionaSub: 'Três passos, e quem decide é o professor.',
    pasos: [
      { titulo: 'A escola já tem os dados', texto: 'Notas, assiduidade, trabalhos práticos e participação.' },
      { titulo: 'O Brújula avisa e explica', texto: 'Quem pode precisar de apoio e que dados o indicam.' },
      { titulo: 'O professor decide', texto: 'Age ou descarta o aviso com um motivo.' },
    ],
  },

  elModelo: {
    titulo: 'O modelo, por dentro',
    entradilla: 'No fim de cada período, o Brújula estima, para cada aluno e disciplina, se pode precisar de apoio para ter positiva, e porquê, e a sua nota final com uma margem.',
    usa: 'Usa:',
    datosQueUsa: 'Notas, faltas, assiduidade, trabalhos práticos, participação e tempo de estudo.',
    comoAcierta: 'Até que ponto acerta',
    deCadaDiez: (n: number) => `${n} em cada 10`,
    cifra1: 'alunos que acabam por precisar de apoio recebem um aviso no fim do 1.º período.',
    cifra2: 'avisos são de alunos que acabam mesmo por precisar de apoio.',
    puntos: '0,5 valores',
    cifra3: 'é o desvio médio da nota estimada, numa escala de 0 a 10. A margem inclui a nota real 8 em cada 10 vezes.',
    nota: 'Valores medidos com dados de duas escolas secundárias portuguesas (ano letivo 2005-06), alargados com dados sintéticos. Antes de o usar numa escola, é preciso treiná-lo de novo com os dados dela.',
    noHace: 'O que o Brújula não faz',
    limites: [
      { titulo: 'Sem decisões automáticas', texto: 'Cada aviso termina numa decisão humana, e fica registado quem a tomou.' },
      { titulo: 'Sem rankings', texto: 'Não há listas de melhores e piores alunos nem percentagens de risco por aluno.' },
      { titulo: 'Só o necessário', texto: 'Não se guardam dados familiares, económicos nem de hábitos pessoais.' },
      { titulo: 'Cada um vê o que é seu', texto: 'Um professor só vê as suas turmas e disciplinas. A direção, a sua escola.' },
    ],
  },

  pocosRecursos: {
    titulo: 'Pensado para escolas com poucos recursos',
    entradilla: 'Onde há menos psicólogos escolares e mais alunos por professor, detetar a tempo quem está a ficar para trás é mais difícil e mais importante.',
    p1: 'O Brújula não exige sensores, plataformas caras nem pessoal técnico.',
    p2: 'Também para escolas com dificuldades de acesso: basta um navegador, no computador ou no telemóvel.',
    ventajas: [
      { titulo: 'Dados que já existem.', texto: 'Notas e assiduidade chegam para começar.' },
      { titulo: 'Sem instalar nada.', texto: 'Funciona no navegador, também no telemóvel.' },
      { titulo: 'Custo de infraestrutura zero', texto: 'para começar, com serviços no seu plano gratuito.' },
      { titulo: 'Verifica que é justo.', texto: 'Mede se o modelo acerta da mesma forma com raparigas e rapazes, com alunos de meio rural e urbano, e entre escolas.' },
    ],
    movil: {
      cabecera: 'Português · 4.º ano C',
      prioridadAlta: 'Prioridade alta',
      podriaApoyo: 'Pode precisar de apoio',
      asistencia: 'Assiduidade',
      prioridadMedia: 'Prioridade média',
      bajaParticipacion: 'A participação desce',
      grupo: 'Turma do 4.º ano C',
    },
  },

  comoLlega: {
    titulo: 'Como chega às escolas',
    intro: 'O Brújula é gratuito para quem mais precisa. É financiado por quem gere muitas escolas.',
    niveles: [
      { para: 'Escolas públicas e em contextos vulneráveis', condicion: 'Gratuito', incluye: 'Todas as funcionalidades para a sua escola.' },
      { para: 'Agrupamentos e administrações educativas', condicion: 'Pago', incluye: 'Várias escolas ao mesmo tempo, relatórios e suporte.' },
      { para: 'Fundações e ONG educativas', condicion: 'Implementação', incluye: 'Levam-no às escolas que acompanham e ajudam a pô-lo a funcionar.' },
    ],
    proximos: 'Próximos passos',
    hojaDeRuta: [
      'Importar as notas a partir do Excel.',
      'Traduções revistas por professores de cada país.',
    ],
  },

  comoFunciona: {
    titulo: 'Como funciona o Brújula',
    tituloDetalle: 'Para quem quiser o detalhe',
    intro: 'Que dados usa, como escolhemos o modelo e como verificamos que é justo com todos os alunos.',
    cifras: [
      { valor: '84 %', texto: 'dos alunos que vão precisar de apoio, detetados no fim do 1.º período' },
      { valor: '23', texto: 'falsos alarmes a menos do que a regra «tem negativa no 1.º período», detetando os mesmos alunos' },
      { valor: '14', texto: 'alunos que têm positiva no 1.º período e ainda assim vão precisar de apoio: a regra não os vê' },
    ],
    datos: {
      titulo: 'Os dados',
      p1: <>A base é real: <strong>674 alunos</strong> de duas escolas secundárias portuguesas (dataset Student Performance da UCI, CC BY 4.0), com as notas de três períodos, faltas e contexto.</>,
      p2: <>Para a demo foram acrescentados dados <strong>sintéticos</strong>: turmas, professores, Inglês e Ciências, e a nota dos trabalhos práticos, a participação e a assiduidade por período, gerados a partir das notas reais. Por isso aparecem marcados com um asterisco. Medimo-lo: sem eles, o modelo continua a dar menos 14 falsos alarmes do que a regra das notas.</>,
    },
    noUsa: {
      titulo: 'O que o modelo não usa',
      p1: 'Não usa consumo de álcool, relações amorosas ou familiares, nem a escolaridade ou a profissão dos pais: assinalar um aluno por estes motivos seria estigmatizante. Sexo, meio e escola também não entram no modelo; só servem para o auditar.',
      p2: 'Também não usa as notas do 2.º e 3.º períodos: o alerta é gerado com o que se sabe no fim do 1.º.',
    },
    eleccion: {
      titulo: 'Como escolhemos o modelo',
      p1: 'Comparámos 7 combinações de modelos, todas a detetar os mesmos alunos que a regra «tem negativa no 1.º período» (299 alertas), e escolhemos a que dá menos falsos alarmes.',
      columnas: ['Modelo', 'Qualidade (PR-AUC)', 'Acertos', 'Alertas', 'Alunos que a regra não vê'],
      elegido: ' (escolhido)',
      logistica: 'Logística',
      redNeuronal: 'Rede neuronal',
      p2: <>A <strong>rede neuronal</strong> é usada onde é a melhor: estimar a nota final, com um erro médio de 0,53 valores em 10 (contra 1,08 do Ridge e 1,13 da regra «a nota final será a do 1.º período») e um intervalo que acerta 80 % das vezes.</>,
    },
    equidad: {
      titulo: 'Equidade do modelo',
      p1: 'Medimos se o modelo acerta da mesma forma para todos os grupos.',
      columnas: ['Grupo', 'Alunos', 'Detetados', 'Falsos alarmes'],
      grupos: { chicas: 'Raparigas', chicos: 'Rapazes', rural: 'Meio rural', urbana: 'Meio urbano', gp: 'Escola GP', ms: 'Escola MS' },
      p2: <>Deteta da mesma forma todos os grupos, mas dá mais falsos alarmes no meio rural. Não o corrigimos com um limiar diferente por zona, porque a decisão dependeria de onde o aluno vive. Por isso <strong>nenhum alerta decide nada</strong>: os professores reveem-no e podem descartá-lo com um motivo.</>,
    },
    noHace: {
      titulo: 'O que o Brújula não faz',
      p1: 'Não rotula os alunos, não mostra pontuações de risco nem rankings, e não toma decisões automáticas. Os alertas orientam; a decisão é sempre do professor.',
    },
  },
};

export default pt;
