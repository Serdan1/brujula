import { Bell, Check, User } from 'lucide-react';
import { TituloPagina } from './Marco';
import ComoFunciona from '../../components/ComoFunciona';
import { useIdioma } from '../../i18n';

// ---- Cifras ----
// Fuentes: docs/ficha-del-modelo.md (§4.1, §4.2, §6), ml/results/baselines.json (recall 0,835),
// combinaciones.json (precisión 0,699), red_neuronal.json (MAE 1,054; cobertura 0,804; ancho medio 3,4).
// Los textos están en src/i18n (elModelo.*).

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
  const { t } = useIdioma();
  const m = t.elModelo;
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <TituloPagina titulo={m.titulo} entradilla={m.entradilla} />

      {/* Qué usa */}
      <div className="mt-10 bg-white rounded-xl border border-[#CBD5D4] p-5 flex items-center gap-4">
        <span className="shrink-0 w-10 h-10 rounded-full bg-[#174A55]/10 flex items-center justify-center">
          <Check aria-hidden="true" className="w-5 h-5 text-[#174A55]" />
        </span>
        <p><strong className="text-[#174A55]">{m.usa}</strong> {m.datosQueUsa}</p>
      </div>

      {/* Cifras */}
      <h2 className="mt-14 text-2xl font-semibold text-[#174A55]">{m.comoAcierta}</h2>
      <ul className="mt-6 grid gap-4 md:grid-cols-3">
        <li className="bg-white rounded-xl border border-[#CBD5D4] p-5 flex flex-col gap-3">
          <DeCadaDiez n={8} Icono={User} />
          <p className="text-2xl font-bold text-[#174A55]">{m.deCadaDiez(8)}</p>
          <p className="text-sm">{m.cifra1}</p>
        </li>
        <li className="bg-white rounded-xl border border-[#CBD5D4] p-5 flex flex-col gap-3">
          <DeCadaDiez n={7} Icono={Bell} />
          <p className="text-2xl font-bold text-[#174A55]">{m.deCadaDiez(7)}</p>
          <p className="text-sm">{m.cifra2}</p>
        </li>
        <li className="bg-white rounded-xl border border-[#CBD5D4] p-5 flex flex-col gap-3">
          <Margen />
          <p className="text-2xl font-bold text-[#174A55]">{m.puntos}</p>
          <p className="text-sm">{m.cifra3}</p>
        </li>
      </ul>

      <p className="mt-6 text-xs text-[#64777A] max-w-3xl">{m.nota}</p>

      <h2 className="mt-14 text-2xl font-semibold text-[#174A55]">{m.noHace}</h2>
      <ul className="mt-6 grid gap-6 sm:grid-cols-2">
        {m.limites.map((l, i) => (
          <li key={i} className="border-l-4 border-[#174A55] pl-4">
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
