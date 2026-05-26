import crypto from 'crypto';

export interface AgentRunMetadata {
  runId: string;
  campaignSlug: string;
  stageId: string;
  modelUsed: string;
  promptVersion: string;
  brainVersion: string;
  timestamp: string;
  status: 'running' | 'completed' | 'failed' | 'rerun';
  rerunOf?: string;
  rerunReason?: string;
  rerunBy?: 'human' | 'system';
}

export interface StageExecutionContext {
  runId: string;
  campaignSlug: string;
  stageId: string;
  previousStageOutputs: string[];
  requiredInputs: string[];
  confidence: 'high' | 'medium' | 'low' | 'blocked';
}

export function generateRunId(campaignSlug: string, stageId: string): string {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const shortSlug = campaignSlug.substring(0, 15);
  const random = crypto.randomBytes(2).toString('hex');
  return `${shortSlug}-${stageId}-${date}-${random}`;
}

export async function createRunMetadata(
  campaignSlug: string,
  stageId: string,
  modelUsed: string,
  promptVersion: string,
  brainVersion: string,
  rerunOf?: string,
  rerunReason?: string,
  rerunBy?: 'human' | 'system'
): Promise<AgentRunMetadata> {
  return {
    runId: generateRunId(campaignSlug, stageId),
    campaignSlug,
    stageId,
    modelUsed,
    promptVersion: promptVersion || '1.0',
    brainVersion: brainVersion || '1.0',
    timestamp: new Date().toISOString(),
    status: 'running',
    rerunOf,
    rerunReason,
    rerunBy
  };
}

export function completeRun(metadata: AgentRunMetadata, success: boolean): AgentRunMetadata {
  return {
    ...metadata,
    status: success ? 'completed' : 'failed'
  };
}

export function createRerunMetadata(
  originalRun: AgentRunMetadata,
  reason: string,
  rerunBy: 'human' | 'system'
): AgentRunMetadata {
  return {
    ...originalRun,
    runId: generateRunId(originalRun.campaignSlug, originalRun.stageId),
    timestamp: new Date().toISOString(),
    status: 'running',
    rerunOf: originalRun.runId,
    rerunReason: reason,
    rerunBy
  };
}

export interface SourceProvenance {
  claim: string;
  trace: ProvenanceNode[];
}

export interface ProvenanceNode {
  stage: string;
  file: string;
  data: string;
  confidence: 'high' | 'medium' | 'low';
  source?: string;
}

export function buildProvenance(
  finalOutput: string,
  sourceFile: string,
  verifiedFindingsFile?: string
): SourceProvenance[] {
  const provenance: SourceProvenance[] = [];
  
  const statsMatch = finalOutput.match(/\d+(?:\.\d+)?%|\d+ (?:million|billion|thousand|deaths|crashes)/gi);
  
  if (statsMatch) {
    for (const stat of statsMatch) {
      provenance.push({
        claim: stat,
        trace: [
          {
            stage: 'S13_VALIDATION',
            file: 'final-pitch',
            data: stat,
            confidence: 'high'
          },
          {
            stage: 'S10_PITCH_DRAFTING',
            file: '10-pitch-draft.md',
            data: stat,
            confidence: 'high'
          },
          {
            stage: 'S4A_DATA_RESEARCH_ANALYST',
            file: verifiedFindingsFile || 'verified-findings.json',
            data: stat,
            confidence: 'high',
            source: 'NHTSA FARS'
          },
          {
            stage: 'S2_DATA_EXTRACTION',
            file: sourceFile,
            data: stat,
            confidence: 'high'
          }
        ]
      });
    }
  }
  
  return provenance;
}

export interface ConfidenceDecay {
  stage: string;
  inputConfidence: 'high' | 'medium' | 'low';
  outputConfidence: 'high' | 'medium' | 'low';
  decay: number;
}

export function calculateConfidenceDecay(stageId: string, inputConfidence: 'high' | 'medium' | 'low'): ConfidenceDecay {
  const decayRules: Record<string, { output: 'high' | 'medium' | 'low'; decayValue: number }> = {
    'S2_DATA_EXTRACTION': { output: 'high', decayValue: 0 },
    'S3_RESEARCH_ENRICHMENT': { output: 'high', decayValue: 0.05 },
    'S4A_DATA_RESEARCH_ANALYST': { output: 'high', decayValue: 0.1 },
    'S4B_INSIGHT_ANALYST': { output: 'medium', decayValue: 0.2 },
    'S5_ANGLE_GENERATION': { output: 'medium', decayValue: 0.25 },
    'S10_PITCH_DRAFTING': { output: 'medium', decayValue: 0.3 },
    'S11_PITCH_OPTIMIZATION': { output: 'medium', decayValue: 0.35 },
    'S13_VALIDATION': { output: 'high', decayValue: 0 }
  };
  
  const rule = decayRules[stageId] || { output: 'low', decayValue: 0.5 };
  
  return {
    stage: stageId,
    inputConfidence: inputConfidence,
    outputConfidence: rule.output,
    decay: rule.decayValue
  };
}

export interface RiskTag {
  risk: string;
  category: 'causation-risk' | 'legal-risk' | 'health-risk' | 'safety-risk' | 'political-risk' | 'client-promotion-risk' | 'localization-risk' | 'source-weakness-risk';
  recommendedWording?: string;
}

export function getRiskTagsForClaim(claim: string): RiskTag[] {
  const risks: RiskTag[] = [];
  
  const riskPatterns = [
    { pattern: /causes?|causing|caused by/gi, risk: 'causation-risk', category: 'causation-risk' as const, wording: 'may be related to' },
    { pattern: /crisis|epidemic|outbreak/gi, risk: 'health-risk', category: 'health-risk' as const, wording: 'significant issue' },
    { pattern: /deadly|fatal|life-threatening/gi, risk: 'safety-risk', category: 'safety-risk' as const, wording: 'concern' },
    { pattern: /prove[sd]?|definitively/gi, risk: 'legal-risk', category: 'legal-risk' as const, wording: 'suggests' },
    { pattern: /worst|best|most dangerous/gi, risk: 'political-risk', category: 'political-risk' as const, wording: 'notable' },
    { pattern: /our (?:client|company|brand)/gi, risk: 'client-promotion', category: 'client-promotion-risk' as const, wording: 'the data shows' }
  ];
  
  for (const { pattern, risk, category, wording } of riskPatterns) {
    if (pattern.test(claim)) {
      risks.push({ risk, category, recommendedWording: wording });
    }
  }
  
  return risks;
}

export function getWarningLevel(
  stageId: string,
  confidence: 'high' | 'medium' | 'low' | 'blocked',
  issues: string[]
): 'green' | 'yellow' | 'orange' | 'red' {
  if (confidence === 'blocked' || issues.some(i => i.includes('critical'))) {
    return 'red';
  }
  
  if (confidence === 'low' || issues.some(i => i.includes('warning'))) {
    return 'orange';
  }
  
  if (confidence === 'medium' || issues.length > 0) {
    return 'yellow';
  }
  
  return 'green';
}