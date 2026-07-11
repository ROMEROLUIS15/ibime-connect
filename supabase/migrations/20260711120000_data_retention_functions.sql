-- ─────────────────────────────────────────────────────────────────────────────
-- Funciones de retención / derecho de supresión de datos personales.
--
-- ⚠️ NO se ejecutan solas. Definir una función no borra nada; solo queda
-- disponible para invocarse manualmente o desde un cron cuando la institución
-- ratifique los plazos (ver docs/DATA_RETENTION.md).
--
-- ⚠️ NO aplicada automáticamente a producción por esta auditoría. Aplicar cuando
-- se adopte la política.
--
-- Seguridad: EXECUTE revocado para `anon`/`authenticated`/`public`; solo
-- `service_role` (el backend) puede ejecutarlas. Un purgado invocable por el rol
-- anónimo sería catastrófico.
-- ─────────────────────────────────────────────────────────────────────────────

-- Purga los mensajes de contacto más antiguos que `retention_days`.
-- Devuelve el número de filas eliminadas.
create or replace function public.purge_old_contact_messages(retention_days int default 365)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  deleted_count integer;
begin
  if retention_days is null or retention_days < 0 then
    raise exception 'retention_days debe ser un entero >= 0';
  end if;

  delete from public.contact_messages
  where created_at < now() - make_interval(days => retention_days);

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

-- Derecho de supresión (ARCO): elimina TODOS los datos de una persona por correo,
-- en ambas tablas. Comparación insensible a mayúsculas. Devuelve filas borradas.
create or replace function public.purge_person_data(target_email text)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  deleted_count integer := 0;
  c integer;
begin
  if target_email is null or length(trim(target_email)) = 0 then
    raise exception 'target_email es requerido';
  end if;

  delete from public.contact_messages where lower(email) = lower(trim(target_email));
  get diagnostics c = row_count;
  deleted_count := deleted_count + c;

  delete from public.course_registrations where lower(email) = lower(trim(target_email));
  get diagnostics c = row_count;
  deleted_count := deleted_count + c;

  return deleted_count;
end;
$$;

-- Bloquear el acceso a estas funciones para cualquier rol que no sea el backend.
revoke all on function public.purge_old_contact_messages(int) from public;
revoke all on function public.purge_person_data(text) from public;
grant execute on function public.purge_old_contact_messages(int) to service_role;
grant execute on function public.purge_person_data(text) to service_role;
