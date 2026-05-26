# Digital PR Runbook

**Version:** 2.0  
**Last Updated:** 2026-05-06  
**Status:** Active  
**Owner:** digital-pr-orchestrator  
**Change History:** See `CHANGELOG.md`

---

## Purpose

Operating guide for the full Digital PR workflow. Use this file when running a real pitch from study input to final Google Doc export.

---

## Reference Files

| File | Purpose |
|------|---------|
| `AGENTS.md` | Project rules and conventions |
| `prompt map.md` | Prompt control map |
| `workflow-architecture.md` | Architecture map |
| `validation-gates.md` | 29 validation gates |
| `handoff-matrix.md` | Stage-to-stage handoffs |
| `MODEL-CONFIG.md` | Model configuration v3.0 |
| `agent-registry.md` | Agent definitions |
| `browser-tools/BROWSER-TOOLS.md` | Browser automation |

---

## What The System Does

### Automated Path
```
raw-study-copy.md → draft-study-input → Stage 05 selection gate → 
selected-angle collection (browser-tools) → journalist-targeting validation → 
import-muckrack-output → draft-journalist-intel → draft-pitch-draft → 
email-optimizer → export-google-doc
```

### Manual/Skill-Driven
- `03-research.md` - Research enrichment
- `04-angles.md` - 40-angle generation with GPT-5.5 scoring
- `05-beats.md` - Beat matching
- `09-optimized-email.md` - Final optimization
- `10-google-doc.md` - Final packaging

---

## Stage Map

| # | Stage File | Owner | Key Output |
|---|------------|-------|------------|
| 1 | `00-brief.md` | orchestrator | Campaign goal, client, constraints |
| 2 | `01-study-notes.md` | study-insight-extractor | Source summary, methodology |
| 3 | `02-insights.md` | study-insight-extractor | Ranked findings |
| 4 | `03-research.md` | research-enrichment-agent | Context, comparators |
| 5 | `04-angles.md` | angle-generator | 40 angles, GPT-5.5 scores |
| 6 | `05-beats.md` | beat-matcher | Top 10, backlog, selected-angle gate |
| 7 | `06-journalist-intel.md` | journalist-intelligence | Target intelligence |
| 8 | `07-journalist-coverage.md` | journalist-intelligence | Coverage evidence |
| 9 | `08-pitch-draft.md` | pitch-writer | Six variants |
| 10 | `09-optimized-email.md` | email-optimizer | Final email |
| 11 | `10-google-doc.md` | final-doc-packager | Final package |

---

## Execution Structure

```
00-brief.md
source-files/study-inputs/raw-study-copy.md
  -> draft-study-input
01-study-notes.md
02-insights.md
  -> research-enrichment-agent
03-research.md
  -> angle-generator (40 angles + GPT-5.5 scoring)
04-angles.md
  -> beat-matcher
05-beats.md
  -> STOP: user selects angle(s)
  -> set Selection status: confirmed
  -> selected-angle collection (browser-tools)
source-files/journalist-intel/
  -> journalist-targeting-subagent validates 800-per-beat
  -> import-muckrack-output
  -> draft-journalist-intel
06-journalist-intel.md
07-journalist-coverage.md
  -> draft-pitch-draft
draft-variants/
  -> email-optimizer
09-optimized-email.md
  -> final-doc-packager
10-google-doc.md
  -> export-google-doc
```

---

## Key Order Rules

1. **Muck Rack/SERP collection happens AFTER `05-beats.md` confirmation** and BEFORE `06-journalist-intel.md`
2. **`06-journalist-intel.md` is NOT the trigger for Muck Rack** - it is the OUTPUT from selected-angle collection
3. **User must confirm at least one angle** before journalist search begins
4. **One active selected-angle package** at a time unless batch execution requested

---

## Selected-Angle Gate

After `05-beats.md`, workflow **stops** until user confirms:

**Status values:**
- `Selection status: pending` - Blocks Stage 06+
- `Selection status: confirmed` - Unlocks collection and drafting

**Multi-angle handling:**
- If multiple angles selected, identify one **active** angle for next run
- User must explicitly request batch multi-angle execution for parallel runs

---

## Job Folder Structure

```
pitch-jobs/<slug>/
|-- 00-brief.md
|-- 01-study-notes.md
|-- 02-insights.md
|-- 03-research.md
|-- 04-angles.md
|-- 05-beats.md
|-- 06-journalist-intel.md
|-- 07-journalist-coverage.md
|-- draft-variants/
|   |-- 08a-straight-news.md
|   |-- 08b-short-punchy.md
|   |-- 08c-data-heavy.md
|   |-- 08d-journalist-personalized.md
|   |-- 08e-storytelling-narrative.md
|   `-- 08f-localized.md
|-- 08-pitch-draft.md
|-- 09-optimized-email.md
|-- 10-google-doc.md
`-- source-files/
    |-- study-inputs/
    |   `-- raw-study-copy.md
    `-- journalist-intel/
        |-- README.md
        |-- selected-angle/
        |   |-- collection-log.md
        |   |-- muckrack-output.json
        |   |-- serp-notes.md
        |   `-- target-summary.md
        `-- rejected/
            `-- notes.md
```

---

## Missing-Information Fallback

When any required data is unavailable, write:

```
Information unavailable. Verification required before use.
```

**Never invent:** journalist names, emails, article titles, sources, statistics, quotes, methodology, SERP results, Muck Rack results.

---

## Browser Tools

**Location:** `browser-tools/`

| Tool | Purpose |
|------|---------|
| Chrome Launcher | Session reuse, port 9222 management |
| CDP Client | Full Chrome DevTools Protocol support |
| Muck Rack Collector | Automated journalist data collection |

**Verification:** Chrome debug port 9222 verified working

---

## GPT-5.5 Quality Gate

GPT-5.5 serves as the **final quality gate** for:
- Scoring all 40 angles in Stage 04
- Reviewing pitch strength and newsworthiness
- Validating email copywriting (minimum 8.5/10)
- Verifying claim integrity

---

## Validation Checklist

Before each stage handoff, verify:
- [ ] Source file exists
- [ ] Required fields populated
- [ ] No unresolved placeholders
- [ ] Data supported by evidence
- [ ] Caveats preserved
- [ ] Selected-angle context maintained

---

## Related Files

- `AGENTS.md` - Project conventions
- `validation-gates.md` - 29 gates
- `handoff-matrix.md` - Handoff rules
- `MODEL-CONFIG.md` - Model specs
- `agent-registry.md` - Agent definitions
- `browser-tools/BROWSER-TOOLS.md` - Browser automation