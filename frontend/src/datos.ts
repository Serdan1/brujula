// Funciones compartidas para leer y actualizar datos de Supabase
import { supabase } from './supabase';
import { localeActual, tActual } from './i18n';

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

// Nombre de una clase en el idioma actual («4.º Primaria A», «4.º ano A», «Grade 4A», «CM1 A»)
export const nombreClase = (c: any) => (c ? tActual().comun.clase(c.curso, c.letra) : '');

// Nombre de una asignatura (en la base de datos está en español)
export const nombreAsignatura = (n: string | null | undefined) => (n ? tActual().comun.asignaturas[n] ?? n : '');

// Números con el formato del idioma actual (12,6 en español; 12.6 en inglés)
export function num(v: any, decimales = 1): string {
  if (v === null || v === undefined || v === '' || isNaN(Number(v))) return '-';
  return Number(v).toLocaleString(localeActual(), { minimumFractionDigits: 0, maximumFractionDigits: decimales });
}

// Fecha «2026-11-05» con el formato del idioma actual
export const fecha = (f?: string | null) => (f ? new Date(f).toLocaleDateString(localeActual()) : '');

// Escribe con el separador decimal del idioma los números de un texto ("10.6", "68 %")
export const comaDecimal = (t: string) =>
  (1.5).toLocaleString(localeActual()).includes(',') ? t.replace(/(\d)\.(\d)/g, '$1,$2') : t.replace(/(\d),(\d)/g, '$1.$2');

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

// Textos de cada motivo de alerta (src/i18n, motivos.*): nombre corto y frase para un grupo de n alumnos
export const motivoCorto = (m: string) => tActual().motivos[m]?.corto ?? m;
export const motivoGrupo = (m: string, n: number) => tActual().motivos[m]?.grupo(n) ?? m;

// Variables sintéticas en esta demo (se marcan con un asterisco)
export const SINTETICAS = new Set(['nota_practicas', 'participacion', 'asistencia']);

// ---------- Textos de las alertas en el idioma actual ----------
// El modelo (ml/alerts.py) y Supabase (importar_trimestre) guardan el título, la descripción y los
// valores en español. La web los vuelve a montar en el idioma elegido a partir de los datos de la
// alerta (motivo, nivel, periodo, asignatura, clase y variables). Si algo no encaja con lo esperado,
// se muestra el texto original de la base de datos: nunca un texto a medias.

// Nombre de una variable del modelo o de las reglas (G1, faltas_log, asistencia...)
export const nombreVariable = (variable: string, original?: string) =>
  tActual().variables[variable] ?? original ?? variable;

// Valor de una variable tal como lo guardó el modelo o Supabase, en el idioma actual
export function valorLegible(variable: string, valor: unknown): string {
  const v = tActual().valores;
  const texto = String(valor ?? '').trim();
  const nota = (n: string) => (VARIABLES_NOTA.has(variable) ? num(Number(n.replace(',', '.')) / ESCALA, 2) : comaDecimal(n));
  const deA = /^de (\d+(?:[.,]\d+)?) a (\d+(?:[.,]\d+)?)$/.exec(texto);     // «de 12.0 a 9.0» (importar trimestre)
  if (deA) return v.deA(nota(deA[1]), nota(deA[2]));
  const faltas = /^(\d+) faltas en el periodo 1$/.exec(texto);                // faltas_log del modelo
  if (faltas) return v.faltasPeriodo1(Number(faltas[1]));
  if (texto === 'sí') return v.si;
  if (texto === 'no') return v.no;
  const pct = /^(\d+(?:[.,]\d+)?) ?%$/.exec(texto);                           // «68 %» → «68%» en inglés y portugués
  if (pct) return porcentaje(Number(pct[1].replace(',', '.')) / 100);
  return comaDecimal(valorNota(variable, texto));                             // números, «< 2 h»
}

// Motivos de una alerta, normalizados a { variable, nombre, valor } en el idioma actual
export function motivosDe(alerta: any): { variable: string; nombre: string; valor: string }[] {
  const vars = Array.isArray(alerta?.variables) ? alerta.variables : [];
  return vars
    .filter((v: any) => v && v.variable)
    .map((v: any) => ({
      variable: v.variable,
      nombre: nombreVariable(v.variable, v.nombre),
      valor: valorLegible(v.variable, v.valor),
    }));
}

const porcentaje = (v: number) => v.toLocaleString(localeActual(), { style: 'percent', maximumFractionDigits: 0 });
const primeraVariable = (a: any) => (Array.isArray(a?.variables) ? a.variables[0] : null) ?? {};

// Título de una alerta en el idioma actual
export function tituloAlerta(a: any): string {
  const original = a?.titulo ?? '';
  const asig = nombreAsignatura(a?.asignatura?.nombre);
  if (!a || !asig) return original;
  const t = tActual().alertas;
  const trimestre = Number(a.periodo) > 1 ? t.enTrimestre(Number(a.periodo)) : '';
  if (a.nivel === 'clase') {
    const v = primeraVariable(a);
    return v.pct_clase != null && a.clase ? t.clase(nombreClase(a.clase), porcentaje(Number(v.pct_clase)), asig) : original;
  }
  if (a.nivel === 'asignatura') return t.asignatura(asig);
  switch (a.motivo) {
    case 'riesgo_de_suspenso': return t.riesgo(asig) + trimestre;
    case 'faltas_en_aumento': return t.faltas(asig) + trimestre;
    case 'practicas_por_debajo': return t.practicas(asig) + trimestre;
    case 'baja_participacion': return t.participacion(asig) + trimestre;
    case 'bajada_de_notas': return t.bajada(asig) + trimestre;
    default: return original;
  }
}

// Descripción de una alerta en el idioma actual (se muestra cuando la alerta no trae motivos)
export function descripcionAlerta(a: any): string {
  const original = textoSobre10(a?.descripcion);
  if (!a) return original;
  const t = tActual().alertas;
  const v = primeraVariable(a);
  if (a.nivel === 'clase') {
    const m = /^(\d+) de (\d+) alumnos/.exec(a.descripcion ?? '');     // «4 de 8 alumnos con alerta; ...»
    return m && v.pct_centro != null ? t.descClase(Number(m[1]), Number(m[2]), porcentaje(Number(v.pct_centro))) : original;
  }
  if (a.nivel === 'asignatura') {
    return v.pct_asignatura != null && v.pct_centro != null
      ? t.descAsignatura(porcentaje(Number(v.pct_asignatura)), porcentaje(Number(v.pct_centro)))
      : original;
  }
  const motivos = motivosDe(a);
  if (motivos.length) return motivos.map((m) => `${m.nombre}: ${m.valor}`).join('; ') + '.';
  return a.motivo === 'riesgo_de_suspenso' ? t.combinacion : original;
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
    alert(tActual().errores.revisar + error.message);
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
    alert(tActual().errores.descartar + error.message);
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
    alert(tActual().errores.sinPerfil);
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
    alert(tActual().errores.guardarAccion + error.message);
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
