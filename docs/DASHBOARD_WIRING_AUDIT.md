# Dashboard Wiring Audit — digital-pr-agents

Audits how the dashboard pages talk to the API, with emphasis on auth-gated mutations, response envelope contracts, and state handling.

## Client fetch strategy
- `src/lib/clientApi.ts` provides `apiFetch` (attaches `x-dashboard-token` + `authorization: Bearer <token>` from `localStorage`/`NEXT_PUBLIC_DASHBOARD_API_TOKEN`) and `apiRequest` (envelope-aware, retries with backoff, throws `ApiClientError` carrying `status`/`code`/`details`/`requestId`).
- Correct pattern (used by `campaigns/create`): route all mutations through `apiFetch`/`apiRequest`.

## Defect fixed: raw fetch on auth-gated mutations
Four pages called the API with raw `fetch`, so the mutation token was never attached — every such call would hit `middleware` → `evaluateMutationAuth` → 401 when auth is enabled (`DASHBOARD_AUTH_REQUIRED=true` in the template).

| Page | Endpoint(s) | Change |
|------|-------------|--------|
| `src/app/pitch-selection/page.tsx` | `/api/campaigns/[id]/human-approval`, `/auto-progress` | → `apiFetch` |
| `src/app/analysis/page.tsx` | `/api/campaigns/[id]/auto-progress` | → `apiFetch` |
| `src/app/research-enrichment/page.tsx` | `/api/campaigns/[id]/auto-progress` | → `apiFetch` |
| `src/app/data-extraction/page.tsx` | `/api/campaigns/[id]/extract` | → `apiFetch` |

## Script execution contract (fixed)
- `campaigns/[id]/scripts/route.ts` previously returned HTTP 500 with a `success:true` body on script failure — a contradictory contract that `apiRequest` would misparse.
- Now returns HTTP 200 with `{ success:false, error, stderr }` envelope, consistent with the rest of the API. `workflow/page.tsx` checks `payload.success === false` and renders stderr as the error instead of treating it as success.

## Resume wiring
- `DashboardContext.resumeWorkflow` correctly POSTs `/api/campaigns/{slug}/resume`.
- `DataContext.resumeWorkflow` is client-only (mutates local state, no backend call) — documented so consumers pick the API-backed path.
- Backend `resume/route.ts` (rewritten) now: validates campaign id, resolves the safe path, parses/clamps the target stage, only advances (`safeStage = max(current, target)`), writes `stage-state.json` atomically, and appends to the audit log. Verified by `resume-human-approval.test.ts` (11 tests) asserting stage-state advance (`currentStage=8`, `status='running'`).

## File state preservation
- `campaigns/[id]/files/route.ts` POST previously reset `stage-state.json` to `{currentStage:1}` on every save, silently destroying workflow position. Now merges so existing stage/status fields survive.

## Auth middleware expectations for the UI
- Mutations need a valid token (`x-dashboard-token` or `Bearer`), optional session cookie + CSRF header (`x-csrf-token`) when session-authenticated, and pass the per-IP rate limit (60/min).
- GET requests pass through unauthenticated, so read-only pages (models, logs, campaign status) work without tokens.

## Status: audited, defects fixed
All identified wiring defects are resolved in the working tree (uncommitted). No remaining raw-`fetch`-on-mutation call sites found in the four audited pages.
