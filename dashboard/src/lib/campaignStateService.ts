/**
 * =============================================================================
 * Campaign State Service - Canonical Backend State Source
 * =============================================================================
 *
 * This service is the single source of truth for campaign state across all API routes.
 * All status/progress/stats routes must consume this service to ensure consistency.
 *
 * =============================================================================
 */

import fs from 'fs/promises';
import path from 'path';
import { STAGES, TOTAL_WORKFLOW_STAGES, isHumanGate, getPhaseByStage } from '@/types';
import { safeReadJsonFile } from './fileReadSafety';
import { getIntegrationReadiness, stageRequiresIntegration } from './integrationReadiness';
import { FALLBACK_MARKERS, looksLikeFallback } from './fallbackMarkers';
import { PITCH_JOBS_ROOT } from './requestGuard';

export type CampaignOverallStatus = 'draft' | 'running' | 'paused' | 'completed' | 'failed' | 'waiting_for_human_approval' | 'blocked';

export interface StageStateInfo {
  id: number;
  number: number;
  key: string;
  name: string;
  owner: string;
  phase: string;
  status: 'completed' | 'running' | 'waiting' | 'blocked' | 'failed' | 'paused' | 'needs_review';
  progress: number;
  startedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  blockedAt: string | null;
  blockedReason: string | null;
  errorCode: string | null;
  outputQuality: 'real' | 'fallback' | 'unknown';
  artifactStatus: 'exists' | 'missing' | 'empty' | 'thin';
  provenanceStatus: 'verified' | 'missing' | 'partial';
  auditStatus: 'passed' | 'failed' | 'not_run';
  canRun: boolean;
  canRetry: boolean;
  requiresHumanApproval: boolean;
}

export interface CampaignStateResult {
  campaignId: string;
  campaignName: string;
  overallStatus: CampaignOverallStatus;
  currentStage: number;
  currentStageName: string;
  currentPhase: string;
  progress: number;
  completedStages: number;
  remainingStages: number;
  canWorkflowContinue: boolean;
  humanActionRequired: boolean;
  humanActionAt: number | null;
  blockers: Array<{
    stageNumber: number;
    stageName: string;
    reason: string;
    errorCode: string;
    retryable: boolean;
  }>;
  failedStages: number[];
  nextAction: {
    type: 'advance' | 'select_pitch' | 'retry' | 'unblock' | 'complete';
    stageNumber: number;
    stageName: string;
    description: string;
  } | null;
  stages: StageStateInfo[];
  humanApproval: {
    status: 'none' | 'waiting' | 'approved' | 'rejected';
    selectedAngleTitle: string | null;
    approvedAt: string | null;
  };
  integrationReadiness: {
    muckrack: 'ready' | 'not_configured' | 'session_expired' | 'missing';
    googleOAuth: 'ready' | 'not_configured' | 'token_expired' | 'missing';
    scripts: 'ready' | 'not_configured' | 'missing' | 'failed';
  };
  strictAuditReady: boolean;
  updatedAt: string;
}

const STAGE_OUTPUT_FILES: Record<number, string[]> = {
  1: ['01-campaign-intake.json'],
  2: ['02-raw-extracted-data.json', '02-insights.md'],
  3: ['03-research-enrichment.json', '03-research.md', 'verified-findings.json'],
  4: ['04-angles.md', 'InsightAnalysisMap.json', 'AngleGenerationHandoff.json'],
  5: ['05-angles.md', '05-beats.md'],
  6: ['06-beat-match.json'],
  7: ['07-selected-angle.md', 'human-approval.json'],
  8: ['08-journalist-list.csv'],
  9: ['09-journalist-intelligence.json', '06-journalist-intel.md', '07-journalist-coverage.md'],
  10: ['10-pitch-draft.md'],
  11: ['11-optimized-pitch.md'],
  12: ['12-outreach-package.md'],
  13: ['13-validation-report.json'],
  14: ['14-final-formatted-package.md'],
  15: ['15-outreach-assets.md'],
  16: ['16-campaign-learning-log.json'],
};

function containsFallbackMarker(content: string): boolean {
  return looksLikeFallback(content);
}

async function checkFileExists(filePath: string): Promise<{ exists: boolean; size: number; content?: string }> {
  try {
    const stats = await fs.stat(filePath);
    if (stats.size > 0) {
      const content = await fs.readFile(filePath, 'utf-8').catch(() => '');
      return { exists: true, size: stats.size, content: content.slice(0, 10000) };
    }
    return { exists: true, size: 0 };
  } catch {
    return { exists: false, size: 0 };
  }
}

async function getHumanApproval(campaignPath: string): Promise<CampaignStateResult['humanApproval']> {
  try {
    const approvalPath = path.join(campaignPath, 'human-approval.json');
    const approval = await safeReadJsonFile<{
      status?: string;
      selectedAngleTitle?: string;
      approvedAt?: string;
    }>(approvalPath);
    if (approval) {
      return {
        status: (approval.status as 'none' | 'waiting' | 'approved' | 'rejected') || 'none',
        selectedAngleTitle: approval.selectedAngleTitle || null,
        approvedAt: approval.approvedAt || null,
      };
    }
  } catch {}
  return { status: 'none', selectedAngleTitle: null, approvedAt: null };
}

async function checkOutputQuality(campaignPath: string, stageNumber: number): Promise<{
  outputQuality: 'real' | 'fallback' | 'unknown';
  artifactStatus: 'exists' | 'missing' | 'empty' | 'thin';
  provenanceStatus: 'verified' | 'missing' | 'partial';
}> {
  const expectedFiles = STAGE_OUTPUT_FILES[stageNumber] || [];
  let hasRealOutput = false;
  let hasFallback = false;
  let totalSize = 0;

  for (const fileName of expectedFiles) {
    const filePath = path.join(campaignPath, fileName);
    const fileInfo = await checkFileExists(filePath);

    if (fileInfo.exists && fileInfo.size > 0) {
      totalSize += fileInfo.size;
      if (fileInfo.content && containsFallbackMarker(fileInfo.content)) {
        hasFallback = true;
      } else {
        hasRealOutput = true;
      }
    }
  }

  let outputQuality: 'real' | 'fallback' | 'unknown' = 'unknown';
  if (hasFallback && !hasRealOutput) {
    outputQuality = 'fallback';
  } else if (hasRealOutput) {
    outputQuality = 'real';
  }

  let artifactStatus: 'exists' | 'missing' | 'empty' | 'thin' = 'missing';
  if (expectedFiles.length > 0) {
    const existingCount = expectedFiles.filter(async (f) => (await checkFileExists(path.join(campaignPath, f))).exists).length;
    if (existingCount === expectedFiles.length) {
      artifactStatus = totalSize < 100 ? 'thin' : 'exists';
    } else if (existingCount > 0) {
      artifactStatus = 'exists';
    }
  }

  const provenanceStatus: 'verified' | 'missing' | 'partial' = 'partial';

  return { outputQuality, artifactStatus, provenanceStatus };
}

async function readStageState(campaignPath: string): Promise<{ currentStage: number; status: string } | null> {
  const stageStatePath = path.join(campaignPath, 'stage-state.json');
  return safeReadJsonFile(stageStatePath);
}

export async function getCampaignState(campaignId: string): Promise<CampaignStateResult | null> {
  const campaignPath = path.join(PITCH_JOBS_ROOT, campaignId);

  try {
    const dirStats = await fs.stat(campaignPath);
    if (!dirStats.isDirectory()) {
      return null;
    }
  } catch {
    return null;
  }

  const stageState = await readStageState(campaignPath);
  const currentStage = stageState?.currentStage || 1;
  const stageStatus = stageState?.status || 'running';

  const humanApproval = await getHumanApproval(campaignPath);

  const stages: StageStateInfo[] = [];
  let hasBlocker = false;
  let failedStages: number[] = [];

  for (const stage of STAGES) {
    const isCompleted = stage.number < currentStage;
    const isRunning = stage.number === currentStage;
    const isWaiting = stage.number > currentStage;

    const { outputQuality, artifactStatus, provenanceStatus } = await checkOutputQuality(campaignPath, stage.number);

    let status: StageStateInfo['status'] = 'waiting';
    if (isCompleted) {
      status = outputQuality === 'fallback' ? 'failed' : 'completed';
      if (outputQuality === 'fallback') {
        failedStages.push(stage.number);
      }
    } else if (isRunning) {
      status = stageStatus === 'paused' ? 'paused' : 'running';
    } else if (isWaiting) {
      if (failedStages.length > 0 || hasBlocker) {
        status = 'blocked';
      } else {
        status = 'waiting';
      }
    }

    stages.push({
      id: stage.number,
      number: stage.number,
      key: stage.name.toLowerCase().replace(/\s+/g, '-'),
      name: stage.name,
      owner: stage.owner,
      phase: getPhaseByStage(stage.number),
      status,
      progress: isCompleted ? 100 : (isRunning ? 50 : 0),
      startedAt: isRunning ? new Date().toISOString() : null,
      completedAt: isCompleted ? new Date().toISOString() : null,
      failedAt: outputQuality === 'fallback' ? new Date().toISOString() : null,
      blockedAt: null,
      blockedReason: status === 'blocked' ? 'Upstream stage failed or blocked' : null,
      errorCode: outputQuality === 'fallback' ? 'FALLBACK_OUTPUT_DETECTED' : null,
      outputQuality,
      artifactStatus,
      provenanceStatus,
      auditStatus: 'not_run',
      canRun: !isCompleted && !hasBlocker,
      canRetry: status === 'failed',
      requiresHumanApproval: isHumanGate(stage.number),
    });

    if (status === 'blocked') {
      hasBlocker = true;
    }
  }

  let overallStatus: CampaignOverallStatus = 'draft';
  const knownStatuses = ['paused', 'running', 'draft', 'completed', 'failed', 'blocked', 'waiting_for_human_approval'];
  if (humanApproval.status === 'waiting') {
    overallStatus = 'waiting_for_human_approval';
  } else if (failedStages.length > 0) {
    overallStatus = 'failed';
  } else if (currentStage >= TOTAL_WORKFLOW_STAGES) {
    overallStatus = 'completed';
  } else if (knownStatuses.includes(stageStatus)) {
    if (stageStatus === 'paused') {
      overallStatus = 'paused';
    } else if (stageStatus === 'draft') {
      overallStatus = 'draft';
    } else if (stageStatus === 'running') {
      overallStatus = 'running';
    } else if (stageStatus === 'failed') {
      overallStatus = 'failed';
    } else if (stageStatus === 'blocked') {
      overallStatus = 'blocked';
    } else if (stageStatus === 'completed') {
      overallStatus = 'completed';
    } else {
      overallStatus = 'draft';
    }
  } else {
    // Treat non-standard stage-state statuses (e.g. 'waiting-for-user-input') as draft
    overallStatus = 'draft';
  }

  const humanActionRequired = isHumanGate(currentStage) && humanApproval.status === 'waiting';
  const humanActionAt = isHumanGate(currentStage) ? currentStage : null;

  const blockers: CampaignStateResult['blockers'] = [];
  if (failedStages.length > 0) {
    for (const failedStageNum of failedStages) {
      const stageInfo = STAGES.find(s => s.number === failedStageNum);
      blockers.push({
        stageNumber: failedStageNum,
        stageName: stageInfo?.name || `Stage ${failedStageNum}`,
        reason: 'Stage produced fallback/synthetic output',
        errorCode: 'FALLBACK_OUTPUT_DETECTED',
        retryable: true,
      });
    }
  }

  let nextAction: CampaignStateResult['nextAction'] = null;
  if (isHumanGate(currentStage) && humanApproval.status === 'waiting') {
    nextAction = {
      type: 'select_pitch',
      stageNumber: currentStage,
      stageName: STAGES[currentStage - 1]?.name || 'Pitch Selection',
      description: 'Select a pitch angle to proceed',
    };
  } else if (failedStages.length > 0) {
    const lastFailed = failedStages[failedStages.length - 1];
    nextAction = {
      type: 'retry',
      stageNumber: lastFailed,
      stageName: STAGES[lastFailed - 1]?.name || `Stage ${lastFailed}`,
      description: 'Retry failed stage with real input',
    };
  } else if (currentStage < TOTAL_WORKFLOW_STAGES) {
    nextAction = {
      type: 'advance',
      stageNumber: currentStage + 1,
      stageName: STAGES[currentStage]?.name || 'Next Stage',
      description: `Advance to ${STAGES[currentStage]?.name || 'next stage'}`,
    };
  } else {
    nextAction = {
      type: 'complete',
      stageNumber: currentStage,
      stageName: 'Complete',
      description: 'Workflow completed',
    };
  }

  const completedStages = stages.filter(s => s.status === 'completed').length;
  const progress = Math.round((completedStages / TOTAL_WORKFLOW_STAGES) * 100);

  const strictAuditReady = !stages.some(s => s.outputQuality === 'fallback');

  // Integration readiness - use real checks via integrationReadiness module
  const hasReachedIntegrationStages = stageRequiresIntegration(currentStage);
  let integrationReadiness: CampaignStateResult['integrationReadiness'];

  if (hasReachedIntegrationStages) {
    // Real checks for stages that require integrations
    const readiness = await getIntegrationReadiness();
    integrationReadiness = {
      // Cast to specific types expected by CampaignStateResult interface
      muckrack: (readiness.muckrack === 'ready' ? 'ready' :
                 readiness.muckrack === 'session_expired' ? 'session_expired' :
                 readiness.muckrack === 'missing' ? 'missing' : 'not_configured') as CampaignStateResult['integrationReadiness']['muckrack'],
      googleOAuth: (readiness.googleOAuth === 'ready' ? 'ready' :
                    readiness.googleOAuth === 'token_expired' ? 'token_expired' :
                    readiness.googleOAuth === 'missing' ? 'missing' : 'not_configured') as CampaignStateResult['integrationReadiness']['googleOAuth'],
      scripts: (readiness.scripts === 'ready' ? 'ready' :
                readiness.scripts === 'failed' ? 'failed' :
                readiness.scripts === 'missing' ? 'missing' : 'not_configured') as CampaignStateResult['integrationReadiness']['scripts'],
    };
  } else {
    // Pre-integration stages - check scripts availability for execution
    const readiness = await getIntegrationReadiness();
    integrationReadiness = {
      muckrack: 'ready', // Not needed for early stages
      googleOAuth: 'ready', // Not needed for early stages
      scripts: (readiness.scripts === 'ready' ? 'ready' :
                readiness.scripts === 'failed' ? 'failed' :
                readiness.scripts === 'missing' ? 'missing' : 'not_configured') as CampaignStateResult['integrationReadiness']['scripts'],
    };
  }

  return {
    campaignId,
    campaignName: campaignId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    overallStatus,
    currentStage,
    currentStageName: STAGES[currentStage - 1]?.name || 'Unknown',
    currentPhase: getPhaseByStage(currentStage),
    progress,
    completedStages,
    remainingStages: TOTAL_WORKFLOW_STAGES - completedStages,
    canWorkflowContinue: !humanActionRequired && blockers.length === 0 && currentStage < TOTAL_WORKFLOW_STAGES,
    humanActionRequired,
    humanActionAt,
    blockers,
    failedStages,
    nextAction,
    stages,
    humanApproval,
    integrationReadiness,
    strictAuditReady,
    updatedAt: new Date().toISOString(),
  };
}

export async function getCampaignListState(): Promise<CampaignStateResult[]> {
  try {
    const folders = await fs.readdir(PITCH_JOBS_ROOT);
    const campaigns: CampaignStateResult[] = [];

    for (const folder of folders) {
      const folderPath = path.join(PITCH_JOBS_ROOT, folder);
      const stats = await fs.stat(folderPath).catch(() => null);

      if (stats && stats.isDirectory()) {
        const state = await getCampaignState(folder);
        if (state) {
          campaigns.push(state);
        }
      }
    }

    return campaigns.sort((a, b) => a.campaignId.localeCompare(b.campaignId));
  } catch (error) {
    console.error('Error getting campaign list state:', error);
    return [];
  }
}

export async function getCampaignStats(): Promise<{
  total: number;
  active: number;
  completed: number;
  failed: number;
  draft: number;
  paused: number;
  waitingForHumanApproval: number;
}> {
  const campaigns = await getCampaignListState();

  return {
    total: campaigns.length,
    active: campaigns.filter(c => c.overallStatus === 'running').length,
    completed: campaigns.filter(c => c.overallStatus === 'completed').length,
    failed: campaigns.filter(c => c.overallStatus === 'failed').length,
    draft: campaigns.filter(c => c.overallStatus === 'draft').length,
    paused: campaigns.filter(c => c.overallStatus === 'paused').length,
    waitingForHumanApproval: campaigns.filter(c => c.overallStatus === 'waiting_for_human_approval').length,
  };
}

export async function getStageState(campaignId: string, stageNumber: number): Promise<StageStateInfo | null> {
  const campaignState = await getCampaignState(campaignId);
  if (!campaignState) return null;

  return campaignState.stages.find(s => s.number === stageNumber) || null;
}

export async function validateUpstreamLineage(campaignPath: string, targetStage: number): Promise<{
  blocked: boolean;
  fallbackStages: Array<{ stage: number; files: string[] }>;
}> {
  const fallbackStages: Array<{ stage: number; files: string[] }> = [];
  for (let stage = 1; stage < targetStage; stage++) {
    const files = STAGE_OUTPUT_FILES[stage] || [];
    if (files.length === 0) continue;
    const fallbackFiles: string[] = [];
    for (const file of files) {
      const fullPath = path.join(campaignPath, file);
      try {
        const content = await fs.readFile(fullPath, 'utf-8');
        if (content.trim() && looksLikeFallback(content)) {
          fallbackFiles.push(file);
        }
      } catch {
        // file doesn't exist - skip
      }
    }
    if (fallbackFiles.length > 0) {
      fallbackStages.push({ stage, files: fallbackFiles });
    }
  }
  return { blocked: fallbackStages.length > 0, fallbackStages };
}