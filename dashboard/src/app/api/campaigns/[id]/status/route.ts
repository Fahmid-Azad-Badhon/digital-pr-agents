/**
 * =============================================================================
 * Campaign Status API Route - Canonical State
 * =============================================================================
 *
 * Returns comprehensive campaign status from canonical campaign state service
 *
 * GET /api/campaigns/{id}/status
 *
 * =============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCampaignState } from '@/lib/campaignStateService';
import { assertValidCampaignId, resolveCampaignPath } from '@/lib/requestGuard';
import fs from 'fs/promises';

// Map canonical status to legacy API format for backward compatibility
function mapToLegacyFormat(state: Awaited<ReturnType<typeof getCampaignState>>) {
  if (!state) {
    return { error: 'Campaign not found', status: 404 };
  }

  // Map canonical stages to legacy format
  const legacyStages = state.stages.map(stage => ({
    name: stage.name,
    status: stage.status === 'completed' ? 'passed' :
           stage.status === 'running' ? 'running' :
           stage.status === 'waiting' ? 'waiting' :
           stage.status === 'needs_review' ? 'waiting_approval' :
           stage.status === 'blocked' ? 'blocked' :
           stage.status === 'failed' ? 'failed' :
           stage.status === 'paused' ? 'paused' : 'waiting',
    outputFile: `${stage.number.toString().padStart(2, '0')}-${stage.key.toLowerCase()}.md`
  }));

  // Map workflow status - use canonical status directly for consistency
  let workflowStatus: string;
  switch (state.overallStatus) {
    case 'completed':
      workflowStatus = 'completed';
      break;
    case 'waiting_for_human_approval':
      workflowStatus = 'waiting_for_human_approval';
      break;
    case 'failed':
      workflowStatus = 'failed';
      break;
    case 'blocked':
      workflowStatus = 'blocked';
      break;
    case 'paused':
      workflowStatus = 'paused';
      break;
    case 'running':
      workflowStatus = 'running';
      break;
    case 'draft':
      workflowStatus = 'draft';
      break;
    default:
      workflowStatus = 'not_started';
  }

  return {
    campaignName: state.campaignName,
    currentStage: `S${state.currentStage}`,
    workflowStatus,
    lastUpdated: state.updatedAt,
    stagesCompleted: state.completedStages,
    stagesRemaining: state.remainingStages,
    validationStatus: state.strictAuditReady ? 'passed' : 'not_run',
    finalReadiness: state.overallStatus === 'completed',
    stages: legacyStages,
    fallbackEvents: state.blockers.length > 0 ? state.blockers.map(b => ({
      stage: b.stageNumber,
      reason: b.reason,
      errorCode: b.errorCode
    })) : [],
    modelUsage: {},
    humanApproval: state.humanApproval,
    outputFiles: state.stages.map(s => ({
      name: `${s.number.toString().padStart(2, '0')}-${s.key.toLowerCase()}.md`,
      exists: s.artifactStatus !== 'missing',
      status: s.artifactStatus
    })),
    errors: state.blockers.map(b => ({
      stage: b.stageNumber,
      message: b.reason,
      code: b.errorCode
    })),
    canWorkflowContinue: state.canWorkflowContinue,
    humanActionRequired: state.humanActionRequired,
    nextAction: state.nextAction,
    strictAuditReady: state.strictAuditReady,
    integrationReadiness: state.integrationReadiness
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const campaignId = assertValidCampaignId(id);

  try {
    // Verify campaign exists
    const campaignPath = resolveCampaignPath(campaignId);
    const exists = await fs.stat(campaignPath).then(stat => stat.isDirectory()).catch(() => false);
    if (!exists) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Get canonical state
    const state = await getCampaignState(campaignId);
    const legacyFormat = mapToLegacyFormat(state);

    if ('status' in legacyFormat && legacyFormat.status === 404) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json(legacyFormat);

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}