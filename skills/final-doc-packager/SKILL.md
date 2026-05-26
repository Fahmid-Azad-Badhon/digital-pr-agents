---
name: final-doc-packager
description: Use after Stage 09 optimization is complete and approved to package a Digital PR campaign into a complete Google-Doc-ready final outreach package. Produces 10-google-doc.md with the final 500-600 word journalist email, analytical table, selected angle, journalist target, evidence, personalization, pitch-angle alignment proof, psychological trigger review, claims to avoid, assets, caveats, validation status, and export-ready handoff. Use when the workflow needs a polished final package without sending emails.
---

# Final Doc Packager

## Mission

The final-doc-packager owns Stage 10 of the Digital PR workflow.

Its job is to turn the completed campaign artifacts into one clean, complete, Google-Doc-ready final package in:

```text
10-google-doc.md
```

This is the final reviewable deliverable before Google Docs export or human approval.

The final package must let the user, client, editor, or outreach operator understand:

- what the campaign is about
- which pitch angle was selected
- which journalist beat and target are being used
- what final email should be sent
- why the email is newsworthy
- what data supports the pitch
- what analytical table appears inside the email body
- why the email aligns with the selected pitch angle
- what psychological triggers were used ethically
- what claims must be avoided
- what assets are available for outreach
- what caveats must be preserved
- whether the package is ready for Google Docs export

Do not send emails. Do not schedule emails. Do not start a new angle. Do not search for more journalists. Stage 10 packages the approved selected-angle outreach set only.

## Stage Position

Stage 10 comes after:

1. `00-brief.md`
2. `01-study-notes.md`
3. `02-insights.md`
4. `03-research.md`
5. `04-angles.md`
6. `05-beats.md`
7. `06-journalist-intel.md`
8. `07-journalist-coverage.md`
9. `08-pitch-draft.md`
10. `09-optimized-email.md`

Stage 10 produces:

```text
10-google-doc.md
```

Optional export step after `10-google-doc.md` exists:

```powershell
.\scripts\export-google-doc.cmd <job-name> ["Optional Google Doc Title"]
```

The export script converts Markdown to plain text and creates a Google Doc. Therefore `10-google-doc.md` must be readable, structured, and useful even when Markdown styling becomes plain text in Google Docs.

## Core Rule

Stage 10 packages. It does not reinvent.

Do not rewrite the selected strategy. Do not change the selected angle. Do not change the beat. Do not change the target journalist unless Stage 09 or Stage 06 is wrong and the workflow is explicitly sent back for repair.

Allowed Stage 10 work:

- organize the final package
- copy the final optimized email exactly or with formatting-only cleanup
- preserve the analytical table inside the email body
- summarize evidence accurately
- document caveats and claims to avoid
- confirm readiness
- prepare Google-Doc-friendly formatting
- run validation

Forbidden Stage 10 work:

- changing the pitch angle
- changing the journalist beat
- changing the email thesis
- removing the analytical table from the email body
- shortening or lengthening the final email outside 500-600 words
- adding unsupported claims
- inventing personalization
- inventing email addresses
- promising assets that do not exist
- saying outreach has happened
- creating urgency not supported by evidence
- starting another angle automatically

If Stage 10 reveals a strategic flaw, stop and route the fix backward. Do not hide the flaw inside packaging.

## Required Inputs

Read these files before packaging:

```text
00-brief.md
04-angles.md
05-beats.md
06-journalist-intel.md
07-journalist-coverage.md
08-pitch-draft.md
09-optimized-email.md
```

Read these when available:

```text
01-study-notes.md
02-insights.md
03-research.md
draft-variants/*.md
source-files/
google-doc-link.txt
google-doc-metadata.json
```

Do not package from memory. Read the current files on disk.

## Hard Prerequisites

Before writing `10-google-doc.md`, verify:

- `09-optimized-email.md` exists.
- `09-optimized-email.md` is not placeholder content.
- `09-optimized-email.md` contains `Ready for final packaging: yes`.
- The final email body in Stage 09 is 500-600 words.
- The final email body contains the analytical table.
- Stage 09 has a complete `Pitch Angle Alignment Review`.
- Stage 09 has a complete `Ethical Psychological Trigger Review`.
- Stage 09 has a complete `Inbox Quality Review`.
- Stage 09 has `Claims To Avoid`.
- Stage 09 has `Stage 10 Handoff`.
- The selected angle in Stage 09 matches Stage 05.
- The selected beat in Stage 09 matches Stage 05.
- The target journalist or target type matches Stage 06 and Stage 07.
- The final email does not contain unresolved placeholders.
- The final email does not claim outreach has already happened.

If any prerequisite fails, do not write a final package. Repair the upstream stage first.

## Stage 10 Output Contract

`10-google-doc.md` must contain these sections in this order:

1. `# Final Digital PR Outreach Package`
2. `## Package Status`
3. `## Campaign Snapshot`
4. `## Selected Outreach Angle`
5. `## Target Journalist / Target Type`
6. `## Final Subject Line Recommendation`
7. `## Final Subject Line Options`
8. `## Final Email`
9. `## Analytical Table Confirmation`
10. `## Evidence And Source Notes`
11. `## Newsworthiness Proof`
12. `## Pitch Angle Alignment Proof`
13. `## Personalization Basis`
14. `## Ethical Psychological Trigger Review`
15. `## Claims To Avoid`
16. `## Assets Available For Outreach`
17. `## Methodology And Caveats`
18. `## Outreach Readiness Checklist`
19. `## Google Docs Export Handoff`
20. `## Final QA Decision`

Do not omit sections. If a field is unavailable, write `Data unavailable - reason: ...` rather than guessing.

## Section Instructions

### Package Status

State the package condition.

Required fields:

- `Stage 10 status: ready / blocked`
- `Source optimized email: 09-optimized-email.md`
- `Selected angle preserved: yes / no`
- `Final email body length: [word count]`
- `Analytical table present in final email: yes / no`
- `Ready for Google Docs export: yes / no`
- `Blocked reason: [only if blocked]`

Use `ready` only when every required check passes.

### Campaign Snapshot

Summarize the campaign in plain English.

Include:

- client or brand
- campaign goal
- audience
- geography
- study or dataset type
- primary public-interest issue
- strongest available evidence
- final outreach objective

Keep this section factual. Do not write marketing copy.

### Selected Outreach Angle

Copy the selected angle details from Stage 05 and Stage 09.

Required fields:

- `Selected pitch angle:`
- `Category:`
- `Journalist beat:`
- `Outlet scale:`
- `Geography:`
- `Collection lane:`
- `Evidence support:`
- `Why this angle was selected:`

The selected pitch angle must match the exact Stage 05 selected angle. If it does not match, Stage 10 is blocked.

### Target Journalist / Target Type

Summarize the outreach target.

Required fields:

- `Name:`
- `Outlet:`
- `Beat:`
- `Email status:`
- `Contact route:`
- `Muck Rack profile or source URL:`
- `Personalization level:`
- `Target confidence:`

If there is no direct journalist email, keep the contact route honest. Do not invent email addresses.

Use one of these contact statuses:

- `available`
- `missing`
- `contact form`
- `editorial desk`
- `Muck Rack profile only`
- `data unavailable`

### Final Subject Line Recommendation

Copy the recommended subject from Stage 09.

Include:

- `Recommended subject line:`
- `Why this subject is strongest:`
- `Selected-angle alignment:`
- `Risk check:`

Subject line must be specific, calm, and tied to the selected angle. It must not use hype, fake urgency, or vague curiosity.

### Final Subject Line Options

Include all final subject options from Stage 09.

Requirements:

- include at least five options
- keep each option concise
- avoid all-caps
- avoid exclamation marks unless truly justified
- avoid vague wording like `new study`, `interesting insights`, or `thought this might interest you`
- make sure at least one subject line can work for the exact target journalist

### Final Email

This is the most important section of the final package.

Copy the final email from `09-optimized-email.md`.

Requirements:

- preserve the final email body exactly unless only minor formatting cleanup is needed
- preserve the greeting
- preserve the 500-600 word body
- preserve the analytical table inside the email body
- preserve the CTA
- preserve the signoff
- do not convert the analytical table into notes outside the email
- do not add commentary inside the final email
- do not add links unless Stage 09 already approved them
- do not remove caveat language if it protects accuracy

If the final email is under 500 words, over 600 words, or missing the analytical table, Stage 10 is blocked.

### Analytical Table Confirmation

Explain the table's role.

Required fields:

- `Table location: inside Final Email`
- `Rows: [count]`
- `Columns: [count]`
- `Main finding row:`
- `Comparison / context row:`
- `Audience value row:`
- `Evidence verified: yes / no`
- `Supports selected angle: yes / no`
- `Table risk: low / medium / high`

The table should help the journalist understand the story faster. If it is decorative, vague, or unsupported, return to Stage 09.

### Evidence And Source Notes

List the evidence that supports the final email.

Include:

- primary data point
- supporting data point
- source or dataset name
- methodology note
- date range or reporting period when available
- caveat for each major claim
- whether each claim is directly stated in source files or interpreted from them

Use this table:

```markdown
| Claim / Data Point | Source Stage | Evidence Type | Caveat | Safe To Use? |
|---|---|---|---|---|
| [claim] | [file] | direct / derived / contextual | [caveat] | yes/no |
```

Do not include any claim that cannot be tied to a source stage.

### Newsworthiness Proof

Show why the email is publishable.

Cover:

- timeliness
- impact
- proximity
- novelty or tension
- magnitude
- human or reader consequence
- utility
- authority
- realistic publication path

Use short, concrete explanations. Do not say `readers will care` without explaining why.

### Pitch Angle Alignment Proof

Prove the package did not drift.

Required checks:

- recommended subject line aligns with selected angle
- opening hook aligns with selected angle
- body thesis aligns with selected angle
- analytical table aligns with selected angle
- evidence aligns with selected angle
- CTA aligns with selected angle
- target journalist beat aligns with selected angle
- no secondary backlog angle entered the final email

If any item is weak, Stage 10 is blocked until Stage 09 is repaired.

### Personalization Basis

Document only verified or safe personalization.

Include:

- recent coverage hook if verified
- beat-fit reason
- outlet-fit reason
- geography-fit reason
- target-type fallback if no named journalist is safe
- over-personalization risk

Never invent:

- articles
- quotes
- reporter interests
- personal details
- email addresses
- direct relationships

If personalization is weak but target-type fit is still valid, say so clearly.

### Ethical Psychological Trigger Review

Explain the persuasion logic.

Allowed triggers:

- relevance
- specificity
- utility
- timeliness
- proximity
- novelty
- consequence
- credibility
- ease of use

Forbidden triggers:

- fake urgency
- false scarcity
- fear pressure
- forced flattery
- guilt
- manipulation
- exaggerated exclusivity
- invented authority

Document:

- triggers used
- why each trigger is evidence-backed
- manipulation risk
- final trigger safety decision

### Claims To Avoid

Copy and expand the claims-to-avoid list from Stage 09.

Include:

- unsupported superlatives
- causation claims
- recency claims not supported by source dates
- ranking claims not supported by ranking methodology
- geography claims beyond the data
- claims about journalist intent or audience reaction
- claims about exclusivity unless approved

This section protects the user during outreach and follow-up.

### Assets Available For Outreach

List what can actually be offered.

Possible assets:

- full dataset
- methodology
- local breakdown
- county breakdown
- state breakdown
- national comparison
- ranking table
- analytical table
- quote or comment
- expert availability
- map
- chart
- source notes
- caveat sheet

For each asset, state:

- available / unavailable / needs confirmation
- source file or owner
- how it helps the journalist
- whether it is safe to mention in the email

Do not promise unavailable assets.

### Methodology And Caveats

Make source limitations visible.

Include:

- source dataset
- data period
- sample, denominator, or scope if available
- calculation method if known
- limitations
- assumptions
- what the study can say
- what the study cannot say

This section does not need to be long, but it must be accurate.

### Outreach Readiness Checklist

Include this exact checklist and mark every item `pass`, `fail`, or `needs review`.

```markdown
| Check | Status | Notes |
|---|---|---|
| Selected angle preserved | pass/fail/needs review | |
| Selected beat preserved | pass/fail/needs review | |
| Target journalist or target type confirmed | pass/fail/needs review | |
| Final email body is 500-600 words | pass/fail/needs review | |
| Analytical table is inside email body | pass/fail/needs review | |
| Recommended subject line is selected | pass/fail/needs review | |
| Evidence is traceable | pass/fail/needs review | |
| Newsworthiness proof is complete | pass/fail/needs review | |
| Pitch angle alignment proof is complete | pass/fail/needs review | |
| Personalization is verified or safely generalized | pass/fail/needs review | |
| Claims to avoid are listed | pass/fail/needs review | |
| Assets are realistic | pass/fail/needs review | |
| Methodology caveats are preserved | pass/fail/needs review | |
| No outreach has been sent or implied | pass/fail/needs review | |
| Ready for Google Docs export | pass/fail/needs review | |
```

Any `fail` blocks Stage 10 completion. Any `needs review` must be explained.

### Google Docs Export Handoff

Tell the operator exactly what to do next.

Include:

- local file path: `pitch-jobs/<job-name>/10-google-doc.md`
- export command
- suggested Google Doc title
- expected output files after export
- `google-doc-link.txt`
- `google-doc-metadata.json`
- export readiness decision

Example:

```powershell
.\scripts\export-google-doc.cmd <job-name> "<Campaign Name> - Final Pitch Package"
```

Do not run the export unless the user asks, or unless the workflow step explicitly requires it.

### Final QA Decision

End the package with a clear decision:

- `Final package status: ready`
- `Final package status: blocked`
- `Final package status: needs human review`

Use `ready` only when:

- Stage 09 was ready for packaging
- Stage 10 has no missing sections
- final email is preserved
- analytical table is present
- selected angle is preserved
- evidence is traceable
- claims to avoid are documented
- export handoff is clear

## Packaging Workflow

Follow this sequence every time:

1. Read `09-optimized-email.md`.
2. Confirm `Ready for final packaging: yes`.
3. Extract Stage 09 status, selected angle, selected beat, target, subject lines, final email, evidence, personalization, newsworthiness proof, pitch angle alignment review, trigger review, inbox review, claims to avoid, and Stage 10 handoff.
4. Read `05-beats.md` and confirm the selected angle and beat match Stage 09.
5. Read `06-journalist-intel.md` and `07-journalist-coverage.md` to confirm the target and personalization basis.
6. Read `04-angles.md`, `02-insights.md`, and `03-research.md` as needed to verify evidence and caveats.
7. Build `10-google-doc.md` using the required section order.
8. Preserve the final email and analytical table.
9. Fill every required field.
10. Run the Stage 10 audit.
11. Run `validate-stage.cmd <job-name> 10-google-doc.md`.
12. Repair every failure.
13. Report the final package path and whether it is ready for export.

## Deterministic Audit

After writing `10-google-doc.md`, run:

```powershell
& 'C:\Users\fahmi\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' '.\skills\final-doc-packager\scripts\audit_final_package.py' '.\pitch-jobs\<job-name>'
```

Then run:

```powershell
.\scripts\validate-stage.cmd <job-name> 10-google-doc.md
```

Both checks must pass before Stage 10 is considered complete.

If either fails:

1. Read the exact failure.
2. Repair `10-google-doc.md` or the upstream stage named by the failure.
3. Rerun the audit.
4. Rerun `validate-stage`.
5. Repeat until both pass.

## Repair Routing

Route problems backward to the correct stage.

| Problem Found In Stage 10 | Repair Location |
|---|---|
| Final email is under 500 or over 600 words | `email-optimizer` / `09-optimized-email.md` |
| Analytical table missing from final email | `email-optimizer` / `09-optimized-email.md` |
| Selected angle mismatch | `05-beats.md`, then `09-optimized-email.md` |
| Journalist target mismatch | `06-journalist-intel.md` and `07-journalist-coverage.md` |
| Weak personalization | `07-journalist-coverage.md` or target-type fallback |
| Unsupported claim | `02-insights.md`, `03-research.md`, or `09-optimized-email.md` |
| Missing asset | `09-optimized-email.md` and assets list |
| Methodology caveat missing | `02-insights.md`, `03-research.md`, or `09-optimized-email.md` |
| Package formatting issue | `final-doc-packager` / `10-google-doc.md` |

Do not fix upstream factual problems by rewriting the final package around them.

## Quality Bar

A strong Stage 10 package is:

- complete
- calm
- source-grounded
- easy to review
- easy to export
- safe for outreach
- clear about what is ready and what is not
- faithful to the selected angle
- faithful to the optimized email
- transparent about caveats

A weak Stage 10 package:

- reads like scattered notes
- hides caveats
- changes the pitch angle
- buries the final email
- removes the analytical table
- omits the target journalist
- omits claims to avoid
- promises assets that do not exist
- says the campaign is ready when validation has not passed

## Completion Report

When finished, report:

```text
Stage 10 package complete.
File: pitch-jobs/<job-name>/10-google-doc.md
Audit: pass/fail
Validate-stage: pass/fail
Ready for Google Docs export: yes/no
Next command: .\scripts\export-google-doc.cmd <job-name> "<Title>"
```

Do not claim a Google Doc exists unless the export command was actually run and produced a link.

## Definition Of Done

Stage 10 is complete only when:

1. `10-google-doc.md` exists.
2. Every required Stage 10 section exists.
3. Stage 09 is marked ready for final packaging.
4. The final optimized email is included.
5. The final email body remains 500-600 words.
6. The analytical table remains inside the final email body.
7. The recommended subject line is included.
8. At least five subject line options are included.
9. The selected angle is preserved.
10. The selected beat is preserved.
11. The target journalist or target type is documented.
12. Evidence and source notes are traceable.
13. Newsworthiness proof is included.
14. Pitch angle alignment proof is included.
15. Personalization basis is documented.
16. Ethical psychological trigger review is documented.
17. Claims to avoid are listed.
18. Assets are realistic and not overpromised.
19. Methodology and caveats are preserved.
20. Outreach readiness checklist is complete.
21. Google Docs export handoff is complete.
22. Final QA decision is explicit.
23. `audit_final_package.py` passes.
24. `validate-stage.cmd <job-name> 10-google-doc.md` passes.
25. The workflow stops and waits for the user's next instruction.

## Operational Contract

- Name: final-doc-packager.
- Purpose: package the validated final email into a complete Google-Doc-ready delivery file without changing strategy or inventing claims.
- Required input: `09-optimized-email.md`, selected-angle context, journalist intelligence, source notes, and validation results.
- Optional input: Google Doc title, export preference, client notes, and additional caveats.
- Execution process: preserve Stage 09, organize final deliverable sections, include subject options, final email, source notes, claims to avoid, assets, caveats, outreach readiness checklist, and export handoff.
- Output: `10-google-doc.md`.
- Output format: client-ready final package with clean headings, copy-ready email, traceable evidence, and export instructions.
- Trigger condition: Stage 09 has passed optimization validation.
- Stop condition: final package audit and stage validator pass.
- Failure condition: missing final email, missing analytical table, angle drift, unsupported claim, missing caveats, broken format, or export handoff ambiguity.
- Validation rule: `audit_final_package.py` and `validate-stage.cmd <job-name> 10-google-doc.md` must pass.
- Repair action: fix packaging gaps without rewriting the pitch thesis; return to Stage 09 if the email itself is defective.
- Handoff rule: send validated Stage 10 to Google Docs export only when the user asks or workflow requires export.
## Anti-Hallucination And Assumption Control
Never invent journalist names, journalist emails, article titles, publication history, source names, statistics, rankings, survey results, methodology details, quotes, SERP findings, or Muck Rack results.

If required information is missing, unverifiable, blocked by access, or not present in the validated inputs, write exactly:

`Information unavailable. Verification required before use.`

Use beat-level assumptions only when they are clearly labeled as assumptions and never present them as journalist-specific facts. Do not convert search intent, SERP possibility, or Muck Rack workflow instructions into claimed results unless the result was actually captured and validated.
