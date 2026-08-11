# Reproducible Bug Fix Log — R1

- **Report**: `16_REPRODUCIBLE_BUG_FIX_LOG_R1.md`
- **Scope**: All code defects found and fixed during the whole-project debugging run (R1). Batch patch contract respected (source/test files only; no security weakening; no test deletion).
- **Result**: **2 reproducible bugs fixed**, both with regression coverage; full suite `1054/1054` pass.

---

## Bug 1 — `campaignStateService.ts` async `.filter()` never awaited

| Field | Value |
|---|---|
| Module | `dashboard/src/lib/campaignStateService.ts` |
| Location | `checkOutputQuality` (approximately line 212) |
| Symptom | `artifactStatus` misreported as `exists` for missing stage artifacts; stage quality (`outputQuality`) could be wrong; redundant filesystem reads. |
| Root cause | `expectedFiles.filter(async f => fs.exists(f))` — the predicate returns a `Promise`, which is always truthy, so the filter **kept every file**. The exists-check result was never awaited or inspected, so `existingCount` always equaled the full file list and `artifactStatus` was wrong. |
| Why it was reproducible | Deterministic: any campaign with at least one missing expected file produced the wrong `artifactStatus`; the failure was hidden because the code path did not throw. |
| Fix | Replace with an awaited check-then-filter: `const existingResults = await Promise.all(expectedFiles.map((f) => checkFileExists(path.join(campaignPath, f)))); const existingCount = existingResults.filter((r) => r.exists).length;` — existence is now actually awaited and counted. (A content/fallback loop above still performs its own read for quality classification; the fix corrected the count logic, the primary defect.) |
| Regression coverage | `campaign-state.test.ts` real-filesystem contract test (explicit `30000` ms timeout; 33/33 pass) exercises the corrected count logic against real campaign directories. |
| Batch evidence | Post-fix: `checkOutputQuality` awaited; suite pass count increased correctly; no test deleted. |

## Bug 2 — `llmService.ts` malformed `\d` escape in `PIPELINE_GAPS_FILE`

| Field | Value |
|---|---|
| Module | `dashboard/src/lib/llmService.ts` |
| Location | Line 1667 (module constant `PIPELINE_GAPS_FILE`) |
| Before | `const PIPELINE_GAPS_FILE = 'D:\\Codex Folder\digital-pr-agents\\dashboard\\data\\pipeline-gaps.json'` |
| Root cause | `\d` is not a recognized JS string escape, so it evaluates to a literal `d`. Evaluated path: `D:\Codex Folderdigital-pr-agents\dashboard\data\pipeline-gaps.json` (backslash between `Folder` and `digital-pr-agents` lost). |
| Symptom | `detectPipelineGap()` (line 1669) called `fs.writeFileSync` against a non-existent directory → `ENOENT`, swallowed by the surrounding `try/catch` → **pipeline-gap data never persisted**. `getPipelineRequirements()` (line 1690) always returned `[]` because its `fs.existsSync` guard never saw the file. |
| Why it was reproducible | Verified by evaluating the exact string literal with Node: printed `"D:\\Codex Folderdigital-pr-agents\\dashboard\\data\\pipeline-gaps.json"`, `existsSync` → `false`. |
| Fix | `'D:\\Codex Folder\\digital-pr-agents\\dashboard\\data\\pipeline-gaps.json'` (added the missing second backslash). Evaluated path now `D:\Codex Folder\digital-pr-agents\dashboard\data\pipeline-gaps.json`; parent dir verified existing and writable. |
| Regression coverage | **New** `dashboard/src/tests/pipeline-gaps-path.test.ts` (2 tests): asserts `writeFileSync` receives the exact corrected path (and no `Folderdigital`); asserts the read `existsSync` call uses the exact corrected path. Uses `vi.spyOn` on the real `fs` singleton (module's inline `require('fs')` is not intercepted by `vi.mock`). |
| Search sweep | Regex over `dashboard/src` and `scripts` for single-backslash escapes inside `D:\` string literals matched **only** this line — no other occurrence. |

## Patch Contract Compliance

| Rule | Status |
|---|---|
| Source/test files touched: `campaignStateService.ts`, `campaign-state.test.ts` (timeout), `llmService.ts`, `pipeline-gaps-path.test.ts` (new) = 4 | within 15 limit |
| Doc/script files: 20 reports under `docs/debugging/` + index | within limits |
| No `@ts-ignore` / `@ts-expect-error` added | `PASS` |
| No security weakening | `PASS` |
| No test deleted to make a suite pass; timeout increased only with justification | `PASS` |
| Fixes are reproducible-bug-only | `PASS` |
| Every fixed bug has regression coverage | `PASS` |

## Post-Fix Validation (all exit 0 / pass)

- `tsc --noEmit` → 0
- `npm run lint` → 0
- `npx vitest run` → 28 files / 1054 tests passed
- `npm run build` → 0
