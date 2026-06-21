export type CampaignStatus = 'draft' | 'running' | 'paused' | 'completed' | 'failed';
export type StageStatus = 'locked' | 'waiting' | 'ready' | 'running' | 'paused' | 'blocked' | 'needs-user-selection' | 'needs_review' | 'in_review' | 'completed' | 'failed' | 'approved' | 'rejected' | 'skipped';
export type GateStatus = 'locked' | 'waiting' | 'ready' | 'passed' | 'failed';
export type AngleStatus = 'pending' | 'undecided' | 'selected' | 'rejected' | 'favorite';
export type PitchAngleStatus = 'undecided' | 'selected' | 'rejected';
export type BeatPriority = 'High' | 'Medium' | 'Low';
export type ModelStatus = 'idle' | 'running' | 'completed' | 'failed';
export type LogLevel = 'info' | 'warning' | 'error' | 'success';
export type ActorType = 'agent' | 'human' | 'human_gate' | 'hybrid';
export type WorkflowPhase = 'Intake & Study' | 'Research & Angles' | 'Media Intelligence' | 'Pitch Production' | 'Packaging & Export' | 'Validation & Production';

export interface Campaign {
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
  status: CampaignStatus;
  currentStage: number;
  createdAt: string;
  updatedAt: string;
  selectedAngleId?: number;
  preflightPassed?: boolean;
}

export interface WorkflowStage {
  id: string;
  campaignId: string;
  stageNumber: number;
  name: string;
  ownerAgent: string;
  status: StageStatus;
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

export interface Gate {
  id: string;
  name: string;
  stageNumber: number;
  agentId: string;
  status: GateStatus;
  requirements: string[];
  passedAt?: string;
}

export interface Angle {
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
  status: AngleStatus;
  notes: string;
}

export interface PitchAngle {
  id: string;
  campaignId: string;
  title: string;
  summary: string;
  category?: string;
  targetBeats?: string[];
  whyNewsworthy?: string;
  score?: number;
  primaryBeat: string;
  secondaryBeat: string;
  beatPriority: BeatPriority;
  outletType: string;
  newsworthinessScore: number;
  relevanceScore: number;
  timelinessScore: number;
  outreachDifficulty?: number;
  whyItWorks: string;
  subjectLine: string;
  status: PitchAngleStatus;
  selectedAt?: string;
  selectedBy?: string;
  rejectionReason?: string;
}

export interface PitchSelectionState {
  availableAngles: PitchAngle[];
  selectedAngles: PitchAngle[];
  rejectedAngles: PitchAngle[];
  status: 'locked' | 'waiting' | 'needs_review' | 'in_review' | 'completed' | 'failed';
  selectedBy: string | null;
  selectedAt: string | null;
  error: string | null;
}

export interface WorkflowState {
  currentStage: number;
  totalStages: number;
  currentPhase: WorkflowPhase;
  activeAgent: string;
  activeActor: ActorType;
  completedStages: number[];
  lockedStages: number[];
  pendingApprovals: string[];
  pitchSelection: PitchSelectionState | null;
  selectedPitchAngles: PitchAngle[];
  rejectedPitchAngles: PitchAngle[];
  validationIssues: string[];
  recentActivity: ActivityLog[];
}

export interface ModelRoute {
  stageNumber: number;
  stageName: string;
  tier: number;
  tierName: string;
  primaryModel: string;
  qualityGateModel: string;
  fallbackModel: string;
  purpose: string;
  costLevel: 'low' | 'medium' | 'high';
  speedLevel: 'fast' | 'medium' | 'slow';
  qualityLevel: 'basic' | 'good' | 'excellent';
  isMandatory: boolean;
  status: ModelStatus;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
  details?: string;
}

export interface Journalist {
  id: string;
  name: string;
  outlet: string;
  beat: string;
  email?: string;
  twitter?: string;
  relevanceScore: number;
  personalizationNotes: string;
  recentArticles: string[];
}

export interface PitchVariant {
  id: string;
  variantType: string;
  content: string;
  subjectLine: string;
  wordCount: number;
  status: 'draft' | 'selected' | 'rejected';
}

export interface ValidationCheck {
  id: string;
  name: string;
  category: 'technical' | 'browser' | 'regression' | 'production';
  status: 'passed' | 'failed' | 'warning';
  message: string;
  checkedAt: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'manual-action';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface KPI {
  label: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon?: string;
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface WorkflowProgress {
  date: string;
  completed: number;
  running: number;
  paused: number;
  failed: number;
}

export const STAGES = [
  { number: 1, name: 'Campaign Intake', owner: 'orchestrator' },
  { number: 2, name: 'Data Extraction', owner: 'extractor' },
  { number: 3, name: 'Research Enrichment', owner: 'researcher' },
  { number: 4, name: 'Data & Research Analysis', owner: 'data-analyst', secondaryOwner: 'insight-analyst' },
  { number: 5, name: 'Angle Generation', owner: 'strategist' },
  { number: 6, name: 'Beat Matching', owner: 'beat-matcher' },
  { number: 7, name: 'Pitch Selection', owner: 'human-reviewer' },
  { number: 8, name: 'Journalist Collection', owner: 'collector' },
  { number: 9, name: 'Journalist Intelligence', owner: 'intelligence' },
  { number: 10, name: 'Pitch Drafting', owner: 'copywriter' },
  { number: 11, name: 'Email Optimization', owner: 'optimizer' },
  { number: 12, name: 'Final Package', owner: 'packager' },
  { number: 13, name: 'Google Doc Export', owner: 'orchestrator' },
  { number: 14, name: 'Technical Validation', owner: 'validator' },
  { number: 15, name: 'Browser Validation', owner: 'collector' },
  { number: 16, name: 'Regression & Production', owner: 'production' },
] as const;

export const AGENTS = [
  { id: 'orchestrator', name: 'Orchestrator', role: 'Workflow Controller', color: 'bg-blue-600', stages: [1, 7, 13] },
  { id: 'human-reviewer', name: 'Human Reviewer', role: 'Decision Maker', color: 'bg-amber-500', stages: [7] },
  { id: 'extractor', name: 'Data Extractor', role: 'Study Analyst', color: 'bg-green-600', stages: [2] },
  { id: 'researcher', name: 'Researcher', role: 'SERP Analyst', color: 'bg-purple-600', stages: [3] },
  { id: 'data-analyst', name: 'Data & Research Analyst', role: 'Evidence Validator', color: 'bg-emerald-600', stages: [4], description: 'Validates statistics, claims, sources, and evidence quality. First layer of Stage 4.' },
  { id: 'insight-analyst', name: 'Insight Analyst', role: 'Storyline Strategist', color: 'bg-teal-600', stages: [4], description: 'Turns verified evidence into strategic storylines and angle directions. Second layer of Stage 4.' },
  { id: 'strategist', name: 'Strategist', role: 'Angle Planner', color: 'bg-orange-600', stages: [5] },
  { id: 'beat-matcher', name: 'Beat Matcher', role: 'Beat Mapper', color: 'bg-pink-600', stages: [6] },
  { id: 'collector', name: 'Collector', role: 'Journalist Hunter', color: 'bg-cyan-600', stages: [8, 15] },
  { id: 'intelligence', name: 'Intelligence', role: 'Profile Analyzer', color: 'bg-indigo-600', stages: [9] },
  { id: 'copywriter', name: 'Copywriter', role: 'Pitch Creator', color: 'bg-yellow-600', stages: [10] },
  { id: 'optimizer', name: 'Optimizer', role: 'Email Refiner', color: 'bg-amber-600', stages: [11] },
  { id: 'packager', name: 'Packager', role: 'Doc Builder', color: 'bg-rose-600', stages: [12] },
  { id: 'validator', name: 'Validator', role: 'Quality Checker', color: 'bg-violet-600', stages: [14] },
  { id: 'production', name: 'Production', role: 'Final QA', color: 'bg-red-600', stages: [16] },
] as const;

export const MODEL_ROUTES: ModelRoute[] = [
  { stageNumber: 1, stageName: 'Campaign Intake', tier: 4, tierName: 'Orchestration', primaryModel: 'Nemotron 3 Ultra', qualityGateModel: 'GPT-OSS-120B', fallbackModel: 'Nemotron 3 Super', purpose: 'Campaign setup and brief structuring', costLevel: 'low', speedLevel: 'fast', qualityLevel: 'good', isMandatory: false, status: 'idle' },
  { stageNumber: 2, stageName: 'Data Extraction', tier: 2, tierName: 'Research', primaryModel: 'Nemotron 3 Super', qualityGateModel: 'GPT-OSS-120B', fallbackModel: 'Gemma 4 31B', purpose: 'Long-context study extraction and analysis', costLevel: 'low', speedLevel: 'medium', qualityLevel: 'excellent', isMandatory: true, status: 'idle' },
  { stageNumber: 3, stageName: 'Research Enrichment', tier: 2, tierName: 'Research', primaryModel: 'Nemotron 3 Super', qualityGateModel: 'GPT-OSS-120B', fallbackModel: 'Qwen3 Coder', purpose: 'SERP research and source verification', costLevel: 'low', speedLevel: 'medium', qualityLevel: 'excellent', isMandatory: true, status: 'idle' },
  { stageNumber: 4, stageName: 'Data & Research Analysis', tier: 2, tierName: 'Research', primaryModel: 'GPT-OSS-120B', qualityGateModel: 'Nemotron 3 Super', fallbackModel: 'Nemotron 3 Ultra', purpose: 'Cross-validate statistics, analyze keywords, score source credibility, produce campaign insights', costLevel: 'low', speedLevel: 'medium', qualityLevel: 'excellent', isMandatory: true, status: 'idle' },
  { stageNumber: 5, stageName: 'Angle Generation', tier: 4, tierName: 'Orchestration', primaryModel: 'Nemotron 3 Ultra', qualityGateModel: 'GPT-OSS-120B', fallbackModel: 'Hermes 3 405B', purpose: 'Generate 40 pitch angles across 20 categories', costLevel: 'low', speedLevel: 'fast', qualityLevel: 'good', isMandatory: true, status: 'idle' },
  { stageNumber: 6, stageName: 'Beat Matching', tier: 4, tierName: 'Orchestration', primaryModel: 'Nemotron 3 Nano 30B', qualityGateModel: 'GPT-OSS-120B', fallbackModel: 'Nemotron 3 Super', purpose: 'Map angles to journalist beats', costLevel: 'low', speedLevel: 'fast', qualityLevel: 'good', isMandatory: false, status: 'idle' },
  { stageNumber: 7, stageName: 'Pitch Selection', tier: 4, tierName: 'Orchestration', primaryModel: 'GPT-OSS-120B', qualityGateModel: 'Nemotron 3 Ultra', fallbackModel: 'Nemotron 3 Super', purpose: 'Human review + Orchestrator selection of best angles', costLevel: 'low', speedLevel: 'fast', qualityLevel: 'good', isMandatory: true, status: 'idle' },
  { stageNumber: 8, stageName: 'Journalist Collection', tier: 4, tierName: 'Orchestration', primaryModel: 'Nemotron 3 Nano 30B', qualityGateModel: 'Nemotron 3 Super', fallbackModel: 'Qwen3 Coder', purpose: 'Collect 800 journalists per beat via Muck Rack/SERP', costLevel: 'low', speedLevel: 'medium', qualityLevel: 'good', isMandatory: false, status: 'idle' },
  { stageNumber: 9, stageName: 'Journalist Intelligence', tier: 2, tierName: 'Research', primaryModel: 'Nemotron 3 Super', qualityGateModel: 'GPT-OSS-120B', fallbackModel: 'MiniMax M2.5', purpose: 'Analyze journalist profiles and coverage history', costLevel: 'low', speedLevel: 'medium', qualityLevel: 'excellent', isMandatory: true, status: 'idle' },
  { stageNumber: 10, stageName: 'Pitch Drafting', tier: 3, tierName: 'Production', primaryModel: 'MiniMax M2.5', qualityGateModel: 'GPT-OSS-120B', fallbackModel: 'Hermes 3 405B', purpose: 'Generate 6 pitch variants (straight, punchy, data-heavy, personalized, narrative, localized)', costLevel: 'low', speedLevel: 'fast', qualityLevel: 'good', isMandatory: true, status: 'idle' },
  { stageNumber: 11, stageName: 'Email Optimization', tier: 1, tierName: 'Quality Gate', primaryModel: 'Hermes 3 405B', qualityGateModel: 'GPT-OSS-120B', fallbackModel: 'MiniMax M2.5', purpose: 'Final email optimization with 16-factor scorecard, min 8.5/10', costLevel: 'low', speedLevel: 'slow', qualityLevel: 'excellent', isMandatory: true, status: 'idle' },
  { stageNumber: 12, stageName: 'Final Package', tier: 3, tierName: 'Production', primaryModel: 'MiniMax M2.5', qualityGateModel: 'GPT-OSS-120B', fallbackModel: 'Hermes 3 405B', purpose: 'Compile final export-ready package', costLevel: 'low', speedLevel: 'fast', qualityLevel: 'good', isMandatory: false, status: 'idle' },
  { stageNumber: 13, stageName: 'Google Doc Export', tier: 6, tierName: 'Technical', primaryModel: 'Qwen3 Coder', qualityGateModel: 'GPT-OSS-120B', fallbackModel: 'MiniMax M2.5', purpose: 'Export to Google Doc format', costLevel: 'low', speedLevel: 'fast', qualityLevel: 'basic', isMandatory: false, status: 'idle' },
  { stageNumber: 14, stageName: 'Technical Validation', tier: 6, tierName: 'Technical', primaryModel: 'Qwen3 Coder', qualityGateModel: 'GPT-OSS-120B', fallbackModel: 'MiniMax M2.5', purpose: 'JSON, Python, PowerShell, ASCII checks', costLevel: 'low', speedLevel: 'fast', qualityLevel: 'basic', isMandatory: false, status: 'idle' },
  { stageNumber: 15, stageName: 'Browser Validation', tier: 4, tierName: 'Orchestration', primaryModel: 'Nemotron 3 Ultra', qualityGateModel: 'GPT-OSS-120B', fallbackModel: 'Nemotron 3 Super', purpose: 'Chrome debug, SERP, Boolean search availability', costLevel: 'low', speedLevel: 'medium', qualityLevel: 'good', isMandatory: false, status: 'idle' },
  { stageNumber: 16, stageName: 'Regression & Production', tier: 1, tierName: 'Quality Gate', primaryModel: 'Nemotron 3 Ultra', qualityGateModel: 'GPT-OSS-120B', fallbackModel: 'Nemotron 3 Super', purpose: 'Stage validation, pitch quality, export readiness', costLevel: 'low', speedLevel: 'slow', qualityLevel: 'excellent', isMandatory: true, status: 'idle' },
];

export const PHASES: { name: WorkflowPhase; stages: number[] }[] = [
  { name: 'Intake & Study', stages: [1, 2] },
  { name: 'Research & Angles', stages: [3, 4, 5, 6] },
  { name: 'Media Intelligence', stages: [7, 8] },
  { name: 'Pitch Production', stages: [9, 10] },
  { name: 'Packaging & Export', stages: [11, 12] },
  { name: 'Validation & Production', stages: [13, 14, 15] },
];

export const TOTAL_WORKFLOW_STAGES = STAGES.length;

export const getStageByNumber = (num: number) => STAGES.find(s => s.number === num);
export const getStageBySlug = (slug: string) => STAGES.find(s => s.name.toLowerCase().replace(/\s+/g, '-') === slug);
export const getPhaseByStage = (stageNum: number): WorkflowPhase => {
  for (const phase of PHASES) {
    if (phase.stages.includes(stageNum)) return phase.name;
  }
  return 'Validation & Production';
};
export const getStagesByPhase = (phase: WorkflowPhase) => STAGES.filter(s => PHASES.find(p => p.name === phase)?.stages.includes(s.number));
export const isHumanGate = (stageNum: number): boolean => stageNum === 7;
export const requiresApproval = (stageNum: number): boolean => stageNum === 7;
export const getStageRoute = (stageNum: number): string => {
  const routes: Record<number, string> = {
    1: '/campaigns/create',
    2: '/data-extraction',
    3: '/workflow',
    4: '/analysis',
    5: '/angles',
    6: '/angle-selection',
    7: '/pitch-selection',
    8: '/journalists',
    9: '/journalists',
    10: '/pitches',
    11: '/optimization',
    12: '/package',
    13: '/package',
    14: '/validation',
    15: '/validation',
    16: '/validation',
  };
  return routes[stageNum] || '/workflow';
};
export const getLockedReasonForStage = (stageNum: number, currentStage: number, selectedAnglesCount: number): string => {
  if (stageNum <= currentStage) return '';
  if (stageNum === 8 && currentStage < 7) return 'Journalist Collection is locked until Pitch Selection is completed.';
  if (stageNum === 8 && selectedAnglesCount === 0) return 'Select at least one pitch angle to unlock Journalist Collection.';
  return `Complete Stage ${stageNum - 1} first.`;
};

// =============================================================================
// RESEARCH ENRICHMENT TYPES - Stage 3
// =============================================================================

export type ResearchEnrichmentStatus = 'not-started' | 'researching' | 'completed' | 'needs-review' | 'failed';

export type SourceSearchStatus = 'not-started' | 'searching' | 'found' | 'needs-review' | 'no-source-found' | 'failed';

export type SourceCredibility = 'high' | 'medium' | 'low' | 'unknown';

export type ResearchSourceType = 'serp' | 'google-scholar' | 'government-report' | 'industry-whitepaper' | 'news-article' | 'competitor-pr' | 'blog-article' | 'us-local-newspaper';

export type ResearchInsightType = 'statistic' | 'trend' | 'expert-context' | 'media-gap' | 'competitor-gap' | 'local-angle' | 'public-interest-hook' | 'methodology-support' | 'risk-warning' | 'audience-question';

export interface ResearchSourceItem {
  id: string;
  sourceType: ResearchSourceType;
  title: string;
  publisher?: string;
  author?: string;
  url?: string;
  publicationDate?: string;
  geography?: string;
  relevanceSummary: string;
  credibility: SourceCredibility;
  credibilityReason: string;
  extractedInsight: string;
  usefulFor: string[];
}

export interface ResearchFinding {
  id: string;
  insightType: ResearchInsightType;
  title: string;
  summary: string;
  sourceIds: string[];
  confidence: SourceCredibility;
  limitations: string[];
}

export interface CompetitorPRGap {
  id: string;
  competitorName: string;
  observedAngle: string;
  whatTheyCovered: string;
  whatTheyMissed: string;
  opportunityForCampaign: string;
}

export interface LocalNewspaperOpportunity {
  id: string;
  geography: string;
  publicationType: string;
  localHook: string;
  whyItMattersLocally: string;
  potentialReporterBeat: string[];
}

export interface ResearchWarning {
  id: string;
  warningType: 'missing-source' | 'outdated-source' | 'conflicting-data' | 'weak-evidence' | 'overused-angle' | 'needs-review';
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface SourceCoverageStatus {
  serp: SourceSearchStatus;
  googleScholar: SourceSearchStatus;
  governmentReports: SourceSearchStatus;
  industryWhitepapers: SourceSearchStatus;
  newsArticles: SourceSearchStatus;
  competitorPRCampaigns: SourceSearchStatus;
  blogArticles: SourceSearchStatus;
  usLocalNewspapers: SourceSearchStatus;
}

export interface Round1BroadDiscovery {
  status: ResearchEnrichmentStatus;
  serpFindings: ResearchSourceItem[];
  scholarSources: ResearchSourceItem[];
  governmentReports: ResearchSourceItem[];
  whitepapers: ResearchSourceItem[];
  newsArticles: ResearchSourceItem[];
  competitorCampaigns: ResearchSourceItem[];
  blogArticles: ResearchSourceItem[];
  localNewspapers: ResearchSourceItem[];
  initialThemes: string[];
  recurringStatistics: string[];
  possibleAngles: string[];
}

export interface Round2FilteringGapAnalysis {
  status: ResearchEnrichmentStatus;
  verifiedSources: ResearchSourceItem[];
  rejectedSources: { title: string; reason: string }[];
  competitorGaps: CompetitorPRGap[];
  localOpportunities: LocalNewspaperOpportunity[];
  warnings: ResearchWarning[];
}

export interface Round3FinalEnrichmentMap {
  status: ResearchEnrichmentStatus;
  enrichedSummary: string;
  researchFindings: ResearchFinding[];
  recommendedPitchHooks: string[];
  journalistBeats: string[];
  credibilityWarnings: ResearchWarning[];
}

export interface ResearchEnrichment {
  campaignId: string;
  stage: 3;
  status: ResearchEnrichmentStatus;
  sourceCoverage: SourceCoverageStatus;
  round1: Round1BroadDiscovery;
  round2: Round2FilteringGapAnalysis;
  round3: Round3FinalEnrichmentMap;
  handoffToStrategist: {
    ready: boolean;
    summary: string;
    warnings: string[];
  };
  timestamps: {
    startedAt?: string;
    completedAt?: string;
  };
}

// =============================================================================
// STAGE 4: DATA & RESEARCH ANALYSIS TYPES
// Two internal agents: Data & Research Analyst (4A) + Insight Analyst (4B)
// =============================================================================

export type EvidenceConfidence = 'high' | 'medium' | 'low';

export type ResearchOutputMode =
  | 'real-research'
  | 'demo-structure'
  | 'manual-research-required'
  | 'placeholder-output';

export type DataResearchAnalysisStatus =
  | 'not-started'
  | 'analyzing'
  | 'validating'
  | 'strategizing'
  | 'completed'
  | 'needs-review'
  | 'blocked';

export interface DataResearchAnalysisInput {
  campaign: {
    campaignId: string;
    campaignName: string;
    clientName?: string;
    clientWebsite?: string;
    clientIndustry?: string;
    campaignTopic: string;
    campaignBrief?: string;
    rawData?: string;
    studyText?: string;
    clientNotes?: string;
    campaignGoal?: string;
    targetAudience?: string[];
    targetGeography?: string[];
    targetPublicationTypes?: string[];
    preferredJournalistBeats?: string[];
    brandRestrictions?: string[];
    sensitiveTopics?: string[];
    createdAt?: string;
    updatedAt?: string;
  };

  dataExtraction: {
    internalDataMapId?: string;
    extractionStatus: 'not-started' | 'extracting' | 'completed' | 'needs-review' | 'failed';
    extractionSummary?: string;
    sourceInputs: {
      rawDataAvailable: boolean;
      studyTextAvailable: boolean;
      campaignBriefAvailable: boolean;
      clientNotesAvailable: boolean;
      uploadedFilesAvailable?: boolean;
      uploadedFileNames?: string[];
    };
    keyFindings: Array<{
      id: string;
      finding: string;
      sourceText?: string;
      sourceLocation?: string;
      relatedStatisticIds?: string[];
      confidence: EvidenceConfidence;
      extractionNotes?: string;
      possibleUseCase?: string;
    }>;
    statistics: Array<{
      id: string;
      value: string;
      metric: string;
      fullStatisticText: string;
      context: string;
      geography?: string;
      timeframe?: string;
      demographicSegment?: string;
      comparisonGroup?: string;
      source?: string;
      sourceType: 'study' | 'raw-data' | 'campaign-brief' | 'client-note' | 'uploaded-file' | 'unknown';
      confidence: EvidenceConfidence;
      extractionWarning?: string;
      usableAsLeadStat: boolean;
      needsVerification: boolean;
    }>;
    methodology?: {
      dataSource?: string;
      collectionMethod?: string;
      timeframe?: string;
      sampleSize?: string;
      geography?: string;
      populationCovered?: string;
      limitations?: string[];
      methodologyWarnings?: string[];
      confidence?: EvidenceConfidence;
    };
    limitations?: string[];
    missingFields?: string[];
    qualityWarnings?: string[];
    extractionErrors?: string[];
  };

  researchEnrichment: {
    enrichmentId?: string;
    status: DataResearchAnalysisStatus;
    realSearchAvailable: boolean;
    outputMode: ResearchOutputMode;
    disclosureMessage?: string;
    sourceCoverageStatus?: {
      serp?: string;
      googleScholar?: string;
      governmentReports?: string;
      industryWhitepapers?: string;
      newsArticles?: string;
      competitorPRCampaigns?: string;
      blogArticles?: string;
      usLocalNewspapers?: string;
    };
    verifiedSources?: Array<{
      id: string;
      sourceType: 'serp' | 'google-scholar' | 'government-report' | 'industry-whitepaper' | 'news-article' | 'competitor-pr-campaign' | 'blog-article' | 'us-local-newspaper';
      title: string;
      publisher?: string;
      author?: string;
      url?: string;
      publicationDate?: string;
      geography?: string;
      credibility: SourceCredibility;
      credibilityReason?: string;
      relevanceSummary: string;
      extractedInsight: string;
    }>;
    credibilityWarnings?: string[];
    missingDataWarnings?: string[];
    researchWarnings?: string[];
    manualReviewNotes?: string[];
  };

  workflowContext: {
    previousStage: 'S3';
    currentStage: 'S4';
    nextStage: 'S5';
    completedStages: string[];
    activePrimaryAgent: 'Data & Research Analyst';
    activeSecondaryAgent: 'Insight Analyst';
    nextAgent: 'Strategist';
    outputFile: '04-analysis.md';
    shouldBlockAngleGenerationIfIncomplete: boolean;
  };
}

export interface AngleGenerationHandoff {
  campaignId: string;
  fromStage: 'S4';
  toStage: 'S5';
  fromPrimaryAgent: 'Data & Research Analyst';
  fromSecondaryAgent: 'Insight Analyst';
  toAgent: 'Strategist';

  readiness: {
    readyForAngleGeneration: boolean;
    readinessStatus: 'ready' | 'needs-review' | 'blocked' | 'manual-research-required';
    reason: string;
    blockers: string[];
    warnings: string[];
  };

  evidencePackage: {
    strongestFindingIds: string[];
    approvedStatisticIds: string[];
    approvedStorylineIds: string[];
    approvedInsightClusterIds: string[];
    approvedSourceIds: string[];
    mustUseStatistics: string[];
    mustUseResearchInsights: string[];
    mustUseSourceContext: string[];
    mustAvoidClaims: string[];
    mustAvoidEvidenceIds: string[];
  };

  angleRules: {
    allowedAngleDirections: string[];
    blockedAngleDirections: string[];
    requiredBeats: string[];
    suggestedBeats: string[];
    localizationOpportunities: string[];
    minimumEvidenceRequiredPerAngle: number;
    mustIncludeGroundingExplanation: boolean;
    mustIncludeRiskWarnings: boolean;
  };

  antiHallucinationRules: {
    doNotInventStatistics: true;
    doNotInventSources: true;
    doNotInventStudyFindings: true;
    doNotInventGeographies: true;
    doNotUsePlaceholderResearchAsReal: true;
    requireEvidenceReferenceForEveryAngle: true;
    requireRiskWarningsForWeakEvidence: true;
  };

  recommendedAngleInputs: Array<{
    id: string;
    recommendedStoryline: string;
    supportingFindingIds: string[];
    supportingStatisticIds: string[];
    supportingResearchSourceIds: string[];
    suggestedPrimaryBeat: string;
    suggestedSecondaryBeats: string[];
    suggestedHookType: 'data-shock' | 'local-impact' | 'policy-gap' | 'consumer-harm' | 'financial-burden' | 'safety-risk' | 'human-impact' | 'industry-gap';
    whyThisShouldBecomeAnAngle: string;
    riskWarnings: string[];
    requiredEvidenceToMention: string[];
  }>;

  finalInstructionForAngleGeneration: string;
}

export interface InsightAnalysisMap {
  campaignId: string;
  campaignName?: string;
  clientName?: string;
  campaignTopic?: string;

  stage: 'S4';
  stageName: 'Data & Research Analysis';
  route: '/analysis';

  primaryAgent: 'Data & Research Analyst';
  secondaryAgent: 'Insight Analyst';

  status: DataResearchAnalysisStatus;

  outputFile: '04-analysis.md';

  inputReadiness: {
    hasCampaignBrief: boolean;
    hasRawData: boolean;
    hasStudyText: boolean;
    hasInternalDataMap: boolean;
    hasExtractedStatistics: boolean;
    hasKeyFindings: boolean;
    hasResearchEnrichment: boolean;
    researchIsReal: boolean;
    researchIsPlaceholder: boolean;
    readyForAnalysis: boolean;
    readyForStrategicInsight: boolean;
    missingInputs: string[];
    readinessWarnings: string[];
    blockingIssues: string[];
  };

  dataValidationLayer: {
    agent: 'Data & Research Analyst';
    status: DataResearchAnalysisStatus;
    executiveSummary: string;

    scores: {
      dataQualityScore: number;
      sourceCredibilityScore: number;
      researchCompletenessScore: number;
      methodologyConfidenceScore: number;
      angleReadinessScore: number;
    };

    verifiedStatistics: Array<{
      id: string;
      statistic: string;
      value?: string;
      metric?: string;
      geography?: string;
      timeframe?: string;
      source?: string;
      confidence: EvidenceConfidence;
      whyVerified: string;
      approvedForAngleGeneration: boolean;
      recommendedUse: 'lead-stat' | 'supporting-stat' | 'localization' | 'context' | 'do-not-use';
    }>;

    unverifiedStatistics: Array<{
      id: string;
      statistic: string;
      issue: string;
      missingEvidence: string[];
      recommendedFix: string;
      blockedFromAngleGeneration: boolean;
    }>;

    approvedFindings: Array<{
      id: string;
      finding: string;
      approvedEvidenceIds: string[];
      supportingSourceIds: string[];
      confidence: EvidenceConfidence;
      reasonApproved: string;
      recommendedStrategicUse: string;
    }>;

    blockedFindings?: Array<{
      id: string;
      finding: string;
      blockedReason: string;
      riskLevel: 'low' | 'medium' | 'high';
      recommendedFix: string;
    }>;

    weakClaims: Array<{
      id: string;
      claim: string;
      weaknessReason: string;
      riskLevel: 'low' | 'medium' | 'high';
      recommendation: string;
      canBeUsedAsSupportingContext: boolean;
      blockedAsPrimaryAngle: boolean;
    }>;

    sourceCredibilityReview: Array<{
      sourceType: string;
      sourceIds: string[];
      credibility: SourceCredibility;
      strengths: string[];
      weaknesses: string[];
      recommendedUse: string;
    }>;

    researchGaps: Array<{
      id: string;
      gap: string;
      affectedFinding: string;
      impactOnAngleGeneration: string;
      severity: 'low' | 'medium' | 'high';
      recommendedAction: string;
    }>;

    approvedEvidenceIds: string[];
    blockedEvidenceIds: string[];
    humanReviewRequiredFor: string[];
  };

  insightStrategyLayer: {
    agent: 'Insight Analyst';
    status: DataResearchAnalysisStatus;
    executiveSummary: string;

    strongestCampaignInsights: Array<{
      id: string;
      insight: string;
      basedOnApprovedEvidenceIds: string[];
      supportingSourceIds: string[];
      whyItMatters: string;
      journalistRelevance: string;
      publicImpact?: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
    }>;

    insightClusters: Array<{
      id: string;
      clusterName: string;
      clusterSummary: string;
      clusterType: 'cost-burden' | 'inequality' | 'public-safety' | 'health' | 'legal' | 'consumer-finance' | 'policy' | 'local-impact' | 'industry' | 'human-impact' | 'risk-warning';
      relatedInsightIds: string[];
      relatedEvidenceIds: string[];
      bestFitBeats: string[];
      possibleStoryline: string;
      riskWarnings: string[];
    }>;

    bestJournalistBeatOpportunities: Array<{
      beat: string;
      whyItFits: string;
      relatedInsightIds: string[];
      strongestEvidenceForBeat: string[];
      possibleReporterInterest: string;
      priority: 'high' | 'medium' | 'low';
    }>;

    localStateHooks: Array<{
      id: string;
      geography: string;
      hook: string;
      supportingEvidenceIds: string[];
      supportingSourceIds?: string[];
      whyItMattersLocally: string;
      suggestedLocalAngleDirection: string;
      bestLocalBeat?: string;
    }>;

    dataBackedStorylines: Array<{
      id: string;
      storylineTitle: string;
      storylineSummary: string;
      approvedEvidenceUsed: string[];
      researchUsed: string[];
      bestJournalistBeats: string[];
      localOrNationalFit: 'local' | 'national' | 'both';
      confidence: EvidenceConfidence;
      shouldPassToAngleGeneration: boolean;
      whyThisStorylineIsSafe: string;
    }>;

    angleDirectionRecommendations: Array<{
      id: string;
      direction: string;
      whyRecommended: string;
      approvedEvidenceRequired: string[];
      requiredResearchContext: string[];
      bestFitBeats: string[];
      suggestedHookType: 'data-shock' | 'local-impact' | 'policy-gap' | 'consumer-harm' | 'financial-burden' | 'safety-risk' | 'human-impact' | 'industry-gap';
      riskWarnings: string[];
    }>;

    anglesToAvoid: Array<{
      id: string;
      angleDirection: string;
      reasonToAvoid: string;
      relatedWeakClaimIds?: string[];
      relatedBlockedEvidenceIds?: string[];
    }>;
  };

  antiHallucinationReview: {
    placeholderResearchDetected: boolean;
    unsupportedClaimsDetected: boolean;
    fabricatedSourceRisk: boolean;
    weakEvidenceRisk: boolean;
    safeForFinalAngleGeneration: boolean;
    requiredHumanReview: boolean;
    warningMessage?: string;
    blockedReasons: string[];
  };

  angleGenerationGuidance: AngleGenerationHandoff;

  markdownReport: {
    fileName: '04-analysis.md';
    sectionsIncluded: string[];
    executiveSummary: string;
    handoffSummary: string;
  };

  timestamps: {
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
  };
}

// =============================================================================
// EXPORTS - Agent Brain Type System
// =============================================================================

// Re-export from agentBrain.ts
export type {
  AgentBrain,
  AgentBrainRegistryItem,
  AgentContextPackage,
  AgentWorkflowState,
  AgentHandoffReference,
  AgentArtifactReference,
  Stage4AgentConfig,
  AgentId,
  BrainStageNumber,
} from './agentBrain';

export { BRAIN_STAGES, BRAIN_AGENTS, isDualAgentStage, getStage4Config } from './agentBrain';

// Re-export from agentMemory.ts
export type {
  MemoryKey,
  MemoryScope,
  MemoryAccessLevel,
  AgentMemoryContract,
  MemoryAccessRule,
  MemoryRetentionPolicy,
  MemoryStore,
  ShortTermMemory,
  CampaignMemory,
  StageMemoryOutput,
  HumanFeedbackMemory,
  GlobalMemory,
  GoldenExample,
  CorrectionRule,
  LearnedPattern,
  ImmutableAnchor,
  MemoryQuery,
  MemoryWrite,
} from './agentMemory';

export { DEFAULT_MEMORY_CONTRACTS } from './agentMemory';

// Re-export from agentTool.ts
export type {
  ToolImplementationStatus,
  HallucinationRisk,
  ToolCategory,
  AgentToolDefinition,
  AgentToolContract,
  ToolPermission,
  ToolGroupRestriction,
  ToolExecution,
  ToolCallResult,
} from './agentTool';

export { TOOL_REGISTRY, DEFAULT_TOOL_CONTRACTS, getAllowedTools } from './agentTool';

// Re-export from agentHandoff.ts
export type {
  HandoffStatus,
  HandoffFieldRequirement,
  AgentHandoffContract,
  ArtifactRequirement,
  HandoffRecord,
  TransferredArtifact,
  HandoffWarning,
  HandoffBlocker,
  HandoffValidationResult,
} from './agentHandoff';

export {
  STAGE4_INTERNAL_HANDOFF,
  STAGE4_TO_5_HANDOFF,
  DEFAULT_HANDOFF_CONTRACTS,
  getHandoffContract,
  validateHandoff,
} from './agentHandoff';

// Re-export from agentTrace.ts
export type {
  TraceStatus,
  TraceInputArtifact,
  TraceToolUsage,
  TraceOutputArtifact,
  TraceGuardrailResult,
  AgentRunTrace,
  TraceMetadata,
  TraceSummary,
  WorkflowRunTrace,
  WorkflowMetrics,
} from './agentTrace';

export {
  createAgentRunTrace,
  completeAgentRunTrace,
  addToolUsageToTrace,
  addGuardrailResultToTrace,
  addWarningToTrace,
  createWorkflowRunTrace,
  addStageTraceToWorkflow,
  serializeTrace,
} from './agentTrace';

// Re-export from agentArtifact.ts
export type {
  ArtifactType,
  ArtifactStatus,
  AgentArtifactRule,
  ArtifactValidationRule,
  AgentArtifact,
  ArtifactMetadata,
  ArtifactValidationResult,
  ArtifactReference,
} from './agentArtifact';

export {
  DEFAULT_ARTIFACT_RULES,
  getArtifactRulesForStage,
  getArtifactRulesForAgent,
  validateArtifact,
  createArtifact,
  approveArtifact,
  rejectArtifact,
} from './agentArtifact';

// Re-export from agentFeedback.ts
export type {
  FeedbackType,
  FeedbackSource,
  FeedbackSeverity,
  FeedbackCategory,
  AgentFeedback,
  FeedbackDetail,
  FeedbackResolution,
  FeedbackSummary,
  FeedbackIssueCount,
  LearnedRule,
  RuleEffectiveness,
  FeedbackTrend,
} from './agentFeedback';

export {
  createFeedback,
  resolveFeedback,
  calculateFeedbackSummary,
  generateLearnedRule,
  analyzeFeedbackTrend,
} from './agentFeedback';
