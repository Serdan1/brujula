import { FileSpreadsheet, HeartHandshake, Landmark, Languages, School } from 'lucide-react';
import { TituloPagina } from './Marco';
import { useIdioma } from '../../i18n';

// Los textos están en src/i18n (comoLlega.*)
const ICONOS_NIVELES = [School, Landmark, HeartHandshake];
const ICONOS_HOJA = [FileSpreadsheet, Languages];

export default function ComoLlega() {
  const { t } = useIdioma();
  const c = t.comoLlega;
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <TituloPagina titulo={c.titulo} entradilla={c.intro} />

      <ul className="mt-10 grid gap-4 md:grid-cols-3">
        {c.niveles.map(({ para, condicion, incluye }, i) => {
          const Icono = ICONOS_NIVELES[i];
          return (
            <li key={i} className="bg-white rounded-xl border border-[#CBD5D4] p-6 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="w-12 h-12 rounded-full bg-[#174A55]/10 flex items-center justify-center">
                  <Icono aria-hidden="true" className="w-6 h-6 text-[#174A55]" />
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#174A55] text-white">{condicion}</span>
              </div>
              <h2 className="mt-4 font-semibold text-[#174A55]">{para}</h2>
              <p className="mt-1 text-sm">{incluye}</p>
            </li>
          );
        })}
      </ul>

      <h2 className="mt-14 text-2xl font-semibold text-[#174A55]">{c.proximos}</h2>
      <ol className="mt-6 relative border-l-2 border-[#A7C5C7] ml-5 flex flex-col gap-6">
        {c.hojaDeRuta.map((texto, i) => {
          const Icono = ICONOS_HOJA[i];
          return (
            <li key={i} className="flex items-center gap-4 -ml-5">
              <span className="shrink-0 w-10 h-10 rounded-full bg-white border-2 border-[#174A55] flex items-center justify-center">
                <Icono aria-hidden="true" className="w-5 h-5 text-[#174A55]" />
              </span>
              <span>{texto}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
