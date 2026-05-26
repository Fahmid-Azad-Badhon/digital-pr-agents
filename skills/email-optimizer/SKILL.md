---
name: email-optimizer
description: Use when Stage 08 has produced a selected Digital PR pitch draft and the workflow must create one final optimized journalist outreach email for Stage 09, preserving the confirmed angle while applying advanced newsroom judgment, copywriting discipline, data-backed persuasion, subject-line optimization, ethical psychological triggers, claim safety, non-AI tone, and deterministic validation.
---

# Email Optimizer

## 1. Mission

The `email-optimizer` owns Stage 09 of the Digital PR workflow.

Its responsibility is to turn the selected Stage 08 pitch draft into one final outreach-ready journalist email.

This is the last major quality gate before the final package. Treat it as a senior editorial review and conversion pass, not a casual polish step.

**GPT-5.5 Integration:** GPT-5.5 serves as the final quality gate for email optimization. Minimum passing score is 8.5/10. All claims must be verified with source, timeframe, geography, and limitations documented.

The final email must make a busy journalist think:

"This is relevant to my beat, supported by real data, easy to verify, easy to turn into a story, and worth my attention now."

The agent must produce:

- one final optimized email
- at least five strong subject line options
- one recommended subject line
- a clear record of what changed during optimization
- proof that the selected angle did not drift
- proof that the final email is newsworthy, credible, human, and ready for outreach

The required output file is:

- `09-optimized-email.md`

Stage 09 must stop after producing and validating `09-optimized-email.md`. Do not move to Stage 10 unless the user explicitly continues or the workflow command requests the next stage.

## 2. Core Standard

The final email must be strong enough to survive the journalist inbox.

A world-class journalist pitch is not merely well written. It must be:

- immediately relevant to the journalist's beat
- based on a clear, publishable story
- supported by specific evidence
- easy to scan
- easy to verify
- easy to act on
- respectful of the journalist's time
- free from hype and fake urgency
- written in plain, confident human language

The email must not sound like:

- an AI-generated message
- a generic PR blast
- a marketing announcement
- a vague "new study" email
- a forced clever hook
- a manipulative persuasion attempt
- a client-first promotional note

If the email does not have a publishable story, style cannot save it.

## 3. Absolute Workflow Boundaries

The `email-optimizer` must not restart the campaign.

It must not:

- create new outreach angles
- draft all angles
- search Muck Rack
- search SERP for new journalists
- collect new media contacts
- write six new variants
- change the selected angle because another angle sounds stronger
- introduce new data that is not already verified in campaign files
- invent source names, journalist names, quotes, statistics, rankings, or dates
- claim a source is the latest unless the campaign evidence proves it
- claim causation unless the study design supports causation

It may:

- reframe the selected draft for clarity
- strengthen the subject line
- improve the first line
- compress evidence
- sharpen newsworthiness
- improve beat fit
- clarify the CTA
- remove AI-sounding phrases
- remove unsupported claims
- improve ethical persuasive force
- choose the strongest wording from the Stage 08 variants if they exist

Stage 09 optimizes the selected pitch. It does not create a new campaign.

## 4. Required Inputs

Read these files before writing Stage 09:

- `04-angles.md`
- `05-beats.md`
- `06-journalist-intel.md`
- `07-journalist-coverage.md`
- `08-pitch-draft.md`

Read these if they exist and are useful:

- `00-brief.md`
- `01-study-notes.md`
- `02-insights.md`
- `03-research.md`
- `source-files/*`
- `draft-variants/08a-straight-news.md`
- `draft-variants/08b-short-punchy.md`
- `draft-variants/08c-data-heavy.md`
- `draft-variants/08d-journalist-personalized.md`
- `draft-variants/08e-storytelling-narrative.md`
- `draft-variants/08f-localized.md`

The most important source is `08-pitch-draft.md`, because it contains the selected draft. The earlier files are used to verify that the selected draft is faithful, supported, and aligned with the chosen journalist beat.

## 5. Required Output

Create or rewrite:

- `09-optimized-email.md`

Use the project template:

- `templates/09-optimized-email.md`

Fill every section. Do not leave placeholders, bracketed instructions, yes/no alternatives, or unresolved notes.

The final output must contain:

- Stage 09 status
- source integrity check
- optimization pass log
- at least five final subject line options
- one recommended subject line
- final optimized email
- evidence included
- personalization used
- newsworthiness proof
- pitch angle alignment review
- ethical psychological trigger review
- inbox quality review
- claims to avoid
- Stage 10 handoff

## 6. Stage Gates

Before optimizing, complete the gates below.

If any gate fails, stop and report the exact blocker. Do not write a final email around a broken handoff.

### Gate 1: Confirmed Selected Angle

`05-beats.md` must confirm the selected angle.

Required signal:

- `Selection status: confirmed`

Blocked signals:

- `Selection status: pending`
- no selected angle
- multiple selected angles with no final choice
- beat and angle conflict
- selected geography unclear

If the selected angle is not confirmed, Stage 09 is blocked.

### Gate 2: Stage 08 Is Complete

`08-pitch-draft.md` must contain:

- selected variant
- selected outreach angle
- target journalist or target journalist type
- subject line options
- draft body
- evidence used
- newsworthiness and publication path
- ethical psychological trigger review
- inbox quality review
- Stage 09 handoff

If Stage 08 contains placeholders or a thin draft, Stage 09 is blocked until Stage 08 is repaired.

### Gate 3: Angle Consistency

The optimized email must match the selected angle in Stage 05 and Stage 08.

Check:

- angle
- beat
- category
- outlet scale
- geography
- collection lane
- evidence support
- target journalist or target type

If the optimized email would require a different angle, stop. Do not silently drift.

The final email must include a dedicated `Pitch Angle Alignment Review` section proving that:

- the opening hook reflects the selected angle
- the subject line reflects the selected angle
- the body thesis reflects the selected angle
- the analytical table supports the selected angle
- the evidence used belongs to the selected angle
- the CTA supports the selected angle
- no secondary backlog angle has entered the email
- the final email would still make sense if judged against the exact `05-beats.md` selected angle

### Angle Fingerprint Lock

Before optimizing, extract the angle fingerprint from `05-beats.md` and `08-pitch-draft.md`.

The fingerprint must include:

- selected pitch angle
- selected category
- selected journalist beat
- selected outlet scale
- selected geography
- selected collection lane
- primary finding
- strongest supporting data
- intended audience value
- promised asset or CTA
- claims to preserve
- claims to avoid

Use this fingerprint as the boundary for every optimization pass. The final email may become clearer, sharper, warmer, and more persuasive, but it must not become a different story.

Allowed optimization:

- sharpen the first line without changing the claim
- replace vague phrasing with exact data
- move the strongest evidence higher
- make the analytical table more useful
- remove weak or repetitive context
- make the CTA easier to answer
- make the tone more human

Forbidden optimization:

- changing the selected angle to a stronger but unapproved backlog angle
- adding a new geography that was not supported
- changing the beat to fit a better-sounding pitch
- using evidence from another category without explaining relevance
- making the client, brand, or campaign owner the hook
- removing caveats to make the pitch sound cleaner
- making the email shorter or longer than the 500-600 word body requirement

If the best final email requires a different angle, stop and return to the Stage 05 gate. Do not solve a weak angle by quietly rewriting the strategy.

### Gate 4: Journalist Intelligence And Coverage Support

`06-journalist-intel.md` and `07-journalist-coverage.md` must support the same beat and angle.

Check:

- target journalist fit
- outlet fit
- beat fit
- recent coverage relevance
- personalization basis
- coverage hook
- email availability or target-type fallback

If named journalist data is weak, write a target-type optimized email and say so in `09-optimized-email.md`.

### Gate 5: Evidence Traceability

Every factual claim in the optimized email must trace to a campaign file.

Trace:

- numbers
- rankings
- percentages
- survey results
- time periods
- city/county/state claims
- national comparisons
- source names
- dataset names
- trend language

If a claim cannot be traced, remove it or mark it unavailable. Do not guess.

### Gate 6: Outreach Readiness

The final email must be ready for a real journalist.

Required:

- no placeholders
- no fake urgency
- no unsupported superlatives
- no generic opening line
- no AI-sounding phrases
- no vague CTA
- no excessive background
- no multiple competing asks
- no claims that the final package cannot support

## 7. The Journalist Decision Model

Optimize for the way journalists actually triage pitches.

Most journalists decide quickly whether a pitch deserves attention. The email must pass this sequence:

1. Sender and subject: Does this look relevant or spammy?
2. First line: Is this actually for my beat?
3. Hook: Is there a clear story?
4. Evidence: Is the claim supported by real data?
5. Audience fit: Would my readers care?
6. Workload: Is this easy to verify and turn into a story?
7. Risk: Could this embarrass me if it is wrong?
8. CTA: Can I get what I need without wasting time?

If the pitch fails any of these checks, the email is likely ignored.

Stage 09 must reduce deletion risk at every step.

## 8. The Delete-Test Hierarchy

The final email must pass all delete tests.

### Subject Delete Test

The subject line must tell the journalist why the email matters.

Failing subjects:

- `Story idea`
- `New research`
- `Interesting data`
- `Quick question`
- `Important study`

Passing subjects:

- include a specific place, topic, data point, or audience consequence
- make the story clear without clickbait
- avoid vague "insights"
- avoid fake urgency

### First-Line Delete Test

The first meaningful sentence after greeting must show:

- why this journalist
- why this story
- why now or why local
- what the strongest finding is

If the first line could be sent to any journalist in any beat, rewrite it.

### Evidence Delete Test

The email must contain enough evidence to be credible.

It should include:

- one primary number or ranking
- one context point
- one source or dataset signal

If the pitch only says "new findings show" or "our study reveals" without specifics, rewrite it.

### Workload Delete Test

The journalist should know what assets are available.

Offer:

- full dataset
- methodology
- rankings table
- city/county/state breakdown
- quote or comment
- local table
- expert comment
- source notes

Do not force a call as the first next step.

## 9. Newsworthiness Standard

Newsworthiness is the first priority.

The final email must clearly satisfy at least three of the following:

- Timeliness: why the story matters now.
- Impact: who is affected and how materially.
- Proximity: why it matters to the journalist's audience.
- Magnitude: how large the number, gap, trend, ranking, or risk is.
- Novelty: what is surprising, overlooked, or counterintuitive.
- Tension: what contradiction, gap, policy issue, or reader concern exists.
- Human consequence: how the finding affects real people.
- Utility: what readers can learn, compare, avoid, or act on.
- Authority: why the data is credible.
- Continuity: how it connects to an ongoing conversation.

The strongest pitches usually combine:

- proximity
- data
- consequence
- timing

If newsworthiness is weak, do not hide it with clever language. Strengthen the editorial reason to publish.

## 10. Editorial Value Proposition

The final email must make the journalist's job easier.

It should give them:

- a clear possible headline
- a clear reader benefit
- a clear evidence trail
- a clear local or beat-specific connection
- a clear asset offer
- a clear way to verify claims

Ask this before finalizing:

"If I were the journalist, could I see the story within 10 seconds?"

If not, rewrite.

## 11. Advanced Pitch Framing

Choose the frame that best fits the selected angle and beat.

Use only one dominant frame. Do not mix too many frames in one email.

### Data Finding Frame

Use when the core value is a ranking, trend, percentage, comparison, or count.

Structure:

- lead with the strongest number
- explain why it matters
- offer dataset and methodology

### Local Consequence Frame

Use when the selected angle has city, county, state, or regional relevance.

Structure:

- name the place early
- show what changed or ranks unusually
- connect to readers' lived experience
- offer local table

### Accountability Gap Frame

Use when data reveals a mismatch between public promises, policy, spending, enforcement, safety, or outcomes.

Structure:

- show the mismatch
- avoid accusing anyone without evidence
- offer source notes and data

### Consumer Utility Frame

Use when readers can use the information to make choices.

Structure:

- identify the reader decision
- show the risk, cost, or comparison
- offer practical breakdown

### Trend Reversal Frame

Use when the finding runs against expectation.

Structure:

- name the expected pattern
- show the surprising change
- explain why it may be worth coverage

### Seasonal Or Timely Frame

Use when the angle connects to a real calendar moment, policy cycle, release, holiday, weather pattern, school season, travel season, safety season, or deadline.

Structure:

- name the timing
- show the data relevance
- offer assets fast

## 12. Subject Line Optimization

Create at least five subject line options.

The best subject line should be specific enough that a journalist understands the pitch before opening it.

Subject line rules:

- 5 to 11 words is ideal.
- One idea per subject.
- Use a number when the number is strong.
- Use a place when the place matters.
- Use a beat noun when the beat is specific.
- Avoid hype.
- Avoid vague "study" language unless the finding follows immediately.
- Avoid all caps.
- Avoid excessive punctuation.
- Avoid "exclusive" unless there is a real exclusive arrangement.
- Avoid "embargo" unless an embargo actually exists.

Strong patterns:

- `New data: [specific finding] in [place]`
- `[Place] ranks No. [rank] for [issue]`
- `[County] sees [percentage] rise in [topic]`
- `[Audience] face [specific cost/risk], data shows`
- `[Beat topic]: [specific local finding]`
- `[State/city] outpaces national trend on [issue]`

Subject line scoring:

| Criterion | Question |
|---|---|
| Clarity | Can the story be understood without opening? |
| Specificity | Does it include a concrete noun, place, number, or outcome? |
| Beat fit | Does it sound relevant to the journalist's coverage? |
| Curiosity | Does it raise a useful question without clickbait? |
| Credibility | Does it sound evidence-based, not promotional? |
| Brevity | Can it be scanned instantly? |

Recommended subject line must be the best balance of specificity, news value, and inbox readability.

## 13. Opening Line Optimization

The opening line is the most important sentence in the email.

It must do at least three jobs:

- prove the pitch is relevant to the journalist
- state or imply the news hook
- include or lead into the strongest evidence
- show local, beat, or audience fit
- create a reason to keep reading

Good opening patterns:

- `Since you cover [beat/topic], this [place/data] finding may be a useful follow-up: [specific finding].`
- `[Place] stands out in our new analysis of [topic]: [specific result].`
- `For [beat] reporters, the strongest hook is [specific finding] affecting [audience].`
- `A new [dataset/source] analysis found [specific result], giving [place/audience] a timely [beat] angle.`

Bad opening patterns:

- `I hope you're well.`
- `I wanted to reach out.`
- `Thought this might interest you.`
- `We are excited to share.`
- `In today's rapidly changing world.`

If the first line does not contain a real reason to keep reading, rewrite it.

## 14. Evidence And Data Discipline

The final email must be data-backed but not overloaded.

Use the best evidence, not all evidence.

Ideal evidence mix:

- one primary statistic
- one supporting comparison
- one source or methodology signal

Evidence types:

- percentage
- ranking
- count
- rate
- year-over-year change
- city/county/state comparison
- national comparison
- survey result
- official data point
- study sample size
- credible source name

Every number must be traceable.

Do not use:

- unverified rankings
- unsupported "highest" or "worst" claims
- old data presented as latest
- correlation written as causation
- vague source language
- inflated "crisis" language

When evidence is strong, place it high. When evidence is nuanced, preserve the caveat.

## 14A. Analytical Table Preservation

Stage 08 requires an analytical table inside the email body. Stage 09 must preserve, tighten, or improve that table rather than deleting it.

The optimized email body must include one compact Markdown analytical table.

The table must:

- sit inside `## Final Email`
- translate evidence into journalist value
- contain 3-5 useful rows
- support the selected pitch angle
- avoid unrelated data
- avoid raw spreadsheet dumping
- avoid unsupported interpretation

Recommended table:

```markdown
| Analytical Point | Data / Evidence | Why It Matters For Coverage |
|---|---|---|
| [Finding] | [Verified data/source] | [Journalist value] |
| [Comparison] | [Verified data/source] | [Story implication] |
| [Reader impact] | [Verified data/source] | [Audience relevance] |
```

If the Stage 08 table is weak, repair it. Do not remove it.

### Analytical Table Upgrade Rules

The Stage 09 table must be sharper than the Stage 08 table whenever possible.

Upgrade the table by checking each row:

1. **Finding row:** does it show the strongest publishable result?
2. **Comparison row:** does it show the ranking, gap, trend, benchmark, local difference, county difference, or state/national contrast?
3. **Audience row:** does it explain why the journalist's readers should care?
4. **Method row:** if needed, does it clarify source, scope, denominator, date range, or limitation?
5. **Asset row:** if useful, does it point to the dataset, local breakdown, methodology, quote, map, chart, or table that can be shared?

The final table must not be decorative. It should act like a mini assignment desk note: the journalist should be able to glance at it and understand the story path, evidence base, and reader value.

Reject the table if:

- the right column only repeats "this matters"
- the evidence column has no numbers, source names, rankings, or caveats
- the rows mix multiple unrelated angles
- the table is longer than the surrounding email can support
- the table creates claims that are not stated or supported elsewhere in the email
- the table is written like a report table instead of a journalist utility table

## 15. Beat Alignment

The final email must sound like it belongs in the target journalist's world.

Before writing, identify the beat's editorial currency:

| Beat | What Usually Matters |
|---|---|
| Local news | proximity, residents affected, local officials, public services, reader utility |
| County news | county rankings, service gaps, courts, roads, budgets, local residents |
| State news | state ranking, policy, agencies, statewide impact, regional contrast |
| National news | broad trend, national scale, surprising pattern, authoritative source |
| Business | market pressure, costs, demand, consumer behavior, regulation, competition |
| Consumer finance | household cost, financial risk, savings, debt, insurance, affordability |
| Legal | liability, regulation, litigation, consumer rights, public safety, compliance |
| Health | population impact, evidence caution, risk factors, medical limits, public guidance |
| Education | students, parents, districts, budgets, outcomes, policy, equity |
| Real estate | affordability, migration, inventory, rent, mortgage, neighborhood impact |
| Travel | safety, costs, seasonality, destinations, consumer planning |
| Auto/transportation | safety, infrastructure, driver behavior, crash data, regulation |
| Lifestyle | behavior, family, culture, seasonal hooks, practical utility |

The final email should use the language of the beat without jargon.

## 16. Personalization

Personalization must be factual and useful.

Use `07-journalist-coverage.md` to identify:

- recent article topic
- recurring beat
- geographic focus
- audience segment
- format preference
- recurring data interest
- prior local issue

Good personalization:

- specific
- tied to coverage
- brief
- useful to the pitch
- not flattering

Bad personalization:

- fake praise
- exaggerated familiarity
- vague "big fan"
- generic "your readers"
- irrelevant article mention
- long paragraph about the journalist

If no reliable personalization exists, use target-type relevance:

- `For reporters covering [beat], the strongest hook is...`

Do not invent a personalization hook.

## 17. Ethical Psychological Trigger Layer

Use persuasion ethically.

The journalist should feel:

- the story is relevant
- the evidence is credible
- the angle is timely
- the work required is low
- the asset offer is useful

The journalist should not feel:

- pressured
- manipulated
- flattered into action
- threatened with missing out
- pushed into publishing

Allowed triggers:

- Curiosity: a specific unresolved question or surprising comparison.
- Specificity: exact numbers, places, dates, or audience groups.
- Relevance: beat, outlet, local, or audience fit.
- Timeliness: real news cycle, season, policy moment, release, or trend.
- Utility: dataset, methodology, rankings, quote, local table.
- Consequence: concrete reader impact.
- Authority: credible source or transparent methodology.
- Novelty: genuinely unexpected finding.
- Cognitive ease: simple framing and low workload.

Disallowed triggers:

- fake urgency
- fake scarcity
- false exclusivity
- fearmongering
- guilt
- shame
- pressure
- manipulative flattery
- "everyone is talking about this"
- "you cannot afford to ignore this"
- "your readers will love this"

The final file must include an ethical trigger review that names the triggers used and why they are supported.

## 18. Human Voice And Non-AI Writing

The email should sound like a sharp human PR professional who respects journalists.

Use:

- plain English
- concrete nouns
- short sentences
- active verbs
- exact numbers
- real places
- calm confidence
- one clean ask

Avoid:

- generic openers
- inflated adjectives
- vague transitions
- robotic politeness
- repetitive sentence rhythm
- unnecessary lists inside the email body
- over-explaining
- "delve"
- "leverage"
- "unlock"
- "robust"
- "seamless"
- "landscape"
- "pivotal"
- "crucial"
- "game-changing"
- "groundbreaking"
- "sheds light"
- "underscores"
- "in today's world"

A strong email should not sound like it is trying to be impressive. It should sound useful.

## 19. CTA Standard

The CTA must lower friction.

A journalist should be able to respond with a simple yes.

Strong CTA examples:

- `Happy to send the full dataset and methodology.`
- `I can share the county table and source notes if useful.`
- `Would the full rankings and a short comment be useful?`
- `I can send the local breakdown and methodology.`
- `Happy to share the state-by-state table and a quote.`

Weak CTA examples:

- `Let me know if interested.`
- `Please cover this.`
- `Can we schedule a call?`
- `Would you be willing to write about this?`
- `Please let me know your thoughts.`

The CTA should offer assets, not demand time.

## 20. Deliverability And Preview Discipline

The email must be written for the actual inbox, not only for the document.

Check how the email will appear before it is opened:

- sender name should be human or recognizable
- subject line should not look automated
- first preview words should contain a real hook
- first line should not waste preview space on filler
- email should not depend on images
- email should not depend on attachments
- email should not include unnecessary links
- email should not use all caps
- email should not use excessive punctuation
- email should not use hype words that look like spam

Default rule:

- the email body should work as plain text

Do not include more than one link in the final email unless the campaign specifically requires it.

Avoid:

- "exclusive opportunity"
- "limited time"
- "urgent"
- "act now"
- "you won't believe"
- excessive exclamation marks
- full URLs pasted without context
- attachment-heavy asks

The final `Inbox Quality Review` must confirm:

- preview text strength
- mobile scan readability
- deliverability risk

If the preview text is weak, rewrite the first line.

If the email looks spammy, simplify it.

## 21. Outlet-Tier And Journalist-Type Adaptation

The same angle must be framed differently depending on outlet scale and journalist type.

Use `05-beats.md`, `06-journalist-intel.md`, and `07-journalist-coverage.md` to infer the target type.

### Local Reporter

Prioritize:

- local consequence
- named place
- residents affected
- city/county/state comparison
- practical reader angle
- local table or map

Avoid:

- national framing that buries the local hook
- broad policy language without local effect

### National Reporter

Prioritize:

- scale
- trend
- national relevance
- surprising comparison
- authoritative methodology
- local breakdown availability

Avoid:

- overly narrow locality unless it proves a broader pattern

### Trade Or Industry Reporter

Prioritize:

- market consequence
- operational impact
- regulation
- cost
- demand
- competitive implications
- expert or methodology support

Avoid:

- consumer-only framing if the beat is industry-facing

### Data Journalist

Prioritize:

- dataset clarity
- methodology
- downloadable table
- reproducibility
- rankings
- caveats

Avoid:

- vague "study" language without source transparency

### Columnist Or Analysis Writer

Prioritize:

- tension
- contradiction
- public implication
- human consequence
- clear interpretation boundary

Avoid:

- overclaiming
- flattening nuance

The final email should sound customized to the outlet type without pretending to know more than the files prove.

## 22. Asset Readiness

A pitch becomes more publishable when the journalist can see what they can use immediately.

Before finalizing, identify the asset stack.

Possible assets:

- full dataset
- methodology
- rankings table
- city table
- county table
- state table
- national comparison
- source notes
- quote
- expert comment
- image
- map
- chart
- short summary
- raw source file

The email should offer the most useful one or two assets, not a shopping list.

Match asset to journalist need:

| Journalist Need | Best Asset |
|---|---|
| verify claim | methodology and source notes |
| localize story | city/county/state table |
| build quick article | short comment and top finding |
| compare places | ranking table |
| support chart | clean dataset |
| add authority | source notes and methodology |

If the final email promises an asset, Stage 10 must include or reference it.

Do not promise:

- quote
- interview
- map
- visual
- raw data
- exclusive access
- embargo

unless that asset is actually available.

## 23. Red-Team Editorial Review

Before finalizing, attack the email like a skeptical editor.

Ask:

- What would make a journalist delete this?
- What claim would they doubt first?
- What data point is not clear enough?
- What sounds promotional?
- What sounds like AI?
- What feels too convenient?
- What would require too much work?
- What could be challenged by an editor?
- What would make the outlet avoid the story?
- What is the easiest improvement that would raise publishability?

Then fix the email.

The final `Inbox Quality Review` must include:

- red-team objection
- fix applied

If the red-team objection cannot be fixed with available evidence, mark Stage 09 blocked or lower the publishability score.

## 24. Claim Safety

The final email must be publish-safe.

Avoid:

- `proves`
- `guarantees`
- `causes`
- `the worst`
- `the best`
- `record high`
- `crisis`
- `all Americans`
- `everyone`
- `latest`
- `never before seen`
- `first ever`

Use only if verified:

- `No. 1`
- `highest`
- `lowest`
- `record`
- `latest`
- `exclusive`
- `embargo`
- `caused by`

Safer language:

- `found`
- `shows`
- `suggests`
- `ranked`
- `reported`
- `based on`
- `according to`
- `among the areas analyzed`
- `in the dataset`

If a claim is attractive but unsafe, cut it.

## 25. Geographic Framing

Match the geography from the selected angle.

### City

Use city name early.

Include:

- city result
- reader relevance
- local comparison if available
- city table or local data offer

### County

Use county name early.

Include:

- county-level result
- local residents or systems affected
- county comparison
- county breakdown offer

### State

Use state name early.

Include:

- state ranking or trend
- national average or neighboring-state comparison if available
- state table offer

### National

Use national trend early.

Include:

- broad scale
- high-level finding
- state or local breakdown offer

### Industry

Use the industry category early.

Include:

- business or market consequence
- cost, demand, risk, or regulation
- industry table or expert comment offer

## 26. Optimization Pass Sequence

Run every pass in order.

Log meaningful changes in `09-optimized-email.md`.

### Pass 0: Source Integrity Audit

Identify:

- selected Stage 08 variant
- selected angle
- selected beat
- target journalist or target type
- strongest evidence
- weak evidence
- claims to remove
- caveats to preserve

Do not rewrite until this audit is complete.

### Pass 1: Newsworthiness Elevation

Ask:

- What is the story?
- Why now?
- Why this journalist?
- Why this audience?
- What is the strongest data point?
- What headline could this become?

Rewrite the hook until the news value is visible immediately.

### Pass 2: Subject Line Build

Create at least five subjects using different approaches:

- data-led
- local or geographic
- beat-specific
- consequence-led
- curiosity-without-clickbait

Select one recommended subject.

### Pass 3: Opening Line Rewrite

Rewrite the first line until it passes the deletion test.

It must not be generic.

It should include:

- beat relevance
- selected geography or audience
- primary finding or story value

### Pass 4: Evidence Compression

Keep the evidence that carries the story.

Remove:

- extra numbers that distract
- methodology details that belong in the offered asset
- repeated facts
- claims without source support

### Pass 5: Beat And Personalization Fit

Adjust the language for the beat.

Verify:

- no wrong beat vocabulary
- no irrelevant personalization
- no overfamiliar tone
- no target mismatch

### Pass 6: Ethical Trigger Tuning

Add legitimate persuasive force.

Use:

- specificity
- consequence
- novelty
- utility
- timing
- proximity

Remove:

- pressure
- fake urgency
- hype
- fear without evidence

### Pass 7: Human Tone And AI-Issue Removal

Run a prose cleanup pass.

Remove:

- AI-sounding phrases
- PR filler
- inflated wording
- repetitive rhythm
- unnecessary throat-clearing

Make the email sound direct, calm, and useful.

### Pass 8: Brevity, Deliverability, And Friction Removal

Cut anything that slows action.

Check:

- Can the email be scanned in 20 seconds?
- Is there one clear ask?
- Is the asset offer obvious?
- Are there too many claims?
- Is the signoff clean?
- Does the inbox preview show the hook?
- Does the email read cleanly on mobile?
- Does anything look spammy?
- Is there more than one link?

### Pass 9: Red-Team Editorial Review

Stress-test the final email.

Check:

- strongest likely journalist objection
- weakest claim
- weak source language
- overclaiming risk
- wrong outlet-tier framing
- missing asset promise
- excessive workload

Fix the email before scoring.

### Pass 10: Pitch Angle Alignment Lock

Before scoring, prove the final email is aligned with the confirmed selected angle.

Check:

- opening line matches the selected angle
- analytical table supports the selected angle
- subject line reflects the selected angle
- CTA offers assets relevant to the selected angle
- no secondary backlog angle is introduced
- no unrelated beat language appears

If alignment is weak, revise before scoring.

### Pass 11: Final Publishability Scoring

Score the final email.

| Criterion | Weight |
|---|---:|
| Newsworthiness and publication path | 25 |
| Data strength and analytical table utility | 20 |
| Pitch angle alignment | 15 |
| Beat fit and journalist relevance | 10 |
| Opening strength | 10 |
| Subject line strength | 5 |
| Human tone | 10 |
| CTA clarity | 5 |

Minimum passing score:

- 85/100

If the score is below 85, revise and rescore.

Also score the final email on the mandatory `1-10` world-class email rubric:

- Hook strength
- Clarity
- Specificity
- Data framing
- Psychological trigger
- Journalist relevance
- Human tone
- Credibility
- Brevity
- Flow
- CTA strength
- Newsworthiness
- Originality
- Non-salesy tone
- Inbox readability
- Editorial usefulness

Minimum passing average: `8.5/10`.

If the average is below `8.5/10`, rewrite and rescore. If any critical category is below `8`, revise that weakness before outreach even when the average looks acceptable.

Automatic non-passing conditions, even if the score appears high:

- final email body is under 500 words or over 600 words
- final email body does not include an analytical table
- final email drifts from the selected angle
- final email has no clear publication path
- the strongest claim is not supported by evidence
- psychological pull depends on pressure, fear, false scarcity, or fake flattery
- the email sounds AI-written, promotional, or generic
- the CTA asks for too much effort

When scoring, write the short reason for each score. Do not use the score as decoration.

## 27. Final Email Architecture

Default structure:

1. Greeting.
2. First line with beat relevance and hook.
3. Primary data-backed finding.
4. Context sentence that makes the finding credible.
5. Compact analytical table.
6. Why it matters to the journalist's audience.
7. Timing, consequence, or utility sentence.
8. Low-friction asset offer.
9. Brief signoff.

Do not add long background unless absolutely necessary.

Keep the email body usually between:

- 500 and 600 words

Acceptable exceptions:

- none unless the user explicitly changes the requirement

The 500-600 word count includes greeting, analytical table, CTA, and signoff. A 499-word final email fails. A 601-word final email fails.

## 28. Final Output Structure

Use this exact section order:

1. `# Optimized Email`
2. `## Stage 09 Status`
3. `## Source Integrity Check`
4. `## Optimization Pass Log`
5. `## Final Subject Line Options`
6. `## Recommended Subject Line`
7. `## Final Email`
8. `## Evidence Included`
9. `## Personalization Used`
10. `## Newsworthiness Proof`
11. `## Pitch Angle Alignment Review`
12. `## Ethical Psychological Trigger Review`
13. `## Inbox Quality Review`
14. `## Claims To Avoid`
15. `## Stage 10 Handoff`

Do not change the section names unless the project template and audit script are updated together.

## 29. Required Section Instructions

### Stage 09 Status

Include:

- source draft
- selected angle
- selected beat
- target journalist or target type
- optimization status
- publishability score

The score must be numeric and at least 85.

### Source Integrity Check

Explain:

- which Stage 08 variant was used
- which claims were preserved
- which claims were tightened
- which claims were removed
- which caveats were carried forward
- whether the angle drift check passed

This section proves the agent did not invent or drift.

### Optimization Pass Log

Document Pass 0 through Pass 11.

Each pass note must say what changed or what was confirmed.

Do not write empty notes like "optimized language."

### Final Subject Line Options

Provide at least five usable subject lines.

Each should be:

- specific
- beat-relevant
- not clickbait
- not promotional
- not too long

### Recommended Subject Line

Choose the best subject and explain why.

The explanation must mention the actual strength:

- specific data
- local relevance
- beat fit
- clarity
- urgency from real timing
- audience consequence

### Final Email

Write the final outreach email.

It must include:

- greeting
- strong first line
- data-backed hook
- compact analytical table
- audience relevance
- low-friction CTA
- signoff

### Evidence Included

List:

- primary data point
- supporting data point
- source or dataset
- methodology or limitation note if needed

### Personalization Used

Explain:

- what personalization was used
- why it matters
- whether over-personalization risk is low, medium, or high

### Newsworthiness Proof

Fill:

- timeliness
- impact
- proximity
- novelty or tension
- publication path

### Pitch Angle Alignment Review

Fill:

- selected angle:
- subject line alignment:
- opening hook alignment:
- body thesis alignment:
- analytical table alignment:
- evidence alignment:
- CTA alignment:
- drift risk:
- final alignment decision:

Every item must prove the final email still serves the confirmed pitch angle.

### Ethical Psychological Trigger Review

Fill:

- triggers used
- why they are evidence-backed
- pressure or manipulation risk
- final trigger safety decision

### Inbox Quality Review

Fill:

- ten-second deletion test
- first-line strength
- subject-line strength
- data density check
- non-AI writing check
- CTA clarity
- preview text strength
- mobile scan readability
- deliverability risk
- red-team objection
- fix applied
- final publishability decision

Every item should pass before completion.

### Claims To Avoid

List claims the next stages must not accidentally add.

Examples:

- unsupported rankings
- causal claims
- fake latest-data claims
- exaggerated danger language
- false exclusivity

### Stage 10 Handoff

State:

- ready for final packaging: yes or no
- recommended subject line for package
- final email version
- assets to include
- remaining caveats

If the final email is not ready, Stage 10 must not start.

## 30. Mandatory Final Checks

Before calling Stage 09 complete, verify:

- `09-optimized-email.md` exists.
- The selected angle is preserved.
- The selected beat is preserved.
- All required sections exist.
- No bracket placeholders remain.
- No unresolved yes/no alternatives remain.
- At least five subject lines exist.
- One recommended subject line exists.
- Final email includes at least one numeric data point.
- Final email is 500-600 words.
- Final email includes an analytical table inside the email body.
- Final email includes a low-friction CTA.
- Final email has a complete pitch angle alignment review.
- Subject line, opening hook, body thesis, analytical table, evidence, and CTA align with the selected angle.
- Final email does not depend on attachments or images.
- Final email does not include unnecessary links.
- Preview text is strong.
- Mobile scan readability passes.
- Deliverability risk is low.
- Asset promises are realistic.
- Outlet-tier framing is correct.
- Red-team objection is documented and fixed.
- Final email avoids banned AI and PR phrases.
- Final email avoids fake pressure.
- Newsworthiness proof is complete.
- Ethical trigger review is complete.
- Inbox quality review is complete.
- Claims to avoid are listed.
- Publishability score is at least 85.
- Stage 10 handoff is marked ready only if the email actually passes.

## 31. Deterministic Audit

After writing Stage 09, run:

```powershell
& 'C:\Users\fahmi\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' '.\skills\email-optimizer\scripts\audit_optimized_email.py' '.\pitch-jobs\<job-name>'
```

Then run:

```powershell
.\scripts\validate-stage.cmd <job-name> 09-optimized-email.md
```

Both checks must pass.

If either fails:

1. Read the error.
2. Fix `09-optimized-email.md`.
3. Rerun the audit.
4. Rerun `validate-stage`.
5. Repeat until both pass.

The deterministic audit is a floor, not the ceiling. A file can pass structure checks and still be mediocre. The agent must also apply editorial judgment.

## 32. Human Review Questions

Before finalizing, answer these mentally:

- Would a journalist know the story within 10 seconds?
- Is the first line impossible to confuse with a mass pitch?
- Is the strongest evidence above the fold?
- Is the beat fit obvious?
- Is the CTA easy to say yes to?
- Does the email avoid sounding like a press release?
- Does it respect the journalist's intelligence?
- Can every claim be defended?
- Would the final package support everything promised?
- Does the first inbox preview contain the story rather than a greeting?
- Would this email still work on a phone?
- Is the asset offer real and useful?
- Did the red-team pass improve the email?
- Would I be comfortable sending this to a real journalist?

If any answer is no, revise.

## 33. Failure Modes

Reject or revise the email if it has any of these problems:

- generic opening
- vague subject line
- no clear data point
- no publication path
- no real audience relevance
- unsupported claim
- artificial urgency
- hype language
- client-first framing
- too much background
- too many asks
- weak CTA
- beat mismatch
- local angle buried too low
- methodology overexplained in body
- personalization that sounds fake
- weak preview text
- spam-looking subject line
- overpromised asset
- outlet-tier mismatch
- missing red-team fix
- phrase could be sent to any journalist
- "let me know if interested" as the only ask

## 34. Completion Report

When Stage 09 is complete, report:

- path to `09-optimized-email.md`
- selected angle preserved
- recommended subject line
- publishability score
- deterministic audit result
- `validate-stage` result
- whether Stage 10 can start

## 35. Definition Of Done

Stage 09 is complete only when:

- the selected Stage 08 draft has been optimized into one final email
- the chosen angle has not drifted
- the final email is newsworthy before it is clever
- the first line passes the deletion test
- the subject line set is strong and specific
- the recommended subject is clearly justified
- the final email includes real data
- the evidence is traceable
- the beat fit is obvious
- the outlet-tier framing is correct
- the personalization is accurate or safely target-type based
- the CTA is low-friction
- asset promises are real and useful
- preview text is strong
- mobile scan readability passes
- deliverability risk is low
- red-team objection is documented and fixed
- the tone is human and non-AI-sounding
- psychological triggers are ethical and evidence-backed
- unsupported claims are removed
- claims to avoid are documented
- `09-optimized-email.md` is fully filled
- the final email body is 500-600 words
- the final email body includes an analytical table
- the table improves or preserves the Stage 08 evidence value
- the pitch angle alignment review passes
- the recommended subject line, first line, body thesis, table, evidence, and CTA all match the selected angle
- the deterministic audit passes
- `validate-stage.cmd <job-name> 09-optimized-email.md` passes
- the agent stops and waits for Stage 10 or user direction

## Operational Contract

- Name: email-optimizer.
- Purpose: turn the strongest Stage 08 draft into a final, newsworthy, human, beat-aligned, inbox-safe outreach email.
- Required input: `08-pitch-draft.md`, selected-angle fields from `05-beats.md`, journalist intelligence from `06` and `07`, and source context.
- Optional input: user style preference, quote availability, local data, subject line preference, and deliverability constraints.
- Execution process: preserve the selected angle, improve the hook, strengthen data framing, align the analytical table, remove hype, tune ethical psychological triggers, optimize CTA, create subject options, and run deterministic audit.
- Output: `09-optimized-email.md`.
- Output format: subject options, recommended subject, 500-600 word final email with analytical table in the body, source notes, angle-alignment review, deliverability review, ethical trigger review, and repair notes.
- Trigger condition: Stage 08 exists and contains a selected-angle draft.
- Stop condition: audit passes and Stage 09 is ready for final packaging.
- Failure condition: angle drift, missing table, weak newsworthiness, unsupported claim, robotic tone, spam risk, under/over word count, or fake personalization.
- Validation rule: `audit_optimized_email.py` and `validate-stage.cmd <job-name> 09-optimized-email.md` must pass.
- Repair action: rewrite the failed section, return to Stage 08 or earlier if evidence is missing, then rerun validation.
- Handoff rule: send only a validated Stage 09 package to `final-doc-packager`.
## Anti-Hallucination And Assumption Control
Never invent journalist names, journalist emails, article titles, publication history, source names, statistics, rankings, survey results, methodology details, quotes, SERP findings, or Muck Rack results.

If required information is missing, unverifiable, blocked by access, or not present in the validated inputs, write exactly:

`Information unavailable. Verification required before use.`

Use beat-level assumptions only when they are clearly labeled as assumptions and never present them as journalist-specific facts. Do not convert search intent, SERP possibility, or Muck Rack workflow instructions into claimed results unless the result was actually captured and validated.
