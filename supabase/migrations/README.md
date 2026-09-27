# Estado de las migraciones (reconciliación repo ↔ producción)

> Última reconciliación: 2026-09-26. Proyecto Supabase: `pcfohplpomrsqflwsyah`.

Durante una auditoría se detectó que el repo y la base de datos de producción
habían **derivado**: había cambios aplicados por el dashboard que nunca volvieron
al repositorio, y una migración aplicada que no existía como archivo. Este
documento deja constancia del estado real y de lo que aún falta por sanear.

## Historial en producción (`supabase_migrations.schema_migrations`)

| version | name | en el repo |
|---|---|---|
| 20260223162342 | (create tables) | ✅ (archivo editado después de aplicarse, ver abajo) |
| 20260313162500 | create_events_and_contact_tables | ✅ (archivo editado después de aplicarse, ver abajo) |
| 20260313163500 | fix_anon_rls | ✅ |
| 20260319110000 | enable_rag | ✅ |
| 20260319120000 | rag_index_and_rpc | ✅ |
| 20260320 | ibime_knowledge_setup | ✅ (recuperada en la reconciliación de 2026-07-10) |
| 20260710225726 | revoke_anon_writes | ✅ |
| 20260710225735 | unique_registration_email_course | ✅ |
| 20260924120000 | drop_knowledge_base_ivfflat_index | ✅ (RAG-01) |
| 20260924180000 | drop_legacy_ibime_knowledge | ✅ (RAG-10) |

## En el repo, sin aplicar en producción

| version | Qué hace | Estado |
|---|---|---|
| 20260711120000 | data_retention_functions | **Pendiente a propósito**: se aplica cuando se ratifique `docs/DATA_RETENTION.md` |
| 20260926120000 | drop_notas_table | Por aplicar (requiere autorización) |
| 20260926130000 | adopt_courses_table | Por aplicar; en prod no cambia nada |
| 20260926140000 | drop_authenticated_pii_policies | Por aplicar (requiere autorización) |
| 20260926150000 | reconcile_pii_tables | Por aplicar (requiere autorización) |

> **No usar `supabase db push`** mientras `20260711120000` siga pendiente: es
> anterior a las últimas versiones aplicadas, así que `db push` exige
> `--include-all`, y esa bandera también la aplicaría. Aplicar cada migración en
> una transacción y registrarla en `supabase_migrations.schema_migrations` con su
> versión, como se hizo con RAG-01 y RAG-10.

## Deriva detectada y resuelta

### 2026-09-26

- **Tablas creadas fuera de banda:** `notas` (0 filas; lectura e inserción
  públicas) se elimina en `20260926120000`, y `courses` (sin consumidores) se
  adopta tal cual en `20260926130000`.
- **Dos migraciones editadas después de aplicarse:** `20260223162342` (se le
  agregaron políticas UPDATE/DELETE para `authenticated`) y `20260313162500`
  (reescrita el 2026-04-13 para agregar 5 índices y 2 CHECK de formato de email).
  Prod conserva el SQL original, así que esos cambios nunca llegaron a prod.
  Además, prod tiene `course_registrations.registration_status` (+ CHECK),
  agregada por dashboard. `20260926150000` deja ambas tablas iguales en prod y en
  un entorno nuevo sin cambiar la conducta de prod: adopta `registration_status`,
  crea los 5 índices, deja `created_at` con default `now()` y quita los CHECK de
  email, que rechazaban correos que el backend acepta (p. ej. `o'brien@gmail.com`).
- **PII legible por `authenticated`:** en prod `"Allow authenticated reads from …"`
  dejaba a cualquier cuenta leer inscripciones y mensajes, con los registros de
  Auth abiertos. Los registros se desactivaron en el dashboard y `20260926140000`
  elimina toda política de `authenticated` en ambas tablas.

### 2026-07-10

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

## Regla para no volver a derivar

Nunca editar una migración ya aplicada: cualquier cambio va en un archivo nuevo.
Prod guarda el SQL que ejecutó en `supabase_migrations.schema_migrations.statements`;
si un archivo del repo ya no coincide con ese SQL, sus cambios no llegarán a prod.

## Deuda conocida

- **Baseline definitivo:** para garantizar que un despliegue desde cero reproduce
  exactamente prod (nombres de políticas incluidos), se puede generar una vez una
  migración baseline con `supabase db pull` y confirmar con
  `supabase migration list`. Esto cierra la posibilidad de futuras sorpresas por
  ediciones fuera de banda.
