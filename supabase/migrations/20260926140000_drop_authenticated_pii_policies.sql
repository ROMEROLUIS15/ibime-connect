-- ─────────────────────────────────────────────────────────────────────────────
-- Quita a `authenticated` todo acceso a las tablas de PII (`course_registrations`
-- y `contact_messages`).
--
-- Contexto: en prod, "Allow authenticated reads from …" (SELECT, `true`) dejaba a
-- cualquier cuenta autenticada leer nombre, correo y teléfono de todas las filas,
-- y los registros de Supabase Auth estaban abiertos: cualquiera podía crearse una
-- cuenta con la anon key (que viaja en el frontend) y leerlas. Medido el
-- 2026-09-26: 0 usuarios en `auth.users` y 0 eventos en `auth.audit_log_entries`.
--
-- Nada usa Supabase Auth: el backend accede con la service_role key, que bypassa
-- RLS, y el frontend no usa el cliente de Supabase. Esto revierte la nota de
-- 20260710225726_revoke_anon_writes.sql que conservaba esas políticas "para
-- admins". Tras esta migración ambas tablas quedan con RLS activo y sin
-- políticas para `authenticated` (ni para PUBLIC).
--
-- Los nombres derivaron entre el repo y prod (ediciones por dashboard), así que
-- se eliminan por rol y no por nombre.
-- ─────────────────────────────────────────────────────────────────────────────

do $$
declare
  pol record;
begin
  for pol in
    select p.polname, p.polrelid::regclass as tabla
    from pg_policy p
    where p.polrelid in ('public.course_registrations'::regclass, 'public.contact_messages'::regclass)
      and (
        0 = any (p.polroles)  -- PUBLIC: también aplica a authenticated
        or (select oid from pg_roles where rolname = 'authenticated') = any (p.polroles)
      )
  loop
    execute format('drop policy %I on %s', pol.polname, pol.tabla);
  end loop;
end $$;
