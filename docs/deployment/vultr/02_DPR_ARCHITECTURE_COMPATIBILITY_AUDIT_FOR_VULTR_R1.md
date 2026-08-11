# DPR Architecture Compatibility Audit for Vultr — R1

Batch: `DPR-VULTR-PREPARATION-AND-WHOLE-PROJECT-LOCAL-DEBUGGING-R1`

## Verdict

```
VULTR_WINDOWS_SERVER_COMPATIBLE_IF_D_DRIVE_AND_WINDOWS_RUNTIME_ARE_PRESERVED
```

## Audit Scope

This audit evaluates whether the DPR project can run on a Vultr Windows Server VPS while
preserving its existing runtime model. Every finding below is a local, evidence-based
assessment of the project's known architecture. No Vultr resource has been created.

## Component-by-Component Compatibility

### Next.js Dashboard

| Attribute | Finding | Compatibility |
|-----------|---------|---------------|
| Framework | Next.js 14.2.3 (App Router), React 18.3.1 | Compatible — Node.js runs on Windows |
| Build | `next build` | Requires Node.js on the VM |
| Runtime | `next start` | Runs locally on the VM |
| Static assets | Served by Next.js | No external CDN required |
| SQLite dependency | `sqlite3` native module | Must be compiled for Windows x64 on the VM |

**Risk:** `sqlite3` is a native module; it must be reinstalled (`npm ci` or `npm install`)
on the VM so it compiles/loads for the Windows architecture. Defer to software installation
gate.

### Local Persistence

The project is a filesystem-heavy, local-first application. It reads and writes campaign
state, pitch-jobs, runtime events, and logs on the local disk. This model is fully
compatible with a VPS **only if** a persistent data disk is dedicated and does not reset on
rebuild. Vultr Block Storage (or the plan's local disk) must be used for `D:\`.

### `D:\Codex Folder`

The application expects a `D:\Codex Folder` layout. On a Vultr Windows VM, the data disk
must be initialized as `D:` and the folder `D:\Codex Folder` must exist before the
repository is transferred. This is the single most important VPS preparation step.

### Parent-Directory Access from the Dashboard

The dashboard depends on parent-directory access (e.g., `../scripts`, `../system`,
`../browser-tools`, root-level folders). On a Vultr VM, the repository must be placed at
`D:\Codex Folder\digital-pr-agents` so every `../` reference resolves correctly. Changing
the repository location would break path assumptions.

### `scripts/*.cmd` and `scripts/*.ps1`

The project uses Windows `.cmd` and `.ps1` launchers. These are Windows-native and work on
a Windows Server VM. Ensure PowerShell execution policy allows the project's scripts
(`-ExecutionPolicy Bypass` is used by existing launchers).

### `browser-tools` and Chrome Automation

Chrome/browser automation (Chrome DevTools Protocol) is a hard dependency. On the VM:

- Google Chrome must be installed.
- A dedicated non-interactive session may be required for stable automation.
- Debug ports must stay bound to localhost only; never expose them publicly.

This is the highest-risk component for a Windows Server deployment and requires a dedicated
validation gate after installation.

### Campaign-State Files and Runtime Logs

Campaign state and runtime logs live under local paths. These must be on the persistent
`D:` disk so they survive VM rebuilds. Decide explicitly which files are persisted and which
are disposable logs.

### Google Token Risk

Google OAuth is deferred. No `google-token.json` will be inspected or transferred in this
batch. When Google OAuth is eventually enabled, the token file must be created only on the
VM and stored outside the repository, and never pasted into chat or logs.

### Environment Variable Categories

| Category | Examples | Handling |
|----------|----------|----------|
| Public config | Ports, run mode, paths | Can be documented |
| Credentials | Google OAuth, model API keys, browser profiles | Manual secure entry on the VM only |
| Non-secret tuning | Model routing, timeouts | Can be shipped in repo |

### PM2 (Future Need)

PM2 is a convenient process manager for keeping `next start` alive after reboot. Not
required for the first staging steps but recommended before any always-on runtime.

### Nginx (Future Need)

Nginx is needed only when HTTP/HTTPS exposure and a reverse proxy are introduced. Deferred.

### TLS (Future Need)

TLS is deferred until a DNS/domain gate. Not needed for localhost or IP-only staging.

### Backup (Future Need)

Backups of `D:\` (repository, campaign state, logs, data) must be planned and restore-tested
before production use.

## Compatibility Summary

| Requirement | Needed on Vultr VM | Status |
|-------------|--------------------|--------|
| Windows Server | Yes | Selected |
| Node.js (18+) | Yes | Future gate |
| Chrome | Yes | Future gate |
| Persistent `D:` disk | Yes | Block Storage / plan disk |
| `D:\Codex Folder` | Yes | D: init script drafted |
| PowerShell scripts | Yes | Native on Windows |
| `.cmd` launchers | Yes | Native on Windows |
| Parent-directory repo layout | Yes | `D:\Codex Folder\digital-pr-agents` |
| Google OAuth | Deferred | Not transferred |

## Verdict

```
VULTR_WINDOWS_SERVER_COMPATIBLE_IF_D_DRIVE_AND_WINDOWS_RUNTIME_ARE_PRESERVED
```

This is a conditional compatibility verdict. It is satisfied only when the D: drive is
initialized, the repository is placed at the exact expected path, and the Windows runtime
dependencies (Node, Chrome, native modules) are installed and validated.
