import { Database, PiggyBank, Scale, Smartphone } from 'lucide-react';
import { TituloPagina } from './Marco';
import { useIdioma } from '../../i18n';

// Los textos están en src/i18n (pocosRecursos.*)
const ICONOS_VENTAJAS = [Database, Smartphone, PiggyBank, Scale];

// Dibujo de un móvil con un aviso de ejemplo (datos inventados)
function MovilEjemplo() {
  const { t } = useIdioma();
  const m = t.pocosRecursos.movil;
  return (
    <div aria-hidden="true" className="mx-auto w-56 rounded-[2rem] border-[6px] border-[#174A55] bg-[#F7F4ED] p-3 pt-5 shadow-sm">
      <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-[#174A55]/30" />
      <p className="text-xs font-bold text-[#174A55]">Brújula</p>
      <p className="mt-2 text-[11px] text-[#64777A]">{m.cabecera}</p>
      <div className="mt-2 rounded-lg border border-[#E9B45C] bg-[#F9E9C9] p-2">
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#E9B45C] text-[#24343A]">{m.prioridadAlta}</span>
        <p className="mt-1 text-xs font-semibold text-[#174A55]">{m.podriaApoyo}</p>
        <p className="text-[11px]">{m.asistencia}: <strong>68 %</strong></p>
      </div>
      <div className="mt-2 rounded-lg border border-[#CBD5D4] bg-white p-2">
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#EDEFEC] text-[#24343A]">{m.prioridadMedia}</span>
        <p className="mt-1 text-xs font-semibold text-[#174A55]">{m.bajaParticipacion}</p>
        <p className="text-[11px]">{m.grupo}</p>
      </div>
      <div className="mt-3 h-8 rounded-lg bg-[#174A55]/10" />
    </div>
  );
}

export default function PocosRecursos() {
  const { t } = useIdioma();
  const p = t.pocosRecursos;
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <TituloPagina titulo={p.titulo} entradilla={p.entradilla} />

      <div className="mt-10 grid gap-10 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <div className="flex flex-col gap-3">
            <p>{p.p1}</p>
            <p>{p.p2}</p>
          </div>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {p.ventajas.map(({ titulo, texto }, i) => {
              const Icono = ICONOS_VENTAJAS[i];
              return (
                <li key={i} className="bg-white rounded-xl border border-[#CBD5D4] p-4 flex gap-3">
                  <span className="shrink-0 w-10 h-10 rounded-full bg-[#174A55]/10 flex items-center justify-center">
                    <Icono aria-hidden="true" className="w-5 h-5 text-[#174A55]" />
                  </span>
                  <span>
                    <strong className="block text-[#174A55]">{titulo}</strong>
                    <span className="text-sm">{texto}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        <MovilEjemplo />
      </div>
    </div>
  );
}
