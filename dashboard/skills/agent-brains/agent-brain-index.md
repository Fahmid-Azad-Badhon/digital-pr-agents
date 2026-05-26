# Agent Brain Index

This index maps all workflow stages to their corresponding agents and brain files.

## Stage to Agent Mapping

| Stage | Agent | Brain File | Receives | Produces | Hands Off To | Status |
|-------|-------|------------|----------|----------|--------------|--------|
| S1 | Orchestrator | orchestrator.brain.md | Campaign brief | 00-brief.md | Data Extractor (S2) | Active |
| S2 | Data Extractor | data-extractor.brain.md | Campaign brief, raw study | 02-insights.md | Researcher (S3) | Active |
| S3 | Researcher | researcher.brain.md | InternalDataMap | 03-research.md | Data & Research Analyst (S4) | Active |
| S4A | Data & Research Analyst | data-and-research-analyst.brain.md | ResearchEnrichment | verified-findings.json | Insight Analyst (S4B) | Active |
| S4B | Insight Analyst | insight-analyst.brain.md | verified-findings.json | 04-analysis.md, InsightAnalysisMap | Strategist (S5) | Active |
| S5 | Strategist | strategist.brain.md | 04-analysis.md | 04-angles.md | Beat Matcher (S6) | Active |
| S6 | Beat Matcher | beat-matcher.brain.md | Pitch angles | 05-beats.md | Human Reviewer (S7) | Active |
| S7 | Human Reviewer | human-reviewer.brain.md | Beat mapping | 04-angles-selected.md | Collector (S8) | Active |
| S8 | Collector | collector.brain.md | Selected angles | journalists.json | Intelligence (S9) | Active |
| S9 | Intelligence | intelligence.brain.md | Journalist list | 06-journalist-intel.md | Copywriter (S10) | Active |
| S10 | Copywriter | copywriter.brain.md | Journalist profiles | 08-pitch-draft.md | Optimizer (S11) | Active |
| S11 | Optimizer | optimizer.brain.md | Pitch variants | 09-optimized-email.md | Packager (S12) | Active |
| S12 | Packager | packager.brain.md | Optimized email | final-package.md | Orchestrator (S13) | Active |
| S13 | Orchestrator | orchestrator.brain.md | Final package | google-doc-export.md | Validator (S14) | Active |
| S14 | Validator | validator.brain.md | Export package | validation-results.json | Collector (S15) | Active |
| S15 | Collector | collector.brain.md | Validation results | browser-validation.json | Production (S16) | Active |
| S16 | Production | production.brain.md | Validation results | production-status.json | — (Complete) | Active |

## Agent Summary

| Agent ID | Agent Name | Role | Stages | Brain File |
|----------|-----------|------|--------|------------|
| orchestrator | Orchestrator | Workflow Controller | 1, 7, 13 | orchestrator.brain.md |
| extractor | Data Extractor | Study Analyst | 2 | data-extractor.brain.md |
| researcher | Researcher | SERP Analyst | 3 | researcher.brain.md |
| data-analyst | Data & Research Analyst | Evidence Validator | 4 (4A) | data-and-research-analyst.brain.md |
| insight-analyst | Insight Analyst | Storyline Strategist | 4 (4B) | insight-analyst.brain.md |
| strategist | Strategist | Angle Planner | 5 | strategist.brain.md |
| beat-matcher | Beat Matcher | Beat Mapper | 6 | beat-matcher.brain.md |
| human-reviewer | Human Reviewer | Decision Maker | 7 | human-reviewer.brain.md |
| collector | Collector | Journalist Hunter | 8, 15 | collector.brain.md |
| intelligence | Intelligence | Profile Analyzer | 9 | intelligence.brain.md |
| copywriter | Copywriter | Pitch Creator | 10 | copywriter.brain.md |
| optimizer | Optimizer | Email Refiner | 11 | optimizer.brain.md |
| packager | Packager | Doc Builder | 12 | packager.brain.md |
| validator | Validator | Quality Checker | 14 | validator.brain.md |
| production | Production | Final QA | 16 | production.brain.md |

## Key Architecture Notes

### Stage 4 Dual-Agent System
- **Stage 4** contains two separate agents within one shared stage
- **4A**: Data & Research Analyst (validates evidence)
- **4B**: Insight Analyst (creates strategic insights)
- Handoff is internal (4A → 4B), then external to S5

### Anti-Hallucination Rules (All Agents)
All brain files include:
- Do not invent statistics
- Do not invent sources
- Do not invent study findings
- Do not invent journalist names
- Do not treat placeholder research as real
- Do not mark stages complete without required outputs
- Do not pass weak evidence forward without warning

### Five Core Pillars (All Agents)
Each brain file includes:
1. **Memory** - What the agent can read/write
2. **Tools** - What the agent can use
3. **Rules** - Guardrails and constraints
4. **Output Schema** - What the agent produces
5. **Handoff** - What goes to the next agent

### File Locations
- Brain files: `skills/agent-brains/*.brain.md`
- TypeScript types: `src/types/agentBrain.ts` (and related)
- Registries: `src/data/agentBrainRegistry.ts`, `agentToolRegistry.ts`, `agentHandoffRegistry.ts`, `agentGuardrails.ts`