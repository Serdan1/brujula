// Página de Iván adaptada a cómo guarda develop las acciones y los descartes:
// - Las acciones (tutoría, reunión con la familia, refuerzo, seguimiento) están en la tabla accion.
// - Los descartes no son acciones: son alertas en estado «descartada» con su motivo_descarte.
// Las acciones no se borran (quedan auditadas): se marcan como hechas guardando su resultado.
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import { miProfesor, nombreClase } from '../datos';

const TIPOS: Record<string, string> = {
  tutoría: 'Tutoría con el alumno', reunión_familia: 'Reunión con la familia',
  refuerzo: 'Material de refuerzo', seguimiento: 'Seguimiento en clase',
};

type Pestana = 'intervencion' | 'descarte';

const fecha = (f?: string | null) => (f ? new Date(f).toLocaleDateString('es-ES') : '');

export default function MisAcciones() {
  const location = useLocation();
  const tipoUrl = new URLSearchParams(location.search).get('tipo');
  const [pestana, setPestana] = useState<Pestana>(tipoUrl === 'descarte' ? 'descarte' : 'intervencion');
  const [acciones, setAcciones] = useState<any[]>([]);
  const [descartes, setDescartes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (tipoUrl === 'descarte' || tipoUrl === 'intervencion') setPestana(tipoUrl);
  }, [tipoUrl]);

  async function cargar() {
    const prof = await miProfesor();
    if (!prof) return;
    const [{ data: acc, error: e1 }, { data: desc, error: e2 }] = await Promise.all([
      supabase
        .from('accion')
        .select('id, tipo, descripcion, fecha_inicio, fecha_revision, resultado, alerta ( titulo, alumno_id, clase_id, asignatura_id, alumno ( nombre ), clase ( curso, letra ) )')
        .eq('profesor_id', prof.id),
      supabase
        .from('alerta')
        .select('id, titulo, motivo_descarte, alumno_id, clase_id, asignatura_id, alumno ( nombre ), clase ( curso, letra )')
        .eq('estado', 'descartada')
        .eq('nivel', 'alumno'),
    ]);
    if (e1) console.error('Error cargando acciones:', e1.message);
    if (e2) console.error('Error cargando descartes:', e2.message);
    // Primero las pendientes, por fecha de revisión más próxima; después las hechas
    setAcciones((acc ?? []).sort((a: any, b: any) =>
      Number(!!a.resultado) - Number(!!b.resultado) ||
      String(a.fecha_revision ?? '9999').localeCompare(String(b.fecha_revision ?? '9999'))));
    setDescartes(desc ?? []);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function marcarHecha(id: number) {
    const resultado = window.prompt('¿Cómo ha ido? (queda registrado)');
    if (!resultado || !resultado.trim()) return;
    const { error } = await supabase.from('accion').update({ resultado: resultado.trim() }).eq('id', id);
    if (error) alert('No se ha podido guardar: ' + error.message);
    else cargar();
  }

  async function reabrir(alertaId: number) {
    if (!confirm('La alerta volverá a estar pendiente y aparecerá de nuevo en Inicio. ¿Continuar?')) return;
    const { error } = await supabase.from('alerta').update({ estado: 'nueva', motivo_descarte: null }).eq('id', alertaId);
    if (error) alert('No se ha podido reabrir: ' + error.message);
    else cargar();
  }

  const enlaceAlumno = (a: any) =>
    a?.alumno_id ? `/asignatura/${a.asignatura_id}/clase/${a.clase_id}/alumno/${a.alumno_id}` : null;

  const pestanaClase = (p: Pestana) =>
    `py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
      pestana === p ? 'border-[#174A55] text-[#174A55]' : 'border-transparent text-gray-500 hover:text-[#174A55]'
    }`;

  return (
    <div className="p-8 bg-[#fdfbf7] min-h-screen max-w-4xl mx-auto">
      <Link to="/" className="text-sm text-gray-500 hover:text-[#0f3d4c] underline mb-4 inline-block">← Inicio</Link>
      <h1 className="text-2xl font-bold text-[#0f3d4c] mb-6">Seguimiento de alertas</h1>

      <div className="flex border-b border-gray-200 mb-6">
        <button onClick={() => setPestana('intervencion')} className={pestanaClase('intervencion')}>
          Próximas revisiones ({acciones.filter((a) => !a.resultado).length})
        </button>
        <button onClick={() => setPestana('descarte')} className={pestanaClase('descarte')}>
          Descartes ({descartes.length})
        </button>
      </div>

      {cargando ? (
        <p className="text-gray-500">Cargando registros...</p>
      ) : pestana === 'intervencion' ? (
        acciones.length === 0 ? (
          <p className="text-gray-500 italic">Todavía no has registrado ninguna acción.</p>
        ) : (
          <div className="grid gap-4">
            {acciones.map((a) => {
              const al = a.alerta;
              const enlace = enlaceAlumno(al);
              return (
                <div key={a.id} className={`p-5 border rounded-lg shadow-sm bg-white ${a.resultado ? 'border-gray-200 opacity-80' : 'border-[#174A55]/30'}`}>
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${a.resultado ? 'bg-gray-100 text-gray-600' : 'bg-teal-50 text-teal-700 border border-teal-200'}`}>
                      {a.resultado ? 'Hecha' : 'En seguimiento'} · {TIPOS[a.tipo] ?? a.tipo}
                    </span>
                    {a.fecha_revision && !a.resultado && (
                      <span className="text-xs text-gray-600 font-medium bg-gray-50 px-2 py-1 rounded">Revisar el {fecha(a.fecha_revision)}</span>
                    )}
                  </div>
                  <h3 className="mt-3 font-semibold text-[#0f3d4c]">
                    {enlace ? <Link to={enlace} className="hover:underline">{al?.alumno?.nombre}</Link> : al?.alumno?.nombre}
                    {al?.clase ? <span className="text-gray-500 font-normal"> · {nombreClase(al.clase)}</span> : null}
                  </h3>
                  <p className="text-sm text-gray-500">{al?.titulo ?? 'Alerta no disponible'}</p>
                  <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-3 rounded">{a.descripcion}</p>
                  {a.resultado && <p className="text-sm text-gray-700 mt-2"><strong>Resultado:</strong> {a.resultado}</p>}
                  {!a.resultado && (
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <button onClick={() => marcarHecha(a.id)} className="text-sm font-medium text-[#174A55] hover:underline">
                        Marcar como hecha y anotar el resultado
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : descartes.length === 0 ? (
        <p className="text-gray-500 italic">No has descartado ninguna alerta.</p>
      ) : (
        <div className="grid gap-4">
          {descartes.map((d) => {
            const enlace = enlaceAlumno(d);
            return (
              <div key={d.id} className="p-5 border border-gray-200 rounded-lg shadow-sm bg-white">
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">Descartada</span>
                <h3 className="mt-3 font-semibold text-[#0f3d4c]">
                  {enlace ? <Link to={enlace} className="hover:underline">{d.alumno?.nombre}</Link> : d.alumno?.nombre}
                  {d.clase ? <span className="text-gray-500 font-normal"> · {nombreClase(d.clase)}</span> : null}
                </h3>
                <p className="text-sm text-gray-500">{d.titulo}</p>
                {d.motivo_descarte && <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-3 rounded">Motivo: {d.motivo_descarte}</p>}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <button onClick={() => reabrir(d.id)} className="text-sm font-medium text-[#174A55] hover:underline">
                    Reabrir alerta
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
