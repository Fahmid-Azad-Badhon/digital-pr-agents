# Journalist Intelligence

## Stage Contract
- Required Input: confirmed selection in `05-beats.md` and selected-angle collection evidence under `source-files/journalist-intel/`.
- Optional Input: Muck Rack exports, SERP notes, outlet-page notes, profile notes, public contact pages, manual review.
- Output: selected-angle journalist intelligence, contact status, beat fit, target scores, and limitations.
- Handoff: send with `07-journalist-coverage.md` to `pitch-writer`.
- Validation: all named journalists need source evidence; unavailable details must be marked `Information unavailable. Verification required before use.`
- Selected Angle Status: must match Stage 05 confirmed selection.
- Source Rule: do not import stale or cross-campaign captures.

## Stage Purpose
This file is the Stage 06 journalist targeting package.

It must prove which journalists should be considered for outreach for the single confirmed angle selected in `05-beats.md`.

This file does not write the pitch. It prepares the target list, contact status, qualification logic, and handoff notes that Stage 07 coverage review and Stage 08 pitch writing will use.

## Read Before Writing
- This file must be written after the Stage 05 selection gate is confirmed.
- Do not start from a blank media-list mindset. Start from the selected angle, selected beat, outlet scale, geography, and collection lane.
- The goal is not to collect the most journalists. The goal is to identify the most defensible journalists for this selected angle.
- Every row must be useful to the pitch writer or intentionally marked for review, hold, or exclusion.
- Do not include any target unless another agent can understand why that journalist belongs.
- If the evidence is weak, mark it weak. Do not hide uncertainty in confident language.

## Selected Outreach Angle
- Selection status from `05-beats.md`: [confirmed only]
- Selected priority number: [priority number]
- Angle: [Selected angle / pitch angle]
- Beat: [Selected journalist beat]
- Category: [Selected category]
- Outlet scale: [Selected outlet scale]
- Geography: [Selected geography]
- Collection lane: [Selected collection lane]
- Evidence support: [Evidence support to carry forward]
- Search start point: [Search start point]
- Selection note: [how/when the user confirmed this angle]

## Required Input Checklist
Complete this checklist before adding journalists.

- [ ] `05-beats.md` says exact `Selection status: confirmed`.
- [ ] `Selected angle / pitch angle` is filled.
- [ ] `Selected journalist beat` is filled.
- [ ] `Selected collection lane` is filled.
- [ ] `Evidence support to carry forward` is filled or its absence is noted.
- [ ] Search terms or starting query are available.
- [ ] Existing imported files were checked for campaign match.
- [ ] Stale or unrelated journalist files were rejected.
- [ ] The target geography and outlet scale are understood.

## Scope Lock
- Search is limited to this selected angle and selected beat only.
- Do not include journalists collected for secondary backlog angles.
- Do not include journalists from old campaigns unless they clearly match this selected angle, beat, geography, and outlet scale.
- Do not include a journalist only because the outlet is famous or broad-reach.
- Every journalist below must have a beat-fit reason tied to the selected angle.

## Automatic Stop Conditions
Stop and return to Stage 05 or the user if:
- `Selection status` is not exact `confirmed`.
- More than one angle appears selected.
- The selected beat is too vague to search.
- The selected geography contradicts the source evidence.
- The selected angle is not supported by Stage 04 or Stage 03.
- Muck Rack or SERP results are from an unrelated campaign.
- Existing imported data belongs to a different job, client, topic, or geography.
- No source can verify the journalist's beat, outlet, or current role.

## Collection Lane Execution
- Lane used: [Shortlist lane / Bulk Muck Rack lane / Hybrid lane]
- Why this lane was used:
- Collection started from:
- Collection date:
- Collection owner:
- Muck Rack access status:
- SERP access status:
- Outlet-page review status:
- Contact-source review status:
- Known collection limitations:

### Shortlist Lane Instructions
Use this lane when quality matters more than volume.

Required actions:
- Find a smaller group of high-fit journalists.
- Verify each journalist manually through profile, outlet page, author page, or recent coverage.
- Prioritize direct beat fit over outlet prestige.
- Capture contact availability honestly.
- Write a fit reason specific enough that the pitch writer can personalize without guessing.
- Exclude general assignment reporters when a specialist exists.

Minimum standard:
- At least 5 strong targets when available.
- Each target should have a clear beat reason.
- Tier 1 should contain only outreach-ready or near-ready targets.

### Bulk Muck Rack Lane Instructions
Use this lane when the selected beat can support scale and the user wants large-volume discovery.

Required actions:
- Build query files only for the selected angle and selected beat.
- Use multiple Boolean query passes when one query is too narrow.
- Dedupe profiles before tiering.
- Separate raw collection volume from outreach-ready targets.
- Do not treat `500 collected` as `500 ready to pitch`.
- Extract a smaller Tier 1/Tier 2 set before moving to Stage 07.

Minimum standard:
- Record the query file or export folder.
- Record whether combined CSV and deduped CSV were rebuilt.
- Record any shortfall or broad fallback query.
- Make clear which rows are raw discovery versus vetted targets.

### Hybrid Lane Instructions
Use this lane when broad discovery is needed first, followed by manual shortlist judgment.

Required actions:
- Use bulk discovery to find the journalist universe.
- Dedupe and remove obvious weak fits.
- Manually review the highest-fit subset.
- Move only qualified targets into Tier 1 or Tier 2.
- Keep questionable targets in Tier 3 or Weak Fits Excluded.

Minimum standard:
- The final table should not look like a raw export.
- Every Tier 1 target must have a human-readable fit reason.

## Search Inputs
- Selected angle: [Selected angle]
- Selected beat: [Selected journalist beat]
- Core topic terms:
- Beat terms:
- Geography terms:
- Outlet type filters:
- Boolean query or query family:
- SERP search phrases:
- Exclusion terms:
- Recency expectations:
- Search notes:

## Query Expansion Rules
Use controlled query expansion. Do not jump from narrow precision to irrelevant volume.

Start with:
- exact topic terms
- exact beat terms
- exact geography terms
- selected outlet scale

Then expand with:
- synonyms used by journalists
- related policy, consumer, safety, industry, or service terms
- county, metro, state, or regional names when relevant
- outlet-type phrases such as `local newspaper`, `statehouse`, `consumer reporter`, or `data journalist`

Avoid:
- unrelated national terms for a county angle
- lifestyle or features terms unless the selected angle truly fits
- broad `news reporter` searches when specialist beats exist
- old campaign names or previous-client search terms
- broad fallback queries without labeling them as fallback

## Journalist Inclusion Rules
A journalist can enter the target table only when at least one strong fit signal is present.

Strong fit signals:
- direct beat match
- recent article on the selected topic or adjacent topic
- repeated coverage of the same beat
- current role at a relevant outlet
- geography match
- data, service, accountability, consumer, public-safety, policy, industry, or local reporting pattern matching the angle
- a contact route that can be used honestly

Do not include a journalist based only on:
- outlet prestige
- one unrelated article
- a stale Muck Rack profile
- broad local coverage with no selected-beat connection
- an author page that no longer appears active
- a topic match that belongs to a different backlog angle

## Journalist Qualification Rubric
Use this rubric before adding any journalist to the main table.

Score each target from 1-10:
- `9-10`: direct selected-beat fit, recent relevant coverage, correct geography or outlet scale, usable contact route, strong personalization potential
- `7-8`: good selected-beat fit with one minor caveat, such as missing email or less recent coverage
- `5-6`: possible fit, but requires manual review before outreach
- `3-4`: weak fit; include only in exclusion or backup notes
- `1-2`: do not target

Score factors:
- Beat match:
- Selected-angle relevance:
- Outlet scale match:
- Geography match:
- Recent coverage strength:
- Contact availability:
- Personalization potential:
- Risk or caveat level:

## Priority Score Formula
Use this formula to keep scores consistent.

Start at `0`, then add:
- `+2` direct selected-beat match
- `+2` recent or repeated coverage relevant to the selected angle
- `+1` correct outlet scale
- `+1` correct geography
- `+1` usable direct email or clear contact route
- `+1` strong personalization hook
- `+1` evidence or data-story fit
- `+1` current role verified through profile, author page, or outlet page

Apply score caps:
- cap at `6` if no relevant recent coverage is available yet
- cap at `6` if contact route is completely missing
- cap at `5` if beat fit is only inferred from outlet type
- cap at `4` if the only fit is geography
- cap at `3` if the journalist belongs to a different selected-angle family
- cap at `2` if role, outlet, or profile appears stale

Never give `9-10` unless the journalist has direct beat fit, correct outlet scale, strong coverage evidence, and a usable contact route.

## Target Journalist Table
Keep the first 8 columns in this exact order for automation compatibility.

| Rank | Journalist | Outlet | Primary Beat | Email Status | Muck Rack Profile | Priority Score | Notes | Location / Market | Contact Route | Fit Reason | Coverage Evidence Status | Personalization Readiness | Risk / Caveat |
|------|------------|--------|--------------|--------------|-------------------|----------------|-------|-------------------|---------------|------------|--------------------------|---------------------------|---------------|
| 1 | [Journalist 1] | [Outlet] | [Primary beat] | [available: email / missing / newsroom email only] | [Profile URL] | [1-10] | [Why prioritized] | [city/state/national/trade] | [email/profile/contact page/newsroom] | [why this journalist fits selected angle] | [ready / partial / missing] | [ready / needs review / not ready] | [caveat] |

## Row Writing Instructions
Each row must be written so another agent can decide whether to pitch without reopening all sources.

`Notes` should include:
- why this journalist is prioritized
- the strongest fit signal
- the best next action

`Fit Reason` should answer:
- Why this journalist?
- Why this beat?
- Why this outlet scale?
- Why this selected angle?

`Risk / Caveat` should name:
- missing email
- weak coverage evidence
- stale profile risk
- geography mismatch
- outlet mismatch
- broad beat uncertainty
- need for manual verification

Do not put generic notes such as `good fit`, `relevant`, or `covers this topic` without explaining the evidence.

## Source Inventory
List every source used to build this file. If a source was checked but not useful, include it in the rejected or limited sources section.

### Used Sources
| Source Type | File / URL / Location | What It Provided | Reliability | Notes |
|-------------|-----------------------|------------------|-------------|-------|
| Muck Rack export | [file path or URL] | [profiles / beats / emails / outlets] | high/medium/low | [notes] |
| SERP result | [URL] | [author page / article / outlet page] | high/medium/low | [notes] |
| Outlet page | [URL] | [staff page / author archive / contact route] | high/medium/low | [notes] |

### Rejected Or Limited Sources
| Source | Reason Not Used / Limited | Follow-Up Needed |
|--------|---------------------------|------------------|
| VERIFIED_SOURCE_OR_CAPTURE | stale / wrong beat / old campaign / no contact data / unrelated angle | REQUIRED_FOLLOW_UP_ACTION |

## Source Reliability Standards
Rate source reliability honestly.

High reliability:
- current journalist profile
- outlet author page
- recent article byline page
- official staff page
- verified Muck Rack profile with current outlet and beat

Medium reliability:
- older profile that still appears plausible
- article history without current staff confirmation
- secondary media database profile with limited recency

Low reliability:
- old article with no current role confirmation
- scraped directory with no date
- broad search snippet only
- profile from a different campaign folder

Do not use low-reliability sources as the only reason for Tier 1.

## Priority Tiers
Group the table into action tiers after scoring.

### Tier 1: Outreach-Ready
- Criteria: score 8-10, clear beat fit, usable contact route, and enough coverage context for personalization.
- Journalists:
  - [name] - [reason]

### Tier 2: Review Before Outreach
- Criteria: score 5-7, useful fit but missing one important item such as contact route, recency, or coverage hook.
- Journalists:
  - [name] - [reason]

### Tier 3: Hold / Do Not Pitch Yet
- Criteria: score below 5, unclear beat fit, stale profile, wrong geography, or no usable personalization path.
- Journalists:
  - [name] - [reason]

## Contact Status Rules
Use honest contact language.

- `available: [email]` only when the email is visible or verified from an allowed source.
- `missing` when no direct email is available.
- `newsroom email only` when only a general newsroom or desk email is available.
- `contact form only` when only a form exists.
- `social/profile route only` when no email exists but a public professional route exists.
- Do not guess email patterns.
- Do not infer personal emails from outlet naming conventions.
- Do not mark an email available unless it was actually captured.

## Contact Verification Rules
Before marking a contact route usable:
- confirm the journalist name matches the profile or outlet page
- confirm the outlet matches the current target outlet
- confirm the contact route is public or from an approved tool/export
- distinguish personal email, newsroom email, contact form, and profile-only route
- avoid using old emails from stale exports unless reverified

When in doubt, mark `missing` or `needs verification`.

## Missing Email Log
| Journalist | Outlet | Missing Item | Best Available Contact Route | Follow-Up Needed |
|------------|--------|--------------|------------------------------|------------------|
| [Journalist] | [Outlet] | [direct email] | [profile / newsroom / contact form] | [manual lookup / leave missing / use newsroom] |

## Duplicate And Cleanup Log
Use this section to show dedupe decisions, especially after Muck Rack bulk collection.

| Duplicate / Weak Entry | Kept Or Removed | Reason | Final Target Kept |
|------------------------|-----------------|--------|-------------------|
| [name/profile] | kept/removed | [duplicate profile / stale outlet / wrong beat] | [final name/profile] |

## Weak Fits Excluded
List targets intentionally excluded so later agents do not re-add them.

| Journalist / Outlet / Source | Reason Excluded | Related But Wrong Angle? | Reconsider Later? |
|------------------------------|-----------------|--------------------------|-------------------|
| [name or outlet] | [wrong beat / old coverage / unrelated topic / no geography fit] | yes/no | yes/no |

## Manual Review Queue
Use this section for targets that may be useful but are not safe for outreach yet.

- [Journalist] - [what must be checked before moving to Tier 1 or Tier 2]
- [Journalist] - [missing source/contact/coverage item]

## Coverage Handoff To Stage 07
Stage 07 must collect or summarize coverage only for the selected-angle target list.

For each Tier 1 journalist, Stage 07 should capture:
- up to 10 recent relevant coverage items when available
- article title
- URL
- date if available
- topic fit
- takeaway
- personalization hook

Priority for Stage 07:
1. Tier 1 journalists with available direct email
2. Tier 1 journalists with strong coverage but missing email
3. Tier 2 journalists that may become usable after coverage review

Do not spend Stage 07 time on Tier 3 unless the user asks.

## Handoff Notes For Pitch Writer
- Primary outreach target:
- Backup outreach target:
- Best journalist beat to reference:
- Strongest personalization bridge:
- Contact caveat:
- Best subject-line direction:
- Best first sentence direction:
- Data point to lead with:
- Journalist-specific caution:
- Claims to avoid:
- Tone guidance:
- Suggested pitch style:
- Do not draft for any secondary backlog angle.

## Stage 08 Readiness Decision
- Ready for Stage 08: yes/no
- Reason:
- Minimum action needed before drafting:
- Targets safe to pitch now:
- Targets requiring Stage 07 coverage review first:
- Targets requiring manual contact verification first:

## Quality Assurance Check
- Selected Angle Confirmed: pass/fail -
- Single-Angle Scope: pass/fail -
- Beat Fit: pass/fail -
- Outlet Fit: pass/fail -
- Contact Honesty: pass/fail -
- Source Traceability: pass/fail -
- Source Reliability Labeled: pass/fail -
- Priority Scores Defensible: pass/fail -
- Duplicate Control: pass/fail -
- Weak Fits Removed: pass/fail -
- Manual Review Queue Clear: pass/fail -
- Tiering Complete: pass/fail -
- Coverage Handoff Ready: pass/fail -
- Pitch Handoff Ready: pass/fail -

## Definition Of Done
This file is complete only when:
1. It matches the confirmed selected angle in `05-beats.md`.
2. It contains only journalists relevant to that selected angle and beat.
3. Every included journalist has an honest contact status.
4. Every included journalist has a clear fit reason.
5. Weak fits and duplicates are removed or documented.
6. Tier 1 targets are clear enough for Stage 07 coverage review.
7. The pitch writer can understand who to pitch, why they fit, and what caveats must be respected.
## Performance And Scalability Protocol

Use this section when the selected-angle journalist collection produces 50, 100, or 800+ raw prospects.

| Batch | Raw Prospects | Deduped Prospects | Qualified Prospects | Outreach-Ready Prospects | Rejected Prospects | Main Rejection Reasons | Validation Status |
|---|---:|---:|---:|---:|---|---|---|

Rules:

- Batch 50 prospects into two groups of 25 before scoring.
- Batch 100 prospects into four groups of 25 before scoring.
- For 800 journalists per beat, do not place all raw rows into the final outreach list. First dedupe, then qualify, then rank.
- Dedupe by profile URL, email, name plus outlet, and outlet section.
- Keep raw collection volume separate from outreach-ready recommendations.
- Preserve selected angle, selected beat, geography, source evidence, score, caveat, and next action for every qualified record.
- Reject or downgrade any prospect with no beat-fit evidence, no relevant recent coverage, wrong geography, duplicate identity, stale role, or unverifiable contact path.
