# Secrets and Environment Plan — R1

Batch: `DPR-VULTR-PREPARATION-AND-WHOLE-PROJECT-LOCAL-DEBUGGING-R1`

## Purpose

Defines how secrets and environment variables will be handled for the Vultr deployment.
No secrets are inspected, transferred, or printed in this batch.

## Hard Rules

```
Never paste secrets into ChatGPT or OpenCode.
Never inspect .env files.
Never inspect data/google-token.json.
Never print environment-variable values.
Use placeholders only in documentation.
Google OAuth is deferred.
```

## Environment Variable Categories

### Non-secret configuration (may be documented)

Examples: app port, run mode, path layout, non-secret feature flags.

### Secrets (manual secure entry on the VM only)

Examples: Google OAuth credentials, LLM/model API keys, browser profile paths if any, any
tokens or passwords.

## Manual Entry Procedure (future, on the VM)

1. Generate credentials in the provider console (e.g., Google Cloud) — never in chat.
2. Copy them directly into the VM environment (e.g., Windows Environment Variables or a
   `.env.local` created on the VM).
3. Keep secrets out of the repository and out of logs.
4. Do not commit any `.env*` file.

## Google OAuth — Deferred

Google OAuth integration is deferred. `data/google-token.json` must not be transferred to
the VM until a dedicated Google OAuth gate authorizes secure creation there.

## What This Batch Does

- Records the plan above.
- Inspects no secret files.
- Prints no secret values.
