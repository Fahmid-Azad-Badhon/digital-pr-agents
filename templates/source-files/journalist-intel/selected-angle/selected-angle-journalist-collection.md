# Selected-Angle Journalist Collection

## Purpose
This file is the operational playbook for the journalist collection bridge between `05-beats.md` and `06-journalist-intel.md`.

Use this file only after the Stage 05 outreach-angle review gate is complete and the user has confirmed at least one angle. The job of this bridge is to collect journalists, outlets, Muck Rack profiles, SERP evidence, recent coverage, contact-status notes, and collection logs for the active selected angle package only.

This bridge exists to prevent wasted work. The workflow must not search Muck Rack for every angle or every beat at once unless the user explicitly overrides the selected-angle workflow. The default behavior is focused, selected-angle collection.

This file lives at:

```text
pitch-jobs/<slug>/source-files/journalist-intel/selected-angle/selected-angle-journalist-collection.md
```

## Critical Control Summary
This section is the short version an agent must understand before doing anything else.

The selected-angle journalist collection stage has five controlling rules:

1. Search starts only after `05-beats.md` has exact `Selection status: confirmed`.
2. Search is limited to the active user-selected angle package and its selected beat or beat group.
3. Debug Chrome must be launched and verified before SERP or Muck Rack work.
4. Boolean search and advanced search must be used in both SERP and Muck Rack.
5. The collection target is at least `800` journalists per selected beat, non-negotiable unless the user grants a written exception.

If any controlling rule is not satisfied, the workflow is not ready for Stage 06.

Allowed final statuses:

- `ready-for-stage-06`: all critical controls pass.
- `blocked-awaiting-user-selection`: no confirmed selected angle.
- `blocked-browser`: Debug Chrome, Google, or Muck Rack is not usable.
- `blocked-query-plan`: Boolean or advanced-search query plan is missing.
- `blocked-volume`: fewer than `800` valid collected journalists per selected beat.
- `blocked-quality`: enough rows exist, but they are not relevant enough to count.
- `blocked-dedupe`: raw rows exist, but deduped evidence is too weak or not rebuilt.
- `blocked-contact-integrity`: contact data is guessed or unsupported.
- `ready-with-user-exception`: user explicitly approved proceeding below the standard.

Do not invent a softer status label. Use one of the labels above in the completion manifest and status reports.

## Source Of Truth Hierarchy
When files disagree, use this order of authority:

1. Current user instruction in this thread.
2. `05-beats.md` selected-angle gate fields.
3. This `selected-angle-journalist-collection.md` control file.
4. `selected-angle-summary.md`.
5. `selected-angle-queries.json`.
6. Current job-folder collection artifacts.
7. Current Muck Rack captures imported into the current job.
8. Current SERP, outlet, profile, and contact notes.
9. Older runbook or prompt-map language.
10. Prior campaign outputs.

If an older file says `20 to 50`, `shortlist`, `500`, or another lower target, this file overrides it. The required target remains `800` journalists per selected beat.

## Workflow Failure Modes This File Prevents
This file is designed to stop the most common failure modes.

Prevent these failures:

- Searching every angle instead of the selected angle.
- Searching Muck Rack before the user confirms at least one angle.
- Treating a small curated list as the full collection.
- Stopping at 500 journalists per beat.
- Counting duplicate profiles toward the target.
- Counting wrong-beat or wrong-geography journalists toward the target.
- Using stale captures from another campaign.
- Treating headless Muck Rack access as a valid session when it shows verification.
- Forgetting to verify Debug Chrome on port `9222`.
- Failing to rebuild combined CSV and `summary-all.*` after resume.
- Mixing raw rows, deduped profiles, and approved outreach candidates.
- Guessing emails or contact paths.
- Drafting Stage 08 email variants before Stage 06 and Stage 07 are ready.

If a future agent tries any of these, stop and return to the relevant checkpoint.

## Non-Negotiable Workflow Order
Follow this sequence exactly:

1. `04-angles.md` creates pitch angles.
2. `05-beats.md` maps angles to journalist beats.
3. `05-beats.md` presents the outreach-angle review gate.
4. User chooses one or more angles for outreach.
5. `05-beats.md` is updated with exact `Selection status: confirmed`.
6. This selected-angle journalist collection bridge is executed.
7. Debug Chrome is launched and verified.
8. SERP research is performed in Debug Chrome for the selected angle only.
9. Muck Rack search is performed in Debug Chrome for the selected angle only.
10. Boolean search and advanced search filters are used before deciding the candidate pool is too small.
11. Raw Muck Rack, SERP, outlet, profile, and contact notes are saved under `source-files/journalist-intel/`.
12. `06-journalist-intel.md` is drafted from the selected-angle collection inputs.
13. `07-journalist-coverage.md` is drafted from the same selected-angle collection inputs.
14. Six Stage 08 email variants are drafted only after Stage 06 and Stage 07 are ready.

Do not move Muck Rack, SERP, outlet, or contact research after `06-journalist-intel.md`. Stage 06 is the structured output created from this collection work.

## End-To-End Execution Playbook
Use this playbook when operating the file from start to finish.

### Phase 1: Confirm The Gate
1. Open the target job folder.
2. Read `05-beats.md`.
3. Confirm the user selected at least one angle and that one active selected angle package is clear.
4. Confirm exact `Selection status: confirmed`.
5. Copy selected angle fields into `selected-angle-summary.md`.
6. If anything is missing, stop before any SERP or Muck Rack search.

### Phase 2: Prepare The Browser
1. Open PowerShell.
2. Go to `D:\Codex Folder\muck-rack-automation`.
3. Launch Debug Chrome with `.\scripts\launch-debug-chrome.cmd`.
4. Verify `http://127.0.0.1:9222/json/version`.
5. Open Google in Debug Chrome.
6. Open Muck Rack in Debug Chrome.
7. Confirm Muck Rack login.
8. If browser verification appears, stop and clear it manually.

### Phase 3: Build The Query Plan
1. Extract topic terms from the selected angle.
2. Extract beat terms from the selected journalist beat.
3. Extract geography terms from selected geography.
4. Add city, county, metro, state, regional, and national expansions as appropriate.
5. Add outlet names discovered from SERP.
6. Add agency, official-source, industry, and association terms when relevant.
7. Add exclusion terms only after observing search noise.
8. Save the plan in `selected-angle-queries.json`.

### Phase 4: Run SERP Discovery
1. Run selected-angle SERP queries in Debug Chrome.
2. Identify outlets.
3. Identify journalists.
4. Identify author pages.
5. Identify recent coverage.
6. Identify contact paths.
7. Identify better Muck Rack query language.
8. Save everything in `serp-search-notes.md`.

### Phase 5: Run Muck Rack Collection
1. Search Muck Rack people results in Debug Chrome.
2. Use Boolean query pass 1.
3. Apply advanced filters.
4. Record visible people/result count.
5. Run Boolean query passes 2 through 7 as needed.
6. Use SERP-discovered outlet and geography terms.
7. Continue until at least `800` journalists are collected per selected beat.
8. Save raw exports, per-beat files, combined CSV, deduped CSV, and summaries.

### Phase 6: Validate Counts
1. Count raw collected rows.
2. Count valid collected rows after removing wrong-beat and wrong-geography rows.
3. Count deduped profile URLs.
4. Count deduped journalist plus outlet combinations when profile URL is missing.
5. Confirm the count is at least `800` per selected beat.
6. If below `800`, continue expansion or escalate for written user exception.

### Phase 7: Review And Score Candidates
1. Score candidates using the 100-point rubric.
2. Mark approved, backup, manual review, or reject.
3. Keep the full collected pool intact.
4. Prepare Stage 06-ready candidate notes from the strongest candidates.
5. Do not replace the `800` collection pool with a small review table.

### Phase 8: Prepare Stage 06 Handoff
1. Confirm all artifacts exist.
2. Confirm `800` gate status.
3. Confirm raw and deduped counts.
4. Confirm rejected sources are logged.
5. Confirm contact statuses are honest.
6. Create or update the final completion manifest.
7. Only then proceed to `06-journalist-intel.md`.

## Hard Gate Before Any Search
Before launching searches, confirm all required fields exist in `05-beats.md`.

Required fields:

- `Selection status: confirmed`
- `Selected priority number:`
- `Selected angle / pitch angle:`
- `Selected category:`
- `Selected journalist beat:`
- `Selected outlet scale:`
- `Selected geography:`
- `Selected collection lane:`
- `Evidence support to carry forward:`
- `Search start point:`
- `Selection note:`

If any field is missing, blank, contradictory, or still says `pending`, stop. Return to `05-beats.md` and complete the gate first.

## Absolute Scope Lock
Collect only for the confirmed selected angle.

Do not:

- Search every angle in `04-angles.md`.
- Search every angle listed in `05-beats.md`.
- Search every secondary backlog angle.
- Collect all beats at once unless the user explicitly asks for full multi-angle or multi-beat bulk collection.
- Pull names from old campaigns unless they are verified against the current selected angle.
- Import stale Muck Rack outputs from another job.
- Invent names, emails, beat labels, article URLs, or outlet relationships.
- Draft email pitches before the selected-angle journalist list is validated.
- Draft all six email variants before `06-journalist-intel.md` and `07-journalist-coverage.md` are ready.

Every collected candidate must connect to:

- the selected angle,
- the selected beat,
- the selected geography,
- the selected outlet scale,
- and the selected collection lane.

## Non-Negotiable 800 Journalist Minimum
The required collection target is at least `800` journalists per selected beat.

This is non-negotiable for the standard workflow.

Hard rules:

- Do not use a `20 to 50` journalist target.
- Do not treat a small curated list as the collection deliverable.
- Do not stop at `500` journalists per beat.
- Do not proceed to Stage 06 as complete with fewer than `800` collected journalists per selected beat.
- Do not count duplicate rows as unique journalists.
- Do not count unrelated journalists toward the `800` target.
- Do not count journalists from unselected angles toward the `800` target.
- Do not count stale, wrong-beat, wrong-geography, or unsupported profiles toward the `800` target.

The `800` target means:

- at least `800` collected journalist rows per selected beat, and
- a deduped profile set must be produced, and
- the deduped count must be reported clearly, and
- if the deduped count is below `800`, the shortfall must be treated as a blocker unless the user gives an explicit written exception.

If Muck Rack exposes fewer than `800` relevant people after all Boolean expansion passes, advanced filters, SERP-driven outlet expansion, geography expansion, county expansion, and adjacent-beat expansion have been exhausted, do not mark the collection complete. Record the shortfall, explain every expansion attempted, and wait for the user's decision.

Stage 06 can still create a prioritized outreach table from the collected pool, but that table is a review layer after the `800`-per-beat collection requirement. It is not a replacement for the `800`-journalist collection requirement.

## 800 Target Accounting Rules
Use consistent count definitions. Do not mix raw rows, deduped profiles, approved outreach candidates, and reviewed candidates.

### Count Types
Use these labels in summaries and status reports:

- `Raw collected rows`: every row captured from Muck Rack or another source before cleanup.
- `Valid collected rows`: rows that match the selected beat, selected geography, and selected angle after obvious wrong-fit rows are removed.
- `Deduped profile count`: unique Muck Rack profile URLs after deduplication.
- `Deduped journalist-outlet count`: unique journalist plus outlet combinations when profile URL is missing.
- `Approved outreach candidates`: reviewed candidates ready for Stage 06 prioritization.
- `Rejected rows`: duplicates, stale sources, wrong beat, wrong geography, old campaign data, or unsupported results.
- `Manual-review rows`: possible candidates that require human review before approval.

### Target Standard
The minimum target is:

```text
800 valid collected journalists per selected beat
```

Preferred standard:

```text
800 deduped Muck Rack profile URLs per selected beat
```

If raw rows reach `800` but deduped profiles are below `800`, report both counts. Treat the deduped shortfall as a blocker unless the user gives written approval to proceed.

### Per-Beat Count Table
Every run summary must include this table or an equivalent structure:

| Beat | Raw Rows | Valid Rows | Deduped Profiles | Deduped Journalist-Outlet | Rejected Rows | Gate Status |
|------|----------|------------|------------------|---------------------------|---------------|-------------|
| selected beat | 0 | 0 | 0 | 0 | 0 | blocked |

Allowed gate statuses:

- `met`: at least `800` valid collected journalists and deduped count is reported.
- `raw-met-dedupe-shortfall`: raw or valid rows reached `800`, but deduped profiles are below `800`; requires escalation.
- `blocked-shortfall`: fewer than `800` valid collected journalists.
- `blocked-browser`: Debug Chrome, SERP, or Muck Rack access failed.
- `blocked-quality`: enough rows exist, but too many are wrong-beat, wrong-geography, stale, or unsupported.
- `user-exception-approved`: user explicitly approved proceeding below `800`.

### What Counts Toward 800
Count a journalist only if:

- name is present,
- outlet is present,
- beat or coverage relevance is present,
- geography or outlet scale is plausible,
- source URL or Muck Rack profile exists where available,
- the candidate belongs to the selected angle, not a secondary backlog angle.

### What Does Not Count Toward 800
Do not count:

- duplicate Muck Rack profile URLs,
- duplicate journalist plus outlet rows,
- wrong-beat journalists,
- wrong-geography journalists,
- stale profiles with no current role,
- old campaign names,
- generic media contacts,
- outlet tips inboxes,
- publications without a journalist name,
- guessed contacts,
- rows with only a keyword match and no profile, outlet, or article proof.

### Exception Rule
Only the user can approve moving forward below `800`.

The exception must be written into:

- `collection-log.md`,
- `summary-all.md` when bulk output exists,
- Stage 06 handoff notes,
- and the completion manifest.

Exception note must include:

```text
Exception approved by:
Date:
Selected beat:
Final raw count:
Final valid count:
Final deduped count:
Reason target could not be reached:
Expansion attempts completed:
Permission to proceed:
```

## Multi-Beat Handling
Sometimes the selected angle maps to more than one journalist beat. Treat every selected beat as its own `800`-minimum collection unit.

Examples:

- Selected beat group: `transportation safety` and `public safety`
- Selected beat group: `consumer finance` and `real estate`
- Selected beat group: `health policy` and `local government`
- Selected beat group: `business` and `technology`

Rules:

- Collect at least `800` journalists for each selected beat.
- Do not combine two beats to reach one shared `800` total.
- Do not count the same journalist twice inside the same beat after dedupe.
- A journalist can appear in more than one beat only if their profile or coverage genuinely fits both beats.
- Report raw and deduped counts separately for each beat.
- Build separate query groups for each beat.
- Build separate shortfall notes for each beat.
- Mark Stage 06 blocked if any selected beat fails the `800` requirement without written user exception.

Multi-beat count table:

| Selected Beat | Minimum Target | Raw Rows | Valid Rows | Deduped Profiles | Gate Status | Notes |
|---------------|----------------|----------|------------|------------------|-------------|-------|
| beat 1 | 800 | 0 | 0 | 0 | blocked | |
| beat 2 | 800 | 0 | 0 | 0 | blocked | |

If the user selected one angle with one primary beat and several optional adjacent beats, the primary beat must meet `800`. Adjacent beats must meet `800` only when they are explicitly part of the selected collection scope.

## Count Integrity Rules
Before reporting counts, clean the data in this order:

1. Remove exact duplicate Muck Rack profile URLs.
2. Remove duplicate journalist plus outlet combinations.
3. Remove rows with missing journalist name.
4. Remove rows with missing outlet unless another strong source identifies the outlet.
5. Remove wrong-beat rows.
6. Remove wrong-geography rows.
7. Remove old-campaign rows.
8. Remove rows with no source proof.
9. Mark remaining questionable rows as `manual-review`.
10. Recalculate raw, valid, deduped, rejected, and manual-review counts.

Never report a count without saying which count type it is.

Correct:

```text
Selected beat: transportation safety
Raw rows: 1,120
Valid rows after cleanup: 914
Deduped Muck Rack profiles: 842
Gate status: met
```

Incorrect:

```text
Found 1,120 journalists.
```

The incorrect version hides duplicates, weak-fit rows, and cleanup status.

## Operating Principle
The collector is not trying to gather as many random journalists as possible. The collector is trying to build the strongest possible journalist evidence base for one approved pitch angle.

The work must be:

- Selected-angle locked.
- Searchable later by another agent.
- Verifiable from saved sources.
- Honest about missing data.
- Clear enough that Stage 06 can write a journalist-intelligence table without guessing.
- Clear enough that Stage 08 can personalize pitch variants without reopening broad research.

When there is tension between speed and accuracy, choose accuracy. When there is tension between volume and relevance, keep both requirements visible: the collection must still pursue at least `800` journalists per selected beat, and irrelevant journalists must not be counted toward that target.

## Operating Roles
The same human or agent may perform multiple roles, but the responsibilities must stay separate.

### Orchestrator
The orchestrator owns workflow order.

Responsibilities:

- Confirm Stage 05 is complete.
- Confirm the user selected at least one angle and that one active selected angle package is clear.
- Confirm `Selection status: confirmed`.
- Confirm collection should happen now.
- Prevent unselected-angle research.
- Stop the workflow if the gate is not ready.
- Decide whether the execution path is review layer, bulk, or hybrid based on `05-beats.md`, while preserving the `800`-per-beat minimum.
- Confirm the Stage 06 handoff is ready.

### Search Operator
The search operator owns SERP and Muck Rack discovery.

Responsibilities:

- Launch Debug Chrome.
- Verify port `9222`.
- Use SERP advanced search.
- Use Muck Rack Boolean search.
- Use Muck Rack advanced filters.
- Record every query.
- Save result counts.
- Save raw outputs.
- Record shortfalls.
- Avoid unsupported assumptions.

### Profile Reviewer
The profile reviewer owns candidate quality.

Responsibilities:

- Open profiles and article pages.
- Confirm beat fit.
- Confirm geography fit.
- Confirm outlet fit.
- Confirm recent coverage relevance.
- Score candidates.
- Reject weak candidates.
- Record why candidates fit or fail.

### Contact Reviewer
The contact reviewer owns outreach readiness.

Responsibilities:

- Check Muck Rack contact availability.
- Check outlet contact pages.
- Check author pages.
- Check newsroom tips pages.
- Mark contact status honestly.
- Avoid guessed email formats.
- Use `data unavailable` when contact cannot be verified.

### QA Reviewer
The QA reviewer owns final readiness before Stage 06.

Responsibilities:

- Confirm every required artifact exists.
- Confirm all selected-angle fields match `05-beats.md`.
- Confirm no unselected angle leaked into the outputs.
- Confirm bulk outputs are deduped.
- Confirm resumed outputs were rebuilt.
- Confirm at least `800` journalists were collected per selected beat or that the user granted a written exception.
- Confirm raw row count and deduped profile count are reported separately.
- Confirm weak, stale, and wrong-campaign sources are logged.
- Confirm `06-journalist-intel.md` can be drafted from saved evidence.

## Run Mode Decision
Choose one execution mode before searching. Every mode must respect the non-negotiable `800` journalists per selected beat requirement unless the user explicitly grants a written exception.

## Legacy Lane Normalization
Older workflow language may still say `shortlist`, `shortlist lane`, `20 to 50`, or `pilot list`. These labels must be normalized before collection begins.

Normalization rules:

- `shortlist` means `review layer after 800-per-beat collection`.
- `shortlist lane` means `bulk or hybrid collection first, then reviewed candidate table`.
- `pilot list` means `not complete`; it may be used only as an early review sample.
- `20 to 50` means `not acceptable as the collection target`.
- `500 journalists per beat` means `not acceptable as the final collection target`.
- `bulk lane` means `collect at least 800 journalists per selected beat`.
- `hybrid lane` means `collect at least 800 journalists per selected beat, dedupe, then review and score`.

If `05-beats.md` still includes an old selected collection lane label, do not silently follow the old target. Preserve the selected angle and selected beat, but apply the `800` minimum from this file.

The only valid collection target for this workflow is:

```text
at least 800 journalists per selected beat
```

The reviewed Stage 06 table may be smaller than `800`, but the underlying collected pool must still meet the `800` target or have a written user exception.

### Manual Research Support Mode
Use when:

- The selected angle is niche.
- The user wants careful targeting after large-scale collection.
- Muck Rack automation needs human review.
- SERP and outlet research are more useful than bulk capture.

Expected output:

- Strong notes in `serp-search-notes.md`.
- Strong notes in `outlet-page-notes.md`.
- Profile notes for reviewed journalists.
- Contact status for reviewed journalists.
- Search expansion terms that help reach the `800`-per-beat target.
- A clear blocker note if manual research cannot support the `800` target.

Important: Manual research support is not a small-list replacement. It supports and improves the `800`-per-beat collection requirement.

### Assisted Automation Mode
Use when:

- Muck Rack is available in Debug Chrome.
- Automation helpers can capture profiles or recent articles.
- The selected angle needs guided large-scale collection.
- The operator still needs to review results manually.

Expected output:

- Muck Rack search captures.
- Profile captures.
- Recent-article captures.
- Manual review notes.
- Deduped candidate pool.
- Progress toward at least `800` collected journalists per selected beat.
- Shortfall notes if the target is not reached.

### Bulk Automation Mode
Use when:

- The selected beat requires at least `800` collected journalists.
- `05-beats.md` selects the Bulk Muck Rack lane.
- The selected beat needs high-volume discovery.
- Multiple Boolean passes are needed.

Expected output:

- Query file.
- Run folder.
- Per-beat exports.
- Combined CSV.
- Deduped CSV.
- `summary-all.json`.
- `summary-all.md`.
- At least `800` collected journalists per selected beat.
- Raw row count and deduped profile count.
- Shortfall notes.
- Final reviewed candidate pool extracted from the bulk pool.

### Hybrid Mode
Use when:

- Bulk discovery is needed, but the final outreach list must be curated.
- The selected beat overlaps multiple sub-beats.
- Local and national results are mixed.
- Muck Rack returns many weak matches.

Expected output:

- Bulk output.
- Deduped candidate pool.
- Manually reviewed candidate table.
- Priority tiers.
- Rejection log.
- Stage 06-ready journalist table inputs.

## Required Local Tools
The selected-angle search should use the visible Debug Chrome workflow.

Primary browser helper:

```powershell
cd "D:\Codex Folder\muck-rack-automation"
.\scripts\launch-debug-chrome.cmd
```

Debug Chrome availability check:

```powershell
Invoke-WebRequest http://127.0.0.1:9222/json/version
```

Muck Rack helper scripts:

```text
D:\Codex Folder\muck-rack-automation\scripts\login-muckrack.cmd
D:\Codex Folder\muck-rack-automation\scripts\search-muckrack.cmd
D:\Codex Folder\muck-rack-automation\scripts\capture-journalist-profile.cmd
D:\Codex Folder\muck-rack-automation\scripts\collect-last-10-articles.cmd
D:\Codex Folder\muck-rack-automation\scripts\collect-beat-journalists.cmd
```

Digital PR import and drafting scripts:

```text
D:\Codex Folder\digital-pr-agents\scripts\import-muckrack-output.cmd
D:\Codex Folder\digital-pr-agents\scripts\draft-journalist-intel.cmd
D:\Codex Folder\digital-pr-agents\scripts\draft-pitch-draft.cmd
```

## Preflight Command Checklist
Run these checks before collection begins.

### Check Project Context
Use the Digital PR project as the working repo for job files:

```powershell
cd "D:\Codex Folder\digital-pr-agents"
Get-ChildItem .\pitch-jobs -Directory
```

Confirm:

- The target job folder exists.
- The target job folder is the correct campaign.
- `05-beats.md` is inside the target job folder.
- `source-files/journalist-intel/selected-angle/` exists.

### Check Required Job Files
For the target job, confirm these files exist:

```text
00-brief.md
04-angles.md
05-beats.md
source-files/journalist-intel/selected-angle/selected-angle-summary.md
source-files/journalist-intel/selected-angle/selected-angle-queries.json
source-files/journalist-intel/selected-angle/collection-log.md
```

If any selected-angle source file is missing, create or restore it from the template before collection.

### Check Gate Text
Read `05-beats.md` and verify:

- `Selection status: confirmed`
- selected angle is not blank
- selected beat is not blank
- selected geography is not blank
- selected collection lane is not blank

Do not use approximate gate labels such as:

- `approved`
- `ready`
- `confirmed by user`
- `selected`
- `go`

The script and workflow standard require exact `confirmed`.

### Check Browser Tooling
From the Muck Rack automation folder:

```powershell
cd "D:\Codex Folder\muck-rack-automation"
Test-Path .\scripts\launch-debug-chrome.cmd
Test-Path .\scripts\search-muckrack.cmd
Test-Path .\scripts\collect-beat-journalists.cmd
```

Pass only if the required scripts exist.

### Check Debug Chrome
Launch Debug Chrome:

```powershell
.\scripts\launch-debug-chrome.cmd
```

Verify the debugging endpoint:

```powershell
Invoke-WebRequest http://127.0.0.1:9222/json/version
```

Pass only if a valid response returns from port `9222`.

### Check Login And Access
Open these in Debug Chrome:

```text
https://www.google.com/
https://muckrack.com/
```

Pass only if:

- Google loads normally.
- Muck Rack loads normally.
- Muck Rack is logged in or login can be completed by the user.
- No browser-verification page blocks the session.

If Muck Rack shows verification, stop. Do not continue with headless or assumed access.

## File Naming Standard
Use clear filenames so another agent can understand the run without opening every file.

Recommended naming:

```text
selected-angle-summary.md
selected-angle-queries.json
serp-search-notes.md
outlet-page-notes.md
contact-review-notes.md
collection-log.md
manual-reviewed-candidates-YYYY-MM-DD.md
muck-rack-search-results-YYYY-MM-DD.json
muck-rack-profile-<journalist-slug>-YYYY-MM-DD.json
muck-rack-articles-<journalist-slug>-YYYY-MM-DD.json
bulk-beat-collection/<run-name>/summary-all.md
bulk-beat-collection/<run-name>/summary-all.json
```

Run-name format:

```text
selected-angle-<short-topic>-<YYYY-MM-DD>
```

Example:

```text
selected-angle-traffic-safety-2026-04-29
```

File naming rules:

- Include the current campaign only.
- Include the selected angle or selected beat when useful.
- Use dates for search captures.
- Do not overwrite prior run folders unless intentionally rebuilding the same run.
- Keep raw exports separate from reviewed notes.

## Evidence Standard
Every important claim in Stage 06 should trace back to saved evidence.

Acceptable evidence:

- Muck Rack profile URL.
- Muck Rack beat label.
- Muck Rack recent article capture.
- Outlet author page.
- Outlet staff page.
- Recent article URL.
- Public contact page.
- Newsroom tips page.
- SERP result recorded with query and date.
- Bulk collection summary with query and profile URL.

Weak evidence:

- A name found in a generic search result without profile or article proof.
- A social bio with no current outlet confirmation.
- A stale article from years ago with no current role.
- A copied journalist name from a previous campaign.
- An email guessed from a pattern.

Weak evidence should not enter the final Stage 06 primary table unless it is clearly marked as a manual-review candidate.

## Debug Chrome Rule
Launch Debug Chrome before SERP or Muck Rack research.

Use Debug Chrome for:

- Google SERP searches.
- Google Advanced Search operators.
- Muck Rack login.
- Muck Rack people search.
- Muck Rack advanced filters.
- Muck Rack profile review.
- Outlet author-page review.
- Public contact review.

Reason: Muck Rack and SERP research often require the same visible, human-usable browser session. Headless access can be blocked, can show browser-verification pages, or can give misleading success signals. Debug Chrome keeps the research in one inspectable browser environment.

Checkpoint:

- Debug Chrome is open.
- `http://127.0.0.1:9222/json/version` responds successfully.
- Muck Rack opens in the visible browser.
- Google Search opens in the visible browser.
- If Muck Rack shows verification, login friction, or a `Just a moment...` page, stop and clear it in Chrome before continuing.

## Browser Failure Classification
Classify browser problems before deciding next action.

| Failure | Meaning | Required Action |
|---------|---------|-----------------|
| `9222` does not respond | Debug Chrome is not available to automation | Relaunch Debug Chrome and verify again |
| Google does not load | Network or browser session issue | Fix browser/network before SERP |
| Muck Rack shows login page | Session is not logged in | Complete login in visible Chrome |
| Muck Rack shows verification | Browser verification blocks collection | Stop and clear verification manually |
| Muck Rack shows `Just a moment...` | Session is not usable for collection | Do not treat as success; clear in visible Chrome |
| Search page loads but no results | Query/filter issue or UI issue | Try simpler query, remove filters, inspect page |
| Result count stalls | Automation or UI parsing issue | Log checkpoint, inspect page, resume carefully |
| Profile capture fails | Selector drift or profile layout change | Save page evidence, inspect selectors, do not invent data |

Browser rules:

- Do not switch to headless collection when visible Muck Rack is blocked.
- Do not assume login from a previous run still works.
- Do not continue if the browser session cannot be inspected.
- Do not run long bulk collection until Muck Rack search works manually in Debug Chrome.
- Record browser failures in `collection-log.md`.

## Debug Chrome Evidence Log
For each run, record:

```text
Debug Chrome launched:
Port 9222 verified:
Google loaded:
Muck Rack loaded:
Muck Rack login status:
Verification cleared:
Operator:
Date:
Notes:
```

This evidence log protects the workflow from claiming browser access when the browser was not usable.

## Selected Angle Setup
Before searching, copy the selected angle fields from `05-beats.md` into:

```text
source-files/journalist-intel/selected-angle/selected-angle-summary.md
```

Required copy fields:

- `Selection status:`
- `Selected priority number:`
- `Selected angle / pitch angle:`
- `Selected category:`
- `Selected journalist beat:`
- `Selected outlet scale:`
- `Selected geography:`
- `Selected collection lane:`
- `Evidence support to carry forward:`
- `Search start point:`
- `Selection note:`

Checkpoint:

- The selected angle in `selected-angle-summary.md` exactly matches `05-beats.md`.
- The selected beat exactly matches `05-beats.md`.
- The selected geography exactly matches `05-beats.md`.
- The selected collection lane exactly matches `05-beats.md`.
- No unselected angle has been added to the collection plan.

## Selected Angle Intent Extraction
Before building queries, translate the selected angle into search intent.

Create a short working brief with these fields:

```text
Selected angle:
Core news hook:
Primary audience:
Primary journalist beat:
Secondary journalist beats:
Geography:
Outlet scale:
Data hook:
Human-impact hook:
Policy/business/consumer hook:
Likely journalist questions:
Likely irrelevant results to exclude:
```

### Core News Hook
Identify the news hook in one sentence.

Examples:

- New data reveals a local risk pattern.
- A state or county ranking creates a local accountability angle.
- A consumer trend creates service-journalism value.
- A legal or policy finding creates a public-interest angle.
- A business or industry pattern creates trade-media relevance.

### Primary Audience
Define who the journalist's readers are.

Examples:

- Local residents.
- County residents.
- Statewide voters or drivers.
- Consumers.
- Business owners.
- Healthcare professionals.
- Legal readers.
- Parents.
- Homeowners.
- Industry executives.

### Journalist Question Map
Convert the selected angle into questions a journalist would naturally ask.

Examples:

- Why now?
- Why this geography?
- Who is affected?
- What changed?
- How large is the impact?
- Is there a local example?
- Is there a national comparison?
- Is there an expert or official source?
- What should readers do with this information?

Use these questions to shape SERP and Muck Rack searches.

## Beat Expansion Map
Most selected beats need synonyms. Build a beat expansion map before searching.

Required fields:

```text
Primary beat:
Close beat synonyms:
Adjacent beats:
Local desk terms:
Trade desk terms:
Policy terms:
Consumer terms:
Terms to exclude:
```

Example for a traffic-safety angle:

```text
Primary beat: traffic safety
Close beat synonyms: road safety, transportation safety, roadway deaths, crash data
Adjacent beats: public safety, transportation policy, local government, injury prevention
Local desk terms: city hall, county government, metro transportation, local roads
Trade desk terms: transportation industry, safety technology, insurance
Policy terms: NHTSA, DOT, Vision Zero, state patrol, highway safety office
Consumer terms: driver safety, commuting, dangerous roads
Terms to exclude: motorsport, racing, motorcycle hobby, auto reviews
```

## Geography Expansion Map
Do not search only one place name. Expand geography based on the selected outlet scale.

### City-Level Angle
Include:

- city name
- county name
- metro name
- state name
- state abbreviation
- local agency names
- local newspaper names
- nearby suburbs when relevant

### County-Level Angle
Include:

- county name
- county seat
- largest cities in the county
- metro area
- state name
- state abbreviation
- county agencies
- local newspapers
- public radio or TV stations covering that county

### State-Level Angle
Include:

- state name
- state abbreviation
- largest metros
- state agencies
- statehouse or capitol reporters
- statewide newspapers
- state public radio
- state business journals

### Regional Angle
Include:

- region name
- major cities
- major counties
- state names
- regional outlet names
- regional public media
- regional business outlets

### National Angle
Include:

- `U.S.`
- `United States`
- `national`
- federal agency names
- national industry terms
- national consumer terms
- national survey or ranking terms

Checkpoint:

- Each geography expansion term still supports the selected angle.
- County-level terms are included when the angle has county relevance.
- Local terms do not pull the search away from the selected beat.
- National terms are not used to dilute a local or county angle unless the pitch needs comparison context.

## Collection Lane Decision
Use the collection lane recorded in `05-beats.md`.

### Review Layer
Use this layer after broad collection to identify the strongest outreach-ready candidates from the larger `800`-per-beat pool.

Target output:

- At least `800` collected journalists per selected beat before review.
- A deduped candidate pool.
- A reviewed and prioritized candidate table.
- Verified beat fit.
- Verified geography or outlet-scale fit.
- Muck Rack profile where available.
- Recent coverage proof where available.
- Honest contact status.
- Clear personalization notes.

Use for:

- Niche angles.
- County-level or local angles.
- Executive review.
- Cases where the final outreach table needs quality control after the mandatory high-volume collection.

Important: This layer does not reduce the collection target. It only organizes and scores candidates after the `800`-per-beat collection requirement has been pursued.

### Bulk Muck Rack Lane
Use this lane for the standard selected-angle journalist collection requirement.

Target output:

- At least `800` collected journalists per selected beat.
- Multiple Boolean query passes.
- Muck Rack people search and advanced filters.
- Per-beat JSON exports.
- Per-beat Markdown summaries.
- Combined CSV.
- Deduped CSV.
- `summary-all.json`.
- `summary-all.md`.
- Raw row count and deduped profile count.
- Blocker note if the `800` target cannot be reached.

Use for:

- `800 journalists per beat`.
- Broad national beats.
- Statewide beats.
- Major metro beats.
- Broad industry beats.
- Broad public-policy, consumer, transportation, health, business, education, finance, legal, real estate, or technology beats.

### Hybrid Lane
Use this lane when the user wants scale plus quality control.

Target output:

- Bulk Muck Rack discovery of at least `800` collected journalists per selected beat.
- Deduped candidate set.
- Manually reviewed candidate table.
- Priority tiers.
- Exclusion notes.
- Final outreach-ready candidate table.

Use when:

- Muck Rack gives many weak matches.
- The selected beat has several sub-beats.
- Local, county, state, and national candidates are mixed.
- The first large result set needs editorial judgment before outreach.

## Required Artifact Map
Save all selected-angle evidence under:

```text
pitch-jobs/<slug>/source-files/journalist-intel/
```

Required selected-angle files:

```text
selected-angle/selected-angle-journalist-collection.md
selected-angle/selected-angle-summary.md
selected-angle/selected-angle-queries.json
selected-angle/serp-search-notes.md
selected-angle/outlet-page-notes.md
selected-angle/contact-review-notes.md
selected-angle/collection-log.md
```

Use these folders when relevant:

```text
muck-rack-exports/
profile-notes/
bulk-beat-collection/
rejected-or-stale-sources.md
```

Artifact meaning:

- `selected-angle-summary.md`: selected angle contract copied from `05-beats.md`.
- `selected-angle-queries.json`: SERP, Muck Rack, Boolean, and advanced-search query plan.
- `serp-search-notes.md`: Google SERP discoveries and source notes.
- `outlet-page-notes.md`: outlet author-page, staff-page, and recent-coverage findings.
- `contact-review-notes.md`: verified contact status and contact-source notes.
- `collection-log.md`: chronological record of every search action.
- `muck-rack-exports/`: raw search results, profile captures, article captures, or imported Muck Rack data.
- `profile-notes/`: manually reviewed journalist profile summaries.
- `bulk-beat-collection/`: high-volume selected-angle bulk outputs.
- `rejected-or-stale-sources.md`: rejected old, stale, wrong-beat, wrong-geography, duplicate, or unsupported sources.

## Query Planning Requirements
Build the query plan before collecting.

Save the plan in:

```text
selected-angle/selected-angle-queries.json
```

Minimum JSON fields:

```json
{
  "selectionStatus": "confirmed",
  "selectedAngle": "",
  "selectedBeat": "",
  "selectedGeography": "",
  "selectedOutletScale": "",
  "selectedCollectionLane": "",
  "minimumJournalistsPerBeat": 800,
  "targetIsNonNegotiable": true,
  "serpQueries": [],
  "muckRackBooleanQueries": [],
  "muckRackAdvancedFilters": [],
  "outletReviewQueries": [],
  "contactReviewQueries": [],
  "exclusionTerms": [],
  "shortfallExpansionQueries": []
}
```

Checkpoint:

- Query plan exists before running bulk collection.
- Query plan includes both SERP and Muck Rack searches.
- Boolean queries are included for Muck Rack.
- Advanced filters are named, even if a filter is unavailable in the current Muck Rack UI.
- `minimumJournalistsPerBeat` is set to `800`.
- `targetIsNonNegotiable` is set to `true`.
- Query plan does not include unselected angles.

## Query Expansion Quotas
The `800` target requires enough query coverage. Do not run one or two searches and call the result exhausted.

Minimum query quotas:

- At least `10` SERP queries before Muck Rack collection.
- At least `7` Muck Rack Boolean query passes for broad beats.
- At least `5` Muck Rack Boolean query passes for narrow local or county beats.
- At least `3` geography expansion passes for local, county, metro, state, or regional angles.
- At least `2` outlet expansion passes using SERP-discovered outlet names.
- At least `1` agency, source, or institution expansion pass when the angle is data, government, legal, transportation, health, business, or policy related.
- At least `1` noise-control pass if irrelevant results appear.

If the count is still below `800`, continue expansion before escalating.

## SERP-To-Muck Rack Flywheel
SERP research is not separate from Muck Rack collection. SERP must actively improve Muck Rack recall.

Use this loop:

1. Run SERP query.
2. Extract outlet names.
3. Extract journalist names.
4. Extract beat wording used by outlets.
5. Extract geography wording used by outlets.
6. Extract agency, report, institution, and industry names.
7. Convert those terms into Muck Rack Boolean queries.
8. Run Muck Rack people search.
9. Record result count.
10. Identify weak areas.
11. Return to SERP for missing outlet, geography, or beat language.

Examples of SERP terms that should become Muck Rack query inputs:

- local newspaper name,
- county newspaper name,
- metro nickname,
- public radio station,
- local TV station,
- business journal,
- state agency,
- federal agency,
- trade association,
- policy phrase,
- industry phrase,
- journalist beat label,
- recurring byline topic.

Flywheel checkpoint:

- SERP notes include terms that were reused in Muck Rack.
- Muck Rack query plan shows SERP-driven expansions.
- Search gaps are not guessed; they are fed back into SERP.
- At least one SERP-to-Muck Rack expansion is attempted before declaring a shortfall.

## Boolean Search Requirements
Use Boolean search for Muck Rack and SERP.

Core operators:

- `AND` to require the selected topic plus geography or beat.
- `OR` to include synonyms and related beat terms.
- Quotation marks for exact phrases.
- Parentheses to group terms.
- Minus terms or exclusions when irrelevant results dominate.
- Site operators in SERP when targeting Muck Rack, outlet pages, or public sources.

Boolean query structure:

```text
(topic synonym A OR topic synonym B OR topic synonym C)
AND (beat synonym A OR beat synonym B OR beat synonym C)
AND (geography A OR geography B OR geography C)
```

Example:

```text
("traffic safety" OR "road safety" OR crashes OR fatalities)
AND (transportation OR public safety OR policy)
AND (Texas OR Houston OR "Harris County")
```

For a county-level angle, include:

```text
("<topic>" OR "<topic synonym>")
AND ("<county>" OR "<county seat>" OR "<metro area>" OR "<state>")
AND ("local news" OR newspaper OR reporter OR journalist)
```

For a national angle, include:

```text
("<topic>" OR "<topic synonym>")
AND ("national" OR "U.S." OR "United States")
AND (policy OR consumer OR industry OR data OR survey OR report)
```

For trade media, include:

```text
("<topic>" OR "<industry term>")
AND ("trade publication" OR newsletter OR magazine OR editor)
AND ("<industry>" OR "<sub-industry>")
```

Quality rule:

- Do not rely on one strict query.
- Build multiple Boolean passes for recall.
- Start narrow for precision.
- Add synonyms for recall.
- Add geography expansions.
- Add outlet-name expansions when local search is weak.
- Add exclusion terms only when noise is clearly visible.

## Advanced Search Requirements
Use advanced search methods in both SERP and Muck Rack.

### Google SERP Advanced Search
Use Google operators in Debug Chrome.

Recommended operators:

```text
site:muckrack.com
site:<outlet-domain>
intitle:
inurl:
filetype:pdf
after:
before:
"exact phrase"
-excludedterm
```

SERP query examples:

```text
"<selected topic>" journalist "<selected geography>"
"<selected topic>" reporter "<selected geography>"
"<selected topic>" "<selected beat>" "Muck Rack"
"<selected topic>" site:muckrack.com
"<selected topic>" site:<outlet-domain>
"<selected topic>" "<county>" newspaper reporter
"<selected topic>" "<city>" "staff writer"
"<selected topic>" "<state>" "public radio"
"<journalist name>" "<outlet>" "<selected topic>"
"<outlet>" "<beat>" reporter email
```

Use SERP advanced search to locate:

- Muck Rack profiles.
- Outlet author pages.
- Staff pages.
- Recent coverage.
- Topic-specific journalist bylines.
- Public contact pages.
- Local newspapers.
- County-level newspapers.
- Regional newsletters.
- Trade publications.
- Government, academic, or industry context that helps verify beat relevance.

## SERP Research Lanes
Use multiple SERP lanes instead of one broad Google search. Each lane has a different job.

### Lane 1: Journalist Discovery
Goal: find names and profiles.

Queries:

```text
"<selected topic>" journalist "<geography>"
"<selected topic>" reporter "<geography>"
"<selected beat>" reporter "<city>"
"<selected beat>" reporter "<county>"
"<selected beat>" journalist "<state>"
"<selected topic>" "Muck Rack"
```

Save:

- journalist names
- outlet names
- profile URLs
- article URLs
- search query used

### Lane 2: Outlet Discovery
Goal: find outlets likely to cover the angle.

Queries:

```text
"<geography>" newspaper "<selected beat>"
"<geography>" local news "<selected topic>"
"<county>" newspaper reporter
"<city>" public radio "<selected topic>"
"<state>" business journal "<selected topic>"
"<industry>" trade publication "<selected topic>"
```

Save:

- outlet name
- outlet type
- geography served
- relevant desk or beat
- staff page URL
- contact page URL

### Lane 3: Recent Coverage Discovery
Goal: prove topic relevance and pitch timing.

Queries:

```text
"<selected topic>" "<geography>" after:2025-01-01
"<selected beat>" "<geography>" "reported"
"<selected topic>" "<outlet>" after:2025-01-01
"<selected topic>" "<journalist name>" "<outlet>"
```

Save:

- article title
- article URL
- journalist
- date
- why it proves fit

### Lane 4: Contact Discovery
Goal: verify public contact paths.

Queries:

```text
"<journalist name>" "<outlet>" email
"<journalist name>" "<outlet>" contact
"<outlet>" newsroom contact
"<outlet>" tips email
"<outlet>" staff "<selected beat>"
```

Save:

- verified email if public
- Muck Rack contact availability
- contact form
- outlet tips email
- public social/contact link
- `data unavailable` when no verified source exists

### Lane 5: Local And County Coverage Discovery
Goal: capture local or county outlets that broad searches miss.

Queries:

```text
"<county>" "<selected topic>" newspaper
"<county seat>" "<selected topic>" reporter
"<county>" "<selected beat>" "local news"
"<city>" "<county>" "<selected topic>"
"<county>" "public radio" "<selected topic>"
"<county>" "business journal" "<selected topic>"
```

Save:

- county outlets
- city outlets
- regional outlets
- public radio or TV stations
- reporters covering county agencies or local impact

### Lane 6: Trade And Industry Discovery
Goal: find vertical media if the selected angle has a professional or industry audience.

Queries:

```text
"<industry>" "<selected topic>" editor
"<industry>" "<selected topic>" reporter
"<industry>" newsletter "<selected topic>"
"<industry>" trade publication "<selected topic>"
"<industry>" magazine "<selected beat>"
```

Save:

- trade publication
- editor or reporter
- beat
- recent relevant coverage
- contact status

SERP lane checkpoint:

- Each lane used is recorded in `serp-search-notes.md`.
- Every useful result is tied to the selected angle.
- Every rejected lane has a reason.
- Local and county lanes are used when the selected geography is smaller than state level.
- Trade lanes are used when the selected beat has an industry audience.

### Muck Rack Advanced Search
Use Muck Rack people search and advanced filters when available.

Apply filters for:

- People, not general content, unless collecting coverage evidence.
- Beat or topic.
- Location.
- Media outlet.
- Outlet type.
- Role or title.
- Language when relevant.
- Recent activity when available.
- Articles or profile evidence when available.

If an advanced filter is unavailable, record that limitation in `collection-log.md`.

Muck Rack advanced-search checklist:

- Search people first.
- Confirm the result count.
- Apply beat filter.
- Apply geography filter.
- Apply outlet or outlet-type filter when useful.
- Use Boolean query variations.
- Open promising profiles.
- Capture profile URL.
- Capture beat labels.
- Capture outlet relationship.
- Capture recent articles when relevant.
- Capture contact availability status without inventing email data.

## Muck Rack Boolean Query Ladder
Use a ladder instead of one query. Move from precise to broad while keeping the selected angle intact.

### Pass 1: Exact Selected Angle
Purpose: identify the highest-precision results.

Pattern:

```text
("<exact topic phrase>" OR "<closest topic synonym>")
AND ("<selected geography>" OR "<primary geography synonym>")
AND ("<selected beat>")
```

Use when:

- The selected angle has a clear phrase.
- The topic is specific.
- The geography is important.

### Pass 2: Beat Synonym Expansion
Purpose: find journalists who cover the same issue under different beat language.

Pattern:

```text
("<topic phrase>" OR "<topic synonym>")
AND ("<beat synonym A>" OR "<beat synonym B>" OR "<beat synonym C>")
AND ("<geography>")
```

Use when:

- Results are too narrow.
- Muck Rack beat labels differ from the campaign language.
- SERP revealed alternate desk terms.

### Pass 3: Geography Expansion
Purpose: expand from city to county, metro, state, or region without losing topic relevance.

Pattern:

```text
("<topic phrase>" OR "<topic synonym>")
AND ("<city>" OR "<county>" OR "<metro>" OR "<state>")
AND ("<beat synonym>")
```

Use when:

- Local search is too narrow.
- County coverage is important.
- Regional outlets cover the topic better than city outlets.

### Pass 4: Outlet Expansion
Purpose: pull in reporters from known relevant outlets.

Pattern:

```text
("<topic phrase>" OR "<beat synonym>")
AND ("<outlet 1>" OR "<outlet 2>" OR "<outlet 3>")
```

Use when:

- SERP identified outlet names.
- Local outlets do not surface with topic searches.
- The selected angle is geography-specific.

### Pass 5: Agency Or Source Expansion
Purpose: find reporters who cover the institutions connected to the story.

Pattern:

```text
("<agency name>" OR "<official data source>" OR "<regulator>" OR "<industry group>")
AND ("<selected beat>" OR "<topic synonym>")
AND ("<geography>")
```

Use when:

- The angle is policy, government, legal, health, transportation, business, education, or data-heavy.
- Reporters cover the agency more often than the topic phrase.

### Pass 6: Adjacent Beat Expansion
Purpose: recover useful candidates when the topic spans multiple desks.

Pattern:

```text
("<topic phrase>" OR "<data hook>")
AND ("<adjacent beat A>" OR "<adjacent beat B>" OR "<adjacent beat C>")
AND ("<geography or outlet scale>")
```

Use only when:

- The adjacent beat still has a clear reason to cover the selected angle.
- The candidate can be scored against the selected angle.
- The result will not dilute the final outreach list.

### Pass 7: Noise-Control Pass
Purpose: reduce bad matches after broadening.

Pattern:

```text
("<topic phrase>" OR "<topic synonym>")
AND ("<beat synonym>")
AND ("<geography>")
-"<irrelevant term>"
-"<irrelevant outlet type>"
```

Use when:

- Search returns sports, entertainment, hobby, or unrelated business results.
- A word in the topic has multiple meanings.
- The first broad pass produces too much noise.

Query ladder checkpoint:

- At least one exact query was attempted.
- At least one synonym query was attempted.
- Geography expansion was attempted for local, county, state, or regional angles.
- Advanced filters were used with the query ladder.
- Shortfalls were addressed with additional passes before being accepted.

## Muck Rack Advanced Filter Matrix
Use this matrix to decide which filters to apply.

| Need | Filter Type | Instruction |
|------|-------------|-------------|
| Find humans, not articles | Search type | Use people/journalist search first |
| Match topic | Beat/topic | Apply closest Muck Rack beat label |
| Match geography | Location | Apply city, county, state, region, or country where available |
| Match outlet scale | Outlet type | Use newspaper, online, TV, radio, magazine, trade, or national where available |
| Improve recency | Activity/recent content | Prefer recently active profiles when available |
| Improve authority | Outlet | Add known relevant outlets from SERP |
| Improve role fit | Role/title | Prefer reporter, staff writer, editor, correspondent, producer when relevant |
| Improve language fit | Language | Apply only if campaign language requires it |
| Reduce noise | Exclusions | Add exclusions only after reviewing bad results |

Filter rules:

- Do not over-filter on the first pass.
- Apply one filter at a time when diagnosing low results.
- Record every filter used in `collection-log.md`.
- If a filter causes useful results to disappear, remove it and record the reason.
- If Muck Rack UI does not expose a desired filter, write `filter unavailable` in the log.

## Muck Rack Profile Review Checklist
For each high-fit Muck Rack profile, capture:

- Profile URL.
- Displayed journalist name.
- Current outlet.
- Current role.
- Listed beats.
- Location.
- Recent articles.
- Contact availability status.
- Social links if relevant.
- Any visible profile notes that help personalize outreach.

Reject or downgrade if:

- No current outlet is visible.
- Beats are unrelated.
- Articles are stale.
- The profile only loosely matches through a keyword.
- Geography is wrong.
- The profile appears inactive.

Profile capture checkpoint:

- Each Tier 1 candidate has a Muck Rack profile, outlet page, or recent article proof.
- Each Tier 1 candidate has at least one personalization note.
- Each candidate has a contact status, even if it is `data unavailable`.

## Muck Rack Result Interpretation
Do not treat every visible result as a valid journalist.

Interpret results carefully:

- `people` result count means possible people results, not automatically valid selected-beat journalists.
- `most relevant people` wording may differ from plain `people`; record the exact wording if visible.
- A person result is not valid until the profile, beat, outlet, or coverage supports the selected angle.
- A high result count can still produce a low valid count after dedupe and quality cleanup.
- A low result count does not prove the beat is exhausted until Boolean expansion and filters have been tested.

For each Muck Rack result page, record:

```text
Query:
Search type:
Visible result count:
Exact result-count wording:
Filters active:
Page number or scroll depth:
Profiles opened:
Profiles kept:
Profiles rejected:
Reason for rejection pattern:
Next query expansion:
```

Result page QA:

- Confirm the search is in people mode.
- Confirm the query shown on page matches the query plan.
- Confirm filters are visible or otherwise recorded.
- Confirm the first page contains plausible journalists before running a long automation.
- If the first page is noisy, adjust query before collecting hundreds of rows.

## Profile Capture Failure Handling
If profile capture fails:

1. Save the profile URL.
2. Record the journalist name if visible.
3. Record the outlet if visible.
4. Record the error or missing field.
5. Try manual profile review in Debug Chrome.
6. If the page layout changed, do not fabricate missing fields.
7. Mark the row `manual-review` or `reject` depending on available proof.
8. Log the issue in `collection-log.md`.

Known useful profile evidence can include:

- profile heading,
- current outlet section,
- beat tags,
- location,
- recent article cards,
- byline links,
- contact availability indicator.

## Debug Chrome SERP Phase
Perform SERP discovery before, during, and after Muck Rack search.

Use SERP first to understand:

- which outlets cover the topic,
- which reporters have recent bylines,
- which geography terms matter,
- which local or county outlet names should be included in Muck Rack queries,
- which trade publications exist,
- which recent story angles journalists are already covering,
- which source names or agencies appear repeatedly.

Record in:

```text
selected-angle/serp-search-notes.md
```

Each SERP note should include:

- Search query.
- Date searched.
- Key useful results.
- Journalist names found.
- Outlets found.
- Relevant article URLs.
- Why the result matters.
- Whether the result should become a Muck Rack query expansion.
- Whether the result should be rejected.

SERP checkpoint:

- At least 10 targeted SERP queries are run for the review layer.
- At least 10 targeted SERP queries are run for a hybrid lane.
- At least 10 to 20 targeted SERP queries are run for a bulk lane, especially when local or county routing matters.
- SERP findings feed into Muck Rack query expansion.
- Weak or irrelevant SERP paths are logged, not silently ignored.

## Debug Chrome Muck Rack Phase
Perform Muck Rack search in Debug Chrome after the selected angle and query plan are ready.

Browser rule:

- Use the visible Debug Chrome browser.
- Confirm Muck Rack is logged in.
- Confirm the page is not blocked by browser verification.
- Use Muck Rack people search for journalist discovery.
- Use Boolean searches and advanced filters.
- Use multiple query passes before declaring a shortfall.

Recommended workflow:

1. Open Muck Rack in Debug Chrome.
2. Confirm login.
3. Select people/journalist search where available.
4. Run the narrowest selected-angle Boolean query.
5. Record visible result count.
6. Apply advanced filters.
7. Record filter settings.
8. Export or capture results when possible.
9. Open high-fit profiles.
10. Capture profile data and recent coverage.
11. Run expanded Boolean query passes.
12. Deduplicate profiles.
13. Record shortfalls.

Muck Rack checkpoint:

- Muck Rack profile URLs are captured where available.
- Result counts are recorded where visible.
- At least one narrow query and one expanded query are attempted.
- Advanced filters are used or their absence is logged.
- For bulk collection, multiple Boolean query passes are used.
- Results are saved under the current job, not only under a shared automation output folder.

## Muck Rack Automation Commands
When using automation helpers, run from:

```powershell
cd "D:\Codex Folder\muck-rack-automation"
```

Launch browser:

```powershell
.\scripts\launch-debug-chrome.cmd
```

Check Muck Rack login:

```powershell
.\scripts\login-muckrack.cmd
```

Search Muck Rack:

```powershell
.\scripts\search-muckrack.cmd "<selected-angle Boolean query>"
```

Capture one profile:

```powershell
.\scripts\capture-journalist-profile.cmd "<muck-rack-profile-url>"
```

Capture recent articles:

```powershell
.\scripts\collect-last-10-articles.cmd "<muck-rack-profile-url>"
```

Bulk selected-beat collection:

```powershell
.\scripts\collect-beat-journalists.cmd --limit 800 --beats-file "<path-to-selected-angle-bulk-queries.json>" --output-dir "<job-source-files-bulk-output-dir>"
```

After Muck Rack captures are ready, import them into the pitch job from:

```powershell
cd "D:\Codex Folder\digital-pr-agents"
.\scripts\import-muckrack-output.cmd "<job-slug>"
```

Then draft Stage 06 and 07:

```powershell
.\scripts\draft-journalist-intel.cmd "<job-slug>"
```

Automation checkpoint:

- Debug Chrome is verified before automation.
- Automation output belongs to the current selected angle.
- Imported captures land under the current job folder.
- Shared outputs are not treated as current-job evidence until imported or copied into the job.
- The collection log names the automation command used.

## 800 Acquisition Strategy
Use a deliberate acquisition strategy to reach `800` journalists per selected beat.

### Strategy 1: Core Topic Pool
Start with the exact selected topic and direct beat terms.

Goal:

- Highest precision.
- Best Tier 1 and Tier 2 candidates.

Risk:

- Usually too narrow to reach `800`.

### Strategy 2: Beat Synonym Pool
Add close beat synonyms and newsroom desk language.

Goal:

- Capture journalists who cover the same topic under different beat labels.

Examples:

- `traffic safety` -> `transportation`, `public safety`, `road safety`, `crash data`.
- `consumer finance` -> `personal finance`, `consumer affairs`, `banking`, `credit`.
- `health data` -> `public health`, `health policy`, `medical research`, `wellness`.

### Strategy 3: Geography Pool
Expand geography without losing relevance.

Goal:

- Capture city, county, metro, state, regional, and national reporters tied to the selected angle.

Use:

- city,
- county,
- county seat,
- metro,
- state,
- state abbreviation,
- region,
- local agencies,
- local outlets.

### Strategy 4: Outlet Pool
Use SERP to identify relevant outlets and search by those outlet names.

Goal:

- Recover local and trade journalists who do not surface through topic queries.

Use:

- newspapers,
- local TV,
- public radio,
- business journals,
- trade publications,
- newsletters,
- regional magazines.

### Strategy 5: Agency And Institution Pool
Use agency or institution terms when journalists cover the source more than the topic.

Goal:

- Capture reporters who cover the official source behind the selected angle.

Use:

- federal agencies,
- state agencies,
- local agencies,
- courts,
- hospitals,
- universities,
- research institutes,
- industry associations,
- regulators.

### Strategy 6: Adjacent Beat Pool
Use adjacent beats only when they still match the selected angle.

Goal:

- Increase recall while staying relevant.

Examples:

- transportation safety -> public safety, local government, injury prevention.
- real estate data -> housing, personal finance, local economy.
- legal data -> courts, public policy, consumer protection.
- health survey -> public health, consumer health, healthcare business.

### Strategy 7: National Comparison Pool
Use national comparison terms when the selected angle can be framed beyond one local market.

Goal:

- Capture national reporters or regional reporters who cover comparative data.

Use:

- ranking,
- survey,
- study,
- data analysis,
- U.S.,
- national,
- states,
- cities,
- counties.

### Strategy 8: Noise-Control Pool
After broadening, use exclusions to remove irrelevant results.

Goal:

- Protect quality while preserving volume.

Use exclusions only after reviewing bad results. Do not over-exclude early.

800 acquisition checkpoint:

- All relevant pools have been attempted or deliberately ruled out.
- Every pool used is recorded in the query plan.
- Every pool result is saved or summarized.
- Weak pools are logged with the reason they failed.
- The final count table explains how the `800` target was reached or why it remains blocked.

## Bulk Collection Rules
Use bulk collection only for the selected angle and selected beat unless the user explicitly asks for all-angle collection.

Bulk query file location:

```text
source-files/journalist-intel/bulk-beat-collection/selected-angle-bulk-queries.json
```

Bulk output location:

```text
source-files/journalist-intel/bulk-beat-collection/<run-name>/
```

Expected bulk outputs:

- Per-beat JSON exports.
- Per-beat Markdown summaries.
- `all-beat-journalists.csv`.
- `all-beat-journalists-deduped.csv`.
- `summary-all.json`.
- `summary-all.md`.
- At least `800` collected journalists per selected beat.
- Raw row count per selected beat.
- Deduped profile count per selected beat.
- Written exception note if the `800` minimum is not met.
- Collection log entries.

Bulk quality rules:

- Treat `800` collected journalists per selected beat as the minimum acceptable target.
- Use multiple Boolean queries per selected beat.
- Deduplicate by Muck Rack profile URL.
- Deduplicate by journalist name and outlet when profile URL is missing.
- Preserve original query and beat fields.
- Preserve source result count if visible.
- Record shortfalls honestly.
- Treat any result below `800` as blocked unless the user grants a written exception.
- If the run is interrupted, resume from the partial output folder.
- After a resumed run, rebuild combined CSV and `summary-all.*` from the full per-beat JSON set.
- Do not treat a resumed folder-level summary as final until it is rebuilt.

## Bulk Output Data Dictionary
Bulk CSV and JSON outputs should preserve enough data for later review.

Required fields where available:

```text
selected_angle
selected_beat
query_group
query_string
query_pass_number
source_platform
collection_date
journalist_name
outlet_name
role_or_title
primary_beat
secondary_beats
location
outlet_scale
muck_rack_profile_url
author_page_url
recent_article_url
recent_article_title
recent_article_date
contact_status
source_result_count
raw_rank
dedupe_key
quality_status
rejection_reason
notes
```

Field rules:

- `selected_angle` must match `05-beats.md`.
- `selected_beat` must match the selected beat being collected.
- `query_group` should identify which acquisition pool found the row.
- `query_string` must preserve the actual Boolean query.
- `query_pass_number` should show the order of search attempts.
- `dedupe_key` should prefer Muck Rack profile URL.
- `quality_status` should be `valid`, `backup`, `manual-review`, or `reject`.
- `rejection_reason` is required when `quality_status` is `reject`.

Do not destroy raw fields during cleanup. Add reviewed fields instead of overwriting original data.

## Data Lifecycle
Keep raw, processed, deduped, reviewed, and handoff data separate.

### Raw Layer
Purpose:

- Preserve exactly what was collected.

Rules:

- Do not edit raw exports.
- Do not delete raw rows during cleanup.
- Do not overwrite raw exports with reviewed versions.
- Store source query, result count, date, and source platform.

### Processed Layer
Purpose:

- Normalize fields for dedupe and QA.

Rules:

- Normalize profile URLs.
- Normalize journalist names.
- Normalize outlet names.
- Add selected angle and selected beat fields.
- Add dedupe keys.
- Add quality status.

### Deduped Layer
Purpose:

- Produce one usable row per unique journalist/profile.

Rules:

- Prefer profile URL as the dedupe key.
- Merge notes from duplicate rows.
- Keep the strongest evidence.
- Preserve all source queries in notes where useful.

### Reviewed Layer
Purpose:

- Decide which candidates are approved, backup, manual-review, or reject.

Rules:

- Add priority score.
- Add tier.
- Add personalization note.
- Add contact status.
- Add rejection reason when rejected.

### Handoff Layer
Purpose:

- Give Stage 06 only clean, explainable inputs.

Rules:

- Include count table.
- Include source evidence.
- Include selected angle metadata.
- Include approved candidates.
- Include shortfalls and exceptions.
- Keep full bulk pool available for audit.

Data lifecycle checkpoint:

- Raw exports still exist.
- Processed outputs preserve raw source fields.
- Deduped outputs can be traced to raw rows.
- Reviewed outputs include score and status.
- Handoff notes can be read without opening every raw file.

If a selected beat cannot reach 800:

1. Add topic synonyms.
2. Add beat synonyms.
3. Add county terms.
4. Add city and metro terms.
5. Add state terms.
6. Add local outlet names.
7. Add agency terms.
8. Add adjacent but still relevant sub-beats.
9. Rerun only the shortfall beat.
10. Record the final shortfall if Muck Rack exposes fewer than the target.

## Bulk Resume Protocol
Use this when a bulk run is interrupted, stalls, or finishes only part of the selected beat.

Before resuming:

1. Inspect the existing run folder.
2. Identify completed per-beat JSON files.
3. Identify incomplete checkpoint files.
4. Identify whether `all-beat-journalists.csv` reflects the full run or only the resumed segment.
5. Identify whether `summary-all.md` and `summary-all.json` were rebuilt after the interruption.

Resume rules:

- Resume from the next unfinished beat or query pass.
- Do not rerun completed beats unless the prior output is corrupt.
- Do not overwrite a good run folder without a reason.
- Save a new run folder if the resume is experimental.
- If one beat is weak, rerun only that beat with expanded Boolean passes.
- After resuming, rebuild combined outputs from all per-beat JSON files.

Required rebuild outputs:

```text
all-beat-journalists.csv
all-beat-journalists-deduped.csv
summary-all.json
summary-all.md
```

Resume checkpoint:

- Combined CSV includes all completed per-beat JSON outputs.
- Deduped CSV has one row per profile URL when profile URL exists.
- `summary-all.md` reflects the full selected-angle run.
- Shortfalls are documented.
- The collection log states what was resumed and what was rebuilt.

## Shortfall Handling Protocol
A shortfall is not a completed result. It is a blocker unless the user gives an explicit written exception. The operator may report a shortfall only after a serious expansion attempt.

Shortfall causes to check:

- Query too narrow.
- Beat label mismatch.
- Geography too narrow.
- Muck Rack filter too restrictive.
- People search not selected.
- Verification or login page blocking results.
- Result count parser or automation issue.
- Duplicate-heavy result set.
- Topic genuinely has fewer relevant journalists.

Shortfall recovery steps:

1. Remove overly strict filters.
2. Add Boolean synonym passes.
3. Add county, metro, and state terms.
4. Add local outlet names.
5. Add agency/source terms.
6. Add adjacent beats.
7. Use SERP to discover alternate outlet and beat language.
8. Rerun the shortfall query.
9. Deduplicate again.
10. Record final shortfall with the reason.

Do not report a shortfall as complete without documenting the attempted expansions.

Required shortfall report:

```text
Selected angle:
Selected beat:
Minimum target:
Final raw rows:
Final valid rows:
Final deduped profiles:
SERP queries attempted:
Muck Rack Boolean passes attempted:
Advanced filters used:
Geography expansions attempted:
Outlet expansions attempted:
Agency/source expansions attempted:
Adjacent beat expansions attempted:
Noise-control terms used:
Why the target remains blocked:
Recommended next action:
User exception requested:
```

## Source Order
Use sources in this priority order:

1. Confirmed selected angle in `05-beats.md`.
2. Selected angle summary.
3. Google SERP in Debug Chrome.
4. Muck Rack people search in Debug Chrome.
5. Muck Rack journalist profiles.
6. Muck Rack recent articles.
7. Outlet author pages.
8. Outlet staff pages.
9. Recent topic-relevant articles.
10. Public contact pages.
11. Newsroom tips pages.
12. Journalist personal sites or public portfolios.
13. LinkedIn, X/Twitter, Bluesky, or other social profiles only for beat verification or public contact context.
14. Existing campaign source files only if they clearly match the current selected angle.

Do not rely on old campaign outputs when current selected-angle sources can be collected.

## Outlet Review Instructions
Use outlet pages to verify that a journalist is not only a keyword match.

Review:

- Author bio.
- Role/title.
- Beat label.
- Recent article archive.
- Topic relevance.
- Geography relevance.
- Outlet audience.
- Staff page.
- Newsroom contact page.
- Newsletter ownership.
- Social/profile links.
- Tips/corrections page when individual contact is unavailable.

Record findings in:

```text
selected-angle/outlet-page-notes.md
```

Outlet page checkpoint:

- Each approved journalist has at least one profile, article, Muck Rack, or outlet-page proof point.
- Local candidates have local outlet or local coverage proof.
- County candidates have county, city, metro, or state relevance.
- National candidates have national outlet, national beat, or nationally relevant coverage proof.
- Trade candidates have trade-publication or industry-beat proof.

## Contact Review Rules
Contact data must be verified and conservative.

Allowed contact statuses:

- `verified email`
- `public contact form`
- `outlet tips email`
- `Muck Rack contact available`
- `social only`
- `data unavailable`
- `do not contact`

Do not:

- Invent email addresses.
- Guess email formats.
- Use an outlet-wide email pattern unless the outlet publicly confirms it and the individual journalist is still active there.
- Treat an old article byline as current employment without verification.
- Add private or scraped personal contact data without a clear public source.

Record in:

```text
selected-angle/contact-review-notes.md
```

Contact checkpoint:

- Every contact status has a source or a reason.
- Missing email is marked `data unavailable`.
- Unverified inferred emails are not used.
- If only Muck Rack contact access exists, mark `Muck Rack contact available`.
- If only newsroom tips are available, mark `outlet tips email`.

## Candidate Inclusion Criteria
Include a journalist when at least one strong proof point exists.

Strong proof points:

- Muck Rack profile lists the selected beat or a close beat.
- Recent articles cover the selected topic.
- Outlet role clearly matches the selected beat.
- Local, county, state, regional, national, or trade geography matches the selected angle.
- Audience alignment is clear.
- Prior coverage suggests the journalist can use the data, trend, study, survey, policy, consumer, legal, health, business, local, or industry hook.

Exclude candidates when:

- Beat is unrelated.
- Geography is wrong.
- Outlet scale is wrong.
- No current role can be verified.
- Profile appears stale.
- Coverage is too old or unrelated.
- Candidate is an editor with no relevant desk reason.
- Candidate covers only sports, entertainment, opinion, or lifestyle unless the selected angle fits that beat.
- Candidate came from an old campaign and does not match the current selected angle.

## Candidate Scoring Rubric
Score candidates before they enter `06-journalist-intel.md`.

Use a 100-point scale:

- Beat fit: 30 points.
- Selected-angle relevance: 25 points.
- Recent coverage match: 20 points.
- Geography or outlet-scale fit: 15 points.
- Contact/outreach readiness: 10 points.

Priority tiers:

- `Tier 1`: 85 to 100. Strong outreach candidate.
- `Tier 2`: 70 to 84. Good candidate with some missing context.
- `Tier 3`: 55 to 69. Possible backup only.
- `Reject`: below 55, stale, wrong beat, wrong geography, duplicate, or no usable proof.

Stage 06 should use Tier 1 first, then Tier 2 if more candidates are needed. Tier 3 belongs in a backup or manual-review section, not the primary outreach table.

## Required Candidate Fields
For every approved candidate, capture:

- Journalist name.
- Outlet.
- Current role or title.
- Primary beat.
- Secondary beat if useful.
- Geography.
- Outlet scale.
- Muck Rack profile URL.
- Public profile or author-page URL.
- Relevant article URL or coverage proof.
- Why this journalist fits the selected angle.
- Contact status.
- Contact source.
- Priority score.
- Priority tier.
- Personalization note.
- Search query that found the candidate.
- Date verified.

For bulk collection, raw rows may contain fewer fields, but the final Stage 06 reviewed candidate pool must be enriched with these fields.

## Candidate Table Schema
Use this schema for manual review, hybrid review, and Stage 06 handoff notes.

```text
Rank:
Journalist:
Outlet:
Role:
Primary Beat:
Secondary Beat:
Geography:
Outlet Scale:
Selected Angle Fit:
Muck Rack Profile:
Author Page:
Relevant Coverage:
Coverage Date:
Contact Status:
Contact Source:
Priority Score:
Priority Tier:
Personalization Note:
Search Query Source:
Date Verified:
Review Status:
```

Review status values:

- `approved for Stage 06`
- `backup only`
- `manual review needed`
- `reject`

The final Stage 06 primary journalist table should include only candidates marked `approved for Stage 06`, unless the user asks for backup candidates.

## Deduplication Protocol
Deduplicate before Stage 06.

Deduplication order:

1. Exact Muck Rack profile URL.
2. Normalized Muck Rack profile URL without tracking parameters.
3. Journalist name plus outlet.
4. Journalist name plus author page.
5. Journalist name plus recent article byline.
6. Email address only if verified and public.

When duplicates conflict:

- Keep the row with the strongest evidence.
- Keep the most current outlet.
- Keep the row with the strongest selected-angle fit.
- Merge useful notes.
- Preserve alternate outlet or article data in the notes field.
- Log major merges in `collection-log.md`.

Do not dedupe different journalists with the same name unless outlet, profile, or article evidence confirms they are the same person.

## Candidate Acceptance Matrix
Use this matrix to decide whether a candidate enters the primary table.

| Evidence Level | Beat Fit | Geography Fit | Contact Status | Decision |
|----------------|----------|---------------|----------------|----------|
| Strong profile plus relevant article | Strong | Strong | Any honest status | Approve |
| Strong profile, no article | Strong | Strong | Any honest status | Approve or backup |
| Article proof, no Muck Rack profile | Strong | Strong | Any honest status | Approve if source is current |
| Strong profile, weak geography | Strong | Weak | Any honest status | Backup unless national angle |
| Weak profile, strong article | Medium | Strong | Any honest status | Manual review |
| Old article only | Unknown | Unknown | Any status | Reject or manual review |
| Name only | Unknown | Unknown | Any status | Reject |
| Guessed email only | Any | Any | Guessed | Reject contact data |

## Personalization Note Standard
Every Stage 06-ready candidate needs a usable personalization note.

Good personalization notes:

- Mention a recent relevant article.
- Mention a beat focus.
- Mention the outlet audience.
- Mention why this selected angle matches the journalist's readers.
- Mention a geography link.
- Mention a policy, consumer, business, health, legal, or local-impact link.

Weak personalization notes:

- `covers this topic`
- `good fit`
- `Muck Rack result`
- `journalist`
- `local reporter`

Weak notes must be expanded before Stage 08.

Example strong note:

```text
Recently covered county transportation safety and local crash trends, making this selected angle relevant because it adds a fresh data point tied to the same reader concern.
```

## Collection Log Requirements
Record every material action in:

```text
selected-angle/collection-log.md
```

Each log entry should include:

- Date.
- Time if useful.
- Operator or agent.
- Browser state.
- Source searched.
- Query used.
- Boolean logic used.
- Advanced filters used.
- Result count.
- Output file created.
- Candidate count kept.
- Candidate count rejected.
- Shortfall or blocker.
- Next action.

Example:

```text
2026-04-29 - Debug Chrome verified on port 9222 - Muck Rack people search - Query: ("traffic safety" OR "road safety") AND (Texas OR "Harris County") - Filters: People, Texas, transportation/public safety - 312 visible people - saved to bulk-beat-collection/run-name/summary.md - shortfall below 800, adding Houston, Bexar County, and local outlet expansion.
```

## Rejected Source Log
Use:

```text
source-files/journalist-intel/rejected-or-stale-sources.md
```

Log sources that are:

- From another campaign.
- From another selected angle.
- From the wrong geography.
- From the wrong beat.
- Duplicates.
- Stale.
- Unsupported.
- Social-only with no beat proof.
- AI-generated or unverified.
- Search noise.

Never silently discard questionable sources if they could confuse a later agent. Log why they were rejected.

## Source Reliability Tiers
Classify sources so Stage 06 knows how much confidence to place in each proof point.

### Tier A: Strong Source
Use confidently.

Examples:

- Current Muck Rack profile.
- Current outlet author page.
- Current outlet staff page.
- Recent bylined article on the outlet site.
- Public contact page from the outlet.
- Public Muck Rack contact availability.

### Tier B: Useful Source
Use with support from another source.

Examples:

- SERP result pointing to a profile.
- Recent article indexed by Google but not yet reviewed on the outlet page.
- Public social profile that confirms beat or outlet.
- Newsletter author page.
- Trade publication contributor page.

### Tier C: Weak Source
Do not use alone for primary outreach.

Examples:

- Old article with no current role.
- Social bio without current outlet evidence.
- Generic profile without recent activity.
- Search snippet without opening the source.
- Third-party directory with no current confirmation.

### Reject
Do not use.

Examples:

- Wrong campaign.
- Wrong geography.
- Wrong beat.
- Duplicated stale profile.
- Guessed contact.
- AI-generated profile content.
- Unverified scraped data.

Source reliability checkpoint:

- Every Tier 1 candidate has at least one Tier A source or two strong Tier B sources.
- Tier C sources are used only for manual-review context.
- Reject sources are logged in `rejected-or-stale-sources.md`.

## Stage 06 Readiness Scorecard
Before drafting Stage 06, score the collection package.

Use this pass/fail scorecard:

| Area | Pass Standard |
|------|---------------|
| Gate | `Selection status: confirmed` after at least one user-selected angle, with one active selected angle package clear for the next run |
| Browser | Debug Chrome launched and verified on `9222` |
| SERP | Search notes saved with queries and useful results |
| Muck Rack | Boolean searches and advanced filters used or blocker documented |
| Query Plan | `selected-angle-queries.json` includes SERP, Muck Rack, filters, and expansion queries |
| Minimum Volume | At least `800` journalists collected per selected beat, or explicit written user exception |
| Count Reporting | Raw row count and deduped profile count reported separately |
| Candidate Proof | Every approved candidate has source proof |
| Beat Fit | Every approved candidate fits selected beat or close beat |
| Geography Fit | Every approved candidate fits selected geography or selected outlet scale |
| Contact Status | Every approved candidate has honest contact status |
| Dedupe | Duplicate candidates removed or merged |
| Rejections | Weak or stale sources logged |
| Bulk Resume | Combined outputs rebuilt after any resume |
| Stage 06 Handoff | Enough evidence exists to explain why each journalist fits |

Readiness decision:

- `Ready`: all critical areas pass, including the `800`-per-beat minimum or a written user exception.
- `Ready with limitations`: minor gaps exist, but limitations are logged and candidates still have proof.
- `Not ready`: selected angle mismatch, no proof, no browser verification, guessed contact data, broad unselected-angle collection, or fewer than `800` collected journalists per selected beat without written user exception.

Critical areas:

- Gate.
- Browser.
- Query plan.
- Minimum volume.
- Count reporting.
- Candidate proof.
- Contact status.
- Dedupe.
- Stage 06 handoff.

If any critical area fails, do not draft Stage 06.

## Operator Status Report Template
When reporting progress to the user or orchestrator, use this format.

```text
Selected angle:
Collection lane:
Debug Chrome status:
SERP status:
Muck Rack status:
Queries completed:
Minimum target:
Raw journalists collected per beat:
Deduped profile count per beat:
800-per-beat gate status:
User exception status:
Candidates approved:
Candidates rejected:
Bulk output status:
Shortfalls:
Blockers:
Next action:
```

Status report rules:

- Be honest about blockers.
- Do not say Muck Rack collection is done if verification blocked the search.
- Do not say 800 were collected if the deduped count is lower.
- Separate raw rows from deduped profiles.
- Separate collected candidates from approved outreach candidates.
- If the `800`-per-beat gate is not met, mark the status as blocked unless the user has granted an explicit written exception.

## Sub-Agent Handoff Protocol
Use this protocol when another agent or sub-agent receives this work.

### Handoff Into Collection
The collector must receive:

- job slug,
- selected angle,
- selected beat or beat group,
- selected geography,
- selected outlet scale,
- selected collection lane,
- minimum target of `800` per selected beat,
- current `05-beats.md` path,
- current source folder path,
- known Muck Rack access status,
- any user exception already granted.

If any required field is missing, the collector must stop.

### Handoff From SERP To Muck Rack
The SERP operator must pass:

- useful outlet names,
- useful journalist names,
- useful geography phrases,
- useful beat phrases,
- useful agency/source terms,
- irrelevant terms to exclude,
- SERP queries that worked,
- SERP queries that failed.

The Muck Rack operator must convert these into Boolean query passes.

### Handoff From Bulk Collection To Review
The bulk collector must pass:

- raw CSV,
- deduped CSV,
- per-beat JSON,
- summary-all.md,
- summary-all.json,
- query file,
- shortfall notes,
- resume notes,
- count table.

The reviewer must not begin scoring until dedupe and count reporting are complete.

### Handoff From Review To Stage 06
The reviewer must pass:

- approved candidates,
- backup candidates,
- manual-review candidates,
- rejected rows with reasons,
- priority scores,
- contact statuses,
- personalization notes,
- selected angle metadata,
- proof that the `800` gate was met or exception was approved.

Stage 06 must not accept a handoff that lacks count proof.

## Communication Rules During Long Collection
Long Muck Rack collection can look stalled. Status updates must be precise.

Every progress update should include:

- current beat,
- target count,
- raw rows collected,
- deduped profiles,
- current query pass,
- current blocker if any,
- next action.

Good update:

```text
Selected beat: transportation safety. Target: 800. Raw rows: 642. Deduped profiles: 511. Current pass: county and metro expansion. Next: add local outlet query pass.
```

Bad update:

```text
Still working.
```

If a run is interrupted, the resume update must include:

- last completed beat,
- last completed query pass,
- partial output folder,
- files already present,
- next unfinished item,
- rebuild plan for combined outputs.

## Phase Checkpoints
Use these checkpoints before moving forward.

### Checkpoint 1: Gate Ready
Pass only if:

- `Selection status: confirmed`.
- One selected angle.
- One selected beat or selected beat group.
- One selected geography.
- One selected collection lane.
- Selected angle copied to `selected-angle-summary.md`.

### Checkpoint 2: Browser Ready
Pass only if:

- Debug Chrome is launched.
- Port `9222` responds.
- Google SERP opens.
- Muck Rack opens.
- Muck Rack is logged in or the user has cleared login/verification.

### Checkpoint 3: Query Plan Ready
Pass only if:

- `selected-angle-queries.json` exists.
- SERP queries exist.
- Muck Rack Boolean queries exist.
- Advanced filters are listed.
- Expansion queries exist for shortfall recovery.

### Checkpoint 4: SERP Discovery Complete
Pass only if:

- SERP notes are saved.
- Useful outlets are identified.
- Useful reporter names are identified where available.
- Local, county, state, regional, national, or trade search paths match the selected angle.
- SERP findings are used to improve Muck Rack queries.

### Checkpoint 5: Muck Rack Discovery Complete
Pass only if:

- Muck Rack Boolean searches were run.
- Advanced filters were applied or their absence was logged.
- Profiles were captured or exported where possible.
- Result counts and shortfalls were recorded.
- Raw outputs were saved under the current job.

### Checkpoint 6: Candidate Validation Complete
Pass only if:

- Each approved candidate has proof.
- Each approved candidate has a priority score.
- Each approved candidate has a contact status.
- Duplicates are removed.
- Weak candidates are logged or moved to backup.

### Checkpoint 7: Stage 06 Ready
Pass only if:

- Selected angle metadata matches `05-beats.md`.
- No unselected angles are included.
- Muck Rack, SERP, outlet, profile, and contact notes are saved.
- At least `800` journalists were collected per selected beat, or the user gave an explicit written exception.
- Raw row count and deduped profile count are both reported.
- Bulk outputs are deduped if bulk collection was used.
- Resumed bulk outputs have rebuilt combined CSV and `summary-all.*`.
- Stage 06 can explain why each journalist fits the selected angle.

## Stop Conditions
Stop immediately if:

- `Selection status` is not exact `confirmed`.
- More than one angle is selected.
- Selected angle metadata conflicts across files.
- Debug Chrome cannot launch.
- Port `9222` cannot be reached.
- Muck Rack is blocked by verification.
- Muck Rack login is unavailable.
- Current source files appear to belong to another campaign.
- A bulk lane has no query plan.
- The run has fewer than `800` collected journalists per selected beat and there is no written user exception.
- The deduped count is below `800` and the shortfall has not been escalated to the user.
- Candidate rows contain names without outlet, beat, profile, or proof.
- Contact data is being guessed.
- The user asks to review before continuing.

When stopped, write the blocker into `collection-log.md` and wait for correction.

## Final Completion Manifest
Before Stage 06 begins, create or update a manifest in `collection-log.md` or a separate `selected-angle-completion-manifest.md`.

Manifest template:

```text
Job slug:
Selected angle:
Selected priority number:
Selected category:
Selected beat:
Selected geography:
Selected outlet scale:
Selected collection lane:
Minimum target per beat: 800
Target non-negotiable: true
Debug Chrome launched:
Debug Chrome 9222 verified:
Google SERP completed:
Muck Rack completed:
Muck Rack blocker:
SERP query count:
Muck Rack Boolean pass count:
Advanced filters used:
Raw rows by beat:
Valid rows by beat:
Deduped profiles by beat:
Rejected rows by beat:
Manual-review rows by beat:
Gate status by beat:
Written user exception:
Bulk run folder:
Combined CSV path:
Deduped CSV path:
summary-all.md path:
summary-all.json path:
SERP notes path:
Outlet notes path:
Contact notes path:
Rejected source log path:
Ready for Stage 06:
Reviewer:
Date:
```

Manifest rules:

- Do not mark `Ready for Stage 06: yes` unless the `800` target is met or a written user exception exists.
- Do not leave count fields blank.
- Do not mark Muck Rack completed if verification blocked the run.
- Do not hide shortfalls inside notes.
- Always separate raw rows from deduped profiles.

## Handoff To Stage 06
When collection is complete, Stage 06 should receive:

- Confirmed selected angle metadata.
- Selected collection lane.
- SERP search notes.
- Muck Rack exports or captures.
- Raw count per selected beat.
- Deduped profile count per selected beat.
- Confirmation that the `800`-per-beat requirement was met, or the written user exception allowing a lower count.
- Profile notes.
- Outlet-page notes.
- Contact-review notes.
- Bulk run summary if used.
- Deduped candidate list.
- Rejected/stale source log.
- Known shortfalls.
- Manual-review needs.

Stage 06 must transform these inputs into `06-journalist-intel.md`. Stage 06 must not restart broad collection unless this file or the collection log shows the selected-angle collection is incomplete.

## Definition Of Done
This selected-angle collection bridge is complete only when:

- `05-beats.md` has exact `Selection status: confirmed`.
- Debug Chrome was launched and verified.
- SERP research was performed in Debug Chrome.
- Muck Rack research was performed in Debug Chrome when Muck Rack was available.
- Boolean search was used.
- Advanced search or advanced filters were used, or their unavailability was logged.
- Selected angle fields were copied into `selected-angle-summary.md`.
- Query plan was saved in `selected-angle-queries.json`.
- SERP notes were saved.
- Muck Rack outputs were saved or the Muck Rack blocker was documented.
- At least `800` journalists were collected per selected beat, or the user provided an explicit written exception.
- Raw row count and deduped profile count were reported separately.
- Outlet notes were saved.
- Contact notes were saved.
- Collection log was updated.
- Weak, stale, duplicate, wrong-angle, wrong-beat, and wrong-geography sources were rejected.
- Bulk outputs were deduped and rebuilt after resume if applicable.
- Final candidate set is ready for `06-journalist-intel.md`.
