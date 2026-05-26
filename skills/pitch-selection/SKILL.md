---
name: pitch-selection
description: Use when you need to review, evaluate, and select pitch angles from Stage 04 (40 angles across 20 categories) for journalist targeting and pitch drafting. Use when Stage 06 requires human decision-making to choose which angles proceed to journalist collection, ensuring the campaign strategy aligns with client goals and editorial judgment.
---

# Pitch Selection (Human Gate)

## Mission
Enable human review and selection of pitch angles for downstream journalist targeting and pitch drafting.

This skill owns **Stage 06** of the Digital PR workflow - the **Human Gate**. Its output is `06-selected-angles.md`.

Stage 06 is where a human reviewer evaluates the AI-generated 40 angles and selects which ones proceed to journalist collection and pitch drafting. This is the only stage requiring human decision-making.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Input Phase](#input-phase)
3. [Processing Phase](#processing-phase)
4. [Output Phase](#output-phase)
5. [Quality Assurance Phase](#quality-assurance-phase)
6. [Failure Patterns & Fixes](#failure-patterns--fixes)
7. [Downstream Integration](#downstream-integration)
8. [Required 40-Angle Table Format](#required-40-angle-table-format)
9. [Scoring Context](#scoring-context)
10. [Selection Criteria Guidelines](#selection-criteria-guidelines)
11. [AI Model Integration](#ai-model-integration)
12. [Operational Contract](#operational-contract)

---

## Executive Summary

| Property | Value |
|----------|-------|
| **Stage** | 06 |
| **Name** | Pitch Selection (Human Gate) |
| **Input** | `04-angles.md` (40 angles across 20 categories) |
| **Input** | `05-beats.md` (optional - beat mapping from Stage 05) |
| **Output** | `06-selected-angles.md` |
| **Primary Model** | Human Decision (GPT-5.5 for scoring reference) |
| **User Action Required** | YES - Select angle(s) |
| **Selection Format** | Checkbox (Select/Unselect) |
| **Minimum Selection** | At least 1 angle |
| **Maximum Selection** | No limit (typically 1-5) |
| **Total Angles** | 40 |
| **Categories** | 20 |

---

## Input Phase

### Step 1.1: Required Input Files

The Pitch Selection stage requires the following input files:

```
┌─────────────────────────────────────────────────────────────────┐
│                    REQUIRED INPUT FILES                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ PRIMARY INPUT:                                                   │
│ ├─ 04-angles.md (MANDATORY)                                    │
│ │   - 40 pitch angles                                          │
│ │   - Category column                                         │
│ │   - Journalist Beats column                                 │
│ │   - Pitch Angle column                                      │
│ │   - Why This is Newsworthy column                           │
│ │   - Score column (1-10)                                     │
│ │   - Supporting sections:                                    │
│ │     • Category And Beat Coverage Check                      │
│ │     • Newsworthiness Justifications                        │
│ │     • Quality Assurance Check                              │
│ │     • Research Support                                     │
│ │     • Market Context                                        │
│ │     • Media Value                                           │
│ │     • Talking Points                                       │
│ │     • Risks                                                 │
│ │                                                             │
│ OPTIONAL INPUT:                                                  │
│ ├─ 05-beats.md (if Stage 05 ran before Stage 06)              │
│ │   - Beat mappings for all angles                           │
│ │   - Outlet types                                           │
│ │   - Search guidance                                        │
│ │   - Collection lanes                                       │
│ │                                                             │
│ └─ 00-brief.md (for campaign context)                         │
│     - Campaign goals                                          │
│     - Target audience                                         │
│     - Geographic focus                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step 1.2: Input Validation Checklist

Before processing, validate all inputs:

```
┌─────────────────────────────────────────────────────────────────┐
│                INPUT VALIDATION CHECKLIST                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ □ 04-angles.md exists and is readable                          │
│                                                                 │
│ □ 04-angles.md contains:                                       │
│   - Exactly 40 pitch angles                                    │
│   - Category column present                                    │
│   - Journalist Beats column present                            │
│   - Pitch Angle column present                                  │
│   - Why This is Newsworthy column present                      │
│   - Score column present (1-10)                                │
│                                                                 │
│ □ Supporting sections present:                                │
│   - Category And Beat Coverage Check ✓                        │
│   - Newsworthiness Justifications (40 sections) ✓             │
│   - Quality Assurance Check ✓                                 │
│                                                                 │
│ □ Each angle has:                                              │
│   - Valid category (1 of 20)                                   │
│   - Valid journalist beats                                     │
│   - Pitch angle text (8-15 words)                              │
│   - Why newsworthy summary                                      │
│   - Score (1-10)                                               │
│                                                                 │
│ □ No duplicate angles                                           │
│ □ No empty cells in required columns                           │
│                                                                 │
│ VALIDATION RESULT:                                             │
│ PASS → Proceed to display                                      │
│ FAIL → Return to Stage 04 for correction                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step 1.3: Angle Count Verification

Verify the exact count of angles:

```
┌─────────────────────────────────────────────────────────────────┐
│                  ANGLE COUNT VERIFICATION                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ EXPECTED: 40 angles (20 categories × 2 angles per category)    │
│                                                                 │
│ Count by Category:                                            │
│ ────────────────────────────────────────────────────────────   │
│ Data-Led: 2 angles                                            │
│ Trend Story: 2 angles                                        │
│ Human Interest: 2 angles                                     │
│ Consumer Behavior: 2 angles                                   │
│ Public Safety: 2 angles                                      │
│ Health & Wellness: 2 angles                                  │
│ Finance & Business: 2 angles                                │
│ Environment: 2 angles                                        │
│ Education: 2 angles                                          │
│ Politics & Policy: 2 angles                                  │
│ Science & Research: 2 angles                                 │
│ Lifestyle & Culture: 2 angles                                 │
│ Crime & Safety: 2 angles                                      │
│ Sports: 2 angles                                              │
│ Entertainment: 2 angles                                       │
│ Real Estate: 2 angles                                        │
│ Travel & Tourism: 2 angles                                  │
│ Food & Dining: 2 angles                                      │
│ ────────────────────────────────────────────────────────────   │
│ TOTAL: 40 angles                                              │
│                                                                 │
│ VERIFICATION RESULT:                                          │
│ PASS → All 40 angles present                                  │
│ FAIL → Incomplete - return to Stage 04                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step 1.4: Data Quality Check

Check data quality per angle:

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA QUALITY CHECK                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ For each of 40 angles, verify:                                 │
│                                                                 │
│ Category:                                                     │
│ □ Valid category name (from 20 categories)                   │
│ □ Exactly one category per angle                              │
│                                                                 │
│ Journalist Beats:                                            │
│ □ At least one beat specified                                 │
│ □ Beats are specific (not generic like "news")              │
│                                                                 │
│ Pitch Angle:                                                  │
│ □ 8-15 words in length                                       │
│ □ Format: "[Hook]: [Insight]"                                 │
│ □ Contains specific data or finding                           │
│ □ Not generic or vague                                        │
│                                                                 │
│ Why This is Newsworthy:                                      │
│ □ Minimum 50 words                                           │
│ □ Contains specific evidence                                  │
│ □ Explains journalist relevance                               │
│                                                                 │
│ Score:                                                        │
│ □ Integer value 1-10                                         │
│ □ Consistent with justification quality                       │
│                                                                 │
│ QUALITY RESULT:                                               │
│ HIGH → All quality checks pass                               │
│ MEDIUM → Some issues, proceed with caution                   │
│ LOW → Return to Stage 04 for correction                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step 1.5: Score Distribution Analysis

Analyze the score distribution:

```
┌─────────────────────────────────────────────────────────────────┐
│                   SCORE DISTRIBUTION ANALYSIS                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Score Range    │ Count │ Percentage │ Quality Tier            │
│ ──────────────┼───────┼─────────────┼────────────────────────   │
│ 9-10 (High)   │   X   │    X%       │ Strong - Ready           │
│ 7-8 (Good)   │   X   │    X%       │ Solid - Consider         │
│ 5-6 (Fair)    │   X   │    X%       │ Weak - Evaluate          │
│ 1-4 (Low)    │   X   │    X%       │ Poor - Avoid             │
│ ──────────────┼───────┼─────────────┼────────────────────────   │
│ Total         │  40   │   100%      │                           │
│ Average Score │  X.X  │             │                           │
│ Median Score  │   X   │             │                           │
│                                                                 │
│ INTERPRETATION:                                               │
│ - High % in 9-10: Strong angle pool                          │
│ - High % in 1-4: Weak angle pool, consider revision           │
│ - Even distribution: Balanced, good selection options        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Processing Phase

### Step 2.1: Display All 40 Angles

Display ALL 40 angles in the required table format:

```
┌─────────────────────────────────────────────────────────────────┐
│                    40-ANGLE DISPLAY FORMAT                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ | # | Category | Journalist Beats | Pitch Angle | Why Newsworthy | Score | Select/Unselect |
│ |---|----------|-----------------|-------------|---------------------|-------|-----------------|
│ | 1 | Data-Led | Data Journalist, Investigative | County Risk Divide: New Data Reveals Where Residents Face Rising Safety Pressure | [Summary] | 9 | ☐ |
│ | 2 | Data-Led | Consumer Affairs, Business | Hidden Cost Shock: Families Face Bigger Bills as Local Risk Patterns Shift | [Summary] | 8 | ☐ |
│ |...| ... | ... | ... | ... | ... | ☐ |
│ |40 | [Category] | [Beats] | [Pitch Angle] | [Summary] | [Score] | ☐ |
│                                                                 │
│ Total Angles: 40                                               │
│ Categories: 20                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step 2.2: Column Definitions

| Column | Content | Format | Required |
|--------|---------|--------|----------|
| **#** | Angle number | 1-40 | YES |
| **Category** | Strategic category | Text | YES |
| **Journalist Beats** | Target beats | Comma-separated | YES |
| **Pitch Angle** | Headline-style | 8-15 words | YES |
| **Why This Is Newsworthy** | Summary | 50-100 words | YES |
| **Score** | GPT-5.5 evaluation | 1-10 | YES |
| **Select/Unselect** | User choice | ☐/☑ | YES |

### Step 2.3: Detailed Justification Access

For each angle, allow expansion:

```
EXPANDABLE SECTIONS PER ANGLE:
├── Data-Rich Justification (250-300 words)
│   ├── Specific statistics and percentages
│   └── Year-over-year comparisons
├── Research Support
│   ├── Studies and reports cited
│   └── Official data sources
├── Market Context
│   ├── Industry implications
│   └── Timing relevance
├── Media Value
│   ├── Why journalists care
│   └── Why readers care
├── Talking Points (4-5)
│   ├── Point 1
│   ├── Point 2
│   ├── Point 3
│   └── Point 4-5
└── Risk (caveats and limitations)
```

### Step 2.4: Sorting and Filtering Options

Provide user controls:

```
┌─────────────────────────────────────────────────────────────────┐
│                 SORTING AND FILTERING OPTIONS                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ SORT BY:                                                        │
│ ├─ Score (High to Low)                                        │
│ ├─ Score (Low to High)                                        │
│ ├─ Category (A-Z)                                            │
│ ├─ Category (Z-A)                                            │
│                                                                 │
│ FILTER BY:                                                     │
│ ├─ Score Range: [All] [9-10] [7-8] [5-6] [1-4]             │
│ ├─ Category: [Dropdown of 20 categories]                     │
│ ├─ Journalist Beats: [Dropdown of beats]                      │
│                                                                 │
│ VIEW OPTIONS:                                                   │
│ ├─ Show All 40                                               │
│ ├─ Show Selected Only                                        │
│ ├─ Show Unselected Only                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Output Phase

### Step 3.1: Selection Summary Output

Create output file `06-selected-angles.md`:

```
┌─────────────────────────────────────────────────────────────────┐
│                   SELECTION SUMMARY OUTPUT                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ # Pitch Selection - Human Gate                                 │
│                                                                 │
│ ## Selection Status                                            │
│ - Date: [Today's date]                                         │
│ - Total Angles Available: 40                                  │
│ - Angles Selected: [X]                                         │
│                                                                 │
│ ## Selected Angles                                            │
│ | Selected # | Category | Pitch Angle | Score | Beats |        │
│ |------------|----------|-------------|-------|------|         │
│ | 1          | Data-Led | County Risk... | 9    | Data... |   │
│ | 2          | Trend... | Hidden Cost... | 8    | Cons... |   │
│ | ...        | ...      | ...          | ...   | ...    |         │
│                                                                 │
│ Total Selected: [X]                                            │
│ Average Score: [X.X]                                           │
│ Primary Beats: [Beat 1], [Beat 2], [Beat 3]                  │
│                                                                 │
│ ## Selection Rationale                                        │
│ Primary strategy: [What the selection achieves]               │
│ Beat focus: [Target beats]                                    │
│ Score range: [Lowest to highest]                               │
│ Campaign alignment: [How it fits the brief]                   │
│                                                                 │
│ ## Unselected Angles                                          │
│ - Available for future use if needed                         │
│ - Can be revisited later in campaign                           │
│ - Count: [40-X] angles preserved                              │
│                                                                 │
│ ## Handoff to Stage 07                                       │
│ Selected angles ready for journalist collection               │
│ Beat mapping confirmed (from Stage 05 if available)           │
│ Score basis documented                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step 3.2: Output File Structure

```
OUTPUT FILE: 06-selected-angles.md

STRUCTURE:
├── # Pitch Selection - Human Gate
├── ## Selection Status
│   ├── Date
│   ├── Total Angles Available
│   └── Angles Selected
├── ## Selected Angles
│   └── [Table with selected angles only]
├── ## Selection Rationale
│   ├── Primary Strategy
│   ├── Beat Focus
│   └── Score Range
├── ## Unselected Angles
│   └── Available for future use
├── ## Handoff to Stage 07
│   ├── Selected angles ready
│   ├── Beat mapping confirmed
│   └── Score basis documented
└── ## Metadata
    ├── Input files used
    ├── Processing date
    └── Quality checks passed
```

### Step 3.3: JSON Export Option

```
JSON OUTPUT FORMAT:
{
  "selectionDate": "2026-01-01",
  "totalAnglesAvailable": 40,
  "anglesSelected": [
    {
      "rank": 1,
      "category": "Data-Led",
      "pitchAngle": "County Risk Divide: New Data Reveals...",
      "journalistBeats": ["Data Journalist", "Investigative"],
      "score": 9,
      "selectedAt": "2026-01-01T10:30:00Z"
    }
  ],
  "unselectedAnglesCount": 38,
  "averageSelectedScore": 8.5,
  "primaryBeats": ["Data Journalist", "Consumer Affairs"]
}
```

---

## Quality Assurance Phase

### Step 4.1: Pre-Selection QA Checklist

```
┌─────────────────────────────────────────────────────────────────┐
│               PRE-SELECTION QA CHECKLIST                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ INPUT VALIDATION:                                              │
│ □ 04-angles.md exists and is valid                             │
│ □ All 40 angles have complete data                             │
│ □ Scores are in valid range (1-10)                             │
│ □ No duplicate angles                                          │
│                                                                 │
│ DISPLAY VERIFICATION:                                          │
│ □ All 40 angles displayed                                      │
│ ✓ All columns populated                                       │
│ ✓ Scores visible                                              │
│ ✓ Select/Unselect checkboxes functional                       │
│                                                                 │
│ CONTENT VERIFICATION:                                          │
│ ✓ Pitch angles are 8-15 words                                  │
│ ✓ Categories are valid (from 20)                              │
│ ✓ Why Newsworthy summaries are present                         │
│ ✓ Journalist beats are specific                               │
│                                                                 │
│ USER INTERFACE:                                                │
│ ✓ Sorting works correctly                                     │
│ ✓ Filtering works correctly                                   │
│ ✓ Expandable sections function                                 │
│                                                                 │
│ PRE-SELECTION RESULT:                                          │
│ PASS → User can proceed to selection                           │
│ FAIL → Fix issues before selection                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step 4.2: Selection QA Checklist

```
┌─────────────────────────────────────────────────────────────────┐
│                SELECTION QA CHECKLIST                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ MINIMUM REQUIREMENT:                                           │
│ □ At least 1 angle selected                                   │
│                                                                 │
│ SELECTION VALIDATION:                                          │
│ □ Selected angles have score 5+                               │
│ □ Selected angles align with campaign                         │
│ □ Selected angles have evidence support                       │
│ □ No conflicting angles selected                               │
│                                                                 │
│ STRATEGIC ALIGNMENT:                                           │
│ □ Fit with campaign brief/goals                                │
│ □ Match with target audience                                   │
│ □ Consistent with client preferences                          │
│                                                                 │
│ QUALITY CHECKS:                                               │
│ □ No redundant selections                                     │
│ □ Different angles represent different strategies            │
│ □ Selected angles have clear differentiation                  │
│                                                                 │
│ POST-SELECTION RESULT:                                          │
│ PASS → Can proceed to downstream stages                       │
│ FAIL → Review and revise selection                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step 4.3: Post-Confirmation QA

```
┌─────────────────────────────────────────────────────────────────┐
│              POST-CONFIRMATION QA CHECKLIST                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ FINAL VERIFICATION:                                            │
│ □ Confirm selection count                                      │
│ □ Review selected angles against strategy                     │
│ □ Verify no unintended angles selected                        │
│ □ Acknowledge handoff to journalist collection               │
│                                                                 │
│ DATA INTEGRITY:                                               │
│ □ Selected angles saved correctly                             │
│ □ Unselected angles preserved for future                      │
│ □ All metadata recorded                                       │
│                                                                 │
│ DOWNSTREAM READINESS:                                         │
│ □ Stage 07 can receive selected angles                       │
│ □ Stage 08 can proceed with pitch drafting                   │
│ □ All required data is available                              │
│                                                                 │
│ CONFIRMATION COMPLETE:                                         │
│ ✅ Ready for Stage 07 (Journalist Collection)                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step 4.4: Quality Metrics Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                  QUALITY METRICS SUMMARY                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ SELECTION METRICS:                                            │
│ - Total Angles: 40                                           │
│ - Selected: [X] (X%)                                         │
│ - Unselected: [Y] (Y%)                                       │
│                                                                 │
│ SCORE METRICS:                                                │
│ - Average Score (Selected): [X.X]/10                          │
│ - Highest Score: [X]/10                                      │
│ - Lowest Score: [X]/10                                       │
│                                                                 │
│ CATEGORY COVERAGE:                                           │
│ - Categories Represented: [X]                                 │
│ - Categories Not Selected: [Y]                                │
│                                                                 │
│ BEAT COVERAGE:                                                │
│ - Beats Targeted: [Beat 1], [Beat 2], ...                    │
│ - Total Unique Beats: [X]                                     │
│                                                                 │
│ QUALITY VERDICT:                                              │
│ PASS → Proceed to Stage 07                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Failure Patterns & Fixes

### Common Failure Patterns

| Pattern | Symptom | Root Cause | Fix |
|---------|---------|------------|-----|
| **No angles selected** | User proceeds without selection | Unclear instruction | Add minimum selection validation |
| **Low-quality selection** | Scores 1-4 selected | Ignoring AI scores | Highlight low scores, require justification |
| **Misaligned selection** | Selected angles don't fit campaign | No strategy check | Add campaign alignment validation |
| **Duplicate selection** | Similar angles selected | No differentiation check | Verify angles differ in category/beats |
| **Incomplete data** | Empty cells in table | Input file issue | Return to Stage 04 |
| **Score/angle mismatch** | High score but weak justification | AI evaluation issue | Manual review before selection |

### Step 5.1: Failure Detection

```
┌─────────────────────────────────────────────────────────────────┐
│                   FAILURE DETECTION RULES                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ DETECT IF:                                                     │
│ - Selection count = 0 → FAIL                                   │
│ - Any selected angle has score < 5 → WARNING                   │
│ - Selected angles have same category × 3+ → WARNING           │
│ - Selected angles have same beats × 3+ → WARNING             │
│ - No beat mapping in output → WARNING                         │
│ - Missing required columns → FAIL                              │
│                                                                 │
│ VALIDATION ACTIONS:                                            │
│ - WARNING → Prompt user to confirm intent                    │
│ - FAIL → Prevent proceeding, show error                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step 5.2: Fix Procedures

```
┌─────────────────────────────────────────────────────────────────┐
│                      FIX PROCEDURES                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ IF No Angles Selected:                                         │
│ 1. Show minimum requirement message                          │
│ 2. Highlight that at least 1 selection required             │
│ 3. Enable selection before proceeding                        │
│                                                                 │
│ IF Low Scores Selected:                                       │
│ 1. Show warning about low scores                            │
│ 2. Request justification for selection                      │
│ 3. Require explicit confirmation                            │
│                                                                 │
│ IF Duplicate Categories:                                     │
│ 1. Show warning about category duplication                   │
│ 2. Suggest selecting different categories                   │
│ 3. Recommend differentiation                                │
│                                                                 │
│ IF Missing Data:                                             │
│ 1. Identify missing columns/cells                           │
│ 2. Show specific data requirements                         │
│ 3. Return to Stage 04 for correction                       │
│                                                                 │
│ IF Mismatched Scores:                                        │
│ 1. Flag specific angles with inconsistency                  │
│ 2. Request manual review                                    │
│ 3. Allow override with justification                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step 5.3: Recovery Procedures

```
┌─────────────────────────────────────────────────────────────────┐
│                    RECOVERY PROCEDURES                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ RECOVERY PATH 1: Selection Reset                              │
│ - User can reset and start selection fresh                   │
│ - No penalty, all angles available                           │
│                                                                 │
│ RECOVERY PATH 2: Partial Selection                           │
│ - User can add to existing selection                        │
│ - Cannot remove previously confirmed (with warning)          │
│                                                                 │
│ RECOVERY PATH 3: Return to Review                            │
│ - User can return to angle review                           │
│ - Re-evaluate before selection                              │
│ - Scores and data remain available                          │
│                                                                 │
│ RECOVERY PATH 4: Input Correction                            │
│ - Return to Stage 04 for data fix                           │
│ - Re-process from valid input                               │
│ - No time penalty                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Downstream Integration

### Step 6.1: Stage 07 (Journalist Collection) Handoff

```
┌─────────────────────────────────────────────────────────────────┐
│              STAGE 07 HANDOFF REQUIREMENTS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ DATA SENT TO STAGE 07:                                        │
│ ├─ Selected pitch angles (full text)                        │
│ ├─ Target journalist beats                                    │
│ ├─ Score basis (1-10)                                       │
│ ├─ Talking points                                            │
│ ├─ Evidence basis                                           │
│ ├─ Risk warnings                                             │
│ └─ (If Stage 05 ran) → Beat mapping + Search guidance      │
│                                                                 │
│ WHAT STAGE 07 RECEIVES:                                      │
│ ├─ [X] angles to collect                                    │
│ ├─ Primary beats: [Beat 1], [Beat 2]                        │
│ ├─ Collection lane: shortlist/bulk/hybrid                  │
│ └─ Search terms per beat                                     │
│                                                                 │
│ STAGE 07 CAN PROCEED IF:                                     │
│ └─ At least 1 angle selected                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step 6.2: Stage 08 (Pitch Drafting) Handoff

```
┌─────────────────────────────────────────────────────────────────┐
│              STAGE 08 HANDOFF REQUIREMENTS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ DATA SENT TO STAGE 08:                                        │
│ ├─ Primary selected angle (if multiple, first one)          │
│ ├─ Full justification (Data-Rich, Research Support)           │
│ ├─ Talking Points (4-5)                                       │
│ ├─ Personalization notes                                     │
│ ├─ Evidence basis                                            │
│ └─ Risk warnings                                             │
│                                                                 │
│ WHAT STAGE 08 RECEIVES:                                      │
│ ├─ Primary angle for pitch drafting                         │
│ ├─ Complete justification context                            │
│ ├─ Outreach talking points                                   │
│ └─ Claim boundaries from risks                              │
│                                                                 │
│ STAGE 08 CAN PROCEED IF:                                     │
│ └─ Selection confirmed and handed off                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step 6.3: Stage 09 (Email Optimization) Handoff

```
┌─────────────────────────────────────────────────────────────────┐
│              STAGE 09 HANDOFF REQUIREMENTS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ DATA SENT TO STAGE 09:                                        │
│ ├─ Pitch draft from Stage 08                                  │
│ ├─ Evidence basis for verification                           │
│ ├─ Claim boundaries from risks                               │
│ ├─ Score metrics                                             │
│ └─ Source credibility notes                                   │
│                                                                 │
│ WHAT STAGE 09 RECEIVES:                                      │
│ ├─ Draft email content                                       │
│ ├─ Source verification checklist                             │
│ ├─ Claim safety guidelines                                    │
│ └─ Quality baseline                                          │
│                                                                 │
│ STAGE 09 CAN PROCEED IF:                                     │
│ └─ Stage 08 draft complete                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step 6.4: Data Flow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                     DATA FLOW SUMMARY                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ INPUT → STAGE 06 → OUTPUT → DOWNSTREAM                        │
│                                                                 │
│ 04-angles.md ──► Pitch Selection ──► 06-selected-angles.md   │
│                          ↓                                      │
│                    Selected angles ──► STAGE 07              │
│                      Journalist Collection                     │
│                          ↓                                      │
│                    Primary angle ──► STAGE 08                 │
│                      Pitch Drafting                           │
│                          ↓                                      │
│                    Draft + evidence ──► STAGE 09            │
│                      Email Optimization                       │
│                                                                 │
│ ALL STAGES CONNECTED: YES                                     │
│ NO DISCONNECTED STATES                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Required 40-Angle Table Format

### Complete Table Structure

```markdown
# Pitch Angles - Stage 04 Output

## All 40 Angles for Review

| # | Category | Journalist Beats | Pitch Angle | Why This Is Newsworthy | Score | Select/Unselect |
|---|----------|-----------------|-------------|----------------------|-------|-----------------|
| 1 | Data-Led | Data Journalist, Investigative Reporter | County Risk Divide: New Data Reveals Where Residents Face Rising Safety Pressure | This angle reveals a significant public safety trend backed by official NHTSA data. The 16.1% increase in Texas pedestrian deaths represents a clear pattern that local and national journalists would find compelling. | 9 | ☐ |
| 2 | Data-Led | Consumer Affairs, Business Reporter | Most Dangerous States for Pedestrians: Texas Ranks in Top 5 | Texas ranks among the top 5 states for pedestrian fatalities, providing a clear ranking angle with national relevance. This positions the story for broader consumer and business coverage. | 8 | ☐ |
| 3 | Trend Story | Health Reporter, Medical Writer | Urban vs Rural: Where Pedestrian Fatalities Are Rising Fastest | Urban areas show faster growth in pedestrian deaths than rural areas, creating a trend story angle that differentiates by geography and appeals to urban policy reporters. | 8 | ☐ |
| 4 | Trend Story | Transportation Reporter, Infrastructure Writer | NHTSA Data Shows Alarming Trend in Pedestrian Safety | Official NHTSA data confirms an alarming trend in pedestrian safety, providing authoritative sourcing for transportation and infrastructure journalists. | 8 | ☐ |
| 5 | Human Interest | Local News Reporter, Community Writer | E-Bike and Scooter Accidents Fuel Pedestrian Death Spike | The rise in e-bike and e-scooter accidents contributes to pedestrian deaths, creating a human interest angle with personal impact for local coverage. | 7 | ☐ |
| 6 | Consumer Behavior | Consumer Affairs, Personal Finance | [Pitch Angle] | [Why Newsworthy Summary] | 8 | ☐ |
| 7 | Public Safety | Public Safety Reporter, Crime Writer | [Pitch Angle] | [Why Newsworthy Summary] | 9 | ☐ |
| 8 | Health & Wellness | Health Reporter, Medical Writer | [Pitch Angle] | [Why Newsworthy Summary] | 8 | ☐ |
| 9 | Finance & Business | Business Reporter, Economy Writer | [Pitch Angle] | [Why Newsworthy Summary] | 7 | ☐ |
| 10 | Environment | Environmental Reporter, Climate Writer | [Pitch Angle] | [Why Newsworthy Summary] | 8 | ☐ |
| 11 | Education | Education Reporter, School Board Writer | [Pitch Angle] | [Why Newsworthy Summary] | 7 | ☐ |
| 12 | Politics & Policy | Political Reporter, Policy Writer | [Pitch Angle] | [Why Newsworthy Summary] | 8 | ☐ |
| 13 | Science & Research | Science Reporter, Research Writer | [Pitch Angle] | [Why Newsworthy Summary] | 7 | ☐ |
| 14 | Lifestyle & Culture | Lifestyle Reporter, Culture Writer | [Pitch Angle] | [Why Newsworthy Summary] | 6 | ☐ |
| 15 | Crime & Safety | Crime Reporter, Safety Writer | [Pitch Angle] | [Why Newsworthy Summary] | 8 | ☐ |
| 16 | Sports | Sports Reporter, Health Writer | [Pitch Angle] | [Why Newsworthy Summary] | 6 | ☐ |
| 17 | Entertainment | Entertainment Reporter, Arts Writer | [Pitch Angle] | [Why Newsworthy Summary] | 5 | ☐ |
| 18 | Real Estate | Real Estate Reporter, Housing Writer | [Pitch Angle] | [Why Newsworthy Summary] | 7 | ☐ |
| 19 | Travel & Tourism | Travel Reporter, Tourism Writer | [Pitch Angle] | [Why Newsworthy Summary] | 6 | ☐ |
| 20 | Food & Dining | Food Reporter, Restaurant Writer | [Pitch Angle] | [Why Newsworthy Summary] | 5 | ☐ |
| 21 | Data-Led | Data Journalist, Investigative Reporter | [Pitch Angle] | [Why Newsworthy Summary] | 8 | ☐ |
| 22 | Data-Led | Consumer Affairs, Business Reporter | [Pitch Angle] | [Why Newsworthy Summary] | 8 | ☐ |
| 23 | Trend Story | Health Reporter, Medical Writer | [Pitch Angle] | [Why Newsworthy Summary] | 7 | ☐ |
| 24 | Trend Story | Transportation Reporter, Infrastructure Writer | [Pitch Angle] | [Why Newsworthy Summary] | 7 | ☐ |
| 25 | Human Interest | Local News Reporter, Community Writer | [Pitch Angle] | [Why Newsworthy Summary] | 7 | ☐ |
| 26 | Consumer Behavior | Consumer Affairs, Personal Finance | [Pitch Angle] | [Why Newsworthy Summary] | 7 | ☐ |
| 27 | Public Safety | Public Safety Reporter, Crime Writer | [Pitch Angle] | [Why Newsworthy Summary] | 8 | ☐ |
| 28 | Health & Wellness | Health Reporter, Medical Writer | [Pitch Angle] | [Why Newsworthy Summary] | 7 | ☐ |
| 29 | Finance & Business | Business Reporter, Economy Writer | [Pitch Angle] | [Why Newsworthy Summary] | 7 | ☐ |
| 30 | Environment | Environmental Reporter, Climate Writer | [Pitch Angle] | [Why Newsworthy Summary] | 7 | ☐ |
| 31 | Education | Education Reporter, School Board Writer | [Pitch Angle] | [Why Newsworthy Summary] | 6 | ☐ |
| 32 | Politics & Policy | Political Reporter, Policy Writer | [Pitch Angle] | [Why Newsworthy Summary] | 7 | ☐ |
| 33 | Science & Research | Science Reporter, Research Writer | [Pitch Angle] | [Why Newsworthy Summary] | 6 | ☐ |
| 34 | Lifestyle & Culture | Lifestyle Reporter, Culture Writer | [Pitch Angle] | [Why Newsworthy Summary] | 5 | ☐ |
| 35 | Crime & Safety | Crime Reporter, Safety Writer | [Pitch Angle] | [Why Newsworthy Summary] | 7 | ☐ |
| 36 | Sports | Sports Reporter, Health Writer | [Pitch Angle] | [Why Newsworthy Summary] | 5 | ☐ |
| 37 | Entertainment | Entertainment Reporter, Arts Writer | [Pitch Angle] | [Why Newsworthy Summary] | 4 | ☐ |
| 38 | Real Estate | Real Estate Reporter, Housing Writer | [Pitch Angle] | [Why Newsworthy Summary] | 6 | ☐ |
| 39 | Travel & Tourism | Travel Reporter, Tourism Writer | [Pitch Angle] | [Why Newsworthy Summary] | 5 | ☐ |
| 40 | Food & Dining | Food Reporter, Restaurant Writer | [Pitch Angle] | [Why Newsworthy Summary] | 5 | ☐ |

---
Total: 40 angles across 20 strategic categories
```

---

## Scoring Context

### GPT-5.5 Scoring Dimensions

| Dimension | Weight | Description |
|-----------|--------|-------------|
| Timeliness | 1-10 | How relevant is "why now"? |
| Novelty | 1-10 | How unique is the finding? |
| Data Strength | 1-10 | Quantifiable evidence quality |
| Human Impact | 1-10 | Reader consequence clear? |
| Local Relevance | 1-10 | Geographic fit for targeting |
| Conflict/Tension | 1-10 | Story has inherent drama? |
| Public Interest | 1-10 | Audience cares? |
| Beat Fit | 1-10 | Natural match to journalist beat |
| Source Credibility | 1-10 | Evidence from 4-5 rated sources? |
| Emotional Resonance | 1-10 | Evokes reaction? |
| Editorial Reason | 1-10 | Has clear story news value? |
| Headline Strength | 1-10 | 8-15 words, compelling, SERP-able |
| Differentiation | 1-10 | Unique among 40 angles? |

**Final Score**: Average of 13 dimensions (1-10)

---

## Selection Criteria Guidelines

### Primary Criteria
- Campaign alignment - Does it fit the brief?
- Audience fit - Does it reach target readers?
- Evidence strength - Is it backed by data?
- News value - Is it genuinely newsworthy?

### Secondary Criteria
- Score quality - Higher scores preferred
- Beat coverage - Matches your outlet targets
- Timing - Is it relevant now?
- Differentiation - Is it unique from competitors?

### What to Avoid
- Low scores (1-4) unless exceptional reason
- Angles without evidence support
- Generic angles that could fit any campaign
- Angles that don't align with campaign goals

### Recommended Selection Count
- 1 angle: Focused single-strategy campaign
- 2-3 angles: Multi-angle campaign with options
- 4-5 angles: Broad campaign with different angles
- 6+ angles: Consider focusing - too many dilutes strategy

---

## AI Model Integration

### How GPT-5.5 Scoring Works

The GPT-5.5 Thinking model evaluated ALL 40 angles:

1. Read each angle's Category, Pitch Angle, Justification
2. Apply 13-dimension scoring rubric
3. Score each dimension 1-10
4. Calculate final score (average of dimensions)
5. Rank angles by score

**What This Means:**
- Higher score = stronger overall angle
- Score is REFERENCE, not requirement
- USER makes final selection decision
- AI helps, human decides

---

## Operational Contract

| Property | Value |
|----------|-------|
| **Name** | pitch-selection |
| **Purpose** | Enable human review and selection of pitch angles for journalist targeting |
| **Required Input** | `04-angles.md` (40 angles) |
| **Optional Input** | `05-beats.md`, `00-brief.md` |
| **Execution Process** | Validate input → Display 40 angles → Analyze scores → Enable selection → Capture choice → Prepare handoff |
| **Output** | `06-selected-angles.md` |
| **Output Format** | Selection table + Summary + Handoff data |
| **User Action Required** | YES - Select angle(s) via checkbox |
| **Trigger Condition** | 40 angles available from Stage 04 |
| **Stop Condition** | User confirms selection and proceeds |
| **Failure Condition** | No angles selected, invalid selection |
| **Selection Minimum** | 1 angle |
| **Handoff Rule** | Selected angles go to Stage 07 (Journalist Collection) |

---

## Definition Of Done

This skill is complete only when:

1. **All 40 angles displayed** in required table format
2. **Every column populated** with correct data
3. **Score column shows** GPT-5.5 evaluation (1-10)
4. **Select/Unselect column** has functional checkbox
5. **User has selected** at least 1 angle
6. **Selection summary** created showing chosen angles
7. **Downstream handoff** ready with selected angle data
8. **Quality checks passed** at all phases
9. **No failure patterns** detected or resolved
10. **Data flow verified** to all downstream stages

---

## Anti-Hallucination And Assumption Control

The AI model (GPT-5.5) scored based on:
- Evidence from `02-insights.md`
- Context from `03-research.md`
- Angle strength from `04-angles.md`

The human user makes final selection based on:
- Campaign strategy alignment
- Client goals
- Editorial judgment
- Resource constraints

**Neither AI nor human should:**
- Invent data not in evidence
- Claim statistics not sourced
- Promise outcomes not supportable

If evidence is unclear, select higher-scoring angles with strong evidence support.

---

## Final Note

**This is the Human Gate** - the only stage requiring human decision-making.

The AI (GPT-5.5) has evaluated all 40 angles and provided scores. Now it's your turn to:

1. Review the angles (Input Phase)
2. Analyze the data quality (Processing Phase)
3. Make your selection (Output Phase)
4. Verify quality (Quality Assurance Phase)
5. Proceed to journalist collection (Downstream Integration)

Your decision drives the campaign forward. The AI supports, you decide.