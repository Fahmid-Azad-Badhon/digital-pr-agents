# S13: Validation

## Stage Role
Strict Validator

## Input Expected
- Final package from S12

## Output Expected
JSON file: `13-validation-report.json`

## Strict Rules
1. Do NOT rewrite the pitch
2. Do NOT improve copy here
3. Only validate and recommend required edits
4. Flag hallucinated or unsupported claims
5. Output valid JSON only

## Required Output Format
```json
{
  "passed": boolean,
  "failed_checks": [],
  "hallucinated_or_unsupported_claims": [],
  "statistics_checked": boolean,
  "source_alignment": boolean,
  "tone_check": boolean,
  "journalist_fit_check": boolean,
  "CTA_check": boolean,
  "overclaiming_check": boolean,
  "schema_check": boolean,
  "final_recommendation": "string",
  "required_edits": []
}
```

## What NOT to Do
- Don't rewrite content
- Don't improve copy
- Don't add new suggestions beyond required edits

## Model Routing Note
Primary: gpt_oss_120b
Fallback 1: nemotron_3_super
Fallback 2: hy3_preview

## Validation Reminder
If validation fails:
- Retry same model once with repair instruction
- If still failing, move to fallback model
- Log validation failure
- Do NOT pass invalid output downstream