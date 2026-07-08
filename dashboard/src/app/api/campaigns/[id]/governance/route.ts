// GET /api/campaigns/[id]/governance - Get all governance status
// GET /api/campaigns/[id]/governance/contract - Get contract status
// GET /api/campaigns/[id]/governance/gates - Get gate results
// GET /api/campaigns/[id]/governance/claims - Get claim ledger
// GET /api/campaigns/[id]/governance/state - Get workflow state
// POST /api/campaigns/[id]/governance/validate - Run validation
// POST /api/campaigns/[id]/governance/run-gate - Run a specific gate

import { fail, ok } from '@/lib/apiResponse';
import {
  canStageRun,
  type ContractStatus
} from '@/lib/stageContractValidator';
import {
  runGate,
  canWorkflowContinue,
  getBlockedStages,
  getLatestGateStatus
} from '@/lib/gateEngine';
import {
  loadClaimLedger,
  getSafeClaims,
  getUnsafeClaims,
  getClaimsByStatus,
  validateClaimUsage,
  approveHumanReviewClaim
} from '@/lib/claimLedgerManager';
import {
  getWorkflowState,
  updateWorkflowState
} from '@/lib/workflowStateMachine';
import { writeApiAuditLog } from '@/lib/logger';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const campaignSlug = params.id;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  
  try {
    switch (action) {
      case 'contract': {
        const stageId = url.searchParams.get('stageId');
        if (!stageId) {
          return fail('STAGE_ID_REQUIRED', 'stageId required.', { status: 400 });
        }
        const status = await canStageRun(campaignSlug, stageId);
        return ok(status);
      }
      
      case 'gates': {
        const gateId = url.searchParams.get('gateId');
        if (gateId) {
          const result = await getLatestGateStatus(campaignSlug, gateId);
          return ok(result || { notRun: true });
        }
        const canContinue = await canWorkflowContinue(campaignSlug);
        const blocked = await getBlockedStages(campaignSlug);
        return ok({ canContinue, blockedStages: blocked });
      }
      
      case 'claims': {
        const ledger = await loadClaimLedger(campaignSlug);
        if (!ledger) {
          return ok({ exists: false, claims: [] });
        }
        
        const safe = await getSafeClaims(campaignSlug);
        const unsafe = await getUnsafeClaims(campaignSlug);
        const needsHuman = await getClaimsByStatus(campaignSlug, 'human_review_required');
        
        return ok({
          exists: true,
          totalClaims: ledger.claims.length,
          verified: safe.filter(c => c.status === 'verified').length,
          softLanguage: safe.filter(c => c.status === 'usable_with_soft_language').length,
          needsSource: await getClaimsByStatus(campaignSlug, 'needs_source'),
          unsupported: unsafe.filter(c => c.status === 'unsupported').length,
          rejected: unsafe.filter(c => c.status === 'rejected').length,
          humanReviewRequired: needsHuman.length
        });
      }
      
      case 'state': {
        const state = await getWorkflowState(campaignSlug);
        return ok(state);
      }
      
      default: {
        // Get all governance status
        const state = await getWorkflowState(campaignSlug);
        const gateStatus = await canWorkflowContinue(campaignSlug);
        const blockedStages = await getBlockedStages(campaignSlug);
        const ledger = await loadClaimLedger(campaignSlug);
        
        // Get contract status for all known stages
        const stages = ['S1', 'S2', 'S3', 'S4A', 'S4B', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11', 'S12', 'S13'];
        const contractStatuses: Record<string, ContractStatus> = {};
        
        for (const stage of stages) {
          try {
            const status = await canStageRun(campaignSlug, `${stage}_CAMPAIGN_INTAKE`.replace('S1_', 'S1_').replace('S2_', 'S2_').replace('S3_', 'S3_'));
            contractStatuses[stage] = status;
          } catch {
            // Skip stages without contracts
          }
        }
        
        return ok({
          workflowState: state,
          gates: gateStatus,
          blockedStages,
          claimLedgerExists: !!ledger,
          contractStatuses
        });
      }
    }
  } catch (error) {
    return fail('GOVERNANCE_CHECK_FAILED', 'Governance check failed.', { status: 500 }, error instanceof Error ? error.message : 'Unknown error');
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const campaignSlug = params.id;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  
  try {
    const body = await request.json();
    
    switch (action) {
      case 'run-gate': {
        const { gateId } = body;
        if (!gateId) {
          return fail('GATE_ID_REQUIRED', 'gateId required.', { status: 400 });
        }
        
        const result = await runGate(campaignSlug, gateId);
        await writeApiAuditLog(request, {
          level: 'info',
          source: 'governance',
          message: `Governance run-gate executed: ${gateId}`,
          fields: {
            stage: null,
            campaignId: campaignSlug,
            actor: 'dashboard_user',
            action: 'governance_run_gate',
          },
        });
        return ok(result);
      }
      
      case 'validate-claims': {
        const { filePath, stageId } = body;
        if (!filePath || !stageId) {
          return fail('FILEPATH_STAGEID_REQUIRED', 'filePath and stageId required.', { status: 400 });
        }
        
        const usage = await validateClaimUsage(campaignSlug, filePath, stageId);
        await writeApiAuditLog(request, {
          level: 'info',
          source: 'governance',
          message: `Governance claim validation executed for stage ${stageId}`,
          fields: {
            stage: stageId,
            campaignId: campaignSlug,
            actor: 'dashboard_user',
            action: 'governance_validate_claims',
          },
        });
        return ok({ usage });
      }
      
      case 'approve-claim': {
        const { claimId, approvedWording } = body;
        if (!claimId) {
          return fail('CLAIM_ID_REQUIRED', 'claimId required.', { status: 400 });
        }
        
        const success = await approveHumanReviewClaim(campaignSlug, claimId, approvedWording);
        await writeApiAuditLog(request, {
          level: 'info',
          source: 'governance',
          message: `Governance claim approval updated: ${claimId}`,
          fields: {
            stage: null,
            campaignId: campaignSlug,
            actor: 'dashboard_user',
            action: 'governance_approve_claim',
          },
        });
        return ok({ success });
      }
      
      case 'update-state': {
        const { newState, currentStage, lastCompletedStage } = body;
        if (!newState) {
          return fail('NEW_STATE_REQUIRED', 'newState required.', { status: 400 });
        }
        
        const state = await updateWorkflowState(campaignSlug, newState, currentStage, lastCompletedStage);
        await writeApiAuditLog(request, {
          level: 'info',
          source: 'governance',
          message: `Governance workflow state updated: ${newState}`,
          fields: {
            stage: currentStage ?? null,
            campaignId: campaignSlug,
            actor: 'dashboard_user',
            action: 'governance_update_state',
          },
        });
        return ok(state);
      }
      
      case 'check-can-run': {
        const { stageId } = body;
        if (!stageId) {
          return fail('STAGE_ID_REQUIRED', 'stageId required.', { status: 400 });
        }
        
        const status = await canStageRun(campaignSlug, stageId);
        await writeApiAuditLog(request, {
          level: 'info',
          source: 'governance',
          message: `Governance can-run check executed: ${stageId}`,
          fields: {
            stage: stageId,
            campaignId: campaignSlug,
            actor: 'dashboard_user',
            action: 'governance_check_can_run',
          },
        });
        return ok(status);
      }
      
      default:
        return fail('INVALID_ACTION', 'Invalid action.', { status: 400 });
    }
  } catch (error) {
    await writeApiAuditLog(request, {
      level: 'error',
      source: 'governance',
      message: 'Governance operation failed.',
      details: error instanceof Error ? error.message : 'Unknown error',
      fields: {
        stage: null,
        campaignId: campaignSlug,
        actor: 'dashboard_user',
        action: 'governance_operation_failed',
      },
    }).catch(() => undefined);
    return fail('GOVERNANCE_OPERATION_FAILED', 'Governance operation failed.', { status: 500 }, error instanceof Error ? error.message : 'Unknown error');
  }
}
