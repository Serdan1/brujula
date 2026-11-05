-- Comprobación retrospectiva de las alertas tempranas, por clase y asignatura.
--   avisados          : alumnos con alerta «riesgo_de_suspenso» (cualquier estado: lo que cuenta es que el sistema avisó)
--   necesitaron_apoyo : alumnos con nota de examen del periodo 3 por debajo de 10 (incluye abandonos, nota 0)
--   aciertos          : avisados que acabaron necesitando apoyo (= necesitaron apoyo y fueron avisados a tiempo)
-- Respeta el RLS (security_invoker), oculta grupos de menos de 5 y nunca devuelve alumnos individuales.

create or replace view v_aciertos_alertas with (security_invoker = true) as
with alumnos as (
  select al.id as alumno_id, al.clase_id, c.escuela_id, r.asignatura_id,
         (r.nota_examen < 10) as necesito_apoyo
  from rendimiento r
  join alumno al on al.id = r.alumno_id
  join clase  c  on c.id  = al.clase_id
  where r.periodo = 3
),
avisados as (
  select distinct alumno_id, asignatura_id
  from alerta
  where nivel = 'alumno' and motivo = 'riesgo_de_suspenso'
)
select
  a.escuela_id,
  a.clase_id,
  a.asignatura_id,
  count(*)                                                            as n_alumnos,
  count(v.alumno_id)                                                  as avisados,
  count(*) filter (where a.necesito_apoyo)                            as necesitaron_apoyo,
  count(*) filter (where a.necesito_apoyo and v.alumno_id is not null) as aciertos
from alumnos a
left join avisados v on v.alumno_id = a.alumno_id and v.asignatura_id = a.asignatura_id
group by a.escuela_id, a.clase_id, a.asignatura_id
having count(*) >= 5;

revoke all on v_aciertos_alertas from anon;
grant select on v_aciertos_alertas to authenticated;
