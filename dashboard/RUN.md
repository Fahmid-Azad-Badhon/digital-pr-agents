# RUN.md - Digital PR Dashboard Run Instructions

## Prerequisites

- **Node.js**: Version 18+ (includes npm)
- **PowerShell**: Windows (for running commands)
- **Browser**: Chrome/Edge recommended
- **Git**: Optional (for version control)

## Quick Start

### 1. Navigate to Dashboard Folder

```powershell
cd "D:\Codex Folder\digital-pr-agents\dashboard"
```

### 2. Install Dependencies (First Time Only)

```powershell
npm install
```

**Note:** If you see `npm error code ETARGET` about sqlite3, this is normal - the parent folder has workspace configuration. The dashboard uses in-memory state for MVP.

### 3. Start Development Server

```powershell
npm run dev
```

**Expected Output:**
```
> digital-pr-dashboard@1.0.0 dev
> next dev -p 3001

  ▲ Next.js 14.2.3
  - Local:        http://localhost:3001
 ✓ Ready in X.Xs
```

### 4. Open Dashboard

Open your browser and navigate to:
```
http://localhost:3001
```

---

## Dashboard Features

### Overview Page (`/`)
- KPI cards (Active Campaigns, Completed Today, Pending Actions, Success Rate)
- Workflow progress chart (last 7 days)
- Stage distribution donut chart
- Current campaign banner with progress
- Recent activity feed
- Gate status panel
- Quick action buttons

### Campaign Input Page (`/campaign`)
- Campaign details form (name, client, study title, topic, etc.)
- Target beats selection (min 3 required)
- Campaign brief editor
- Raw study copy editor
- Upload buttons (simulated)
- **Start Workflow** button

### Workflow Monitor (`/workflow`)
- Pipeline view (visual timeline of 14 stages)
- List view (detailed table)
- Stage cards with progress bars
- Expandable stage details
- Real-time progress simulation
- Gate status indicators

### Angle Selection Studio (`/angles`)
- 40 pitch angles grid/list view
- Filter by category or status
- Sort by score, newsworthiness, timeliness
- Compare up to 3 angles side-by-side
- Favorite/Reject/Select actions
- **CRITICAL GATE**: Workflow pauses here until user selects an angle
- Confirm Selection button resumes workflow

### Artifact Manager (`/artifacts`)
- Track all workflow files (00-brief.md, 01-study-notes.md, etc.)
- Grid/List view toggle
- Filter by stage or search
- File size and status display
- Preview/Download/Edit actions (simulated)

### Journalist Collection (`/journalists`)
- Collection status stats
- Beat-based collection progress
- Muck Rack/SERP/Outlet collection tabs
- Duplicate detection stats
- **Note:** Requires angle selection first

### Pitch Drafting (`/pitches`)
- 6 pitch variant cards
- Strongest recommendation badge
- Preview/Edit controls
- Manual selection option
- **Note:** Requires journalist intelligence stage

### Email Optimization (`/optimization`)
- Final optimized email preview
- Subject line options
- Optimization log
- Metrics (word count, readability, CTA strength)
- Approval status
- **Note:** Requires pitch drafting stage

### Final Package (`/package`)
- 10-google-doc.md preview
- Section checklist
- Copy to clipboard button
- Download markdown button
- Google Doc export button (simulated)
- **Note:** Requires email optimization

### Validation Center (`/validation`)
- Production readiness score
- Technical/Browser/Regression/Production tabs
- Validation check results
- Passed/Failed/Warning counts
- Run Validation button (simulated)

### Logs & Errors (`/logs`)
- Activity log feed
- Filter by category (Workflow/Agent/File/Error)
- Filter by level (Info/Success/Warning/Error)
- Search within logs
- Export logs button (simulated)

### Model Routing (`/models`)
- 6-tier model architecture diagram
- Stage-by-stage assignments table
- Primary model, Quality Gate, Fallback model
- Cost/Speed/Quality indicators
- Mandatory gate indicators

---

## Workflow Simulation

The dashboard includes a **simulated workflow engine**:

1. **Create Campaign** → Fill form on `/campaign` page
2. **Save Campaign** → Click "Save Campaign"
3. **Start Workflow** → Click "Start Workflow" 
4. **Stages 1-4 Auto-Run** → Watch progress bars on `/workflow`
   - Stage 1: Campaign Intake (completed instantly)
   - Stage 2: Study Extraction (progress animation)
   - Stage 3: Research Enrichment (progress animation)
   - Stage 4: Angle Generation (progress animation)
5. **PAUSE AT STAGE 4** → Red banner appears
6. **Go to Angle Selection** → Click "Select Angle" button
7. **Review 40 Angles** → Browse on `/angles` page
8. **Select One Angle** → Click "Select" on preferred angle
9. **Confirm Selection** → Click "Confirm & Continue" (bottom of page)
10. **Workflow Resumes** → Stages 5-14 auto-run (simulated)

---

## Key Gates (Mandatory Pause Points)

### Gate 1: Intake Gate
- **Requirement:** 00-brief.md + raw-study-copy.md
- **Status:** Ready (auto-passes for MVP)

### Gate 2: Insight Gate
- **Requirement:** 01-study-notes.md + 02-insights.md
- **Status:** Locked → Ready after Stage 2

### Gate 3: Angle Selection Gate (CRITICAL)
- **Requirement:** 04-angles.md + User Selection + "Selection status: confirmed"
- **Status:** Locked → Waiting → **PAUSES WORKFLOW**
- **Action:** User must select angle on `/angles` page

### Gate 4: Journalist Volume Gate
- **Requirement:** 800 journalists per selected beat
- **Status:** Locked (simulated for MVP)

### Gate 5: Pitch Draft Gate
- **Requirement:** 08-pitch-draft.md
- **Status:** Locked (simulated for MVP)

### Gate 6: Final Export Gate
- **Requirement:** 09-optimized-email.md + 10-google-doc.md + Production Readiness Passed
- **Status:** Locked (simulated for MVP)

---

## Model Routing Architecture

Displayed on `/models` page:

| Tier | Name | Model | Purpose |
|------|------|-------|---------|
| 1 | Quality Gate | GPT-5.5 Thinking | Final editorial judgment, angle scoring |
| 2 | Research | Nemotron 3 Super | Long-context study extraction |
| 3 | Production | MiniMax M2.5 | Pitch variants, email optimization |
| 4 | Orchestration | Hy3 Preview | Campaign setup, angle generation |
| 5 | QC | gpt-oss-120B | Pitch teardown, weak angle detection |
| 6 | Technical | Qwen/GLM/Poolside | Dashboard code, scripts, export |

**Operating Principle:**
> "OpenCode produces volume. ChatGPT Plus protects quality."

---

## Stopping the Server

Press `Ctrl + C` in the PowerShell window where `npm run dev` is running.

---

## Rebuilding (After Code Changes)

```powershell
# Stop server (Ctrl+C), then:
npm run build  # Verify no TypeScript errors
npm run dev   # Restart with changes
```

---

## Troubleshooting

### Issue: `npm error code ETARGET`
**Solution:** This is caused by the parent `digital-pr-agents\package.json` having workspaces. The dashboard `package.json` has been configured to avoid this. If it persists:
```powershell
# Remove node_modules and package-lock.json from dashboard folder
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

### Issue: `Type error: ... is not assignable...`
**Solution:** Run `npm run build` to see exact error. Common fixes:
- Check function signatures match their usage
- Add optional chaining (`?.`) for potentially undefined values
- Ensure all required fields are present in objects

### Issue: Page shows 404
**Solution:** Make sure you're accessing `http://localhost:3001` (not 3000)

### Issue: Styles not loading
**Solution:** 
```powershell
Remove-Item -Recurse -Force .next
npm run build
npm run dev
```

---

## Future Integration Points

The dashboard is architected for future integration with:

### AI Models
- **OpenAI API**: GPT-5.5, gpt-oss-120B
- **OpenRouter**: Nemotron, MiniMax, Hy3, Qwen, GLM, Poolside
- **Claude API**: Claude Code integration
- **Gemini API**: Google model integration

### Tools
- **Muck Rack**: Journalist collection via browser automation
- **SERP APIs**: Search Engine Results Pages
- **n8n/Make**: Workflow automation platforms

### Export
- **Google Docs API**: Export to Google Docs
- **Google Drive API**: Cloud storage
- **Airtable**: Database backend
- **Google Sheets**: Spreadsheet export

---

## File Structure

```
dashboard/
├── src/
│   ├── app/                    # Next.js pages (App Router)
│   │   ├── layout.tsx          # Root layout with DataProvider
│   │   ├── page.tsx            # Overview (/)
│   │   ├── globals.css         # Global styles
│   │   ├── campaign/           # Campaign Input (/campaign)
│   │   ├── workflow/           # Workflow Monitor (/workflow)
│   │   ├── angles/             # Angle Selection (/angles)
│   │   ├── artifacts/          # Artifact Manager (/artifacts)
│   │   ├── journalists/        # Journalist Collection (/journalists)
│   │   ├── pitches/            # Pitch Drafting (/pitches)
│   │   ├── optimization/       # Email Optimization (/optimization)
│   │   ├── package/            # Final Package (/package)
│   │   ├── validation/         # Validation Center (/validation)
│   │   ├── logs/               # Logs & Errors (/logs)
│   │   ├── models/             # Model Routing (/models)
│   │   └── api/                 # API routes
│   │       ├── health/route.ts   # Health check
│   │       └── campaigns/route.ts  # Campaign API
│   ├── components/           # Reusable components
│   │   └── Layout.tsx         # Sidebar + Header
│   ├── context/              # React Context
│   │   └── DataContext.tsx   # Global state management
│   └── types/                # TypeScript types
│       └── index.ts          # All type definitions
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── tailwind.config.ts        # Tailwind CSS config
├── next.config.js           # Next.js config
├── postcss.config.js          # PostCSS config
├── README.md                 # Project overview
├── SPEC.md                  # Full specification
└── RUN.md                   # This file
```

---

## Current Status

✅ **BUILD SUCCESSFUL** - All 23 pages compile successfully
✅ **DEVELOPMENT SERVER RUNNING** - http://localhost:3001
✅ **CORE PAGES COMPLETE** - Overview, Campaign, Workflow, Angles, Artifacts, Models, Validation, Logs
✅ **SIMULATED WORKFLOW** - Auto-run stages with pause at Angle Selection
✅ **DARK PREMIUM UI** - Follows specification with navy sidebar, dark cards, blue primary

### Remaining Work (Optional Enhancement)
- [ ] Connect to real AI APIs (OpenAI, OpenRouter)
- [ ] Implement real file system operations (read/write markdown files)
- [ ] Add WebSocket for true real-time progress
- [ ] Create remaining API routes (/journalists, /logs, /workflow, etc.)
- [ ] Implement Muck Rack browser automation integration
- [ ] Add Google Docs export functionality
- [ ] Create unit/integration tests

---

## Support

For issues:
1. Check `npm run build` output for TypeScript errors
2. Check browser console for runtime errors
3. Verify all files are in correct locations
4. Ensure Node.js 18+ is installed (`node --version`)

Dashboard Control Center: **http://localhost:3001**
