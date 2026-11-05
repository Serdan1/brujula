import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { cargarAlertas, miProfesor, nombreClase } from '../datos';
import { TarjetaAlerta } from '../components/TarjetaAlerta';

export default function Asignatura() {
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
    setNombre(asig?.nombre ?? '');
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

  return (
    <div className="p-8 bg-[#fdfbf7] min-h-screen max-w-5xl mx-auto">
      <Link to="/" className="text-sm text-gray-500 hover:text-[#0f3d4c] underline mb-4 inline-block">← Inicio</Link>
      <h1 className="text-2xl font-bold text-[#0f3d4c] mb-6">{nombre}</h1>

      <h2 className="text-lg font-semibold text-[#0f3d4c] mb-3">Mis clases</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {loading ? (
          <p className="text-gray-500">Cargando clases...</p>
        ) : (
          clases.map((c) => {
            const n = pendientesDe(c.id);
            const conAviso = grupo.some((a) => a.clase_id === c.id);
            return (
              <Link key={c.id} to={`/asignatura/${id}/clase/${c.id}`} className={`p-4 rounded-lg border shadow-sm hover:shadow ${conAviso ? 'bg-amber-50 border-amber-400' : 'bg-white border-gray-200'}`}>
                <h3 className="font-bold text-lg text-[#0f3d4c]">{nombreClase(c)}</h3>
                <p className="text-sm text-gray-600">{n} {n === 1 ? 'alerta pendiente' : 'alertas pendientes'}</p>
              </Link>
            );
          })
        )}
      </div>

      {grupo.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-[#0f3d4c] mb-3">Avisos de grupo</h2>
          <div className="flex flex-col gap-3 mb-8">
            {grupo.map((a) => (
              <TarjetaAlerta key={a.id} alerta={a} />
            ))}
          </div>
        </>
      )}

      <h2 className="text-lg font-semibold text-[#0f3d4c] mb-3">Alertas de alumnos ({deAlumnos.length})</h2>
      <div className="flex flex-col gap-3">
        {deAlumnos.map((a) => (
          <TarjetaAlerta key={a.id} alerta={a} />
        ))}
      </div>
    </div>
  );
}
