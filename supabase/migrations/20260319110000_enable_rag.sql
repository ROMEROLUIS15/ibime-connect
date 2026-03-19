-- Enable the pgvector extension for vector similarity search
create extension if not exists vector with schema extensions;

-- Create the knowledge_base table
create table if not exists public.knowledge_base (
  id          bigserial primary key,
  title       text,
  content     text not null,
  embedding   vector(768),   -- text-embedding-004 produces 768-dimensional vectors
  metadata    jsonb,
  created_at  timestamp with time zone default timezone('utc', now()) not null
);

-- Create index for efficient vector similarity search
create index on public.knowledge_base
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 10);

-- Only authenticated users (admins) can manage the knowledge base
alter table public.knowledge_base enable row level security;

create policy "Admins can manage knowledge_base"
  on public.knowledge_base
  for all
  to authenticated
  using (true)
  with check (true);

-- The Edge Function (service role) can read it anonymously via RPC
create policy "Service role can read knowledge_base"
  on public.knowledge_base
  for select
  to service_role
  using (true);

-- ── RPC: match_knowledge ─────────────────────────────────────────────────────
-- Returns the top-k most similar documents to a query embedding.
create or replace function public.match_knowledge (
  query_embedding vector(768),
  match_count     int default 5,
  match_threshold float default 0.5
)
returns table (
  id      bigint,
  title   text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    kb.id,
    kb.title,
    kb.content,
    1 - (kb.embedding <=> query_embedding) as similarity
  from public.knowledge_base kb
  where 1 - (kb.embedding <=> query_embedding) > match_threshold
  order by kb.embedding <=> query_embedding
  limit match_count;
$$;
