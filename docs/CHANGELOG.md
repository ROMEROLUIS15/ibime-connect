# Historial de Cambios (Changelog) 📜

Todos los cambios notables en este proyecto serán documentados en este archivo.

## [2.6.1] - 2026-07-19
### 🗺️ Los 5 ejes de la red, con sus mapas reales

Se completa la sección **Servicios** con los dos ejes que faltaban y se retiran las tarjetas placeholder sobrantes: la red queda representada por sus **5 ejes** más el Distrito Oeste, en una grilla limpia de **6 tarjetas** (2 filas de 3).

#### 🗺️ Frontend — Sección Servicios (`ServicesSection.tsx`)
- **+2 ejes con mapa real**: **Eje Páramo** (11 bibliotecas) y **Eje Pueblos del Sur** (7 bibliotecas), con el mismo tratamiento que los tres anteriores (mapa `object-contain` dentro del recuadro, fondo con textura y lightbox al hacer clic).
- **Cifras del conteo del mapa oficial**: Páramo = **11** y Pueblos del Sur = **7** provienen del rótulo del propio mapa institucional (no hay total publicado por eje), igual criterio que Mocotíes.
- **–2 tarjetas placeholder**: se eliminan **Distrito Central** y **Distrito Periférico**; se conserva **Distrito Oeste**. Antes eran 3 placeholders reservados para imágenes futuras; ya solo restaba una imagen por incorporar.
- **Assets**: `eje-paramo.png` y `eje-pueblos-del-sur.png` (renombrados a la convención con guiones de los mapas existentes).
- **Solo presentación**: no se toca backend ni el pipeline del asistente.

#### 🧪 Testing
- `ServicesSection.test.tsx` actualizado: 5 ejes, 5 mapas, 5 botones "Ampliar" accesibles y solo Distrito Oeste (Central/Periférico ausentes).
- **+1 E2E (Playwright)** en `servicios.spec.ts`: los 5 ejes visibles y verificación de que Central/Periférico ya no existen.
- Totales: **425** unit (384 backend + 41 frontend), **16** E2E — 100% en verde.

---

## [2.6.0] - 2026-07-18
### 🗺️ Red bibliotecaria por ejes con mapas reales y lightbox

La sección **Servicios** deja de mostrar recuadros genéricos con un pin y pasa a presentar la red por sus **ejes** con los mapas institucionales de IBIME dentro de cada tarjeta.

#### 🗺️ Frontend — Sección Servicios (`ServicesSection.tsx`)
- **Fila superior = 3 ejes con mapa real**: **Eje Metropolitano** (17 bibliotecas · 1 punto de lectura), **Eje Mocotíes** (11 bibliotecas) y **Eje Panamericano** (12 bibliotecas). El mapa oficial (`assets/eje-*.png`) se muestra **dentro del recuadro** de la tarjeta (`object-contain`, se ve completo sin recortar el texto del mapa).
- **Fila inferior intacta**: las 3 tarjetas de distrito (Oeste/Central/Periférico) se conservan como **placeholders** reservados para 3 imágenes futuras. Ninguna tarjeta fue eliminada.
- **Estadísticas por dato real, sin inventar cifras**: los contadores (`libraries`/`readingPoints`) son **opcionales** y solo se renderizan si el número existe. Mocotíes = **11** proviene del conteo de bibliotecas rotuladas en el mapa oficial (no hay total publicado por eje; los portales `ibime.*.gob.ve` estaban caídos al verificar).
- **Fondo con textura** en el recuadro del mapa: tinte suave del color del eje + patrón de rejilla + sombra en el mapa, para que el `object-contain` no deje espacio en blanco genérico.

#### 🔍 Lightbox del mapa (accesible)
- El mapa de cada eje es ahora un **botón** que abre un `Dialog` (shadcn/Radix) con el **mapa a tamaño grande y legible**, con animación de apertura tipo zoom. Se cierra con la X, con `Escape` o clic fuera.
- Pista visual **"Ampliar mapa"** (icono lupa) al hover; el disparador es un `<button>` con `aria-label`, navegable por teclado y usable en móvil.
- Deja el camino preparado para la función futura (clic → lista de bibliotecas / página del eje): solo cambia el destino del clic.
- **Solo presentación**: no se toca ninguna lógica de backend ni del pipeline del asistente.

#### 🧪 Testing
- **+6 unit (frontend)**: `ServicesSection.test.tsx` — render de los 3 ejes, las 3 tarjetas placeholder, 3 imágenes de mapa, 3 botones "Ampliar" accesibles y las estadísticas reales.
- **+4 E2E (Playwright)**: `servicios.spec.ts` — los 3 ejes visibles, apertura del lightbox con el mapa ampliado, cierre con `Escape` y ausencia de desborde horizontal en móvil.
- Totales: **425** unit (384 backend + 41 frontend), **15** E2E — 100% en verde.

#### 📝 Documentación
- `README.md`: conteo de tests actualizado (419 → **425**; frontend 35 → **41**) y descripción del E2E ampliada para incluir la sección de Servicios.

---

## [2.5.2] - 2026-07-18
### 🎨 Ajustes visuales institucionales

Refinamiento del sistema visual para un registro más **institucional, moderno y serio**, partiendo de la base existente (navy `#0B1930`) sin sumar colores nuevos ni elementos añadidos.

#### 🎨 Frontend — Diseño
- **Tipografía de títulos**: Playfair Display (serif editorial) → **Libre Franklin** (`font-display` de Tailwind + regla `h1–h6` + `@import`). Tono institucional en vez de editorial; el cuerpo sigue en Inter.
- **Celeste → Acero**: `#5AA5CC` (`200 53% 58%`) → **`#2E6B9E`** (`207 55% 40%`) en todos los tokens (claro y oscuro), gradiente de acento, glows de `.btn-hero` y el acento hardcodeado del Hero. El nuevo azul **sí pasa contraste de texto sobre blanco** (el celeste anterior no).
- **Badges sólidos**: se elimina el glassmorphism lavado de `.badge-institutional` sobre secciones planas; el efecto vidrio se conserva solo en los heroes.
- **Radio** (`--radius`): `0.75rem` → `0.5rem` (esquinas más formales sin volverse rígidas).
- **Limpieza de ornamentos**: se eliminan las esferas/blobs decorativos translúcidos de heroes y tarjetas (Donaciones, «¿Qué es IBIME?») y el glow difuso de las tarjetas de video.
- **Hero de Fondo Editorial** unificado: la palabra resaltada y el badge dejan de usar `text-accent` (azul apagado sobre navy) y pasan a blanco/glass, coherentes con Koha, Libro Hablado y Donaciones.
- **CTA `btn-hero`**: se fuerza el fondo acero para que gane a `bg-primary` del `<Button>` de shadcn (antes el CTA quedaba navy sobre hero navy, sin contraste) y se corrige el hover (seguía en el celeste anterior).
- `--destructive` (rojo semántico de error) intacto: no es color de marca.

#### 📝 Documentación
- Corrección de datos desactualizados en `README.md` y `docs/`: puertos de dev (frontend `4000`, backend `3000`), conteo de tests (**384** backend + **35** frontend = **419**), badge de `lint-staged` (v17), cadencia del heartbeat (cada 6h). `CLAUDE.md` incorporado a la rama principal.

---

## [2.5.1] - 2026-07-11
### 🔐 Redis a Render Key Value (red interna) y saneamiento de dependencias

Continuación de la auditoría: cierra el cifrado de la conexión de Redis y limpia deuda de dependencias.

#### 🔒 Seguridad — Redis
- **Migración a Render Key Value** (Redis/Valkey gestionado por Render): el backend y el store viven en la **red privada de Render**, así que el tráfico de Redis (credenciales, email de sesión, contadores de rate-limit) **ya no viaja sin cifrar por internet público**. El plan free de Redis Cloud no ofrecía TLS bajo ninguna circunstancia; esta vía resuelve el cifrado por red interna en vez de por certificados. Solo cambió `REDIS_URL`.
- **Soporte de TLS con CA** (`redis.ts`, `REDIS_CA_CERT`): capacidad opcional para conectar por `rediss://` con validación de certificado (`rejectUnauthorized: true`) contra el CA de un proveedor externo (p. ej. Upstash). Función pura `buildRedisTlsOptions()` con test (6 casos). Inerte con Render Key Value.

#### 🧹 Dependencias
- **`@openrouter/sdk`, `cors`, `@types/express`** eliminados del `package.json` raíz (dependencias muertas).
- **`zod` restaurado en el raíz** tras detectarse que **no** era muerto: la resolución de tipos de `shared/validators/schemas.ts` (que importa `zod`) sube desde `shared/` a `root/node_modules/zod` durante el typecheck; quitarlo rompía el CI en instalaciones limpias. Se restauró en v3 (consistente con la unificación front/back).
- **Dependabot — majors triados**: `redis` 5→6 (mergeado, verificado en prod) y `@types/node` 25→26 (mergeado). Cerrados por incompatibilidad: TypeScript 7 (rompe `typescript-eslint`), React 19 (migración mayor del ecosistema), lucide-react v1 (exports).

---

## [2.5.0] - 2026-07-11
### 🛡️ Auditoría de Seguridad, Observabilidad con Sentry y Migración a Node 22

Auditoría integral del proyecto de punta a punta. Cierra defensas que el diseño asumía pero no tenía, añade visibilidad operativa, sanea la cadena de suministro y alinea el runtime con los requisitos del ecosistema.

#### 🔒 Endurecimiento de Seguridad
- **`trust proxy`** (`app.ts`): detrás del proxy de Render, `req.ip` era la IP del proxy, no la del cliente — el rate-limiting por IP quedaba inutilizado (todos en un mismo cubo) o era evadible vía `X-Forwarded-For`. Con `app.set('trust proxy', 1)` vuelve a ser fiable.
- **`helmet`**: cabeceras de seguridad (nosniff, frameguard, HSTS, sin `X-Powered-By`).
- **`/health` sin fuga**: dejó de exponer `error.message` de la base de datos al cliente (se registra server-side).
- **`/admin/flush-cache` `GET` → `POST`**: limpiar la caché es una operación con efecto secundario, no debe ser cacheable ni disparable por prefetch. Reutiliza el middleware `requireAdminKey` en vez de duplicar la lógica timing-safe.
- **RLS — escrituras anónimas revocadas** (`20260710225726_revoke_anon_writes.sql`, aplicada en producción): la `anon` key viaja en el bundle del frontend (es pública); la política `anon INSERT` permitía escribir directo en `course_registrations`/`contact_messages` saltándose la validación Zod y el rate-limit. El frontend ya escribe solo vía backend (`service_role`, que bypassa RLS), así que revocar `anon` no rompe nada legítimo.

#### 🗄️ Integridad de Datos
- **`UNIQUE(email, course_name)`** (`20260710225735_...`, aplicada en producción) + **`upsert` idempotente** en `RegistrationService.register` (`onConflict: 'email,course_name'`, `ignoreDuplicates`). Sin esto, un usuario podía inscribirse N veces al mismo curso y `cantidad_cursos` se inflaba con duplicados.
- **Reconciliación de migraciones repo ↔ producción** (`supabase/migrations/README.md`): se detectó que la DB había derivado por ediciones de dashboard fuera de banda. Se recuperó la migración huérfana `20260320_ibime_knowledge_setup.sql` (aplicada en prod pero ausente del repo), se renombraron las migraciones nuevas a las versiones registradas, y se documentó la deuda (dos tablas de conocimiento: `knowledge_base`/768 en uso vs `ibime_knowledge`/1536 legado).

#### 🔭 Observabilidad — Sentry
- **Captura de errores y alertas** (`infrastructure/observability/sentry.ts`), *gated* por `SENTRY_DSN`: sin DSN es no-op y el backend funciona idéntico (mismo patrón que Redis/LangSmith). Captura **solo los 500 reales** (los 4xx y 429 no son incidentes), `sendDefaultPii: false`, contexto sin PII.
- **Alerta de cuota diaria de Groq** (`tpd`/`rpd`) con dedup en Redis: una sola alerta por día y tipo, no una por request.

#### ⬆️ Node 20 → 22
- `@supabase/supabase-js` 2.110+ (su `realtime-js`) exige **WebSocket nativo**, disponible desde Node 22. En Node 20, `createClient()` lanzaba `"native WebSocket not found"` al cargar `supabase.config.ts` — rompía el CI y **habría tumbado el backend en Render al arrancar**. Detectado al bisectar el grupo de dependabot que subía supabase-js.
- Actualizado `node-version` en `ci.yml`/`e2e.yml` a 22, `NODE_VERSION` en `render.yaml` a 22.11.0 y `engines` del backend a `>=22`.

#### 🧰 Cadena de Suministro y Calidad
- **`.github/dependabot.yml`**: PRs semanales agrupados (minor/patch) para raíz, backend, frontend y github-actions.
- **`npm audit --audit-level=high`** en CI (backend y frontend), no-bloqueante de momento.
- **Umbrales de cobertura** en `backend/vitest.config.ts` (stmts 82 / branch 74 / funcs 78 / lines 82).
- **`@openrouter/sdk`** eliminado del `package.json` raíz (dependencia muerta, 0 imports).
- **Zod unificado en v3**: el schema compartido lo consumían frontend (v3) y backend (v4) a la vez; entre v3/v4 cambia el regex de `.email()` y el formato de errores. El backend baja a la misma versión del frontend para que valide idéntico en ambos lados.

#### 🔐 Gobernanza de PII
- **`docs/DATA_RETENTION.md`**: inventario de datos personales y encargados del tratamiento (Supabase, Groq, Gemini, Cloudinary, Redis, Render/Vercel), plazos propuestos, mecanismo de purga/respaldo y decisiones que requieren ratificación (aviso de privacidad, derechos ARCO, backup).
- **Funciones de purga inertes** (`20260711120000_data_retention_functions.sql`, **no aplicadas**): `purge_old_contact_messages(dias)` y `purge_person_data(email)` (derecho de supresión). `EXECUTE` revocado para `anon`/`public`; solo `service_role`.

#### 🎨 Frontend
- **Fechas dinámicas** en `NewsSection` e `InstitutionalInfoDisplay`: la fecha de la nota institucional se calcula al render (hoy) en vez de estar hardcodeada.
- **Imagen de donaciones optimizada**: `donaciones.png` (foto 1200×900, **1.13 MB**) → `donaciones.webp` (**~92 KB**, −92%), misma calidad visual.
- **`ScrollToTop`** (con test): al cambiar de ruta desplaza al inicio, evitando que una página nueva abra a media altura.
- **`Navbar`**: hover/activo en azul sólido para mejor contraste; los items de ancla (`#`) ya no quedan marcados como activos de forma permanente.

#### 🧪 Testing
- **Backend: 369 → 378 tests** (nuevos: módulo Sentry, captura de 500/no-captura de 4xx-429, idempotencia de registro, trust proxy, cabeceras helmet, flush-cache por POST).
- **Frontend: +`ScrollToTop.test.tsx`** (35 tests). Total del proyecto: **~413**.

#### 📝 Documentación
- Actualizados `README.md`, `CODE_QUALITY.md`, `CONTRIBUTING.md`, `ARCHITECTURE.md` y `backend/.env.example` (nueva variable `SENTRY_DSN`).
- Nuevos: `docs/DATA_RETENTION.md` y `supabase/migrations/README.md`.

---

## [2.4.0] - 2026-07-09
### 🔄 Migración de Modelo Groq y Vigilancia de Cuota

Groq descomisiona `llama-3.1-8b-instant` el **2026-08-16**, único modelo de inferencia del proyecto. Esta versión migra a `openai/gpt-oss-20b` y convierte los límites del plan en configuración de entorno.

#### ✨ Nuevo
- **Modelo y límites por entorno**: `GROQ_MODEL`, `GROQ_TPM_LIMIT`, `GROQ_RPM_LIMIT`, `GROQ_RPD_LIMIT`, `GROQ_TPD_LIMIT` y `GROQ_SAFETY_MARGIN`. Una futura deprecación o un cambio de plan se resuelven por variable de entorno, sin desplegar. Escalar a `openai/gpt-oss-120b` es cambiar `GROQ_MODEL` y nada más: comparte los cuatro límites del free tier.
- **`GroqRateLimiter` con cuatro ventanas** (`groq-rate-limiter.ts`): TPM y RPM por minuto, RPD y TPD por día UTC, sobre contadores atómicos de Redis. Fail-open si Redis no responde.
- **Margen de seguridad asimétrico**: `GROQ_SAFETY_MARGIN` (0.8) se aplica **solo a las ventanas por minuto**, donde el colchón absorbe ráfagas dentro de la misma ventana de 60s. Las cuotas diarias se consumen íntegras — en 24h no hay ráfaga que absorber y recortar solo regalaría peticiones. Un test bloquea la "corrección por consistencia".

#### 🐛 Corregido
- **Cifras de capacidad de `AI_STRATEGY.md`**: la tabla contaba solo los tokens de salida. Medido en producción (`tokensUsed` de 1473/1512/1523), una respuesta RAG cuesta **~1.512 tokens totales**, no ~300. En consecuencia: el límite que aprieta es el **TPD** (~132 respuestas/día), no las 1.000 requests/día, que nunca se alcanzan; y 10 usuarios simultáneos son ~15.120 TPM, un **236%** del umbral operativo de 6.400, no el 63% que se afirmaba.
- **Diagrama de capas**: citaba `TPM ≤ 4.800`, valor obsoleto. Con `GROQ_TPM_LIMIT=8000` y margen 0,8 son **6.400**.
- **Tabla de saturación**: decía que RPD/TPD cortan al 80%; las ventanas diarias usan la cuota íntegra a propósito.
- **Comentario de cabecera de `groq-rate-limiter.ts`**: repetía la misma afirmación falsa sobre el RPD como límite más estrecho.

> **El coste depende del corpus.** Los ~1.512 tokens corresponden a un contexto RAG de un solo chunk: `MIN_VALID_THRESHOLD = 0.65` descarta el resto pese a que `matchCount` es 5. Si se puebla la base de conocimientos y pasan los cinco, el coste sube hacia ~3.100 tokens y el techo diario cae hacia ~64 respuestas.

---

### 🔭 Observabilidad, Configuración y Seguridad

#### ✨ Nuevo
- **Trazas LangSmith (`infrastructure/observability/tracing.ts`)**: instrumentación del pipeline de chat con sanitización de PII antes de emitir. Degradación elegante — si `LANGSMITH_API_KEY` no está, la app funciona igual.
- **Validación de entorno con Zod (`config/env.config.ts`)**: schema como única fuente de verdad; validación y tipos no pueden divergir. Si falta o está mal formada cualquier variable, se reportan **todos** los problemas a la vez y el arranque aborta.

#### 🔒 Seguridad
- **PII de inscripciones**: `check_registration.tool.ts` es auto-protegida — exige `email` + `phone` y verifica propiedad sin importar el llamador, cerrando el vector de tool-use inseguro del agente.
- **Dependabot**: resueltas las vulnerabilidades reportadas (solo lockfiles).

---

### 🧪 Cobertura de Pruebas y Corrección de la Ingesta de PDFs

#### 🐛 Corregido
- **Ingesta de PDFs rota (`document-processor.service.ts`)**: el código invocaba `pdfParse(buffer)`, la API de `pdf-parse` **v1**. La versión instalada (v2) exporta la clase `PDFParse` y no es invocable, así que **todo `POST /upload-pdf` fallaba** con `Fallo al extraer el texto del PDF`. TypeScript no lo detectaba porque el tipo se anotaba a mano sobre un `require()` sin tipar. Se migra a `new PDFParse({ data }).getText()`.
- **Marcadores de página en el corpus**: el `text` agregado de pdf-parse intercala `-- 1 of 3 --`. Se concatena `pages[].text` para que esos marcadores no acaben indexados como conocimiento.
- **Extractor inyectable**: `DocumentProcessorService` recibe el extractor por constructor (con el real por defecto). `createRequire` esquiva los mocks de Vitest, así que sin esto la función no era testeable.
- **Solapamiento perdido entre el primer y el segundo chunk (`chunkText`)**: el *fallback de seguridad* comparaba `startIndex` contra `chunks.length * (CHUNK_SIZE - CHUNK_OVERLAP)` — una condición que no mide si el índice avanzó — y se disparaba ya en la primera iteración, descartando el overlap del corte 1→2. Ese corte perdía su contexto semántico, justo lo que el solapamiento existe para evitar. Se sustituye por una comprobación de progreso real (`nextStart > startIndex`), que preserva los 200 caracteres en **todos** los cortes y sigue garantizando la terminación cuando un chunk sale más corto que el overlap.

> **Requiere re-ingesta.** El arreglo cambia las fronteras de los chunks: los documentos ya vectorizados conservan el troceado antiguo hasta que se vuelvan a procesar.

#### ✨ Nuevo
- **+100 tests unitarios y de integración** (backend: 269 → 369). Cubren lo que no tenía red:
  - `tracing.ts` — los tres sanitizadores que impiden que la PII salga hacia LangSmith.
  - `admin-auth.middleware.ts` — el guard fail-closed, incluido el caso de `ADMIN_SECRET` ausente.
  - `document-processor.service.ts`, `cache.service.ts`, `session-memory.service.ts`, `tools.service.ts`.
  - Integración del endpoint de chat: contrato HTTP, formato `messages[]` legacy, y la distinción entre el 429 **por minuto** ("intenta en N segundos") y el de **cuota diaria** ("intenta mañana").
  - Integración de los endpoints administrativos: 401 sin clave, con clave inválida, y el guard corriendo antes de parsear el multipart.
- **E2E**: página de criterios de donación (incluido desbordamiento horizontal en móvil) y la UX del asistente al agotarse la cuota.

---

### 🎨 Frontend — Criterios de Donación

#### ✨ Nuevo
- **`DonationCriteriaPage.tsx`**: página completa de criterios de donación, con tests.
- **`InstitutionalInfoDisplay.tsx`**: componente de noticia institucional para la cartelera, con tests.

#### 🔧 Mejoras de Interfaz (UI)
- Contraste visual de la página de criterios de donación; actualización del hero y de los assets de la cartelera.

---

## [2.3.0] - 2026-04-24
### 🧠 Pipeline Empresarial de Ingesta RAG (Conocimiento Institucional)

Esta actualización dota a la plataforma de una arquitectura profesional para la ingesta, procesamiento y vectorización de conocimiento institucional (PDFs) y catálogos dinámicos (Koha), permitiendo que la Inteligencia Artificial responda sin alucinaciones basándose en una base de datos vectorial real.

#### ✨ Nuevo
- **Endpoints de Ingesta (`/api/v1/knowledge`)**: 
  - `POST /upload-pdf`: Procesamiento de archivos PDF en memoria (sin tocar el disco duro, optimizado para plataformas efímeras como Render).
  - `POST /webhook/koha`: Webhook diseñado para recibir JSON arrays generados por automatizaciones en n8n (ej. exportaciones diarias del catálogo Koha).
- **Procesamiento de Documentos (`DocumentProcessorService.ts`)**: Implementación de algoritmos de *Chunking Inteligente* utilizando `pdf-parse`, dividiendo textos largos en fragmentos de 1000 caracteres con 200 caracteres de solapamiento semántico (overlap) para no perder el contexto entre párrafos.
- **Servicio de Vectorización (`KnowledgeIngestionService.ts`)**: Conexión directa con la API de embeddings de Gemini (768 dimensiones) e inserción automatizada en la base de datos `knowledge_base` en Supabase, utilizando el campo JSON `metadata` para clasificar categorías dinámicamente.
- **Single Source of Truth (`system-prompt.ts`)**: Separación estricta de responsabilidades. La identidad núcleo y estática (Directora actual, horarios) vive en RAM mediante el prompt, mientras que el conocimiento extenso (Historia, Reglamentos, Catálogo) vive en la base de datos vectorial.

---

### 🎬 Integración de Videoteca Cultural con Cloudinary

Esta versión introduce una nueva sección en la plataforma web dedicada a preservar y difundir el patrimonio histórico-cultural del Estado Mérida mediante contenido audiovisual optimizado.

#### ✨ Nuevo
- **Sección de Cápsulas Culturales (`CulturalVideosSection.tsx`)**: Nueva área en la landing page principal para la reproducción de videos institucionales (Escritores Merideños, Heroínas de Venezuela).
- **Integración con Cloudinary**: Se incorporó Cloudinary como CDN para el streaming de videos (en lugar de almacenamiento en base de datos) utilizando transformaciones `q_auto` y `f_auto` para un rendimiento máximo.
- **Capa de Utilidades SoC (`lib/cloudinary.ts`)**: Extracción de las funciones generadoras de URLs (para streaming de video y extracción automática de fotogramas clave/portadas vía `so_auto`) garantizando el principio *Separation of Concerns*.
- **Diseño**: La nueva sección hereda el lenguaje visual institucional y los videos usan la API HTML5 nativa, manteniendo la interfaz limpia de logos de terceros (como YouTube/Vimeo).

#### 🔧 Mejoras de Interfaz (UI)
- **Footer (`Footer.tsx`)**: Se reajustaron las proporciones del iframe de Google Maps integrado, mejorando el balance visual con las otras columnas institucionales.

---

## [2.2.0] - 2026-04-16
### 🛡️ Pre-Commit Quality Gate — Husky v9 + lint-staged + ESLint

Esta versión implementa el sistema completo de calidad de código automatizada en la raíz del proyecto.

#### ✨ Nuevo
- **Hook `pre-commit`** (Husky v9): ejecuta `lint-staged` con ESLint `--fix` sobre archivos `*.{js,jsx,ts,tsx}` en staging. Solo se lint-ea lo que se va a commitear.
- **Hook `pre-push` — Quality Gate**: 3 etapas secuenciales (ESLint → TypeScript → Vitest). Si cualquier etapa falla, el push es cancelado con diagnóstico detallado y sugerencias de corrección inteligentes por tipo de error.
- **Scripts en `package.json` raíz**: `lint`, `typecheck`, `test` y `prepare` — delegan a los scripts del frontend para una experiencia de desarrollo unificada.
- **Script `typecheck` en `frontend/package.json`**: `tsc --noEmit` — requerido por el hook pre-push.
- **`CODE_QUALITY.md`**: documentación técnica completa del sistema (hooks, ESLint config, flujo de desarrollador, notas de formato Husky v8 vs v9).

#### 📝 Documentación
- `README.md`: añadidos badges Husky/lint-staged, fila de Calidad de Código en la tabla de stack, tabla de scripts del proyecto, sección completa del Quality Gate, y `CODE_QUALITY.md` en la tabla de documentación adicional.
- `CONTRIBUTING.md`: sección de Sistema de Calidad Automática con descripción de ambos hooks y comando `--no-verify` para casos excepcionales.

---


### 🛡️ Arquitectura Determinista de Seguridad — Auditoría y Consolidación

Esta versión consolida el sistema de control de output del LLM, cierra brechas de seguridad críticas identificadas en auditoría y actualiza toda la documentación técnica.

#### 🔴 Bugs Críticos Resueltos
- **`finalizeResponse` runtime error**: Método llamado en el flow de registro sin email que no existía en la clase `ChatOrchestrator`. Causa de crash en producción en ese path específico.
- **`applyResponsePolicy` código muerto**: La función estaba importada en `ChatOrchestrator` pero nunca era invocada. El sistema usaba un método privado `applyGuardrail()` que llamaba directamente a `checkResponseGuardrail()` omitiendo completamente la capa de Policy (validación de longitud, fallbacks por intent).

#### 🛡️ Mejoras de Seguridad
- **`ResponsePolicy` integrada como única fuerta final**: Todo output LLM ahora pasa por `applyResponsePolicy()`. El LLM nunca es la última capa.
- **Defensa contra bypass del whitelist de registration**: Cuando `isDbBacked=false`, el guardrail se invoca en modo `general` aunque el intent sea `registration`, impidiendo que el whitelist del flow registration pueda ser explotado sin datos reales de DB.
- **System prompt hardened**: Reglas 2-4 redundantes consolidadas en una regla precisa. Fallback hardcoded eliminado del prompt (propiedad exclusiva de ResponsePolicy). Defensa explícita contra prompt injection via contenido RAG.

#### 🧪 Calidad y Testing
- **`response-policy.test.ts` (nuevo, 25 tests)**: Cobertura completa de la única capa que no tenía tests unitarios propios: validación estructural, blocking de alucinaciones, bypass isDbBacked, fallbacks por intent.
- **Total tests**: 175 (150 previos + 25 nuevos) — 100% passing.
- **vitest `^4.1.3` → `^2.1.9`**: Downgrade necesario para compatibilidad con Node.js 18 LTS (vitest 4.x requiere Node ≥ 20.12.0 por dependencia de `rolldown`).

#### 📝 Documentación
- `ARCHITECTURE.md`: Reescrito con diagrama Mermaid del flujo real de decisión + tabla de capas de seguridad.
- `AI_STRATEGY.md`: Corregidos valores incorrectos (threshold `0.4→0.65`, temperatura `0.6→0.2/0.3`, maxTokens `800→400/600`). Añadida descripción de las cuatro capas de defensa.
- `TECHNICAL_DOCUMENTATION.md`: Actualizadas respuestas de defensa para reclutadores con los detalles del sistema determinista.
- `README.md`: Badge de Node.js corregido (`20+` → `18+ LTS`).

---

## [2.0.0] - 2026-04-09
### 🔥 Refactorización Arquitectónica y Optimización de IA

Esta versión marca un hito en la evolución técnica del proyecto, migrando de una lógica serverless simple a un backend robusto y escalable.

#### ✨ Características Principales
- **Migración a Node.js/Express**: Centralización de la lógica de negocio en un backend robusto con TypeScript.
- **Inyección de Dependencias**: Implementación de `tsyringe` para un diseño desacoplado y mantenible.
- **Caché con Redis**: Integración de una capa de caché para embeddings y contextos RAG, reduciendo latencia y costos operativos.
- **Logs Estructurados**: Implementación de **Pino** con correlación de peticiones vía `X-Request-ID`.
- **API Versioning**: Introducción de rutas versionadas bajo `/api/v1/` manteniendo retrocompatibilidad.

#### 🧪 Calidad y Testing
- Configuración de **Vitest** como motor de pruebas oficial.
- Implementación de Unit Tests para servicios core (`Chat`, `RAG`, `Embedding`).
- Reportes de cobertura habilitados (>90% en lógica crítica).

#### 🛡️ Seguridad
- Implementación de **Rate Limiting** dinámico por endpoint.
- Validación de datos estricta con **Zod** en el backend y frontend.

---

## [1.0.0] - Versión Inicial
### 🏛️ Lanzamiento de la Plataforma Institucional

- Portal informativo oficial del IBIME.
- Asistente virtual básico usando Supabase Edge Functions.
- Registro de cursos y formulario de contacto integrados con Supabase.
- Diseño visual basado en Tailwind CSS y shadcn/ui.

---
*Para ver los detalles de commits anteriores, consulta el historial de Git.*
