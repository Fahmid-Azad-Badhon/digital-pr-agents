# Prompt Map

This file shows which file controls which agent, sub-agent, stage, and drafting variant in `D:\Codex Folder\digital-pr-agents`.

## How To Think About Control

- `skills/<agent>/SKILL.md`
  This is the reusable prompt/instruction file for an agent or sub-agent.
- `pitch-jobs/<slug>/00-brief.md`
  This is the campaign-specific prompt for one job.
- `pitch-jobs/<slug>/source-files/...`
  These are the raw inputs the agent reads from.
- `scripts/*.js`
  These are the enforced generation rules when a stage has automation.
- `AGENTS.md`
  These are project-wide rules that apply across the whole workflow.

The mandatory outreach-angle selection gate lives primarily in:

- `skills/digital-pr-orchestrator/SKILL.md`
- `skills/beat-matcher/SKILL.md`
- `templates/05-beats.md`
- `skills/journalist-targeting-subagent/SKILL.md`
- `skills/journalist-intelligence-agent/SKILL.md`
- `skills/pitch-writer/SKILL.md`

Use this gate after `05-beats.md` and before `06-journalist-intel.md`. It forces the workflow to show all available angles, recommend the top 10, preserve secondary angles, wait for user-selected angle(s), and then limit journalist search and six email variants to the active selected angle package unless batch execution is explicitly requested.

Gate status contract:

- `Selection status: pending` means Stage 06 and Stage 08 are blocked.
- `Selection status: confirmed` means the user approved at least one angle and automation can continue for the active selected angle package.
- The scripts require exact `confirmed`; do not use status synonyms.

## Project-Wide Control

| Scope | Main Control File | What It Controls |
|------|-------------------|------------------|
| Whole Digital PR project | [AGENTS.md](</D:/Codex Folder/digital-pr-agents/AGENTS.md>) | Global workflow rules, command list, project conventions |
| Architecture overview | [workflow-architecture.md](</D:/Codex Folder/digital-pr-agents/workflow-architecture.md>) | Stage order, agent responsibilities, current scripted bridges |
| Agent registry | [agent-registry.md](</D:/Codex Folder/digital-pr-agents/agent-registry.md>) | Required operational agents, validation agents, owners, gates, and handoffs |
| Handoff matrix | [handoff-matrix.md](</D:/Codex Folder/digital-pr-agents/handoff-matrix.md>) | Required data packages, validation rules, failure actions, and destination stage for every handoff |
| Validation gates | [validation-gates.md](</D:/Codex Folder/digital-pr-agents/validation-gates.md>) | Required gates with owner, input, output, pass/fail criteria, repair action, escalation, and stop condition |
| Root quick map | [tree.md](</D:/Codex Folder/tree.md>) | Short execution tree and agent/sub-agent map |

## Main Agent

| Agent | Reusable Prompt File | Main Stage Ownership | Notes |
|------|----------------------|----------------------|-------|
| `digital-pr-orchestrator` | [skills/digital-pr-orchestrator/SKILL.md](</D:/Codex Folder/digital-pr-agents/skills/digital-pr-orchestrator/SKILL.md>) | Whole workflow | Controls sequence, handoffs, quality gates, the Stage 05 selection stop, and selected-angle scope lock |

## Research Sub-Agents

| Agent | Reusable Prompt File | Reads From | Produces | Scripted Bridge |
|------|----------------------|------------|----------|-----------------|
| `study-insight-extractor` | [skills/study-insight-extractor/SKILL.md](</D:/Codex Folder/digital-pr-agents/skills/study-insight-extractor/SKILL.md>) | `00-brief.md`, `source-files/study-inputs/raw-study-copy.md` | `01-study-notes.md`, `02-insights.md` | [scripts/draft-study-input.js](</D:/Codex Folder/digital-pr-agents/scripts/draft-study-input.js>) |
| `research-enrichment-agent` | [skills/research-enrichment-agent/SKILL.md](</D:/Codex Folder/digital-pr-agents/skills/research-enrichment-agent/SKILL.md>) | `01-study-notes.md`, `02-insights.md` | `03-research.md` | none |
| `angle-generator` | [skills/angle-generator/SKILL.md](</D:/Codex Folder/digital-pr-agents/skills/angle-generator/SKILL.md>) | `02-insights.md`, `03-research.md` | `04-angles.md` | none |
| `beat-matcher` | [skills/beat-matcher/SKILL.md](</D:/Codex Folder/digital-pr-agents/skills/beat-matcher/SKILL.md>) | `04-angles.md` | `05-beats.md` with top-10 angle review gate, secondary backlog, and selected-angle status | none |

## Journalist Sub-Agent

| Agent | Reusable Prompt File | Reads From | Produces | Scripted Bridge |
|------|----------------------|------------|----------|-----------------|
| `journalist-targeting-subagent` | [skills/journalist-targeting-subagent/SKILL.md](</D:/Codex Folder/digital-pr-agents/skills/journalist-targeting-subagent/SKILL.md>) | selected-angle gate in `05-beats.md`, `source-files/journalist-intel/...`, Muck Rack/SERP/outlet/contact artifacts | validated 800-per-beat targeting package, approved targets, backup targets, manual-review queue, rejected-source notes, Stage 06/07 handoff | none |
| `journalist-intelligence-agent` | [skills/journalist-intelligence-agent/SKILL.md](</D:/Codex Folder/digital-pr-agents/skills/journalist-intelligence-agent/SKILL.md>) | `00-brief.md`, `04-angles.md`, selected-angle gate in `05-beats.md`, validated targeting package, `source-files/journalist-intel/...` | `06-journalist-intel.md`, `07-journalist-coverage.md` for the selected angle only | [scripts/import-muckrack-output.js](</D:/Codex Folder/digital-pr-agents/scripts/import-muckrack-output.js>) and [scripts/draft-journalist-intel.js](</D:/Codex Folder/digital-pr-agents/scripts/draft-journalist-intel.js>) |

## Writing Sub-Agents

| Agent | Reusable Prompt File | Reads From | Produces | Scripted Bridge |
|------|----------------------|------------|----------|-----------------|
| `pitch-writer` | [skills/pitch-writer/SKILL.md](</D:/Codex Folder/digital-pr-agents/skills/pitch-writer/SKILL.md>) | `00-brief.md`, `04-angles.md`, selected-angle gate in `05-beats.md`, `06-journalist-intel.md`, `07-journalist-coverage.md`, optional `03-research.md` | six selected-angle variants in `draft-variants/*`, plus selected `08-pitch-draft.md` | [scripts/draft-pitch-draft.js](</D:/Codex Folder/digital-pr-agents/scripts/draft-pitch-draft.js>) |
| `email-optimizer` | [skills/email-optimizer/SKILL.md](</D:/Codex Folder/digital-pr-agents/skills/email-optimizer/SKILL.md>) | `04-angles.md`, `05-beats.md`, `06-journalist-intel.md`, `07-journalist-coverage.md`, `08-pitch-draft.md` | `09-optimized-email.md` | none |
| `final-doc-packager` | [skills/final-doc-packager/SKILL.md](</D:/Codex Folder/digital-pr-agents/skills/final-doc-packager/SKILL.md>) | `04-angles.md`, `05-beats.md`, `06-journalist-intel.md`, `07-journalist-coverage.md`, `09-optimized-email.md` | `10-google-doc.md` | [scripts/export-google-doc.js](</D:/Codex Folder/digital-pr-agents/scripts/export-google-doc.js>) handles the final Google Doc export after `10-google-doc.md` exists |

## Stage-08 Variant Prompt Control

These are not separate skill folders. Their reusable behavior is controlled primarily inside [scripts/draft-pitch-draft.js](</D:/Codex Folder/digital-pr-agents/scripts/draft-pitch-draft.js>) plus the general writing rules in [skills/pitch-writer/SKILL.md](</D:/Codex Folder/digital-pr-agents/skills/pitch-writer/SKILL.md>).

| Variant | Output File | Main Control |
|------|-------------|--------------|
| `straight-news` | [templates/draft-variants/08a-straight-news.md](</D:/Codex Folder/digital-pr-agents/templates/draft-variants/08a-straight-news.md>) | [scripts/draft-pitch-draft.js](</D:/Codex Folder/digital-pr-agents/scripts/draft-pitch-draft.js>) |
| `short-punchy` | [templates/draft-variants/08b-short-punchy.md](</D:/Codex Folder/digital-pr-agents/templates/draft-variants/08b-short-punchy.md>) | [scripts/draft-pitch-draft.js](</D:/Codex Folder/digital-pr-agents/scripts/draft-pitch-draft.js>) |
| `data-heavy` | [templates/draft-variants/08c-data-heavy.md](</D:/Codex Folder/digital-pr-agents/templates/draft-variants/08c-data-heavy.md>) | [scripts/draft-pitch-draft.js](</D:/Codex Folder/digital-pr-agents/scripts/draft-pitch-draft.js>) |
| `journalist-personalized` | [templates/draft-variants/08d-journalist-personalized.md](</D:/Codex Folder/digital-pr-agents/templates/draft-variants/08d-journalist-personalized.md>) | [scripts/draft-pitch-draft.js](</D:/Codex Folder/digital-pr-agents/scripts/draft-pitch-draft.js>) |
| `storytelling-narrative` | [templates/draft-variants/08e-storytelling-narrative.md](</D:/Codex Folder/digital-pr-agents/templates/draft-variants/08e-storytelling-narrative.md>) | [scripts/draft-pitch-draft.js](</D:/Codex Folder/digital-pr-agents/scripts/draft-pitch-draft.js>) |
| `localized` | [templates/draft-variants/08f-localized.md](</D:/Codex Folder/digital-pr-agents/templates/draft-variants/08f-localized.md>) | [scripts/draft-pitch-draft.js](</D:/Codex Folder/digital-pr-agents/scripts/draft-pitch-draft.js>) |

## Job-Specific Prompt Files

These are the files you edit when you want to guide one campaign only.

| Purpose | File |
|------|------|
| Core campaign prompt | [templates/00-brief.md](</D:/Codex Folder/digital-pr-agents/templates/00-brief.md>) |
| Raw study/source text | [templates/source-files/study-inputs/raw-study-copy.md](</D:/Codex Folder/digital-pr-agents/templates/source-files/study-inputs/raw-study-copy.md>) |
| Selected-angle journalist collection control | [templates/source-files/journalist-intel/selected-angle/selected-angle-journalist-collection.md](</D:/Codex Folder/digital-pr-agents/templates/source-files/journalist-intel/selected-angle/selected-angle-journalist-collection.md>) |
| Raw journalist exports | [templates/source-files/journalist-intel/muck-rack-exports/README.md](</D:/Codex Folder/digital-pr-agents/templates/source-files/journalist-intel/muck-rack-exports/README.md>) |
| Profile notes / captured journalist data | [templates/source-files/journalist-intel/profile-notes/README.md](</D:/Codex Folder/digital-pr-agents/templates/source-files/journalist-intel/profile-notes/README.md>) |

## If You Want To Change...

| Goal | Edit This File First |
|------|----------------------|
| Change how the main orchestrator behaves | [skills/digital-pr-orchestrator/SKILL.md](</D:/Codex Folder/digital-pr-agents/skills/digital-pr-orchestrator/SKILL.md>) |
| Change one agent's permanent instructions | that agent's `skills/<agent>/SKILL.md` |
| Change the Stage 05 stop gate, top-10 review, or selected-angle handoff | [skills/beat-matcher/SKILL.md](</D:/Codex Folder/digital-pr-agents/skills/beat-matcher/SKILL.md>) and [templates/05-beats.md](</D:/Codex Folder/digital-pr-agents/templates/05-beats.md>) |
| Change the selected-angle journalist collection bridge | [templates/source-files/journalist-intel/selected-angle/selected-angle-journalist-collection.md](</D:/Codex Folder/digital-pr-agents/templates/source-files/journalist-intel/selected-angle/selected-angle-journalist-collection.md>) and [skills/muck-rack-bulk-collector/SKILL.md](</D:/Codex Folder/digital-pr-agents/skills/muck-rack-bulk-collector/SKILL.md>) |
| Change journalist targeting, 800-per-beat validation, dedupe, scoring, approved targets, or Stage 06/07 targeting handoff | [skills/journalist-targeting-subagent/SKILL.md](</D:/Codex Folder/digital-pr-agents/skills/journalist-targeting-subagent/SKILL.md>) |
| Change the rule that journalist search must only run for the selected angle | [skills/journalist-intelligence-agent/SKILL.md](</D:/Codex Folder/digital-pr-agents/skills/journalist-intelligence-agent/SKILL.md>) |
| Change the rule that only six variants are drafted for one selected angle | [skills/pitch-writer/SKILL.md](</D:/Codex Folder/digital-pr-agents/skills/pitch-writer/SKILL.md>) and [scripts/draft-pitch-draft.js](</D:/Codex Folder/digital-pr-agents/scripts/draft-pitch-draft.js>) |
| Change one campaign only | the job's `pitch-jobs/<slug>/00-brief.md` |
| Change how `01` and `02` are auto-generated | [scripts/draft-study-input.js](</D:/Codex Folder/digital-pr-agents/scripts/draft-study-input.js>) |
| Change how `06` and `07` are auto-generated | [scripts/draft-journalist-intel.js](</D:/Codex Folder/digital-pr-agents/scripts/draft-journalist-intel.js>) |
| Change how the six draft formats are written | [scripts/draft-pitch-draft.js](</D:/Codex Folder/digital-pr-agents/scripts/draft-pitch-draft.js>) |
| Change which draft variant wins | [scripts/draft-pitch-draft.js](</D:/Codex Folder/digital-pr-agents/scripts/draft-pitch-draft.js>) |
| Change project-wide rules | [AGENTS.md](</D:/Codex Folder/digital-pr-agents/AGENTS.md>) |

## Most Important Rule

If you want a permanent prompt change, edit the relevant `SKILL.md`.

If you want a one-campaign prompt change, edit the job's `00-brief.md`.

If you want to force a format or output structure no matter what, edit the relevant `scripts/*.js`.
