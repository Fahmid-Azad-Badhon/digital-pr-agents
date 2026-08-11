# Google OAuth and Integration Readiness Audit — R1

- **Report**: `14_GOOGLE_OAUTH_AND_INTEGRATION_READINESS_AUDIT_R1.md`
- **Scope**: Google OAuth externalization readiness, Muck Rack readiness, and the integration health/preflight API surfaces.
- **Result**: `PASS` — readiness checks are real (not TODOs); Google OAuth is `not_configured` on this machine by design; no credentials or token files were inspected.

---

## 1. Google OAuth Readiness Check (`lib/integrationReadiness.ts` `checkGoogleOAuthReadiness`)

| Check | Behavior |
|---|---|
| Credentials | Reads `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` (env names only). |
| Redirect-URI port match | If `redirectUri` set, compares its port to `PORT || NEXT_PUBLIC_PORT || '3000'`; mismatch → status `not_configured` with explicit error. |
| Token file | Checks `path.join(DATA_ROOT, 'google-token.json')` exists and is a file; if it has `expiry_date` it must be `> Date.now()`, else `access_token` presence implies valid. |
| Statuses | `ready` / `not_configured` / `token_expired` / `missing` / `failed`. |

- Result mapped by `campaignStateService`/`stageRequiresIntegration` to block stages that require Google Docs export (stage 10) until ready.
- **Batch reality**: On this machine Google OAuth is `not_configured` (no `GOOGLE_CLIENT_ID`/`SECRET` in effect, no valid token). Deployment docs (`docs/deployment/vultr/`) carry the Google OAuth setup steps for the VM. **No credentials or `data/google-token.json` content were read** (batch contract).

## 2. Muck Rack Readiness Check (`checkMuckRackReadiness`)

| Check | Behavior |
|---|---|
| Chrome debug port | `CHROME_DEBUG_PORT || MUCKRACK_DEBUG_PORT || PUPPETEER_DEBUG_PORT` (default per `.env.local.example`: `9333`). |
| Browser-tools presence | `fs.stat(BROWSER_TOOLS_ROOT)` must be a directory. |
| Scripts | Checks `import_muckrack_output.cmd`, `collect_muckrack_data.cmd` in `browser-tools/`. |
| Recent data | Scans browser-tools data dir for recent capture files; `ready` only when recent data exists, else `not_configured`. |

## 3. API Surfaces

| Route | Purpose |
|---|---|
| `GET /api/integrations/health` | Reports `muckrack`, `googleOAuth`, `scripts` readiness + details (report 12 inventory). |
| `GET /api/integrations/preflight` | Externalization preflight checks. |
| `lib/integrationExternalization.ts` | `EXTERNALIZATION_MODE` (local/staging/production) + blocker list (`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` missing). |
| `lib/requestGuard.ts` `BROWSER_TOOLS_ROOT` | `path.join(REPO_ROOT, 'browser-tools')`. |

- `integration-readiness.test.ts` exercises the readiness logic (report 07, passing), including env manipulation (original env captured/restored).

## 4. Batch Execution Status

- No OAuth handshake, token refresh, Google Docs export, Muck Rack session, or browser automation was run (dry_run; external actions blocked).
- `export-google-doc` and `import-muckrack-output` are blocked in dry-run by `scriptRunner` (report 11).

## 5. Findings Summary

| # | Finding | Classification |
|---|---|---|
| G1 | Google OAuth readiness is a real check (no TODOs) | `PASS` |
| G2 | Google OAuth `not_configured` on this machine by design | `PASS` |
| G3 | Redirect-URI port mismatch detected explicitly | `PASS` |
| G4 | Muck Rack readiness checks port + browser-tools + recent data | `PASS` |
| G5 | No credentials/token files inspected; no external action executed | `PASS` |
