import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { MOTIVOS, miProfesor, num } from '../datos';

// Importar desde un CSV (exportado de Excel) las notas y la asistencia del 2.º o 3.º trimestre de una clase.
// Solo lo ve el profesor que imparte esta asignatura en esta clase; nunca un director.
// La validación definitiva la hace Supabase (importar_trimestre); aquí se adelanta para la vista previa.

type Props = { claseId: string; asignaturaId: string; onGuardado?: () => void };

const CAMPOS = ['nota_examen', 'nota_practicas', 'participacion', 'asistencia', 'faltas'] as const;
type Campo = (typeof CAMPOS)[number];
const COLUMNAS = ['alumno_id', 'nombre', 'periodo', ...CAMPOS];

const NOMBRE: Record<Campo, string> = {
  nota_examen: 'la nota de examen',
  nota_practicas: 'la nota de prácticas',
  participacion: 'la participación',
  asistencia: 'la asistencia',
  faltas: 'el número de faltas',
};
const MAXIMO: Record<Campo, number> = { nota_examen: 20, nota_practicas: 20, participacion: 10, asistencia: 100, faltas: Infinity };

type Fila = {
  linea: number;                       // línea del archivo (la 1 es la cabecera)
  alumnoId: number | null;
  nombre: string;
  valores: Record<Campo, number | null>;
  errores: string[];
};

const mayus = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

// Separa una línea respetando las comillas dobles
function partir(linea: string, sep: string): string[] {
  const res: string[] = [];
  let actual = '';
  let comillas = false;
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (c === '"') {
      if (comillas && linea[i + 1] === '"') { actual += '"'; i++; } else comillas = !comillas;
    } else if (c === sep && !comillas) {
      res.push(actual); actual = '';
    } else actual += c;
  }
  res.push(actual);
  return res.map((v) => v.trim());
}

// "12,5" o "12.5" o "92,5 %" → 12.5 · vacío → null · texto → NaN
function numero(texto: string | undefined): number | null {
  const t = (texto ?? '').replace('%', '').trim();
  if (t === '') return null;
  const n = t.replace(',', '.');
  return /^-?\d+(\.\d+)?$/.test(n) ? Number(n) : NaN;
}

function leerCsv(texto: string, periodo: number, alumnos: Map<number, string>): { filas: Fila[]; general: string[] } {
  const lineas = texto.replace(/^﻿/, '').split(/\r?\n/);
  const cabecera = lineas[0] ?? '';
  const sep = cabecera.includes(';') ? ';' : ',';
  const columnas = partir(cabecera, sep).map((c) => c.toLowerCase());
  const faltan = ['alumno_id', ...CAMPOS].filter((c) => !columnas.includes(c));
  if (faltan.length) {
    const que = faltan.length === 1 ? `Falta la columna ${faltan[0]}` : `Faltan las columnas ${faltan.join(', ')}`;
    return { filas: [], general: [`${que}. Usa la plantilla para no equivocarte con las columnas.`] };
  }
  const pos = (c: string) => columnas.indexOf(c);

  const vistos = new Set<number>();
  const filas: Fila[] = [];
  lineas.slice(1).forEach((l, i) => {
    if (l.trim() === '' || partir(l, sep).every((v) => v === '')) return;   // línea vacía
    const celdas = partir(l, sep);
    const errores: string[] = [];

    const id = numero(celdas[pos('alumno_id')]);
    const alumnoId = id !== null && Number.isInteger(id) ? id : null;
    if (alumnoId === null) errores.push('Falta el número de alumno (alumno_id) o no es válido.');
    else if (!alumnos.has(alumnoId)) errores.push('Este alumno no pertenece a la clase.');
    else if (vistos.has(alumnoId)) errores.push('El alumno aparece más de una vez en el archivo.');
    if (alumnoId !== null) vistos.add(alumnoId);

    if (pos('periodo') >= 0) {
      const p = numero(celdas[pos('periodo')]);
      if (p !== null && p !== periodo) errores.push(`Esta fila es del ${p}.º trimestre, pero estás importando el ${periodo}.º.`);
    }

    const valores = {} as Record<Campo, number | null>;
    const vacios = CAMPOS.filter((c) => numero(celdas[pos(c)]) === null);
    if (vacios.length === CAMPOS.length) errores.push('Faltan todos los datos de este alumno.');
    for (const c of CAMPOS) {
      const v = numero(celdas[pos(c)]);
      valores[c] = v;
      if (vacios.length === CAMPOS.length) continue;
      if (v === null) errores.push(`Falta ${NOMBRE[c]}.`);
      else if (Number.isNaN(v)) errores.push(`${mayus(NOMBRE[c])} no es un número.`);
      else if (c === 'faltas' && (v < 0 || !Number.isInteger(v))) errores.push('Las faltas deben ser un número entero, 0 o más.');
      else if (c !== 'faltas' && (v < 0 || v > MAXIMO[c])) errores.push(`${mayus(NOMBRE[c])} debe estar entre 0 y ${MAXIMO[c]}.`);
    }

    filas.push({
      linea: i + 2,
      alumnoId,
      nombre: (alumnoId !== null && alumnos.get(alumnoId)) || celdas[pos('nombre')] || '',
      valores,
      errores,
    });
  });

  if (filas.length === 0) return { filas, general: ['El archivo no tiene alumnos.'] };
  return { filas, general: [] };
}

function descargarPlantilla(alumnos: Map<number, string>, claseId: string, periodo: number) {
  const csv = [COLUMNAS.join(';'), ...[...alumnos].map(([id, nombre]) => [id, nombre, '', '', '', '', '', ''].join(';'))].join('\r\n');
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `plantilla-clase-${claseId}-trimestre-${periodo}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

export default function ImportarTrimestre({ claseId, asignaturaId, onGuardado }: Props) {
  const [puede, setPuede] = useState(false);
  const [periodos, setPeriodos] = useState<number[]>([]);
  const [alumnos, setAlumnos] = useState<Map<number, string>>(new Map());
  const [periodo, setPeriodo] = useState(2);
  const [archivo, setArchivo] = useState('');
  const [filas, setFilas] = useState<Fila[]>([]);
  const [general, setGeneral] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [resumen, setResumen] = useState('');

  async function cargar() {
    const prof = await miProfesor();
    if (!prof || prof.rol === 'director') return setPuede(false);
    const { data: imparte } = await supabase.from('imparte').select('profesor_id')
      .eq('clase_id', claseId).eq('asignatura_id', asignaturaId).eq('profesor_id', prof.id).maybeSingle();
    if (!imparte) return setPuede(false);

    const { data } = await supabase.from('rendimiento')
      .select('periodo, alumno_id, alumno!inner ( nombre, clase_id )')
      .eq('asignatura_id', asignaturaId).eq('alumno.clase_id', claseId);
    const filasBd = (data ?? []) as any[];
    const hay = [...new Set(filasBd.map((r) => r.periodo as number))].sort();
    const lista = new Map<number, string>(
      filasBd.filter((r) => r.periodo === 1)
        .sort((a, b) => a.alumno.nombre.localeCompare(b.alumno.nombre))
        .map((r) => [r.alumno_id, r.alumno.nombre]),
    );
    setPeriodos(hay);
    setAlumnos(lista);
    setPeriodo([2, 3].find((p) => !hay.includes(p)) ?? 2);
    setPuede(true);
  }

  useEffect(() => { cargar(); }, [claseId, asignaturaId]);

  if (!puede) return null;

  const falta = [2, 3].find((p) => !periodos.includes(p));
  const conErrores = filas.filter((f) => f.errores.length > 0).length;
  const listo = filas.length > 0 && conErrores === 0 && general.length === 0;

  function limpiar() {
    setArchivo(''); setFilas([]); setGeneral([]);
  }

  async function leer(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';                 // permite volver a elegir el mismo archivo tras corregirlo
    if (!f) return;
    setResumen('');
    const { filas, general } = leerCsv(await f.text(), periodo, alumnos);
    setArchivo(f.name); setFilas(filas); setGeneral(general);
  }

  async function guardar() {
    setGuardando(true);
    const { data, error } = await supabase.rpc('importar_trimestre', {
      p_clase: Number(claseId),
      p_asignatura: Number(asignaturaId),
      p_periodo: periodo,
      p_filas: filas.map((f) => ({ alumno_id: f.alumnoId, ...f.valores })),
    });
    setGuardando(false);
    if (error) return setGeneral([`No se ha podido guardar: ${error.message}`]);

    const res = data as { guardadas: number; alertas: Record<string, number>; errores: any[] };
    if (res.errores?.length) {
      // Errores que solo detecta la base de datos: se marcan en su fila
      setFilas((prev) => prev.map((f, i) => ({
        ...f, errores: [...f.errores, ...res.errores.filter((x) => x.fila === i + 1).map((x) => x.motivo)],
      })));
      return;
    }
    const total = Object.values(res.alertas ?? {}).reduce((s, n) => s + n, 0);
    const detalle = Object.entries(res.alertas ?? {}).map(([m, n]) => `${MOTIVOS[m]?.corto ?? m}: ${n}`).join(' · ');
    setResumen(`${plural(res.guardadas, 'alumno guardado', 'alumnos guardados')}, `
      + `${total === 0 ? 'ninguna alerta nueva' : plural(total, 'alerta nueva', 'alertas nuevas')}`
      + `${detalle ? ` (${detalle})` : ''}.`);
    limpiar();
    await cargar();
    onGuardado?.();
  }

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-4 mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#0f3d4c]">
            {falta ? `Añadir datos del ${falta}.º trimestre` : 'Actualizar datos de un trimestre'}
          </h2>
          <p className="text-sm text-gray-600">
            Descarga la plantilla, rellénala en Excel y súbela. Brújula revisa los datos antes de guardar nada.
          </p>
        </div>
        {!falta && (
          <label className="text-sm text-gray-700 flex items-center gap-2">
            Trimestre
            <select value={periodo} onChange={(e) => { setPeriodo(Number(e.target.value)); limpiar(); }}
              className="border border-gray-300 rounded px-2 py-1">
              <option value={2}>2.º trimestre</option>
              <option value={3}>3.º trimestre</option>
            </select>
          </label>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => descargarPlantilla(alumnos, claseId, periodo)}
          className="text-sm px-3 py-1.5 rounded border border-[#0f3d4c] text-[#0f3d4c] hover:bg-gray-50">
          Descargar plantilla
        </button>
        <label className="text-sm px-3 py-1.5 rounded bg-[#0f3d4c] text-white cursor-pointer hover:opacity-90">
          Importar .csv
          <input type="file" accept=".csv,text/csv" onChange={leer} className="sr-only" />
        </label>
      </div>

      {resumen && (
        <p className="mt-3 text-sm rounded border border-emerald-200 bg-emerald-50 text-emerald-800 px-3 py-2" role="status">{resumen}</p>
      )}

      {general.map((g) => (
        <p key={g} className="mt-3 text-sm rounded border border-amber-300 bg-amber-50 text-amber-900 px-3 py-2" role="alert">{g}</p>
      ))}

      {filas.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-gray-700 mb-2">
            <strong>{archivo}</strong> · {plural(filas.length, 'alumno', 'alumnos')} del {periodo}.º trimestre
            {conErrores > 0 ? ` · ${plural(conErrores, 'fila con problemas', 'filas con problemas')}: corrígelas en el archivo y vuelve a importarlo.` : ' · sin problemas.'}
          </p>
          <div className="overflow-x-auto border border-gray-200 rounded">
            <table className="w-full min-w-[720px] text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-700">
                  <th className="p-2 font-semibold">Línea</th>
                  <th className="p-2 font-semibold">Alumno</th>
                  <th className="p-2 font-semibold">Examen</th>
                  <th className="p-2 font-semibold">Prácticas</th>
                  <th className="p-2 font-semibold">Participación</th>
                  <th className="p-2 font-semibold">Asistencia</th>
                  <th className="p-2 font-semibold">Faltas</th>
                  <th className="p-2 font-semibold">Revisión</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.linea} className={`border-t border-gray-100 align-top ${f.errores.length ? 'bg-amber-50' : ''}`}>
                    <td className="p-2 text-gray-500">{f.linea}</td>
                    <td className="p-2">{f.nombre || '—'}</td>
                    {CAMPOS.map((c) => (
                      <td key={c} className="p-2">{f.valores[c] === null || Number.isNaN(f.valores[c]) ? '—' : num(f.valores[c], 2)}</td>
                    ))}
                    <td className="p-2">
                      {f.errores.length === 0 ? <span className="text-emerald-700">Correcta</span> : (
                        <ul className="text-amber-900 list-disc pl-4">
                          {f.errores.map((e) => <li key={e}>{e}</li>)}
                        </ul>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={guardar} disabled={!listo || guardando}
              className="text-sm px-4 py-1.5 rounded bg-[#0f3d4c] text-white disabled:opacity-40 disabled:cursor-not-allowed">
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
            <button onClick={limpiar} className="text-sm px-3 py-1.5 rounded text-gray-600 hover:underline">Cancelar</button>
          </div>
        </div>
      )}
    </section>
  );
}
