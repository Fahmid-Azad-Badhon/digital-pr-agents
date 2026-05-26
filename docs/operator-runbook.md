# Operator Runbook

## Starting a New Campaign

### Step 1: Create Campaign
```bash
# Via dashboard UI or API
POST /api/campaigns
{ "name": "your-campaign-slug", "brief": "..." }
```

### Step 2: Add Brief
- Place campaign brief in `pitch-jobs/{slug}/00-brief.md`
- Or use dashboard upload

### Step 3: Start Workflow
```bash
# Via API
POST /api/campaigns/{slug}/continue
{ "stageId": "S1_CAMPAIGN_INTAKE" }
```

Or use Dashboard "Start Campaign" button.

---

## Running Workflow Until S7

### Automated Flow
The workflow runs through stages S1-S6 automatically:

1. **S1** - Campaign Intake (hy3_preview)
2. **S2** - Data Extraction (nemotron_3_super)
3. **S3** - Research Enrichment (nemotron_3_super)
4. **S4A** - Data Analyst (gpt_oss_120b)
5. **S4B** - Insight Analyst (hy3_preview)
6. **S5** - Angle Generation (hy3_preview)
7. **S6** - Beat Matching (nemotron_3_super)
8. **S7** - **PAUSES HERE** for human approval

### Monitoring Progress
- Check dashboard stage timeline
- View output files after each stage
- Monitor model usage panel

### If a Stage Fails
1. Check error message in dashboard
2. Review audit logs
3. Try re-running stage
4. If persistent failure, check model availability

---

## Reviewing Selected Angles

### View Generated Angles
When S7 completes:
- Dashboard shows "Review Required" badge
- Navigate to Human Gate panel
- View all generated angles in `07-selected-angle.md`

### Angle Selection Criteria
Consider:
- **Data-backed** - Has statistics/research
- **Newsworthy** - Timely, relevant
- **Angle fit** - Matches target media
- **Product mention** - Natural integration

### Select an Angle
1. Click on preferred angle in dashboard
2. Review selection rationale
3. Click "Approve Selected Angle"

---

## Approving Angle

### Dashboard Approval
1. Go to Human Gate panel
2. Select angle
3. Click "Approve"
4. Confirm selection

### API Approval
```bash
POST /api/campaigns/{slug}/human-approval
{
  "action": "approve",
  "selectedAngleTitle": "...",
  "selectedAngleId": "..."
}
```

This updates `human-approval.json` with:
```json
{
  "status": "approved",
  "selectedAngleTitle": "...",
  "approvedAt": "2026-05-09T..."
}
```

---

## Resuming from S8

### After Approval
Once S7 is approved, S8 becomes available:

### Dashboard Resume
1. Click "Resume Workflow" button
2. Select target stage (S8_JOURNALIST_COLLECTION)
3. Confirm

### API Resume
```bash
POST /api/campaigns/{slug}/resume
{ "targetStage": "S8_JOURNALIST_COLLECTION" }
```

The workflow continues:
- S8 - Journalist Collection
- S9 - Journalist Intelligence
- S10 - Pitch Drafting
- S11 - Pitch Optimization
- S12 - Package Assembly
- S13 - Validation (**IMPORTANT**)
- S14 - Final Formatting
- S15 - Asset Creation
- S16 - Campaign Log

---

## Reviewing Final Pitch

### After S11
- View `09-optimized-email.md`
- Check readability
- Verify all sections present

### S12 Package
- View `10-google-doc.md`
- Check formatting
- Verify all assets included

---

## Running Validation

### S13 Validation
Runs automatically after S12.

**Checks performed:**
1. JSON structure valid
2. Required fields present
3. Claims match sources
4. No contradictions
5. Readable and clear

### Interpretation
- **Pass** → "Ready to Send" enabled
- **Fail** → "Needs Revision" shown

---

## Fixing Validation Issues

### If S13 Fails

1. **Review Errors**
   - Check validation panel in dashboard
   - Read error messages

2. **Common Issues**
   - Missing sections in pitch
   - Unverified claims
   - Contradictions
   - Format errors

3. **Fix Options**
   - Re-run S10-S11 with corrections
   - Manually edit output files
   - Re-run specific stage

4. **Re-validate**
   ```bash
   POST /api/campaigns/{slug}/continue
   { "stageId": "S13_VALIDATION" }
   ```

---

## Finalizing Production

### When Ready
After S13 passes:
1. "Ready to Send" status shown
2. Export package
3. Send to journalists

### Verification Checklist
- [ ] All stages complete
- [ ] S13 validation passed
- [ ] Pitch reviewed
- [ ] Journalist list ready
- [ ] Assets prepared

---

## Checking Dashboard

### Campaign Overview
- Campaign name, status, dates
- Current stage
- Overall health score

### Stage Timeline
- Visual progress
- Click stage for details

### Model Usage Panel
- Which model used per stage
- Any fallbacks used

### Fallback Events Panel
- When fallbacks triggered
- Why (error type)

### Validation Panel
- S13 results
- Any warnings

### Error Center
- All errors across workflow
- Retry options

---

## Reading Audit Logs

### Via Dashboard
- Go to Campaign Details
- View Audit Log section

### Via API
```bash
GET /api/campaigns/{slug}/status
```

### Via File
```bash
# Check audit-log.json
Get-Content pitch-jobs\{slug}\audit-log.json
```

### Log Fields
- `timestamp` - When event occurred
- `stageId` - Which stage
- `modelUsed` - Which model
- `status` - success/failed/fallback
- `fallbackUsed` - true/false

---

## Handling Failed Stages

### Common Failures

1. **Timeout**
   - Model took too long
   - Solution: Re-run, check model status

2. **Rate Limit**
   - Too many requests
   - Solution: Wait, then retry

3. **Invalid Output**
   - Output failed validation
   - Solution: Check output, re-run

4. **Model Unavailable**
   - Model API down
   - Solution: Automatic fallback should handle

### Recovery Steps
1. Check error message
2. Review logs
3. Try re-running
4. Check fallback usage
5. If persistent, manual intervention

---

## Handling Model Fallback

### What Happens
If primary model fails:
1. Router logs failure
2. Retry attempts (configurable)
3. Fallback model used
4. Fallback event logged

### Should You Worry?
- **Normal** - Fallbacks happen regularly
- **Concerning** - Multiple fallbacks in one stage
- **Action** - Check model status if persistent

---

## Handling Invalid JSON

### Symptoms
- S2, S3, S4A, S9 outputs won't parse
- Validation shows JSON error

### Causes
- Model output malformed
- Truncation mid-output
- Schema mismatch

### Solutions
1. Retry stage
2. Check model output directly
3. Fix manually (if minor)
4. Try different model/fallback

---

## Handling Missing Output Files

### Symptoms
- Dashboard shows "No output"
- File not in campaign folder

### Causes
- Stage didn't complete
- Save failed
- Wrong path

### Solutions
1. Check stage completed
2. Verify save path
3. Re-run stage
4. Check file permissions

---

## Emergency Procedures

### Complete Failure
If entire campaign stuck:
1. Check dashboard status
2. Review all logs
3. Try individual stage re-run
4. Check API endpoints
5. Restart dashboard server

### Data Loss
If output files corrupted:
1. Check backup
2. Re-run from last good stage
3. Manual recovery if needed

### API Issues
If dashboard API failing:
1. Check server running
2. Review server logs
3. Restart if needed
4. Check network