# Future Vultr Gate Prompts — R1

Batch: `DPR-VULTR-PREPARATION-AND-WHOLE-PROJECT-LOCAL-DEBUGGING-R1`

## Purpose

Skeleton prompts for future Vultr gates. Each gate is independently authorized and must not
start until the previous required gate passes and the user explicitly authorizes it.

## Gate Skeleton Template

```text
# DPR VULTR GATE: <GATE NAME> — <BATCH ID>

## Task
<one-sentence description>

## Authorized
<what this gate may do>

## Not Authorized
<what this gate must not do>

## Required Evidence
<commands or forms to return>

## Result Form
<fields to fill>

## Stop Rule
<stop condition>
```

## Future Gate Prompts

### 1. Vultr Account / Pre-Deploy Review
```text
# DPR VULTR GATE: ACCOUNT_AND_PRE_DEPLOY_REVIEW

Review the Vultr account, billing, MFA, and the preparation package.
Do not create a server.
Return the account readiness checklist.
```

### 2. Vultr Instance Creation Handoff
```text
# DPR VULTR GATE: INSTANCE_CREATION_HANDOFF

User creates the Vultr Windows Server instance manually using runbook 06.
Return the 17-field Vultr Windows VPS creation result form.
```

### 3. Post-Instance External Review
```text
# DPR VULTR GATE: POST_INSTANCE_EXTERNAL_REVIEW

Externally review the 17-field result form before any RDP/access work.
Do not configure access.
```

### 4. Secure Access Setup
```text
# DPR VULTR GATE: SECURE_ACCESS_SETUP

Configure RDP restricted access or Tailscale per security plan 07.
Return firewall and access evidence.
```

### 5. D: Initialization
```text
# DPR VULTR GATE: D_DRIVE_INITIALIZATION

Disks/volumes confirmed read-only via ops/vultr/Inspect-Windows-Baseline.ps1.
Run ops/vultr/Initialize-DPR-DDrive.ps1 -ExpectedDiskSizeGB <GB> on the VM,
where <GB> is the exact size of the ordered storage (Block Storage or plan disk).
The script will refuse to initialize a RAW disk that does not match that size,
and it will abort if more than one RAW disk matches (attach only the intended
volume before re-running). Return volume and folder verification output.
```

### 6. Windows Baseline Validation
```text
# DPR VULTR GATE: WINDOWS_BASELINE_VALIDATION

Run ops/vultr/Inspect-Windows-Baseline.ps1 on the VM.
Return the read-only inspection output.
```

### 7. Software Installation
```text
# DPR VULTR GATE: SOFTWARE_INSTALLATION

Install Node.js, Git, Chrome per gate plan 10.
Return version evidence for each.
```

### 8. Repository Transfer
```text
# DPR VULTR GATE: REPOSITORY_TRANSFER

Transfer the repo to D:\Codex Folder\digital-pr-agents per plan 12.
Return path and git status evidence.
```

### 9. Environment / Secrets Manual Entry
```text
# DPR VULTR GATE: ENVIRONMENT_AND_SECRETS_MANUAL_ENTRY

Enter non-secret and secret env values manually on the VM per plan 11.
No secrets returned in chat.
```

### 10. Build/Start Validation
```text
# DPR VULTR GATE: BUILD_AND_START_VALIDATION

Run npm ci, npm run build, next start on 127.0.0.1 per plan 13.
Return build and localhost health evidence.
```

### 11. PM2 Setup
```text
# DPR VULTR GATE: PM2_SETUP

Install and configure PM2 for the app.
Return pm2 status and reboot-persistence evidence.
```

### 12. Nginx Setup
```text
# DPR VULTR GATE: NGINX_SETUP

Install and configure Nginx reverse proxy.
Return proxy health check evidence.
```

### 13. TLS / DNS
```text
# DPR VULTR GATE: TLS_AND_DNS

Configure TLS certificate and DNS records.
Return certificate and DNS verification evidence.
```

### 14. Backup Setup
```text
# DPR VULTR GATE: BACKUP_SETUP

Configure backups/snapshots per plan 14.
Return backup schedule evidence.
```

### 15. Monitoring Setup
```text
# DPR VULTR GATE: MONITORING_SETUP

Configure monitoring per plan 15.
Return alert smoke-test evidence.
```

### 16. Production Acceptance
```text
# DPR VULTR GATE: PRODUCTION_ACCEPTANCE

Final review of all prior evidence before production.
Return acceptance decision.
```

## Not Done in This Batch

None of these gates are started.
