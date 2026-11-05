-- =====================================================================
-- Brújula · Importar un trimestre desde la web y alertas de seguimiento
--   1. alerta.periodo: 1 = alertas tempranas (ml/alerts.py), 2-3 = seguimiento
--   2. Las alertas de seguimiento no se pueden borrar salvo con brujula.permitir_borrado = 'on'
--      (así ml/publish.py, que borra alertas «nueva», no se las lleva)
--   3. importar_trimestre(): un profesor sube el 2.º o 3.º trimestre de una de sus clases
--   4. reiniciar_demo(): deja una clase solo con el 1.º trimestre (solo postgres / service_role)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Periodo de cada alerta
-- ---------------------------------------------------------------------
alter table alerta
  add column periodo smallint not null default 1 check (periodo between 1 and 3);

-- ---------------------------------------------------------------------
-- 2. Proteger las alertas de seguimiento
--    Ojo: también ignora los borrados en cascada (al borrar un alumno o una clase con
--    alertas de seguimiento, Postgres dará error). Para eso, activar antes la variable.
-- ---------------------------------------------------------------------
create or replace function public.proteger_alertas_seguimiento()
returns trigger language plpgsql set search_path = public as $$
begin
  if old.periodo > 1
     and coalesce(current_setting('brujula.permitir_borrado', true), 'off') <> 'on' then
    return null;                      -- se ignora el borrado de esta fila
  end if;
  return old;
end;
$$;

create trigger proteger_alertas_seguimiento
  before delete on alerta
  for each row execute function proteger_alertas_seguimiento();

-- ---------------------------------------------------------------------
-- 3. importar_trimestre
--    p_filas: [{"alumno_id": 101, "nota_examen": 12.5, "nota_practicas": 13,
--               "participacion": 6, "asistencia": 92, "faltas": 3}, ...]
--    Devuelve: {"guardadas": n, "alertas": {"motivo": n, ...}, "errores": [{fila, alumno_id, alumno, motivo}]}
-- ---------------------------------------------------------------------
create or replace function public.importar_trimestre(
  p_clase integer, p_asignatura integer, p_periodo integer, p_filas jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_profesor  integer := mi_profesor_id();
  v_escuela   integer;
  v_asig      text;
  v_ord       text := p_periodo || '.º';         -- «2.º»
  v_ant       text := (p_periodo - 1) || '.º';   -- «1.º»
  v_errores   jsonb := '[]'::jsonb;
  v_vistos    integer[] := '{}';
  v_fila      record;
  v_campo     text;
  v_valor     jsonb;
  v_num       numeric;
  v_alumno    integer;
  v_nombre    text;
  v_motivo    text;
  v_guardadas integer;
  v_alertas   jsonb;
begin
  -- Permisos: solo el profesor que imparte esa asignatura en esa clase (nunca un director)
  if v_profesor is null or soy_director() or not exists (
       select 1 from imparte
       where profesor_id = v_profesor and clase_id = p_clase and asignatura_id = p_asignatura) then
    raise exception 'Solo el profesor que imparte esta asignatura en esta clase puede importar sus datos.'
      using errcode = '42501';
  end if;
  if p_periodo is null or p_periodo not in (2, 3) then
    raise exception 'Solo se pueden importar el 2.º o el 3.º trimestre.' using errcode = '22023';
  end if;
  if p_filas is null or jsonb_typeof(p_filas) <> 'array' or jsonb_array_length(p_filas) = 0 then
    raise exception 'El archivo no tiene filas.' using errcode = '22023';
  end if;

  select escuela_id into v_escuela from clase where id = p_clase;
  select nombre into v_asig from asignatura where id = p_asignatura;

  -- 3.1 Validar todas las filas antes de guardar nada
  for v_fila in
    select f.valor, f.n from jsonb_array_elements(p_filas) with ordinality as f(valor, n)
  loop
    v_alumno := null; v_nombre := null;
    v_valor := v_fila.valor -> 'alumno_id';

    if v_valor is null or jsonb_typeof(v_valor) <> 'number'
       or (v_valor)::numeric <> trunc((v_valor)::numeric) then
      v_errores := v_errores || jsonb_build_array(jsonb_build_object(
        'fila', v_fila.n, 'alumno_id', null, 'alumno', null,
        'motivo', 'Falta el número de alumno (alumno_id) o no es válido.'));
      continue;
    end if;

    v_alumno := (v_valor)::numeric::integer;
    select nombre into v_nombre from alumno where id = v_alumno and clase_id = p_clase;
    if v_nombre is null then
      v_errores := v_errores || jsonb_build_array(jsonb_build_object(
        'fila', v_fila.n, 'alumno_id', v_alumno, 'alumno', null,
        'motivo', 'Este alumno no pertenece a la clase.'));
      continue;
    end if;
    if v_alumno = any (v_vistos) then
      v_errores := v_errores || jsonb_build_array(jsonb_build_object(
        'fila', v_fila.n, 'alumno_id', v_alumno, 'alumno', v_nombre,
        'motivo', 'El alumno aparece más de una vez en el archivo.'));
      continue;
    end if;
    v_vistos := v_vistos || v_alumno;

    foreach v_campo in array array['nota_examen', 'nota_practicas', 'participacion', 'asistencia', 'faltas'] loop
      v_motivo := null;
      v_valor := v_fila.valor -> v_campo;
      if v_valor is null or jsonb_typeof(v_valor) = 'null' then
        v_motivo := 'Falta ' || case v_campo
          when 'nota_examen' then 'la nota de examen' when 'nota_practicas' then 'la nota de prácticas'
          when 'participacion' then 'la participación' when 'asistencia' then 'la asistencia'
          else 'el número de faltas' end || '.';
      elsif jsonb_typeof(v_valor) <> 'number' then
        v_motivo := case v_campo
          when 'nota_examen' then 'La nota de examen' when 'nota_practicas' then 'La nota de prácticas'
          when 'participacion' then 'La participación' when 'asistencia' then 'La asistencia'
          else 'El número de faltas' end || ' no es un número.';
      else
        v_num := (v_valor)::numeric;
        v_motivo := case
          when v_campo = 'nota_examen'    and v_num not between 0 and 20  then 'La nota de examen debe estar entre 0 y 20.'
          when v_campo = 'nota_practicas' and v_num not between 0 and 20  then 'La nota de prácticas debe estar entre 0 y 20.'
          when v_campo = 'participacion'  and v_num not between 0 and 10  then 'La participación debe estar entre 0 y 10.'
          when v_campo = 'asistencia'     and v_num not between 0 and 100 then 'La asistencia debe estar entre 0 y 100.'
          when v_campo = 'faltas' and (v_num < 0 or v_num <> trunc(v_num)) then 'Las faltas deben ser un número entero, 0 o más.'
        end;
      end if;
      if v_motivo is not null then
        v_errores := v_errores || jsonb_build_array(jsonb_build_object(
          'fila', v_fila.n, 'alumno_id', v_alumno, 'alumno', v_nombre, 'motivo', v_motivo));
      end if;
    end loop;
  end loop;

  if jsonb_array_length(v_errores) > 0 then
    return jsonb_build_object('guardadas', 0, 'alertas', '{}'::jsonb, 'errores', v_errores);
  end if;

  -- 3.2 Guardar (upsert)
  insert into rendimiento (alumno_id, asignatura_id, periodo, nota_examen, nota_practicas,
                           participacion, asistencia, faltas)
  select (f ->> 'alumno_id')::integer, p_asignatura, p_periodo,
         (f ->> 'nota_examen')::numeric, (f ->> 'nota_practicas')::numeric,
         (f ->> 'participacion')::numeric, (f ->> 'asistencia')::numeric,
         (f ->> 'faltas')::numeric::smallint
  from jsonb_array_elements(p_filas) f
  on conflict (alumno_id, asignatura_id, periodo) do update set
    nota_examen    = excluded.nota_examen,
    nota_practicas = excluded.nota_practicas,
    participacion  = excluded.participacion,
    asistencia     = excluded.asistencia,
    faltas         = excluded.faltas;
  get diagnostics v_guardadas = row_count;

  -- 3.3 Quitar las alertas de seguimiento anteriores de este trimestre que nadie ha tocado
  perform set_config('brujula.permitir_borrado', 'on', true);
  delete from alerta a
  where a.nivel = 'alumno' and a.clase_id = p_clase and a.asignatura_id = p_asignatura
    and a.periodo = p_periodo and a.estado = 'nueva'
    and not exists (select 1 from accion ac where ac.alerta_id = a.id);
  perform set_config('brujula.permitir_borrado', 'off', true);

  -- 3.4 Crear las nuevas comparando con el trimestre anterior del mismo alumno
  with act as (
    select r.alumno_id, r.nota_examen, r.nota_practicas, r.participacion, r.asistencia, r.faltas,
           an.nota_examen as ant_examen, an.faltas as ant_faltas
    from rendimiento r
    join alumno al on al.id = r.alumno_id and al.clase_id = p_clase
    left join rendimiento an on an.alumno_id = r.alumno_id and an.asignatura_id = r.asignatura_id
                            and an.periodo = p_periodo - 1
    where r.asignatura_id = p_asignatura and r.periodo = p_periodo
  ),
  nuevas as (
    select alumno_id, 'bajada_de_notas' as motivo,
           format('Bajada de notas en %s en el %s trimestre', v_asig, v_ord) as titulo,
           format('La nota de examen baja de %s a %s sobre 20 entre el %s y el %s trimestre.',
                  to_char(ant_examen, 'FM990.0'), to_char(nota_examen, 'FM990.0'), v_ant, v_ord) as descripcion,
           jsonb_build_array(jsonb_build_object('variable', 'nota_examen', 'valor',
             format('de %s a %s', to_char(ant_examen, 'FM990.0'), to_char(nota_examen, 'FM990.0')))) as variables
    from act where ant_examen is not null and ant_examen - nota_examen > 2
    union all
    select alumno_id, 'faltas_en_aumento',
           format('Asistencia baja en %s en el %s trimestre', v_asig, v_ord),
           format('Asistencia del %s %% en el %s trimestre (mínimo recomendado 85 %%) y más faltas que en el %s (de %s a %s).',
                  to_char(round(asistencia), 'FM990'), v_ord, v_ant, ant_faltas, faltas),
           jsonb_build_array(
             jsonb_build_object('variable', 'asistencia', 'valor', to_char(round(asistencia), 'FM990') || ' %'),
             jsonb_build_object('variable', 'faltas', 'valor', format('de %s a %s', ant_faltas, faltas)))
    from act where ant_faltas is not null and faltas > ant_faltas and asistencia < 85
    union all
    select alumno_id, 'practicas_por_debajo',
           format('Prácticas por debajo del aprobado en %s en el %s trimestre', v_asig, v_ord),
           format('Nota de prácticas de %s sobre 20 en el %s trimestre.', to_char(nota_practicas, 'FM990.0'), v_ord),
           jsonb_build_array(jsonb_build_object('variable', 'nota_practicas', 'valor', to_char(nota_practicas, 'FM990.0')))
    from act where nota_practicas < 6.5
    union all
    select alumno_id, 'baja_participacion',
           format('Participación baja en %s en el %s trimestre', v_asig, v_ord),
           format('Participación de %s sobre 10 en el %s trimestre.', to_char(participacion, 'FM990.0'), v_ord),
           jsonb_build_array(jsonb_build_object('variable', 'participacion', 'valor', to_char(participacion, 'FM990.0')))
    from act where participacion < 2
  ),
  creadas as (
    insert into alerta (nivel, escuela_id, asignatura_id, clase_id, alumno_id, motivo, severidad,
                        titulo, descripcion, variables, estado, periodo)
    select 'alumno', v_escuela, p_asignatura, p_clase, n.alumno_id, n.motivo, 'media',
           n.titulo, n.descripcion, n.variables, 'nueva', p_periodo
    from nuevas n
    where not exists (          -- no duplicar las que se conservaron (revisadas o con acciones)
      select 1 from alerta e
      where e.alumno_id = n.alumno_id and e.asignatura_id = p_asignatura
        and e.periodo = p_periodo and e.motivo = n.motivo)
    returning motivo
  )
  select coalesce(jsonb_object_agg(motivo, n), '{}'::jsonb) into v_alertas
  from (select motivo, count(*) as n from creadas group by motivo) t;

  -- 3.5 Auditoría
  insert into auditoria (tabla, operacion, registro_id, usuario, datos_antes, datos_despues)
  values ('rendimiento', 'IMPORTAR_TRIMESTRE', p_clase, auth.uid(), null,
          jsonb_build_object('profesor_id', v_profesor, 'clase_id', p_clase,
                             'asignatura_id', p_asignatura, 'periodo', p_periodo,
                             'filas_guardadas', v_guardadas, 'alertas_creadas', v_alertas));

  return jsonb_build_object('guardadas', v_guardadas, 'alertas', v_alertas, 'errores', '[]'::jsonb);
end;
$$;

revoke all on function public.importar_trimestre(integer, integer, integer, jsonb) from public, anon;
grant execute on function public.importar_trimestre(integer, integer, integer, jsonb) to authenticated;

-- ---------------------------------------------------------------------
-- 4. reiniciar_demo: deja la clase solo con el 1.º trimestre en esa asignatura
--    Uso (SQL Editor): select reiniciar_demo(<clase>, 1);
--    Borra también las acciones registradas sobre sus alertas de seguimiento (on delete cascade).
-- ---------------------------------------------------------------------
create or replace function public.reiniciar_demo(p_clase integer, p_asignatura integer)
returns jsonb language plpgsql set search_path = public as $$
declare
  v_alertas integer;
  v_filas   integer;
begin
  perform set_config('brujula.permitir_borrado', 'on', true);
  delete from alerta
  where clase_id = p_clase and asignatura_id = p_asignatura and periodo > 1;
  get diagnostics v_alertas = row_count;
  perform set_config('brujula.permitir_borrado', 'off', true);

  delete from rendimiento r
  using alumno al
  where al.id = r.alumno_id and al.clase_id = p_clase
    and r.asignatura_id = p_asignatura and r.periodo in (2, 3);
  get diagnostics v_filas = row_count;

  insert into auditoria (tabla, operacion, registro_id, usuario, datos_antes, datos_despues)
  values ('rendimiento', 'REINICIAR_DEMO', p_clase, null, null,
          jsonb_build_object('clase_id', p_clase, 'asignatura_id', p_asignatura,
                             'filas_borradas', v_filas, 'alertas_borradas', v_alertas));

  return jsonb_build_object('filas_borradas', v_filas, 'alertas_borradas', v_alertas);
end;
$$;

revoke all on function public.reiniciar_demo(integer, integer) from public, anon, authenticated;
