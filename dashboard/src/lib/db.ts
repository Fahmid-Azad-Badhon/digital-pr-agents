/**
 * ⚠️ DEPRECATED - Legacy Database Layer (JSON-based)
 * =============================================================================
 * 
 * This file is no longer the primary data source for any active API route.
 * 
 * Migration: All API routes now use /src/lib/campaignStateService.ts as the
 * canonical source of truth, which reads from the pitch-jobs filesystem.
 * 
 * This file is kept for:
 * - Reference for legacy data format (data/campaigns.json)
 * - Potential data migration tools
 * 
 * Do NOT add new functionality here.
 * Do NOT import from this file in new code.
 * 
 * Future: Remove once all legacy data has been migrated.
 * =============================================================================
 */

import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

// ============================================================================
// CONFIGURATION & PATHS - Windows Compatible
// ============================================================================

const DASHBOARD_DATA = path.join(__dirname, '..', '..', 'data');
const CAMPAIGNS_JSON = path.join(DASHBOARD_DATA, 'campaigns.json');
const LOGS_DIR = path.join(DASHBOARD_DATA, 'logs');
const ARTIFACTS_DIR = path.join(DASHBOARD_DATA, 'artifacts');

// Ensure directories exist
async function ensureDirectories(): Promise<void> {
  const dirs = [DASHBOARD_DATA, LOGS_DIR, ARTIFACTS_DIR];
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (err) {
      console.error(`Failed to create directory: ${dir}`, err);
    }
  }
}

// ============================================================================
// INTERFACES - TypeScript Strong Typing
// ============================================================================

export interface Campaign {
  id: string;
  name: string;
  slug: string;
  brief: string | null;
  raw_study: string | null;
  selected_angle: string | null;
  selected_beat: string | null;
  target_journalist: string | null;
  target_outlet: string | null;
  status: CampaignStatus;
  current_stage: number;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export type CampaignStatus = 
  | 'draft' 
  | 'active' 
  | 'running' 
  | 'paused' 
  | 'completed' 
  | 'failed' 
  | 'archived';

export interface Stage {
  id: string;
  campaign_id: string;
  stage_number: number;
  stage_name: string;
  owner_agent: string;
  status: StageStatus;
  input_files: string | null;
  output_files: string | null;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  error: string | null;
  retry_count: number;
  metadata: Record<string, unknown> | null;
}

export type StageStatus = 
  | 'pending' 
  | 'queued' 
  | 'in-progress' 
  | 'completed' 
  | 'failed' 
  | 'skipped'
  | 'manual-action-required'
  | 'blocked'
  | 'paused';

export interface Gate {
  id: string;
  campaign_id: string;
  gate_name: string;
  gate_type: 'selection' | 'validation' | 'handoff';
  status: GateStatus;
  value: string | null;
  triggered_at: string | null;
  confirmed_at: string | null;
  expires_at: string | null;
}

export type GateStatus = 
  | 'pending' 
  | 'awaiting' 
  | 'confirmed' 
  | 'rejected' 
  | 'expired';

export interface Log {
  id: string;
  campaign_id: string;
  stage: string | null;
  agent: string | null;
  level: LogLevel;
  message: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical';

export interface Artifact {
  id: string;
  campaign_id: string;
  stage: string;
  artifact_type: ArtifactType;
  filename: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  checksum: string | null;
  created_at: string;
}

export type ArtifactType = 
  | 'markdown' 
  | 'json' 
  | 'csv' 
  | 'pdf' 
  | 'screenshot' 
  | 'export';

// ============================================================================
// STAGE DEFINITIONS - Digital PR Workflow
// ============================================================================

export const STAGE_DEFINITIONS = [
  { number: 1, name: '00-brief.md', owner: 'orchestrator', label: 'Brief Intake' },
  { number: 2, name: '01-study-notes.md', owner: 'extractor', label: 'Study Extraction' },
  { number: 3, name: '02-insights.md', owner: 'extractor', label: 'Insight Ranking' },
  { number: 4, name: '03-research.md', owner: 'strategist', label: 'Research Enrichment' },
  { number: 5, name: '04-angles.md', owner: 'angle-generator', label: 'Angle Generation' },
  { number: 6, name: '05-beats.md', owner: 'matcher', label: 'Beat Matching' },
  { number: 7, name: '06-journalist-intel.md', owner: 'collector', label: 'Journalist Collection' },
  { number: 8, name: '07-journalist-coverage.md', owner: 'matcher', label: 'Coverage Review' },
  { number: 9, name: '08-pitch-draft.md', owner: 'copywriter', label: 'Pitch Drafting' },
  { number: 10, name: '09-optimized-email.md', owner: 'optimizer', label: 'Email Optimization' },
  { number: 11, name: '10-google-doc.md', owner: 'packager', label: 'Final Packaging' },
] as const;

export const DEFAULT_STAGES = STAGE_DEFINITIONS.map(def => ({
  stage_number: def.number,
  stage_name: def.name,
  owner_agent: def.owner,
  status: 'pending' as StageStatus,
  input_files: null,
  output_files: null,
  started_at: null,
  completed_at: null,
  duration_ms: null,
  error: null,
  retry_count: 0,
  metadata: null,
}));

// ============================================================================
// DATABASE CORE - JSON-based with SQLite-like Features
// ============================================================================

interface DatabaseState {
  campaigns: Campaign[];
  stages: Stage[];
  gates: Gate[];
  logs: Log[];
  artifacts: Artifact[];
}

let dbState: DatabaseState = {
  campaigns: [],
  stages: [],
  gates: [],
  logs: [],
  artifacts: [],
};

let isInitialized = false;

/**
 * Initialize database - load from JSON or create new
 */
export async function initDatabase(): Promise<void> {
  if (isInitialized) return;
  
  await ensureDirectories();
  await loadDatabase();
  isInitialized = true;
}

/**
 * Load database from JSON file
 */
async function loadDatabase(): Promise<void> {
  try {
    const data = await fs.readFile(CAMPAIGNS_JSON, 'utf8');
    const parsed = JSON.parse(data);
    dbState = {
      campaigns: parsed.campaigns || [],
      stages: parsed.stages || [],
      gates: parsed.gates || [],
      logs: parsed.logs || [],
      artifacts: parsed.artifacts || [],
    };
  } catch {
    console.warn('No existing database found, starting fresh');
    dbState = { campaigns: [], stages: [], gates: [], logs: [], artifacts: [] };
  }
}

/**
 * Save database to JSON file
 */
async function saveDatabase(): Promise<void> {
  try {
    await fs.writeFile(CAMPAIGNS_JSON, JSON.stringify(dbState, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save database:', err);
    throw err;
  }
}

// ============================================================================
// CAMPAIGN OPERATIONS
// ============================================================================

/**
 * Create a new campaign
 */
export async function createCampaign(
  name: string, 
  brief: string | null = null
): Promise<Campaign> {
  await initDatabase();
  
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  const now = new Date().toISOString();
  
  const campaign: Campaign = {
    id: uuidv4(),
    name,
    slug,
    brief,
    raw_study: null,
    selected_angle: null,
    selected_beat: null,
    target_journalist: null,
    target_outlet: null,
    status: 'draft',
    current_stage: 0,
    progress_percentage: 0,
    created_at: now,
    updated_at: now,
    started_at: null,
    completed_at: null,
  };
  
  // Create stages for this campaign
  const stages = DEFAULT_STAGES.map(stage => ({
    ...stage,
    id: uuidv4(),
    campaign_id: campaign.id,
  }));
  
  dbState.campaigns.push(campaign);
  dbState.stages.push(...stages);
  
  await saveDatabase();
  
  await addLog(campaign.id, 'system', 'orchestrator', 'info', `Campaign created: ${name}`);
  
  return campaign;
}

/**
 * Get all campaigns
 */
export async function getAllCampaigns(): Promise<Campaign[]> {
  await initDatabase();
  return [...dbState.campaigns].sort((a, b) => 
    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

/**
 * Get campaign by ID
 */
export async function getCampaignById(id: string): Promise<Campaign | null> {
  await initDatabase();
  return dbState.campaigns.find(c => c.id === id) || null;
}

/**
 * Get campaign by slug
 */
export async function getCampaignBySlug(slug: string): Promise<Campaign | null> {
  await initDatabase();
  return dbState.campaigns.find(c => c.slug === slug) || null;
}

/**
 * Update campaign
 */
export async function updateCampaign(
  id: string, 
  updates: Partial<Campaign>
): Promise<Campaign | null> {
  await initDatabase();
  
  const index = dbState.campaigns.findIndex(c => c.id === id);
  if (index === -1) return null;
  
  dbState.campaigns[index] = {
    ...dbState.campaigns[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  
  await saveDatabase();
  return dbState.campaigns[index];
}

/**
 * Delete campaign
 */
export async function deleteCampaign(id: string): Promise<boolean> {
  await initDatabase();
  
  const index = dbState.campaigns.findIndex(c => c.id === id);
  if (index === -1) return false;
  
  // Remove related data
  dbState.campaigns.splice(index, 1);
  dbState.stages = dbState.stages.filter(s => s.campaign_id !== id);
  dbState.gates = dbState.gates.filter(g => g.campaign_id !== id);
  dbState.logs = dbState.logs.filter(l => l.campaign_id !== id);
  dbState.artifacts = dbState.artifacts.filter(a => a.campaign_id !== id);
  
  await saveDatabase();
  return true;
}

// ============================================================================
// STAGE OPERATIONS
// ============================================================================

/**
 * Get stages for a campaign
 */
export async function getStagesByCampaign(campaignId: string): Promise<Stage[]> {
  await initDatabase();
  return dbState.stages
    .filter(s => s.campaign_id === campaignId)
    .sort((a, b) => a.stage_number - b.stage_number);
}

/**
 * Update stage status
 */
export async function updateStageStatus(
  campaignId: string,
  stageName: string,
  status: StageStatus,
  error: string | null = null
): Promise<Stage | null> {
  await initDatabase();
  
  const stage = dbState.stages.find(
    s => s.campaign_id === campaignId && s.stage_name === stageName
  );
  
  if (!stage) return null;
  
  const now = new Date().toISOString();
  
  if (status === 'in-progress' && !stage.started_at) {
    stage.started_at = now;
  } else if (status === 'completed' && !stage.completed_at) {
    stage.completed_at = now;
    if (stage.started_at) {
      stage.duration_ms = new Date(now).getTime() - new Date(stage.started_at).getTime();
    }
  }
  
  stage.status = status;
  if (error) stage.error = error;
  
  await saveDatabase();
  return stage;
}

/**
 * Get current active stage
 */
export async function getCurrentStage(campaignId: string): Promise<Stage | null> {
  await initDatabase();
  return dbState.stages.find(
    s => s.campaign_id === campaignId && s.status === 'in-progress'
  ) || null;
}

// ============================================================================
// GATE OPERATIONS
// ============================================================================

/**
 * Get gates for a campaign
 */
export async function getGatesByCampaign(campaignId: string): Promise<Gate[]> {
  await initDatabase();
  return dbState.gates.filter(g => g.campaign_id === campaignId);
}

/**
 * Create or update a gate
 */
export async function setGate(
  campaignId: string,
  gateName: string,
  gateType: 'selection' | 'validation' | 'handoff',
  value: string | null = null
): Promise<Gate> {
  await initDatabase();
  
  let gate = dbState.gates.find(
    g => g.campaign_id === campaignId && g.gate_name === gateName
  );
  
  if (!gate) {
    gate = {
      id: uuidv4(),
      campaign_id: campaignId,
      gate_name: gateName,
      gate_type: gateType,
      status: 'pending',
      value: null,
      triggered_at: null,
      confirmed_at: null,
      expires_at: null,
    };
    dbState.gates.push(gate);
  }
  
  if (value !== null) {
    gate.value = value;
    gate.status = 'confirmed';
    gate.confirmed_at = new Date().toISOString();
  } else {
    gate.status = 'awaiting';
    gate.triggered_at = new Date().toISOString();
  }
  
  await saveDatabase();
  return gate;
}

// ============================================================================
// LOGGING OPERATIONS
// ============================================================================

/**
 * Add a log entry
 */
export async function addLog(
  campaignId: string,
  stage: string | null,
  agent: string | null,
  level: LogLevel,
  message: string,
  metadata: Record<string, unknown> | null = null
): Promise<Log> {
  await initDatabase();
  
  const log: Log = {
    id: uuidv4(),
    campaign_id: campaignId,
    stage,
    agent,
    level,
    message,
    metadata,
    created_at: new Date().toISOString(),
  };
  
  dbState.logs.push(log);
  
  // Keep only last 1000 logs per campaign
  const campaignLogs = dbState.logs.filter(l => l.campaign_id === campaignId);
  if (campaignLogs.length > 1000) {
    const toRemove = campaignLogs
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(0, campaignLogs.length - 1000);
    
    const removeIds = new Set(toRemove.map(l => l.id));
    dbState.logs = dbState.logs.filter(l => !removeIds.has(l.id));
  }
  
  await saveDatabase();
  return log;
}

/**
 * Get logs for a campaign
 */
export async function getLogsByCampaign(
  campaignId: string, 
  limit: number = 100
): Promise<Log[]> {
  await initDatabase();
  return dbState.logs
    .filter(l => l.campaign_id === campaignId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

// ============================================================================
// ARTIFACT OPERATIONS
// ============================================================================

/**
 * Register an artifact
 */
export async function registerArtifact(
  campaignId: string,
  stage: string,
  artifactType: ArtifactType,
  filename: string,
  filePath: string,
  fileSize: number | null = null,
  mimeType: string | null = null
): Promise<Artifact> {
  await initDatabase();
  
  const artifact: Artifact = {
    id: uuidv4(),
    campaign_id: campaignId,
    stage,
    artifact_type: artifactType,
    filename,
    file_path: filePath,
    file_size: fileSize,
    mime_type: mimeType,
    checksum: null,
    created_at: new Date().toISOString(),
  };
  
  dbState.artifacts.push(artifact);
  await saveDatabase();
  return artifact;
}

/**
 * Get artifacts for a campaign
 */
export async function getArtifactsByCampaign(campaignId: string): Promise<Artifact[]> {
  await initDatabase();
  return dbState.artifacts.filter(a => a.campaign_id === campaignId);
}

// ============================================================================
// STATISTICS & AGGREGATIONS
// ============================================================================

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<{
  total: number;
  active: number;
  completed: number;
  failed: number;
  draft: number;
  paused: number;
  avgDuration: number;
  stageStats: { completed: number; running: number; pending: number; failed: number };
}> {
  await initDatabase();
  
  const campaigns = dbState.campaigns;
  const stages = dbState.stages;
  
  const stats = {
    total: campaigns.length,
    active: campaigns.filter(c => c.status === 'active' || c.status === 'running').length,
    completed: campaigns.filter(c => c.status === 'completed').length,
    failed: campaigns.filter(c => c.status === 'failed').length,
    draft: campaigns.filter(c => c.status === 'draft').length,
    paused: campaigns.filter(c => c.status === 'paused').length,
    avgDuration: 0,
    stageStats: { completed: 0, running: 0, pending: 0, failed: 0 },
  };
  
  // Calculate stage stats
  stages.forEach(stage => {
    if (stage.status === 'completed') stats.stageStats.completed++;
    else if (stage.status === 'in-progress') stats.stageStats.running++;
    else if (stage.status === 'pending' || stage.status === 'queued') stats.stageStats.pending++;
    else if (stage.status === 'failed') stats.stageStats.failed++;
  });
  
  // Calculate average duration from completed stages
  const completedStages = stages.filter(s => s.duration_ms !== null);
  if (completedStages.length > 0) {
    const totalDuration = completedStages.reduce((sum, s) => sum + (s.duration_ms || 0), 0);
    stats.avgDuration = Math.round(totalDuration / completedStages.length / 1000); // in seconds
  }
  
  return stats;
}

/**
 * Get workflow progress for a campaign
 */
export async function getWorkflowProgress(campaignId: string): Promise<{
  currentStage: number;
  totalStages: number;
  percentage: number;
  stages: { name: string; status: StageStatus; duration: number | null }[];
}> {
  await initDatabase();
  
  const campaignStages = dbState.stages
    .filter(s => s.campaign_id === campaignId)
    .sort((a, b) => a.stage_number - b.stage_number);
  
  const completed = campaignStages.filter(s => s.status === 'completed').length;
  const total = campaignStages.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  const currentStage = campaignStages.find(s => s.status === 'in-progress')?.stage_number 
    || (completed + 1);
  
  return {
    currentStage,
    totalStages: total,
    percentage,
    stages: campaignStages.map(s => ({
      name: s.stage_name,
      status: s.status,
      duration: s.duration_ms,
    })),
  };
}

// ============================================================================
// EXPORT FOR OTHER MODULES
// ============================================================================

const db = {
  initDatabase,
  createCampaign,
  getAllCampaigns,
  getCampaignById,
  getCampaignBySlug,
  updateCampaign,
  deleteCampaign,
  getStagesByCampaign,
  updateStageStatus,
  getCurrentStage,
  getGatesByCampaign,
  setGate,
  addLog,
  getLogsByCampaign,
  registerArtifact,
  getArtifactsByCampaign,
  getDashboardStats,
  getWorkflowProgress,
  STAGE_DEFINITIONS,
  DEFAULT_STAGES,
};

export default db;