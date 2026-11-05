import { TituloPagina } from './Marco';

// ---- Cifras ----
// Fuentes: docs/ficha-del-modelo.md (§4.1, §4.2, §6), ml/results/baselines.json (recall 0,835),
// combinaciones.json (precisión 0,699), red_neuronal.json (MAE 1,054; cobertura 0,804),
// equidad_combinado.json (recall 0,829–0,848; falsas alarmas rural 0,154 y urbana 0,084).
const CIFRAS = [
  { cifra: '8 de cada 10', texto: 'alumnos que acaban necesitando apoyo reciben un aviso al final del 1.º trimestre.' },
  { cifra: '7 de cada 10', texto: 'avisos son de alumnos que de verdad acaban necesitando apoyo.' },
  { cifra: '1 punto', texto: 'es lo que se desvía de media la nota estimada, sobre 20. El margen incluye la nota real 8 de cada 10 veces.' },
  { cifra: 'Igual de atento', texto: 'avisa de 8 de cada 10 alumnos que lo necesitan, sean chicas o chicos, de zona rural o urbana, y en los dos centros.' },
];

const EXCLUIDAS = [
  { titulo: 'Datos sensibles:', texto: 'consumo de alcohol, relaciones de pareja y situación familiar. Señalar a un alumno por ellos lo estigmatiza.' },
  { titulo: 'Datos socioeconómicos:', texto: 'estudios y trabajo de los padres. Repetirían desigualdades de origen.' },
  { titulo: 'Sexo, zona y centro:', texto: 'no entran en el modelo. Solo sirven para comprobar que trata igual a todos.' },
];

const LIMITES = [
  { titulo: 'Sin decisiones automáticas', texto: 'Cada aviso termina en una decisión humana, y queda registrado quién la tomó.' },
  { titulo: 'Sin rankings', texto: 'No hay listas de mejores y peores alumnos ni porcentajes de riesgo por alumno.' },
  { titulo: 'Solo lo necesario', texto: 'No se guardan datos familiares, económicos ni de hábitos personales.' },
  { titulo: 'Cada uno ve lo suyo', texto: 'Un profesor solo ve sus clases y sus asignaturas. La dirección, su centro.' },
];

export default function ElModelo() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <TituloPagina titulo="El modelo, por dentro"
        entradilla="Qué estima, con qué datos, qué deja fuera y cómo de bien acierta." />

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <div className="bg-white rounded-xl border border-[#CBD5D4] p-5">
          <h2 className="font-semibold text-[#174A55]">Qué estima</h2>
          <p className="mt-2">Al final del 1.º trimestre, para cada alumno y asignatura:</p>
          <ul className="mt-2 list-disc pl-5">
            <li>si podría necesitar apoyo para aprobar, y por qué;</li>
            <li>su nota final, con un margen.</li>
          </ul>
          <p className="mt-3">
            Solo usa lo que ya se sabe en ese momento: notas, faltas, asistencia, prácticas, participación, tiempo de
            estudio y suspensos anteriores.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[#CBD5D4] p-5">
          <h2 className="font-semibold text-[#174A55]">Lo que deja fuera</h2>
          <ul className="mt-2 flex flex-col gap-2 text-sm">
            {EXCLUIDAS.map((x) => (
              <li key={x.titulo}><strong className="text-[#174A55]">{x.titulo}</strong> {x.texto}</li>
            ))}
          </ul>
        </div>
      </div>

      <h2 className="mt-14 text-2xl font-semibold text-[#174A55]">Cómo de bien acierta</h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CIFRAS.map((c) => (
          <li key={c.cifra} className="bg-white rounded-xl border border-[#CBD5D4] p-4">
            <p className="text-2xl font-bold text-[#174A55]">{c.cifra}</p>
            <p className="mt-1 text-sm">{c.texto}</p>
          </li>
        ))}
      </ul>
      <p className="mt-6 max-w-3xl">
        En zona rural salta más veces sin necesidad: a 15 de cada 100 alumnos que no lo necesitaban, frente a 8 en zona
        urbana. Por eso cada aviso lo revisa una persona.
      </p>
      <p className="mt-3 text-xs text-[#64777A] max-w-3xl">
        Cifras medidas con datos de dos institutos portugueses (curso 2005-06), ampliados con datos sintéticos. Antes de
        usarlo en una escuela, hay que volver a entrenarlo con sus propios datos.
      </p>

      <h2 className="mt-14 text-2xl font-semibold text-[#174A55]">Lo que Brújula no hace</h2>
      <ul className="mt-6 grid gap-6 sm:grid-cols-2">
        {LIMITES.map((l) => (
          <li key={l.titulo} className="border-l-4 border-[#174A55] pl-4">
            <h3 className="font-semibold">{l.titulo}</h3>
            <p className="text-sm text-[#64777A]">{l.texto}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
