import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { NOTA_MAX, cargarAlertas, nombreClase, num, sobre10 } from '../datos';
import TarjetaAlerta from '../components/TarjetaAlerta';

// Ficha de un alumno para su profesor. Las reglas de Supabase solo devuelven datos de
// alumnos de las clases y asignaturas que imparte. Nunca se muestra la probabilidad de
// necesitar apoyo ni variables sensibles (salud, ocio, situación familiar).

const ESTUDIO: Record<number, string> = { 1: 'Menos de 2 h', 2: 'De 2 a 5 h', 3: 'De 5 a 10 h', 4: 'Más de 10 h' };
const TRAYECTO: Record<number, string> = { 1: 'Menos de 15 min', 2: 'De 15 a 30 min', 3: 'De 30 a 60 min', 4: 'Más de 1 h' };
const TIPOS: Record<string, string> = {
  tutoría: 'Tutoría con el alumno', reunión_familia: 'Reunión con la familia',
  refuerzo: 'Material de refuerzo', seguimiento: 'Seguimiento en clase',
};

const media = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

function Fila({ nombre, alumno, clase, max, sufijo = '', sintetica = false }: {
  nombre: string; alumno: number | null; clase: number | null; max: number; sufijo?: string; sintetica?: boolean;
}) {
  const pa = alumno != null ? Math.min(100, (100 * alumno) / max) : 0;
  const pc = clase != null ? Math.min(100, (100 * clase) / max) : 0;
  const debajo = alumno != null && clase != null && alumno < clase;
  return (
    <div className="py-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-700">{nombre}{sintetica ? '*' : ''}</span>
        <span>
          <strong className={debajo ? 'text-amber-800' : 'text-[#0f3d4c]'}>{num(alumno)}{sufijo}</strong>
          <span className="text-gray-500"> · media de la clase {num(clase)}{sufijo}</span>
        </span>
      </div>
      <div className="relative h-3 bg-gray-100 rounded mt-1">
        <div className={`absolute h-3 rounded ${debajo ? 'bg-amber-400' : 'bg-[#0f3d4c]'}`} style={{ width: `${pa}%` }} />
        <div className="absolute top-[-3px] h-[18px] w-[2px] bg-gray-500" style={{ left: `${pc}%` }} title="Media de la clase" />
      </div>
    </div>
  );
}

export default function Alumno() {
  const { asig, clase: claseId, id } = useParams();
  const [alumno, setAlumno] = useState<any>(null);
  const [clase, setClase] = useState<any>(null);
  const [asignatura, setAsignatura] = useState('');
  const [suyo, setSuyo] = useState<any>(null);
  const [medias, setMedias] = useState<any>({});
  const [prediccion, setPrediccion] = useState<any>(null);
  const [contexto, setContexto] = useState<any>(null);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [acciones, setAcciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function cargar() {
    if (!id || !asig || !claseId) return;
    const [{ data: al }, { data: c }, { data: s }, { data: rc }, { data: p }, { data: ctx }, todas, { data: acc }] = await Promise.all([
      supabase.from('alumno').select('id, nombre, edad').eq('id', id).single(),
      supabase.from('clase').select('curso, letra').eq('id', claseId).single(),
      supabase.from('asignatura').select('nombre').eq('id', asig).single(),
      supabase
        .from('alumno')
        .select('id, rendimiento ( nota_examen, nota_practicas, participacion, asistencia )')
        .eq('clase_id', claseId)
        .eq('rendimiento.asignatura_id', asig)
        .eq('rendimiento.periodo', 1),
      supabase.from('prediccion').select('nota_final_estimada, ic_inf, ic_sup').eq('alumno_id', id).eq('asignatura_id', asig).eq('periodo', 1).maybeSingle(),
      supabase.from('contexto_alumno').select('studytime, failures, traveltime, schoolsup, activities').eq('alumno_id', id).eq('asignatura_id', asig).maybeSingle(),
      cargarAlertas({ asignaturaId: asig, claseId }),
      supabase.from('accion').select('id, tipo, descripcion, fecha_inicio, fecha_revision, resultado, alerta!inner ( alumno_id, asignatura_id, titulo )').eq('alerta.alumno_id', id).eq('alerta.asignatura_id', asig),
    ]);
    setAlumno(al);
    setClase(c);
    setAsignatura(s?.nombre ?? '');
    const filas = (rc ?? []).filter((x: any) => x.rendimiento?.length).map((x: any) => ({ id: x.id, ...x.rendimiento[0] }));
    setSuyo(filas.find((f: any) => String(f.id) === String(id)) ?? null);
    const col = (k: string) => media(filas.map((f: any) => Number(f[k])).filter((v: number) => !isNaN(v)));
    setMedias({ examen: col('nota_examen'), practicas: col('nota_practicas'), participacion: col('participacion'), asistencia: col('asistencia') });
    setPrediccion(p);
    setContexto(ctx);
    setAlertas(todas.filter((a: any) => a.nivel === 'alumno' && String(a.alumno_id) === String(id)));
    setAcciones(acc ?? []);
    setLoading(false);
  }

  useEffect(() => {
    cargar();
  }, [id, asig, claseId]);

  const volver = (
    <Link to={`/asignatura/${asig}/clase/${claseId}`} className="text-sm text-gray-500 hover:text-[#0f3d4c] underline mb-4 inline-block">
      ← Volver a la clase
    </Link>
  );

  if (loading) return <div className="p-8">{volver}<p className="text-gray-500">Cargando...</p></div>;
  if (!alumno || !suyo) return <div className="p-8">{volver}<p className="text-gray-600">No tienes acceso a los datos de este alumno en esta asignatura.</p></div>;

  return (
    <div className="p-8 bg-[#fdfbf7] min-h-screen max-w-4xl mx-auto">
      {volver}
      <h1 className="text-2xl font-bold text-[#0f3d4c]">{alumno.nombre}</h1>
      <p className="text-sm text-gray-600 mb-6">
        {nombreClase(clase)} · {asignatura}{alumno.edad ? ` · ${alumno.edad} años` : ''} · datos del primer periodo · alumno ficticio
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Primer periodo frente a la clase */}
        <section className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="font-semibold text-[#0f3d4c] mb-1">Primer periodo frente a la clase</h2>
          <p className="text-xs text-gray-500 mb-2">La línea vertical marca la media de la clase. En ámbar, lo que está por debajo.</p>
          <Fila nombre="Examen" alumno={sobre10(suyo.nota_examen)} clase={sobre10(medias.examen)} max={NOTA_MAX} />
          <Fila nombre="Prácticas" alumno={sobre10(suyo.nota_practicas)} clase={sobre10(medias.practicas)} max={NOTA_MAX} sintetica />
          <Fila nombre="Participación" alumno={suyo.participacion} clase={medias.participacion} max={10} sintetica />
          <Fila nombre="Asistencia" alumno={suyo.asistencia} clase={medias.asistencia} max={100} sufijo=" %" sintetica />
          <p className="text-xs text-gray-500 mt-2">* Variable sintética en esta demo.</p>
        </section>

        {/* Nota estimada */}
        <section className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="font-semibold text-[#0f3d4c] mb-1">Nota final estimada</h2>
          {prediccion?.ic_inf != null ? (
            <>
              <p className="text-3xl font-bold text-[#0f3d4c] mt-2">
                {num(sobre10(prediccion.ic_inf))} – {num(sobre10(prediccion.ic_sup))} <span className="text-base font-normal text-gray-500">/ {NOTA_MAX}</span>
              </p>
              <p className="text-sm text-gray-600 mt-1">Valor central: {num(sobre10(prediccion.nota_final_estimada))}</p>
              <p className="text-xs text-gray-500 mt-3">
                Estimación de la red neuronal con los datos del primer periodo. En 8 de cada 10 alumnos, la nota real queda dentro de
                este rango. Es orientativa: no es una calificación ni un pronóstico seguro.
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-600">No hay estimación disponible.</p>
          )}
        </section>
      </div>

      {/* Alertas */}
      <section className="mb-6">
        <h2 className="font-semibold text-[#0f3d4c] mb-2">Alertas</h2>
        {alertas.length === 0 ? (
          <p className="text-sm text-gray-600 bg-white border border-gray-200 rounded-lg p-4">Este alumno no tiene alertas en {asignatura}.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {alertas.map((a) => (
              <TarjetaAlerta key={a.id} alerta={a} mostrarContexto={false} onCambio={cargar} />
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contexto */}
        <section className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="font-semibold text-[#0f3d4c] mb-2">Contexto</h2>
          {contexto ? (
            <dl className="text-sm grid grid-cols-2 gap-y-1">
              <dt className="text-gray-600">Tiempo de estudio semanal</dt><dd>{ESTUDIO[contexto.studytime] ?? '-'}</dd>
              <dt className="text-gray-600">Suspensos previos</dt><dd>{contexto.failures ?? '-'}</dd>
              <dt className="text-gray-600">Tiempo de trayecto</dt><dd>{TRAYECTO[contexto.traveltime] ?? '-'}</dd>
              <dt className="text-gray-600">Apoyo educativo del centro</dt><dd>{contexto.schoolsup ? 'Sí' : 'No'}</dd>
              <dt className="text-gray-600">Actividades extraescolares</dt><dd>{contexto.activities ? 'Sí' : 'No'}</dd>
            </dl>
          ) : (
            <p className="text-sm text-gray-600">Sin datos de contexto.</p>
          )}
          <p className="text-xs text-gray-500 mt-2">Datos reales del dataset de la UCI. No se muestran datos de salud, ocio ni familia.</p>
        </section>

        {/* Acciones */}
        <section className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="font-semibold text-[#0f3d4c] mb-2">Acciones registradas</h2>
          {acciones.length === 0 ? (
            <p className="text-sm text-gray-600">Todavía no has registrado ninguna acción con este alumno.</p>
          ) : (
            <ul className="divide-y divide-gray-100 text-sm">
              {acciones.map((a) => (
                <li key={a.id} className="py-2">
                  <p className="font-medium text-[#0f3d4c]">{TIPOS[a.tipo] ?? a.tipo}</p>
                  <p className="text-gray-700">{a.descripcion}</p>
                  <p className="text-xs text-gray-500">
                    Desde {a.fecha_inicio}{a.fecha_revision ? ` · revisar el ${a.fecha_revision}` : ''}
                    {a.resultado ? ` · resultado: ${a.resultado}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
