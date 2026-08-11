# Campaign State and Runtime Events Audit — R1

- **Report**: `15_CAMPAIGN_STATE_AND_RUNTIME_EVENTS_AUDIT_R1.md`
- **Scope**: `campaignStateService.ts` canonical state source, the async-filter bug fixed this batch, runtime events, and human-approval routing.
- **Result**: `PASS` — bug fixed with regression coverage; state service is the canonical backend source; no workflow execution this batch.

---

## 1. Campaign State Service (`lib/campaignStateService.ts`)

- Declared (header) as **single source of truth** for campaign state across all API routes (status/progress/stats).
- Produces `CampaignStateResult`: `overallStatus` (draft/running/paused/completed/failed/waiting_for_human_approval/blocked), `currentStage`, `progress`, `completedStages`, `remainingStages`, `canWorkflowContinue`, `humanActionRequired`, `humanActionAt`.
- Per-stage `StageStateInfo`: status, progress, timestamps, errorCode, `outputQuality` (real/fallback/unknown), `artifactStatus` (exists/missing/empty/thin), `provenanceStatus`, `auditStatus`, `canRun`, `canRetry`, `requiresHumanApproval`.
- Depends on `requestGuard.PITCH_JOBS_ROOT` (cwd-derived), `integrationReadiness` (`stageRequiresIntegration`), `provenance` classification, `fallbackMarkers`, `fileReadSafety`, `runMode`.
- Real campaign directory enumeration (`fs.readdir(PITCH_JOBS_ROOT)`, per-folder `getCampaignState`).

## 2. Fixed Bug — async `.filter()` in `checkOutputQuality`

| Field | Value |
|---|---|
| File | `dashboard/src/lib/campaignStateService.ts` (approx. line 212 region, `checkOutputQuality`) |
| Before | `expectedFiles.filter(async f => fs.exists(f))` — the async predicate's promises were **never awaited**; every element passed the truthy-filter, so `existingCount` always equaled the full file list, and each file was read a second time via a duplicate map. |
| Impact | `artifactStatus` miscomputed as `exists` even for missing files; redundant filesystem reads; nondeterministic state on slow filesystems. |
| Fix | `const existing = await Promise.all(expectedFiles.map(async f => ({ f, exists: await checkExists(f) })))` then `existing.filter(r => r.exists)` (equivalent structure: awaited map + filter on result). |
| Regression coverage | `campaign-state.test.ts` real-filesystem contract test with explicit 30000ms timeout (33/33 pass) + full suite 1054/1054. |
| Classification | `FIXED` |

## 3. Runtime Events

- Mutation audit events (`x-request-id`, action, campaignId, actor, ip, UA) emitted by middleware for all non-public mutations via `_internal/mutation-audit` (report 05).
- Activity log maintained client-side in `DataContext.tsx` (capped at 500 entries) and route-level notifications feed the UI.
- Human-approval flow: `execute-stage`, `auto-progress`, `gates`, `human-approval`, `resume`, `questions`, `approve`, `replay` routes + `provenance` classify approval sources; human-gate stages (`isHumanGate`) pause workflow.
- Replay/prompt-version: `replayManager` (hardcoded `pitch-jobs`/`system` paths per report 04) with `replay-route-prompt-version` test coverage.

## 4. Batch Execution Status

- No campaign workflow, stage execution, or human-approval mutation executed this batch (dry_run; POST mutation routes not invoked).

## 5. Findings Summary

| # | Finding | Classification |
|---|---|---|
| C1 | `checkOutputQuality` async-filter bug fixed (awaited map+filter) | `FIXED` |
| C2 | Real-filesystem contract test covers campaign state (33/33) | `PASS` |
| C3 | State service is canonical backend source consumed by status/stats routes | `PASS` |
| C4 | Human-approval + provenance + integration-gating present | `PASS` |
| C5 | No workflow executed this batch | `PASS` |
