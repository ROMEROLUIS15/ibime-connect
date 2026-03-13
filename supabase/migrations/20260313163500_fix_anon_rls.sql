-- Drop the old policies
drop policy if exists "Permitir inscripciones anonimas" on public.course_registrations;
drop policy if exists "Permitir mensajes de contacto anonimos" on public.contact_messages;
drop policy if exists "Allow anonymous inserts to course_registrations" on public.course_registrations;
drop policy if exists "Allow anonymous inserts to contact_messages" on public.contact_messages;

-- Create correct policies that explicitly grant 'anon' roles the ability to insert
create policy "Enable insert for anonymous users" on public.course_registrations
  for insert to anon, authenticated
  with check (true);

create policy "Enable insert for anonymous users" on public.contact_messages
  for insert to anon, authenticated
  with check (true);
