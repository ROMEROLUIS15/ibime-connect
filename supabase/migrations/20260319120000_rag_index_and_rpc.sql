-- Fix: Add RLS and RPC for vector search.
-- We omit the vector index since Exact Nearest Neighbor is perfectly fine (and fast) for small datasets.

-- RLS policies (idempotent)
alter table public.knowledge_base enable row level security;

drop policy if exists "Admins can manage knowledge_base" on public.knowledge_base;
drop policy if exists "Authenticated users can read knowledge_base" on public.knowledge_base;
create policy "Authenticated users can read knowledge_base"
  on public.knowledge_base
  for select
  to authenticated
  using (true);

drop policy if exists "Service role can read knowledge_base" on public.knowledge_base;
create policy "Service role can read knowledge_base"
  on public.knowledge_base
  for select
  to service_role
  using (true);

-- ── RPC: match_knowledge ─────────────────────────────────────────────────────
create or replace function public.match_knowledge (
  query_embedding extensions.vector,
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
set search_path = public, extensions
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
