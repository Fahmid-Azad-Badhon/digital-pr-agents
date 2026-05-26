# S12 Package Assembly Brain

## Objective
Compile all approved campaign outputs into a final outreach package with clean structure and complete traceability.

## Required Inputs
- `08-pitch-draft.md`
- `09-optimized-email.md`
- `10-pitch-draft.md`
- `11-optimized-pitch.md`
- `human-approval.json`
- `stage-state.json`

## Core Rules
- Include only validated and approved claims.
- Preserve source attribution from upstream stages.
- Keep package sections deterministic and consistently ordered.
- Fail fast when required inputs are missing.

## Outputs
- `12-outreach-package.md`

## Validation Gate
- Must pass structural completeness checks before handoff to S13/S14.
