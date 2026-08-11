# Test Suite Audit — R1

- **Report**: `07_TEST_SUITE_AUDIT_R1.md`
- **Evidence window**: 2026-08-12, post-fix tree.
- **Result**: Full Vitest suite `28 files / 1054 tests passed` (exit 0). Includes 2 new regression tests for the pipeline-gaps path bug.

---

## 1. Suite Inventory

| Item | Value |
|---|---|
| Test runner | Vitest ^1.6.1 (`npx vitest run`) |
| Test location | `dashboard/src/tests/**/*.test.ts` |
| Test files | 28 |
| Total tests | 1054 (was 1052 at baseline; +2 new regression tests) |
| Duration | ~15s (transform ~34s, collect ~87s, tests ~27s) |
| Result | 28/28 files passed, 1054/1054 tests passed |

## 2. Test File Breakdown

| Test file | Focus |
|---|---|
| auto-progress-canonical-gate-enforcement-red.test.ts | Auto-progress + canonical gate enforcement (negative path) |
| auto-progress-human-approval.test.ts | Auto-progress human approval |
| campaign-state.test.ts | Campaign state service (real-filesystem contract, 33 tests) |
| dry-run.test.ts | Run-mode dry-run guards (no external fetch) |
| execute-stage-canonical-gate-enforcement.test.ts | Execute-stage canonical gate enforcement |
| execute-stage-canonical-gate-mapping-red.test.ts | Gate mapping (negative path) |
| execute-stage-human-approval.test.ts | Execute-stage human approval |
| execute-stage-route-coverage.test.ts | Execute-stage route coverage |
| execute-stage-s10-route.test.ts | S10 pitch-draft contract route |
| execute-stage-s11-route.test.ts | S11 optimized-pitch contract route |
| gate-engine.test.ts | Gate engine (mocked fs, 45 tests) |
| gate-system-provenance.test.ts | Gate system provenance |
| gates-route-human-approval.test.ts | Gates route human approval |
| human-approval-route.test.ts | Human approval route |
| integration-readiness.test.ts | Integration readiness checks |
| llm-stage-validator.test.ts | LLM stage validator |
| llm-utils-contract.test.ts | LLM utilities contract |
| model-routing.test.ts | Model routing config |
| pitch-governance-validator.test.ts | Pitch governance validator (mocked fs) |
| pipeline-gaps-path.test.ts | **NEW** — pipeline-gaps path regression (2 tests) |
| prompt-version-resolver.test.ts | Prompt version resolver |
| prompt-version.test.ts | Prompt version logic |
| replay-manager-human-approval.test.ts | Replay manager human approval |
| replay-route-prompt-version.test.ts | Replay route prompt version |
| resume-human-approval.test.ts | Resume human approval |
| s10-contract.test.ts | S10 output contract |
| s11-contract.test.ts | S11 output contract |
| stage-executor.test.ts | Stage executor |

## 3. Notable Run-Time Stderr

`Failed to load gate rules: Error: ENOENT: D:\Codex Folder\digital-pr-agents\system\gate-rules.json` appears in stderr during test runs.

- **Root cause**: `gate-engine.test.ts` (and other gate tests) fully mock `fs/promises` with an in-memory file map (`vi.hoisted` + `vi.mock('fs/promises')`). `gateEngine.loadGateRules()` calls `fs.readFile(rulesPath)` where `rulesPath` is the real hardcoded `...\system\gate-rules.json`; the mock map has no entry for it, so the mock throws `ENOENT`, which `loadGateRules` catches and logs.
- **Impact**: None on results — the mocked tests supply their own gate-rule fixtures via `addSystemFile(...)`, and the caught error returns `{ gates: [] }` only when the mock path is hit. All gate tests pass (e.g., gate-engine 45/45).
- **Runtime truth**: The real `system/gate-rules.json` exists (verified: valid JSON, 11 gates) and loads fine outside the mocked environment. This is test-environment noise, not a runtime bug.
- **Classification**: `INFORMATIONAL` — no fix applied (fixing would mean making `loadGateRules` injectable or populating the mock map; both are out-of-scope refactors and the noise is harmless).

## 4. Regression Coverage for Batch Fixes

| Fix | Regression test | Status |
|---|---|---|
| campaign-state `expectedFiles.filter(async…)` never awaited | existing `campaign-state.test.ts` real-filesystem contract + explicit 30000ms timeout | 33/33 pass |
| `PIPELINE_GAPS_FILE` malformed `\d` escape | `pipeline-gaps-path.test.ts` (asserts exact write/read path) | 2/2 pass |

## 5. Findings Summary

| # | Finding | Classification |
|---|---|---|
| TS1 | 28 files / 1054 tests pass, exit 0 | `PASS` |
| TS2 | Gate-rule ENOENT stderr noise in mocked fs tests | `INFORMATIONAL` |
| TS3 | Regression tests exist for both batch fixes | `PASS` |
| TS4 | No tests deleted or weakened (timeout increased with justification instead) | `PASS` |
