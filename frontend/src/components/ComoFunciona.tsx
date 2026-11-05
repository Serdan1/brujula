// «Cómo funciona Brújula»: transparencia sobre los datos, el modelo y su equidad.
// Componente independiente: se puede colocar en cualquier página, también sin iniciar sesión.
// Cifras del modelo v1.0 (docs/ficha-del-modelo.md). Si se reentrena el modelo, actualízalas aquí.

const MODELOS = [
  { modelo: 'Logística + LightGBM', prauc: '0,799', acertadas: '70 %', alertas: 276, noVe: 14, elegido: true },
  { modelo: 'Logística', prauc: '0,798', acertadas: '69 %', alertas: 281, noVe: 9 },
  { modelo: 'Red neuronal + logística + LightGBM', prauc: '0,796', acertadas: '65 %', alertas: 299, noVe: 12 },
  { modelo: 'Red neuronal + logística', prauc: '0,794', acertadas: '65 %', alertas: 296, noVe: 10 },
  { modelo: 'Red neuronal + LightGBM', prauc: '0,783', acertadas: '65 %', alertas: 297, noVe: 12 },
  { modelo: 'Red neuronal', prauc: '0,770', acertadas: '60 %', alertas: 321, noVe: 13 },
  { modelo: 'LightGBM', prauc: '0,749', acertadas: '66 %', alertas: 292, noVe: 17 },
];

const EQUIDAD = [
  { grupo: 'Chicas', n: 591, detectados: '85 %', falsas: '10 %' },
  { grupo: 'Chicos', n: 453, detectados: '83 %', falsas: '11 %' },
  { grupo: 'Zona rural', n: 285, detectados: '84 %', falsas: '15 %', aviso: true },
  { grupo: 'Zona urbana', n: 759, detectados: '84 %', falsas: '8 %' },
  { grupo: 'Escuela GP', n: 772, detectados: '83 %', falsas: '10 %' },
  { grupo: 'Escuela MS', n: 272, detectados: '85 %', falsas: '12 %' },
];

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
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0f3d4c]">{soloDetalle ? 'Para quien quiera el detalle' : 'Cómo funciona Brújula'}</h2>
        <p className="text-gray-600">Qué datos usa, cómo elegimos el modelo y cómo comprobamos que es justo con todos los alumnos.</p>
      </div>

      {!soloDetalle && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-3xl font-bold text-[#0f3d4c]">84 %</p>
          <p className="text-sm text-gray-600">de los alumnos que necesitarán apoyo, detectados al final del primer periodo</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-3xl font-bold text-[#0f3d4c]">23</p>
          <p className="text-sm text-gray-600">falsas alarmas menos que la regla «suspende el primer periodo», detectando a los mismos alumnos</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-3xl font-bold text-[#0f3d4c]">14</p>
          <p className="text-sm text-gray-600">alumnos que aprueban el primer periodo y aun así necesitarán apoyo: la regla no los ve</p>
        </div>
      </div>
      )}

      <Tarjeta titulo="Los datos">
        <p>
          La base es real: <strong>674 alumnos</strong> de dos institutos portugueses (dataset Student Performance de la UCI, CC BY 4.0),
          con sus notas de tres periodos, faltas y contexto.
        </p>
        <p>
          Para la demo se añadieron datos <strong>sintéticos</strong>: clases, profesores, Inglés y Ciencias, y la nota de prácticas,
          la participación y la asistencia por periodo, generadas a partir de las notas reales. Por eso aparecen marcadas con un asterisco.
          Lo medimos: sin ellas, el modelo sigue dando 14 falsas alarmas menos que la regla de las notas.
        </p>
      </Tarjeta>

      <Tarjeta titulo="Lo que el modelo no usa">
        <p>
          No usa consumo de alcohol, relaciones sentimentales o familiares, ni estudios o trabajo de los padres: señalar a un alumno por ellas
          sería estigmatizante. Sexo, zona y escuela tampoco entran al modelo; solo se usan para auditarlo.
        </p>
        <p>
          Tampoco usa las notas del segundo y tercer periodo: la alerta se genera con lo que se sabe al final del primero.
        </p>
      </Tarjeta>

      <Tarjeta titulo="Cómo elegimos el modelo">
        <p>
          Comparamos 7 combinaciones de modelos, todas detectando a los mismos alumnos que la regla «suspende el primer periodo»
          (299 alertas), y elegimos la que da menos falsas alarmas.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b">
                <th className="py-2">Modelo</th><th>Calidad (PR-AUC)</th><th>Acertadas</th><th>Alertas</th><th>Alumnos que la regla no ve</th>
              </tr>
            </thead>
            <tbody>
              {MODELOS.map((m) => (
                <tr key={m.modelo} className={`border-b border-gray-100 ${m.elegido ? 'bg-amber-50 font-semibold' : ''}`}>
                  <td className="py-2">{m.modelo}{m.elegido ? ' (elegido)' : ''}</td>
                  <td>{m.prauc}</td><td>{m.acertadas}</td><td>{m.alertas}</td><td>{m.noVe}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          La <strong>red neuronal</strong> se usa donde es la mejor: estimar la nota final, con un error medio de 1,05 puntos sobre 20
          (frente a 1,08 de Ridge y 1,13 de la regla «la nota final será la del primer periodo») y un intervalo que acierta el 80 % de las veces.
        </p>
      </Tarjeta>

      <Tarjeta titulo="Equidad del modelo">
        <p>Medimos si el modelo acierta igual para todos los grupos.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b"><th className="py-2">Grupo</th><th>Alumnos</th><th>Detectados</th><th>Falsas alarmas</th></tr>
            </thead>
            <tbody>
              {EQUIDAD.map((g) => (
                <tr key={g.grupo} className="border-b border-gray-100">
                  <td className="py-2">{g.grupo}</td><td>{g.n}</td><td>{g.detectados}</td>
                  <td className={g.aviso ? 'text-amber-800 font-semibold' : ''}>{g.falsas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Detecta igual a todos los grupos, pero da más falsas alarmas en zona rural. No lo corregimos con un umbral distinto por zona,
          porque la decisión dependería de dónde vive el alumno. Por eso <strong>ninguna alerta decide nada</strong>: el profesorado la revisa
          y puede descartarla con un motivo.
        </p>
      </Tarjeta>

      {!soloDetalle && (
      <Tarjeta titulo="Lo que Brújula no hace">
        <p>
          No etiqueta a los alumnos, no muestra puntuaciones de riesgo ni rankings, y no toma decisiones automáticas.
          Las alertas orientan; la decisión es siempre del profesor.
        </p>
      </Tarjeta>
      )}
    </div>
  );
}
