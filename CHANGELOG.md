# Changelog

**Version:** 2.0  
**Last Updated:** 2026-05-06  
**Status:** Active  
**Owner:** production-readiness-agent  
**Purpose:** Record major repairs and validation changes in the Digital PR workflow.  
**Change History:** This file

| Date | File | Change Type | Problem | Fix | Validation Result | Downstream Impact |
|---|---|---|---|---|---|---|
| 2026-05-02 | `skills/*/SKILL.md`, `templates/*.md`, `validation-gates.md` | Anti-hallucination hardening | Missing exact fallback phrase in several active files | Added missing-information fallback and hallucination gate | Revalidated with fallback scan and skill validator | Prevents invented journalists, stats, quotes, SERP results, and Muck Rack results |
| 2026-05-02 | `templates/*`, `skills/journalist-intelligence-agent/SKILL.md`, `skills/pitch-writer/SKILL.md` | Placeholder cleanup | Bracket placeholders and sample wording could leak forward | Replaced with verified/user-supplied tokens and audit fixture wording | Placeholder scan returned zero matches | Reduces final-output leakage risk |
| 2026-05-02 | `scripts/launch-debug-chrome.*`, `tool-availability-fallbacks.md` | Tool fallback repair | Runbook referenced a missing Chrome launcher | Added local launcher wrapper and fallback matrix | Parser passed; debug Chrome endpoint verified | Browser workflow can be launched from this repo |
| 2026-05-02 | `runbook.md`, `templates/06-journalist-intel.md` | Scalability hardening | Missing explicit volume protocol | Added angle/prospect batching, dedupe, and 800-per-beat handling | Volume simulation passed | Large collections remain structured |
| 2026-05-02 | `scoring-prioritization-engine.md` | Scoring engine creation | Research completeness and claim risk were not explicit score types | Added central scoring matrix | Required score scan passed | Weak claims and incomplete research cannot move forward silently |
| 2026-05-02 | `red-team-adversarial-tests.md`, `pitch-jobs/audit-pressure-20260430/03-research.md` | Red-team hardening | Weak pressure fixture had placeholder research and no central adversarial matrix | Repaired pressure research and added adversarial test matrix | Stage 03 validation passed | Weak campaigns stop before unsafe drafting |
| 2026-05-02 | `gold-standard-output-benchmark.md` | Benchmark creation | Gold-standard email benchmark was spread across long skill files | Added standalone benchmark and runbook pointer | Benchmark and stage validation passed | Final package has explicit quality standard |
| 2026-05-02 | `VERSIONING.md`, `CHANGELOG.md`, core control docs | Versioning repair | Core files lacked consistent metadata and changelog discipline | Added versioning standard, changelog, and metadata headers | Metadata scan passed | Future changes are auditable |
| 2026-05-06 | `handoff-matrix.md` | Major update to v2.0 | Outdated format and missing browser-tools integration | Added stage numbering, context preservation rules, handoff checklist, failure actions reference | Structure validated | All 13 stage handoffs documented |
| 2026-05-06 | `validation-gates.md` | Major update to v2.0 | Missing GPT-5.5 integration and browser-tools references | Added 29 gate definitions with categories, stop condition rules, related docs | Gate matrix validated | All gates have owner, input, output, pass/fail criteria |
| 2026-05-06 | `agent-registry.md` | Major update to v2.0 | Missing browser-tools and GPT-5.5 integration | Added 40 agents with browser-tools integration section, GPT-5.5 quality gate, overlap rules | Agent mapping validated | All agents have clear ownership |
| 2026-05-06 | `workflow-architecture.md` | Major update to v2.0 | Missing browser-tools and GPT-5.5 integration | Added browser tools table, GPT-5.5 integration section, validation flow, handoff validation | Architecture validated | Complete system architecture documented |
| 2026-05-06 | `runbook.md` | Major update to v2.0 | Missing browser-tools, GPT-5.5, and current system state | Added browser-tools section, GPT-5.5 quality gate, missing-information fallback, validation checklist | Runbook validated | Complete operating guide |
| 2026-05-06 | `VERSIONING.md` | Minor update to v2.0 | Needed current version tracking | Added current versions table for all major files | Version table validated | Version tracking current |
| 2026-05-06 | `browser-tools/` | New module | No browser automation existed | Created full CDP client, chrome launcher, tab manager, health checker, Muck Rack collector | Chrome debug port 9222 verified | Journalist collection can run automated |
| 2026-05-06 | `MODEL-CONFIG.md` | Major update to v3.0 | Needed complete stage-by-stage model assignment | Added 26 sections with full workflow mapping, GPT-5.5 as final gate | Model stack validated | Complete model configuration |
