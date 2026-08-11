# LLM Routing Audit — R1

- **Report**: `13_LLM_ROUTING_AUDIT_R1.md`
- **Scope**: Model routing config source-of-truth derivation, stage/dashboard routing, dry-run behavior, and LLM service boundaries.
- **Result**: `PASS` — routing is config-driven from `/system/` JSON; dry-run guards verified by tests; no LLM call issued this batch.

---

## 1. Config Source of Truth

| Item | Value |
|---|---|
| Loader | `dashboard/src/lib/systemConfigLoader.ts` → reads `/system/model-routing.config.json` |
| Derived config | `dashboard/src/config/model-routing.config.ts` exports `MODEL_CONFIG`, `CAMPAIGN_STAGE_ROUTING`, `DASHBOARD_ROUTING`, `SYSTEM_VERSION`, `SYSTEM_LAST_UPDATED` |
| Client-safe wrapper | `dashboard/src/lib/modelRoutingConfig.ts` (`getModelForStage`, `getFallbacksForStage`, `getModelsToTryForStage`, `getModelForDashboardFeature`) — config-only, no execution |
| Runtime router | `dashboard/src/lib/modelRouter.ts` (call/fallback orchestration) |
| Execution | `dashboard/src/lib/llmService.ts` (4265-line module: LLM calls, learning/feedback files, prompt staging, etc.) |

- Model shape: `key`, `displayName`, `provider: 'openrouter'`, `modelId`, `role`, `timeoutMs`, `maxRetries`, `allowedUseCases`, `restrictedTo`, `enabledInProductionWorkflow`, `costLevel`, `speedLevel`.
- Stage routing shape: `primary`, `fallback1`, `fallback2`, optional `mandatoryReviewer`, `requiresHumanApproval`, `specialInstructions`.

## 2. Routing Behavior

- `getModelsToTryForStage` returns `[primary, ...fallbacks]` (1-3 candidates), consumed by `modelRouter.ts` fallback loop.
- GPT-5.5 is documented (MODEL-CONFIG.md) as the quality gate for stages 4/5/8/9/10; production-stage work uses free-tier models (per AGENTS.md). The `/system/` JSON is the binding source.
- `model-routing.test.ts` (report 07) covers required stage keys and model derivation (passing).

## 3. Dry-Run / Safety

- `runMode` (`dry_run` default in vitest config; env `RUN_MODE`) blocks external side effects.
- `dry-run.test.ts` verifies `callLLM` returns `DRY RUN` content and does **not** call `globalThis.fetch`; `runShadowTest` returns `null` in dry_run (report 07, passing).
- `OPENROUTER_API_KEY || OPENCODE_API_KEY` env, falling back to literal `'free'` (llmService.ts:23) — a safe no-key default for dry-run/local.
- LLM failures trigger retries with backoff and rate-limit waits; call results are surfaced as model-run logs (`modelRouter`).

## 4. Integration With Filesystem (see report 04)

- `llmService.ts` holds 24 hardcoded `dashboard/data|logs|snapshots|prompts` paths (learning files, caches, token usage, campaign states). The only defect found — malformed `PIPELINE_GAPS_FILE` escape — was **fixed** (report 04/16) with a regression test.

## 5. Batch Execution Status

- No LLM/OpenRouter call was issued this batch (dry_run; external calls forbidden). Only dry-run test invocations occurred, which are mocked/guarded.

## 6. Findings Summary

| # | Finding | Classification |
|---|---|---|
| L1 | Routing derived from `/system/model-routing.config.json` (single source of truth) | `PASS` |
| L2 | Primary+2-fallback model selection per stage | `PASS` |
| L3 | Dry-run blocks fetch/LLM calls (verified by tests) | `PASS` |
| L4 | No LLM call issued this batch | `PASS` |
| L5 | Pipeline-gaps path defect fixed with regression test | `PASS` |
