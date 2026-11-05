import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { cargarAlertas, miProfesor, nombreClase, num, olvidarProfesor } from '../datos';
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
  const [prof, setProf] = useState<any>(null);
  const [escuela, setEscuela] = useState('');
  const [asignaturas, setAsignaturas] = useState<Record<number, string>>({});
  const [porAsignatura, setPorAsignatura] = useState<any[]>([]);
  const [clases, setClases] = useState<any[]>([]);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [acciones, setAcciones] = useState(0);
  const [totalAlumnos, setTotalAlumnos] = useState(0);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="p-8 text-gray-500">Cargando...</div>;

  const deAlumnos = alertas.filter((a) => a.nivel === 'alumno');
  const conAlerta = new Set(deAlumnos.map((a) => a.alumno_id)).size;
  const altas = new Set(deAlumnos.filter((a) => a.severidad === 'alta').map((a) => a.alumno_id)).size;
  const deGrupo = alertas.filter((a) => a.nivel !== 'alumno');
  const pendientes = (claseId: number, asigId: number) =>
    new Set(deAlumnos.filter((a) => a.clase_id === claseId && a.asignatura_id === asigId && a.estado === 'nueva').map((a) => a.alumno_id)).size;
  const alumnosConAlertaEn = (asigId: number) => new Set(deAlumnos.filter((a) => a.asignatura_id === asigId).map((a) => a.alumno_id)).size;

  return (
    <div className="p-8 bg-[#fdfbf7] min-h-screen max-w-6xl mx-auto">
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f3d4c]">Hola{prof?.nombre ? `, ${prof.nombre}` : ''}</h1>
          <p className="text-sm text-gray-600">Dirección · {escuela} · datos del primer periodo</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <BotonInforme ruta={`centros/${prof.escuela_id}/periodo_1.pdf`} texto="Informe del centro (PDF)" />
          <button onClick={() => { olvidarProfesor(); supabase.auth.signOut(); }} className="text-sm text-gray-500 hover:text-[#0f3d4c] underline">
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Cifras del centro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Alumnos con alguna alerta</p>
          <p className="text-3xl font-bold text-[#0f3d4c]">{conAlerta} <span className="text-base font-normal text-gray-500">de {totalAlumnos}</span></p>
          <p className="text-xs text-gray-500">En cualquier asignatura, sin contar dos veces al mismo alumno</p>
        </div>
        <div className={`border rounded-lg p-4 ${altas ? 'bg-amber-50 border-amber-400' : 'bg-white border-gray-200'}`}>
          <p className="text-sm text-gray-600">Con prioridad alta</p>
          <p className="text-3xl font-bold text-[#0f3d4c]">{altas} <span className="text-base font-normal text-gray-500">alumnos</span></p>
          <p className="text-xs text-gray-500">Conviene que su profesorado los revise primero</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Acciones de seguimiento registradas</p>
          <p className="text-3xl font-bold text-[#0f3d4c]">{acciones}</p>
          <p className="text-xs text-gray-500">Tutorías, reuniones con familias, refuerzos y seguimientos decididos por el profesorado</p>
        </div>
      </div>

      {/* Avisos de grupo */}
      {deGrupo.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-[#0f3d4c] mb-3">Avisos de grupo</h2>
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
        <h2 className="text-lg font-semibold text-[#0f3d4c] mb-3">Por asignatura</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 border-b">
              <th className="py-2">Asignatura</th><th>Clases</th><th>Alumnos</th><th>Nota media</th><th>Asistencia*</th><th>Alumnos con alerta</th>
            </tr>
          </thead>
          <tbody>
            {porAsignatura.map((f) => (
              <tr key={f.asignatura_id} className="border-b border-gray-100">
                <td className="py-2 font-medium text-[#0f3d4c]">{asignaturas[f.asignatura_id]}{ASIG_REALES.has(asignaturas[f.asignatura_id]) ? '' : '*'}</td>
                <td>{f.n_clases}</td>
                <td>{f.n_alumnos}</td>
                <td>{num(f.media_examen)}</td>
                <td>{num(f.media_asistencia)} %</td>
                <td>{alumnosConAlertaEn(f.asignatura_id)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-gray-500 mt-2">* Datos sintéticos en esta demo. Solo se muestran grupos de 5 alumnos o más.</p>
      </section>

      {/* Clases */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[#0f3d4c] mb-3">Clases</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clases.map((c) => (
            <div key={c.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-bold text-lg text-[#0f3d4c] mb-2">{nombreClase(c)}</h3>
              <ul className="text-sm space-y-1">
                {c.asignaturas.sort((a: number, b: number) => a - b).map((aid: number) => {
                  const n = pendientes(c.id, aid);
                  return (
                    <li key={aid}>
                      <Link to={`/asignatura/${aid}/clase/${c.id}`} className="flex justify-between hover:underline">
                        <span className="text-[#0f3d4c]">{asignaturas[aid]}</span>
                        <span className={n ? 'text-amber-800 font-medium' : 'text-gray-400'}>{n ? `${n} pendientes` : '—'}</span>
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
        ¿Cómo se eligió el modelo, qué datos usa y es justo con todos los alumnos?{' '}
        <Link to="/como-funciona" className="text-[#0f3d4c] underline font-medium">Cómo funciona Brújula →</Link>
      </p>
    </div>
  );
}
