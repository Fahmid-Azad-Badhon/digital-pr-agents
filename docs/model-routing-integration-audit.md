# Model Routing Integration Audit

## 1. Executive Summary

This audit documents the current Digital PR workflow architecture and identifies integration points for adding a multi-model routing system.

### Key Findings
- **Workflow**: 16 stages with 15 agents including Stage 4 dual-agent design
- **Current LLM Integration**: Centralized in `llmService.ts` using OpenRouter with 3 active free models
- **Model Configuration**: Defined in `agentToolRegistry.ts` with 9 models registered (3 active + 6 new)
- **Dashboard**: Next.js-based with real-time stage tracking, model usage display, and workflow controls
- **Architecture Status**: Production-ready for basic execution; needs router integration for advanced model selection

### Recommendation
Implement a tiered model routing system that:
1. Routes by stage/tier (Orchestration, Research, Production, Technical)
2. Uses intelligent fallback with retry logic
3. Monitors model performance per task
4. Logs all routing decisions for audit

---

## 2. Existing Architecture Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DIGITAL PR ORCHESTRATOR                          │
├─────────────────────────────────────────────────────────────────────┤
│  Dashboard (Next.js)                                                │
│  ├── pages/ (API routes, campaign views)                           │
│  ├── components/ (Visualization, AgentCard, Timeline)             │
│  └── context/ (DataContext for state)                              │
├─────────────────────────────────────────────────────────────────────┤
│  Agent Brain System                                                │
│  ├── data/agentBrainRegistry.ts (15 agent configs)                │
│  ├── data/agentToolRegistry.ts (9 LLM + 30+ tools)               │
│  ├── lib/agentRuntime.ts (Stage execution)                        │
│  ├── lib/agentMemory.ts (Context building)                        │
│  ├── lib/agentGuardrails.ts (Hallucination protection)            │
│  ├── lib/agentHandoff.ts (Stage transitions)                     │
│  ├── lib/agentTrace.ts (Execution logs)                          │
│  └── lib/agentFeedback.ts (Human feedback loop)                  │
├─────────────────────────────────────────────────────────────────────┤
│  LLM Service                                                        │
│  └── lib/llmService.ts (Central model router)                    │
│      ├── Primary: Nemotron 3 Super (free)                          │
│      ├── Fallback: MiniMax M2.5 (free)                            │
│      └── Quality Gate: GPT-5.5 Thinking (requires key)            │
├─────────────────────────────────────────────────────────────────────┤
│  Database                                                            │
│  └── lib/db.ts (JSON-based with campaigns, stages, logs)          │
│      └── data/campaigns.json                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Current Workflow Stage Map

| Stage | Name | Owner Agent | Current Model | Status |
|-------|------|-------------|---------------|--------|
| S1 | Campaign Intake | Orchestrator | Hy3 Preview | Complete |
| S2 | Data Extraction | Data Extractor | Nemotron Super | Complete |
| S3 | Research Enrichment | Researcher | Nemotron Super | Complete |
| S4 | Data & Research Analysis | Data Analyst + Insight Analyst | Nemotron Super | Complete |
| S5 | Angle Generation | Strategist | Hy3 Preview | Complete |
| S6 | Beat Matching | Beat Matcher | Hy3 Preview | Complete |
| S7 | Pitch Selection (Human Gate) | Human Reviewer | N/A | Pending |
| S8 | Journalist Collection | Collector | Hy3 Preview | Pending |
| S9 | Journalist Intelligence | Intelligence | Nemotron Super | Pending |
| S10 | Pitch Drafting | Copywriter | MiniMax M2.5 | Pending |
| S11 | Email Optimization | Optimizer | Nemotron Super | Pending |
| S12 | Final Package | Packager | MiniMax M2.5 | Pending |
| S13 | Google Doc Export | Orchestrator | Qwen3 Coder | Pending |
| S14 | Technical Validation | Validator | Qwen3 Coder | Pending |
| S15 | Browser Validation | Collector | Hy3 + GPT-5.5 | Pending |
| S16 | Regression & Production | Production | GPT-5.5 | Pending |

### Stage 4 Detail (Dual Agent)
- **Agent 4A**: Data & Research Analyst - Validates statistics, sources, evidence quality
- **Agent 4B**: Insight Analyst - Creates storylines, angle directions from verified evidence

---

## 4. Current Dashboard Map

### Frontend (Next.js App Router)
| Page | Purpose | Shows |
|------|---------|-------|
| `/` | Main dashboard | Campaign overview, agent status, metrics |
| `/campaigns/create` | Create new campaign | Form for brief input |
| `/workflow` | Stage timeline | Visual progress, current stage |
| `/angles` | Angle generation | 40 angles with scores |
| `/angle-selection` | Select angles | Checkboxes, selected count |
| `/pitch-selection` | Human gate | Human approval UI |
| `/journalists` | Journalist list | Muck Rack data |
| `/pitches` | Pitch variants | 6 draft variants |
| `/optimization` | Email optimization | 16-factor scorecard |
| `/validation` | Technical checks | JSON, script, path validation |
| `/logs` | Activity log | Timestamped entries |
| `/models` | Model routing | Tier configuration |

### Backend API Routes
| Route | Purpose |
|-------|---------|
| `/api/campaigns` | CRUD operations |
| `/api/models` | Model routing config (GET/POST) |
| `/api/workflow` | Stage execution |
| `/api/validate` | Output validation |
| `/api/artifacts` | File management |

---

## 5. Current AI/Model Call Map

### Primary LLM Integration Point
**File**: `src/lib/llmService.ts`

**Current Model Stack** (3 active):
1. `nvidia/nemotron-3-super-8b` - Research/Extraction (Primary)
2. `minimax/minimax-m2.5:free` - Production/Writing (Fallback)
3. `openai/gpt-5.5-thinking` - Quality Gate (Requires key)

**New Models Added** (9 total):
- Big Pickle
- GPT-OSS-120B
- Hermes 3 405B
- LFM 2.5-1.2B
- Nemotron 3 Nano Omni
- Riverflow V2

### Call Flow
```
Agent Runtime → LLM Service → OpenRouter API → Model Response
                     ↓
              Rate Limiter (2s throttle)
              Error Classifier (429, 5xx, 403, 400)
              Fallback Logic (Primary → Fallback)
              Temperature Scaling (Stage-specific)
              Schema Validation (Zod)
```

### Model Role Assignments (from types/index.ts)
| Stage | Primary Model | Quality Gate | Fallback |
|-------|--------------|---------------|----------|
| S1-Campaign Intake | Hy3 Preview | GPT-5.5 (optional) | MiniMax M2.5 |
| S2-Data Extraction | Nemotron Super | GPT-5.5 Thinking | MiniMax M2.5 |
| S3-Research | Nemotron Super | GPT-5.5 Thinking | MiniMax M2.5 |
| S4-Analysis | Nemotron Super | GPT-5.5 Thinking | MiniMax M2.5 |
| S5-Angles | Hy3 Preview | GPT-5.5 Thinking | MiniMax M2.5 |
| S9-Intelligence | Nemotron Super | GPT-5.5 Thinking | MiniMax M2.5 |
| S10-Pitch Draft | MiniMax M2.5 | GPT-OSS-120B | Hy3 Preview |
| S11-Optimization | GPT-5.5 Thinking | MiniMax M2.5 | Nemotron Super |
| S16-Production | GPT-5.5 Thinking | GPT-OSS-120B | Nemotron Super |

---

## 6. Current Config & Environment Variable Map

### Environment Files
- `.env.local` - Local secrets
- `.env.local.example` - Template

### Current Variables
```
JINA_API_KEY=your_jina_api_key_here      # Free search API
LLM_API_KEY=your_llm_api_key_here       # MiniMax (free tier)
LLM_API_BASE=https://api.minimax.chat/v1
```

### Key Configuration Files
| File | Purpose |
|------|---------|
| `src/data/agentToolRegistry.ts` | LLM tool definitions |
| `src/types/index.ts` | MODEL_ROUTES array |
| `src/data/agentBrainRegistry.ts` | Agent configs |
| `src/lib/stageMapping.ts` | Stage relationships |

---

## 7. Current Output/Artifact Map

### Artifact Locations
- **Campaign Data**: `data/campaigns.json`
- **Logs**: `data/logs/` (per campaign)
- **Artifacts**: `data/artifacts/` (per campaign)
- **Stage Files**: `pitch-jobs/<slug>/<stage>.md`
- **Snapshots**: `snapshots/<campaignId>/`

### Artifact Naming Convention
- `00-brief.md` - Campaign brief
- `01-study-notes.md` - Raw study extraction
- `02-insights.md` - Structured data points
- `03-research.md` - Research enrichment
- `04-angles.md` - 40 pitch angles
- `05-beats.md` - Beat mapping
- `06-journalist-intel.md` - Journalist profiles
- `07-journalist-coverage.md` - Coverage history
- `08-pitch-draft.md` - Selected pitch variant
- `09-optimized-email.md` - Final optimized email
- `10-google-doc.md` - Export package

### JSON Artifacts
- `verified-findings.json` - Stage 4A output
- `InsightAnalysisMap.json` - Stage 4B output
- `AngleGenerationHandoff.json` - Stage 4 → 5 handoff

---

## 8. Current Logging & Error Handling Map

### Logging System
- **Implementation**: `lib/db.ts` - `addLog()` function
- **Log Levels**: debug, info, warning, error, critical
- **Storage**: `data/campaigns.json` (logs array)
- **Retention**: 1000 logs per campaign

### Error Classification (llmService.ts)
| Status Code | Category | Action |
|-------------|----------|--------|
| 429 | Throttling | Retry with backoff (up to 3x) |
| 5xx | Infrastructure | Failover to MiniMax |
| 403/451 | Safety | Manual review required |
| 400 | Bug | Halt (don't fallback) |
| Timeout | Timeout | Retry once, then failover |

### Anti-Hallucination Features
- `detectRefusal()` - Detect refusal patterns
- `extractRefusalType()` - Classify refusal type
- `validateStageOutput()` - Zod schema validation
- `validateHandover()` - Contract validation

---

## 9. Existing Test Coverage Map

### Test File: `src/lib/integrationTests.ts`

**Coverage Areas**:
1. Agent runtime execution
2. Context package building
3. Guardrail blocking
4. Handoff validation
5. Trace logging
6. Feedback recording
7. Artifact configuration
8. Stage mapping
9. Registry entry lookup

**Test Configuration**:
- Mock campaign: `test-campaign-001`
- Mock workflow run: `test-wf-001`
- Mock stages: 5 completed (S1-S5)

---

## 10. Gaps & Risks

### Identified Gaps

1. **No Tier-Based Router**
   - Current: Single primary + single fallback
   - Needed: Multi-tier routing (Quality Gate, Research, Production, Orchestration)

2. **No Model Performance Tracking**
   - No latency, success rate, or quality metrics per model
   - No model preference learning

3. **No Multimodal Model Integration**
   - Nemotron 3 Nano Omni defined but not integrated
   - No image/screenshot processing pipeline

4. **No Visual Model Integration**
   - Riverflow V2 defined but not integrated
   - No campaign visual generation

5. **API Key Handling**
   - Uses `'free'` as default API key (OpenRouter free tier)
   - No secure key management for premium models

6. **Dashboard Model Display**
   - Model page exists but shows hardcoded models
   - No real-time model usage stats

### Risks

1. **Rate Limiting**: Free tier limited to 30 RPM; no burst handling
2. **Hallucination**: Model-specific hallucinations not tracked per model
3. **Fallback Chain**: Only 1 fallback; multi-model failure not handled
4. **Cost**: GPT-5.5 requires paid API key (not yet integrated securely)

---

## 11. Recommended Integration Approach

### Phase 1: Router Infrastructure
1. Create `src/lib/modelRouter.ts` - Tier-based routing logic
2. Update `llmService.ts` - Integrate router instead of hardcoded fallback
3. Add model metrics tracking per request

### Phase 2: Dashboard Integration
1. Update `/api/models` - Return real model status from registry
2. Update `/models` page - Display 9 models with tier assignments
3. Add model usage cards to main dashboard

### Phase 3: Advanced Features
1. Add multimodal pipeline for Nemotron Nano Omni
2. Add visual generation pipeline for Riverflow V2
3. Implement model performance learning

---

## 12. Exact Files to Create

| File | Purpose |
|------|---------|
| `docs/model-routing-integration-audit.md` | This audit (create) |
| `docs/model-routing-file-map.json` | Machine-readable file map (create) |
| `src/lib/modelRouter.ts` | Tier-based routing logic (create) |
| `src/lib/modelMetrics.ts` | Model performance tracking (create) |
| `src/app/api/model-performance/route.ts` | Model metrics API (create) |

---

## 13. Exact Files to Modify

| File | Modification |
|------|---------------|
| `src/lib/llmService.ts` | Integrate modelRouter instead of hardcoded models |
| `src/types/index.ts` | Update MODEL_ROUTES with 9 models |
| `src/data/agentToolRegistry.ts` | Ensure all 9 models have tool definitions |
| `src/app/api/models/route.ts` | Return dynamic model data from registry |
| `src/app/models/page.tsx` | Display all 9 models with status |

---

## 14. Exact Files NOT to Touch

| File | Reason |
|------|--------|
| `src/lib/db.ts` | Working database layer |
| `src/lib/workflowEngine.ts` | Working workflow execution |
| `src/lib/agentRuntime.ts` | Working agent orchestration |
| `src/lib/agentGuardrails.ts` | Working hallucination protection |
| `src/data/agentBrainRegistry.ts` | Working agent definitions |
| `src/lib/integrationTests.ts` | Working test suite |
| `templates/*` | Working stage templates |

---

## 15. Step-by-Step Implementation Plan

### Part 2: Router Infrastructure
1. Create `modelRouter.ts` with tier-based selection
2. Add model metrics tracking
3. Integrate with `llmService.ts`
4. Test with existing integration tests

### Part 3: Dashboard Updates
1. Update models API to show all 9 models
2. Update models page with tier display
3. Add model usage cards to dashboard

### Part 4: Advanced Routing
1. Add cost-based routing option
2. Add latency-based race routing
3. Add model fallback chains

### Part 5: Performance Learning
1. Track per-model success rates
2. Track per-model latency
3. Add model preference learning
4. Add A/B testing for model selection

---

## Summary

### Findings
- **Architecture**: Complete 16-stage workflow with 15 agents
- **LLM Integration**: Centralized in `llmService.ts` with 9 models available
- **Dashboard**: Next.js-based with model status display capability
- **Current Status**: Ready for router integration

### Integration Points
1. `src/lib/llmService.ts` - Primary integration point
2. `src/app/api/models/route.ts` - Dashboard API
3. `src/types/index.ts` - Model route definitions

### Next Steps
Proceed to Part 2: Create model router infrastructure and integrate with LLM service.