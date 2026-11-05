import { useEffect, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { supabase } from '../supabase';
import { num } from '../datos';

const ASIG_SINTETICAS = new Set(['Inglés', 'Ciencias']);

// Evolución de la clase en los tres periodos y comprobación retrospectiva de las alertas.
// Solo datos agregados de la clase: nunca alumnos individuales.
export default function EvolucionClase({ claseId, asignaturaId }: { claseId: string; asignaturaId: string }) {
  const [serie, setSerie] = useState<any[]>([]);
  const [aciertos, setAciertos] = useState<any>(null);
  const [asignatura, setAsignatura] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: v }, { data: a }, { data: s }] = await Promise.all([
        supabase.from('v_clase_resumen')
          .select('periodo, media_examen, media_practicas, media_participacion, media_asistencia')
          .eq('clase_id', claseId).eq('asignatura_id', asignaturaId).order('periodo'),
        supabase.from('v_aciertos_alertas')
          .select('avisados, necesitaron_apoyo, aciertos')
          .eq('clase_id', claseId).eq('asignatura_id', asignaturaId).maybeSingle(),
        supabase.from('asignatura').select('nombre').eq('id', asignaturaId).single(),
      ]);
      setSerie((v ?? []).map((f: any) => ({
        periodo: `${f.periodo}.º trimestre`,
        Examen: Number(f.media_examen),
        'Prácticas*': Number(f.media_practicas),
        'Participación*': Number(f.media_participacion),
        'Asistencia*': Number(f.media_asistencia),
      })));
      setAciertos(a);
      setAsignatura(s?.nombre ?? '');
      setLoading(false);
    })();
  }, [claseId, asignaturaId]);

  if (loading) return null;

  if (serie.length === 0) {
    return (
      <section className="bg-white border border-gray-200 rounded-lg p-4 mt-8">
        <h2 className="text-lg font-semibold text-[#0f3d4c]">Cómo ha evolucionado la clase</h2>
        <p className="text-sm text-gray-600">No se muestra la evolución de grupos de menos de 5 alumnos para proteger su privacidad.</p>
      </section>
    );
  }

  const fmt = (v: any) => num(v);

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-4 mt-8">
      <h2 className="text-lg font-semibold text-[#0f3d4c]">Cómo ha evolucionado la clase</h2>
      <p className="text-sm text-gray-600 mb-4">
        Seguimiento retrospectivo: así terminó el curso. Medias de la clase en cada trimestre.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p className="text-sm font-medium text-[#0f3d4c] mb-1">Notas (sobre 20)</p>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={serie} margin={{ left: -10, right: 10, top: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 20]} tick={{ fontSize: 12 }} />
                <Tooltip formatter={fmt} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="Examen" stroke="#0f3d4c" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Prácticas*" stroke="#E9B45C" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-[#0f3d4c] mb-1">Participación (sobre 10) y asistencia (%)</p>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={serie} margin={{ left: -10, right: 0, top: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="part" domain={[0, 10]} tick={{ fontSize: 12 }} />
                <YAxis yAxisId="asis" orientation="right" domain={[50, 100]} tick={{ fontSize: 12 }} unit="%" />
                <Tooltip formatter={fmt} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line yAxisId="part" type="monotone" dataKey="Participación*" stroke="#0f3d4c" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3 }} />
                <Line yAxisId="asis" type="monotone" dataKey="Asistencia*" stroke="#6b8f9a" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2">* Variable sintética en esta demo. La nota de examen de Portugués y Matemáticas es real.</p>

      {/* Comprobación de las alertas tempranas */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-[#fdfbf7] p-4">
        <h3 className="font-semibold text-[#0f3d4c] mb-1">¿Acertaron los avisos del 1.º trimestre?</h3>
        {!aciertos ? (
          <p className="text-sm text-gray-600">No se muestra en grupos de menos de 5 alumnos.</p>
        ) : (
          <div className="text-sm text-gray-700 space-y-1">
            <p>
              {aciertos.avisados === 0
                ? 'Brújula no avisó de ningún alumno de esta clase en el 1.º trimestre.'
                : <>De los <strong>{aciertos.avisados}</strong> {aciertos.avisados === 1 ? 'alumno avisado' : 'alumnos avisados'} en el 1.º trimestre,{' '}
                    <strong>{aciertos.aciertos}</strong> {aciertos.aciertos === 1 ? 'acabó' : 'acabaron'} necesitando apoyo.</>}
            </p>
            <p>
              {aciertos.necesitaron_apoyo === 0
                ? 'Ningún alumno de esta clase terminó el curso por debajo de 10.'
                : <>De los <strong>{aciertos.necesitaron_apoyo}</strong> que lo necesitaron, <strong>{aciertos.aciertos}</strong>{' '}
                    {aciertos.aciertos === 1 ? 'fue avisado' : 'fueron avisados'} a tiempo.</>}
            </p>
            <p className="text-xs text-gray-500 pt-1">
              «Necesitar apoyo» es terminar el curso con menos de 10 sobre 20 en el examen. Los avisos se calcularon sin que el modelo
              viera a estos alumnos al entrenar.
              {ASIG_SINTETICAS.has(asignatura) ? ` En ${asignatura}, todas las notas son sintéticas: esta comprobación tiene menos valor.` : ''}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
