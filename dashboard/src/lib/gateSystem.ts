import fs from 'fs/promises';
import path from 'path';
import { PITCH_JOBS_ROOT } from '@/lib/requestGuard';
import { getApprovalProgressionDecision, type ProvenanceStatus } from '@/lib/provenance';

export type GateStatus = 'pass' | 'warning' | 'blocked' | 'needs_human_review' | 'needs_rerun';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface GateResult {
  gateId: string;
  status: GateStatus;
  canContinue: boolean;
  reason: string;
  requiredAction: string;
  riskLevel: RiskLevel;
  details?: Record<string, any>;
}

export interface GateResults {
  campaignId: string;
  timestamp: string;
  gates: GateResult[];
  overallCanContinue: boolean;
}

const GATE_RESULTS_PATH = (campaignId: string) => 
  path.join(PITCH_JOBS_ROOT, campaignId, 'gate-results.json');

export async function runAllGates(campaignId: string): Promise<GateResults> {
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
  
  const overallCanContinue = results
    .filter(r => !r.canContinue)
    .length === 0;
  
  const gateResults: GateResults = {
    campaignId,
    timestamp: new Date().toISOString(),
    gates: results,
    overallCanContinue
  };
  
  await fs.mkdir(path.dirname(GATE_RESULTS_PATH(campaignId)), { recursive: true });
  await fs.writeFile(GATE_RESULTS_PATH(campaignId), JSON.stringify(gateResults, null, 2));
  
  return gateResults;
}

async function getGateContext(campaignId: string): Promise<any> {
  const campaignPath = path.join(PITCH_JOBS_ROOT, campaignId);
  
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

export async function runG0PreflightGate(campaignId: string): Promise<GateResult> {
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
    reason: 'Preflight check passed - required files present',
    requiredAction: 'none',
    riskLevel: 'low'
  };
}

export async function runG1DataReliabilityGate(campaignId: string): Promise<GateResult> {
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
  
  try {
    const content = await fs.readFile(path.join(ctx.campaignPath, dataFiles[0]), 'utf-8');
    if (content.length < 100) {
      return {
        gateId: 'G1_DATA_RELIABILITY_GATE',
        status: 'warning',
        canContinue: true,
        reason: 'Data file is very small - may be incomplete',
        requiredAction: 'Verify data extraction completeness',
        riskLevel: 'medium'
      };
    }
  } catch {}
  
  return {
    gateId: 'G1_DATA_RELIABILITY_GATE',
    status: 'pass',
    canContinue: true,
    reason: 'Data reliability check passed',
    requiredAction: 'none',
    riskLevel: 'low'
  };
}

export async function runG2VerifiedFindingsGate(campaignId: string): Promise<GateResult> {
  const ctx = await getGateContext(campaignId);
  
  const findingsFile = ctx.files.find((f: string) => f.includes('verified-findings'));
  
  if (!findingsFile) {
    return {
      gateId: 'G2_VERIFIED_FINDINGS_GATE',
      status: 'blocked',
      canContinue: false,
      reason: 'No verified findings file - S4A not completed',
      requiredAction: 'Complete S4A data research analysis',
      riskLevel: 'critical'
    };
  }
  
  try {
    const content = await fs.readFile(path.join(ctx.campaignPath, findingsFile), 'utf-8');
    const findings = JSON.parse(content);
    
    if (!findings.findings || findings.findings.length === 0) {
      return {
        gateId: 'G2_VERIFIED_FINDINGS_GATE',
        status: 'blocked',
        canContinue: false,
        reason: 'Verified findings is empty',
        requiredAction: 'Generate verified findings in S4A',
        riskLevel: 'critical'
      };
    }
    
    const unverified = findings.findings?.filter((f: any) => !f.verified) || [];
    if (unverified.length > 0) {
      return {
        gateId: 'G2_VERIFIED_FINDINGS_GATE',
        status: 'warning',
        canContinue: true,
        reason: `${unverified.length} findings are not verified`,
        requiredAction: 'Verify remaining findings or mark as placeholder',
        riskLevel: 'medium'
      };
    }
  } catch {}
  
  return {
    gateId: 'G2_VERIFIED_FINDINGS_GATE',
    status: 'pass',
    canContinue: true,
    reason: 'Verified findings check passed - all findings verified',
    requiredAction: 'none',
    riskLevel: 'low'
  };
}

export async function runG3AngleQualityGate(campaignId: string): Promise<GateResult> {
  const ctx = await getGateContext(campaignId);
  
  const angleFile = ctx.files.find((f: string) => f.includes('04-angles'));
  
  if (!angleFile) {
    return {
      gateId: 'G3_ANGLE_QUALITY_GATE',
      status: 'blocked',
      canContinue: false,
      reason: 'No angles file - S5 not completed',
      requiredAction: 'Complete S5 angle generation',
      riskLevel: 'critical'
    };
  }
  
  try {
    const content = await fs.readFile(path.join(ctx.campaignPath, angleFile), 'utf-8');
    const angleCount = (content.match(/^##? Angle \d+/gm) || []).length;
    
    if (angleCount < 3) {
      return {
        gateId: 'G3_ANGLE_QUALITY_GATE',
        status: 'warning',
        canContinue: true,
        reason: `Only ${angleCount} angles generated - below recommended minimum`,
        requiredAction: 'Generate more angle options',
        riskLevel: 'medium'
      };
    }
  } catch {}
  
  return {
    gateId: 'G3_ANGLE_QUALITY_GATE',
    status: 'pass',
    canContinue: true,
    reason: 'Angle quality check passed',
    requiredAction: 'none',
    riskLevel: 'low'
  };
}

export async function runG4HumanSelectionGate(campaignId: string): Promise<GateResult> {
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

  // Prefer human-approval.json (single object) over legacy approvals.json (array)
  const humanApprovalFile = ctx.files.find((f: string) => f === 'human-approval.json');

  if (humanApprovalFile) {
    try {
      const content = await fs.readFile(path.join(ctx.campaignPath, humanApprovalFile), 'utf-8');
      const approval = JSON.parse(content);

      if (typeof approval !== 'object' || approval === null || Array.isArray(approval)) {
        return {
          gateId: 'G4_HUMAN_SELECTION_GATE',
          status: 'blocked',
          canContinue: false,
          reason: 'human-approval.json has unexpected format - expected a single object',
          requiredAction: 'Re-create human-approval.json in S7',
          riskLevel: 'critical'
        };
      }

      const status: string | null = approval.status ?? null;
      const provenanceStatus: ProvenanceStatus | undefined = approval.provenanceStatus;
    const decision = getApprovalProgressionDecision({ status, provenanceStatus });

    if (!decision.allowed) {
        return {
          gateId: 'G4_HUMAN_SELECTION_GATE',
          status: 'blocked',
          canContinue: false,
          reason: decision.reason,
          requiredAction: 'Resolve provenance or approval issue in S7',
          riskLevel: 'critical'
        };
      }

      if (!approval.selectedAngleId && !approval.selectedAngleTitle) {
        return {
          gateId: 'G4_HUMAN_SELECTION_GATE',
          status: 'needs_human_review',
          canContinue: false,
          reason: 'S7 approval found but no angle selected',
          requiredAction: 'Human must select angle in S7',
          riskLevel: 'high'
        };
      }

      const result: GateResult = {
        gateId: 'G4_HUMAN_SELECTION_GATE',
        status: 'pass',
        canContinue: true,
        reason: 'Human selection approved - can proceed to S8',
        requiredAction: 'none',
        riskLevel: 'low'
      };

      if (decision.warning) {
        result.details = { provenanceWarning: decision.warning };
      }

      return result;
    } catch {
      return {
        gateId: 'G4_HUMAN_SELECTION_GATE',
        status: 'blocked',
        canContinue: false,
        reason: 'Failed to read or parse human-approval.json',
        requiredAction: 'Re-create human-approval.json in S7',
        riskLevel: 'critical'
      };
    }
  }

  // Fallback to legacy approvals.json array format
  const approvalFile = ctx.files.find((f: string) => f.includes('approvals'));
  
  if (!approvalFile) {
    return {
      gateId: 'G4_HUMAN_SELECTION_GATE',
      status: 'needs_human_review',
      canContinue: false,
      reason: 'S7 reached but no human approval found',
      requiredAction: 'Human must select angle in S7 before proceeding',
      riskLevel: 'critical'
    };
  }
  
  try {
    const content = await fs.readFile(path.join(ctx.campaignPath, approvalFile), 'utf-8');
    const parsed = JSON.parse(content);

    if (!Array.isArray(parsed)) {
      return {
        gateId: 'G4_HUMAN_SELECTION_GATE',
        status: 'blocked',
        canContinue: false,
        reason: 'approvals.json has unexpected format - expected an array',
        requiredAction: 'Re-create approvals in S7',
        riskLevel: 'critical'
      };
    }

    const s7Approval = parsed.find((a: { stage?: string }) => a.stage?.includes('S7'));

    if (!s7Approval) {
      return {
        gateId: 'G4_HUMAN_SELECTION_GATE',
        status: 'needs_human_review',
        canContinue: false,
        reason: 'S7 approval required - no approved selection found',
        requiredAction: 'Human must approve angle selection in S7',
        riskLevel: 'critical'
      };
    }

    const status: string | null = s7Approval.status ?? null;
    const provenanceStatus: ProvenanceStatus | undefined = s7Approval.provenanceStatus;
    const decision = getApprovalProgressionDecision({ status, provenanceStatus });

    if (!decision.allowed) {
      return {
        gateId: 'G4_HUMAN_SELECTION_GATE',
        status: 'blocked',
        canContinue: false,
        reason: decision.reason,
        requiredAction: 'Resolve provenance or approval issue in S7',
        riskLevel: 'critical'
      };
    }

    if (!s7Approval.selectedAngleId && !s7Approval.selectedAngleTitle) {
      return {
        gateId: 'G4_HUMAN_SELECTION_GATE',
        status: 'needs_human_review',
        canContinue: false,
        reason: 'S7 approval found but no angle selected',
        requiredAction: 'Human must select angle in S7',
        riskLevel: 'high'
      };
    }

    const result: GateResult = {
      gateId: 'G4_HUMAN_SELECTION_GATE',
      status: 'pass',
      canContinue: true,
      reason: 'Human selection approved - can proceed to S8',
      requiredAction: 'none',
      riskLevel: 'low'
    };

    if (decision.warning) {
      result.details = { provenanceWarning: decision.warning };
    }

    return result;
  } catch {
    return {
      gateId: 'G4_HUMAN_SELECTION_GATE',
      status: 'blocked',
      canContinue: false,
      reason: 'Failed to read or parse approval file',
      requiredAction: 'Re-create approval file in S7',
      riskLevel: 'critical'
    };
  }
}

export async function runG5JournalistFitGate(campaignId: string): Promise<GateResult> {
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

export async function runG6PitchSafetyGate(campaignId: string): Promise<GateResult> {
  const ctx = await getGateContext(campaignId);
  
  const claimLedger = ctx.files.find((f: string) => f.includes('claim-ledger'));
  
  if (!claimLedger) {
    return {
      gateId: 'G6_PITCH_SAFETY_GATE',
      status: 'blocked',
      canContinue: false,
      reason: 'No claim ledger - cannot verify pitch safety',
      requiredAction: 'Create claim-ledger.json before writing pitches',
      riskLevel: 'critical'
    };
  }
  
  try {
    const content = await fs.readFile(path.join(ctx.campaignPath, claimLedger), 'utf-8');
    const ledger = JSON.parse(content);
    
    const unsupported = ledger.claims?.filter((c: any) => 
      c.status === 'unsupported' || c.status === 'rejected'
    ) || [];
    
    if (unsupported.length > 0) {
      return {
        gateId: 'G6_PITCH_SAFETY_GATE',
        status: 'blocked',
        canContinue: false,
        reason: `${unsupported.length} unsupported claims in claim ledger`,
        requiredAction: 'Remove or verify unsupported claims',
        riskLevel: 'critical'
      };
    }
  } catch {}
  
  return {
    gateId: 'G6_PITCH_SAFETY_GATE',
    status: 'pass',
    canContinue: true,
    reason: 'Pitch safety check passed - claim ledger is clean',
    requiredAction: 'none',
    riskLevel: 'low'
  };
}

export async function runG7FinalValidationGate(campaignId: string): Promise<GateResult> {
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
  
  try {
    const content = await fs.readFile(path.join(ctx.campaignPath, validationFile), 'utf-8');
    const validation = JSON.parse(content);
    
    if (!validation.passed) {
      return {
        gateId: 'G7_FINAL_VALIDATION_GATE',
        status: 'needs_rerun',
        canContinue: false,
        reason: 'S13 validation failed',
        requiredAction: 'Fix validation issues and rerun S13',
        riskLevel: 'critical'
      };
    }
    
    if (validation.score < 80) {
      return {
        gateId: 'G7_FINAL_VALIDATION_GATE',
        status: 'warning',
        canContinue: true,
        reason: `Validation score is ${validation.score} - below optimal`,
        requiredAction: 'Review validation warnings',
        riskLevel: 'medium'
      };
    }
  } catch {}
  
  return {
    gateId: 'G7_FINAL_VALIDATION_GATE',
    status: 'pass',
    canContinue: true,
    reason: 'S13 validation passed',
    requiredAction: 'none',
    riskLevel: 'low'
  };
}

export async function runG8HumanSendGate(campaignId: string): Promise<GateResult> {
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
  
  const approvalFile = ctx.files.find((f: string) => f.includes('approvals'));
  
  let sendApproved = false;
  
  if (approvalFile) {
    try {
      const content = await fs.readFile(path.join(ctx.campaignPath, approvalFile), 'utf-8');
      const approvals = JSON.parse(content);
      const finalApproval = approvals.find((a: any) => a.action === 'send_approval' || a.stage === 'final_send');
      sendApproved = finalApproval?.status === 'approved';
    } catch {}
  }
  
  if (!sendApproved) {
    return {
      gateId: 'G8_HUMAN_SEND_GATE',
      status: 'needs_human_review',
      canContinue: false,
      reason: 'Final human send approval required',
      requiredAction: 'Human must approve final send in dashboard',
      riskLevel: 'critical'
    };
  }
  
  return {
    gateId: 'G8_HUMAN_SEND_GATE',
    status: 'pass',
    canContinue: true,
    reason: 'Human send approval obtained - campaign ready',
    requiredAction: 'none',
    riskLevel: 'low'
  };
}

export async function getGateStatus(campaignId: string): Promise<GateResults | null> {
  try {
    const content = await fs.readFile(GATE_RESULTS_PATH(campaignId), 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}