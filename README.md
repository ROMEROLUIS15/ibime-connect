# 🏛️ IBIME Connect

<div align="center">

**Plataforma Digital Oficial del Instituto Autónomo de Servicios de Bibliotecas e Información del Estado Bolivariano de Mérida, Venezuela.**

[![Live](https://img.shields.io/badge/🌐_Live-ibime--connect.vercel.app-000000?style=for-the-badge)](https://ibime-connect.vercel.app)

---

[![Node.js](https://img.shields.io/badge/Node.js-18+_LTS-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-pgvector-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Redis](https://img.shields.io/badge/Redis-Cache-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io/)
[![Groq](https://img.shields.io/badge/Groq-Llama_3.1-F55036?style=flat-square)](https://groq.com/)
[![Vitest](https://img.shields.io/badge/Vitest-175_Tests-6E9F18?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?style=flat-square&logo=playwright&logoColor=white)](https://playwright.dev/)
[![Deployed on Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com/)
[![Deployed on Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat-square&logo=render&logoColor=black)](https://render.com/)
[![Husky](https://img.shields.io/badge/Husky-v9-blueviolet?style=flat-square)](https://typicode.github.io/husky/)
[![lint-staged](https://img.shields.io/badge/lint--staged-v16-ff69b4?style=flat-square)](https://github.com/lint-staged/lint-staged)

</div>

---

## ¿Qué es IBIME Connect?

IBIME Connect es el ecosistema digital completo del IBIME: una plataforma institucional que integra un **asistente virtual de IA con arquitectura RAG**, registro de cursos, formulario de contacto, galería de eventos y acceso a la Red de Bibliotecas del Estado Mérida.

El sistema está construido bajo principios de **Arquitectura Limpia**, con un motor de chat que garantiza que el LLM **nunca controla el output final** — toda respuesta pasa por una cadena de responsabilidad determinista antes de llegar al ciudadano.

---

## ⚡ Stack Tecnológico

| Capa | Tecnologías |
|:---|:---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui |
| **Backend** | Node.js 18 LTS, Express 5, TypeScript, tsyringe (DI) |
| **Base de Datos** | Supabase (PostgreSQL + pgvector), Redis Cloud |
| **IA — Embeddings** | Google Gemini (`gemini-embedding-001`, 768 dimensiones) |
| **IA — Inferencia** | Groq Cloud (`llama-3.1-8b-instant`) |
| **Validación** | Zod (esquemas compartidos frontend ↔ backend) |
| **Observabilidad** | Pino (logs estructurados JSON + `requestId` por petición) |
| **Testing** | Vitest (175 unit tests), Playwright (E2E) |
| **Calidad de Código** | Husky v9 + lint-staged + ESLint (pre-commit & pre-push hooks) + Quality Gate completo |
| **CI/CD** | GitHub Actions, Vercel CD, Render CD |

---

## 🏗️ Arquitectura del Motor de Chat

El corazón del sistema es un motor de decisión **lineal y determinista**. El modelo de lenguaje nunca decide el routing ni el output final.

```
 ┌─────────────────────────────────────────────────────────────────┐
 │                     IBIME Chat Pipeline                         │
 └─────────────────────────────────────────────────────────────────┘

 Request
   │
   ▼
 ChatController ── Zod schema validation ── BadRequest si inválido
   │
   ▼
 ChatOrchestrator
   │
   ├─► IntentClassifier (regex determinista — sin LLM)
   │     ├─ "registration" → consulta personal de inscripciones
   │     ├─ "catalog"      → catálogo de cursos disponibles
   │     └─ "general"      → información institucional / saludo
   │
   ├─[registration]
   │     ├─ sin email → respuesta hardcoded determinista (sin LLM)
   │     └─ con email → RegistrationService.findByEmail() [DB directo]
   │                        └─ LLM formatea resultado (temp=0.2)
   │
   ├─[catalog]
   │     └─ RAGService (threshold fail-hard 0.65)
   │           └─ LLM genera desde contexto RAG (temp=0.3)
   │
   └─[general]
         ├─ ¿saludo? → respuesta hardcoded (sin LLM, sin RAG)
         └─ RAGService → LLM genera (temp=0.3)
               └─ RAG miss → LLM fallback (temp=0.3)
   │
   ▼
 ┌──────────────────────────────────────────────────────┐
 │  🛡️  ResponsePolicy  —  ÚLTIMA CAPA ANTES DEL OUTPUT │
 │  ─────────────────────────────────────────────────── │
 │  1. Validación estructural (vacío / <10 / >1500 ch)  │
 │  2. ResponseGuardrail: bloquea alucinaciones de      │
 │     estado de usuario (regex patterns)               │
 │  3. isDbBacked-aware: sin datos DB → guardrail       │
 │     siempre activo, sin importar el intent           │
 │  4. Fallback por intent si cualquier check falla     │
 └──────────────────────────────────────────────────────┘
   │
   ▼
 Output final  (controlado 100% por Policy — nunca por LLM)
```

### ¿Por qué esta arquitectura?

> En sistemas LLM de producción institucional, el modelo de lenguaje **no puede ser la última línea de defensa**. Una alucinación que diga "no estás registrado" a un ciudadano registrado genera desconfianza institucional irreversible.
>
> La solución: el LLM solo **formatea** o **genera texto libre**. Toda decisión de negocio, routing y validación de output es del sistema.

---

## 🛡️ Capas de Seguridad de IA

| # | Capa | Módulo | Cuándo actúa |
|:---:|:---|:---|:---|
| 1 | **IntentClassifier** | `intent-classifier.ts` | Pre-LLM. Enruta sin modelo. |
| 2 | **RAG Threshold** | `rag.service.ts` | Pre-LLM. Fail-hard si similitud < 0.65. |
| 3 | **ResponseGuardrail** | `response-guardrail.ts` | Post-LLM. Detecta alucinaciones de user-state. |
| 4 | **ResponsePolicy** | `response-policy.ts` | Post-LLM. Última puerta. Fallback por intent. |

---

## 📂 Estructura Completa del Proyecto

```
ibime-connect/                          ← Monorepo raíz
│
├── 📁 .github/
│   └── workflows/
│       ├── heartbeat.yml               ← Cron: ping Supabase cada 24h (anti-pausa)
│       └── test.yml                    ← CI: lint + unit tests en cada PR
│
├── 📁 backend/                         ← API Node.js/Express/TypeScript
│   ├── src/
│   │   ├── app.ts                      ← Express app: middlewares, rutas, CORS
│   │   ├── index.ts                    ← Entry point: servidor HTTP + Redis init
│   │   │
│   │   ├── 📁 config/
│   │   │   ├── env.config.ts           ← Variables de entorno validadas con Zod
│   │   │   └── supabase.config.ts      ← Cliente Supabase (singleton)
│   │   │
│   │   ├── 📁 controllers/             ← HTTP handlers (validan, delegan, responden)
│   │   │   ├── chat.controller.ts
│   │   │   ├── contact.controller.ts
│   │   │   └── registration.controller.ts
│   │   │
│   │   ├── 📁 domain/                  ← Núcleo: contratos sin dependencias externas
│   │   │   ├── errors/
│   │   │   │   └── app-error.ts        ← Jerarquía de errores tipados (400/401/403/404/429/500)
│   │   │   └── interfaces/
│   │   │       └── index.ts            ← ILLMProvider, IEmbeddingService, IKnowledgeRepository
│   │   │
│   │   ├── 📁 infrastructure/          ← Implementaciones técnicas (I/O, external APIs)
│   │   │   ├── cache/
│   │   │   │   ├── cache.service.ts    ← Wrapper Redis: get/set/del/clear + graceful degradation
│   │   │   │   └── redis.ts            ← Conexión Redis con reconexión automática
│   │   │   ├── di/
│   │   │   │   └── container.ts        ← tsyringe DI container (LLM, RAG, Chat wiring)
│   │   │   ├── logger/
│   │   │   │   └── index.ts            ← Pino logger + contextLogger(requestId)
│   │   │   ├── providers/
│   │   │   │   └── groq.provider.ts    ← ILLMProvider impl: Groq API (Llama 3.1)
│   │   │   └── repositories/
│   │   │       └── knowledge.repository.ts ← IKnowledgeRepository: pgvector similarity search
│   │   │
│   │   ├── 📁 middlewares/
│   │   │   └── error.middleware.ts     ← Error handler centralizado + requestId injection
│   │   │
│   │   ├── 📁 modules/chat/            ← Motor del asistente virtual (núcleo de IA)
│   │   │   ├── chat-orchestrator.ts    ← Orquestador principal: routing + coordinación
│   │   │   ├── email-validator.ts      ← Validación estricta RFC (pre-DB query)
│   │   │   ├── intent-classifier.ts    ← Clasificador regex determinista (sin LLM)
│   │   │   ├── response-guardrail.ts   ← Detector post-LLM de alucinaciones user-state
│   │   │   ├── response-policy.ts      ← Última capa: validación + guardrail + fallbacks
│   │   │   └── system-prompt.ts        ← Prompt institucional hardened (sin lógica de negocio)
│   │   │
│   │   ├── 📁 routes/
│   │   │   ├── api.routes.ts           ← Rutas v1 + legacy + admin flush-cache (timing-safe)
│   │   │   └── chat.routes.ts          ← Sub-router de chat
│   │   │
│   │   ├── 📁 services/                ← Orquestación de lógica de negocio
│   │   │   ├── chat.service.ts         ← Thin wrapper legacy → ChatOrchestrator
│   │   │   ├── contact.service.ts      ← Inserción de mensajes de contacto en DB
│   │   │   ├── embedding.service.ts    ← Google Gemini embeddings (768 dims)
│   │   │   ├── rag.service.ts          ← RAGService: embedding + similarity search + cache
│   │   │   ├── registration.service.ts ← Consulta e inscripción de cursos (Supabase)
│   │   │   ├── tools.service.ts        ← Dispatcher de herramientas LLM (legacy)
│   │   │   └── tools/
│   │   │       └── check_registration.tool.ts ← Tool definition (desactivado, DB-directo)
│   │   │
│   │   └── 📁 __tests__/              ← Suite de tests unitarios (175 tests)
│   │       ├── api.integration.test.ts ← Smoke tests HTTP con supertest
│   │       ├── domain/errors/
│   │       │   └── app-error.test.ts
│   │       ├── infrastructure/
│   │       │   ├── providers/
│   │       │   │   └── groq.provider.test.ts
│   │       │   └── repositories/
│   │       │       └── knowledge.repository.test.ts
│   │       ├── middlewares/
│   │       │   └── error.middleware.test.ts
│   │       ├── modules/chat/
│   │       │   ├── chat-orchestrator.test.ts   ← 13 tests: routing, flows, intent integration
│   │       │   ├── email-validator.test.ts      ← 17 tests: RFC validation
│   │       │   ├── intent-classifier.test.ts   ← 25 tests: regex patterns + edge cases
│   │       │   ├── response-guardrail.test.ts  ← 18 tests: hallucination blocking
│   │       │   └── response-policy.test.ts     ← 25 tests: full policy layer coverage
│   │       └── services/
│   │           ├── chat.service.test.ts
│   │           ├── contact.service.test.ts
│   │           ├── embedding.service.test.ts
│   │           ├── rag.service.test.ts
│   │           └── registration.service.test.ts
│   │
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── .env.example
│   └── package.json
│
├── 📁 frontend/                        ← SPA React/Vite/TypeScript
│   ├── src/
│   │   ├── main.tsx                    ← Entry point React
│   │   ├── App.tsx                     ← Router + layout global
│   │   │
│   │   ├── 📁 pages/
│   │   │   ├── Index.tsx               ← Landing page principal
│   │   │   ├── FondoEditorialPage.tsx
│   │   │   ├── KohaPage.tsx            ← Integración OPAC Koha
│   │   │   ├── LibroHabladoPage.tsx
│   │   │   └── NotFound.tsx
│   │   │
│   │   ├── 📁 components/              ← UI components (secciones del landing)
│   │   │   ├── IBIMEAssistant.tsx      ← Chat widget del asistente IA
│   │   │   ├── HeroSection.tsx
│   │   │   ├── ServicesSection.tsx
│   │   │   ├── AboutIBIMESection.tsx
│   │   │   ├── EventsSection.tsx
│   │   │   ├── GallerySection.tsx
│   │   │   ├── NewsSection.tsx
│   │   │   ├── ContactSection.tsx
│   │   │   ├── RegistrationModal.tsx
│   │   │   ├── Navbar.tsx / NavLink.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── FloatingButtons.tsx
│   │   │   ├── MissionVisionSection.tsx
│   │   │   ├── VisitorCounter.tsx
│   │   │   └── ui/                     ← shadcn/ui primitives (Radix UI)
│   │   │
│   │   ├── 📁 domain/ports/
│   │   │   └── AssistantPort.ts        ← Interfaz del asistente (Clean Architecture)
│   │   │
│   │   ├── 📁 application/use-cases/
│   │   │   └── AskAssistantUseCase.ts  ← Caso de uso: envío de pregunta al backend
│   │   │
│   │   ├── 📁 infrastructure/adapters/
│   │   │   └── BackendAssistantAdapter.ts ← Implementa AssistantPort → HTTP API
│   │   │
│   │   ├── 📁 hooks/                   ← Custom React hooks
│   │   ├── 📁 services/                ← Clientes HTTP (contact, events)
│   │   ├── 📁 lib/                     ← Utilidades (api-url, scroll, animations)
│   │   └── 📁 test/                    ← Tests unitarios frontend (Vitest)
│   │
│   ├── public/
│   ├── tailwind.config.ts
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── 📁 shared/                          ← Single Source of Truth (frontend + backend)
│   ├── types/
│   │   └── domain.ts                   ← Tipos de dominio: ChatResponse, ChatRequest, etc.
│   └── validators/
│       └── schemas.ts                  ← Esquemas Zod compartidos (validación unificada)
│
├── 📁 supabase/                        ← Base de datos como código
│   ├── config.toml
│   └── migrations/
│       ├── 20260223162342_*.sql        ← Tablas base (cursos, inscripciones)
│       ├── 20260313162500_*.sql        ← Tablas eventos y contacto + RLS policies
│       ├── 20260313163500_*.sql        ← Fix RLS anon
│       ├── 20260319110000_*.sql        ← Habilitación pgvector
│       ├── 20260319120000_*.sql        ← Índice HNSW + función RPC similarity search
│       └── 20260320_*.sql             ← Seed base de conocimientos IBIME
│
├── 📁 e2e/                             ← Tests E2E con Playwright
│   ├── chat.spec.ts                    ← Flujo completo del asistente (con mock API)
│   └── forms.spec.ts                   ← Registro + contacto (con mock API)
│
├── 📁 docs/                            ← Documentación técnica y estratégica del proyecto
│   ├── AI_STRATEGY.md                  ← Arquitectura detallada del motor de IA
│   ├── ARCHITECTURE.md                 ← Patrones arquitectónicos y diagramas
│   ├── CHANGELOG.md                    ← Historial de versiones
│   ├── CODE_QUALITY.md                 ← Guía de pre-commit, ESLint y CI Pipeline
│   └── CONTRIBUTING.md                 ← Guía para contribuidores
│
├── 📄 render.yaml                      ← IaC: configuración de Render (backend)
├── 📄 playwright.config.ts             ← Config E2E: base URL, retries, reporters
├── 📄 tsconfig.backend.json            ← TSConfig raíz para el backend
└── 📄 package.json                     ← Orquestador monorepo (scripts paralelos)
```

---

## 🧪 Pirámide de Testing

```
          ╔══════════════════════╗
          ║   E2E (Playwright)   ║  ← 2 specs: chat + forms con mock API
          ╠══════════════════════╣
          ║  Integration Tests   ║  ← Smoke tests HTTP (supertest)
          ╠══════════════════════╣
          ║    Unit Tests (175)  ║  ← Vitest — lógica, servicios, policy layer
          ╚══════════════════════╝
```

| Suite | Archivo | Tests | Cubre |
|:---|:---|:---:|:---|
| Intent Classifier | `intent-classifier.test.ts` | 25 | Regex registration/catalog/general + edge cases |
| Email Validator | `email-validator.test.ts` | 17 | RFC format, normalización, null/undefined |
| Response Guardrail | `response-guardrail.test.ts` | 18 | Hallucination blocking por flow |
| **Response Policy** | **`response-policy.test.ts`** | **25** | **Full policy: estructural + guardrail + fallbacks** |
| Chat Orchestrator | `chat-orchestrator.test.ts` | 13 | Routing, flows, intent integration |
| RAG Service | `rag.service.test.ts` | 3 | Threshold, cache, error handling |
| Groq Provider | `groq.provider.test.ts` | 15 | API calls, tokens, error cases |
| Registration | `registration.service.test.ts` | 10 | DB insert/query, Supabase errors |
| **Total** | | **175** | **100% passing** |

```bash
# Ejecutar todos los unit tests
npm run test --prefix backend

# Con reporte de cobertura
npm run test:coverage --prefix backend

# E2E (requiere frontend corriendo)
npx playwright test
```

---

## 🚀 Instalación y Ejecución Local

### Prerrequisitos
- Node.js 18+ LTS
- Redis (local o Redis Cloud)
- Cuenta Supabase con pgvector habilitado
- API keys: Groq, Google Gemini

### Setup

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd ibime-connect

# 2. Instalar dependencias (monorepo + backend + frontend)
#    npm install también inicializa Husky automáticamente vía el script "prepare"
npm install
npm install --prefix backend
npm install --prefix frontend

# 3. Configurar variables de entorno
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Editar ambos archivos con las credenciales correspondientes

# 4. Ejecutar en modo desarrollo (frontend + backend en paralelo)
npm run dev
#   Frontend: http://localhost:5173
#   Backend:  http://localhost:3000
```

### Scripts del monorepo (raíz)

| Script | Descripción |
|:---|:---|
| `npm run dev` | Arranca frontend (Vite) y backend (Express) en paralelo |
| `npm run lint` | ESLint sobre todo el frontend |
| `npm run typecheck` | TypeScript `tsc --noEmit` sobre el frontend |
| `npm run test` | Suite Vitest completa del frontend |
| `npm run prepare` | Inicializa Husky (ejecutado automáticamente por `npm install`) |

### Variables de entorno requeridas (backend)

| Variable | Descripción |
|:---|:---|
| `GROQ_API_KEY` | API key de Groq Cloud |
| `GEMINI_API_KEY` | API key de Google Gemini |
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (acceso completo) |
| `REDIS_URL` | URL Redis (redis:// o rediss://) |
| `ADMIN_SECRET` | Secret para el endpoint `/admin/flush-cache` |

---

---

## 🔒 Calidad de Código — Pre-Commit Quality Gate

Cada operación de `git commit` y `git push` pasa por un sistema de validación automática implementado con **Husky v9** + **lint-staged** + **ESLint**.

### `git commit` → Hook `pre-commit`

Ejecuta `lint-staged`: corre **ESLint con auto-fix** exclusivamente sobre los archivos TypeScript/JavaScript que están en el staging area (`git add`). Solo se revisa lo que vas a commitear.

```bash
# Lo que ocurre al hacer git commit:
npx lint-staged
# → ESLint --fix sobre *.{js,jsx,ts,tsx} en staging
```

### `git push` → Hook `pre-push` (Quality Gate completo)

Ejecuta las **3 etapas** en secuencia. Si alguna falla, el push es cancelado:

```
╔═══════════════════════════════════════════════════════════╗
║  PRE-PUSH QUALITY GATE                                    ║
╚═══════════════════════════════════════════════════════════╝

[1/3] ESLint       → npm run lint
[2/3] TypeScript   → npm run typecheck (tsc --noEmit)
[3/3] Vitest       → npm test (vitest run)
```

En caso de fallo, el hook muestra el diagnóstico detallado, los errores específicos y una sugerencia de comando para resolverlo.

> 📄 Documentación completa: [`CODE_QUALITY.md`](./CODE_QUALITY.md)

---

## 🌿 Estrategia de Ramas (GitHub Flow)

| Rama | Propósito |
|:---|:---|
| `main` | **Producción.** Vinculada a Vercel CD y Render CD. Solo recibe merges verificados. |
| `development` | Integración de features antes de pasar a `main`. |
| `feat/*` | Nuevas funcionalidades. |
| `fix/*` | Correcciones de bugs. |
| `docs/*` | Actualizaciones de documentación. |

---

## ♾️ Estrategia de Alta Disponibilidad (Free Tier)

El sistema opera **100% en infraestructura gratuita** sin Cold Starts ni pérdida de datos, gracias a esta estrategia:

```
┌─────────────────────────────────────────────────────────────┐
│                  Keep-Alive Strategy                         │
├──────────────────┬──────────────────────────────────────────┤
│ Supabase (DB)    │ GitHub Action heartbeat.yml               │
│                  │ → curl ping cada 24h (evita pausa 7 días) │
├──────────────────┼──────────────────────────────────────────┤
│ Render (Backend) │ UptimeRobot HTTP monitor cada 14 minutos  │
│                  │ → 750h/mes consumidas, 0 Cold Starts      │
├──────────────────┼──────────────────────────────────────────┤
│ Redis Cloud      │ Cascada: Render despierto → socket TCP    │
│                  │ permanente → Redis nunca cierra (30 días) │
└──────────────────┴──────────────────────────────────────────┘
```

---

## 🛡️ Seguridad

| Mecanismo | Implementación |
|:---|:---|
| **Validación de entrada** | Esquemas Zod compartidos `shared/validators/schemas.ts` |
| **Rate Limiting** | `express-rate-limit` por endpoint (admin: 5 req/min) |
| **Admin auth** | Comparación timing-safe SHA-256 (`crypto.timingSafeEqual`) |
| **Prompt hardening** | System prompt sin lógica de negocio + defensa anti-injection RAG |
| **Guardrail post-LLM** | Patrones regex bloquean alucinaciones de user-state |
| **ResponsePolicy** | Última capa: validación estructural + fallbacks por intent |
| **Aislamiento de credenciales** | Todas las API keys residentes en servidor, nunca expuestas al cliente |
| **Graceful degradation** | Redis failure → bypass automático, sin crash del servicio |

---

## 📚 Documentación Adicional

| Documento | Contenido |
|:---|:---|
| [`ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Diagramas Mermaid del pipeline, capas de seguridad, módulos |
| [`AI_STRATEGY.md`](./docs/AI_STRATEGY.md) | Arquitectura RAG, parámetros de inferencia, 4 capas de defensa anti-alucinación |
| [`CODE_QUALITY.md`](./docs/CODE_QUALITY.md) | Sistema de pre-commit: Husky v9, lint-staged, ESLint, Quality Gate completo |
| [`CHANGELOG.md`](./docs/CHANGELOG.md) | Historial de versiones con impacto detallado por release |
| [`CONTRIBUTING.md`](./docs/CONTRIBUTING.md) | Guía para nuevos contribuidores |

---

<div align="center">

**© 2026 Instituto Autónomo de Servicios de Bibliotecas e Información del Estado Bolivariano de Mérida**

*Innovación tecnológica al servicio de la cultura y el conocimiento.*

</div>
