# Beat Matching

## Stage Contract
- Required Input: `04-angles.md`.
- Optional Input: target outlet list, geography, user outreach preference, excluded beats, Muck Rack availability.
- Output: prioritized angle-to-beat mapping, top 10 outreach angles, secondary backlog, and selected outreach angle gate.
- Handoff: after user confirms at least one angle, send the active selected angle package to selected-angle journalist collection.
- Validation: Stage 06 is blocked unless `Selection status: confirmed` is recorded with angle, beat, geography, and collection lane.
- Selected Angle Status: pending or confirmed only.
- Source Rule: beat rationale must follow the evidence and angle, not generic journalist categories.

| Angle | Beat Type | Outlet Type | Journalist Profile | Personalization Note | Fit Score |
|-------|-----------|-------------|--------------------|----------------------|-----------|
|  |  |  |  |  |  |

## Beat Coverage Summary
- 

## Collection Lane Decision
- Lane:
- Rationale:

## Outreach Angle Review Gate
- Status: awaiting user selection
- Purpose: review all available outreach angles, compare their journalist beats, choose one or more preferred angles, and prevent Stage 06 from searching every beat at once.
- Stage 06 must not begin until at least one angle is confirmed by the user and one active selected angle package is clear.

## Top 10 Recommended Outreach Angles

| Priority | Angle / Pitch Angle | Journalist Beat | Category | Brief Description | Unique Value | Why This Beat Fits | Score /50 | Recommended Lane | Caution |
|----------|---------------------|-----------------|----------|-------------------|--------------|--------------------|-----------|------------------|---------|
| 1 |  |  |  |  |  |  |  |  |  |
| 2 |  |  |  |  |  |  |  |  |  |
| 3 |  |  |  |  |  |  |  |  |  |
| 4 |  |  |  |  |  |  |  |  |  |
| 5 |  |  |  |  |  |  |  |  |  |
| 6 |  |  |  |  |  |  |  |  |  |
| 7 |  |  |  |  |  |  |  |  |  |
| 8 |  |  |  |  |  |  |  |  |  |
| 9 |  |  |  |  |  |  |  |  |  |
| 10 |  |  |  |  |  |  |  |  |  |

## Priority Scoring Notes
- Timeliness:
- Impact:
- Audience relevance:
- Evidence strength:
- Beat fit:
- Outlet fit:
- Differentiation:
- SERP potential:
- Outreach efficiency:
- Risk control:

## Recommended First Angle
- Priority number:
- Angle / pitch angle:
- Journalist beat:
- Why this should be first:
- Why it is safe to search first:

## Secondary Angle Backlog

| Angle / Pitch Angle | Journalist Beat | Category | Why Secondary | Later Trigger | Recommended Future Lane |
|---------------------|-----------------|----------|---------------|---------------|-------------------------|
|  |  |  |  |  |  |

## User-Facing Gate Summary
- Stage 05 is complete. Stop here for user angle selection.
- Recommended first angle:
- User may choose one or more angles by priority number, angle name, or pitch-angle text.
- After selection, Stage 06 searches SERP, Muck Rack, outlets, and contacts only for the active selected angle package unless the user explicitly requests batch multi-angle execution.
- Secondary angles stay preserved for later outreach.

## Awaiting User Selection
- Required decision: user must choose at least one angle before journalist search starts.
- Accepted selection format: angle priority number, angle name, or exact pitch-angle text.
- Stage 06 scope after selection: search SERP, Muck Rack, media outlets, and contacts only for the active selected angle package.
- Do not proceed on ambiguous commands such as `go`, `continue`, or `start searching` unless the selected angle is already recorded below.

## Selected Outreach Angle
- Selection status: pending
- Selected priority number:
- Selected angle / pitch angle:
- Selected category:
- Selected journalist beat:
- Selected outlet scale:
- Selected geography:
- Selected collection lane:
- Evidence support to carry forward:
- Search start point:
- Selection note:

## Gate Field Contract
- `Selection status` must be exactly `pending` before user approval.
- Change `Selection status` to exactly `confirmed` only after the user chooses at least one angle.
- Automation reads `Selected angle / pitch angle` and `Selected journalist beat`; both must be filled before Stage 06 or Stage 08 scripts run.
- Do not use synonyms such as `approved`, `ready`, `chosen`, or `selected` in the status field.
- If the user changes the selected angle later, return `Selection status` to `pending`, update the selected fields, then mark it `confirmed` again after the user approves the replacement.

## Muck Rack / SERP Search Guidance
- Core terms:
- Beat terms:
- Geography terms:
- Boolean query concepts:
- SERP search phrases:
- Outlet filters:
- Recency expectations:

## Weak Fits To Avoid
- 

## Handoff Notes For Journalist Intelligence
- Start with:
- Prioritize:
- Avoid:

## Quality Assurance Check
- Beat Fit: pass/fail - 
- Outlet Fit: pass/fail - 
- Journalist Profile Specificity: pass/fail - 
- Personalization Readiness: pass/fail - 
- Fit Score Discipline: pass/fail - 
- Collection Lane Clarity: pass/fail - 
- Outreach Gate Complete: pass/fail - 
- Top 10 Prioritization: pass/fail - 
- Priority Scoring Applied: pass/fail - 
- Recommended First Angle: pass/fail - 
- User-Facing Gate Summary: pass/fail - 
- Selected Angle Status: pass/fail - 
- Search Guidance Readiness: pass/fail - 
## Anti-Hallucination And Assumption Control
Never invent journalist names, journalist emails, article titles, publication history, source names, statistics, rankings, survey results, methodology details, quotes, SERP findings, or Muck Rack results.

If required information is missing, unverifiable, blocked by access, or not present in the validated inputs, write exactly:

`Information unavailable. Verification required before use.`

Clearly label beat-level assumptions as assumptions. Do not present SERP opportunity, likely search demand, or possible Muck Rack discovery as verified results unless captured evidence exists in the job folder.
