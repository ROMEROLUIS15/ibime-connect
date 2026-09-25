-- ─────────────────────────────────────────────────────────────────────────────
-- RAG-10 (docs/AUDITORIA_RAG.md): limpia el esquema de conocimiento legado de la
-- etapa OpenAI y quita a `anon` el EXECUTE sobre match_knowledge.
--
-- `ibime_knowledge` (vector 1536, OpenAI) y `match_ibime_knowledge` vienen de
-- 20260320_ibime_knowledge_setup.sql. El backend actual usa `knowledge_base`
-- (vector 768, Gemini) + `match_knowledge` y no los consume. La auditoría midió
-- la tabla con 0 filas en prod, más un índice ivfflat `lists = 50` creado fuera
-- de banda, y el RPC con EXECUTE concedido a `anon`.
--
-- `match_knowledge` también es ejecutable por `anon`. Hoy es inocuo (RLS no le
-- concede SELECT sobre knowledge_base y la función es security invoker), pero es
-- superficie innecesaria: el backend lo llama con service_role.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Guarda: esta migración no borra datos. Si la tabla legada tuviera filas,
--    falla para revisarlas antes. (EXECUTE dinámico: el SELECT se planifica
--    solo si la tabla existe.)
do $$
declare
  has_rows boolean;
begin
  if to_regclass('public.ibime_knowledge') is not null then
    execute 'select exists (select 1 from public.ibime_knowledge)' into has_rows;
    if has_rows then
      raise exception 'RAG-10: public.ibime_knowledge tiene filas; revisarlas antes de eliminar la tabla';
    end if;
  end if;
end $$;

-- 2. RPC legado: se eliminan todas sus sobrecargas (la migración original lo
--    "recrea para asegurar la firma", así que prod pudo tener firmas previas).
do $$
declare
  fn regprocedure;
begin
  for fn in
    select p.oid::regprocedure
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'match_ibime_knowledge'
  loop
    execute format('drop function %s', fn);
  end loop;
end $$;

-- 3. Tabla legada. Arrastra sus índices (incluido el ivfflat de prod), políticas
--    y trigger. Sin CASCADE: si algo más dependiera de ella, la migración falla.
--    public.set_updated_at() se conserva: es una función de trigger genérica.
drop table if exists public.ibime_knowledge;

-- 4. match_knowledge: sin EXECUTE para anon. En Supabase anon lo recibe tanto por
--    PUBLIC como por los default privileges del schema, así que se revoca de
--    ambos y se concede explícitamente a los roles que lo conservan.
revoke execute on function public.match_knowledge(extensions.vector, integer, double precision) from public, anon;
grant execute on function public.match_knowledge(extensions.vector, integer, double precision) to authenticated, service_role;
