# Digital PR Workflow Tree With Agents And Sub-Agents

This tree shows the full workflow around the Muck Rack bulk-collection lane inside `digital-pr-agents`.

## Tree

```text
digital-pr-orchestrator [main agent]
|
+-- study-insight-extractor [sub-agent]
|   |
|   +-- inputs
|   |   +-- 00-brief.md
|   |   `-- source-files/study-inputs/raw-study-copy.md
|   |
|   +-- outputs
|   |   +-- 01-study-notes.md
|   |   `-- 02-insights.md
|   |
|   `-- scripted bridge
|       `-- scripts/draft-study-input.js
|
+-- research-enrichment-agent [sub-agent]
|   |
|   +-- inputs
|   |   +-- 01-study-notes.md
|   |   `-- 02-insights.md
|   |
|   `-- output
|       `-- 03-research.md
|
+-- angle-generator [sub-agent]
|   |
|   +-- inputs
|   |   +-- 02-insights.md
|   |   `-- 03-research.md
|   |
|   `-- output
|       `-- 04-angles.md
|
+-- beat-matcher [sub-agent]
|   |
|   +-- input
|   |   `-- 04-angles.md
|   |
|   `-- output
|       `-- 05-beats.md
|
+-- journalist-intelligence-agent [sub-agent]
|   |
|   +-- inputs
|   |   +-- 00-brief.md
|   |   +-- 04-angles.md
|   |   +-- 05-beats.md
|   |   `-- source-files/journalist-intel/
|   |
|   +-- sub-agent
|   |   `-- muck-rack-bulk-collector [specialist skill]
|   |       |
|   |       +-- inputs
|   |       |   +-- 05-beats.md
|   |       |   +-- source-files/journalist-intel/bulk-beat-queries*.json
|   |       |   `-- logged-in debug Chrome Muck Rack session
|   |       |
|   |       +-- helper lanes
|   |       |   +-- query designer
|   |       |   |   `-- converts beat intent into Boolean and multi-query beat files
|   |       |   +-- session bootstrap
|   |       |   |   `-- scripts/launch-debug-chrome.cmd
|   |       |   +-- collector runner
|   |       |   |   `-- scripts/collect-beat-journalists.js
|   |       |   +-- resume reconciler
|   |       |   |   `-- resumes from unfinished beat folders and checkpoint files
|   |       |   `-- manifest rebuilder
|   |       |       `-- rebuilds combined CSV and summary files after partial reruns
|   |       |
|   |       `-- outputs
|   |           `-- source-files/journalist-intel/bulk-beat-collection/
|   |               +-- per-beat JSON
|   |               +-- per-beat Markdown
|   |               +-- all-beat-journalists.csv
|   |               +-- all-beat-journalists-deduped.csv
|   |               +-- summary-all.json
|   |               `-- summary-all.md
|   |
|   +-- scripted bridges
|   |   +-- scripts/import-muckrack-output.js
|   |   `-- scripts/draft-journalist-intel.js
|   |
|   `-- outputs
|       +-- 06-journalist-intel.md
|       `-- 07-journalist-coverage.md
|
+-- pitch-writer [sub-agent]
|   |
|   +-- inputs
|   |   +-- 00-brief.md
|   |   +-- 04-angles.md
|   |   +-- 05-beats.md
|   |   +-- 06-journalist-intel.md
|   |   `-- 07-journalist-coverage.md
|   |
|   +-- outputs
|   |   +-- draft-variants/08a-straight-news.md
|   |   +-- draft-variants/08b-short-punchy.md
|   |   +-- draft-variants/08c-data-heavy.md
|   |   +-- draft-variants/08d-journalist-personalized.md
|   |   +-- draft-variants/08e-storytelling-narrative.md
|   |   +-- draft-variants/08f-localized.md
|   |   `-- 08-pitch-draft.md
|   |
|   `-- scripted bridge
|       `-- scripts/draft-pitch-draft.js
|
+-- email-optimizer [sub-agent]
|   |
|   +-- inputs
|   |   +-- 04-angles.md
|   |   +-- 05-beats.md
|   |   +-- 06-journalist-intel.md
|   |   +-- 07-journalist-coverage.md
|   |   `-- 08-pitch-draft.md
|   |
|   `-- output
|       `-- 09-optimized-email.md
|
`-- final-doc-packager [sub-agent]
    |
    +-- inputs
    |   +-- 04-angles.md
    |   +-- 05-beats.md
    |   +-- 06-journalist-intel.md
    |   +-- 07-journalist-coverage.md
    |   `-- 09-optimized-email.md
    |
    +-- outputs
    |   `-- 10-google-doc.md
    |
    `-- scripted bridge
        `-- scripts/export-google-doc.js
```

## Reading Notes

- `digital-pr-orchestrator` is the main controller.
- The Muck Rack bulk-collection workflow lives inside the `journalist-intelligence-agent` lane.
- `muck-rack-bulk-collector` is the reusable specialist skill for high-volume journalist collection.
- The helper lanes under `muck-rack-bulk-collector` are operational roles inside the workflow, not separate installed repo skills.
- The numbered stage files remain the handoff contract across the whole system.
