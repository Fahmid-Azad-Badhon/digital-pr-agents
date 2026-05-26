# Digital PR Workflow - Model Configuration

**Version:** 3.0  
**Last Updated:** 2026-05-06  
**Status:** Production Ready  
**Owner:** Digital PR Operations Team

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Purpose & Scope](#2-purpose--scope)
3. [Core Rules & Constraints](#3-core-rules--constraints)
4. [Model Stack Architecture](#4-model-stack-architecture)
5. [Model IDs & Provider Configuration](#5-model-ids--provider-configuration)
6. [Stage Model Map & Handoffs](#6-stage-model-map--handosffs)
7. [Stage 1: Campaign Intake](#7-stage-1-campaign-intake)
8. [Stage 2: Study Extraction](#8-stage-2-study-extraction)
9. [Stage 3: Research Enrichment](#9-stage-3-research-enrichment)
10. [Stage 4: Angle Generation & Scoring](#10-stage-4-angle-generation--scoring)
11. [Stage 5: Beat Matching & Selection](#11-stage-5-beat-matching--selection)
12. [Stage 6: Journalist Collection](#12-stage-6-journalist-collection)
13. [Stage 7: Journalist Intelligence](#13-stage-7-journalist-intelligence)
14. [Stage 8: Pitch Drafting](#14-stage-8-pitch-drafting)
15. [Stage 9: Email Optimization](#15-stage-9-email-optimization)
16. [Stage 10: Final Package](#16-stage-10-final-package)
17. [Stage 11: Export & Delivery](#17-stage-11-export--delivery)
18. [Stage 12: Technical Validation](#18-stage-12-technical-validation)
19. [Stage 13: Browser & Search Validation](#19-stage-13-browser--search-validation)
20. [Stage 14: Regression & Production Readiness](#20-stage-14-regression--production-readiness)
21. [Journalist Pool Scaling Protocol](#21-journalist-pool-scaling-protocol)
22. [Daily Operations & Capacity Planning](#22-daily-operations--capacity-planning)
23. [Quality Gate Framework](#23-quality-gate-framework)
24. [Error Handling & Fallback Rules](#24-error-handling--fallback-rules)
25. [Glossary & Terminology](#25-glossary--terminology)
26. [Appendices](#26-appendices)

---

## 1. Executive Summary

### Overview
This document defines the **model-routing contract** for the Digital PR workflow - the system that transforms campaign briefs into journalist-ready pitch emails.

### Operating Principle
**"OpenCode produces volume. ChatGPT Plus protects quality."**

- OpenCode free models handle high-volume production work
- GPT-5.5 Thinking serves as the final editorial quality gate
- Separation of generation and approval prevents self-review bias

### Key Metrics
| Metric | Target |
|--------|--------|
| Campaigns per day | 10 |
| Angles per campaign | 40 |
| Pitch variants per angle | 6 |
| First send batch | 5-15 journalists |
| Quality gate pass rate | 85%+ |

### Critical Success Factors
1. User must select at least one angle before journalist collection begins
2. GPT-5.5 must score ALL 40 angles in Stage 4
3. Different models must generate and approve (no self-approval)
4. One active selected angle package at a time (unless batch requested)
5. No invented data, sources, or journalist information

---

## 2. Purpose & Scope

### Purpose
This file serves as the **single source of truth** for:
- Model assignment per workflow stage
- Quality gate requirements and exceptions
- Input/output specifications for each stage
- Prompt templates for each model role
- Error handling and fallback procedures
- Provider configuration and API setup

### Scope
This configuration applies to:
- All 14 workflow stages (0-10 + technical stages)
- All 6 model tiers
- All quality gates
- All handoff transitions
- All validation checks

### Document Hierarchy
```
MODEL-CONFIG.md (This File)
    ├── Primary configuration for model routing
    ├── Defines quality gates and their requirements
    └── Sets standards for all stage outputs

    ↓ References and flows into:
    
handoff-matrix.md
    └── Defines data transfer between stages
    
validation-gates.md
    └── Defines pass/fail criteria per stage
    
runbook.md
    └── Operational procedures and scripts
```

---

## 3. Core Rules & Constraints

### 3.1 Fundamental Rules

| # | Rule | Rationale | Required |
|---|------|-----------|----------|
| 1 | Never let the same model create AND approve the same output | Prevents self-review bias | Yes |
| 2 | Never auto-approve angles without human or GPT-5.5 validation | Ensures editorial quality | Yes |
| 3 | Never select only top 3 angles without user input | User must choose preferred angles | Yes |
| 4 | Never begin journalist collection before angle selection | Prevents wasted outreach | Yes |
| 5 | Process one active angle package at a time (unless batch requested) | Ensures focused quality | Yes |
| 6 | Never invent data, sources, journalist names, emails, or SERP findings | Hallucination prevention | Yes |
| 7 | Use "Information unavailable. Verification required before use." when data is missing | Mandatory fallback | Yes |
| 8 | Never skip required quality gates - mark as skipped if bypassed | Traceability | Yes |
| 9 | Never send to more than 15 journalists in first batch | Quality control | Yes |
| 10 | Never merge multiple angles into single email | Clarity | Yes |

### 3.2 Constraint Matrix

| Constraint | Applies To | Enforcement |
|------------|------------|--------------|
| Maximum 40 angles per campaign | Stage 4 | Hard limit |
| Minimum 8.5/10 for Stage 9 approval | Stage 9 | Quality gate |
| 500-600 word email body | Stage 8-9 | Template rule |
| 250-300 word "Why Newsworthy" | Stage 4 | Template rule |
| 800 max raw collection | Stage 6 | Collection rule |
| 5-15 first batch | Stage 6 | Send rule |

### 3.3 Prohibited Actions

**Never do these under any circumstances:**
- Create fake journalist profiles
- Invent article titles or coverage
- Fake quote attribution
- Claim unverified statistics as fact
- UseGeneric topic labels instead of specific beats
- Generate angles without source evidence
- Skip verification of collected journalist data

---

## 4. Model Stack Architecture

### 4.1 Tiered Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  TIER 1: QUALITY GATE (GPT-5.5 Thinking)                        │
│  - Final editorial judgment                                     │
│  - Scores all 40 angles                                         │
│  - Approves final email                                         │
│  - Maximum 3,000 thinking messages/week                        │
└─────────────────────────────────────────────────────────────────┘
                              ↑
                              │ Quality Review
                              │
┌─────────────────────────────────────────────────────────────────┐
│  TIER 2: RESEARCH (Nemotron 3 Super)                           │
│  - Study extraction                                            │
│  - Research enrichment                                         │
│  - Journalist intelligence                                      │
│  - 1M token context                                            │
└─────────────────────────────────────────────────────────────────┘
                              ↑
                              │ Data Extraction
                              │
┌─────────────────────────────────────────────────────────────────┐
│  TIER 3: PRODUCTION (MiniMax M2.5)                             │
│  - Pitch variants                                               │
│  - Email optimization                                           │
│  - Follow-up emails                                             │
│  - Google Doc formatting                                        │
└─────────────────────────────────────────────────────────────────┘
                              ↑
                              │ Draft Generation
                              │
┌─────────────────────────────────────────────────────────────────┐
│  TIER 4: ORCHESTRATION (Hy3 Preview)                           │
│  - Campaign intake                                              │
│  - Angle generation                                             │
│  - Beat matching                                                │
│  - Boolean search logic                                         │
└─────────────────────────────────────────────────────────────────┘
                              ↑
                              │ Workflow Coordination
                              │
┌─────────────────────────────────────────────────────────────────┐
│  TIER 5: QC (gpt-oss-120B)                                     │
│  - Pitch teardown                                               │
│  - Weak angle detection                                          │
│  - Secondary verification                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↑
                              │ Quality Check
                              │
┌─────────────────────────────────────────────────────────────────┐
│  TIER 6: TECHNICAL (Qwen/GLM/Poolside)                          │
│  - Dashboard development                                        │
│  - Script automation                                            │
│  - Export logic                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Model Specifications

#### Tier 1: GPT-5.5 Thinking (Quality Gate)

| Attribute | Value |
|-----------|-------|
| Provider | ChatGPT Plus (browser) |
| Context | 256K tokens |
| Thinking Mode | Enabled |
| Weekly Limit | 3,000 messages |
| Best For | Editorial judgment, angle scoring, final approval |
| Not For | High-volume generation |

**Usage Protocol:**
- Use for required quality gates only
- Skip for optional gates only when at limit
- Document skip reason when bypassed
- Reserve for strategic decisions, not formatting

#### Tier 2: Nemotron 3 Super (Research)

| Attribute | Value |
|-----------|-------|
| Provider | OpenRouter |
| Model ID | nvidia/nemotron-3-super-120b-a12b:free |
| Context | 1M tokens |
| Best For | Long studies, data extraction, methodology analysis |
| Not For | Creative writing |

**Usage Protocol:**
- Use for Stage 2 (extraction), Stage 3 (enrichment), Stage 7 (intelligence)
- Feed full context - 1M token capacity
- Extract all statistics, contradictions, methodology details

#### Tier 3: MiniMax M2.5 (Production)

| Attribute | Value |
|-----------|-------|
| Provider | OpenRouter |
| Model ID | minimax/minimax-m2.5:free |
| Context | High |
| Best For | Pitch variants, subject lines, email copy |
| Not For | Research or complex reasoning |

**Usage Protocol:**
- Use for Stage 8 (drafting), Stage 9 (optimization), Stage 10 (packaging)
- Generate 6 variants per selected angle
- Enforce 500-600 word limit
- Never approve own output - send to QC then GPT-5.5

#### Tier 4: Hy3 Preview (Orchestration)

| Attribute | Value |
|-----------|-------|
| Provider | OpenRouter |
| Model ID | tencent/hy3-preview:free |
| Context | 256K |
| Best For | Campaign setup, angle generation, beat mapping |
| Not For | Final quality decisions |

**Usage Protocol:**
- Use for Stage 1 (intake), Stage 4 (angle gen), Stage 5 (beat matching)
- Generate exactly 40 angles across 20 categories
- Never select angles - pass to GPT-5.5 for scoring

#### Tier 5: gpt-oss-120B (QC)

| Attribute | Value |
|-----------|-------|
| Provider | OpenRouter |
| Model ID | openai/gpt-oss-120b:free |
| Best For | Pitch teardown, weak angle detection |
| Not For | Final approval (not final-source-of-truth) |

**Usage Protocol:**
- Use after MiniMax in Stage 8
- Find weak angles, unsupported claims, promotional language
- Pass issues to GPT-5.5 for final decision

#### Tier 6: Qwen/GLM/Poolside (Technical)

| Attribute | Value |
|-----------|-------|
| Provider | OpenRouter |
| Model IDs | qwen/qwen3-coder-480b-a35b:free, THUDM/glm-4.5-air:free, poolside/laguna-m.1:free |
| Best For | Dashboard, scripts, export automation |
| Not For | Strategic decisions |

---

## 5. Model IDs & Provider Configuration

### 5.1 OpenCode Provider Selection

| Option | Use Case | Features |
|--------|----------|----------|
| **ChatGPT Pro/Plus (browser)** | Default for GPT-5.5 quality gates | Full features, 256K context, tools |
| **Headless** | VPS/SSH/server, browser unavailable | Limited features |
| **API Key** | Separate API billing | Standard API rates |

**Critical Configuration Note:**

> ChatGPT Plus subscription ≠ API credits
> - Browser login: Uses Plus features
> - API key: Uses standard API billing
> - Codex features: Only with ChatGPT login

### 5.2 Model ID Registry

```yaml
# Research & Extraction (Tier 2)
nvidia/nemotron-3-super-120b-a12b:free
  - Purpose: Study extraction, research enrichment
  - Context: 1M tokens
  - Quality: High accuracy on RULER

# Orchestration (Tier 4)
tencent/hy3-preview:free
  - Purpose: Campaign intake, angle generation
  - Context: 256K tokens
  - Quality: Strong reasoning

# Production Writing (Tier 3)
minimax/minimax-m2.5:free
  - Purpose: Pitch variants, email copy
  - Context: High
  - Quality: Professional output

# Backup QC (Tier 5)
openai/gpt-oss-120b:free
  - Purpose: Pitch teardown, weak angle detection
  - Quality: Good for finding issues

# Technical Stack (Tier 6)
qwen/qwen3-coder-480b-a35b:free
  - Purpose: Script automation, file operations
  
THUDM/glm-4.5-air:free
  - Purpose: Front-end dashboard, UI

poolside/laguna-m.1:free
  - Purpose: Long coding-agent work

# Quality Gate (Tier 1) - Browser Only
GPT-5.5 Thinking
  - Purpose: Final editorial judgment
  - Context: 256K tokens
  - Requires: ChatGPT Plus subscription
```

### 5.3 Coding Stack Assignment

| Task | Primary Model | Backup Model |
|------|---------------|--------------|
| Script automation | Qwen3 Coder | GLM 4.5 Air |
| Dashboard UI | GLM 4.5 Air | Qwen3 Coder |
| Long coding projects | Poolside Laguna M.1 | Qwen3 Coder |
| Architecture review | GPT-5.5 Thinking | N/A |

---

## 6. Stage Model Map & Handoffs

### 6.1 Complete Stage Map

| Stage | Name | Primary Model | Quality Gate | Pass Criteria | Output |
|-------|------|---------------|--------------|---------------|--------|
| 1 | Campaign Intake | Hy3 Preview | GPT-5.5 (optional) | Brief complete | `00-brief.md` |
| 2 | Study Extraction | Nemotron 3 Super | GPT-5.5 | Insights valid | `01-notes.md`, `02-insights.md` |
| 3 | Research Enrichment | Nemotron 3 Super | GPT-5.5 | Sources credible | `03-research.md` |
| 4 | Angle Generation | Hy3 Preview | **GPT-5.5 (required)** | 40 angles scored | `04-angles.md` |
| 5 | Beat Matching | Hy3 Preview | GPT-5.5 | Beats relevant | `05-beats.md` |
| 6 | Journalist Collection | Hy3 Preview | GPT-5.5 (Tier-1 only) | Collection complete | Artifacts |
| 7 | Journalist Intelligence | Nemotron 3 Super | GPT-5.5 | Profiles accurate | `06-intel.md`, `07-coverage.md` |
| 8 | Pitch Drafting | MiniMax M2.5 | gpt-oss → GPT-5.5 | 6 variants ready | `08-pitch.md`, variants |
| 9 | Email Optimization | GPT-5.5 | MiniMax (polish) | Score ≥8.5/10 | `09-optimized.md` |
| 10 | Final Package | MiniMax M2.5 | GPT-5.5 | Package complete | `10-google-doc.md` |
| 11 | Export | Qwen3 Coder | GLM/Poolside | Export valid | File |
| 12 | Validation | Qwen3 Coder | GLM/Poolside | All checks pass | Report |
| 13 | Browser/Search | Hy3 + GPT-5.5 | Nemotron | Results verified | Results |
| 14 | Regression | GPT-5.5 | gpt-oss-120B | Ready for production | Review |

### 6.2 Stage Handoff Matrix

| From | To | Required Data Package | Validation | Failure Action |
|------|----|----------------------|------------|----------------|
| 1→2 | | `00-brief.md` | Brief has goal/topic/beats | Return to Stage 1 |
| 2→3 | | `01-notes.md`, `02-insights.md` | At least 1 insight | Return to Stage 2 |
| 3→4 | | `02-insights.md`, `03-research.md` | Sources with credibility | Return to Stage 3 |
| 4→5 | | `04-angles.md` with user selection | At least 1 selected | Pause for user |
| 5→6 | | `05-beats.md` with active angle | Beat mapping complete | Return to Stage 5 |
| 6→7 | | Collection artifacts | 50+ journalists | Retry collection |
| 7→8 | | `06-intel.md`, `07-coverage.md` | At least 10 profiles | Retry intelligence |
| 8→9 | | `08-pitch.md` with selected variant | Variant selected | Return to Stage 8 |
| 9→10 | | `09-optimized.md` with score ≥8.5 | Score verified | Return to Stage 9 |
| 10→11 | | `10-google-doc.md` | Package complete | Return to Stage 10 |

### 6.3 Data Flow Diagram

```
Stage 1: Brief
    ↓
Stage 2: Study Notes + Insights
    ↓
Stage 3: Research Enrichment
    ↓
Stage 4: 40 Angles → GPT-5.5 Scores → User Selects
    ↓
Stage 5: Beat Matching
    ↓
Stage 6: Journalist Collection
    ↓
Stage 7: Journalist Intelligence
    ↓
Stage 8: 6 Pitch Variants → QC → GPT-5.5 Selects
    ↓
Stage 9: Optimized Email (8.5+/10)
    ↓
Stage 10: Final Package
    ↓
Stage 11-14: Export → Validate → Verify → Ready
```

---

## 7. Stage 1: Campaign Intake

### Purpose
Transform raw campaign brief into structured `00-brief.md` that guides all downstream stages.

### Model Assignment
| Role | Model | Required |
|------|-------|----------|
| Primary | Hy3 Preview | Yes |
| Quality Gate | GPT-5.5 (optional) | No |

### Inputs (Acceptable)
- Email from client
- Document (PDF, Word)
- Verbal briefing (transcribed)
- Chat message
- Previous campaign reference

### Process
1. Extract client name and contact
2. Identify campaign goal
3. Determine topic and scope
4. List key data points (if provided)
5. Define target audiences
6. Identify target beats
7. Note timeline and constraints
8. Flag any unclear information

### Output Specification

```markdown
# Campaign Brief

## Client Information
- **Client Name:** [Name]
- **Contact:** [Email/Phone]
- **Campaign ID:** [Auto-generated]

## Campaign Goal
[Primary objective - what success looks like]

## Topic
[What the campaign is about - one sentence]

## Key Data Points
- [Point 1 - specific statistic or finding]
- [Point 2]
[If no data provided, note: "Data to be extracted from study"]

## Target Audiences
- [Audience 1 - e.g., homeowners, renters, employers]
- [Audience 2]

## Target Beats (Minimum 3)
- [Beat 1 - e.g., Consumer affairs, Business, Technology]
- [Beat 2]
- [Beat 3]

## Geographic Focus
- [City/State/Region or National]

## Timeline
- **Received:** [Date]
- **Deadline:** [Date]
- **Urgency:** Normal/Urgent/Critical

## Constraints
- [Any budget, messaging, or target restrictions]
- [Any off-limits topics or angles]

## Notes
- [Any additional context]
- [Questions for clarification]
```

### Quality Gate Prompt (GPT-5.5 - Optional)
```
Review the campaign brief for:
1. Goal clarity - Is the objective specific and achievable?
2. Beat alignment - Are target beats relevant to the topic?
3. Data availability - Is there sufficient data or must it be extracted?
4. Timeline feasibility - Can this be executed in the given time?

Return: APPROVED or REVISIONS NEEDED with specific issues.
```

### Validation Checklist
- [ ] Client name present
- [ ] Campaign goal stated
- [ ] Topic defined
- [ ] At least 3 target beats identified
- [ ] Timeline noted
- [ ] Unclear items flagged

### Common Issues
| Issue | Resolution |
|-------|------------|
| Vague goal | Ask clarifying questions |
| No target beats | Propose relevant beats based on topic |
| No data | Note "data extraction required" |
| Conflicting info | Flag and ask for clarification |

---

## 8. Stage 2: Study Extraction

### Purpose
Extract all statistics, insights, contradictions, methodology, and caveats from raw study data.

### Model Assignment
| Role | Model | Required |
|------|-------|----------|
| Primary | Nemotron 3 Super | Yes |
| Quality Gate | GPT-5.5 | Yes |

### Inputs
- `00-brief.md`
- Raw study document (PDF, report, dataset, article)
- Any supplementary data files

### Process
1. Read entire study/document
2. Extract all numerical findings
3. Identify methodology and limitations
4. Flag contradictions or conflicts
5. Note source credibility indicators
6. Score novelty of each finding
7. Add appropriate caveats

### Output Specifications

#### 01-study-notes.md (Raw Extraction)
```markdown
# Study Notes

## Source Information
- **Title:** [Study title]
- **Source:** [Organization/Author]
- **Date:** [Publication date]
- **Type:** [Report/Survey/Study/Dataset]

## Methodology
[How the study was conducted - sample size, methodology, timeframe]

## Key Findings (Raw)
- [Finding 1 with exact numbers]
- [Finding 2]
[Continue for all findings]

## Limitations Noted
[What the study does NOT claim]

## Contradictions
[Any conflicting data points within the study]
```

#### 02-insights.md (Structured)
```markdown
# Insights

| Rank | Finding | Evidence | Why It Matters | Novelty Score | Caveat |
|------|---------|----------|----------------|---------------|--------|
| 1 | [Specific stat] | [Exact quote/number] | [Editorial relevance] | 1-10 | [Source limitations] |
| 2 | | | | | |
```

### Insight Fields Explained

| Field | Description | Example |
|-------|-------------|---------|
| Finding | What the data shows | "Texas pedestrian deaths increased 16.1%" |
| Evidence | Raw statistic | "1,020 to 1,184 (2023-2024)" |
| Why It Matters | Editorial relevance | "Local angle for TX journalists" |
| Novelty Score | 1-10 uniqueness | 9 |
| Caveat | Source limitations | "Sample only, not statewide" |

### Novelty Scoring Guide

| Score | Meaning | Use Case |
|-------|---------|----------|
| 10 | Unique, breakthrough finding | Headline angle |
| 8-9 | Strong, newsworthy data | Primary angles |
| 6-7 | Useful but common | Supporting angles |
| 4-5 | Weak or limited | Use with caution |
| 1-3 | Unsupported, weak | Do not use externally |

### Quality Gate Prompt (GPT-5.5)
```
Review the extracted insights for:
1. Accuracy - Are statistics represented correctly?
2. Methodology - Is the study design correctly characterized?
3. Contradictions - Are all conflicts flagged?
4. Caveats - Are appropriate limitations noted?
5. Novelty scoring - Are scores justified?

For each insight, verify:
- Evidence matches original source
- "Why It Matters" is editorial-relevant
- Novelty score is appropriate
- Caveat accurately reflects limitations

Return: APPROVED or REVISIONS NEEDED with specific fixes.
```

### Validation Checklist
- [ ] At least 1 insight extracted
- [ ] All statistics have evidence
- [ ] Methodology noted
- [ ] Limitations flagged
- [ ] Novelty scores assigned
- [ ] Caveats added where needed

### Common Issues
| Issue | Resolution |
|-------|------------|
| Contradictory data | Flag both, note conflict |
| Missing sample size | Note "methodology unclear" |
| Outdated source | Flag with date caveat |
| Proxy data | Note "proxy indicator, verification needed" |

---

## 9. Stage 3: Research Enrichment

### Purpose
Perform SERP research, verify sources, assess credibility, and identify market context.

### Model Assignment
| Role | Model | Required |
|------|-------|----------|
| Primary | Nemotron 3 Super | Yes |
| Quality Gate | GPT-5.5 | Yes |

### Inputs
- `00-brief.md`
- `01-study-notes.md`
- `02-insights.md`

### Process
1. Verify each insight with external sources
2. Perform SERP search for each angle
3. Assess source credibility (1-5 scale)
4. Identify market context
5. Find competitor coverage
6. Identify research gaps

### Output Specification

```markdown
# Research Enrichment

## Source Credibility Assessment

| Source | Type | Credibility Score | Notes |
|--------|------|-------------------|-------|
| [Source 1] | Government | 5 | Official dataset |
| [Source 2] | Industry | 4 | Trade association |
| [Source 3] | Academic | 5 | Peer-reviewed |
| [Source 4] | News | 3 | May have bias |

### Credibility Scale
- 5 = Authoritative (government, peer-reviewed)
- 4 = Strong (industry reports, established nonprofits)
- 3 = Moderate (news coverage, general websites)
- 2 = Weak (blogs, opinion pieces)
- 1 = Unverified (unknown sources)

## SERP Analysis

### Angle 1: [Angle Topic]
- **Current Coverage:** [What exists]
- **Ranking Opportunity:** [High/Medium/Low]
- **Data Gaps:** [What's missing]
- **Freshness:** [Current vs. dated]

### [Repeat for each angle]

## Market Context
[Why is this news NOW?]

## Competitor Coverage
[What have others published?]

## Research Gaps
[What angles are underserved?]
```

### Quality Gate Prompt (GPT-5.5)
```
Review the research enrichment for:
1. Source credibility - Are scores justified?
2. SERP accuracy - Is coverage assessment correct?
3. Market context - Is the "why now" valid?
4. Gap identification - Are gaps genuine?

Verify:
- Sources exist and are accessible
- SERP findings are current
- Competitor analysis is accurate
- Gaps are truly underserved

Return: APPROVED or REVISIONS NEEDED.
```

### Validation Checklist
- [ ] All major insights verified
- [ ] Credibility scores assigned
- [ ] SERP analysis done
- [ ] Market context identified
- [ ] Competitor coverage noted
- [ ] Research gaps identified

---

## 10. Stage 4: Angle Generation & Scoring

### Purpose
Generate exactly 40 journalist-ready pitch angles across 20 categories, then have GPT-5.5 score every angle.

### Model Assignment
| Role | Model | Required |
|------|-------|----------|
| Primary | Hy3 Preview | Yes |
| Quality Gate | **GPT-5.5** | **Yes (Mandatory)** |

### Inputs
- `00-brief.md`
- `02-insights.md`
- `03-research.md`
- Any verified source notes
- Caveats and limitations

### Process
1. Review all Stage 1-3 outputs
2. Identify strongest data points
3. Select 20 categories from evidence
4. Generate 2 angles per category (40 total)
5. Map to specific journalist beats
6. Write "Why Newsworthy" (250-300 words each)
7. Pass to GPT-5.5 for scoring
8. Display all 40 in final table
9. Wait for user selection
10. Pass selected to Stage 5

### Output Specification

```markdown
# Pitch Angles

## Final Selection Table

| # | Category | Journalist Beats | Pitch Angle | Why This is Newsworthy | Score | Selected |
|---|----------|------------------|-------------|------------------------|-------|----------|
| 1 | Consumer Behavior | Consumer affairs, Business | [Angle headline] | [250-300 words] | [1-10] | [ ] |
| 2 | Consumer Behavior | Personal finance, Lifestyle | [Angle headline] | [250-300 words] | [1-10] | [ ] |
[...40 rows total...]
```

### Checkbox Syntax
- Unchecked: `[ ]`
- Checked by user: `[x]`

### Category Selection (20 from evidence)

| Category | Use When |
|----------|----------|
| Consumer Behavior | How people buy, choose, trust, avoid |
| Public Safety | Injury, risk, prevention, emergencies |
| Personal Finance | Costs, debt, insurance, savings |
| Healthcare | Outcomes, access, costs, risks |
| Workplace Trends | Workers, employers, hiring, benefits |
| Technology | Platforms, AI, privacy, cybersecurity |
| Education | Schools, colleges, students, policy |
| Legal Accountability | Litigation, rights, regulation |
| Local/State Rankings | City, county, state comparisons |
| Generational Trends | Age group differences |
| Gender Gaps | Gender or family role differences |
| Economic Impact | Spending, markets, jobs |
| Policy and Regulation | Laws, agencies, budgets |
| Risk and Safety | Exposure, prevention gaps |
| Family and Parenting | Parents, children, caregivers |
| Environmental Impact | Climate, pollution, sustainability |
| Industry Trends | Market shifts, competition |
| Social Media Trends | Online behavior, platforms |
| Lifestyle Impact | Housing, travel, food, wellness |
| Data Rankings | Scorecards, maps, dashboards |

### "Why This is Newsworthy" Requirements (250-300 words each)

Must include ALL five sections:

#### 1. Data-Rich Justification
Include specific statistics, percentages, rankings. If unavailable, state "Verification required."

#### 2. Research Support
Reference: government datasets, industry reports, academic studies, surveys, public databases

#### 3. Market Context
- Why gaining attention NOW
- What trend it connects to
- Which audiences affected
- Is issue growing or underreported?

#### 4. Media Value
- Why journalist would care
- Why readers would care
- What makes it publishable
- Can it be localized/visualized?

#### 5. Talking Points (4-5 points)
Reusable in pitch emails

### SERP Research Requirements

Before finalizing angles, verify:
- [ ] Existing media coverage checked
- [ ] Ranking opportunities identified
- [ ] Story gaps uncovered
- [ ] Search demand signals found
- [ ] Freshness confirmed
- [ ] Overused angles avoided

### GPT-5.5 Scoring Criteria

| Criteria | Weight | Description |
|----------|--------|-------------|
| Newsworthiness | High | Is this genuinely newsworthy? |
| Data Strength | High | Is data specific and verifiable? |
| SERP Potential | High | Can this rank in search? |
| Journalist Appeal | High | Would a journalist care? |
| Relevance | High | Does it fit the campaign? |
| Timeliness | Medium | Is it current or connected to now? |
| Originality | Medium | Is it fresh or overused? |
| Clarity | Medium | Is it clear and simple? |
| Emotional Pull | Medium | Does it engage? |
| Public Interest | Medium | Does it serve public good? |
| Link Potential | Medium | Can it earn links? |
| Headline Strength | Medium | Is there a strong headline? |
| Localization | Medium | Can it be localized? |

### Scoring Guide

| Score | Meaning | Action |
|-------|---------|--------|
| 10 | Exceptional - breakout potential | Strong candidate |
| 9 | Very strong - ranking potential | Strong candidate |
| 8 | Strong - may need refinement | Good candidate |
| 7 | Usable - not strongest | Consider with caveats |
| 6 | Average - weak differentiation | Weaker candidate |
| 5 | Basic - limited appeal | Avoid |
| 4 | Weak - unclear value | Do not use |
| 3 | Poor - little newsworthiness | Do not use |
| 2 | Very weak - no potential | Do not use |
| 1 | Not suitable | Do not use |

### Prompt for Hy3 (Generation)

```
You are a senior Digital PR strategist.

Read Stage 1-3 outputs:
- Campaign: [from 00-brief.md]
- Insights: [from 02-insights.md]
- Research: [from 03-research.md]

Generate exactly 40 journalist-ready pitch angles.

REQUIREMENTS:
- 20 categories based on campaign evidence
- 2 unique angles per category (40 total)
- Specific journalist beats for each angle
- 250-300 word "Why This is Newsworthy" per angle
- SERP-backed support where applicable
- Score field left BLANK for GPT-5.5
- Selected field using [ ] checkbox

RULES:
- Do NOT create generic angles
- Do NOT invent statistics
- Do NOT force weak categories
- Each angle must be simple, specific, data-led
- Each angle must be distinct from the other 39

OUTPUT FORMAT:
Category | Journalist Beats | Pitch Angle | Why This is Newsworthy | Score | Selected
```

### Prompt for GPT-5.5 (Scoring)

```
You are a senior newsroom editor and Digital PR quality gate.

Review ALL 40 pitch angles generated for this campaign.

INPUTS:
- Campaign brief: [brief]
- Insights: [insights]
- Research: [research]
- Generated angles: [40 angles]

TASK:
For EACH angle:
1. Verify alignment with campaign goal
2. Check journalist beat relevance
3. Assess SERP freshness and ranking potential
4. Evaluate originality (vs. overused angles)
5. Verify "Why Newsworthy" has data support
6. Score from 1-10
7. Add note if below 8

DO NOT:
- Select only the top 3
- Approve automatically
- Skip any angle

OUTPUT:
Return ALL 40 angles with scores in final table format.
User will select preferred angle(s) manually using checkboxes.
```

### User Selection Rules
1. User must select at least 1 angle
2. User can select multiple angles
3. If multiple selected → identify ONE active for next run
4. Workflow PAUSES until selection complete
5. Selected angles move to Stage 5

### Validation Checklist
- [ ] Exactly 40 angles generated
- [ ] 20 categories represented
- [ ] Each angle has beats
- [ ] Each angle has 250-300 word justification
- [ ] All 40 scored by GPT-5.5
- [ ] User has selected at least 1
- [ ] Active angle identified for next stage

### Common Issues
| Issue | Resolution |
|-------|------------|
| Fewer than 40 angles | Regenerate to meet requirement |
| Generic angles | Regenerate with specific framing |
| Missing beats | Add specific beat mapping |
| Short justifications | Expand to 250-300 words |
| No scores | Send to GPT-5.5 for scoring |
| User hasn't selected | PAUSE workflow |

---

## 11. Stage 5: Beat Matching & Selection

### Purpose
Map selected angle(s) to specific journalist beats and establish outreach targets.

### Model Assignment
| Role | Model | Required |
|------|-------|----------|
| Primary | Hy3 Preview | Yes |
| Quality Gate | GPT-5.5 | Yes |

### Inputs
- `04-angles.md` (with user-selected angles)
- `03-research.md`

### Process
1. Take selected angle(s) from Stage 4
2. Map each to primary and secondary beats
3. Write beat rationale
4. Assign outreach priority (Tier 1/2/3)
5. Validate with GPT-5.5

### Output Specification

```markdown
# Beat Matching

## Active Selected Angle
**Angle:** [Selected angle from Stage 4]
**Score:** [From Stage 4]
**Category:** [Category]

## Beat Mapping

### Primary Beat
- **Beat:** [Main journalist beat]
- **Rationale:** [Why this beat fits]
- **Priority:** Tier 1

### Secondary Beats
- **Beat 1:** [Related beat]
- **Beat 2:** [Related beat]
- **Priority:** Tier 2/3

## Outreach Priority Matrix

| Tier | Description | Target Count |
|------|-------------|--------------|
| Tier 1 | Strong beat match, high relevance | 15-30 |
| Tier 2 | Related beat, moderate relevance | 30-50 |
| Tier 3 | tangential match, low relevance | 50+ |

## Rationale
[Why these beats are the right targets]
```

### Beat Types (Specific, Not Generic)

| Beat Category | Specific Examples |
|---------------|-------------------|
| Consumer | Consumer affairs reporter, personal finance journalist, business reporter |
| Safety | Public safety journalist, crime reporter, transportation editor |
| Health | Health reporter, healthcare journalist, medical editor |
| Business | Business reporter, economy journalist, Wall Street correspondent |
| Tech | Technology reporter, cybersecurity journalist, AI editor |
| Education | Education reporter, school board journalist, higher ed reporter |
| Legal | Legal affairs reporter, court reporter, investigative journalist |
| Data | Data journalist, quantitative reporter, graphics editor |
| Local | Local news editor, city hall reporter, regional correspondent |
| Policy | Policy reporter, government affairs, Capitol correspondent |

### Quality Gate Prompt (GPT-5.5)
```
Review the beat mapping for:
1. Beat relevance - Are beats genuinely relevant to the selected angle?
2. Rationale quality - Is the rationale logical and specific?
3. Priority assignment - Is the tier assignment appropriate?
4. Coverage - Are enough beats identified?

Check:
- Primary beat matches angle topic
- Secondary beats provide backup options
- Tier assignment reflects true relevance

Return: APPROVED or REVISIONS NEEDED.
```

### Validation Checklist
- [ ] At least 1 beat mapped
- [ ] Rationale provided
- [ ] Priority assigned
- [ ] GPT-5.5 approved
- [ ] Ready for Stage 6

---

## 12. Stage 6: Journalist Collection

### Purpose
Collect journalist profiles from Muck Rack and other sources for target beats.

### Model Assignment
| Role | Model | Required |
|------|-------|----------|
| Primary | Hy3 Preview | Yes |
| Quality Gate | GPT-5.5 (Tier-1 only) | No |

### Inputs
- `05-beats.md`

### Process
1. Use beat mapping to define search queries
2. Execute Muck Rack collection (or alternative)
3. Collect up to 800 raw profiles per beat
4. Clean and deduplicate
5. Score relevance
6. Pass top profiles to Stage 7

### Collection Rules

| Stage | Target | Purpose |
|-------|--------|---------|
| Raw collected | 800 max | Initial pool |
| Cleaned/relevant | 150-250 | After dedupe |
| Strong beat match | 60-100 | Scored relevant |
| Tier-1 personalized | 15-30 | High priority |
| First send batch | 5-15 | Quality threshold |

### Collection Requirements
- Must have selected angle before collection
- Must verify journalist accuracy
- Must use logged-in browser session
- Must document collection method

### Quality Note
Do NOT send to all 800. Quality beats quantity. Muck Rack data:
- 69% say pitch worth time if tailored to beat
- 86% disregard irrelevant pitches

### Validation Checklist
- [ ] Collection run with selected angle
- [ ] Maximum 800 raw profiles
- [ ] Deduplication performed
- [ ] Profiles verified
- [ ] Ready for Stage 7

---

## 13. Stage 7: Journalist Intelligence

### Purpose
Analyze collected journalists for relevance, coverage history, and personalization.

### Model Assignment
| Role | Model | Required |
|------|-------|----------|
| Primary | Nemotron 3 Super | Yes |
| Quality Gate | GPT-5.5 | Yes |

### Inputs
- Collected journalist profiles
- `05-beats.md`

### Process
1. Analyze each journalist profile
2. Review recent coverage (last 5-10 articles)
3. Score relevance (1-10)
4. Identify personalization hooks
5. Note social media presence
6. Create intelligence report

### Output Specifications

#### 06-journalist-intel.md
```markdown
# Journalist Intelligence

## Summary
- **Total Collected:** [Number]
- **Analyzed:** [Number]
- **High Relevance (8-10):** [Number]
- **Medium Relevance (5-7):** [Number]
- **Low Relevance (1-4):** [Number]

## Journalist Profiles

| Name | Outlet | Beat | Relevance | Personalization Notes |
|------|--------|------|-----------|----------------------|
| [Name] | [Outlet] | [Beat] | [1-10] | [Beat-specific hooks] |
```

### Intelligence Fields

| Field | Description |
|-------|-------------|
| Name | Verified journalist name |
| Outlet | Publication/media outlet |
| Beat | Coverage area |
| Recent Articles | Last 5-10 headlines |
| Social | Twitter/X, LinkedIn presence |
| Relevance Score | 1-10 based on beat match |
| Personalization Notes | Beat-specific hooks for outreach |

#### 07-journalist-coverage.md
```markdown
# Journalist Coverage Analysis

## Coverage Patterns

### Journalist: [Name]
- **Recent Coverage:** [Article 1], [Article 2], [Article 3]
- **Coverage Themes:** [Theme 1], [Theme 2]
- **Story Angles They Cover:** [Angle type]
- **What They DON'T Cover:** [Exclusions]

### [Repeat for each high-relevance journalist]
```

### Quality Gate Prompt (GPT-5.5)
```
Review the journalist intelligence for:
1. Profile accuracy - Are names/outlets verified?
2. Relevance scoring - Are scores justified?
3. Personalization validity - Are hooks based on real coverage?

Verify:
- Recent articles actually exist
- Beat assignment is correct
- Personalization is from captured evidence

Return: APPROVED or REVISIONS NEEDED.
```

### Validation Checklist
- [ ] At least 10 profiles analyzed
- [ ] Relevance scores assigned
- [ ] Personalization notes included
- [ ] Coverage patterns identified
- [ ] GPT-5.5 approved
- [ ] Ready for Stage 8

---

## 14. Stage 8: Pitch Drafting

### Purpose
Write six email variants for the active selected angle.

### Model Assignment
| Role | Model | Required |
|------|-------|----------|
| Primary | MiniMax M2.5 | Yes |
| QC Gate | gpt-oss-120B | Yes |
| Final Gate | GPT-5.5 | Yes |

### Inputs
- `05-beats.md` (active selected angle)
- `06-journalist-intel.md`
- `07-journalist-coverage.md`
- `02-insights.md`
- `03-research.md`

### Process
1. Take active selected angle
2. Generate 6 variants using MiniMax
3. Run gpt-oss-120B for QC
4. Send to GPT-5.5 for final selection
5. Create final `08-pitch-draft.md`

### Variant Types

| Variant | Style | Word Count | Focus |
|---------|-------|------------|-------|
| 08a-straight-news | Classic news lede | 500-600 | Facts-first |
| 08b-short-punchy | Concise | Under 150 | Brief hook |
| 08c-data-heavy | Statistics | 500-600 | Numbers focus |
| 08d-journalist-personalized | Beat-specific | 500-600 | Tailored |
| 08e-storytelling-narrative | Story-driven | 500-600 | Narrative |
| 08f-localized | Geographic | 500-600 | Local angle |

### Drafting Rules

| Rule | Requirement |
|------|-------------|
| Word count | 500-600 words (full variants) |
| Angle lock | Reference active angle ONLY |
| Evidence | Use only verified claims |
| Personalization | From captured intelligence only |
| No merge | Do not combine multiple angles |

### Output Files
- `draft-variants/08a-straight-news.md`
- `draft-variants/08b-short-punchy.md`
- `draft-variants/08c-data-heavy.md`
- `draft-variants/08d-journalist-personalized.md`
- `draft-variants/08e-storytelling-narrative.md`
- `draft-variants/08f-localized.md`
- `08-pitch-draft.md` (selected final)

### Prompt for MiniMax (Drafting)
```
Write six journalist email variants for the active selected angle.

INPUTS:
- Active angle: [from 05-beats.md]
- Journalist intel: [from 06-journalist-intel.md]
- Coverage: [from 07-journalist-coverage.md]
- Evidence: [from 02-insights.md, 03-research.md]

REQUIREMENTS:
- Each variant: 500-600 words (except 08b: under 150)
- Use analytical table when data supports
- Reference active angle clearly
- Use only verified claims
- Personalize from captured evidence
- Do NOT draft for secondary/backlog angles
- Do NOT merge multiple angles

VARIANTS:
1. 08a-straight-news: Classic news lede, facts-first
2. 08b-short-punchy: Under 150 words, brief hook
3. 08c-data-heavy: Statistics-focused
4. 08d-journalist-personalized: Beat-specific customization
5. 08e-storytelling-narrative: Story-driven narrative
6. 08f-localized: Geographic/local focus
```

### Prompt for gpt-oss-120B (QC)
```
Review the six pitch variants. Find:

1. Weak angles that should be rejected
2. Unsupported claims (any claim not in evidence)
3. Over-promotional language
4. Generic/fluff content
5. Logic gaps or contradictions
6. Personalization issues (fake or unsupported)

For EACH variant, list:
- Variant name
- Issues found (if any)
- Severity: High/Medium/Low
- Recommendation: Keep/Revise/Discard

Return organized list of all issues.
```

### Prompt for GPT-5.5 (Final Selection)
```
Review the six pitch variants for the active selected angle.

INPUTS:
- Active angle: [from Stage 4-5]
- QC findings: [from gpt-oss-120B]
- Variants: [6 drafts]

CHECK for EACH variant:
1. Newsworthiness - Is it genuinely interesting?
2. Evidence safety - Are all claims supported?
3. Journalist fit - Does it match the beat?
4. Personalization quality - Is it tailored, not generic?
5. Subject line strength - Would you open this?
6. Clarity - Is it easy to understand?
7. Non-AI tone - Does it feel human-written?
8. Angle lock - Does it stay on the selected angle?

RETURN for each variant:
- Keep/Revise/Discard
- Required edits (if any)
- Final quality score (1-10)

THEN identify:
- Best variant
- Overall recommendation
```

### Quality Gate Rules
- MiniMax generates → gpt-oss finds issues → GPT-5.5 selects
- Never use MiniMax output without QC
- Never skip GPT-5.5 final selection

### Validation Checklist
- [ ] 6 variants generated
- [ ] Each within word limits
- [ ] QC completed
- [ ] GPT-5.5 selected best
- [ ] Final variant saved as `08-pitch-draft.md`

---

## 15. Stage 9: Email Optimization

### Purpose
Finalize the email for mainstream media outreach with 8.5/10 minimum.

### Model Assignment
| Role | Model | Required |
|------|-------|----------|
| Primary | GPT-5.5 | Yes |
| Polish | MiniMax M2.5 | No |

### Inputs
- `08-pitch-draft.md` (selected variant)
- `06-journalist-intel.md`

### Process
1. Review selected variant with GPT-5.5
2. Check all quality factors
3. Score using 16-factor scorecard
4. Require minimum 8.5/10
5. If below threshold, request revisions
6. MiniMax can do minor polish
7. Final approval by GPT-5.5

### 16-Factor Quality Scorecard

| Factor | Weight | Description |
|--------|--------|-------------|
| Hook Strength | High | First line grabs attention |
| Clarity | High | Easy to understand |
| Specificity | High | Data-led, not vague |
| Data Framing | High | Statistics presented well |
| Psychological Trigger (Ethical) | High | Appropriate interest without manipulation |
| Journalist Relevance | High | Tailored to beat |
| Human Tone | High | Not AI-sounding |
| Credibility | High | Source-backed |
| Brevity | Medium | Concise, no filler |
| Flow | Medium | Logical progression |
| CTA Strength | Medium | Clear call-to-action |
| Newsworthiness | High | Genuinely interesting |
| Originality | Medium | Not generic |
| Non-salesy Tone | High | Not promotional |
| Inbox Readability | High | Renders well in email |
| Editorial Usefulness | High | Journalist can use this |

### Minimum Threshold: 8.5/10

### Scoring Guide

| Score | Meaning | Action |
|-------|---------|--------|
| 10 | Exceptional | Ready for send |
| 9 | Very strong | Minor polish ok |
| 8.5-8.9 | Strong | Small edits only |
| 8.0-8.4 | Acceptable | Revisions needed |
| Below 8.0 | Not ready | Major revision required |

### Output Specification

```markdown
# Optimized Email

## Quality Score
**Score: X/10**

## Subject Line
[Optimized subject line]

## Email Body
[Final optimized version - 500-600 words]

## Analytical Table
[If data supports it]

## Verification Checklist
- [ ] All claims supported by evidence
- [ ] Personalization from captured intelligence
- [ ] No invented data or sources
- [ ] No clickbait or over-promise
- [ ] Mobile-friendly formatting
- [ ] Low deliverability risk

## Approval
**Status:** APPROVED / REVISIONS REQUIRED
```

### Prompt for GPT-5.5 (Optimization)
```
Validate the optimized email for mainstream media outreach.

CHECK:
1. Subject line strength - Would you open this?
2. Personalization quality - Is it tailored to the beat?
3. Claim verification - Are all claims supported by evidence?
4. Mobile readability - Does it render well on mobile?
5. CTA clarity - Is the call-to-action clear?
6. Deliverability risk - Is it likely to land in inbox?
7. Alignment - Does it match the selected angle?
8. Ethical triggers - Are psychological triggers appropriate?

SCORE using 16-factor scorecard.

RETURN:
- Score (must be 8.5+ to approve)
- APPROVED or REVISIONS REQUIRED
- Specific issues if revisions needed
```

### Validation Checklist
- [ ] All claims verified
- [ ] Personalization valid
- [ ] No hallucinated content
- [ ] Score 8.5 or higher
- [ ] GPT-5.5 approved
- [ ] Ready for Stage 10

---

## 16. Stage 10: Final Package

### Purpose
Compile the final package for export and delivery.

### Model Assignment
| Role | Model | Required |
|------|-------|----------|
| Primary | MiniMax M2.5 | Yes |
| Quality Gate | GPT-5.5 | Yes |

### Inputs
- `09-optimized-email.md`
- `04-angles.md` (selected angle)
- `02-insights.md`
- `03-research.md`

### Process
1. Compile all elements into package
2. Add campaign metadata
3. Include evidence summary
4. Preserve all caveats
5. Document methodology
6. Final review by GPT-5.5
7. Export-ready format

### Output Specification

```markdown
# Final Package

## Campaign Summary
- **Client:** [Name]
- **Campaign ID:** [ID]
- **Date:** [Date]
- **Stage:** Final Package

## Selected Angle
**Angle:** [From Stage 4]
**Score:** [From Stage 4]
**Category:** [Category]

## Final Email
- **Subject:** [Subject line]
- **Body:** [500-600 words]
- **Quality Score:** [8.5+/10]

## Evidence Summary
- **Key Statistic:** [Main data point]
- **Source:** [Origin]
- **Caveats:** [Limitations]

## Methodology
[How angle was derived from data]

## Caveats
[Any source limitations to preserve]

## Assets Available
- [Data files]
- [Expert contacts]
- [Additional materials]

## Quality Gate
**Approved by:** GPT-5.5
**Approval Date:** [Date]
**Ready for Export:** Yes/No
```

### Prompt for GPT-5.5 (Final Approval)
```
Act as newsroom editor and final production gate.

Review the final package:
1. Would you send this to a real journalist? Yes/No
2. Are all claims supported by evidence?
3. Does the email match the selected angle?
4. Are caveats preserved and accurate?
5. Is the package complete and export-ready?
6. Is quality score 8.5 or higher?

RETURN:
- APPROVED or REVISIONS NEEDED
- If approved: "Ready for production"
- If revisions: Specific requirements
```

### Validation Checklist
- [ ] All sections complete
- [ ] Evidence summary accurate
- [ ] Caveats preserved
- [ ] Quality score documented
- [ ] GPT-5.5 approved
- [ ] Export-ready format

---

## 17. Stage 11: Export & Delivery

### Purpose
Export final package to delivery format.

### Model Assignment
| Role | Model | Required |
|------|-------|----------|
| Primary | Qwen3 Coder | Yes |
| Secondary | GLM 4.5 Air | No |

### Process
1. Convert to delivery format
2. Apply formatting standards
3. Create delivery package
4. Validate output

---

## 18. Stage 12: Technical Validation

### Purpose
Validate all technical components.

### Model Assignment
| Role | Model | Required |
|------|-------|----------|
| Primary | Qwen3 Coder | Yes |
| Secondary | GLM 4.5 Air | No |

### Process
1. Validate JSON structure
2. Check script syntax
3. Verify file paths
4. Test automation

---

## 19. Stage 13: Browser & Search Validation

### Purpose
Verify SERP and Muck Rack results.

### Model Assignment
| Role | Model | Required |
|------|-------|----------|
| Primary | Hy3 Preview | Yes |
| Verification | GPT-5.5 | No |
| Accuracy Check | Nemotron 3 Super | No |

### Process
1. Execute SERP searches
2. Verify results accuracy
3. Check Muck Rack access
4. Validate journalist data

---

## 20. Stage 14: Regression & Production Readiness

### Purpose
Final quality check before production.

### Model Assignment
| Role | Model | Required |
|------|-------|----------|
| Primary | GPT-5.5 | Yes |
| Secondary QC | gpt-oss-120B | No |

### Process
1. Run full regression check
2. Verify all stages complete
3. Final quality review
4. Mark as production-ready

---

## 21. Journalist Pool Scaling Protocol

### Critical Rule
**Never email 800 journalists per beat.**

800 is a **raw collection pool** only.

| Stage | Target | Purpose |
|-------|--------|---------|
| Raw collected | 800 max | Initial pool |
| First send batch | 5-15 | Quality threshold |

### Why Quality > Quantity
- 69% of journalists say pitch worth time if tailored
- 86% disregard irrelevant pitches
- (Source: Muck Rack 2025 State of Journalism)

### First Batch Rules
- Maximum 15 journalists in first batch
- Prefer 5-10 for new campaigns
- Must have strong personalization
- Must match selected angle beat

---

## 22. Daily Operations & Capacity Planning

### 22.1 Daily Workflow Sequence

```
1. Hy3 reads brief → creates campaign structure
2. Nemotron extracts stats, insights, contradictions
3. Hy3 generates angles and beat mappings
4. gpt-oss-120B rejects weak angles
5. MiniMax drafts pitch variants
6. GPT-5.5 selects, rewrites, validates, approves
7. Qwen/GLM/Poolside handles export/automation
```

### 22.2 Capacity Planning

| Workload | Estimate |
|----------|----------|
| Campaigns/day | 10 |
| Angles/campaign | 40 |
| Angles/day | 400 |
| Pitch variants/angle | 6 |
| Pitch variants/day (1 angle/campaign) | 60 |
| Pitch variants/day (8 angles/campaign) | 480 |

### 22.3 Daily Model Allocation

| Model | Daily Requests | Notes |
|-------|----------------|-------|
| GPT-5.5 Thinking | 100-250 | Quality gates |
| Hy3 Preview | 100-200 | Campaign + angles |
| Nemotron 3 Super | 80-150 | Extraction + research |
| MiniMax M2.5 | 100-500 | Drafting (varies) |
| gpt-oss-120B | 20-50 | QC teardown |
| Qwen3 Coder | 20-60 | Technical |

---

## 23. Quality Gate Framework

### Gate Map

| Stage | Gate Model | Gate Type | Required |
|-------|-----------|-----------|----------|
| 1 | GPT-5.5 | Optional sanity | No |
| 2 | GPT-5.5 | Evidence review | Yes |
| 3 | GPT-5.5 | Source quality | Yes |
| 4 | **GPT-5.5** | **Score all 40** | **Yes** |
| 5 | GPT-5.5 | Beat quality | Yes |
| 6 | GPT-5.5 | Tier-1 only | No |
| 7 | GPT-5.5 | Quality review | Yes |
| 8 | gpt-oss → GPT-5.5 | QC → Final | Yes |
| 9 | GPT-5.5 | Final approval | Yes |
| 10 | GPT-5.5 | Final approval | Yes |
| 14 | GPT-5.5 | Final review | Yes |

### Gate Rules
1. Never skip required gates
2. Never self-approve
3. Never auto-select angles
4. Never skip verification

---

## 24. Error Handling & Fallback Rules

### Error Types & Responses

| Error | Response |
|-------|----------|
| Model unavailable | Use backup model, document |
| Quality gate fails | Return to previous stage |
| No angles selected | PAUSE workflow |
| Insufficient data | Flag and request input |
| Invalid journalist data | Re-verify or discard |
| Export failure | Retry with backup format |

### Fallback Language
When data unavailable:
```
Information unavailable. Verification required before use.
```

---

## 25. Glossary & Terminology

| Term | Definition |
|------|-------------|
| Angle | A specific pitch topic for journalist outreach |
| Beat | Media beat (e.g., crime, education, business) |
| Quality Gate | Required approval step |
| Selected Angle | User-chosen angle for outreach |
| Active Angle | Currently being processed angle |
| SERP | Search Engine Results Page |
| QC | Quality Control |
| Tier | Model ranking in stack |

---

## 26. Appendices

### A. Quick Reference Card
### B. Prompt Templates
### C. Validation Checklists
### D. Error Codes

---

**End of Model Configuration v3.0**  
**Next Review: Weekly or after major updates**