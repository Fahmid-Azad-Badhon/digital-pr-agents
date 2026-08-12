# App Build and Runtime Plan — R1

Batch: `DPR-VULTR-PREPARATION-AND-WHOLE-PROJECT-LOCAL-DEBUGGING-R1`

## Purpose

Defines the future application build and runtime sequence on the Vultr Windows VM.

## Future Sequence (each step in its own authorized gate)

1. **Verify Node** — Confirm Node.js 18.17+ (Next.js 14.2.3 minimum; Node 20 LTS recommended) and npm are installed.
   ```
   node --version
   npm --version
   ```
2. **Install dependencies** — From the dashboard directory:
   ```
   cd "D:\Codex Folder\digital-pr-agents\dashboard"
   npm ci
   ```
   The `sqlite3` native module must compile/load for Windows x64.
3. **Build dashboard** — `npm run build` (must exit 0).
4. **Validate paths** — Confirm the app resolves `../scripts`, `../system`,
   `../browser-tools` correctly from the dashboard.
5. **Start on localhost** — `npm start`, which runs `next start -p 3002 -H 127.0.0.1`
   and binds private port 3002 to 127.0.0.1 only. Development smoke testing uses
   `npm run dev:3002` (`next dev -p 3002`).
6. **Keep app port private** — The app must never bind publicly; no firewall rule opens 3002.
7. **Add PM2 (later)** — Wrap the start command with PM2 so it survives reboots.
8. **Add Nginx (later)** — Reverse proxy only at the exposure gate.
9. **Add TLS (later)** — Certificates only at the TLS gate.

## Runtime Constraints

- App port `3002` stays bound to `127.0.0.1`.
- Chrome debug ports stay bound to `127.0.0.1`.
- No public inbound port is opened for the app in staging.
- Reboot persistence requires PM2 or a Windows Scheduled Task (later gate).

## Not Done in This Batch

No build or runtime start occurs on any machine. `npm run build`/`next start` are not run
on the VM and no local long-running server is started.
