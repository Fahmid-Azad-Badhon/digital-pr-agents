# Windows Baseline Hardening Plan — R1

Batch: `DPR-VULTR-PREPARATION-AND-WHOLE-PROJECT-LOCAL-DEBUGGING-R1`

## Purpose

Defines the future Windows Server baseline hardening steps and provides a read-only
inspection script for a later, authorized gate.

## Hardening Topics (future gates)

1. Windows baseline validation — confirm OS version, build, updates.
2. Local firewall profiles — validate default state.
3. RDP policy — restricted to approved access model; disabled if not needed.
4. Local user accounts — validate no unexpected local users; rename/disable default admin.
5. Windows updates — install and confirm patch baseline.
6. Windows Defender — confirm real-time protection on.
7. PowerShell execution policy — confirm project scripts run with approved policy.
8. Audit logs — enable/confirm security event logging.

## Future-Use Read-Only Inspection Script

A draft script is provided at `ops/vultr/Inspect-Windows-Baseline.ps1`. It is **future-use
only** and is **not executed in this batch**.

### Script Header

```powershell
# DPR future-use read-only inspection script.
# DO NOT EXECUTE IN THIS BATCH.
```

### Inspections Performed (documented)

- `Get-ComputerInfo` — OS/hardware summary.
- `Get-Volume` — volume state.
- `Get-Disk` — disk state.
- `Get-NetFirewallProfile` — firewall profile state.
- `Get-Service TermService` — RDP service state.
- `Get-LocalUser` — local user accounts.

The script is read-only and performs no changes and prints no secrets.

## Not Done in This Batch

- No hardening changes are applied.
- No firewall changes are made.
- No accounts are modified.
