# Whole-Project Debugging — Master Index (R1)

Batch: `DPR-VULTR-PREPARATION-AND-WHOLE-PROJECT-LOCAL-DEBUGGING-R1`

## Purpose

This index lists every debugging report generated for the whole-project local debugging
workstream. All findings are evidence-based from this batch's local inspection.

## Reports

| # | File | Purpose |
|---|------|---------|
| 00 | `00_INDEX_R1.md` | This master index |
| 01 | `01_PROJECT_INVENTORY_R1.md` | Inventory of project folders, packages, configs, tests |
| 02 | `02_PACKAGE_AND_SCRIPT_AUDIT_R1.md` | Root + dashboard package/script audit |
| 03 | `03_CONFIGURATION_AUDIT_R1.md` | Non-secret config audit (tsconfig, next, eslint, vitest) |
| 04 | `04_PATH_AND_FILESYSTEM_AUDIT_R1.md` | Hardcoded path and filesystem-dependency audit |
| 05 | `05_SECURITY_AND_SECRET_SAFETY_AUDIT_R1.md` | Auth guards, rate limits, token handling, secret safety |
| 06 | `06_TYPESCRIPT_AND_STATIC_QUALITY_AUDIT_R1.md` | Typecheck + lint results |
| 07 | `07_TEST_SUITE_AUDIT_R1.md` | Test suite run results and failure classification |
| 08 | `08_BUILD_AUDIT_R1.md` | Next.js build results |
| 09 | `09_RUNTIME_START_AUDIT_R1.md` | Runtime start capability audit (help-only, no server) |
| 10 | `10_BROWSER_AUTOMATION_AUDIT_R1.md` | Browser-tools and Chrome automation audit |
| 11 | `11_SCRIPT_RUNNER_AUDIT_R1.md` | Script runner and `.cmd`/`.ps1` execution audit |
| 12 | `12_API_ROUTE_AND_REQUEST_GUARD_AUDIT_R1.md` | API route and request-guard audit |
| 13 | `13_LLM_ROUTING_AUDIT_R1.md` | LLM routing and model configuration audit |
| 14 | `14_GOOGLE_OAUTH_AND_INTEGRATION_READINESS_AUDIT_R1.md` | Google OAuth readiness (code-level) |
| 15 | `15_CAMPAIGN_STATE_AND_RUNTIME_EVENTS_AUDIT_R1.md` | Campaign state and runtime-events audit |
| 16 | `16_REPRODUCIBLE_BUG_FIX_LOG_R1.md` | Bug fix log (evidence, root cause, validation) |
| 17 | `17_WHOLE_PROJECT_DEBUGGING_RISK_REGISTER_R1.md` | Risk register for whole-project debugging |
| 18 | `18_WHOLE_PROJECT_DEBUGGING_MINDMAP_R1.md` | Debugging mind map |

## Bug Fix Summary (see report 16)

- `campaignStateService.ts` — fixed an async `.filter()` bug in `checkOutputQuality`
  (artifactStatus miscomputation; `Promise.all` + result filter now awaited).
- `campaign-state.test.ts` — increased timeout for the real-filesystem contract test.
- `llmService.ts` — fixed malformed `\d` escape in `PIPELINE_GAPS_FILE` (pipeline-gap
  persistence was silently broken via a wrong path).
- `pipeline-gaps-path.test.ts` — new 2-test regression covering the corrected path.

## Status

```
WHOLE_PROJECT_DEBUGGING_RUN=YES
```
