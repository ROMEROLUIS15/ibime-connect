# Carga de Catálogo y Base de Conocimiento (RAG)

Guía paso a paso para poblar la `knowledge_base` que alimenta las respuestas del
Asistente IBIME vía RAG (Retrieval-Augmented Generation).

> Actualizada el 2026-09-25 con el comportamiento posterior a las correcciones de
> [`AUDITORIA_RAG.md`](./AUDITORIA_RAG.md) (RAG-01, 03, 06, 07, 08 y 10).

## Cómo funciona el RAG (contexto rápido)

1. El contenido se guarda en la tabla `public.knowledge_base` (Postgres + pgvector).
2. Cada fila tiene `title`, `content`, un `embedding` `vector(768)` y `metadata` (jsonb).
3. Los embeddings se generan con **Google Gemini** (`gemini-embedding-001`, 768 dimensiones).
4. En cada consulta del usuario, el backend genera el embedding de la pregunta y
   llama al RPC `match_knowledge`, que devuelve las filas más similares por
   distancia coseno (búsqueda exacta: desde RAG-01 no hay índice aproximado).
5. **Umbral fail-hard: 0.65.** Si ninguna fila alcanza esa similitud, NO se entrega
   contexto y el asistente no inventa:
   - **Preguntas de catálogo** (cursos, talleres, libros): responde con un mensaje
     fijo que deriva a los canales de contacto, sin llamar al LLM.
   - **Preguntas generales**: el LLM responde solo con los datos institucionales de
     su prompt (horario, dirección, teléfono, servicios); si no alcanzan, lo dice y
     deriva a contacto.
6. **Caché.** Las respuestas con contexto se guardan 1 hora en Redis (`rag:*`).
   Cada carga de los métodos 1 y 2 que escribe algo **invalida esa caché sola**:
   el contenido nuevo se ve desde la siguiente pregunta.

> Implicación práctica: el `content` debe estar redactado de forma natural y
> cercana a cómo pregunta la gente. Si el contenido no es semánticamente parecido
> a la consulta, no superará el umbral y RAG no lo recuperará.

> **No uses `POST /admin/flush-cache` después de cargar.** No hace falta (la caché
> RAG ya se invalida sola) y vacía **toda** la base de Redis: corta las sesiones
> abiertas del chat, reinicia el anti fuerza bruta y pone a cero los contadores de
> cuota de Groq.

---

## Dónde corre cada método

| Método | Dónde se ejecuta | Key de Gemini que usa | Qué necesitas tú |
| --- | --- | --- | --- |
| 1 — Webhook de Koha | Backend en Render | La configurada en Render | Solo el `x-admin-key` |
| 2 — Curación PDF/texto | Backend en Render (+ Groq para curar) | La configurada en Render | Solo el `x-admin-key` |
| 3 — Script de seed | **Tu máquina** | La de tu `backend/.env` | Una key de Gemini que funcione en local |

Los métodos 1 y 2 no dependen de ninguna key en tu máquina. El 3 sí: si tu key
local de Gemini no funciona, carga ese contenido con el Método 2 en modo texto.

---

## Autenticación (x-admin-key)

Las vías que escriben en la base (webhook Koha y curación PDF/texto) exigen una
clave de administrador. Es **un único secreto** que tú generas:

- En el servidor vive como la variable de entorno **`ADMIN_SECRET`**.
- El cliente (script, curl, n8n) lo envía en el header **`x-admin-key`**.
- El backend compara ambos (SHA-256 + timing-safe): si coinciden autoriza; si no, `401`.

Configura el **mismo valor** en los tres lugares:

1. **Render** (producción): Environment → Variables → `ADMIN_SECRET=<tu-secreto>` (redespliega solo).
2. **`backend/.env`** (desarrollo): `ADMIN_SECRET=<tu-secreto>`.
3. **Clientes** (scripts, curl, n8n): header `x-admin-key: <tu-secreto>`.

Generar un secreto fuerte:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> El guard es **fail-closed**: si `ADMIN_SECRET` no está definido en el servidor,
> TODAS las cargas devuelven `401` (incluido el admin). Nunca publiques el valor
> real (no lo subas al repo ni lo pegues en chats). En los ejemplos de abajo,
> `$ADMIN_SECRET` (bash) y `$env:ADMIN_SECRET` (PowerShell) representan tu clave.

---

## Métodos para cargar contenido

Hay tres vías. Elige según el origen de los datos.

### Método 1 — Webhook de Koha (catálogo bibliográfico, por lotes)

Para cargar registros estructurados del catálogo de Koha desde cualquier cliente
(un script, curl o una automatización como n8n).

- **Endpoint:** `POST /api/v1/knowledge/webhook/koha`
- **Auth:** header `x-admin-key: <ADMIN_SECRET>`.
- **Body:** un **arreglo JSON** de objetos. Cada fila se guarda con:
  - `title`: el campo `titulo` (o `title`) del ítem; si no trae ninguno, `Koha #<id>`.
  - `content`: `[Catálogo Koha]` seguido de cada propiedad como `clave: valor`.
- **Importante (idempotencia):** incluye en cada ítem un identificador estable de
  Koha: `biblionumber`, `id` o `biblio_id`. El endpoint hace **upsert por ese ID +
  hash de contenido**: re-ejecutar el sync no duplica filas y solo re-embebe lo que
  cambió (ahorra cuota de Gemini). Si un ítem no trae ID estable, se usa un hash del
  objeto como respaldo (menos ideal: si el objeto cambia, se trata como nuevo).
- **Incluye un campo descriptivo en lenguaje natural** (por ejemplo `resumen`): el
  `content` es un volcado `clave: valor`, y un texto que se parezca a cómo pregunta
  la gente mejora la recuperación.
- **Límite por petición:** como máximo **50 ítems**. Cada ítem nuevo o modificado se
  embebe y se escribe en serie (con una pausa de 400 ms por la cuota de Gemini), así
  que el lote acota cuánto dura la petición. Si se envían más, responde `413` con
  `{ error, registrosRecibidos, maxItems }` y no ingiere nada. El cuerpo JSON además
  no puede superar **100 KB** (límite por defecto de `express.json`): con registros
  largos, usa lotes más chicos.
- **Errores parciales:** si un ítem falla, se cuenta en `errors` y el lote sigue.
  Reenviar el lote completo es seguro gracias al upsert idempotente.
- **Respuesta:** `{ message, registrosRecibidos, resultado: { inserted, updated, skipped, errors } }`.

Un lote pequeño con curl:

```bash
curl -X POST "https://ibime-connect.onrender.com/api/v1/knowledge/webhook/koha" \
  -H "Content-Type: application/json" \
  -H "x-admin-key: $ADMIN_SECRET" \
  -d '[
    { "biblionumber": "1024", "titulo": "Cien años de soledad", "autor": "Gabriel García Márquez", "resumen": "Novela cumbre del realismo mágico.", "disponibilidad": "Disponible en Biblioteca Central" },
    { "biblionumber": "1025", "titulo": "La vorágine", "autor": "José Eustasio Rivera", "resumen": "Clásico de la literatura latinoamericana." }
  ]'
```

Un catálogo completo desde PowerShell (Windows), partido en lotes de 50. Espera un
archivo `catalogo-koha.json` con el arreglo de ítems:

```powershell
$items = Get-Content .\catalogo-koha.json -Raw -Encoding UTF8 | ConvertFrom-Json
for ($i = 0; $i -lt $items.Count; $i += 50) {
  $lote = $items[$i..([Math]::Min($i + 49, $items.Count - 1))]
  $body = ConvertTo-Json -InputObject @($lote) -Depth 5
  $r = Invoke-RestMethod -Method Post -Uri 'https://ibime-connect.onrender.com/api/v1/knowledge/webhook/koha' `
    -Headers @{ 'x-admin-key' = $env:ADMIN_SECRET } -ContentType 'application/json; charset=utf-8' `
    -Body ([Text.Encoding]::UTF8.GetBytes($body))
  "Lote $([Math]::Floor($i / 50) + 1): $($r.resultado | ConvertTo-Json -Compress)"
}
```

`-InputObject @($lote)` mantiene el arreglo aunque el último lote tenga un solo ítem,
y enviar los bytes en UTF-8 conserva los acentos en Windows PowerShell 5.1.

### Método 2 — Curación con LangGraph (PDF o texto: folletos, programas de cursos)

Para documentos no estructurados (un PDF con la oferta de talleres, un folleto de
eventos). Un agente LangGraph extrae ítems del texto con el LLM (Groq), los valida
y los corrige antes de ingestarlos.

- **Endpoint recomendado:** `POST /api/v1/agents/curate-catalog` (máx. 5 peticiones
  por minuto). Alias con el mismo comportamiento: `POST /api/v1/knowledge/upload-pdf`.
  Ambos requieren el header `x-admin-key: <ADMIN_SECRET>`.
- **Modo A — PDF** (`multipart/form-data`): campo `file` (PDF, máx. 10 MB), más
  `title` y `category` opcionales. Si el lote se aprueba, se ingesta automáticamente.
  Un PDF escaneado (solo imágenes) no tiene texto extraíble y responde `400`.

```bash
curl -X POST "https://ibime-connect.onrender.com/api/v1/agents/curate-catalog" \
  -H "x-admin-key: $ADMIN_SECRET" \
  -F "file=@oferta-talleres-2026.pdf" \
  -F "title=Oferta de Talleres 2026" \
  -F "category=curso"
```

- **Modo B — texto JSON**: enviar `text` directo. Para que persista en la DB hay
  que incluir `"ingest": true`; sin eso solo devuelve la curación como vista previa.

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
  títulos ya existentes en la DB, tanto en `title` como en `metadata.title`) →
  Corrector (arregla conflictos, hasta 3 iteraciones). Si un título ya existe, el
  corrector lo renombra (por ejemplo «… - Edición 2026») y se guarda como una
  **edición nueva**.
- **Qué se guarda:** una fila por **ítem curado** (no el texto crudo del PDF), con
  `title` = `"<title del documento> (Parte N)"` y en `metadata`: el título real del
  ítem, la `category` enviada (por defecto `catalogo`), `source: langgraph_curator`
  y `document_hash` (SHA-256 del texto del documento).
- **El mismo documento no se carga dos veces.** Si el texto ya fue ingerido, responde
  `success: false`, `iterations: 0`, `items: []` y un conflicto que lo explica, sin
  llamar al LLM. Si el documento **cambió**, cuenta como uno nuevo: sus filas se
  suman a las de la versión anterior, que siguen en la base hasta que las borres.
- **Todo o nada.** Si falla la ingesta de algún ítem, se borra el documento completo
  y la respuesta trae `success: false` e `ingestion.rolledBack: true`: puedes volver a
  subirlo. Si incluso ese borrado falla, el conflicto indica el `document_hash` para
  limpiarlo a mano:

```sql
delete from public.knowledge_base where metadata->>'document_hash' = '<hash>';
```

- **Respuesta:** `{ success, iterations, conflicts, items, ingestion? }`, con
  `ingestion: { success, errors, rolledBack? }` cuando se intentó ingestar.

#### Límites prácticos del Método 2: sube documentos cortos

El extractor manda **todo el texto del documento a Groq en una sola llamada** y su
respuesta está limitada a **800 tokens**. De ahí salen dos límites:

- **Pocos ítems por documento** (del orden de 5 a 8): con más, el JSON de la respuesta
  se corta y la curación falla.
- **Texto acotado:** el presupuesto de Groq es de 6.400 tokens por minuto (8.000 del
  plan × 0,8 de margen, ver `render.yaml`), y cada llamada reserva el texto (~4
  caracteres por token) más 800 de respuesta. Un documento de más de unos 20.000
  caracteres no entra, y si hubo otras llamadas en ese minuto el margen es menor.

En los dos casos el conflicto que devuelve es *«Fallo al estructurar o interpretar
la información extraída (JSON Parsing Error)»*. Para evitarlo, **parte los PDF
largos** en documentos de una página o sección, con pocos ítems cada uno, y espera
alrededor de un minuto entre subidas.

### Método 3 — Script de seed (información institucional base)

Para la información fija de la institución (servicios, horarios, contacto, Koha,
alfabetización digital). Ya fue ejecutado para sembrar la base inicial (6 filas,
`metadata.source = institutional-seed`).

- **Archivo:** `backend/scripts/seed-institutional-knowledge.ts`
- **Ejecutar** (desde `backend/`, con el `.env` configurado):

```bash
cd backend
npx tsx scripts/seed-institutional-knowledge.ts
```

- Es **idempotente**: borra sus propias entradas (por título) y las reinserta.
- Corre **en tu máquina** con la `GEMINI_API_KEY` de `backend/.env` (reintenta ante
  `429` y espera 2,5 s entre filas). Si esa key no funciona, el seed falla.
- **No invalida la caché RAG:** una pregunta ya respondida puede seguir mostrando el
  contenido anterior hasta 1 hora.
- Para añadir o ajustar contenido institucional, edita el arreglo `ENTRIES` del
  script y vuelve a ejecutarlo.

---

## Verificar que la carga funcionó

1. **Contar filas por origen** (SQL Editor de Supabase):

```sql
select metadata->>'source' as origen, count(*) from public.knowledge_base group by 1 order by 1;
-- institutional-seed (Método 3), koha_webhook (Método 1), langgraph_curator (Método 2)
```

2. **Medir la recuperación sin gastar cuota de Groq** con el sondeo de administración
   `POST /api/v1/admin/rag-probe` (requiere `x-admin-key`; hasta 50 preguntas, `topK`
   de 1 a 10). Para cada pregunta devuelve los documentos más cercanos **sin umbral**,
   la mejor similitud y si pasa el 0.65. No llama al LLM ni escribe nada:

```powershell
$body = @{ questions = @('¿Cuál es el horario de atención?', '¿Tienen Cien años de soledad?'); topK = 3 } | ConvertTo-Json -Depth 5
$r = Invoke-RestMethod -Method Post -Uri 'https://ibime-connect.onrender.com/api/v1/admin/rag-probe' `
  -Headers @{ 'x-admin-key' = $env:ADMIN_SECRET } -ContentType 'application/json; charset=utf-8' `
  -Body ([Text.Encoding]::UTF8.GetBytes($body))
$r.results | Select-Object question, best, passesThreshold
```

3. **Prueba de punta a punta en el chat** (gasta cuota de Groq):

```bash
curl -X POST "https://ibime-connect.onrender.com/api/v1/chat" \
  -H "Content-Type: application/json" \
  -d '{"userMessage":"¿cuál es el horario de atención del IBIME?"}'
# Esperado: "sources" con al menos un documento y "similarity" ≥ 0.65
# (medido el 2026-09-25: el documento de horario respondió con 0.73).
```

4. Si una pregunta legítima queda por debajo de 0.65 en el sondeo, reescribe el
   `content` de ese documento de forma más parecida a cómo se pregunta.

---

## Buenas prácticas

- **Redacta el `content` en lenguaje natural**, como respondería un bibliotecario,
  no como un volcado de campos. Mejora el match semántico.
- **Títulos claros.** Volver a subir el mismo documento no duplica nada; un título
  que ya existe con contenido distinto se guarda como una edición nueva.
- **Documentos cortos en el Método 2** (una página o sección, pocos ítems).
- **Cuidado con la cuota de embeddings**: Gemini free-tier devuelve `429`
  (RESOURCE_EXHAUSTED) en cargas masivas. La ingesta espacia las llamadas
  (400–500 ms por ítem) y el seed además reintenta.
- **Catálogo real (cursos, libros, eventos)**: usar el Método 1 (Koha por lotes) o
  el Método 2 (PDF/texto). El Método 3 es solo para la base institucional fija.
- **Después de cargar, no hace falta tocar la caché** (ver arriba).

---

## Seguridad

Las tres puertas de ingesta exigen el header `x-admin-key: <ADMIN_SECRET>`
(comparación timing-safe vía `requireAdminKey`):

- `POST /api/v1/agents/curate-catalog`
- `POST /api/v1/knowledge/upload-pdf`
- `POST /api/v1/knowledge/webhook/koha`

Esto evita que un tercero inyecte contenido en la base de conocimiento
(envenenamiento de RAG) o consuma cuota de LLM/embeddings. Cualquier cliente
automatizado (un script, n8n) debe enviar el header `x-admin-key`. El valor de
`ADMIN_SECRET` se define como variable de entorno del backend.

El sondeo `POST /api/v1/admin/rag-probe` usa la misma clave; no escribe en la base,
pero cada llamada consume embeddings de Gemini.
