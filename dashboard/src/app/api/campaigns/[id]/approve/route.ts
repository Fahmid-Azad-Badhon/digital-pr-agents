// POST /api/campaigns/[id]/approve - Approve/reject stage outputs
import { fail, ok } from '@/lib/apiResponse';
import { resolveCampaignPath } from '@/lib/requestGuard';
import fs from 'fs/promises';
import path from 'path';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const campaignId = params.id;
  const { action, stage, notes, approvedItems, rejectedItems } = await request.json();
  
  const campaignPath = resolveCampaignPath(campaignId);
  
  try {
    await fs.mkdir(campaignPath, { recursive: true });
    
    const approvalRecord = {
      timestamp: new Date().toISOString(),
      action,
      stage,
      notes: notes || '',
      approvedItems: approvedItems || [],
      rejectedItems: rejectedItems || [],
      status: action === 'approve' ? 'approved' : 'rejected'
    };
    
    const approvalFile = path.join(campaignPath, 'approvals.json');
    let existingApprovals: any[] = [];
    
    try {
      const content = await fs.readFile(approvalFile, 'utf-8');
      existingApprovals = JSON.parse(content);
    } catch {
      existingApprovals = [];
    }
    
    existingApprovals.push(approvalRecord);
    await fs.writeFile(approvalFile, JSON.stringify(existingApprovals, null, 2));
    
    if (stage === 'S7_PITCH_SELECTION_HUMAN_GATE' && action === 'approve') {
      const selectedAngleFile = path.join(campaignPath, '07-selected-angle.md');
      if (approvedItems.length > 0) {
        await fs.writeFile(selectedAngleFile, `# Selected Angle\n\n${approvedItems.join('\n\n')}\n\n---\nApproved at: ${approvalRecord.timestamp}\n`, 'utf-8');
      }
    }
    
    if (stage === 'S13_VALIDATION' && action === 'approve') {
      const validationResultFile = path.join(campaignPath, 'validation-results.json');
      await fs.writeFile(validationResultFile, JSON.stringify({
        passed: true,
        approvedAt: approvalRecord.timestamp,
        notes: notes,
        approvedItems,
        rejectedItems
      }, null, 2));
    }
    
    return ok({
      message: `Stage ${stage} ${action === 'approve' ? 'approved' : 'rejected'}`,
      approvalRecord
    });
    
  } catch (error) {
    return fail('FAILED_TO_RECORD_APPROVAL', 'Failed to record approval.', { status: 500 }, String(error));
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const campaignId = params.id;
  const campaignPath = resolveCampaignPath(campaignId);
  
  try {
    const approvalFile = path.join(campaignPath, 'approvals.json');
    const content = await fs.readFile(approvalFile, 'utf-8');
    const approvals = JSON.parse(content);
    
    return ok({ approvals });
  } catch {
    return ok({ approvals: [] });
  }
}
