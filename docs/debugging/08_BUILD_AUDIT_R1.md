# Build Audit — R1

- **Report**: `08_BUILD_AUDIT_R1.md`
- **Evidence window**: 2026-08-12, post-fix tree (includes pipeline-gaps path fix + new regression test).
- **Result**: Production build `PASS` (exit 0).

---

## 1. Build Command & Result

| Item | Value |
|---|---|
| Command | `npm run build` (→ `next build`) in `dashboard/` |
| Exit code | `0` |
| Dist output | `dashboard/.next` (gitignored) |
| Durations | completed successfully; no errors or warnings in output tail |

- Build used the standard `distDir` (`.next`) since `NEXT_DIST_DIR` is unset.
- All application routes compiled; static (`○`) and dynamic (`ƒ`) route classification printed normally.
- `First Load JS shared by all`: 87.3 kB (chunks `7023-31f2c7c848117733.js` 31.6 kB, `fd9d1056-5c009e0f6f1fd5dc.js` 53.6 kB, other shared 2.01 kB).

## 2. Build-Related Config (from report 03)

| Item | Value |
|---|---|
| Next | 14.2.3 |
| React | 18.3.1 |
| TypeScript | ^5.4.5 (strict, noEmit) |
| distDir | `process.env.NEXT_DIST_DIR || '.next'` |
| Security headers | X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy (from `next.config.js`) |
| Build-cache isolation | `.next-dev-3002/types` included in tsconfig for alternate-port dev builds |

## 3. Native Module Note

- `sqlite3@5.1.7` is a native module requiring a Windows prebuilt binary (used by dashboard). It is a dependency, not imported by the audited `src` build graph paths exercised here; the build succeeded. On the deployment VM, `npm ci` inside `dashboard/` must rebuild/download the correct prebuilt for the target platform (see `docs/deployment/vultr/`).
- No `npm install` / `npm ci` was executed during this batch (no package manifest changes; policy: `npm ci` allowed only inside `dashboard` and only if required). No `package-lock.json` changes to report.

## 4. Findings Summary

| # | Finding | Classification |
|---|---|---|
| B1 | `next build` exit 0 | `PASS` |
| B2 | No build warnings/errors in output | `PASS` |
| B3 | No dependency install executed; no lockfile changes | `PASS` |
| B4 | `sqlite3` native binary must be re-resolved on target VM | `INFORMATIONAL` |
