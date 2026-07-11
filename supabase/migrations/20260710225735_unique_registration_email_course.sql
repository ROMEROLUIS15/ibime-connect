-- ─────────────────────────────────────────────────────────────────────────────
-- Unicidad de inscripción: un usuario no puede inscribirse dos veces al MISMO
-- curso. Sin esta constraint, findByEmail devuelve duplicados y la respuesta al
-- ciudadano infla `cantidad_cursos` con registros repetidos.
--
-- El backend normaliza el email a minúsculas (Zod .toLowerCase()) antes de
-- insertar, por lo que la constraint sobre columnas planas es suficiente para
-- los datos nuevos. Para los históricos, primero normalizamos y deduplicamos.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Normalizar emails históricos a minúsculas (los nuevos ya vienen normalizados).
update public.course_registrations
set email = lower(email)
where email <> lower(email);

-- 2. Eliminar duplicados exactos (mismo email + curso), conservando el registro
--    más antiguo. El desempate por created_at usa el id menor.
delete from public.course_registrations a
using public.course_registrations b
where a.email = b.email
  and a.course_name = b.course_name
  and (
    a.created_at > b.created_at
    or (a.created_at = b.created_at and a.id > b.id)
  );

-- 3. Constraint de unicidad. Idempotente: no falla si ya existe.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'uq_course_registrations_email_course'
  ) then
    alter table public.course_registrations
      add constraint uq_course_registrations_email_course unique (email, course_name);
  end if;
end $$;
