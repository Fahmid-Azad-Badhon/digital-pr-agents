# Production Externalization Runbook

This runbook defines deployment-time closure for integrations that cannot be fully completed by code alone.

## 1) Google OAuth production checklist

Required environment:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`
- `GOOGLE_REDIRECT_URI`
- `GOOGLE_OAUTH_APP_VERIFIED`
- `GOOGLE_OAUTH_PUBLISH_STATUS`

Required platform actions:
1. Google OAuth app is configured in Google Cloud.
2. Redirect URI includes deployed callback URL.
3. OAuth consent screen is published.
4. App verification completed when required scopes demand it.
5. Service account or user account refresh token minted and rotated.

Validation path:
- `GET /api/integrations/preflight`
- Must return `productionExternalizationReady: true` in `production` mode.

## 2) Muck Rack production checklist

Required environment (one auth path + robustness controls):
- auth path:
  - `MUCKRACK_API_KEY` **or**
  - `MUCKRACK_SESSION_COOKIE` **or**
  - `MUCKRACK_EMAIL` (+ optional `MUCKRACK_PASSWORD`) **or**
  - debug path (`MUCKRACK_DEBUG_PORT` / `MUCKRACK_CHROME_PROFILE_DIR`)
- robustness controls:
  - `MUCKRACK_COLLECTION_CONCURRENCY`
  - `MUCKRACK_MAX_RETRIES`
  - `MUCKRACK_ROBUSTNESS_APPROVED`

Validation path:
- `GET /api/integrations/preflight`
- Must return `productionExternalizationReady: true` in `production` mode.

## 3) Deployment release gate

Release tags trigger the `release-gates` CI job:
- Runs `verify:integration-contract-smoke`
- Runs `build`

If either fails, release is blocked.

## 4) Operational handoff evidence

Capture these artifacts per release:
1. CI output for `verify:ci`
2. CI output for `release-gates` (tag run)
3. `GET /api/integrations/preflight` payload from deployed environment
4. One end-to-end campaign strict audit payload (`/api/campaigns/:id/strict-audit`)

