create or replace function public.eliminar_accion_y_reabrir(p_accion_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_alerta_id bigint;
  v_profesor_id integer;
begin
  select alerta_id, profesor_id
    into v_alerta_id, v_profesor_id
    from public.accion
    where id = p_accion_id
    for update;

  if not found then
    raise exception 'No existe la acción solicitada.'
      using errcode = 'P0002';
  end if;

  if v_profesor_id is distinct from public.mi_profesor_id() then
    raise exception 'Solo puedes eliminar tus propias acciones.'
      using errcode = '42501';
  end if;

  delete from public.accion where id = p_accion_id;

  if not exists (
    select 1
      from public.accion
      where alerta_id = v_alerta_id
  ) then
    update public.alerta
      set estado = 'nueva',
          motivo_descarte = null
      where id = v_alerta_id;
  end if;
end;
$$;

revoke all on function public.eliminar_accion_y_reabrir(bigint) from public, anon;
grant execute on function public.eliminar_accion_y_reabrir(bigint) to authenticated;
