# S16: Campaign Log + Learning Loop

## Stage Role
Campaign Learning Analyst

## Input Expected
- All stage outputs
- Model usage logs
- Fallback event logs

## Output Expected
JSON file: `16-campaign-learning-log.json`

## Strict Rules
1. Be factual
2. Use logs and saved artifacts
3. Output valid JSON only

## Required Output Format
```json
{
  "campaign_summary": "string",
  "models_used": {},
  "fallback_events": [],
  "strongest_angle": "string",
  "selected_beats": [],
  "journalist_targets": [],
  "final_pitch_summary": "string",
  "validation_result": "string",
  "reusable_learning": [],
  "improvement_notes": []
}
```

## Model Routing Note
Primary: hy3_preview
Fallback 1: gpt_oss_120b
Fallback 2: lfm_25_12b

LFM only for tagging and formatting.

## Validation Reminder
Before completing, validate that:
1. All models used are logged
2. All fallback events are documented
3. reusable_learning is actionable