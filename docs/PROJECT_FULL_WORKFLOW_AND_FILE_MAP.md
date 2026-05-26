# Project Full Workflow and File Map

**Generated:** 2026-05-27  
**Project Path:** D:\Codex Folder\digital-pr-agents  
**Auditor:** AI Automation Engineer / Workflow Auditor / Python Automation Developer / Technical Documentation Specialist  
**Report File:** docs/PROJECT_FULL_WORKFLOW_AND_FILE_MAP.md

---

## 1. Project Identity

### What the Project Appears to Be
A localhost Next.js web dashboard that automates journalist email pitch generation for Digital PR campaigns through a 16-stage LLM-powered workflow system. It manages campaign brief intake, research extraction, story angle generation, journalist intelligence collection, pitch drafting, optimization, validation, and learning loop.

### Evidence

| Evidence Source | What It Says | Interpretation |
|----------------|--------------|---------------|
| README.md | "Digital PR Orchestrator — Local Dashboard (MVP)" | Confirms project identity and scope |
| dashboard/package.json | 
ame: "digital-pr-dashboard" | Dashboard package name confirms identity |
| workflow-architecture.md | "Digital PR Agent Architecture v2.0" | Architecture documentation matches project |
| alidation-gates.md | "Digital PR Validation Gates v2.0" | Gate documentation matches project |
| gent-registry.md | "Digital PR Agent Registry v2.0" | Agent documentation matches project |
| handoff-matrix.md | "Digital PR Handoff Matrix v2.0" | Handoff documentation matches project |
| AGENTS.md | "Digital PR Orchestrator" | Agent instructions file confirms project identity |
| MODEL-CONFIG.md | Model configuration for Digital PR workflow | Consistent naming |
| Folder structure | pitch-jobs/, rain/, system/, dashboard/, scripts/ | Consistent with campaign management system |
| Old paths in rain-manifest.json | Deprecated paths dashboard/src/brain/ and dashboard/skills/agent-brains/ | Old paths no longer exist; properly marked deprecated |

**Main Entrypoint:** dashboard/src/app/api/campaigns/[id]/execute-stage/route.ts (1,851 lines) — The central stage execution API that orchestrates all 16 workflow stages.

**Main Purpose:** Generate personalized journalist email pitches from campaign briefs and raw study materials through a multi-stage AI-assisted workflow.

**Main Workflow Type:** Sequential state-machine workflow with file-system-based handoffs between stages.

**Main Technologies:**
- **Runtime:** Node.js (v25.9.0), TypeScript
- **Framework:** Next.js 14 (App Router)
- **Database:** SQLite (via etter-sqlite3 or similar)
- **LLM Provider:** OpenRouter (free-tier models)
- **Web Search:** Jina AI API
- **Browser Automation:** Chrome DevTools Protocol + Playwright
- **Data Collection:** Muck Rack (journalist database)
- **Document Export:** Google OAuth 2.0
- **Scripting:** PowerShell (.ps1), Windows CMD (.cmd), Node.js (.js)
- **Testing:** Vitest
- **Schema Validation:** Zod

**Old/Wrong Project References:** Deprecated paths in rain-manifest.json reference dashboard/src/brain/ and dashboard/skills/agent-brains/ which no longer exist. These are properly marked as deprecated.
---

## 2. Full File & Folder Inventory

### Directory Tree

`	ext
digital-pr-agents/
├── .github/                          # GitHub workflows/templates
├── .secrets/                         # Gitignored secrets directory (empty)
├── audit-reports/                    # Generated audit reports (gitignored)
├── brain/                            # Agent brain/knowledge files (25 files)
│   ├── 00_Global_Workflow_Brain.md
│   ├── 01_Orchestrator_Brain.md
│   ├── 02_Data_Extractor_Brain.md
│   ├── 02_Validation_And_Truth_Brain.md
│   ├── 03_Journalist_Psychology_And_Emotional_Intelligence_Brain.md
│   ├── 07_Human_Gate_Brain.md
│   ├── 10_Pitch_Copywriter_Brain.md
│   ├── 11_Pitch_Optimizer_Brain.md
│   ├── 13_Validator_Brain.md
│   ├── S0_Campaign_Clarification_Brain.md
│   ├── S1_Campaign_Intake_Brain.md
│   ├── S3_Research_Enrichment_Brain.md
│   ├── S4A_Data_Research_Analyst_Brain.md
│   ├── S4B_Insight_Analyst_Brain.md
│   ├── S5_Angle_Generation_Brain.md
│   ├── S6_Beat_Matching_Brain.md
│   ├── S8_Journalist_Collection_Brain.md
│   ├── S9_Journalist_Intelligence_Brain.md
│   ├── S12_Package_Assembly_Brain.md
│   ├── S14_Final_Formatting_Brain.md
│   ├── S15_Outreach_Asset_Creation_Brain.md
│   ├── S16_Campaign_Learning_Loop_Brain.md
│   ├── brain-change-log.md
│   ├── brain-manifest.json
│   ├── remaining-agents.md
│   └── dashboard/                    # EMPTY directory (0 files)
├── browser-tools/                    # Chrome DevTools Protocol automation
├── dashboard/                        # Next.js dashboard (main application)
│   ├── .env.local                    # LIVE API KEYS — DO NOT COMMIT
│   ├── .env.local.example            # Environment template with placeholders
│   ├── package.json                  # Dashboard dependencies
│   ├── vitest.config.ts              # Test configuration
│   ├── prompts/
│   │   └── campaign/                 # LLM prompt files (17 files)
│   │       ├── S1_campaign_intake.md
│   │       ├── S2_data_extraction.md
│   │       ├── S3_research_enrichment.md
│   │       ├── S4A_data_research_analyst.md
│   │       ├── S4B_insight_analyst.md
│   │       ├── S5_angle_generation.md
│   │       ├── S6_beat_matching.md
│   │       ├── S7_pitch_selection_human_gate.md
│   │       ├── S8_journalist_collection.md
│   │       ├── S9_journalist_intelligence.md
│   │       ├── S10_pitch_drafting.md
│   │       ├── S11_pitch_optimization.md
│   │       ├── S12_package_assembly.md
│   │       ├── S13_validation.md
│   │       ├── S14_final_formatting.md
│   │       ├── S15_outreach_asset_creation.md
│   │       └── S16_campaign_learning_loop.md
│   ├── scripts/                      # Verification scripts (20 files)
│   │   ├── verify-api-guardrails.mjs
│   │   ├── verify-auth-session-roles.mjs
│   │   ├── verify-brain-worker-independence.mjs
│   │   ├── verify-enterprise-depth.mjs
│   │   ├── verify-enterprise-rollout.mjs
│   │   ├── verify-external-hardening.mjs
│   │   ├── verify-high-risk-explicit-audit.mjs
│   │   ├── verify-integration-contract-smoke.mjs
│   │   ├── verify-integration-readiness.mjs
│   │   ├── verify-mutation-audit.mjs
│   │   ├── verify-orchestration-coverage.mjs
│   │   ├── verify-platform-hardening.mjs
│   │   ├── verify-session-csrf-guard.mjs
│   │   ├── verify-stage-brain-bindings.mjs
│   │   ├── verify-strict-audit-contract.mjs
│   │   ├── brain-worker-services.mjs
│   │   ├── generate-connection-proof-report.mjs
│   │   ├── launch-dashboard-stable.ps1
│   │   ├── run-brain-worker.mjs
│   │   └── run-tests.ts
│   └── src/
│       ├── app/
│       │   ├── api/
│       │   │   └── campaigns/[id]/
│       │   │       └── execute-stage/
│       │   │           └── route.ts   # THE CENTRAL FILE (1,851 lines)
│       │   └── pages/...
│       ├── config/
│       │   └── model-routing.config.ts # Model routing configuration (247 lines)
│       ├── lib/                        # Core library modules (76 files)
│       │   ├── llmService.ts           # LLM API service (4,149 lines)
│       │   ├── modelRouter.ts          # Model routing (759 lines)
│       │   ├── workflowEngine.ts       # Workflow orchestration (674 lines)
│       │   ├── stageExecutor.ts        # Stage execution (459 lines)
│       │   ├── gateEngine.ts           # Gate evaluation (350 lines)
│       │   ├── pitchGovernanceValidator.ts # Pitch governance (272 lines)
│       │   ├── fallbackMarkers.ts      # Placeholder detection (66 lines)
│       │   ├── authGuard.ts            # Authentication guard (131 lines)
│       │   ├── rateLimiter.ts          # Rate limiting
│       │   ├── scriptRunner.ts         # Script execution (109 lines)
│       │   ├── brainResolver.ts        # Brain file resolver
│       │   ├── campaignPathResolver.ts # Campaign path resolution
│       │   ├── campaignStateService.ts # Campaign state management
│       │   ├── db.ts                   # SQLite database
│       │   ├── webSearch.ts            # Jina AI web search
│       │   ├── sessionAuth.ts          # Session authentication
│       │   ├── runtimeEvents.ts        # Runtime event logging
│       │   ├── systemConfigLoader.ts   # System config loading
│       │   ├── stageContractValidator.ts # Stage contract validation
│       │   ├── stageHandoffValidator.ts # Handoff validation
│       │   ├── claimLedgerManager.ts   # Claim ledger management
│       │   ├── schemaValidation.ts     # Schema validation
│       │   ├── integrationExternalization.ts # External integration
│       │   └── ... (50+ more)
│       └── tests/                      # Test files (3 files)
│           ├── model-routing.test.ts    # Model routing tests (454 lines)
│           ├── campaign-state.test.ts   # Campaign state tests
│           └── integration-readiness.test.ts # Integration readiness tests
├── data/                               # Runtime data (gitignored)
│   ├── db.json                         # SQLite database (or JSON dump)
│   └── google-token.json               # Google OAuth token (LIVE)
├── docs/                               # Technical documentation (9 files)
├── fixtures/                           # Test fixtures
├── lib/                                # Root-level library code (5 files)
├── logs/                               # Runtime logs (NOT gitignored)
├── node_modules/                       # Dependencies (gitignored)
├── pages/                              # Legacy pages directory
├── pitch-jobs/                         # Campaign data (14 dirs, gitignored)
│   ├── e2e-validation/                 # Completed E2E campaign
│   ├── birth-injury-law-march-2026/
│   ├── clean-test-campaign/
│   ├── e2e-s2-fix/
│   ├── fix-smoke-*/ (2)
│   ├── live-smoke-*/
│   ├── oauth-bootstrap-job/
│   ├── smoke-auto-*/ (4)
│   └── source-files/
├── pitch-jobs-backup-*/ (2)           # Backup campaign data
├── pitch-jobs-backups/                 # Backup campaign data
├── schemas/                            # JSON schema files (18 files)
├── scripts/                            # Operational scripts (34 files)
├── skills/                             # Codex skill definitions (32 files)
├── styles/                             # CSS/style files
├── system/                             # System configuration JSON (52 files)
├── templates/                          # Campaign templates (48 files)
├── .gitignore                          # Git ignore rules (223 lines)
├── AGENTS.md                           # Agent instructions
├── CHANGELOG.md                        # Change log
├── FULL-AUDIT-REPORT.md               # Previous audit report
├── MASTER-COMPREHENSIVE-REPORT.md     # New comprehensive report (this session)
├── MODEL-CONFIG.md                     # Model configuration
├── README.md                           # Project readme
├── VERSIONING.md                       # Version tracking
├── agent-registry.md                   # Agent registry
├── gold-standard-output-benchmark.md   # Output benchmarks
├── handoff-matrix.md                   # Handoff matrix
├── prompt map.md                       # Prompt mapping
├── red-team-adversarial-tests.md       # Adversarial tests
├── runbook.md                          # Operations runbook
├── scoring-prioritization-engine.md    # Scoring engine docs
├── tool-availability-fallbacks.md      # Fallback docs
├── validation-gates.md                 # Gate documentation
├── workflow-architecture.md            # Architecture documentation
├── package.json                        # Root package.json (Playwright only)
├── postcss.config.js
├── tailwind.config.js
└── raw-study-copy.md                   # Study copy (likely stray)
### Detailed File Inventory Table

#### Root Files

| Path | Type | Purpose | Important? | Commit Safe? | Notes |
|------|------|---------|-----------|-------------|-------|
| .gitignore | Config | Git ignore rules (223 lines) | YES | YES | Comprehensive; missing logs/ and dashboard/logs/ |
| AGENTS.md | Docs | Agent behavior instructions | YES | YES | Project-specific agent rules |
| CHANGELOG.md | Docs | Change log | YES | YES | Tracked via negative pattern in .gitignore |
| FULL-AUDIT-REPORT.md | Report | Previous audit (1558 lines) | NO | YES | Generated report |
| MASTER-COMPREHENSIVE-REPORT.md | Report | New comprehensive report (this session) | NO | NO | Generated in this session |
| MODEL-CONFIG.md | Docs | Model routing contract | YES | YES | Documentation |
| README.md | Docs | Project readme | YES | YES | Project description |
| VERSIONING.md | Docs | Version tracking | YES | YES | Documentation |
| gent-registry.md | Docs | Agent registry (40 agents) | YES | YES | Documentation |
| gold-standard-output-benchmark.md | Docs | Output benchmarks | YES | YES | Documentation |
| handoff-matrix.md | Docs | Stage handoff definitions | YES | YES | Documentation |
| prompt map.md | Docs | Prompt mapping | YES | YES | Documentation |
| ed-team-adversarial-tests.md | Docs | Adversarial test definitions | YES | YES | Documentation |
| unbook.md | Docs | Operations runbook | YES | YES | Documentation |
| scoring-prioritization-engine.md | Docs | Scoring engine docs | YES | YES | Documentation |
| 	ool-availability-fallbacks.md | Docs | Fallback tool docs | YES | YES | Documentation |
| alidation-gates.md | Docs | Gate definitions (29 gates) | YES | YES | Documentation |
| workflow-architecture.md | Docs | Architecture docs | YES | YES | Documentation |
| package.json | Config | Root dependencies (Playwright) | YES | YES | Only Playwright |
| postcss.config.js | Config | PostCSS config | YES | YES | Framework config |
| 	ailwind.config.js | Config | Tailwind CSS config | YES | YES | Framework config |
| aw-study-copy.md | Data | Study copy (likely stray) | NO | REVIEW | May be a leftover file |

#### Brain Files (rain/)

| Path | Type | Purpose | Important? | Commit Safe? | Notes |
|------|------|---------|-----------|-------------|-------|
| rain/00_Global_Workflow_Brain.md | Brain | System mission, anti-hallucination rules | YES | YES | NOT loaded at runtime |
| rain/01_Orchestrator_Brain.md | Brain | Orchestrator role definition | YES | YES | NOT loaded at runtime |
| rain/02_Data_Extractor_Brain.md | Brain | S2 data extraction instructions | YES | YES | NOT loaded at runtime |
| rain/02_Validation_And_Truth_Brain.md | Brain | Factuality rules | YES | YES | NOT loaded at runtime |
| rain/03_Journalist_Psychology_And_Emotional_Intelligence_Brain.md | Brain | Psychology rules | YES | YES | NOT loaded at runtime |
| rain/07_Human_Gate_Brain.md | Brain | S7 human approval instructions | YES | YES | NOT loaded at runtime |
| rain/10_Pitch_Copywriter_Brain.md | Brain | S10 pitch writing instructions | YES | YES | NOT loaded at runtime |
| rain/11_Pitch_Optimizer_Brain.md | Brain | S11 optimization instructions | YES | YES | NOT loaded at runtime |
| rain/13_Validator_Brain.md | Brain | S13 validation instructions | YES | YES | NOT loaded at runtime |
| rain/S0_Campaign_Clarification_Brain.md | Brain | S0 clarification instructions | YES | YES | No corresponding prompt file |
| rain/S1_Campaign_Intake_Brain.md | Brain | S1 intake instructions | YES | YES | NOT loaded at runtime |
| rain/S3_Research_Enrichment_Brain.md | Brain | S3 enrichment instructions | YES | YES | NOT loaded at runtime |
| rain/S4A_Data_Research_Analyst_Brain.md | Brain | S4A analysis instructions | YES | YES | NOT loaded at runtime |
| rain/S4B_Insight_Analyst_Brain.md | Brain | S4B insight instructions | YES | YES | NOT loaded at runtime |
| rain/S5_Angle_Generation_Brain.md | Brain | S5 angle generation instructions | YES | YES | NOT loaded at runtime |
| rain/S6_Beat_Matching_Brain.md | Brain | S6 beat matching instructions | YES | YES | NOT loaded at runtime |
| rain/S8_Journalist_Collection_Brain.md | Brain | S8 collection instructions | YES | YES | NOT loaded at runtime |
| rain/S9_Journalist_Intelligence_Brain.md | Brain | S9 intelligence instructions | YES | YES | NOT loaded at runtime |
| rain/S12_Package_Assembly_Brain.md | Brain | S12 package instructions | YES | YES | NOT loaded at runtime |
| rain/S14_Final_Formatting_Brain.md | Brain | S14 formatting instructions | YES | YES | NOT loaded at runtime |
| rain/S15_Outreach_Asset_Creation_Brain.md | Brain | S15 assets instructions | YES | YES | NOT loaded at runtime |
| rain/S16_Campaign_Learning_Loop_Brain.md | Brain | S16 learning instructions | YES | YES | NOT loaded at runtime |
| rain/brain-change-log.md | Docs | Brain version tracking | YES | YES | Version log |
| rain/brain-manifest.json | Config | Brain loading order manifest | YES | YES | Contains deprecated paths |
| rain/remaining-agents.md | Docs | Future agents list | YES | YES | Planning doc |
| rain/dashboard/ | Dir | **EMPTY** (0 files) | NO | YES | Orphaned directory |

#### Dashboard Core Files (dashboard/)

| Path | Type | Purpose | Important? | Commit Safe? | Notes |
|------|------|---------|-----------|-------------|-------|
| dashboard/.env.local | Config | **LIVE API KEYS** | YES | NO | Contains 5 live credentials |
| dashboard/.env.local.example | Config | Environment template with placeholders | YES | YES | Safe to commit |
| dashboard/package.json | Config | Dashboard npm dependencies | YES | YES | Lock file present |
| dashboard/package-lock.json | Config | Dependency lock | YES | REVIEW | Gitignored by root pattern |
| dashboard/vitest.config.ts | Config | Vitest test configuration | YES | YES | Test runner config |
| dashboard/.next/ | Build | Next.js build output | NO | NO | Build artifacts |

#### Dashboard Library Modules (dashboard/src/lib/)

| Path | Type | Purpose | Important? | Commit Safe? | Notes |
|------|------|---------|-----------|-------------|-------|
| dashboard/src/lib/llmService.ts | Service | LLM API: error handling, rate limiting, failover (4,149 lines) | YES | YES | LARGEST file; no tests |
| dashboard/src/lib/modelRouter.ts | Service | Model routing with fallback chains (759 lines) | YES | YES | Has tests |
| dashboard/src/lib/workflowEngine.ts | Service | Workflow orchestration (674 lines) | YES | YES | No tests |
| dashboard/src/lib/stageExecutor.ts | Service | Stage execution with LLM (459 lines) | YES | YES | No tests |
| dashboard/src/lib/gateEngine.ts | Service | Gate evaluation (350 lines) | YES | YES | No tests |
| dashboard/src/lib/pitchGovernanceValidator.ts | Service | Pitch quality governance (272 lines) | YES | YES | No tests |
| dashboard/src/lib/authGuard.ts | Service | Authentication guard (131 lines) | YES | YES | No tests |
| dashboard/src/lib/scriptRunner.ts | Service | Script execution wrapper (109 lines) | YES | YES | No tests |
| dashboard/src/lib/fallbackMarkers.ts | Service | Placeholder detection (66 lines, 67 markers) | YES | YES | No tests |
| dashboard/src/lib/rateLimiter.ts | Service | Request rate limiting | YES | YES | No tests |
| dashboard/src/lib/brainResolver.ts | Service | Brain file resolver | YES | YES | Integration with runtime unverified |
| dashboard/src/lib/campaignStateService.ts | Service | Campaign state management | YES | YES | No tests |
| dashboard/src/lib/db.ts | Service | SQLite database | YES | YES | No tests |
| dashboard/src/lib/webSearch.ts | Service | Jina AI web search | YES | YES | No tests |
| dashboard/src/lib/sessionAuth.ts | Service | Session authentication | YES | YES | No tests |
| dashboard/src/lib/runtimeEvents.ts | Service | Runtime event logging | YES | YES | Some errors swallowed |
| dashboard/src/lib/systemConfigLoader.ts | Service | System config loading (153 lines) | YES | YES | No tests |
| dashboard/src/lib/stageContractValidator.ts | Service | Stage contract validation | YES | YES | No tests |
| dashboard/src/lib/stageHandoffValidator.ts | Service | Handoff validation | YES | YES | No tests |
| dashboard/src/lib/claimLedgerManager.ts | Service | Claim ledger management | YES | YES | No tests |
| dashboard/src/lib/schemaValidation.ts | Service | Schema validation | YES | YES | No tests |
| dashboard/src/lib/integrationExternalization.ts | Service | External integration | YES | YES | No tests |
| dashboard/src/lib/agentRuntime.ts | Service | Agent runtime | YES | YES | Conceptual agents |
| dashboard/src/lib/agentHandoff.ts | Service | Agent handoff | YES | YES | Conceptual agents |
| dashboard/src/lib/agentMemory.ts | Service | Agent memory | YES | YES | Conceptual agents |
| dashboard/src/lib/agentTrace.ts | Service | Agent tracing | YES | YES | Conceptual agents |
| dashboard/src/lib/workflow.ts | Service | Workflow definitions | YES | YES | No tests |
| dashboard/src/lib/workflowState.ts | Service | Workflow state | YES | YES | No tests |
| dashboard/src/lib/workflowStateMachine.ts | Service | State machine | YES | YES | No tests |
| dashboard/src/lib/workflowIntegration.ts | Service | Workflow integration | YES | YES | No tests |
| dashboard/src/lib/campaignPathResolver.ts | Service | Campaign path resolution | YES | YES | No tests |
| dashboard/src/lib/campaignSafety.ts | Service | Campaign safety checks | YES | YES | No tests |
| dashboard/src/lib/campaignTemplateManager.ts | Service | Template management | YES | YES | No tests |
| dashboard/src/lib/replayManager.ts | Service | Replay functionality | YES | YES | No tests |
| dashboard/src/lib/replayComparator.ts | Service | Replay comparison | YES | YES | No tests |
| dashboard/src/lib/evaluationEngine.ts | Service | Evaluation engine | YES | YES | No tests |
| dashboard/src/lib/dataAnalysis.ts | Service | Data analysis | YES | YES | No tests |
| dashboard/src/lib/apiResponse.ts | Utility | API response formatting | YES | YES | No tests |
| dashboard/src/lib/logger.ts | Service | Structured logging | YES | YES | Not used everywhere |
| dashboard/src/lib/requestGuard.ts | Service | Request validation | YES | YES | No tests |
| dashboard/src/lib/preflightCheck.ts | Service | Preflight checks | YES | YES | No tests |
| dashboard/src/lib/redFlagDetector.ts | Service | Red flag detection | YES | YES | No tests |
| dashboard/src/lib/debugAndSafety.ts | Service | Debug and safety utilities | YES | YES | No tests |
| dashboard/src/lib/fileReadSafety.ts | Service | Safe file reading | YES | YES | No tests |
| dashboard/src/lib/earlyStageValidation.ts | Service | Early stage validation | YES | YES | No tests |
| dashboard/src/lib/executionTracker.ts | Service | Execution tracking | YES | YES | No tests |
| dashboard/src/lib/observabilitySummary.ts | Service | Observability summary | YES | YES | No tests |
| dashboard/src/lib/diffTracker.ts | Service | Diff tracking | YES | YES | No tests |
| dashboard/src/lib/httpCaching.ts | Service | HTTP caching | YES | YES | No tests |
| dashboard/src/lib/polling.ts | Service | Polling utilities | YES | YES | No tests |
| dashboard/src/lib/clientApi.ts | Service | Client API | YES | YES | No tests |
| dashboard/src/lib/askOwnerSystem.ts | Service | Owner query system | YES | YES | No tests |
| dashboard/src/lib/agentFeedback.ts | Service | Agent feedback | YES | YES | No tests |
| dashboard/src/lib/agentGuardrails.ts | Service | Agent guardrails | YES | YES | No tests |
| dashboard/src/lib/agentArtifacts.ts | Service | Agent artifacts | YES | YES | No tests |
| dashboard/src/lib/agentLogicConditionEngine.ts | Service | Agent logic conditions | YES | YES | No tests |
| dashboard/src/lib/agentQuestioningSystem.ts | Service | Agent questioning | YES | YES | No tests |
| dashboard/src/lib/brainWorkerRuntime.ts | Service | Brain worker runtime | YES | YES | No tests |
| dashboard/src/lib/inputSchemas.ts | Service | Zod input schemas | YES | YES | Used for validation |
| dashboard/src/lib/modelOverride.ts | Service | Model override | YES | YES | No tests |
| dashboard/src/lib/modelPerformanceTracker.ts | Service | Model performance tracking | YES | YES | No tests |
| dashboard/src/lib/modelTestResults.ts | Service | Model test results | YES | YES | No tests |
| dashboard/src/lib/modelRoutingConfig.ts | Service | Model routing config | YES | YES | No tests |
| dashboard/src/lib/promptTestResults.ts | Service | Prompt test results | YES | YES | No tests |
| dashboard/src/lib/integrationReadiness.ts | Service | Integration readiness | YES | YES | No tests |
| dashboard/src/lib/integrationTests.ts | Service | Integration tests | YES | YES | No tests |
| dashboard/src/lib/replayModeTests.ts | Service | Replay mode tests | YES | YES | No tests |
| dashboard/src/lib/legacyCampaignAdapter.ts | Service | Legacy campaign adapter | YES | YES | Adapter pattern |
| dashboard/src/lib/runtimeHealthCheck.ts | Service | Runtime health check | YES | YES | No tests |
| dashboard/src/lib/store.json.ts | Data | JSON store | YES | YES | No tests |
| dashboard/src/lib/stageGuards.ts | Service | Stage guards | YES | YES | No tests |
| dashboard/src/lib/stageMapping.ts | Service | Stage mapping | YES | YES | No tests |
| dashboard/src/lib/stageRuntimeRegistry.ts | Service | Stage runtime registry | YES | YES | No tests |
| dashboard/src/lib/gateSystem.ts | Service | Gate system | YES | YES | Overlaps with gateEngine.ts |
| dashboard/src/lib/test-markers.js | Test | Test markers | NO | YES | Test utility |
| dashboard/src/lib/test.js | Test | Test utility | NO | YES | Test utility |

#### System Config Files (system/) — All 52 files

| Path | Type | Purpose | Important? | Commit Safe? | Notes |
|------|------|---------|-----------|-------------|-------|
| system/model-routing.config.json | Config | Model routing rules (206 lines) | YES | YES | Single source of truth for routing |
| system/stage-contracts.json | Config | Stage I/O contracts (240 lines) | YES | YES | Drifts from actual code |
| system/gate-rules.json | Config | Gate definitions (348 lines, 9 gates) | YES | YES | Different IDs than docs |
| system/cost-controls.json | Config | Token budgets, rate limits (99 lines) | YES | YES | Enforcement unverified |
| system/model-restrictions.json | Config | Model use-case restrictions (114 lines) | YES | YES | — |
| system/workflow-state-machine.json | Config | State machine (101 lines) | YES | YES | — |
| system/replay-config.json | Config | Replay configuration (123 lines) | YES | YES | — |
| system/claim-ledger.json | Config | Fact claim registry | YES | YES | Used by governance validator |
| system/claim-ledger-rules.json | Config | Claim rules | YES | YES | — |
| system/anti-sales-language-rules.json | Config | Banned phrases | YES | YES | Used by governance validator |
| system/cta-softness-rules.json | Config | CTA tone rules | YES | YES | Used by governance validator |
| Plus 41 more config files | Config | Various rules, thresholds, rubrics | YES | YES | All safe to commit |

#### Script Files (scripts/) — 34 files

| Path | Type | Purpose | Important? | Commit Safe? | Notes |
|------|------|---------|-----------|-------------|-------|
| scripts/draft-pitch-draft.js | Script | S10: writes 08-pitch-draft.md (42,660 bytes) | YES | YES | S10 naming mismatch bug |
| scripts/draft-journalist-intel.js | Script | S9: journalist intelligence (37,507 bytes) | YES | YES | — |
| scripts/draft-study-input.js | Script | S2: data extraction (16,539 bytes) | YES | YES | — |
| scripts/validate-stage.ps1 | Script | Stage validation (22,466 bytes) | YES | YES | — |
| scripts/run-e2e-validation.ps1 | Script | E2E test (14,376 bytes) | YES | YES | — |
| scripts/launch-debug-chrome.ps1 | Script | Chrome debug launcher (16,650 bytes) | YES | YES | — |
| scripts/collect-muckrack-journalists.ps1 | Script | Muck Rack collection (12,665 bytes) | YES | YES | — |
| scripts/chrome-cdp-client.ps1 | Script | Chrome CDP client (11,459 bytes) | YES | YES | — |
| scripts/full-pressure-test.cjs | Script | Pressure test (12,548 bytes) | YES | YES | — |
| scripts/muckrack-collector.js | Script | Muck Rack collector (7,295 bytes) | YES | YES | — |
| scripts/import-muckrack-output.js | Script | Import Muck Rack data (6,432 bytes) | YES | YES | — |
| scripts/export-google-doc.js | Script | Google Docs export (5,034 bytes) | YES | YES | — |
| scripts/pressure-test.ps1 | Script | Pressure test (10,326 bytes) | YES | YES | — |
| Plus 21 more | Script | Various utilities | YES | YES | All safe to commit |

#### Verification Scripts (dashboard/scripts/) — 20 files

| Path | Type | Purpose | Important? | Commit Safe? | Notes |
|------|------|---------|-----------|-------------|-------|
| dashboard/scripts/verify-integration-contract-smoke.mjs | Script | Integration smoke test (14,217 bytes) | YES | YES | — |
| dashboard/scripts/verify-strict-audit-contract.mjs | Script | Strict audit contract (7,885 bytes) | YES | YES | — |
| dashboard/scripts/generate-connection-proof-report.mjs | Script | Connection proof (18,223 bytes) | YES | YES | — |
| Plus 17 more | Script | Verification utilities | YES | YES | All safe to commit |

#### Test Files (dashboard/src/tests/) — 3 files

| Path | Type | Purpose | Important? | Commit Safe? | Notes |
|------|------|---------|-----------|-------------|-------|
| dashboard/src/tests/model-routing.test.ts | Test | Model routing tests (454 lines) | YES | YES | Only substantive test |
| dashboard/src/tests/campaign-state.test.ts | Test | Campaign state tests | YES | YES | Size unknown |
| dashboard/src/tests/integration-readiness.test.ts | Test | Integration readiness tests | YES | YES | Size unknown |

#### Documentation Files (docs/) — 9 files

| Path | Type | Purpose | Important? | Commit Safe? | Notes |
|------|------|---------|-----------|-------------|-------|
| docs/model-routing-integration-audit.md | Docs | Routing integration audit (15,466 bytes) | YES | YES | — |
| docs/final-qa-checklist.md | Docs | QA checklist (10,244 bytes) | YES | YES | — |
| docs/model-routing-guide.md | Docs | Model routing guide (8,130 bytes) | YES | YES | — |
| docs/operator-runbook.md | Docs | Operations runbook (6,837 bytes) | YES | YES | — |
| docs/campaign-templates-guide.md | Docs | Template guide (6,601 bytes) | YES | YES | — |
| docs/agent-questioning-system-guide.md | Docs | Questioning system guide (6,250 bytes) | YES | YES | — |
| docs/dashboard-ai-guide.md | Docs | Dashboard AI guide (6,119 bytes) | YES | YES | — |
| docs/replay-mode-guide.md | Docs | Replay mode guide (5,755 bytes) | YES | YES | — |
| docs/model-routing-file-map.json | Data | Routing file mapping (6,107 bytes) | YES | YES | JSON data file |

#### Campaign Data (pitch-jobs/) — Not safe to commit (gitignored)

| Path | Type | Purpose | Important? | Commit Safe? | Notes |
|------|------|---------|-----------|-------------|-------|
| pitch-jobs/e2e-validation/ | Campaign | E2E test campaign (32 files) | YES | NO | User-generated content |
| pitch-jobs/birth-injury-law-march-2026/ | Campaign | Real campaign | YES | NO | User-generated content |
| pitch-jobs/clean-test-campaign/ | Campaign | Test campaign | YES | NO | — |
| Plus 11 more | Campaign | Various campaigns | YES | NO | All gitignored |
---

## 3. Full Workflow Map

### Workflow Overview

The project implements a 16-stage sequential workflow (S1 through S16), plus a preliminary S0 (clarification, no executable stage) and a post-S16 campaign state. The workflow is executed via HTTP POST requests to the execute-stage API endpoint.

### Visual Workflow

`	ext
User Input (Campaign Brief + Raw Study)
  |
  v
[POST /api/campaigns]  -->  Create campaign folder + 00-brief.md
  |
  v
[POST /api/campaigns/:id/execute-stage]

  ===== STAGE EXECUTOR (route.ts) =====
  |  1. Auth check (if DASHBOARD_AUTH_REQUIRED=true)
  |  2. Rate limiter check (30 req/min)
  |  3. Read stage-state.json
  |  4. Validate stage order (cannot skip ahead)
  |  5. Circuit breaker check (< 3 failures)
  |  6. Acquire execution lock (60s TTL)
  |  7. Append runtime event: "running"
  |  8. DISPATCH TO executeStageN()
  |  9. Validate output files
  10. Strict mode: validate upstream lineage
  11. Advance stage-state.json
  12. Clear circuit breaker
  13. Append runtime event: "completed"
  14. Release execution lock
  =====================================

  ===== STAGE PIPELINE =====

  S1  - Campaign Intake (inline, no LLM)
        Input:  User-provided brief
        Output: 01-campaign-intake.json
        LLM:    No

  S2  - Data Extraction (script + inline fallback)
        Input:  00-brief.md, raw-study-copy.md
        Script: draft-study-input.cmd
        Output: 02-insights.md, 01-study-notes.md, 02-raw-extracted-data.json
        LLM:    Optional (via stageExecutor)

  S3  - Research Enrichment (inline LLM)
        Input:  02-insights.md
        Output: 03-research.md, verified-findings.json, source-registry.json
        LLM:    Yes (Nemotron 3 Super)

  S4A - Data Research Analyst (inline LLM)
        Input:  03-research.md, verified-findings.json
        Output: InsightAnalysisMap.json
        LLM:    Yes (GPT-OSS-120B)

  S4B - Insight Analyst (inline LLM)
        Input:  Analyzed data
        Output: AngleGenerationHandoff.json
        LLM:    Yes (Hy3 Preview)

  S5  - Angle Generation (inline LLM)
        Input:  Analysis outputs
        Output: 04-angles.md, 05-beats.md
        LLM:    Yes (Hy3 Preview)

  S6  - Beat Matching (inline LLM)
        Input:  05-beats.md, 04-angles.md
        Output: 06-beat-match.json
        LLM:    Yes (Nemotron 3 Super)

  S7  - Human Gate (inline, always waits)
        Input:  06-beat-match.json
        Output: human-approval.json (status: "waiting")
        LLM:    Yes (GPT-OSS-120B, but always "waiting")
        NOTE:   ALWAYS BLOCKS - requires manual approval

  S8  - Journalist Collection (script or skip)
        Input:  human-approval.json
        Script: import-muckrack-output.cmd (or skip if CSV exists)
        Output: 08-journalist-list.csv
        LLM:    No

  S9  - Journalist Intelligence (script)
        Input:  08-journalist-list.csv, 06-beat-match.json
        Script: draft-journalist-intel.cmd
        Output: 09-journalist-intelligence.json, 06-journalist-intel.md, 07-journalist-coverage.md
        LLM:    No (script-based)

  S10 - Pitch Drafting (script)  *** BROKEN - NAMING MISMATCH ***
        Input:  00-brief.md, 02-insights.md, 03-research.md, 04-angles.md,
                05-beats.md, 06-journalist-intel.md, 07-journalist-coverage.md
        Script: draft-pitch-draft.cmd
        Script writes:  08-pitch-draft.md + 6 variants in draft-variants/
        Validator expects: 10-pitch-draft.md
        LLM:    No (script-based, may call API)
        STATUS: BLOCKED - file name mismatch

  S11 - Pitch Optimization (inline, untested)
        Input:  10-pitch-draft.md (depends on S10 fix)
        Output: 11-optimized-pitch.md
        LLM:    No

  S12 - Package Assembly (inline, untested)
        Input:  Multiple pitch files
        Output: 12-outreach-package.md
        LLM:    No

  S13 - Validation (inline, untested)
        Input:  Package + CSV + JSON
        Output: 13-validation-report.json
        LLM:    No

  S14 - Final Formatting (inline, untested)
        Input:  Package + validation
        Output: 14-final-formatted-package.md
        LLM:    No

  S15 - Outreach Assets (inline, untested)
        Input:  Formatted package
        Output: 15-outreach-assets.md
        LLM:    No

  S16 - Learning Loop (inline, untested)
        Input:  Validation report + final package + assets
        Output: 16-campaign-learning-log.json
        LLM:    No
`

### Workflow Risk Table

| Step | File/Module | What Happens | Input | Output | Risk |
|------|------------|-------------|-------|--------|------|
| S1 | executeStage1 | Parse brief, write intake JSON | User brief | 01-campaign-intake.json | Brief content not validated |
| S2 | executeStage2 + draft-study-input.js | Extract data from raw study | 00-brief.md, raw-study-copy.md | 02-insights.md, 01-study-notes.md | Fallback produces synthetic data |
| S3 | executeStage3 | Enrich research with LLM | 02-insights.md | 03-research.md | Empty enrichment if insights thin |
| S4A | executeStage4 | Cluster findings | 03-research.md | InsightAnalysisMap.json | Missing findings lead to empty clusters |
| S4B | executeStage4 | Generate insight-to-angle map | Analysis data | AngleGenerationHandoff.json | — |
| S5 | executeStage5 | Generate 40 angles | Analysis outputs | 04-angles.md, 05-beats.md | Fewer than 40 angles |
| S6 | executeStage6 | Match beats to journalists | 05-beats.md, 04-angles.md | 06-beat-match.json | Empty beat table → no mappings |
| S7 | executeStage7 | Write "waiting" status | 06-beat-match.json | human-approval.json | Always blocks; no automated path |
| S8 | executeStage8 | Run MuckRack script or skip | human-approval.json | 08-journalist-list.csv | Script may fail |
| S9 | executeStage9 + draft-journalist-intel.js | Write journalist profiles | CSV + beat match | 3 files (intel, coverage, JSON) | Script failure blocks |
| S10 | executeStage10 + draft-pitch-draft.js | Draft 6 pitch variants | 7 input files | 08-pitch-draft.md (writes) | NAMING MISMATCH - expects 10 |
| S11 | executeStage11 | Optimize pitch | 10-pitch-draft.md | 11-optimized-pitch.md | Depends on S10 fix |
| S12 | executeStage12 | Compile package | Multiple pitch files | 12-outreach-package.md | Depends on S10+S11 |
| S13 | executeStage13 | Run validation | Package + CSV + JSON | 13-validation-report.json | Quality issues block |
| S14 | executeStage14 | Format final output | Package + validation | 14-final-formatted-package.md | Depends on S12+S13 |
| S15 | executeStage15 | Create assets | Formatted package | 15-outreach-assets.md | Depends on S14 |
| S16 | executeStage16 | Generate learning log | Multiple inputs | 16-campaign-learning-log.json | Depends on S13+S14+S15 |

### Where Workflow Can Fail

1. **S10 naming mismatch** — Output file never matches expected name; API execution fails
2. **Script failure (S2, S8, S9, S10)** — Scripts retry 3x, then fail
3. **Missing dependency files** — ssertRealArtifact throws DependencyFailure
4. **LLM API errors** — llmService.ts failover, but cascading failures possible
5. **Invalid JSON from LLM** — Not handled; crashes receiving stage
6. **Circuit breaker open** — After 3 failures, stage is blocked until reset
7. **Execution lock contention** — 60s wait if another process is executing
8. **Rate limit exceeded** — 30 req/min per client+campaign
9. **Stage order violation** — Cannot skip ahead of current position
10. **Fallback data propagation** — Strict mode blocks downstream stages
---

## 4. Agents, Modules & Services

### Architecture Note

The project documents 40 agents in gent-registry.md and 10 sub-agents in workflow-architecture.md, but the runtime implementation is a **monolithic Next.js API** with script calls. There is no agent-based runtime framework, no agent-to-agent messaging, and no dynamic agent orchestration. The "agents" are **conceptual roles** that describe who performs each workflow step, not runtime entities.

**Verdict:** No explicit agent-based architecture found. The project uses modules/services and conceptual agents documented in brain files and the agent registry.

### Key Modules/Services Table

| Module / Service | File Path | Role | Input | Output | Called By | Calls | Status |
|-----------------|-----------|------|-------|--------|-----------|-------|--------|
| Stage Executor | oute.ts | Orchestrates all 16 stages | HTTP POST body + campaign folder | Stage output files + updated state | User/API | authGuard, rateLimiter, workflowEngine, stageExecutor, gateEngine | ACTIVE |
| LLM Service | llmService.ts | Makes LLM API calls to OpenRouter | Prompt + context | LLM response text | stageExecutor, modelRouter | OpenRouter API | ACTIVE |
| Model Router | modelRouter.ts | Routes stage to correct model | Stage number + prompt | Model response | stageExecutor | llmService, systemConfigLoader | ACTIVE |
| Workflow Engine | workflowEngine.ts | Orchestrates workflow state | Campaign ID + stage | State transitions | route.ts | campaignStateService, runtimeEvents | ACTIVE |
| Gate Engine | gateEngine.ts | Evaluates quality gates | Stage output files | Gate result (pass/warn/block) | route.ts | system/gate-rules.json | ACTIVE |
| Governance Validator | pitchGovernanceValidator.ts | Validates pitch quality | Pitch text | Issues + warnings | route.ts | claim-ledger, anti-sales, CTA rules | ACTIVE |
| Fallback Detector | allbackMarkers.ts | Detects placeholder content | File content | Boolean (is fallback) | route.ts | None | ACTIVE |
| Script Runner | scriptRunner.ts | Executes external scripts | Script path + args | Exit code + output | route.ts | Child process | ACTIVE |
| Auth Guard | uthGuard.ts | Authenticates API requests | Request headers | Auth result | route.ts | None | ACTIVE (if configured) |
| Rate Limiter | ateLimiter.ts | Limits request rate | Client + campaign ID | Allow/block | route.ts | None | ACTIVE |
| Campaign State | campaignStateService.ts | Manages campaign state | Campaign ID + action | State updates | workflowEngine | File system | ACTIVE |
| Brain Resolver | rainResolver.ts | Resolves brain files | Stage number | Brain file content | stageExecutor? | File system | UNVERIFIED |
| System Config Loader | systemConfigLoader.ts | Loads JSON configs | Config name | Config object | modelRouter, gateEngine, others | File system | ACTIVE |
| Web Search | webSearch.ts | Searches web via Jina AI | Search query | Search results | stageExecutor? | Jina AI API | ACTIVE |
| Database | db.ts | SQLite database operations | SQL queries | Query results | workflowEngine | SQLite | ACTIVE |
| Integration Externalization | integrationExternalization.ts | Manages external integrations | Integration type | Integration result | route.ts | Google, MuckRack, etc. | ACTIVE |

### Conceptual Agents (documented in agent-registry.md, not runtime entities)

| Agent Name | Documented Role | Brain File Exists? | Runtime Equivalent |
|-----------|----------------|-------------------|-------------------|
| digital-pr-orchestrator | Owns workflow order, quality gates | YES (01_Orchestrator_Brain.md) | route.ts + workflowEngine.ts |
| study-insight-extractor | Converts raw study to findings | YES (02_Data_Extractor_Brain.md) | executeStage2 + draft-study-input.js |
| research-enrichment-agent | Adds context, comparators, timing | YES (S3_Research_Enrichment_Brain.md) | executeStage3 |
| angle-generator | Creates 40 ranked angles | YES (S5_Angle_Generation_Brain.md) | executeStage5 |
| beat-matcher | Maps angles to journalist beats | YES (S6_Beat_Matching_Brain.md) | executeStage6 |
| journalist-intelligence-agent | Creates journalist profiles | YES (S9_Journalist_Intelligence_Brain.md) | executeStage9 + draft-journalist-intel.js |
| pitch-writer | Drafts 6 pitch variants | YES (10_Pitch_Copywriter_Brain.md) | executeStage10 + draft-pitch-draft.js |
| email-optimizer | Rewrites for tone/alignment | YES (11_Pitch_Optimizer_Brain.md) | executeStage11 |
| final-doc-packager | Packages final output | YES (S12_Package_Assembly_Brain.md) | executeStage12 |
| campaign-learning-agent | Logs learnings for future campaigns | YES (S16_Campaign_Learning_Loop_Brain.md) | executeStage16 |
---

## 5. Agent / Module Handoff Map

### Handoff Table

| From | To | Data Passed | File/Function | Validation Exists? | Risk |
|------|----|-------------|---------------|-------------------|------|
| User | S1 | Campaign brief text | POST /api/campaigns | No validation on input content | Incomplete brief |
| S1 | S2 | 01-campaign-intake.json | File system | File existence + non-empty | — |
| S2 | S3 | 02-insights.md, 02-raw-extracted-data.json | File system | assertRealArtifact | Fallback data may flow through |
| S3 | S4A | 03-research.md, verified-findings.json | File system | assertRealArtifact | — |
| S4A | S4B | InsightAnalysisMap.json | File system | assertRealArtifact | — |
| S4B | S5 | AngleGenerationHandoff.json | File system | assertRealArtifact | — |
| S5 | S6 | 05-beats.md, 04-angles.md | File system | assertRealArtifact | — |
| S6 | S7 | 06-beat-match.json | File system | assertRealArtifact | — |
| S7 | S8 | human-approval.json | File system | None (always passes 'waiting') | Always waits; blocks flow |
| S8 | S9 | 08-journalist-list.csv | File system | File existence | Script may fail |
| S9 | S10 | 06-journalist-intel.md, 07-journalist-coverage.md, 09-journalist-intelligence.json | File system | 3x assertRealArtifact, min 300 chars | — |
| S10 | S11 | 10-pitch-draft.md (expected) vs 08-pitch-draft.md (actual) | File system | assertRealArtifact for 10-pitch-draft.md | **BROKEN** — naming mismatch |
| S11 | S12 | 11-optimized-pitch.md | File system | assertRealArtifact + governance | Untested |
| S12 | S13 | 12-outreach-package.md | File system | assertRealArtifact | Untested |
| S13 | S14 | 13-validation-report.json | File system | File existence | Untested |
| S14 | S15 | 14-final-formatted-package.md | File system | assertRealArtifact | Untested |
| S15 | S16 | 15-outreach-assets.md | File system | assertRealArtifact | Untested |

### Handoff Assessment

**Strong handoffs:** S1→S2, S2→S3, S3→S4A, S4A→S4B, S4B→S5, S5→S6, S6→S7 (file existence + content validation)

**Weak handoffs:** S7→S8 (always waits, no real validation), S7→S8→S9 (script failure risk)

**Broken handoffs:** S10→S11 (naming mismatch blocks all downstream stages S11-S16)

**Missing validation:** No handoff validates JSON schema of LLM responses. No handoff validates that content is semantically meaningful (beyond fallback marker detection).

**Risky mappings:** The handoff between conceptual agents is via file I/O, not through any messaging system. If a file is corrupted or empty, the error may only be caught at the next ssertRealArtifact call.
---

## 6. Brain, Knowledge, Memory & Prompt Files

### Brain Files (25 files)

| File Path | Type | Used By | Purpose | Connected To Code? | Status | Risk |
|-----------|------|---------|---------|-------------------|--------|------|
| rain/00_Global_Workflow_Brain.md | Brain | All stages | System mission, truth rules | NOT loaded at runtime | UNUSED | Agent behavior may not match docs |
| rain/01_Orchestrator_Brain.md | Brain | Orchestrator role | Orchestrator instructions | NOT loaded at runtime | UNUSED | — |
| rain/02_Data_Extractor_Brain.md | Brain | S2 | Data extraction instructions | NOT loaded at runtime | UNUSED | — |
| rain/02_Validation_And_Truth_Brain.md | Brain | Most stages | Factuality rules | NOT loaded at runtime | UNUSED | — |
| rain/03_Journalist_Psychology_And_Emotional_Intelligence_Brain.md | Brain | S4B, S5, S7, S9-S13, S15 | Psychology rules | NOT loaded at runtime | UNUSED | — |
| rain/07_Human_Gate_Brain.md | Brain | S7 | Human approval instructions | NOT loaded at runtime | UNUSED | — |
| rain/10_Pitch_Copywriter_Brain.md | Brain | S10 | Pitch writing instructions | NOT loaded at runtime | UNUSED | — |
| rain/11_Pitch_Optimizer_Brain.md | Brain | S11 | Optimization instructions | NOT loaded at runtime | UNUSED | — |
| rain/13_Validator_Brain.md | Brain | S13 | Validation instructions | NOT loaded at runtime | UNUSED | — |
| rain/S0_Campaign_Clarification_Brain.md | Brain | S0 | Clarification | No S0 prompt file | ORPHANED | S0 can't execute |
| rain/S1_Campaign_Intake_Brain.md | Brain | S1 | Intake instructions | NOT loaded at runtime | UNUSED | — |
| rain/S3_Research_Enrichment_Brain.md | Brain | S3 | Enrichment instructions | NOT loaded at runtime | UNUSED | — |
| rain/S4A_Data_Research_Analyst_Brain.md | Brain | S4A | Analysis instructions | NOT loaded at runtime | UNUSED | — |
| rain/S4B_Insight_Analyst_Brain.md | Brain | S4B | Insight instructions | NOT loaded at runtime | UNUSED | — |
| rain/S5_Angle_Generation_Brain.md | Brain | S5 | Angle generation instructions | NOT loaded at runtime | UNUSED | — |
| rain/S6_Beat_Matching_Brain.md | Brain | S6 | Beat matching instructions | NOT loaded at runtime | UNUSED | — |
| rain/S8_Journalist_Collection_Brain.md | Brain | S8 | Collection instructions | NOT loaded at runtime | UNUSED | — |
| rain/S9_Journalist_Intelligence_Brain.md | Brain | S9 | Intelligence instructions | NOT loaded at runtime | UNUSED | — |
| rain/S12_Package_Assembly_Brain.md | Brain | S12 | Package instructions | NOT loaded at runtime | UNUSED | — |
| rain/S14_Final_Formatting_Brain.md | Brain | S14 | Formatting instructions | NOT loaded at runtime | UNUSED | — |
| rain/S15_Outreach_Asset_Creation_Brain.md | Brain | S15 | Asset instructions | NOT loaded at runtime | UNUSED | — |
| rain/S16_Campaign_Learning_Loop_Brain.md | Brain | S16 | Learning instructions | NOT loaded at runtime | UNUSED | — |
| rain/brain-change-log.md | Docs | N/A | Version tracking | Not applicable | ACTIVE | — |
| rain/brain-manifest.json | Config | N/A | Loading order | Referenced but runtime doesn't load | UNUSED | Contains deprecated paths |
| rain/remaining-agents.md | Docs | N/A | Future agent list | Not applicable | ACTIVE | — |
| rain/dashboard/ | Dir | N/A | Empty directory | Not applicable | ORPHANED | — |

### Prompt Files (17 files)

| File Path | Type | Used By | Purpose | Connected To Code? | Status | Risk |
|-----------|------|---------|---------|-------------------|--------|------|
| dashboard/prompts/campaign/S1_campaign_intake.md | Prompt | S1 | Stage 1 LLM prompt | YES (stageExecutor loads this) | ACTIVE | — |
| dashboard/prompts/campaign/S2_data_extraction.md | Prompt | S2 | Stage 2 LLM prompt | YES | ACTIVE | — |
| dashboard/prompts/campaign/S3_research_enrichment.md | Prompt | S3 | Stage 3 LLM prompt | YES | ACTIVE | — |
| dashboard/prompts/campaign/S4A_data_research_analyst.md | Prompt | S4A | Stage 4A LLM prompt | YES | ACTIVE | — |
| dashboard/prompts/campaign/S4B_insight_analyst.md | Prompt | S4B | Stage 4B LLM prompt | YES | ACTIVE | — |
| dashboard/prompts/campaign/S5_angle_generation.md | Prompt | S5 | Stage 5 LLM prompt | YES | ACTIVE | — |
| dashboard/prompts/campaign/S6_beat_matching.md | Prompt | S6 | Stage 6 LLM prompt | YES | ACTIVE | — |
| dashboard/prompts/campaign/S7_pitch_selection_human_gate.md | Prompt | S7 | Stage 7 LLM prompt | YES | ACTIVE | — |
| dashboard/prompts/campaign/S8_journalist_collection.md | Prompt | S8 | Stage 8 LLM prompt | YES | ACTIVE | — |
| dashboard/prompts/campaign/S9_journalist_intelligence.md | Prompt | S9 | Stage 9 LLM prompt | YES | ACTIVE | — |
| dashboard/prompts/campaign/S10_pitch_drafting.md | Prompt | S10 | Stage 10 LLM prompt | YES | ACTIVE | — |
| dashboard/prompts/campaign/S11_pitch_optimization.md | Prompt | S11 | Stage 11 LLM prompt | YES | ACTIVE | — |
| dashboard/prompts/campaign/S12_package_assembly.md | Prompt | S12 | Stage 12 LLM prompt | YES | ACTIVE | — |
| dashboard/prompts/campaign/S13_validation.md | Prompt | S13 | Stage 13 LLM prompt | YES | ACTIVE | — |
| dashboard/prompts/campaign/S14_final_formatting.md | Prompt | S14 | Stage 14 LLM prompt | YES | ACTIVE | — |
| dashboard/prompts/campaign/S15_outreach_asset_creation.md | Prompt | S15 | Stage 15 LLM prompt | YES | ACTIVE | — |
| dashboard/prompts/campaign/S16_campaign_learning_loop.md | Prompt | S16 | Stage 16 LLM prompt | YES | ACTIVE | — |

### Key Finding: Brain-Prompt Disconnect

All 17 prompt files are loaded at runtime by stageExecutor.ts. All 25 brain files (which contain more detailed agent instructions) are NOT loaded at runtime. The rainResolver.ts library exists but its integration with the stage executor was not confirmed. This means:

- Brain files contain detailed agent instructions that are NOT seen by the LLM
- Prompt files (which ARE seen by the LLM) may not contain all the instructions in brain files
- Agent behavior at runtime may not match documented brain instructions
---

## 7. LLM / AI System Review

### LLM System Found: YES

The project uses LLMs extensively through OpenRouter API. The core AI component is llmService.ts (4,149 lines) which handles all LLM interactions with error classification, rate limiting, and failover logic.

### LLM Components

| LLM Component | File Path | Provider / Model | Purpose | Input | Output | Validation | Risk |
|--------------|-----------|-----------------|---------|-------|--------|------------|------|
| Primary LLM Service | llmService.ts | OpenRouter (varies by stage) | All LLM calls | Stage prompts + campaign context | Stage output content | None on raw response | API key exposure |
| Model Router | modelRouter.ts | OpenRouter (per-stage) | Route to correct model | Stage number + prompt | Model response | Schema validation in stageExecutor | Routing errors |
| Hy3 Preview (Gemma 4) | system/model-routing.config.json | Google (free) | Orchestration, strategy, angles | Campaign data | Strategic analysis | None | Free model, rate-limited |
| Nemotron 3 Super | system/model-routing.config.json | NVIDIA (free) | Research, enrichment, journalist intel | Long context files | Research output | None | Free model, rate-limited |
| MiniMax M2.5 | system/model-routing.config.json | MiniMax (free) | Pitch drafting, packaging | Drafting prompts | Pitch content | None | Free model |
| GPT-OSS-120B | system/model-routing.config.json | OpenAI OSS (free) | Validation, claim checking | Validation prompts | Validation reports | None | May not be available |
| Hermes 3 405B | system/model-routing.config.json | Nous Research (free) | Optimization, rewriting | Editorial prompts | Improved drafts | None | Slow |
| LFM 2.5-1.2B | system/model-routing.config.json | Liquid (free) | Fast utility tasks | Small inputs | Quick output | None | Use-case restricted |
| Riverflow V2 (Flux) | system/model-routing.config.json | Black Forest Labs (free) | Image generation | Image prompts | Images | None | Use-case restricted |
| Nemotron 3 Nano | system/model-routing.config.json | Google (free) | Multimodal extraction | Images | Extracted text | None | Use-case restricted |
| Qwen3 Coder | system/model-routing.config.json | Qwen (free) | Formatting (S14) | Formatting prompts | Formatted output | None | Code model for text |

### Per-Stage Model Routing

| Task | Model Used | Where Defined | Configurable? | Fallback Exists? | Cost Risk |
|------|-----------|--------------|---------------|------------------|-----------|
| S1 Campaign Intake | Hy3 Preview | system/model-routing.config.json | YES | YES (2 fallbacks) | None (free) |
| S2 Data Extraction | GPT-OSS-120B | Config | YES | YES (2 fallbacks) | None (free) |
| S3 Research Enrichment | Nemotron 3 Super | Config | YES | YES (2 fallbacks) | None (free) |
| S4A Data Research Analyst | GPT-OSS-120B | Config | YES | YES (2 fallbacks) | None (free) |
| S4B Insight Analyst | Hy3 Preview | Config | YES | YES (2 fallbacks) | None (free) |
| S5 Angle Generation | Hy3 Preview | Config | YES | YES (2 fallbacks) | None (free) |
| S6 Beat Matching | Nemotron 3 Super | Config | YES | YES (2 fallbacks) | None (free) |
| S7 Human Gate | GPT-OSS-120B | Config | YES | YES (2 fallbacks) | None (free) |
| S8 Journalist Collection | MiniMax M2.5 | Config | YES | YES (2 fallbacks) | None (free) |
| S9 Journalist Intelligence | Nemotron 3 Super | Config | YES | YES (2 fallbacks) | None (free) |
| S10 Pitch Drafting | Hermes 3 405B | Config | YES | YES (2 fallbacks) | None (free) |
| S11 Pitch Optimization | Hermes 3 405B | Config | YES | YES (2 fallbacks) | None (free) |
| S12 Package Assembly | MiniMax M2.5 | Config | YES | YES (2 fallbacks) | None (free) |
| S13 Validation | GPT-OSS-120B | Config | YES | YES (2 fallbacks) | None (free) |
| S14 Final Formatting | Qwen3 Coder | Config | YES | YES (2 fallbacks) | None (free) |
| S15 Outreach Assets | Hermes 3 405B | Config | YES | YES (2 fallbacks) | None (free) |
| S16 Learning Loop | GPT-OSS-120B | Config | YES | YES (2 fallbacks) | None (free) |

### LLM Error Handling

| Error Type | Handled? | Behavior | Risk |
|-----------|---------|----------|------|
| Rate limit (429) | YES | Automatic failover to fallback model | Low |
| Server error (5xx) | YES | Failover to fallback model | Low |
| Safety block (403/451) | YES | Manual review mode | Low |
| Bad request (400) | Partial | Log error, don't fallback | Medium |
| Timeout | YES | Retry once, then failover | Low |
| Zombie response | YES | Short response detection | Low |
| Invalid JSON from LLM | **NO** | Not handled — crashes stage | **HIGH** |
| Invalid API key | **NO** | Defaults to 'free', fails silently | **MEDIUM** |
| Empty response | YES | Zombie check | Low |

### Key LLM Findings

1. **All models are free-tier** — Zero cost but subject to rate limiting and availability
2. **No dry-run mode** — All calls go to live API; no offline testing
3. **No output validation in llmService.ts** — Raw responses passed through; JSON.parse errors crash the receiving stage
4. **Cost controls configured but enforcement unverified** — cost-controls.json defines budgets but runtime code may not enforce them
5. **Model routing is config-driven** — Changes don't require code changes
---

## 8. Config & Environment Review

### Config Files Overview

| Config / Env Var | File Path | Used In | Required? | Default | Risk | Notes |
|-----------------|-----------|---------|-----------|---------|------|-------|
| OPENROUTER_API_KEY | dashboard/.env.local | llmService.ts | YES | 'free' | **HIGH** | Live key on disk; .env.local is gitignored |
| JINA_API_KEY | dashboard/.env.local | webSearch.ts | YES (for search) | None | **HIGH** | Live key on disk |
| GOOGLE_CLIENT_ID | dashboard/.env.local | Google OAuth | No | None | MEDIUM | Live client ID |
| GOOGLE_CLIENT_SECRET | dashboard/.env.local | Google OAuth | No | None | **CRITICAL** | Live secret on disk |
| GOOGLE_REFRESH_TOKEN | dashboard/.env.local + data/google-token.json | Google OAuth | No | None | **CRITICAL** | Live token in 2 locations |
| LLM_API_KEY | dashboard/.env.local | Stage 4 AI | No | Empty | Low | Not configured |
| LLM_API_BASE | dashboard/.env.local | Stage 4 AI | No | https://api.minimax.chat/v1 | Low | Default endpoint |
| STRICT_REAL_ONLY | route.ts | route.ts | No | true | Low | Strict mode ON by default |
| ALLOW_DEV_MOCK_ARTIFACTS | route.ts | route.ts | No | false | Low | Mock artifacts OFF |
| DASHBOARD_AUTH_REQUIRED | authGuard.ts | authGuard.ts | No | false | **MEDIUM** | Auth OFF by default |
| DASHBOARD_API_TOKEN | authGuard.ts | authGuard.ts | No | None | **MEDIUM** | No auth token set |
| DASHBOARD_SESSION_SECRET | sessionAuth.ts | sessionAuth.ts | No | change_me_session_secret | MEDIUM | Placeholder |
| INTERNAL_AUDIT_TOKEN | audit middleware | audit middleware | No | change_me_to_a_long_random_secret | MEDIUM | Placeholder |
| MUCKRACK_EMAIL | dashboard/.env.local | Muck Rack | No | 'configured' | Low | Placeholder |
| MUCKRACK_CHROME_PROFILE_DIR | dashboard/.env.local | Muck Rack | No | D:\Codex Folder\chrome-debug-profile | Low | Hardcoded path |
| MUCKRACK_DEBUG_PORT | dashboard/.env.local | Muck Rack | No | 9333 | Low | Static port |
| EXTERNALIZATION_MODE | dashboard/.env.local | Externalization | No | local (if unset) | Low | Not in .env.local |
| DASHBOARD_AUTH_USERS_JSON | dashboard/.env.local | Auth | No | {"admin":{...}} | Low | Not configured |

### System Config File Categories

| Category | Files | Total |
|----------|-------|-------|
| Model & Routing | model-routing.config.json, model-restrictions.json, model-performance-log.json | 3 |
| Stage & Workflow | stage-contracts.json, stage-output-registry.json, workflow-state-machine.json, replay-stage-dependencies.json | 4 |
| Gates & Validation | gate-rules.json, validation-rules.json | 2 |
| Cost & Circuit | cost-controls.json, circuit-breakers.json, input-locks.json | 3 |
| Replay | replay-config.json, replay-rules.json, replay-stage-dependencies.json | 3 |
| Claims & Sources | claim-ledger.json, claim-ledger-rules.json, source-confidence-rules.json, source-of-truth-map.json | 4 |
| Journalist Rules | journalist-psychology-rules.json, journalist-tone-rules.json, journalist-asset-readiness-rules.json, beat-fit-before-writing-rules.json, do-not-pitch-rules.json | 5 |
| Language & Tone | anti-sales-language-rules.json, cta-softness-rules.json, dashboard-tone-rules.json | 3 |
| Emotion & Sensitivity | emotional-risk-rules.json, emotional-signal-rules.json, urgency-rules.json, sensitive-topic-rules.json, newsworthiness-rules.json, exclusivity-rules.json | 6 |
| Evaluation | evaluation-rubrics.json, evaluation-score-weights.json, evaluation-thresholds.json | 3 |
| Questions | agent-question-bank.json, agent-question-routing.json, question-answer-contracts.json, question-issue-types.json, question-priority-rules.json | 5 |
| Other | agent-logic-conditions.json, module-flags.json, final-human-gut-check-rules.json, final-readiness-rules.json, file-permissions.json, context-isolation.json, schema-ownership.json, prompt-version-log.json, prompt-versioning.json, campaign-templates.json, dashboard-feature-contracts.json, derived-metric-policy.json | 12 |

### Environment Variable Config (dashboard/.env.local.example vs dashboard/.env.local)

The .env.local.example defines 22 environment variables. The actual .env.local has only 12. Missing from .env.local: INTERNAL_AUDIT_TOKEN, DASHBOARD_AUTH_REQUIRED, DASHBOARD_API_TOKEN, DASHBOARD_API_TOKEN_ROLE, DASHBOARD_ROUTE_POLICIES_JSON, DASHBOARD_SESSION_SECRET, DASHBOARD_AUTH_USERS_JSON, DASHBOARD_SESSION_TTL_SECONDS, EXTERNALIZATION_MODE, GOOGLE_OAUTH_APP_VERIFIED, GOOGLE_OAUTH_PUBLISH_STATUS, and various Muck Rack configuration vars.
---

## 9. External Integrations

| Integration | File(s) | Purpose | Read/Write? | Gate Exists? | Risk |
|------------|---------|---------|-------------|-------------|------|
| OpenRouter API | llmService.ts | LLM model calls (free-tier models) | Write (send prompts + receive responses) | Rate limiter, circuit breaker | HIGH — API key on disk; cost exposure |
| Jina AI API | webSearch.ts | Web search / SERP for research enrichment | Read (search results) | None | HIGH — API key on disk |
| Google OAuth 2.0 | integrationExternalization.ts | Google Docs export | Write (create documents) | None | CRITICAL — Full OAuth credentials on disk |
| Chrome DevTools Protocol | browser-tools/, chrome-cdp-client.ps1 | Browser automation for Muck Rack data collection | Read/Write (browse, collect) | Chrome debug gate (G29 in docs) | Medium — Browser automation |
| Muck Rack | collect-muckrack-journalists.ps1, muckrack-collector.js, import-muckrack-output.js | Journalist data collection | Read (scrape profiles) | Muck Rack access gate | Low — No live credentials |

### Integration Safety

- **OpenRouter**: NO dry-run mode — all calls go to live API. eplay-config.json defines dry_run mode but llmService.ts doesn't implement it.
- **Google OAuth**: NO dry-run mode — exports would create real Google Docs.
- **Chrome/Muck Rack**: NO dry-run mode — performs real web requests.
- **No human approval gate exists before any external API call.**
---

## 10. Gates & Safety Controls

### Gate Inventory

| Gate | Exists? | File/Location | Status | Evidence | Risk |
|------|---------|---------------|--------|----------|------|
| **Auth Guard** | YES | authGuard.ts, sessionAuth.ts | PARTIAL | Exists in code but disabled by default (DASHBOARD_AUTH_REQUIRED defaults to false) | MEDIUM — API open without auth |
| **Rate Limiter** | YES | rateLimiter.ts | NOT TESTED | 30 req/min per client+campaign | Low — No test coverage |
| **Circuit Breaker** | YES | route.ts:89-93,1637-1649 | NOT TESTED | Tracks failures per stage; blocks after 3 failures | Low — No auto-reset |
| **Execution Lock** | YES | route.ts:28-61 | NOT TESTED | 60s TTL, PID-based ownership | Low — 60s wait on stale lock |
| **Strict Mode** | YES | route.ts:18 (STRICT_MODE) | NOT TESTED | Blocks downstream stages if upstream artifacts contain fallback markers | Low — ON by default |
| **Stage Output Validation** | YES | route.ts validateStageOutput | PARTIAL | Checks file existence, non-empty, no fallback markers | Tested manually during E2E |
| **Upstream Lineage Validation** | YES | route.ts validateUpstreamLineage | NOT TESTED | Checks upstream artifacts for fallback markers | Only active in strict mode |
| **Governance Validator** | YES | pitchGovernanceValidator.ts | NOT TESTED | Checks claims, banned sales language, CTA softness | Only used in S10-S12 |
| **Fallback Marker Detection** | YES | fallbackMarkers.ts | PARTIAL | 67 placeholder markers; used by strict mode and output validation | Markers list is comprehensive |
| **Stage Order Validation** | YES | route.ts | NOT TESTED | Checks stage > currentStage | Prevents skip-ahead |
| **Mutation Audit Logging** | YES | writeApiAuditLog | NOT TESTED | Logs each API mutation | Some errors swallowed |
| **Script Retry (3x)** | YES | runScriptWithRetry | NOT TESTED | Retries failed scripts up to 3 times | No exponential backoff |
| **Human Approval Gate** | PARTIAL | executeStage7 | ALWAYS WAITING | Writes 'waiting' status; no automated approval path | Blocks automated flow |
| **Paid LLM Gate** | YES | system/model-routing.config.json | PASS (disabled) | ig_pickle model disabled in production | Low — All free models |
| **Preflight Gate (G0)** | YES (config) | system/gate-rules.json | NOT TESTED | Gate rule defined in JSON | Not verified in runtime |
| **Topic Expansion Gate (G0A)** | YES (config) | system/gate-rules.json | NOT TESTED | Gate rule defined in JSON | Not verified in runtime |
| **Data Reliability Gate (G1)** | YES (config) | system/gate-rules.json | NOT TESTED | Gate rule defined in JSON | Not verified in runtime |
| **Verified Findings Gate (G2)** | YES (config) | system/gate-rules.json | NOT TESTED | Gate rule defined in JSON | Not verified in runtime |
| **Angle Quality Gate (G3)** | YES (config) | system/gate-rules.json | NOT TESTED | Gate rule defined in JSON | Not verified in runtime |
| **Human Review Gates (G4-G8)** | YES (config) | system/gate-rules.json | NOT TESTED | Gate rules defined in JSON | Not verified in runtime |
| **29 Documented Gates (G1-G29)** | DOCS ONLY | validation-gates.md | NOT IMPLEMENTED | Defined in documentation but IDs don't match code | Documentation drift |

### Key Gate Findings

1. **Auth is disabled by default** — The dashboard API is open to all requests unless DASHBOARD_AUTH_REQUIRED=true is explicitly set
2. **No gate tests exist** — Zero unit tests for gateEngine.ts, authGuard.ts, rateLimiter.ts, or circuit breaker
3. **Gate documentation (29 gates) doesn't match implementation (9 gates with different IDs)**
4. **No human approval gate exists before any external API call** — All stages execute automatically once triggered
5. **gateEngine.ts integration with stage execution is unverified** — It may not be actively called during every stage
---

## 11. Inputs, Outputs & Data Flow

| Data Item | Source | Used By | Output Location | Validation | Risk |
|-----------|--------|---------|----------------|-----------|------|
| Campaign brief | User input (POST /api/campaigns) | All stages | pitch-jobs/<campaign>/00-brief.md | None on content | Brief may be incomplete |
| Raw study material | User upload | S2 | source-files/study-inputs/raw-study-copy.md | File existence | Missing study blocks S2 |
| 01-campaign-intake.json | S1 | S2 | pitch-jobs/<campaign>/ | File existence + non-empty | — |
| 02-insights.md | S2 | S3 | pitch-jobs/<campaign>/ | assertRealArtifact | Fallback data may be thin |
| 03-research.md | S3 | S4A | pitch-jobs/<campaign>/ | assertRealArtifact | — |
| InsightAnalysisMap.json | S4A | S4B | pitch-jobs/<campaign>/ | File validity | — |
| AngleGenerationHandoff.json | S4B | S5 | pitch-jobs/<campaign>/ | File validity | — |
| 04-angles.md, 05-beats.md | S5 | S6 | pitch-jobs/<campaign>/ | assertRealArtifact | — |
| 06-beat-match.json | S6 | S7 | pitch-jobs/<campaign>/ | Must have mappings | — |
| human-approval.json | S7 | S8 | pitch-jobs/<campaign>/ | None (always passes) | Always waits |
| 08-journalist-list.csv | S8 | S9 | pitch-jobs/<campaign>/ | File existence | Script may fail |
| 06-journalist-intel.md, 07-journalist-coverage.md | S9 | S10 | pitch-jobs/<campaign>/ | 3x assertRealArtifact, min 300 chars | — |
| 08-pitch-draft.md (script writes) | S10 | S11 | pitch-jobs/<campaign>/ | 400+ chars + governance | **NAMING MISMATCH** |
| 10-pitch-draft.md (validator expects) | S10 | S11 | pitch-jobs/<campaign>/ | assertRealArtifact | **BLOCKS E2E** |
| 11-optimized-pitch.md | S11 | S12 | pitch-jobs/<campaign>/ | 450+ chars + governance | Untested |
| 12-outreach-package.md | S12 | S13, S14 | pitch-jobs/<campaign>/ | 700+ chars | Untested |
| 13-validation-report.json | S13 | S14, S16 | pitch-jobs/<campaign>/ | Must pass all checks | Untested |
| 14-final-formatted-package.md | S14 | S15, S16 | pitch-jobs/<campaign>/ | 900+ chars | Untested |
| 15-outreach-assets.md | S15 | S16 | pitch-jobs/<campaign>/ | 450+ chars | Untested |
| 16-campaign-learning-log.json | S16 | Next campaign | pitch-jobs/<campaign>/ | Must have inputs + recommendations | Untested |
| Runtime events | route.ts | Debugging | pitch-jobs/<campaign>/runtime-events.jsonl | None | Unbounded growth |
| Campaign state | route.ts | Workflow | pitch-jobs/<campaign>/stage-state.json | Read on each execution | Dual persistence with SQLite |
| Dashboard logs | Dashboard | Debugging | logs/, dashboard/logs/, root *.log files | None | Not gitignored |

---

## 12. Tests & Validation

| Test File | What It Tests | Related Module | Status | Notes |
|-----------|--------------|----------------|--------|-------|
| dashboard/src/tests/model-routing.test.ts | Stage routing, dashboard routing, fallback chains, model restrictions, config integrity | modelRouter.ts, model-routing.config.ts, system/model-routing.config.json | EXISTS (454 lines) | Only substantive test file |
| dashboard/src/tests/campaign-state.test.ts | Campaign state operations | campaignStateService.ts | EXISTS (size unknown) | Contents not fully audited |
| dashboard/src/tests/integration-readiness.test.ts | Integration readiness checks | integrationReadiness.ts | EXISTS (size unknown) | Contents not fully audited |
| scripts/run-e2e-validation.ps1 | E2E workflow (S1-S10+ manually) | All stages | EXISTS (14,376 bytes) | Not part of Vitest suite |
| scripts/full-pressure-test.cjs | Pressure/stress testing | All stages | EXISTS (12,548 bytes) | Not part of Vitest suite |
| scripts/pressure-test.ps1 | Pressure/stress testing | All stages | EXISTS (10,326 bytes) | Not part of Vitest suite |

### Critical Test Gaps

| Untested Module | Lines | Risk |
|----------------|-------|------|
| llmService.ts | 4,149 | HIGH - No LLM error handling, rate limiting, failover tests |
| workflowEngine.ts | 674 | HIGH - No orchestration tests |
| stageExecutor.ts | 459 | HIGH - No stage execution tests |
| execute-stage/route.ts | 1,851 | HIGH - No stage executor tests |
| pitchGovernanceValidator.ts | 272 | MEDIUM - No governance validation tests |
| gateEngine.ts | 350 | MEDIUM - No gate evaluation tests |
| fallbackMarkers.ts | 66 | LOW - No marker detection tests |
| scriptRunner.ts | 109 | LOW - No script execution tests |
| authGuard.ts | 131 | MEDIUM - No auth tests |
| rateLimiter.ts | - | MEDIUM - No rate limit tests |
| All other 65 lib modules | - | MEDIUM - Zero tests |

### Test Commands

```powershell
# Run all Vitest tests (from dashboard/ directory)
cd dashboard
npx vitest run

# Run specific test
npx vitest run src/tests/model-routing.test.ts
```


---

## 13. Runtime, Cache, Generated & Local Files

| Path / Pattern | Type | Purpose | Commit Safe? | Recommendation |
|---------------|------|---------|-------------|---------------|
| `logs/` | Logs | Runtime log files | NO | Add to .gitignore |
| `dashboard/logs/` | Logs | Dashboard log files | NO | Add to .gitignore |
| `dashboard-dev.err.log` | Logs | Dashboard error log (root) | NO | Add to .gitignore |
| `dashboard-server.log` | Logs | Dashboard server log (root) | NO | Add to .gitignore |
| `dashboard-dev.out.log` | Logs | Dashboard output log (root) | NO | Add to .gitignore |
| `node_modules/` | Dependencies | npm packages | NO | Already gitignored |
| `dashboard/node_modules/` | Dependencies | npm packages | NO | Already gitignored |
| `dashboard/.next/` | Build | Next.js build output | NO | Already gitignored |
| `data/db.json` | Data | SQLite database (or JSON dump) | NO | Already gitignored |
| `data/google-token.json` | Data | Google OAuth token (LIVE) | NO | Already gitignored; contains live token |
| `pitch-jobs/` | Data | All campaign artifacts | NO | Already gitignored |
| `pitch-jobs-backup-*/` | Backup | Old campaign backups | NO | Clean up |
| `pitch-jobs-backups/` | Backup | Old campaign backups | NO | Clean up |
| `audit-reports/` | Reports | Generated audit reports | NO | Already gitignored |
| `browser-tools/logs/` | Logs | Browser automation logs | NO | Already gitignored |
| `browser-tools/screenshots/` | Data | Browser screenshots | NO | Already gitignored |
| `chrome-debug-profile/` | Data | Chrome browser profile | NO | Already gitignored |
| `.secrets/` | Secrets | Empty secrets directory | NO | Already gitignored |
| `*.tsbuildinfo` | Build | TypeScript build cache | NO | Not in .gitignore |
| `pitch-jobs/<campaign>/runtime-events.jsonl` | Data | Per-campaign execution log | NO | Part of pitch-jobs/ (gitignored) |
| `pitch-jobs/<campaign>/stage-state.json` | Data | Campaign workflow state | NO | Part of pitch-jobs/ (gitignored) |
| `circuit-state.json` | Data | Circuit breaker state | NO | Not checked for gitignore |
| `coverage/` | Test | Test coverage output | NO | Already gitignored |
| `scripts/*.js` (without negative pattern) | Code | Compiled/generated scripts | REVIEW | Some are source code, some are compiled |

---

## 14. Git & Commit Readiness

### Current Git Status

- **Git repository:** NONE (no .git directory exists)
- **Current branch:** N/A
- **Latest commit:** N/A
- **git status:** N/A (not a git repository)

### Files Safe to Commit (Once git init is done)

- All source code in `dashboard/src/` (76 lib modules, app routes, configs)
- All 17 prompt files in `dashboard/prompts/campaign/`
- All 52 system config files in `system/`
- All 25 brain files in `brain/`
- All 34 scripts in `scripts/` (source files, not compiled)
- All 20 verification scripts in `dashboard/scripts/`
- All 9 documentation files in `docs/`
- All 15 root documentation .md files
- All 18 schema files in `schemas/`
- All 48 template files in `templates/`
- `.gitignore`, `package.json`, `tailwind.config.js`, `postcss.config.js`
- `.env.local.example`

### Files NOT Safe to Commit

- `dashboard/.env.local` â€” Contains 5 live API keys (gitignored, but verify)
- `data/google-token.json` â€” Contains live OAuth token (gitignored)
- `logs/` â€” Runtime logs (NOT gitignored â€” must add)
- `dashboard/logs/` â€” Dashboard logs (NOT gitignored â€” must add)
- `node_modules/`, `dashboard/node_modules/` â€” Dependencies (gitignored)
- `pitch-jobs/` â€” Campaign data (gitignored)
- `audit-reports/` â€” Generated reports (gitignored)
- All backup directories (`pitch-jobs-backup-*/`, `pitch-jobs-backups/`)
- `FULL-AUDIT-REPORT.md` â€” Generated report (but safe to commit if desired)
- `MASTER-COMPREHENSIVE-REPORT.md` â€” Generated report (but safe to commit if desired)
- This file (`docs/PROJECT_FULL_WORKFLOW_AND_FILE_MAP.md`) â€” Generated documentation

### Pre-Commit Checklist

1. Add `logs/` and `dashboard/logs/` to `.gitignore`
2. Add `dashboard-dev.err.log`, `dashboard-server.log`, `dashboard-dev.out.log` to `.gitignore`
3. Add `*.tsbuildinfo` to `.gitignore`
4. Rotate ALL live API keys before any remote push
5. Verify no secrets in staged files

**READY TO COMMIT: NO â€” Requires .gitignore updates and API key rotation first**

---

## 15. Issues, Gaps & Missing Pieces

| ID | Issue / Gap | File(s) | Severity | Evidence | Recommendation |
|----|------------|---------|----------|----------|---------------|
| I1 | No Git repository | Entire project | Critical | `git status` fails at every path | `git init` after fixing .gitignore gaps |
| I2 | Live API keys in .env.local | dashboard/.env.local | Critical | 5 live credentials | Rotate all keys; replace with placeholders |
| I3 | S10 naming mismatch | scripts/draft-pitch-draft.js, route.ts | High | Script writes 08-pitch-draft.md; validator expects 10-pitch-draft.md | Fix script output filename |
| I4 | Critically low test coverage | dashboard/src/tests/ | High | 3 test files for 76 lib modules | Add tests for priority modules |
| I5 | Brain/prompt disconnect | brain/, dashboard/prompts/campaign/ | Medium | Runtime loads prompts, not brain files | Load brain files or reconcile content |
| I6 | Stage contracts mismatch | system/stage-contracts.json vs route.ts | Medium | Different I/O for same stages | Audit all 16 stages |
| I7 | Empty brain/dashboard/ directory | brain/dashboard/ | Low | Directory with 0 files | Remove or populate |
| I8 | No S0 prompt file | dashboard/prompts/campaign/ | Low | 17 prompts for S1-S16, none for S0 | Create S0 prompt file |
| I9 | No gate tests | gateEngine.ts (350 lines) | Medium | Zero gate tests exist | Add gate engine tests |
| I10 | No governance validator tests | pitchGovernanceValidator.ts (272 lines) | Medium | Zero validator tests exist | Add governance tests |
| I11 | No workflow engine tests | workflowEngine.ts (674 lines) | High | No tests for core orchestration | Add workflow engine tests |
| I12 | No stage execution tests | stageExecutor.ts (459 lines) | High | No tests for stage execution flow | Add stage execution tests |
| I13 | No LLM service tests | llmService.ts (4,149 lines) | High | No tests for LLM error handling | Add LLM service tests |
| I14 | No error handling tests | Various | Medium | Error classification, retry logic untested | Add error handling tests |
| I15 | Hardcoded project identity in prompts | dashboard/prompts/campaign/*.md | Low | All prompt files reference "Digital PR" | Externalize identity |
| I16 | 30 RPM rate limit potentially too low | llmService.ts | Low | 2-second minimum interval | Monitor for throttling |
| I17 | No dry-run mode | llmService.ts | Medium | All calls go to live API | Add dryRun flag |
| I18 | logs/ not in .gitignore | logs/, dashboard/logs/ | Medium | Not excluded from version control | Add to .gitignore |
| I19 | Prompt injection risk | llmService.ts, webSearch.ts | Medium | Web search content fed to LLM without sanitization | Add instruction separation |
| I20 | Runtime files persist across restarts | data/db.json, circuit-state.json | Low | Stale data may cause issues | Add cleanup on startup |

---

## 16. Handoff Notes for Next Developer / AI Session

### Current Project State

The project `digital-pr-agents` is a Digital PR Orchestrator â€” a Next.js localhost dashboard with a 16-stage workflow for journalist email pitch generation. It has been thoroughly audited with 20 issues documented. No fixes have been applied. A previous E2E run completed S1-S9 via API and S10-S16 manually (S10 was blocked by a naming mismatch).

### What the Project Does

Automates journalist email pitch generation through a 16-stage sequential workflow:
- S1-S6: Intake, extraction, enrichment, analysis, angle generation, beat matching
- S7: Human approval gate (always waits)
- S8-S10: Journalist collection, intelligence, pitch drafting (via external scripts)
- S11-S16: Optimization, packaging, validation, formatting, assets, learning loop

### Important Files

| File | Path | Why Important |
|------|------|--------------|
| Stage executor | dashboard/src/app/api/campaigns/[id]/execute-stage/route.ts | Central nervous system â€” all 16 stages (1,851 lines) |
| LLM service | dashboard/src/lib/llmService.ts | All LLM calls (4,149 lines) |
| Model router | dashboard/src/lib/modelRouter.ts | Routes to correct model (759 lines) |
| Gate engine | dashboard/src/lib/gateEngine.ts | Validates stage outputs (350 lines) |
| Pitch governance | dashboard/src/lib/pitchGovernanceValidator.ts | Quality checks (272 lines) |
| Fallback markers | dashboard/src/lib/fallbackMarkers.ts | Placeholder detection (66 lines) |
| Stage contracts | system/stage-contracts.json | Defines stage I/O (240 lines) |
| Gate rules | system/gate-rules.json | Quality gate definitions (348 lines) |
| Model routing | system/model-routing.config.json | Model assignments (206 lines) |

### Known Issues

1. **S10 naming mismatch** â€” `draft-pitch-draft.js` writes `08-pitch-draft.md` but the API validates `10-pitch-draft.md`. Fix needed in script or validator.
2. **Live API keys** â€” `dashboard/.env.local` has 5 live credentials. Must rotate before any remote push.
3. **No Git repo** â€” Initialize before any further development.
4. **Test gap** â€” Only 3 test files for 76 library modules.

### Risks

- Prompt injection from web search content fed to LLM
- No output validation for LLM JSON responses (invalid JSON crashes stages)
- Auth disabled by default
- Brain files not loaded at runtime (agent behavior may not match docs)
- Gate documentation (29 gates) doesn't match implementation (9 gates)

### Safe Next Commands

```powershell
# Start dashboard
cd dashboard
npm run dev:3002

# Run existing tests
npx vitest run

# Run model routing tests
npx vitest run src/tests/model-routing.test.ts

# Run verification scripts
npm run verify:ci
```

### Commands to Avoid

```powershell
# DO NOT run git add -f (could expose secrets)
# DO NOT run git push to any remote (keys not rotated)
# DO NOT run without DASHBOARD_AUTH_REQUIRED=true in production
```

### Files Not to Touch Casually

- `execute-stage/route.ts` â€” 1,851 lines of tightly coupled logic
- `llmService.ts` â€” 4,149 lines of LLM interaction
- `modelRouter.ts` â€” Central routing affects all stages
- `system/*.json` â€” Config files; changes break routing
- `.gitignore` â€” Incorrect changes could expose secrets

### Recommended Next Steps (Priority Order)

1. Add `logs/` and `dashboard/logs/` to `.gitignore`
2. Rotate API keys and replace .env.local with placeholders
3. Fix S10 naming mismatch
4. `git init` and create initial commit
5. Add unit tests for: `pitchGovernanceValidator`, `gateEngine`, `fallbackMarkers`, `llmService`
6. Run all 20 verification scripts
7. Reconcile `stage-contracts.json` with actual runtime I/O
8. Connect brain files to runtime or reconcile with prompt files

---

## 17. Final Summary

| Area | Status |
|------|--------|
| **Project identity:** | Digital PR Orchestrator â€” Next.js dashboard for journalist email pitch generation |
| **Workflow clarity:** | CLEAR â€” 16-stage sequential workflow with file-system handoffs |
| **Agent/module clarity:** | PARTIAL â€” 40 conceptual agents documented; runtime is monolithic API (76 lib modules) |
| **Brain file status:** | COMPLETE but DISCONNECTED â€” 25 brain files not loaded at runtime |
| **LLM status:** | FUNCTIONAL â€” 10+ free-tier OpenRouter models with per-stage routing and fallbacks |
| **Config status:** | RICH â€” 52 JSON config files, 22+ env vars, 18 schemas, 48 templates |
| **Gate status:** | PARTIAL â€” Auth, rate limiter, circuit breaker, execution lock exist; 5-9 gates in code vs 29 documented |
| **Test status:** | CRITICAL â€” 3 test files for 76 lib modules; 0% coverage for 2 largest files |
| **Commit readiness:** | NOT READY â€” No Git repo; .gitignore needs updates; API keys need rotation |
| **Handoff readiness:** | PARTIAL â€” Well-documented; S10 naming bug blocks E2E |
| **Biggest risk:** | 5 live API keys on disk; no version control |
| **Recommended next step:** | Add `logs/` to `.gitignore`, rotate API keys, fix S10 naming mismatch, then `git init` |

---

**End of Project Full Workflow and File Map**

**File size:** ~65 KB (estimated, 17 sections)
**Sections created:** 17
**Files inventoried:** 200+ across all directories
**Issues documented:** 20 (2 Critical, 5 High, 6 Medium, 7 Low)
**Safe to commit:** REVIEW REQUIRED â€” Contains no secrets, but is a generated documentation file

### Warnings

1. This file describes the project as-is after audit. Do not take status descriptions as verified without running tests.
2. The brain/prompt disconnect (I5) is a potential source of agent behavior issues that has not been tested.
3. Gate documentation (validation-gates.md) defines 29 gates but code implements a subset with different IDs â€” do not rely on gate documentation as authoritative.
4. All LLM models are free-tier â€” production availability and rate limits may vary.
5. S10 naming mismatch must be fixed before any E2E execution via the API.

