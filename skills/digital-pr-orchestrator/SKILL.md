---
name: digital-pr-orchestrator
description: Use when you need to run a full Digital PR workflow from raw study, dataset, survey, report, spreadsheet, or campaign brief through source review, insight extraction, supporting research, angle generation, beat mapping, journalist targeting, pitch drafting, optimization, and final Google-Doc-ready packaging. Use when the work must stay stage-gated, file-driven, evidence-based, resumable, and complete end to end inside `digital-pr-agents`.
---

# Digital PR Orchestrator

## Mission
Run the Digital PR workflow in the correct order, enforce handoff quality between stages, prevent weak or invented material from leaking forward, and leave behind a complete file system trail that another agent can resume without relying on chat memory.

## What This Skill Owns
- Workflow order
- stage entry and exit decisions
- mandatory outreach-angle selection gate
- job-folder hygiene
- specialist-skill delegation
- evidence discipline
- quality gates
- stop conditions
- resume behavior
- packaging logic up to `10-google-doc.md`

## What This Skill Does Not Own
- permanent repo architecture beyond its own instructions
- Gmail sending or external outreach unless the user explicitly requests it
- replacing specialist skills when the specialist stage still needs to happen
- inventing missing research, journalist data, or campaign facts to keep momentum

## Operating Principles
- Treat the numbered files as the source of truth for stage handoff.
- Treat `source-files/` as raw material, not as finished output.
- Prefer evidence-backed progress over fast but brittle progress.
- Keep one campaign in one folder.
- Finish each stage cleanly before moving downstream.
- Stop when a missing prerequisite would force guessing.
- When in doubt, protect downstream quality rather than pushing ahead.

## Non-Negotiables
- Do not skip numbered stages.
- Do not rename numbered stage files.
- Do not invent data, source claims, journalist names, journalist emails, article histories, or rankings.
- Do not let a later stage silently override an earlier unresolved contradiction.
- Do not confuse validator success with editorial quality.
- Do not treat a broad search result as proof of journalist fit without checking what made the result relevant.
- Do not describe a partial Muck Rack rerun as final unless combined manifests were rebuilt from all beat JSON files.
- Do not search Muck Rack, SERP, media outlets, or contact databases for every available angle unless the user explicitly asks for full multi-angle collection.
- Do not draft email variants for more than one active angle at a time.
- Do not let Stage 06 begin until the user has confirmed at least one outreach angle and its corresponding beat or beat family. If multiple angles are selected, require one active angle/beat package unless the user explicitly requests batch execution.
- Do not interpret a generic `go`, `continue`, or `proceed` after Stage 05 as angle approval unless the selected angle is named or already recorded in `05-beats.md`.

## Workspace Model
- Project root: `D:\Codex Folder\digital-pr-agents`
- One campaign folder: `pitch-jobs/<slug>/`
- Permanent prompts: `skills/<agent>/SKILL.md`
- Automation bridges: `scripts/*.js` and `scripts/*.cmd`
- Raw campaign materials: `pitch-jobs/<slug>/source-files/`
- Working outputs: `pitch-jobs/<slug>/<stage>.md`

## High-Level Flow
1. Validate the brief.
2. Validate raw source material.
3. Extract source notes and insights.
4. Add supporting research.
5. Generate and rank angles.
6. Map beats and search logic.
7. Stop at the outreach-angle selection gate.
8. Collect and shape journalist intelligence only for the confirmed angle and beat.
9. Draft six controlled email variants for that confirmed angle.
10. Optimize the selected pitch.
11. Package the final output.

## Stage Spine
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
11. `10-google-doc.md`

The outreach-angle selection gate is stored inside `05-beats.md`. It is not a separate numbered file, but it is a required workflow stop between Stage 05 and Stage 06.

## Specialist Ownership
| Stage | Primary Skill | Main Outputs | Main Bridge |
|---|---|---|---|
| brief intake | `digital-pr-orchestrator` | brief confirmed usable | none |
| study extraction | `study-insight-extractor` | `01-study-notes.md`, `02-insights.md` | `scripts/draft-study-input.js` |
| research | `research-enrichment-agent` | `03-research.md` | none |
| angles | `angle-generator` | `04-angles.md` | none |
| beats and selection gate | `beat-matcher` | `05-beats.md` with top-10 angle gate | none |
| journalist intelligence | `journalist-intelligence-agent` | `06-journalist-intel.md`, `07-journalist-coverage.md` for the active selected angle only | `scripts/import-muckrack-output.js`, `scripts/draft-journalist-intel.js` |
| first draft | `pitch-writer` | six selected-angle variants in `draft-variants/*`, `08-pitch-draft.md` | `scripts/draft-pitch-draft.js` |
| optimization | `email-optimizer` | `09-optimized-email.md` | none |
| packaging | `final-doc-packager` | `10-google-doc.md` | `scripts/export-google-doc.js` |

## Preflight Protocol
Run this before doing substantial work on any job.

1. Confirm the job folder exists.
2. Confirm the slug is clean and stable.
3. Confirm `00-brief.md` exists and is not placeholder text.
4. Confirm the needed raw source files exist under `source-files/`.
5. Identify the latest trustworthy numbered stage.
6. Identify whether new source files were added after the latest stage file was written.
7. Identify whether the user wants:
   - setup only
   - one stage only
   - the whole workflow
8. Identify whether the workflow needs:
   - shortlist journalist research
   - bulk Muck Rack collection
   - Drive export
9. Read `AGENTS.md` and obey stage rules.

## Readiness Rules
Treat a stage as ready only when:
- its required inputs exist
- those inputs contain real content
- no known contradiction blocks downstream work
- the previous stage is strong enough to support the next decision

Treat a stage as not ready when:
- its file exists but still has template content
- the file has content but not enough specificity
- the content is unsupported, contradictory, or generic
- the file reflects an older collection run that no longer matches the raw source folder

## Stage 00: Brief Intake
### Objective
Establish the campaign goal, campaign boundaries, source expectations, geography, timing, and any hard constraints.

### Read
- `00-brief.md`

### Require
- client name
- study or campaign title
- what the campaign is trying to prove or surface
- geography or localization scope
- target audience or media direction when provided
- any tone or claim restrictions
- any stop rules the user gave

### Good Stage 00 Looks Like
- The study topic is understandable in one read.
- The geography is explicit.
- The user's success condition is clear.
- The next stage can extract evidence without guessing intent.

### Do Not Proceed If
- the brief still has placeholders
- the campaign objective is too broad to support angle selection
- the raw source is missing and stage `01` depends on it
- the brief and raw source appear to describe different campaigns

### Definition Of Done
- another agent could explain the campaign's purpose and constraints using only `00-brief.md`

## Stage 01 and 02: Study Notes and Insights
### Objective
Turn the raw study into a usable evidence base and then into ranked findings.

### Delegate To
- `study-insight-extractor`

### Read
- `00-brief.md`
- `source-files/study-inputs/raw-study-copy.md`

### Produce
- `01-study-notes.md`
- `02-insights.md`

### Require In 01
- summary of the source
- methodology or data origin when available
- known limitations
- source-specific caveats
- notable wording risks

### Require In 02
- ranked findings
- each finding tied to real source evidence
- a clear reason each finding is press-worthy
- enough specificity to compare findings against each other

### Helpful Bridge
- `.\scripts\draft-study-input.cmd <job-name>`

### Good Stage 01 and 02 Looks Like
- Findings are concrete, not generic.
- Caveats are preserved, not smoothed away.
- The strongest finding is obvious.
- Downstream research can build around real signals instead of summary fluff.

### Do Not Proceed If
- notes look like generic summarization
- the findings are not ranked
- important numbers do not trace back to the source
- caveats were stripped out
- there is not at least one angle-worthy insight

### Definition Of Done
- `02-insights.md` clearly tells the next agent which findings deserve angle generation

## Stage 03: Research Enrichment
### Objective
Add outside context that sharpens or pressure-tests the study.

### Delegate To
- `research-enrichment-agent`

### Read
- `01-study-notes.md`
- `02-insights.md`

### Produce
- `03-research.md`

### Require
- current timing context
- relevant official or primary supporting sources
- comparator or benchmark material when useful
- caveats where outside facts complicate the campaign
- notes on what can and cannot be claimed

### Good Stage 03 Looks Like
- It adds real leverage to the campaign.
- It makes unsupported overclaiming harder.
- It improves angle quality, not just length.

### Do Not Proceed If
- it simply restates the study
- it leans on weak third-party summaries when primary sources exist
- it adds facts but no usable framing
- it ignores conflicting source numbers

### Definition Of Done
- there is enough support to defend the top angle in a pitch

## Stage 04: Angle Generation
### Objective
Convert findings and context into ranked story frames.

### Delegate To
- `angle-generator`

### Read
- `02-insights.md`
- `03-research.md`

### Produce
- `04-angles.md`

### Require
- multiple candidate angles
- one clearly recommended primary angle
- a thesis for each angle
- ranking rationale
- local versus national framing differences when relevant

### Good Stage 04 Looks Like
- The top angle feels inevitable.
- Backup angles are distinct, not cosmetic rewrites.
- The file gives later stages a real editorial direction.

### Do Not Proceed If
- the angle list is interchangeable
- there is no clear winner
- the angles are catchy but weakly supported
- the selected angle does not fit the evidence hierarchy

### Definition Of Done
- `05-beats.md` can be built without reopening the debate over which angle matters most

## Stage 05: Beat Matching
### Objective
Translate available angles into journalist categories, outlet logic, collection strategy, and a mandatory user-facing outreach selection gate.

Stage 05 must not merely say which beats are possible. It must prepare a decision point where the user can review all outreach options, compare angle-to-beat value, and choose one or more preferred angles before any journalist search begins.

### Delegate To
- `beat-matcher`

### Read
- `04-angles.md`

### Produce
- `05-beats.md`

### Require
- beat map
- outlet priorities
- journalist profile logic
- personalization guidance
- search queries or Boolean collection direction
- local, statewide, national, policy, or service-journalism distinctions where relevant
- complete list of available outreach angles and their matching beats
- top 10 recommended outreach angles ranked by timeliness, impact, and audience relevance
- secondary angle backlog for angles that should wait
- explicit `Awaiting User Selection` status
- selected-angle fields left blank until the user chooses one or more angles and one active selected angle package is clear

### Good Stage 05 Looks Like
- Another agent can collect journalists without guessing what "good fit" means.
- Search logic is explicit enough to operationalize.
- The file narrows the field rather than expanding it aimlessly.
- The user can see every viable angle and beat before collection begins.
- The top 10 priority list makes it obvious which options deserve outreach first.
- The secondary backlog preserves useful options without forcing immediate work.
- The file tells Stage 06 exactly where to stop if the user has not selected at least one angle or the active selected angle package is unclear.

### Do Not Proceed If
- the beat map is just a topic list
- there is no collection logic
- localization strategy is absent for a local campaign
- it recommends everyone instead of the right categories
- there is no top-10 recommended angle list
- there is no secondary backlog when more than 10 angles exist
- the selected outreach angle is missing
- the user has not confirmed at least one angle to pursue

### Definition Of Done
- the user has enough detail to select one or more outreach angles
- journalist research can begin with clear beat-fit criteria after that selection is confirmed

## Mandatory Outreach Angle Selection Gate
### Objective
Stop the workflow after Stage 05 so the user can control outreach strategy before time is spent searching SERP, Muck Rack, media outlets, or contact databases.

This gate exists because angle generation can produce many valid outreach paths, but journalist search and email drafting should be focused. The workflow must avoid searching every beat at once, avoid drafting pitches for angles the user may not want, and avoid spending Muck Rack time on secondary options before the priority is clear.

### Required Gate Output In `05-beats.md`
Stage 05 must include these sections:
- `## Outreach Angle Review Gate`
- `## Top 10 Recommended Outreach Angles`
- `## Secondary Angle Backlog`
- `## Awaiting User Selection`
- `## Selected Outreach Angle`

### What The Gate Must Present
For every available outreach angle, show:
- angle name or pitch angle
- corresponding journalist beat
- category or angle family
- outlet scale: local, county, state, national, trade, niche, or hybrid
- brief description of the angle
- unique value of the angle
- why the beat is the right journalistic home
- expected audience relevance
- suggested collection lane: shortlist, bulk Muck Rack, or hybrid
- any caution that may weaken outreach

### Top 10 Priority Logic
Recommend exactly 10 angles when at least 10 are available. Recommend all available angles when fewer than 10 exist.

Rank the top angles by:
- timeliness: why the story matters now
- impact: number of people, businesses, communities, consumers, or institutions affected
- relevance: how naturally the angle fits the target audience and beat
- evidence strength: how well the claim is supported by the study and research
- journalist fit: how easy it will be to find reporters who already cover the topic
- differentiation: whether this angle is distinct from routine coverage
- SERP potential: whether the angle could earn search visibility through a clear, searchable hook
- outreach efficiency: whether one focused journalist search can produce useful targets

Each top-10 recommendation must include a short reason for priority. Do not rank an angle highly only because it sounds catchy.

### Priority Scoring Model
Use a simple 50-point scoring model when the priority order is not obvious.

Score each angle from `1` to `5` in each category:
- timeliness
- impact
- audience relevance
- evidence strength
- journalist beat fit
- outlet fit
- differentiation
- SERP potential
- outreach efficiency
- risk control

Then:
- total the score
- sort highest to lowest
- break ties by stronger beat fit
- break remaining ties by stronger evidence support
- demote any angle with serious claim risk even if the hook is strong

Do not show the full scoring math unless useful, but use it to keep the recommendations consistent.

### User-Facing Gate Response Format
When presenting the gate to the user, use this order:

1. State that Stage 05 is complete and the workflow is stopping for angle selection.
2. Show the top 10 recommended angles with beat, brief value, and reason for priority.
3. Show the secondary backlog with why each angle should wait.
4. Recommend the single best first angle.
5. Ask the user to choose one angle by number or name.
6. State clearly that journalist search will begin only after that selection.

Do not bury the selection request inside a long explanation. The user should immediately understand what decision is needed.

### Secondary Angle Backlog Logic
Place remaining angles in the secondary list when they are:
- useful but less timely
- too niche for the first outreach push
- dependent on weaker support
- better for a later local, county, state, national, or trade follow-up
- likely to require a different media list
- potentially valuable after the primary angle succeeds or stalls

The backlog must preserve the angle. It must not delete or bury it.

### Hard Stop Rule
After presenting the gate, stop.

Do not run:
- Muck Rack search
- Google or SERP journalist discovery
- media outlet search
- contact lookup
- `import-muckrack-output`
- `draft-journalist-intel`
- pitch drafting
- optimization
- final packaging

The next action is user selection, not collection.

### User Selection Rule
The user must confirm at least one angle before Stage 06.

Acceptable confirmation examples:
- `Use angle 3`
- `Go with the county public safety angle`
- `Select the insurance cost angle`
- `Use Top 10 priority #1`

Ambiguous confirmation examples that require clarification:
- `go`
- `continue`
- `do all`
- `start searching`
- `use the best one`

If the user says something ambiguous, ask for the exact angle number or angle name. Do not choose silently unless the user explicitly delegates the choice.

### Post-Selection Scope Lock
Once the user chooses one or more angles, lock Stage 06 to one active selected angle package for the next run:
- the selected pitch angle
- the selected beat or beat family
- the selected outlet scale
- the selected collection lane
- the selected geography
- the selected source and evidence frame

Stage 06 may collect multiple journalists, but only for the active selected angle and its required beat logic. If multiple angles were selected in Stage 04/05, process them as separate active packages unless the user explicitly requests batch multi-angle collection.

### Gate Field Contract
The selected-angle gate must use exact fields so scripts and future agents can read it reliably.

Required status values:
- `Selection status: pending` before user approval
- `Selection status: confirmed` after the user chooses one or more angles

Required selected fields:
- `Selected priority number`
- `Selected angle / pitch angle`
- `Selected category`
- `Selected journalist beat`
- `Selected outlet scale`
- `Selected geography`
- `Selected collection lane`
- `Evidence support to carry forward`
- `Search start point`
- `Selection note`

Do not use status synonyms such as `approved`, `ready`, `chosen`, or `selected`. The automation bridge treats anything except exact `confirmed` as blocked.

### After Stage 08
After six email variants are drafted for the selected angle, stop again.

Report that the selected-angle email set is ready for outreach review. Do not ask for or begin another angle until the user chooses the next angle. This preserves strategic control and prevents accidental multi-angle drafting.

### Definition Of Done
The gate is done only when:
- all available outreach angles are visible
- the top 10 recommended angles are ranked and explained
- secondary angles are preserved for later
- selected angle(s) are explicitly recorded or marked as awaiting selection
- Stage 06 is blocked until at least one angle is confirmed and one active angle/beat package is clear

## Stage 06 and 07: Journalist Intelligence and Coverage
### Objective
Turn the active confirmed angle and confirmed beat into real outreach targets with contact honesty and usable personalization.

### Delegate To
- `journalist-intelligence-agent`

### Read
- `00-brief.md`
- `04-angles.md`
- `05-beats.md`
- `source-files/journalist-intel/`

### Produce
- `06-journalist-intel.md`
- `07-journalist-coverage.md`

### Require
- selected outreach angle from the Stage 05 gate
- selected beat or beat family from the Stage 05 gate
- real journalists
- explicit email status
- outlet and beat relevance
- recent coverage context
- personalization hooks grounded in observed work

### Collection Lanes
Use one of two lanes after the selected angle is confirmed. Do not blur them together without naming the change.

Collection lanes apply to the active selected angle only. They do not authorize collection across all angles or all beats unless the user explicitly requests full multi-angle collection.

#### Lane A: Shortlist Collection
Use when the user wants a smaller, tighter editorial list.

Expected behavior:
- tighter manual research
- fewer names
- higher editorial fit per target

#### Lane B: Bulk Muck Rack Collection
Use when the user wants hundreds of journalists per beat.

Use:
- `muck-rack-bulk-collector`
- **Browser Tools Module:** `browser-tools/` (CDP client, chrome-launcher, muckrack-collector)
  - Chrome debug port: 9222 (verified working)
  - Location: `D:\Codex Folder\digital-pr-agents\browser-tools\`
  - Use for automated journalist collection

Prefer:
- multi-query Boolean beat files

Store outputs under:
- `source-files/journalist-intel/bulk-beat-collection/`

Bulk lane rules:
- dedupe within each beat
- track per-beat JSON and Markdown
- track combined CSV and deduped CSV
- rebuild final combined manifests after any partial rerun
- separate:
  - raw beat rows
  - deduped profile URLs
  - final outreach shortlist
- do not let a partial rerun overwrite the apparent truth of the folder

### Helpful Bridges
- `.\scripts\import-muckrack-output.cmd <job-name> [--all]`
- `.\scripts\draft-journalist-intel.cmd <job-name>`

### Good Stage 06 and 07 Looks Like
- A human can see why each journalist belongs on the list.
- Email status is honest.
- The coverage hooks are usable in a real pitch.
- The workflow can defend where the names came from.

### Do Not Proceed If
- the Stage 05 gate is still awaiting user selection
- `Selection status` is not exact `confirmed`
- more than one angle is being searched without explicit user approval
- journalist names were guessed
- emails were guessed
- coverage hooks are generic
- the Muck Rack collection is incomplete but described as final
- `06-journalist-intel.md` still reflects an earlier shortlist after the workflow moved to bulk collection
- combined CSV and summary files disagree after a resumed run

### Definition Of Done
- the targeting package carries the same selected-angle scope as `05-beats.md`
- the targeting package is strong enough to support personalized drafting

## Stage 08: Pitch Draft
### Objective
Write six controlled first-pass pitch variants for the selected outreach angle, then choose or merge the strongest one.

### Delegate To
- `pitch-writer`

### Read
- `00-brief.md`
- `04-angles.md`
- `05-beats.md`
- `06-journalist-intel.md`
- `07-journalist-coverage.md`
- optional `03-research.md`

### Produce
- `draft-variants/`
- `08-pitch-draft.md`

### Require
- one confirmed outreach angle
- journalist intelligence for that selected angle
- `06-journalist-intel.md` and `07-journalist-coverage.md` match the confirmed selected angle
- one selected draft
- variant explanation
- subject options
- six 500-600 word email bodies
- one analytical table inside every variant body
- one analytical table inside the selected `08-pitch-draft.md` body
- body copy aligned to the chosen target and angle
- ethical psychological trigger logic that creates editorial pull without pressure
- newsworthiness proof strong enough to show why a journalist would publish the study

### Helpful Bridge
- `.\scripts\draft-pitch-draft.cmd <job-name>`

### Good Stage 08 Looks Like
- The draft sounds like it belongs to the chosen target.
- It is clearly driven by the selected angle.
- Each variant is 500-600 words and uses that length for data, context, reader value, and asset clarity.
- Each variant includes a compact analytical table inside the email body.
- It uses evidence without sounding robotic.
- It is data packed but still human, clear, and readable.
- It uses psychological triggers through relevance, specificity, consequence, timing, novelty, and utility, not manipulation.
- Variant differences are meaningful.
- All six variants serve the same chosen angle rather than drifting into other backlog angles.

### Stage 08 Control Checks
Before Stage 08 can be accepted, the orchestrator must confirm:
- the Stage 05 selected angle is exact `confirmed`
- the selected angle, beat, outlet scale, geography, and collection lane match Stage 06 and Stage 07
- the six variants test different drafting strategies, not different campaign angles
- every variant contains a 500-600 word body, not including external notes
- every variant contains one analytical table inside the email body
- every analytical table translates verified evidence into coverage value
- every subject line names a concrete story signal or beat-relevant hook
- the first two sentences of each variant explain why the journalist should keep reading
- the CTA is one simple ask connected to an asset that can actually be provided
- the ethical psychological trigger review shows relevance, utility, specificity, novelty, consequence, or timing without pressure
- the selected `08-pitch-draft.md` is the most publishable draft, not merely the smoothest draft

### Stage 08 Repair Routing
If Stage 08 is weak, route the repair to the right prior stage:
- weak data or missing source support -> return to `research-enrichment-agent`
- weak angle or unclear story thesis -> return to `angle-generator`
- wrong beat or unclear target category -> return to `beat-matcher`
- thin journalist fit or weak personalization base -> return to `journalist-intelligence-agent`
- good strategy but weak wording -> repair inside `pitch-writer`
- good email but missing 500-600 words or table -> repair inside `pitch-writer` before Stage 09

Do not send a strategically weak pitch to the optimizer and expect Stage 09 to rescue it.

### Do Not Proceed If
- no selected angle is recorded
- journalist intelligence was not collected for the selected angle
- the draft tries to cover multiple Stage 05 angles at once
- the draft could fit any reporter
- it ignores the beat logic
- it introduces unsupported facts
- it relies on empty flattery instead of real personalization
- it is below 500 words or above 600 words
- it lacks an analytical table inside the email body
- the table contains unsupported data or unrelated evidence
- psychological pull depends on fake urgency, fear pressure, false scarcity, or forced flattery

### Definition Of Done
- six selected-angle variants exist
- every variant body is 500-600 words
- every variant includes an analytical table inside the body
- there is one strongest draft worth optimizing
- `08-pitch-draft.md` also contains a 500-600 word body and analytical table
- the deterministic Stage 08 pitch audit passes
- the workflow pauses before starting another angle

## Stage 09: Optimization
### Objective
Improve the strongest draft without rewriting the campaign thesis by accident, while preserving the 500-600 word standard, analytical table, and selected pitch-angle alignment.

### Delegate To
- `email-optimizer`

### Read
- `04-angles.md`
- `05-beats.md`
- `06-journalist-intel.md`
- `07-journalist-coverage.md`
- `08-pitch-draft.md`

### Produce
- `09-optimized-email.md`

### Require
- pass log
- final subject options
- optimized final body of 500-600 words
- analytical table inside the final email body
- pitch angle alignment review
- ethical psychological trigger review
- inbox preview, mobile scan, deliverability, and red-team review

### Default Pass Count
- `12` passes, covering source integrity, newsworthiness, subject lines, opening line, evidence compression, beat fit, ethical trigger tuning, human tone, deliverability, red-team review, pitch-angle alignment, and publishability scoring

### Extend Pass Count Only When
- angle clarity improves
- tone becomes more human
- newsworthiness improves
- 500-600 word density materially improves
- credibility materially improves
- pitch-angle alignment improves
- the analytical table becomes more useful to a journalist

### Good Stage 09 Looks Like
- The body is 500-600 words, clearer, and more target-aware than Stage 08.
- The analytical table remains inside the email body and supports the exact selected angle.
- The final email proves alignment between opening hook, evidence, table, CTA, and selected pitch angle.
- Subject lines are stronger and more specific.
- Optimization improved the draft rather than hiding structural problems.
- The email is newsworthy first, then persuasive.
- The psychological triggers create a real urge to examine the story because it is relevant, specific, useful, timely, and credible, not because the journalist is pressured.

### Stage 09 Control Checks
Before Stage 09 can be accepted, the orchestrator must confirm:
- the optimizer used `08-pitch-draft.md` as the source draft
- the optimized email did not change the selected angle, beat, category, outlet scale, geography, or collection lane
- the recommended subject line matches the selected angle
- the opening hook, body thesis, analytical table, evidence, and CTA all support the same pitch angle
- the body is 500-600 words including greeting, analytical table, CTA, and signoff
- the analytical table is inside `## Final Email`, not only in notes
- the table contains 3-5 useful rows and does not introduce unsupported claims
- the email reads like a human, not like a generic AI rewrite
- the email offers a clear asset, data, methodology, quote, local breakdown, county breakdown, state breakdown, ranking table, or other usable reporting material
- the inbox review, ethical trigger review, red-team review, and pitch angle alignment review are all approved
- the deterministic optimized-email audit passes after any manual revisions

### Stage 09 Repair Routing
If Stage 09 fails:
- angle drift -> return to `05-beats.md` and `08-pitch-draft.md`; re-lock the angle before rewriting
- missing or weak table -> repair the final email table and rerun validation
- weak newsworthiness -> return to Stage 08 or Stage 04 instead of polishing language
- weak personalization -> return to Stage 06 or Stage 07
- AI-sounding prose -> run the human tone pass again and remove template phrasing
- under 500 or over 600 words -> rebalance the body using useful evidence, context, table tightening, or CTA compression
- unsupported claim -> remove or caveat the claim and update the claims-to-avoid section

### Do Not Proceed If
- the Stage 08 draft is still strategically weak
- optimization is being used to avoid fixing poor targeting
- new unsupported claims were introduced for punch
- the final email drifts away from the confirmed selected angle
- the final email removes the analytical table
- the final email falls outside 500-600 words
- the final email sounds AI-written, promotional, or generic

### Definition Of Done
- the pitch feels ready for human review
- `09-optimized-email.md` contains a 500-600 word final email
- the final email includes the analytical table inside the body
- the final email includes a complete pitch angle alignment review
- the deterministic optimized-email audit passes
- `validate-stage.cmd <job-name> 09-optimized-email.md` passes

## Stage 10: Final Packaging
### Objective
Turn the campaign into a clean, doc-ready final package.

### Delegate To
- `final-doc-packager`

### Read
- `04-angles.md`
- `05-beats.md`
- `06-journalist-intel.md`
- `07-journalist-coverage.md`
- `09-optimized-email.md`

### Produce
- `10-google-doc.md`

### Helpful Bridge
- `.\scripts\export-google-doc.cmd <job-name> ["Optional Doc Title"]`

### Require
- complete Stage 10 package status
- campaign snapshot
- selected outreach angle
- target journalist or target type
- final recommended subject line
- at least five final subject options
- final 500-600 word optimized email copied from Stage 09
- analytical table preserved inside the final email body
- analytical table confirmation
- evidence and source notes
- newsworthiness proof
- pitch angle alignment proof
- personalization basis
- ethical psychological trigger review
- claims to avoid
- assets available for outreach
- methodology and caveats
- outreach readiness checklist
- Google Docs export handoff
- final QA decision

### Good Stage 10 Looks Like
- Another person can pick it up and know exactly what the final pitch is.
- The final email is visible, intact, 500-600 words, and includes the analytical table inside the body.
- The selected angle, beat, target, subject line, evidence, table, CTA, and caveats all match Stage 09.
- The package explains why the pitch is newsworthy and publishable.
- The package makes source limits and claims to avoid impossible to miss.
- The Google Docs handoff gives the exact export command and expected link files.
- The package reflects the actual workflow state and does not imply outreach has happened.

### Stage 10 Control Checks
Before Stage 10 can be accepted, the orchestrator must confirm:
- `09-optimized-email.md` says `Ready for final packaging: yes`
- `10-google-doc.md` exists
- every required Stage 10 section is filled
- the final email body remains 500-600 words
- the analytical table remains inside `## Final Email`
- the recommended subject line is included and aligned with the selected angle
- the package includes at least five subject options
- evidence and source notes are traceable to prior stage files
- assets are realistic and not overpromised
- methodology caveats are preserved
- the outreach readiness checklist has no fail statuses
- `audit_final_package.py` passes
- `validate-stage.cmd <job-name> 10-google-doc.md` passes

### Do Not Proceed If
- earlier stage files disagree
- journalist targeting is still provisional
- the final doc implies outreach already occurred
- Stage 09 is not marked ready for final packaging
- the final email is missing, changed strategically, under 500 words, over 600 words, or missing the analytical table
- selected angle, beat, target, evidence, or CTA drifted from Stage 09
- claims to avoid or caveats are missing
- Google Docs export handoff is incomplete

### Definition Of Done
- `10-google-doc.md` is complete
- the deterministic Stage 10 audit passes
- `validate-stage.cmd <job-name> 10-google-doc.md` passes
- the package is ready for Drive export or human signoff
- the workflow stops before exporting unless the user asks to create the Google Doc

## Sequencing Rules
- The workflow is sequential across stages.
- Parallelism helps inside stages, not across blocked dependencies.
- Use parallelism for:
  - comparing candidate insights
  - generating several angle families
  - testing beat fits
  - comparing shortlist quality
  - rewriting multiple draft variants
  - optimization passes
- Do not use parallelism to bypass stage readiness.
- Do not use parallelism to run journalist search for several unapproved angles.
- The Stage 05 gate and the post-Stage 08 pause are real workflow stops.

## Script Versus Skill Rules
- Use `SKILL.md` files for permanent operating behavior.
- Use `scripts/*.js` for deterministic file generation rules.
- Use `00-brief.md` for campaign-specific direction.
- If a permanent instruction change is needed, change the relevant skill.
- If a one-job direction change is needed, change the job files.
- If a format must always be enforced, change the script bridge.

## Validation Rules
- Run `.\scripts\validate-stage.cmd <job-name> <stage-file>` when a stage is meant to be locked.
- Read the validated file before trusting it.
- Treat validation as a structural gate.
- Treat human or agent review as the editorial gate.

## File Contract
- `00-brief.md`: objective, scope, constraints
- `01-study-notes.md`: source summary, caveats, methodology
- `02-insights.md`: ranked findings
- `03-research.md`: context and comparators
- `04-angles.md`: ranked story angles
- `05-beats.md`: beat logic, collection direction, top-10 angle review gate, secondary backlog, and selected-angle status
- `06-journalist-intel.md`: selected-angle target set and email status
- `07-journalist-coverage.md`: selected-angle recent coverage and personalization hooks
- `08-pitch-draft.md`: selected-angle initial pitch chosen from six variants
- `09-optimized-email.md`: final optimized email
- `10-google-doc.md`: packaged final output

## Source Hierarchy
Use this order when deciding which facts are safest to trust.

1. campaign source material
2. official or primary outside sources
3. direct journalist profile and coverage evidence
4. carefully labeled secondary context
5. competitor PR examples only for positioning, never as core evidence

## Evidence Discipline
- Tie every major claim to the study or a supporting source.
- Mark missing data as missing.
- Preserve conflicting numbers when they matter.
- Distinguish source-backed fact from framing language.
- Do not overread search relevance as editorial fit.
- If a claim changes because of a source conflict, update the downstream files that depend on it.

## Resume Protocol
1. Inspect the job folder first.
2. Identify the last trustworthy stage.
3. Identify whether new raw inputs exist in `source-files/`.
4. Identify whether a prior Muck Rack run was interrupted.
5. Check whether combined manifests were rebuilt after any partial rerun.
6. Check whether `05-beats.md` is awaiting user angle selection.
7. Check whether `06` and `07` match the currently selected angle.
8. Decide whether to continue, rebuild, or replace the current stage.
9. Update numbered stage files so they match the true final artifacts.

## Failure Patterns To Watch For
- placeholder text surviving into later stages
- good validation, weak editorial logic
- shortlist files that no longer match the bulk collection branch
- overwritten folder summaries after partial reruns
- broad Boolean fallback queries being reported as niche beat precision
- source conflicts disappearing instead of being documented
- optimization masking weak stage-08 strategy
- Stage 06 searching every available beat even though the user selected only one angle
- Stage 08 drafting multiple unrelated angles instead of six variants for the chosen angle
- ambiguous user confirmation being treated as permission to continue without a selected angle

## Escalate When
- the brief and source material conflict
- current journalist research is required but Muck Rack access is blocked
- a stage can continue only by guessing
- a later stage would overwrite a stronger reviewed artifact
- the user's request changes the lane from shortlist to bulk or from bulk to shortlist
- the user has not selected at least one outreach angle after the Stage 05 gate
- the user asks for all-angle collection but the workflow artifacts are set up for selected-angle collection

## Final Standard
- Leave behind a workflow another agent can resume.
- Prefer a small set of strong supported angles over many weak ones.
- Keep every stage evidence-based and transparent about gaps.
- Preserve localization logic where the campaign depends on it.
- Preserve user control at the outreach-angle gate.
- Finish with a clean final package, not scattered intermediate guesses.

## Operational Contract

- Name: digital-pr-orchestrator.
- Purpose: control the full Digital PR workflow order, gates, validation, repairs, and final readiness decisions.
- Required input: campaign goal, job slug, source material, and current stage files.
- Optional input: target publications, geography, outreach preferences, Google Doc title, Muck Rack access, and user-selected angle.
- Execution process: inspect current job state, route to the correct specialist, enforce stage order, run validators, repair failed stages, protect selected-angle scope, and stop at required user gates.
- Output: validated stage files, audit notes, handoff instructions, and final package readiness status.
- Output format: numbered stage files, source-files evidence, validation logs, and final readiness summary.
- Trigger condition: user asks to run, resume, audit, repair, validate, or package a Digital PR job.
- Stop condition: required gate is awaiting user selection, a critical test is blocked, or final package is delivered.
- Failure condition: skipped stage, broken handoff, unsupported claim, missing selection, invalid script, or blocked required tool.
- Validation rule: no stage advances without the required file, required content, and applicable validator evidence.
- Repair action: return to the owning specialist or script, fix the specific failure, and revalidate.
- Handoff rule: move only one validated stage at a time to the next owner.
## Anti-Hallucination And Assumption Control
Never invent journalist names, journalist emails, article titles, publication history, source names, statistics, rankings, survey results, methodology details, quotes, SERP findings, or Muck Rack results.

If required information is missing, unverifiable, blocked by access, or not present in the validated inputs, write exactly:

`Information unavailable. Verification required before use.`

Use beat-level assumptions only when they are clearly labeled as assumptions and never present them as journalist-specific facts. Do not convert search intent, SERP possibility, or Muck Rack workflow instructions into claimed results unless the result was actually captured and validated.
