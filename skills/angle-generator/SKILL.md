---
name: angle-generator
description: Use when you need to turn validated study findings and supporting research into 40 ranked, journalist-usable Digital PR story angles. Use when Stage 04 must convert `02-insights.md` and `03-research.md` into 20 strategic categories with 2 unique pitch angles per category, journalist beat mapping, headline-style pitch framing, SERP-aware newsworthiness, data-rich justification, GPT-5.5 scoring readiness, outreach talking points, and risk-aware story strategy before beat matching and pitch writing.
---

# Angle Generator

## Mission
Turn evidence-backed findings into ranked Digital PR pitch angles that journalists could realistically understand, care about, and consider covering.

This skill owns Stage 04 of the Digital PR workflow. Its output is `04-angles.md`.

Stage 04 must do more than list ideas. It must produce a structured set of pitchable, newsworthy, beat-aligned story angles that can move directly into beat matching, journalist research, and email drafting.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Core Output Requirement](#core-output-requirement)
3. [Phase 1: Preparation & Evidence Assessment](#phase-1-preparation--evidence-assessment)
4. [Phase 2: Category Selection Strategy](#phase-2-category-selection-strategy)
5. [Phase 3: Angle Generation Engine](#phase-3-angle-generation-engine)
6. [Phase 4: Newsworthiness Justification](#phase-4-newsworthiness-justification)
7. [Phase 5: Quality Assurance & Scoring](#phase-5-quality-assurance--scoring)
8. [Phase 6: Final Output Assembly](#phase-6-final-output-assembly)
9. [Angle Type Reference Library](#angle-type-reference-library)
10. [Beat Mapping Matrix](#beat-mapping-matrix)
11. [Scoring Rubrics](#scoring-rubrics)
12. [Failure Patterns & Fixes](#failure-patterns--fixes)
13. [Downstream Stage Integration](#downstream-stage-integration)

---

## Executive Summary

| Property | Value |
|----------|-------|
| **Stage** | 04 |
| **Output File** | `04-angles.md` |
| **Total Angles** | 40 (20 categories × 2 angles) |
| **Primary Model** | Hy3 Preview |
| **Quality Gate** | GPT-5.5 Thinking |
| **Input Files** | `00-brief.md`, `02-insights.md`, `03-research.md` |
| **Output Format** | Structured table + detailed justifications |
| **Completion Criteria** | 12 mandatory checks pass |

### The 40-20-2 Formula
```
20 Categories × 2 Unique Angles = 40 Total Pitch Angles
```

Each category must produce **two meaningfully different** angles that could each stand alone as a valid pitch direction.

---

## Core Output Requirement

Produce **40 pitch angles across 20 strategic categories** (2 angles per category).

The new Stage 04 generates a large, research-backed pool of journalist-ready pitch angles before GPT-5.5 scoring and user selection.

### Required Output Structure

```markdown
# Pitch Angles

| # | Category | Journalist Beats | Pitch Angle | Why This is Newsworthy | Score | Selected |
|---|----------|-----------------|-------------|----------------------|-------|----------|
| 1 | Data-Led | data journalist, investigative reporter | [Hook]: [Insight] | [Summary] | ___/10 | [ ] |

## Category And Beat Coverage Check
- [Category]: 2 angles mapped to [beats]

## Newsworthiness Justifications

### Angle 1 - [Pitch Angle]
Data-Rich Justification: [250-300 words]
Research Support: [sources]
Market Context: [implications]
Media Value: [why it matters]
Talking Points:
- [point 1]
- [point 2]
- [point 3]
- [point 4]
- [point 5]

## Quality Assurance Check
- Conversation Relevance: pass/fail
- Newsworthiness: pass/fail
- Data Foundation: pass/fail
- Beat Alignment: pass/fail
- Outreach Readiness: pass/fail
- SERP Support: pass/fail/not needed
- Two Angles Per Beat: pass/fail
```

---

## Phase 1: Preparation & Evidence Assessment

### Step 1.1: Evidence Audit

Before writing any angles, complete this audit:

```
┌─────────────────────────────────────────────────────────────────┐
│                    EVIDENCE AUDIT CHECKLIST                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ INPUT FILE STATUS:                                              │
│ □ 00-brief.md exists and contains:                             │
│   - Campaign goal                                               │
│   - Target geography                                            │
│   - Desired publication types                                   │
│   - Hard constraints                                            │
│                                                                 │
│ □ 02-insights.md exists and contains:                          │
│   - Minimum 5 ranked findings                                   │
│   - Quantifiable data points                                    │
│   - Evidence strength scores                                     │
│   - Caveats and limitations                                      │
│                                                                 │
│ □ 03-research.md exists and contains:                           │
│   - Supporting context                                          │
│   - Benchmarks or comparators                                   │
│   - Source credibility scores (1-5)                             │
│   - "Why Now" timing hooks                                      │
│   - Risks or contradictions                                     │
│                                                                 │
│ EVIDENCE SUFFICIENCY:                                           │
│ □ Top 3 findings have external support                          │
│ □ At least one finding has timing relevance                     │
│ □ Geographic framing is supported (or clearly limited)          │
│ □ No critical contradictions that invalidate main angles        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step 1.2: Input File Hierarchy Usage

Read and process inputs in this exact order:

#### 00-brief.md - Campaign Blueprint
Use for:
- **Goal**: What the client wants to achieve
- **Geography**: Local, county, state, national targeting
- **Audience**: Who the story should reach
- **Publications**: Desired outlet types
- **Constraints**: What claims to avoid
- **Tone**: Professional, urgent, educational, etc.

#### 02-insights.md - Core Evidence
Use for:
- **Ranked findings**: Ordered by strength (1 is strongest)
- **Data backbone**: Specific numbers, percentages, comparisons
- **Novelty score**: How unique the finding is
- **Finding-specific caveats**: What to avoid for each point
- **Strongest data point**: The single most compelling metric

#### 03-research.md - Context Layer
Use for:
- **Supporting context**: External validation
- **Benchmarks**: How the finding compares to external data
- **Timing hooks**: Why this matters now
- **Source quality**: What can/cannot be claimed
- **Risks**: What could go wrong if overused
- **Contradictions**: Where external data conflicts with study

### Step 1.3: Evidence Gap Analysis

After reading inputs, complete this gap analysis:

```
┌─────────────────────────────────────────────────────────────────┐
│                     EVIDENCE GAP ANALYSIS                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ FINDING 1: [Strongest finding from 02-insights.md]             │
│ ├─ Internal Support: [strength/weakness]                        │
│ ├─ External Support: [from 03-research.md]                     │
│ ├─ Timing Relevance: [yes/no/uncertain]                        │
│ ├─ Geographic Support: [local/county/state/national]           │
│ └─ Gap: [what additional evidence is needed]                    │
│                                                                 │
│ FINDING 2: [Second strongest]                                   │
│ └─ [Repeat structure]                                           │
│                                                                 │
│ FINDING 3: [Third strongest]                                    │
│ └─ [Repeat structure]                                           │
│                                                                 │
│ SERP NEEDED:                                                    │
│ □ Yes - Gap: [what needs search]                                 │
│ □ No - Evidence is sufficient                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

If gaps exist, **go to SERP before generating angles**. Weak evidence = weak angles.

---

## Phase 2: Category Selection Strategy

### Step 2.1: Category Selection Criteria

Select categories based on evidence fit, not diversity quotas.

**Valid Selection Criteria:**
- At least one finding naturally belongs in this category
- The beat has clear reader/audience relevance
- The angle can be explained without forcing relevance
- The category can support two genuinely different pitch angles

**Invalid Selection Criteria:**
- Only one weak idea exists
- Requires unsupported claims
- Audience relevance is unclear
- Topic feels unnatural for the mapped beat

### Step 2.2: Category Scoring Matrix

Score each potential category:

```
┌─────────────────────────────────────────────────────────────────┐
│                   CATEGORY SCORING MATRIX                       │
├──────────────┬──────┬──────┬──────┬──────┬────────┬───────────┤
│ Category     │ Evid. │ Beat │ Angle │ Angle │ Total  │ Selected │
│              │ Fit   │ Fit  │ A Fit │ B Fit │ Score  │          │
├──────────────┼──────┼──────┼──────┼──────┼────────┼───────────┤
│ Data-Led     │  9    │  8   │  8    │  7    │  32    │   ✓      │
│ Trend Story  │  7    │  9   │  6    │  8    │  30    │   ✓      │
│ Human        │  8    │  7   │  7    │  6    │  28    │   ✗      │
│ Interest     │      │      │       │       │        │          │
└──────────────┴──────┴──────┴──────┴──────┴────────┴───────────┘

Scoring: 1-10 scale
- Evidence Fit: How well findings support this category
- Beat Fit: How naturally it maps to journalist beats
- Angle A Fit: How well primary angle fits evidence
- Angle B Fit: How well backup angle differs from A
```

### Step 2.3: 20 Strategic Categories

Select exactly 20 from this master list based on evidence:

| # | Category | Best When Evidence Shows |
|---|----------|--------------------------|
| 1 | Data-Led | Quantifiable metrics, rankings, statistics |
| 2 | Trend Story | Movement over time, increasing/decreasing patterns |
| 3 | Expert Quote | Industry authority, professional consensus |
| 4 | Investigative | Hidden problems, uncovered issues |
| 5 | Human Interest | Individual stories, personal impact |
| 6 | Tech Innovation | New technology, digital transformation |
| 7 | Health & Wellness | Medical, health, wellbeing angles |
| 8 | Finance & Business | Money, costs, economic impact |
| 9 | Environment | Climate, sustainability, nature |
| 10 | Education | Schools, learning, training |
| 11 | Politics & Policy | Government, legislation, regulation |
| 12 | Science & Research | Studies, discovery, innovation |
| 13 | Lifestyle & Culture | Cultural trends, behavior changes |
| 14 | Crime & Safety | Safety, security, legal issues |
| 15 | Sports | Athletics, competition, health |
| 16 | Entertainment | Arts, media, celebrities |
| 17 | Real Estate | Housing, property, development |
| 18 | Travel & Tourism | Hospitality, destinations, leisure |
| 19 | Food & Dining | Restaurants, nutrition, culture |
| 20 | Social Issues | Community, inequality, advocacy |

### Step 2.4: Category Rejection Protocol

**Reject a category when:**
- Less than 1 finding naturally fits
- Requires invented data to support
- Beats are unnatural or forced
- Cannot produce 2 meaningfully different angles

**If rejected, replace with:**
- A category with stronger evidence fit
- A geographic-focused alternative (county, state, city)
- A service-journalism angle (helps readers make decisions)
- A demographic split angle (age, gender, income differences)

---

## Phase 3: Angle Generation Engine

### Step 3.1: Angle Generation Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                 ANGLE GENERATION WORKFLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   FINDING ──► CATEGORY ──► 3 CANDIDATES ──► 2 FINAL            │
│     │              │             │              │                │
│     │              │             │              │                │
│     ▼              ▼             ▼              ▼                │
│  Extract     Map to        Generate       Select best         │
│  evidence    strategic     multiple        2 that differ       │
│  point       category      options         in hook/data/       │
│                                           consequence/          │
│                                           audience/             │
│                                           geography             │
│                                                                 │
│   CHECK: □ Unique? □ Evidence-backed? □ Newsworthy? □ SERP?    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step 3.2: Per-Category Angle Bundle Standard

For each selected category, produce a **two-angle bundle**:

- **Angle A**: The strongest, most direct story for that category
- **Angle B**: A meaningfully different backup or alternative hook

The two angles must differ by **at least one** of:
- News hook (different angle on the story)
- Data point (different statistic or comparison)
- Audience value (different reader benefit)
- Geographic lens (different location focus)
- Consequence (different outcome or impact)
- Practical implication (different action or decision)
- Timing hook (different "why now" angle)
- Tension or conflict (different stakeholder or debate)
- SERP opportunity (different searchable phrase)

### Step 3.3: Pitch Angle Construction Rules

**Mandatory Format:**
```
[Compelling Hook]: [Specific Insight/Impact]
```

**Word Count:** 8-15 words (strict)

**Structure Example:**
```
County Risk Divide: New Data Reveals Where Residents Face Rising Safety Pressure
```
- Hook: "County Risk Divide"
- Insight: "New Data Reveals"
- Impact: "Where Residents Face Rising Safety Pressure"
- Total: 12 words ✓

**Action Words for Hooks:**
| Positive/Negative | Words |
|-------------------|-------|
| Reveals | reveals, exposes, shows, uncovers, exposes |
| Warns | warns, alerts, signals, highlights, spotlights |
| Ranks | ranks, tracks, compares, measures, indexes |
| Explains | explains, clarifies, breaks down, demystifies |
| Challenges | challenges, questions, debates, disputes |

**Veto List - Never Use:**
- Generic: "Interesting data", "This study matters"
- Vague: "A look at trends", "What's happening"
- Overclaimed: "This will go viral", "Number one"
- Unsupported: Claims requiring data not in evidence

### Step 3.4: Angle Uniqueness Validation

For every Category A/B pair, complete this check:

```
┌─────────────────────────────────────────────────────────────────┐
│                  ANGLE UNIQUENESS CHECK                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Category: [Category Name]                                       │
│                                                                 │
│ Angle A: [Full pitch angle text]                                │
│ Angle B: [Full pitch angle text]                                │
│                                                                 │
│ DIFFERENTIATION CHECK:                                          │
│ □ Different hook?         Yes / No                               │
│ □ Different data point?   Yes / No                               │
│ □ Different audience?    Yes / No                               │
│ □ Different geography?   Yes / No                               │
│ □ Different consequence? Yes / No                               │
│ □ Different timing?       Yes / No                               │
│                                                                 │
│ If ALL No → REJECT - Not meaningfully different                 │
│ If 1+ Yes → PASS - Proceed to scoring                           │
│                                                                 │
│ COMMON MISTAKES (Do Not Count):                                 │
│ - Same angle with swapped adjectives                            │
│ - Same statistic with different label                           │
│ - Same thesis in different tone                                 │
│ - Same hook for local vs national without new evidence          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 4: Newsworthiness Justification

### Step 4.1: Justification Structure

Each angle requires **two-level justification**:

**Level 1 - Table Cell** (concise summary):
- 10-20 words maximum
- Capture the core news value
- Must make reader want to know more

**Level 2 - Detailed Section** (250-300 words):
- Data-Rich Justification
- Research Support
- Market Context
- Media Value
- Talking Points (4-5)

### Step 4.2: Detailed Justification Template

```markdown
### Angle X - [Pitch Angle]

**Data-Rich Justification:** [150-180 words]
Include specific evidence:
- Statistics and percentages from study
- Year-over-year comparisons
- Geographic comparisons (county/state/national)
- Category rankings or benchmarks
- Any quantifiable metrics that support the angle

Example: "The analysis reveals that 67% of counties in the state 
have seen a 23% increase in safety-related incidents over the 
past 18 months, with rural areas experiencing the sharpest 
rise at 34% compared to urban centers at 12%..."

**Research Support:** [30-40 words]
Reference credible sources:
- Studies and reports that validate the finding
- Official data sources (government, academic)
- Industry whitepapers with clear methodology
- SERP-gathered data when Stage 03 was insufficient

**Market Context:** [30-40 words]
Explain broader implications:
- Industry trends and timing relevance
- Why this matters in current public conversation
- Competitor PR saturation or whitespace
- Economic or policy environment

**Media Value:** [20-30 words]
Clarify journalistic appeal:
- Why journalists should care
- Why their readers would care
- What audience need the story serves
- What makes this useful for outreach

**Talking Points:** [4-5 points, bullet format]
- [Point 1]: Specific, evidence-backed, short
- [Point 2]: Tied to the angle, useful for personalization
- [Point 3]: Verification possible, not generic
- [Point 4]: Different for Angle A vs Angle B
- [Point 5]: Email-ready, can drive conversation
```

### Step 4.3: Justification Quality Gates

**FAIL if any section is:**
- Generic (could apply to any campaign)
- Without specific data points
- Without source attribution
- Without clear journalist/reader value

**PASS if:**
- Every claim has supporting evidence
- Sources are named and credible (or marked unavailable)
- Timing relevance is clear
- Beat fit is explicit

---

## Phase 5: Quality Assurance & Scoring

### Step 5.1: Scoring Rubric

Score each angle on this 13-dimension rubric:

```
┌─────────────────────────────────────────────────────────────────┐
│                    ANGLE SCORING RUBRIC                         │
├──────────────────────┬──────┬──────────────────────────────────┤
│ Dimension            │ Score │ Criteria                         │
├──────────────────────┼──────┼──────────────────────────────────┤
│ Timeliness           │ /10   │ How relevant is "why now"?        │
│ Novelty              │ /10   | How unique is the finding?       │
│ Data Strength        │ /10   │ Quantifiable evidence quality     │
│ Human Impact         │ /10   │ Reader consequence clear?         │
│ Local Relevance      │ /10   │ Geographic fit for targeting      │
│ Conflict/Tension     │ /10   │ Story has inherent drama?         │
│ Public Interest      │ /10   │ Audience cares?                   │
│ Beat Fit             │ /10   │ Natural match to journalist beat  │
│ Source Credibility   │ /10   │ Evidence from 4-5 rated sources? │
│ Emotional Resonance  │ /10   │ Evokes reaction?                  │
│ Editorial Reason     │ /10   │ Has clear story news value?       │
│ Headline Strength    │ /10   │ 8-15 words, compelling, SERP-able │
│ Differentiation      │ /10   │ Unique among 40 angles?          │
├──────────────────────┼──────┼──────────────────────────────────┤
│ TOTAL                │ /130  │                                 │
└──────────────────────┴──────┴──────────────────────────────────┘
```

### Step 5.2: Decision Rules

| Score Range | Action |
|-------------|--------|
| 104-130 (80%+) | **PRIMARY** - Move to beat matching |
| 78-103 (60-79%) | **SECONDARY** - Revise or strengthen |
| Below 78 (<60%) | **REJECT** - Do not use in 40 |

**Golden Rules:**
- Never rank a clever headline above a better-supported angle
- Never use an unsupported claim to boost score
- Never let marketing language override evidence
- Every angle scoring below threshold must be replaced

### Step 5.3: Quality Assurance Checklist

Complete before finalizing:

```
┌─────────────────────────────────────────────────────────────────┐
│                 QUALITY ASSURANCE CHECKLIST                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ □ Conversation Relevance: pass/fail                            │
│   - Derived from 00-brief, 02-insights, 03-research?           │
│   - Evidence backbone present?                                  │
│                                                                 │
│ □ Newsworthiness: pass/fail                                    │
│   - Meets journalism criteria?                                   │
│   - Has editorial news value?                                    │
│                                                                 │
│ □ Data Foundation: pass/fail                                   │
│   - Quantifiable evidence?                                      │
│   - No invented data?                                          │
│                                                                 │
│ □ Beat Alignment: pass/fail                                     │
│   - Natural beat mapping?                                       │
│   - Not forced?                                                 │
│                                                                 │
│ □ Outreach Readiness: pass/fail                                │
│   - Talk points ready?                                         │
│   - Immediately usable for email?                               │
│                                                                 │
│ □ SERP Support: pass/fail/not needed                            │
│   - If needed, was SERP gathered?                               │
│   - Sources credible?                                          │
│                                                                 │
│ □ Two Angles Per Beat: pass/fail                               │
│   - 40 angles = 20 categories × 2?                             │
│   - Each pair meaningfully different?                           │
│                                                                 │
│ If ANY fail → Return to revision                               │
│ All pass → Proceed to output assembly                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 6: Final Output Assembly

### Step 6.1: Table Assembly

Construct the main table with columns:
- `#` - Rank order (1 is strongest)
- `Category` - Strategic category name
- `Journalist Beats` - Comma-separated target beats
- `Pitch Angle` - 8-15 word headline
- `Why This is Newsworthy` - Concise summary (10-20 words)
- `Score` - /10 rating
- `Selected` - Checkbox for user selection

### Step 6.2: Section Assembly

Add sections in this order:

1. **Category And Beat Coverage Check**
   - List each category with angle count and beat mapping

2. **Newsworthiness Justifications**
   - One section per angle (40 total)
   - Follow template from Phase 4.2

3. **Quality Assurance Check**
   - Pass/fail with reasons for each dimension

### Step 6.3: File Validation

Before marking complete:

```
┌─────────────────────────────────────────────────────────────────┐
│                    OUTPUT VALIDATION                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ FILE STRUCTURE:                                                │
│ □ Contains # Pitch Angles table                                │
│ □ Contains Category And Beat Coverage Check                    │
│ □ Contains Newsworthiness Justifications (40 sections)        │
│ □ Contains Quality Assurance Check                            │
│                                                                 │
│ CONTENT VALIDATION:                                           │
│ □ Exactly 40 pitch angles                                      │
│ □ Exactly 20 categories                                        │
│ □ Each category has exactly 2 angles                           │
│ □ Every angle is 8-15 words                                    │
│ □ Every angle uses [Hook]: [Insight] format                    │
│ □ Every justification is 250-300 words                         │
│ □ Every justification has 4-5 talking points                   │
│                                                                 │
│ EVIDENCE VALIDATION:                                           │
│ □ No invented statistics                                       │
│ □ No unsupported claims                                        │
│ □ Sources cited or marked unavailable                          │
│ □ Risks identified for every angle                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Angle Type Reference Library

### 1. Trend Angle
**Use when:** Source or SERP shows movement over time
**Structure:** `[Time-based Hook]: [Direction and Scale]`
**Example:** "Rising 40%: How [Topic] Costs Shifted Across [Geography]"

### 2. Warning Angle
**Use when:** Finding highlights risk, harm, or gap
**Structure:** `[Risk Hook]: [Who/What is Affected]`
**Example:** "Safety Gap Exposed: [Area] Residents Face Growing Risk"

### 3. Surprise Angle
**Use when:** Finding contradicts common expectations
**Structure:** `[Contradiction Hook]: [New Reality]`
**Example:** "Despite Growth: Why [Common Assumption] No Longer Holds"

### 4. Ranking Angle
**Use when:** Source ranks states, counties, categories
**Structure:** `[Rank Position]: [What's Ranked]`
**Example:** "Bottom 10: [Geography] Ranks Lowest in [Category]"

### 5. Geographic Angle
**Use when:** Place is central to story
**Structure:** `[Location Hook]: [Location-Specific Finding]`
**Example:** "[County] Crisis: How [Issue] Differs From Neighbors"

### 6. Demographic Split Angle
**Use when:** Age, gender, income, role differences matter
**Structure:** `[Group Hook]: [Group-Specific Finding]`
**Example:** "Age Divide: How [Topic] Affects [Group A] vs [Group B]"

### 7. Service Journalism Angle
**Use when:** Finding helps readers make decisions
**Structure:** `[Action Hook]: [Actionable Insight]`
**Example:** "Consumer Guide: What [Finding] Means For Your [Decision]"

### 8. Policy Angle
**Use when:** Laws, regulations, or public debate matter
**Structure:** `[Policy Hook]: [Policy-Related Finding]`
**Example:** "New Rules: How [Policy Change] Affects [Affected Group]"

---

## Beat Mapping Matrix

| Category | Primary Beats | Secondary Beats | Geographic Fit |
|----------|---------------|------------------|-----------------|
| Data-Led | data journalist, investigative reporter | tech reporter, business reporter | All levels |
| Trend Story | trends reporter, business reporter | economy reporter, lifestyle editor | National/State |
| Human Interest | features reporter, lifestyle editor | local news, community reporter | County/City |
| Health & Wellness | health reporter, medical writer | science reporter, lifestyle editor | All levels |
| Finance & Business | business reporter, finance writer | economy reporter, tech reporter | National/State |
| Environment | environmental reporter, science writer | local news, policy reporter | State/County |
| Politics & Policy | political reporter, state house correspondent | policy analyst, government reporter | State/National |
| Education | education reporter, school board beat | family reporter, local news | County/City |
| Crime & Safety | crime reporter, public safety writer | legal affairs, local news | County/City |
| Real Estate | real estate reporter, housing writer | business reporter, local news | Metro/County |

---

## Failure Patterns & Fixes

| Pattern | Symptom | Fix |
|---------|---------|-----|
| **Same Angle Twice** | Category A and B are essentially identical | Force differentiation in hook/data/consequence/geography |
| **Generic Angles** | Could fit any campaign | Return to 02-insights, find specific findings |
| **Vague Pitch** | Under 8 words or no specific insight | Add data point, geographic detail, or consequence |
| **No Beat Fit** | Beats are forced or irrelevant | Re-select category with natural beat alignment |
| **Thin Justification** | Under 250 words or no data | Add SERP research, quantify claims |
| **Missing Talking Points** | Section empty or generic | Create angle-specific, email-ready points |
| **Risk Blank** | No risk identified | Pull from 02-insights caveats and 03-research contradictions |
| **SERP Needed But Missing** | Claim requires external validation | Go to SERP, gather supporting data |

---

## Downstream Stage Integration

### To 05-beats.md (Beat Matching)
- 40 angles ranked by score
- 20 categories with 2 angles each
- Journalist beats mapped
- Geographic framing (local/county/state/national)
- Clear differentiation between A/B angles

### To 06-journalist-intel.md (Journalist Targeting)
- Beat-aligned angles ready for journalist search
- Talking points can guide outreach
- Newsworthiness justifications inform personalization
- Risk labels help avoid inappropriate targets

### To 08-pitch-draft.md (Pitch Drafting)
- Pitch angles provide story direction
- Justifications provide evidence for email
- Talking points become email body
- Risk labels inform claim boundaries

### To 09-optimized-email.md (Email Optimization)
- Angles with highest scores get priority
- SERP-aware angles can inform subject lines
- Differentiation ensures varied content options

---

## Definition Of Done

This skill is complete only when ALL of the following are true:

1. **Output contains exactly 40 pitch angles** across exactly 20 strategic categories, with exactly 2 unique angles per category
2. **Every pitch angle is exactly 8-15 words** and uses the required `[Compelling Hook]: [Specific Insight/Impact]` format
3. **Every pitch angle is simple, catchy, newsworthy, and evidence-backed** - no invented data
4. **Every table row has:** Category, Journalist Beats, Pitch Angle, Newsworthiness Summary, Score (1-10), and Selected checkbox
5. **Every row has a matching 250-300 word detailed justification** including data, research support, market context, media value, and 4-5 talking points
6. **Coverage check confirms:** 20 categories completed, 2 angles per category, journalist beats mapped
7. **Quality Assurance Check shows:** Pass/Fail status with reasons for all 7 dimensions
8. **SERP research was used** when Stage 03 did not contain enough data or context
9. **No angle relies on invented facts** or unsupported hype
10. **The file makes Stage 05 easier** - beat matcher knows direction immediately
11. **The file makes Stage 08 easier** - pitch writer has clear story direction
12. **Risks are identified** for every angle - no blank risk fields

---

## Operational Contract

| Property | Value |
|----------|-------|
| **Name** | angle-generator |
| **Purpose** | Convert verified insights and enriched research into differentiated, journalist-ready pitch angles |
| **Required Input** | `00-brief.md`, `02-insights.md`, `03-research.md` |
| **Optional Input** | Campaign caveats, geography preferences, seasonal timing, competitor coverage, user preferences |
| **Execution Process** | Extract viable story categories → Create 2 unique angles per category → Map to journalist beats → Write headline-style angles → Justify with evidence → Score or prepare for GPT-5.5 → Reject weak framing → Preserve source caveats |
| **Output** | `04-angles.md` |
| **Output Format** | Category table + detailed justifications + QA check |
| **Trigger Condition** | Stage 02 and Stage 03 contain enough verified findings to support story framing |
| **Stop Condition** | No angle may advance unless distinct, supported, newsworthy, and beat-aligned |
| **Failure Condition** | Duplicate angles, unsupported claims, vague newsworthiness, missing source context, or scores below threshold |
| **Validation Rule** | Every angle must show beat fit, data basis, editorial reason, and no unresolved claim gaps |
| **Repair Action** | Rewrite weak angles, downgrade unsupported claims, return to research enrichment if evidence missing |
| **Handoff Rule** | Send only validated angles to `beat-matcher` |

---

## Anti-Hallucination And Assumption Control

Never invent journalist names, journalist emails, article titles, publication history, source names, statistics, rankings, survey results, methodology details, quotes, SERP findings, or Muck Rack results.

If required information is missing, unverifiable, blocked by access, or not present in the validated inputs, write exactly:

`Information unavailable. Verification required before use.`

Use beat-level assumptions only when they are clearly labeled as assumptions and never present them as journalist-specific facts. Do not convert search intent, SERP possibility, or Muck Rack workflow instructions into claimed results unless the result was actually captured and validated.

---

## Final Standard

Leave behind a Stage 04 file that is:
- **Structured**: Clear table, sections, and organization
- **Data-Rich**: Every angle backed by quantified evidence
- **Beat-Aligned**: Natural mapping to journalist beats
- **SERP-Aware**: Angles designed for search visibility
- **Newsworthy**: Clear editorial reason for each angle
- **Outreach-Ready**: Talking points ready for email campaigns

The goal is NOT a long brainstorm. The goal is 40 strong pitch angles across 20 strategic categories, each supported enough for GPT-5.5 scoring, user selection, beat matching, journalist targeting, and email drafting.

Each angle must be:
- Specific enough a journalist understands it from the headline
- Evidence-backed enough to survive a fact-check
- Different enough from the other 39 to justify separate treatment
- Actionable enough to drive an email campaign immediately