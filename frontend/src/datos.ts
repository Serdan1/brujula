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

// Números con formato español: coma decimal (12,6 en vez de 12.6)
export function num(v: any, decimales = 1): string {
  if (v === null || v === undefined || v === '' || isNaN(Number(v))) return '-';
  return Number(v).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: decimales });
}

// Convierte los decimales con punto de un texto ("10.6", "68 %") a coma
export const comaDecimal = (t: string) => t.replace(/(\d)\.(\d)/g, '$1,$2');

// ---------- Escala de notas ----------
// Supabase y el modelo guardan las notas sobre 20 (como el dataset original).
// En toda la web se muestran sobre 10: se divide entre ESCALA al mostrar y se multiplica al importar.
export const ESCALA = 2;
export const NOTA_MAX = 10;

// Nota guardada (sobre 20) → nota mostrada (sobre 10). Deja pasar null/vacío para que num() muestre "-".
export function sobre10(v: any): any {
  if (v === null || v === undefined || v === '' || isNaN(Number(v))) return v;
  return Number(v) / ESCALA;
}

// Variables que son notas (incluida G1, la nota del primer periodo que usa el modelo)
const VARIABLES_NOTA = new Set(['G1', 'nota_examen', 'nota_practicas']);

// Divide entre 2 cada número de un texto ("8", "de 12.0 a 9.0") y lo escribe con coma
const mitades = (t: string) =>
  t.replace(/\d+(?:[.,]\d+)?/g, (n) => num(Number(n.replace(',', '.')) / ESCALA, 2));

// Valor de un motivo de alerta, pasado a sobre 10 si es una nota
export const valorNota = (variable: string, valor: string) =>
  VARIABLES_NOTA.has(variable) ? mitades(valor) : valor;

// Textos de alerta generados por el modelo o por Supabase con notas sobre 20, reescritos sobre 10:
// "nota del primer periodo: 8", "Nota de prácticas de 5.2 sobre 20", "nota de examen baja de 12.0 a 9.0 sobre 20"
export function textoSobre10(t: string | null | undefined): string {
  if (!t) return t ?? '';
  return t
    .replace(
      /(nota (?:del primer periodo|de prácticas|de examen)(?: baja)?(?::| de) )(\d+(?:[.,]\d+)?)((?: a )(\d+(?:[.,]\d+)?))?/gi,
      (_m, pre, a, _resto, b) => pre + mitades(a) + (b ? ' a ' + mitades(b) : ''),
    )
    .replace(/sobre 20/g, 'sobre 10');
}

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
  nota_examen: 'Nota de examen',
  faltas: 'Faltas',
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
      valor: comaDecimal(valorNota(v.variable, String(v.valor ?? ''))),
    }));
}


const ORDEN_SEVERIDAD: Record<string, number> = {
  alta: 0,
  media: 1
};

const ORDEN_NIVEL: Record<string, number> = {
  asignatura: 0,
  clase: 1,
  alumno: 2
};

const ORDEN_ESTADO: Record<string, number> = {
  nueva: 0,
  revisada: 1
};

// Obtener alertas visibles para el profesor
export async function cargarAlertas(
  filtros: {
    asignaturaId?: string | number;
    claseId?: string | number;
    soloNuevas?: boolean;
  } = {}
) {
  let q = supabase
    .from('alerta')
    .select(
      '*, alumno ( nombre ), clase ( curso, letra ), asignatura ( nombre )'
    )
    .neq('estado', 'descartada');

  if (filtros.asignaturaId) {
    q = q.eq('asignatura_id', filtros.asignaturaId);
  }

  if (filtros.claseId) {
    q = q.eq('clase_id', filtros.claseId);
  }

  if (filtros.soloNuevas) {
    q = q.eq('estado', 'nueva');
  }

  const { data, error } = await q;

  if (error) {
    console.error('Error al cargar alertas:', error.message);
  }

  // Orden de las alertas:
  // 1. Nuevas antes que revisadas.
  // 2. Prioridad alta antes que media.
  // 3. Asignatura, clase y alumno.
  // 4. Motivo alfabético.

  
return (data ?? []).sort((a: any, b: any) => {
  // 1. Nuevas antes que revisadas
  const estado =
    (ORDEN_ESTADO[a.estado] ?? 9) -
    (ORDEN_ESTADO[b.estado] ?? 9);

  if (estado !== 0) return estado;

  // 2. Prioridad alta antes que media
  const severidad =
    (ORDEN_SEVERIDAD[a.severidad] ?? 9) -
    (ORDEN_SEVERIDAD[b.severidad] ?? 9);

  if (severidad !== 0) return severidad;

  // 3. Ordenar por nivel de alerta
  const nivel =
    (ORDEN_NIVEL[a.nivel] ?? 9) -
    (ORDEN_NIVEL[b.nivel] ?? 9);

  if (nivel !== 0) return nivel;

  // 4. Alertas del modelo primero
  const modelo =
    Number(b.motivo === 'riesgo_de_suspenso') -
    Number(a.motivo === 'riesgo_de_suspenso');

  if (modelo !== 0) return modelo;

  // 5. Orden alfabético por motivo
  return String(a.motivo).localeCompare(
    String(b.motivo)
  );
});

}

export async function marcarRevisada(alertaId: number) {
  const { error } = await supabase
    .from('alerta')
    .update({ estado: 'revisada' })
    .eq('id', alertaId);

  if (error) {
    alert(
      'No se ha podido marcar como revisada: ' +
      error.message
    );
  }

  return !error;
}

export async function descartarAlerta(
  alertaId: number,
  motivo: string
) {
  const { error } = await supabase
    .from('alerta')
    .update({
      estado: 'descartada',
      motivo_descarte: motivo
    })
    .eq('id', alertaId);

  if (error) {
    alert(
      'No se ha podido descartar: ' +
      error.message
    );
  }

  return !error;
}

export async function registrarAccion(
  alertaId: number,
  tipo: string,
  descripcion: string,
  fechaRevision: string
) {
  const prof = await miProfesor();

  if (!prof) {
    alert('No se encuentra tu perfil de profesor.');
    return false;
  }

  const { error } = await supabase
    .from('accion')
    .insert({
      alerta_id: alertaId,
      profesor_id: prof.id,
      tipo,
      descripcion,
      fecha_inicio: new Date()
        .toISOString()
        .split('T')[0],
      fecha_revision: fechaRevision || null
    });

  if (error) {
    alert(
      'Error al guardar la acción: ' +
      error.message
    );
    return false;
  }

  // Registrar una acción implica revisar la alerta
  await supabase
    .from('alerta')
    .update({ estado: 'revisada' })
    .eq('id', alertaId)
    .eq('estado', 'nueva');

  return true;
}
