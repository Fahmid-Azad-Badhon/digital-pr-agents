# Software Installation Gate Plan — R1

Batch: `DPR-VULTR-PREPARATION-AND-WHOLE-PROJECT-LOCAL-DEBUGGING-R1`

## Purpose

Defines the future software installation gates for the Vultr Windows VM. Each item must be
its own separately authorized gate with validation. Nothing in this batch installs software.

## Future Gates (each independently authorized)

| # | Gate | Purpose | Validation |
|---|------|---------|------------|
| 1 | Windows baseline validation | Confirm OS, build, firewall, updates | `Inspect-Windows-Baseline.ps1` output |
| 2 | D: drive initialization | Create and format `D:` | `Initialize-DPR-DDrive.ps1` output |
| 3 | Node.js installation | Install Node.js LTS (18+) | `node --version`, `npm --version` |
| 4 | Git installation | Install Git for Windows | `git --version` |
| 5 | Chrome installation | Install Google Chrome | Launch smoke test (localhost only) |
| 6 | PM2 installation | Install PM2 (later, before always-on runtime) | `pm2 --version`, process persistence test |
| 7 | Nginx installation | Install Nginx for Windows (reverse proxy gate) | Config test, localhost proxy check |
| 8 | Repository transfer | Place repo at `D:\Codex Folder\digital-pr-agents` | Path existence + `git status` |
| 9 | Environment/secrets manual entry | Enter non-secret and secret env values manually | Manual confirmation |
| 10 | Build/start validation | `npm ci`, `npm run build`, `next start` on localhost | Build exit 0, app responds on 127.0.0.1 |
| 11 | IP-only staging | Bind app to 127.0.0.1; access via Tailscale if desired | Authorized staging review |
| 12 | Reverse proxy | Nginx reverse proxy for app | Proxy health check |
| 13 | TLS | TLS cert issuance/config | Cert validity check |
| 14 | DNS | Domain records | DNS resolution check |
| 15 | Backups | Configure backups/snapshots | Restore test |
| 16 | Monitoring | Monitoring + alerting | Alert smoke test |

## Sequencing Rule

Gates run in order. No gate may be skipped or started before the previous required gate
passes, and each gate requires explicit authorization.

## Not Done in This Batch

No software is installed on any machine.
