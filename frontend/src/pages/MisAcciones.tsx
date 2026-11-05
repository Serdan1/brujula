// Página de Iván adaptada a cómo guarda develop las acciones y los descartes:
// - Las acciones (tutoría, reunión con la familia, refuerzo, seguimiento) están en la tabla accion.
// - Los descartes no son acciones: son alertas en estado «descartada» con su motivo_descarte.
// Las acciones se pueden marcar como resueltas (guardando el resultado) o eliminar con la función
// eliminar_accion_y_reabrir (solo las propias; si la alerta se queda sin acciones, vuelve a pendiente).
// Los descartes no se borran: «Quitar de la lista» solo los oculta en este navegador.
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import { fecha, miProfesor, nombreClase, tituloAlerta } from '../datos';
import { useIdioma } from '../i18n';

type Pestana = 'intervencion' | 'descarte';
type Filtro = 'seguimiento' | 'resueltas' | 'todas';

const CLAVE_OCULTOS = 'brujula-descartes-ocultos';
// Una acción está resuelta si tiene un resultado real (las de pruebas antiguas guardaban «Pendiente»)
const estaResuelta = (a: any) => !!a.resultado && String(a.resultado).trim().toLowerCase() !== 'pendiente';
function leerOcultos(): number[] {
  try { return JSON.parse(localStorage.getItem(CLAVE_OCULTOS) ?? '[]'); } catch { return []; }
}

export default function MisAcciones() {
  const { t } = useIdioma();
  const m = t.misAcciones;
  const location = useLocation();
  const tipoUrl = new URLSearchParams(location.search).get('tipo');
  const [pestana, setPestana] = useState<Pestana>(tipoUrl === 'descarte' ? 'descarte' : 'intervencion');
  const [acciones, setAcciones] = useState<any[]>([]);
  const [descartes, setDescartes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>('seguimiento');
  const [ocultos, setOcultos] = useState<number[]>(leerOcultos());
  const [verOcultos, setVerOcultos] = useState(false);

  useEffect(() => {
    if (tipoUrl === 'descarte' || tipoUrl === 'intervencion') setPestana(tipoUrl);
  }, [tipoUrl]);

  async function cargar() {
    const prof = await miProfesor();
    if (!prof) return;
    const [{ data: acc, error: e1 }, { data: desc, error: e2 }] = await Promise.all([
      supabase
        .from('accion')
        .select('id, tipo, descripcion, fecha_inicio, fecha_revision, resultado, alerta ( titulo, nivel, motivo, periodo, variables, alumno_id, clase_id, asignatura_id, alumno ( nombre ), clase ( curso, letra ), asignatura ( nombre ) )')
        .eq('profesor_id', prof.id),
      supabase
        .from('alerta')
        .select('id, titulo, nivel, motivo, periodo, variables, motivo_descarte, alumno_id, clase_id, asignatura_id, alumno ( nombre ), clase ( curso, letra ), asignatura ( nombre )')
        .eq('estado', 'descartada')
        .eq('nivel', 'alumno'),
    ]);
    if (e1) console.error('Error cargando acciones:', e1.message);
    if (e2) console.error('Error cargando descartes:', e2.message);
    // Primero las pendientes, por fecha de revisión más próxima; después las hechas
    setAcciones((acc ?? []).sort((a: any, b: any) =>
      Number(estaResuelta(a)) - Number(estaResuelta(b)) ||
      String(a.fecha_revision ?? '9999').localeCompare(String(b.fecha_revision ?? '9999'))));
    setDescartes(desc ?? []);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function marcarHecha(id: number) {
    const resultado = window.prompt(m.preguntaResultado);
    if (!resultado || !resultado.trim()) return;
    const { error } = await supabase.from('accion').update({ resultado: resultado.trim() }).eq('id', id);
    if (error) alert(t.errores.guardar + error.message);
    else cargar();
  }

  async function eliminar(id: number) {
    if (!confirm(m.confirmarEliminar)) return;
    const { error } = await supabase.rpc('eliminar_accion_y_reabrir', { p_accion_id: id });
    if (error) alert(t.errores.guardar + error.message);
    else cargar();
  }

  function quitarDeLaLista(alertaId: number) {
    if (!confirm(m.confirmarQuitar)) return;
    const nuevos = [...new Set([...ocultos, alertaId])];
    setOcultos(nuevos);
    try { localStorage.setItem(CLAVE_OCULTOS, JSON.stringify(nuevos)); } catch { /* sin almacenamiento */ }
  }

  async function reabrir(alertaId: number) {
    if (!confirm(m.confirmarReabrir)) return;
    const { error } = await supabase.from('alerta').update({ estado: 'nueva', motivo_descarte: null }).eq('id', alertaId);
    if (error) alert(t.errores.reabrir + error.message);
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
      <Link to="/" className="text-sm text-gray-500 hover:text-[#0f3d4c] underline mb-4 inline-block">{t.app.volverInicio}</Link>
      <h1 className="text-2xl font-bold text-[#0f3d4c] mb-6">{m.titulo}</h1>

      <div className="flex border-b border-gray-200 mb-6">
        <button onClick={() => setPestana('intervencion')} className={pestanaClase('intervencion')}>
          {m.pestanaRevisiones(acciones.filter((a) => !estaResuelta(a)).length)}
        </button>
        <button onClick={() => setPestana('descarte')} className={pestanaClase('descarte')}>
          {m.pestanaDescartes(descartes.filter((d) => !ocultos.includes(d.id)).length)}
        </button>
      </div>

      {cargando ? (
        <p className="text-gray-500">{m.cargando}</p>
      ) : pestana === 'intervencion' ? (
        acciones.length === 0 ? (
          <p className="text-gray-500 italic">{m.sinAcciones}</p>
        ) : (
          <>
          <div className="flex flex-wrap gap-2 mb-4">
            {(['seguimiento', 'resueltas', 'todas'] as Filtro[]).map((f) => {
              const n = f === 'todas' ? acciones.length : acciones.filter((a) => estaResuelta(a) === (f === 'resueltas')).length;
              const etiqueta = f === 'seguimiento' ? m.filtroSeguimiento : f === 'resueltas' ? m.filtroResueltas : m.filtroTodas;
              return (
                <button key={f} onClick={() => setFiltro(f)}
                  className={`px-3 py-1 rounded-full text-sm border ${filtro === f ? 'bg-[#174A55] text-white border-[#174A55]' : 'bg-white text-[#174A55] border-gray-300 hover:border-[#174A55]'}`}>
                  {etiqueta} ({n})
                </button>
              );
            })}
          </div>
          {acciones.filter((a) => filtro === 'todas' || estaResuelta(a) === (filtro === 'resueltas')).length === 0 && (
            <p className="text-gray-500 italic">{m.vacioFiltro}</p>
          )}
          <div className="grid gap-4">
            {acciones.filter((a) => filtro === 'todas' || estaResuelta(a) === (filtro === 'resueltas')).map((a) => {
              const al = a.alerta;
              const enlace = enlaceAlumno(al);
              return (
                <div key={a.id} className={`p-5 border rounded-lg shadow-sm bg-white ${estaResuelta(a) ? 'border-gray-200 opacity-80' : 'border-[#174A55]/30'}`}>
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${estaResuelta(a) ? 'bg-gray-100 text-gray-600' : 'bg-teal-50 text-teal-700 border border-teal-200'}`}>
                      {estaResuelta(a) ? m.resuelta : m.enSeguimiento} · {t.tiposAccion[a.tipo] ?? a.tipo}
                    </span>
                    {a.fecha_revision && !estaResuelta(a) && (
                      <span className="text-xs text-gray-600 font-medium bg-gray-50 px-2 py-1 rounded">{m.revisarEl(fecha(a.fecha_revision))}</span>
                    )}
                  </div>
                  <h3 className="mt-3 font-semibold text-[#0f3d4c]">
                    {enlace ? <Link to={enlace} className="hover:underline">{al?.alumno?.nombre}</Link> : al?.alumno?.nombre}
                    {al?.clase ? <span className="text-gray-500 font-normal"> · {nombreClase(al.clase)}</span> : null}
                  </h3>
                  <p className="text-sm text-gray-500">{al ? tituloAlerta(al) : m.alertaNoDisponible}</p>
                  <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-3 rounded">{a.descripcion}</p>
                  {estaResuelta(a) && <p className="text-sm text-gray-700 mt-2"><strong>{m.resultado}</strong> {a.resultado}</p>}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-4">
                    {!estaResuelta(a) && (
                      <button onClick={() => marcarHecha(a.id)} className="text-sm font-medium text-[#174A55] hover:underline">
                        {m.marcarHecha}
                      </button>
                    )}
                    <button onClick={() => eliminar(a.id)} className="text-sm font-medium text-red-700 hover:underline ml-auto">
                      {m.eliminar}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          </>
        )
      ) : descartes.length === 0 ? (
        <p className="text-gray-500 italic">{m.sinDescartes}</p>
      ) : (
        <div className="grid gap-4">
          {ocultos.some((id) => descartes.some((d) => d.id === id)) && (
            <button onClick={() => setVerOcultos(!verOcultos)} className="text-sm text-gray-500 underline justify-self-start">
              {verOcultos ? m.filtroTodas : m.mostrarQuitados(descartes.filter((d) => ocultos.includes(d.id)).length)}
            </button>
          )}
          {descartes.filter((d) => verOcultos || !ocultos.includes(d.id)).map((d) => {
            const enlace = enlaceAlumno(d);
            return (
              <div key={d.id} className="p-5 border border-gray-200 rounded-lg shadow-sm bg-white">
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">{m.descartada}</span>
                <h3 className="mt-3 font-semibold text-[#0f3d4c]">
                  {enlace ? <Link to={enlace} className="hover:underline">{d.alumno?.nombre}</Link> : d.alumno?.nombre}
                  {d.clase ? <span className="text-gray-500 font-normal"> · {nombreClase(d.clase)}</span> : null}
                </h3>
                <p className="text-sm text-gray-500">{tituloAlerta(d)}</p>
                {d.motivo_descarte && <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-3 rounded">{m.motivo(d.motivo_descarte)}</p>}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <button onClick={() => reabrir(d.id)} className="text-sm font-medium text-[#174A55] hover:underline">
                    {m.reabrir}
                  </button>
                  {!ocultos.includes(d.id) && (
                    <button onClick={() => quitarDeLaLista(d.id)} className="text-sm font-medium text-gray-600 hover:underline ml-4">
                      {m.quitar}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
