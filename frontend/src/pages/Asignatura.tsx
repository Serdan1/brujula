import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { cargarAlertas, miProfesor, nombreAsignatura, nombreClase } from '../datos';
import { useIdioma } from '../i18n';
import TarjetaAlerta from '../components/TarjetaAlerta';

export default function Asignatura() {
  const { t } = useIdioma();
  const s = t.asignatura;
  const { id } = useParams();
  const [nombre, setNombre] = useState('');
  const [clases, setClases] = useState<any[]>([]);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function cargar() {
    if (!id) return;
    const prof = await miProfesor();
    if (!prof) return;
    const { data: asig } = await supabase.from('asignatura').select('nombre').eq('id', id).single();
    setNombre(nombreAsignatura(asig?.nombre));
    const { data } = await supabase
      .from('imparte')
      .select('clase ( id, curso, letra )')
      .eq('asignatura_id', id)
      .eq('profesor_id', prof.id);
    const lista = (data ?? []).map((d: any) => d.clase).filter(Boolean);
    lista.sort((a: any, b: any) => a.curso - b.curso || String(a.letra).localeCompare(String(b.letra)));
    setClases(lista);
    setAlertas(await cargarAlertas({ asignaturaId: id }));
    setLoading(false);
  }

  useEffect(() => {
    cargar();
  }, [id]);

  const pendientesDe = (claseId: number) => alertas.filter((a) => a.clase_id === claseId && a.nivel === 'alumno' && a.estado === 'nueva').length;
  const grupo = alertas.filter((a) => a.nivel !== 'alumno');
  const deAlumnos = alertas.filter((a) => a.nivel === 'alumno');
  // Alertas compactas: agrupadas por prioridad y desplegables (la alta, abierta por defecto)
  const porPrioridad = [
    { severidad: 'alta', alertas: deAlumnos.filter((a) => a.severidad === 'alta') },
    { severidad: 'media', alertas: deAlumnos.filter((a) => a.severidad !== 'alta') },
  ].filter((g) => g.alertas.length > 0);
  const etiqueta = (severidad: string) => (
    <span className={`mr-2 inline-block rounded px-2 py-0.5 text-xs ${severidad === 'alta' ? 'bg-amber-100 text-amber-900' : 'bg-gray-100 text-gray-700'}`}>
      {severidad === 'alta' ? t.app.prioridadAlta : t.app.prioridadMedia}
    </span>
  );

  return (
    <div className="p-8 bg-[#fdfbf7] min-h-screen max-w-5xl mx-auto">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link to="/" className="text-sm text-gray-500 hover:text-[#0f3d4c] underline">{t.app.volverInicio}</Link>
        <Link to="/intervenciones?tipo=intervencion" className="rounded bg-[#0f3d4c] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
          {t.app.proximasRevisiones}
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-[#0f3d4c] mb-6">{nombre}</h1>

      <h2 className="text-lg font-semibold text-[#0f3d4c] mb-3">{s.misClases}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {loading ? (
          <p className="text-gray-500">{s.cargandoClases}</p>
        ) : (
          clases.map((c) => {
            const n = pendientesDe(c.id);
            const conAviso = grupo.some((a) => a.clase_id === c.id);
            return (
              <Link key={c.id} to={`/asignatura/${id}/clase/${c.id}`} className={`p-4 rounded-lg border shadow-sm hover:shadow ${conAviso ? 'bg-amber-50 border-amber-400' : 'bg-white border-gray-200'}`}>
                <h3 className="font-bold text-lg text-[#0f3d4c]">{nombreClase(c)}</h3>
                <p className="text-sm text-gray-600">{t.app.alertasPendientes(n)}</p>
              </Link>
            );
          })
        )}
      </div>

      {grupo.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-[#0f3d4c] mb-3">{s.avisosGrupo}</h2>
          <div className="flex flex-col gap-2 mb-8">
            {grupo.map((a) => (
              <details key={a.id} className="rounded-lg border border-gray-200 bg-white">
                <summary className="cursor-pointer p-4 text-sm font-medium text-[#0f3d4c]">
                  {etiqueta(a.severidad)}
                  {a.titulo}
                </summary>
                <div className="border-t border-gray-100 p-3">
                  <TarjetaAlerta alerta={a} conAcciones={false} />
                </div>
              </details>
            ))}
          </div>
        </>
      )}

      <h2 className="text-lg font-semibold text-[#0f3d4c] mb-3">{s.alertasAlumnos(deAlumnos.length)}</h2>
      {loading ? (
        <p className="text-gray-500">{s.cargandoAlertas}</p>
      ) : porPrioridad.length === 0 ? (
        <p className="text-gray-600">{s.sinAlertas}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {porPrioridad.map((g) => (
            <details key={g.severidad} open={g.severidad === 'alta'} className="rounded-lg border border-gray-200 bg-white">
              <summary className="cursor-pointer p-4 font-semibold text-[#0f3d4c]">
                {etiqueta(g.severidad)}
                <span className="text-sm font-normal text-gray-600">
                  {s.desplegar(g.alertas.length)}
                </span>
              </summary>
              <div className="flex flex-col gap-2 border-t border-gray-100 p-3">
                {g.alertas.map((a) => (
                  <details key={a.id} className="rounded-md border border-gray-200">
                    <summary className="cursor-pointer p-3 text-sm font-medium text-[#0f3d4c]">
                      {a.alumno?.nombre ?? s.alumno}: {a.titulo}
                      <span className="ml-2 text-xs font-normal text-gray-500">{a.estado === 'nueva' ? s.pendiente : s.revisada}</span>
                    </summary>
                    <div className="px-3 pb-3">
                      <TarjetaAlerta alerta={a} onCambio={cargar} />
                    </div>
                  </details>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
