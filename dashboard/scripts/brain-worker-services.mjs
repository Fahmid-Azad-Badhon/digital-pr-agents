import fs from 'fs/promises';
import path from 'path';

const STAGE_SERVICES = {
  G0_GLOBAL_WORKFLOW: { type: 'context_worker', service: 'GlobalWorkflowContextWorker', brainFile: '00_Global_Workflow_Brain.md' },
  G1_VALIDATION_TRUTH: { type: 'context_worker', service: 'ValidationTruthContextWorker', brainFile: '02_Validation_And_Truth_Brain.md' },
  G2_JOURNALIST_PSYCHOLOGY: { type: 'context_worker', service: 'JournalistPsychologyContextWorker', brainFile: '03_Journalist_Psychology_And_Emotional_Intelligence_Brain.md' },
  S0_CAMPAIGN_CLARIFICATION: { type: 'stage', stage: 1, service: 'CampaignClarificationService' },
  S1_CAMPAIGN_INTAKE: { type: 'stage', stage: 1, service: 'CampaignIntakeService' },
  S2_DATA_EXTRACTION: { type: 'stage', stage: 2, service: 'DataExtractionService' },
  S3_RESEARCH_ENRICHMENT: { type: 'stage', stage: 3, service: 'ResearchEnrichmentService' },
  S4A_DATA_RESEARCH_ANALYST: { type: 'stage', stage: 4, service: 'DataResearchAnalystService' },
  S4B_INSIGHT_ANALYST: { type: 'stage', stage: 4, service: 'InsightAnalystService' },
  S5_ANGLE_GENERATION: { type: 'stage', stage: 5, service: 'AngleGenerationService' },
  S6_BEAT_MATCHING: { type: 'stage', stage: 6, service: 'BeatMatchingService' },
  S7_HUMAN_GATE: { type: 'human_gate', service: 'HumanGateService' },
  S8_JOURNALIST_COLLECTION: { type: 'stage', stage: 8, service: 'JournalistCollectionService' },
  S9_JOURNALIST_INTELLIGENCE: { type: 'stage', stage: 9, service: 'JournalistIntelligenceService' },
  S10_PITCH_DRAFTING: { type: 'stage', stage: 10, service: 'PitchDraftingService' },
  S11_PITCH_OPTIMIZATION: { type: 'stage', stage: 11, service: 'PitchOptimizationService' },
  S12_PACKAGE_ASSEMBLY: { type: 'stage', stage: 12, service: 'PackageAssemblyService' },
  S13_VALIDATION: { type: 'stage', stage: 13, service: 'ValidationService' },
  S14_FINAL_FORMATTING: { type: 'stage', stage: 14, service: 'FinalFormattingService' },
  S15_OUTREACH_ASSET_CREATION: { type: 'stage', stage: 15, service: 'OutreachAssetCreationService' },
  S16_CAMPAIGN_LOG_LEARNING_LOOP: { type: 'stage', stage: 16, service: 'CampaignLearningLoopService' },
};

function authHeaders(token) {
  if (!token) return { 'content-type': 'application/json' };
  return {
    'content-type': 'application/json',
    'x-dashboard-token': token,
    authorization: `Bearer ${token}`,
  };
}

async function executeStage({ baseUrl, campaignId, stage, token }) {
  const response = await fetch(`${baseUrl}/api/campaigns/${encodeURIComponent(campaignId)}/execute-stage`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ stage }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    const message = payload?.message || payload?.error || `Stage execution failed (${response.status})`;
    throw new Error(message);
  }
  return payload;
}

async function executeHumanGate({ baseUrl, campaignId, token }) {
  const response = await fetch(`${baseUrl}/api/campaigns/${encodeURIComponent(campaignId)}/human-approval`, {
    method: 'GET',
    headers: authHeaders(token),
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    const message = payload?.message || payload?.error || `Human gate execution failed (${response.status})`;
    throw new Error(message);
  }
  return payload;
}

async function executeContextWorker({ campaignId, brainKey, brainFile }) {
  const dashboardRoot = process.cwd();
  const repoRoot = path.resolve(dashboardRoot, '..');
  const brainPath = path.join(repoRoot, 'brain', brainFile);
  const campaignPath = path.join(repoRoot, 'pitch-jobs', campaignId);
  const logsPath = path.join(campaignPath, 'logs');
  const outputPath = path.join(logsPath, `brain-context-${brainKey.toLowerCase()}.json`);

  const [brainSource, stageStateRaw] = await Promise.all([
    fs.readFile(brainPath, 'utf-8'),
    fs.readFile(path.join(campaignPath, 'stage-state.json'), 'utf-8').catch(() => null),
  ]);

  let stageState = null;
  if (stageStateRaw) {
    try {
      stageState = JSON.parse(stageStateRaw);
    } catch {
      stageState = null;
    }
  }

  const result = {
    workerType: 'context_worker',
    brainKey,
    brainFile,
    campaignId,
    generatedAt: new Date().toISOString(),
    contextSummary: {
      brainLengthChars: brainSource.length,
      hasCurrentStage: Boolean(stageState?.currentStage),
      currentStage: stageState?.currentStage ?? null,
      hasCampaignStatus: Boolean(stageState?.status),
      campaignStatus: stageState?.status ?? null,
    },
    note: 'Global brain context worker executed successfully and emitted context artifact.',
  };

  await fs.mkdir(logsPath, { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(result, null, 2), 'utf-8');
  return {
    ...result,
    outputPath,
  };
}

export function getBrainServiceCatalog() {
  return STAGE_SERVICES;
}

export function resolveBrainService(brainKey) {
  return STAGE_SERVICES[brainKey] || null;
}

export async function runBrainService({ baseUrl, campaignId, brainKey, token }) {
  const definition = resolveBrainService(brainKey);
  if (!definition) {
    throw new Error(`Unsupported brain key: ${brainKey}`);
  }

  if (definition.type === 'human_gate') {
    const result = await executeHumanGate({ baseUrl, campaignId, token });
    return {
      brainKey,
      service: definition.service,
      type: definition.type,
      result,
    };
  }

  if (definition.type === 'context_worker') {
    const result = await executeContextWorker({
      campaignId,
      brainKey,
      brainFile: definition.brainFile,
    });
    return {
      brainKey,
      service: definition.service,
      type: definition.type,
      result,
    };
  }

  const result = await executeStage({ baseUrl, campaignId, stage: definition.stage, token });
  return {
    brainKey,
    service: definition.service,
    type: definition.type,
    stage: definition.stage,
    result,
  };
}
