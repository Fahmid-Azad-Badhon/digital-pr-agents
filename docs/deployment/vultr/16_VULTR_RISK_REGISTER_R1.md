# Vultr Risk Register — R1

Batch: `DPR-VULTR-PREPARATION-AND-WHOLE-PROJECT-LOCAL-DEBUGGING-R1`

## Purpose

Registers risks for the Vultr Windows VPS deployment path. This is a planning document; no
mitigation is executed in this batch.

## Risk Register

| # | Risk | Severity | Mitigation | Status |
|---|------|----------|------------|--------|
| 1 | Wrong provider path (AWS vs Vultr confusion) | High | Provider decision recorded; AWS path paused | Mitigated |
| 2 | Cost misunderstanding | High | Cost worksheet with console placeholders | Deferred |
| 3 | Windows license surcharge not expected | High | Confirm surcharge in console before deploy | Deferred |
| 4 | Public RDP exposure (0.0.0.0/0) | Critical | Firewall plan restricts RDP to /32 or Tailscale | Deferred |
| 5 | RDP lockout | High | Emergency web console path documented | Deferred |
| 6 | Wrong Windows plan selected | Medium | Requirements matrix; confirm in console | Deferred |
| 7 | Plan too small | Medium | Recommended 4 vCPU / 16 GB / 250 GB | Deferred |
| 8 | D: drive missing | High | D: init script drafted | Deferred |
| 9 | Block Storage not attached | High | Storage plan; verify before init | Deferred |
| 10 | Block Storage not formatted | High | D: init script formats GPT/NTFS | Deferred |
| 11 | `D:\Codex Folder` missing | High | D: init script creates it | Deferred |
| 12 | Hardcoded path failure | High | Repo must live at exact expected path | Deferred |
| 13 | Browser automation instability | High | Chrome install + localhost-only debug ports; validation gate | Deferred |
| 14 | Chrome setup risk | Medium | Software installation gate plan | Deferred |
| 15 | Secrets exposure | Critical | Secrets plan; never paste/inspect | Deferred |
| 16 | Google OAuth deferred | Medium | Dedicated future OAuth gate | Deferred |
| 17 | No backups | High | Backup plan; enable Vultr backups | Deferred |
| 18 | No restore test | High | Restore test mandatory before production | Deferred |
| 19 | DNS/TLS premature | Medium | Deferred until reverse proxy gate | Deferred |
| 20 | Direct app port exposure | Critical | App bound to 127.0.0.1; firewall denies 3002 | Deferred |
| 21 | PM2 persistence issue | Medium | PM2 gate with reboot persistence test | Deferred |
| 22 | Nginx Windows service issue | Medium | Nginx gate with service config test | Deferred |
| 23 | No rollback plan | Medium | Snapshots/backups before changes | Deferred |
| 24 | User unfamiliar with Vultr | Medium | Beginner runbook + checklists | Deferred |
| 25 | Untracked repo files confusion | Low | Document current untracked files | Present |

## Not Done in This Batch

No mitigation action is executed. All mitigations are future-gated.
