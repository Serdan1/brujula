import { Fragment, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { cargarAlertas, nombreClase, num } from '../datos';
import TarjetaAlerta from '../components/TarjetaAlerta';
import BotonInforme from '../components/BotonInforme';

export default function Clase() {
  const { asig, id } = useParams();
  const [clase, setClase] = useState<any>(null);
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [abierto, setAbierto] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  async function cargar() {
    if (!id || !asig) return;
    const { data: c } = await supabase.from('clase').select('curso, letra').eq('id', id).single();
    setClase(c);
    const { data, error } = await supabase
      .from('alumno')
      .select('id, nombre, rendimiento ( nota_examen, nota_practicas, participacion, asistencia )')
      .eq('clase_id', id)
      .eq('rendimiento.asignatura_id', asig)
      .eq('rendimiento.periodo', 1)
      .order('nombre');
    if (error) console.error('Error al cargar alumnos:', error.message);
    // Solo los alumnos que cursan esta asignatura (tienen rendimiento en ella)
    setAlumnos((data ?? []).filter((a: any) => a.rendimiento && a.rendimiento.length > 0));
    setAlertas(await cargarAlertas({ asignaturaId: asig, claseId: id }));
    setLoading(false);
  }

  useEffect(() => {
    cargar();
  }, [id, asig]);

  const alertasDe = (alumnoId: number) => alertas.filter((a) => a.nivel === 'alumno' && a.alumno_id === alumnoId);
  const deGrupo = alertas.filter((a) => a.nivel === 'clase');
  const conAlerta = alumnos.filter((a) => alertasDe(a.id).length > 0).length;

  return (
    <div className="p-8 bg-[#fdfbf7] min-h-screen max-w-6xl mx-auto">
      <Link to={`/asignatura/${asig}`} className="text-sm text-gray-500 hover:text-[#0f3d4c] underline mb-4 inline-block">← Volver a la asignatura</Link>
      <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f3d4c]">{nombreClase(clase)}</h1>
          <p className="text-sm text-gray-600">
            {alumnos.length} alumnos · {conAlerta} con alguna alerta · datos del primer periodo
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <BotonInforme ruta={`clases/${id}/asignatura_${asig}/periodo_1.pdf`} />
          <Link to={`/asignatura/${asig}/clase/${id}/analisis`} className="px-4 py-2 bg-[#0f3d4c] text-white rounded">
            Análisis completo de la clase →
          </Link>
        </div>
      </div>

      {deGrupo.map((a) => (
        <div key={a.id} className="mb-4">
          <TarjetaAlerta alerta={a} conAcciones={false} mostrarContexto={false} />
        </div>
      ))}

      <div className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0f3d4c] text-white text-sm">
              <th className="p-3 font-semibold">Alumno (ficticio)</th>
              <th className="p-3 font-semibold">Examen</th>
              <th className="p-3 font-semibold">Prácticas*</th>
              <th className="p-3 font-semibold">Participación*</th>
              <th className="p-3 font-semibold">Asistencia*</th>
              <th className="p-3 font-semibold">Alertas</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-4 text-center text-gray-500">Cargando alumnos...</td></tr>
            ) : (
              alumnos.map((alumno) => {
                const r = alumno.rendimiento[0];
                const suyas = alertasDe(alumno.id);
                const alta = suyas.some((a) => a.severidad === 'alta');
                return (
                  <Fragment key={alumno.id}>
                    <tr className={`border-b border-gray-100 ${suyas.length ? (alta ? 'bg-amber-50' : 'bg-amber-50/40') : ''}`}>
                      <td className="p-3 font-medium text-[#0f3d4c]">{alumno.nombre}</td>
                      <td className="p-3">{num(r.nota_examen)}</td>
                      <td className="p-3">{num(r.nota_practicas)}</td>
                      <td className="p-3">{num(r.participacion)}/10</td>
                      <td className="p-3">{r.asistencia != null ? `${num(r.asistencia)} %` : '-'}</td>
                      <td className="p-3">
                        {suyas.length > 0 ? (
                          <button
                            onClick={() => setAbierto(abierto === alumno.id ? null : alumno.id)}
                            className={`text-xs font-semibold px-2 py-1 rounded ${alta ? 'bg-amber-400 text-[#0f3d4c]' : 'bg-amber-100 text-amber-900'}`}
                          >
                            {suyas[0].motivo === 'riesgo_de_suspenso' ? 'Podría necesitar apoyo' : suyas[0].titulo.split(' en ')[0]}
                            {suyas.length > 1 ? ` (+${suyas.length - 1})` : ''} {abierto === alumno.id ? '▲' : '▼'}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                    {abierto === alumno.id && (
                      <tr>
                        <td colSpan={6} className="p-3 bg-[#fdfbf7]">
                          <div className="flex flex-col gap-2">
                            {suyas.map((a) => (
                              <TarjetaAlerta key={a.id} alerta={a} mostrarContexto={false} onCambio={cargar} />
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500 mt-2">* Variables sintéticas en esta demo. La tabla no está ordenada por rendimiento.</p>
    </div>
  );
}
