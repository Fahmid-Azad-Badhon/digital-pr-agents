# Production Hardening Milestones (Permanent Guardrails)

This document defines permanent closure criteria for four platform-hardening targets:

1. Every brain as independent runtime worker
2. Full end-to-end orchestration coverage
3. Enterprise auth/observability/CI depth
4. External integration production hardening

## M1 - Brain Runtime Independence

**Goal:** All 16 stages have explicit runtime bindings and executable worker entrypoints.

**Enforced by CI:**
- `npm run verify:brain-worker-independence`

**Guardrails:**
- Stage runtime registry must contain S1..S16 bindings.
- Brain run API must spawn independent worker jobs.
- Worker service catalog must map every manifest brain key.
- Brain catalog API must expose per-brain worker readiness.

---

## M2 - Orchestration Coverage

**Goal:** Stage execution is backend-driven with dependency and order enforcement, not UI-only progression.

**Enforced by CI:**
- `npm run verify:orchestration-coverage`

**Guardrails:**
- `execute-stage` must enforce stage order and dependencies.
- Runtime event stream append required for stage transitions.
- Stage precheck endpoint must provide actionable execution state.
- Runtime registry must include full S1..S16 execution bindings.

---

## M3 - Enterprise Depth (Auth + Observability + CI)

**Goal:** Platform-wide request protection and traceability with failing CI on guardrail regressions.

**Enforced by CI:**
- `npm run verify:enterprise-depth`
- `npm run verify:enterprise-rollout`

**Guardrails:**
- Global mutation auth middleware with route-level role policy support.
- Global rate limiting and request-id propagation.
- Structured API audit logs with OTEL-ready fields.
- Observability summary API and dashboard page must stay wired.
- CI workflow must include verify + release-gates policy.

---

## M4 - External Integration Hardening

**Goal:** Google + Muck Rack integration pathways remain readiness-checked and circuit-protected.

**Enforced by CI:**
- `npm run verify:external-hardening`
- `npm run verify:integration-readiness`
- `npm run verify:integration-contract-smoke`

**Guardrails:**
- Integration health route must expose Google and Muck Rack readiness details.
- Integration health route must include externalization readiness + blockers.
- Integration preflight route must expose productionExternalizationReady and blockers.
- Stage execution must include integration-aware retry and circuit-write behavior.
- Live smoke tests must assert failure mode, partial mode, local success mode, and production mode policy behavior.

---

## Master CI Chain

`verify:ci` enforces:

1. mutation audit
2. api guardrails
3. high-risk explicit audit
4. platform hardening
5. stage-brain bindings
6. integration readiness
7. strict-audit contract
8. brain-worker independence
9. orchestration coverage
10. enterprise depth
11. enterprise rollout
12. external hardening
13. integration contract smoke
14. production build

If any block regresses, CI fails by design.

