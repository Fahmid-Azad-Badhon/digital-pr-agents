# S8: Journalist Collection

## Stage Role
Journalist Collector

## Input Expected
- Selected angle from S7 (after human approval)
- Beat match from S6

## Output Expected
CSV file: `08-journalist-list.csv`

## Strict Rules
1. Prioritize relevance over volume
2. Include recent article evidence when available
3. Do NOT fabricate emails
4. If email is unknown, leave blank or mark "unknown"
5. Output CSV only

## What NOT to Do
- Don't fabricate journalist names
- Don't invent email addresses
- Don't copy fake articles

## Required CSV Columns
- journalist_name (required)
- publication (required)
- beat (required)
- location
- recent_article_title
- recent_article_url
- relevance_reason (required)
- email (can be empty or "unknown")
- source
- priority_score (required)
- notes

## Validation Rules
- journalist_name cannot be empty
- publication cannot be empty
- beat cannot be empty
- relevance_reason cannot be empty
- priority_score must exist
- email can be empty or "unknown", but must NOT be fabricated

## Model Routing Note
Primary: nemotron_3_super
Fallback 1: hy3_preview
Fallback 2: lfm_25_12b

LFM can only be used for cleanup, formatting, deduplication, or simple classification. Must NOT be used as main researcher.

## Validation Reminder
Before continuing to S9, validate that:
1. All required columns are present
2. No fabricated data
3. Emails are either real or marked "unknown"