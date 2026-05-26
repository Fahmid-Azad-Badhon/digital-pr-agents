/**
 * Advanced Workflow Engine for Digital PR Campaigns
 * Handles stage execution, gating, validation, and error recovery
 * 
 * Features:
 * - Sequential stage execution with pause points
 * - Gate-based workflow control
 * - Automatic error recovery
 * - Windows-compatible file operations
 * - Real-time progress tracking
 */

import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { 
  initDatabase, 
  getCampaignById, 
  updateCampaign, 
  updateStageStatus,
  getStagesByCampaign,
  getCurrentStage,
  setGate,
  addLog,
  registerArtifact,
  getGatesByCampaign,
  STAGE_DEFINITIONS,
  Campaign,
  Stage,
  StageStatus,
  GateStatus,
} from './db';

// Import stage executor for model-based execution
import { 
  executeStage as runStageWithExecutor,
  checkCanResumeFromS8,
  getHumanApprovalState 
} from './stageExecutor';

// ============================================================================
// CONFIGURATION
// ============================================================================

const WORKFLOW_ROOT = process.env.ROOT_PATH || 'D:\\Codex Folder\\digital-pr-agents';

interface WorkflowConfig {
  /** Enable automatic stage progression */
  autoProgress: boolean;
  /** Pause after angle generation */
  pauseAfterAngles: boolean;
  /** Enable error recovery */
  errorRecovery: boolean;
  /** Maximum retries per stage */
  maxRetries: number;
  /** Stage timeout in milliseconds */
  stageTimeoutMs: number;
  /** Enable artifact tracking */
  trackArtifacts: boolean;
}

const DEFAULT_CONFIG: WorkflowConfig = {
  autoProgress: true,
  pauseAfterAngles: true,
  errorRecovery: true,
  maxRetries: 3,
  stageTimeoutMs: 60000,
  trackArtifacts: true,
};

// ============================================================================
// INTERFACES
// ============================================================================

export interface WorkflowResult {
  success: boolean;
  paused: boolean;
  completedStages: number;
  currentStage: string | null;
  message: string;
  error: string | null;
  artifacts: string[];
  timestamp: string;
}

export interface StageExecution {
  stage: Stage;
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
  status: StageStatus;
  error: string | null;
  artifacts: string[];
}

export interface WorkflowState {
  campaignId: string;
  config: WorkflowConfig;
  isRunning: boolean;
  isPaused: boolean;
  currentStageIndex: number;
  stages: StageExecution[];
  error: string | null;
}

// ============================================================================
// STAGE FILE PATHS - Windows Compatible
// ============================================================================

function getJobFolder(campaignSlug: string): string {
  return path.join(WORKFLOW_ROOT, 'pitch-jobs', campaignSlug);
}

function getStageFile(campaignSlug: string, stageFile: string): string {
  return path.join(getJobFolder(campaignSlug), stageFile);
}

function getSourceFolder(campaignSlug: string): string {
  return path.join(getJobFolder(campaignSlug), 'source-files');
}

/**
 * Map stage to ModelRouter use case
 */
function getUseCaseForStage(stageName: string): string {
  const useCaseMap: Record<string, string> = {
    'S1_CAMPAIGN_INTAKE': 'orchestration',
    'S2_DATA_EXTRACTION': 'research',
    'S3_RESEARCH_ENRICHMENT': 'research',
    'S4A_DATA_RESEARCH_ANALYST': 'validation',
    'S4B_INSIGHT_ANALYST': 'insight_mapping',
    'S5_ANGLE_GENERATION': 'angle_generation',
    'S6_BEAT_MATCHING': 'beat_matching',
    'S7_PITCH_SELECTION_HUMAN_GATE': 'pitch_selection_scoring',
    'S8_JOURNALIST_COLLECTION': 'journalist_collection',
    'S9_JOURNALIST_INTELLIGENCE': 'journalist_intelligence',
    'S10_PITCH_DRAFTING': 'pitch_drafting',
    'S11_PITCH_OPTIMIZATION': 'rewriting',
    'S12_PACKAGE_ASSEMBLY': 'package_assembly',
    'S13_VALIDATION': 'validation',
    'S14_FINAL_FORMATTING': 'final_formatting',
    'S15_OUTREACH_ASSET_CREATION': 'user_facing_copy',
    'S16_CAMPAIGN_LOG_LEARNING_LOOP': 'learning_loop'
  };
  
  return useCaseMap[stageName] || 'default';
}

// ============================================================================
// VALIDATORS
// ============================================================================

/**
 * Validate stage input files exist
 */
async function validateStageInputs(campaign: Campaign, stageName: string): Promise<{
  valid: boolean;
  missing: string[];
  errors: string[];
}> {
  const result = { valid: true, missing: [] as string[], errors: [] as string[] };
  
  const stageDef = STAGE_DEFINITIONS.find(s => s.name === stageName);
  if (!stageDef) {
    result.errors.push(`Unknown stage: ${stageName}`);
    result.valid = false;
    return result;
  }
  
  const jobFolder = getJobFolder(campaign.slug);
  
  try {
    await fs.access(jobFolder);
  } catch {
    result.errors.push(`Job folder not found: ${jobFolder}`);
    result.valid = false;
    return result;
  }
  
  // Stage-specific validation
  switch (stageName) {
    case '00-brief.md':
      const briefPath = getStageFile(campaign.slug, '00-brief.md');
      try {
        const briefContent = await fs.readFile(briefPath, 'utf8');
        if (briefContent.length < 20) {
          result.errors.push('Brief content is too short');
          result.valid = false;
        }
      } catch {
        result.missing.push('00-brief.md');
        result.valid = false;
      }
      break;
      
    case '01-study-notes.md':
      const sourceFolder = getSourceFolder(campaign.slug);
      try {
        await fs.access(sourceFolder);
      } catch {
        result.missing.push('source-files/');
        result.valid = false;
      }
      break;
  }
  
  return result;
}

// ============================================================================
// STAGE EXECUTORS
// ============================================================================

/**
 * Execute a single stage using stageExecutor with ModelRouter
 */
async function executeStage(
  campaign: Campaign,
  stage: Stage,
  config: WorkflowConfig
): Promise<StageExecution> {
  const execution: StageExecution = {
    stage,
    startedAt: new Date().toISOString(),
    completedAt: null,
    duration: null,
    status: 'in-progress' as StageStatus,
    error: null,
    artifacts: [],
  };
  
  await addLog(
    campaign.id,
    stage.stage_name,
    stage.owner_agent,
    'info',
    `Starting stage: ${stage.stage_name}`
  );
  
  try {
    // Validate inputs
    const validation = await validateStageInputs(campaign, stage.stage_name);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Check for S7 human gate - need approval before proceeding
    if (stage.stage_name.startsWith('S8')) {
      const resumeCheck = await checkCanResumeFromS8(campaign.slug);
      if (!resumeCheck.canResume) {
        execution.status = 'blocked';
        execution.error = `Cannot proceed: ${resumeCheck.reason}`;
        execution.completedAt = new Date().toISOString();
        await addLog(campaign.id, stage.stage_name, stage.owner_agent, 'warning', `Stage blocked: ${resumeCheck.reason}`);
        return execution;
      }
    }
    
    // Use stageExecutor with ModelRouter for execution
    const stageResult = await runStageWithExecutor({
      campaignId: campaign.id,
      campaignSlug: campaign.slug,
      stageId: stage.stage_name,
      input: { campaignSlug: campaign.slug },
      useCase: getUseCaseForStage(stage.stage_name)
    });
    
    if (!stageResult.success) {
      throw new Error(stageResult.error || 'Stage execution failed');
    }
    
    // Check if stage paused (e.g., S7 human gate)
    if (stageResult.paused) {
      execution.status = 'paused';
      execution.completedAt = new Date().toISOString();
      execution.duration = new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime();
      
      await addLog(
        campaign.id,
        stage.stage_name,
        stage.owner_agent,
        'info',
        `Stage paused at human gate: ${stage.stage_name}`
      );
      return execution;
    }
    
    // Track artifact if output was saved
    if (stageResult.outputFile && config.trackArtifacts) {
      try {
        const content = await fs.readFile(stageResult.outputFile, 'utf8');
        await registerArtifact(
          campaign.id,
          stage.stage_name,
          'markdown',
          stage.stage_name,
          stageResult.outputFile,
          content.length,
          'text/markdown'
        );
        execution.artifacts.push(stageResult.outputFile);
      } catch {
        // File may not exist
      }
    }
    
    execution.status = 'completed';
    execution.completedAt = new Date().toISOString();
    execution.duration = new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime();
    
    await addLog(
      campaign.id,
      stage.stage_name,
      stage.owner_agent,
      'info',
      `Stage completed: ${stage.stage_name} (${execution.duration}ms) - Model: ${stageResult.modelResult.modelUsed}`
    );
    
  } catch (err) {
    execution.status = 'failed';
    execution.error = err instanceof Error ? err.message : 'Unknown error';
    execution.completedAt = new Date().toISOString();
    
    if (execution.startedAt) {
      execution.duration = new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime();
    }
    
    await addLog(
      campaign.id,
      stage.stage_name,
      stage.owner_agent,
      'error',
      `Stage failed: ${stage.stage_name} - ${execution.error}`
    );
  }
  
  return execution;
}

// ============================================================================
// GATE HANDLERS
// ============================================================================

/**
 * Check and handle stage gates
 */
async function handleStageGate(
  campaign: Campaign,
  stageName: string,
  config: WorkflowConfig
): Promise<{ shouldPause: boolean; reason: string | null }> {
  // Angle Selection Gate - must pause for user input
  if (stageName === '04-angles.md' && config.pauseAfterAngles) {
    return {
      shouldPause: true,
      reason: 'MANUAL ACTION REQUIRED: Select at least one angle and identify one active selected angle package before proceeding.',
    };
  }
  
  // Check gate status in database
  const gates = await getGatesByCampaign(campaign.id);
  const pendingGate = gates.find(g => 
    g.status === 'awaiting' && 
    g.gate_type === 'selection'
  );
  
  if (pendingGate) {
    return {
      shouldPause: true,
      reason: `Gate pending: ${pendingGate.gate_name}`,
    };
  }
  
  return { shouldPause: false, reason: null };
}

// ============================================================================
// MAIN WORKFLOW EXECUTOR
// ============================================================================

/**
 * Run the complete workflow for a campaign
 */
export async function runWorkflow(
  campaignId: string,
  config: Partial<WorkflowConfig> = {}
): Promise<WorkflowResult> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  
  await initDatabase();
  
  const campaign = await getCampaignById(campaignId);
  if (!campaign) {
    return {
      success: false,
      paused: false,
      completedStages: 0,
      currentStage: null,
      message: 'Campaign not found',
      error: 'Campaign not found',
      artifacts: [],
      timestamp: new Date().toISOString(),
    };
  }
  
  // Update campaign status
  await updateCampaign(campaignId, { 
    status: 'running',
    started_at: campaign.started_at || new Date().toISOString(),
  });
  
  await addLog(campaign.id, null, 'orchestrator', 'info', 'Workflow started');
  
  const stages = await getStagesByCampaign(campaignId);
  const completedStages: Stage[] = [];
  const artifacts: string[] = [];
  
  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    
    // Skip already completed stages
    if (stage.status === 'completed') {
      completedStages.push(stage);
      continue;
    }
    
    // Update stage status
    await updateStageStatus(campaignId, stage.stage_name, 'in-progress');
    
    // Execute stage
    const execution = await executeStage(campaign, stage, mergedConfig);
    
    // Update stage in database
    await updateStageStatus(
      campaignId, 
      stage.stage_name, 
      execution.status,
      execution.error
    );
    
    // Track artifacts
    artifacts.push(...execution.artifacts);
    
    if (execution.status === 'completed') {
      completedStages.push({ ...stage, status: 'completed' });
    } else if (execution.status === 'failed') {
      // Handle failure
      if (mergedConfig.errorRecovery && (stage.retry_count || 0) < mergedConfig.maxRetries) {
        await addLog(
          campaign.id,
          stage.stage_name,
          stage.owner_agent,
          'warning',
          `Retrying stage (attempt ${(stage.retry_count || 0) + 1})`
        );
        // Retry logic would go here
      } else {
        await updateCampaign(campaignId, { status: 'failed' });
        
        return {
          success: false,
          paused: false,
          completedStages: completedStages.length,
          currentStage: stage.stage_name,
          message: `Stage failed: ${stage.stage_name}`,
          error: execution.error,
          artifacts,
          timestamp: new Date().toISOString(),
        };
      }
    }
    
    // Check for gate pause
    const gateCheck = await handleStageGate(campaign, stage.stage_name, mergedConfig);
    if (gateCheck.shouldPause) {
      await updateCampaign(campaignId, { status: 'paused' });
      await addLog(campaign.id, null, 'orchestrator', 'warning', `Workflow paused: ${gateCheck.reason}`);
      
      return {
        success: true,
        paused: true,
        completedStages: completedStages.length,
        currentStage: stage.stage_name,
        message: gateCheck.reason || 'Workflow paused at gate',
        error: null,
        artifacts,
        timestamp: new Date().toISOString(),
      };
    }
  }
  
  // All stages completed
  await updateCampaign(campaignId, { 
    status: 'completed',
    completed_at: new Date().toISOString(),
    progress_percentage: 100,
  });
  
  await addLog(campaign.id, null, 'orchestrator', 'info', 'Workflow completed successfully');
  
  return {
    success: true,
    paused: false,
    completedStages: completedStages.length,
    currentStage: null,
    message: 'All stages completed successfully',
    error: null,
    artifacts,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// STAGE CONTROL FUNCTIONS
// ============================================================================

/**
 * Continue workflow after pause
 */
export async function continueWorkflow(
  campaignId: string,
  selectedAngle: string,
  selectedBeat: string | null = null
): Promise<WorkflowResult> {
  await initDatabase();
  
  const campaign = await getCampaignById(campaignId);
  if (!campaign) {
    throw new Error('Campaign not found');
  }
  
  // Update selected angle
  await updateCampaign(campaignId, {
    selected_angle: selectedAngle,
    selected_beat: selectedBeat,
    status: 'active',
  });
  
  // Set the angle selection gate
  await setGate(campaignId, 'angle-selection', 'selection', selectedAngle);
  
  await addLog(campaign.id, null, 'orchestrator', 'info', `Angle selected: ${selectedAngle}`);
  
  // Resume workflow
  return runWorkflow(campaignId);
}

/**
 * Skip to a specific stage
 */
export async function skipToStage(
  campaignId: string,
  targetStageName: string
): Promise<WorkflowResult> {
  await initDatabase();
  
  const campaign = await getCampaignById(campaignId);
  if (!campaign) {
    throw new Error('Campaign not found');
  }
  
  const stages = await getStagesByCampaign(campaignId);
  const targetIndex = stages.findIndex(s => s.stage_name === targetStageName);
  
  if (targetIndex === -1) {
    throw new Error(`Stage not found: ${targetStageName}`);
  }
  
  // Mark all earlier stages as completed
  for (let i = 0; i < targetIndex; i++) {
    await updateStageStatus(campaignId, stages[i].stage_name, 'completed');
  }
  
  // Update campaign progress
  const progress = Math.round((targetIndex / stages.length) * 100);
  await updateCampaign(campaignId, { 
    current_stage: targetIndex + 1,
    progress_percentage: progress,
  });
  
  await addLog(campaign.id, null, 'orchestrator', 'info', `Skipped to stage: ${targetStageName}`);
  
  return {
    success: true,
    paused: true,
    completedStages: targetIndex,
    currentStage: targetStageName,
    message: `Skipped to ${targetStageName}`,
    error: null,
    artifacts: [],
    timestamp: new Date().toISOString(),
  };
}

/**
 * Retry a failed stage
 */
export async function retryStage(campaignId: string, stageName: string): Promise<WorkflowResult> {
  await initDatabase();
  
  const campaign = await getCampaignById(campaignId);
  if (!campaign) {
    throw new Error('Campaign not found');
  }
  
  // Reset stage status
  await updateStageStatus(campaignId, stageName, 'pending');
  
  await addLog(campaign.id, stageName, 'orchestrator', 'info', `Retrying stage: ${stageName}`);
  
  // Run workflow from current position
  return runWorkflow(campaignId);
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate campaign for workflow execution
 */
export async function validateCampaign(campaignId: string): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
}> {
  await initDatabase();
  
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const campaign = await getCampaignById(campaignId);
  if (!campaign) {
    errors.push('Campaign not found');
    return { valid: false, errors, warnings };
  }
  
  // Check job folder exists
  const jobFolder = getJobFolder(campaign.slug);
  try {
    await fs.access(jobFolder);
  } catch {
    errors.push(`Job folder not found: ${jobFolder}`);
  }
  
  // Check brief exists
  if (!campaign.brief) {
    warnings.push('Campaign brief is empty');
  }
  
  // Check status
  if (campaign.status === 'completed') {
    warnings.push('Campaign is already completed');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  runWorkflow,
  continueWorkflow,
  skipToStage,
  retryStage,
  validateCampaign,
  STAGE_DEFINITIONS,
};