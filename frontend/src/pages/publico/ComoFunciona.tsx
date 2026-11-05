import { TituloPagina } from './Marco';

const PASOS = [
  { titulo: 'La escuela ya tiene los datos', texto: 'Notas, asistencia, prácticas y participación. Nada que no se recoja ya en cualquier centro.' },
  { titulo: 'Brújula avisa y explica', texto: 'Detecta a tiempo qué alumnos y grupos podrían necesitar apoyo, y dice qué datos lo indican.' },
  { titulo: 'El profesor decide', texto: 'Revisa, registra qué va a hacer o descarta el aviso con un motivo. Brújula nunca decide por él.' },
];

const LIMITES = [
  { titulo: 'Sin decisiones automáticas', texto: 'Cada aviso termina en una decisión humana, y queda registrado quién la tomó.' },
  { titulo: 'Sin rankings', texto: 'No hay listas de mejores y peores alumnos ni porcentajes de riesgo por alumno.' },
  { titulo: 'Solo lo necesario', texto: 'No se guardan datos familiares, económicos ni de hábitos personales.' },
  { titulo: 'Cada uno ve lo suyo', texto: 'Un profesor solo ve sus clases y sus asignaturas. La dirección, su centro.' },
];

export default function ComoFunciona() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <TituloPagina titulo="Cómo funciona" entradilla="Tres pasos, y la última palabra siempre la tiene el profesor." />

      <ol className="mt-10 grid gap-8 sm:grid-cols-3">
        {PASOS.map((p, i) => (
          <li key={p.titulo} className="bg-white rounded-xl border border-[#CBD5D4] p-5">
            <span className="text-3xl font-bold text-[#174A55]">{i + 1}</span>
            <h2 className="mt-1 font-semibold">{p.titulo}</h2>
            <p className="mt-1 text-sm text-[#64777A]">{p.texto}</p>
          </li>
        ))}
      </ol>

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
