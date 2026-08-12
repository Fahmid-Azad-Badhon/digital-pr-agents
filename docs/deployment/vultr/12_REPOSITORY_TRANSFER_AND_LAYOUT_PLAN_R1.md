# Repository Transfer and Layout Plan — R1

Batch: `DPR-VULTR-PREPARATION-AND-WHOLE-PROJECT-LOCAL-DEBUGGING-R1`

## Purpose

Defines how the repository will be transferred to the future Vultr Windows VM and the exact
target layout that preserves the project's path assumptions.

## Required Final Layout

```
D:\Codex Folder
D:\Codex Folder\digital-pr-agents
D:\Codex Folder\digital-pr-agents\dashboard
```

The dashboard depends on parent-directory access (`../scripts`, `../system`,
`../browser-tools`). The repository must live at exactly
`D:\Codex Folder\digital-pr-agents` so these references resolve.

## Transfer Options

### Option A — Git clone (recommended if repo is hosted privately)

1. Push the repo to a private remote (separate authorized gate).
2. On the VM: `git clone <private-repo-url> "D:\Codex Folder\digital-pr-agents"`
3. Use a deploy key or a short-lived PAT; never paste the token into chat.

### Option B — Zip transfer

1. On the local machine, create a zip of the repository **excluding** secrets, `node_modules`,
   `.next`, `logs`, and caches.
2. Copy the zip to the VM via an approved secure channel.
3. Extract to `D:\Codex Folder\digital-pr-agents`.

### Option C — Private repository deploy key

1. Generate a deploy key (no password).
2. Register the public key with the repo host.
3. Install the private key on the VM.
4. Clone on the VM.

### Option D — Manual copy

Manual file copy is acceptable only when the other options are unavailable. Exclude the
same sensitive/build artifacts as Option B.

## Exclusion List (for any transfer)

Manual transfer (zip/copy) must exclude local runtime state and secrets. Git
clone transfers only tracked files, but manual copies must be filtered:

```
.env
.env.*
node_modules/
.next/
logs/
dashboard/.next/
dashboard/node_modules/
dashboard/logs/
dashboard/data/
dashboard/reports/
dashboard/scratch/
dashboard/.diagnostics/
dashboard/tmp-diagnosis/
data/            # local runtime data (all except the tracked .gitkeep)
pitch-jobs/      # local campaign state
pitch-jobs-backup*/
Birth Injury Law/
.secrets/
browser-tools/profiles/
browser-tools/data/
browser-tools/logs/
browser-tools/screenshots/
data/google-token.json
any credential/secret files
```

On the server these are re-created as needed by the app or created manually at
the environment gate; they must not be copied from the local machine.
`dashboard/.env.local.example` IS tracked in Git and is the safe template to
copy to `.env.local` on the server (never copy the local `.env.local`).

## Post-Transfer Checks

- Confirm `D:\Codex Folder\digital-pr-agents` exists.
- Confirm `dashboard` subfolder exists.
- Run `git status` on the VM to confirm clean state.
- Confirm no secret files were transferred.

## Not Done in This Batch

No repository transfer or clone occurs. No remote push occurs.
