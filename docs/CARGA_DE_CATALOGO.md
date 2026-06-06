# Carga de Catálogo y Base de Conocimiento (RAG)

Guía paso a paso para poblar la `knowledge_base` que alimenta las respuestas del
Asistente IBIME vía RAG (Retrieval-Augmented Generation).

## Cómo funciona el RAG (contexto rápido)

1. El contenido se guarda en la tabla `public.knowledge_base` (Postgres + pgvector).
2. Cada fila tiene `title`, `content`, un `embedding` `vector(768)` y `metadata` (jsonb).
3. Los embeddings se generan con **Google Gemini** (`gemini-embedding-001`, 768 dimensiones).
4. En cada consulta del usuario, el backend genera el embedding de la pregunta y
   llama al RPC `match_knowledge`, que devuelve las filas más similares por
   distancia coseno.
5. **Umbral fail-hard: 0.65.** Si ninguna fila supera esa similitud, NO se entrega
   contexto (el agente responde con su conocimiento institucional base o deriva a
   contacto, sin inventar).

> Implicación práctica: el `content` debe estar redactado de forma natural y
> cercana a cómo pregunta la gente. Si el contenido no es semánticamente parecido
> a la consulta, no superará el umbral y RAG no lo recuperará.

---

## Métodos para cargar contenido

Hay tres vías. Elige según el origen de los datos.

### Método 1 — Webhook de Koha (catálogo bibliográfico automatizado, vía n8n)

Pensado para que una automatización (n8n) extraiga el catálogo de Koha y lo
empuje periódicamente.

- **Endpoint:** `POST /api/v1/knowledge/webhook/koha`
- **Auth:** requiere el header `x-admin-key: <ADMIN_SECRET>` (n8n debe enviarlo).
- **Body:** un **arreglo JSON** de objetos. Cada propiedad se concatena como
  `clave: valor` en el `content`.
- **Importante (idempotencia):** incluye en cada ítem un identificador estable de
  Koha: `biblionumber`, `id` o `biblio_id`. El endpoint hace **upsert por ese ID +
  hash de contenido**: re-ejecutar el sync no duplica filas y solo re-embebe lo que
  cambió (ahorra cuota de Gemini). Si un ítem no trae ID estable, se usa un hash del
  objeto como respaldo (menos ideal: si el objeto cambia, se trata como nuevo).

```bash
curl -X POST "https://ibime-connect.onrender.com/api/v1/knowledge/webhook/koha" \
  -H "Content-Type: application/json" \
  -H "x-admin-key: $ADMIN_SECRET" \
  -d '[
    { "biblionumber": "1024", "titulo": "Cien años de soledad", "autor": "Gabriel García Márquez", "resumen": "Novela cumbre del realismo mágico.", "disponibilidad": "Disponible en Biblioteca Central" },
    { "biblionumber": "1025", "titulo": "La vorágine", "autor": "José Eustasio Rivera", "resumen": "Clásico de la literatura latinoamericana." }
  ]'
```

- **Respuesta:** `{ message, registrosRecibidos, resultado: { inserted, updated, skipped, errors } }`.
- **Uso típico:** un flujo n8n (cron o trigger) consulta Koha, mapea los registros
  incluyendo `biblionumber`, y hace el `POST` con el header `x-admin-key`.

### Método 2 — Curación con LangGraph (PDF o texto: folletos, programas de cursos)

Pensado para cargar documentos no estructurados (un PDF con la oferta de talleres,
un folleto de eventos). Un agente LangGraph extrae, valida y corrige los ítems
antes de ingestarlos.

- **Endpoint recomendado (protegido):** `POST /api/v1/agents/curate-catalog`
  - Requiere el header `x-admin-key: <ADMIN_SECRET>`.
- **Modo A — PDF** (`multipart/form-data`): campo `file` (PDF, máx. 10 MB), más
  `title` y `category` opcionales. Si el lote se aprueba, se ingesta automáticamente.

```bash
curl -X POST "https://ibime-connect.onrender.com/api/v1/agents/curate-catalog" \
  -H "x-admin-key: $ADMIN_SECRET" \
  -F "file=@oferta-talleres-2026.pdf" \
  -F "title=Oferta de Talleres 2026" \
  -F "category=curso"
```

- **Modo B — texto JSON**: enviar `text` directo. Para que persista en la DB hay
  que incluir `"ingest": true`.

```bash
curl -X POST "https://ibime-connect.onrender.com/api/v1/agents/curate-catalog" \
  -H "Content-Type: application/json" \
  -H "x-admin-key: $ADMIN_SECRET" \
  -d '{
    "text": "Taller de Ofimática Básica. Inicia el 10 de julio de 2026, lunes y miércoles de 2pm a 4pm, en la Biblioteca Central. Cupos limitados.",
    "title": "Taller de Ofimatica Basica",
    "category": "curso",
    "ingest": true
  }'
```

- **Flujo interno:** Extractor (estructura en JSON) → Validador (esquema Zod +
  duplicados contra la DB) → Corrector (arregla conflictos, hasta 3 iteraciones).
- **Respuesta:** `{ success, iterations, conflicts, items, ingestion? }`.
- Existe un alias equivalente `POST /api/v1/knowledge/upload-pdf` (también
  protegido con `x-admin-key`).

### Método 3 — Script de seed (información institucional base)

Pensado para la información fija de la institución (servicios, horarios, contacto,
Koha, alfabetización digital). Ya fue ejecutado para sembrar la base inicial.

- **Archivo:** `backend/scripts/seed-institutional-knowledge.ts`
- **Ejecutar** (desde `backend/`, con el `.env` configurado):

```bash
cd backend
npx tsx scripts/seed-institutional-knowledge.ts
```

- Es **idempotente**: borra sus propias entradas (por título) y las reinserta.
- Para añadir o ajustar contenido institucional, edita el arreglo `ENTRIES` del
  script y vuelve a ejecutarlo.

---

## Verificar que la carga funcionó

1. **Probar recuperación** con una consulta real al chat y confirmar que
   `sources` viene con resultados y `similarity ≥ 0.65`:

```bash
curl -X POST "https://ibime-connect.onrender.com/api/v1/chat" \
  -H "Content-Type: application/json" \
  -d '{"userMessage":"¿cuál es el horario de atención del IBIME?"}'
# Esperado: la respuesta incluye "sources":[{ "title": ..., "similarity": 0.9x }]
```

2. Si `sources` viene vacío para algo que SÍ cargaste, revisa que el `content`
   esté redactado de forma parecida a cómo se pregunta (el umbral 0.65 es estricto).

---

## Buenas prácticas

- **Redacta el `content` en lenguaje natural**, como respondería un bibliotecario,
  no como un volcado de campos. Mejora el match semántico.
- **Títulos claros y únicos** (el validador del Método 2 detecta duplicados por título).
- **Cuidado con la cuota de embeddings**: Gemini free-tier devuelve `429`
  (RESOURCE_EXHAUSTED) en cargas masivas. Espacia las inserciones (el seed y la
  ingesta ya incluyen pausas/reintentos).
- **Catálogo real (cursos, libros, eventos)**: usar Método 1 (Koha/n8n) o Método 2
  (PDF/texto). El Método 3 es solo para la base institucional fija.

---

## Seguridad

Las tres puertas de ingesta exigen el header `x-admin-key: <ADMIN_SECRET>`
(comparación timing-safe vía `requireAdminKey`):

- `POST /api/v1/agents/curate-catalog`
- `POST /api/v1/knowledge/upload-pdf`
- `POST /api/v1/knowledge/webhook/koha`

Esto evita que un tercero inyecte contenido en la base de conocimiento
(envenenamiento de RAG) o consuma cuota de LLM/embeddings. La automatización de
n8n debe configurarse para enviar el header `x-admin-key` en el webhook de Koha.
El valor de `ADMIN_SECRET` se define como variable de entorno del backend.
