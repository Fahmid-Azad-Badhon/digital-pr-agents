# Security and Secret-Safety Audit — R1

- **Report**: `05_SECURITY_AND_SECRET_SAFETY_AUDIT_R1.md`
- **Scope**: Authentication, authorization, CSRF, rate limiting, request IDs, secret handling, and secret-file hygiene for the Digital PR Orchestrator.
- **Audit method**: Source inspection of `middleware.ts`, `lib/authGuard.ts`, `lib/sessionAuth.ts`, `lib/rateLimiter.ts`, `app/api/auth/*`, `app/api/_internal/mutation-audit/*`, plus `.env.local.example` and `.gitignore`. **No secret files were read or inspected** (`.env*`, `data/google-token.json`, `.secrets/` remain out of scope by batch contract).
- **Result**: 8 controls verified `PASS`, 1 `INFORMATIONAL` (password comparison is plaintext equality), 1 `WATCH` (audit token is a shared bridge secret).

---

## 1. Secret File Hygiene

| Item | Status | Notes |
|---|---|---|
| `.gitignore` excludes `.secrets/**`, `.env`, `.env.local`, `.env.*.local`, `*.pem/key/crt/p12/pfx`, `credentials.json`, `service-account.json`, `*.logins` | `PASS` | Root gitignore lines 9-24 cover all secret-file classes; `dashboard/.env*` also excluded (line 57). |
| `.env.local.example` committed (not the real `.env.local`) | `PASS` | Template uses placeholder values (`change_me_...`, `your_...`); real `.env.local` is gitignored and was not inspected. |
| Secret files present but not tracked | `PASS` | `.env.local` exists locally (untracked); `.secrets/` and `data/google-token.json` exist but are outside inspection scope per batch contract. |
| Dashboard has no own `.gitignore`; root `.gitignore` covers `dashboard/` paths | `PASS` | `.gitignore` includes `dashboard/.env*`, `dashboard/node_modules/`, `dashboard/.next/`, `dashboard/logs/`, etc. |

## 2. Authentication & Authorization

| Control | Evidence | Status |
|---|---|---|
| Auth is opt-in by default, gated by env | `authGuard.shouldRequireAuth()` returns true only when `DASHBOARD_AUTH_REQUIRED=true` or `DASHBOARD_API_TOKEN` set (lines 12-18). Local dev without env runs open; production `.env.local.example` sets `DASHBOARD_AUTH_REQUIRED=true`. | `PASS` (with local-dev caveat) |
| API-token authentication | Header `x-dashboard-token` or `Authorization: Bearer <token>` compared against `DASHBOARD_API_TOKEN` (authGuard.ts:54-66). | `PASS` |
| Role-based access control | `DASHBOARD_API_TOKENS_JSON` + `DASHBOARD_API_TOKEN_ROLE` + `DASHBOARD_ROUTE_POLICIES_JSON`; rank order `viewer < operator < admin` (authGuard.ts:95-127). Defaults: `/api/brains/run`=admin, `/api/campaigns/`=operator, `/api/integrations/`=admin, `/api/_internal/`=admin, `/api/logs`=operator. | `PASS` |
| Session token HMAC-signed | `sessionAuth.issueSessionToken` signs `base64url(payload)` with `HMAC-SHA256(DASHBOARD_SESSION_SECRET)`; `verifySessionToken` recomputes signature and rejects mismatch (sessionAuth.ts:39-84). | `PASS` |
| Session expiry | `exp` enforced on verify (`payload.exp < now` → null); TTL default 12h, min 300s, via `DASHBOARD_SESSION_TTL_SECONDS` (sessionAuth.ts:21-25,81). | `PASS` |
| CSRF token | Login issues per-session `csrfToken` (`crypto.randomBytes(24)`); middleware requires `dashboard_csrf` cookie to match `x-csrf-token` header for any session-authenticated mutation (middleware.ts:80-85,151-153). | `PASS` |
| Cookie flags | Session cookie `httpOnly:true, secure:(NODE_ENV==='production'), sameSite:'strict'`; CSRF cookie `httpOnly:false` (needed by JS) but `sameSite:'strict'` + random token (login route:34-51). | `PASS` |
| Origin enforcement | `DASHBOARD_ENFORCE_ORIGIN` (default true): when both `origin` and `host` headers present, host must match, else 401 (authGuard.ts:36-42,77-90). | `PASS` |
| Internal audit bridge auth | `_internal/mutation-audit/route.ts:58-64` requires `x-internal-audit-token` to equal `INTERNAL_AUDIT_TOKEN`, else 403. | `PASS` |
| Password comparison | Login route:22 `record.password !== password` — **plaintext equality** (no hashing, no `timingSafeEqual`). `DASHBOARD_AUTH_USERS_JSON` holds plaintext passwords. | `INFORMATIONAL` — local/dashboard-user auth; acceptable for a locally-bound admin dashboard, but should be noted for production hardening. |

## 3. Rate Limiting

| Control | Evidence | Status |
|---|---|---|
| Rate limit on mutations | Middleware applies `checkRateLimit` with `max:60`, `windowMs:60_000` keyed by `${ip}:${method}:${pathname}` for **all** non-public mutations (middleware.ts:13-14,155-159). | `PASS` |
| Rate limit headers | Response includes `x-ratelimit-limit/remaining/reset` (middleware.ts:173-175). | `PASS` |
| Limiter is in-memory | `rateLimiter.ts` uses a `Map<string, Record>` — resets on process restart; not shared across multiple server processes. | `WATCH` — adequate for a single-node local/Vultr deployment; documented limitation. |

## 4. Request-ID & Auditing

| Control | Evidence | Status |
|---|---|---|
| Request ID per `/api/*` request | Middleware sets `x-request-id` (crypto.randomUUID) and forwards it (middleware.ts:128-130,140,167,172,184). | `PASS` |
| Mutation audit logging | For authenticated mutations, `emitMutationAudit` POSTs method/path/action/campaignId/actor/ip/UA to `INTERNAL_AUDIT_PATH` using the bridge token (middleware.ts:87-116,165); failure is swallowed (`catch(() => undefined)`) so it never blocks requests. | `PASS` |
| Public mutation paths | Only `/api/auth/login` and `/api/auth/logout` bypass the auth/CSRF/rate-limit chain (middleware.ts:9-12,134-142). | `PASS` |

## 5. Secret Values Referenced in Code (env names only, not values)

- `OPENROUTER_API_KEY` / `OPENCODE_API_KEY` (llmService.ts:23) — fallback to literal `'free'`.
- `JINA_API_KEY` (webSearch.ts:20).
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_OAUTH_APP_VERIFIED`, `GOOGLE_OAUTH_PUBLISH_STATUS` (integrationReadiness.ts:143-145; integrationExternalization.ts:34-35).
- `INTERNAL_AUDIT_TOKEN` (middleware.ts:88).
- `DASHBOARD_API_TOKEN`, `DASHBOARD_API_TOKENS_JSON`, `DASHBOARD_API_TOKEN_ROLE`, `DASHBOARD_ROUTE_POLICIES_JSON` (authGuard.ts).
- `DASHBOARD_SESSION_SECRET`, `DASHBOARD_SESSION_TTL_SECONDS`, `DASHBOARD_AUTH_USERS_JSON` (sessionAuth.ts).
- `OTEL_LOG_ENDPOINT`, `OTEL_LOG_API_KEY` (logger.ts:46-47).
- `CHROME_DEBUG_PORT` / `MUCKRACK_DEBUG_PORT` / `PUPPETEER_DEBUG_PORT` (integrationReadiness.ts:51) — ports, not secrets.
- `MUCKRACK_*` (example file) — documented placeholders only; not referenced in `dashboard/src` code paths found.

**Note**: Only **env variable names** were enumerated. No env file contents, tokens, or secret values were read.

## 6. Findings Summary

| # | Finding | Classification |
|---|---|---|
| S1 | Secret files excluded from git (`.env*`, `.secrets/`, keys, credentials) | `PASS` |
| S2 | HMAC-signed, expiring sessions + strict cookies | `PASS` |
| S3 | CSRF double-submit enforcement on session mutations | `PASS` |
| S4 | Mutation rate limiting (60/min/IP+method+path) + headers | `PASS` |
| S5 | Role-based route policies + origin host check | `PASS` |
| S6 | Request IDs + internal mutation audit trail | `PASS` |
| S7 | Login password compared as plaintext equality (no hash/timing-safe) | `INFORMATIONAL` |
| S8 | Rate-limit buckets and audit token are per-process/in-memory | `WATCH` |
