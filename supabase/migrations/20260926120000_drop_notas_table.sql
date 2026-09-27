-- ─────────────────────────────────────────────────────────────────────────────
-- Elimina `public.notas`, una tabla creada fuera de banda (dashboard) que ninguna
-- migración del repo define y que ningún código usa.
--
-- Estado medido en prod el 2026-09-26: 0 filas; columnas id (identity), created_at
-- y content; RLS activo pero con dos políticas para PUBLIC con condición `true`
-- ("Enable read access for all users" en SELECT y "Permitir inserción pública" en
-- INSERT), así que cualquiera con la anon key, que viaja en el frontend, podía
-- leerla y escribir en ella. Además estaba en la publicación `supabase_realtime`.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Guarda: esta migración no borra datos. Si la tabla tuviera filas (la
--    inserción era pública), falla para revisarlas antes. (EXECUTE dinámico: el
--    SELECT se planifica solo si la tabla existe.)
do $$
declare
  has_rows boolean;
begin
  if to_regclass('public.notas') is not null then
    execute 'select exists (select 1 from public.notas)' into has_rows;
    if has_rows then
      raise exception 'public.notas tiene filas; revisarlas antes de eliminar la tabla';
    end if;
  end if;
end $$;

-- 2. Arrastra sus políticas, su secuencia identity y su pertenencia a la
--    publicación `supabase_realtime`. Sin CASCADE: si algo más dependiera de
--    ella, la migración falla.
drop table if exists public.notas;
