-- =====================================================================
-- Brújula · Migración 2 · Seguridad (RLS), vistas del director y auditoría
-- Autor: Aarón · 4 nov 2026
--
-- Reglas:
--   · Profesor: ve solo las clases que imparte y, dentro de ellas,
--     solo los datos de SUS asignaturas.
--   · Director: ve los datos de su escuela.
--   · Sin sesión (anon): no ve nada.
--   · La clave de servicio (pipeline de Daniel, load.py) se salta el RLS.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Funciones auxiliares (security definer para evitar bucles de RLS)
-- ---------------------------------------------------------------------

create or replace function public.mi_profesor_id()
returns integer language sql stable security definer set search_path = public as $$
  select id from profesor where user_id = auth.uid()
$$;

create or replace function public.mi_escuela_id()
returns integer language sql stable security definer set search_path = public as $$
  select escuela_id from profesor where user_id = auth.uid()
$$;

create or replace function public.soy_director()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select rol = 'director' from profesor where user_id = auth.uid()), false)
$$;

-- ¿Puedo ver esta clase? (la imparto, o soy director de su escuela)
create or replace function public.puede_ver_clase(p_clase integer)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from imparte
                 where clase_id = p_clase and profesor_id = mi_profesor_id())
      or (soy_director() and exists (select 1 from clase
                                     where id = p_clase and escuela_id = mi_escuela_id()))
$$;

-- ¿Puedo ver esta asignatura en esta clase?
create or replace function public.puede_ver_clase_asig(p_clase integer, p_asig integer)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from imparte
                 where clase_id = p_clase and asignatura_id = p_asig
                   and profesor_id = mi_profesor_id())
      or (soy_director() and exists (select 1 from clase
                                     where id = p_clase and escuela_id = mi_escuela_id()))
$$;

-- ¿Puedo ver los datos de este alumno en esta asignatura?
create or replace function public.puede_ver_alumno_asig(p_alumno integer, p_asig integer)
returns boolean language sql stable security definer set search_path = public as $$
  select puede_ver_clase_asig((select clase_id from alumno where id = p_alumno), p_asig)
$$;

-- ¿Puedo ver esta asignatura a nivel de escuela? (alertas de nivel «asignatura»)
create or replace function public.puede_ver_asig_escuela(p_escuela integer, p_asig integer)
returns boolean language sql stable security definer set search_path = public as $$
  select p_escuela = mi_escuela_id()
     and (soy_director() or exists (
           select 1 from imparte i join clase c on c.id = i.clase_id
           where i.profesor_id = mi_profesor_id()
             and i.asignatura_id = p_asig and c.escuela_id = p_escuela))
$$;

-- ---------------------------------------------------------------------
-- 2. Activar RLS en todas las tablas
-- ---------------------------------------------------------------------

alter table escuela         enable row level security;
alter table asignatura      enable row level security;
alter table profesor        enable row level security;
alter table clase           enable row level security;
alter table imparte         enable row level security;
alter table alumno          enable row level security;
alter table rendimiento     enable row level security;
alter table contexto_alumno enable row level security;
alter table prediccion      enable row level security;
alter table explicacion     enable row level security;
alter table alerta          enable row level security;
alter table analisis_clase  enable row level security;
alter table accion          enable row level security;
alter table auditoria       enable row level security;   -- sin políticas: solo clave de servicio

-- ---------------------------------------------------------------------
-- 3. Políticas de lectura (solo usuarios con sesión)
-- ---------------------------------------------------------------------

create policy "leer escuelas" on escuela
  for select to authenticated using (true);

create policy "leer asignaturas" on asignatura
  for select to authenticated using (true);

create policy "leer profesores de mi escuela" on profesor
  for select to authenticated
  using (user_id = auth.uid() or escuela_id = mi_escuela_id());

create policy "leer clases visibles" on clase
  for select to authenticated using (puede_ver_clase(id));

create policy "leer imparte de clases visibles" on imparte
  for select to authenticated using (puede_ver_clase(clase_id));

create policy "leer alumnos de clases visibles" on alumno
  for select to authenticated using (puede_ver_clase(clase_id));

create policy "leer rendimiento visible" on rendimiento
  for select to authenticated using (puede_ver_alumno_asig(alumno_id, asignatura_id));

create policy "leer contexto visible" on contexto_alumno
  for select to authenticated using (puede_ver_alumno_asig(alumno_id, asignatura_id));

create policy "leer predicciones visibles" on prediccion
  for select to authenticated using (puede_ver_alumno_asig(alumno_id, asignatura_id));

create policy "leer explicaciones visibles" on explicacion
  for select to authenticated
  using (case when alumno_id is not null
              then puede_ver_alumno_asig(alumno_id, asignatura_id)
              else puede_ver_clase_asig(clase_id, asignatura_id) end);

create policy "leer analisis visible" on analisis_clase
  for select to authenticated using (puede_ver_clase_asig(clase_id, asignatura_id));

create policy "leer alertas visibles" on alerta
  for select to authenticated
  using (case when nivel = 'asignatura'
              then puede_ver_asig_escuela(escuela_id, asignatura_id)
              else puede_ver_clase_asig(clase_id, asignatura_id) end);

-- ---------------------------------------------------------------------
-- 4. Escritura desde la web (Iván)
-- ---------------------------------------------------------------------

-- Alertas: solo se puede cambiar el estado y el motivo de descarte
create policy "revisar alertas visibles" on alerta
  for update to authenticated
  using (case when nivel = 'asignatura'
              then puede_ver_asig_escuela(escuela_id, asignatura_id)
              else puede_ver_clase_asig(clase_id, asignatura_id) end)
  with check (case when nivel = 'asignatura'
              then puede_ver_asig_escuela(escuela_id, asignatura_id)
              else puede_ver_clase_asig(clase_id, asignatura_id) end);

revoke update on alerta from authenticated;
grant update (estado, motivo_descarte) on alerta to authenticated;

-- Acciones: cada profesor ve y edita las suyas; el director ve las de su escuela
create policy "leer acciones" on accion
  for select to authenticated
  using (profesor_id = mi_profesor_id()
         or (soy_director() and exists (select 1 from profesor p
                                        where p.id = accion.profesor_id
                                          and p.escuela_id = mi_escuela_id())));

create policy "crear acciones propias" on accion
  for insert to authenticated
  with check (profesor_id = mi_profesor_id()
              and exists (select 1 from alerta a where a.id = alerta_id));  -- solo sobre alertas visibles

create policy "editar acciones propias" on accion
  for update to authenticated
  using (profesor_id = mi_profesor_id())
  with check (profesor_id = mi_profesor_id());

-- ---------------------------------------------------------------------
-- 5. Vistas agregadas para el director (ocultan grupos de menos de 5)
--    security_invoker: cada usuario solo agrega lo que su RLS le deja ver
-- ---------------------------------------------------------------------

create or replace view v_clase_resumen with (security_invoker = true) as
select
  c.escuela_id,
  c.id      as clase_id,
  c.curso,
  c.letra,
  r.asignatura_id,
  r.periodo,
  count(distinct r.alumno_id)          as n_alumnos,
  round(avg(r.nota_examen), 2)         as media_examen,
  round(avg(r.nota_practicas), 2)      as media_practicas,
  round(avg(r.participacion), 2)       as media_participacion,
  round(avg(r.asistencia), 2)          as media_asistencia,
  (select count(*) from alerta a
    where a.clase_id = c.id and a.asignatura_id = r.asignatura_id
      and a.nivel = 'alumno' and a.estado <> 'descartada') as alertas_activas
from rendimiento r
join alumno al on al.id = r.alumno_id
join clase  c  on c.id  = al.clase_id
group by c.escuela_id, c.id, c.curso, c.letra, r.asignatura_id, r.periodo
having count(distinct r.alumno_id) >= 5;

create or replace view v_asignatura_resumen with (security_invoker = true) as
select
  c.escuela_id,
  r.asignatura_id,
  r.periodo,
  count(distinct c.id)                 as n_clases,
  count(distinct r.alumno_id)          as n_alumnos,
  round(avg(r.nota_examen), 2)         as media_examen,
  round(avg(r.nota_practicas), 2)      as media_practicas,
  round(avg(r.participacion), 2)       as media_participacion,
  round(avg(r.asistencia), 2)          as media_asistencia,
  (select count(*) from alerta a
    where a.escuela_id = c.escuela_id and a.asignatura_id = r.asignatura_id
      and a.nivel = 'alumno' and a.estado <> 'descartada') as alertas_activas
from rendimiento r
join alumno al on al.id = r.alumno_id
join clase  c  on c.id  = al.clase_id
group by c.escuela_id, r.asignatura_id, r.periodo
having count(distinct r.alumno_id) >= 5;

revoke all on v_clase_resumen, v_asignatura_resumen from anon;
grant select on v_clase_resumen, v_asignatura_resumen to authenticated;

-- ---------------------------------------------------------------------
-- 6. Auditoría: acciones y cambios de estado de alertas
-- ---------------------------------------------------------------------

create or replace function public.registrar_auditoria()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into auditoria (tabla, operacion, registro_id, usuario, datos_antes, datos_despues)
  values (
    tg_table_name,
    tg_op,
    coalesce((to_jsonb(new) ->> 'id')::bigint, (to_jsonb(old) ->> 'id')::bigint),
    auth.uid(),
    case when tg_op <> 'INSERT' then to_jsonb(old) end,
    case when tg_op <> 'DELETE' then to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

create trigger auditar_accion
  after insert or update or delete on accion
  for each row execute function registrar_auditoria();

create trigger auditar_estado_alerta
  after update of estado, motivo_descarte on alerta
  for each row
  when (old.estado is distinct from new.estado
        or old.motivo_descarte is distinct from new.motivo_descarte)
  execute function registrar_auditoria();
