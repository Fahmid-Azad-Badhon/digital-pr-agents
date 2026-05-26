---
name: beat-matcher
description: Use when you need to convert ranked Digital PR pitch angles from `04-angles.md` into precise journalist beats, outlet types, journalist profiles, personalization strategy, Muck Rack or SERP search direction, fit scoring, and collection readiness before journalist intelligence work begins.
---

# Beat Matcher

## Mission
Turn pitch angles into a clear journalist targeting map.

This skill owns Stage 05 of the Digital PR workflow. Its output is `05-beats.md`.

The goal is to decide who the story is for before anyone searches for journalists or writes outreach. Stage 05 should make journalist collection more accurate, not bigger for the sake of volume.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Phase 1: Input Analysis](#phase-1-input-analysis)
3. [Phase 2: Beat Mapping](#phase-2-beat-mapping)
4. [Phase 3: Scoring & Prioritization](#phase-3-scoring--prioritization)
5. [Phase 4: Outreach Gate](#phase-4-outreach-gate)
6. [Phase 5: Collection Lane Decision](#phase-5-collection-lane-decision)
7. [Phase 6: Search Guidance](#phase-6-search-guidance)
8. [Phase 7: Quality Assurance](#phase-7-quality-assurance)
9. [Beat Taxonomy Reference](#beat-taxonomy-reference)
10. [Scoring Rubrics](#scoring-rubrics)
11. [Collection Lane Matrix](#collection-lane-matrix)
12. [Failure Patterns & Fixes](#failure-patterns--fixes)
13. [Downstream Integration](#downstream-integration)

---

## Executive Summary

| Property | Value |
|----------|-------|
| **Stage** | 05 |
| **Output File** | `05-beats.md` |
| **Input** | `04-angles.md` (40 angles × 20 categories) |
| **Primary Model** | Hy3 Preview |
| **Quality Gate** | GPT-5.5 Thinking |
| **User Action** | None - AI automatically matches beats |
| **Completion Criteria** | 16 mandatory checks |

### Key Workflow

```
04-angles.md (40 angles)
         │
         ▼
   Stage 05 Beat Matching (AI - AUTOMATIC)
         │
         ├──► Map ALL angles to beats (automatically)
         ├──► Score fit (1-10)
         ├──► Rank all angles
         ├──► Generate search guidance
         └──► Determine collection lane
         │
         ▼
   Stage 06: Pitch Selection (HUMAN GATE)
         │
         ▼
   Stage 07 Journalist Collection
```

---

## Phase 1: Input Analysis

### Step 1.1: Input Validation

Before processing, validate inputs:

```
┌─────────────────────────────────────────────────────────────────┐
│                  INPUT VALIDATION CHECKLIST                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ □ 04-angles.md exists and contains:                           │
│   - Exactly 40 pitch angles (20 categories × 2)               │
│   - Category column                                             │
│   - Journalist Beats column                                     │
│   - Pitch Angle column                                          │
│   - Why This is Newsworthy column                               │
│   - Score column (1-10)                                        │
│   - Selected column (checkbox)                                 │
│                                                                 │
│ □ 04-angles.md has supporting sections:                       │
│   - Category And Beat Coverage Check                            │
│   - Newsworthiness Justifications                              │
│   - Quality Assurance Check                                     │
│                                                                 │
│ □ 04-angles.md has supporting sections:                               │
│   - Category And Beat Coverage Check                                │
│   - Newsworthiness Justifications                                  │
│   - Quality Assurance Check                                         │
│                                                                       
│ IF INVALID INPUTS → Return to Stage 04                              │
│ IF VALID → Proceed to automatic beat mapping                        │
│                                                                       
└─────────────────────────────────────────────────────────────────┘
```

### Step 1.2: Angle Parsing

Parse ALL angles from the table (automatic - no user selection needed):

```
┌─────────────────────────────────────────────────────────────────┐
│                   ANGLE PARSING TEMPLATE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Angle #X:                                                        │
│ ├─ Category: [from table]                                     │
│ ├─ Journalist Beats: [from table]                              │
│ ├─ Pitch Angle: [from table]                                   │
│ ├─ Why Newsworthy: [from detailed section, 250-300 words]     │
│ ├─ Score: [from table, 1-10]                                   │
│ ├─ Talking Points: [from detailed section]                     │
│ └─ Risks: [from 04-angles.md]                                  │
│                                                                 │
│ REPEAT for ALL 40 angles                                         │
│ IF NO SELECTION → Mark "Awaiting User Selection"              │
│ IF INVALID INPUTS → Return to Stage 04                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step 1.2: Angle Parsing

Parse selected angles from the table:

```
┌─────────────────────────────────────────────────────────────────┐
│                   ANGLE PARSING TEMPLATE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Selected Angle #X:                                            │
│ ├─ Category: [from table]                                     │
│ ├─ Journalist Beats: [from table]                              │
│ ├─ Pitch Angle: [from table]                                   │
│ ├─ Why Newsworthy: [from detailed section, 250-300 words]     │
│ ├─ Score: [from table, 1-10]                                  │
│ ├─ Talking Points: [from detailed section]                   │
│ └─ Risks: [from 04-angles.md]                                  │
│                                                                 │
│ REPEAT for each selected angle                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step 1.3: Risk Inheritance

Pull risks forward from 04-angles.md:

| Risk Type | How It Affects Beat Mapping |
|-----------|------------------------------|
| County framing only | Do not target state/national reporters |
| Descriptive only | Do not imply causation in pitch |
| Weak benchmark | Prioritize outlets that accept caveats |
| Timing stale | Focus on outlets that accept historical angles |
| Crowded angle | Find whitespace beats |

---

## Phase 2: Beat Mapping

### Step 2.1: Primary Beat Assignment

For each selected angle, determine the primary beat:

```
┌─────────────────────────────────────────────────────────────────┐
│                 PRIMARY BEAT ASSIGNMENT                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Angle: [Pitch angle text]                                      │
│                                                                 │
│ Primary Beat Decision:                                          │
│ □ What is the single best beat for this angle?                 │
│ □ Which beat naturally covers this topic?                       │
│ □ Which beat has the clearest audience fit?                     │
│                                                                 │
│ Rule: ONE primary beat only                                    │
│                                                                 │
│ Examples:                                                       │
│ - "Texas Pedestrian Deaths Surge 16.1%" → Public Safety        │
│ - "Consumer Costs Rising in Metro Areas" → Consumer Affairs     │
│ - "Tech Innovation in Healthcare" → Technology + Health         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step 2.2: Secondary Beat Assignment

Optionally add secondary beats for expansion:

```
┌─────────────────────────────────────────────────────────────────┐
│                SECONDARY BEAT ASSIGNMENT                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Secondary beats are EXPANSION PATHS, not primary targets.       │
│                                                                 │
│ When to add secondary beat:                                     │
│ □ Angle can credibly fit multiple beats                        │
│ □ Secondary beat offers expansion opportunity                   │
│ □ Primary beat coverage is limited                              │
│                                                                 │
│ When NOT to add:                                               │
│ × Secondary beats blur the strategy                            │
│ × Different thesis requires different angle                     │
│ × Beats are forced or unnatural                                 │
│                                                                 │
│ Format: "Primary: [beat], Secondary: [beat]"                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step 2.3: Beat Type Validation

Verify beat types are specific:

```
┌─────────────────────────────────────────────────────────────────┐
│                  BEAT TYPE VALIDATION                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ GOOD (Specific):              BAD (Too Broad):                 │
│ ├─ public safety             ├─ news                           │
│ ├─ transportation            ├─ general                        │
│ ├─ county government         ├─ features                      │
│ ├─ consumer affairs          ├─ human interest                 │
│ ├─ data journalism           ├─ local (without topic)         │
│ └─ local government          └─ lifestyle (without reason)   │
│                                                                 │
│ If beat is too broad → NARROW with angle context               │
│                                                                 │
│ Example:                                                       │
│ - "local" → "local public safety and county government"        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 3: Scoring & Prioritization

### Step 3.1: Fit Score Calculation

Use the 10-point fit score rubric:

```
┌─────────────────────────────────────────────────────────────────┐
│                     FIT SCORE RUBRIC                             │
├──────────────────────┬──────────────────────────────────────────┤
│ Starting Point       │ 5                                        │
├──────────────────────┼──────────────────────────────────────────┤
│ +2                  │ Direct beat match                         │
│ +1                  │ Strong outlet scale match                │
│ +1                  │ Strong geography match                  │
│ +1                  │ Strong newsworthiness/reader utility     │
│ +1                  │ Strong personalization potential         │
│ -1                  │ Claim risk or caveat complexity           │
│ -1                  │ Broad beat label                          │
│ -1                  │ Weak outlet scale                        │
│ -2                  │ Depends on unsupported framing           │
├──────────────────────┼──────────────────────────────────────────┤
│ CLAMP RESULT        │ Between 1 and 10                         │
└──────────────────────┴──────────────────────────────────────────┘
```

### Step 3.2: Priority Scoring Model

For ranking top 10 angles, use the 50-point model:

```
┌─────────────────────────────────────────────────────────────────┐
│                  PRIORITY SCORING MODEL                          │
├─────────────────────────────┬────────┬──────────────────────────┤
│ Dimension                   │ Weight │ Criteria                 │
├─────────────────────────────┼────────┼──────────────────────────┤
│ Timeliness                  │ /5     │ How strongly matters now │
│ Impact                      │ /5     │ Reader/audience reach    │
│ Audience Relevance          │ /5     │ Natural beat fit          │
│ Evidence Strength           │ /5     │ Study/research support   │
│ Beat Fit                    │ /5     │ Natural to journalist     │
│ Outlet Fit                  │ /5     │ Matches outlet scale     │
│ Differentiation             │ /5     │ Stand from routine       │
│ SERP Potential              │ /5     │ Search visibility        │
│ Outreach Efficiency         │ /5     │ Search yields quality    │
│ Risk Control                │ /5     │ Pitch without overclaim │
├─────────────────────────────┼────────┼──────────────────────────┤
│ TOTAL                       │ /50    │                          │
└─────────────────────────────┴────────┴──────────────────────────┘
```

### Step 3.3: Top 10 Selection

```
┌─────────────────────────────────────────────────────────────────┐
│                    TOP 10 SELECTION                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ RANKING CRITERIA (in priority order):                           │
│ 1. Beat fit strength                                            │
│ 2. Evidence support                                            │
│ 3. Timing relevance                                             │
│ 4. Lower claim risk                                             │
│ 5. Clearer search path                                          │
│                                                                 │
│ TIE-BREAKERS:                                                   │
│ - If scores equal → prioritize beat fit                          │
│ - If beat fit equal → prioritize evidence                       │
│ - If evidence equal → prioritize timing                          │
│                                                                 │
│ OUTPUT: Exactly 10 angles when possible                         │
│ If fewer than 10 usable → list all with note                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 4: Beat Mapping Output

### Step 4.1: Beat Mapping Structure

Beat mapping is AUTOMATIC - all angles are mapped to beats without user confirmation:

```
┌─────────────────────────────────────────────────────────────────┐
│                   BEAT MAPPING STRUCTURE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ## Beat Coverage Summary                                        │
│ - All 40 angles mapped to beats                                  │
│                                                                 │
│ ## Top 10 Angles by Score                                       │
│ | Priority | Angle | Beat | Score | Lane |                      │
│                                                                 │
│ ## All Angles with Beat Mapping                                 │
│ | Angle | Beat | Score | Outlet Type |                          │
│                                                                 │
│ ## Muck Rack / SERP Search Guidance                             │
│ - Per-beat search terms                                         │
│                                                                 │
│ ## Collection Lane Decision                                     │
│ - shortlist / bulk / hybrid per beat                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step 4.2: Beat Mapping Output Fields

Output fields for downstream stages:

```
┌─────────────────────────────────────────────────────────────────┐
│                  BEAT MAPPING OUTPUT                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Required Output Fields:                                         │
│ ├─ All angles with beat assignments                              │
│ ├─ Score per angle (1-10)                                      │
│ ├─ Outlet type per beat                                         │
│ ├─ Journalist profile per beat                                 │
│ ├─ Personalization note per angle                              │
│ ├─ Fit score per angle                                          │
│ ├─ Search guidance per beat                                     │
│ ├─ Collection lane per beat (shortlist/bulk/hybrid)           │
│ └─ Weak-fit exclusions                                           │
│                                                                 │
│ Flow: Stage 05 automatically maps all angles to beats         │
│       and sends to Stage 06 for human angle selection           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 5: Collection Lane Decision

### Step 5.1: Lane Selection Matrix

```
┌─────────────────────────────────────────────────────────────────┐
│                   COLLECTION LANE MATRIX                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────────┬─────────────┬─────────────┬─────────────┐       │
│ │  Condition  │  Shortlist  │    Bulk     │   Hybrid    │       │
│ ├─────────────┼─────────────┼─────────────┼─────────────┤       │
│ │ Beat is     │     ✓      │             │             │       │
│ │ specialized │             │             │             │       │
│ ├─────────────┼─────────────┼─────────────┼─────────────┤       │
│ │ Need high-  │     ✓      │             │      ✓      │       │
│ │ quality     │             │             │             │       │
│ ├─────────────┼─────────────┼─────────────┼─────────────┤       │
│ │ Need scale  │             │     ✓      │      ✓      │       │
│ │ (hundreds)  │             │             │             │       │
│ ├─────────────┼─────────────┼─────────────┼─────────────┤       │
│ │ Beat is     │             │     ✓      │      ✓      │       │
│ │ broad       │             │             │             │       │
│ ├─────────────┼─────────────┼─────────────┼─────────────┤       │
│ │ User        │             │     ✓      │      ✓      │       │
│ │ requests    │             │             │             │       │
│ │ scale       │             │             │             │       │
│ ├─────────────┼─────────────┼─────────────┼─────────────┤       │
│ │ User        │     ✓      │             │             │       │
│ │ wants tight │             │             │             │       │
│ │ list        │             │             │             │       │
│ └─────────────┴─────────────┴─────────────┴─────────────┘       │
│                                                                 │
│ DEFAULT: Shortlist (quality over quantity)                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step 5.2: Lane Definition

```
┌─────────────────────────────────────────────────────────────────┐
│                    LANE DEFINITIONS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ SHORTLIST LANE:                                                 │
│ - Use when: specialized beat, quality matters, tight outreach  │
│ - Stage 06 behavior:                                            │
│   ✓ 800-per-beat recorded, or written user exception            │
│   ✓ Tighter outreach-ready shortlist after validation          │
│   ✓ Stronger personalization per journalist                   │
│   ✓ More coverage review                                        │
│                                                                 │
│ BULK MUCK RACK LANE:                                            │
│ - Use when: user requests hundreds, needs scale, broad beats    │
│ - Stage 06 behavior:                                            │
│   ✓ Beat-query JSON                                             │
│   ✓ Multi-query Boolean searches                                │
│   ✓ Deduplication                                               │
│   ✓ Combined CSV and summary                                    │
│   ✓ Later shortlist extraction                                   │
│                                                                 │
│ HYBRID LANE:                                                    │
│ - Use when: need broad discovery first, then tighter list       │
│ - Stage 06 behavior:                                            │
│   ✓ Run bulk collection                                         │
│   ✓ Deduplicate and summarize                                   │
│   ✓ Extract smaller outreach-ready set                         │
│                                                                 │
│ COLLECTION: Runs automatically after Stage 06 angle selection   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 6: Search Guidance

### Step 6.1: Boolean Query Construction

For each beat, build search queries:

```
┌─────────────────────────────────────────────────────────────────┐
│                 BOOLEAN QUERY TEMPLATE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Beat: [Primary Beat Name]                                       │
│                                                                 │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ CORE TERMS:                                              │   │
│ │ ("term1" OR "term2" OR "term3")                          │   │
│ ├───────────────────────────────────────────────────────────┤   │
│ │ BEAT TERMS:                                              │   │
│ │ ("beat1" OR "beat2" OR "beat3")                          │   │
│ ├───────────────────────────────────────────────────────────┤   │
│ │ GEOGRAPHY (if applicable):                               │   │
│ │ ("city" OR "county" OR "state")                          │   │
│ ├───────────────────────────────────────────────────────────┤   │
│ │ TOPIC (if applicable):                                  │   │
│ │ ("specific topic" OR "related topic")                    │   │
│ ├───────────────────────────────────────────────────────────┤   │
│ │ EXCLUSIONS:                                              │   │
│ │ NOT ("unrelated1" OR "unrelated2")                      │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ Example:                                                        │
│ - Core: "traffic deaths" OR "pedestrian safety"                │
│ - Beat: transportation OR public safety OR local government    │
│ - Geo: Texas OR Houston OR Harris County                        │
│ - Exclude: sports OR racing                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step 6.2: Journalist Profile Template

```
┌─────────────────────────────────────────────────────────────────┐
│               JOURNALIST PROFILE TEMPLATE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Profile: [Reporter type] covering [beat topics] with           │
│          recent interest in [coverage signals] for             │
│          [outlet scale].                                         │
│                                                                 │
│ Components:                                                    │
│ - Reporter type: [e.g., local reporter, data journalist]        │
│ - Beat topics: [specific topics they cover]                     │
│ - Coverage signals: [what to look for in recent work]          │
│ - Outlet scale: [local, county, state, national, trade]         │
│                                                                 │
│ Example:                                                        │
│ "Local reporter covering county government and public         │
│ safety with recent interest in crash data, safety budgets,     │
│ or accountability reporting for county newspapers."            │
│                                                                 │
│ What NOT to include:                                            │
│ × Fake journalist names                                         │
│ × Guessed emails                                                │
│ × Invented article titles                                       │
│ × Unsupported personal interest assumptions                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step 6.3: Personalization Note Template

```
┌─────────────────────────────────────────────────────────────────┐
│              PERSONALIZATION NOTE TEMPLATE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Template:                                                       │
│ "Look for reporters who have covered [topic/coverage pattern].  │
│ The pitch should connect [specific data/finding] to their      │
│ recent [type of coverage]."                                     │
│                                                                 │
│ Must include:                                                   │
│ - Hook: what makes this angle compelling                       │
│ - Beat connection: why this naturally fits their coverage      │
│ - Coverage pattern: what to verify in recent work             │
│ - Pitch extension: how the story builds on their work          │
│                                                                 │
│ Good:                                                           │
│ "Look for reporters who have covered county crash patterns,    │
│ road safety budgets, or public safety accountability. The      │
│ pitch should connect the 16.1% pedestrian death increase      │
│ to their recent local risk reporting."                        │
│                                                                 │
│ Bad:                                                            │
│ "This journalist may like this topic."                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 7: Quality Assurance

### Step 7.1: QA Checklist

```
┌─────────────────────────────────────────────────────────────────┐
│                    QUALITY ASSURANCE CHECKLIST                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ □ Beat Fit: Every row clearly matches the selected angle      │
│   - Pass/Fail: _______                                         │
│   - Reason: ___________                                        │
│                                                                 │
│ □ Outlet Fit: Every outlet type matches geography/scale       │
│   - Pass/Fail: _______                                         │
│   - Reason: ___________                                        │
│                                                                 │
│ □ Journalist Profile: Specific enough to search                │
│   - Pass/Fail: _______                                         │
│   - Reason: ___________                                        │
│                                                                 │
│ □ Personalization: Explains why story fits journalist         │
│   - Pass/Fail: _______                                         │
│   - Reason: ___________                                        │
│                                                                 │
│ □ Fit Score: Justified by real relevance, not optimism         │
│   - Pass/Fail: _______                                         │
│   - Reason: ___________                                        │
│                                                                 │
│ □ Collection Lane: Explicit (shortlist/bulk/hybrid)            │
│   - Pass/Fail: _______                                         │
│   - Reason: ___________                                        │
│                                                                 │
│ □ Outreach Gate: Present and user-reviewable                   │
│   - Pass/Fail: _______                                         │
│   - Reason: ___________                                        │
│                                                                 │
│ □ Top 10: Ranked by timeliness, impact, relevance             │
│   - Pass/Fail: _______                                         │
│   - Reason: ___________                                        │
│                                                                 │
│ □ Priority Scoring: 50-point model applied                      │
│   - Pass/Fail: _______                                         │
│   - Reason: ___________                                        │
│                                                                 │
│ □ First Angle: Best combined newsroom fit recommended         │
│   - Pass/Fail: _______                                         │
│   - Reason: ___________                                        │
│                                                                 │
│ □ User Summary: Paste-ready for user update                    │
│   - Pass/Fail: _______                                         │
│   - Reason: ___________                                        │
│                                                                 │
│ □ Selected Status: Explicit (pending/confirmed)               │
│   - Pass/Fail: _______                                         │
│   - Reason: ___________                                        │
│                                                                 │
│ □ Search Guidance: Clear for Stage 06 after selection         │
│   - Pass/Fail: _______                                         │
│   - Reason: ___________                                        │
│                                                                 │
│ □ Anti-Hallucination: No invented journalists/emails           │
│   - Pass/Fail: _______                                         │
│   - Reason: ___________                                        │
│                                                                 │
│ ALL PASS → Stage 05 Complete                                   │
│ ANY FAIL → Fix before proceeding                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Beat Taxonomy Reference

### Hard-News & Public-Interest Beats

| Beat | Best When Angle Involves |
|-------|--------------------------|
| public safety | Risk, accountability, safety data |
| transportation | Traffic, infrastructure, roads |
| local government | City councils, local policies |
| county government | County services, budgets |
| state government | State agencies, legislation |
| courts | Legal cases, litigation |
| legal affairs | Legal implications, regulation |
| health policy | Healthcare policy, public health |
| education policy | Schools, education reform |
| environment | Climate, environmental issues |
| housing policy | Housing, development policy |

### Consumer & Service Beats

| Beat | Best When Angle Involves |
|-------|--------------------------|
| consumer affairs | Consumer protection, costs |
| personal finance | Money, saving, spending |
| insurance | Coverage, claims, rates |
| real estate | Housing market, property |
| automotive | Vehicles, transportation costs |
| travel | Tourism, hospitality |
| health consumer | Wellness, healthcare choices |
| service journalism | Help readers make decisions |

### Business & Industry Beats

| Beat | Best When Angle Involves |
|-------|--------------------------|
| business | Companies, markets |
| labor | Employment, workforce |
| workplace | Job conditions, HR |
| retail | Retail industry |
| technology | Tech, innovation |
| marketing | Advertising, media |
| industry trade | Sector-specific |
| startups | Entrepreneurship |
| economy | Economic trends |

### Data & Feature Beats

| Beat | Best When Angle Involves |
|-------|--------------------------|
| data journalism | Rankings, statistics, maps |
| explanatory journalism | Complex topics explained |
| features | In-depth storytelling |
| trend reporting | Patterns over time |
| lifestyle | Cultural, behavior trends |

---

## Failure Patterns & Fixes

| Pattern | Symptom | Fix |
|---------|---------|-----|
| **Generic beat** | Uses "news", "local", "features" | Add topic context: "local public safety" |
| **Same outlet type** | All rows = "local newspaper" | Match to evidence scale |
| **Generic profile** | "A reporter interested in this" | Use profile formula with specific topics |
| **Flattery note** | "They might like this" | Explain coverage connection |
| **All high scores** | No tradeoff analysis | Apply rubric, penalize weak fits |
| **Missing exclusions** | No weak-fit warnings | Add exclusions for likely wrong targets |
| **Scale mismatch** | County data → national outlet | Match outlet to evidence scale |
| **No lane decision** | Collection method unclear | Explicitly choose shortlist/bulk/hybrid |
| **No gate** | Stage 06 can search without selection | Add gate with pending status |
| **No top 10** | All angles treated equally | Rank and recommend top 10 |
| **Unclear selection** | Multiple selected, no active | Clarify which angle is first |
| **Vague search guidance** | Terms too broad for Muck Rack | Build Boolean queries per beat |

---

## Downstream Integration

### To 06-journalist-intel.md

After reading `05-beats.md`, the journalist-intelligence agent should know:

| Field | What Stage 06 Needs |
|-------|---------------------|
| **Active angle** | Which angle to search for |
| **Primary beat** | What to search on Muck Rack |
| **Outlet types** | Which outlets to prioritize |
| **Search terms** | Boolean queries ready to use |
| **Profile template** | What journalist to find |
| **Personalization** | How to pitch to each journalist |
| **Collection lane** | Whether to collect 800 or shortlist |
| **Exclusions** | What to avoid |
| **Status** | CONFIRMED before searching |

### To 07-journalist-coverage.md

- Beat-specific journalist history
- Outlet-specific coverage patterns
- Personalized angle for each target

### To 08-pitch-draft.md

- Selected angle and beat
- Personalization notes
- Evidence to cite in email

---

## Definition Of Done

This skill is complete only when ALL of the following are true:

1. **`05-beats.md` maps each selected angle** to a precise journalist beat
2. **Each selected beat has a clear targeting lane** (shortlist/bulk/hybrid)
3. **Every row has a specific outlet type** matching geography and audience
4. **Every row has a searchable journalist profile** using the formula template
5. **Every row has a usable personalization note** explaining story-beat connection
6. **Every row has a defensible fit score** from the rubric
7. **Weak-fit paths are named** to prevent poor targeting
8. **Collection lane is explicit** - shortlist, bulk Muck Rack, or hybrid
9. **Beat mapping is complete** for all 40 angles with scores
10. **Top 10 are ranked** by timeliness, impact, relevance using 50-point model
11. **Secondary backlog** preserves non-priority angles with triggers
12. **Collection lane is explicit** per beat - shortlist/bulk/hybrid
13. **Muck Rack/SERP search guidance** is clear for Stage 06
14. **Boolean query concepts** present when bulk collection is likely
15. **No journalist names, emails, or coverage histories invented**
16. **File makes journalist intelligence faster and more accurate**

---

## Operational Contract

| Property | Value |
|----------|-------|
| **Name** | beat-matcher |
| **Purpose** | Automatically map pitch angles to journalist beats, outlet lanes, and search guidance |
| **Required Input** | `04-angles.md` (40 angles from Angle Generator) |
| **Optional Input** | Campaign brief, geography, publication preferences, excluded outlets |
| **Execution Process** | Parse all 40 angles → Score beat fit → Rank by score → Determine outlet types → Generate search guidance → Decide collection lane → Output beat mapping |
| **Output** | `05-beats.md` |
| **Output Format** | Beat table + Search guidance + Collection lanes + QA check |
| **Trigger Condition** | Stage 04 contains 40 validated pitch angles |
| **Stop Condition** | All 40 angles mapped to beats with search guidance |
| **Failure Condition** | Unclear beat fit, missing beat mapping, no search guidance |
| **Validation Rule** | Each angle has beat assignment, outlet type, search terms |
| **Repair Action** | Rebuild beat mapping, split broad beats, strengthen rationale |
| **Handoff Rule** | All angle data goes to Stage 06 for human angle selection |

---

## Anti-Hallucination And Assumption Control

Never invent journalist names, journalist emails, article titles, publication history, source names, statistics, rankings, survey results, methodology details, quotes, SERP findings, or Muck Rack results.

If required information is missing, unverifiable, blocked by access, or not present in the validated inputs, write exactly:

`Information unavailable. Verification required before use.`

Use beat-level assumptions only when they are clearly labeled as assumptions and never present them as journalist-specific facts. Do not convert search intent, SERP possibility, or Muck Rack workflow instructions into claimed results unless the result was actually captured and validated.