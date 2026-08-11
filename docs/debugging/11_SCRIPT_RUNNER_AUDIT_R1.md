# Script Runner Audit — R1

- **Report**: `11_SCRIPT_RUNNER_AUDIT_R1.md`
- **Scope**: `scriptRunner.ts` orchestration of repo `.cmd` scripts, action allow-listing, run-mode gating, and script-path resolution.
- **Result**: `PASS` — mapping consistent with repo scripts; dry-run blocking verified; no script executed this batch.

---

## 1. Script Action Map (`dashboard/src/lib/scriptRunner.ts`)

| Action | Target script | Args | Timeout |
|---|---|---|---|
| `validate_stage` | `validate-stage.cmd` | `campaignId stageFile` | 120s |
| `draft_study_input` | `draft-study-input.cmd` | `campaignId` | 300s |
| `import_muckrack_output` | `import-muckrack-output.cmd` | `campaignId [--all]` | 300s |
| `draft_journalist_intel` | `draft-journalist-intel.cmd` | `campaignId` | 300s |
| `draft_pitch_draft` | `draft-pitch-draft.cmd` | `campaignId` | 300s |
| `export_google_doc` | `export-google-doc.cmd` | `campaignId [title]` | 300s |

- `isScriptAction()` whitelists the six actions above.
- All six scripts exist in `scripts/` (verified in report 02 and via repo inventory; `.cmd` wrappers call `.js` via `%~dp0` and optionally a portable Node at `..\..\.tools\node-v24.15.0-win-x64\node.exe` with fallback to `node` on PATH).

## 2. Path Resolution

- Script path = `path.join(SCRIPTS_ROOT, spec.fileName)` where `SCRIPTS_ROOT = path.join(process.cwd(), '..', 'scripts')` (requestGuard).
- Child process spawned with `cwd: REPO_ROOT` (repo root, i.e., `.../digital-pr-agents`), `shell: true`, `windowsHide: true`, inheriting `process.env`.
- `fs.access(scriptPath)` before spawn ensures the script exists; missing script → rejected promise.

## 3. Run-Mode Gating

- `SAFE_SCRIPTS` (allow in dry-run): `validate_stage`, `draft_study_input`, `draft_journalist_intel`, `draft_pitch_draft`.
- `BLOCKED_EXTERNAL_SCRIPTS` (blocked in dry-run): `import_muckrack_output`, `export_google_doc` (external/browser/Docs side effects).
- When run mode blocks external action: blocked actions and any action not in `SAFE_SCRIPTS` throw `Dry run: external script blocked: <action>` **before** any spawn.
- Default `RUN_MODE` from env is `dry_run` in the vitest config; in production the mode comes from `RUN_MODE` env.

## 4. Spawn Safety

| Control | Value |
|---|---|
| Command construction | `spawn(`"${scriptPath}"`, args, { shell: true })` — script path is fixed by the action map (never user-controlled); `args` are built from validated payload (`campaignId` already sanitized by `assertValidCampaignId` at the route layer; `stageFile` by `sanitizeStageFile`; `title` is a free string passed as one argument). |
| Timeout | Per-action `timeoutMs`; on timeout `child.kill()` and reject. |
| Stdout/stderr | Captured and trimmed into result. |
| Exit code | Resolved with `child.on('close', code)`; non-number code → 1. |

## 5. Batch Execution Status

- No script action was executed this batch (run-mode is dry_run; all candidate actions either blocked or not invoked; API scripts route was not POSTed).

## 6. Findings Summary

| # | Finding | Classification |
|---|---|---|
| SR1 | Six-action whitelist matches existing `scripts/*.cmd` | `PASS` |
| SR2 | Dry-run blocks external scripts before spawn | `PASS` |
| SR3 | Per-action timeouts + kill on timeout | `PASS` |
| SR4 | No script executed this batch | `PASS` |
| SR5 | Script path fixed by map (not user-controllable) | `PASS` |
