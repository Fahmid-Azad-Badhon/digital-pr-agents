/**
 * =============================================================================
 * GATE ENGINE MODULE
 * =============================================================================
 * 
 * Evaluates gates after stages to determine if workflow can continue.
 * 
 * =============================================================================
 */

import fs from 'fs/promises';
import path from 'path';
import { getApprovalProgressionDecision, type ProvenanceStatus } from '@/lib/provenance';

const CAMPAIGNS_DIR = 'D:\\Codex Folder\\digital-pr-agents\\pitch-jobs';
const SYSTEM_DIR = 'D:\\Codex Folder\\digital-pr-agents\\system';

export interface GateResult {
  gateId: string;
  gateName: string;
  stageAfter: string | null;
  status: 'pass' | 'warning' | 'blocked' | 'needs_human_review' | 'needs_rerun';
  canContinue: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  checkedAt: string;
  passedChecks: string[];
  warnings: string[];
  blockingIssues: {
    issueId: string;
    issue: string;
    affectedFile: string | null;
    affectedText: string | null;
    requiredAction: string;
  }[];
  requiredAction: string;
  blockedStages: string[];
}

export interface GateResultsFile {
  campaignSlug: string;
  updatedAt: string;
  gateResults: GateResult[];
}

async function loadGateRules() {
  const rulesPath = path.join(SYSTEM_DIR, 'gate-rules.json');
  try {
    const data = await fs.readFile(rulesPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load gate rules:', error);
    return { gates: [] };
  }
}

export async function getGate(gateId: string): Promise<any | null> {
  const rules = await loadGateRules();
  return rules.gates?.find((g: any) => g.gateId === gateId) || null;
}

export async function getGatesForStage(stageId: string): Promise<any[]> {
  const rules = await loadGateRules();
  return rules.gates?.filter((g: any) => g.runsAfterStage === stageId) || [];
}

export async function runGate(campaignSlug: string, gateId: string): Promise<GateResult> {
  const gate = await getGate(gateId);
  if (!gate) {
    throw new Error(`Gate not found: ${gateId}`);
  }
  
  const campaignPath = path.join(CAMPAIGNS_DIR, campaignSlug);
  const result: GateResult = {
    gateId: gate.gateId,
    gateName: gate.gateName,
    stageAfter: gate.runsAfterStage,
    status: 'pass',
    canContinue: true,
    riskLevel: 'low',
    checkedAt: new Date().toISOString(),
    passedChecks: [],
    warnings: [],
    blockingIssues: [],
    requiredAction: '',
    blockedStages: []
  };
  
  // Check required files
  for (const requiredFile of gate.requiredFiles || []) {
    const filePath = path.join(campaignPath, requiredFile);
    try {
      await fs.access(filePath);
      result.passedChecks.push(`${requiredFile} exists`);
    } catch {
      result.blockingIssues.push({
        issueId: `GI-${gate.gateId}-FILE`,
        issue: `Required file missing: ${requiredFile}`,
        affectedFile: requiredFile,
        affectedText: null,
        requiredAction: `Create or provide ${requiredFile}`
      });
    }
  }
  
  // Run specific gate checks based on gate ID
  switch (gateId) {
    case 'G6_PITCH_SAFETY_GATE':
      await runPitchSafetyGate(campaignPath, result);
      break;
    case 'G4_HUMAN_SELECTION_GATE':
      await runHumanSelectionGate(campaignPath, result);
      break;
    case 'G7_FINAL_VALIDATION_GATE':
      await runValidationGate(campaignPath, result);
      break;
  }
  
  // Determine final status
  if (result.blockingIssues.length > 0) {
    result.status = 'blocked';
    result.canContinue = false;
    result.riskLevel = 'high';
    result.blockedStages = gate.blocksStages || [];
    result.requiredAction = result.blockingIssues[0].requiredAction;
  } else if (result.warnings.length > 0) {
    result.status = gate.canContinueOnWarning ? 'warning' : result.status;
    result.canContinue = gate.canContinueOnWarning;
    result.requiredAction = 'Review warnings but can continue';
  }
  
  // Save gate result
  await writeGateResult(campaignSlug, result);
  
  return result;
}

async function runPitchSafetyGate(campaignPath: string, result: GateResult): Promise<void> {
  const claimLedgerPath = path.join(campaignPath, 'claim-ledger.json');
  const pitchPath = path.join(campaignPath, '11-optimized-pitch.md');
  
  // Check claim ledger exists
  try {
    await fs.access(claimLedgerPath);
    result.passedChecks.push('claim-ledger.json exists');
  } catch {
    result.blockingIssues.push({
      issueId: 'GI-G6-CLAIM-LEDGER-MISSING',
      issue: 'claim-ledger.json is missing',
      affectedFile: 'claim-ledger.json',
      affectedText: null,
      requiredAction: 'Create claim-ledger.json before running pitch stages'
    });
    return;
  }
  
  // Check pitch file exists
  try {
    await fs.access(pitchPath);
    result.passedChecks.push('11-optimized-pitch.md exists');
  } catch {
    result.blockingIssues.push({
      issueId: 'GI-G6-PITCH-MISSING',
      issue: 'Optimized pitch file is missing',
      affectedFile: '11-optimized-pitch.md',
      affectedText: null,
      requiredAction: 'Complete S11 to generate optimized pitch'
    });
    return;
  }
  
  // Read and validate pitch against claim ledger
  try {
    const ledger = JSON.parse(await fs.readFile(claimLedgerPath, 'utf-8'));
    const pitch = await fs.readFile(pitchPath, 'utf-8');
    
    const unsafeStatuses = ['unsupported', 'rejected', 'needs_source'];
    const claims = ledger.claims || [];
    
    // Check if pitch contains any unsafe claims
    for (const claim of claims) {
      if (unsafeStatuses.includes(claim.status) && claim.claim) {
        if (pitch.toLowerCase().includes(claim.claim.toLowerCase().substring(0, 30))) {
          result.blockingIssues.push({
            issueId: `GI-G6-UNSAFE-CLAIM`,
            issue: `Pitch contains unsupported claim: ${claim.claim.substring(0, 50)}...`,
            affectedFile: '11-optimized-pitch.md',
            affectedText: claim.claim,
            requiredAction: 'Replace with approved wording from claim-ledger.json'
          });
        }
      }
    }
    
    // Check for allowed wording if using soft-language claims
    const softLanguageClaims = claims.filter((c: any) => c.status === 'usable_with_soft_language' && c.allowedWording);
    for (const claim of softLanguageClaims) {
      if (pitch.includes(claim.claim) && !pitch.includes(claim.allowedWording)) {
        result.blockingIssues.push({
          issueId: `GI-G6-SOFT-LANGUAGE`,
          issue: `Soft-language claim not using approved wording`,
          affectedFile: '11-optimized-pitch.md',
          affectedText: claim.claim,
          requiredAction: `Use approved wording: "${claim.allowedWording}"`
        });
      }
    }
    
    if (result.blockingIssues.length === 0) {
      result.passedChecks.push('All pitch claims are safe');
      result.passedChecks.push('Soft-language claims use approved wording');
    }
  } catch (error) {
    result.warnings.push(`Could not fully validate pitch: ${error}`);
  }
}

async function runHumanSelectionGate(campaignPath: string, result: GateResult): Promise<void> {
  const approvalPath = path.join(campaignPath, 'human-approval.json');

  try {
    const approval = JSON.parse(await fs.readFile(approvalPath, 'utf-8'));

    const status: string | null = approval?.status ?? null;
    const provenanceStatus: ProvenanceStatus | undefined = approval?.provenanceStatus;
    const decision = getApprovalProgressionDecision({ status, provenanceStatus });

    if (!decision.allowed) {
      result.blockingIssues.push({
        issueId: 'GI-G4-PROVENANCE-BLOCKED',
        issue: decision.reason,
        affectedFile: 'human-approval.json',
        affectedText: null,
        requiredAction: 'Resolve provenance or approval issue in S7'
      });
      return;
    }

    result.passedChecks.push('Human approval status is approved');

    if (decision.warning) {
      result.passedChecks.push(`Provenance: ${decision.warning}`);
    }

    if (approval.selectedAngleId) {
      result.passedChecks.push('Selected angle ID exists');
    } else if (approval.selectedAngleTitle) {
      result.passedChecks.push('Selected angle title exists');
    } else {
      result.blockingIssues.push({
        issueId: 'GI-G4-NO-ANGLE',
        issue: 'No angle selected',
        affectedFile: 'human-approval.json',
        affectedText: null,
        requiredAction: 'Select an angle in S7'
      });
    }
  } catch {
    result.blockingIssues.push({
      issueId: 'GI-G4-MISSING',
      issue: 'human-approval.json is missing',
      affectedFile: 'human-approval.json',
      affectedText: null,
      requiredAction: 'Complete S7 to get human approval'
    });
  }
}

async function runValidationGate(campaignPath: string, result: GateResult): Promise<void> {
  const validationPath = path.join(campaignPath, '13-validation-report.json');
  
  try {
    const validation = JSON.parse(await fs.readFile(validationPath, 'utf-8'));
    
    if (validation.passed === true) {
      result.passedChecks.push('S13 validation passed');
    } else {
      const issues = validation.blockingIssues || [];
      result.status = 'blocked';
      result.canContinue = false;
      result.riskLevel = 'critical';
      
      for (const issue of issues) {
        result.blockingIssues.push({
          issueId: `GI-G7-${issue.issueId || 'BLOCKING'}`,
          issue: issue.issue || 'Validation failed',
          affectedFile: '13-validation-report.json',
          affectedText: null,
          requiredAction: issue.requiredAction || 'Fix validation issues'
        });
      }
    }
  } catch {
    result.blockingIssues.push({
      issueId: 'GI-G7-MISSING',
      issue: '13-validation-report.json is missing',
      affectedFile: '13-validation-report.json',
      affectedText: null,
      requiredAction: 'Run S13 validation'
    });
  }
}

async function writeGateResult(campaignSlug: string, result: GateResult): Promise<void> {
  const campaignPath = path.join(CAMPAIGNS_DIR, campaignSlug);
  const resultsPath = path.join(campaignPath, 'gate-results.json');
  
  let existing: GateResultsFile = { campaignSlug, updatedAt: '', gateResults: [] };
  
  try {
    const data = await fs.readFile(resultsPath, 'utf-8');
    existing = JSON.parse(data);
  } catch {
    // File doesn't exist
  }
  
  // Update or add this gate result
  const existingIndex = existing.gateResults.findIndex(g => g.gateId === result.gateId);
  if (existingIndex >= 0) {
    existing.gateResults[existingIndex] = result;
  } else {
    existing.gateResults.push(result);
  }
  
  existing.updatedAt = new Date().toISOString();
  
  await fs.writeFile(resultsPath, JSON.stringify(existing, null, 2), 'utf-8');
}

export async function canWorkflowContinue(campaignSlug: string): Promise<{ canContinue: boolean; blockingGates: string[] }> {
  const resultsPath = path.join(CAMPAIGNS_DIR, campaignSlug, 'gate-results.json');
  
  try {
    const data = JSON.parse(await fs.readFile(resultsPath, 'utf-8'));
    const blockingGates = data.gateResults
      ?.filter((g: GateResult) => g.status === 'blocked')
      ?.map((g: GateResult) => g.gateId) || [];
    
    return {
      canContinue: blockingGates.length === 0,
      blockingGates
    };
  } catch {
    return { canContinue: true, blockingGates: [] };
  }
}

export async function getBlockedStages(campaignSlug: string): Promise<string[]> {
  const resultsPath = path.join(CAMPAIGNS_DIR, campaignSlug, 'gate-results.json');
  
  try {
    const data = JSON.parse(await fs.readFile(resultsPath, 'utf-8'));
    const blockedStages = new Set<string>();
    
    for (const gate of data.gateResults || []) {
      if (gate.status === 'blocked') {
        for (const stage of gate.blockedStages || []) {
          blockedStages.add(stage);
        }
      }
    }
    
    return Array.from(blockedStages);
  } catch {
    return [];
  }
}

export async function getLatestGateStatus(campaignSlug: string, gateId: string): Promise<GateResult | null> {
  const resultsPath = path.join(CAMPAIGNS_DIR, campaignSlug, 'gate-results.json');
  
  try {
    const data = JSON.parse(await fs.readFile(resultsPath, 'utf-8'));
    return data.gateResults?.find((g: GateResult) => g.gateId === gateId) || null;
  } catch {
    return null;
  }
}