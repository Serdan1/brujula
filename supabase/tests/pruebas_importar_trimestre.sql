-- =====================================================================
-- Brújula · Pruebas de importar_trimestre y reiniciar_demo
-- Requiere la migración 20261105120000_importar_trimestre.sql.
-- Ejecuta cada bloque POR SEPARADO en el SQL Editor (selecciónalo y Run).
-- Todos acaban en ROLLBACK: no cambian nada en la base de datos.
-- Cada bloque termina con una sola fila de resultado; la columna «resultado» debe decir OK.
-- Usuarios: profesor 1 = profesor.gp (Portugués en GP), profesor 6 = director.gp.
-- =====================================================================

-- ---------- Prueba 1: importación correcta del 2.º trimestre ----------
-- Copia el 1.º trimestre de cada alumno como 2.º, con 3 puntos menos de examen para un alumno
-- (debe crear al menos una alerta «bajada_de_notas»). Comprueba también que borrar alertas
-- «nueva» (como hace ml/publish.py) no se lleva las de seguimiento.
begin;
-- Preparación como administrador: una clase de profesor 1 en Portugués, sin 2.º ni 3.º trimestre
select set_config('prueba.clase',
       (select clase_id::text from imparte where profesor_id = 1 and asignatura_id = 1
        order by clase_id limit 1), true);
select reiniciar_demo(current_setting('prueba.clase')::int, 1);

-- Como profesor.gp
select set_config('request.jwt.claims',
       json_build_object('sub', user_id, 'role', 'authenticated')::text, true)
from profesor where id = 1;
set local role authenticated;

with p1 as (
  select r.* from rendimiento r join alumno al on al.id = r.alumno_id
  where al.clase_id = current_setting('prueba.clase')::int and r.asignatura_id = 1 and r.periodo = 1
),
baja as (select min(alumno_id) as alumno_id from p1 where nota_examen >= 3)
select set_config('prueba.resultado', importar_trimestre(
         current_setting('prueba.clase')::int, 1, 2,
         (select jsonb_agg(jsonb_build_object(
                   'alumno_id', p1.alumno_id,
                   'nota_examen', case when p1.alumno_id = baja.alumno_id then p1.nota_examen - 3 else p1.nota_examen end,
                   'nota_practicas', p1.nota_practicas, 'participacion', p1.participacion,
                   'asistencia', p1.asistencia, 'faltas', p1.faltas))
          from p1, baja))::text, true);

-- Comprobaciones como administrador
reset role;
select set_config('prueba.alertas_p2',
       (select count(*)::text from alerta
        where clase_id = current_setting('prueba.clase')::int and asignatura_id = 1 and periodo = 2), true);
delete from alerta                                     -- lo que haría ml/publish.py
where clase_id = current_setting('prueba.clase')::int and asignatura_id = 1 and estado = 'nueva';

with r as (select current_setting('prueba.resultado')::jsonb as j),
datos as (
  select (select (j ->> 'guardadas')::int from r)                       as guardadas,
         (select j -> 'alertas' from r)                                  as alertas_por_motivo,
         (select jsonb_array_length(j -> 'errores') from r)              as errores,
         (select count(*) from rendimiento x join alumno al on al.id = x.alumno_id
          where al.clase_id = current_setting('prueba.clase')::int
            and x.asignatura_id = 1 and x.periodo = 1)                   as alumnos_clase,
         (select count(*) from rendimiento x join alumno al on al.id = x.alumno_id
          where al.clase_id = current_setting('prueba.clase')::int
            and x.asignatura_id = 1 and x.periodo = 2)                   as filas_periodo_2,
         current_setting('prueba.alertas_p2')::int                       as alertas_periodo_2,
         (select count(*) from alerta
          where clase_id = current_setting('prueba.clase')::int and asignatura_id = 1
            and periodo = 2)                                             as alertas_tras_borrado,
         (select count(*) from alerta
          where clase_id = current_setting('prueba.clase')::int and asignatura_id = 1
            and periodo = 2 and motivo = 'bajada_de_notas')              as bajadas,
         (select operacion from auditoria order by id desc limit 1)      as ultima_auditoria
)
select case when guardadas = alumnos_clase and errores = 0 and filas_periodo_2 = alumnos_clase
             and bajadas >= 1 and alertas_tras_borrado = alertas_periodo_2
             and ultima_auditoria = 'IMPORTAR_TRIMESTRE'
            then 'OK' else 'FALLO' end as resultado, *
from datos;
rollback;

-- ---------- Prueba 2: importación con errores (no guarda nada) ----------
-- Fila 1: nota de examen 25. Fila 2: sin asistencia. Fila 3: alumno de otra clase. Fila 4: correcta.
begin;
select set_config('prueba.clase',
       (select clase_id::text from imparte where profesor_id = 1 and asignatura_id = 1
        order by clase_id limit 1), true);
select reiniciar_demo(current_setting('prueba.clase')::int, 1);
select set_config('prueba.alumnos',
       (select string_agg(id::text, ',' order by id) from (
          select id from alumno where clase_id = current_setting('prueba.clase')::int
          order by id limit 3) a), true);
select set_config('prueba.otro_alumno',
       (select min(id)::text from alumno where clase_id <> current_setting('prueba.clase')::int), true);

select set_config('request.jwt.claims',
       json_build_object('sub', user_id, 'role', 'authenticated')::text, true)
from profesor where id = 1;
set local role authenticated;

with a as (select string_to_array(current_setting('prueba.alumnos'), ',')::int[] as ids)
select set_config('prueba.resultado', importar_trimestre(
         current_setting('prueba.clase')::int, 1, 2,
         jsonb_build_array(
           jsonb_build_object('alumno_id', ids[1], 'nota_examen', 25, 'nota_practicas', 12,
                              'participacion', 5, 'asistencia', 90, 'faltas', 2),
           jsonb_build_object('alumno_id', ids[2], 'nota_examen', 11, 'nota_practicas', 12,
                              'participacion', 5, 'faltas', 2),
           jsonb_build_object('alumno_id', current_setting('prueba.otro_alumno')::int, 'nota_examen', 11,
                              'nota_practicas', 12, 'participacion', 5, 'asistencia', 90, 'faltas', 2),
           jsonb_build_object('alumno_id', ids[3], 'nota_examen', 11, 'nota_practicas', 12,
                              'participacion', 5, 'asistencia', 90, 'faltas', 2)))::text, true)
from a;

reset role;
with r as (select current_setting('prueba.resultado')::jsonb as j),
datos as (
  select (select (j ->> 'guardadas')::int from r)          as guardadas,
         (select jsonb_array_length(j -> 'errores') from r) as errores,
         (select j -> 'errores' from r)                     as detalle_errores,
         (select count(*) from rendimiento x join alumno al on al.id = x.alumno_id
          where al.clase_id = current_setting('prueba.clase')::int
            and x.asignatura_id = 1 and x.periodo = 2)      as filas_periodo_2
)
select case when guardadas = 0 and errores = 3 and filas_periodo_2 = 0
            then 'OK' else 'FALLO' end as resultado, *
from datos;
rollback;

-- ---------- Prueba 3: un profesor no puede importar en una clase que no imparte ----------
begin;
select set_config('prueba.clase',
       (select min(c.id)::text from clase c
        where not exists (select 1 from imparte i
                          where i.clase_id = c.id and i.asignatura_id = 1 and i.profesor_id = 1)), true);
select set_config('prueba.alumno',
       (select min(id)::text from alumno where clase_id = current_setting('prueba.clase')::int), true);
select set_config('prueba.resultado', 'FALLO: no se ejecutó la prueba', true);

select set_config('request.jwt.claims',
       json_build_object('sub', user_id, 'role', 'authenticated')::text, true)
from profesor where id = 1;
set local role authenticated;

do $$
begin
  perform importar_trimestre(current_setting('prueba.clase')::int, 1, 2,
    jsonb_build_array(jsonb_build_object('alumno_id', current_setting('prueba.alumno')::int,
      'nota_examen', 11, 'nota_practicas', 12, 'participacion', 5, 'asistencia', 90, 'faltas', 2)));
  perform set_config('prueba.resultado', 'FALLO: dejó importar', true);
exception when insufficient_privilege then
  perform set_config('prueba.resultado', 'OK', true);
  perform set_config('prueba.mensaje', sqlerrm, true);
end;
$$;

select current_setting('prueba.resultado') as resultado,
       current_setting('prueba.clase') as clase_ajena,
       current_setting('prueba.mensaje', true) as mensaje;
rollback;

-- ---------- Prueba 4: un director no puede importar (ni en su escuela) ----------
begin;
select set_config('prueba.clase',
       (select clase_id::text from imparte where profesor_id = 1 and asignatura_id = 1
        order by clase_id limit 1), true);
select set_config('prueba.alumno',
       (select min(id)::text from alumno where clase_id = current_setting('prueba.clase')::int), true);
select set_config('prueba.resultado', 'FALLO: no se ejecutó la prueba', true);

select set_config('request.jwt.claims',
       json_build_object('sub', user_id, 'role', 'authenticated')::text, true)
from profesor where id = 6;
set local role authenticated;

do $$
begin
  perform importar_trimestre(current_setting('prueba.clase')::int, 1, 2,
    jsonb_build_array(jsonb_build_object('alumno_id', current_setting('prueba.alumno')::int,
      'nota_examen', 11, 'nota_practicas', 12, 'participacion', 5, 'asistencia', 90, 'faltas', 2)));
  perform set_config('prueba.resultado', 'FALLO: dejó importar a un director', true);
exception when insufficient_privilege then
  perform set_config('prueba.resultado', 'OK', true);
  perform set_config('prueba.mensaje', sqlerrm, true);
end;
$$;

select current_setting('prueba.resultado') as resultado,
       current_setting('prueba.mensaje', true) as mensaje;
rollback;

-- ---------- Prueba 5: sin sesión (anon) no puede ejecutar ninguna de las dos funciones ----------
begin;
set local role anon;
select has_function_privilege('anon', 'public.importar_trimestre(integer, integer, integer, jsonb)', 'execute') as anon_importar,
       has_function_privilege('anon', 'public.reiniciar_demo(integer, integer)', 'execute')                        as anon_reiniciar,
       has_function_privilege('authenticated', 'public.reiniciar_demo(integer, integer)', 'execute')               as authenticated_reiniciar,
       case when not has_function_privilege('anon', 'public.importar_trimestre(integer, integer, integer, jsonb)', 'execute')
             and not has_function_privilege('anon', 'public.reiniciar_demo(integer, integer)', 'execute')
             and not has_function_privilege('authenticated', 'public.reiniciar_demo(integer, integer)', 'execute')
            then 'OK' else 'FALLO' end as resultado;
rollback;
