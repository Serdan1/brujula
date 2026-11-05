import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

interface Accion {
  id: string;
  alerta_id: string;
  tipo: string;
  descripcion: string;
  fecha_revision: string;
  alerta: {
    titulo: string;
    estado: string;
  };
}

export default function MisAcciones() {
  const [acciones, setAcciones] = useState<Accion[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function fetchAcciones() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('accion')
        .select(`
          id, alerta_id, tipo, descripcion, fecha_revision,
          alerta (titulo, estado)
        `)
        .eq('profesor_id', user.id)
        .order('fecha_revision', { ascending: true });
        
      if (!error && data) {
        setAcciones(data as unknown as Accion[]);
      }
      setCargando(false);
    }
    fetchAcciones();
  }, []);

  const eliminarAccion = async (id: string, alerta_id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta acción? La alerta volverá a estado "nueva".')) return;
    
    await supabase.from('accion').delete().eq('id', id);
    await supabase.from('alerta').update({ estado: 'nueva' }).eq('id', alerta_id);
    
    setAcciones(acciones.filter(a => a.id !== id));
  };

  if (cargando) return <div className="p-8 text-center text-gray-500">Cargando intervenciones...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Próximas intervenciones y descartes</h1>
      
      {acciones.length === 0 ? (
        <p className="text-gray-500">No tienes acciones ni descartes registrados.</p>
      ) : (
        <div className="grid gap-4">
          {acciones.map(accion => (
            <div key={accion.id} className="p-4 border rounded-md shadow-sm bg-white">
              <div className="flex justify-between items-start">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${accion.tipo === 'descarte' ? 'bg-gray-200 text-gray-800' : 'bg-blue-100 text-blue-800'}`}>
                  {accion.tipo === 'descarte' ? 'Descartada' : 'En seguimiento'}
                </span>
                <p className="text-xs text-gray-500 font-medium">Revisión: {new Date(accion.fecha_revision).toLocaleDateString()}</p>
              </div>
              
              <h3 className="mt-3 font-bold text-gray-900">{accion.alerta?.titulo || 'Alerta sin título'}</h3>
              <p className="text-sm text-gray-700 mt-1">{accion.descripcion}</p>
              
              <div className="mt-4 flex gap-4 border-t pt-3">
                <button onClick={() => eliminarAccion(accion.id, accion.alerta_id)} className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors">
                  Eliminar intervención
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}