// frontend/src/components/TarjetaAlerta.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';

interface Alerta {
  id: string;
  nivel: 'asignatura' | 'clase' | 'alumno';
  asignatura_id: string;
  clase_id: string;
  alumno_id?: string;
  motivo: string;
  severidad: 'alta' | 'media';
  titulo: string;
  descripcion: string;
  variables: any;
  estado: 'nueva' | 'revisada' | 'descartada';
  alumno_nombre?: string;
  clase_nombre?: string;
}

export function TarjetaAlerta({ alerta: alertaInicial, soloLectura = false }: { alerta: Alerta, soloLectura?: boolean }) {
  const [alerta, setAlerta] = useState(alertaInicial);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [tipoAccion, setTipoAccion] = useState<'intervencion' | 'descarte'>('intervencion');
  const [descripcion, setDescripcion] = useState('');
  const [fechaRevision, setFechaRevision] = useState('');
  const [cargando, setCargando] = useState(false);

  const [alumnoNombre, setAlumnoNombre] = useState(alertaInicial.alumno_nombre || '');
  const [claseNombre, setClaseNombre] = useState(alertaInicial.clase_nombre || '');

  useEffect(() => {
    async function obtenerNombresFaltantes() {
      if (alerta.nivel === 'alumno' && alerta.alumno_id && !alumnoNombre) {
        const { data: alumno } = await supabase.from('alumno').select('*').eq('id', alerta.alumno_id).single();
        if (alumno) {
          const nombre = alumno.nombre_ficticio || alumno['nombre ficticio'] || alumno.nombre || 'Alumno desconocido';
          setAlumnoNombre(nombre);
        }
      }
      if (alerta.clase_id && !claseNombre) {
        const { data: clase } = await supabase.from('clase').select('*').eq('id', alerta.clase_id).single();
        if (clase) setClaseNombre(`${clase.curso}º ${clase.letra}`);
      }
    }
    obtenerNombresFaltantes();
  }, [alerta.alumno_id, alerta.clase_id, alerta.nivel]);

  const renderizarVariables = (vars: any) => {
    if (!vars) return null;
    const lista: { clave: string, valor: any }[] = [];
    
    if (Array.isArray(vars)) {
      vars.forEach(v => {
        if (typeof v === 'object' && v !== null) {
          if (v.variable && v.valor !== undefined) lista.push({ clave: v.variable, valor: v.valor });
          else if (v.variable && v.valor_real !== undefined) lista.push({ clave: v.variable, valor: v.valor_real });
          else Object.entries(v).forEach(([k, val]) => lista.push({ clave: k, valor: val }));
        }
      });
    } else if (typeof vars === 'object') {
      Object.entries(vars).forEach(([k, val]) => lista.push({ clave: k, valor: val }));
    }

    if (lista.length === 0) return null;

    return (
      <ul className="list-disc list-inside mt-3 text-slate-700 space-y-1">
        {lista.map((item, i) => (
          <li key={i}>
            <span className="text-slate-600 capitalize">{item.clave}:</span>{' '}
            <span className="font-semibold">{String(item.valor)}</span>
          </li>
        ))}
      </ul>
    );
  };

  const abrirFormulario = (tipo: 'intervencion' | 'descarte') => {
    setTipoAccion(tipo);
    setMostrarForm(true);
  };

  const guardarAccion = async () => {
    if (!descripcion) {
      alert('Por favor, completa el motivo o descripción.');
      return;
    }
    if (tipoAccion === 'intervencion' && !fechaRevision) {
      alert('Por favor, indica la fecha de revisión.');
      return;
    }

    setCargando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // 1. OBTENER EL ID NUMÉRICO DEL PROFESOR
      const { data: profesor, error: errProf } = await supabase
        .from('profesor')
        .select('id')
        .eq('user_id', user.id)
        .single();
        
      if (errProf || !profesor) throw new Error('No se encontró el perfil de profesor en la base de datos.');

      const hoy = new Date().toISOString().split('T')[0];

      // 2. GUARDAR CON EL ID CORRECTO Y SIN FECHA DE REVISIÓN SI ES DESCARTE
      const { error: errAccion } = await supabase.from('accion').insert({
        alerta_id: alerta.id,
        profesor_id: profesor.id,
        tipo: tipoAccion,
        descripcion: descripcion,
        fecha_inicio: hoy,
        fecha_revision: tipoAccion === 'intervencion' ? fechaRevision : null,
        resultado: 'Pendiente'
      });
      
      if (errAccion) throw new Error(errAccion.message);

      const nuevoEstado = tipoAccion === 'descarte' ? 'descartada' : 'revisada';
      const { error: errAlerta } = await supabase.from('alerta').update({ estado: nuevoEstado }).eq('id', alerta.id);
      
      if (errAlerta) throw new Error(errAlerta.message);

      setAlerta({ ...alerta, estado: nuevoEstado });
      setMostrarForm(false);
      setDescripcion('');
      setFechaRevision('');
    } catch (error: any) {
      console.error('Error al guardar:', error);
      alert(`No se pudo guardar la acción: ${error.message}`);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="p-5 border border-amber-200 rounded-lg shadow-sm mb-4 bg-amber-50/30">
      <div className="flex gap-2 mb-3 items-center">
        {alerta.severidad === 'alta' && (
          <span className="bg-amber-400 text-amber-900 text-xs px-2 py-1 rounded font-medium">Prioridad alta</span>
        )}
        <span className="text-gray-600 text-sm">{alerta.motivo}</span>
        <span className={`text-xs px-2 py-1 rounded border font-medium uppercase tracking-wide ${
          alerta.estado === 'revisada' ? 'border-teal-200 text-teal-700 bg-teal-50' : 
          alerta.estado === 'descartada' ? 'border-gray-200 text-gray-700 bg-gray-50' : 
          'border-amber-200 text-amber-800 bg-amber-100'
        }`}>
          {alerta.estado}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-slate-800">{alerta.titulo}</h3>
      {(alumnoNombre || claseNombre) && (
        <p className="text-sm text-slate-500 mt-1">
          {alumnoNombre} {alumnoNombre && claseNombre && '·'} {claseNombre}
        </p>
      )}

      {alerta.variables ? renderizarVariables(alerta.variables) : (
        <p className="mt-3 text-slate-700">{alerta.descripcion}</p>
      )}

      {!mostrarForm && (
        <div className="mt-5 flex items-center gap-4 flex-wrap">
          {!soloLectura && (
            <>
              <button onClick={() => abrirFormulario('intervencion')} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded font-medium text-sm transition-colors">
                Registrar acción
              </button>
              <button onClick={() => abrirFormulario('descarte')} className="text-slate-500 hover:text-slate-700 text-sm transition-colors">
                Descartar con motivo
              </button>
            </>
          )}

          {alerta.nivel === 'alumno' && alerta.clase_id && alerta.asignatura_id && (
            <Link to={`/asignatura/${alerta.asignatura_id}/clase/${alerta.clase_id}?alumno=${alerta.alumno_id}`} className="ml-auto text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors flex items-center">
              Ver expediente y clase del alumno <span className="ml-1">&rarr;</span>
            </Link>
          )}
        </div>
      )}

      {mostrarForm && (
        <div className="mt-4 p-4 border border-slate-200 rounded-md bg-white">
          <h4 className="font-bold mb-3 text-slate-800">
            {tipoAccion === 'descarte' ? 'Motivo del descarte' : 'Detalles de la acción'}
          </h4>
          <div className="flex flex-col gap-3">
            <textarea 
              className="p-2 border rounded resize-none text-sm" rows={2}
              value={descripcion} onChange={e => setDescripcion(e.target.value)} 
              placeholder={tipoAccion === 'descarte' ? '¿Por qué descartas esta alerta?' : '¿Qué acción vas a tomar?'}
            />
            
            {/* SOLO MOSTRAMOS LA FECHA SI ES UNA INTERVENCIÓN */}
            {tipoAccion === 'intervencion' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Fecha prevista de revisión</label>
                <input 
                  type="date" className="p-2 border rounded text-sm w-full md:w-auto"
                  value={fechaRevision} onChange={e => setFechaRevision(e.target.value)} 
                />
              </div>
            )}
            
            <div className="flex gap-2 mt-2">
              <button disabled={cargando} onClick={guardarAccion} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
                {cargando ? 'Guardando...' : 'Confirmar'}
              </button>
              <button disabled={cargando} onClick={() => setMostrarForm(false)} className="text-slate-500 hover:text-slate-700 px-4 py-2 text-sm font-medium transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}