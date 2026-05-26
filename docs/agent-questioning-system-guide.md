# Agent Questioning System Guide

## Overview

The Agent Questioning System enables structured agent-to-agent communication for context clarification, verification, and handoff without guessing or hallucinating.

## Core Principles

- **Ask the owner of the information** - Route questions to the agent that owns the relevant data
- **Do not guess** - Agents must ask instead of making assumptions
- **Structured communication** - All questions and answers use JSON contracts
- **Blocking behavior** - Critical questions pause workflow until resolved

## System Architecture

### Configuration Files

| File | Purpose |
|------|---------|
| `agent-question-routing.json` | Maps issue types to target agents |
| `question-issue-types.json` | Defines issue categories and required answer fields |
| `question-priority-rules.json` | Sets priority and blocking status |
| `question-answer-contracts.json` | Defines required fields per issue type |

### Campaign Files

| File | Purpose |
|------|---------|
| `agent-questions.json` | All questions for the campaign |
| `agent-answers.json` | All answers for the campaign |
| `question-thread-log.json` | Event log for all question threads |
| `context-resolution-status.json` | Summary of resolution status |
| `pending-human-questions.json` | Questions requiring human input |

## Issue Types

### Campaign Context
- `missing_campaign_context` - Campaign topic, client, geography unclear
- `unclear_campaign_goal` - Campaign objective unclear
- `missing_client_or_brand_context` - Client/brand info missing
- `unclear_geography` - Target geography unclear
- `missing_source_material` - Source material missing (escalates to Human)

### Data Issues
- `unclear_statistic` - Statistic unclear or missing source
- `missing_metric_definition` - Metric needs definition
- `possible_derived_metric` - Metric may be derived

### Research & Source
- `source_credibility_unclear` - Source credibility needs verification
- `conflicting_sources` - Sources conflict
- `research_scope_unclear` - Research scope needs clarification

### Claim Safety
- `claim_safety_unclear` - Claim safety in pitch unclear
- `unsupported_claim_detected` - Unsupported claim found
- `pitch_claim_not_in_ledger` - Pitch claim not in claim ledger

### Insight & Angle
- `strongest_finding_unclear` - Strongest finding unclear
- `story_tension_unclear` - Story tension unclear
- `angle_frame_unclear` - Angle frame unclear
- `beat_match_unclear` - Beat match unclear

### Human Approval
- `human_angle_approval_required` - Human approval needed (escalates to Human)
- `selected_angle_missing` - No angle selected
- `angle_score_dispute` - Angle scoring dispute

### Journalist
- `journalist_collection_scope_unclear` - Collection scope unclear
- `journalist_fit_unclear` - Journalist fit unclear
- `journalist_personalization_unclear` - Personalization unclear

### Pitch & Package
- `pitch_fact_missing` - Fact missing from pitch
- `pitch_tone_issue` - Tone issue in pitch
- `pitch_structure_issue` - Structure issue
- `package_completeness_issue` - Package incomplete

### Validation & Production
- `validation_failure` - S13 validation failed
- `final_send_approval_required` - Final send approval (escalates to Human)
- `production_asset_unclear` - Asset requirements unclear
- `learning_loop_context_unclear` - Learning context unclear

## Priority Levels

| Priority | Blocking | Examples |
|----------|----------|----------|
| Critical | Yes | Claims in pitch, S7/S13 approval, missing source material |
| High | Usually | Unclear statistics, source credibility, beat matching |
| Medium | No | Tone improvements, package completeness |
| Low | No | Optional notes, formatting preferences |

## Question Flow

1. **Agent detects missing context** - Agent identifies unclear information
2. **Create structured question** - Agent creates question with required fields
3. **Route to target** - System routes to correct agent based on issue type
4. **Target agent answers** - Agent responds with structured answer
5. **Validate answer** - System validates answer meets contract
6. **Resolve or reopen** - Asking agent accepts or reopens

## API Endpoints

### GET /api/campaigns/{slug}/questions
Get all questions and context resolution status.

### POST /api/campaigns/{slug}/questions
Create a new question:
```json
{
  "askingStageId": "S10_PITCH_DRAFTING",
  "askingAgent": "Pitch Copywriter",
  "targetStageId": "S4A_DATA_RESEARCH_ANALYST",
  "targetAgent": "Data & Research Analyst",
  "issueType": "pitch_claim_not_in_ledger",
  "category": "claim_safety",
  "priority": "critical",
  "blocking": true,
  "exactQuestion": "Can this claim be used?",
  "relatedFiles": ["10-pitch-draft.md", "claim-ledger.json"],
  "requiredAnswerFields": ["claimStatus", "safeToUseInPitch", "approvedWording"]
}
```

### POST /api/campaigns/{slug}/questions/{questionId}/answer
Submit answer to a question.

### POST /api/campaigns/{slug}/questions/{questionId}/resolve
Mark question as resolved.

### POST /api/campaigns/{slug}/questions/{questionId}/reopen
Reopen a question (requires reason).

### POST /api/campaigns/{slug}/questions/{questionId}/escalate
Escalate to human (requires reason).

### GET /api/campaigns/{slug}/questions?action=status
Get context resolution status only.

### GET /api/campaigns/{slug}/questions?action=human
Get pending human questions.

## Blocking Behavior

- If `blocking: true` question is open, workflow cannot continue
- `context-resolution-status.json` shows `canWorkflowContinue: false`
- Gates check for blocking questions before passing

## Replay Mode Integration

When replay changes upstream files:
- Related answered questions are marked `stale`
- Questions need revalidation before continuing

## Validation Rules

### Question Validation
- Required fields must be present
- Asking agent must be allowed to ask that issue type
- Target agent must be valid

### Answer Validation
- Required answer fields must be present
- Evidence files must be listed
- Low confidence answers must include limitations

## Safe Guardrails

- Writing agents cannot verify factual truth
- Research agents cannot approve final outreach
- Validator cannot write pitch copy
- Human remains final authority for approvals