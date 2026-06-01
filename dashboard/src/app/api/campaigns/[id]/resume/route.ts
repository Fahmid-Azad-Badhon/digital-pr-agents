/**
 * =============================================================================
 * Campaign Resume API Route
 * =============================================================================
 */

import { NextRequest } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { fail, ok } from '@/lib/apiResponse';
import { PITCH_JOBS_ROOT } from '@/lib/requestGuard';
import { getApprovalProgressionDecision, type ProvenanceStatus } from '@/lib/provenance';

const CAMPAIGNS_DIR = PITCH_JOBS_ROOT;

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
    
    const campaignDir = path.join(CAMPAIGNS_DIR, campaignSlug);
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
    
    const now = new Date().toISOString();
    try {
      const logPath = path.join(campaignDir, 'audit-log.json');
      let logs: unknown[] = [];
      try {
        const logContent = await fs.readFile(logPath, 'utf-8');
        logs = JSON.parse(logContent);
      } catch {}
      
      logs.push({ timestamp: now, event: 'workflow_resume', targetStage, selectedAngle: approval.selectedAngleTitle });
      await fs.writeFile(logPath, JSON.stringify(logs, null, 2));
    } catch {}

    const response: Record<string, unknown> = {
      message: `Resumed from S7 to ${targetStage}`,
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
