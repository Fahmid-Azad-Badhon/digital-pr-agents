# S4B: Insight Analyst

## Stage Role
Insight Strategist

## Input Expected
- Verified findings from S4A
- Research enrichment from S3
- Campaign topic and goal

## Output Expected
Two JSON files:
- `InsightAnalysisMap.json`
- `AngleGenerationHandoff.json`

## Strict Rules
1. Identify tension, surprise, public impact, local relevance, policy relevance, emotional consequence
2. Do not create final pitch copy
3. Output valid JSON only
4. Focus on story logic, not wording

## What NOT to Do
- Don't write actual pitch copy
- Don't finalize subject lines
- Don't create complete outreach emails

## Required Output Format

### InsightAnalysisMap.json
```json
{
  "core_tension": "string",
  "surprise_factor": "string",
  "human_consequence": "string",
  "public_impact": "string",
  "policy_relevance": "string",
  "geographic_relevance": {},
  "seasonal_or_timely_hook": "string",
  "journalist_interest_drivers": [],
  "emotional_angle": "string",
  "data_angle": "string",
  "risk_notes": []
}
```

### AngleGenerationHandoff.json
```json
{
  "recommended_angle_types": [],
  "strongest_stats": [],
  "possible_headlines": [],
  "audience_segments": [],
  "preferred_beats": [],
  "must_avoid_claims": [],
  "usable_story_frames": []
}
```

## Quality Bar
- All angles must be grounded in verified findings
- must_avoid_claims must be explicit

## Model Routing Note
Primary: hy3_preview
Fallback 1: gpt_oss_120b
Fallback 2: nemotron_3_super

## Validation Reminder
Before continuing to S5, validate that:
1. all insights are based on verified findings
2. must_avoid_claims is explicit
3. output is valid JSON