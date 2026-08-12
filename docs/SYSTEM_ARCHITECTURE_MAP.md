# System Architecture Map — digital-pr-agents (dashboard)

Next.js 14.2.3 App Router, TypeScript strict, Tailwind CSS, Vitest. Persistence is filesystem-based (no DB for campaign state).

## Request pipeline (mutations)
```
client (apiFetch) → middleware.ts → route handler → lib services → filesystem (repo)
```
- `middleware.ts` (root): gates every `/api/*` request; for mutations applies `evaluateMutationAuth`, session-CSRF check, per-IP rate limit (60/min), emits mutation audit to `/api/_internal/mutation-audit`; stamps `x-request-id`.
- `src/lib/authGuard.ts`: token/session/role evaluation, route policies, Origin check, `safeTimingEqual` token compare.
- `src/lib/sessionAuth.ts`: HMAC-signed session tokens (`sess_` bearer / cookie), CSRF token generation, `safeTimingEqual` signature verify.
- `src/lib/rateLimiter.ts`: in-memory rate limiting.
- `src/lib/requestGuard.ts`: canonical path/ID guards (`PITCH_JOBS_ROOT`, `resolveCampaignPath`, `assertValidCampaignId`, `sanitizeStageFile`, root constants).

## API surface (~57 route files under `src/app/api/`)
- **Campaigns**: `campaigns` (CRUD), `campaigns/[id]/status`, `campaigns/[id]/files`, `campaigns/[id]/scripts`, `campaigns/[id]/resume`, `campaigns/[id]/execute-stage`, `campaigns/[id]/auto-progress`, `campaigns/[id]/human-approval`.
- **Analysis/workflow**: `analysis`, `research-enrichment`, `data-extraction`, `validate`, `validation`, `workflow`, `models` (+ `models/audit`, `models/runtime-policy`).
- **Brains**: `brains/run` (spawns brain worker; 503 if worker script missing).
- **Auth**: `auth/login`, `auth/logout`.
- **Internal**: `_internal/mutation-audit`.
- **Other**: `health`, `integrations/*` (incl. `integrations/health`), `logs`, and more.

## Dashboard (31 pages under `src/app/`)
- Core workflow: `workflow`, `pitch-selection`, `analysis`, `research-enrichment`, `data-extraction`, `approvals`, `validation`, `final-package`, `campaign`, `campaign-status`, `campaigns/create`.
- Ops: `logs`, `models`, `artifacts`, `muckrack`, `journalists`, `settings`, `email`, `optimization`, `package`, `pitch`, `pitches`, `connection-audit`, `observability`, `reporting`, `media-list`, `placements`, `follow-up`.
- Client wiring: `src/context/DataContext.tsx`, `src/context/DashboardContext.tsx`; `src/lib/clientApi.ts` (`apiFetch`, `apiRequest` with retry + `ApiClientError`).

## Persistence / config layout
- Campaign data: `<repo>/pitch-jobs/<slug>/` — stage files `00-brief.md`…`16`, `stage-state.json`, `human-approval.json`, `claim-ledger.json`, `gate-results.json`, `source-files/`, `draft-variants/`.
- Governance/config: `<repo>/system/*.json` (gate-rules.json, stage-contracts.json, workflow-state-machine.json, model-routing.config.json, evaluation-*, prompt-versioning.json, etc.).
- Schemas: `<repo>/schemas/`; brain manifests: `<repo>/brain/brain-manifest.json`.
- `src/lib/db.ts` is deprecated/unused by routes (filesystem persistence).

## Agent / brain layer (scaffolding)
- `src/data/agentBrainRegistry.ts`, `agentGuardrails.ts`, `agentHandoffRegistry.ts`, `agentToolRegistry.ts`.
- `src/lib/agentRuntime.ts`, `agentMemory.ts`, `agentGuardrails.ts`, `agentHandoff.ts`, `agentTrace.ts`, `agentArtifacts.ts`, `agentFeedback.ts`, `brainResolver.ts`, `brainWorkerRuntime.ts`.
- Actual execution path for stages is `execute-stage` route + `llmService.ts` + `modelRouter.ts`; the `agent*` modules are orchestration scaffolding (see AGENT_AUDIT.md).

## Models
- `src/lib/modelRouter.ts` + `system/model-routing.config.json`; free OpenRouter models (Nemotron 3 Ultra, GPT-OSS-120B, MiniMax M2.5); `llmService.ts` primary execution with rate throttle, failover, zombie-response detection.

## Tests
Vitest, 28 files / 1054 tests under `src/tests/` (gate engine, execute-stage, resume, auto-progress, human-approval, model routing, prompt versioning, campaign state, integration readiness, dry-run, etc.).
