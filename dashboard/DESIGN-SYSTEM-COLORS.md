# Digital PR Orchestrator - Design System Color Palette

## Overview

This color system is designed for a professional Digital PR campaign management dashboard. It follows enterprise-grade design principles with WCAG AA accessibility compliance, semantic status indicators, and a clean aesthetic suitable for long workflow monitoring.

---

## 1. Core UI Palette

### Primary Colors

| Color Name | HEX Code | Usage | Accessibility |
|------------|----------|-------|----------------|
| Primary | `#2563EB` | Main actions, links, active states | AA on white, requires white text |
| Primary Hover | `#1D4ED8` | Button hover, interactive states | AA on white |
| Primary Soft | `#EFF6FF` | Backgrounds, subtle highlights | Dark text on soft blue |

### Navigation Colors

| Color Name | HEX Code | Usage | Accessibility |
|------------|----------|-------|----------------|
| Nav Background | `#111827` | Sidebar, main navigation | White/light text |
| Nav Hover | `#1F2937` | Navigation item hover states | White/light text |

### Light Mode Backgrounds

| Color Name | HEX Code | Usage | Accessibility |
|------------|----------|-------|----------------|
| Page Background | `#F8FAFC` | Main content area | Dark text |
| Card Background | `#FFFFFF` | Cards, panels, modals | Dark text |
| Section Background | `#F1F5F9` | Grouped content, dividers | Dark text |

### Text Colors

| Color Name | HEX Code | Usage | Accessibility |
|------------|----------|-------|----------------|
| Main Text | `#0F172A` | Primary content, headings | AAA on light |
| Secondary Text | `#475569` | Supporting content | AA on light |
| Muted Text | `#64748B` | Timestamps, hints | AA on light (larger) |

### Border Colors

| Color Name | HEX Code | Usage | Accessibility |
|------------|----------|-------|----------------|
| Border | `#E2E8F0` | Dividers, card borders | Subtle separator |

---

## 2. Status Palette

| Status | Color Name | HEX | Soft Background | Usage | Notes |
|--------|------------|-----|-----------------|-------|-------|
| Success | Success | `#16A34A` | `#DCFCE7` | Completed stages, passed validation | Do not use green alone |
| Warning | Warning | `#F59E0B` | `#FEF3C7` | Pending actions, attention needed | Do not use amber alone |
| Error | Error | `#DC2626` | `#FEE2E2` | Failed stages, validation errors | Do not use red alone |
| Info | Info | `#2563EB` | `#DBEAFE` | In-progress, neutral information | Blue as semantic |
| Manual Action | Manual | `#7C3AED` | `#EDE9FE` | Angle Selection pause, approval gates | Purple for pause states |
| Waiting | Waiting | `#64748B` | `#F1F5F9` | Pending, queued stages | Neutral/gray |

**Key Principle:** Every status must include text label AND icon, not color alone.

---

## 3. Workflow Stage Accent Colors

Each workflow stage has a dedicated accent color for visual distinction in progress indicators, badges, and timelines.

| Stage | Color Name | HEX | CSS Variable | Usage |
|-------|------------|-----|--------------|-------|
| Campaign Intake | Indigo | `#4F46E5` | `--stage-intake` | Stage 1 - Brief intake |
| Study Extraction | Blue | `#2563EB` | `--stage-extraction` | Stage 2-3 - Study notes & insights |
| Research Enrichment | Cyan | `#0891B2` | `--stage-research` | Stage 3 - Research context |
| Angle Generation | Violet | `#7C3AED` | `--stage-angles` | Stage 4 - 40 angles with GPT-5.5 |
| Beat Matching + Outreach Gate | Purple | `#9333EA` | `--stage-beats` | Stage 5 - **PIVOTAL: Manual selection gate** |
| Journalist Collection | Teal | `#0D9488` | `--stage-collection` | Stage 6 - Muck Rack/SERP collection |
| Journalist Intelligence | Emerald | `#059669` | `--stage-intelligence` | Stage 7 - Target intel synthesis |
| Pitch Drafting | Rose | `#E11D48` | `--stage-draft` | Stage 8 - 6 variant drafts |
| Email Optimization | Orange | `#EA580C` | `--stage-optimize` | Stage 9 - Final email polish |
| Final Packaging | Amber | `#D97706` | `--stage-package` | Stage 10 - Google Doc prep |
| Google Doc Export | Green | `#16A34A` | `--stage-export` | Stage 11 - Final export |
| Technical Validation | Slate | `#475569` | `--stage-validation` | Quality gates, JSON/Python checks |
| Browser/Search Validation | Sky | `#0284C7` | `--stage-browser` | Chrome debug, SERP verification |
| Production Readiness | Zinc | `#52525B` | `--stage-readiness` | Final approval state |

**Critical Note:** The Beat Matching stage (Stage 5 - Outreach Gate) uses purple to visually signal the manual approval pause. This is the workflow's most important gate.

---

## 4. Chart / Data Visualization Palette

Chart colors are separate from UI status colors to prevent confusion.

### Categorical Palette (Max 6 colors)

| Index | Color Name | HEX | Best For |
|-------|------------|-----|----------|
| 1 | Chart Blue | `#3B82F6` | Primary data series |
| 2 | Chart Emerald | `#10B981` | Secondary data |
| 3 | Chart Amber | `#F59E0B` | Tertiary data |
| 4 | Chart Rose | `#F43F5E` | Highlight values |
| 5 | Chart Violet | `#8B5CF6` | Comparison data |
| 6 | Chart Teal | `#14B8A6` | Additional series |

### Sequential Blue Scale

| Level | HEX | Usage |
|-------|-----|-------|
| Lightest | `#DBEAFE` | Background fill |
| Light | `#93C5FD` | Subtle gradients |
| Medium | `#3B82F6` | Standard data |
| Dark | `#1D4ED8` | Emphasized data |
| Darkest | `#1E3A8A` | High contrast |

### Diverging Palette (Positive/Negative)

| Direction | HEX | Usage |
|-----------|-----|-------|
| Positive | `#22C55E` | Above target, success |
| Neutral | `#64748B` | At target |
| Negative | `#EF4444` | Below target, failure |

---

## 5. Dark Mode Palette

### Backgrounds

| Color Name | HEX | Usage |
|------------|-----|-------|
| App Background | `#111827` | Full page background |
| Sidebar Background | `#0F172A` | Navigation sidebar |
| Card Background | `#1E293B` | Cards, panels |
| Section Background | `#273449` | Grouped content |
| Elevated Surface | `#334155` | Modals, dropdowns |

### Text

| Color Name | HEX | Usage |
|------------|-----|-------|
| Main Text | `#E5E7EB` | Primary content |
| Secondary Text | `#CBD5E1` | Supporting content |
| Muted Text | `#94A3B8` | Timestamps, hints |

### Accents (Dark Mode)

| Status | HEX | Notes |
|--------|-----|-------|
| Primary | `#60A5FA` | Brighter for dark backgrounds |
| Primary Hover | `#3B82F6` | Slightly darker |
| Success | `#22C55E` | Adjusted for dark |
| Warning | `#FBBF24` | Adjusted for dark |
| Error | `#F87171` | Adjusted for dark |
| Manual Action | `#A78BFA` | Adjusted for dark |

---

## 6. Complete CSS Variables

### Light Mode (:root)

```css
:root {
  /* Primary */
  --color-primary: #2563EB;
  --color-primary-hover: #1D4ED8;
  --color-primary-soft: #EFF6FF;

  /* Navigation */
  --color-nav-bg: #111827;
  --color-nav-hover: #1F2937;

  /* Backgrounds */
  --color-bg: #F8FAFC;
  --color-card: #FFFFFF;
  --color-section: #F1F5F9;

  /* Text */
  --color-text: #0F172A;
  --color-text-secondary: #475569;
  --color-text-muted: #64748B;

  /* Borders */
  --color-border: #E2E8F0;

  /* Status - Success */
  --color-success: #16A34A;
  --color-success-soft: #DCFCE7;

  /* Status - Warning */
  --color-warning: #F59E0B;
  --color-warning-soft: #FEF3C7;

  /* Status - Error */
  --color-error: #DC2626;
  --color-error-soft: #FEE2E2;

  /* Status - Info */
  --color-info: #2563EB;
  --color-info-soft: #DBEAFE;

  /* Status - Manual Action */
  --color-manual: #7C3AED;
  --color-manual-soft: #EDE9FE;

  /* Status - Waiting/Neutral */
  --color-waiting: #64748B;
  --color-waiting-soft: #F1F5F9;

  /* Workflow Stage Accents */
  --stage-intake: #4F46E5;
  --stage-extraction: #2563EB;
  --stage-research: #0891B2;
  --stage-angles: #7C3AED;
  --stage-beats: #9333EA;
  --stage-collection: #0D9488;
  --stage-intelligence: #059669;
  --stage-draft: #E11D48;
  --stage-optimize: #EA580C;
  --stage-package: #D97706;
  --stage-export: #16A34A;
  --stage-validation: #475569;
  --stage-browser: #0284C7;
  --stage-readiness: #52525B;

  /* Chart Colors */
  --chart-1: #3B82F6;
  --chart-2: #10B981;
  --chart-3: #F59E0B;
  --chart-4: #F43F5E;
  --chart-5: #8B5CF6;
  --chart-6: #14B8A6;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
```

### Dark Mode (.dark)

```css
.dark {
  /* Primary */
  --color-primary: #60A5FA;
  --color-primary-hover: #3B82F6;
  --color-primary-soft: #1E3A8A;

  /* Navigation */
  --color-nav-bg: #0F172A;
  --color-nav-hover: #1E293B;

  /* Backgrounds */
  --color-bg: #111827;
  --color-card: #1E293B;
  --color-section: #273449;

  /* Text */
  --color-text: #E5E7EB;
  --color-text-secondary: #CBD5E1;
  --color-text-muted: #94A3B8;

  /* Borders */
  --color-border: #334155;

  /* Status - Success */
  --color-success: #22C55E;
  --color-success-soft: #14532D;

  /* Status - Warning */
  --color-warning: #FBBF24;
  --color-warning-soft: #78350F;

  /* Status - Error */
  --color-error: #F87171;
  --color-error-soft: #7F1D1D;

  /* Status - Info */
  --color-info: #60A5FA;
  --color-info-soft: #1E3A8A;

  /* Status - Manual Action */
  --color-manual: #A78BFA;
  --color-manual-soft: #4C1D95;

  /* Status - Waiting/Neutral */
  --color-waiting: #94A3B8;
  --color-waiting-soft: #273449;

  /* Chart Colors (Brighter for dark backgrounds) */
  --chart-1: #60A5FA;
  --chart-2: #34D399;
  --chart-3: #FBBF24;
  --chart-4: #FB7185;
  --chart-5: #A78BFA;
  --chart-6: #2DD4BF;
}
```

---

## 7. Usage Rules & Application Guidelines

### Badges

```tsx
// Status Badge Structure
<Badge>
  <Icon status={status} />
  <Text>{statusLabel}</Text>
</Badge>

// Example: Completed Badge
<span class="bg-success-soft text-success border border-success/30 rounded-full px-3 py-1 flex items-center gap-2">
  <CheckCircleIcon class="w-4 h-4" />
  <span class="text-sm font-medium">Completed</span>
</span>

// Example: Manual Action Required (ANGLE SELECTION GATE)
<span class="bg-manual-soft text-manual border border-manual/30 rounded-full px-3 py-1 flex items-center gap-2">
  <PlayIcon class="w-4 h-4" />
  <span class="text-sm font-medium">Manual Action Required</span>
</span>

// Example: In Progress
<span class="bg-info-soft text-info border border-info/30 rounded-full px-3 py-1 flex items-center gap-2">
  <LoaderIcon class="w-4 h-4 animate-spin" />
  <span class="text-sm font-medium">In Progress</span>
</span>
```

### Buttons

| Button Type | Background | Text | Border | Use For |
|------------|------------|------|--------|---------|
| Primary | `--color-primary` | White | None | Main actions |
| Primary Hover | `--color-primary-hover` | White | None | Button hover |
| Secondary | `--color-card` | `--color-text` | `--color-border` | Secondary actions |
| Ghost | Transparent | `--color-text-secondary` | None | Tertiary actions |
| Danger | `--color-error` | White | None | Destructive actions |

### Cards

```
Light Mode:
- Background: --color-card (#FFFFFF)
- Border: --color-border (#E2E8F0)
- Shadow: --shadow-md

Dark Mode:
- Background: --color-card (#1E293B)
- Border: --color-border (#334155)
- Shadow: --shadow-md (with dark tint)
```

### Progress Bars

```tsx
// Workflow Stage Progress
<div class="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
  <div 
    class="h-full bg-gradient-to-r from-stage-color-start to-stage-color-end rounded-full transition-all"
    style={{ width: `${progress}%` }}
  />
</div>

// Example: Angle Generation stage
className="bg-gradient-to-r from-violet-500 to-purple-600"
```

### Alerts

```
Success Alert:
- Background: --color-success-soft
- Border: --color-success
- Icon: CheckCircle (success color)
- Text: --color-success

Warning Alert:
- Background: --color-warning-soft
- Border: --color-warning
- Icon: AlertTriangle (warning color)
- Text: --color-warning (dark mode) / #92400E (light mode)

Error Alert:
- Background: --color-error-soft
- Border: --color-error
- Icon: XCircle (error color)
- Text: --color-error

Manual Action Alert (SPECIAL):
- Background: --color-manual-soft
- Border: --color-manual
- Icon: Play or Pause (manual color)
- Text: --color-manual
- This is unique to the Angle Selection gate
```

### Sidebar

```
Light Mode:
- Background: --color-nav-bg (#111827)
- Text: White / light gray
- Active Item: --color-primary-soft with --color-primary text
- Hover: --color-nav-hover

Dark Mode:
- Background: --color-nav-bg (#0F172A)
- (Same pattern)
```

### Charts

```
Rules:
1. Never use chart colors for status indicators
2. Maximum 6 categorical colors
3. Use sequential scale for gradient data
4. Use diverging palette for comparison data
5. Always include legend
6. Use patterns + colors for accessibility (not color alone)

Good: Pie chart with legend showing "Completed (Green: 45%)"
Bad: Pie chart with only green segments, no labels
```

---

## 8. Accessibility Guidelines

### WCAG AA Compliance

| Element | Minimum Contrast | Recommendation |
|---------|------------------|----------------|
| Main Text | 4.5:1 | 7:1 preferred |
| Large Text (18px+) | 3:1 | 4.5:1 preferred |
| UI Components | 3:1 | 4.5:1 preferred |
| Border/Divider | 3:1 | Use as secondary cue |

### Color-Blind Considerations

```
DO:
- Add text labels to all status indicators
- Add icons to all status badges
- Use patterns in charts (stripes, dots)
- Test with color blindness simulators

DON'T:
- Rely on red/green alone for success/failure
- Use only color to differentiate data
- Create charts with similar-hue colors adjacent
```

### Focus States

```css
/* Keyboard focus indicator */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* All interactive elements need visible focus */
button:focus-visible,
a:focus-visible,
input:focus-visible {
  /* same as above */
}
```

---

## 9. Quick Reference Table

| Element | Light Mode | Dark Mode | Variable |
|---------|------------|------------|-----------|
| Primary Action | `#2563EB` | `#60A5FA` | `--color-primary` |
| Sidebar | `#111827` | `#0F172A` | `--color-nav-bg` |
| Page Background | `#F8FAFC` | `#111827` | `--color-bg` |
| Card | `#FFFFFF` | `#1E293B` | `--color-card` |
| Main Text | `#0F172A` | `#E5E7EB` | `--color-text` |
| Success | `#16A34A` | `#22C55E` | `--color-success` |
| Warning | `#F59E0B` | `#FBBF24` | `--color-warning` |
| Error | `#DC2626` | `#F87171` | `--color-error` |
| Manual/Angle Gate | `#7C3AED` | `#A78BFA` | `--color-manual` |
| Border | `#E2E8F0` | `#334155` | `--color-border` |

---

## 10. Tailwind Configuration Example

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          soft: '#EFF6FF',
        },
        nav: {
          bg: '#111827',
          hover: '#1F2937',
        },
        success: {
          DEFAULT: '#16A34A',
          soft: '#DCFCE7',
        },
        warning: {
          DEFAULT: '#F59E0B',
          soft: '#FEF3C7',
        },
        error: {
          DEFAULT: '#DC2626',
          soft: '#FEE2E2',
        },
        manual: {
          DEFAULT: '#7C3AED',
          soft: '#EDE9FE',
        },
        waiting: {
          DEFAULT: '#64748B',
          soft: '#F1F5F9',
        },
        stage: {
          intake: '#4F46E5',
          extraction: '#2563EB',
          research: '#0891B2',
          angles: '#7C3AED',
          beats: '#9333EA',
          collection: '#0D9488',
          intelligence: '#059669',
          draft: '#E11D48',
          optimize: '#EA580C',
          package: '#D97706',
          export: '#16A34A',
          validation: '#475569',
          browser: '#0284C7',
          readiness: '#52525B',
        },
      },
    },
  },
}
```

---

## Design System Summary

This color system ensures:

1. **Trust & Professionalism** - Blue primary with navy navigation
2. **Clear Status Communication** - Every status has text + icon + color
3. **Visual Hierarchy** - Workflow stages have distinct accent colors
4. **Accessibility** - WCAG AA compliant, color-blind friendly
5. **Dark Mode Ready** - Complete dark palette with proper contrast
6. **Enterprise-Grade** - Clean, technical, not playful
7. **Workflow Focus** - Purple highlights the critical Angle Selection gate

The dashboard will feel like a serious control center for Digital PR campaign management.