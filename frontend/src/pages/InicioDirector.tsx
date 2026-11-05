import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { cargarAlertas, miProfesor, nombreAsignatura, nombreClase, num, olvidarProfesor, sobre10 } from '../datos';
import { useIdioma } from '../i18n';
import TarjetaAlerta from '../components/TarjetaAlerta';
import BotonInforme from '../components/BotonInforme';

// Inicio de la dirección: solo datos agregados de su escuela.
// Las reglas de Supabase limitan al director a su centro.
const NOMBRES_ESCUELA: Record<string, string> = {
  GP: 'Escola Secundária Gabriel Pereira',
  MS: 'Escola Secundária Mousinho da Silveira',
};
const ASIG_REALES = new Set(['Portugués', 'Matemáticas']);

export default function InicioDirector() {
  const { t } = useIdioma();
  const d = t.director;
  const [prof, setProf] = useState<any>(null);
  const [escuela, setEscuela] = useState('');
  const [asignaturas, setAsignaturas] = useState<Record<number, string>>({});
  const [porAsignatura, setPorAsignatura] = useState<any[]>([]);
  const [clases, setClases] = useState<any[]>([]);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [acciones, setAcciones] = useState(0);
  const [totalAlumnos, setTotalAlumnos] = useState(0);
  const [loading, setLoading] = useState(true);
  // Filtros: curso (grupo) y prioridad, para no ver todas las alertas a la vez
  const [cursoSel, setCursoSel] = useState<number | 'todos'>('todos');
  const [prioridad, setPrioridad] = useState<'todas' | 'alta' | 'media'>('todas');

  useEffect(() => {
    (async () => {
      const p = await miProfesor();
      if (!p) return;
      setProf(p);
      const [{ data: e }, { data: s }, { data: va }, { data: vc }, todas, { count: nAcciones }, { count }] = await Promise.all([
        supabase.from('escuela').select('nombre').eq('id', p.escuela_id).single(),
        supabase.from('asignatura').select('id, nombre'),
        supabase.from('v_asignatura_resumen').select('*').eq('escuela_id', p.escuela_id).eq('periodo', 1),
        supabase.from('v_clase_resumen').select('clase_id, curso, letra, asignatura_id, n_alumnos').eq('escuela_id', p.escuela_id).eq('periodo', 1),
        cargarAlertas(),
        supabase.from('accion').select('id', { count: 'exact', head: true }),
        supabase.from('alumno').select('id', { count: 'exact', head: true }),
      ]);
      setEscuela(NOMBRES_ESCUELA[e?.nombre] ?? e?.nombre ?? '');
      setAsignaturas(Object.fromEntries((s ?? []).map((x: any) => [x.id, x.nombre])));
      setPorAsignatura((va ?? []).sort((a: any, b: any) => a.asignatura_id - b.asignatura_id));
      setAlertas(todas);
      setAcciones(nAcciones ?? 0);
      setTotalAlumnos(count ?? 0);

      // Clases con sus asignaturas
      const mapa = new Map<number, any>();
      (vc ?? []).forEach((f: any) => {
        const c = mapa.get(f.clase_id) ?? { id: f.clase_id, curso: f.curso, letra: f.letra, asignaturas: [] as number[] };
        c.asignaturas.push(f.asignatura_id);
        mapa.set(f.clase_id, c);
      });
      setClases([...mapa.values()].sort((a, b) => a.curso - b.curso || String(a.letra).localeCompare(String(b.letra))));
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="p-8 text-gray-500">{t.app.cargando}</div>;

  const deAlumnos = alertas.filter((a) => a.nivel === 'alumno');
  const conAlerta = new Set(deAlumnos.map((a) => a.alumno_id)).size;
  const altas = new Set(deAlumnos.filter((a) => a.severidad === 'alta').map((a) => a.alumno_id)).size;
  const cursos = [...new Set(clases.map((c) => c.curso))].sort((x, y) => x - y);
  const pasaPrioridad = (a: any) => prioridad === 'todas' || a.severidad === prioridad;
  const deGrupo = alertas.filter((a) =>
    a.nivel !== 'alumno' && pasaPrioridad(a) &&
    (cursoSel === 'todos' || (a.nivel === 'clase' && a.clase?.curso === cursoSel)));
  const clasesVisibles = clases.filter((c) => cursoSel === 'todos' || c.curso === cursoSel);
  const pendientes = (claseId: number, asigId: number) =>
    new Set(deAlumnos.filter((a) => a.clase_id === claseId && a.asignatura_id === asigId && a.estado === 'nueva' && pasaPrioridad(a)).map((a) => a.alumno_id)).size;
  const boton = (activo: boolean) =>
    `px-3 py-1 rounded-full text-sm border ${activo ? 'bg-[#174A55] text-white border-[#174A55]' : 'bg-white text-[#174A55] border-gray-300 hover:border-[#174A55]'}`;
  const alumnosConAlertaEn = (asigId: number) => new Set(deAlumnos.filter((a) => a.asignatura_id === asigId).map((a) => a.alumno_id)).size;

  return (
    <div className="p-8 bg-[#fdfbf7] min-h-screen max-w-6xl mx-auto">
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f3d4c]">{t.inicio.hola(prof?.nombre ?? '')}</h1>
          <p className="text-sm text-gray-600">{d.cabecera(escuela)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <BotonInforme ruta={`centros/${prof.escuela_id}/periodo_1.pdf`} texto={t.informe.centro} />
          <button onClick={() => { olvidarProfesor(); supabase.auth.signOut(); }} className="text-sm text-gray-500 hover:text-[#0f3d4c] underline">
            {t.app.cerrarSesion}
          </button>
        </div>
      </div>

      {/* Cifras del centro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">{d.conAlerta}</p>
          <p className="text-3xl font-bold text-[#0f3d4c]">{conAlerta} <span className="text-base font-normal text-gray-500">{d.de(totalAlumnos)}</span></p>
          <p className="text-xs text-gray-500">{d.conAlertaNota}</p>
        </div>
        <div className={`border rounded-lg p-4 ${altas ? 'bg-amber-50 border-amber-400' : 'bg-white border-gray-200'}`}>
          <p className="text-sm text-gray-600">{d.conAlta}</p>
          <p className="text-3xl font-bold text-[#0f3d4c]">{altas} <span className="text-base font-normal text-gray-500">{d.alumnos}</span></p>
          <p className="text-xs text-gray-500">{d.conAltaNota}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">{d.acciones}</p>
          <p className="text-3xl font-bold text-[#0f3d4c]">{acciones}</p>
          <p className="text-xs text-gray-500">{d.accionesNota}</p>
        </div>
      </div>

      {/* Filtros por curso y prioridad */}
      <section className="mb-6 flex flex-col gap-3" aria-label={d.filtros}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600 mr-1">{d.filtroCurso}</span>
          <button onClick={() => setCursoSel('todos')} className={boton(cursoSel === 'todos')}>{d.todos}</button>
          {cursos.map((c) => (
            <button key={c} onClick={() => setCursoSel(c)} className={boton(cursoSel === c)}>
              {nombreClase({ curso: c, letra: '' }).trim()}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600 mr-1">{d.filtroPrioridad}</span>
          <button onClick={() => setPrioridad('todas')} className={boton(prioridad === 'todas')}>{d.todas}</button>
          <button onClick={() => setPrioridad('alta')} className={boton(prioridad === 'alta')}>{t.app.prioridadAlta}</button>
          <button onClick={() => setPrioridad('media')} className={boton(prioridad === 'media')}>{t.app.prioridadMedia}</button>
        </div>
      </section>

      {/* Avisos de grupo */}
      {deGrupo.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-[#0f3d4c] mb-3">{d.avisosGrupo}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {deGrupo.map((a) =>
              a.nivel === 'clase' ? (
                <Link key={a.id} to={`/asignatura/${a.asignatura_id}/clase/${a.clase_id}`} className="block">
                  <TarjetaAlerta alerta={a} conAcciones={false} compacta />
                </Link>
              ) : (
                <TarjetaAlerta key={a.id} alerta={a} conAcciones={false} compacta />
              ),
            )}
          </div>
        </section>
      )}

      {/* Por asignatura */}
      <section className="bg-white border border-gray-200 rounded-lg p-4 mb-8 overflow-x-auto">
        <h2 className="text-lg font-semibold text-[#0f3d4c] mb-3">{d.porAsignatura}</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 border-b">
              {d.columnas.map((col, i) => <th key={i} className={i === 0 ? 'py-2' : ''}>{col}</th>)}
            </tr>
          </thead>
          <tbody>
            {porAsignatura.map((f) => (
              <tr key={f.asignatura_id} className="border-b border-gray-100">
                <td className="py-2 font-medium text-[#0f3d4c]">{nombreAsignatura(asignaturas[f.asignatura_id])}{ASIG_REALES.has(asignaturas[f.asignatura_id]) ? '' : '*'}</td>
                <td>{f.n_clases}</td>
                <td>{f.n_alumnos}</td>
                <td>{num(sobre10(f.media_examen), 2)}</td>
                <td>{num(f.media_asistencia)} %</td>
                <td>{alumnosConAlertaEn(f.asignatura_id)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-gray-500 mt-2">{d.notaTabla}</p>
      </section>

      {/* Clases */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[#0f3d4c] mb-3">{d.clases}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clasesVisibles.map((c) => (
            <div key={c.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-bold text-lg text-[#0f3d4c] mb-2">{nombreClase(c)}</h3>
              <ul className="text-sm space-y-1">
                {c.asignaturas.sort((a: number, b: number) => a - b).map((aid: number) => {
                  const n = pendientes(c.id, aid);
                  return (
                    <li key={aid}>
                      <Link to={`/asignatura/${aid}/clase/${c.id}`} className="flex justify-between hover:underline">
                        <span className="text-[#0f3d4c]">{nombreAsignatura(asignaturas[aid])}</span>
                        <span className={n ? 'text-amber-800 font-medium' : 'text-gray-400'}>{n ? d.pendientes(n) : '—'}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <p className="text-sm text-gray-600">
        {t.app.comoFuncionaPregunta}{' '}
        <Link to="/como-funciona" className="text-[#0f3d4c] underline font-medium">{t.app.comoFuncionaEnlace}</Link>
      </p>
    </div>
  );
}
