# Vultr Execution Mind Map — R1

Batch: `DPR-VULTR-PREPARATION-AND-WHOLE-PROJECT-LOCAL-DEBUGGING-R1`

```text
DPR Vultr Deployment
├─ Current
│  ├─ AWS path paused
│  ├─ No stack deployed
│  └─ Vultr preparation package
├─ Pre-Vultr
│  ├─ Requirements
│  ├─ Cost
│  ├─ Account
│  ├─ Security
│  └─ Storage
├─ Vultr Creation
│  ├─ Windows Server
│  ├─ CPU/RAM
│  ├─ Firewall
│  ├─ Block Storage
│  └─ Backups
├─ Post-Creation
│  ├─ Secure access
│  ├─ D: drive
│  ├─ Windows hardening
│  └─ Baseline validation
├─ App Setup
│  ├─ Node
│  ├─ Git
│  ├─ Chrome
│  ├─ PM2
│  ├─ Nginx
│  └─ Secrets
├─ Staging
│  ├─ Localhost
│  ├─ IP-only
│  ├─ Reverse proxy
│  └─ TLS/DNS later
└─ Operations
   ├─ Backups
   ├─ Monitoring
   ├─ Restore test
   └─ Production acceptance
```

## Notes

- `Current` state is captured and authoritative as of this batch.
- `Pre-Vultr` items are documented in this package (docs 02–05, 07, 08).
- Everything from `Vultr Creation` onward is a future, separately authorized gate.
