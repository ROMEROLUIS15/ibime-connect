-- Create table for Event Registrations
create table public.course_registrations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  phone text,
  course_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on Row Level Security
alter table public.course_registrations enable row level security;

-- Allow anonymous inserts (anyone can register without logging in)
create policy "Allow anonymous inserts to course_registrations"
  on public.course_registrations for insert
  with check (true);

-- Allow admins to read (requires authenticated user, can adjust later)
create policy "Allow authenticated reads from course_registrations"
  on public.course_registrations for select
  to authenticated
  using (true);

-- Create table for Contact Messages
create table public.contact_messages (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on Row Level Security
alter table public.contact_messages enable row level security;

-- Allow anonymous inserts (anyone can send a message without logging in)
create policy "Allow anonymous inserts to contact_messages"
  on public.contact_messages for insert
  with check (true);

-- Allow admins to read
create policy "Allow authenticated reads from contact_messages"
  on public.contact_messages for select
  to authenticated
  using (true);
