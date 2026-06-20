import fs from 'fs/promises';
import path from 'path';
import { REPO_ROOT } from '@/lib/requestGuard';

export type RuntimeKind = 'internal_handler' | 'script_runner' | 'human_gate';

export interface StageRuntimeBinding {
  stage: number;
  stageKey: string;
  brainManifestKey: string;
  runtimeKind: RuntimeKind;
  executable: boolean;
  executionTarget: string;
  outputFiles: string[];
}

// REPO_ROOT imported from requestGuard

export const STAGE_RUNTIME_BINDINGS: StageRuntimeBinding[] = [
  { stage: 1, stageKey: 'S1_CAMPAIGN_INTAKE', brainManifestKey: 'S1_CAMPAIGN_INTAKE', runtimeKind: 'internal_handler', executable: true, executionTarget: '/api/campaigns/[id]/execute-stage#S1', outputFiles: ['01-campaign-intake.json'] },
  { stage: 2, stageKey: 'S2_DATA_EXTRACTION', brainManifestKey: 'S2_DATA_EXTRACTION', runtimeKind: 'script_runner', executable: true, executionTarget: 'scripts/draft-study-input.cmd', outputFiles: ['01-study-notes.md', '02-insights.md', '02-raw-extracted-data.json'] },
  { stage: 3, stageKey: 'S3_RESEARCH_ENRICHMENT', brainManifestKey: 'S3_RESEARCH_ENRICHMENT', runtimeKind: 'internal_handler', executable: true, executionTarget: '/api/campaigns/[id]/execute-stage#S3', outputFiles: ['03-research.md', '03-research-enrichment.json', 'topic-expansion-map.json', 'data-inventory.json'] },
  { stage: 4, stageKey: 'S4A_DATA_RESEARCH_ANALYST', brainManifestKey: 'S4A_DATA_RESEARCH_ANALYST', runtimeKind: 'internal_handler', executable: true, executionTarget: '/api/campaigns/[id]/execute-stage#S4', outputFiles: ['verified-findings.json', 'InsightAnalysisMap.json', 'AngleGenerationHandoff.json'] },
  { stage: 5, stageKey: 'S5_ANGLE_GENERATION', brainManifestKey: 'S5_ANGLE_GENERATION', runtimeKind: 'internal_handler', executable: true, executionTarget: '/api/campaigns/[id]/execute-stage#S5', outputFiles: ['05-angles.md'] },
  { stage: 6, stageKey: 'S6_BEAT_MATCHING', brainManifestKey: 'S6_BEAT_MATCHING', runtimeKind: 'internal_handler', executable: true, executionTarget: '/api/campaigns/[id]/execute-stage#S6', outputFiles: ['05-beats.md', '06-beat-match.json'] },
  { stage: 7, stageKey: 'S7_PITCH_SELECTION_HUMAN_GATE', brainManifestKey: 'S7_HUMAN_GATE', runtimeKind: 'human_gate', executable: true, executionTarget: '/api/campaigns/[id]/human-approval', outputFiles: ['human-approval.json'] },
  { stage: 8, stageKey: 'S8_JOURNALIST_COLLECTION', brainManifestKey: 'S8_JOURNALIST_COLLECTION', runtimeKind: 'script_runner', executable: true, executionTarget: 'scripts/import-muckrack-output.cmd', outputFiles: ['08-journalist-list.csv'] },
  { stage: 9, stageKey: 'S9_JOURNALIST_INTELLIGENCE', brainManifestKey: 'S9_JOURNALIST_INTELLIGENCE', runtimeKind: 'script_runner', executable: true, executionTarget: 'scripts/draft-journalist-intel.cmd', outputFiles: ['06-journalist-intel.md', '07-journalist-coverage.md', '09-journalist-intelligence.json'] },
  { stage: 10, stageKey: 'S10_PITCH_DRAFTING', brainManifestKey: 'S10_PITCH_DRAFTING', runtimeKind: 'script_runner', executable: true, executionTarget: 'scripts/draft-pitch-draft.cmd', outputFiles: ['08-pitch-draft.md', '10-pitch-draft.md', '10-pitch-draft.json'] },
  { stage: 11, stageKey: 'S11_PITCH_OPTIMIZATION', brainManifestKey: 'S11_PITCH_OPTIMIZATION', runtimeKind: 'internal_handler', executable: true, executionTarget: '/api/campaigns/[id]/execute-stage#S11', outputFiles: ['09-optimized-email.md', '11-optimized-pitch.md'] },
  { stage: 12, stageKey: 'S12_PACKAGE_ASSEMBLY', brainManifestKey: 'S12_PACKAGE_ASSEMBLY', runtimeKind: 'internal_handler', executable: true, executionTarget: '/api/campaigns/[id]/execute-stage#S12', outputFiles: ['12-outreach-package.md'] },
  { stage: 13, stageKey: 'S13_VALIDATION', brainManifestKey: 'S13_VALIDATION', runtimeKind: 'internal_handler', executable: true, executionTarget: '/api/campaigns/[id]/execute-stage#S13', outputFiles: ['13-validation-report.json'] },
  { stage: 14, stageKey: 'S14_FINAL_FORMATTING', brainManifestKey: 'S14_FINAL_FORMATTING', runtimeKind: 'internal_handler', executable: true, executionTarget: '/api/campaigns/[id]/execute-stage#S14', outputFiles: ['14-final-formatted-package.md'] },
  { stage: 15, stageKey: 'S15_OUTREACH_ASSET_CREATION', brainManifestKey: 'S15_OUTREACH_ASSET_CREATION', runtimeKind: 'internal_handler', executable: true, executionTarget: '/api/campaigns/[id]/execute-stage#S15', outputFiles: ['15-outreach-assets.md'] },
  { stage: 16, stageKey: 'S16_CAMPAIGN_LOG_LEARNING_LOOP', brainManifestKey: 'S16_CAMPAIGN_LOG_LEARNING_LOOP', runtimeKind: 'internal_handler', executable: true, executionTarget: '/api/campaigns/[id]/execute-stage#S16', outputFiles: ['16-campaign-learning-log.json'] },
];

export function getRuntimeBinding(stage: number) {
  return STAGE_RUNTIME_BINDINGS.find(item => item.stage === stage) || null;
}

export async function verifyRuntimeBinding(binding: StageRuntimeBinding): Promise<{ ok: boolean; reason?: string }> {
  if (!binding.executable) {
    return { ok: false, reason: 'Binding marked non-executable.' };
  }
  if (binding.runtimeKind === 'script_runner') {
    const scriptPath = path.join(REPO_ROOT, binding.executionTarget);
    try {
      await fs.access(scriptPath);
      return { ok: true };
    } catch {
      return { ok: false, reason: `Script not found: ${binding.executionTarget}` };
    }
  }
  return { ok: true };
}

