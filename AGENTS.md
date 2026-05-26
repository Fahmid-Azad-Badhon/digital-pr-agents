# Agent Instructions - Digital PR Orchestrator

## Overview

This document defines the agent behavior, command structure, and workflow conventions for the Digital PR journalist email pitch automation system.

## Package Manager

| Tool | Use Case |
|------|----------|
| `npm` | Local Google Docs export dependencies |
| PowerShell | Local scripts in `scripts/` directory |
| Python | Skill validation via Codex runtime |

## File-Scoped Commands

### Workflow Commands

| Task | Command | Stage |
|------|---------|-------|
| Create new pitch job | `.\scripts\new-pitch-job.cmd <slug>` | - |
| List active jobs | `Get-ChildItem .\pitch-jobs -Directory` | - |
| Validate stage handoff | `.\scripts\validate-stage.cmd <job-name> <stage-file>` | All |

### Stage Execution Commands

| Task | Command | Stage |
|------|---------|-------|
| Auto-draft study stages | `.\scripts\draft-study-input.cmd <job-name>` | 01-02 |
| Import Muck Rack captures | `.\scripts\import-muckrack-output.cmd <job-name> [--all]` | 06-07 |
| Draft journalist stages | `.\scripts\draft-journalist-intel.cmd <job-name>` | 06-07 |
| Draft six pitch variants | `.\scripts\draft-pitch-draft.cmd <job-name>` | 08 |
| Export to Google Docs | `.\scripts\export-google-doc.cmd <job-name> ["Title"]` | 10 |

### Skill Validation Command

```powershell
& 'C:\Users\fahmi\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' 
  'C:\Users\fahmi\.codex\skills\.system\skill-creator\scripts\quick_validate.py' 
  .\skills\<skill-name>
```

## Key Conventions

### Job Structure

```
pitch-jobs/<slug>/
├── 00-brief.md              # Campaign brief
├── 01-study-notes.md        # Raw study extraction
├── 02-insights.md           # Structured data points
├── 03-research.md           # Research enrichment
├── 04-angles.md            # 40 pitch angles (GPT-5.5 scored)
├── 05-beats.md             # Beat mapping + selection
├── 06-journalist-intel.md  # Journalist profiles
├── 07-journalist-coverage.md  # Coverage history
├── 08-pitch-draft.md       # Selected pitch variant
├── 09-optimized-email.md   # Final optimized email
├── 10-google-doc.md       # Export package
├── source-files/
│   ├── study-inputs/
│   │   └── raw-study-copy.md
│   └── journalist-intel/
│       ├── bulk-beat-collection/
│       └── selected-angle/
├── draft-variants/
│   ├── 08a-straight-news.md
│   ├── 08b-short-punchy.md
│   ├── 08c-data-heavy.md
│   ├── 08d-journalist-personalized.md
│   ├── 08e-storytelling-narrative.md
│   └── 08f-localized.md
└── README.md
```

### Stage Rules

1. **Never skip** - Keep numbered sequence 00-10
2. **Never rename** - Use standard file names
3. **Never mix** - Source files go in `source-files/`
4. **Never auto-send** - Email sending is out of scope unless explicitly requested

### Journalist Matching Rules

- **Primary**: Beat-fit and personalization logic
- **Secondary**: Named journalists only when:
  - User provides specific names
  - User asks for current research
  - Muck Rack exports provide verified data

### Current Scripted Path

```
raw-study-copy.md
    ↓
draft-study-input (Stage 1-2)
    ↓
Research enrichment (Stage 3)
    ↓
40-angle generation + GPT-5.5 scoring (Stage 4)
    ↓
User angle selection (Stage 4)
    ↓
Selected-angle Muck Rack/SERP collection (Stage 6)
    ↓
import-muckrack-output (Stage 6-7)
    ↓
draft-journalist-intel (Stage 6-7)
    ↓
draft-pitch-draft (Stage 8)
    ↓
export-google-doc (Stage 10)
```

## Model Configuration

### GPT-5.5 Thinking (Quality Gate)

- **Stage 4**: Score ALL 40 angles
- **Stage 5**: Validate beat mapping
- **Stage 8**: Select best variant
- **Stage 9**: Final email approval
- **Stage 10**: Package approval

### Free Models (Production)

| Model | Role |
|-------|------|
| Hy3 Preview | Campaign orchestration, angle generation |
| Nemotron 3 Super | Research extraction, journalist intelligence |
| MiniMax M2.5 | Pitch variants, email drafting |
| Qwen3 Coder | Dashboard, scripts |

## Error Handling

| Error Type | Response |
|------------|----------|
| Stage validation fail | Return to previous stage |
| No angles selected | Pause workflow, await user input |
| Missing source data | Use fallback: "Information unavailable. Verification required before use." |
| Journalist collection fails | Retry 3x, then flag for manual review |

## Quality Standards

### Anti-Hallucination Rules

- Never invent data, sources, journalist names, or SERP results
- Use: `Information unavailable. Verification required before use.`
- All claims must cite source evidence

### Angle Generation Rules

- 40 angles = 20 categories × 2 angles each
- GPT-5.5 scores ALL 40 (never top 3 only)
- User selects via checkboxes `[ ]`
- Selected angles preserved through pipeline

### Journalist Collection Rules

- Maximum raw collection: 800 per beat
- First send batch: 5-15 journalists
- Quality over quantity - Muck Rack data:
  - 69% say pitch worth time if tailored
  - 86% disregard irrelevant pitches

## Version Information

| Version | Date | Author |
|---------|------|---------|
| 1.0 | 2026-05-06 | Digital PR Team |

## Related Documentation

- `MODEL-CONFIG.md` - Model routing contract
- `handoff-matrix.md` - Stage handoff data
- `validation-gates.md` - Quality gates
- `runbook.md` - Operational procedures
- `workflow-architecture.md` - System architecture