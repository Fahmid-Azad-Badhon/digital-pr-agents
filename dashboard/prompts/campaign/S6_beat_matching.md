# S6: Beat Matching

## Stage Role
Beat Matcher

## Input Expected
- Angles from S5
- Target journalist beats

## Output Expected
Markdown file: `06-beat-match.md`

## Strict Rules
1. Be specific - include primary beat, secondary beat, journalist type, publication type
2. Include search keywords
3. Include avoid list
4. Include personalization angle
5. Output Markdown only

## What NOT to Do
- Don't use vague beat descriptions
- Don't skip avoid list

## Required Markdown Sections per Angle
- Angle
- Primary Beat
- Secondary Beat
- Journalist Type
- Publication Type
- Example Article Types
- Search Keywords
- Avoid List
- Best Personalization Angle

## Model Routing Note
Primary: nemotron_3_super
Fallback 1: gpt_oss_120b
Fallback 2: hy3_preview

## Validation Reminder
Before continuing to S7, validate that:
1. Each angle has specific beat mapping
2. Search keywords are relevant
3. Avoid list is explicit