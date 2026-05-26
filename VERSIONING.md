# Versioning Standard

**Version:** 2.0  
**Last Updated:** 2026-05-06  
**Status:** Active  
**Owner:** production-readiness-agent  
**Change History:** See `CHANGELOG.md`

---

## Purpose

Define version and changelog discipline for the Digital PR workflow.

---

## Required Metadata

Every important workflow, agent, gate, scoring, benchmark, fallback, template, or validator file must include:

| Field | Description |
|-------|-------------|
| `Version` | Semantic version (e.g., 2.0) |
| `Last Updated` | Date in YYYY-MM-DD format |
| `Status` | One of: active, draft, deprecated, archived, unknown |
| `Owner` | Responsible agent or role |
| `Purpose` | Brief description of file purpose |
| `Change History` | Reference to CHANGELOG.md |

---

## Status Labels

| Status | Meaning |
|--------|---------|
| `active` | Current production workflow file |
| `draft` | Usable only with review |
| `deprecated` | Retained for reference; not used |
| `archived` | Historical output or old job artifact |
| `unknown` | Requires audit before use |

---

## Changelog Entry Format

Each major repair must be recorded in `CHANGELOG.md` with:

- Date (YYYY-MM-DD)
- File name and version change
- Brief description of change
- Reason for change

---

## Version Numbering

- **Major version (x.0):** Structural changes, new stages, new agents, new gates
- **Minor version (x.y):** Field additions, clarifications, new validation rules
- **Patch version (x.y.z):** Typos, formatting, minor clarifications

---

## Current Versions

| File | Version |
|------|---------|
| `MODEL-CONFIG.md` | 3.0 |
| `agent-registry.md` | 2.0 |
| `workflow-architecture.md` | 2.0 |
| `runbook.md` | 2.0 |
| `handoff-matrix.md` | 2.0 |
| `validation-gates.md` | 2.0 |
| `VERSIONING.md` | 2.0 |
| `AGENTS.md` | Updated |
| `package.json` | Updated |

---

## Related Files

- `CHANGELOG.md` - Change history
- `AGENTS.md` - Project conventions