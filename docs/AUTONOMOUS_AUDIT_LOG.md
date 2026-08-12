# Autonomous Audit Log — digital-pr-agents

Master audit of `D:\Codex Folder\digital-pr-agents` (branch `master`, HEAD `e7d5bce8`, "Prepare Vultr deployment and fix DPR path bugs").

## Timeline

### Baseline (verified before edits)
- `npx tsc --noEmit` — EXIT 0
- `npm run lint` — EXIT 0
- `npm test` — 28 files / 1054 tests, all pass
- Env: Windows 11 Home, Node v25.9.0, npm 11.12.1, git 2.53.0.windows.2

### Phase A — subsystem mapping (4 parallel read-only agents)
1. Agent/brain layer → `agentRuntime`/`agentMemory`/`agentGuardrails`/`agentArtifacts`/`agentTrace` findings.
2. API routes → 57 route files inventoried.
3. Dashboard wiring → 31 pages; found 4 pages calling raw `fetch` on authenticated mutations.
4. Persistence/core → file-based persistence under `pitch-jobs/`, `db.ts` unused by routes.

### Phase B — defect repairs
| # | Defect | Fix | Evidence |
|---|--------|-----|----------|
| D1 | 4 pages raw `fetch` without auth headers (401 risk) | switched to `apiFetch` from `@/lib/clientApi` | pitch-selection, analysis, research-enrichment, data-extraction pages |
| P1-1 | `campaigns` DELETE raw `path.join` traversal | `resolveCampaignPath` + 400/404; removed duplicate preflight | campaigns/route.ts |
| P1-2 | `validation` GET raw path traversal | `resolveCampaignPath` | validation/route.ts |
| P1-3 | `scripts` route HTTP 500 with `success:true` | HTTP 200 + `success:false` envelope; workflow page surfaces error | scripts/route.ts, workflow/page.tsx |
| P1-4 | `brains/run` no-op when worker script missing | 503 `WORKER_SCRIPT_MISSING` | brains/run/route.ts |
| P1-7 | `llmService` dead `campaigns\` dir | → `pitch-jobs\` | llmService.ts (2 sites) |
| P1-8 | `files` POST resets stage-state on every save | merge/preserve existing state | files/route.ts |
| S4 | execute-stage mislabeled dependency errors | corrected S3→S4 labels | execute-stage/route.ts |
| — | `resume` route never advanced stage-state | full rewrite: parse/validate/clamp target, atomic write, audit log | resume/route.ts + resume-human-approval.test.ts |

### Phase C — security hardening
- `sessionAuth.ts`: added `safeTimingEqual` (crypto.timingSafeEqual); session signature verify no longer uses `!==`.
- `authGuard.ts`: static API token compare via `safeTimingEqual`; `shouldRequireAuth()` now fail-closed when `NODE_ENV=production`.
- `middleware.ts`: CSRF cookie/header compare via `safeTimingEqual`.

### Phase D — deployment readiness (hardcoded-path removal)
- `llmService.ts`: 24 hardcoded `D:\Codex Folder\digital-pr-agents\...` literals → `process.cwd()`-derived `DASHBOARD_ROOT`/`DATA_ROOT`/`LOGS_ROOT`/`PROMPTS_ROOT`/`PERSONAS_DIR` and `path.join(..., '..', 'pitch-jobs')`.
- 8 libs (gateEngine, stageExecutor, runtimeHealthCheck, brainResolver, replayManager, campaignPathResolver, claimLedgerManager, campaignTemplateManager): 19 hardcoded literals → `path.join(process.cwd(), ...)` (matches existing `requestGuard.ts` convention).
- `pipeline-gaps-path.test.ts`: expected path now computed from `process.cwd()` (portable).
- `.env.local.example`: removed dead `LLM_API_KEY`/`LLM_API_BASE`; added the 13 code-referenced vars that were missing (OPENROUTER_API_KEY, OPENCODE_API_KEY, DASHBOARD_BASE_URL, NEXT_PUBLIC_DASHBOARD_API_TOKEN, DASHBOARD_API_TOKENS_JSON, DASHBOARD_ENFORCE_ORIGIN, STRICT_REAL_ONLY, ALLOW_DEV_MOCK_ARTIFACTS, RUN_MODE, OTEL_LOG_ENDPOINT, OTEL_LOG_API_KEY, CHROME_DEBUG_PORT, PUPPETEER_DEBUG_PORT).

### Validation run (post all fixes)
- `npx tsc --noEmit` — PASS
- `npm run lint` — PASS (0 problems after removing unused import)
- `npm test` — 28 files / 1054 tests PASS
- `npm run build` — SUCCESS, zero warnings/errors
- Runtime: dev server `/api/health` → 200 `{"status":"ok",...}` (first launch). Subsequent automated launches hit a Windows `spawn EPERM`/hang quirk in the harness; not a code defect (see VALIDATION_RESULTS.md).

## Files changed (26)
See `git diff --stat` summary in the repository; all changes are uncommitted (no commits made).

## Notes / non-fixes (documented)
- `scripts/run-brain-worker.mjs` absent → brain worker feature blocked until created.
- `agentRegistry.ts` does not exist; canonical registry is `src/data/agentBrainRegistry.ts`.
- `.env.local.example` is gitignored (`dashboard/.env*`) → env template not version-controlled.
- Port drift: `DASHBOARD_BASE_URL` default 3002 vs `DASHBOARD-START.PS1` 3001.
