-- Permite que cada profesor elimine sus propias acciones desde "Próximas revisiones".
grant delete on accion to authenticated;

create policy "eliminar acciones propias" on accion
  for delete to authenticated
  using (profesor_id = mi_profesor_id());
