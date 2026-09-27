-- ─────────────────────────────────────────────────────────────────────────────
-- Adopta `public.courses`, una tabla creada fuera de banda (dashboard, abril de
-- 2026) que ninguna migración del repo define. Reproduce tal cual su definición
-- de prod, medida el 2026-09-26, para que un proyecto nuevo quede igual.
--
-- En prod la tabla ya existe: todas las sentencias son idempotentes y allí no
-- cambian nada. Ningún código la usa y `course_registrations` no la referencia
-- (guarda el curso como texto en `course_name`). RLS activo y sin políticas:
-- anon y authenticated no pueden leerla ni escribirla, solo service_role. Sus
-- GRANT son los que Supabase da por defecto a las tablas de `public`.
--
-- `updated_at` tiene default now() pero ningún trigger lo actualiza: así está
-- en prod.
-- ─────────────────────────────────────────────────────────────────────────────

-- Supabase la trae activada en `extensions`; ninguna migración la creaba.
create extension if not exists "uuid-ossp" with schema extensions;

create table if not exists public.courses (
  id         uuid        not null default extensions.uuid_generate_v4(),
  title      text        not null,
  status     text        not null,
  start_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  capacity   integer     not null default 20,
  end_date   timestamptz,
  constraint courses_pkey primary key (id),
  constraint courses_status_check check (status in ('active', 'paused'))
);

create index if not exists idx_courses_start_date on public.courses (start_date);

alter table public.courses enable row level security;
