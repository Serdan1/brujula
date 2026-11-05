import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TarjetaAlerta } from '../components/TarjetaAlerta';
import { cargarAlertas, miProfesor, olvidarProfesor, MOTIVOS } from '../datos';
import { supabase } from '../supabase';

export default function Inicio() {
  const [asignaturas, setAsignaturas] = useState<any[]>([]);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [nombre, setNombre] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelado = false;

    async function cargarInicio() {
      try {
        const profesor = await miProfesor();
        if (!profesor) {
          setError('No se encuentra tu perfil de profesor.');
          return;
        }

        const { data, error: errorAsignaturas } = await supabase
          .from('imparte')
          .select('asignatura ( id, nombre )')
          .eq('profesor_id', profesor.id);
        if (errorAsignaturas) throw errorAsignaturas;

        const asignaturasUnicas = new Map<number, any>();
        (data ?? []).forEach((fila: any) => {
          if (fila.asignatura) asignaturasUnicas.set(fila.asignatura.id, fila.asignatura);
        });

        const alertasPendientes = await cargarAlertas({ soloNuevas: true });
        if (!cancelado) {
          setNombre(profesor.nombre);
          setAsignaturas([...asignaturasUnicas.values()]);
          setAlertas(alertasPendientes);
        }
      } catch (e) {
        console.error('Error al cargar el inicio:', e);
        if (!cancelado) setError('No se ha podido cargar el inicio. Inténtalo de nuevo más tarde.');
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargarInicio();
    return () => {
      cancelado = true;
    };
  }, []);

  async function cerrarSesion() {
    olvidarProfesor();
    const { error: errorSesion } = await supabase.auth.signOut();
    if (errorSesion) {
      console.error('Error al cerrar sesión:', errorSesion.message);
      setError('No se ha podido cerrar la sesión. Inténtalo de nuevo.');
    }
  }

  const grupos = new Map<string, { asignaturaId: number; asignatura: string; motivo: string; total: number; altas: number }>();
  alertas
    .filter((alerta) => alerta.nivel === 'alumno')
    .forEach((alerta) => {
      const clave = `${alerta.asignatura_id}-${alerta.motivo}`;
      const grupo = grupos.get(clave) ?? {
        asignaturaId: alerta.asignatura_id,
        asignatura: alerta.asignatura?.nombre ?? '',
        motivo: alerta.motivo,
        total: 0,
        altas: 0,
      };
      grupo.total += 1;
      if (alerta.severidad === 'alta') grupo.altas += 1;
      grupos.set(clave, grupo);
    });

  const resumen = [...grupos.values()].sort((a, b) => b.altas - a.altas || b.total - a.total);
  const avisosDeGrupo = alertas.filter((alerta) => alerta.nivel !== 'alumno' && alerta.severidad === 'alta');

  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      <main className="mx-auto max-w-5xl p-6">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0f3d4c]">Hola{nombre ? `, ${nombre}` : ''}</h1>
            <p className="text-sm text-gray-600">Esto es lo más importante para revisar.</p>
          </div>
          <nav className="flex flex-wrap items-center gap-3">
            <Link
              to="/intervenciones?tipo=intervencion"
              className="rounded bg-[#0f3d4c] px-4 py-2 text-sm font-medium text-white hover:bg-[#164f60]"
            >
              Próximas revisiones
            </Link>
            <button onClick={cerrarSesion} className="text-sm text-gray-600 underline hover:text-[#0f3d4c]">
              Cerrar sesión
            </button>
          </nav>
        </header>

        {error && <p role="alert" className="mb-6 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold text-[#0f3d4c]">Lo más importante</h2>
          {cargando ? (
            <p className="text-gray-500">Cargando alertas...</p>
          ) : resumen.length === 0 && avisosDeGrupo.length === 0 ? (
            <p className="text-gray-600">No hay alertas pendientes.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {avisosDeGrupo.map((alerta) => (
                <TarjetaAlerta key={alerta.id} alerta={alerta} />
              ))}
              {resumen.map((grupo) => (
                <Link
                  key={`${grupo.asignaturaId}-${grupo.motivo}`}
                  to={`/asignatura/${grupo.asignaturaId}`}
                  className={`block rounded-lg border p-4 hover:shadow-sm ${
                    grupo.altas > 0 ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <p className="font-semibold text-[#0f3d4c]">
                    {grupo.total} {grupo.total === 1 ? 'alumno' : 'alumnos'}{' '}
                    {MOTIVOS[grupo.motivo]?.grupo ?? grupo.motivo}
                    {grupo.asignatura ? ` en ${grupo.asignatura}` : ''}
                  </p>
                  {grupo.altas > 0 && (
                    <p className="mt-1 text-sm text-amber-800">
                      {grupo.altas} con prioridad alta
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[#0f3d4c]">Mis asignaturas</h2>
          {cargando ? (
            <p className="text-gray-500">Cargando asignaturas...</p>
          ) : asignaturas.length === 0 ? (
            <p className="text-gray-600">No tienes asignaturas asignadas.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {asignaturas.map((asignatura) => {
                const totalAlertas = alertas.filter(
                  (alerta) => alerta.asignatura_id === asignatura.id,
                ).length;
                return (
                  <Link
                    key={asignatura.id}
                    to={`/asignatura/${asignatura.id}`}
                    className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:border-amber-400 hover:shadow"
                  >
                    <h3 className="font-semibold text-[#0f3d4c]">{asignatura.nombre}</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {totalAlertas} {totalAlertas === 1 ? 'alerta pendiente' : 'alertas pendientes'}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
