# Configuration Audit — R1

Batch: `DPR-VULTR-PREPARATION-AND-WHOLE-PROJECT-LOCAL-DEBUGGING-R1`

## tsconfig.json (dashboard)

| Setting | Value | Finding |
|---------|-------|---------|
| strict | true | Good — strict typing enabled |
| noEmit | true | Good — build emits via Next |
| module | esnext | Good |
| moduleResolution | bundler | Good for Next 14 |
| jsx | preserve | Good |
| target | es2017 | Fine |
| paths | `@/* -> ./src/*`, `@system/* -> ../system/*` | **Windows/layout dependency**: `@system` resolves to parent `system/` — requires repo layout |
| include | `**/*.ts`, `**/*.tsx`, `.next/types`, `.next-dev-3002/types` | Includes generated type dirs |

**Flag:** `@system/*` alias reaches outside the dashboard folder (`../system/*`). This is a
parent-directory dependency that must be preserved on the Vultr VM layout.

## next.config.js (dashboard)

| Setting | Value | Finding |
|---------|-------|---------|
| distDir | `process.env.NEXT_DIST_DIR \|\| '.next'` | Good — isolates build cache by launcher |
| reactStrictMode | true | Good |
| trailingSlash | false | Good |
| Headers | X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy | Good — security headers present |

**Flag:** `NEXT_DIST_DIR` env is used to avoid `.next` collisions — launcher scripts must set
it consistently. No other issues.

## eslint.config.mjs (dashboard)

| Setting | Value | Finding |
|---------|-------|---------|
| Config | eslint-config-next + typescript-eslint | Good |
| Rules | set-state-in-effect off, immutability off, no-unescaped-entities off, no-unused-vars warn | Reasonable for app code; not broadly weakened |

**Finding:** Three rules are disabled globally. These are pragmatic app-code choices, not
security-weakening. `@typescript-eslint/no-unused-vars` is set to warn, not off.

## vitest.config.ts (dashboard)

| Setting | Value | Finding |
|---------|-------|---------|
| environment | node | Good (no browser in unit tests) |
| include | `src/tests/**/*.test.ts` | Good |
| globals | true | Good |
| env RUN_MODE | `dry_run` | Good — tests run in safe mode |
| alias | `@` -> src, `@system` -> ../system | Matches tsconfig — parent-dir dependency |

## middleware.ts (dashboard) — Request Guard

- Applies to `/api/:path*`.
- Mutation methods (POST/PUT/PATCH/DELETE) subject to auth + rate limit + CSRF.
- Rate limit: 60/min per IP+method+path.
- CSRF enforced for session-authenticated mutations.
- `/api/auth/login`, `/api/auth/logout` are public.
- `x-request-id` added to all API requests.

**Finding:** Strong guardrail presence. CSRF only enforced when a session cookie exists;
Bearer-token clients bypass CSRF (acceptable since tokens are already bearer-authenticated).

## GitHub Workflows

`.github/` exists. Not deeply audited in this batch (content unchanged, not a blocking item).

## Playwright Config

Not found. Browser automation uses Chrome CDP tooling (browser-tools), not Playwright.

## Config Findings Summary

| Finding | Classification |
|---------|----------------|
| `@system/*` alias reaches parent dir | EXPECTED_WINDOWS_DEPENDENCY |
| distDir controlled by env | EXPECTED — cache isolation |
| Security headers present in Next config | PASS |
| ESLint rules minimally relaxed | PASS (not security) |
| Tests run in dry_run mode | PASS |
| No Playwright config (CDP used instead) | INFORMATIONAL |
