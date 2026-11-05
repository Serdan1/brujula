// frontend/src/pages/MisAcciones.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

interface Accion {
  id: string;
  alerta_id: string;
  tipo: string;
  descripcion: string;
  fecha_inicio: string;
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
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Obtener ID del profesor
        const { data: profesor } = await supabase
          .from('profesor')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!profesor) return;

        // 2. Obtener sus acciones
        const { data, error } = await supabase
          .from('accion')
          .select(`
            id, alerta_id, tipo, descripcion, fecha_inicio, fecha_revision,
            alerta (titulo, estado)
          `)
          .eq('profesor_id', profesor.id)
          .order('fecha_inicio', { ascending: false });
          
        if (!error && data) {
          setAcciones(data as unknown as Accion[]);
        }
      } catch (err) {
        console.error("Error cargando acciones:", err);
      } finally {
        setCargando(false);
      }
    }
    fetchAcciones();
  }, []);

  const eliminarAccion = async (id: string, alerta_id: string) => {
    if (!confirm('¿Estás seguro de eliminar este registro? La alerta volverá a estado "nueva".')) return;
    
    // Eliminamos la acción
    await supabase.from('accion').delete().eq('id', id);
    // Devolvemos la alerta a su estado inicial
    await supabase.from('alerta').update({ estado: 'nueva' }).eq('id', alerta_id);
    
    setAcciones(acciones.filter(a => a.id !== id));
  };

  if (cargando) return <div className="p-8 text-center text-gray-500">Cargando registros...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Próximas intervenciones y descartes</h1>
      
      {acciones.length === 0 ? (
        <p className="text-slate-500">No tienes acciones ni descartes registrados.</p>
      ) : (
        <div className="grid gap-4">
          {acciones.map(accion => (
            <div key={accion.id} className="p-5 border border-slate-200 rounded-md shadow-sm bg-white">
              <div className="flex justify-between items-start">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full uppercase tracking-wide ${
                  accion.tipo === 'descarte' ? 'bg-gray-100 text-gray-600 border border-gray-200' : 'bg-teal-50 text-teal-700 border border-teal-200'
                }`}>
                  {accion.tipo === 'descarte' ? 'Descartada' : 'En seguimiento'}
                </span>
                
                {accion.fecha_revision && (
                  <p className="text-xs text-slate-500 font-medium bg-slate-50 px-2 py-1 rounded">
                    Revisar el: {new Date(accion.fecha_revision).toLocaleDateString()}
                  </p>
                )}
              </div>
              
              <h3 className="mt-3 font-bold text-slate-800 text-lg">
                {accion.alerta?.titulo || 'Alerta eliminada'}
              </h3>
              
              <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-3 rounded italic">
                "{accion.descripcion}"
              </p>
              
              <div className="mt-4 flex gap-4 pt-2">
                <button 
                  onClick={() => eliminarAccion(accion.id, accion.alerta_id)} 
                  className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
                >
                  Eliminar registro y reabrir alerta
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}