# Scoring And Prioritization Engine

Version: 1.0
Last Updated: 2026-05-02
Status: active
Owner: production-readiness-agent
Change History: see `CHANGELOG.md`.

Purpose: define the scoring systems that decide whether sources, claims, angles, journalists, subject lines, and emails can move forward.

Status: active.

Mandatory rule: no low-scoring asset may move forward without repair, downgrade, rejection, or user-visible caveat.

| Score Type | Scale | Passing Threshold | Failure Threshold | Criteria | Repair Action | Decision Rule |
|---|---:|---:|---:|---|---|---|
| Source Credibility | 1-5 | 4+ for final claims; 5 preferred | 1-2 | authority, methodology, recency, transparency, primary-source status | replace with stronger source, downgrade to background, or remove | final claims require score 4+ unless clearly caveated |
| Data Strength | 1-10 | 8+ | below 6.5 | measurable number, timeframe, geography, source, comparison safety, methodology clarity | re-extract, verify, caveat, or remove | weak data cannot drive a pitch angle |
| Research Completeness | 1-10 | 8+ | below 7 | official sources, academic/industry support, news context, competitor coverage, local relevance, conflicting-source review | run deeper SERP/advanced search, add source lanes, or mark unavailable | Stage 03 cannot hand off to Stage 04 below 8 unless user approves a limited campaign |
| Claim Risk | 1-10 where 10 = safest | 8+ | below 7 | source support, causation safety, legal/health/safety sensitivity, timeframe, geography, methodology, wording restraint | downgrade wording, add caveat, remove claim, or request verification | claims below 8 cannot appear in journalist-facing output |
| Newsworthiness | 1-10 | 8+ | below 8 | timeliness, novelty, impact, public interest, data surprise, conflict/tension, headline support | reframe, strengthen evidence, localize, or reject | only 8+ angles move to outreach selection |
| Journalist Relevance | 1-10 | 8+ outreach-ready; 7 backup | below 7 | beat fit, outlet fit, geography, recent coverage, data appetite, audience fit | re-score, move to backup, or reject | below 7 cannot enter primary list |
| Pitch Angle Strength | 1-10 | 8+ | below 8 | uniqueness, clear hook, data foundation, beat alignment, SERP potential, ethical framing | rewrite or merge with stronger angle | below 8 cannot move to email drafting |
| Subject Line Strength | 1-10 | 8+ | below 8 | clarity, specificity, curiosity, data strength, no spam signals, no fake urgency | rewrite subject line set | at least one subject must pass before final email |
| Email Quality | 1-10 | 8.5+ average and no critical category below 8 | below 8.5 | hook, data framing, credibility, flow, CTA, beat relevance, natural tone, newsworthiness | rewrite and rerun audit | final email cannot pass below 8.5 |
| Deliverability Risk | 1-10 where 10 = safest | 8+ | below 8 | link count, spam wording, punctuation, capitalization, plain-text readability, CTA pressure | remove risky wording/links, simplify format | risky email cannot move to final package |
| Personalization Confidence | 1-10 | 8+ journalist-specific; 6-7 beat-level only | below 6 | verified article, beat evidence, outlet section, geography, topic match | switch to beat-level framing or gather evidence | never use journalist-specific personalization below 8 |

## Priority Queue Rules

1. Rank pitch angles by newsworthiness, data strength, source credibility, journalist beat fit, and claim risk.
2. Present the top 10 outreach angles at the Stage 05 stoppage gate.
3. Move lower-priority but usable angles to the secondary list.
4. Reject or merge duplicate angles.
5. Do not search Muck Rack for every beat at once. Search only after the user confirms one selected angle.
6. For journalist prospects, keep primary, backup, manual review, and rejected lists separate.
7. For email variants, keep only variants that serve a distinct editorial use case.

## Repair Rules

- If source credibility fails, replace source or downgrade claim.
- If data strength fails, return to extraction and source verification.
- If research completeness fails, run deeper SERP/advanced search or mark the gap.
- If claim risk fails, remove or caveat the claim before writing.
- If journalist relevance fails, reject or move to backup.
- If email quality fails, rewrite until the score passes.
- If any required information is unavailable, write `Information unavailable. Verification required before use.`
