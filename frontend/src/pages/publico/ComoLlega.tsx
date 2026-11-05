import { FileSpreadsheet, HeartHandshake, Landmark, Languages, School } from 'lucide-react';
import { TituloPagina } from './Marco';

// ---- Textos editables ----
const LLEGADA_INTRO = 'Brújula es gratis para quien más lo necesita. Lo financian quienes gestionan muchos centros.';

const NIVELES = [
  { icono: School, para: 'Centros públicos y en contextos vulnerables', condicion: 'Gratis', incluye: 'Todas las funciones para su centro.' },
  { icono: Landmark, para: 'Redes de centros y administraciones educativas', condicion: 'De pago', incluye: 'Varios centros a la vez, informes y soporte.' },
  { icono: HeartHandshake, para: 'Fundaciones y ONG educativas', condicion: 'Implantación', incluye: 'Lo llevan a los centros que acompañan y ayudan a ponerlo en marcha.' },
];

const HOJA_DE_RUTA = [
  { icono: FileSpreadsheet, texto: 'Importar las notas desde Excel.' },
  { icono: Languages, texto: 'Versión en portugués e inglés.' },
];

export default function ComoLlega() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <TituloPagina titulo="Cómo llega a las escuelas" entradilla={LLEGADA_INTRO} />

      <ul className="mt-10 grid gap-4 md:grid-cols-3">
        {NIVELES.map(({ icono: Icono, para, condicion, incluye }) => (
          <li key={para} className="bg-white rounded-xl border border-[#CBD5D4] p-6 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="w-12 h-12 rounded-full bg-[#174A55]/10 flex items-center justify-center">
                <Icono aria-hidden="true" className="w-6 h-6 text-[#174A55]" />
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#174A55] text-white">{condicion}</span>
            </div>
            <h2 className="mt-4 font-semibold text-[#174A55]">{para}</h2>
            <p className="mt-1 text-sm">{incluye}</p>
          </li>
        ))}
      </ul>

      <h2 className="mt-14 text-2xl font-semibold text-[#174A55]">Próximos pasos</h2>
      <ol className="mt-6 relative border-l-2 border-[#A7C5C7] ml-5 flex flex-col gap-6">
        {HOJA_DE_RUTA.map(({ icono: Icono, texto }) => (
          <li key={texto} className="flex items-center gap-4 -ml-5">
            <span className="shrink-0 w-10 h-10 rounded-full bg-white border-2 border-[#174A55] flex items-center justify-center">
              <Icono aria-hidden="true" className="w-5 h-5 text-[#174A55]" />
            </span>
            <span>{texto}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
