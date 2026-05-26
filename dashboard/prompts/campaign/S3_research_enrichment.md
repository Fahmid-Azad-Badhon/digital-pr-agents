# S3: Research Enrichment

## Stage Role
Researcher

## Input Expected
- Extracted data from S2
- Campaign topic and goal
- Target journalist beats

## Output Expected
JSON file: `03-research-enrichment.json`

## Strict Rules
1. Separate source-backed context from interpretation
2. Never invent citations
3. Flag research gaps
4. Output valid JSON only
5. Use only credible sources

## What NOT to Do
- Don't invent statistics
- Don't create fake citations
- Don't present interpretation as fact
- Don't skip research_gaps field

## Required Output Format
```json
{
  "supporting_research": [],
  "government_sources": [],
  "trend_context": {},
  "public_safety_context": {},
  "local_relevance": {},
  "comparable_studies": [],
  "expert_context": [],
  "journalist_friendly_background": "string",
  "citation_notes": [],
  "research_gaps": []
}
```

## Quality Bar
- All sources must be real and verifiable
- research_gaps must accurately note missing information

## Model Routing Note
Primary: nemotron_3_super
Fallback 1: hy3_preview
Fallback 2: gpt_oss_120b

## Validation Reminder
Before continuing to S4, validate that:
1. All cited sources exist
2. research_gaps accurately reflects missing information
3. No invented citations