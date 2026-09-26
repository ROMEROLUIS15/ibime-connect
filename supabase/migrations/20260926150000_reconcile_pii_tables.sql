-- ─────────────────────────────────────────────────────────────────────────────
-- Reconcilia `course_registrations` y `contact_messages` entre el repo y prod,
-- sin cambiar la conducta de prod.
--
-- Causa de la deriva: 20260223162342 y 20260313162500 se editaron después de
-- aplicarse (el segundo en 2026-04-13), y prod conserva en
-- `supabase_migrations.schema_migrations` el SQL original. Además
-- `registration_status` se agregó en prod fuera de banda. Diferencias medidas el
-- 2026-09-26 (catálogo de prod vs. todas las migraciones del repo en local):
--
--   | Elemento                                 | Repo           | Prod                        |
--   | `registration_status` + CHECK            | no             | sí                          |
--   | 5 índices `idx_*`                        | sí             | no                          |
--   | CHECK `*_email_format`                   | sí             | no                          |
--   | default de `created_at`                  | now()          | timezone('utc', now())      |
--
-- Resultado de esta migración, igual en prod y en un entorno nuevo:
--   1. `registration_status` adoptada tal cual (en prod ya existe).
--   2. Los 5 índices del repo, creados en prod (tablas pequeñas, sin efecto
--      visible).
--   3. `created_at` con default now(). En prod equivale al anterior porque la
--      sesión corre en UTC; now() es el correcto para timestamptz.
--   4. Sin CHECK de formato de email (en prod nunca existieron). El regex del
--      repo rechaza correos que el backend acepta con Zod, como o'brien@gmail.com;
--      la validación queda en el backend.
-- Las políticas ya quedaron alineadas en 20260926140000 (ninguna para
-- authenticated).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. registration_status (nada del código la usa; todas las filas de prod son
--    'confirmed').
alter table public.course_registrations
  add column if not exists registration_status text default 'confirmed';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'course_registrations_registration_status_check'
      and conrelid = 'public.course_registrations'::regclass
  ) then
    alter table public.course_registrations
      add constraint course_registrations_registration_status_check
      check (registration_status in ('confirmed', 'waitlist'));
  end if;
end $$;

-- 2. Índices que 20260313162500 (versión editada) agrega y prod nunca recibió.
create index if not exists idx_course_registrations_email
  on public.course_registrations (email);
create index if not exists idx_course_registrations_course_name
  on public.course_registrations (course_name);
create index if not exists idx_course_registrations_created_at
  on public.course_registrations (created_at desc);
create index if not exists idx_contact_messages_email
  on public.contact_messages (email);
create index if not exists idx_contact_messages_created_at
  on public.contact_messages (created_at desc);

-- 3. Default de created_at.
alter table public.course_registrations alter column created_at set default now();
alter table public.contact_messages     alter column created_at set default now();

-- 4. CHECK de formato de email: solo existen en entornos creados desde el repo.
alter table public.course_registrations drop constraint if exists course_registrations_email_format;
alter table public.contact_messages     drop constraint if exists contact_messages_email_format;
