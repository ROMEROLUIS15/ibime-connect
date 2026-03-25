-- supabase/migrations/[timestamp]_ibime_knowledge_setup.sql
--
-- Ensures ibime_knowledge table is ready for the RAG pipeline.
-- Run this if the table was created without the unique constraint on title.
--
-- pgvector extension (must be enabled first in Supabase Dashboard → Extensions)
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table if it doesn't exist (idempotent)
CREATE TABLE IF NOT EXISTS public.ibime_knowledge (
  id         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category   TEXT        NOT NULL CHECK (category IN ('libro','evento','tramite','horario','curso','servicio','contacto')),
  title      TEXT        NOT NULL,
  content    TEXT        NOT NULL,
  keywords   TEXT[]      NULL,
  embedding  vector(1536) NULL,  -- OpenAI text-embedding-3-small dimension
  source_url TEXT        NULL,
  is_active  BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint on title — required for upsert in seed script
ALTER TABLE public.ibime_knowledge
  DROP CONSTRAINT IF EXISTS ibime_knowledge_title_unique;
ALTER TABLE public.ibime_knowledge
  ADD CONSTRAINT ibime_knowledge_title_unique UNIQUE (title);

-- Index for pgvector cosine similarity search
CREATE INDEX IF NOT EXISTS ibime_knowledge_embedding_idx
  ON public.ibime_knowledge
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

-- Index for category filter
CREATE INDEX IF NOT EXISTS ibime_knowledge_category_idx
  ON public.ibime_knowledge (category)
  WHERE is_active = true;

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ibime_knowledge_updated_at ON public.ibime_knowledge;
CREATE TRIGGER ibime_knowledge_updated_at
  BEFORE UPDATE ON public.ibime_knowledge
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.ibime_knowledge ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active knowledge" ON public.ibime_knowledge;
CREATE POLICY "Public can read active knowledge"
  ON public.ibime_knowledge FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated can manage knowledge" ON public.ibime_knowledge;
CREATE POLICY "Authenticated can manage knowledge"
  ON public.ibime_knowledge FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- match_ibime_knowledge function (recreate to ensure correct signature)
CREATE OR REPLACE FUNCTION public.match_ibime_knowledge(
  query_embedding   vector(1536),
  match_threshold   float    DEFAULT 0.5,
  match_count       int      DEFAULT 5,
  filter_category   text     DEFAULT NULL
)
RETURNS TABLE (
  id         uuid,
  category   text,
  title      text,
  content    text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    k.id,
    k.category,
    k.title,
    k.content,
    1 - (k.embedding <=> query_embedding) AS similarity
  FROM public.ibime_knowledge k
  WHERE
    k.is_active = true
    AND (filter_category IS NULL OR k.category = filter_category)
    AND 1 - (k.embedding <=> query_embedding) > match_threshold
  ORDER BY k.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
