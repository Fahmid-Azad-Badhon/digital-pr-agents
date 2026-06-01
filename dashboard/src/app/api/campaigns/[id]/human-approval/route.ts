import { NextRequest } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { fail, ok } from '@/lib/apiResponse';
import { writeApiAuditLog } from '@/lib/logger';
import { PITCH_JOBS_ROOT } from '@/lib/requestGuard';
import { getRunModeFromRequest } from '@/lib/runMode';
import { classifyProvenance, type ApprovalSource } from '@/lib/provenance';

const CAMPAIGNS_DIR = PITCH_JOBS_ROOT;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignSlug } = await params;
  
  try {
    const approvalPath = path.join(CAMPAIGNS_DIR, campaignSlug, 'human-approval.json');
    const content = await fs.readFile(approvalPath, 'utf-8');
    const data = JSON.parse(content);

    const hasRunMode = data.runMode !== undefined && data.runMode !== null;
    const hasSource = data.source !== undefined && data.source !== null;
    const hasSchemaVersion = data.schemaVersion !== undefined && data.schemaVersion !== null;

    const { provenanceStatus, provenanceWarning } = classifyProvenance(
      hasRunMode,
      hasSource,
      hasSchemaVersion,
      data.runMode,
    );

    return ok({
      ...data,
      provenanceStatus,
      provenanceWarning,
      runMode: data.runMode ?? null,
      source: data.source ?? null,
      schemaVersion: data.schemaVersion ?? null,
    });
  } catch {
    return ok({
      stageId: 'S7',
      status: 'none',
      provenanceStatus: 'missing' as const,
      runMode: null,
      source: null,
      schemaVersion: null,
    });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignSlug } = await params;
  
  try {
    const body = await request.json();
    const { action, selectedAngleId, selectedAngleTitle, notes } = body;
    
    if (!action) {
      return fail('ACTION_REQUIRED', 'Action is required.', { status: 400 });
    }
    
    const runMode = getRunModeFromRequest(request);
    const campaignDir = path.join(CAMPAIGNS_DIR, campaignSlug);
    await fs.access(campaignDir);

    if (runMode !== 'live') {
      return ok({
        blocked: true,
        reason: 'Non-live mode; human-approval writes are not persisted.',
      });
    }
    
    const approvalPath = path.join(campaignDir, 'human-approval.json');
    let approval: Record<string, unknown> = {
      stageId: 'S7_PITCH_SELECTION_HUMAN_GATE',
      status: 'waiting',
      selectedAngleId: null,
      selectedAngleTitle: null,
      approvedBy: 'human',
      approvedAt: null,
      notes: null,
    };
    
    try {
      const existing = await fs.readFile(approvalPath, 'utf-8');
      approval = JSON.parse(existing);
    } catch {}

    const now = new Date().toISOString();
    
    if (action === 'approve') {
      approval.status = 'approved';
      approval.selectedAngleId = selectedAngleId || null;
      approval.selectedAngleTitle = selectedAngleTitle || null;
      approval.approvedAt = now;
      approval.notes = notes || null;
    } else if (action === 'reject') {
      approval.status = 'rejected';
      approval.approvedAt = now;
      approval.notes = notes || 'Rejected';
    } else if (action === 'request_revision') {
      approval.status = 'needs_revision';
      approval.approvedAt = now;
      approval.notes = notes || 'Revision requested';
    } else {
      return fail('UNKNOWN_ACTION', `Unknown action: ${action}`, { status: 400 });
    }

    approval.provenanceStatus = 'verified';
    approval.runMode = runMode;
    approval.source = 'human_approval_ui' as ApprovalSource;
    approval.schemaVersion = 1;
    
    await fs.writeFile(approvalPath, JSON.stringify(approval, null, 2));
    await writeApiAuditLog(request, {
      level: 'info',
      source: 'human-approval',
      message: `Human approval action applied: ${action}`,
      fields: {
        stage: 7,
        campaignId: campaignSlug,
        actor: 'dashboard_user',
        action: `human_approval_${action}`,
      },
    });
    return ok({ approval });
    
  } catch (error) {
    await writeApiAuditLog(request, {
      level: 'error',
      source: 'human-approval',
      message: 'Human approval operation failed.',
      details: error instanceof Error ? error.message : 'Unknown error',
      fields: {
        stage: 7,
        campaignId: campaignSlug,
        actor: 'dashboard_user',
        action: 'human_approval_failed',
      },
    }).catch(() => undefined);
    return fail('HUMAN_APPROVAL_FAILED', 'Human approval operation failed.', { status: 500 }, error instanceof Error ? error.message : 'Unknown error');
  }
}
