# Vultr Requirements Matrix — R1

Batch: `DPR-VULTR-PREPARATION-AND-WHOLE-PROJECT-LOCAL-DEBUGGING-R1`

## Purpose

This matrix defines the minimum requirements for a Vultr Windows VPS that can run the DPR
Debugging / Digital PR Agents project. It is a local planning document. No server has been
created.

## Requirements Matrix

| # | Requirement | Target / Guidance | Critical? | Status |
|---|-------------|-------------------|:---------:|--------|
| 1 | Windows Server | Windows Server 2019 or 2022 | Yes | Planned |
| 2 | vCPU target | 4 vCPU (recommended) | Yes | Planned |
| 3 | RAM target | 16 GB RAM (recommended) | Yes | Planned |
| 4 | Storage target | 250 GB total (recommended) | Yes | Planned |
| 5 | Persistent data disk | Dedicated disk for `D:\`; must survive rebuild | Yes | Planned |
| 6 | `D:\Codex Folder` | Must exist at `D:\Codex Folder` after disk init | Yes | Script drafted |
| 7 | Restricted RDP | RDP allowed only from user IP /32 or via Tailscale | Yes | Planned |
| 8 | Tailscale (optional access) | Private-network RDP + later app access | No | Optional |
| 9 | Firewall group | Vultr firewall group attached to the instance | Yes | Planned |
| 10 | Static public IP | Reserved static IPv4 (or fixed per-instance IP) | Yes | Planned |
| 11 | Backups / snapshots | Enable Vultr backups or scheduled snapshots | Yes | Planned |
| 12 | Block Storage decision | Decide: plan disk vs. attached Block Storage for `D:` | Yes | Open decision |
| 13 | Chrome support | Google Chrome installable/stable on the VM | Yes | Future gate |
| 14 | Node.js support | Node.js 18+ installable on Windows | Yes | Future gate |
| 15 | PM2 support | PM2 installable as a service (recommended later) | No | Future gate |
| 16 | Nginx support | Nginx for Windows only when reverse proxy is needed | No | Deferred |
| 17 | Manual secrets entry | All secrets entered manually on the VM, never pasted | Yes | Deferred |
| 18 | No public app port initially | App (3002) bound to localhost only | Yes | Planned |
| 19 | DNS deferred | No domain until app exposure gate | — | Deferred |
| 20 | TLS deferred | No TLS until reverse-proxy/TLS gate | — | Deferred |

## Notes

- **Storage sizing:** Campaign state, pitch-jobs, logs, a Node install, Chrome, and the
  repository typically require at least 100 GB of usable space; 250 GB is the recommended
  conservative target.
- **Windows license surcharge:** Vultr charges a per-month Windows licensing premium on top
  of the base plan price. Confirm the exact amount in the Vultr console before deploying.
- **Block Storage vs. plan disk:** If the plan's local disk is used for `D:`, a full
  re-provision of the instance would also re-provision the disk, so snapshots/backups are
  essential. Attaching a separate Block Storage volume decouples data from the instance.

## Decision Points Requiring User Input

1. Choose a Vultr plan that provides at least 4 vCPU / 16 GB RAM / 250 GB storage.
2. Decide whether `D:` uses the plan disk or an attached Block Storage volume.
3. Decide the RDP access model (Tailscale vs. restricted public IP /32).
4. Confirm the monthly Windows licensing surcharge in the Vultr console.
