# Agent / Brain Layer Audit — digital-pr-agents

Findings for the orchestration layer (`src/data/*Registry*`, `src/lib/agent*`, `src/lib/brain*`, `src/app/api/brains`).

## Registry
- Canonical agent registry: `src/data/agentBrainRegistry.ts` (note: there is **no** `agentRegistry.ts`; the earlier "missing file" note referred to a non-existent path — the canonical registry exists and imports are satisfied).
- Supporting registries: `agentGuardrails.ts`, `agentHandoffRegistry.ts`, `agentToolRegistry.ts`.

## Runtime status
- `src/lib/agentRuntime.ts` `runAgentStage()` is orchestration scaffolding. `getAgentExecutionStatus()` returns `ready-for-integration` for a hardcoded list (`orchestrator`, `extractor`, `researcher`, `data-analyst`, `insight-analyst`) and `not-implemented` otherwise; it never performs LLM execution — guardrails are run with `output: undefined`. Real stage execution flows through the `execute-stage` route + `llmService.ts` + `modelRouter.ts`, not through `runAgentStage`.
- `src/lib/agentMemory.ts`: `loadShortTermMemory`/`loadCampaignMemory` return empty maps (Redis/DB comment); `getPreviousArtifactsForStage` builds references from a static map with fabricated timestamps (`createdAt: new Date().toISOString()`) rather than an artifact store.

## Guardrails
- `src/data/agentGuardrails.ts` declares `checkType: 'input' | 'output' | 'handoff' | 'tool-use' | 'artifact' | 'state'`.
- `src/lib/agentGuardrails.ts` implements only `input`/`output`/`handoff`; the `default` branch silently passes. Only one registry entry uses an unimplemented type: `collector-2` (S8, `tool-use`, warning severity) — so today every failing check of that type is reported as passing. `artifact`/`state` are unused.
- All other guardrails (blocker severity) execute correctly; the "silently skipping 3 of 6 checks" concern is really *1 of 5 check types* unused, low impact.

## Brain worker
- `src/app/api/brains/run/route.ts` now fails fast with HTTP 503 `WORKER_SCRIPT_MISSING` when `scripts/run-brain-worker.mjs` does not exist (it does not exist at repo root `scripts/`). The brain-worker feature is therefore blocked until that script is created — verified intentionally, not silent.
- `src/lib/brainResolver.ts` resolves brain manifests (`brain/brain-manifest.json`), validates stage mappings, and detects drift against legacy paths — now using `process.cwd()`-relative paths.

## Agent trace/artifacts/feedback
- `agentTrace.ts` targets `/api/logs` for trace persistence — that route exists (earlier agent report claimed it did not; refuted).
- `agentArtifacts.ts` is present but not wired into `agentRuntime` (orphaned scaffolding) — documented, no change.
- `agentFeedback.ts`/`recordFeedback` wired through `agentRuntime.recordFeedback`.

## Conclusions
1. The agent layer is intentional, forward-looking scaffolding; it does not yet drive production execution. Not a regression — documented.
2. Guardrail `tool-use` no-op is a real gap but low risk (single warning check). Recommend implementing when collector tooling lands.
3. Brain worker script must be created for the `brains/run` feature; the route now reports this clearly.
4. No blocking defects found in the agent/brain layer that would corrupt data or break the active S10 pipeline.
