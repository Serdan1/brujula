// Funciones compartidas para leer y actualizar datos de Supabase
import { supabase } from './supabase';

export type Profesor = { id: number; escuela_id: number; rol: string; nombre: string };

let profesorCache: Promise<Profesor | null> | null = null;

export function miProfesor(): Promise<Profesor | null> {
  if (!profesorCache) {
    profesorCache = (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from('profesor')
        .select('id, escuela_id, rol, nombre')
        .eq('user_id', user.id)
        .single();
      return (data as Profesor) ?? null;
    })();
  }
  return profesorCache;
}

export function olvidarProfesor() {
  profesorCache = null;
}

export const nombreClase = (c: any) => (c ? `${c.curso}º ${c.letra}` : '');

// Textos para cada motivo de alerta
export const MOTIVOS: Record<string, { corto: string; grupo: string }> = {
  riesgo_de_suspenso: { corto: 'Podría necesitar apoyo', grupo: 'podrían necesitar apoyo' },
  faltas_en_aumento: { corto: 'Asistencia baja', grupo: 'con asistencia baja' },
  practicas_por_debajo: { corto: 'Prácticas por debajo del aprobado', grupo: 'con prácticas por debajo del aprobado' },
  baja_participacion: { corto: 'Participación baja', grupo: 'con participación baja' },
  bajada_de_notas: { corto: 'Bajada de notas', grupo: 'con bajada de notas' },
  grupo_por_debajo_de_la_media: { corto: 'Grupo por encima de la media de alertas', grupo: 'grupos por encima de la media' },
};

// Nombres legibles para las alertas de reglas, que no traen "nombre"
const NOMBRES_VARIABLES: Record<string, string> = {
  asistencia: 'Asistencia',
  nota_practicas: 'Nota de prácticas',
  participacion: 'Participación en clase',
};

// Variables sintéticas en esta demo (se marcan con un asterisco)
export const SINTETICAS = new Set(['nota_practicas', 'participacion', 'asistencia']);

// Motivos de una alerta, normalizados a { variable, nombre, valor }
export function motivosDe(alerta: any): { variable: string; nombre: string; valor: string }[] {
  const vars = Array.isArray(alerta?.variables) ? alerta.variables : [];
  return vars
    .filter((v: any) => v && v.variable)
    .map((v: any) => ({
      variable: v.variable,
      nombre: v.nombre ?? NOMBRES_VARIABLES[v.variable] ?? v.variable,
      valor: String(v.valor ?? ''),
    }));
}

const ORDEN_SEVERIDAD: Record<string, number> = { alta: 0, media: 1 };
const ORDEN_NIVEL: Record<string, number> = { asignatura: 0, clase: 1, alumno: 2 };

// Alertas visibles para el usuario (las reglas de Supabase ya filtran por profesor)
export async function cargarAlertas(filtros: { asignaturaId?: string | number; claseId?: string | number; soloNuevas?: boolean } = {}) {
  let q = supabase
    .from('alerta')
    .select('*, alumno ( nombre ), clase ( curso, letra ), asignatura ( nombre )')
    .neq('estado', 'descartada');
  if (filtros.asignaturaId) q = q.eq('asignatura_id', filtros.asignaturaId);
  if (filtros.claseId) q = q.eq('clase_id', filtros.claseId);
  if (filtros.soloNuevas) q = q.eq('estado', 'nueva');
  const { data, error } = await q;
  if (error) console.error('Error al cargar alertas:', error.message);
  // Orden: severidad, nivel (asignatura y clase antes que alumno) y motivo. Nunca por probabilidad ni por nota.
  return (data ?? []).sort(
    (a: any, b: any) =>
      (ORDEN_SEVERIDAD[a.severidad] ?? 9) - (ORDEN_SEVERIDAD[b.severidad] ?? 9) ||
      (ORDEN_NIVEL[a.nivel] ?? 9) - (ORDEN_NIVEL[b.nivel] ?? 9) ||
      String(a.motivo).localeCompare(String(b.motivo)),
  );
}

export async function marcarRevisada(alertaId: number) {
  const { error } = await supabase.from('alerta').update({ estado: 'revisada' }).eq('id', alertaId);
  if (error) alert('No se ha podido marcar como revisada: ' + error.message);
  return !error;
}

export async function descartarAlerta(alertaId: number, motivo: string) {
  const { error } = await supabase
    .from('alerta')
    .update({ estado: 'descartada', motivo_descarte: motivo })
    .eq('id', alertaId);
  if (error) alert('No se ha podido descartar: ' + error.message);
  return !error;
}

export async function registrarAccion(alertaId: number, tipo: string, descripcion: string, fechaRevision: string) {
  const prof = await miProfesor();
  if (!prof) {
    alert('No se encuentra tu perfil de profesor.');
    return false;
  }
  const { error } = await supabase.from('accion').insert({
    alerta_id: alertaId,
    profesor_id: prof.id,
    tipo,
    descripcion,
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_revision: fechaRevision || null,
  });
  if (error) {
    alert('Error al guardar la acción: ' + error.message);
    return false;
  }
  // Registrar una acción implica que la alerta se ha revisado
  await supabase.from('alerta').update({ estado: 'revisada' }).eq('id', alertaId).eq('estado', 'nueva');
  return true;
}
