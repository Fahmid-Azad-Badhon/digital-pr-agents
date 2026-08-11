# Package and Script Audit — R1

Batch: `DPR-VULTR-PREPARATION-AND-WHOLE-PROJECT-LOCAL-DEBUGGING-R1`

## Root Package (`D:\Codex Folder\digital-pr-agents\package.json`)

| Attribute | Value |
|-----------|-------|
| name | digital-pr-agents |
| version | 1.0.0 |
| engines | node >=18.0.0, npm >=9.0.0 |
| Next.js | 14.2.3 |
| React | 18.3.1 |
| TypeScript | ^5.4.5 |
| ESLint | ^8.57.0, eslint-config-next ^14.2.3 |

### Root Scripts

| Script | Command | Classification |
|--------|---------|----------------|
| dev | next dev | SAFE_WITH_CAUTION (starts server) |
| build | next build | SAFE_TO_RUN_LOCAL |
| start | next start | SAFE_WITH_CAUTION (starts server) |
| lint | next lint | SAFE_TO_RUN_LOCAL |
| typecheck | tsc --noEmit | SAFE_TO_RUN_LOCAL |
| validate | node scripts/validate-all.js | SAFE_TO_RUN_LOCAL |
| pitch:new | node scripts/new-pitch-job.js | SAFE_TO_RUN_LOCAL |
| pitch:draft | node scripts/draft-study-input.js | SAFE_WITH_CAUTION |
| pitch:validate | node scripts/validate-stage.js | SAFE_TO_RUN_LOCAL |
| browser:start | launch-debug-chrome.ps1 Launch | FORBIDDEN_IN_THIS_BATCH |
| browser:stop | launch-debug-chrome.ps1 Stop | FORBIDDEN_IN_THIS_BATCH |
| browser:health | launch-debug-chrome.ps1 Status | FORBIDDEN_IN_THIS_BATCH |
| browser:test | launch-debug-chrome.ps1 Verify | FORBIDDEN_IN_THIS_BATCH |
| muckrack:* | node muck-rack-automation/... | REQUIRES_SECRET / FORBIDDEN |
| export:doc | export-google-doc.js | REQUIRES_SECRET |
| import:muckrack | import-muckrack-output.js | REQUIRES_SECRET |
| skills:validate | skills/validate-skills.js | SAFE_TO_RUN_LOCAL |
| skills:audit | skills/audit-skills.js | SAFE_TO_RUN_LOCAL |

## Dashboard Package (`dashboard/package.json`)

| Attribute | Value |
|-----------|-------|
| name | digital-pr-dashboard |
| version | 1.0.0 |
| Next.js | 14.2.3 |
| React | 18.3.1 |
| TypeScript | 5.4.5 |
| Vitest | ^1.6.1 |
| ESLint | ^9.39.4, eslint-config-next ^16.2.6 |
| sqlite3 | 5.1.7 (native module — Windows build required) |

### Dashboard Scripts

| Script | Command | Classification |
|--------|---------|----------------|
| dev | next dev | SAFE_WITH_CAUTION |
| dev:3002 | next dev -p 3002 | SAFE_WITH_CAUTION |
| dev:stable | launch-dashboard-stable.ps1 | SAFE_WITH_CAUTION |
| build | next build | SAFE_TO_RUN_LOCAL |
| start | next start | SAFE_WITH_CAUTION |
| lint | eslint src ... | SAFE_TO_RUN_LOCAL |
| test | vitest run | SAFE_TO_RUN_LOCAL |
| test:watch | vitest | SAFE_WITH_CAUTION |
| test:model-routing | vitest run src/tests/model-routing.test.ts | SAFE_TO_RUN_LOCAL |
| test:dashboard-routing | vitest run src/tests/dashboard-routing.test.ts | SAFE_TO_RUN_LOCAL |
| typecheck | tsc --noEmit | SAFE_TO_RUN_LOCAL |
| test:dry-run | vitest run src/tests/dry-run.test.ts | SAFE_TO_RUN_LOCAL |
| verify:mutation-audit | node scripts/verify-mutation-audit.mjs | SAFE_TO_RUN_LOCAL |
| verify:api-guardrails | node scripts/verify-api-guardrails.mjs | SAFE_TO_RUN_LOCAL |
| verify:high-risk-audit | node scripts/verify-high-risk-explicit-audit.mjs | SAFE_TO_RUN_LOCAL |
| verify:platform-hardening | node scripts/verify-platform-hardening.mjs | SAFE_TO_RUN_LOCAL |
| verify:stage-brain-bindings | node scripts/verify-stage-brain-bindings.mjs | SAFE_TO_RUN_LOCAL |
| verify:integration-readiness | node scripts/verify-integration-readiness.mjs | SAFE_TO_RUN_LOCAL |
| verify:strict-audit-contract | node scripts/verify-strict-audit-contract.mjs | SAFE_TO_RUN_LOCAL |
| verify:brain-worker-independence | node scripts/verify-brain-worker-independence.mjs | SAFE_TO_RUN_LOCAL |
| verify:orchestration-coverage | node scripts/verify-orchestration-coverage.mjs | SAFE_TO_RUN_LOCAL |
| verify:enterprise-depth | node scripts/verify-enterprise-depth.mjs | SAFE_TO_RUN_LOCAL |
| verify:enterprise-rollout | node scripts/verify-enterprise-rollout.mjs | SAFE_TO_RUN_LOCAL |
| verify:auth-session-roles | node scripts/verify-auth-session-roles.mjs | SAFE_TO_RUN_LOCAL |
| verify:session-csrf | node scripts/verify-session-csrf-guard.mjs | SAFE_TO_RUN_LOCAL |
| verify:external-hardening | node scripts/verify-external-hardening.mjs | SAFE_TO_RUN_LOCAL |
| verify:integration-contract-smoke | node scripts/verify-integration-contract-smoke.mjs | SAFE_TO_RUN_LOCAL |
| verify | typecheck + test + lint + build | SAFE_TO_RUN_LOCAL (heavy) |
| verify:ci | 15 verify scripts + build | SAFE_TO_RUN_LOCAL (heavy) |

## Dependency Notes

- `sqlite3@5.1.7` is a native module; must be rebuilt for Windows on the target VM
  (`npm ci` on the VM).
- `browser-tools` depends only on `ws@^8.16.0`.
- Root and dashboard use npm (lockfiles present).

## Executed in This Batch

- `typecheck` (dashboard) — PASS
- `lint` (dashboard) — PASS
- `test` (dashboard) — 1052 passed, 1 fixed failure
- `build` (dashboard) — PASS

No `npm install`/`npm ci` was needed or run.
