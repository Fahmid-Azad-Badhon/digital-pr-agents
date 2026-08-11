# Backup and Restore Plan — R1

Batch: `DPR-VULTR-PREPARATION-AND-WHOLE-PROJECT-LOCAL-DEBUGGING-R1`

## Purpose

Defines the future backup and restore strategy for the Vultr Windows VM.

## Backup Requirements

- Backup the persistent data disk (`D:\`): repository, campaign state, pitch-jobs, logs,
  and any database/data files.
- Prefer snapshots/backups at the storage level so the entire `D:` disk is recoverable.
- Vultr Backups are a simple built-in option; scheduled snapshots are an alternative.

## Recommended Retention (carried forward)

```
7d daily    — keep daily backups for 7 days
4w weekly   — keep weekly backups for 4 weeks
12m monthly — keep monthly backups for 12 months
```

Confirm the retention options supported by the chosen backup mechanism and adjust to
available settings.

## Restore Validation

- A restore test is mandatory before production use.
- A restore test means: recover a backup into a fresh/separate VM or volume, verify the
  dashboard builds/starts and campaign data is intact, then document the result.
- Do not treat backups as valid until a restore test has succeeded.

## Not Done in This Batch

No backup is created and no restore test is run.
