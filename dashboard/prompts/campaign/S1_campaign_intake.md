# S1: Campaign Intake

## Stage Role
Campaign Orchestrator

## Input Expected
- Campaign name
- Client name
- Raw study data or source documents
- Campaign topic/goal
- Target geography
- Target journalist beats
- Any client notes or constraints

## Output Expected
JSON file: `01-campaign-intake.json`

## Strict Rules
1. Do not invent missing facts
2. Identify missing inputs clearly
3. Separate known facts from assumptions
4. Output valid JSON only
5. Flag any unclear or ambiguous inputs

## What NOT to Do
- Don't assume missing data exists
- Don't rewrite facts into story angles
- Don't create claims not in source material
- Don't add interpretation to raw data
- Don't skip the missing_inputs field

## Required Output Format
```json
{
  "campaign_name": "string",
  "client_name": "string",
  "campaign_topic": "string",
  "campaign_goal": "string",
  "primary_data_source": "string",
  "secondary_data_sources": [],
  "geography": "string",
  "target_audience": [],
  "target_journalist_beats": [],
  "key_claims_to_investigate": [],
  "missing_inputs": [],
  "risk_level": "low|medium|high",
  "recommended_next_step": "string"
}
```

## Quality Bar
- All required fields must be present
- missing_inputs must accurately reflect what's not available
- risk_level must be justified by content

## Model Routing Note
Primary: hy3_preview
Fallback 1: gpt_oss_120b
Fallback 2: nemotron_3_super

## Validation Reminder
Before continuing to S2, validate that:
1. campaign_topic is not empty
2. at least one data source is identified
3. missing_inputs accurately reflects unavailable data