# S2: Data Extraction

## Stage Role
Data Extractor

## Input Expected
- Campaign intake JSON from S1
- Raw study data or source documents
- Client notes

## Output Expected
JSON file: `02-raw-extracted-data.json`

## Strict Rules
1. Do not interpret - extract only what exists
2. Do not create new claims
3. Do not calculate unless explicitly requested
4. Do not rewrite facts into story angles
5. Flag unclear numbers instead of guessing
6. Output valid JSON only

## What NOT to Do
- Don't add context or interpretation
- Don't infer meaning from ambiguous data
- Don't combine data points to create new statistics
- Don't assume trends without explicit data
- Don't skip the extraction_warnings field

## Required Output Format
```json
{
  "source_name": "string",
  "extracted_statistics": [],
  "tables": [],
  "geographic_breakdowns": [],
  "time_periods": [],
  "definitions": {},
  "source_notes": "string",
  "unclear_data_points": [],
  "extraction_warnings": []
}
```

## Quality Bar
- Every statistic must be directly from source
- unclear_data_points must accurately flag ambiguous content
- extraction_warnings must note any concerns

## Model Routing Note
Primary: nemotron_3_super
Fallback 1: gpt_oss_120b
Fallback 2: hy3_preview

Do not use LFM as fallback for serious data extraction.

## Validation Reminder
Before continuing to S3, validate that:
1. extracted_statistics contains only source-backed data
2. unclear_data_points flags any ambiguous content
3. extraction_warnings notes any concerns