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
    if (!prof) return;
    setNombre(prof.nombre);
    const { data } = await supabase
      .from('imparte')
      .select('asignatura ( id, nombre )')
      .eq('profesor_id', prof.id);
    const unicas = new Map<number, any>();
    (data ?? []).forEach((d: any) => d.asignatura && unicas.set(d.asignatura.id, d.asignatura));
    setAsignaturas([...unicas.values()]);
    setAlertas(await cargarAlertas({ soloNuevas: true }));
    setLoading(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  // Resumen: alertas de alumno pendientes agrupadas por asignatura y motivo
  const grupos = new Map<string, { asignaturaId: number; asignatura: string; motivo: string; total: number; altas: number }>();
  alertas
    .filter((a) => a.nivel === 'alumno')
    .forEach((a) => {
      const clave = `${a.asignatura_id}-${a.motivo}`;
      const g = grupos.get(clave) ?? { asignaturaId: a.asignatura_id, asignatura: a.asignatura?.nombre ?? '', motivo: a.motivo, total: 0, altas: 0 };
      g.total += 1;
      if (a.severidad === 'alta') g.altas += 1;
      grupos.set(clave, g);
    });
  const resumen = [...grupos.values()].sort((a, b) => b.altas - a.altas || b.total - a.total);
  const deGrupo = alertas.filter((a) => a.nivel !== 'alumno' && a.severidad === 'alta');

  return (
    <div className="p-8 bg-[#fdfbf7] min-h-screen max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f3d4c]">Hola{nombre ? `, ${nombre}` : ''}</h1>
          <p className="text-sm text-gray-600">Consulta las alertas educativas y realiza el seguimiento de tus alumnos.</p>
        </div>
        <button
          onClick={() => {
            olvidarProfesor();
            supabase.auth.signOut();
          }}
          className="text-sm text-gray-500 hover:text-[#0f3d4c] underline"
        >
          Cerrar sesión
        </button>
      </div>

      <h2 className="text-lg font-semibold text-[#0f3d4c] mb-3">Lo más importante</h2>
      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : resumen.length === 0 && deGrupo.length === 0 ? (
        <p className="text-gray-600 mb-8">No hay alertas pendientes.</p>
      ) : (
        <div className="flex flex-col gap-3 mb-8">
          {deGrupo.map((a) => (
            <Link key={a.id} to={`/asignatura/${a.asignatura_id}`} className="block">
              <TarjetaAlerta alerta={a} conAcciones={false} compacta />
            </Link>
          ))}
          {resumen.map((g) => (
            <Link
              key={`${g.asignaturaId}-${g.motivo}`}
              to={`/asignatura/${g.asignaturaId}`}
              className={`block rounded-lg border p-4 hover:shadow ${g.altas > 0 ? 'bg-amber-50 border-amber-400' : 'bg-white border-gray-200'}`}
            >
              <p className="font-semibold text-[#0f3d4c]">
                {g.total} {g.total === 1 ? 'alumno' : 'alumnos'} {MOTIVOS[g.motivo]?.grupo ?? g.motivo} en {g.asignatura}
              </p>
              {g.altas > 0 && <p className="text-sm text-amber-800">{g.altas} con prioridad alta</p>}
            </Link>
          ))}
        </div>
      )}

      <h2 className="text-lg font-semibold text-[#0f3d4c] mb-3">Mis asignaturas</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {asignaturas.map((asig) => (
          <Link key={asig.id} to={`/asignatura/${asig.id}`} className="p-4 bg-white border border-gray-200 shadow-sm rounded-lg hover:border-amber-400 block">
            <h3 className="font-semibold text-lg text-[#0f3d4c]">{asig.nombre}</h3>
            <p className="text-sm text-gray-600">
              {alertas.filter((a) => a.asignatura_id === asig.id && a.nivel === 'alumno').length} alertas pendientes
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
