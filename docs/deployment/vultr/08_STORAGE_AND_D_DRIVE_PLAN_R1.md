# Storage and D: Drive Plan — R1

Batch: `DPR-VULTR-PREPARATION-AND-WHOLE-PROJECT-LOCAL-DEBUGGING-R1`

## Purpose

Defines how the future Vultr Windows VM will provide a persistent `D:\` data disk with the
required `D:\Codex Folder` layout.

## Storage Strategy

The project depends on a persistent local data disk mapped to `D:`. Two options exist:

### Option A — Plan disk used as `D:`

- The VM's local disk is partitioned so that `D:` exists.
- Simpler, but a full instance re-provision also re-provisions the disk.
- Requires snapshots/backups to protect data.

### Option B — Attached Vultr Block Storage as `D:`

- A separate Block Storage volume is attached to the instance.
- The volume is initialized as `D:`.
- Decouples data from the instance lifecycle.
- Recommended for the project's persistence requirements.

## D: Drive Layout Requirement

After disk initialization the following must exist:

```
D:\Codex Folder
D:\Codex Folder\digital-pr-agents
D:\Codex Folder\digital-pr-agents\dashboard
```

## Future-Use Script

A draft script is provided at `ops/vultr/Initialize-DPR-DDrive.ps1`. It is a **future-use**
script only and is **not executed in this batch**.

### Script Behavior (documented)

1. Check whether `D:` already exists.
   - If it does, verify the volume, create `D:\Codex Folder`, and exit 0.
2. Find the largest RAW disk.
   - If none, exit 1 with a clear error.
3. Initialize the disk as GPT.
4. Create partition `D:` using the maximum size.
5. Format `D:` as NTFS with label `DPRData`.
6. Create `D:\Codex Folder`.
7. Print final volume and folder state.

### Script Header

```powershell
# DPR future-use script only.
# DO NOT EXECUTE IN THIS BATCH.
# Run only after Vultr server creation, storage attachment verification, and explicit D-drive initialization gate authorization.
```

## Requirements Before Running the Script

- Vultr server created.
- Storage (plan disk or Block Storage) attached and verified visible.
- D-drive initialization gate authorized.
- Administrator access to the VM via the approved access model.

## Notes

- Never initialize or format a disk without verifying it is the correct target disk.
- Confirm the disk size matches the expected storage before formatting.
- Keep backups/snapshots enabled so data is recoverable before any destructive disk
  operation.
