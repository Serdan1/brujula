import { TituloPagina } from './Marco';

// ---- Textos editables ----
const LLEGADA_INTRO = 'Brújula es gratis para quien más lo necesita. Lo financian quienes gestionan muchos centros.';

const NIVELES = [
  { para: 'Centros públicos y en contextos vulnerables', condicion: 'Gratis', incluye: 'Todas las funciones para su centro.' },
  { para: 'Redes de centros y administraciones educativas', condicion: 'De pago', incluye: 'Varios centros a la vez, informes y soporte.' },
  { para: 'Fundaciones y ONG educativas', condicion: 'Implantación', incluye: 'Lo llevan a los centros que acompañan y ayudan a ponerlo en marcha.' },
];

const HOJA_DE_RUTA = ['Importar las notas desde Excel.', 'Versión en portugués e inglés.'];

export default function ComoLlega() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <TituloPagina titulo="Cómo llega a las escuelas" entradilla={LLEGADA_INTRO} />

      <ul className="mt-10 grid gap-4 md:grid-cols-3">
        {NIVELES.map((n) => (
          <li key={n.para} className="bg-white rounded-xl border border-[#CBD5D4] p-5">
            <span className="text-xs font-semibold inline-block px-2 py-0.5 rounded bg-[#174A55] text-white">{n.condicion}</span>
            <h2 className="mt-2 font-semibold text-[#174A55]">{n.para}</h2>
            <p className="mt-1 text-sm">{n.incluye}</p>
          </li>
        ))}
      </ul>

      <h2 className="mt-14 text-2xl font-semibold text-[#174A55]">Próximos pasos</h2>
      <ul className="mt-4 list-disc pl-5">
        {HOJA_DE_RUTA.map((h) => <li key={h}>{h}</li>)}
      </ul>
    </div>
  );
}
