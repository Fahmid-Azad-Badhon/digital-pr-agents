# Digital PR Validation Gates

**Version:** 2.0  
**Last Updated:** 2026-05-06  
**Status:** Active  
**Owner:** production-readiness-agent  
**Change History:** See `CHANGELOG.md`

---

## Purpose

Define every required decision gate in the journalist email pitch workflow.

## Core Rule

> Every gate must have an owner, required input, required output, pass criteria, fail criteria, repair action, escalation path, and stop condition.

## Mandatory Missing-Information Fallback

If required data, journalist evidence, source support, quote status, SERP findings, or Muck Rack results are **missing**, the workflow must write:

```
Information unavailable. Verification required before use.
```

**Never invent:**
- Journalist names
- Journalist emails
- Article titles
- Sources
- Statistics
- Quotes
- Methodology
- SERP results
- Muck Rack results

---

## Gate Definition Table

| # | Gate | Owner | Required Input | Required Output | Pass Criteria | Fail Criteria | Repair Action | Escalation / Stop |
|---|------|-------|----------------|------------------|----------------|----------------|-----------------|-------------------|
| 1 | Campaign Readiness | orchestrator | User brief, source location | Complete `00-brief.md` | Required fields complete | Missing goal/source/constraints | Complete brief or mark unavailable | Stop before Stage 01 |
| 2 | Source Completeness | study-insight-extractor | Raw source copy | Source inventory | Source exists, not placeholder | Empty/placeholder/inaccessible | Request source | Stop before extraction |
| 3 | Data Validity | study-insight-extractor | Extracted findings | Valid insights | Has measure/timeframe/geography/source | Unsupported/vague data | Re-extract or remove | Stop before Stage 02 |
| 4 | Data Integrity | study-insight-extractor | Insight table | Caveated data | Conflicts/proxies flagged | Conflict hidden or score inflated | Downgrade + caveat | Stop before research |
| 5 | Source Credibility | research-enrichment-agent | Sources/claims | Credibility list | Score 1-5 per source | Weak treated as authoritative | Downgrade/replace | Stop before angles |
| 6 | Research Depth | research-enrichment-agent | Research plan | `03-research.md` | All source lanes considered | Thin/no hierarchy | Deeper research | Stop before Stage 04 |
| 7 | SERP Search Quality | research-enrichment-agent | Search queries | SERP evidence | Relevant and traceable | Generic/unsupported | Rewrite queries | Stop before SERP claims |
| 8 | Boolean Search Quality | journalist-targeting | Beat + angle | Boolean queries | AND/OR/quotes/exclusions used | Single narrow/wrong beat | Broaden queries | Stop before Muck Rack |
| 9 | Muck Rack Search Quality | muck-rack-collector | Session + queries | Collection log | Access verified or blocked honestly | Access hallucinated | Validate or mark manual | Stop before Muck Rack results |
| 10 | Journalist Relevance | journalist-targeting | Candidate pool | Approved targets | Beat/outlet/geography align | Wrong beat/duplicate/no source | Re-score/dedupe | Stop before Stage 06 |
| 11 | Journalist Persona | journalist-intelligence-agent | Target + coverage | Persona profile | Based on verified coverage | Fake personalization | Remove or label | Stop before Stage 08 |
| 12 | Newsworthiness | angle-generator | Angle + evidence | Score | Timely/novel/impactful/sourced/beat-fit | Weak editorial reason | Reframe/reject | Stop before drafting |
| 13 | Pitch Angle Strength | angle-generator/GPT-5.5 | 40-angle table | Scored angles | 40 angles, all scored, unique | Generic/unsupported/unscored | Rewrite/rerun | Stop before beat matching |
| 14 | Angle Diversity | angle-generator | 40-angle set | Differentiated list | Unique by category/beat/hook | Reworded duplicates | Merge/rewrite | Stop before Stage 05 |
| 15 | Beat Fit | beat-matcher | Angle table + beats | `05-beats.md` | Priority list, backlog, active package | Generic/missing/ unclear | Repair or ask user | Stop before collection |
| 16 | Psychological Trigger | pitch-writer | Draft + persona | Ethical review | Truthful/evidence-backed | Fear/fake urgency/manipulation | Replace trigger | Stop before final email |
| 17 | Subject Line Quality | pitch-writer | Selected angle | Subject set | Clear/specific/data-led/non-spammy | Clickbait/vague/inflated | Rewrite | Stop before package |
| 18 | Email Structure | pitch-writer | Stage 08 draft | Structured email | 500-600 words, table, hook, CTA | Missing table/wrong length | Rewrite | Stop before Stage 09 |
| 19 | Copywriting Quality | email-optimizer | Final email | Quality score | Min 8.5/10 on rubric | Robotic/generic/weak hook | Rewrite | Stop before Stage 10 |
| 20 | Claim Verification | all agents | Claims | Verified ledger | Every claim has source/limit | Unsupported claim | Remove/mark unavailable | Stop before output |
| 21 | Hallucination Control | all agents | Claims + notes | Fact ledger | No invented data; fallback used | Confident guesses/fake data | Replace with fallback | Stop before output |
| 22 | Ethical Persuasion | email-optimizer | Triggers | Safety decision | Truthful/non-coercive | Manipulative | Replace/remove | Stop before final email |
| 23 | CTA Quality | email-optimizer | Final email | Low-friction CTA | Clear asset/data offer | Aggressive/vague | Rewrite | Stop before package |
| 24 | Quote Validation | pitch-writer | Quote status | Quote status | Real=draft, no invented | Fake quote | Replace with offer | Stop before package |
| 25 | Localization | angle-generator | Local data | Local status | Geography + source supported | Unsupported | Downgrade | Stop before local pitch |
| 26 | Deliverability | email-optimizer | Email + subjects | Inbox safety | Plain-text, no spam signals | Too many links/hype | Rewrite | Stop before package |
| 27 | Personalization | journalist-intelligence | Coverage evidence | Decision | Short/verified/relevant | Fake/invented | Remove or label | Stop before final email |
| 28 | Final Output | final-doc-packager | Stage 10 | Complete package | Clean/traceable/complete | Missing/placeholders | Repair | Stop before export |
| 29 | Chrome Debug | validation agent | Debug port | Chrome status | Verified available | Unavailable | Launch or manual | Stop before browser work |

---

## Gate Categories

| Category | Gates | Focus |
|----------|-------|--------|
| **Data Quality** | 1-4 | Source validity, integrity, credibility |
| **Research Quality** | 5-8 | Depth, SERP, Boolean, Muck Rack |
| **Targeting** | 9-11 | Journalist relevance, persona |
| **Angle Quality** | 12-15 | Newsworthiness, diversity, beat fit |
| **Content Quality** | 16-19 | Triggers, subjects, structure, copy |
| **Verification** | 20-22 | Claims, hallucination, ethics |
| **Output Quality** | 23-28 | CTA, quotes, localization, deliverability, personalization, final |
| **Technical** | 29 | Browser debugging |

---

## Stop Condition Rules

1. **Stop at any fail** - Do not proceed to next stage
2. **Repair before retry** - Fix root cause, not symptoms
3. **Mark if manual** - If unrepairable, mark for manual action
4. **Never skip gates** - All gates are mandatory unless marked N/A

---

## Related Documentation

- `handoff-matrix.md` - Stage handoffs
- `MODEL-CONFIG.md` - Model configuration
- `runbook.md` - Operational procedures
- `red-team-adversarial-tests.md` - Adversarial test cases