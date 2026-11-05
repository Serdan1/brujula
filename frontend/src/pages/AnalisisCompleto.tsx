import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { supabase } from '../supabase';
import { NOTA_MAX, SINTETICAS, cargarAlertas, comaDecimal, nombreClase, num, sobre10, valorNota } from '../datos';

// Análisis de UNA clase: solo información propia de esa clase.
// Cómo se eligió el modelo y su equidad están en el apartado «Cómo funciona Brújula».
export default function AnalisisCompleto() {
  const { asig, id } = useParams();
  const [resumen, setResumen] = useState<any>(null);
  const [clase, setClase] = useState<any>(null);
  const [asignatura, setAsignatura] = useState('');
  const [nombres, setNombres] = useState<Record<number, string>>({});
  const [altas, setAltas] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id || !asig) return;
      const [{ data: a }, { data: c }, { data: s }, { data: al }, alertas] = await Promise.all([
        supabase.from('analisis_clase').select('resumen').eq('clase_id', id).eq('asignatura_id', asig).maybeSingle(),
        supabase.from('clase').select('curso, letra').eq('id', id).single(),
        supabase.from('asignatura').select('nombre').eq('id', asig).single(),
        supabase.from('alumno').select('id, nombre').eq('clase_id', id),
        cargarAlertas({ asignaturaId: asig, claseId: id }),
      ]);
      setResumen(a?.resumen ?? null);
      setClase(c);
      setAsignatura(s?.nombre ?? '');
      setNombres(Object.fromEntries((al ?? []).map((x: any) => [x.id, x.nombre])));
      setAltas(new Set(alertas.filter((x: any) => x.nivel === 'alumno' && x.severidad === 'alta').map((x: any) => x.alumno_id)).size);
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
  const error = resumen.nota_red_neuronal?.mae ?? 1.05;
  const pct = resumen.n_alumnos ? Math.round((100 * resumen.n_con_alerta) / resumen.n_alumnos) : 0;
  const apoyo = (resumen.alumnos_apoyo ?? []) as any[];

  return (
    <div className="p-8 bg-[#fdfbf7] min-h-screen max-w-5xl mx-auto">
      {volver}
      <h1 className="text-2xl font-bold text-[#0f3d4c]">Análisis completo · {nombreClase(clase)} · {asignatura}</h1>
      <p className="text-sm text-gray-600 mb-6">Resultados del modelo al final del primer periodo. Son estimaciones para orientar, no diagnósticos.</p>

      {/* Cifras de la clase */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Podrían necesitar apoyo</p>
          <p className="text-3xl font-bold text-[#0f3d4c]">
            {resumen.n_con_alerta} <span className="text-base font-normal text-gray-500">de {resumen.n_alumnos} ({pct} %)</span>
          </p>
        </div>
        <div className={`border rounded-lg p-4 ${altas > 0 ? 'bg-amber-50 border-amber-400' : 'bg-white border-gray-200'}`}>
          <p className="text-sm text-gray-600">Con prioridad alta</p>
          <p className="text-3xl font-bold text-[#0f3d4c]">
            {altas} <span className="text-base font-normal text-gray-500">{altas === 1 ? 'alumno' : 'alumnos'}</span>
          </p>
          <p className="text-xs text-gray-500">Conviene revisarlos primero</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Nota final estimada media</p>
          <p className="text-3xl font-bold text-[#0f3d4c]">
            {num(sobre10(resumen.nota_estimada_media))} <span className="text-base font-normal text-gray-500">/ {NOTA_MAX}</span>
          </p>
          <p className="text-xs text-gray-500">Red neuronal · error medio ±{num(sobre10(error), 2)} puntos</p>
        </div>
      </div>

      {/* Qué pesa más en esta clase */}
      <section className="bg-white border border-gray-200 rounded-lg p-4 mb-8">
        <h2 className="text-lg font-semibold text-[#0f3d4c]">Qué pesa más en las alertas de esta clase</h2>
        <p className="text-sm text-gray-600 mb-3">Contribución media de cada variable al modelo (SHAP). Indica en qué se fija el modelo, no qué causa el resultado.</p>
        <div style={{ width: '100%', height: Math.max(220, importancia.length * 34) }}>
          <ResponsiveContainer>
            <BarChart data={importancia} layout="vertical" margin={{ left: 20, right: 20 }}>
              <XAxis type="number" hide />

<YAxis
  type="category"
  dataKey="nombre"
  width={120}
  tick={{ fontSize: 13 }}
/>

<Tooltip
  formatter={(v: any) => num(v, 3)}
/>

              <Bar dataKey="valor" fill="#0f3d4c" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-500 mt-2">* Variable sintética en esta demo: su peso refleja cómo se generó a partir de las notas, no es un hallazgo.</p>
      </section>

      {/* Alumnos que podrían necesitar apoyo */}
      <section className="bg-white border border-gray-200 rounded-lg p-4 mb-8">
        <h2 className="text-lg font-semibold text-[#0f3d4c] mb-3">Alumnos que podrían necesitar apoyo y por qué</h2>
        {apoyo.length === 0 ? (
          <p className="text-gray-600">Ningún alumno de esta clase tiene alerta del modelo.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {apoyo.map((a: any) => (
              <li key={a.alumno_id} className="py-2">
                <p className="font-medium text-[#0f3d4c]">{nombres[a.alumno_id] ?? `Alumno ${a.alumno_id}`}</p>
                <p className="text-sm text-gray-700">
                  {(a.motivos ?? []).length
                    ? a.motivos.map((m: any) => `${m.nombre}${SINTETICAS.has(m.variable) ? '*' : ''}: ${comaDecimal(valorNota(m.variable, String(m.valor)))}`).join(' · ')
                    : 'Combinación de varios factores pequeños'}
                </p>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-gray-500 mt-2">Ordenados por número de alumno, no por gravedad. La decisión es siempre del profesor.</p>
      </section>

      <p className="text-sm text-gray-600">
        ¿Cómo se eligió el modelo, qué datos usa y es justo con todos los alumnos?{' '}
        <Link to="/como-funciona" className="text-[#0f3d4c] underline font-medium">Cómo funciona Brújula →</Link>
      </p>
    </div>
  );
}
