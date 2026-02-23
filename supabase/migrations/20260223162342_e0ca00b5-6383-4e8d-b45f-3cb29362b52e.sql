
-- Table for course/event registrations
CREATE TABLE public.course_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  course_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.course_registrations ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a registration (no auth required)
CREATE POLICY "Anyone can submit registration"
  ON public.course_registrations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated users (admins) can view registrations
CREATE POLICY "Authenticated users can view registrations"
  ON public.course_registrations FOR SELECT
  TO authenticated
  USING (true);

-- Table for contact messages
CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a contact message
CREATE POLICY "Anyone can submit contact message"
  ON public.contact_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated users (admins) can view messages
CREATE POLICY "Authenticated users can view messages"
  ON public.contact_messages FOR SELECT
  TO authenticated
  USING (true);
