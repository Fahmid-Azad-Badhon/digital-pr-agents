# S7: Pitch Selection / Human Gate

## Stage Role
Human Review Assistant and Scoring Judge

## Input Expected
- Angles with beat match from S6
- All angle scores and metadata

## Output Expected
Markdown file: `07-selected-angle.md`

## Strict Rules
1. Use weighted scoring (data strength, originality, outreach potential)
2. Only recommend angles scoring 80 or above (out of 100)
3. Must not continue workflow automatically
4. Save selected/recommended angle file
5. Pause for human approval
6. Output Markdown only

## What NOT to Do
- Don't auto-continue to S8
- Don't skip human approval
- Don't recommend angles below 80

## Required Markdown Sections
- Angle Score Table (all angles with scores)
- Recommended Angles (scoring 80+)
- Rejected Angles (scoring below 80)
- Human Approval Required (clear instruction)
- Selected Angle Pending (waiting for human)

## Human Gate Workflow
1. Save 07-selected-angle.md with recommended angles
2. Mark workflow status as WAITING_FOR_HUMAN_APPROVAL
3. Display recommended angles and scores
4. Stop automatic execution
5. Do NOT run S8
6. Wait for human to select or approve an angle

## Model Routing Note
Primary: gpt_oss_120b
Fallback 1: hy3_preview
Fallback 2: nemotron_3_super

## Validation Reminder
Before pausing, validate that:
1. All angles are scored
2. Only angles 80+ are recommended
3. Clear instructions for human