# Whole-Project Debugging Risk Register — R1

- **Report**: `17_WHOLE_PROJECT_DEBUGGING_RISK_REGISTER_R1.md`
- **Purpose**: Consolidated, evidence-backed risk inventory from the R1 audits (reports 04-15), with severity, likelihood, and remediation owner/status.
- **Severity legend**: `LOW` / `MED` / `HIGH` / `CRIT`.

---

## 1. Open Risks

| # | Risk | Audit ref | Severity | Likelihood | Impact | Status / Remediation |
|---|---|---|---|---|---|---|
| R1 | 50 hardcoded `D:\Codex Folder\...` literals (non-portable to `C:\dpr\...` VM layout) | 04 | HIGH | HIGH (at deployment) | Campaign/gate/LLM modules resolve to wrong or non-existent paths on the Vultr VM; runtime failures after deployment | `OPEN` — must reconcile paths at deploy (docs/deployment/vultr path-mapping guidance); refactor to env/`requestGuard`-derived roots in a future batch |
| R2 | `@system/* → ../system/*` parent-directory alias depends on `dashboard/` sitting beside `system/` | 06/03 | MED | MED | Typecheck/build breakage if layout differs | `OPEN` — documented; VM must preserve relative layout |
| R3 | Password comparison in `/api/auth/login` is plaintext equality (no hash / timing-safe) | 05 | MED | MED | Timing side-channel + plaintext-at-rest in `DASHBOARD_AUTH_USERS_JSON` | `OPEN` — acceptable for local admin dashboard; harden before internet-exposed deployment |
| R4 | Rate-limit buckets + internal audit token are per-process/in-memory | 05 | MED | LOW | Limits reset on restart; multi-process deployments not uniformly limited | `OPEN` — fine for single-node Vultr VM; document if scaling |
| R5 | `sqlite3@5.1.7` native binary must be re-resolved on VM | 08 | MED | MED | Build/runtime failure if prebuilt missing | `OPEN` — `npm ci` in `dashboard/` on VM (batch policy allows) |
| R6 | `scripts/*.cmd` prefer portable Node at `..\..\.tools\node-v24.15.0-win-x64\node.exe` (outside repo tree) with fallback to `node` | 02/11 | MED | LOW | Script runner fails if neither Node exists on VM | `OPEN` — VM must provide Node on PATH or `.tools`; documented |
| R7 | Gate-rule ENOENT stderr noise from mocked-fs tests | 07 | LOW | LOW | Cosmetic; no test failure | `OPEN` — no action (harmless) |
| R8 | Google OAuth not configured on this machine | 14 | LOW | HIGH (deploy) | Stage 10 export blocked until configured | `OPEN` — setup steps in deployment docs; `not_configured` is correct current state |
| R9 | `browser-tools/` contains untracked temp files (`temp-*.js`, `test-write.txt`) | 10 | LOW | LOW | Repo hygiene | `OPEN` — leave as-is (untracked, pre-existing) |
| R10 | `campaignStateService.checkOutputQuality` still performs two existence passes (content loop + count loop) | 16 | LOW | LOW | Minor extra I/O on real campaigns | `OPEN` — optimization opportunity; not a correctness defect |

## 2. Resolved Risks (fixed in R1)

| # | Risk | Ref | Resolution |
|---|---|---|---|
| F1 | `campaignStateService` async-filter never awaited → wrong `artifactStatus` + hidden state errors | 16 | FIXED + 33/33 regression |
| F2 | `PIPELINE_GAPS_FILE` malformed `\d` escape → pipeline-gap data never persisted | 16 | FIXED + new 2-test regression |

## 3. Verified Controls (no action needed)

- Secret-file gitignore coverage (`.env*`, `.secrets/`, keys) — PASS (05)
- HMAC-signed expiring sessions + strict cookies + CSRF — PASS (05)
- Mutation rate limiting + request-id + mutation audit — PASS (05/12)
- Campaign path boundary + id/stage sanitizers across 19+ routes — PASS (12)
- No Playwright/Puppeteer; CDP tooling dependency is only `ws` — PASS (10)
- Dry-run blocks external scripts/LLM/browser actions — PASS (11/13)
- Build, typecheck, lint, tests all green post-fix — PASS (06/07/08)
- Runtime start evidenced via help-only mode; no listener left running — PASS (09)

## 4. Top Recommendation

Priority order for the deployment batch: (1) resolve hardcoded paths to `requestGuard`/env-derived roots, (2) validate `@system` layout on VM, (3) `npm ci` sqlite3 + Node provisioning, (4) harden login password comparison before any internet exposure.
