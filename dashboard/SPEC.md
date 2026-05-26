# Digital PR Orchestrator Dashboard - Specification

## Project Overview
- **Name:** Digital PR Orchestrator Dashboard
- **Type:** Localhost Web Application (Control Center)
- **Root Path:** D:\Codex Folder\digital-pr-agents\dashboard
- **Tech Stack:** Next.js 14 + Tailwind CSS + TypeScript + SQLite (better-sqlite3)
- **Target Users:** Digital PR professionals managing campaign workflows

## Operating Principle
> "OpenCode produces volume. ChatGPT Plus protects quality."

## UI/UX Specification

### Layout Structure
- **Sidebar:** 240px fixed, dark navy (#0F172A), collapsible to 64px
- **Header:** 64px height, sticky, contains current campaign, status, progress
- **Main Content:** Fluid, with 24px padding
- **Responsive:** Desktop-first (1280px+), tablet support at 1024px

### Visual Design

#### Color Palette
```css
--color-primary: #2563EB;
--color-primary-hover: #1D4ED8;
--color-primary-soft: #EFF6FF;

--color-nav-bg: #0F172A;
--color-nav-hover: #1F2937;

--color-bg: #111827;
--color-card: #1E293B;
--color-section: #273449;

--color-text: #E5E7EB;
--color-text-secondary: #CBD5E1;
--color-text-muted: #94A3B8;
--color-border: #334155;

--color-success: #22C55E;
--color-success-soft: #14532D;

--color-warning: #FBBF24;
--color-warning-soft: #78350F;

--color-error: #F87171;
--color-error-soft: #7F1D1D;

--color-info: #60A5FA;
--color-info-soft: #1E3A8A;

--color-manual: #A78BFA;
--color-manual-soft: #4C1D95;
```

#### Typography
- **Font Family:** Inter (system fallback: -apple-system, BlinkMacSystemFont, Segoe UI)
- **Headings:** 
  - H1: 32px/700
  - H2: 24px/600
  - H3: 20px/600
  - H4: 16px/600
- **Body:** 14px/400
- **Small:** 12px/400
- **Mono:** JetBrains Mono (for code/logs)

#### Spacing System
- Base unit: 4px
- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64

#### Components
- **Cards:** Dark premium cards (#1E293B), 12px border-radius, 1px border (#334155)
- **Buttons:** Primary (blue), Secondary (gray), Success (green), Warning (amber), Error (red)
- **Badges:** 6px border-radius, status-specific colors
- **Avatars:** 40px circular, 2px status ring
- **Progress Bars:** 8px height, rounded-full, gradient fills
- **Inputs:** Dark background (#273449), 8px border-radius, focus ring

## Page Specifications

### 1. Overview Page
- KPI Cards: Active Campaigns, Completed Today, Pending Actions, Success Rate
- Current Campaign Banner: Name, client, stage, progress %
- Workflow Timeline: Visual 14-stage timeline
- Interactive Progress Graph: Recharts line/bar/donut combo
- Activity Feed: Real-time log entries
- Pending Actions Panel: Manual decision points
- Validation Alerts: Warnings and failures

### 2. Campaign Input Page
- Campaign Details Form (name, client, topic, region, beats, goal, tone, notes)
- Brief Editor: Rich text or markdown
- Raw Study Editor: Large text area with file upload
- Save Status Indicators
- Start Workflow Button (prominent)

### 3. Workflow Monitor Page
- Pipeline View: 14 stages horizontally
- Stage Cards: Status, owner, inputs, outputs, progress, timing
- Gate Status: Locked/Waiting/Ready/Passed/Failed
- Logs Panel: Expandable per stage
- Error Display: Red panel with details
- Dependency Graph

### 4. Angle Selection Studio (Unlock after 04-angles.md)
- All 40 Angles Grid
- Filter: Beat, Score Range, Status
- Sort: Score, Newsworthiness, Timeliness
- Comparison View: Side-by-side (max 3)
- Action Buttons: Favorite (star), Reject (x), Select (check)
- Confirm Selection Button (creates 05-beats.md with confirmed status)
- Auto-resume trigger after confirmation

### 5. Artifact Manager Page
- File Grid/List Toggle
- Stage Filters
- Status Indicators
- Preview Modal
- Edit/Download Actions
- File Tree View Option

### 6. Journalist Collection Page
- Beat Selector
- Progress toward 800 journalists
- Source Tabs: Muck Rack, SERP, Outlet Pages
- Collection Stats: Total, Duplicates, Missing Email, Invalid
- Start/Stop Collection Buttons

### 7. Pitch Drafting Page
- 6 Variant Cards Grid
- Strongest Recommendation Badge
- Preview/Edit Controls
- Manual Selection Option
- QC Status Display

### 8. Email Optimization Page
- Final Email Preview
- Subject Line Options (3 variants)
- Optimization Log
- Metrics: Word Count, Readability, CTA, Newsworthiness
- Approval Status: Pending/Approved/Revision Required

### 9. Final Package Page
- Full Package Preview
- Section Checklist
- Copy to Clipboard Button
- Download Markdown Button
- Google Doc Export Button

### 10. Validation Center Page
- Technical Validation Panel
- Browser/Search Validation Panel
- Regression Validation Panel
- Score Display: 0-100%
- Check List: Passed/Failed/Warnings
- Retry Button

### 11. Logs & Errors Page
- Tabbed View: Workflow, Agent, File, Search, Export, Errors
- Filterable Log Entries
- Timestamp, Level, Source, Message
- Search Within Logs
- Export Logs Button

### 12. Model Routing Page
- Tier Architecture Diagram (6 tiers)
- Stage-by-Stage Table with all model details
- Quality Gate Status per Stage
- Model Run History
- Fallback Logic Display
- Cost/Speed/Quality Indicators

## Functionality Specification

### Campaign Creation Flow
1. User fills Campaign Input form
2. System creates: pitch-jobs/{slug}/00-brief.md
3. System creates: pitch-jobs/{slug}/source-files/study-inputs/raw-study-copy.md
4. Start Workflow button activates

### Workflow Automation
- Stage 1-4: Auto-executes (simulated for MVP)
- Stage 4 completion triggers: Pause + Notification
- User selects angle in Studio
- System updates: 05-beats.md with Selection status: confirmed
- Stage 5-14: Auto-executes

### Gate Logic
- Gate 1 (Intake): Requires 00-brief.md + raw-study-copy.md
- Gate 2 (Insight): Requires 01-study-notes.md + 02-insights.md
- Gate 3 (Angle Selection): Requires 04-angles.md + user selection + confirmed status
- Gate 4 (Journalist Volume): Requires 800 journalists per selected beat
- Gate 5 (Pitch Draft): Requires 08-pitch-draft.md
- Gate 6 (Final Export): Requires 09-optimized-email.md + 10-google-doc.md + readiness passed

### Angle Selection Pause
- Trigger: 04-angles.md created + GPT-5.5 scoring complete
- UI: Modal/Toast notification + Angle Studio unlock
- Resume Trigger: User confirms selection + 05-beats.md created

### Real-Time Progress
- Polling every 3 seconds (MVP)
- Activity feed updates
- Stage progress bars animate
- Status badges update

## Data Models

### Campaign
```typescript
{
  id: string;
  slug: string;
  name: string;
  clientName: string;
  studyTitle: string;
  topic: string;
  targetRegion: string;
  targetBeats: string[];
  goal: string;
  tone: string;
  notes: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'failed';
  currentStage: number;
  createdAt: string;
  updatedAt: string;
}
```

### WorkflowStage
```typescript
{
  id: string;
  campaignId: string;
  stageNumber: number;
  name: string;
  ownerAgent: string;
  status: 'waiting' | 'ready' | 'running' | 'paused' | 'blocked' | 'needs-user-selection' | 'completed' | 'failed' | 'approved' | 'rejected' | 'skipped';
  progress: number;
  primaryModel: string;
  qualityGateModel: string;
  inputFiles: string[];
  outputFiles: string[];
  logs: ActivityLog[];
  errors: string[];
  startedAt?: string;
  completedAt?: string;
}
```

### Gate
```typescript
{
  id: string;
  name: string;
  stageNumber: number;
  status: 'locked' | 'waiting' | 'ready' | 'passed' | 'failed';
  requirements: string[];
  passedAt?: string;
}
```

### Angle
```typescript
{
  id: number;
  category: string;
  journalistBeats: string[];
  headline: string;
  whyNewsworthy: string;
  score: number;
  newsworthiness: number;
  timeliness: number;
  outreachDifficulty: number;
  publicationType: string;
  localNational: string;
  status: 'pending' | 'favorite' | 'rejected' | 'selected';
  notes: string;
}
```

### ModelRoute
```typescript
{
  stageNumber: number;
  stageName: string;
  tier: number;
  primaryModel: string;
  qualityGateModel: string;
  fallbackModel: string;
  purpose: string;
  costLevel: 'low' | 'medium' | 'high';
  speedLevel: 'fast' | 'medium' | 'slow';
  qualityLevel: 'basic' | 'good' | 'excellent';
  isMandatory: boolean;
  status: 'idle' | 'running' | 'completed' | 'failed';
}
```

## Acceptance Criteria

### Must Have
- [ ] Dashboard runs from D:\Codex Folder\digital-pr-agents\dashboard
- [ ] All 12 pages render correctly
- [ ] Campaign creation creates correct folder structure
- [ ] Workflow stages track status correctly
- [ ] Angle Selection pauses workflow and shows notification
- [ ] Confirm selection resumes workflow
- [ ] Model Routing page shows all 6 tiers
- [ ] Real-time progress updates
- [ ] Dark premium design implemented

### Should Have
- [ ] KPI cards show live data
- [ ] Charts render with sample data
- [ ] Logs display formatted entries
- [ ] Validation checks run

### Future-Ready
- [ ] API routes for real AI integration
- [ ] WebSocket-ready architecture
- [ ] Muck Rack integration points
- [ ] Google Docs export endpoint