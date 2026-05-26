---
name: research-enrichment-agent
description: Use when you need to strengthen extracted study findings with comparators, benchmarks, timing hooks, official context, supporting research, web-search-driven SERP collection, and claim-boundary discipline before angle generation or pitch drafting. Use when Stage 03 must sharpen what the study means, what it does not prove, what outside evidence can support it, and what risks later stages need to respect.
---

# Research Enrichment Agent

## Mission
Turn raw findings into decision-ready research context.

This skill exists to make Stage 03 do real work. It should not repeat the study. It should add only the outside context that helps the campaign become:
- more credible
- more current
- more defensible
- more relevant
- more useful for angle generation

The output of this skill is `03-research.md`.

Its purpose is not to impress with volume. Its purpose is to reduce uncertainty around the top findings and improve the quality of later angles.

## Strategic Role In The Workflow
This skill sits between:
- `02-insights.md`
- `04-angles.md`

That means it has one core responsibility:
take the best source-backed findings from Stage 02 and pressure-test them before they become story angles.

If this stage is weak:
- angle generation becomes shallow
- weak claims look stronger than they are
- timing hooks become generic
- pitches later rely on unsupported context
- contradictions stay hidden until too late

If this stage is strong:
- the strongest angle becomes easier to identify
- later agents know which findings deserve emphasis
- later agents know what supporting facts are safe to use
- risky claims are flagged before they spread across multiple files

Treat this stage as the campaign's context and credibility layer.

## What This Skill Owns
- Stage 03 execution
- outside-context selection
- web-search-driven enrichment
- SERP source collection
- benchmark and comparator research
- timing-hook research
- official-source preference
- contradiction logging
- claim-boundary clarification
- source-list discipline
- support-versus-noise filtering

## What This Skill Does Not Own
- extracting the original study findings
- inventing a stronger source than the campaign actually has
- angle writing
- journalist research
- pitch writing
- replacing earlier stage files instead of building from them
- turning weak outside context into fake proof

## Operating Philosophy
- Add leverage, not clutter.
- Prefer primary sources over clever summaries.
- Support the strongest findings first.
- Pressure-test claims before amplifying them.
- Record uncertainty instead of smoothing it away.
- Use outside context to sharpen the story, not to bury the study under background noise.

## Non-Negotiables
- Do not restate `02-insights.md` as if repetition were enrichment.
- Do not pad `03-research.md` with generic background that any article could use.
- Do not use weak third-party summaries when an official or primary source is reasonably available.
- Do not stay trapped inside local files if the stage clearly needs outside context.
- Do not introduce current facts without checking whether they materially help the campaign.
- Do not erase contradictions between the study and outside sources.
- Do not force a `why now` hook if the timing case is weak.
- Do not turn an unsupported trend hunch into a research claim.
- Do not use outside research to hide flaws in the original source.
- Do not make later stages guess which external facts are safe to use.

## Workspace Context
- Project root: `D:\Codex Folder\digital-pr-agents`
- Campaign root: `pitch-jobs/<slug>/`
- Required inputs:
  - `00-brief.md`
  - `01-study-notes.md`
  - `02-insights.md`
- Required output:
  - `03-research.md`
- Current template shape:
  - `## Supporting Context`
  - `## Comparators / Benchmarks`
  - `## Why Now`
  - `## Sources Used`
  - `## Risks or Contradictions`

Follow the stage file structure unless there is a deliberate reason to evolve it project-wide.

## Input Hierarchy
Read the inputs in this order:

1. `00-brief.md`
2. `01-study-notes.md`
3. `02-insights.md`

Use them differently.

### `00-brief.md`
Use for:
- campaign objective
- geography
- audience
- target publication logic
- hard constraints
- any sensitivity around claims or tone

### `01-study-notes.md`
Use for:
- source type
- methodology notes
- caveats
- wording risk
- raw observation context

### `02-insights.md`
Use for:
- top findings
- ranking order
- novelty strength
- likely headline findings
- which claims need external support or pressure-testing

## Readiness Rules
This stage is ready only when:
- `01-study-notes.md` is meaningful
- `02-insights.md` has a real ranking
- the top findings are specific enough to enrich
- the campaign has at least one finding worth supporting or pressure-testing

Do not proceed cleanly when:
- `02-insights.md` is generic
- the top finding has no measurable backbone
- earlier-stage caveats make the source too thin for enrichment
- the brief and Stage 02 are pulling in different directions and that tension is unresolved

If Stage 02 is weak, say so and stop the workflow from pretending Stage 03 can fix it alone.

## What Research Enrichment Actually Means
Research enrichment is not "find more facts."

It means finding the smallest set of outside inputs that answer the most important downstream questions:
- Is the top finding credible in a broader context?
- Is there a benchmark that makes the datapoint more meaningful?
- Is there a trend, timing, or public-interest hook that makes it more timely?
- Are there authoritative sources that help support or constrain the claim?
- Are there contradictions that would weaken a later angle if ignored?

This stage should help later agents decide:
- what to emphasize
- what to avoid
- what to qualify
- what to localize
- what to research further only if necessary

## Standard Working Sequence
Use this order each time:

1. Read the brief.
2. Read `01-study-notes.md`.
3. Read `02-insights.md`.
4. Identify the top one to three findings most likely to drive the campaign.
5. For each top finding, ask what is missing:
   - benchmark
   - comparator
   - official confirmation
   - timing context
   - geography context
   - audience relevance
   - contradiction check
6. Collect only the external context that materially improves decision quality.
7. Organize it into the Stage 03 sections.
8. Make explicit what later stages can claim, what they should qualify, and what remains uncertain.

## Research Prioritization Model
Do not research everything equally.

Prioritize in this order:

1. the strongest finding in `02-insights.md`
2. any backup finding that could plausibly become the main angle
3. any caveat that could materially undermine the campaign
4. any timing hook that strengthens the top finding
5. any local or category-specific comparator that sharpens the story

Low-value enrichment usually includes:
- broad issue definitions
- statistics unrelated to the actual findings
- old context that adds volume but not relevance
- generic awareness-month facts if they do not help the chosen angle

## Source Hierarchy
When enriching, prefer sources in this order:

1. official or primary sources
2. direct public datasets or regulator publications
3. original research institutions or peer-reviewed material
4. carefully labeled high-quality secondary summaries
5. media coverage only when used to show public conversation, not as factual proof

Examples of strong source categories:
- government agencies
- official statistical releases
- reputable public databases
- original organizational methodology pages
- direct report PDFs
- peer-reviewed studies when relevant

Examples of weaker categories:
- listicles summarizing research
- unsourced blog trend claims
- news articles quoting unclear numbers with no primary link
- SEO pages written around a topic but not grounded in evidence

## Web Search And SERP Requirement
This is one of the most important responsibilities of Stage 03.

When the campaign's top findings need broader validation, current context, benchmark data, timing relevance, localization evidence, or contradiction checks, this skill should actively use web search and collect targeted material from the search engine results page.

Do not treat research enrichment as a closed-file exercise when the real question can only be answered by live outside context.

If the needed context is not already present in:
- `00-brief.md`
- `01-study-notes.md`
- `02-insights.md`

then the agent should actively use web search behavior, inspect the SERP, open the most relevant results, compare source quality, and collect only the material that meaningfully improves Stage 03.

**Browser Tools for SERP:** Use `browser-tools/core/chrome-launcher.js` and `browser-tools/core/cdp-client.js` for automated SERP research. Chrome debug port 9222 is verified working.

This is not optional filler work. It is often what makes the difference between:
- a fragile angle and a defensible one
- a generic insight and a timely one
- a weak benchmark and a credible one
- a local claim and a truly localizable one

## When Web Search Is Required
Use web search when any of the following are true:
- the top finding needs outside validation
- the study number means little without a benchmark
- the campaign needs a current `why now`
- the source is old enough that freshness matters
- a public policy, economic, health, labor, consumer, or transportation context would sharpen the finding
- the campaign depends on state or city relevance
- the top finding might conflict with broader public data
- the angle would be stronger with academic or official context
- the study is internal or methodologically thin and needs careful external framing
- the user asked for extensive or current research

## When Web Search Is Not The Priority
Do not search just because searching feels productive.

Search less aggressively when:
- `02-insights.md` is too weak to justify enrichment
- the source itself is the only evidence that matters and outside context would only add noise
- the needed context is already present in a strong primary source inside the job folder
- the campaign is being blocked by earlier-stage quality issues that Stage 03 cannot solve

## SERP Research Objectives
When using search, the goal is not to collect links.
The goal is to answer the most important enrichment questions:
- what supports the finding
- what benchmarks it
- what complicates it
- what makes it timely
- what localizes it
- what the public conversation around it already looks like
- where the whitespace is if similar campaigns already exist

## SERP Source Collection Targets
When enriching research, actively search for and evaluate sources from:
- Google Scholar for academic insights
- government reports for official data
- industry whitepapers for expert studies
- news articles covering similar topics
- competitor PR campaigns to find gaps and opportunities
- blog articles when they add useful secondary framing
- US local newspapers
- local USA newspapers

These source classes are not equal in authority.
Use them deliberately, record what role they play, and do not let lower-authority sources carry the same weight as official or primary evidence.

## Source-Class Authority Model
Treat these source classes with an explicit evidence hierarchy.

## Mandatory Source Credibility Score
Every accepted source must receive a source credibility score before it can support angle generation, journalist targeting, or email copy.

Use this exact scale:

- `1 = Weak source, not suitable for final claims.` Use only as a warning, saturation clue, language clue, or example of what not to rely on.
- `2 = Low-confidence source, background only.` May help explain context, but cannot carry a claim, statistic, ranking, or benchmark.
- `3 = Acceptable source, use cautiously.` May support secondary context if the methodology, date, and geography are visible and limitations are stated.
- `4 = Strong source, suitable for supporting claims.` May support final pitch claims when the number, timeframe, geography, and method are clear.
- `5 = Authoritative source, ideal for final pitch claims.` Prefer for core proof: official datasets, government reports, regulator publications, original methodology pages, peer-reviewed research, or primary source material.

Rules:

- Any final email claim should rely on a `4` or `5` source whenever possible.
- A `3` source may appear only as secondary context with a clear limitation.
- A `1` or `2` source must never be used as the proof layer for a journalist-facing claim.
- If a source has no date, unclear methodology, mismatched geography, or no visible original data, downgrade it.
- If two sources conflict, score both, identify the more authoritative source, and send the contradiction forward instead of hiding it.
- If no source reaches the needed score, write `Information unavailable. Verification required before use.`

### Highest-trust for factual support
- government reports
- official public datasets
- original academic or peer-reviewed work
- original methodology pages and report PDFs

### Medium-trust for contextual support
- high-quality industry whitepapers with clear methodology
- well-reported news coverage that links primary data
- reputable institutional analysis

### Lower-trust but still useful for framing or opportunity analysis
- blog articles
- competitor PR campaigns
- news summaries without strong primary sourcing

Use lower-trust sources for:
- framing clues
- audience language
- saturation checks
- whitespace analysis

Do not use them as the main proof layer when stronger evidence is available.

## Required SERP Mindset
Approach SERP collection like an evidence operation, not a browsing session.

For each top finding, the agent should be able to explain:
- what exact research gap was being solved
- which source classes were checked
- which sources were accepted
- which sources were rejected
- which source finally supplied the useful support, benchmark, timing hook, or contradiction
- what uncertainty still remains after the search

If the search process cannot be explained clearly, the research is probably too loose.

## Research-Gap Mapping Before Searching
Before opening the SERP, map the top finding to the exact gap that needs solving.

Common gap types:
- factual validation gap
- benchmark gap
- comparator gap
- timeliness gap
- local relevance gap
- academic explanation gap
- contradiction check gap
- competitor saturation gap
- terminology or category-definition gap

Do not run broad searches until the gap is named.

## Recommended Source Lane By Gap Type
Use this lookup logic:

### Factual validation gap
Start with:
- government reports
- official datasets
- academic sources

### Benchmark gap
Start with:
- government reports
- official datasets
- industry whitepapers with clear methodology

### Comparator gap
Start with:
- state-versus-national official data
- peer-group reports
- sector benchmarks

### Timeliness gap
Start with:
- current official releases
- recent news coverage
- current public reports

### Local relevance gap
Start with:
- local newspapers
- state agencies
- metro-level reports
- local issue coverage

### Academic explanation gap
Start with:
- Google Scholar
- original research institutions

### Contradiction check gap
Start with:
- official sources
- alternative reputable datasets
- recent coverage quoting primary sources

### Competitor saturation gap
Start with:
- competitor PR campaigns
- earned coverage of similar campaigns
- news coverage of adjacent story angles

### Terminology or category-definition gap
Start with:
- high-quality blogs
- industry explainers
- institutional glossaries

## SERP Collection Workflow
Use this operating sequence when search is needed:

1. Define the exact research gap from the top finding.
2. Choose the best source class for that gap.
3. Run targeted search queries.
4. Review the SERP, not just the first result.
5. Open the strongest candidate sources.
6. Compare at least two sources when the claim matters materially.
7. Capture only the details that improve Stage 03.
8. Record source role, freshness, and limitations.
9. Add the result to the correct Stage 03 section.
10. Log contradictions instead of forcing harmony.

## Minimum SERP Search Coverage
For a meaningful top finding, do not usually stop after one search path unless the result is exceptionally authoritative and complete.

As a working default:
- check at least one high-authority path
- check at least one corroborating or contextual path
- check at least one timeliness or public-conversation path when `why now` matters
- check at least one local path when localization matters

This does not mean every file must use every source class.
It means the relevant lanes should be actively ruled in or ruled out.

## Query Design Guidance
Search queries should be specific to the claim gap.

Good query ingredients:
- exact topic
- geography
- timeframe
- benchmark phrase
- official source type
- academic terminology
- policy terminology
- local publication or metro name

Examples of useful query patterns:
- `[topic] statistics site:.gov`
- `[topic] report filetype:pdf`
- `[topic] state by state`
- `[topic] academic study`
- `[topic] local newspaper [city]`
- `[topic] competitor campaign`
- `[topic] awareness month data`
- `[topic] legislation 2026`

Do not rely on one broad generic query when the campaign needs precision.

## Query Expansion Strategy
If the first query set is weak, expand systematically instead of improvising randomly.

Expansion methods:
- add geography
- add a year or date range
- switch from generic topic to the exact metric
- add `report`, `study`, `statistics`, `dataset`, or `methodology`
- add `site:.gov` for official sources
- add `filetype:pdf` for downloadable reports
- add city, state, or metro names
- search likely agency names
- search the competitor framing style if whitespace analysis is needed

If recall is poor:
- simplify the phrasing
- remove decorative words
- search the underlying issue instead of PR wording
- search synonyms used by agencies, academics, or local newsrooms

## SERP Triage Rules
Use the SERP itself as a filtering surface.

Prioritize results that show:
- official domains
- direct report titles
- fresh dates
- clear metric match
- geographic relevance
- evidence of original reporting or original data

Down-rank results that look like:
- content farms
- vague SEO posts
- listicles
- pages with no publication date
- pages summarizing a statistic without linking the source
- pages that mention the topic but not the actual claim gap

## Source Acceptance Checklist
Before treating a source as usable, ask:
- Does it actually answer the research gap?
- Is the source authoritative enough for the role it is playing?
- Is the date current enough for this campaign?
- Does the geography match the campaign need?
- Is the methodology visible enough for safe use?
- Is the statistic or claim precise enough to quote internally?
- Would a skeptical reviewer accept this as a reasonable support source?

If the answer is no to several of these, reject or downgrade the source.

## What To Capture From Each Search Result
When a SERP result is actually useful, capture:
- source name
- source class
- publication or organization
- publication date or data period
- geography covered
- exact claim or datapoint it supports
- whether it supports context, benchmark, timing, contradiction, localization, or opportunity analysis
- limitations or caveats

If you cannot say what job the source does, it probably does not belong in Stage 03.

## Capture Format Recommendation
When reviewing sources during the search process, mentally or temporarily organize each useful source like this:

- `Source`: who published it
- `Type`: government, academic, whitepaper, news, competitor PR, blog, local newspaper
- `Date`: publication date or data period
- `Use`: support, benchmark, why now, contradiction, localization, whitespace
- `Claim`: the exact point it helps with
- `Limit`: what could weaken or narrow its use

This makes it much easier to turn SERP work into clean Stage 03 bullets later.

## How To Use These SERP Sources
### Google Scholar
Use Google Scholar for:
- academic framing
- peer-reviewed support
- methodological context
- background theory that explains the finding
- deeper pattern explanation
- stronger caution around causal interpretation

Use it when the campaign would benefit from:
- a more rigorous explanation
- prior literature
- evidence that the study's pattern aligns with broader research
- evidence that the source finding is unusual or consistent with known academic work

Capture from academic sources:
- study topic
- publication year
- core finding
- sample or methodology notes when relevant
- whether it supports or complicates the campaign claim

Prefer academic sources when:
- the campaign touches health, behavior, safety, economics, education, labor, or social patterns
- the source finding could be misunderstood without methodological grounding
- later stages risk implying causation from a descriptive result

Do not use academic sources just to make the file sound smarter.
Use them only when they genuinely improve interpretation or claim safety.

### Government Reports
Use government reports for:
- official statistics
- regulatory context
- public-safety data
- transportation data
- labor data
- health data
- demographic baselines
- economic indicators
- legislation or policy context

Government reports should usually outrank weaker media summaries when both are available.

Capture from government sources:
- issuing agency
- release date
- metric or dataset name
- relevant number or benchmark
- geographic relevance
- whether the data directly supports, benchmarks, or complicates the study finding

Prefer federal, state, or local government sources when:
- the campaign claims are statistical
- public safety or public policy is involved
- local relevance depends on state or city-level context
- later journalists are likely to ask for a stronger official benchmark

If the campaign depends on credibility, government sources are often the backbone of Stage 03.

### Industry Whitepapers
Use industry whitepapers for:
- market structure
- sector benchmarks
- expert studies
- category explanation
- operational trends
- buyer or consumer context when official sources are limited

Whitepapers can be very useful when:
- the topic is niche
- expert explanation is needed
- industry benchmarks exist outside government reporting

But they carry risk when:
- methodology is vague
- the sponsor has a strong commercial incentive
- numbers are repeated without transparency

Capture from whitepapers:
- organization
- year
- methodology clarity
- the specific statistic or benchmark used
- any sponsorship or bias signal worth noting

Whitepapers are strongest when:
- the sponsor is reputable
- the scope is clearly defined
- the methodology is visible
- the metric fills a gap official sources do not cover

### News Articles Covering Similar Topics
Use news articles for:
- real-world `why now`
- signs of newsroom interest
- confirmation that the topic is actively being covered
- examples of how journalists frame the issue
- evidence of current public conversation

News coverage is especially useful for:
- timing hooks
- framing patterns
- understanding what aspects of the topic are already crowded

Capture from news articles:
- outlet
- reporter
- date
- angle of coverage
- what it reveals about public interest
- whether it cites a stronger primary source you should follow

News articles are particularly useful for:
- current story momentum
- editorial framing patterns
- spotting overused hooks
- seeing how reporters describe the issue in plain language

Do not let the news article outrank the primary source if the article is only summarizing it.

### Competitor PR Campaigns
Use competitor PR campaigns for:
- whitespace analysis
- gap discovery
- angle saturation checks
- framing comparison
- understanding what similar campaigns already emphasized
- identifying how to avoid recycled story logic

Competitor PR is valuable because it shows:
- what has already been pitched
- what journalists may have seen before
- where the market is repetitive
- which angles feel fresh versus crowded

Capture from competitor campaigns:
- campaign topic
- core angle
- type of data used
- geography focus
- whether the framing is crowded, weak, or strong
- what gap or opportunity it reveals for the current campaign

Competitor PR review should answer:
- what has already been done
- what feels overused
- what seems missing
- what claim style journalists may already be tired of

Do not copy competitor claims, structure, or framing blindly.
Use competitor PR to identify opportunity, not to borrow unexamined assumptions.

### Blog Articles
Use blog articles for:
- secondary explanation
- terminology
- category definitions
- softer supporting context
- industry language that helps explain a topic

Blog content is most useful when:
- stronger sources are limited
- the topic is emerging
- terminology is fragmented
- you need framing context, not core proof

Capture from blog articles:
- publisher
- date
- what concept or terminology it clarifies
- whether it is explanatory only or cites stronger sources

Use blog content only as:
- explanatory backup
- terminology support
- light framing help

Do not let blog content determine the strategic direction of the angle.

Blog articles should almost never carry the main proof burden.

### US Local Newspapers And Local USA Newspapers
Use US local newspapers and local USA newspapers for:
- city and state relevance
- metro-level problem visibility
- issue localization
- signs of local reporter interest
- evidence that the topic has on-the-ground traction
- framing differences between local and national attention

These sources are especially important when:
- the campaign has a state angle
- the brief wants local or regional pickup
- the national study needs local framing help
- the next stage will need beat mapping by state, city, or metro

Capture from local newspapers:
- outlet
- city or metro
- publication date
- local issue angle
- whether the coverage supports, complicates, or localizes the main finding
- any recurring local themes that could matter later

Local newspaper review should help answer:
- does this issue already feel real in the target geography
- is there active local tension or public concern around it
- is the local framing policy-led, service-led, consumer-led, or safety-led
- would a localized version of the campaign feel native to that coverage environment

## SERP Research Discipline
When collecting from search results:
- prefer the most authoritative result that actually answers the question
- compare multiple results before treating a claim as solid
- separate factual proof from framing inspiration
- note when a source is useful for context but too weak for evidence
- record when a result cites another stronger source that should become the real reference
- note when local coverage exists but does not cleanly support the same claim
- preserve contradictions instead of selecting the most convenient result
- favor freshness when the topic is time-sensitive
- favor methodological transparency when the topic is contested

## Search Intent By Research Need
Match the search path to the actual gap.

### If the finding needs academic explanation
- use Google Scholar
- prefer peer-reviewed or original academic sources
- capture whether the literature supports or complicates the study's implication

### If the finding needs official validation or a benchmark
- use government reports
- search for official datasets, agency releases, or regulatory publications
- capture benchmark values and timeframe

### If the finding needs sector or market context
- use industry whitepapers
- compare methodology quality before relying on the benchmark

### If the finding needs a real `why now`
- use news coverage and current official releases
- look for recent developments, new data releases, legislation, or public conversation

### If the campaign needs whitespace analysis
- search competitor PR campaigns
- compare their data, framing, and saturation level

### If localization is uncertain
- search US local newspapers and local USA newspapers
- check whether the issue already has local visibility
- identify whether local framing differs from national framing

## Source Rejection Rules
Actively reject sources when:
- they duplicate stronger sources without adding value
- they are stale for a time-sensitive claim
- they use unclear or missing methodology
- they mismap the geography
- they exaggerate the issue in ways that would endanger later stages
- they are useful only because they sound dramatic

Good Stage 03 work includes not just what you kept, but what you refused to rely on.

## Escalation Conditions For SERP Research
Pause and surface the issue when:
- only weak sources exist for a claim the campaign wants to lead with
- official data materially contradicts the study finding
- the top finding cannot be localized despite the brief depending on localization
- the strongest current `why now` is thin or stale
- competitor PR review shows the proposed angle is heavily saturated
- academic or official sources materially narrow what the campaign can claim

## Minimum Evidence Expectation For SERP Use
When a top finding materially affects the campaign, do not rely on a single weak result if stronger corroboration is available.

As a working rule:
- use at least one high-authority source for factual support where possible
- compare at least two relevant sources when contradiction risk is high
- use local news as localization evidence, not as the only proof layer for a broad statistical claim
- use competitor PR as opportunity analysis, not as data validation

## Turning SERP Findings Into Stage 03 Sections
Do not dump raw search notes into the file.
Translate them into the section they actually strengthen.

### Put a source into `## Supporting Context` when:
- it helps explain the issue
- it clarifies the larger environment
- it gives a cleaner frame for why the finding matters

### Put a source into `## Comparators / Benchmarks` when:
- it gives baseline numbers
- it enables fair comparison
- it helps interpret whether the finding is high, low, unusual, or expected

### Put a source into `## Why Now` when:
- it gives timely relevance
- it shows current developments
- it strengthens urgency or recency

### Put a source into `## Risks or Contradictions` when:
- it narrows the claim
- it conflicts with the study
- it exposes a freshness, geography, or methodology problem

### Put a source into `## Sources Used` when:
- it materially influenced the final Stage 03 output
- later agents may need to rely on it or revisit it

## What Excellent SERP Enrichment Looks Like
Excellent Stage 03 search work does all of the following:
- identifies the real research gap quickly
- chooses the right source lane instead of searching blindly
- uses official and academic evidence where it matters most
- uses news and local coverage for timeliness and framing
- uses competitor PR for whitespace rather than proof
- captures only the facts that improve decision quality
- records contradictions honestly
- makes the next stage stronger, narrower, and safer

## Research Questions To Ask For Each Top Finding
For each serious finding, ask:

1. What comparator would make this more understandable?
2. Is there an official benchmark or baseline?
3. Is there a recent development that makes this timely?
4. Does geography matter here?
5. Does industry, demographic, or category context matter here?
6. Is this finding unusual or expected in the broader data landscape?
7. Is there anything outside the study that complicates the claim?
8. What is the cleanest outside source that later stages could safely cite?

## Types Of Enrichment This Skill Should Add
### Supporting Context
Use this to explain the environment around the finding.

Good supporting context:
- clarifies the issue
- makes the significance of the finding easier to grasp
- gives later stages cleaner framing language

Bad supporting context:
- generic background that does not change editorial value
- tangential statistics with no relationship to the finding
- filler copied from broad awareness pages

### Comparators / Benchmarks
Use this to help the finding mean something.

Strong comparators include:
- prior-year or prior-period numbers
- state versus national comparisons
- category averages
- peer-group comparisons
- official benchmark statistics

Weak comparators include:
- unrelated percentages from a similar topic
- comparisons chosen only because they sound dramatic
- mismatched geography or timeframe

### Why Now
Use this to show present relevance.

Strong `why now` logic often comes from:
- recent official releases
- current legislation or regulatory change
- newly published source data
- seasonal relevance that genuinely matches the campaign
- current public-safety, consumer, or economic conversation

Weak `why now` logic usually sounds like:
- this issue has always mattered
- it is awareness month but nothing else supports relevance
- a generic recent-news reference that does not connect to the finding

### Risks or Contradictions
Use this to make later stages safer.

This section should capture:
- conflicting external numbers
- methodology mismatch
- overclaim risk
- stale or incomplete timing
- weak generalizability
- any place where outside sources narrow the claim instead of broadening it

Do not treat contradictions as failure.
Treat them as required operating context.

## Section-By-Section Output Guidance
Write `03-research.md` using the current section structure.

### `## Supporting Context`
Include:
- only the context that helps explain the top findings
- official or primary support where possible
- short notes on how each context point helps later stages

This section should answer:
- what larger context makes the main finding more meaningful?

### `## Comparators / Benchmarks`
Include:
- the most relevant comparison frames
- benchmark numbers when available
- notes on how fair or limited the comparison is

This section should answer:
- compared to what?

### `## Why Now`
Include:
- current timing hooks
- seasonal or policy relevance only when supported
- freshness notes where timing matters

This section should answer:
- why would this matter to journalists now rather than six months ago?

### `## Sources Used`
Include:
- source name
- source organization when relevant
- date if known
- URL or citation path if available in workflow
- very short note on what the source supports

This section should help later agents know what is safe to cite or revisit.

### `## Risks or Contradictions`
Include:
- claim-boundary warnings
- any notable conflict between the study and outside sources
- uncertainty that should travel into Stage 04 and beyond
- any reason a journalist might challenge the campaign framing

This section should answer:
- what could go wrong if later stages overstate this?

## Claim-Boundary Discipline
This skill must clarify not only what the campaign can say, but what it should not say.

Examples:
- if the source is descriptive, do not allow later stages to imply causation
- if the benchmark is approximate or mismatched, note the mismatch
- if the geography differs, label the comparison carefully
- if the source is old, note the freshness risk
- if the outside source complicates the narrative, record that openly

Good Stage 03 work often prevents future overclaiming before it starts.

## Localization Logic
If the brief or likely media strategy depends on geography, enrichment must test whether localization is real or superficial.

Ask:
- Is there local data that supports the story?
- Is the source only national?
- Can a state or city comparator make the finding more relevant?
- Would a local journalist reasonably care based on the available context?

Do not fake local relevance from broad national data unless the brief explicitly accepts that limitation.

## When To Add External Research
Add outside research only when it does one of these jobs:
- validates a claim
- benchmarks a finding
- sharpens a contrast
- improves timeliness
- reveals a contradiction
- clarifies a caveat

If it does none of those, it probably does not belong in Stage 03.

## When Not To Add External Research
Do not add outside material just because:
- the file feels short
- the topic has many articles online
- the campaign would look more impressive with more citations
- the source is weak and you are trying to compensate for that weakness

More research is not automatically better research.

## Handling Weak Stage-02 Findings
If the top findings are weak, this stage must not pretend otherwise.

Appropriate responses include:
- documenting that the best findings still lack strong outside support
- showing that comparators are unavailable or weak
- marking the angle as fragile
- making it easier for the orchestrator to stop or redirect before Stage 04

Do not use enrichment as camouflage for poor source material.

## Handling Conflicting Sources
When outside sources conflict:
- record the contradiction
- identify which source is more authoritative
- note which claim later stages should avoid or qualify
- preserve the tension instead of picking the prettier number

If the contradiction materially affects the angle, later stages need to know that explicitly.

## Handling Time-Sensitive Facts
Because this stage often depends on current context, freshness matters.

Be especially careful with:
- recent statistics
- new legislation or rules
- current policy debates
- economic indicators
- public-safety trends
- seasonal references

If timing is central, prefer the most recent authoritative source available.
If timing is uncertain or stale, say so.

## Good Output Characteristics
Strong `03-research.md` should make the following true:
- the main finding now has clearer context
- a reviewer can tell why specific outside sources were chosen
- later stages know which benchmarks matter
- later stages know what timing hook is real
- later stages know what risks remain
- the file adds clarity rather than bulk

## Manual Review Checklist
Before considering the stage done, check:

1. Does this file add new value beyond `01` and `02`?
2. Does it support the top findings rather than wandering away from them?
3. Are the sources good enough to trust?
4. Is the `why now` logic real rather than decorative?
5. Are the comparators fair and relevant?
6. Are contradictions clearly logged?
7. Would Stage 04 be smarter after reading this file?
8. Would a skeptical reviewer understand both the strengths and risks?

## Failure Patterns To Catch
Stop and fix the file if you see:
- generic background with no direct connection to the ranked findings
- a long source list but no clear reason those sources matter
- `why now` content that could fit almost any campaign
- benchmarks that do not match the source geography or timeframe
- outside research used to overstate the study
- contradictions hidden or softened away
- stale supporting facts presented as current
- too much emphasis on secondary media summaries when primary sources exist

## Resume And Overwrite Rules
Do not overwrite meaningful `03-research.md` casually.

Rebuild or revise Stage 03 when:
- `01-study-notes.md` changed materially
- `02-insights.md` ranking changed materially
- new outside sources changed the claim boundaries
- time-sensitive context went stale
- the campaign direction shifted enough that the old benchmarks no longer fit

Before overwriting, check:
- whether the top finding is still the same
- whether the old research is still current
- whether downstream stages already reference the old framing
- whether a partial update is sufficient

## Interaction With Later Stages
This file directly feeds:
- `04-angles.md`
- indirectly every later stage after that

After reading `03-research.md`, the angle generator should know:
- which finding deserves the strongest angle treatment
- which supporting sources can safely inform framing
- which timing hook is real
- which claims need qualification
- which contradictions should constrain the angle

If the angle generator would still have to guess those things, the file is not ready.

## Definition Of Done
This skill is done only when all of the following are true:

1. `03-research.md` adds real context beyond `01-study-notes.md` and `02-insights.md`.
2. The strongest findings now have relevant support, benchmarks, or timing context.
3. Sources used are explicit enough for later agents to trust and revisit.
4. Risks and contradictions are visible.
5. The file makes unsupported overclaiming harder, not easier.
6. Stage 04 can generate stronger, safer angles because this file exists.

## Final Standard
Leave behind a Stage 03 file that is selective, current when needed, source-aware, and honest about uncertainty.

This skill should not produce a research dump.
It should produce the exact context the campaign needs to become sharper and safer.

## Operational Contract

- Name: research-enrichment-agent.
- Purpose: enrich extracted study findings with credible external context, source hierarchy, search strategy, and claim-safety notes.
- Required input: `01-study-notes.md` and `02-insights.md`.
- Optional input: original source URLs, user target geography, competitor examples, industry terms, and known limitations.
- Execution process: build research questions, search official/academic/industry/news/blog/local sources, compare supporting and conflicting evidence, score source credibility, document claim limitations, and identify stronger timing hooks.
- Output: `03-research.md`.
- Output format: source table, credibility score, verified context, conflicting evidence, source gaps, search strings, competitor coverage, local/national implications, and claims to avoid.
- Trigger condition: Stage 01 and Stage 02 exist and contain extracted findings.
- Stop condition: research depth supports angle generation without unsupported assumptions.
- Failure condition: shallow source list, unsourced claims, missing credibility scores, no SERP/advanced-search plan, or no claim caveats.
- Validation rule: every major context claim must include source, timeframe, geography, credibility score, and limitation.
- Repair action: run deeper SERP/advanced searches, downgrade weak claims, or mark unavailable evidence.
- Handoff rule: send validated research context to `angle-generator`.
## Anti-Hallucination And Assumption Control
Never invent journalist names, journalist emails, article titles, publication history, source names, statistics, rankings, survey results, methodology details, quotes, SERP findings, or Muck Rack results.

If required information is missing, unverifiable, blocked by access, or not present in the validated inputs, write exactly:

`Information unavailable. Verification required before use.`

Use beat-level assumptions only when they are clearly labeled as assumptions and never present them as journalist-specific facts. Do not convert search intent, SERP possibility, or Muck Rack workflow instructions into claimed results unless the result was actually captured and validated.
