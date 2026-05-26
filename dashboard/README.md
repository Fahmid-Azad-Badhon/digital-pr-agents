# Digital PR Orchestrator Dashboard

A professional localhost web dashboard for the Digital PR workflow automation system.

## Overview

This dashboard serves as a central control center for managing Digital PR campaigns from start to finish, eliminating the need to manually use Codex, Claude Code, or terminal workflows for every campaign.

## Features

- **Campaign Input**: Create campaigns with brief and study content
- **Workflow Monitor**: Track all 14 workflow stages in real-time
- **Angle Selection Studio**: Review and select from 40 generated pitch angles (with mandatory pause gate)
- **Artifact Manager**: Track all workflow files and documents
- **Journalist Collection**: Manage journalist profiles and targeting
- **Pitch Drafting**: Generate 6 email variants
- **Email Optimization**: Finalize and optimize pitch emails
- **Final Package**: Export Google Doc-ready output
- **Validation Center**: Run technical, browser, and production validation
- **Logs & Errors**: Monitor all workflow activity
- **Model Routing**: View AI model tier architecture and assignments

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Charts**: Recharts
- **Icons**: Lucide React
- **State**: React Context

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Navigate to the dashboard directory:
```powershell
cd "D:\Codex Folder\digital-pr-agents\dashboard"
```

2. Install dependencies:
```powershell
npm install
```

3. Start the development server:
```powershell
npm run dev
```

4. Open your browser to:
```
http://localhost:3001
```

## Folder Structure

```
dashboard/
├── src/
│   ├── app/                 # Next.js pages
│   │   ├── page.tsx         # Overview
│   │   ├── campaign/        # Campaign Input
│   │   ├── workflow/        # Workflow Monitor
│   │   ├── angles/          # Angle Selection
│   │   ├── artifacts/       # Artifact Manager
│   │   ├── journalists/     # Journalist Collection
│   │   ├── pitches/         # Pitch Drafting
│   │   ├── optimization/    # Email Optimization
│   │   ├── package/         # Final Package
│   │   ├── validation/      # Validation Center
│   │   ├── logs/            # Logs & Errors
│   │   └── models/          # Model Routing
│   ├── components/          # React components
│   ├── context/             # Data context
│   ├── types/               # TypeScript types
│   └── app/globals.css     # Global styles
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## Workflow Flow

1. **Campaign Input** → Create campaign with brief and study
2. **Auto-Run Stages 1-4** → Intake → Extraction → Research → Angle Generation
3. **Pause at Stage 4** → User must select ONE angle
4. **Auto-Run Stages 5-14** → Beat Matching → Journalist Collection → Intelligence → Pitch Drafting → Optimization → Export → Validation

## Key Gates

1. **Intake Gate**: Requires 00-brief.md + raw-study-copy.md
2. **Insight Gate**: Requires 01-study-notes.md + 02-insights.md
3. **Angle Selection Gate**: Requires 04-angles.md + user selection + confirmed status
4. **Journalist Volume Gate**: Requires 800 journalists per beat
5. **Pitch Draft Gate**: Requires 08-pitch-draft.md
6. **Final Export Gate**: Requires 09-optimized-email.md + 10-google-doc.md + passed

## Model Routing

The dashboard displays the 6-tier model architecture:

- **Tier 1 (Quality Gate)**: GPT-5.5 Thinking - Final editorial judgment
- **Tier 2 (Research)**: Nemotron 3 Super - Long-context research
- **Tier 3 (Production)**: MiniMax M2.5 - Content generation
- **Tier 4 (Orchestration)**: Hy3 Preview - Workflow coordination
- **Tier 5 (QC)**: gpt-oss-120B - Quality control
- **Tier 6 (Technical)**: Qwen/GLM/Poolside - Technical automation

## Future Integration

The dashboard architecture is ready for integration with:

- **AI Models**: OpenAI, Anthropic, Google Gemini, MiniMax, OpenRouter
- **Tools**: Codex, Claude Code, Antigravity, OpenCode
- **Services**: Muck Rack, SERP APIs, Google Docs API
- **Automation**: n8n, Make, Airtable, Google Sheets

## Design

Dark premium theme following the specification:
- Navy sidebar (#0F172A)
- Dark cards (#1E293B)
- Primary accent blue (#2563EB)
- Success green (#22C55E)
- Warning amber (#FBBF24)
- Manual action purple (#A78BFA)

## License

Internal use only - Digital PR Orchestrator System