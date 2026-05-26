Digital PR Orchestrator — Local Dashboard (MVP)
Root path: D:\Codex Folder\digital-pr-agents

What this project is:
- A localhost web dashboard to manage the DIGITAL-PR-ORCHESTRATOR workflow from campaign intake to final Google Doc export.
- Tailwind-enabled UI with a SQLite-based data store (data/pr_orchestrator.sqlite3) replacing the prior JSON store.
- Provides a single-entry web UI to create campaigns, write/upload briefs and raw study content, start the workflow, pause after angle generation, approve angles, and continue to final steps.

How to run locally (Windows):
1) Ensure Node.js is installed (12+).
2) Open a terminal and run from the repository root (the Windows path above).
3) Install dependencies: npm install
4) Start the dev server: npm run dev
5) Open http://localhost:3000 in a browser.

Notes:
- Tailwind CSS is enabled; the UI is responsive and modernized.
- SQLite database is used for campaign state; the file-based workspace still resides under CAMPAIGNS as per your requirements.
- All path references use your exact Windows root path: D:\\Codex Folder\\digital-pr-agents

Notes:
- All file IO targets the root path with spaces in the path properly escaped.
- The MVP uses simulated AI outputs, but the architecture is designed to hook real AI APIs later (Codex/Claude/OpenAI, etc.).
- Campaigns are saved under D:\Codex Folder\digital-pr-agents\CAMPAIGNS; briefs under 00-brief.md and raw study copies under source-files/study-inputs/raw-study-copy.md.

Data models are simplified for MVP; see src/README for deeper model discussions and future extension.
