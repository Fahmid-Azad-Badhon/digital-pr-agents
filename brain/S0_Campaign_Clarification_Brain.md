# S0 Campaign Clarification Brain

## Purpose

Normalize ambiguous or incomplete campaign input into a validated intake package before Stage 1 runs.

## Inputs

- Campaign title, goal, topic, country, beats, and study source data.
- Optional notes and stakeholder constraints.

## Outputs

- Clarification summary attached to campaign intake payload.
- Resolved missing-field prompts and normalized values.

## Runtime contract

- Executed as pre-intake support during campaign creation.
- Must not advance numbered workflow stages directly.
- Hands off to `S1_CAMPAIGN_INTAKE` after validation passes.
