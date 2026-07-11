-- ─────────────────────────────────────────────────────────────────────────────
-- Revoca las escrituras ANÓNIMAS sobre las tablas de PII.
--
-- Contexto: la publishable key (anon) viaja en el bundle del frontend, es pública.
-- Con la política `anon INSERT ... with check (true)` cualquiera podía escribir
-- directamente en `course_registrations` y `contact_messages` saltándose la
-- validación Zod y el rate-limiting del backend (vector de spam / PII-flooding).
--
-- El frontend ya NO escribe directo: contact.service.ts y events.service.ts
-- envían todo al backend vía apiFetch. El backend usa la service_role key, que
-- bypassa RLS, así que los INSERT legítimos siguen funcionando sin esta política.
--
-- Tras esta migración `anon` queda SIN políticas de escritura → sin acceso.
-- Se conservan las políticas SELECT/UPDATE/DELETE para `authenticated` (admins).
-- ─────────────────────────────────────────────────────────────────────────────

-- course_registrations: eliminar cualquier política de INSERT para anon
drop policy if exists "Enable insert for anonymous users" on public.course_registrations;
drop policy if exists "Anyone can submit registration"    on public.course_registrations;
drop policy if exists "Permitir inscripciones anonimas"   on public.course_registrations;
drop policy if exists "Allow anonymous inserts to course_registrations" on public.course_registrations;

-- contact_messages: eliminar cualquier política de INSERT para anon
drop policy if exists "Enable insert for anonymous users"  on public.contact_messages;
drop policy if exists "Anyone can submit contact message"  on public.contact_messages;
drop policy if exists "Permitir mensajes de contacto anonimos" on public.contact_messages;
drop policy if exists "Allow anonymous inserts to contact_messages" on public.contact_messages;

-- Nota: RLS sigue habilitado en ambas tablas (ENABLE ROW LEVEL SECURITY se aplicó
-- en migraciones previas). Sin políticas para `anon`, el rol anónimo no puede
-- INSERT/SELECT/UPDATE/DELETE. El backend (service_role) no se ve afectado.
