# Defect Register — digital-pr-agents

Severity: **P0** = data corruption/security/cannot start · **P1** = breaks real usage · **P2** = polish/parity.
Status: `fixed` (in working tree, uncommitted) · `documented` (no change made).

## Fixed

| ID | Sev | Area | Defect | Fix |
|----|-----|------|--------|-----|
| D1 | P1 | Dashboard pages | `pitch-selection`, `analysis`, `research-enrichment`, `data-extraction` called raw `fetch` on auth-gated mutation endpoints (401 risk) | Route through `apiFetch` (`@/lib/clientApi`) so `x-dashboard-token`/`authorization` are attached |
| P1-1 | P1 | `campaigns/route.ts` DELETE | `path.join(PITCH_JOBS_ROOT, campaignId)` + `fs.rm` allowed path traversal | `resolveCampaignPath` guard + 400/404; removed duplicated preflight block |
| P1-2 | P1 | `validation/route.ts` GET | Same raw-path traversal pattern | `resolveCampaignPath` guard |
| P1-3 | P1 | `scripts/route.ts` | Returned HTTP 500 with `success:true` body (contradictory contract) | HTTP 200 + `success:false` envelope; `workflow/page.tsx` surfaces `payload.success === false` + stderr |
| P1-4 | P1 | `brains/run` | Spawned no-op when `scripts/run-brain-worker.mjs` absent | Fast-fail 503 `WORKER_SCRIPT_MISSING` |
| P1-7 | P1 | `llmService.ts` | S4 paths pointed at non-existent `campaigns\` dir (later lines 2197/2309) | → `pitch-jobs\` |
| P1-8 | P1 | `files/route.ts` POST | Overwrote `stage-state.json` to `{currentStage:1}` on every save | Merge + preserve existing state |
| S4 | P2 | `execute-stage/route.ts` | Dependency error labels wrong (`stage:3`, 'S3 blocked', 'from S2' for S4) | Corrected to `stage:4` / 'S4 blocked' / 'from S3' |
| — | P1 | `resume/route.ts` | Did not advance stage-state after S7 approval; unguarded path usage | Rewrite: `assertValidCampaignId`/`resolveCampaignPath`, `parseTargetStage` clamped to `TOTAL_WORKFLOW_STAGES`, `safeStage = max(current, target)`, atomic stage-state write, audit-log append |
| SEC-1 | P1 | `sessionAuth.ts` | Session signature verified with `!==` (non-constant-time) | `safeTimingEqual` (crypto.timingSafeEqual) |
| SEC-2 | P1 | `authGuard.ts` | Static API token compared with `===` (non-constant-time) | `safeTimingEqual` |
| SEC-3 | P1 | `authGuard.ts` | Auth fail-open when `DASHBOARD_AUTH_REQUIRED` unset and no token (incl. production) | `shouldRequireAuth()` returns true when `NODE_ENV=production` unless explicitly disabled |
| SEC-4 | P2 | `middleware.ts` | CSRF cookie/header compared with `===` | `safeTimingEqual` |
| DEP-1 | P1 | `llmService.ts` | 24 hardcoded `D:\Codex Folder\...` paths | `process.cwd()`-derived `DASHBOARD_ROOT`/`DATA_ROOT`/`LOGS_ROOT`/`PROMPTS_ROOT`/`PERSONAS_DIR`; `pitch-jobs` via `path.join(DASHBOARD_ROOT, '..', 'pitch-jobs')` |
| DEP-2 | P1 | 8 libs (`gateEngine`, `stageExecutor`, `runtimeHealthCheck`, `brainResolver`, `replayManager`, `campaignPathResolver`, `claimLedgerManager`, `campaignTemplateManager`) | 19 hardcoded repo/dashboard paths | `path.join(process.cwd(), ...)` consistent with `requestGuard.ts` |
| TEST-1 | P2 | `pipeline-gaps-path.test.ts` | Hardcoded Windows path assertion (machine-bound) | Compute expected path from `process.cwd()` |
| LINT-1 | P2 | `validation/route.ts` | Unused `PITCH_JOBS_ROOT` import (leftover from P1-2) | Removed import |

## Documented (no code change — intentional or requires decision)

| ID | Sev | Area | Finding | Note |
|----|-----|------|---------|------|
| DOC-1 | P2 | `.env.local.example` | Template gitignored (`dashboard/.env*`), so a fresh clone gets no env template | Recommend `.gitignore` exception `!dashboard/.env.local.example` and committing it |
| DOC-2 | P2 | `.env.local.example` | `LLM_API_KEY`/`LLM_API_BASE` dead (only referenced in docs; `llmService` uses `OPENROUTER_API_KEY`/`OPENCODE_API_KEY`) | Removed from local template |
| DOC-3 | P2 | `models/route.ts` | POST `update_route`/`test_model` are stubs (no persistence) | Acceptable placeholder; document before relying on it |
| DOC-4 | P2 | Agent layer | `agentRuntime.ts` returns `ready-for-integration`/`not-implemented`; actual LLM execution stub (`output: undefined`); `agentMemory` short-term/campaign memory loaders return empty maps; `getPreviousArtifactsForStage` fabricates refs | Scaffolding, not a regression |
| DOC-5 | P2 | `agentGuardrails.ts` | `tool-use`/`artifact`/`state` checkTypes unimplemented → default-case silently passes; only `collector-2` (S8, warning) uses `tool-use` | Low impact; implement tool-use check when collector tooling lands |
| DOC-6 | P1 | `scripts/run-brain-worker.mjs` | Absent → brain worker blocked; `brains/run` now returns 503 (fail-fast) | Create worker script to enable feature |
| DOC-7 | P1 | Port drift | `DASHBOARD_BASE_URL` default `3002`; `DASHBOARD-START.PS1` runs on `3001`; `GOOGLE_REDIRECT_URI` example `3002` | Align ports for deployment |
| DOC-8 | P2 | Tests | `gate-engine.test.ts`, `gate-system-provenance.test.ts`, `pitch-governance-validator.test.ts` hardcode `D:\Codex Folder\...` literals in mocks | They still pass because cwd=dashboard yields identical paths; make portable later |
| DOC-9 | P2 | `db.ts` | Deprecated/unused by routes | Persistence is filesystem-based |
| DOC-10 | P2 | `DataContext.resumeWorkflow` | Client-only (no backend stage advance); `DashboardContext.resumeWorkflow` correctly POSTs `/api/campaigns/{slug}/resume` | Prefer the DashboardContext path |

## No defect (verified)
- `system\gate-rules.json` exists (11784 bytes); ENOENT warnings during tests are from deliberate mocks asserting graceful fallback.
- `agentRegistry.ts` does not exist, but canonical `src/data/agentBrainRegistry.ts` does — no dangling import.
