/**
 * =============================================================================
 * AGENT LOGIC CONDITION ENGINE
 * =============================================================================
 * 
 * Evaluates logical conditions for each agent to determine:
 * - When to run
 * - When to stop
 * - When to ask another agent
 * - When to warn
 * - When to escalate
 * - When to continue
 * - When to handoff
 * 
 * =============================================================================
 */

import fs from 'fs/promises';
import path from 'path';
import { PITCH_JOBS_ROOT } from '@/lib/requestGuard';
import { getApprovalProgressionDecision, type ProvenanceStatus } from '@/lib/provenance';

const CAMPAIGNS_DIR = PITCH_JOBS_ROOT;

const SYSTEM_DIR = path.join(path.dirname(PITCH_JOBS_ROOT), 'system');

export interface LogicConditionResult {
  stageId: string;
  canRun: boolean;
  canContinue: boolean;
  blockedBy: string[];
  questionsToAsk: {
    issueType: string;
    targetAgent: string;
    questionTemplateId: string;
    condition: string;
  }[];
  warnings: string[];
  mustStop: boolean;
  mustEscalate: boolean;
  recommendedAction: string;
}

export interface AgentLogicResults {
  campaignSlug: string;
  updatedAt: string;
  results: LogicConditionResult[];
}

interface LogicConditions {
  canRunIf: string[];
  mustStopIf: string[];
  mustAskIf: string[];
  mustAskHumanIf: string[];
  mustWarnIf: string[];
  mustRerunIf: string[];
  mustEscalateIf: string[];
  canContinueIf: string[];
  handoffIf: string[];
  mustAskS4AIf?: string[];
  mustAskS9If?: string[];
  mustAskS6If?: string[];
  mustAskS5If?: string[];
  mustAskS2If?: string[];
  mustAskS3If?: string[];
  mustAskS7If?: string[];
  mustFailIf?: string[];
}

interface AgentLogicConfig {
  version: string;
  updatedAt: string;
  globalRules: {
    noAgentMayRunIf: string[];
    noWritingAgentMayUse: string[];
    humanApprovalRequiredBefore: string[];
  };
  stageLogic: {
    stageId: string;
    canRunIf: string[];
    mustStopIf: string[];
    mustAskIf: string[];
    mustAskHumanIf: string[];
    mustWarnIf: string[];
    mustRerunIf: string[];
    mustEscalateIf: string[];
    canContinueIf: string[];
    handoffIf: string[];
    mustAskS4AIf?: string[];
    mustAskS9If?: string[];
    mustAskS6If?: string[];
    mustAskS5If?: string[];
    mustAskS2If?: string[];
    mustAskS3If?: string[];
    mustAskS7If?: string[];
    mustFailIf?: string[];
  }[];
}

let cachedConfig: AgentLogicConfig | null = null;

async function loadConditions(): Promise<AgentLogicConfig> {
  if (cachedConfig) return cachedConfig;
  
  const configPath = path.join(SYSTEM_DIR, 'agent-logic-conditions.json');
  try {
    const data = await fs.readFile(configPath, 'utf-8');
    cachedConfig = JSON.parse(data);
    return cachedConfig!;
  } catch (error) {
    console.error('Failed to load agent logic conditions:', error);
    return { version: '1.0', updatedAt: '', globalRules: { noAgentMayRunIf: [], noWritingAgentMayUse: [], humanApprovalRequiredBefore: [] }, stageLogic: [] };
  }
}

export function getConditionsForStage(stageId: string): LogicConditions | null {
  const config = cachedConfig || { stageLogic: [] };
  const stage = config.stageLogic.find((s: { stageId: string }) => s.stageId === stageId);
  return stage || null;
}

interface HumanApprovalArtifact {
  status?: string;
  provenanceStatus?: string;
  selectedAngleId?: string;
  selectedAngleTitle?: string;
}

function hasNonBlankString(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function parseHumanApprovalArtifact(data: unknown): HumanApprovalArtifact | null {
  if (typeof data !== 'object' || data === null) return null;
  const d = data as Record<string, unknown>;
  const status = typeof d.status === 'string' ? d.status : undefined;
  const provenanceStatus = typeof d.provenanceStatus === 'string' ? d.provenanceStatus : undefined;
  const selectedAngleId = typeof d.selectedAngleId === 'string' ? d.selectedAngleId : undefined;
  const selectedAngleTitle = typeof d.selectedAngleTitle === 'string' ? d.selectedAngleTitle : undefined;
  return { status, provenanceStatus, selectedAngleId, selectedAngleTitle };
}

async function checkCondition(
  condition: string,
  campaignSlug: string
): Promise<{ result: boolean; warnings: string[] }> {
  const campaignPath = path.join(CAMPAIGNS_DIR, campaignSlug);
  
  const checks: Record<string, () => Promise<{ result: boolean; warnings: string[] }>> = {
    'human-approval.json status = approved': async () => {
      try {
        const raw = JSON.parse(await fs.readFile(path.join(campaignPath, 'human-approval.json'), 'utf-8'));
        const approval = parseHumanApprovalArtifact(raw);
        if (!approval) return { result: false, warnings: [] };

        const status: string | null = approval.status ?? null;
        const provenanceStatus = approval.provenanceStatus as ProvenanceStatus | undefined;
        const decision = getApprovalProgressionDecision({ status, provenanceStatus });

        if (!decision.allowed) return { result: false, warnings: [] };

        const warnings: string[] = [];
        if (decision.warning) warnings.push(`Provenance: ${decision.warning}`);

        const hasAngle =
          hasNonBlankString(approval.selectedAngleId) ||
          hasNonBlankString(approval.selectedAngleTitle);

        return { result: hasAngle, warnings };
      } catch { return { result: false, warnings: [] }; }
    },
    'claim-ledger.json exists': async () => {
      try {
        await fs.access(path.join(campaignPath, 'claim-ledger.json'));
        return { result: true, warnings: [] };
      } catch { return { result: false, warnings: [] }; }
    },
    'beat-fit-check.json beatFit != weak': async () => {
      try {
        const data = JSON.parse(await fs.readFile(path.join(campaignPath, 'beat-fit-check.json'), 'utf-8'));
        return { result: data.beatFit !== 'weak', warnings: [] };
      } catch { return { result: false, warnings: [] }; }
    },
    'beat-fit-check.json exists': async () => {
      try {
        await fs.access(path.join(campaignPath, 'beat-fit-check.json'));
        return { result: true, warnings: [] };
      } catch { return { result: false, warnings: [] }; }
    },
    'source-confidence.json exists': async () => {
      try {
        await fs.access(path.join(campaignPath, 'source-confidence.json'));
        return { result: true, warnings: [] };
      } catch { return { result: false, warnings: [] }; }
    },
    'verified-findings.json exists': async () => {
      try {
        await fs.access(path.join(campaignPath, 'verified-findings.json'));
        return { result: true, warnings: [] };
      } catch { return { result: false, warnings: [] }; }
    },
    '09-journalist-intelligence.json exists': async () => {
      try {
        await fs.access(path.join(campaignPath, '09-journalist-intelligence.json'));
        return { result: true, warnings: [] };
      } catch { return { result: false, warnings: [] }; }
    },
    '10-pitch-draft.md exists': async () => {
      try {
        await fs.access(path.join(campaignPath, '10-pitch-draft.md'));
        return { result: true, warnings: [] };
      } catch { return { result: false, warnings: [] }; }
    },
    '11-optimized-pitch.md exists': async () => {
      try {
        await fs.access(path.join(campaignPath, '11-optimized-pitch.md'));
        return { result: true, warnings: [] };
      } catch { return { result: false, warnings: [] }; }
    },
    '12-outreach-package.json exists': async () => {
      try {
        await fs.access(path.join(campaignPath, '12-outreach-package.json'));
        return { result: true, warnings: [] };
      } catch { return { result: false, warnings: [] }; }
    },
    'S7_PITCH_SELECTION_HUMAN_GATE not approved': async () => {
      try {
        const raw = JSON.parse(await fs.readFile(path.join(campaignPath, 'human-approval.json'), 'utf-8'));
        const approval = parseHumanApprovalArtifact(raw);
        return { result: !approval || approval.status !== 'approved', warnings: [] };
      } catch { return { result: true, warnings: [] }; }
    },
    'S7 not approved': async () => {
      try {
        const raw = JSON.parse(await fs.readFile(path.join(campaignPath, 'human-approval.json'), 'utf-8'));
        const approval = parseHumanApprovalArtifact(raw);
        return { result: !approval || approval.status !== 'approved', warnings: [] };
      } catch { return { result: true, warnings: [] }; }
    },
    'beatFit = weak': async () => {
      try {
        const data = JSON.parse(await fs.readFile(path.join(campaignPath, 'beat-fit-check.json'), 'utf-8'));
        return { result: data.beatFit === 'weak', warnings: [] };
      } catch { return { result: false, warnings: [] }; }
    },
    'claim ledger missing': async () => {
      try {
        await fs.access(path.join(campaignPath, 'claim-ledger.json'));
        return { result: false, warnings: [] };
      } catch { return { result: true, warnings: [] }; }
    },
    'source confidence = low': async () => {
      try {
        const data = JSON.parse(await fs.readFile(path.join(campaignPath, 'source-confidence.json'), 'utf-8'));
        return { result: data.sourceConfidence === 'low', warnings: [] };
      } catch { return { result: false, warnings: [] }; }
    }
  };

  const check = checks[condition];
  if (check) return check();
  return { result: true, warnings: [] };
}

async function evaluateConditions(
  campaignSlug: string,
  stageId: string,
  conditions: string[],
  type: string
): Promise<{ passed: string[]; failed: string[]; warnings: string[] }> {
  const passed: string[] = [];
  const failed: string[] = [];
  const warnings: string[] = [];

  for (const condition of conditions) {
    const { result, warnings: condWarnings } = await checkCondition(condition, campaignSlug);
    if (result) {
      passed.push(condition);
    } else {
      failed.push(condition);
    }
    warnings.push(...condWarnings);
  }

  return { passed, failed, warnings };
}

export async function evaluateCanRun(campaignSlug: string, stageId: string): Promise<LogicConditionResult> {
  const config = await loadConditions();
  const stage = config.stageLogic.find(s => s.stageId === stageId);
  
  if (!stage) {
    return {
      stageId,
      canRun: false,
      canContinue: false,
      blockedBy: ['No logic conditions defined for this stage'],
      questionsToAsk: [],
      warnings: [],
      mustStop: true,
      mustEscalate: false,
      recommendedAction: 'Contact system administrator'
    };
  }

  const failedConditions = await evaluateConditions(campaignSlug, stageId, stage.canRunIf, 'canRunIf');
  
  return {
    stageId,
    canRun: failedConditions.failed.length === 0,
    canContinue: false,
    blockedBy: failedConditions.failed,
    questionsToAsk: [],
    warnings: failedConditions.warnings,
    mustStop: failedConditions.failed.length > 0,
    mustEscalate: false,
    recommendedAction: failedConditions.failed.length > 0 
      ? `Cannot run: ${failedConditions.failed.join(', ')}`
      : 'Ready to run'
  };
}

export async function evaluateMustStop(campaignSlug: string, stageId: string): Promise<LogicConditionResult> {
  const config = await loadConditions();
  const stage = config.stageLogic.find(s => s.stageId === stageId);
  
  if (!stage) {
    return {
      stageId,
      canRun: false,
      canContinue: false,
      blockedBy: [],
      questionsToAsk: [],
      warnings: [],
      mustStop: false,
      mustEscalate: false,
      recommendedAction: ''
    };
  }

  const failedConditions = await evaluateConditions(campaignSlug, stageId, stage.mustStopIf, 'mustStopIf');
  
  return {
    stageId,
    canRun: failedConditions.failed.length === 0,
    canContinue: failedConditions.failed.length === 0,
    blockedBy: failedConditions.failed,
    questionsToAsk: [],
    warnings: failedConditions.warnings,
    mustStop: failedConditions.failed.length > 0,
    mustEscalate: false,
    recommendedAction: failedConditions.failed.length > 0 
      ? `Stopped: ${failedConditions.failed.join(', ')}`
      : 'No stop conditions triggered'
  };
}

export async function evaluateCanContinue(campaignSlug: string, stageId: string): Promise<LogicConditionResult> {
  const config = await loadConditions();
  const stage = config.stageLogic.find(s => s.stageId === stageId);
  
  if (!stage) {
    return {
      stageId,
      canRun: false,
      canContinue: false,
      blockedBy: [],
      questionsToAsk: [],
      warnings: [],
      mustStop: false,
      mustEscalate: false,
      recommendedAction: ''
    };
  }

  const failedConditions = await evaluateConditions(campaignSlug, stageId, stage.canContinueIf, 'canContinueIf');
  
  return {
    stageId,
    canRun: true,
    canContinue: failedConditions.failed.length === 0,
    blockedBy: failedConditions.failed,
    questionsToAsk: [],
    warnings: failedConditions.warnings,
    mustStop: false,
    mustEscalate: false,
    recommendedAction: failedConditions.failed.length > 0 
      ? `Cannot continue: ${failedConditions.failed.join(', ')}`
      : 'Ready to continue'
  };
}

export async function evaluateMustAsk(campaignSlug: string, stageId: string): Promise<LogicConditionResult> {
  const config = await loadConditions();
  const stage = config.stageLogic.find(s => s.stageId === stageId);
  
  if (!stage) {
    return {
      stageId,
      canRun: true,
      canContinue: true,
      blockedBy: [],
      questionsToAsk: [],
      warnings: [],
      mustStop: false,
      mustEscalate: false,
      recommendedAction: ''
    };
  }

  const questionsToAsk: LogicConditionResult['questionsToAsk'] = [];
  const mustAskWarnings: string[] = [];
  
  const askConditions = [
    stage.mustAskHumanIf || [],
    stage.mustAskS4AIf || [],
    stage.mustAskS9If || [],
    stage.mustAskS6If || [],
    stage.mustAskS5If || [],
    stage.mustAskS2If || [],
    stage.mustAskS3If || [],
    stage.mustAskS7If || []
  ].flat();

  for (const condition of askConditions) {
    const { result: isTriggered, warnings: condWarnings } = await checkCondition(condition, campaignSlug);
    mustAskWarnings.push(...condWarnings);
    if (isTriggered) {
      const questionTemplates: Record<string, { targetAgent: string; templateId: string }> = {
        'beat_match_unclear': { targetAgent: 'S6_BEAT_MATCHING', templateId: 'QT-S6-BEAT-001' },
        'beat_guidance_unclear': { targetAgent: 'S6_BEAT_MATCHING', templateId: 'QT-S6-BEAT-001' },
        'collection_scope_unclear': { targetAgent: 'S7_HUMAN_GATE', templateId: 'QT-S8-COLLECT-001' },
        'claim not in ledger': { targetAgent: 'S4A_DATA_RESEARCH_ANALYST', templateId: 'QT-S4A-CLAIM-002' },
        'claim safety unclear': { targetAgent: 'S4A_DATA_RESEARCH_ANALYST', templateId: 'QT-S4A-CLAIM-001' },
        'journalist personalization unclear': { targetAgent: 'S9_JOURNALIST_INTELLIGENCE', templateId: 'QT-S9-JOURNALIST-002' },
        'statistic unclear': { targetAgent: 'S2_DATA_EXTRACTION', templateId: 'QT-S2-DATA-003' },
        'source credibility unclear': { targetAgent: 'S3_RESEARCH_ENRICHMENT', templateId: 'QT-S3-SOURCE-001' },
        'sources conflict': { targetAgent: 'S3_RESEARCH_ENRICHMENT', templateId: 'QT-S3-SOURCE-002' },
        'angle frame unclear': { targetAgent: 'S5_ANGLE_GENERATION', templateId: 'QT-S5-ANGLE-001' }
      };

      for (const [key, value] of Object.entries(questionTemplates)) {
        if (condition.toLowerCase().includes(key)) {
          questionsToAsk.push({
            issueType: key,
            targetAgent: value.targetAgent,
            questionTemplateId: value.templateId,
            condition
          });
        }
      }
    }
  }

  return {
    stageId,
    canRun: true,
    canContinue: true,
    blockedBy: [],
    questionsToAsk,
    warnings: mustAskWarnings,
    mustStop: false,
    mustEscalate: false,
    recommendedAction: questionsToAsk.length > 0 
      ? `Ask ${questionsToAsk.length} question(s) before proceeding`
      : 'No questions to ask'
  };
}

export async function writeConditionResult(
  campaignSlug: string,
  stageId: string
): Promise<AgentLogicResults> {
  const campaignPath = path.join(CAMPAIGNS_DIR, campaignSlug);
  
  const canRunResult = await evaluateCanRun(campaignSlug, stageId);
  const mustStopResult = await evaluateMustStop(campaignSlug, stageId);
  const canContinueResult = await evaluateCanContinue(campaignSlug, stageId);
  const mustAskResult = await evaluateMustAsk(campaignSlug, stageId);

  const combinedWarnings = [
    ...canRunResult.warnings,
    ...mustStopResult.warnings,
    ...canContinueResult.warnings,
    ...mustAskResult.warnings,
  ].filter((w, i, a) => a.indexOf(w) === i);

  const result: AgentLogicResults = {
    campaignSlug,
    updatedAt: new Date().toISOString(),
    results: [{
      stageId,
      canRun: canRunResult.canRun,
      canContinue: canContinueResult.canContinue,
      blockedBy: [...canRunResult.blockedBy, ...mustStopResult.blockedBy],
      questionsToAsk: mustAskResult.questionsToAsk,
      warnings: combinedWarnings,
      mustStop: mustStopResult.mustStop,
      mustEscalate: false,
      recommendedAction: canRunResult.canRun 
        ? canContinueResult.canContinue 
          ? mustAskResult.recommendedAction 
          : canContinueResult.recommendedAction
        : canRunResult.recommendedAction
    }]
  };

  const outputPath = path.join(campaignPath, 'agent-logic-results.json');
  await fs.writeFile(outputPath, JSON.stringify(result, null, 2), 'utf-8');

  return result;
}

export async function runAllStageChecks(campaignSlug: string): Promise<AgentLogicResults> {
  const results: LogicConditionResult[] = [];
  const stages = ['S0', 'S1', 'S2', 'S3', 'S4A', 'S4B', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11', 'S12', 'S13'];
  
  for (const stageId of stages) {
    const result = await writeConditionResult(campaignSlug, stageId);
    results.push(result.results[0]);
  }

  return {
    campaignSlug,
    updatedAt: new Date().toISOString(),
    results
  };
}
