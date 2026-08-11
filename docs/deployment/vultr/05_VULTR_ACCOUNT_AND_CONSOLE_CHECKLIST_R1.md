# Vultr Account and Console Checklist — R1

Batch: `DPR-VULTR-PREPARATION-AND-WHOLE-PROJECT-LOCAL-DEBUGGING-R1`

## Purpose

A pre-deployment checklist for the user's Vultr account and console. This batch does not
create a Vultr account, access the Vultr console, or use the Vultr API.

## Checklist

- [ ] Create or sign in to a Vultr account.
- [ ] Enable Multi-Factor Authentication (MFA) if available for the account.
- [ ] Confirm billing setup (payment method) is acceptable before spending.
- [ ] Do **not** create any Vultr API keys in this phase.
- [ ] Do **not** paste credentials into ChatGPT, OpenCode, or any chat.
- [ ] Open **Deploy → Compute** in the Vultr console.
- [ ] Choose a Windows-compatible compute location/region.
- [ ] Select **Windows Server** as the operating system.
- [ ] Select the plan (target: 4 vCPU / 16 GB RAM / 250 GB storage).
- [ ] Confirm the price shown, including the Windows license surcharge.
- [ ] Configure a firewall group (deny RDP by default; allow only your /32 or Tailscale).
- [ ] Attach Block Storage if `D:` will be a separate volume (decision pending).
- [ ] Enable backups or scheduled snapshots.
- [ ] **STOP** before clicking Deploy unless the next Vultr manual deployment gate is
      authorized.

## Stop Rule

```
STOP BEFORE DEPLOYING THE SERVER.
Do not deploy until this preparation package is externally reviewed and accepted,
and the user explicitly authorizes the Vultr manual deployment gate.
```
