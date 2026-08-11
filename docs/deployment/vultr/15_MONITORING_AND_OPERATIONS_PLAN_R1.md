# Monitoring and Operations Plan — R1

Batch: `DPR-VULTR-PREPARATION-AND-WHOLE-PROJECT-LOCAL-DEBUGGING-R1`

## Purpose

Defines the future monitoring and operations surface for the Vultr Windows VM.

## Monitoring Categories

| Category | What to monitor | Tool/mechanism |
|----------|-----------------|----------------|
| CPU | Utilization spikes | Windows Task Manager / Performance Monitor |
| RAM | Memory pressure | Performance Monitor |
| Disk | Free space on C: and D: | Volume checks |
| PM2 | Process up/down, restarts | `pm2 status`, `pm2 logs` |
| Nginx | Upstream health, error log | Nginx status/error logs |
| Windows logs | System/application/security events | Event Viewer |
| App logs | Dashboard logs, runtime events | Dashboard log files |
| Browser automation health | Chrome/CDP connectivity, collection runs | Automation run results |
| Backup success | Backup job completion | Vultr console / task results |
| Certificate expiry (later) | TLS cert validity | Monitoring script/alert |
| Monthly cost | Spend vs. budget | Vultr billing page |

## Operations Rules

- Review logs after every significant operation.
- Confirm backups complete successfully on schedule.
- Re-validate the firewall/access model after any network change.
- Keep the runbook and this plan updated as the deployment progresses.

## Not Done in This Batch

No monitoring is configured. No alerts are created.
