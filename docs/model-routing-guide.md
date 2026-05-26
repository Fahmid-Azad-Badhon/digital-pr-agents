# Model Routing Guide

## Overview

The Model Routing System controls which AI models are used for each part of the Digital PR workflow:

1. **Campaign Stages** - Each of the 16 campaign stages has a specific model assignment
2. **Dashboard AI Features** - Each dashboard assistant feature routes to optimized models
3. **Fallback Chains** - Automatic fallback when primary model fails
4. **Model Restrictions** - Hard guards on restricted models (Riverflow, Nano Omni, LFM, Big Pickle)

## Model Role Table

| Model Key | Display Name | Role | Production? |
|-----------|--------------|------|-------------|
| hy3_preview | Hy3 Preview | Orchestrator, Strategy | Yes |
| nemotron_3_super | Nemotron 3 Super | Research, Extraction | Yes |
| minimax_m25 | MiniMax M2.5 | Production, Writing | Yes |
| gpt_oss_120b | GPT-OSS-120B | Validation, Reasoning | Yes |
| hermes_3_405b | Hermes 3 405B | Editorial, Polish | Yes |
| lfm_25_12b | LFM 2.5-1.2B | Fast Utility | Yes |
| nemotron_3_nano_omni | Nemotron 3 Nano Omni | Multimodal Input | Yes |
| riverflow_v2 | Riverflow V2 | Visual Generation | Yes |
| big_pickle | Big Pickle | Experimental | **No** |

## Campaign Stage Routing Table

| Stage | Primary Model | Fallback 1 | Fallback 2 | Human Gate? |
|-------|--------------|------------|------------|-------------|
| S1: Campaign Intake | hy3_preview | gpt_oss_120b | nemotron_3_super | No |
| S2: Data Extraction | nemotron_3_super | gpt_oss_120b | hy3_preview | No |
| S3: Research Enrichment | nemotron_3_super | hy3_preview | gpt_oss_120b | No |
| S4A: Data Analyst | gpt_oss_120b | nemotron_3_super | hy3_preview | No |
| S4B: Insight Analyst | hy3_preview | gpt_oss_120b | nemotron_3_super | No |
| S5: Angle Generation | hy3_preview | hermes_3_405b | minimax_m25 | No |
| S6: Beat Matching | nemotron_3_super | gpt_oss_120b | hy3_preview | No |
| S7: Pitch Selection | gpt_oss_120b | hy3_preview | nemotron_3_super | **Yes** |
| S8: Journalist Collection | nemotron_3_super | hy3_preview | lfm_25_12b | No |
| S9: Journalist Intelligence | nemotron_3_super | gpt_oss_120b | hy3_preview | No |
| S10: Pitch Drafting | minimax_m25 | hermes_3_405b | hy3_preview | No |
| S11: Pitch Optimization | hermes_3_405b | minimax_m25 | gpt_oss_120b | No |
| S12: Package Assembly | minimax_m25 | hy3_preview | lfm_25_12b | No |
| S13: Validation | gpt_oss_120b | nemotron_3_super | hy3_preview | No |
| S14: Final Formatting | minimax_m25 | lfm_25_12b | hy3_preview | No |
| S15: Asset Creation | minimax_m25 | hermes_3_405b | hy3_preview | No |
| S16: Campaign Log | hy3_preview | gpt_oss_120b | lfm_25_12b | No |

## Dashboard Feature Routing Table

| Feature | Primary Model | Fallback 1 | Fallback 2 |
|---------|--------------|------------|------------|
| workflow_status_summary | lfm_25_12b | minimax_m25 | - |
| stage_failure_explanation | gpt_oss_120b | hy3_preview | - |
| fallback_event_analysis | gpt_oss_120b | nemotron_3_super | - |
| campaign_progress_overview | hy3_preview | gpt_oss_120b | - |
| recommended_next_action | hy3_preview | gpt_oss_120b | - |
| audit_log_analysis | gpt_oss_120b | nemotron_3_super | - |
| output_quality_score | gpt_oss_120b | hermes_3_405b | - |
| pitch_readability_preview | hermes_3_405b | minimax_m25 | - |
| dashboard_copy_labels | minimax_m25 | hermes_3_405b | - |
| search_across_campaign_files | nemotron_3_super | gpt_oss_120b | - |
| chart_image_interpretation | nemotron_3_nano_omni | nemotron_3_super | - |
| dashboard_visual_asset_generation | riverflow_v2 | - | - |

## How Fallback Works

1. **Primary Model First** - The primary model is always tried first
2. **Retry Logic** - If primary fails (timeout, rate limit), retry up to `maxRetries` times
3. **Fallback Chain** - If all retries fail, try fallback1, then fallback2
4. **Logging** - Every model attempt is logged with status, duration, and reason

### Fallback Triggers

The router automatically triggers fallback on:
- API errors
- Timeouts
- Rate limiting
- Empty output
- Invalid JSON
- Schema validation failures
- Unsafe model usage

## How Validation Works

### JSON Validation (S2, S3, S4A, S4B, S9, S13, S16)
- Uses Zod schemas in `src/schemas/campaign/`
- Fails if output doesn't match schema
- Can trigger retry or fallback

### Markdown Validation (S10, S11, S14)
- Checks for required sections (subject line, hook, body, call to action)
- Fails if any required section is missing

### CSV Validation (S8)
- Checks required columns: journalist_name, publication, beat, relevance_reason, priority_score
- Validates no empty required fields

## How S7 Human Gate Works

1. **S7 Executes** - Model generates pitch angle options
2. **Output Saved** - Results saved to `07-selected-angle.md`
3. **Approval File Created** - `human-approval.json` created with status: "waiting"
4. **Workflow Paused** - S8 does NOT run automatically
5. **Dashboard Shows** - Operator reviews angles and selects one
6. **Approval Submitted** - Operator clicks "Approve" in dashboard
7. **Status Updated** - `human-approval.json` updated to status: "approved"
8. **Resume Enabled** - S8 can now run

## How Resume Works

```bash
# Via Dashboard API
POST /api/campaigns/{id}/resume
{ "targetStage": "S8_JOURNALIST_COLLECTION" }
```

Prerequisites:
- `human-approval.json` must exist
- Status must be "approved"
- selectedAngleTitle or selectedAngleId must be set

## How Dashboard AI Works

1. **User Action** - User clicks an AI button in dashboard
2. **Feature Routing** - Request routes to appropriate model based on feature
3. **Context Loading** - Relevant campaign data loaded
4. **Model Execution** - Model processes request with fallback
5. **Response Returned** - Result shown in dashboard
6. **Logging** - All AI calls logged to audit-log.json

## How to Update Model IDs

Edit `src/config/model-routing.config.ts`:

```typescript
MODEL_CONFIG: {
  hy3_preview: {
    // Change this from 'openrouter/auto' to actual ID
    modelId: 'actual-openrouter-model-id',
    // ...
  }
}
```

**Note:** Models marked "PLACEHOLDER" need real OpenRouter IDs before production use.

## How to Add a New Model

1. Add model to `MODEL_CONFIG` with unique key
2. Define role, timeout, retries, allowedUseCases
3. Set `enabledInProductionWorkflow: true`
4. Add to stage or dashboard routing as needed
5. Add to tests

## How to Add a New Stage

1. Add routing to `CAMPAIGN_STAGE_ROUTING`
2. Add prompt template to `prompts/campaign/`
3. Add schema if JSON output to `src/schemas/campaign/`
4. Add output file to `STAGE_OUTPUT_FILES`
5. Add to tests

## How to Add a Dashboard Feature

1. Add routing to `DASHBOARD_ROUTING`
2. Implement in `src/app/api/dashboard/ai/route.ts`
3. Add UI in dashboard components
4. Add to tests

## How to Inspect Logs

### Via API
```bash
GET /api/campaigns/{id}/status
```

### Via File System
- Audit logs: `pitch-jobs/{campaign}/audit-log.json`
- Errors: `pitch-jobs/{campaign}/errors.json`
- Model logs: Access via DashboardContext

## How to Run Dry-Run Mode

```bash
# Test model routing only (no actual model calls)
npm run test:model-routing

# Test dashboard routing
npm run test:dashboard-routing

# Test dry-run scenarios
npm run test:dry-run
```

Dry-run tests use mock outputs and don't call actual LLMs.

## How to Run Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Specific test suites
npm run test:model-routing
npm run test:dashboard-routing
npm run test:dry-run
```

## Known Limitations

1. **Model IDs** - Several models have "PLACEHOLDER" IDs that need real OpenRouter IDs
2. **LLM Integration** - ModelRouter.callModel() is a placeholder, needs integration with llmService.ts
3. **No Real API Calls** - Dry-run tests don't make actual API calls
4. **Big Pickle** - Disabled in production, only for experimental/debugging

## Troubleshooting

### "No routing config found"
- Check stage ID spelling in CAMPAIGN_STAGE_ROUTING

### "Model blocked"
- Check model restrictions in ROUTER_SETTINGS.modelRestrictions

### "Fallback used"
- Check previous model logs for error details

### "Validation failed"
- Check output against schema in src/schemas/campaign/