import { useState } from 'react';
import { supabase } from '../supabase';

interface FormularioAccionProps {
  alertaId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function FormularioAccion({ alertaId, onClose, onSuccess }: FormularioAccionProps) {
  const [descripcion, setDescripcion] = useState('');
  const [fechaRevision, setFechaRevision] = useState('');
  const [cargando, setCargando] = useState(false);

  const registrarIntervencion = async (tipoAccion: 'intervencion' | 'descarte') => {
    if (!descripcion || !fechaRevision) {
      alert('Por favor, completa la descripción y la fecha de revisión.');
      return;
    }

    setCargando(true);
    
    // 1. Obtener usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 2. Insertar acción
    const { error: errorAccion } = await supabase.from('accion').insert({
      alerta_id: alertaId,
      profesor_id: user.id,
      tipo: tipoAccion,
      descripcion: descripcion,
      fecha_revision: fechaRevision,
      resultado: 'Pendiente' // o null
    });

    if (!errorAccion) {
      // 3. Actualizar estado de la alerta
      const nuevoEstado = tipoAccion === 'descarte' ? 'descartada' : 'revisada';
      await supabase.from('alerta').update({ estado: nuevoEstado }).eq('id', alertaId);
      
      onSuccess();
      onClose();
    } else {
      alert('Error al guardar la acción');
    }
    setCargando(false);
  };

  return (
    <div className="p-4 border border-gray-200 rounded-md bg-gray-50 mt-4">
      <h4 className="font-bold mb-3 text-gray-800">Registrar Acción / Descarte</h4>
      
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-gray-700">Descripción / Motivo</label>
        <textarea 
          className="p-2 border rounded resize-none" 
          rows={3}
          value={descripcion} 
          onChange={e => setDescripcion(e.target.value)} 
          placeholder="¿Qué acción vas a tomar o por qué lo descartas?"
        />

        <label className="text-sm font-medium text-gray-700">Fecha prevista de revisión</label>
        <input 
          type="date" 
          className="p-2 border rounded"
          value={fechaRevision} 
          onChange={e => setFechaRevision(e.target.value)} 
        />
        
        <div className="flex gap-2 mt-2">
          <button 
            disabled={cargando}
            onClick={() => registrarIntervencion('intervencion')} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            {cargando ? 'Guardando...' : 'Lo reviso'}
          </button>
          
          <button 
            disabled={cargando}
            onClick={() => registrarIntervencion('descarte')} 
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            Descartar con motivo
          </button>

          <button onClick={onClose} className="ml-auto text-sm text-gray-500 hover:underline">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}