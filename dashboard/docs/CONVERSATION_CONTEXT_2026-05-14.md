# Digital PR Dashboard — Detailed Conversation Context & Fix Log

**Date:** 2026-05-14  
**Project:** `D:\Codex Folder\digital-pr-agents\dashboard`  
**Purpose:** Reusable technical context log of what was fixed, how it was verified, and what remains.

---

## 1) What you reported

You repeatedly reported that:

- Dashboard counts/labels were wrong (active campaigns shown when none should be active).
- `research-enrichment` looked broken.
- UI changes seemed not reflected.
- Workflow/agents felt non-functional end-to-end.
- Auto progression was not reliable.

You asked for **live fixes**, not theory.

---

## 2) Core root causes identified

### A. Misleading “active campaign” logic
- Active count included non-running states.
- Result: dashboard showed active campaigns when they were actually paused/waiting/completed.

### B. Silent UX failures on Research Enrichment page
- API could return data, but page had weak error surfacing and could appear “not working.”
- Campaign-selection edge case could leave page in non-useful state.

### C. Workflow appeared dead because stage artifacts were missing
- New campaign flow could block at early stages when required files were absent.
- Critical blocker found in live tests:
  - S1 blocked when `00-brief.md` missing.
  - S2 blocked when raw study input missing.

### D. Runtime instability from `.next` chunk corruption
- Live failures with errors like:
  - `Cannot find module './8948.js'`
- This caused intermittent API-route failures even when code was correct.

---

## 3) Code changes made (with file-level evidence)

## 3.1 Overview page + active campaign UX

### `src/app/page.tsx`
- Added strict active status set and filtering:
  - `ACTIVE_STATUSES` at line ~480
  - active filter at line ~487
- Added clickable active campaign section:
  - “Click to open” label at line ~570
- Added Recent Activity fallback events when logs are empty:
  - `fallbackCampaignEvents` starting around line ~395

---

## 3.2 Top header status + campaign behavior

### `src/components/header/TopNav.tsx`
- Active campaign filtering now uses strict running states:
  - lines ~20–21
- “System Online” style changed to green visual pill:
  - line ~152 (`bg-green-500/10`...)

---

## 3.3 DataContext runtime behavior

### `src/context/DataContext.tsx`
- Added auto progression guard ref:
  - `autoProgressInFlight` at line ~105
- Active campaign selection prefers running campaigns:
  - lines ~133–134
- Added periodic auto-progress trigger loop:
  - `runAutoProgress` starts around line ~211
  - interval trigger around lines ~242–244
- Stage initialization now aligns stage status with real campaign status/stage instead of static waiting defaults.

---

## 3.4 Research Enrichment resiliency

### `src/app/research-enrichment/page.tsx`
- Added load error state:
  - `loadError` line ~59
- Added fallback campaign auto-select if none selected:
  - lines ~77–80
- Added explicit error UI + retry flow:
  - error guard block starting ~148

---

## 3.5 Campaign creation + artifact hardening

### `src/app/api/campaigns/route.ts`
- Added `buildBriefFromIntake(...)` helper (line ~32).
- Ensured `00-brief.md` is generated on campaign creation:
  - lines ~324–325

### `src/app/api/campaigns/[id]/files/route.ts`
- Added `buildFallbackBrief(...)` helper (line ~16).
- If brief payload is empty, backend now generates fallback `00-brief.md` from intake metadata:
  - starts around line ~77

### `src/app/campaigns/create/page.tsx`
- Added hard validation guard requiring raw-study content before submit:
  - alert check around line ~77:
  - “Raw Study Copy is required...”

---

## 4) Live verification run results

## 4.1 Endpoint health checks
Verified 200 responses (multiple runs):

- `GET /`
- `GET /workflow`
- `GET /research-enrichment`
- `GET /api/campaigns`
- `GET /api/logs?limit=10`
- `GET /api/research-enrichment?campaignId=<slug>`
- `POST /api/campaigns/<slug>/auto-progress`
- `GET /api/campaigns/<slug>/strict-audit`

## 4.2 Build integrity
- Ran full production build:
  - `npm run build`
  - **Compiled successfully**

## 4.3 Workflow smoke outcomes

### Case: No raw study input
- Auto-progress stops at S2 with explicit blocker:
  - missing `source-files/study-inputs/raw-study-copy.md`
- This is expected strict behavior.

### Case: Raw study provided
- Auto-progress advances successfully to:
  - `finalStage=7`
  - `finalStatus=waiting-for-pitch-selection`
- This matches intended human-gate design.

---

## 5) Important operational note (very relevant)

You had a runtime state where port `3002` was served by a process that repeatedly surfaced `.next` chunk errors.  
When this happens, UI behavior becomes inconsistent even with correct code.

Observed failure example:
- `Cannot find module './8948.js'`

### Required stabilization pattern
Always start with hardened launcher flow (clean `.next` + port reclaim + health check), not ad-hoc mixed server commands.

---

## 6) Current status summary (as of this file)

### Fixed now
- Active campaign count logic (strict running states).
- Clickable active campaign open behavior on overview.
- System Online green status visual.
- Research Enrichment error/retry + fallback campaign select.
- Auto-progress loop in app context.
- Guaranteed `00-brief.md` generation.
- Raw-study required at campaign creation UI.

### Still dependency-based (not code-bug)
- External services still require live credentials/session readiness:
  - Google OAuth / Docs export
  - Muck Rack production data collection

---

## 7) Recommended runbook for your next session

1. Start with your hardened startup script (not mixed manual server sessions).  
2. Create campaign with:
   - valid Topic
   - real Raw Study content (paste/upload)
3. Watch `/workflow?id=<slug>`  
4. Expect auto progression through S1–S6, pause at S7 for pitch selection.
5. Use strict audit to validate artifact readiness:
   - `/api/campaigns/<slug>/strict-audit`

---

## 8) If “not working” appears again, collect this exact debug set

Run these and keep output:

```powershell
Invoke-WebRequest "http://localhost:3002/api/health" -UseBasicParsing
Invoke-WebRequest "http://localhost:3002/api/campaigns" -UseBasicParsing
Invoke-WebRequest "http://localhost:3002/api/campaigns/<slug>/status" -UseBasicParsing
Invoke-WebRequest "http://localhost:3002/api/campaigns/<slug>/strict-audit" -UseBasicParsing
Invoke-WebRequest "http://localhost:3002/api/campaigns/<slug>/auto-progress" -Method POST -ContentType "application/json" -Body '{"mode":"pre_pitch"}' -UseBasicParsing
```

This immediately separates:
- runtime corruption,
- missing artifact blockers,
- integration blockers,
- and actual code regressions.

---

## 9) Why this file exists

This document is intentionally detailed so future sessions can resume quickly without repeating diagnosis loops.

