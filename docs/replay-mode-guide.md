# Replay Mode Guide

## Overview

Replay Mode enables safe rerunning of campaign stages in the Digital PR workflow. It supports experimentation, debugging, and quality improvement while preserving campaign history and ensuring no silent overwrites occur.

## Core Principles

- **Never overwrite silently** - All old outputs are archived before new ones are written
- **Always create snapshots** - Input state is captured before any replay
- **Track everything** - Run IDs, prompt versions, brain versions, model used
- **Never bypass gates** - S7 human approval and S13 validation remain enforced
- **Mark stale artifacts** - Downstream outputs are marked when upstream changes

## Replay Types

| Type | Description |
|------|-------------|
| `stage_only` | Rerun only one specific stage |
| `stage_and_downstream` | Rerun selected stage and all downstream stages |
| `validation_only` | Rerun S13 validation only |
| `evaluation_only` | Rerun the Evaluation Layer only |
| `prompt_test` | Rerun with a new prompt version |
| `model_test` | Rerun with a different model override |
| `dry_run` | Simulate replay without model calls |
| `comparison_only` | Compare two previous runs |

## System Files

### replay-config.json
- Replay type definitions
- Run ID format
- Safety feature flags
- Dashboard configuration

### replay-rules.json
- Pre-replay checks
- Human approval rules
- Claim ledger rules
- Restore rules
- Prohibited actions

### replay-stage-dependencies.json
- Stage dependency map
- Stale artifact triggers
- Human approval invalidation rules

## Run ID Format

```
{campaignSlug}-{stageId}-{YYYYMMDD-HHMMSS}-run{runNumber}
```

Example: `bike-month-alcohol-S10-20260509-153000-run002`

## API Endpoints

### GET /api/campaigns/{slug}/replay
Get replay status, history, and stale artifacts.

### POST /api/campaigns/{slug}/replay
Execute a replay operation.

```json
{
  "stageId": "S10_PITCH_DRAFTING",
  "replayType": "stage_only",
  "rerunReason": "Improve pitch clarity",
  "triggeredBy": "dashboard"
}
```

### POST /api/campaigns/{slug}/replay?action=restore
Restore an archived output.

```json
{
  "stageId": "S10_PITCH_DRAFTING",
  "runIdToRestore": "bike-month-alcohol-S10-20260508-100000-run001",
  "restoreReason": "New version has quality issues"
}
```

### POST /api/campaigns/{slug}/replay?action=compare
Compare two runs.

```json
{
  "oldRunId": "...",
  "newRunId": "...",
  "stageId": "S10_PITCH_DRAFTING"
}
```

### POST /api/campaigns/{slug}/replay?action=dry_run
Run a dry-run simulation.

```json
{
  "stageId": "S10_PITCH_DRAFTING",
  "replayType": "stage_and_downstream",
  "rerunReason": "Testing downstream impact"
}
```

## Campaign Files Created

| File | Description |
|------|-------------|
| `replay-history.json` | All replay runs, comparisons, and restores |
| `stale-artifacts.json` | Files marked as stale due to replay |
| `snapshots/{runId}/` | Input snapshots before each replay |
| `archive/{stageId}/{runId}/` | Archived outputs before overwrite |
| `replay-reports/` | Detailed replay reports |
| `dry-run-replay-report.json` | Dry-run simulation results |

## S7 Human Approval Staleness

When these stages are replayed, S7 approval becomes stale:
- S5_ANGLE_GENERATION
- S6_BEAT_MATCHING

The human-approval.json is updated to:
```json
{
  "status": "needs_revision",
  "reason": "Upstream stage S5 was replayed. Human selection must be reviewed again."
}
```

## Stale Artifact Triggers

| Stage Replayed | Files Marked Stale |
|----------------|-------------------|
| S10 | 11-optimized-pitch.md, 12-outreach-package.json, 13-validation-report.json, final-readiness.json |
| S11 | 12-outreach-package.json, 13-validation-report.json, final-readiness.json |
| S12 | 13-validation-report.json, final-readiness.json |
| S13 | final-readiness.json |
| S2/S3/S4A | claim-ledger.json, 05-angles.md, 10-pitch-draft.md, etc. |

## Testing Replay

### Test 1: Stage-only replay
```bash
curl -X POST "http://localhost:3000/api/campaigns/test-campaign/replay" \
  -H "Content-Type: application/json" \
  -d '{"stageId":"S10_PITCH_DRAFTING","replayType":"stage_only","rerunReason":"Test","triggeredBy":"test"}'
```

### Test 2: Dry-run
```bash
curl -X POST "http://localhost:3000/api/campaigns/test-campaign/replay?action=dry_run" \
  -H "Content-Type: application/json" \
  -d '{"stageId":"S5_ANGLE_GENERATION","replayType":"stage_and_downstream","rerunReason":"Check impact","triggeredBy":"test"}'
```

### Test 3: Pre-replay checks
```bash
curl "http://localhost:3000/api/campaigns/test-campaign/replay?action=status"
```

## Safety Rules

1. **Never bypass S7** - Replay cannot skip human approval
2. **Never bypass S13** - Validation must run when S13 is replayed
3. **Never fake progress** - No artificial completion marking
4. **Never mark ready_to_send** - Only S13 validation can set this
5. **Never silently overwrite** - Archive always created first

## Common Failure Cases

| Issue | Cause | Solution |
|-------|-------|----------|
| Missing required inputs | Stage inputs not present | Complete required stages first |
| Archive not found | Wrong run ID or never archived | Verify run ID exists in archive |
| S7 approval not updating | Stage not in invalidation list | Check replay-stage-dependencies.json |
| Snapshot missing | Snapshot creation failed | Check filesystem permissions |

## Dashboard Integration

The dashboard should display:
- Replay history (last 10 runs)
- Stale artifacts count
- Pending approval status
- Buttons for: Replay Stage, Compare, Restore

## Next Steps

- Add prompt-test-results.json for prompt version testing
- Add model-test-results.json for model comparison
- Integrate with evaluation layer for quality scoring
- Add visualization for score deltas