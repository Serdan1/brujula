-- Lectura de los informes PDF del bucket privado «informes».
-- Un profesor ve los informes de las clases y asignaturas que imparte; un director, los de su escuela.
-- Reutiliza las funciones de permisos de 20261104090000_rls_vistas_auditoria.sql.
-- Rutas: clases/{clase_id}/asignatura_{asignatura_id}/periodo_{n}.pdf y centros/{escuela_id}/periodo_{n}.pdf

drop policy if exists "leer informes visibles" on storage.objects;

create policy "leer informes visibles"
on storage.objects for select to authenticated
using (
  bucket_id = 'informes' and
  case
    when name ~ '^clases/[0-9]+/asignatura_[0-9]+/' then
      public.puede_ver_clase_asig(
        split_part(name, '/', 2)::integer,
        substring(split_part(name, '/', 3) from 12)::integer
      )
    when name ~ '^centros/[0-9]+/' then
      public.soy_director() and split_part(name, '/', 2)::integer = public.mi_escuela_id()
    else false
  end
);
