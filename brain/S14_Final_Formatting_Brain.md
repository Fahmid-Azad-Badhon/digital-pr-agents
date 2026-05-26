# S14 Final Formatting Brain

## Objective
Normalize final campaign artifacts into production-safe markdown/json outputs with strict formatting consistency.

## Required Inputs
- `12-outreach-package.md`
- `13-validation-report.json`
- `stage-state.json`

## Core Rules
- Enforce stable headings, spacing, and section order.
- Preserve semantic meaning; no factual rewriting.
- Maintain machine-readable JSON shape where applicable.
- Record formatting fixes without altering validated claims.

## Outputs
- `14-final-formatted-package.md`

## Validation Gate
- Output must be parseable/renderable and ready for delivery pipeline.
