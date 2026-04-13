
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

-- Admins can update registrations (e.g. corrections)
CREATE POLICY "Admins can update registrations"
  ON public.course_registrations FOR UPDATE
  TO authenticated
  USING (true);

-- Admins can delete registrations
CREATE POLICY "Admins can delete registrations"
  ON public.course_registrations FOR DELETE
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

-- Admins can update messages (e.g. mark as resolved)
CREATE POLICY "Admins can update messages"
  ON public.contact_messages FOR UPDATE
  TO authenticated
  USING (true);

-- Admins can delete messages
CREATE POLICY "Admins can delete messages"
  ON public.contact_messages FOR DELETE
  TO authenticated
  USING (true);
