---
name: muck-rack-bulk-collector
description: Use when you need to collect large Muck Rack journalist sets by beat, especially when the target is hundreds of journalists per beat, Boolean search is required, Chrome login must be reused, and the output needs CSV, JSON, Markdown, and resumable run artifacts for Digital PR workflows.
---

# Muck Rack Bulk Collector

## Goal
Collect high-volume journalist lists from Muck Rack by beat, using Boolean search and dedupe, then leave behind stable artifacts that later stages can trust.

## Use This Skill For
- Collecting at least `800` journalists per selected beat, or documenting a blocker and written user exception when Muck Rack exposes fewer than the target after all expansion passes.
- Running one or more Boolean search passes per beat to widen recall without fully losing editorial relevance.
- Reusing a logged-in Chrome session instead of trying to brute-force headless access.
- Building importable artifacts for `06-journalist-intel.md` and later targeting work.

## Required Inputs
- A pitch job folder under `pitch-jobs/<slug>/`
- A completed `05-beats.md`
- A confirmed selected outreach angle inside `05-beats.md`
- `Selection status: confirmed` inside `05-beats.md`
- A beat-query JSON file inside `source-files/journalist-intel/`
- A working Muck Rack login in debug Chrome

## Core Files (Updated 2026-05-06)
- **Browser Tools Module:** `D:\Codex Folder\digital-pr-agents\browser-tools\`
  - CDP Client: `browser-tools/core/cdp-client.js`
  - Chrome Launcher: `browser-tools/core/chrome-launcher.js`
  - Tab Manager: `browser-tools/core/tab-manager.js`
  - Health Checker: `browser-tools/core/health-check.js`
  - Muck Rack Collector: `browser-tools/collectors/muckrack-collector.js`
- Chrome debug port: **9222** (verified working)
- Job output root: `pitch-jobs/<slug>/source-files/journalist-intel/bulk-beat-collection/`

## Standard Workflow
1. Read `05-beats.md` and confirm the selected outreach angle is recorded.
2. Confirm the selected beat, geography, outlet scale, and collection lane.
3. Convert only the selected angle's search intent into Boolean queries.
4. Prefer a multi-query beat file over a single-query beat file because the target is at least `800` journalists per selected beat.
5. Save the beat file under `source-files/journalist-intel/` with a clear selected-angle name such as `selected-angle-bulk-queries.json`.
6. Launch debug Chrome with `node browser-tools/core/chrome-launcher.js` or `.\scripts\launch-debug-chrome.cmd`.
7. Confirm Muck Rack is logged in inside that debug Chrome profile before collecting.
8. Run `.\scripts\collect-beat-journalists.cmd --limit 800 --beats-file <path> --output-dir <path>`.
9. If the selected beat falls short, widen with additional Boolean query passes for the same beat and rerun only that beat.
10. After any resumed or partial rerun, rebuild the combined folder-level manifests from the beat JSON files before treating the run as final.
11. Use the rebuilt combined summary as the source of truth when updating `06-journalist-intel.md`.

Do not build query files for every Stage 05 angle unless the user explicitly requests full multi-angle bulk collection.

## Query Design Rules
- Start narrow enough to reflect the beat.
- Add recall with `OR` families before dropping the core topic entirely.
- Keep metro beats local by city, county, region, outlet, or agency terms.
- Keep safety and transportation beats tied to traffic, crash, roadway, transportation, safety, fatalities, or agency terms.
- Exclude obvious irrelevant sports or hobby terms when needed.
- When one Boolean string cannot reach `800`, use multiple related queries and dedupe within the beat.

## Quality Gates
- Do not begin if `05-beats.md` is still awaiting user angle selection.
- Do not begin if `Selection status` is anything except exact `confirmed`.
- Do not collect every beat from Stage 05 unless the user explicitly overrides the selected-angle workflow.
- Do not mark collection complete below `800` journalists per selected beat unless the user grants an explicit written exception.
- Do not claim a beat is complete if Muck Rack was not logged in.
- Do not trust a folder-level `summary.json` or `summary.md` after a partial rerun unless it was explicitly rebuilt from all beat JSON files.
- Treat `summary-all.json` and `summary-all.md` as the final run summary after rebuild.
- Record shortfalls honestly when Muck Rack does not expose enough relevant people.
- Keep a distinction between:
  - raw beat rows
  - deduped profile URLs
  - shortlisted outreach targets
- Do not present a broad fallback query as if it were equivalent in precision to the original niche beat.
- Do not pass bulk results to pitch writing until a selected-angle shortlist has been extracted.

## Resume Rules
- Inspect the output folder before restarting a run.
- If beat JSON files already exist for earlier beats, resume from the next unfinished beat.
- If a checkpoint file exists, assume the beat was interrupted mid-run.
- After rerunning a single beat, rebuild:
  - `all-beat-journalists.csv`
  - `all-beat-journalists-deduped.csv`
  - `summary-all.json`
  - `summary-all.md`

## Artifact Standard
- Per-beat JSON and Markdown files
- Combined CSV with all beat rows
- Deduped CSV with one row per profile URL
- Combined final summary in JSON and Markdown
- A beat-query JSON file that documents the Boolean strategy used
- A note connecting the collection to the selected outreach angle from `05-beats.md`

## Failure Handling
- If Muck Rack shows browser verification, stop and wait for the user to clear it in Chrome.
- If debug Chrome is not reachable on port `9222`, relaunch it before collecting.
- If a query is too narrow to reach `800`, add additional Boolean passes rather than pretending the shortfall is resolved.
- If the user selected only one angle, rerun only that selected beat instead of broadening into unrelated beats.
- If a run is interrupted, do not trust overwritten folder-level summaries until they are rebuilt from the beat JSON files.
- If the date window in the collector is stale, inspect it before running and update the logic or note the limitation in the audit trail.

## Output Standard
- Leave behind a run folder that another stage can inspect without guessing what happened.
- Make it obvious which beat file, query file, and final summary belong together.
- Keep the final stage note honest about whether the result is:
  - `target-met`
  - a real shortfall
  - a broader fallback collection

## Operational Contract

- Name: muck-rack-bulk-collector.
- Purpose: guide high-volume selected-beat Muck Rack and SERP collection with Boolean search discipline.
- Required input: selected angle, selected beat, geography, target count, and approved query plan.
- Optional input: synonyms, outlet lanes, local newspaper list, competitor outlets, prior collection checkpoints, and public-source fallback targets.
- Execution process: validate Chrome/debug access, validate Muck Rack login when available, run multiple Boolean query passes, checkpoint results, dedupe profile URLs, record access limits, and avoid hallucinating unavailable results.
- Output: bulk collection JSON/CSV/Markdown summaries and collection status.
- Output format: query set, per-query result counts, per-beat totals, deduped totals, target-met status, shortfall reason, fallback actions, and manual action notes.
- Trigger condition: selected-angle collection requires high-volume journalist discovery.
- Stop condition: target count is met or access/search limitation is documented.
- Failure condition: unverified Muck Rack access, one narrow query, no checkpoint, duplicate-heavy output, wrong beat, or fabricated profile data.
- Validation rule: browser/Muck Rack access, query breadth, count target, dedupe, and source traceability must be recorded.
- Repair action: broaden queries, run additional passes, rebuild combined outputs, or mark `MANUAL ACTION REQUIRED`.
- Handoff rule: send verified collection outputs to `journalist-targeting-subagent`.
## Anti-Hallucination And Assumption Control
Never invent journalist names, journalist emails, article titles, publication history, source names, statistics, rankings, survey results, methodology details, quotes, SERP findings, or Muck Rack results.

If required information is missing, unverifiable, blocked by access, or not present in the validated inputs, write exactly:

`Information unavailable. Verification required before use.`

Use beat-level assumptions only when they are clearly labeled as assumptions and never present them as journalist-specific facts. Do not convert search intent, SERP possibility, or Muck Rack workflow instructions into claimed results unless the result was actually captured and validated.
