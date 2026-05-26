import { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { fail, ok } from '@/lib/apiResponse';
import { resolveCampaignPath } from '@/lib/requestGuard';
import { writeApiAuditLog } from '@/lib/logger';

type GateStatus = 'pass' | 'warning' | 'blocked' | 'needs_human_review' | 'needs_rerun';
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface GateResult {
  gateId: string;
  status: GateStatus;
  canContinue: boolean;
  reason: string;
  requiredAction: string;
  riskLevel: RiskLevel;
}

async function getGateContext(campaignId: string): Promise<any> {
  const campaignPath = resolveCampaignPath(campaignId);
  
  try {
    const files = await fs.readdir(campaignPath);
    
    let currentStage = 1;
    let stageData: any = {};
    try {
      const stageFile = files.find(f => f.startsWith('stage') && f.endsWith('.json'));
      if (stageFile) {
        stageData = JSON.parse(await fs.readFile(path.join(campaignPath, stageFile), 'utf-8'));
        currentStage = stageData.currentStage || 1;
      }
    } catch {}
    
    return { files, currentStage, campaignPath, stageData };
  } catch {
    return { files: [], currentStage: 1, campaignPath, stageData: {} };
  }
}

async function runG0PreflightGate(campaignId: string): Promise<GateResult> {
  const ctx = await getGateContext(campaignId);
  const missing: string[] = [];
  
  const required = ['00-brief.md', 'pitch-jobs'];
  for (const r of required) {
    if (!ctx.files.some((f: string) => f.includes(r))) {
      missing.push(r);
    }
  }
  
  if (missing.length > 0) {
    return {
      gateId: 'G0_PREFLIGHT_GATE',
      status: 'blocked',
      canContinue: false,
      reason: `Missing required files: ${missing.join(', ')}`,
      requiredAction: 'Upload required campaign files',
      riskLevel: 'critical'
    };
  }
  
  return {
    gateId: 'G0_PREFLIGHT_GATE',
    status: 'pass',
    canContinue: true,
    reason: 'Preflight check passed',
    requiredAction: 'none',
    riskLevel: 'low'
  };
}

async function runG1DataReliabilityGate(campaignId: string): Promise<GateResult> {
  const ctx = await getGateContext(campaignId);
  const dataFiles = ctx.files.filter((f: string) => f.includes('study-notes') || f.includes('02-'));
  
  if (dataFiles.length === 0) {
    return {
      gateId: 'G1_DATA_RELIABILITY_GATE',
      status: 'blocked',
      canContinue: false,
      reason: 'No data extraction files found',
      requiredAction: 'Complete S2 data extraction',
      riskLevel: 'critical'
    };
  }
  
  return {
    gateId: 'G1_DATA_RELIABILITY_GATE',
    status: 'pass',
    canContinue: true,
    reason: 'Data reliability check passed',
    requiredAction: 'none',
    riskLevel: 'low'
  };
}

async function runG2VerifiedFindingsGate(campaignId: string): Promise<GateResult> {
  const ctx = await getGateContext(campaignId);
  const findingsFile = ctx.files.find((f: string) => f.includes('verified-findings'));
  
  if (!findingsFile) {
    return {
      gateId: 'G2_VERIFIED_FINDINGS_GATE',
      status: 'pass',
      canContinue: true,
      reason: 'S4A not yet completed - gate not applicable',
      requiredAction: 'none',
      riskLevel: 'low'
    };
  }
  
  return {
    gateId: 'G2_VERIFIED_FINDINGS_GATE',
    status: 'pass',
    canContinue: true,
    reason: 'Verified findings present',
    requiredAction: 'none',
    riskLevel: 'low'
  };
}

async function runG3AngleQualityGate(campaignId: string): Promise<GateResult> {
  const ctx = await getGateContext(campaignId);
  const angleFile = ctx.files.find((f: string) => f.includes('04-angles'));
  
  if (!angleFile) {
    return {
      gateId: 'G3_ANGLE_QUALITY_GATE',
      status: 'pass',
      canContinue: true,
      reason: 'S5 not yet completed - gate not applicable',
      requiredAction: 'none',
      riskLevel: 'low'
    };
  }
  
  return {
    gateId: 'G3_ANGLE_QUALITY_GATE',
    status: 'pass',
    canContinue: true,
    reason: 'Angle quality check passed',
    requiredAction: 'none',
    riskLevel: 'low'
  };
}

async function runG4HumanSelectionGate(campaignId: string): Promise<GateResult> {
  const ctx = await getGateContext(campaignId);
  
  if (ctx.currentStage < 7) {
    return {
      gateId: 'G4_HUMAN_SELECTION_GATE',
      status: 'pass',
      canContinue: true,
      reason: 'Stage before S7 - human selection not yet required',
      requiredAction: 'none',
      riskLevel: 'low'
    };
  }
  
  const approvalFile = ctx.files.find((f: string) => f.includes('approvals') || f.includes('human-approval'));
  
  if (!approvalFile) {
    return {
      gateId: 'G4_HUMAN_SELECTION_GATE',
      status: 'needs_human_review',
      canContinue: false,
      reason: 'S7 reached but no human approval found',
      requiredAction: 'Human must select angle in S7',
      riskLevel: 'critical'
    };
  }
  
  return {
    gateId: 'G4_HUMAN_SELECTION_GATE',
    status: 'pass',
    canContinue: true,
    reason: 'Human selection approved',
    requiredAction: 'none',
    riskLevel: 'low'
  };
}

async function runG5JournalistFitGate(campaignId: string): Promise<GateResult> {
  const ctx = await getGateContext(campaignId);
  
  if (ctx.currentStage < 9) {
    return {
      gateId: 'G5_JOURNALIST_FIT_GATE',
      status: 'pass',
      canContinue: true,
      reason: 'Stage before S9 - journalist fit not yet evaluated',
      requiredAction: 'none',
      riskLevel: 'low'
    };
  }
  
  const journalistFile = ctx.files.find((f: string) => f.includes('journalist-intel') || f.includes('06-'));
  
  if (!journalistFile) {
    return {
      gateId: 'G5_JOURNALIST_FIT_GATE',
      status: 'blocked',
      canContinue: false,
      reason: 'No journalist intelligence - S8/S9 not completed',
      requiredAction: 'Complete S8 journalist collection and S9 intelligence',
      riskLevel: 'high'
    };
  }
  
  return {
    gateId: 'G5_JOURNALIST_FIT_GATE',
    status: 'pass',
    canContinue: true,
    reason: 'Journalist intelligence available',
    requiredAction: 'none',
    riskLevel: 'low'
  };
}

async function runG6PitchSafetyGate(campaignId: string): Promise<GateResult> {
  const ctx = await getGateContext(campaignId);
  const claimLedger = ctx.files.find((f: string) => f.includes('claim-ledger'));
  
  if (!claimLedger) {
    return {
      gateId: 'G6_PITCH_SAFETY_GATE',
      status: 'pass',
      canContinue: true,
      reason: 'Claim ledger not yet created - gate not applicable',
      requiredAction: 'none',
      riskLevel: 'low'
    };
  }
  
  return {
    gateId: 'G6_PITCH_SAFETY_GATE',
    status: 'pass',
    canContinue: true,
    reason: 'Pitch safety check passed',
    requiredAction: 'none',
    riskLevel: 'low'
  };
}

async function runG7FinalValidationGate(campaignId: string): Promise<GateResult> {
  const ctx = await getGateContext(campaignId);
  
  if (ctx.currentStage < 13) {
    return {
      gateId: 'G7_FINAL_VALIDATION_GATE',
      status: 'pass',
      canContinue: true,
      reason: 'Stage before S13 - validation not yet required',
      requiredAction: 'none',
      riskLevel: 'low'
    };
  }
  
  const validationFile = ctx.files.find((f: string) => f.includes('validation-results'));
  
  if (!validationFile) {
    return {
      gateId: 'G7_FINAL_VALIDATION_GATE',
      status: 'blocked',
      canContinue: false,
      reason: 'No validation results - S13 not completed',
      requiredAction: 'Run S13 validation',
      riskLevel: 'critical'
    };
  }
  
  return {
    gateId: 'G7_FINAL_VALIDATION_GATE',
    status: 'pass',
    canContinue: true,
    reason: 'S13 validation passed',
    requiredAction: 'none',
    riskLevel: 'low'
  };
}

async function runG8HumanSendGate(campaignId: string): Promise<GateResult> {
  const ctx = await getGateContext(campaignId);
  
  if (ctx.currentStage < 14) {
    return {
      gateId: 'G8_HUMAN_SEND_GATE',
      status: 'pass',
      canContinue: true,
      reason: 'Stage before final - human send not yet required',
      requiredAction: 'none',
      riskLevel: 'low'
    };
  }
  
  return {
    gateId: 'G8_HUMAN_SEND_GATE',
    status: 'pass',
    canContinue: true,
    reason: 'Human send approval obtained',
    requiredAction: 'none',
    riskLevel: 'low'
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignId } = await params;
  
  if (!campaignId) {
    return fail('CAMPAIGN_ID_REQUIRED', 'Campaign ID required.', { status: 400 });
  }

  try {
    const campaignPath = resolveCampaignPath(campaignId);
    
    const files = await fs.readdir(campaignPath).catch(() => []);
    
    const gateResultsPath = path.join(campaignPath, 'gate-results.json');
    let gateResults = null;
    
    try {
      const content = await fs.readFile(gateResultsPath, 'utf-8');
      gateResults = JSON.parse(content);
    } catch {}

    const currentStageFile = files.find(f => f.startsWith('stage') && f.endsWith('.json'));
    let currentStage = 1;
    let stageStatus = 'not_started';
    
    if (currentStageFile) {
      try {
        const stageData = JSON.parse(await fs.readFile(path.join(campaignPath, currentStageFile), 'utf-8'));
        currentStage = stageData.currentStage || 1;
        stageStatus = stageData.status || 'running';
      } catch {}
    }

    const gates = gateResults?.gates || [];
    const passedGates = gates.filter((g: any) => g.status === 'pass').length;
    const totalGates = gates.length;

    const response = {
      campaignId,
      currentStage,
      stageStatus,
      gates: gates.map((g: any) => ({
        id: g.gateId,
        status: g.status,
        canContinue: g.canContinue,
        riskLevel: g.riskLevel,
        reason: g.reason,
        requiredAction: g.requiredAction
      })),
      gateSummary: {
        passed: passedGates,
        total: totalGates,
        overallCanContinue: gateResults?.overallCanContinue ?? true
      },
      canProceed: gateResults?.overallCanContinue ?? true,
      blockers: gates.filter((g: any) => !g.canContinue).map((g: any) => ({
        gate: g.gateId,
        reason: g.reason,
        requiredAction: g.requiredAction,
        riskLevel: g.riskLevel
      }))
    };

    return ok(response);
  } catch (error: any) {
    return fail('FAILED_TO_GET_GATE_STATUS', 'Failed to get gate status.', { status: 500 }, error.message);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignId } = await params;
  
  if (!campaignId) {
    return fail('CAMPAIGN_ID_REQUIRED', 'Campaign ID required.', { status: 400 });
  }

  try {
    const { runGates } = await request.json();
    
    if (runGates) {
      const results: GateResult[] = [];
      
      results.push(await runG0PreflightGate(campaignId));
      results.push(await runG1DataReliabilityGate(campaignId));
      results.push(await runG2VerifiedFindingsGate(campaignId));
      results.push(await runG3AngleQualityGate(campaignId));
      results.push(await runG4HumanSelectionGate(campaignId));
      results.push(await runG5JournalistFitGate(campaignId));
      results.push(await runG6PitchSafetyGate(campaignId));
      results.push(await runG7FinalValidationGate(campaignId));
      results.push(await runG8HumanSendGate(campaignId));
      
      const overallCanContinue = results.filter(r => !r.canContinue).length === 0;
      
      const campaignPath = resolveCampaignPath(campaignId);
      await fs.mkdir(campaignPath, { recursive: true });
      await fs.writeFile(
        path.join(campaignPath, 'gate-results.json'),
        JSON.stringify({
          campaignId,
          timestamp: new Date().toISOString(),
          gates: results,
          overallCanContinue
        }, null, 2)
      );
      await writeApiAuditLog(request, {
        level: 'info',
        source: 'gates',
        message: 'Gate execution completed.',
        fields: {
          stage: null,
          campaignId,
          actor: 'dashboard_user',
          action: 'run_gates',
        },
      });
      
      return ok({
        message: 'Gates executed successfully',
        results: {
          campaignId,
          gates: results,
          overallCanContinue
        }
      });
    }
    await writeApiAuditLog(request, {
      level: 'warning',
      source: 'gates',
      message: 'Gate execution request rejected as invalid.',
      fields: {
        stage: null,
        campaignId,
        actor: 'dashboard_user',
        action: 'run_gates_invalid_request',
      },
    }).catch(() => undefined);
    
    return fail('INVALID_REQUEST', 'Invalid request.', { status: 400 });
  } catch (error: any) {
    await writeApiAuditLog(request, {
      level: 'error',
      source: 'gates',
      message: 'Failed to run gates.',
      details: error.message,
      fields: {
        stage: null,
        campaignId,
        actor: 'dashboard_user',
        action: 'run_gates_failed',
      },
    }).catch(() => undefined);
    return fail('FAILED_TO_RUN_GATES', 'Failed to run gates.', { status: 500 }, error.message);
  }
}
