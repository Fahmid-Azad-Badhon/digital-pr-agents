# Project Inventory — R1

Batch: `DPR-VULTR-PREPARATION-AND-WHOLE-PROJECT-LOCAL-DEBUGGING-R1`

## Repository Root

`D:\Codex Folder\digital-pr-agents` (branch `master`, HEAD `db7c25413e9582f185916094e61fdea25ac3fb3d`)

## Top-Level Folders

| Folder | Purpose |
|--------|---------|
| `.agents/` | Agent configuration/skills |
| `.git/` | Git metadata |
| `.github/` | CI workflow files |
| `.secrets/` | Secret-bearing area — NOT INSPECTED |
| `audit-reports/` | Prior audit reports |
| `brain/` | Brain stage manifests |
| `browser-tools/` | Chrome CDP browser automation tools (Node, ws) |
| `dashboard/` | Next.js dashboard app |
| `data/` | Local runtime data — NOT inspected for secrets |
| `docs/` | Documentation (deployment/, debugging/, adr/, superpowers/) |
| `fixtures/` | Test fixtures |
| `lib/` | Root-level libraries |
| `logs/` | Runtime logs |
| `node_modules/` | Root dependencies |
| `pages/` | Legacy root pages |
| `pitch-jobs/` | Campaign job folders (15 dirs) |
| `pitch-jobs-backup-*/` | Campaign backups |
| `pitch-jobs-backups/` | Backup folder |
| `schemas/` | Schema definitions |
| `scripts/` | `.cmd`/`.ps1`/`.js` workflow scripts |
| `skills/` | Skills definitions |
| `styles/` | Styling |
| `system/` | JSON governance/config files |
| `templates/` | Template files |

## Top-Level Files

`README.md`, `AGENTS.md`, `package.json`, `package-lock.json`, `runbook.md`,
`handoff-matrix.md`, `validation-gates.md`, `workflow-architecture.md`,
`MODEL-CONFIG.md`, `CHANGELOG.md`, `VERSIONING.md`, `postcss.config.js`,
`tailwind.config.js`, and several audit/report markdown files.

## Dashboard Folder

`dashboard/` contains `package.json`, `package-lock.json`, `node_modules/`,
`src/`, `scripts/`, `data/`, `logs/`, `docs/`, `.diagnostics/`, `tmp-diagnosis/`,
`reports/`, and launcher scripts (`*.ps1`, `*.bat`, `*.cmd`).

## Dashboard Source Structure (`dashboard/src/`)

| Folder | Purpose |
|--------|---------|
| `app/` | Next.js App Router pages and API routes |
| `brain/` | Stage brain markdown manifests |
| `components/` | React components |
| `config/` | Model routing config (TS) |
| `context/` | React context |
| `data/` | Local data |
| `lib/` | Core logic (54 modules incl. guards, executors, services) |
| `schemas/` | Schema definitions |
| `styles/` | Styling |
| `tests/` | Vitest tests (27 test files) |
| `types/` | TypeScript types |

## Package Files

| File | Location |
|------|----------|
| `package.json` | Root and dashboard |
| `package-lock.json` | Root and dashboard |
| `browser-tools/package.json` | browser-tools |

## Config Files

| File | Location |
|------|----------|
| `tsconfig.json` | dashboard |
| `next.config.js` | dashboard |
| `eslint.config.mjs` | dashboard |
| `vitest.config.ts` | dashboard |
| `postcss.config.js` | dashboard |
| `tailwind.config.js` | dashboard |
| `middleware.ts` | dashboard (auth/rate-limit guard) |
| `next-env.d.ts` | dashboard |

## Test Folders

| Folder | Contents |
|--------|----------|
| `dashboard/src/tests/` | 27 Vitest test files, 1052 tests |

## CI Workflow Files

`.github/` exists at repo root. Not deeply inspected (out of scope beyond inventory).

## Runtime Artifact Folders

`dashboard/.next/`, `dashboard/.next-dev-3002/`, `dashboard/logs/`,
`dashboard/.diagnostics/`, `dashboard/tmp-diagnosis/`, `dashboard/reports/`.

## Local Data Folders

`data/` (root), `pitch-jobs/`, `logs/` (root and dashboard), `dashboard/data/`.

## Generated/Cache Folders

`node_modules/` (root, dashboard, browser-tools), `dashboard/.next/`,
`dashboard/.next-dev-3002/`, `dashboard/tsconfig.tsbuildinfo`.

## Untracked Files (pre-existing)

`FULL-PROJECT-ARCHITECTURE-COMPLETE.md`, `docs/digital-pr-agents-repository.md`.
Not modified by this batch.

## Secret Files (excluded from inspection)

`.env`, `.env.local`, `.env.production`, `.env.*`, `data/google-token.json`,
`.secrets/` contents, browser profiles. **Not read.**

## Notes

- 244 `.ts`/`.tsx` source files in `dashboard/src/`.
- 15 campaign directories under `pitch-jobs/` (290 files, ~2.1 MB).
- 27 test files with 1052 tests total.
