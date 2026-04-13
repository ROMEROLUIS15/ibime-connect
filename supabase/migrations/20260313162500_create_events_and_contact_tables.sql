-- NOTE: Esta migración fue originalmente duplicada con 20260223162342.
-- Se ha reemplazado por un script idempotente que asegura que las tablas
-- existen con las políticas correctas. La migración original 20260223162342
-- ya crea las tablas; esta migración ahora solo se encarga de aplicar
-- políticas si no existen y agregar índices faltantes.

-- ── Índices para course_registrations (faltaban en la migración original)
CREATE INDEX IF NOT EXISTS idx_course_registrations_email
  ON public.course_registrations (email);

CREATE INDEX IF NOT EXISTS idx_course_registrations_course_name
  ON public.course_registrations (course_name);

CREATE INDEX IF NOT EXISTS idx_course_registrations_created_at
  ON public.course_registrations (created_at DESC);

-- ── Índices para contact_messages (faltaban en la migración original)
CREATE INDEX IF NOT EXISTS idx_contact_messages_email
  ON public.contact_messages (email);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at
  ON public.contact_messages (created_at DESC);

-- ── Constraint de formato de email (solo si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'course_registrations_email_format'
  ) THEN
    ALTER TABLE public.course_registrations
      ADD CONSTRAINT course_registrations_email_format
      CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contact_messages_email_format'
  ) THEN
    ALTER TABLE public.contact_messages
      ADD CONSTRAINT contact_messages_email_format
      CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
  END IF;
END $$;
