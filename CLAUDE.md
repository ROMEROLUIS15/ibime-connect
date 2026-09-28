# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

IBIME Connect — institutional platform for the Mérida state library network (Venezuela). The centerpiece is an AI chat assistant with a **hybrid deterministic/probabilistic** engine: the LLM is *never* allowed to decide the final output. See `README.md` (Spanish) for the full architecture narrative and `docs/ARCHITECTURE.md`, `docs/AI_STRATEGY.md`. Other docs (all Spanish): `docs/CARGA_DE_CATALOGO.md` (how to populate the RAG `knowledge_base`), `docs/CONTRIBUTING.md` (branch flow + standards), `docs/CODE_QUALITY.md` (the local + CI quality gate), `docs/DATA_RETENTION.md` (PII retention policy — still a **PROPUESTA**, plazos not yet ratified), `docs/AUDITORIA_RAG.md` (2026-08-26 audit of the retrieval pipeline measured against production — read it before touching the RAG; its **Estado de las correcciones** table tracks each finding: code fixes for RAG-01/03/04/06/07/08/10/11 are in `develop`, the RAG-01 and RAG-10 migrations were applied to prod on 2026-09-24 (recorded in `supabase_migrations.schema_migrations` under their file versions), RAG-02 and RAG-05 are still open, RAG-09 was skipped because `chunkText` is unused), and `docs/CHANGELOG.md`.

## Monorepo layout

Three npm workspaces installed independently (no root workspace linking):

- `backend/` — **Node ≥22** (required: `@supabase/supabase-js` 2.110+ needs Node 22's native WebSocket; on Node 20 `createClient` throws at import and the backend won't boot). Dev server on **port 3000** (`PORT` env, default 3000).
- `frontend/` — Dev server on **port 4000** (`strictPort`). The hexagonal (ports/adapters) layering applies to the **assistant path only** — `domain/ports/AssistantPort.ts` → `infrastructure/adapters/BackendAssistantAdapter.ts` → `application/use-cases/AskAssistantUseCase.ts`. Everything else (contact, events) is plain `services/`; don't force new code into the hexagon unless it talks to the assistant. The assistant **UI** is deliberately split: `components/IBIMEAssistant.tsx` owns the chat window plus all client state (messages, `sessionId`, DI of the use-case, focus-trap), while `components/assistant/AssistantLauncher.tsx` is the floating mascot (the institutional **owl**, `assets/buho_8-removebg-preview.png`) + speech-bubble launcher — purely presentational, knows nothing of the chat pipeline, and only signals the parent via `onToggle`. Keep that boundary: launcher = presentation, `IBIMEAssistant` = state/logic.
- `shared/` — Zod schemas + domain types imported by both sides via the `@shared/*` path alias. `"type": "module"`.

## Commands

Root scripts (`dev`, `lint`, `typecheck`, `test`) fan out to both packages via `--prefix`; see `package.json` and `backend/package.json` for the full set. Both packages run Vitest, so a single test needs the right prefix:

```bash
npx vitest run src/__tests__/modules/chat/chat-orchestrator.test.ts --prefix backend
npx vitest run -t "name of the test" --prefix backend
```

Frontend-specific:

```bash
npm run test --prefix frontend                # all frontend tests (56, jsdom)
npm run build --prefix frontend               # vite build
cd frontend && npx vitest run src/components/ServicesSection.test.tsx   # single file
cd frontend && npx vitest run -t "name of the test"                     # single test
```

E2E (Playwright, Chromium only): `npx playwright test` — its `webServer` config boots both dev servers automatically (backend `:3000`, frontend `:4000`) and reuses already-running ones outside CI, so `npm run dev` in another terminal is fine. Specs live in `e2e/`, run against `baseURL` `http://localhost:4000`, and **always intercept the chat call** with `page.route('**/*chat*', …)` — Groq's free quota is genuinely exhaustible (~132 responses/day), so no e2e test may hit the real LLM. `chat-rate-limit.spec.ts` fulfils a fake 429 rather than tripping the real limiter; keep it that way.

## Install quirk (do not skip)

Fresh installs and CI use `--legacy-peer-deps` for `frontend/` and `backend/`:

```bash
npm ci
npm ci --legacy-peer-deps --prefix frontend
npm ci --legacy-peer-deps --prefix backend
```

The CI has historically broken on a `file:..` self-dependency; reproduce install failures with `npm ci --dry-run` before trusting a "works locally" install.

## The shared/zod resolution hack

`shared/` imports `zod` but declares **no dependencies**. Two workarounds keep it resolvable in each deploy target — if you touch `shared/` imports or bump zod, know these exist:

- **Backend build**: `backend/scripts/copy-shared-zod.mjs` (runs as `prebuild`) copies `backend/node_modules/zod` into `shared/node_modules/zod`, because Render builds with `rootDir: backend` and `shared/` has no `node_modules` of its own. It fails loudly by design — don't re-wrap it in `|| true`.
- **Frontend build**: `frontend/vite.config.ts` aliases `zod` to `frontend/node_modules/zod` so Vercel doesn't choke resolving the external `shared/` folder.

Both sides are pinned to **zod 3** (unified 2026-07): frontend and backend share `shared/validators/schemas.ts`, and a v3/v4 split made `.email()` and error formatting diverge between them. Dependabot will periodically try to bump either side to zod 4 — don't merge that unless you migrate **both** sides together (plus `@hookform/resolvers` v5 on the frontend).

## Frontend structure

Path aliases (declared in both `vite.config.ts` and `vitest.config.ts` — add new ones to **both** or tests break): `@/*` → `frontend/src/*`, `@shared/*` → `shared/*`.

- **Routing** is a small SPA in `App.tsx`: `/`, `/koha`, `/libro-hablado`, `/fondo-editorial`, `/donation-criteria`, `*`. `<IBIMEAssistant />` is mounted **outside `<Routes>`** on purpose so the chat floats over every route and survives navigation — don't move it into a route. `<ScrollToTop />` sits inside `<BrowserRouter>` to reset scroll on route change.
- `pages/Index.tsx` is a one-page composition: `Navbar` → the `components/*Section.tsx` blocks in fixed order (Hero, AboutIBIME, CulturalVideos, MissionVision, News, PlanVacacional, Gallery, Events, Services, VisitorCounter, Contact) → `Footer` + `FloatingButtons`. New landing content is usually a new `*Section` component slotted into `Index`, not a new route.
- **All backend HTTP goes through `lib/api-url.ts`** (`buildApiUrl` / `apiFetch`), which returns the typed `ApiResult<T>` from `@shared/types/domain` instead of throwing. `VITE_API_URL` wins in production; otherwise it falls back to `http://localhost:3000/api`. Don't call `fetch` directly in a component or service.
- `services/` (`contact.service.ts`, `events.service.ts`) are thin `apiFetch` wrappers re-exported through `services/index.ts`; components import from `@/services`.
- `lib/supabase.ts` is the **single** lazily-created Supabase client — never import the auto-generated `integrations/supabase/client.ts` directly. `integrations/supabase/types.ts` is generated; treat it as read-only.
- `lib/session-id.ts` mints the chat `sessionId` (UUID v4). The backend uses it as the authoritative Redis key for the Privacy Gate, so a missing/invalid one silently downgrades that gate to the weaker history-hash fallback.

Conventions: Tailwind only (no CSS modules/styled-components), shadcn/ui primitives from `components/ui/` first, functional components + hooks. UI copy and most inline comments are **Spanish** — match the surrounding file. `lovable-tagger` runs only in `mode === 'development'` (the project was scaffolded with Lovable); it's not part of the production build.

## Frontend tests

Vitest with `jsdom`, setup at `frontend/src/test/setup.ts` (imports `@testing-library/jest-dom` and stubs `window.matchMedia`, which jsdom doesn't implement and `hooks/use-mobile.tsx` needs). Two conventions coexist and both are matched by `include: src/**/*.{test,spec}.{ts,tsx}`:

- Component/page tests are **co-located** (`components/ServicesSection.test.tsx`, `pages/DonationCriteriaPage.test.tsx`).
- Pure-logic tests live under `src/test/` mirroring the source path (`src/test/lib/api-url.test.ts`, `src/test/application/use-cases/AskAssistantUseCase.test.ts`).

The frontend has **no coverage gate** (unlike the backend) — coverage isn't configured here at all.

## Chat engine architecture

The pipeline spans three directories, all under `backend/src/`: `controllers/chat.controller.ts` → `services/chat.service.ts` (thin wrapper) → `modules/chat/chat-orchestrator.ts`. The split is: gate and policy modules (`intent-classifier.ts`, `response-policy.ts`, `response-guardrail.ts`, `system-prompt.ts`, `email-validator.ts`) live in `modules/chat/`, while everything they call (`rag.service.ts`, `sentiment-analyzer.service.ts`, `session-memory.service.ts`, `verification-throttle.service.ts`, `tools/check_registration.tool.ts`) lives in `services/`. The orchestrator is the whole brain; the LLM only ever drafts text that later layers can override. Pipeline:

1. **IntentClassifier** (`intent-classifier.ts`) — pure regex, no LLM. Priority 0: any email pattern → `registration`. Otherwise `catalog` / `general`.
2. **SentimentAnalyzerService** — synchronous, <1ms, no I/O. Frustration score ≥2 injects an empathy prefix into the system prompt for Branch B / catalog / general **only** — never Branch A.
3. Intent switch:
   - **registration** → Privacy Gate (Redis, via `services/session-memory.service.ts`, is the authoritative source of the session email) then **Branch A** (known email: fully deterministic, LLM *not called*, `tokensUsed=0`, gated behind phone-ownership verification) or **Branch B** (unknown email: LLM only asks for the email).
   - **catalog** → RAG (`rag.service.ts`, fail-hard if similarity < 0.65) → LLM.
   - **general** → greeting hardcoded, else RAG + LLM.
4. **ResponsePolicy** (`response-policy.ts`) — last gate before output: structural validation + `ResponseGuardrail` (regex blocks user-state hallucinations) + per-intent fallback. Branch A responses are `isDbBacked` and exempt from the guardrail. **Final output is controlled 100% here, never by the LLM.**

Security-critical invariants when editing the chat flow:
- The chat endpoint is **public and unauthenticated**. `consultar_inscripciones` returns PII, so `check_registration.tool.ts` is self-protecting: it requires `email` + `phone` and verifies ownership regardless of caller. "email not found" and "phone mismatch" must return the *identical* generic `not_verified` response (anti-enumeration).
- Phone comparison (`phone.util.ts`) matches the last 7 digits, ignoring country prefix/spaces/separators. The orchestrator takes the phone from the **most recent** user message that has one, scanning each message separately (never the joined history: two numbers in a row used to read as one 22-digit number and loop the phone prompt).
- Brute-force is bounded by `verification-throttle.service.ts` (5 failures / 15 min per email, Redis) + IP rate-limit in `api.routes.ts`.
- Log PII masked only (`pii.util.ts`, e.g. `j***@gmail.com`) — never in clear.
- Redis is graceful-degradation: if it's down the system bypasses the cache/session layer and keeps serving.

## HTTP surface and auth

`api.routes.ts` mounts **every route twice**: under `/api/v1/*` and again under a legacy unversioned prefix (`/api/chat`, `/api/contact`, …). Adding an endpoint means adding both mounts, and changing one silently leaves the other stale.

Two auth tiers, and the split is deliberate:
- **Public, unauthenticated**: `chat`, `contact`, `registrations`. The chat limiter allows **6 req/min per IP** (sized against Groq's 30 RPM free tier) and is skipped entirely when `NODE_ENV=test`.
- **Admin-only** via `requireAdminKey` (`middlewares/admin-auth.middleware.ts`, timing-safe compare against `ADMIN_SECRET`): knowledge ingestion, the curation agent, `POST /admin/flush-cache`, and `POST /admin/rag-probe` (also under `/v1`: embeds each question and returns its top-k similarities with **no threshold**, to calibrate RAG-05 — no LLM call, no cache, no writes). On the agent route the guard runs *before* multer parses the upload, so unauthorized requests are rejected before any file is read — keep that ordering. `ADMIN_SECRET` is optional in `env.config.ts`; tests pin it to `test-admin-secret` via `vitest.config.ts`.

## Env config

`backend/src/config/env.config.ts` validates all env with Zod and **throws at boot** on a bad value. Required with no default: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`. The `GROQ_*_LIMIT` vars are a self-imposed quota budget (TPM/RPM/RPD/TPD), not values Groq reports back; `GROQ_SAFETY_MARGIN` (0.8) is applied **only to the per-minute windows** — the daily quotas are spent in full. Observability is opt-in and no-ops without a key: `SENTRY_DSN` (`infrastructure/observability/sentry.ts`) and `LANGSMITH_*` (`tracing.ts`).

## DI container

`backend/src/infrastructure/di/container.ts` (tsyringe) wires everything as singletons. Services depend on the interfaces in `domain/interfaces/index.ts` (`ILLMProvider`, `IEmbeddingService`, `IKnowledgeRepository`) — register there, resolve by token. `reflect-metadata` is imported at container top **and** polyfilled for Vitest in `src/__tests__/setup.ts` (`vitest.config.ts` → `setupFiles`); a new test file that constructs DI-managed classes needs that setup to be active.

There is also a LangGraph-based `modules/agents/curation-graph.ts` (`@langchain/langgraph`) registered in the container — knowledge-curation agent, separate from the chat pipeline.

## AI providers

- Inference: Groq Cloud, model from `GROQ_MODEL` (default `openai/gpt-oss-20b`). Groq's daily free quota is exhaustible (~1.5k tokens/response).
- Embeddings: Google Gemini `gemini-embedding-001`, 768 dims, into Supabase pgvector.

## Quality gate

Husky v9: `pre-commit` runs lint-staged (eslint --fix on staged files); `pre-push` runs lint → `tsc --noEmit` → `vitest run` sequentially and blocks on any failure. Vitest's backend worker flakes ~1 run in 7 — re-run rather than "fixing" a test that passes in isolation.

Backend coverage is **gated**, not just reported: `vitest.config.ts` fails the run below 82% statements / 74% branches / 78% functions / 82% lines. Those thresholds are pinned a few points under actual coverage on purpose (to absorb the flake) — raise them when coverage improves, don't lower them to make a run pass. The frontend has no coverage gate.

Current suite sizes: **469 backend + 56 frontend** unit tests and **18** Playwright tests. `README.md` (badge, stack table, suite table, pyramid) and `docs/CODE_QUALITY.md` repeat these numbers — update them together when the counts change.

Three GitHub Actions workflows (`ci.yml`, `e2e.yml`, `heartbeat.yml`); only the last needs explaining. `heartbeat.yml` is a cron every 6h that wakes the Render backend and pings Supabase to keep the free tiers from sleeping — not a quality gate, so don't "fix" it by deleting it. The **real** Render keep-alive is an UptimeRobot HTTP monitor every 14 min, configured outside this repo; nothing in the tree points to it.

## Deploy targets

Backend → Render (`render.yaml`), frontend → Vercel. `main` is production and auto-deploys both. Branch flow: `feature/*` and `fix/*` → `develop` → `main`. Both run on free tiers, which is why the code is defensive about quotas, cold starts, and Redis being unavailable.

Render builds with `rootDir: backend` — that constraint is what forces the shared/zod copy hack above, and it means anything outside `backend/` (except the `shared/` files pulled in at build time) does not exist at runtime. `render.yaml` pins `NODE_VERSION` 22.11.0 and `PORT` 10000, and it is the mirror of the backend `.env`: a new **required** env var in `env.config.ts` must be added there too or the next deploy boot-throws.

The old **on-prem** deployment (the gitignored root `DEPLOYMENT.md`: a self-hosted Debian server, `192.168.0.41`, public domain `www.ibime.gob.ve`) is being retired (2026-09) — don't plan work against it; Render + Vercel are the targets. The Koha public catalogue is **not** part of that retirement: it stays at `http://www.ibime.gob.ve:8000/` (confirmed 2026-09-28), linked from `pages/KohaPage.tsx` and `system-prompt.ts` and pinned by `system-prompt.test.ts` — keep those links as they are.

Database schema lives in `supabase/migrations/` (RLS hardening, pgvector/RAG setup, data-retention functions). Migrations are append-only and timestamp-ordered — add a new file, never edit a shipped one.

## MCP servers (local dev tooling)

Up to five servers (`playwright`, `redis`, `render`, `vercel`, `supabase`) are wired for this repo at **local scope** in the active Claude config — `~/.claude.json`, or `$CLAUDE_CONFIG_DIR/.claude.json` when that variable is set (check which one before assuming a server is missing). Both `.claude.json` and `.mcp.json` are gitignored, so this config never travels with the repo — it has to be rebuilt per machine. None of it touches the build or the runtime. The full recipe and its gotchas live in the `mcp-setup` skill (`.claude/skills/mcp-setup/SKILL.md`).

## Conventions worth keeping

- Interfaces are prefixed `I` (`IEmbeddingService`); avoid `any`. Backend logging goes through `contextLogger` so the `requestId` stays traceable.
- Commits use conventional-commit prefixes (`feat:`, `fix:`, `test:`, `style:` + scope). Branch flow is `feature/*` / `fix/*` → `develop` → `main`.
- `.kiro/specs/` holds spec-driven artifacts (requirements/design/tasks) for a couple of features; they're historical records, not live config.
