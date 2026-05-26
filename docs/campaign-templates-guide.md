# Campaign Templates Guide

## Overview

Campaign Templates help the Digital PR workflow start smarter by providing reusable guidance based on campaign type. They support "Extract deeply" and "Verify strictly" by giving the system source priorities, beat maps, risk warnings, and pitch structures.

## Core Principles

- **Templates guide research, they don't create facts**
- **Templates never bypass S4A verification or S13 validation**
- **Templates never replace human approval (S7)**
- **Templates are editable and versioned**
- **All template applications are logged**

## What Templates Are

Templates provide:
- Source priorities (Tier A/B/C/D)
- Journalist beat mappings
- Risk warnings specific to campaign type
- Common data points and comparisons
- Validation rules
- Pitch structure guidance

## What Templates Are NOT

- **Not facts** - Templates provide guidance, not verified data
- **Not auto-approval** - S4A and S13 still validate all claims
- **Not bypasses** - S7 human approval is never skipped
- **Not overrides** - Templates don't override claim-ledger.json

## Template Registry

Located at: `/templates/campaigns/template-registry.json`

Contains all available templates with match keywords, risk levels, and file references.

## Available Templates

| Template ID | Name | Risk Level | Best For |
|-------------|------|------------|----------|
| traffic_safety | Traffic Safety Campaign | High | Crashes, fatalities, pedestrian/cyclist safety |
| personal_injury | Personal Injury Campaign | High | Injuries, liability, legal cases |
| workplace_study | Workplace Study Campaign | Medium-High | Pay gap, harassment, workplace trends |
| state_ranking | State Ranking Campaign | Medium | State comparisons, best/worst lists |
| consumer_cost | Consumer Cost Campaign | Medium | Prices, inflation, family budgets |
| health_awareness | Health Awareness Campaign | High | Public health, disease awareness |
| local_safety | Local Safety Campaign | Medium | Neighborhood safety, local crime |
| legal_policy | Legal/Policy Campaign | Medium-High | Legislation, regulations, court rulings |
| generic | Generic Campaign | Medium | Default when no match |

## Template Matching

The system matches topics to templates using:
- Topic keywords
- User-selected campaign type
- Match keywords defined in registry

**Example:**
- Topic: "Bike Month alcohol involvement in fatal pedalcyclist crashes"
- Matches: traffic_safety (high confidence), personal_injury (secondary)

**Confidence Levels:**
- **High** (5+ matches): Auto-select recommended
- **Medium** (2-4 matches): Auto-select with human review suggestion
- **Low** (0-1 matches): Human selection required, generic fallback available

## Template Selection

Save to: `campaigns/{slug}/template-selection.json`

```json
{
  "campaignSlug": "bike-month-alcohol",
  "selectedTemplateId": "traffic_safety",
  "selectionMethod": "auto",
  "confidence": "high",
  "selectedAt": "2026-05-09T...",
  "selectedBy": "system"
}
```

## Template Application

Save to: `campaigns/{slug}/template-application-log.json`

Logs which stages received template guidance:
- S1: topic expansion guidance
- S2: extraction focus (common data points)
- S3: research strategy (source priorities)
- S4A: verification guidance (risk warnings)
- S5: angle guidance
- S6: beat matching
- S10: pitch structure
- S13: validation rules

## How Templates Influence Stages

| Stage | Template Inject |
|-------|-----------------|
| S1 | related terms, possible metrics, geography levels, risk warnings |
| S2 | common data points, breakdowns, metric names |
| S3 | source priorities, comparisons, localization strategy |
| S4A | risk warnings, unsafe claims, validation rules |
| S5 | strong/weak angle types, avoid frames |
| S6 | primary/secondary/avoid beats |
| S10 | pitch structure, CTA style |
| S13 | risk warnings, validation rules |

## Source Priorities

Templates define Tier A/B/C/D sources:

- **Tier A**: Federal government, peer-reviewed research
- **Tier B**: Academic institutions, major research orgs
- **Tier C**: Industry associations, nonprofits
- **Tier D**: News sources (use for context only)
- **Avoid**: Unsourced blogs, advocacy without data

## Risk Warnings

Each template has:
- Risk level (low/medium/high/critical)
- Specific risk warnings for the campaign type
- Unsafe claims to avoid
- Safe language examples

## API Endpoints

### GET /api/campaigns/{slug}/template
Get template selection and available templates.

### POST /api/campaigns/{slug}/template
Select a template:
```json
{
  "templateId": "traffic_safety",
  "topic": "Bike Month alcohol crashes",
  "keywords": ["pedestrian", "fatal", "alcohol"],
  "selectionMethod": "human"
}
```

### GET /api/campaigns/{slug}/template?action=match
Get template match suggestions:
```
/api/campaigns/test-campaign/template?action=match&topic=fatal%20crashes&keywords=pedestrian,DUI
```

### GET /api/campaigns/{slug}/template?action=guidance&stageId=S1
Get guidance for specific stage.

### POST /api/campaigns/{slug}/template?action=apply
Apply template to stages:
```json
{
  "stages": ["S1", "S2", "S3"]
}
```

## Template Change Rules

If template changes after workflow starts:
- Before S2: recommend S1 rerun
- After S3: mark S1-S3 needs_review
- After S7: mark S7 approval potentially stale
- After S10: mark pitch outputs needs_review, require S13

## Creating New Templates

1. Create JSON file in `/templates/campaigns/`
2. Follow base template structure
3. Add match keywords
4. Define source priorities
5. Add risk warnings and safe language examples
6. Register in `template-registry.json`

## Validation

Templates are validated for:
- Required fields (templateId, version, status)
- Source priorities exist
- Risk warnings exist
- Journalist beats defined
- Unsafe claims listed
- Safe language examples provided
- Validation rules defined

## Dashboard Integration

Show:
- Selected template name and version
- Confidence level
- Match reasons
- Risk level
- Recommended source types
- Risk warnings
- Applied stages

Actions:
- Select Template
- Change Template
- View Template Details
- Use Generic Template

## Testing

1. Registry loads correctly
2. Topic matches appropriate template
3. Generic fallback works
4. Invalid templates rejected
5. Selection and application logs created
6. Template guidance reaches correct stages

## Safety Rules

1. Never claim template data as verified fact
2. Always run S4A verification
3. Always run S13 validation
4. Never skip S7 human approval
5. Log all template applications
6. Mark stages stale on template change