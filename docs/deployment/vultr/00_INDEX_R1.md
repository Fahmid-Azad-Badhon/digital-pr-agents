# Vultr Deployment Preparation Package — Master Index (R1)

Batch: `DPR-VULTR-PREPARATION-AND-WHOLE-PROJECT-LOCAL-DEBUGGING-R1`
Provider target: `VULTR_WINDOWS_VPS`
Status: `PREPARATION_ONLY — NO SERVER CREATED`

## Purpose

This index lists every Vultr preparation document and future-use script generated for the
DPR Debugging / Digital PR Agents project. This is a local preparation package only. No
Vultr account, server, or billing resource has been created or authorized.

## Documents

| # | File | Purpose |
|---|------|---------|
| 00 | `00_INDEX_R1.md` | This master index |
| 01 | `01_AWS_PATH_PAUSED_AND_PROVIDER_CHANGE_DECISION_R1.md` | Records the AWS pause and Vultr provider decision |
| 02 | `02_DPR_ARCHITECTURE_COMPATIBILITY_AUDIT_FOR_VULTR_R1.md` | Audits DPR architecture against a Vultr Windows VPS |
| 03 | `03_VULTR_REQUIREMENTS_MATRIX_R1.md` | Minimum requirements matrix for the Vultr deployment |
| 04 | `04_VULTR_SIZING_AND_COST_WORKSHEET_R1.md` | Sizing guidance and cost worksheet (placeholders) |
| 05 | `05_VULTR_ACCOUNT_AND_CONSOLE_CHECKLIST_R1.md` | Account and console preparation checklist |
| 06 | `06_VULTR_MANUAL_DEPLOYMENT_RUNBOOK_R1.md` | Click-by-click manual deployment runbook + result form |
| 07 | `07_ACCESS_AND_FIREWALL_SECURITY_PLAN_R1.md` | Access model and firewall security plan |
| 08 | `08_STORAGE_AND_D_DRIVE_PLAN_R1.md` | Storage and D: drive plan + initialization script draft |
| 09 | `09_WINDOWS_BASELINE_HARDENING_PLAN_R1.md` | Windows baseline hardening plan + read-only inspection script |
| 10 | `10_SOFTWARE_INSTALLATION_GATE_PLAN_R1.md` | Future software installation gate plan |
| 11 | `11_SECRETS_AND_ENVIRONMENT_PLAN_R1.md` | Secrets and environment variable plan |
| 12 | `12_REPOSITORY_TRANSFER_AND_LAYOUT_PLAN_R1.md` | Repository transfer and target layout plan |
| 13 | `13_APP_BUILD_AND_RUNTIME_PLAN_R1.md` | Application build and runtime plan |
| 14 | `14_BACKUP_AND_RESTORE_PLAN_R1.md` | Backup and restore plan |
| 15 | `15_MONITORING_AND_OPERATIONS_PLAN_R1.md` | Monitoring and operations plan |
| 16 | `16_VULTR_RISK_REGISTER_R1.md` | Risk register for the Vultr path |
| 17 | `17_FUTURE_VULTR_GATE_PROMPTS_R1.md` | Skeleton prompts for future Vultr gates |
| 18 | `18_VULTR_EXECUTION_MINDMAP_R1.md` | Master execution mind map |
| 19 | `19_USER_VULTR_NEXT_ACTION_CHECKLIST_R1.md` | User's next-action checklist |
| 20 | — (reserved) | — |

## Scripts

| File | Purpose | Executable now? |
|------|---------|-----------------|
| `ops/vultr/Initialize-DPR-DDrive.ps1` | Future D: drive initialization on the Vultr VM | NO — future-use only |
| `ops/vultr/Inspect-Windows-Baseline.ps1` | Future read-only Windows baseline inspection | NO — future-use only |

## State Markers

```
AWS_PATH=PAUSED
STACK_DEPLOYED=NO
PROVIDER_TARGET=VULTR_WINDOWS_VPS
VULTR_ACCOUNT_ACCESSED=NO
VULTR_SERVER_CREATED=NO
```

## Next Action

Do not create a Vultr server until this preparation package is externally reviewed and
accepted, and the user explicitly authorizes the next Vultr manual deployment gate.
