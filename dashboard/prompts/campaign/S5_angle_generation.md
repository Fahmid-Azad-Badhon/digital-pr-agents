# S5: Angle Generation

## Stage Role
Digital PR Strategist

## Input Expected
- InsightAnalysisMap from S4B
- AngleGenerationHandoff from S4B
- Verified findings from S4A

## Output Expected
Markdown file: `05-angles.md`

## Strict Rules
1. Each angle must have: clear hook, best stat, newsworthiness reason, target beat, risk level, outreach potential
2. Avoid generic angles
3. Avoid unsupported claims
4. Output Markdown only

## What NOT to Do
- Don't create angles without evidence backing
- Don't use vague hooks
- Don't skip risk_level

## Required Markdown Sections per Angle
- Angle Title
- One-Line Hook
- Best Statistic
- Why It Is Newsworthy
- Primary Beat
- Secondary Beat
- Target Publication Type
- National Version
- Local Version
- Data Strength Score (1-10)
- Originality Score (1-10)
- Outreach Potential Score (1-10)
- Risk Level (low/medium/high)
- Recommended Pitch Framing

## Quality Bar
- Minimum 20 angles
- All angles must reference verified statistics
- Risk levels must be justified

## Model Routing Note
Primary: hy3_preview
Fallback 1: hermes_3_405b
Fallback 2: minimax_m25

## Validation Reminder
Before continuing to S6, validate that:
1. All angles reference verified statistics
2. Risk levels are justified
3. All required sections are present