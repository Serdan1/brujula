// frontend/src/pages/MisAcciones.tsx
import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { supabase } from '../supabase';

interface Accion {
  id: string;
  alerta_id: string;
  tipo: 'intervencion' | 'descarte';
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
  
  // LEER LA URL PARA SABER QUÉ PESTAÑA ABRIR POR DEFECTO
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tabInicial = queryParams.get('tipo') === 'descarte' ? 'descarte' : 'intervencion';
  
  const [filtroActivo, setFiltroActivo] = useState<'intervencion' | 'descarte'>(tabInicial);

  useEffect(() => {
    // Si la URL cambia (porque el usuario pulsó en un botón desde el Inicio), actualizamos la pestaña
    const tipoQuery = queryParams.get('tipo');
    if (tipoQuery === 'descarte' || tipoQuery === 'intervencion') {
      setFiltroActivo(tipoQuery);
    }
  }, [location.search]);

  useEffect(() => {
    async function fetchAcciones() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profesor } = await supabase
          .from('profesor')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!profesor) return;

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
    if (!confirm('¿Estás seguro de eliminar este registro? La alerta volverá a estado "nueva" y volverá a aparecer en Inicio.')) return;
    
    await supabase.from('accion').delete().eq('id', id);
    await supabase.from('alerta').update({ estado: 'nueva' }).eq('id', alerta_id);
    
    setAcciones(acciones.filter(a => a.id !== id));
  };

  if (cargando) return <div className="p-8 text-center text-slate-500">Cargando registros...</div>;

  // FILTRAMOS LAS ACCIONES SEGÚN LA PESTAÑA ACTIVA
  const accionesVisibles = acciones.filter(a => a.tipo === filtroActivo);

  return (
    <div className="max-w-4xl mx-auto p-6">
      
      {/* Botón para volver */}
      <Link to="/" className="text-blue-600 hover:underline text-sm mb-4 inline-block">
        &larr; Volver a Inicio
      </Link>

      <h1 className="text-2xl font-bold mb-6 text-slate-800">
        Gestión de Alertas
      </h1>
      
      {/* SISTEMA DE PESTAÑAS (TABS) */}
      <div className="flex border-b border-slate-200 mb-6">
        <button 
          onClick={() => setFiltroActivo('intervencion')}
          className={`py-3 px-6 font-medium text-sm transition-colors border-b-2 ${
            filtroActivo === 'intervencion' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          Próximas intervenciones
        </button>
        <button 
          onClick={() => setFiltroActivo('descarte')}
          className={`py-3 px-6 font-medium text-sm transition-colors border-b-2 ${
            filtroActivo === 'descarte' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          Descartes
        </button>
      </div>
      
      {/* LISTADO DE ACCIONES O DESCARTES */}
      {accionesVisibles.length === 0 ? (
        <p className="text-slate-500 italic">
          No tienes {filtroActivo === 'intervencion' ? 'intervenciones' : 'descartes'} registrados.
        </p>
      ) : (
        <div className="grid gap-4">
          {accionesVisibles.map(accion => (
            <div key={accion.id} className="p-5 border border-slate-200 rounded-md shadow-sm bg-white">
              <div className="flex justify-between items-start">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full uppercase tracking-wide ${
                  accion.tipo === 'descarte' ? 'bg-gray-100 text-gray-600 border border-gray-200' : 'bg-teal-50 text-teal-700 border border-teal-200'
                }`}>
                  {accion.tipo === 'descarte' ? 'Descartada' : 'En seguimiento'}
                </span>
                
                {accion.fecha_revision && accion.tipo === 'intervencion' && (
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
              
              <div className="mt-4 flex gap-4 pt-3 border-t border-slate-100">
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