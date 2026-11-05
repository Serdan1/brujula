import { useEffect, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { supabase } from '../supabase';
import { num, sobre10 } from '../datos';

const ASIG_SINTETICAS = new Set(['Inglés', 'Ciencias']);

const B = ({ n }: { n: number }) => <strong>{n}</strong>;

// Frases que concuerdan en singular y plural
function fraseAvisados(avisados: number, aciertos: number) {
  if (avisados === 0) return <>Brújula no avisó de ningún alumno de esta clase en el 1.º trimestre.</>;
  if (avisados === 1)
    return <>Brújula avisó de <B n={1} /> alumno en el 1.º trimestre: {aciertos === 1 ? 'acabó necesitando apoyo.' : 'no acabó necesitando apoyo.'}</>;
  const final = aciertos === 0 ? 'ninguno acabó necesitando apoyo.'
    : aciertos === avisados ? 'todos acabaron necesitando apoyo.'
    : aciertos === 1 ? <><B n={1} /> acabó necesitando apoyo.</>
    : <><B n={aciertos} /> acabaron necesitando apoyo.</>;
  return <>Brújula avisó de <B n={avisados} /> alumnos en el 1.º trimestre: {final}</>;
}

function fraseNecesitaron(necesitaron: number, aciertos: number) {
  if (necesitaron === 0) return <>Ningún alumno de esta clase terminó el curso por debajo de 5.</>;
  if (necesitaron === 1)
    return <><B n={1} /> alumno terminó el curso necesitando apoyo: {aciertos === 1 ? 'estaba avisado a tiempo.' : 'no estaba avisado.'}</>;
  const final = aciertos === 0 ? 'ninguno estaba avisado.'
    : aciertos === necesitaron ? 'todos estaban avisados a tiempo.'
    : aciertos === 1 ? <><B n={1} /> estaba avisado a tiempo.</>
    : <><B n={aciertos} /> estaban avisados a tiempo.</>;
  return <><B n={necesitaron} /> alumnos terminaron el curso necesitando apoyo: {final}</>;
}

// Evolución de la clase en los tres periodos y comprobación retrospectiva de las alertas.
// Solo datos agregados de la clase: nunca alumnos individuales.
export default function EvolucionClase({ claseId, asignaturaId }: { claseId: string; asignaturaId: string }) {
  const [serie, setSerie] = useState<any[]>([]);
  const [aciertos, setAciertos] = useState<any>(null);
  const [asignatura, setAsignatura] = useState('');
  const [loading, setLoading] = useState(true);
  const [cursoTerminado, setCursoTerminado] = useState(false); // ¿hay datos del 3.º trimestre?

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
        Examen: sobre10(Number(f.media_examen)),
        'Prácticas*': sobre10(Number(f.media_practicas)),
        'Participación*': Number(f.media_participacion),
        'Asistencia*': Number(f.media_asistencia),
      })));
      setCursoTerminado((v ?? []).some((f: any) => Number(f.periodo) === 3));
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
        {cursoTerminado
          ? 'Seguimiento retrospectivo: así terminó el curso. Medias de la clase en cada trimestre.'
          : 'Curso en marcha: medias de la clase en cada trimestre registrado.'}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p className="text-sm font-medium text-[#0f3d4c] mb-1">Notas (sobre 10)</p>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={serie} margin={{ left: -10, right: 10, top: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="periodo" tick={{ fontSize: 12 }} padding={{ left: 30, right: 30 }} />
                <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fontSize: 12 }} />
                <Tooltip formatter={fmt} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="Examen" stroke="#0f3d4c" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Prácticas*" stroke="#E9B45C" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3, strokeDasharray: 'none' }} />
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
                <XAxis dataKey="periodo" tick={{ fontSize: 12 }} padding={{ left: 30, right: 30 }} />
                <YAxis yAxisId="part" domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fontSize: 12 }} />
                <YAxis yAxisId="asis" orientation="right" domain={[50, 100]} ticks={[50, 75, 100]} tick={{ fontSize: 12 }} unit="%" />
                <Tooltip formatter={fmt} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line yAxisId="part" type="monotone" dataKey="Participación*" stroke="#0f3d4c" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3, strokeDasharray: 'none' }} />
                <Line yAxisId="asis" type="monotone" dataKey="Asistencia*" stroke="#6b8f9a" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3, strokeDasharray: 'none' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2">* Variable sintética en esta demo. La nota de examen de Portugués y Matemáticas es real.</p>

      {/* Comprobación de las alertas tempranas */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-[#fdfbf7] p-4">
        <h3 className="font-semibold text-[#0f3d4c] mb-1">¿Acertaron los avisos del 1.º trimestre?</h3>
        {!cursoTerminado ? (
          <p className="text-sm text-gray-600">Se podrá comprobar cuando termine el curso.</p>
        ) : !aciertos ? (
          <p className="text-sm text-gray-600">No se muestra en grupos de menos de 5 alumnos.</p>
        ) : (
          <div className="text-sm text-gray-700 space-y-1">
            <p>{fraseAvisados(aciertos.avisados, aciertos.aciertos)}</p>
            <p>{fraseNecesitaron(aciertos.necesitaron_apoyo, aciertos.aciertos)}</p>
            <p className="text-xs text-gray-500 pt-1">
              «Necesitar apoyo» es terminar el curso con menos de 5 sobre 10 en el examen. Los avisos se calcularon sin que el modelo
              viera a estos alumnos al entrenar.
              {ASIG_SINTETICAS.has(asignatura) ? ` En ${asignatura}, todas las notas son sintéticas: esta comprobación tiene menos valor.` : ''}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
