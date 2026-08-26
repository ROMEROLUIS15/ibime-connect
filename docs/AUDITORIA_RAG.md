# Auditoría del pipeline RAG

**Fecha:** 2026-08-26 · **Alcance:** ingesta → embeddings → índice vectorial → RPC → caché → orquestador
**Entorno medido:** Supabase producción, en modo **solo lectura**

Auditoría del funcionamiento real del RAG que alimenta al Asistente IBIME. Todas las cifras
de este documento son medidas contra la base de datos de producción y contra la API de
embeddings, no estimaciones.

---

## Veredicto

**El RAG está bien diseñado, pasa sus tests y no está recuperando nada en producción.**

El índice `ivfflat` de `knowledge_base` se construyó con `lists = 10` sobre una tabla vacía
y nunca se reconstruyó. Hoy la tabla tiene 6 filas. Como pgvector sondea **una sola lista por
consulta** (`probes = 1`), el RPC `match_knowledge` —único camino de recuperación del
asistente— devuelve entre 0 y 5 de esos 6 documentos, y en la mayoría de los casos **ninguno**.

No es un problema de umbral, de modelo ni de prompt: el documento correcto existe, supera el
umbral y aun así no se recupera nunca. Todo lo demás de este informe es secundario a esa causa
raíz.

| Métrica | Valor |
| --- | --- |
| Documentos en `knowledge_base` | 6 |
| Ítems de catálogo cargados | **0** |
| Documentos alcanzables por consulta | **1 de 6** |
| Preguntas de prueba que recuperan algo | **2 de 7** |
| Dimensiones del embedding | 768, coherentes en toda la tabla |

---

## Evidencia 1 — Lo que debería recuperar frente a lo que recupera

Siete preguntas reales, embebidas con el mismo modelo y los mismos parámetros que usa el
backend (`gemini-embedding-001`, `outputDimensionality: 768`), comparando el cálculo exacto de
similitud coseno contra la respuesta real del RPC en producción.

| Pregunta | Mejor documento (cálculo exacto) | Sim. | ¿Supera 0.65? | Filas del RPC |
| --- | --- | ---: | ---: | ---: |
| ¿Cuál es el horario de atención de la biblioteca? | Horario de atención del IBIME | 0.702 | sí | **0** |
| ¿Dónde queda ubicada la sede del IBIME? | Horario de atención del IBIME | 0.803 | sí | 1 |
| ¿Dan talleres gratuitos de computación? | Alfabetización Digital — Talleres | 0.729 | sí | 1 |
| ¿Cómo busco un libro en el catálogo? | Sistema Koha — Catálogo en línea | 0.667 | sí | **0** |
| Quiero inscribirme en un curso | Alfabetización Digital — Talleres | 0.579 | no | 0 |
| ¿Tienen el libro Cien años de soledad? | Sistema Koha — Catálogo en línea | 0.584 | no | 0 |
| ¿Cuál es la capital de Francia? | Contacto y ubicación del IBIME | 0.473 | no | 0 |

Dos lecturas distintas en la misma tabla:

- **Filas 1 y 4** — fallo del índice: el documento correcto existe y supera el umbral, pero el
  RPC no lo devuelve. La pregunta más frecuente que puede recibir una biblioteca (el horario)
  tiene su documento en la base y el RAG responde con cero resultados.
- **Filas 5 y 6** — problema aparte, de calibración: el documento correcto es el mejor
  candidato, pero queda por debajo de 0.65.
- **Fila 7** — el único comportamiento deseado del conjunto: fuera de dominio, se rechaza.

---

## Evidencia 2 — Por qué el índice pierde documentos

`ivfflat` agrupa los vectores en `lists` particiones y, por omisión, examina solo **una** por
consulta. Con 6 filas y 10 particiones, el entrenamiento dejó dos particiones con contenido y
ocho vacías:

```
lista A   1 doc   («Horario de atención»)
lista B   5 docs
lista C-J vacías  (8 centroides sin ningún documento)
```

Una consulta cuyo centroide más cercano sea cualquiera de las ocho listas vacías devuelve
**cero filas**, independientemente del umbral.

Reproducción en SQL puro, sin intervención del backend:

```sql
-- Consulta de control: se usa el propio vector de una fila existente,
-- con umbral -1 (aceptar todo). Debería devolver las 6 filas.
select count(*) from match_knowledge(
  (select embedding from knowledge_base where id = 9), 6, -1
);
-- → 1

-- El mismo cálculo sin índice (escaneo exacto):
-- → 6

-- El mismo RPC con ivfflat.probes = 10 (una sonda por lista):
-- → 6
```

Filas devueltas por `match_knowledge(doc, 6, -1)` usando cada documento como consulta:

| id | documento | probes = 1 (actual) | probes = 10 |
| ---: | --- | ---: | ---: |
| 8 | IBIME — Quiénes somos y misión | 5 | 6 |
| 9 | Horario de atención del IBIME | **1** | 6 |
| 10 | Contacto y ubicación del IBIME | 5 | 6 |
| 11 | Red Bibliotecaria del estado Mérida | 5 | 6 |
| 12 | Sistema Koha — Catálogo en línea | 5 | 6 |
| 13 | Alfabetización Digital — Talleres | 5 | 6 |

---

## Hallazgos

Once hallazgos ordenados por severidad. Los identificadores son estables para poder
referenciarlos en incidencias.

### RAG-01 · CRÍTICO — El índice ivfflat destruye la recuperación

**Dónde:** `supabase/migrations/20260319110000_enable_rag.sql:15` · índice `knowledge_base_embedding_idx`

Índice creado con `lists = 10` sobre una tabla vacía y nunca reconstruido. Con 6 filas y
`probes = 1`, el RPC pierde hasta 5 de 6 documentos y con frecuencia devuelve cero, incluso con
el umbral desactivado. Afecta a los tres flujos que consultan RAG: `catalog`, `general` y la
Branch B del flujo de registro.

**Corrección:** eliminar el índice. Con este volumen el escaneo exacto es instantáneo y da
recall del 100 %. Cuando la tabla supere el millar de filas, crear **HNSW** en su lugar, que no
depende de entrenamiento previo ni del parámetro `probes`.

### RAG-02 · ALTO — La base de conocimiento no tiene catálogo

**Dónde:** tabla `public.knowledge_base` en producción

Las 6 filas existentes son la semilla institucional (`metadata.source = "institutional-seed"`),
todas creadas el 2026-06-06. No hay ni un solo ítem con `source = "koha_webhook"` ni
`"langgraph_curator"`: el webhook de Koha y la carga de PDF nunca han escrito en producción.

El intent `catalog` del clasificador enruta, por tanto, a una recuperación que por construcción
no tiene nada bibliográfico que devolver.

**Corrección:** ejecutar la carga documentada en [`CARGA_DE_CATALOGO.md`](./CARGA_DE_CATALOGO.md)
una vez corregido RAG-01, y verificar el conteo por `metadata->>'source'` tras el primer sync.

### RAG-03 · ALTO — El flujo de catálogo ignora el fail-hard

**Dónde:** `backend/src/modules/chat/chat-orchestrator.ts:401`

`_handleGeneral` comprueba `if (!ragResult.hit)` y deriva a un fallback controlado.
`_handleCatalog` registra `hit` en el log pero **no lo comprueba**: ante un fallo de
recuperación llama igual al LLM con el contexto vacío. La `ResponsePolicy` solo interceptará esa
respuesta si es estructuralmente inválida o si dispara el guardrail de estado de usuario; una
invención plausible sobre cursos o libros pasa.

Contradice lo que documentan `CLAUDE.md` y [`AI_STRATEGY.md`](./AI_STRATEGY.md)
(«catalog → RAG con fail-hard → LLM»), y es precisamente la rama donde inventar datos es más
caro para la institución.

**Corrección:** replicar en `_handleCatalog` la guarda de `_handleGeneral`, devolviendo el
fallback de `catalog` que ya existe en `response-policy.ts:28`.

### RAG-04 · ALTO — El prompt invita a responder sin fuentes

**Dónde:** `backend/src/modules/chat/chat-orchestrator.ts:659`

`formatRagContextForPrompt` cierra el bloque de contexto con: «*Si no es relevante para la
pregunta del usuario, responde con tu conocimiento institucional*». Es una autorización
explícita a ignorar las fuentes recuperadas, en tensión directa con la regla del propio system
prompt de no inventar datos específicos.

**Corrección:** sustituir por una instrucción cerrada: si el contexto no cubre la pregunta,
derivar a los canales de contacto en lugar de completar con conocimiento paramétrico.

### RAG-05 · ALTO — El umbral 0.65 no separa señal de ruido

**Dónde:** `backend/src/services/rag.service.ts:23`

En este espacio de embeddings, documentos institucionales **sin relación entre sí** puntúan
entre 0.644 y 0.801. Por ejemplo, «Horario de atención» contra «Alfabetización Digital»: 0.694.
Mientras tanto, preguntas legítimas cuyo documento correcto es el mejor candidato puntúan 0.579
y 0.584. El margen entre acierto y ruido es de centésimas, y el umbral cae dentro de él.

Similitud entre los 15 pares de documentos no relacionados:

```
máx 0.801   ·   mediana 0.702   ·   mín 0.644
14 de 15 pares superan el umbral de 0.65 usado para decidir si hay contexto útil
```

**Corrección:** recalibrar con el índice ya arreglado y sobre un corpus real. Como criterio más
estable que un umbral absoluto, considerar el margen relativo entre el primer y el segundo
resultado.

### RAG-06 · MEDIO — La guarda de duplicados de PDF no puede coincidir nunca

**Dónde:** `curation-graph.ts:220` · `agent.controller.ts:70` · `knowledge-ingestion.service.ts:125`

El grafo de curación comprueba duplicados con
`select title from knowledge_base where title in (…títulos extraídos)`, pero la ingesta escribe
el título como `"{documento} (Parte N)"` y guarda el título real solo dentro de
`metadata.title`. La consulta de duplicados compara contra un valor que jamás se almacena:
volver a subir el mismo PDF pasa la validación e inserta todo por segunda vez.

**Corrección:** comparar contra `metadata->>'title'`, o adoptar el patrón idempotente que ya usa
`upsertKohaItems`: identificador estable + hash de contenido en `metadata`.

### RAG-07 · MEDIO — La caché no se invalida al ingerir, ni distingue parámetros

**Dónde:** `backend/src/services/rag.service.ts:51` y `:113`

La clave es `rag:{sha256(mensaje)}` con TTL de una hora. No incluye `matchCount` ni `threshold`,
así que una futura llamada con otros parámetros recibiría el resultado calculado con los
anteriores. Y ninguna vía de ingesta invalida la caché: el contenido recién cargado permanece
invisible hasta una hora para cualquier pregunta ya formulada.

**Corrección:** incorporar los parámetros y una versión del corpus a la clave, y llamar al flush
que ya expone `POST /admin/flush-cache` al cierre de cada ingesta con escrituras.

### RAG-08 · MEDIO — La ingesta bloquea la petición HTTP

**Dónde:** `knowledge-ingestion.service.ts:97` y `:153`

Ambas vías embeben y escriben secuencialmente con una pausa de 400–500 ms por ítem, dentro del
ciclo de la petición. Un PDF de 100 fragmentos mantiene la conexión abierta más de un minuto; un
sync de Koha de 500 ítems, más de cuatro. Sobre plan gratuito y con clientes como n8n de por
medio, es el escenario clásico de timeout con ingesta a medias y sin transacción que la revierta.

**Corrección:** responder `202` y procesar en segundo plano, o exigir lotes acotados y devolver
el progreso por lote.

### RAG-09 · MEDIO — El troceado aplasta la estructura del documento

**Dónde:** `document-processor.service.ts:82`

`text.replace(/\s+/g, ' ')` colapsa saltos de línea y sangrías antes de trocear. Para catálogos
bibliográficos y horarios —tablas, listas, fichas— eso funde registros distintos en un mismo
fragmento y degrada la precisión de la recuperación. El corte por «último punto» además parte en
abreviaturas frecuentes en direcciones («Av.», «Nro.»).

**Corrección:** normalizar espacios preservando los saltos de párrafo y trocear por límites de
párrafo antes de recurrir al corte por caracteres.

### RAG-10 · BAJO — Restos del esquema legado en producción

**Dónde:** tabla `public.ibime_knowledge` · RPC `match_ibime_knowledge`

La tabla de la etapa OpenAI (vector 1536) sigue existiendo con **0 filas**, su índice ivfflat
`lists = 50` y su RPC, que tiene `EXECUTE` concedido a `anon`. Sin consumidores en el backend
actual.

También `match_knowledge` es ejecutable por `anon`: hoy inocuo porque RLS no concede `SELECT` a
ese rol y la función es *security invoker*, pero es superficie innecesaria.

**Corrección:** migración de limpieza que elimine tabla, índice y RPC legados, y añada un
`revoke execute … from anon` explícito sobre `match_knowledge`.

### RAG-11 · BAJO — Los tests no cubren los modos de fallo del RAG

**Dónde:** `backend/src/__tests__/services/rag.service.test.ts`

Tres casos: recuperación con resultados, fallo del servicio de embeddings y repositorio vacío.
Ninguno ejercita el fail-hard por umbral, la coherencia de la clave de caché, ni —el que habría
detectado RAG-03— que el flujo de catálogo responda con el fallback cuando no hay contexto.

**Corrección:** añadir un test por cada hallazgo corregido. Son los que evitan la regresión
silenciosa de un fallo que no rompe ningún build.

---

## Verificado y sin problema

Comprobado durante la auditoría y descartado como causa. Conviene dejarlo por escrito para no
«arreglarlo» por error:

- **Dimensionalidad coherente.** Las 6 filas son `vector(768)`, sin nulos, y Gemini devuelve
  exactamente 768 con `outputDimensionality`.
- **Vectores sin normalizar: irrelevante.** La norma L2 medida es 0.59, pero la distancia coseno
  es invariante a escala. No hay nada que corregir aquí.
- **`taskType` sin efecto medible.** Fijar `RETRIEVAL_QUERY` devolvió similitudes idénticas a
  tres decimales frente al valor por defecto. No es la palanca a mover.
- **Degradación elegante con Redis caído.** `CacheService` comprueba `isOpen` y captura errores
  en las cuatro operaciones; el RAG sigue sirviendo sin caché.
- **Sin PII en las claves de Redis.** El mensaje del usuario se normaliza y se hashea con
  SHA-256 antes de usarse como clave.
- **Ingesta de Koha idempotente.** `upsertKohaItems` compara hash de contenido contra
  `metadata.koha_id` y evita re-embeber lo que no cambió.
- **Rutas de escritura protegidas.** Webhook y carga de PDF exigen `x-admin-key`, y el guard se
  ejecuta antes de que multer lea el archivo.
- **RLS efectiva.** `knowledge_base` no concede `SELECT` a `anon`, lo que neutraliza el `EXECUTE`
  abierto del RPC.

---

## Orden de corrección

La secuencia importa: medir umbrales o cargar catálogo antes de arreglar el índice produce
conclusiones falsas.

1. **Corregir el índice vectorial** — RAG-01. Una migración. Restablece la recuperación de los
   tres flujos.
2. **Añadir la guarda de `hit` al flujo de catálogo** — RAG-03. Cierra la vía de alucinación que
   queda abierta cuando no hay contexto.
3. **Cargar el catálogo real** — RAG-02. Hasta aquí, el asistente no tiene fondo bibliográfico
   que consultar.
4. **Recalibrar el umbral con datos reales** — RAG-05. Con índice sano y corpus cargado, la
   medición ya es representativa.
5. **Idempotencia, invalidación de caché e ingesta asíncrona** — RAG-06, RAG-07, RAG-08. Higiene
   operativa antes de abrir la carga a terceros.
6. **Limpieza del esquema legado y tests de regresión** — RAG-10, RAG-11. Cierra la deuda que
   dejó la migración desde OpenAI.

### Paso 1 — migración propuesta

```sql
-- El índice ivfflat se entrenó sobre una tabla vacía: con 6 filas y probes=1
-- deja 8 de 10 centroides sin documentos y el RPC devuelve entre 0 y 5 filas.
-- A este volumen, el escaneo exacto es instantáneo y da recall del 100 %.
drop index if exists public.knowledge_base_embedding_idx;

-- Cuando la tabla supere ~1.000 filas, reintroducir un índice, pero HNSW:
-- no depende de entrenamiento previo ni del parámetro probes.
-- create index on public.knowledge_base
--   using hnsw (embedding extensions.vector_cosine_ops);
```

---

## Cómo se midió

- **Similitudes exactas:** embeddings de las preguntas generados contra la API de Gemini con los
  mismos parámetros del backend, y coseno calculado en local contra los 768 componentes de cada
  fila de `knowledge_base`.
- **Respuesta real del RPC:** llamadas a `POST /rest/v1/rpc/match_knowledge` con la clave
  `service_role`, es decir el mismo camino que recorre `KnowledgeRepository.matchKnowledge`.
- **Comportamiento del índice:** consultas directas a Postgres comparando el RPC (que usa el
  índice porque su parámetro actúa como constante) contra el escaneo exacto, y contraste con
  `set local ivfflat.probes = 10`.
- Ninguna medición escribió en la base de datos.
