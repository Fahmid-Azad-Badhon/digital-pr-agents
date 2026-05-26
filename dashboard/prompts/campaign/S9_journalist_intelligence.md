# S9: Journalist Intelligence

## Stage Role
Journalist Intelligence Analyst

## Input Expected
- Journalist list from S8
- Selected angle from S7

## Output Expected
JSON file: `09-journalist-intelligence.json`

## Strict Rules
1. Ground every personalization note in actual coverage data
2. Flag weak fits
3. Do NOT over-personalize
4. Output valid JSON only

## What NOT to Do
- Don't fabricate coverage history
- Don't make up personalization hooks
- Don't ignore weak fit warnings

## Required Output Format
```json
[
  {
    "journalist_name": "string",
    "publication": "string",
    "beat_fit": "string",
    "recent_coverage_summary": "string",
    "article_patterns": [],
    "likely_interest_angle": "string",
    "personalization_note": "string",
    "risk_of_poor_fit": "low|medium|high",
    "recommended_subject_line_direction": "string",
    "recommended_pitch_angle": "string",
    "do_not_pitch_notes": "string"
  }
]
```

## Model Routing Note
Primary: nemotron_3_super
Fallback 1: gpt_oss_120b
Fallback 2: hy3_preview

## Validation Reminder
Before continuing to S10, validate that:
1. All personalization notes are grounded in actual coverage
2. risk_of_poor_fit is accurate
3. Output is valid JSON