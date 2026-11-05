-- Los cursos pasan de 10.º, 11.º y 12.º (secundaria portuguesa del dataset original)
-- a 4.º, 5.º y 6.º de Primaria. Es solo una etiqueta: el modelo no usa el curso.
-- La web y los informes escriben el nombre como «4.º Primaria A».

begin;

update clase set curso = curso - 6 where curso between 10 and 12;

-- Títulos de alertas de grupo ya publicadas por ml/alerts.py con el formato antiguo («10ºA: el 30 % ...»)
update alerta set titulo = regexp_replace(titulo, '^10º([A-J])', '4.º Primaria \1') where titulo ~ '^10º[A-J]';
update alerta set titulo = regexp_replace(titulo, '^11º([A-J])', '5.º Primaria \1') where titulo ~ '^11º[A-J]';
update alerta set titulo = regexp_replace(titulo, '^12º([A-J])', '6.º Primaria \1') where titulo ~ '^12º[A-J]';

commit;
