# Digital PR Agent Registry

**Version:** 2.0  
**Last Updated:** 2026-05-06  
**Status:** Active  
**Owner:** digital-pr-orchestrator  
**Change History:** See `CHANGELOG.md`

---

## Purpose

Define every required operational agent, sub-agent, and validation agent in the journalist email pitch generation workflow.

## Core Rule

An agent may be implemented as a dedicated skill folder, a sub-role inside a skill, a script-backed validator, or a manual validation role, but it must have a clear owner, input, output, gate, and handoff. Do not create duplicate skill folders when a role is already owned cleanly by an existing specialist skill.

## Missing-Information Rule

When required evidence is unavailable, write:

```
Information unavailable. Verification required before use.
```

---

## Agent Definition Table

| # | Agent | Implementation Owner | Required Input | Required Output | Validation Gate | Handoff |
|---|-------|---------------------|----------------|-----------------|-----------------|---------|
| 1 | Campaign Intelligence | orchestrator | User brief, campaign goal | `00-brief.md`, constraints | Campaign Readiness | Source Review |
| 2 | Source Review | study-insight-extractor | `00-brief.md`, raw source | Source inventory, caveats | Source Completeness | Data Extraction |
| 3 | Data Extraction | study-insight-extractor | Raw study/dataset | Findings, rankings, statistics | Data Validity | Data Integrity |
| 4 | Data Integrity | study-insight-extractor + research | Statistics, methodology | Claim ledger with caveat | Data Integrity | Source Verification |
| 5 | Source Verification | research-enrichment-agent | Claim ledger, URLs | Verified/downgraded claims | Source Credibility | Research Strategy |
| 6 | Research Strategy | research-enrichment-agent | Verified findings | Research plan (all lanes) | Research Depth | SERP Search |
| 7 | SERP Search | research-enrichment-agent | Keywords, plan | SERP notes, candidates | SERP Search Quality | Advanced Search |
| 8 | Advanced Search | research-enrichment-agent | SERP gaps | Site/filetype/date searches | Advanced Search | Boolean Search |
| 9 | Boolean Search | journalist-targeting | Angle, beat, geography | Boolean query set | Boolean Search Quality | Muck Rack |
| 10 | Muck Rack Collection | muck-rack-collector | Selected angle, queries | Collection log, profiles | Muck Rack Quality | Targeting |
| 11 | Journalist Targeting | journalist-targeting | Raw collection | Approved/backup/rejected | Journalist Relevance | Intelligence |
| 12 | Journalist Intelligence | journalist-intelligence | Collection package | `06-journalist-intel.md` | Persona Gate | Persona Agent |
| 13 | Persona Building | journalist-intelligence | Profiles, coverage | Beat profile, objections | Persona Gate | Newsworthiness |
| 14 | Newsworthiness | angle-generator | Angle, evidence | Score, editorial reason | Newsworthiness | Pitch Angle |
| 15 | Pitch Angle Generation | angle-generator | Insights, research | `04-angles.md` (40 angles) | Angle Strength | GPT-5.5 Review |
| 16 | GPT-5.5 Scoring | GPT-5.5 | 40-angle table | All angles scored 1-10 | Angle Strength | Diversity Check |
| 17 | Angle Diversity | angle-generator | Scored angles | De-duplicated set | Angle Diversity | Beat Matching |
| 18 | Beat Matching | beat-matcher | Angles, beats | `05-beats.md`, top 10 | Beat Fit | Collection |
| 19 | Psychological Trigger | pitch-writer | Angle, persona | Ethical trigger selection | Trigger Gate | Subject Lines |
| 20 | Subject Lines | pitch-writer | Angle, thesis | Multiple subjects, recommendation | Subject Quality | Email Variants |
| 21 | Storytelling Email | pitch-writer | Angle, evidence | Narrative variant | Email Structure | Quality Review |
| 22 | Data-Led Email | pitch-writer | Angle, statistics | Data-heavy variant | Email Structure | Quality Review |
| 23 | Localized Email | pitch-writer | Angle, local data | Local variant | Localization | Quality Review |
| 24 | Policy Email | pitch-writer | Angle, policy relevance | Policy variant | Claim Verification | Quality Review |
| 25 | Business Email | pitch-writer | Angle, business data | Business variant | Claim Verification | Quality Review |
| 26 | Human Impact Email | pitch-writer | Angle, human relevance | Human-impact variant | Ethical Persuasion | Quality Review |
| 27 | Follow-Up Email | email-optimizer | Final pitch | Options <150 words | Follow-Up Quality | Polish |
| 28 | Quote Integration | pitch-writer | Quote availability | Real/offer/unavailable | Quote Validation | CTA |
| 29 | CTA Optimization | email-optimizer | Draft, journalist need | Low-friction CTA | CTA Quality | Deliverability |
| 30 | Deliverability Review | email-optimizer | Email, subjects | Inbox-safe review | Deliverability | Quality Review |
| 31 | Email Quality Review | email-optimizer | Six variants | Score, repair notes | Copywriting Quality | Final Polish |
| 32 | Final Polish | final-doc-packager | Stage 09 | `10-google-doc.md` | Final Output | Export |
| 33 | Browser Validation | journalist-targeting | Target URLs | Browser status | Browser Validation | Debug Check |
| 34 | Chrome Debug | browser-tools | Port check | Debug session status | Chrome Debug | Muck Rack Access |
| 35 | Muck Rack Access | muck-rack-collector | Page/session | Login/search status | Muck Rack Access | Collection |
| 36 | JSON Validation | orchestrator | JSON files | Parse result | JSON Validation | Python |
| 37 | Python Validation | orchestrator | Python scripts | Run result | Python Validation | PowerShell |
| 38 | PowerShell Validation | orchestrator | PS scripts | Parser result | PowerShell Validation | ASCII |
| 39 | Regression Testing | orchestrator | Changed files | Test results | Regression | Readiness |
| 40 | Production Readiness | orchestrator | All evidence | READY/FIX/NOT READY | Production Readiness | Final Report |

---

## Browser Tools Integration

The `browser-tools/` module provides automated browser control:

| Tool | Purpose | Location |
|------|---------|----------|
| Chrome Launcher | Session reuse, port management | `browser-tools/core/chrome-launcher.js` |
| CDP Client | Full Chrome DevTools Protocol | `browser-tools/core/cdp-client.js` |
| Tab Manager | Multi-tab handling | `browser-tools/core/tab-manager.js` |
| Health Checker | Browser availability verification | `browser-tools/core/health-check.js` |
| Muck Rack Collector | Journalist data collection | `browser-tools/collectors/muckrack-collector.js` |

---

## GPT-5.5 Integration

GPT-5.5 serves as the **final quality gate** for:
- Scoring all 40 angles from `04-角度.md`
- Reviewing pitch angle strength and newsworthiness
- Validating email copywriting quality
- Verifying claim integrity before journalist-facing output

Model stack: GPT-5.5 (final gate) → OpenCode free models (production)

---

## Overlap Rules

- `pitch-writer` owns first-pass variants; `email-optimizer` owns the final optimized email
- `journalist-targeting-subagent` owns collection; `journalist-intelligence-agent` owns synthesis
- `research-enrichment-agent` owns research depth; never invent data when sources are missing
- `final-doc-packager` owns packaging; never create new claims or angles

---

## Stop Conditions

1. Stop before Muck Rack/SERP unless `05-beats.md` shows `Selection status: confirmed`
2. Stop before Stage 08 if Stage 06/07 does not match selected angle
3. Stop before Stage 09 if six variants are missing, underdeveloped, or off-angle
4. Stop before final readiness if any validation test fails without documented fallback

---

## Related Documentation

- `validation-gates.md` - All 29 validation gates
- `handoff-matrix.md` - Stage-to-stage handoffs
- `MODEL-CONFIG.md` - Model configuration v3.0
- `browser-tools/BROWSER-TOOLS.md` - Browser automation docs