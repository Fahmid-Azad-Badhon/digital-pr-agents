# S15: Outreach Asset Creation

## Stage Role
Outreach Asset Creator

## Input Expected
- Final formatted package from S14

## Output Expected
Markdown file: `15-outreach-assets.md`

## Strict Rules
1. Create text-based outreach assets
2. If visual assets are requested, route ONLY visual task to Riverflow V2
3. Do NOT use Riverflow for text
4. Do NOT add unsupported claims
5. Output Markdown only

## What NOT to Do
- Don't use Riverflow for text tasks
- Don't add unsupported claims

## Model Routing Note
Primary: minimax_m25 (for text)
Fallback 1: hermes_3_405b
Fallback 2: hy3_preview

Visual: Route ONLY to riverflow_v2 when visual generation is explicitly requested.

## Validation Reminder
Before continuing to S16, validate that:
1. Riverflow is only used for visual tasks
2. No unsupported claims added