-- ─────────────────────────────────────────────────────────────────────────────
-- RAG-01 (docs/AUDITORIA_RAG.md): elimina el índice ivfflat de knowledge_base.
--
-- El índice se creó en 20260319110000_enable_rag.sql con `lists = 10` sobre la
-- tabla vacía y nunca se reconstruyó. ivfflat fija sus centroides al crearse:
-- con 6 filas quedaron 8 de 10 listas sin documentos y, como pgvector sondea una
-- sola lista por consulta (`ivfflat.probes = 1`), match_knowledge devolvía entre
-- 0 y 5 de las 6 filas —con frecuencia ninguna— aunque el documento correcto
-- superara el umbral.
--
-- A este volumen el escaneo secuencial es instantáneo y exacto (recall 100 %).
-- match_knowledge no cambia: su ORDER BY por distancia coseno funciona igual
-- sin índice.
--
-- Cuando knowledge_base supere ~1.000 filas, reintroducir un índice HNSW (no
-- depende de entrenamiento previo ni de `probes`) en una migración nueva:
--   create index on public.knowledge_base
--     using hnsw (embedding extensions.vector_cosine_ops);
-- ─────────────────────────────────────────────────────────────────────────────

-- Nombre que Postgres asigna al índice sin nombre explícito: <tabla>_<columna>_idx.
drop index if exists public.knowledge_base_embedding_idx;

-- El esquema de prod ya derivó antes por ediciones desde el dashboard (ver
-- README.md). Si quedara un ivfflat sobre knowledge_base con otro nombre, la
-- migración falla en vez de darse por aplicada con la recuperación aún rota.
do $$
begin
  if exists (
    select 1
    from pg_index i
    join pg_class t      on t.oid = i.indrelid
    join pg_namespace n  on n.oid = t.relnamespace
    join pg_class ix     on ix.oid = i.indexrelid
    join pg_am am        on am.oid = ix.relam
    where n.nspname = 'public'
      and t.relname = 'knowledge_base'
      and am.amname = 'ivfflat'
  ) then
    raise exception 'RAG-01: sigue existiendo un índice ivfflat sobre public.knowledge_base';
  end if;
end $$;
