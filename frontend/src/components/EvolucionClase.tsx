import { useEffect, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { supabase } from '../supabase';
import { nombreAsignatura, num, sobre10 } from '../datos';
import { useIdioma } from '../i18n';

const ASIG_SINTETICAS = new Set(['Inglés', 'Ciencias']);

// Número en negrita dentro de las frases (las frases, con su singular y plural, están en src/i18n)
const B = (n: number) => <strong>{n}</strong>;

// Evolución de la clase en los tres periodos y comprobación retrospectiva de las alertas.
// Solo datos agregados de la clase: nunca alumnos individuales.
export default function EvolucionClase({ claseId, asignaturaId }: { claseId: string; asignaturaId: string }) {
  const { t } = useIdioma();
  const e = t.evolucion;
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
        periodo: t.app.trimestre(Number(f.periodo)),
        examen: sobre10(Number(f.media_examen)),
        practicas: sobre10(Number(f.media_practicas)),
        participacion: Number(f.media_participacion),
        asistencia: Number(f.media_asistencia),
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
        <h2 className="text-lg font-semibold text-[#0f3d4c]">{e.titulo}</h2>
        <p className="text-sm text-gray-600">{e.privacidad}</p>
      </section>
    );
  }

  const fmt = (v: any) => num(v);

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-4 mt-8">
      <h2 className="text-lg font-semibold text-[#0f3d4c]">{e.titulo}</h2>
      <p className="text-sm text-gray-600 mb-4">{cursoTerminado ? e.terminado : e.enMarcha}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p className="text-sm font-medium text-[#0f3d4c] mb-1">{e.notas}</p>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={serie} margin={{ left: -10, right: 10, top: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="periodo" tick={{ fontSize: 12 }} padding={{ left: 30, right: 30 }} />
                <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fontSize: 12 }} />
                <Tooltip formatter={fmt} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="examen" name={e.examen} stroke="#0f3d4c" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="practicas" name={e.practicas} stroke="#E9B45C" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3, strokeDasharray: 'none' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-[#0f3d4c] mb-1">{e.partAsis}</p>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={serie} margin={{ left: -10, right: 0, top: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="periodo" tick={{ fontSize: 12 }} padding={{ left: 30, right: 30 }} />
                <YAxis yAxisId="part" domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fontSize: 12 }} />
                <YAxis yAxisId="asis" orientation="right" domain={[50, 100]} ticks={[50, 75, 100]} tick={{ fontSize: 12 }} unit="%" />
                <Tooltip formatter={fmt} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line yAxisId="part" type="monotone" dataKey="participacion" name={e.participacion} stroke="#0f3d4c" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3, strokeDasharray: 'none' }} />
                <Line yAxisId="asis" type="monotone" dataKey="asistencia" name={e.asistencia} stroke="#6b8f9a" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3, strokeDasharray: 'none' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2">{e.sintetica}</p>

      {/* Comprobación de las alertas tempranas */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-[#fdfbf7] p-4">
        <h3 className="font-semibold text-[#0f3d4c] mb-1">{e.acertaron}</h3>
        {!cursoTerminado ? (
          <p className="text-sm text-gray-600">{e.cuandoTermine}</p>
        ) : !aciertos ? (
          <p className="text-sm text-gray-600">{e.gruposPequenos}</p>
        ) : (
          <div className="text-sm text-gray-700 space-y-1">
            <p>{e.avisados(aciertos.avisados, aciertos.aciertos, B)}</p>
            <p>{e.necesitaron(aciertos.necesitaron_apoyo, aciertos.aciertos, B)}</p>
            <p className="text-xs text-gray-500 pt-1">
              {e.definicion}
              {ASIG_SINTETICAS.has(asignatura) ? e.menosValor(nombreAsignatura(asignatura)) : ''}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
