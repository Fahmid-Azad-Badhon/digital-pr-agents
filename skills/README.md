# Skills

Purpose: store reusable Digital PR agent and sub-agent instructions.

Each production skill should include:

- `SKILL.md` with role, inputs, process, outputs, gates, failure handling, and handoff rules.
- `agents/openai.yaml` when the skill is intended to be callable as a named agent.
- `scripts/` only when the skill owns executable validation or generation logic.
- `references/` only for durable supporting material that should not live inside the main skill prompt.

Current active skills:

- `digital-pr-orchestrator`
- `study-insight-extractor`
- `research-enrichment-agent`
- `angle-generator`
- `beat-matcher`
- `journalist-intelligence-agent`
- `journalist-targeting-subagent`
- `muck-rack-bulk-collector`
- `pitch-writer`
- `email-optimizer`
- `final-doc-packager`

Rules:

- Do not let two skills own the same final output without an explicit handoff rule.
- Do not allow any skill to invent sources, journalist details, quotes, or Muck Rack results.
- Missing information must be written as `Information unavailable. Verification required before use.`
- Browser, SERP, Boolean search, and Muck Rack capabilities must be validated before being claimed.

