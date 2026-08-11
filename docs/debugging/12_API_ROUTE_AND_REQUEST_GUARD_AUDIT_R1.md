# API Route and Request Guard Audit — R1

- **Report**: `12_API_ROUTE_AND_REQUEST_GUARD_AUDIT_R1.md`
- **Scope**: API route inventory, request-guard usage, campaign-path safety, middleware coverage, and error envelope conventions.
- **Result**: `PASS` — 57 API routes; guard functions used consistently; path boundaries enforced.

---

## 1. API Route Inventory (57 route files)

`dashboard/src/app/api/**/route.ts`:

- **auth**: `login`, `logout`, `me`
- **brains**: `catalog`, `job`, `run`
- **campaigns**: `campaigns` (list/create), `campaigns/stats`, and per-campaign `[id]/`: base, `angle`, `approve`, `auto-progress`, `backup`, `continue`, `evaluate`, `execute-stage`, `extract`, `files`, `files/brief`, `files/insights`, `files/raw-study`, `gates`, `governance`, `handoff`, `human-approval`, `quality`, `questions`, `replay`, `resume`, `scripts`, `stage-state`, `status`, `stream`, `strict-audit`, `template`
- **other**: `analysis`, `angles`, `artifacts`, `artifacts/content`, `connection-audit`, `dashboard/ai`, `diagnostics/consistency`, `health`, `integrations/health`, `integrations/preflight`, `journalists`, `logs`, `models`, `models/audit`, `models/runtime-policy`, `notifications`, `observability/summary`, `research-enrichment`, `validate`, `validation`, `workflow`, `_internal/mutation-audit`

## 2. Request-Guard Usage (`requestGuard.ts`)

| Guard | Used by (count) |
|---|---|
| `resolveCampaignPath` (boundary: must stay under `PITCH_JOBS_ROOT`) | 19+ route files (campaigns/[id]/*, angles, journalists, analysis, research-enrichment, validate, workflow, connection-audit, diagnostics/consistency) |
| `assertValidCampaignId` / `isValidCampaignId` (`/^[a-z0-9][a-z0-9-_]{1,120}$/i`) | campaigns routes, execute-stage, auto-progress, brains/run, scripts, backup, strict-audit, status, stream, gates, continue, diagnostics/consistency |
| `sanitizeStageFile` (`/^[a-z0-9._-]+$/i`, 3-120) | campaigns/[id]/scripts |
| `sanitizeText` (control-char strip + truncate) | scripts route payload |
| Root exports (`PITCH_JOBS_ROOT`, `SCRIPTS_ROOT`, `REPO_ROOT`, `DATA_ROOT`, `LOGS_ROOT`, `SYSTEM_ROOT`, `BROWSER_TOOLS_ROOT`, `BACKUPS_ROOT`) | derived from `process.cwd()` |

- **Coverage finding**: No route was found that builds a campaign filesystem path without going through `resolveCampaignPath`/`assertValidCampaignId`. The `workflow`, `extract`, `files/*`, `gates`, `replay`, `scripts`, `backup`, `auto-progress`, `connection-audit`, and `strict-audit` routes all route `campaignId` through the guard before touching disk.

## 3. Middleware Coverage (`middleware.ts`)

- Matcher: `/api/:path*` (all API routes).
- Non-`/api` paths: pass through.
- `_internal/mutation-audit`: pass through (self-authenticates).
- Mutations (`POST/PUT/PATCH/DELETE`):
  1. Public paths (`/api/auth/login`, `/api/auth/logout`) bypass auth/CSRF/rate-limit.
  2. `evaluateMutationAuth` (API token / session + role policy + origin host check).
  3. Session-authenticated mutations require CSRF double-submit.
  4. Rate limit 60/min per `${ip}:${method}:${path}`.
  5. Audit event emitted via internal bridge (non-blocking).
- Reads: pass through with `x-request-id` injected.
- Headers: `x-request-id`, `x-ratelimit-*` on mutations.

## 4. Error Envelopes

- `lib/apiResponse.ts` provides `ok(...)` / `fail(...)` with `success`, `error` code, `code`, `message`, optional `details`.
- Middleware envelopes: `AUTH_REQUIRED` (401), `CSRF_REQUIRED` (403), `RATE_LIMITED` (429, with `retry-after`).
- Route-level `fail` codes observed: `CAMPAIGN_NOT_FOUND` (404), `ANGLES_NOT_FOUND` (404), `AUTH_FAILED`/`INVALID_CREDENTIALS` (401/400), `FORBIDDEN` (403, internal audit).

## 5. Findings Summary

| # | Finding | Classification |
|---|---|---|
| A1 | 57 API route files present | `PASS` |
| A2 | Campaign path access consistently guarded (`resolveCampaignPath`) | `PASS` |
| A3 | Campaign ID / stage-file sanitizers enforced before disk access | `PASS` |
| A4 | Middleware covers all `/api/*` with auth+CSRF+rate-limit on mutations | `PASS` |
| A5 | Consistent `ok`/`fail` envelope + request-id | `PASS` |
| A6 | No route bypassing the guard found | `PASS` |
