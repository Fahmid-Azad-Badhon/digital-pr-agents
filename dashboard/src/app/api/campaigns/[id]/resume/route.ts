/**
 * =============================================================================
 * Campaign Resume API Route
 * =============================================================================
 * After a human approval at S7, this route verifies the approval record and
 * provenance, then advances the campaign stage-state to the requested target
 * stage. Stage regression is prevented unless the target is below the current
 * stage (the workflow will then be resumed from the current stage).
 */

import { NextRequest } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { fail, ok } from '@/lib/apiResponse';
import { assertValidCampaignId, resolveCampaignPath } from '@/lib/requestGuard';
import { getApprovalProgressionDecision, type ProvenanceStatus } from '@/lib/provenance';
import { TOTAL_WORKFLOW_STAGES } from '@/types';

function parseTargetStage(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return null;
  }
  const raw = String(value).trim();
  const match = raw.match(/(\d{1,2})/);
  if (!match) {
    return null;
  }
  const parsed = Number(match[1]);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
}

async function readCurrentStage(campaignDir: string): Promise<number> {
  const stageStatePath = path.join(campaignDir, 'stage-state.json');
  const state = await fs.readFile(stageStatePath, 'utf-8')
    .then(content => JSON.parse(content) as { currentStage?: number })
    .catch(() => null);
  const current = state?.currentStage;
  return current && Number.isFinite(current) ? current : 1;
}

async function writeStageState(campaignDir: string, currentStage: number, status: string): Promise<void> {
  const stageStatePath = path.join(campaignDir, 'stage-state.json');
  const merged = {
    currentStage,
    status,
    updatedAt: new Date().toISOString(),
  };
  const tempPath = `${stageStatePath}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(merged, null, 2), 'utf-8');
  await fs.rename(tempPath, stageStatePath);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignSlug } = await params;

  try {
    const body = await request.json();
    const { targetStage } = body;

    if (!targetStage) {
      return fail('TARGET_STAGE_REQUIRED', 'targetStage is required.', { status: 400 });
    }

    const campaignId = assertValidCampaignId(campaignSlug);
    const campaignDir = resolveCampaignPath(campaignId);
    await fs.access(campaignDir);

    const approvalPath = path.join(campaignDir, 'human-approval.json');
    let approval: { status: string; selectedAngleTitle?: string; selectedAngleId?: string; provenanceStatus?: ProvenanceStatus; provenanceWarning?: string };

    try {
      const content = await fs.readFile(approvalPath, 'utf-8');
      approval = JSON.parse(content);
    } catch {
      return fail('APPROVAL_RECORD_MISSING', 'No approval record found.', { status: 400 });
    }

    if (approval.status !== 'approved') {
      return fail('APPROVAL_NOT_APPROVED', `Status is: ${approval.status}. Must be 'approved'.`, { status: 400 }, { currentStatus: approval.status });
    }

    const provenanceDecision = getApprovalProgressionDecision({ status: approval.status, provenanceStatus: approval.provenanceStatus });
    if (!provenanceDecision.allowed) {
      return fail('PROVENANCE_BLOCKED', provenanceDecision.reason, { status: 400 });
    }

    const provenanceWarning = 'warning' in provenanceDecision ? provenanceDecision.warning : undefined;

    if (!approval.selectedAngleTitle && !approval.selectedAngleId) {
      return fail('ANGLE_NOT_SELECTED', 'No angle selected.', { status: 400 });
    }

    const parsedTarget = parseTargetStage(targetStage);
    if (parsedTarget === null || parsedTarget < 1) {
      return fail('INVALID_TARGET_STAGE', 'targetStage must reference a valid workflow stage.', { status: 400 }, { targetStage });
    }

    const currentStage = await readCurrentStage(campaignDir);
    const targetStageNumber = Math.min(parsedTarget, TOTAL_WORKFLOW_STAGES);
    const safeStage = Math.max(currentStage, targetStageNumber);
    const nextStatus = safeStage >= TOTAL_WORKFLOW_STAGES ? 'completed' : 'running';

    await writeStageState(campaignDir, safeStage, nextStatus);

    const now = new Date().toISOString();
    try {
      const logPath = path.join(campaignDir, 'audit-log.json');
      let logs: unknown[] = [];
      try {
        const logContent = await fs.readFile(logPath, 'utf-8');
        logs = JSON.parse(logContent);
      } catch {}

      logs.push({ timestamp: now, event: 'workflow_resume', targetStage: targetStageNumber, safeStage, selectedAngle: approval.selectedAngleTitle });
      await fs.writeFile(logPath, JSON.stringify(logs, null, 2));
    } catch {}

    const response: Record<string, unknown> = {
      message: `Resumed from S7 to S${safeStage}`,
      currentStage: safeStage,
      selectedAngle: approval.selectedAngleTitle || approval.selectedAngleId,
    };
    if (provenanceWarning) {
      response.provenanceWarning = provenanceWarning;
    }
    return ok(response);

  } catch (error) {
    return fail('RESUME_FAILED', 'Resume failed.', { status: 500 }, error instanceof Error ? error.message : 'Unknown error');
  }
}
