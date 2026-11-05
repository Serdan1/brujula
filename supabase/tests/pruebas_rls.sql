-- =====================================================================
-- Brújula · Pruebas de RLS y auditoría
-- Ejecuta cada bloque POR SEPARADO en el SQL Editor (selecciónalo y Run).
-- Todos acaban en ROLLBACK: no cambian nada en la base de datos.
-- =====================================================================

-- ---------- Prueba 1: profesor.gp (profesor 1, Portugués en GP) ----------
begin;
select set_config('request.jwt.claims',
       json_build_object('sub', user_id, 'role', 'authenticated')::text, true)
from profesor where id = 1;
set local role authenticated;
select 'profesor.gp' as usuario,
       (select count(*) from clase)                         as clases,
       (select count(*) from alumno)                        as alumnos,
       (select count(distinct asignatura_id) from rendimiento) as asignaturas,
       (select count(*) from rendimiento)                   as filas_rendimiento,
       (select count(distinct escuela_id) from clase)       as escuelas,
       (select count(*) from v_clase_resumen)               as filas_vista_clase;
rollback;

-- ---------- Prueba 2: profesor.ms (profesor 8, Matemáticas en MS) ----------
begin;
select set_config('request.jwt.claims',
       json_build_object('sub', user_id, 'role', 'authenticated')::text, true)
from profesor where id = 8;
set local role authenticated;
select 'profesor.ms' as usuario,
       (select count(*) from clase)                         as clases,
       (select count(*) from alumno)                        as alumnos,
       (select count(distinct asignatura_id) from rendimiento) as asignaturas,
       (select count(*) from rendimiento)                   as filas_rendimiento,
       (select count(distinct escuela_id) from clase)       as escuelas,
       (select count(*) from v_clase_resumen)               as filas_vista_clase;
rollback;

-- ---------- Prueba 3: director.gp (profesor 6) ----------
begin;
select set_config('request.jwt.claims',
       json_build_object('sub', user_id, 'role', 'authenticated')::text, true)
from profesor where id = 6;
set local role authenticated;
select 'director.gp' as usuario,
       (select count(*) from clase)                         as clases,
       (select count(*) from alumno)                        as alumnos,
       (select count(distinct asignatura_id) from rendimiento) as asignaturas,
       (select count(*) from rendimiento)                   as filas_rendimiento,
       (select count(distinct escuela_id) from clase)       as escuelas,
       (select count(*) from v_asignatura_resumen)          as filas_vista_asignatura;
rollback;

-- ---------- Prueba 4: director.ms (profesor 12) ----------
begin;
select set_config('request.jwt.claims',
       json_build_object('sub', user_id, 'role', 'authenticated')::text, true)
from profesor where id = 12;
set local role authenticated;
select 'director.ms' as usuario,
       (select count(*) from clase)                         as clases,
       (select count(*) from alumno)                        as alumnos,
       (select count(distinct asignatura_id) from rendimiento) as asignaturas,
       (select count(*) from rendimiento)                   as filas_rendimiento,
       (select count(distinct escuela_id) from clase)       as escuelas,
       (select count(*) from v_asignatura_resumen)          as filas_vista_asignatura;
rollback;

-- ---------- Prueba 5: sin sesión (anon) — todo debe salir 0 ----------
begin;
set local role anon;
select 'anon' as usuario,
       (select count(*) from clase)       as clases,
       (select count(*) from alumno)      as alumnos,
       (select count(*) from rendimiento) as filas_rendimiento;
rollback;

-- ---------- Prueba 6: auditoría (profesor.gp revisa una alerta y registra una acción) ----------
begin;
-- Alerta de prueba creada como administrador en una clase de profesor 1
insert into alerta (id, nivel, escuela_id, asignatura_id, clase_id, alumno_id, motivo,
                    severidad, titulo, descripcion)
select 999999, 'alumno', c.escuela_id, i.asignatura_id, i.clase_id, al.id,
       'faltas_en_aumento', 'media', 'Prueba', 'Alerta de prueba'
from imparte i join clase c on c.id = i.clase_id
join alumno al on al.clase_id = i.clase_id
where i.profesor_id = 1 limit 1;

select set_config('request.jwt.claims',
       json_build_object('sub', user_id, 'role', 'authenticated')::text, true)
from profesor where id = 1;
set local role authenticated;

update alerta set estado = 'revisada' where id = 999999;
insert into accion (alerta_id, profesor_id, tipo, descripcion)
values (999999, 1, 'tutoria', 'Hablar con el alumno');

reset role;
select tabla, operacion, registro_id, usuario is not null as tiene_usuario
from auditoria order by id desc limit 2;
rollback;
