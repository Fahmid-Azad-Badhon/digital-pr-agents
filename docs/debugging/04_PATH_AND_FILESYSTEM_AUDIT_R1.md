# Path and Filesystem Audit — R1

- **Report**: `04_PATH_AND_FILESYSTEM_AUDIT_R1.md`
- **Scope**: Hardcoded filesystem paths, relative-path resolution, path-safety boundaries, and filesystem write targets in the Digital PR Orchestrator (repo root `D:\Codex Folder\digital-pr-agents`).
- **Audit method**: Source-level grep + manual verification. No filesystem mutation was performed during this audit beyond the bug-fix verification described below.
- **Result**: `2` hardcoded-path findings (1 confirmed bug, FIXED), `1` environment-dependency note, `11` relative-path PASS checks.

---

## 1. Hardcoded Absolute Paths

### 1.1 Confirmed Bug — `PIPELINE_GAPS_FILE` malformed escape (FIXED)

| Field | Value |
|---|---|
| File | `dashboard/src/lib/llmService.ts` |
| Line | 1667 (before fix) |
| Before | `const PIPELINE_GAPS_FILE = 'D:\\Codex Folder\digital-pr-agents\\dashboard\\data\\pipeline-gaps.json'` |
| Root cause | The segment `\digital` contains a single backslash. In a JS string literal, `\d` is not a recognized escape, so it evaluates to a literal `d`. The resolved path became `D:\Codex Folderdigital-pr-agents\dashboard\data\pipeline-gaps.json` (missing the `\` separator). |
| Evidence | `node -e` evaluation of the exact literal printed `"D:\\Codex Folderdigital-pr-agents\\dashboard\\data\\pipeline-gaps.json"` and `fs.existsSync` returned `false` (before fix). |
| Impact | `detectPipelineGap()` (line 1669) wrapped writes in a silent `try/catch` → `writeFileSync` threw `ENOENT` for the non-existent directory `D:\Codex Folderdigital-pr-agents\...`, so pipeline-gap data was **never persisted**. `getPipelineRequirements()` (line 1690) always returned `[]` because its `existsSync` guard never found the file. |
| Fix | Changed the literal to `'D:\\Codex Folder\\digital-pr-agents\\dashboard\\data\\pipeline-gaps.json'` (added the missing second backslash). |
| Regression test | Added `dashboard/src/tests/pipeline-gaps-path.test.ts` (2 tests): asserts `writeFileSync` receives the exact corrected path, and `existsSync` for the read path uses the exact corrected path; also asserts the path does not contain `Folderdigital`. |
| Verification | Corrected path evaluates to `D:\Codex Folder\digital-pr-agents\dashboard\data\pipeline-gaps.json`; parent `...\dashboard\data` exists; `write`+`unlink` round-trip succeeded; 2/2 regression tests pass; full suite 1054/1054 pass; typecheck exit 0; lint pass. |
| Classification | `FIXED` |

> Note: The single other occurrence of a `\d`-style single-backslash path anomaly was searched repo-wide (regex `'D:\\[^']*?(?<!\\)\\(?!\\)[^']*?'`). Only `llmService.ts:1667` matched; no other hardcoded path in `dashboard/src` or `scripts` has a malformed escape.

### 1.2 Environment Dependency — Windows-specific absolute roots (INFORMATIONAL, no action this batch)

The following modules hardcode `D:\Codex Folder\digital-pr-agents\...`. They are functionally correct **on this machine** but are non-portable to a different drive/folder (e.g., the planned Vultr Windows VPS deployment path is `C:\dpr\...` per `docs/deployment/vultr/01_*`). This is a **documented deployment risk**, not a runtime bug on the current machine.

| Module | Root(s) hardcoded |
|---|---|
| `dashboard/src/lib/campaignPathResolver.ts:24` | `...\pitch-jobs` |
| `dashboard/src/lib/gateEngine.ts:16-17` | `...\pitch-jobs`, `...\system` |
| `dashboard/src/lib/stageExecutor.ts:33-34` | `...\dashboard\prompts\campaign`, `...\pitch-jobs` |
| `dashboard/src/lib/replayManager.ts:22-23` | `...\pitch-jobs`, `...\system` |
| `dashboard/src/lib/claimLedgerManager.ts:15-16` | `...\pitch-jobs`, `...\system` |
| `dashboard/src/lib/campaignTemplateManager.ts:14-15` | `...\templates\campaigns`, `...\pitch-jobs` |
| `dashboard/src/lib/runtimeHealthCheck.ts:18-20` | `...\brain`, `...\schemas`, `...\pitch-jobs` |
| `dashboard/src/lib/brainResolver.ts:18,144,185-186,234` | `...\brain`, legacy `...\dashboard\src\brain`, `...\dashboard\skills\agent-brains` |
| `dashboard/src/lib/llmService.ts` (24 constants) | `...\dashboard\logs`, `...\dashboard\snapshots`, `...\dashboard\data\*.json`, `...\dashboard\prompts\personas`, `...\dashboard\prompts\anchors.json`, `...\campaigns\` (2 inline `s4Path`) |
| `scripts/muckrack-collector.js:5` | `D:\Codex Folder\digital-pr-agents` |

**Count**: 50 `D:\Codex Folder\...` literal matches in `dashboard/src` (24 in `llmService.ts`), 1 in `scripts/muckrack-collector.js`.

**Assessment**: All hardcoded paths point to locations that **exist** on this machine (verified for `pitch-jobs`, `system`, `data`, `logs`, `prompts`, `templates`, `brain`, `schemas`). No dead/broken path was found beyond the fixed `PIPELINE_GAPS_FILE`. Deployment must reconcile these with the target machine layout (see `docs/deployment/vultr/14_*` path-mapping guidance). Not patched this batch: changing 50 literals is a behavior-risky cross-cutting refactor outside the reproducible-bug patch contract.

## 2. Relative-Path Resolution (cwd-derived) — PASS

The request-guard layer derives roots from `process.cwd()` and is therefore layout-flexible within the repo:

| Module | Resolver |
|---|---|
| `dashboard/src/lib/requestGuard.ts:5-6,38-43` | `PITCH_JOBS_ROOT = join(cwd, '..', 'pitch-jobs')`, `SCRIPTS_ROOT`, `REPO_ROOT`, `DATA_ROOT`, `LOGS_ROOT`, `SYSTEM_ROOT`, `BROWSER_TOOLS_ROOT`, `BACKUPS_ROOT` |
| `dashboard/src/lib/stageOutputContractValidator.ts:5,8` | `path.resolve(cwd, '..', 'schemas', 'campaign-intake.schema.json')`, `...pitch-draft.schema.json` |
| `dashboard/src/lib/gateEngine.ts:278` | `path.resolve(cwd, '..', 'schemas', 'validation-report.schema.json')` |
| `dashboard/src/app/api/brains/run/route.ts:12` | `join(cwd, 'logs', 'brain-jobs')` |
| `dashboard/src/app/api/brains/job/route.ts:7` | `join(cwd, 'logs', 'brain-jobs')` |
| `dashboard/src/app/api/connection-audit/route.ts:51` | `const DASHBOARD_ROOT = process.cwd()` |
| `dashboard/src/lib/integrationReadiness.ts:243` | `join(cwd, 'browser-tools')` |

**Note**: These assume `process.cwd()` = `...\dashboard` (which holds `package.json` scripts and `next start`). Correct when launched from `dashboard/`; a mismatched cwd would resolve one level up incorrectly. This is the intended design; no defect found.

## 3. Path-Safety Boundaries — PASS

- `requestGuard.resolveCampaignPath` (lines 19-26): resolves `PITCH_JOBS_ROOT/campaignId`, normalizes root, and rejects any candidate that is **not** `startsWith(normalizedRoot + path.sep)` and not equal to the root → blocks `..` traversal outside `pitch-jobs`.
- `requestGuard.assertValidCampaignId` / `isValidCampaignId` (lines 8-17): enforces `/^[a-z0-9][a-z0-9-_]{1,120}$/i`, blocking path-separator injection (`/`, `\`, `.`, spaces).
- `requestGuard.sanitizeStageFile` (lines 28-36): length 3-120 and `/^[a-z0-9._-]+$/i`, blocking traversal via stage-file names.
- `requestGuard.sanitizeText` (lines 45-55): strips control chars, trims, caps length.
- **Usage coverage**: `resolveCampaignPath`/`assertValidCampaignId` used in 19 API routes (campaigns, gates, scripts, backup, quality, status, stream, extract, execute-stage, continue, replay, auto-progress, connection-audit, strict-audit, validate, diagnostics/consistency, angles, journalists, analysis, research-enrichment, files/*, handoff, approve, evaluate, workflow, questions). No route found that builds a campaign path without the guard.
- **Boundary normalization style**: string-prefix checks use exact `path.sep` and `path.resolve` normalization (not case-insensitive or trailing-separator tolerant). On Windows `path.resolve` normalizes drive-case as-is; consistent within the module. Acceptable for local Windows use.

## 4. Filesystem Write Targets

| Write location | Used by | Guard |
|---|---|---|
| `pitch-jobs/{slug}/...` (stage artifacts) | execute-stage, gates, scripts, backup, replay, angles, files | `resolveCampaignPath` boundary enforced |
| `system/` (`gate-rules.json`, `agent-question-bank.json`, `agent-question-routing.json`) | gateEngine, agentQuestioningSystem | read-only in practice; written by repo content |
| `dashboard/data/*.json` (learning/feedback/cache/state files) | llmService (24 constants) | hardcoded path (correct after fix) |
| `dashboard/logs/` (brain-jobs, validation-failures) | brains routes, llmService | `cwd`-derived |
| `pitch-jobs-backups/` | backup route via `BACKUPS_ROOT` | `cwd`-derived |
| `dashboard/snapshots/` | llmService snapshot feature | hardcoded path |

No filesystem write was observed writing outside the repo root.

## 5. Findings Summary

| # | Finding | Classification |
|---|---|---|
| F1 | `PIPELINE_GAPS_FILE` malformed `\d` escape → pipeline-gap persistence silently broken | `FIXED` |
| F2 | 50 hardcoded `D:\Codex Folder\...` literals (non-portable to deployment target) | `INFORMATIONAL` |
| F3 | `pitch-jobs` + `system` hardcoded in 7 lib modules vs cwd-derived in requestGuard | `INFORMATIONAL` |
| F4 | Campaign path boundaries via `resolveCampaignPath` + id/stage sanitizers | `PASS` |
| F5 | Schema paths resolved relative to cwd | `PASS` |
| F6 | Scripts use `%~dp0`/`$PSScriptRoot` (script-relative, portable) | `PASS` |
