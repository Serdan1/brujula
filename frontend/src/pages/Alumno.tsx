import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { NOTA_MAX, cargarAlertas, fecha, nombreAsignatura, nombreClase, num, sobre10 } from '../datos';
import { useIdioma } from '../i18n';
import TarjetaAlerta from '../components/TarjetaAlerta';

// Ficha de un alumno para su profesor. Las reglas de Supabase solo devuelven datos de
// alumnos de las clases y asignaturas que imparte. Nunca se muestra la probabilidad de
// necesitar apoyo ni variables sensibles (salud, ocio, situación familiar).

// Los textos están en src/i18n (alumno.*)

const media = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

function Fila({ nombre, alumno, clase, max, sufijo = '', sintetica = false }: {
  nombre: string; alumno: number | null; clase: number | null; max: number; sufijo?: string; sintetica?: boolean;
}) {
  const pa = alumno != null ? Math.min(100, (100 * alumno) / max) : 0;
  const pc = clase != null ? Math.min(100, (100 * clase) / max) : 0;
  const debajo = alumno != null && clase != null && alumno < clase;
  const { t } = useIdioma();
  return (
    <div className="py-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-700">{nombre}{sintetica ? '*' : ''}</span>
        <span>
          <strong className={debajo ? 'text-amber-800' : 'text-[#0f3d4c]'}>{num(alumno)}{sufijo}</strong>
          <span className="text-gray-500"> · {t.alumno.mediaClase} {num(clase)}{sufijo}</span>
        </span>
      </div>
      <div className="relative h-3 bg-gray-100 rounded mt-1">
        <div className={`absolute h-3 rounded ${debajo ? 'bg-amber-400' : 'bg-[#0f3d4c]'}`} style={{ width: `${pa}%` }} />
        <div className="absolute top-[-3px] h-[18px] w-[2px] bg-gray-500" style={{ left: `${pc}%` }} title={t.alumno.mediaClase} />
      </div>
    </div>
  );
}

export default function Alumno() {
  const { t } = useIdioma();
  const a_ = t.alumno;
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
    setAsignatura(nombreAsignatura(s?.nombre));
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
      {t.app.volverClase}
    </Link>
  );

  if (loading) return <div className="p-8">{volver}<p className="text-gray-500">{t.app.cargando}</p></div>;
  if (!alumno || !suyo) return <div className="p-8">{volver}<p className="text-gray-600">{a_.sinAcceso}</p></div>;

  return (
    <div className="p-8 bg-[#fdfbf7] min-h-screen max-w-4xl mx-auto">
      {volver}
      <h1 className="text-2xl font-bold text-[#0f3d4c]">{alumno.nombre}</h1>
      <p className="text-sm text-gray-600 mb-6">
        {nombreClase(clase)} · {asignatura}{alumno.edad ? ` · ${a_.edad(alumno.edad)}` : ''} · {a_.subtitulo}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Primer periodo frente a la clase */}
        <section className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="font-semibold text-[#0f3d4c] mb-1">{a_.frenteClase}</h2>
          <p className="text-xs text-gray-500 mb-2">{a_.frenteClaseNota}</p>
          <Fila nombre={a_.examen} alumno={sobre10(suyo.nota_examen)} clase={sobre10(medias.examen)} max={NOTA_MAX} />
          <Fila nombre={a_.practicas} alumno={sobre10(suyo.nota_practicas)} clase={sobre10(medias.practicas)} max={NOTA_MAX} sintetica />
          <Fila nombre={a_.participacion} alumno={suyo.participacion} clase={medias.participacion} max={10} sintetica />
          <Fila nombre={a_.asistencia} alumno={suyo.asistencia} clase={medias.asistencia} max={100} sufijo=" %" sintetica />
          <p className="text-xs text-gray-500 mt-2">{t.app.sinteticaUna}</p>
        </section>

        {/* Nota estimada */}
        <section className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="font-semibold text-[#0f3d4c] mb-1">{a_.notaEstimada}</h2>
          {prediccion?.ic_inf != null ? (
            <>
              <p className="text-3xl font-bold text-[#0f3d4c] mt-2">
                {num(sobre10(prediccion.ic_inf))} – {num(sobre10(prediccion.ic_sup))} <span className="text-base font-normal text-gray-500">/ {NOTA_MAX}</span>
              </p>
              <p className="text-sm text-gray-600 mt-1">{a_.valorCentral} {num(sobre10(prediccion.nota_final_estimada))}</p>
              <p className="text-xs text-gray-500 mt-3">
                {a_.estimadaNota}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-600">{a_.sinEstimacion}</p>
          )}
        </section>
      </div>

      {/* Alertas */}
      <section className="mb-6">
        <h2 className="font-semibold text-[#0f3d4c] mb-2">{a_.alertas}</h2>
        {alertas.length === 0 ? (
          <p className="text-sm text-gray-600 bg-white border border-gray-200 rounded-lg p-4">{a_.sinAlertas(asignatura)}</p>
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
          <h2 className="font-semibold text-[#0f3d4c] mb-2">{a_.contexto}</h2>
          {contexto ? (
            <dl className="text-sm grid grid-cols-2 gap-y-1">
              <dt className="text-gray-600">{a_.ctxEstudio}</dt><dd>{a_.estudio[contexto.studytime] ?? '-'}</dd>
              <dt className="text-gray-600">{a_.ctxSuspensos}</dt><dd>{contexto.failures ?? '-'}</dd>
              <dt className="text-gray-600">{a_.ctxTrayecto}</dt><dd>{a_.trayecto[contexto.traveltime] ?? '-'}</dd>
              <dt className="text-gray-600">{a_.ctxApoyo}</dt><dd>{contexto.schoolsup ? t.app.si : t.app.no}</dd>
              <dt className="text-gray-600">{a_.ctxActividades}</dt><dd>{contexto.activities ? t.app.si : t.app.no}</dd>
            </dl>
          ) : (
            <p className="text-sm text-gray-600">{a_.sinContexto}</p>
          )}
          <p className="text-xs text-gray-500 mt-2">{a_.contextoNota}</p>
        </section>

        {/* Acciones */}
        <section className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="font-semibold text-[#0f3d4c] mb-2">{a_.acciones}</h2>
          {acciones.length === 0 ? (
            <p className="text-sm text-gray-600">{a_.sinAcciones}</p>
          ) : (
            <ul className="divide-y divide-gray-100 text-sm">
              {acciones.map((a) => (
                <li key={a.id} className="py-2">
                  <p className="font-medium text-[#0f3d4c]">{t.tiposAccion[a.tipo] ?? a.tipo}</p>
                  <p className="text-gray-700">{a.descripcion}</p>
                  <p className="text-xs text-gray-500">
                    {a_.desde(fecha(a.fecha_inicio))}{a.fecha_revision ? a_.revisarEl(fecha(a.fecha_revision)) : ''}
                    {a.resultado ? a_.resultado(a.resultado) : ''}
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
