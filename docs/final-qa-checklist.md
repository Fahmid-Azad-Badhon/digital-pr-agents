# Final QA Checklist

## Campaign Workflow

### Stage S1: Campaign Intake
- [ ] Routes to hy3_preview (primary)
- [ ] Fallbacks: gpt_oss_120b, nemotron_3_super
- [ ] Output saved to 00-brief.md
- [ ] No human gate required

### Stage S2: Data Extraction
- [ ] Routes to nemotron_3_super (primary)
- [ ] Fallbacks: gpt_oss_120b, hy3_preview
- [ ] Output saved to 01-study-notes.md
- [ ] JSON validation works

### Stage S3: Research Enrichment
- [ ] Routes to nemotron_3_super (primary)
- [ ] Fallbacks: hy3_preview, gpt_oss_120b
- [ ] Output saved to 03-research.md

### Stage S4A: Data Research Analyst
- [ ] Routes to gpt_oss_120b (primary)
- [ ] Fallbacks: nemotron_3_super, hy3_preview
- [ ] Output saved to verified-findings.json

### Stage S4B: Insight Analyst
- [ ] Routes to hy3_preview (primary)
- [ ] Fallbacks: gpt_oss_120b, nemotron_3_super
- [ ] Output saved to InsightAnalysisMap.json

### Stage S5: Angle Generation
- [ ] Routes to hy3_preview (primary)
- [ ] Fallbacks: hermes_3_405b, minimax_m25
- [ ] Output saved to 04-angles.md

### Stage S6: Beat Matching
- [ ] Routes to nemotron_3_super (primary)
- [ ] Fallbacks: gpt_oss_120b, hy3_preview
- [ ] Output saved to 05-beats.md

### Stage S7: Pitch Selection (HUMAN GATE)
- [ ] Routes to gpt_oss_120b (primary)
- [ ] Fallbacks: hy3_preview, nemotron_3_super
- [ ] Output saved to 07-selected-angle.md
- [ ] human-approval.json created with status: "waiting"
- [ ] Workflow PAUSES after completion
- [ ] S8 does NOT run automatically
- [ ] requiresHumanApproval: true verified

### Stage S8: Journalist Collection (BLOCKED BEFORE APPROVAL)
- [ ] Routes to nemotron_3_super (primary)
- [ ] Fallbacks: hy3_preview, lfm_25_12b
- [ ] Cannot run before S7 approval
- [ ] Resume API works after approval
- [ ] Output saved to 06-journalist-intel.md (CSV)

### Stage S9: Journalist Intelligence
- [ ] Routes to nemotron_3_super (primary)
- [ ] Fallbacks: gpt_oss_120b, hy3_preview

### Stage S10: Pitch Drafting
- [ ] Routes to minimax_m25 (primary)
- [ ] Fallbacks: hermes_3_405b, hy3_preview
- [ ] Markdown validation works (subject, hook, body, CTA)

### Stage S11: Pitch Optimization
- [ ] Routes to hermes_3_405b (primary)
- [ ] Fallbacks: minimax_m25, gpt_oss_120b

### Stage S12: Package Assembly
- [ ] Routes to minimax_m25 (primary)
- [ ] Fallbacks: hy3_preview, lfm_25_12b

### Stage S13: Validation (CONTROLS READINESS)
- [ ] Routes to gpt_oss_120b (primary)
- [ ] Fallbacks: nemotron_3_super, hy3_preview
- [ ] Strict validation enabled
- [ ] If fails: dashboard shows "needs_revision"
- [ ] If fails: ready_to_send is BLOCKED
- [ ] If passes: dashboard can show ready_to_send
- [ ] JSON schema validation works
- [ ] Claim checking works
- [ ] Contradiction detection works

### Stage S14: Final Formatting
- [ ] Routes to minimax_m25 (primary)
- [ ] Fallbacks: lfm_25_12b, hy3_preview

### Stage S15: Outreach Asset Creation
- [ ] Routes to minimax_m25 (primary)
- [ ] Riverflow V2 used ONLY for visual generation
- [ ] Text uses minimax_m25, not riverflow

### Stage S16: Campaign Log
- [ ] Routes to hy3_preview (primary)
- [ ] Fallbacks: gpt_oss_120b, lfm_25_12b

---

## Dashboard

### Campaign Overview
- [ ] Campaign name displays
- [ ] Current stage shows
- [ ] Status indicator works

### Stage Timeline
- [ ] 16 stages displayed
- [ ] Progress highlights current
- [ ] Click stage shows details

### Model Usage Panel
- [ ] Shows model per stage
- [ ] Shows primary vs fallback
- [ ] Updates after each run

### Fallback Events Panel
- [ ] Lists fallback occurrences
- [ ] Shows primary that failed
- [ ] Shows fallback that succeeded

### Validation Panel
- [ ] Shows S13 results
- [ ] Shows pass/fail status
- [ ] Shows error details

### Human Gate Panel
- [ ] Shows waiting status
- [ ] Shows approved status
- [ ] Approve button works
- [ ] Shows selected angle

### Output Files Panel
- [ ] Lists all stage outputs
- [ ] Links to actual files

### Recommended Next Action
- [ ] Shows appropriate action
- [ ] Based on current stage

### Pitch Preview
- [ ] Shows pitch content
- [ ] Readability indicator works

### Search Campaign Files
- [ ] Search returns results
- [ ] Shows matching content

### Error Center
- [ ] Lists all errors
- [ ] Shows error details
- [ ] Retry options work

### Campaign Learning Panel
- [ ] Shows insights from S16
- [ ] Displays campaign metrics

---

## Model Restrictions

### Riverflow V2
- [ ] Only used for visual_generation
- [ ] Rejects text_reasoning
- [ ] Rejects research tasks
- [ ] Rejects validation tasks
- [ ] Visual generation works

### Nemotron 3 Nano Omni
- [ ] Only used for multimodal input
- [ ] Requires inputType specification
- [ ] Rejects text-only tasks
- [ ] Image extraction works

### LFM 2.5-1.2B
- [ ] Only used for fast_cleanup, classification, formatting
- [ ] Rejects validation tasks
- [ ] Rejects serious data extraction
- [ ] Workflow status summary works

### Big Pickle
- [ ] excluded from production workflow
- [ ] enabledInProductionWorkflow: false
- [ ] Cannot be routed to in production
- [ ] Only for experimental_debugging

---

## Logs

### audit-log.json
- [ ] Written after each stage
- [ ] Contains timestamp
- [ ] Contains stageId
- [ ] Contains modelUsed
- [ ] Contains status

### errors.json
- [ ] Written on failures
- [ ] Contains error details
- [ ] Contains stage context

### Fallback Events Logged
- [ ] Primary failure reason captured
- [ ] Fallback used logged
- [ ] Retry count logged

### Validation Failures Logged
- [ ] Validation errors captured
- [ ] Error details saved

### Human Approval Logged
- [ ] Approval status change logged
- [ ] Selected angle logged
- [ ] Timestamp captured

### Resume Logged
- [ ] Resume event logged
- [ ] Target stage logged

---

## Final Readiness

### S13 Fails
- [ ] Dashboard does NOT show ready_to_send
- [ ] Final production is BLOCKED
- [ ] Status shows needs_revision

### S13 Passes
- [ ] Dashboard CAN show ready_to_send
- [ ] Production is allowed
- [ ] Status shows ready

---

## Model Configuration Verification

### All Stages Have Primary
- [ ] Every stage has primary model defined

### All Stages Have Fallbacks
- [ ] Every stage has at least 1 fallback
- [ ] Fallback order is correct

### Dashboard Features Routed
- [ ] All features have primary model
- [ ] Fallbacks configured where appropriate

### Model Restrictions Enforced
- [ ] Riverflow blocked for non-visual
- [ ] Nano Omni requires inputType
- [ ] LFM limited to utility
- [ ] Big Pickle excluded

---

## Test Results

### Model Routing Tests
- [ ] S1 routes correctly
- [ ] S2 routes correctly
- [ ] S5 routes correctly
- [ ] S7 routes correctly and pauses
- [ ] S10 routes correctly
- [ ] S11 routes correctly
- [ ] S13 routes correctly
- [ ] S15 routes correctly

### Dashboard Routing Tests
- [ ] workflow_status_summary routes to lfm_25_12b
- [ ] stage_failure_explanation routes to gpt_oss_120b
- [ ] fallback_event_analysis routes to gpt_oss_120b
- [ ] campaign_progress_overview routes to hy3_preview
- [ ] recommended_next_action routes to hy3_preview
- [ ] audit_log_analysis routes to gpt_oss_120b
- [ ] output_quality_score routes to gpt_oss_120b
- [ ] pitch_readability_preview routes to hermes_3_405b
- [ ] dashboard_copy_labels routes to minimax_m25
- [ ] search_across_campaign_files routes to nemotron_3_super
- [ ] chart_image_interpretation routes to nemotron_3_nano_omni
- [ ] dashboard_visual_asset_generation routes to riverflow_v2

### Fallback Tests
- [ ] Primary tried first
- [ ] Fallback used on failure
- [ ] Fallback event logged

### Human Gate Tests
- [ ] S7 pauses workflow
- [ ] Approval creates file
- [ ] Resume works after approval
- [ ] S8 blocked before approval

### Model Restriction Tests
- [ ] Riverflow rejects text tasks
- [ ] Nano Omni rejects non-multimodal
- [ ] LFM rejects validation
- [ ] Big Pickle excluded

---

## API Endpoints

### GET /api/campaigns
- [ ] Returns campaign list

### GET /api/campaigns/{id}/status
- [ ] Returns campaign status
- [ ] Returns stage progress
- [ ] Returns model usage

### GET /api/campaigns/{id}/human-approval
- [ ] Returns approval state
- [ ] Shows selected angle

### POST /api/campaigns/{id}/human-approval
- [ ] Approves angle
- [ ] Updates status to "approved"

### POST /api/campaigns/{id}/resume
- [ ] Resumes from S8
- [ ] Requires approval first

### POST /api/dashboard/ai
- [ ] Routes to correct model
- [ ] Returns result
- [ ] Logs event

---

## Documentation

### model-routing-guide.md
- [ ] Overview section
- [ ] Model role table
- [ ] Stage routing table
- [ ] Dashboard routing table
- [ ] Fallback explanation
- [ ] Validation explanation
- [ ] Human gate explanation
- [ ] Resume explanation
- [ ] How to update model IDs
- [ ] How to add models/stages
- [ ] Troubleshooting section

### dashboard-ai-guide.md
- [ ] Panel descriptions
- [ ] Feature list with models
- [ ] How recommended action works
- [ ] How fallback analysis works
- [ ] Human approval workflow
- [ ] Troubleshooting

### operator-runbook.md
- [ ] Start campaign steps
- [ ] S7 review steps
- [ ] Approve angle steps
- [ ] Resume steps
- [ ] Review pitch steps
- [ ] Validation handling
- [ ] Fix instructions
- [ ] Log reading
- [ ] Error handling

---

## Final Acceptance

All boxes must be checked before project is complete:

- [ ] Central model routing config exists
- [ ] ModelRouter exists
- [ ] Campaign stages use ModelRouter
- [ ] Dashboard AI uses ModelRouter
- [ ] Every stage has primary and fallback models
- [ ] Dashboard features have correct model routing
- [ ] Invalid outputs trigger retry or fallback
- [ ] S7 pauses for human approval
- [ ] S8 cannot run before approval
- [ ] Workflow can resume from S8 after approval
- [ ] Stage outputs are saved correctly
- [ ] JSON, Markdown, and CSV validation work
- [ ] S13 controls final readiness
- [ ] Dashboard shows stage timeline
- [ ] Dashboard shows model usage
- [ ] Dashboard shows fallback events
- [ ] Dashboard shows validation warnings
- [ ] Restricted model usage is enforced
- [ ] Tests pass
- [ ] Documentation exists
- [ ] Dry-run mode works
- [ ] No secrets are exposed
- [ ] Model IDs marked as placeholders where needed
- [ ] Big Pickle NOT part of production workflow