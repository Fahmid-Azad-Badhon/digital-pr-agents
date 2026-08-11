# Runtime Start Audit — R1

- **Report**: `09_RUNTIME_START_AUDIT_R1.md`
- **Scope**: Whether the dashboard can be started without a server being left running, and how runtime start is evidenced.
- **Result**: `PASS` — help-mode verification only. **No server was left running** (batch rule: no public port opened, no production launch).

---

## 1. Start Command Evidence

| Item | Value |
|---|---|
| Command | `npm run start -- --help` in `dashboard/` |
| Exit code | `0` |
| Output | Printed Next.js `start` help text: "Starts Next.js in production mode. The application should be compiled with `next build` first." Options: `--port` (default 3000, env PORT), `--hostname` (default 0.0.0.0), `--keepAliveTimeout`, `-h`. |
| Server state after | No listener started (help only). Ports not opened. |

- This proves the `start` script and Next runtime are reachable post-build without binding a listener. An actual bind to a public port is explicitly forbidden this batch (no public port opening, no production launch), so full server boot was not attempted.

## 2. Related Runtime Checks

- `next start` requires a prior `next build`; build verified PASS in report 08.
- `scripts/launch-dashboard.ps1` / `launch-dashboard.cmd` and `launch-dashboard-stable.ps1` (`dev:stable`) are the documented local-dev launchers (classified `SAFE_WITH_CAUTION` in report 02 — they open a local port; not run this batch).
- Runtime readiness primitives exist: `lib/preflightCheck.ts` (required-folder checks, env checks) and `lib/runtimeHealthCheck.ts` (checks brain/schemas/campaign roots; hardcoded paths per report 04).

## 3. Findings Summary

| # | Finding | Classification |
|---|---|---|
| R1 | `next start --help` exit 0 (help-only, no listener) | `PASS` |
| R2 | No server/port left running after batch | `PASS` |
| R3 | Full server boot deferred (public-port rule) | `INFORMATIONAL` |
