# Dashboard AI Guide

## Overview

The Dashboard AI system provides intelligent assistance for campaign management through multiple AI-powered features. Each feature is optimized with specific models for best results.

## Dashboard Panels

### 1. Campaign Overview Panel
Shows basic campaign information and current status.

### 2. Stage Timeline Panel
Visual representation of 16 campaign stages with progress indicators.

### 3. Model Usage Panel
Displays which models were used for each stage execution.

### 4. Fallback Events Panel
Shows all instances where fallback models were used.

### 5. Validation Panel
Displays validation results from S13 and other validation stages.

### 6. Human Gate Panel
Shows S7 approval status and allows angle selection.

### 7. Output Files Panel
Lists all generated files from each stage.

### 8. Recommended Next Action Panel
AI-powered recommendation for next workflow step.

## AI Features

### Workflow Status Summary
- **Model:** lfm_25_12b (fast utility)
- **Purpose:** Quick overview of campaign health
- **Use:** When you need a fast status check

### Stage Failure Explanation
- **Model:** gpt_oss_120b (reasoning)
- **Purpose:** Diagnose why a stage failed
- **Use:** When a stage returns an error

### Fallback Event Analysis
- **Model:** gpt_oss_120b (reasoning)
- **Purpose:** Analyze why fallback was triggered
- **Use:** When you want to understand fallback patterns

### Campaign Progress Overview
- **Model:** hy3_preview (orchestrator)
- **Purpose:** Strategic overview of campaign progress
- **Use:** When planning next steps

### Recommended Next Action
- **Model:** hy3_preview (orchestrator)
- **Purpose:** AI recommendation for workflow next step
- **Use:** When unsure what to do next

### Audit Log Analysis
- **Model:** gpt_oss_120b (reasoning)
- **Purpose:** Analyze audit logs for patterns
- **Use:** When investigating issues

### Output Quality Score
- **Model:** gpt_oss_120b (reasoning)
- **Purpose:** Score output quality for a stage
- **Use:** When assessing stage outputs

### Pitch Readability Preview
- **Model:** hermes_3_405b (editorial)
- **Purpose:** Check pitch readability and flow
- **Use:** Before finalizing pitch

### Dashboard Copy Labels Helper
- **Model:** minimax_m25 (production)
- **Purpose:** Generate user-facing copy text
- **Use:** When customizing dashboard labels

### Search Across Campaign Files
- **Model:** nemotron_3_super (research)
- **Purpose:** Search content across all campaign files
- **Use:** When finding specific information

### Chart/Image/Document Interpretation
- **Model:** nemotron_3_nano_omni (multimodal)
- **Purpose:** Extract data from images/charts
- **Use:** When analyzing visual assets

### Visual Asset Generation
- **Model:** riverflow_v2 (visual)
- **Purpose:** Generate visual content
- **Use:** When creating social cards, graphics

## How Recommended Next Action Works

1. Analyzes current stage
2. Checks previous outputs
3. Reviews audit logs
4. Considers validation results
5. Recommends next logical step

Example flow:
- S7 completes → "Review angles and approve"
- S13 fails → "Fix validation errors, re-run S13"
- S13 passes → "Ready for final formatting"

## How Fallback Analysis Works

When a fallback occurs:
1. Logs primary model error reason
2. Records which fallback was used
3. Tracks retry count
4. Dashboard displays "Fallback Used" badge
5. AI can analyze why fallback was needed

## How Pitch Readability Works

Checks for:
- Sentence length variation
- Vocabulary complexity
- Clear hierarchy (headings, bullets)
- Call to action presence
- Subject line quality
- Overall flow

Scores: Excellent / Good / Needs Work

## How Validation Display Works

S13 Validation Results show:
- **Structure Check:** JSON schema validity
- **Content Check:** Required fields present
- **Claim Verification:** Facts match sources
- **Contradiction Detection:** No internal conflicts
- **Readability:** Clear and understandable

If any check fails:
- Shows as "Needs Revision"
- Blocks "Ready to Send" status

## Human Approval Workflow

### For S7 Pitch Selection:

1. **S7 Completes** → Dashboard shows "Review Required"
2. **View Angles** → All generated angles displayed
3. **Select One** → Click to choose preferred angle
4. **Click Approve** → Submits approval
5. **Status Updates** → `human-approval.json` → "approved"
6. **S8 Enabled** → Can resume workflow

### Resume from S8:

After approval:
```bash
POST /api/campaigns/{id}/resume
{ "targetStage": "S8_JOURNALIST_COLLECTION" }
```

Or use Dashboard "Resume" button.

## Troubleshooting

### "AI Feature Not Working"
- Check API route exists in `src/app/api/dashboard/ai/route.ts`
- Verify routing in DASHBOARD_ROUTING
- Check model has valid config

### "Wrong Model Used"
- Check feature routing in DASHBOARD_ROUTING
- Verify fallback chain is correct

### "Validation Panel Empty"
- Check S13 has run
- Verify validation results saved

### "Recommended Action Wrong"
- Check audit logs for context
- Verify current stage is correctly tracked

### "Fallback Events Not Showing"
- Check model logs being captured
- Verify logging in modelRouter.ts

## Model by Feature Quick Reference

| Feature | Model | Response Time |
|---------|-------|---------------|
| Status Summary | lfm_25_12b | Fast |
| Failure Explanation | gpt_oss_120b | Medium |
| Fallback Analysis | gpt_oss_120b | Medium |
| Progress Overview | hy3_preview | Fast |
| Next Action | hy3_preview | Fast |
| Audit Analysis | gpt_oss_120b | Medium |
| Quality Score | gpt_oss_120b | Medium |
| Pitch Readability | hermes_3_405b | Slow |
| Copy Labels | minimax_m25 | Fast |
| File Search | nemotron_3_super | Medium |
| Image Interpretation | nemotron_3_nano_omni | Fast |
| Visual Generation | riverflow_v2 | Medium |

## Best Practices

1. Use **lfm_25_12b** for quick, simple queries
2. Use **gpt_oss_120b** for complex analysis
3. Use **hy3_preview** for strategic recommendations
4. Use **hermes_3_405b** for writing polish
5. Use **riverflow_v2** only for visual content
6. Use **nemotron_3_nano_omni** only for image/chart input