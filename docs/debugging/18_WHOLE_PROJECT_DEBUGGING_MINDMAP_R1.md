# Whole-Project Debugging Mind Map — R1

- **Report**: `18_WHOLE_PROJECT_DEBUGGING_MINDMAP_R1.md`
- **Purpose**: Navigational overview of the R1 whole-project debugging run — layers audited, findings, and where each artifact lives.

---

## 1. Run Overview

```
DPR-VULTR-PREPARATION-AND-WHOLE-PROJECT-LOCAL-DEBUGGING-R1
├── Workstream A  → Vultr deployment package (docs/deployment/vultr/ 00-19, ops/vultr/)
├── Workstream B  → Whole-project local debugging (docs/debugging/ 00-18)
│   ├── Inventory & config      (reports 01-03)
│   ├── Path & filesystem       (report 04)        ──► BUG #2 FIXED (pipeline-gaps path)
│   ├── Security & secrets      (report 05)
│   ├── Static/test/build       (reports 06-08)
│   ├── Runtime & tooling       (reports 09-11)
│   ├── API & orchestration     (reports 12-15)    ──► BUG #1 FIXED (campaign-state filter)
│   ├── Bug fix log             (report 16)
│   ├── Risk register           (report 17)
│   └── Mind map                (report 18)
└── Final report (DPR-VULTR-PREPARATION-AND-WHOLE-PROJECT-LOCAL-DEBUGGING-R1 FINAL REPORT)
```

## 2. Audit Layers → Findings Map

```
Layer                     Report   Key finding                          Class
──────────────────────    ──────   ─────────────────────────────────   ────────────
Project inventory         01       layout, 244 src files, 1052 tests   INFO
Package & scripts         02       run classifications; forbidden set  PASS
Configuration             03       @system alias, headers, middleware  PASS
Path & filesystem         04       PIPELINE_GAPS_FILE escape bug       FIXED
Security & secrets        05       auth/CSRF/rate-limit controls       PASS (+2 notes)
TypeScript static         06       tsc exit 0, lint exit 0             PASS
Test suite                07       28 files / 1054 tests               PASS
Build                     08       next build exit 0                   PASS
Runtime start             09       help-only evidence, no listener     PASS
Browser automation        10       CDP/ws only; no execution           PASS
Script runner             11       allow-list + dry-run blocking       PASS
API & request guard       12       57 routes, guards everywhere        PASS
LLM routing               13       config-driven, dry-run safe         PASS
Google OAuth readiness    14       real checks; not_configured now     PASS
Campaign state/events     15       async-filter bug fixed              FIXED
Bug fix log               16       Bug #1 + Bug #2                     DONE
Risk register             17       R1-R10 open; F1-F2 resolved         DOCUMENTED
```

## 3. Dependency/Path Web (portability cluster)

```
process.cwd()  → requestGuard roots (PITCH_JOBS_ROOT, REPO_ROOT, ...)
                    └── used by: scriptRunner, stageOutputContractValidator,
                        campaignStateService, integrationReadiness, API routes
Hardcoded D:\...  → campaignPathResolver, gateEngine, stageExecutor, replayManager,
                     claimLedgerManager, campaignTemplateManager, runtimeHealthCheck,
                     brainResolver, llmService (24 constants), muckrack-collector.js
                     └── RISK R1 (deployment portability)
@system/* alias   → ../system  (RISK R2 layout dependency)
```

## 4. Bug Fix Cluster

```
Bug #1  campaignStateService.checkOutputQuality  → awaited Promise.all + filter
        └── regression: campaign-state.test.ts (33/33, 30s timeout)
Bug #2  llmService.PIPELINE_GAPS_FILE  → \d escape corrected
        └── regression: pipeline-gaps-path.test.ts (2/2, fs spy)
Validation: tsc 0 · lint 0 · 1054/1054 · build 0
```

## 5. Verification Gates

| Gate | Evidence |
|---|---|
| Reproducible-bug-only patches | Both fixes reproduced before patching (test eval + code reading) |
| Regression coverage | Bug 1 via existing contract test; Bug 2 via new dedicated test |
| No test deletion / no suppressions | Confirmed in report 16 |
| Full validation green | Reports 06-08 + suite run |
| No cloud access / no commit / no push | Batch constraints respected |
