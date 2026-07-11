# Estado de las migraciones (reconciliación repo ↔ producción)

> Última reconciliación: 2026-07-10. Proyecto Supabase: `pcfohplpomrsqflwsyah`.

Durante una auditoría se detectó que el repo y la base de datos de producción
habían **derivado**: había cambios aplicados por el dashboard que nunca volvieron
al repositorio, y una migración aplicada que no existía como archivo. Este
documento deja constancia del estado real y de lo que aún falta por sanear.

## Historial en producción (`supabase_migrations.schema_migrations`)

| version | name | en el repo |
|---|---|---|
| 20260223162342 | (create tables) | ✅ |
| 20260313162500 | create_events_and_contact_tables | ✅ |
| 20260313163500 | fix_anon_rls | ✅ |
| 20260319110000 | enable_rag | ✅ |
| 20260319120000 | rag_index_and_rpc | ✅ |
| 20260320 | ibime_knowledge_setup | ✅ (recuperada en esta reconciliación) |
| 20260710225726 | revoke_anon_writes | ✅ |
| 20260710225735 | unique_registration_email_course | ✅ |

## Deriva detectada y resuelta

- **`20260320_ibime_knowledge_setup` no estaba en el repo.** Se re-materializó el
  archivo a partir del SQL registrado en prod. Ahora el historial del repo es
  completo.
- **Los archivos `revoke_anon_writes` y `unique_registration_email_course`** se
  aplicaron vía MCP y quedaron registrados con versión `20260710225726/225735`.
  Los archivos del repo se **renombraron** a esas versiones para que un
  `supabase db push` no intente re-aplicarlos.
- **Políticas RLS de escritura anónima:** en prod tenían nombres
  (`"Allow anonymous inserts to …"`, rol `public`) que **no** correspondían a lo
  que producían las migraciones del repo (`fix_anon_rls` crea
  `"Enable insert for anonymous users"`). Es decir, hubo ediciones manuales por
  dashboard. La migración `revoke_anon_writes` elimina **todas** las variantes de
  nombre, así que el estado quedó determinista de nuevo (sin políticas de INSERT).

## Deuda conocida (requiere CLI, no cubierto aquí)

- **Dos tablas de conocimiento coexisten en prod:**
  - `knowledge_base` (`vector(768)`, Gemini) + `match_knowledge` → **la que usa el
    backend actual** (ver `20260319110000_enable_rag.sql`).
  - `ibime_knowledge` (`vector(1536)`, OpenAI) + `match_ibime_knowledge` → **legado**
    de la etapa pre-Groq, sin consumidores en el código actual.

  Evaluar eliminar `ibime_knowledge` y su función en una limpieza posterior.

- **Baseline definitivo:** para garantizar que un despliegue desde cero reproduce
  exactamente prod (nombres de políticas incluidos), correr una vez:

  ```bash
  supabase db pull            # genera una migración baseline con el esquema real
  supabase migration list     # confirma repo ↔ remoto alineados
  ```

  Esto cierra la posibilidad de futuras sorpresas por ediciones fuera de banda.
