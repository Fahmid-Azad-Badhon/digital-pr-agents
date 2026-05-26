# Production Hardening Milestones (Permanent Guardrail Set)

This document defines the permanent baseline for the Digital PR Dashboard runtime.

## Milestone A — Stage Runtime Executability (S1-S16)

- [x] `src/lib/stageRuntimeRegistry.ts` includes explicit bindings for stages 1..16.
- [x] `src/app/api/campaigns/[id]/execute-stage/route.ts` contains executable branches for S1..S16.
- [x] Build fails if a stage binding is missing or marked non-executable (`verify-stage-brain-bindings.mjs`).
- [x] Build fails if script-runner target files are missing.

## Milestone B — Brain/Stage Connection Proof

- [x] CI verifies required brain definition files are present in `src/brain` or `../brain`.
- [x] Build fails when expected brain definitions are missing.
- [x] Runtime stage map and brain artifacts are auditable by script.

## Milestone C — Strict Artifact Quality Gates

- [x] Strict no-scaffold/non-thin guards on S3-S6.
- [x] Strict no-scaffold/non-thin guards on S9-S11.
- [x] Strict no-scaffold/non-thin guards on S12-S16.
- [x] `GET /api/campaigns/:id/strict-audit` returns pass/fail readiness and detailed blockers.

## Milestone D — Security & API Mutation Guardrails

- [x] Global mutation auth guard in middleware.
- [x] Request-id propagation in middleware.
- [x] Standardized blocker envelope (`STAGE_DEPENDENCY_BLOCKED`) with actionable `requiredAction`.
- [x] Build fails if mutation/audit guard scripts fail.

## Milestone E — Integration Readiness Contracts

- [x] Integration health route contract includes Google Docs + Muck Rack blocks.
- [x] Auto-progress route keeps explicit pitch-selection pause contract.
- [x] Build fails if integration-readiness contract checks fail.

## CI Enforcement

The following checks are required in CI and must remain green:

- `npm run verify:mutation-audit`
- `npm run verify:api-guardrails`
- `npm run verify:high-risk-audit`
- `npm run verify:platform-hardening`
- `npm run verify:stage-brain-bindings`
- `npm run verify:integration-readiness`
- `npm run build`

If any check fails, changes must not be merged.

