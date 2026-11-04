import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { supabase } from '../supabase';
import { SINTETICAS, nombreClase } from '../datos';

const GRUPOS: Record<string, string> = {
  'sex=F': 'Chicas', 'sex=M': 'Chicos',
  'address=R': 'Zona rural', 'address=U': 'Zona urbana',
  'school=GP': 'Escuela GP', 'school=MS': 'Escuela MS',
};

export default function AnalisisCompleto() {
  const { asig, id } = useParams();
  const [resumen, setResumen] = useState<any>(null);
  const [clase, setClase] = useState<any>(null);
  const [asignatura, setAsignatura] = useState('');
  const [nombres, setNombres] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id || !asig) return;
      const [{ data: a }, { data: c }, { data: s }, { data: al }] = await Promise.all([
        supabase.from('analisis_clase').select('resumen, actualizado_en').eq('clase_id', id).eq('asignatura_id', asig).maybeSingle(),
        supabase.from('clase').select('curso, letra').eq('id', id).single(),
        supabase.from('asignatura').select('nombre').eq('id', asig).single(),
        supabase.from('alumno').select('id, nombre').eq('clase_id', id),
      ]);
      setResumen(a?.resumen ?? null);
      setClase(c);
      setAsignatura(s?.nombre ?? '');
      setNombres(Object.fromEntries((al ?? []).map((x: any) => [x.id, x.nombre])));
      setLoading(false);
    })();
  }, [id, asig]);

  const volver = (
    <Link to={`/asignatura/${asig}/clase/${id}`} className="text-sm text-gray-500 hover:text-[#0f3d4c] underline mb-4 inline-block">
      ← Volver a la clase
    </Link>
  );

  if (loading) return <div className="p-8">{volver}<p className="text-gray-500">Cargando análisis...</p></div>;
  if (!resumen) return <div className="p-8">{volver}<p className="text-gray-600">Análisis no disponible para esta clase.</p></div>;

  const importancia = (resumen.importancia ?? []).map((v: any) => ({
    nombre: v.nombre + (SINTETICAS.has(v.variable) ? '*' : ''),
    valor: Number(v.valor),
  }));
  const comparacion = (resumen.comparacion_modelos ?? []) as any[];
  const elegido = comparacion.find((m) => m.modelos === 'logistica + lightgbm');
  const red = resumen.nota_red_neuronal ?? {};
  const pct = resumen.n_alumnos ? Math.round((100 * resumen.n_con_alerta) / resumen.n_alumnos) : 0;

  return (
    <div className="p-8 bg-[#fdfbf7] min-h-screen max-w-5xl mx-auto">
      {volver}
      <h1 className="text-2xl font-bold text-[#0f3d4c]">Análisis completo · {nombreClase(clase)} · {asignatura}</h1>
      <p className="text-sm text-gray-600 mb-6">Resultados del modelo al final del primer periodo. Son estimaciones para orientar, no diagnósticos.</p>

      {/* Cifras clave */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Podrían necesitar apoyo</p>
          <p className="text-3xl font-bold text-[#0f3d4c]">{resumen.n_con_alerta} <span className="text-base font-normal text-gray-500">de {resumen.n_alumnos} ({pct} %)</span></p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Nota final estimada media</p>
          <p className="text-3xl font-bold text-[#0f3d4c]">{resumen.nota_estimada_media != null ? Number(resumen.nota_estimada_media).toFixed(1) : '—'} <span className="text-base font-normal text-gray-500">/ 20</span></p>
          <p className="text-xs text-gray-500">Red neuronal · error medio ±{red.mae ? Number(red.mae).toFixed(1) : '1'} punto</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Calidad de las alertas</p>
          <p className="text-3xl font-bold text-[#0f3d4c]">{elegido ? `${Math.round(elegido.precision * 100)} %` : '—'}</p>
          <p className="text-xs text-gray-500">de las alertas son acertadas, detectando al 84 % de quienes necesitarán apoyo</p>
        </div>
      </div>

      {/* Importancia de variables */}
      <section className="bg-white border border-gray-200 rounded-lg p-4 mb-8">
        <h2 className="text-lg font-semibold text-[#0f3d4c]">Qué pesa más en las alertas de esta clase</h2>
        <p className="text-sm text-gray-600 mb-3">Contribución media de cada variable al modelo (SHAP). Indica en qué se fija el modelo, no qué causa el resultado.</p>
        <div style={{ width: '100%', height: Math.max(220, importancia.length * 34) }}>
          <ResponsiveContainer>
            <BarChart data={importancia} layout="vertical" margin={{ left: 20, right: 20 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="nombre" width={230} tick={{ fontSize: 13 }} />
              <Tooltip formatter={(v: any) => Number(v).toFixed(3)} />
              <Bar dataKey="valor" fill="#0f3d4c" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-500 mt-2">* Variable sintética en esta demo: su peso refleja cómo se generó a partir de las notas, no es un hallazgo.</p>
      </section>

      {/* Alumnos que podrían necesitar apoyo */}
      <section className="bg-white border border-gray-200 rounded-lg p-4 mb-8">
        <h2 className="text-lg font-semibold text-[#0f3d4c] mb-3">Alumnos que podrían necesitar apoyo y por qué</h2>
        {(resumen.alumnos_apoyo ?? []).length === 0 ? (
          <p className="text-gray-600">Ningún alumno de esta clase tiene alerta del modelo.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {(resumen.alumnos_apoyo ?? []).map((a: any) => (
              <li key={a.alumno_id} className="py-2">
                <p className="font-medium text-[#0f3d4c]">{nombres[a.alumno_id] ?? `Alumno ${a.alumno_id}`}</p>
                <p className="text-sm text-gray-700">
                  {(a.motivos ?? []).length
                    ? a.motivos.map((m: any) => `${m.nombre}${SINTETICAS.has(m.variable) ? '*' : ''}: ${m.valor}`).join(' · ')
                    : 'Combinación de varios factores pequeños'}
                </p>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-gray-500 mt-2">Ordenados por número de alumno, no por gravedad. La decisión es siempre del profesor.</p>
      </section>

      {/* Comparación de modelos */}
      <section className="bg-white border border-gray-200 rounded-lg p-4 mb-8">
        <h2 className="text-lg font-semibold text-[#0f3d4c]">Cómo elegimos el modelo</h2>
        <p className="text-sm text-gray-600 mb-3">7 combinaciones comparadas detectando a los mismos alumnos que la regla «suspende el primer periodo» (299 alertas).</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b">
                <th className="py-2">Modelo</th><th>Calidad (PR-AUC)</th><th>Acertadas</th><th>Alertas</th><th>Alumnos que la regla no ve</th>
              </tr>
            </thead>
            <tbody>
              {comparacion.map((m) => (
                <tr key={m.modelos} className={`border-b border-gray-100 ${m.modelos === 'logistica + lightgbm' ? 'bg-amber-50 font-semibold' : ''}`}>
                  <td className="py-2">{m.modelos}{m.modelos === 'logistica + lightgbm' ? ' (elegido)' : ''}</td>
                  <td>{Number(m.pr_auc).toFixed(3)}</td>
                  <td>{Math.round(m.precision * 100)} %</td>
                  <td>{m.alertas}</td>
                  <td>{m.g1_no_ve}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-gray-700 mt-3">
          La <strong>red neuronal</strong> se usa para la nota final estimada, donde es el mejor modelo: error medio de {red.mae ?? '1,05'} puntos,
          con un intervalo que acierta el {red.cobertura_intervalo_80 ? Math.round(red.cobertura_intervalo_80 * 100) : 80} % de las veces.
        </p>
      </section>

      {/* Equidad */}
      <section className="bg-white border border-gray-200 rounded-lg p-4 mb-8">
        <h2 className="text-lg font-semibold text-[#0f3d4c]">Equidad del modelo</h2>
        <p className="text-sm text-gray-600 mb-3">Calculada con los alumnos de los dos centros. Sexo, zona y escuela no entran al modelo: solo se usan para auditarlo.</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 border-b"><th className="py-2">Grupo</th><th>Alumnos</th><th>Detectados</th><th>Falsas alarmas</th></tr>
          </thead>
          <tbody>
            {Object.entries(resumen.equidad ?? {}).map(([g, v]: [string, any]) => (
              <tr key={g} className="border-b border-gray-100">
                <td className="py-2">{GRUPOS[g] ?? g}</td>
                <td>{v.n}</td>
                <td>{Math.round(v.recall * 100)} %</td>
                <td className={v.falsas_alarmas >= 0.14 ? 'text-amber-800 font-semibold' : ''}>{Math.round(v.falsas_alarmas * 100)} %</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-gray-600 mt-2">
          El modelo detecta igual a todos los grupos, pero da más falsas alarmas en zona rural. Por eso ninguna alerta decide nada: el profesor la revisa y puede descartarla.
        </p>
      </section>
    </div>
  );
}
