/**
 * =============================================================================
 * Human Approval API Route
 * =============================================================================
 */

import { NextRequest } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { fail, ok } from '@/lib/apiResponse';
import { writeApiAuditLog } from '@/lib/logger';
import { PITCH_JOBS_ROOT } from '@/lib/requestGuard';

const CAMPAIGNS_DIR = PITCH_JOBS_ROOT;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignSlug } = await params;
  
  try {
    const approvalPath = path.join(CAMPAIGNS_DIR, campaignSlug, 'human-approval.json');
    const content = await fs.readFile(approvalPath, 'utf-8');
    return ok(JSON.parse(content));
  } catch {
    return ok({ stageId: 'S7', status: 'none' });
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
    
    const campaignDir = path.join(CAMPAIGNS_DIR, campaignSlug);
    await fs.access(campaignDir);
    
    const approvalPath = path.join(campaignDir, 'human-approval.json');
    let approval = {
      stageId: 'S7_PITCH_SELECTION_HUMAN_GATE',
      status: 'waiting',
      selectedAngleId: null as string | null,
      selectedAngleTitle: null as string | null,
      approvedBy: 'human',
      approvedAt: null as string | null,
      notes: null as string | null
    };
    
    try {
      const existing = await fs.readFile(approvalPath, 'utf-8');
      approval = JSON.parse(existing);
    } catch {}

    const now = new Date().toISOString();
    
    if (action === 'approve') {
      approval.status = 'approved';
      approval.selectedAngleId = selectedAngleId || null;
      approval.selectedAngleTitle = selectedAngleTitle;
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
