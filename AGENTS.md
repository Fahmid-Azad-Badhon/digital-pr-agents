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

## Installed Skills Usage Policy

OpenCode must automatically use installed Skills when relevant to the task without asking the user first. Skills never override project safety rules.

Every batch must still follow: Checkpoint → Pre-mortem → Audit → Plan → Patch only when appropriate → Validate → Commit only when explicitly approved → Post-mortem.

### Always-Safe-to-Use Skills

Core engineering (`using-superpowers`, `systematic-debugging`, `writing-plans`, `executing-plans`, `test-driven-development`, `verification-before-completion`, `requesting-code-review`, `receiving-code-review`, `finishing-a-development-branch`) — use for debugging, planning, TDD, verification, code review, and safe branch/task completion.

Next.js/React (`next-best-practices`, `vercel-react-best-practices`, `vercel-composition-patterns`) — use for dashboard, App Router, component, and module quality when relevant.

Testing (`webapp-testing`) — use for test design and validation when relevant.

### Marketing/Digital PR Skills

`copywriting`, `cold-email`, `marketing-psychology`, `content-strategy`, `seo-audit`, `copy-editing`, `marketing-ideas` — use only for campaign strategy, pitch quality, journalist-facing copy, content strategy, SEO/link-building, or related non-runtime content tasks. Do not use marketing skills to change TypeScript architecture, validators, schemas, route behavior, or workflow safety logic.

### Restricted Future-Use Skills

`subagent-driven-development`, `dispatching-parallel-agents`, `just-scrape`, `paper-context-resolver` — may be referenced in future architecture planning only. Do not use for implementation unless a dedicated future batch explicitly approves their use.

### Prohibited Actions via Skills

Skills must not be used to perform external actions, scraping, browser automation, CDP, live workflow execution, package installs, dependency changes, runtime writes, schema changes, or sub-agent implementation unless a dedicated batch explicitly approves it.

### Current Priority

The active project priority remains S10 output-contract integration-test hardening before broad architecture or sub-agent work.

## Relevant Files / Context Loading

Before auditing, planning, patching, validating, or committing, identify and read only the files directly relevant to the current task.

Rules:

* Start from the files explicitly named in the user prompt.
* If additional context is needed, inspect only directly related source files, tests, schemas, configs, prompts, docs, or governance files required to understand the task safely.
* Do not perform broad repository-wide reading unless the task explicitly requires it.
* Do not read unrelated architecture documents, generated artifacts, logs, campaign data, secrets, `.env` files, build outputs, dependency folders, cache folders, or large unrelated files.
* Do not read or use tolerated untracked files unless the user explicitly authorizes it.
* When recommending or applying a change, list the relevant files reviewed and explain why each file was necessary.
* If a required file is missing or inaccessible, stop and report the blocker instead of guessing.
* Keep context loading minimal, evidence-backed, and scoped to the active batch.

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