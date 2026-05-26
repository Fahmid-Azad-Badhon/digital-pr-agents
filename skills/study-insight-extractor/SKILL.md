---
name: study-insight-extractor
description: Use when you need to convert a study, report, survey, spreadsheet, raw dataset, pasted source copy, or research summary into disciplined Stage 01 and Stage 02 Digital PR outputs inside `digital-pr-agents`. Use when the work must produce evidence-backed study notes, ranked press-worthy findings, methodology awareness, caveat tracking, and a clean handoff to research and angle generation without drifting into pitch writing.
---

# Study Insight Extractor

## Mission
Turn raw study material into two durable stage files that the rest of the Digital PR workflow can trust:
- `01-study-notes.md` as the source intelligence layer
- `02-insights.md` as the ranked finding layer

This skill exists to do the hard editorial sorting early. It should tell the truth about the source, preserve methodological limits, identify the strongest findings, reject weak ones, and make it obvious what later stages should build on.

The standard is not "did we produce two files."
The standard is "can another agent read these files and know exactly what the source really supports."

## Strategic Purpose
Stage 01 and Stage 02 are where weak campaigns often quietly fail.

If this step is vague:
- research becomes generic
- angles become interchangeable
- beat mapping loses focus
- journalist targeting becomes less credible
- pitch writing has to compensate for weak raw material

If this step is strong:
- the top findings are obvious
- supporting research becomes more targeted
- angles become sharper
- downstream claims stay safer
- the entire workflow becomes easier to resume

Treat this skill as the evidence filter for the entire campaign.

## What This Skill Owns
- Stage 01 and Stage 02 execution
- source intake discipline
- factual extraction from raw source copy
- methodology detection and documentation
- caveat preservation
- observation filtering
- finding ranking
- evidence-to-insight conversion
- handoff quality to `03-research.md` and `04-angles.md`

## What This Skill Does Not Own
- outside-source research
- fact expansion beyond the provided source
- angle generation
- beat mapping
- journalist discovery
- pitch drafting
- narrative polish for media outreach
- forcing a strong campaign out of weak evidence

## Operating Philosophy
- Be precise before being elegant.
- Be honest before being helpful.
- Be selective before being exhaustive.
- Preserve uncertainty instead of sanding it down.
- Protect downstream quality even when the source is disappointing.

If the source only supports one decent finding, say that.
If the source supports no credible angle, say that.
If the brief wants a stronger outcome than the source allows, record the mismatch.

## Non-Negotiables
- Do not invent numbers, percentages, dates, respondent counts, sample sizes, rankings, or methodology details.
- Do not convert a descriptive finding into a causal claim.
- Do not treat the brief as evidence.
- Do not copy hype language from source material into ranked findings unless the source itself proves it.
- Do not write pitch copy, subject lines, or outreach language in this stage.
- Do not move downstream from placeholder or undersupplied source material.
- Do not overpopulate `02-insights.md` with weak filler just to hit a count.
- Do not hide important caveats to make a statistic feel cleaner.
- Do not mark a finding as strong if it only becomes interesting after unsupported interpretation.

## Workspace Context

### Project Structure
```
D:\Codex Folder\digital-pr-agents\
├── dashboard\                    # Next.js dashboard application
│   ├── src\app\
│   │   ├── data-extraction\      # Stage 2 UI page
│   │   │   └── page.tsx          # Data extraction frontend
│   │   ├── workflow\             # Main workflow page
│   │   └── api\
│   │       └── campaigns\[id]\extract\route.ts  # API extraction endpoint
│   └── src\context\
│       └── DataContext.tsx        # Campaign state management
├── skills\
│   └── study-insight-extractor\  # This skill
│       └── SKILL.md              # This file
├── pitch-jobs\                   # Campaign storage
│   └── <campaign-slug>\
│       ├── 00-brief.md           # Campaign brief
│       ├── 01-study-notes.md     # Stage 1 output
│       ├── 02-insights.md        # Stage 2 output
│       └── source-files\
│           └── study-inputs\
│               └── raw-study-copy.md  # Raw study input
└── scripts\
    └── draft-study-input.cmd      # Automation script
```

### Stage Inputs
- `pitch-jobs/<slug>/00-brief.md` - Campaign brief
- `pitch-jobs/<slug>/source-files/study-inputs/raw-study-copy.md` - Raw study source

### Stage Outputs
- `pitch-jobs/<slug>/01-study-notes.md` - Source intelligence layer
- `pitch-jobs/<slug>/02-insights.md` - Ranked finding layer

### Dashboard Integration
The dashboard uses this skill through:
1. **Frontend**: `src/app/data-extraction/page.tsx` - UI for running extraction
2. **API**: `src/app/api/campaigns/[id]/extract/route.ts` - Server-side extraction
3. **State**: `src/context/DataContext.tsx` - Campaign and stage state management

When a user clicks "Run Extraction" in the dashboard:
1. Frontend calls `/api/campaigns/<id>/extract`
2. API reads `raw-study-copy.md` from `pitch-jobs/<slug>/source-files/study-inputs/`
3. API parses content and writes to `02-insights.md`
4. Frontend displays extracted data in structured format

## Stage Ownership
This skill owns exactly two consecutive stages.

1. **Stage 01**: source understanding
2. **Stage 02**: finding prioritization

Keep these distinct.

Stage 01 asks:
- What is this source?
- What kind of evidence is it?
- What is missing?
- What should a careful agent remember before using it?

Stage 02 asks:
- Which findings actually matter?
- Which findings are strongest?
- Which findings can support downstream angle generation?
- Which findings are too weak, too generic, or too risky?

## Required Inputs
Always read:
- `00-brief.md`
- `source-files/study-inputs/raw-study-copy.md`

Use them differently.

### `00-brief.md` is for:
- campaign objective
- framing direction
- geography
- audience
- desired beats
- hard constraints
- must-use priorities the client or strategist cares about
- client name
- target region
- tone
- campaign notes

### `raw-study-copy.md` is for:
- actual evidence
- actual numbers
- actual methodology clues
- actual source limits
- actual wording risk

When they conflict:
- the source controls factual claims
- the brief controls prioritization and campaign intent

Do not silently merge the two into a cleaner story than either one supports.

## Source Types This Skill Must Handle
Expect to work across:
- survey summaries
- poll writeups
- internal brand studies
- public datasets
- spreadsheets converted to text
- rankings or index reports
- company transaction analyses
- public-records analyses
- article-style study summaries
- copy-pasted report text
- mixed-source working notes that still need classification

Do not assume all sources are equally rigorous.

## Source Reliability Mindset
Not every source carries the same evidentiary weight.

Be especially careful with:
- internal company analyses with limited disclosed methodology
- survey summaries missing sample size
- PR-oriented writeups that emphasize conclusions but not method
- rankings that do not explain weighting
- trend claims that do not define the comparison period
- article summaries that paraphrase a study without linking the original

If the source is only partially transparent, that does not make it unusable.
It does mean the caveat layer becomes more important.

## Data Point Integrity Checklist
Every statistic, ranking, percentage, date, comparison, and claim must be treated as a structured evidence object before it can appear in `02-insights.md`.

For each candidate finding, answer all of the following:

- What is the number?
- What exactly does it measure?
- What timeframe does it cover?
- What geography does it apply to?
- What source supports it?
- What does it prove?
- What does it not prove?
- What limitation should be respected?

Reject or downgrade the finding when:
- the number is unsupported
- the timeframe is missing
- the geography is unclear
- the source is missing
- the methodology is hidden or weak
- a comparison uses mismatched periods, regions, populations, or categories
- correlation is being written as causation
- the finding sounds dramatic only because wording has been inflated

If a claim cannot be verified from the source material, write `Information unavailable. Verification required before use.` Do not rewrite uncertainty into confidence.

## Preflight Protocol
Before drafting anything, verify the following:

1. The campaign folder exists at `pitch-jobs/<slug>/`
2. `00-brief.md` exists and is meaningful
3. `raw-study-copy.md` exists and is meaningful
4. The raw source contains enough real text to extract findings from (minimum ~500 words recommended)
5. The current stage files are safe to create or replace
6. The work matches Stage 01 and Stage 02, not a later stage
7. The content is not placeholder text like `[INSERT DATA HERE]` or `[TO BE ADDED]`

Treat the source as not ready when:
- it still contains bracketed placeholders
- it is mostly template scaffolding
- it contains only a short abstract or teaser paragraph
- it lacks enough substance to identify methodology or concrete findings
- it appears to reference another source that has not actually been pasted in

## Readiness Rules
Stage 01 and Stage 02 are ready only when:
- there is enough real source copy to analyze
- the source can yield at least one concrete observation
- the brief provides enough context to judge relevance
- the source is not obviously mismatched to the campaign brief

Do not proceed cleanly when:
- the brief says the campaign is local but the source is vague and national with no localization path
- the brief emphasizes a must-use claim that the source does not clearly support
- the source sounds statistical but contains no measurable detail
- the source appears stale and timing matters to the campaign

## Standard Working Sequence
Use this order every time.

1. Read the brief (`00-brief.md`)
2. Read the raw source from top to bottom (`raw-study-copy.md`)
3. Identify source type (survey, dataset, ranking, report, article)
4. Identify methodology signals (sample size, timeframe, geography, collection method)
5. Identify explicit limitations and implied limitations
6. Extract raw observations (make a list of 10-20 potential findings)
7. Filter those observations for press-worthiness (remove generic, keep specific)
8. Rank the best findings (top 5-10)
9. Write `01-study-notes.md`
10. Write `02-insights.md`
11. Review both files against each other for consistency
12. Confirm the top finding is actually supportable

Do not jump straight from reading the source to writing ranked insights.

## Use The Script Bridge First When Appropriate
Prefer the automation bridge when the campaign follows the standard folder structure.

### Command
```powershell
.\scripts\draft-study-input.cmd <job-name>
```

Common options:
```powershell
.\scripts\draft-study-input.cmd <job-name> --force
.\scripts\draft-study-input.cmd <job-name> --max-findings 5
```

Alternative - use dashboard API:
```powershell
# Via Next.js API route
curl -X POST http://localhost:3001/api/campaigns/<slug>/extract
```

### What The Script Already Does Well
The script/API already handles:
- confirms `00-brief.md` exists
- confirms `raw-study-copy.md` exists
- rejects obvious placeholder content
- requires enough raw text to work from
- parses major brief sections
- extracts source metadata from the `## Source` section
- tries to infer source type
- identifies methodology-like sentences
- generates a first caveat pass
- extracts statistics and numbers
- identifies geographic references
- identifies time periods
- identifies contributing factors
- drafts `01-study-notes.md` and `02-insights.md`

### What The Script Does Not Replace
The script is a disciplined first pass, not a finished editorial judgment layer.

You still need manual review when:
- the source is nuanced
- the brief creates sharp prioritization decisions
- the strongest finding is not simply the highest-scoring sentence
- the top findings need consolidation
- multiple findings are near-duplicates
- caveats need better wording
- the source includes hidden credibility issues the script cannot infer

### Script-First, Judgment-Second Rule
Use the script to avoid mechanical mistakes.
Use judgment to avoid editorial mistakes.

## Stage 01: Study Notes

### Objective
Build a source memo that tells downstream agents exactly what kind of evidence they are working with and what risks travel with it.

### Output File
Write `01-study-notes.md` at `pitch-jobs/<slug>/01-study-notes.md`

### Required Sections
- `## Source Summary`
- `## Methodology`
- `## Caveats`
- `## Raw Observations`

Do not rename these sections casually if the project expects this structure.

### Stage 01 Section Guidance

#### `## Source Summary`
This section should orient a new agent quickly.

Capture:
- source name
- source URL if present
- source date if present
- source type (survey, dataset, ranking, report, article, etc.)
- campaign context from the brief
- rough source scope when that helps explain the material
- client name from brief
- target beats from brief
- target region from brief

This section should answer:
- What is this source?
- Where did it come from?
- Is it a survey, dataset, ranking, report, or something else?
- Is there enough context here to trust the rest of the notes?

**Example:**
```markdown
## Source Summary
- **Source Name:** America's Most Hostile Pedestrian States
- **Source URL:** https://plg-pllc.com/research/americas-most-hostile-pedestrian-states/
- **Source Date:** April 26, 2026
- **Source Type:** Research/Statistical Report
- **Campaign Context:** Pedestrian safety campaign for Premier Law Group (personal injury law firm)
- **Target Region:** US national with focus on Washington State/King County
- **Target Beats:** Public Safety, Data Journalism, State Politics, Local Government
- **Scope:** 2023 pedestrian fatality data across all US states
```

#### `## Methodology`
This section should capture how the source seems to have been produced.

Look for:
- who or what was measured
- sample size
- respondent or participant description
- timeframe
- geographic scope
- comparison range
- filtering logic
- ranking logic
- whether the source mentions weighting, averaging, scoring, or normalization
- data source (NHTSA, CDC, state DOT, etc.)

Use direct source language where possible.
If details are missing, say they are missing.

This section should distinguish between:
- explicit methodology stated by the source
- cautious inference based on source wording

Never blur those together.

**Example:**
```markdown
## Methodology
- **Data Source:** NHTSA Fatality Analysis Reporting System (FARS) for 2023
- **Timeframe:** Full calendar year 2023
- **Geographic Scope:** All 50 US states + DC
- **Metric:** Pedestrian fatalities per 100,000 residents (per-capita) and raw totals
- **Key Methodology Notes:**
  - Per-capita rates calculated using state population estimates
  - Rankings based on combination of raw totals and per-capita rates
  - Seasonal analysis by month
  - Alcohol involvement data from police reports
- **Limitations Noted:** None explicitly stated regarding data collection
```

#### `## Caveats`
This section should preserve the limits of the source.

Common caveat types:
- unclear methodology
- missing timeframe for specific finding
- limited generalizability
- source written for marketing rather than technical transparency
- likely correlation-only finding (not causation)
- outdated source timing
- unclear ranking criteria
- unclear sample construction
- internal data with uncertain external representativeness
- strong claim language without clear measurement backing

This section should help later agents avoid overclaiming.

**Example:**
```markdown
## Caveats
- **Causation Warning:** Report shows correlation between factors and fatalities, does not establish causation
- **Seasonal Variation:** Holiday season spike may have multiple contributing factors (weather, alcohol, visibility) - cannot isolate single cause
- **Underreporting:** Pedestrian fatality data may undercount incidents where pedestrians are not immediately identified
- **State Data Quality:** Some states may have more complete reporting than others - not all state data is equally reliable
- **Per-Capita Interpretation:** High per-capita rates in lower-population states may be influenced by small sample sizes
```

#### `## Raw Observations`
This is not the final ranking.
It is the short list of promising source-backed observations worth considering for Stage 02.

Good raw observations are:
- concrete (has specific numbers)
- distinct (different from each other)
- measurable (has a stat or comparison)
- source-backed (directly from the text)
- possibly angle-worthy (could become a pitch angle)

Bad raw observations are:
- repetitive restatements
- generic issue statements
- broad topic descriptions
- unsupported conclusions

Keep this section short and useful (10-20 observations maximum).

**Example:**
```markdown
## Raw Observations
1. 7,314 pedestrian fatalities in 2023 (17.9% of all traffic deaths)
2. December deadliest month: 741 deaths (10.1% of annual total)
3. Final three months account for ~30% of annual pedestrian deaths
4. New Mexico highest per-capita: 4.93 deaths per 100,000
5. Alcohol involved in 46% of fatal pedestrian crashes
6. SUVs/pickups increasingly involved in pedestrian deaths
7. King County (Seattle) 32% of Washington state pedestrian deaths
8. Weekend days (Fri-Sun) account for 46.8% of fatalities
9. Dark conditions majority of pedestrian deaths
10. Pedestrian share of traffic deaths increased from 13% (2010) to ~18% (2023)
```

### Stage 01 Quality Bar
Stage 01 is good only when:
- another agent can understand the source without reopening it immediately
- methodology notes make clear what is known and unknown
- caveats are visible
- observations are selective instead of bloated
- nothing sounds more confident than the source deserves

## Stage 02: Ranked Insights

### Objective
Turn the observation pool into a ranked list of findings that can support real editorial decisions.

### Output File
Write `02-insights.md` at `pitch-jobs/<slug>/02-insights.md`

### Required Format
Use a markdown table with these columns:

| Rank | Finding | Evidence | Why It Matters | Novelty Score | Caveat |
|------|---------|----------|----------------|---------------|---------|

### What Stage 02 Must Achieve
It must make these things obvious:
- which finding is strongest
- which findings are backup material
- why the ranking exists
- what each finding can safely support
- which caveats still travel with each finding

### What Counts As A Finding
A valid finding is usually one of the following:
- a numeric result (e.g., "7,314 deaths")
- a ranking position (e.g., "New Mexico #1")
- a clear contrast (e.g., "December vs June")
- a notable change over time (e.g., "13% to 18% increase")
- an extreme value (e.g., "highest month on record")
- a geographic difference (e.g., "King County 32% of state total")
- a demographic difference (e.g., "adults 21-44 highest alcohol involvement")
- a category gap (e.g., "SUVs now 19% of fatality vehicles")
- a pattern with credible supporting detail

A non-finding is usually:
- a generic theme (e.g., "pedestrian safety is important")
- a source topic statement (e.g., "this report examines pedestrian deaths")
- a broad issue description (e.g., "roads need to be safer")
- an unsupported interpretation (e.g., "this proves politicians don't care")
- a vague summary with no measurable hook (e.g., "many people died")

## Insight Selection Rules
Prefer findings that are:
- concrete (has specific number or comparison)
- differentiable from one another
- explainable in one line
- relevant to the campaign brief
- likely to matter to journalists
- resilient even after caveats are disclosed

Reject or down-rank findings that are:
- fuzzy (no specific number)
- redundant (similar to another finding)
- too dependent on hype wording
- impossible to localize when localization matters
- hard to explain cleanly
- technically present but editorially flat

## Ranking Framework
Rank findings based on a combination of:
- evidentiary strength (how solid is the data?)
- clarity (can this be explained in one sentence?)
- specificity (does it have numbers?)
- surprise (is this unexpected?)
- contrast (does it show a meaningful difference?)
- timeliness (is this currently relevant?)
- relevance to the target audience or beat
- ability to support an angle later

### Signals That Usually Increase Rank
- percentages
- concrete numbers
- superlatives such as highest or lowest when source-backed
- ranked comparisons
- before-versus-after change
- geographic specificity
- demographic specificity
- strong public-interest relevance
- a finding that helps explain why the campaign matters now
- local/state-level data when targeting local media

### Signals That Usually Lower Rank
- no numbers
- weak evidence chain
- broad restatement of the study topic
- nearly identical overlap with another better finding
- no obvious media or audience relevance
- heavy dependence on caveat language to remain accurate

## Press-Worthiness Rubric
Pressure-test each finding with these questions:

1. Could this become a headline or subheadline?
2. Does it contain a real datapoint or contrast?
3. Would a reporter understand it quickly?
4. Is it interesting without needing exaggerated language?
5. Can it survive a skeptical follow-up question?
6. Does it create a usable angle for a later stage?

If the answer is mostly no, the finding should not lead.

## Evidence Field Rules
The `Evidence` column should show the factual backbone of the finding.

Good evidence behavior:
- stays close to source language
- preserves the measurable element
- remains specific (includes numbers, dates, places)
- avoids unsupported explanatory leap

Bad evidence behavior:
- paraphrases so loosely that it becomes vague
- includes consequences not stated by the source
- sneaks in framing that belongs in `Why It Matters`

**Example:**
| Finding | Evidence |
|----------|-----------|
| 7,314 pedestrian deaths in 2023 | "7,314 were pedestrians: that's 17.9% or almost 1 in 5" from source |

## Why It Matters Rules
This column explains relevance, not proof.

It should answer:
- Why should a later stage care about this finding?
- Why might a journalist or reader care?
- What kind of angle could this support?

Good `Why It Matters` entries:
- connect the datapoint to local, national, consumer, policy, service, or industry relevance
- explain contrast or consequence carefully
- stay concise (1-2 sentences)

Bad `Why It Matters` entries:
- repeat the finding
- sound like marketing copy
- make unsupported causal or emotional claims

**Example:**
| Why It Matters |
|----------------|
| Creates immediate urgency for every traffic, safety, and city reporter. The 7,314 figure is concrete and easy to visualize, perfect for headlines and graphics. |

## Novelty Score Rules
Novelty scores should be directional, not theatrical.

Suggested interpretation:
- `9-10`: strong headline finding with clear editorial value
- `7-8`: strong supporting or alternate-angle finding
- `5-6`: usable but secondary
- `below 5`: usually too weak unless the source is very limited

Do not give a high novelty score simply because the campaign needs a winner.

## Finding-Level Caveat Rules
Every strong finding must remain accurate even with its caveat attached.

Use finding-level caveats to note:
- missing methodology verification
- limited source scope
- descriptive-only interpretation
- ranking uncertainty
- timing uncertainty
- internal-data limitations

If attaching the caveat makes the finding collapse entirely, the finding was not strong enough.

**Example:**
| Caveat |
|--------|
| Percentages based on reported fatalities; some states may undercount |

## Coverage Potential Thinking
While this is not the angle stage, the extractor should still notice which finding types are likely to travel well.

Findings often have stronger downstream potential when they offer:
- local relevance (county, city, state data)
- state-by-state comparison
- category winners and losers
- generational or demographic gaps
- a clear "most" or "least" framing
- a time-sensitive hook
- a strong service-journalism implication
- legal/accountability angles for law firm clients

Do not write the angle yet.
Just recognize which findings are most angle-capable.

## Handling Must-Use Findings From The Brief
Treat `Must-Use Findings` from the brief as priority review items, not automatic winners.

For each must-use finding:
- verify whether the source truly supports it
- assess whether it is actually strong enough
- include it only if support is real
- note tension if the brief wants it but the source underdelivers

Do not smuggle a weak brief preference into a high rank.

## Handling Weak Sources
If the source is weak, adapt the output honestly.

That may mean:
- fewer observations (5 instead of 20)
- fewer ranked findings (3 instead of 10)
- stronger caveat language
- explicit note that methodology is insufficiently transparent
- explicit note that the source may need additional support in Stage 03

Bad response to weak sources:
- padding with generic findings
- inflating wording
- pretending a thin source is rich

## Handling Dense Sources
If the source is dense or long:
- cluster similar findings
- remove duplicates
- separate headline findings from support findings
- prioritize clarity over exhaustiveness

Do not dump ten medium-strength stats into the ranked table when three strong findings and two backup findings would serve the workflow better.

## Example Output: 02-insights.md

```markdown
# Ranked Study Insights

| Rank | Finding | Evidence | Why It Matters | Novelty Score | Caveat |
|------|---------|----------|----------------|---------------|--------|
| 1 | 7,314 pedestrian deaths in 2023 (17.9% of all traffic fatalities) | "7,314 were pedestrians: that's 17.9% or almost 1 in 5" | Creates urgency for every traffic/safety reporter. Easy to visualize for headlines. | 9 | Based on NHTSA FARS data |
| 2 | December deadliest month: 741 deaths (10.1% of annual) | "December was the deadliest month of the year: 741 pedestrian fatalities represented 10.1%" | Seasonal hook for November/December coverage. Holiday travel + darkness + alcohol = predictable danger window | 9 | Single year data |
| 3 | New Mexico highest per-capita: 4.93 per 100K | Per-capita rankings show New Mexico at 4.93 | Clear state-by-state hook. Every state reporter can ask: where does my state rank? | 8 | Per-capita can be influenced by small populations |
| 4 | Alcohol in 46% of fatal pedestrian crashes | "46% of fatal pedestrian crashes involve alcohol impairment" | Challenges simple "distracted driver" narrative. Both drivers and pedestrians share responsibility | 8 | Not all states equally report alcohol involvement |
| 5 | King County (Seattle) 32% of WA state pedestrian deaths | "King County's 48 pedestrian deaths represent nearly a third of Washington state's total" | Strong local hook for Seattle/Bellevue media. ClientGeographic focus | 9 | Single county data |

## Top Finding Justification

The #1 ranked finding ("7,314 pedestrian deaths represent 17.9% of all traffic fatalities") is strongest because:
- It is the most concrete number in the source
- It creates the clearest headline hook
- It is verifiable from NHTSA data
- It connects to multiple downstream angles (policy, safety, urban planning)
- It works for both national and local media

## Findings Not Included

The following observations were considered but not ranked because:
- Too vague: "roads need to be safer" (no specific data)
- Too generic: "pedestrian safety is important" (not a finding)
- Unsupported: "this proves cities don't care" (not in source)
- Redundant: Similar to #1 but less specific
```

## Relationship Between Stage 01 And Stage 02
These files must support each other.

Check for alignment:
- `01-study-notes.md` caveats should still be reflected in `02-insights.md`
- top ranked findings should be visible in Stage 01 raw observations
- methodology notes should explain how the finding could exist
- a finding should not appear in Stage 02 if Stage 01 gives no evidence trail for it
- Novelty scores should reflect the ranking logic explained in Stage 01

## Manual Review Checklist
Before considering the work done, check:

1. Does the source summary tell a new agent what this source actually is?
2. Are methodology details separated from inference?
3. Are important caveats visible?
4. Are the raw observations selective and concrete?
5. Is the strongest finding clearly stronger than the others?
6. Are any two findings redundant?
7. Does any finding sound like pitch copy instead of source analysis?
8. Does any finding overclaim what the source proves?
9. Would Stage 03 (Research Enrichment) know what to pressure-test or support?
10. Would Stage 04 (Angle Generation) know which findings deserve angle generation?
11. Does the data flow correctly to the dashboard's DataContext?
12. Are extracted statistics visible in the dashboard UI?

## Failure Patterns To Catch
Stop and fix the output if you see:
- methodology guessed from vibes instead of text
- rankings that simply mirror source order
- all findings sounding equally important (no clear #1)
- evidence cells that are too vague to verify
- strong claims with no measurable backbone
- caveats missing from obviously incomplete sources
- generic societal statements passing as insights
- too many findings with only cosmetic wording differences
- a top finding that becomes weak once its caveat is acknowledged
- table entries that feel written for a pitch rather than for internal decision-making

## Resume And Overwrite Rules
Do not overwrite meaningful stage files casually.

Use `--force` or re-run extraction only when:
- the stage files are still placeholders
- the raw source changed materially
- the brief changed materially
- the current ranking is weak or misleading
- a previous draft was generated before important source additions were pasted in

Before overwriting, check:
- whether downstream stages already reference the current wording
- whether the source has actually changed
- whether a targeted cleanup is enough
- whether the current output is wrong or merely imperfect

## Interaction With Later Stages
This skill feeds:
- Stage 03: Research Enrichment (uses insights to guide additional research)
- Stage 04: Angle Generation (uses ranked findings to create pitch angles)
- Stage 05: Beat Matching (maps angles to journalist beats)
- Stage 06: Pitch Selection (human review of angles)

Later stages should be able to answer these questions just by reading your outputs:
- What does the source actually say?
- What kind of source is it?
- What are the risks in using it?
- Which finding should be explored first?
- Which findings are backup material?
- What outside support might be needed later?
- How does this connect to the campaign brief?

If those answers are fuzzy, the work is not ready.

## Dashboard Integration Notes

### Flow
1. User creates campaign at `/campaigns/create`
2. User uploads/pastes study to `raw-study-copy.md`
3. User navigates to `/data-extraction`
4. User clicks "Run Extraction"
5. API processes source and creates `02-insights.md`
6. Dashboard displays extracted data in structured format
7. User confirms data extraction
8. Workflow advances to Stage 03 (Research Enrichment)

### DataContext Usage
The dashboard's DataContext (`src/context/DataContext.tsx`) manages:
- `currentCampaign` - Active campaign
- `stages` - Workflow stage statuses
- `angles` - Extracted angles from Stage 4
- `pitchAngles` - Beat-matched angles from Stage 5
- `researchEnrichment` - Research data from Stage 3

The extracted insights should flow into the campaign's data structure and be available to downstream stages.

## Definition Of Done
This skill is done only when all of the following are true:

1. `01-study-notes.md` clearly explains the source, its methodology signals, its caveats, and its most relevant raw observations.
2. `02-insights.md` contains a real ranking rather than a loose list.
3. The top finding is supportable and clearly stronger than weaker findings below it.
4. Evidence fields remain close enough to the source to audit later.
5. Caveats are preserved at both the source level and finding level where needed.
6. No key claim depends on invented detail.
7. Another agent can continue the workflow without reopening chat for clarification.
8. The dashboard can display extracted data correctly.
9. Downstream stages have what they need to proceed.

## Final Standard
Leave behind stage files that are sharp, selective, transparent, and durable under scrutiny.

This skill should not beautify the source.
It should reveal the source accurately enough that the rest of the workflow can make better decisions.

## Operational Contract

- **Name:** study-insight-extractor
- **Purpose:** Convert raw study, report, or dataset material into accurate study notes and press-worthy insight rows.
- **Required input:** `00-brief.md` and `source-files/study-inputs/raw-study-copy.md`
- **Optional input:** Source URL, methodology notes, client caveats, geography, timeframe, user priorities
- **Execution process:** Read the source carefully, extract methodology, statistics, rankings, geography, dates, caveats, contradictions, and potential findings; separate facts from interpretations
- **Output:** `01-study-notes.md` and `02-insights.md`
- **Output format:** Source summary, methodology, extracted data points, caveats, insight table, claim limits, and recommended next research questions
- **Trigger condition:** Raw source material is present and not placeholder text
- **Stop condition:** Downstream agents can understand what the source proves, does not prove, and still needs verified
- **Failure condition:** Missing source material, copied placeholder text, unsupported interpretation, missing timeframe/geography, or hidden contradiction
- **Validation rule:** Each insight must include data point, meaning, source basis, limitation, and suggested angle value
- **Repair action:** Return to raw source, re-extract accurately, flag missing fields, or request source completion
- **Handoff rule:** Send validated study notes and insights to `research-enrichment-agent` (Stage 03)

## Anti-Hallucination And Assumption Control
Never invent journalist names, journalist emails, article titles, publication history, source names, statistics, rankings, survey results, methodology details, quotes, SERP findings, or Muck Rack results.

If required information is missing, unverifiable, blocked by access, or not present in the validated inputs, write exactly:

`Information unavailable. Verification required before use.`

Use beat-level assumptions only when they are clearly labeled as assumptions and never present them as journalist-specific facts. Do not convert search intent, SERP possibility, or Muck Rack workflow instructions into claimed results unless the result was actually captured and validated.