# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

IBIME Connect — institutional platform for the Mérida state library network (Venezuela). The centerpiece is an AI chat assistant with a **hybrid deterministic/probabilistic** engine: the LLM is *never* allowed to decide the final output. See `README.md` (Spanish) for the full architecture narrative and `docs/ARCHITECTURE.md`, `docs/AI_STRATEGY.md`.

## Monorepo layout

Three npm workspaces installed independently (no root workspace linking):

- `backend/` — Express 5 (+ helmet, trust proxy) + TypeScript (ESM), tsyringe DI, Vitest. **Node ≥22** (required: `@supabase/supabase-js` 2.110+ needs Node 22's native WebSocket; on Node 20 `createClient` throws at import and the backend won't boot). Dev server on **port 3000** (`PORT` env, default 3000).
- `frontend/` — React 18 + Vite + shadcn/ui. Dev server on **port 4000** (`strictPort`). The hexagonal (ports/adapters) layering applies to the **assistant path only** — `domain/ports/AssistantPort.ts` → `infrastructure/adapters/BackendAssistantAdapter.ts` → `application/use-cases/AskAssistantUseCase.ts`. Everything else (contact, events) is plain `services/`; don't force new code into the hexagon unless it talks to the assistant.
- `shared/` — Zod schemas + domain types imported by both sides via the `@shared/*` path alias. `"type": "module"`.

## Commands

Run from the repo root:

```bash
npm run dev         # frontend (:4000) + backend (:3000) concurrently
npm run lint        # eslint both packages (frontend `eslint .`, backend `eslint . --ext .js,.ts`)
npm run typecheck   # tsc --noEmit both packages
npm run test        # vitest run both packages
```

Backend-specific (prefix or cd):

```bash
npm run test --prefix backend                 # all backend unit tests (384)
npm run test:coverage --prefix backend        # v8 coverage
npm run test:integration --prefix backend     # only *.integration.test.ts (supertest smoke)
npm run build --prefix backend                # clean + prebuild (copy-shared-zod) + tsc + tsc-alias

# Run a single test file / single test:
npx vitest run src/__tests__/modules/chat/chat-orchestrator.test.ts --prefix backend
npx vitest run -t "name of the test" --prefix backend
```

E2E (Playwright, Chromium only): `npx playwright test` — its `webServer` config boots both dev servers automatically (backend `:3000`, frontend `:4000`).

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

## Chat engine architecture

Entry: `chat.controller.ts` → `ChatService` (thin wrapper) → `ChatOrchestrator.process()` in `backend/src/modules/chat/`. The orchestrator is the whole brain; the LLM only ever drafts text that later layers can override. Pipeline:

1. **IntentClassifier** (`intent-classifier.ts`) — pure regex, no LLM. Priority 0: any email pattern → `registration`. Otherwise `catalog` / `general`.
2. **SentimentAnalyzerService** — synchronous, <1ms, no I/O. Frustration score ≥2 injects an empathy prefix into the system prompt for Branch B / catalog / general **only** — never Branch A.
3. Intent switch:
   - **registration** → Privacy Gate (Redis is the authoritative source of the session email) then **Branch A** (known email: fully deterministic, LLM *not called*, `tokensUsed=0`, gated behind phone-ownership verification) or **Branch B** (unknown email: LLM only asks for the email).
   - **catalog** → RAG (`rag.service.ts`, fail-hard if similarity < 0.65) → LLM.
   - **general** → greeting hardcoded, else RAG + LLM.
4. **ResponsePolicy** (`response-policy.ts`) — last gate before output: structural validation + `ResponseGuardrail` (regex blocks user-state hallucinations) + per-intent fallback. Branch A responses are `isDbBacked` and exempt from the guardrail. **Final output is controlled 100% here, never by the LLM.**

Security-critical invariants when editing the chat flow:
- The chat endpoint is **public and unauthenticated**. `consultar_inscripciones` returns PII, so `check_registration.tool.ts` is self-protecting: it requires `email` + `phone` and verifies ownership regardless of caller. "email not found" and "phone mismatch" must return the *identical* generic `not_verified` response (anti-enumeration).
- Phone comparison (`phone.util.ts`) matches the last 7 digits, ignoring country prefix/spaces/separators.
- Brute-force is bounded by `verification-throttle.service.ts` (5 failures / 15 min per email, Redis) + IP rate-limit in `api.routes.ts`.
- Log PII masked only (`pii.util.ts`, e.g. `j***@gmail.com`) — never in clear.
- Redis is graceful-degradation: if it's down the system bypasses the cache/session layer and keeps serving.

## HTTP surface and auth

`api.routes.ts` mounts **every route twice**: under `/api/v1/*` and again under a legacy unversioned prefix (`/api/chat`, `/api/contact`, …). Adding an endpoint means adding both mounts, and changing one silently leaves the other stale.

Two auth tiers, and the split is deliberate:
- **Public, unauthenticated**: `chat`, `contact`, `registrations`. The chat limiter allows **6 req/min per IP** (sized against Groq's 30 RPM free tier) and is skipped entirely when `NODE_ENV=test`.
- **Admin-only** via `requireAdminKey` (`middlewares/admin-auth.middleware.ts`, timing-safe compare against `ADMIN_SECRET`): knowledge ingestion, the curation agent, and `POST /admin/flush-cache`. On the agent route the guard runs *before* multer parses the upload, so unauthorized requests are rejected before any file is read — keep that ordering. `ADMIN_SECRET` is optional in `env.config.ts`; tests pin it to `test-admin-secret` via `vitest.config.ts`.

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

Backend coverage is **gated**, not just reported: `vitest.config.ts` fails the run below 82% statements / 74% branches / 78% functions / 82% lines. Those thresholds are pinned a few points under actual coverage on purpose (to absorb the flake) — raise them when coverage improves, don't lower them to make a run pass.

Three GitHub Actions workflows:
- `ci.yml` — lint + typecheck + test with dummy env vars, on push/PR to `develop` and `main`. It also runs `npm audit --audit-level=high`, currently `continue-on-error` (advisory only).
- `e2e.yml` — Playwright Chromium, same triggers.
- `heartbeat.yml` — cron every 6h, pings Render and Supabase to keep the free tiers from sleeping. Not a quality gate; don't "fix" it by deleting it.

## Deploy targets

Backend → Render (`render.yaml`), frontend → Vercel. `main` is production and auto-deploys both. Branch flow: `feature/*` and `fix/*` → `develop` → `main`. Both run on free tiers, which is why the code is defensive about quotas, cold starts, and Redis being unavailable.

Render builds with `rootDir: backend` — that constraint is what forces the shared/zod copy hack above, and it means anything outside `backend/` (except the `shared/` files pulled in at build time) does not exist at runtime.

Database schema lives in `supabase/migrations/`.
