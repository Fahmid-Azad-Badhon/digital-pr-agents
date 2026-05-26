# Digital PR Agent Architecture

**Version:** 2.0  
**Last Updated:** 2026-05-06  
**Status:** Active  
**Owner:** digital-pr-orchestrator  
**Change History:** See `CHANGELOG.md`

---

## Purpose

Architecture map for agents, sub-agents, workflow stages, and validation flow.

---

## Main Agent

- `digital-pr-orchestrator`
- Owns workflow order, job-folder hygiene, quality gates, and handoff decisions

---

## Specialist Sub-Agents

| Agent | Purpose |
|-------|---------|
| `study-insight-extractor` | Converts studies/reports/datasets into press-worthy findings |
| `research-enrichment-agent` | Adds context, comparators, timing hooks, source discipline |
| `angle-generator` | Turns findings into 40 ranked story angles (20 categories x 2) |
| `beat-matcher` | Maps angles to journalist beats, top-10 priorities, selected-angle gate |
| `journalist-targeting-subagent` | Validates 800-per-beat pool, dedupes, scores, prepares Stage 06/07 |
| `journalist-intelligence-agent` | Creates Stage 06/07 synthesis, personalization hooks |
| `pitch-writer` | Drafts six first-pass variants for selected angle |
| `email-optimizer` | Runs rewrite passes for newsworthiness, tone, alignment |
| `final-doc-packager` | Packages final output for Google Doc export |

---

## Browser Tools Integration

**Location:** `browser-tools/`

| Component | File | Purpose |
|-----------|------|---------|
| Chrome Launcher | `core/chrome-launcher.js` | Session reuse, port 9222 management |
| CDP Client | `core/cdp-client.js` | Full Chrome DevTools Protocol |
| Tab Manager | `core/tab-manager.js` | Multi-tab orchestration |
| Health Checker | `core/health-check.js` | Browser availability verification |
| Muck Rack Collector | `collectors/muckrack-collector.js` | Journalist data collection |

**Chrome Debug Port:** 9222 (verified working)

---

## GPT-5.5 Integration

GPT-5.5 serves as the **final quality gate**:
- Scores all 40 angles in `04-angles.md`
- Reviews pitch angle strength and newsworthiness
- Validates email copywriting quality (minimum 8.5/10)
- Verifies claim integrity before journalist-facing output

**Model Stack:**
- **Final Gate:** GPT-5.5
- **Production:** OpenCode free models

---

## Workflow Structure

```
1. Campaign Intake
   |-- Read/write: 00-brief.md
   |-- Read/write: source-files/study-inputs/raw-study-copy.md
   `-- Owner: digital-pr-orchestrator

2. Study Extraction
   |-- Reads: 00-brief.md, raw-study-copy.md
   |-- Creates: 01-study-notes.md, 02-insights.md
   `-- Owner: study-insight-extractor

3. Research Enrichment
   |-- Reads: 01-study-notes.md, 02-insights.md
   |-- Creates: 03-research.md
   `-- Owner: research-enrichment-agent

4. Angle Generation
   |-- Reads: 02-insights.md, 03-research.md
   |-- Creates: 04-angles.md (40 angles = 20 categories x 2)
   |-- GPT-5.5 scores all 40 angles
   `-- Owner: angle-generator

5. Beat Matching
   |-- Reads: 04-angles.md
   |-- Creates: 05-beats.md (top 10, backlog, selected-angle gate)
   |-- Gate: Selection status: confirmed required before collection
   `-- Owner: beat-matcher

6. Journalist Collection
   |-- Reads: confirmed selection in 05-beats.md
   |-- Uses: browser-tools (Muck Rack, SERP, outlet pages)
   |-- Enforce: 800 journalists per selected beat
   `-- Owner: journalist-targeting-subagent

7. Journalist Intelligence
   |-- Reads: collection files under source-files/journalist-intel/
   |-- Creates: 06-journalist-intel.md, 07-journalist-coverage.md
   |-- Must match confirmed selected angle
   `-- Owner: journalist-intelligence-agent

8. Pitch Drafting
   |-- Reads: 04/05/06/07 stages
   |-- Creates: 6 variants (straight, punchy, data, personalized, narrative, local)
   |-- Creates: 08-pitch-draft.md
   `-- Owner: pitch-writer

9. Email Optimization
   |-- Reads: 08-pitch-draft.md
   |-- Creates: 09-optimized-email.md
   |-- GPT-5.5 quality gate check
   `-- Owner: email-optimizer

10. Final Packaging
    |-- Reads: Stage 09
    |-- Creates: 10-google-doc.md
    `-- Owner: final-doc-packager

11. Export
    |-- Reads: 10-google-doc.md
    |-- Exports: Google Doc
    `-- Owner: final-doc-packager
```

---

## Stage Files

| Stage | File | Purpose |
|-------|------|---------|
| 1 | `00-brief.md` | Campaign goal, client, constraints |
| 2 | `01-study-notes.md` | Source summary, methodology, caveats |
| 3 | `02-insights.md` | Ranked findings, evidence, novelty |
| 4 | `03-research.md` | Supporting context, comparators, timing |
| 5 | `04-angles.md` | 40 angles (20x2), GPT-5.5 scores, user checkboxes |
| 6 | `05-beats.md` | Top 10, backlog, selected-angle gate |
| 7 | `06-journalist-intel.md` | Target intelligence, SERP notes |
| 8 | `07-journalist-coverage.md` | Coverage evidence, beat fit |
| 9 | `08-pitch-draft.md` | Six variants, selected draft |
| 10 | `09-optimized-email.md` | Final optimized email |
| 11 | `10-google-doc.md` | Final package |

---

## Selected-Angle Gate

After `05-beats.md`, workflow **stops** until user confirms selection:

**Required fields in 05-beats.md:**
- Top 10 recommended angles
- Secondary backlog
- `Selection status: pending` → blocks Stage 6+
- `Selection status: confirmed` → unlocks collection

**Multi-angle rule:** If multiple angles selected, identify one **active selected angle package** for next run unless user requests batch execution.

---

## Validation Flow

1. **Data Quality Gates** (1-4): Source validity, integrity
2. **Research Quality Gates** (5-8): SERP, Boolean, Muck Rack
3. **Targeting Gates** (9-11): Relevance, persona
4. **Angle Quality Gates** (12-15): Newsworthiness, diversity, beat fit
5. **Content Quality Gates** (16-19): Triggers, subjects, structure
6. **Verification Gates** (20-22): Claims, hallucination, ethics
7. **Output Quality Gates** (23-28): CTA, quotes, deliverability, final
8. **Technical Gate** (29): Chrome debug

See `validation-gates.md` for full gate definitions.

---

## Handoff Validation

Every handoff requires:
- Source file exists
- Required fields populated
- No unresolved placeholders
- Data supported by evidence
- Caveats preserved
- Selected-angle context maintained

See `handoff-matrix.md` for full handoff rules.

---

## Related Documentation

- `validation-gates.md` - 29 validation gates
- `handoff-matrix.md` - Stage handoffs
- `MODEL-CONFIG.md` - Model configuration v3.0
- `agent-registry.md` - All agents defined
- `browser-tools/BROWSER-TOOLS.md` - Browser automation docs