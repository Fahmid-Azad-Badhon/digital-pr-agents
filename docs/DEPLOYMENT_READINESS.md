# Deployment Readiness — digital-pr-agents

Assessment against the branch goal ("Prepare Vultr deployment"). Readiness level: **prepared for a fresh host; a few decisions remain.**

## What was fixed
### 1. Hardcoded machine paths removed (all 43 sites)
- `src/lib/llmService.ts` — 24 literals of `D:\Codex Folder\...` replaced with `process.cwd()`-derived constants (`DASHBOARD_ROOT`, `DATA_ROOT`, `LOGS_ROOT`, `PROMPTS_ROOT`, `PERSONAS_DIR`) and `path.join(DASHBOARD_ROOT, '..', 'pitch-jobs')` for campaign reads.
- 8 libs — `gateEngine.ts`, `stageExecutor.ts`, `runtimeHealthCheck.ts`, `brainResolver.ts`, `replayManager.ts`, `campaignPathResolver.ts`, `claimLedgerManager.ts`, `campaignTemplateManager.ts` — 19 literals replaced with `path.join(process.cwd(), ...)` / `path.join(process.cwd(), '..', ...)`, matching the existing `requestGuard.ts` convention (`PITCH_JOBS_ROOT = path.join(process.cwd(), '..', 'pitch-jobs')`).
- Invariant: with cwd = `dashboard/`, all resolved paths are byte-identical to the previous hardcoded values on this machine (verified by the full 1054-test suite + build + health check). Portability now holds for any host/CI.

### 2. Security hardening
- `shouldRequireAuth()` is now fail-closed in `NODE_ENV=production` (`authGuard.ts`) unless `DASHBOARD_AUTH_REQUIRED=false` is set explicitly.
- Session signature, static API token, and CSRF comparisons use `crypto.timingSafeEqual` (`safeTimingEqual`).

### 3. Path traversal closed
- `campaigns` DELETE and `validation` GET now resolve campaign dirs via `resolveCampaignPath` (id format regex + root containment), returning 400/404 instead of reading/removing arbitrary paths.

### 4. Env template parity
- `.env.local.example` updated: dead `LLM_API_KEY`/`LLM_API_BASE` removed; 13 code-referenced vars documented (`OPENROUTER_API_KEY`, `OPENCODE_API_KEY`, `DASHBOARD_BASE_URL`, `NEXT_PUBLIC_DASHBOARD_API_TOKEN`, `DASHBOARD_API_TOKENS_JSON`, `DASHBOARD_ENFORCE_ORIGIN`, `STRICT_REAL_ONLY`, `ALLOW_DEV_MOCK_ARTIFACTS`, `RUN_MODE`, `OTEL_LOG_ENDPOINT`, `OTEL_LOG_API_KEY`, `CHROME_DEBUG_PORT`, `PUPPETEER_DEBUG_PORT`).

## Remaining items / decisions
1. **Commit `.env.local.example`** — it is currently gitignored by `.gitignore:57` (`dashboard/.env*`). Add `!dashboard/.env.local.example` and commit it so fresh clones/deploys have the template. (Local template already updated.)
2. **Align ports** — `DASHBOARD_BASE_URL` default is `3002`, `DASHBOARD-START.PS1` runs on `3001`, and `GOOGLE_REDIRECT_URI` example is `3002`. Choose one and set it consistently in the deployed env.
3. **Set production env vars** — at minimum: `DASHBOARD_AUTH_REQUIRED=true`, `DASHBOARD_API_TOKEN`, `DASHBOARD_SESSION_SECRET`, `INTERNAL_AUDIT_TOKEN`, `NEXT_PUBLIC_DASHBOARD_API_TOKEN`, `DASHBOARD_BASE_URL`, `OPENROUTER_API_KEY` (or `OPENCODE_API_KEY`), `JINA_API_KEY`. `DASHBOARD_API_TOKEN`/`DASHBOARD_SESSION_SECRET` must be strong random values.
4. **Brain worker script** — `scripts/run-brain-worker.mjs` does not exist; create it (or exclude the `brains/run` feature) before relying on agent runs.
5. **Filesystem persistence expectations** — app reads/writes `<repo>/pitch-jobs`, `<repo>/system`, `<repo>/schemas`, `<repo>/brain`, plus `<dashboard>/data`, `<dashboard>/logs`, `<dashboard>/prompts`, `<dashboard>/snapshots`. Ensure these exist/writable on the host (or set up a volume). Note the dashboard `data/`/`logs/` dirs are created lazily by the app.
6. **Port 3002** — brains/run self-references via `DASHBOARD_BASE_URL`; set it to the deployed base URL (behind the proxy) rather than localhost.
7. **Origin enforcement** — cross-origin mutations are rejected when `Origin` header host ≠ request host (unless `DASHBOARD_ENFORCE_ORIGIN=false`). Behind a reverse proxy, ensure `Host`/`Origin` are forwarded correctly (e.g., `X-Forwarded-*` and correct proxy headers) or the dashboard UI may see 403 on mutations.

## Build/runtime evidence on this machine
- `npm run build` — clean (0 warnings/errors).
- Dev-server `GET /api/health` — 200 OK.
- 28 test files / 1054 tests green; `tsc` and `lint` clean.
