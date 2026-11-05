// «Cómo funciona Brújula»: transparencia sobre los datos, el modelo y su equidad.
// Componente independiente: se puede colocar en cualquier página, también sin iniciar sesión.
// Cifras del modelo v1.0 (docs/ficha-del-modelo.md). Si se reentrena el modelo, actualízalas aquí.
// Los textos están en src/i18n (comoFunciona.*); aquí solo quedan las cifras.
import { useIdioma } from '../i18n';

// Piezas del nombre de cada modelo: 'log' = logística, 'red' = red neuronal, 'lgbm' = LightGBM
const MODELOS = [
  { piezas: ['log', 'lgbm'], prauc: 0.799, acertadas: 70, alertas: 276, noVe: 14, elegido: true },
  { piezas: ['log'], prauc: 0.798, acertadas: 69, alertas: 281, noVe: 9 },
  { piezas: ['red', 'log', 'lgbm'], prauc: 0.796, acertadas: 65, alertas: 299, noVe: 12 },
  { piezas: ['red', 'log'], prauc: 0.794, acertadas: 65, alertas: 296, noVe: 10 },
  { piezas: ['red', 'lgbm'], prauc: 0.783, acertadas: 65, alertas: 297, noVe: 12 },
  { piezas: ['red'], prauc: 0.770, acertadas: 60, alertas: 321, noVe: 13 },
  { piezas: ['lgbm'], prauc: 0.749, acertadas: 66, alertas: 292, noVe: 17 },
];

const EQUIDAD = [
  { grupo: 'chicas', n: 591, detectados: 85, falsas: 10 },
  { grupo: 'chicos', n: 453, detectados: 83, falsas: 11 },
  { grupo: 'rural', n: 285, detectados: 84, falsas: 15, aviso: true },
  { grupo: 'urbana', n: 759, detectados: 84, falsas: 8 },
  { grupo: 'gp', n: 772, detectados: 83, falsas: 10 },
  { grupo: 'ms', n: 272, detectados: 85, falsas: 12 },
] as const;

function Tarjeta({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-gray-200 rounded-lg p-5">
      <h3 className="text-lg font-semibold text-[#0f3d4c] mb-2">{titulo}</h3>
      <div className="text-sm text-gray-700 space-y-2">{children}</div>
    </section>
  );
}

// soloDetalle: muestra solo los datos, las variables excluidas, la comparación de modelos y la equidad,
// para colocarlo debajo de una página que ya cuenta las cifras principales (como «El modelo, por dentro»).
export default function ComoFunciona({ soloDetalle = false }: { soloDetalle?: boolean }) {
  const { t, locale } = useIdioma();
  const c = t.comoFunciona;
  const pct = (v: number) => (v / 100).toLocaleString(locale, { style: 'percent' });
  const nombreModelo = (piezas: readonly string[]) =>
    piezas.map((p) => (p === 'log' ? c.eleccion.logistica : p === 'red' ? c.eleccion.redNeuronal : 'LightGBM')).join(' + ');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0f3d4c]">{soloDetalle ? c.tituloDetalle : c.titulo}</h2>
        <p className="text-gray-600">{c.intro}</p>
      </div>

      {!soloDetalle && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {c.cifras.map((cifra, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-3xl font-bold text-[#0f3d4c]">{cifra.valor}</p>
            <p className="text-sm text-gray-600">{cifra.texto}</p>
          </div>
        ))}
      </div>
      )}

      <Tarjeta titulo={c.datos.titulo}>
        <p>{c.datos.p1}</p>
        <p>{c.datos.p2}</p>
      </Tarjeta>

      <Tarjeta titulo={c.noUsa.titulo}>
        <p>{c.noUsa.p1}</p>
        <p>{c.noUsa.p2}</p>
      </Tarjeta>

      <Tarjeta titulo={c.eleccion.titulo}>
        <p>{c.eleccion.p1}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b">
                {c.eleccion.columnas.map((col, i) => <th key={i} className={i === 0 ? 'py-2' : ''}>{col}</th>)}
              </tr>
            </thead>
            <tbody>
              {MODELOS.map((m) => (
                <tr key={m.piezas.join('+')} className={`border-b border-gray-100 ${m.elegido ? 'bg-amber-50 font-semibold' : ''}`}>
                  <td className="py-2">{nombreModelo(m.piezas)}{m.elegido ? c.eleccion.elegido : ''}</td>
                  <td>{m.prauc.toLocaleString(locale, { minimumFractionDigits: 3 })}</td><td>{pct(m.acertadas)}</td><td>{m.alertas}</td><td>{m.noVe}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>{c.eleccion.p2}</p>
      </Tarjeta>

      <Tarjeta titulo={c.equidad.titulo}>
        <p>{c.equidad.p1}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b">
                {c.equidad.columnas.map((col, i) => <th key={i} className={i === 0 ? 'py-2' : ''}>{col}</th>)}
              </tr>
            </thead>
            <tbody>
              {EQUIDAD.map((g) => (
                <tr key={g.grupo} className="border-b border-gray-100">
                  <td className="py-2">{c.equidad.grupos[g.grupo]}</td><td>{g.n}</td><td>{pct(g.detectados)}</td>
                  <td className={'aviso' in g ? 'text-amber-800 font-semibold' : ''}>{pct(g.falsas)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>{c.equidad.p2}</p>
      </Tarjeta>

      {!soloDetalle && (
      <Tarjeta titulo={c.noHace.titulo}>
        <p>{c.noHace.p1}</p>
      </Tarjeta>
      )}
    </div>
  );
}
