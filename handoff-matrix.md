# Digital PR Handoff Matrix

**Purpose:** Define the required data package, validation rule, failure action, and destination for every workflow handoff.

**Status:** Active

**Version:** 2.0

**Last Updated:** 2026-05-06

---

## Core Rule

> No handoff may occur if the source stage is missing, off-angle, unsupported, or still contains unresolved placeholders in journalist-facing output.

---

## Stage Handoff Table

| # | Source | Destination | Required Data Package | Validation Before Handoff | Failure Action |
|---|--------|--------------|------------------------|---------------------------|----------------|
| 1 | `00-brief.md` | `01-study-notes.md` | Campaign goal, client, source location, audience, geography, desired beats, constraints | Required brief fields complete or marked unavailable | Return to campaign intake |
| 2 | `source-files/study-inputs/raw-study-copy.md` | `01-study-notes.md` | Raw source text, source URL, methodology | Raw source is not placeholder or empty | Request source material |
| 3 | `01-study-notes.md` | `02-insights.md` | Source summary, methodology, caveats, raw observations | Notes identify what source proves/does not prove | Re-extract source notes |
| 4 | `02-insights.md` | `03-research.md` | Ranked findings, evidence, novelty, caveats | Every insight has evidence and limitation | Repair or return to extraction |
| 5 | `03-research.md` | `04-angles.md` | Supporting context, comparators, timing hooks, source credibility, contradictions | Claims have source/timeframe/geography/limitation | Deeper research or downgrade |
| 6 | `04-angles.md` | `05-beats.md` | 40 angles, 20 categories, beat mapping, GPT-5.5 scores, user checkboxes | Angles unique, supported, scored, user-selected | Rewrite weak angles |
| 7 | `05-beats.md` | Journalist Collection | Top 10 priority list, backlog, selected angle, beat, active package | `Selection status: confirmed` with active package clear | Pause for user selection |
| 8 | Journalist Collection | `06-journalist-intel.md` | SERP notes, Muck Rack outputs, outlet notes, contact review, collection log | Collection matches selected angle and beat | Retry or mark blocker |
| 9 | `06-journalist-intel.md` | `07-journalist-coverage.md` | Approved targets, beat fit, contact status, profile evidence | Named details sourced; missing marked unavailable | Rebuild synthesis |
| 10 | `06-07` Combined | `08-pitch-draft.md` | Target intelligence, coverage hooks, personalization basis | Both files match Stage 05 selected angle | Return to targeting |
| 11 | `08-pitch-draft.md` | `09-optimized-email.md` | Six variants, selected draft, subject options, analytical table, CTA | Quality audit passes, 500-600 words | Rewrite Stage 08 |
| 12 | `09-optimized-email.md` | `10-google-doc.md` | Final email, subject, source notes, alignment, deliverability, trigger review | Optimized email audit and validator pass | Repair Stage 09 |
| 13 | `10-google-doc.md` | Google Docs Export | Final package, evidence, caveats, checklist | Final package audit and validator pass | Repair package |

---

## Context Preservation Rules

### Source Context
- Every statistic must retain source, timeframe, geography, and limitation
- Never strip evidence from numbers

### Data Context
- Do not compress numbers into claims that overstate what they prove
- Preserve all caveats and limitations

### Journalist Context
- Do not separate pitch from selected beat, target type, coverage evidence, or personalization basis
- Every targeting decision must be traceable

### Selected-Angle Context
- Stages 06 through 10 must match the confirmed angle from Stage 05
- If angle changes, return to Stage 05

---

## Handoff Validation Checklist

Before each handoff, verify:

- [ ] Source file exists
- [ ] Required fields populated
- [ ] No unresolved placeholders (`[Insert]`, `TBD`, `TODO`)
- [ ] Data is supported by evidence
- [ ] Caveats preserved
- [ ] Selected angle context maintained
- [ ] Stage validator passes

---

## Failure Actions Reference

| Failure Type | Action |
|--------------|--------|
| Missing source | Request input or mark manual action |
| Invalid data | Return to previous stage |
| Placeholder found | Repair before handoff |
| No angle selected | Pause workflow |
| Validation fails | Repair and re-validate |

---

## Related Documentation

- `validation-gates.md` - Quality gates
- `MODEL-CONFIG.md` - Model configuration
- `runbook.md` - Operational procedures