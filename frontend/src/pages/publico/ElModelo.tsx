import { Bell, Check, User } from 'lucide-react';
import { TituloPagina } from './Marco';
import ComoFunciona from '../../components/ComoFunciona';

// ---- Cifras ----
// Fuentes: docs/ficha-del-modelo.md (§4.1, §4.2, §6), ml/results/baselines.json (recall 0,835),
// combinaciones.json (precisión 0,699), red_neuronal.json (MAE 1,054; cobertura 0,804; ancho medio 3,4).

const DATOS_QUE_USA = 'Notas, faltas, asistencia, prácticas, participación y tiempo de estudio.';

const LIMITES = [
  { titulo: 'Sin decisiones automáticas', texto: 'Cada aviso termina en una decisión humana, y queda registrado quién la tomó.' },
  { titulo: 'Sin rankings', texto: 'No hay listas de mejores y peores alumnos ni porcentajes de riesgo por alumno.' },
  { titulo: 'Solo lo necesario', texto: 'No se guardan datos familiares, económicos ni de hábitos personales.' },
  { titulo: 'Cada uno ve lo suyo', texto: 'Un profesor solo ve sus clases y sus asignaturas. La dirección, su centro.' },
];

// Fila de 10 iconos con los primeros "n" en azul petróleo
function DeCadaDiez({ n, Icono }: { n: number; Icono: typeof User }) {
  return (
    <div className="flex gap-1" aria-hidden="true">
      {Array.from({ length: 10 }, (_, i) => (
        <Icono key={i} className={`w-5 h-5 ${i < n ? 'text-[#174A55] fill-[#174A55]' : 'text-[#CBD5D4]'}`} />
      ))}
    </div>
  );
}

// Escala de 0 a 10 con una nota estimada de ejemplo y su margen (ancho medio real: 1,7 puntos)
function Margen() {
  const estimada = 5.5, ancho = 1.7;
  const pct = (v: number) => `${(v / 10) * 100}%`;
  return (
    <div aria-hidden="true">
      <div className="relative h-5">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded bg-[#CBD5D4]" />
        <div className="absolute top-1/2 h-3 -translate-y-1/2 rounded bg-[#A7C5C7]"
          style={{ left: pct(estimada - ancho / 2), width: pct(ancho) }} />
        <div className="absolute top-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#174A55]"
          style={{ left: pct(estimada) }} />
      </div>
      <div className="flex justify-between text-xs text-[#64777A]"><span>0</span><span>5</span><span>10</span></div>
    </div>
  );
}

export default function ElModelo() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <TituloPagina titulo="El modelo, por dentro"
        entradilla="Al final de cada trimestre, Brújula estima para cada alumno y asignatura si podría necesitar apoyo para aprobar, y por qué, y su nota final con un margen." />

      {/* Qué usa */}
      <div className="mt-10 bg-white rounded-xl border border-[#CBD5D4] p-5 flex items-center gap-4">
        <span className="shrink-0 w-10 h-10 rounded-full bg-[#174A55]/10 flex items-center justify-center">
          <Check aria-hidden="true" className="w-5 h-5 text-[#174A55]" />
        </span>
        <p><strong className="text-[#174A55]">Usa:</strong> {DATOS_QUE_USA}</p>
      </div>

      {/* Cifras */}
      <h2 className="mt-14 text-2xl font-semibold text-[#174A55]">Cómo de bien acierta</h2>
      <ul className="mt-6 grid gap-4 md:grid-cols-3">
        <li className="bg-white rounded-xl border border-[#CBD5D4] p-5 flex flex-col gap-3">
          <DeCadaDiez n={8} Icono={User} />
          <p className="text-2xl font-bold text-[#174A55]">8 de cada 10</p>
          <p className="text-sm">alumnos que acaban necesitando apoyo reciben un aviso al final del 1.º trimestre.</p>
        </li>
        <li className="bg-white rounded-xl border border-[#CBD5D4] p-5 flex flex-col gap-3">
          <DeCadaDiez n={7} Icono={Bell} />
          <p className="text-2xl font-bold text-[#174A55]">7 de cada 10</p>
          <p className="text-sm">avisos son de alumnos que de verdad acaban necesitando apoyo.</p>
        </li>
        <li className="bg-white rounded-xl border border-[#CBD5D4] p-5 flex flex-col gap-3">
          <Margen />
          <p className="text-2xl font-bold text-[#174A55]">0,5 puntos</p>
          <p className="text-sm">es lo que se desvía de media la nota estimada, sobre 10. El margen incluye la nota real 8 de cada 10 veces.</p>
        </li>
      </ul>

      <p className="mt-6 text-xs text-[#64777A] max-w-3xl">
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

      {/* Detalle técnico: datos, variables excluidas, comparación de modelos y equidad */}
      <div className="mt-16">
        <ComoFunciona soloDetalle />
      </div>
    </div>
  );
}
