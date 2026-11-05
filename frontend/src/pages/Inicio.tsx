
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { MOTIVOS, cargarAlertas, miProfesor, olvidarProfesor } from '../datos';
import TarjetaAlerta from '../components/TarjetaAlerta';

export default function Inicio() {
  const [asignaturas, setAsignaturas] = useState<any[]>([]);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(true);

  async function cargar() {
    const prof = await miProfesor();
    if (!prof) {
      setLoading(false);
      return;
    }

    setNombre(prof.nombre);

    const { data } = await supabase
      .from('imparte')
      .select('asignatura ( id, nombre )')
      .eq('profesor_id', prof.id);

    const unicas = new Map<number, any>();

    (data ?? []).forEach((d: any) => {
      if (d.asignatura) {
        unicas.set(d.asignatura.id, d.asignatura);
      }
    });

    setAsignaturas([...unicas.values()]);
    setAlertas(await cargarAlertas({ soloNuevas: true }));
    setLoading(false);
  }

  useEffect(() => {
    cargar();
  }, []);


  // Agrupar las alertas por asignatura y motivo.
  // Cada alumno se cuenta una sola vez, aunque tenga
  // la misma alerta en distintos trimestres.
  const conjuntos = new Map<
    string,
    {
      asignaturaId: number;
      asignatura: string;
      motivo: string;
      alumnos: Set<number>;
      conAlta: Set<number>;
    }
  >();

  alertas
    .filter((a) => a.nivel === 'alumno')
    .forEach((a) => {
      const clave = `${a.asignatura_id}-${a.motivo}`;

      const g = conjuntos.get(clave) ?? {
        asignaturaId: a.asignatura_id,
        asignatura: a.asignatura?.nombre ?? '',
        motivo: a.motivo,
        alumnos: new Set<number>(),
        conAlta: new Set<number>(),
      };

      g.alumnos.add(a.alumno_id);

      if (a.severidad === 'alta') {
        g.conAlta.add(a.alumno_id);
      }

      conjuntos.set(clave, g);
    });

  // Resumen de alumnos únicos por asignatura y motivo
  const resumen = [...conjuntos.values()]
    .map(({ alumnos, conAlta, ...g }) => ({
      ...g,
      total: alumnos.size,
      altas: conAlta.size,
    }))
    .sort((a, b) => b.altas - a.altas || b.total - a.total);

  // Avisos importantes de grupo
  const deGrupo = alertas.filter(
    (a) => a.nivel !== 'alumno' && a.severidad === 'alta'
  );

  // Indicadores del panel
  const alertasAlumnos = alertas.filter(
    (a) => a.nivel === 'alumno'
  );

  const totalPendientes = alertasAlumnos.length;

  const totalAltas = alertasAlumnos.filter(
    (a) => a.severidad === 'alta'
  ).length;


  return (
    <div className="min-h-screen bg-[#F7F4ED] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* ENCABEZADO */}
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#174A55] text-xl text-white shadow-sm">
                ✦
              </div>
              <span className="text-lg font-bold tracking-tight text-[#174A55]">
                brújula
              </span>
              <span className="ml-2 rounded-full bg-white px-3 py-1 text-xs text-gray-500">
                Panel docente
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-[#174A55] sm:text-3xl">
              Hola{nombre ? `, ${nombre}` : ''}
            </h1>

            <p className="mt-2 text-sm text-gray-600 sm:text-base">
              Consulta las alertas educativas y realiza el seguimiento de tus alumnos.
            </p>
          </div>

          <button
            onClick={() => {
              olvidarProfesor();
              supabase.auth.signOut();
            }}
            className="self-start rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-[#174A55] transition hover:border-[#174A55] hover:bg-gray-50"
          >
            Cerrar sesión
          </button>
        </header>

        {/* INDICADORES */}
        <section className="mb-10">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">

            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF2F0] text-xl">
                🔔
              </div>
              <p className="text-2xl font-bold text-[#174A55] sm:text-3xl">
                {loading ? '—' : totalPendientes}
              </p>
              <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                Alertas de alumnos pendientes
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-xl">
                ⚠️
              </div>
              <p className="text-2xl font-bold text-[#174A55] sm:text-3xl">
                {loading ? '—' : totalAltas}
              </p>
              <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                Alertas de prioridad alta
              </p>
            </div>

            <div className="col-span-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5 lg:col-span-1">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF2F0] text-xl">
                📚
              </div>
              <p className="text-2xl font-bold text-[#174A55] sm:text-3xl">
                {loading ? '—' : asignaturas.length}
              </p>
              <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                Mis asignaturas
              </p>
            </div>

          </div>
        </section>

        {/* ALERTAS IMPORTANTES */}
        <section className="mb-10">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-[#174A55] sm:text-2xl">
                Lo más importante
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Situaciones que conviene revisar primero
              </p>
            </div>

            <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-500">
              Alertas pendientes
            </span>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-white p-6 text-gray-500 shadow-sm">
              Cargando alertas...
            </div>
          ) : resumen.length === 0 && deGrupo.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 text-gray-600 shadow-sm">
              No hay alertas pendientes.
            </div>
          ) : (
            <div className="flex flex-col gap-4">

              {deGrupo.map((a) => (
                <Link
                  key={a.id}
                  to={`/asignatura/${a.asignatura_id}`}
                  className="block rounded-2xl transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <TarjetaAlerta
                    alerta={a}
                    conAcciones={false}
                    compacta
                  />
                </Link>
              ))}

              {resumen.map((g) => (
                <Link
                  key={`${g.asignaturaId}-${g.motivo}`}
                  to={`/asignatura/${g.asignaturaId}`}
                  className="group block rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#174A55]/30 hover:shadow-md"
                >
                  <div className="flex items-start gap-4">

                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${
                        g.altas > 0
                          ? 'bg-amber-50'
                          : 'bg-[#EAF2F0]'
                      }`}
                    >
                      {g.altas > 0 ? '⚠️' : '📋'}
                    </div>

                    <div className="min-w-0 flex-1">
                      {g.altas > 0 && (
                        <span className="mb-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                          Prioridad alta
                        </span>
                      )}

                      <h3 className="font-semibold leading-relaxed text-[#174A55]">
                        {g.total}{' '}
                        {g.total === 1 ? 'alumno' : 'alumnos'}{' '}
                        {MOTIVOS[g.motivo]?.grupo ?? g.motivo} en{' '}
                        {g.asignatura}
                      </h3>

                      {g.altas > 0 && (
                        <p className="mt-1 text-sm text-gray-500">
                          {g.altas} con prioridad alta
                        </p>
                      )}
                    </div>

                    <span className="mt-2 shrink-0 text-lg text-gray-400 transition group-hover:translate-x-1 group-hover:text-[#174A55]">
                      →
                    </span>

                  </div>
                </Link>
              ))}

            </div>
          )}
        </section>

        {/* ASIGNATURAS */}
        <section>
          <div className="mb-5">
            <h2 className="text-xl font-bold text-[#174A55] sm:text-2xl">
              Mis asignaturas
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Accede a tus clases y consulta su seguimiento
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {asignaturas.map((asig) => {
              const pendientes = alertas.filter(
                (a) =>
                  a.asignatura_id === asig.id &&
                  a.nivel === 'alumno'
              ).length;

              return (
                <Link
                  key={asig.id}
                  to={`/asignatura/${asig.id}`}
                  className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#174A55]/30 hover:shadow-md"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EAF2F0] text-2xl">
                    📚
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-[#174A55]">
                      {asig.nombre}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      {pendientes} alertas pendientes
                    </p>
                  </div>

                  <span className="text-xl text-gray-400 transition group-hover:translate-x-1 group-hover:text-[#174A55]">
                    →
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}
