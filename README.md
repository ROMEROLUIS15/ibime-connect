# 🏛️ IBIME Connect

<div align="center">

**Plataforma Digital Oficial del Instituto Autónomo de Servicios de Bibliotecas e Información del Estado Bolivariano de Mérida, Venezuela.**

[![Live](https://img.shields.io/badge/🌐_Live-ibime--connect.vercel.app-000000?style=for-the-badge)](https://ibime-connect.vercel.app)

---

[![Node.js](https://img.shields.io/badge/Node.js-22+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-pgvector-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Redis](https://img.shields.io/badge/Redis-Cache_+_Session-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io/)
[![Groq](https://img.shields.io/badge/Groq-GPT_OSS_20B-F55036?style=flat-square)](https://groq.com/)
[![Vitest](https://img.shields.io/badge/Vitest-384_Tests-6E9F18?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?style=flat-square&logo=playwright&logoColor=white)](https://playwright.dev/)
[![Deployed on Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com/)
[![Deployed on Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat-square&logo=render&logoColor=black)](https://render.com/)
[![Husky](https://img.shields.io/badge/Husky-v9-blueviolet?style=flat-square)](https://typicode.github.io/husky/)
[![lint-staged](https://img.shields.io/badge/lint--staged-v17-ff69b4?style=flat-square)](https://github.com/lint-staged/lint-staged)

</div>

---

## ¿Qué es IBIME Connect?

IBIME Connect es el ecosistema digital completo del IBIME: una plataforma institucional que integra un **asistente virtual de IA con arquitectura híbrida determinista/probabilística**, registro de cursos, formulario de contacto, galería de eventos y acceso a la Red de Bibliotecas del Estado Mérida.

El motor de chat garantiza **cero alucinaciones en el flujo de inscripciones**: el LLM es completamente excluido del camino crítico cuando existe un email conocido. Toda respuesta final pasa por una cadena de responsabilidad determinista antes de llegar al ciudadano.

---

## ⚡ Stack Tecnológico

| Capa | Tecnologías |
|:---|:---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui |
| **Backend** | Node.js 22, Express 5 (+ `helmet`, `trust proxy`), TypeScript, tsyringe (DI) |
| **Base de Datos** | Supabase (PostgreSQL + pgvector), Render Key Value (Redis/Valkey, red interna) |
| **Media & CDN** | Cloudinary (Streaming de video y fotogramas automáticos) |
| **IA — Embeddings** | Google Gemini (`gemini-embedding-001`, 768 dimensiones) |
| **IA — Ingestion** | `pdf-parse`, `multer` (Procesamiento en memoria y chunking semántico) |
| **IA — Inferencia** | Groq Cloud (`openai/gpt-oss-20b`, configurable vía `GROQ_MODEL`) |
| **Validación** | Zod (esquemas compartidos frontend ↔ backend, incluyendo `sessionId`) |
| **Observabilidad** | Pino (logs JSON + `requestId`), Sentry (errores 500 + alerta de cuota Groq), LangSmith (trazas del chat) |
| **Testing** | Vitest (425 tests: 384 backend + 41 frontend), Playwright (E2E) |
| **Calidad de Código** | Husky v9 + lint-staged + ESLint (pre-commit & pre-push hooks) + Quality Gate completo |
| **CI/CD** | GitHub Actions (+ `npm audit`), Dependabot, Vercel CD, Render CD |

---

## 🏗️ Arquitectura del Motor de Chat (Fase 1 + Fase 2)

El núcleo es un motor de decisión **híbrido**: determinista puro donde la precisión es crítica (flujo de inscripciones), probabilístico controlado en el resto. El LLM **nunca decide el output final**.

```
 ┌─────────────────────────────────────────────────────────────────────┐
 │                    IBIME Chat Pipeline v2                           │
 └─────────────────────────────────────────────────────────────────────┘

 HTTP Request (userMessage, conversationHistory, sessionId?)
   │
   ▼
 ChatController ── Zod validation ── BadRequest si inválido
   │
   ▼
 ChatOrchestrator.process()
   │
   ├─► [1] IntentClassifier   (regex determinista — sin LLM)
   │         ├─ Prioridad 0: regex de email → 'registration'
   │         ├─ 'registration' │ 'catalog' │ 'general'
   │
   ├─► [2] SentimentAnalyzerService   (síncrono, puro, <1ms)
   │         └─ isFrustrated: bool + score (umbral ≥ 2)
   │             ↳ Si frustrado: EMPATHY_ALERT se inyecta al systemPrompt
   │               de Branch B, catalog y general ÚNICAMENTE
   │
   └─► [3] switch(intent)
         │
         ├─[registration] → handleRegistration()
         │     │
         │     ├── Privacy Gate  ←── Redis (fuente autoritativa)
         │     │     └── serverEmail > conversationHistory > mensaje actual
         │     │         Si segundo email detectado → cortocircuito inmediato
         │     │
         │     ├── BRANCH A  [email conocido]
         │     │     sin teléfono → pedir teléfono (verificación de propiedad)
         │     │     con teléfono → throttle → tool.verify(email, phone)
         │     │       verified → lista de cursos | not_verified → genérica
         │     │     formatVerifiedResponse() → determinista
         │     │     LLM: NO LLAMADO. tokensUsed = 0.
         │     │     ← 100% inmune al sentimiento y al LLM
         │     │
         │     └── BRANCH B  [email desconocido]
         │           LLM pide el email (temperature=0.2, tools=[])
         │           empathyPrefix aplicado si isFrustrated=true
         │
         ├─[catalog] → handleCatalog()
         │     RAGService (threshold fail-hard 0.65)
         │     empathyPrefix + CHAT_SYSTEM_PROMPT + RAG context
         │     LLM genera (temp=0.3)
         │
         └─[general] → handleGeneral()
               ¿saludo? → respuesta hardcoded (sin LLM)
               RAG hit   → empathyPrefix + LLM (temp=0.3)
               RAG miss  → handleGeneralFallback() (empathyPrefix + LLM)
   │
   ▼
 ┌──────────────────────────────────────────────────────┐
 │  🛡️  ResponsePolicy  —  ÚLTIMA CAPA ANTES DEL OUTPUT │
 │  ─────────────────────────────────────────────────── │
 │  1. Validación estructural (vacío / <10 / >1500 ch)  │
 │  2. ResponseGuardrail: bloquea alucinaciones de      │
 │     estado de usuario (regex patterns)               │
 │  3. isDbBacked-aware: Branch A exenta del guardrail  │
 │  4. Fallback por intent si cualquier check falla     │
 └──────────────────────────────────────────────────────┘
   │
   ▼
 Output final  (controlado 100% por Policy — nunca por LLM)
```

---

## 🔐 Privacy Gate — Estado de Sesión Autoritativo (Redis)

El Privacy Gate protege el flujo de inscripciones contra inyección de emails cruzados en la misma sesión. Opera en dos fuentes de verdad con jerarquía estricta:

```
Jerarquía de fuentes (mayor a menor confianza):
  1. Redis (sessionMemory.getSessionContext)  ← FUENTE AUTORITATIVA (servidor)
  2. conversationHistory[]                    ← fallback (cliente, menor confianza)
  3. Mensaje actual                           ← primera aparición del email
```

**Funcionamiento:**
1. El frontend (`IBIMEAssistant`) genera un `sessionId` (UUID v4) estable por conversación y lo envía en cada petición; se usa como clave Redis (fuente autoritativa).
2. Si no llega `sessionId` (cliente legacy), se deriva un hash estable del primer mensaje del historial (`SHA-256[:24]`) como fallback.
3. Al capturar el primer email válido, se persiste en Redis con TTL de 30 minutos.
4. Si en un turno posterior aparece un **email diferente** al almacenado en Redis → **cortocircuito inmediato** con mensaje de privacidad, sin consultar la DB.

> **Alcance del Privacy Gate (importante).** El gate evita *cruzar* dos correos dentro de una misma sesión; **no** es un control de propiedad ni de enumeración (la primera consulta de una sesión siempre se atiende, y abrir una sesión nueva es libre). La protección de la PII la aporta la **verificación de propiedad** descrita abajo.

---

## 🔒 Verificación de propiedad de inscripciones (modelo de amenaza)

El endpoint de chat es **público y sin autenticación**. La consulta `consultar_inscripciones` devuelve PII (los talleres asociados a un correo), por lo que se protege con verificación de propiedad + defensa en profundidad.

**Modelo de amenaza y controles:**

| Amenaza | Control | Dónde |
| --- | --- | --- |
| **Mirada puntual** — alguien con tu correo ve tus talleres | **Verificación por teléfono**: la tool no revela nada sin un teléfono que coincida con el registrado | `check_registration.tool.ts`, `chat-orchestrator.ts` (Branch A) |
| **Enumeración de existencia** — descubrir si un correo está registrado | **Respuesta genérica idéntica** para «correo inexistente» y «teléfono no coincide» (`status: not_verified`) | `check_registration.tool.ts` |
| **Fuerza bruta del teléfono** — adivinar el teléfono de un correo conocido | **Throttle por correo** (5 intentos fallidos / 15 min, Redis) + rate-limit por IP del router | `verification-throttle.service.ts`, `api.routes.ts` |
| **Tool-use inseguro del agente** — engañar al LLM para filtrar PII | La tool es **auto-protegida**: exige `email` + `phone` y verifica propiedad sin importar el llamador | `check_registration.tool.ts` |
| **PII en logs** | Auditoría con **correo enmascarado** (`j***@gmail.com`) y nunca en claro | `pii.util.ts`, logs `registration_verification: *` |

**Flujo determinista (sin LLM en la ruta crítica):**
```
email conocido?  ──no──▶  pedir correo (Branch B, LLM solo pregunta)
   │ sí
   ▼
teléfono conocido?  ──no──▶  pedir teléfono (mensaje determinista)
   │ sí
   ▼
throttle por correo  ──bloqueado──▶  mensaje de seguridad (sin tocar la DB)
   │ permitido
   ▼
tool.verify(email, phone)
   ├─ verified      → lista de cursos (reset throttle)
   └─ not_verified  → respuesta GENÉRICA (recordFailure throttle)
```

**Comparación de teléfono tolerante a formato** (`phone.util.ts`): se comparan los últimos 7 dígitos, ignorando prefijo país, espacios y separadores, para no penalizar al usuario legítimo por el formato.

**Riesgo residual (decisión consciente).** La verificación por teléfono asume que el teléfono es un secreto razonable; no es infalible si un atacante ya conoce correo **y** teléfono de la víctima. Se consideró OTP por email (más fuerte) pero se descartó por falta de infraestructura de correo y por fricción desproporcionada para un dato de sensibilidad moderada. El throttle + rate-limit acotan la fuerza bruta del segundo factor.

---

## 🧠 Capa de Inteligencia Emocional — SentimentAnalyzerService

Servicio síncrono puro (`@singleton()`), sin I/O, latencia <1ms. Opera **antes** del switch de intents y **nunca afecta Branch A**.

| Regla | Señal detectada | Puntos |
|:---|:---|:---:|
| **Caps sostenidas** | >70% del texto en mayúsculas (mensaje >6 chars) | +2 |
| **Alta señal** | `pésimo`, `no funciona`, `horrible`, `harto`, `no sirve`, etc. | +2 c/u |
| **Señal media** | `error`, `ayuda`, `humano`, `no entiendo`, `urgente`, etc. | +1 c/u |
| **Abuso de signos** | `!!!` o `???` (3+ consecutivos) | +2 |

**Umbral de frustración: score ≥ 2.**

Cuando `isFrustrated = true`, el sistema inyecta al inicio del `systemPrompt` en Branch B, catalog y general:
> *"ALERTA DE FRUSTRACIÓN: El usuario está experimentando problemas o molestia. Adopta un tono de máxima empatía humana, sé breve, valida su frustración de inmediato, y recuérdale con total cortesía que si lo prefiere puede llamarnos directamente al 0274-2623898 para asistencia manual."*

---

## 🛡️ Capas de Seguridad de IA (5 niveles)

| # | Capa | Módulo | Cuándo actúa |
|:---:|:---|:---|:---|
| 1 | **IntentClassifier** | `intent-classifier.ts` | Pre-LLM. Routing sin modelo. Email regex en Prioridad 0. |
| 2 | **Privacy Gate + Redis** | `chat-orchestrator.ts` + `session-memory.service.ts` | Pre-Branch A/B. Bloquea email-switching cross-turn. |
| 3 | **RAG Threshold** | `rag.service.ts` | Pre-LLM. Fail-hard si similitud < 0.65. |
| 4 | **ResponseGuardrail** | `response-guardrail.ts` | Post-LLM. Detecta alucinaciones de user-state. |
| 5 | **ResponsePolicy** | `response-policy.ts` | Post-LLM. Última puerta. Fallback por intent. |

---

## 📂 Estructura Completa del Proyecto

```
ibime-connect/
│
├── 📁 .github/
│   ├── dependabot.yml              ← Actualizaciones semanales agrupadas (raíz, back, front, actions)
│   └── workflows/
│       ├── ci.yml                  ← CI (Node 22): npm audit + Lint + Typecheck + 384 Vitest
│       ├── e2e.yml                 ← E2E: Playwright (Chromium automations)
│       └── heartbeat.yml           ← Cron: ping Supabase + Render cada 6h
│
├── 📁 backend/
│   ├── src/
│   │   ├── app.ts
│   │   ├── index.ts
│   │   │
│   │   ├── 📁 config/
│   │   │   ├── env.config.ts       ← Variables de entorno validadas con Zod al arranque (schema = tipos, process.exit si faltan/mal formato)
│   │   │   └── supabase.config.ts
│   │   │
│   │   ├── 📁 controllers/
│   │   │   ├── chat.controller.ts  ← Extrae sessionId del body validado
│   │   │   ├── contact.controller.ts
│   │   │   ├── knowledge.controller.ts
│   │   │   └── registration.controller.ts
│   │   │
│   │   ├── 📁 domain/
│   │   │   ├── errors/app-error.ts
│   │   │   └── interfaces/index.ts ← ILLMProvider, IEmbeddingService, IKnowledgeRepository
│   │   │
│   │   ├── 📁 infrastructure/
│   │   │   ├── cache/
│   │   │   │   ├── cache.service.ts ← Wrapper Redis (graceful degradation)
│   │   │   │   └── redis.ts         ← Cliente Redis con TLS auto-detect y reconexión
│   │   │   ├── di/
│   │   │   │   └── container.ts     ← tsyringe: LLM, RAG, SessionMemory, SentimentAnalyzer
│   │   │   ├── logger/index.ts      ← Pino + contextLogger(requestId)
│   │   │   ├── observability/
│   │   │   │   ├── sentry.ts         ← Captura de 500 + alerta de cuota Groq (no-op sin SENTRY_DSN)
│   │   │   │   └── tracing.ts        ← Trazas LangSmith con sanitización de PII
│   │   │   ├── providers/
│   │   │   │   ├── groq.provider.ts
│   │   │   │   └── groq-rate-limiter.ts  ← 4 ventanas (TPM/RPM/RPD/TPD) sobre Redis
│   │   │   └── repositories/knowledge.repository.ts
│   │   │
│   │   ├── 📁 middlewares/
│   │   │   └── error.middleware.ts
│   │   │
│   │   ├── 📁 modules/chat/         ← Motor del asistente virtual
│   │   │   ├── chat-orchestrator.ts ← Orquestador: routing + sentiment + privacy gate
│   │   │   ├── email-validator.ts
│   │   │   ├── intent-classifier.ts ← Regex determinista (Prioridad 0: email regex)
│   │   │   ├── response-guardrail.ts
│   │   │   ├── response-policy.ts
│   │   │   └── system-prompt.ts
│   │   │
│   │   ├── 📁 routes/
│   │   │   ├── api.routes.ts
│   │   │   ├── chat.routes.ts
│   │   │   └── knowledge.routes.ts
│   │   │
│   │   ├── 📁 services/
│   │   │   ├── chat.service.ts              ← Thin wrapper → ChatOrchestrator
│   │   │   ├── contact.service.ts
│   │   │   ├── document-processor.service.ts
│   │   │   ├── embedding.service.ts
│   │   │   ├── knowledge-ingestion.service.ts
│   │   │   ├── rag.service.ts
│   │   │   ├── registration.service.ts
│   │   │   ├── sentiment-analyzer.service.ts ← [FASE 2] Análisis emocional síncrono
│   │   │   ├── session-memory.service.ts     ← [FASE 1] Estado de sesión via Redis
│   │   │   ├── tools.service.ts
│   │   │   └── tools/
│   │   │       └── check_registration.tool.ts
│   │   │
│   │   └── 📁 __tests__/            ← 384 unit tests
│   │       ├── setup.ts             ← [NUEVO] Polyfill reflect-metadata para tsyringe/Vitest
│   │       ├── api.integration.test.ts
│   │       ├── domain/errors/app-error.test.ts
│   │       ├── infrastructure/
│   │       │   ├── providers/groq.provider.test.ts
│   │       │   └── repositories/knowledge.repository.test.ts
│   │       ├── middlewares/error.middleware.test.ts
│   │       ├── modules/chat/
│   │       │   ├── chat-orchestrator.test.ts
│   │       │   ├── email-validator.test.ts
│   │       │   ├── intent-classifier.test.ts
│   │       │   ├── response-guardrail.test.ts
│   │       │   └── response-policy.test.ts
│   │       └── services/
│   │           ├── chat.service.test.ts
│   │           ├── contact.service.test.ts
│   │           ├── embedding.service.test.ts
│   │           ├── rag.service.test.ts
│   │           ├── registration.service.test.ts
│   │           └── sentiment-analyzer.service.test.ts ← [FASE 2] 13 tests
│   │
│   ├── tsconfig.json
│   ├── vitest.config.ts            ← setupFiles: ['src/__tests__/setup.ts']
│   ├── .env.example
│   └── package.json
│
├── 📁 frontend/
│   ├── src/
│   │   ├── main.tsx / App.tsx
│   │   ├── pages/
│   │   ├── components/
│   │   │   └── IBIMEAssistant.tsx  ← Widget de chat (genera sessionId UUID v4 estable y lo envía al backend)
│   │   ├── domain/ports/AssistantPort.ts
│   │   ├── application/use-cases/AskAssistantUseCase.ts
│   │   └── infrastructure/adapters/BackendAssistantAdapter.ts
│   ├── tailwind.config.ts / vite.config.ts / tsconfig.json
│   └── package.json
│
├── 📁 shared/
│   ├── types/domain.ts
│   ├── validators/schemas.ts       ← chatRequestSchema con sessionId?: UUID
│   └── package.json               ← "type": "module" (resolución ESM Node v24)
│
├── 📁 e2e/
├── 📁 docs/
│   ├── AI_STRATEGY.md
│   ├── ARCHITECTURE.md             ← Arquitectura híbrida + seguridad HTTP + observabilidad
│   ├── CHANGELOG.md
│   ├── CODE_QUALITY.md
│   ├── CONTRIBUTING.md
│   └── DATA_RETENTION.md           ← Política de retención/respaldo de PII (propuesta)
│
├── 📁 supabase/migrations/
│   └── README.md                   ← Estado real del esquema y reconciliación repo↔prod
│
├── render.yaml
├── playwright.config.ts
└── package.json
```

---

## 🧪 Pirámide de Testing

```
          ╔══════════════════════╗
          ║   E2E (Playwright)   ║  ← chat, formularios y Servicios (lightbox de mapas) con mock API
          ╠══════════════════════╣
          ║  Integration Tests   ║  ← Smoke tests HTTP (supertest)
          ╠══════════════════════╣
          ║   Unit Tests (384)    ║  ← Vitest — lógica, servicios, policy layer
          ╚══════════════════════╝
```

| Suite | Archivo | Tests | Cubre |
|:---|:---|:---:|:---|
| Intent Classifier | `intent-classifier.test.ts` | 29 | Regex + Prioridad 0 (email en cualquier mensaje) |
| Email Validator | `email-validator.test.ts` | 17 | RFC format, normalización |
| Response Guardrail | `response-guardrail.test.ts` | 18 | Hallucination blocking |
| Response Policy | `response-policy.test.ts` | 25 | Estructural + guardrail + fallbacks |
| Chat Orchestrator | `chat-orchestrator.test.ts` | 20 | Branch A/B, Privacy Gate, routing, sentiment |
| **Sentiment Analyzer** | **`sentiment-analyzer.service.test.ts`** | **13** | **4 reglas heurísticas, combinaciones, falsos positivos** |
| RAG Service | `rag.service.test.ts` | 3 | Threshold, cache, error handling |
| Groq Provider | `groq.provider.test.ts` | 18 | API calls, tokens, error cases |
| Registration | `registration.service.test.ts` | 10 | DB insert/query |
| **Total** | | **384** | **100% passing, 0 errores TypeScript** |

```bash
# Ejecutar todos los unit tests
npm run test --prefix backend

# Con reporte de cobertura
npm run test:coverage --prefix backend

# E2E
npx playwright test
```

---

## 🚀 Instalación y Ejecución Local

### Prerrequisitos
- **Node.js 22+** (obligatorio: `@supabase/supabase-js` 2.110+ requiere el `WebSocket` nativo de Node 22)
- Redis (local, o gestionado — en producción: **Render Key Value**, red interna de Render)
- Supabase con pgvector habilitado
- API keys: Groq, Google Gemini

### Setup

```bash
git clone <repo-url> && cd ibime-connect
npm install
npm install --prefix backend
npm install --prefix frontend
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm run dev
#  Frontend: http://localhost:4000
#  Backend:  http://localhost:3000
```

### Variables de entorno requeridas (backend)

| Variable | Descripción |
|:---|:---|
| `GROQ_API_KEY` | API key de Groq Cloud |
| `GROQ_MODEL` | Opcional. Modelo de inferencia en Groq (default: `openai/gpt-oss-20b`) |
| `GEMINI_API_KEY` | API key de Google Gemini |
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key |
| `REDIS_URL` | URL Redis (`redis://` o `rediss://` para TLS) |
| `ADMIN_SECRET` | Secret para `/admin/flush-cache` (POST) y endpoints de ingesta |
| `SENTRY_DSN` | Opcional. Si se define, activa la captura de errores y alertas de cuota (no-op sin él) |

---

## 🔒 Calidad de Código — Quality Gate Completo

Cada `git commit` y `git push` pasa por validación automática con **Husky v9** + **lint-staged** + **ESLint**.

### `git commit` → `pre-commit`
ESLint con auto-fix exclusivamente sobre archivos en staging.

### `git push` → `pre-push` (3 etapas secuenciales)
```
[1/3] ESLint       → npm run lint       (frontend + backend)
[2/3] TypeScript   → tsc --noEmit
[3/3] Vitest       → vitest run         (425 tests: 384 back + 41 front)
```

### CI/CD (GitHub Actions)
1. **`ci.yml`**: Quality Gate rápido (~40s) — lint + 425 tests (384 back + 41 front).
2. **`e2e.yml`**: Playwright E2E con Chromium (~3-4 min).

> 📄 Documentación completa: [`CODE_QUALITY.md`](./docs/CODE_QUALITY.md)

---

## 🌿 Estrategia de Ramas (GitHub Flow)

| Rama | Propósito |
|:---|:---|
| `main` | **Producción.** Vinculada a Vercel CD y Render CD. |
| `develop` | Integración de features antes de pasar a `main`. |
| `feature/*` | Nuevas funcionalidades (ej: `feature/sentiment-detection`). |
| `fix/*` | Correcciones de bugs. |
| `docs/*` | Actualizaciones de documentación. |

---

## ♾️ Alta Disponibilidad (Free Tier)

```
┌──────────────┬──────────────────────────────────────┐
│ Supabase     │ GitHub Action heartbeat: ping cada 6h │
├──────────────┼──────────────────────────────────────┤
│ Render       │ UptimeRobot HTTP monitor cada 14 min  │
├──────────────┼──────────────────────────────────────┤
│ Render KV    │ Red interna de Render → siempre activo │
└──────────────┴──────────────────────────────────────┘
```

---

## 🛡️ Seguridad

| Mecanismo | Implementación |
|:---|:---|
| **Cabeceras HTTP** | `helmet` (nosniff, frameguard, HSTS, sin `X-Powered-By`) |
| **IP real tras proxy** | `trust proxy` → el rate-limiting por IP es fiable y no evadible vía `X-Forwarded-For` |
| **Validación de entrada** | Zod `chatRequestSchema` (incluye `sessionId?: UUID`) |
| **Privacy Gate** | Redis como fuente autoritativa del email de sesión |
| **Rate Limiting** | `express-rate-limit` por endpoint |
| **RLS de PII** | `anon` sin escritura; solo `service_role` (backend) muta `course_registrations`/`contact_messages` |
| **Admin auth** | `crypto.timingSafeEqual` SHA-256 |
| **Prompt hardening** | System prompt sin lógica de negocio |
| **Guardrail post-LLM** | Regex bloquea alucinaciones de user-state |
| **ResponsePolicy** | Última capa: estructural + fallbacks por intent |
| **Graceful degradation** | Redis caído → bypass automático, sistema continúa operando |

---

## 📚 Documentación Adicional

| Documento | Contenido |
|:---|:---|
| [`ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Diagramas de la arquitectura híbrida Fase 1+2, capas de seguridad |
| [`AI_STRATEGY.md`](./docs/AI_STRATEGY.md) | RAG, parámetros de inferencia, anti-alucinación |
| [`CODE_QUALITY.md`](./docs/CODE_QUALITY.md) | Husky, lint-staged, ESLint, Quality Gate |
| [`CHANGELOG.md`](./docs/CHANGELOG.md) | Historial de versiones |
| [`CONTRIBUTING.md`](./docs/CONTRIBUTING.md) | Guía para contribuidores (requiere Node 22+) |
| [`DATA_RETENTION.md`](./docs/DATA_RETENTION.md) | Política de retención y respaldo de PII (propuesta) |
| [`supabase/migrations/README.md`](./supabase/migrations/README.md) | Estado del esquema y reconciliación repo↔producción |

---

<div align="center">

**© 2026 Instituto Autónomo de Servicios de Bibliotecas e Información del Estado Bolivariano de Mérida**

*Innovación tecnológica al servicio de la cultura y el conocimiento.*

</div>
