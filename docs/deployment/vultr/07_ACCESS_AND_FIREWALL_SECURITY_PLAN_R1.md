# Access and Firewall Security Plan — R1

Batch: `DPR-VULTR-PREPARATION-AND-WHOLE-PROJECT-LOCAL-DEBUGGING-R1`

## Purpose

Defines the access model and firewall rules for the future Vultr Windows VM. This is a
planning document only; no firewall or network rules are being changed.

## Access Model (ranked)

### Preferred: Tailscale + RDP over the private network

1. Install Tailscale on the user's local machine and on the Vultr VM.
2. Both devices join the same tailnet.
3. RDP is allowed **only** from the tailnet (private-network source IPs).
4. The Vultr firewall group denies RDP from the public internet.

### Fallback: RDP restricted to the user's public IP

1. Determine the user's current public IP.
2. Allow RDP only from that IP as a `/32` rule.
3. Keep the rule as narrow as possible and audit it periodically.
4. Replace with Tailscale as soon as practical.

### Emergency: Vultr web console only

1. If RDP is unavailable/locked out, use the Vultr browser-based console.
2. Treat this as an emergency path only; never leave it as the only option for long.

## Hard Rules

```
Never expose RDP to 0.0.0.0/0 as a standing rule.
Never expose port 3002 (dashboard) directly to the public internet.
Never expose Chrome debug ports (e.g., 9222, 9229) to the public internet.
Never expose 22, 80, 443, 3389, 9222, or 9229 until an explicit gate authorizes it.
Only 80/443 may be opened after a reverse proxy + TLS gate, and only for the public app.
```

## Firewall Group Rules (proposed for the Vultr firewall)

| Direction | Protocol | Port | Source | Policy |
|-----------|----------|------|--------|--------|
| Inbound | TCP | 3389 (RDP) | User /32 (fallback) or Tailscale subnet | Allow (restricted) |
| Inbound | TCP | 3389 (RDP) | 0.0.0.0/0 | Deny |
| Inbound | TCP | 3002 (app) | Any | Deny |
| Inbound | TCP | 9222/9229 (Chrome) | Any | Deny |
| Inbound | TCP | 22 | Any | Deny |
| Outbound | All | All | Any | Allow (needed for Windows Update, installs) |

These are proposed rules for the future Vultr firewall group. They are not being applied now.

## What Is NOT Done in This Batch

- No Vultr firewall is created or modified.
- No RDP rule is opened.
- No Tailscale login occurs.
- No public ports are opened.
