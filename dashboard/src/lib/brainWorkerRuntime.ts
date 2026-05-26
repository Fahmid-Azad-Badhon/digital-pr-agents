import path from 'path';
import { REPO_ROOT } from '@/lib/requestGuard';

export type BrainWorkerTarget =
  | { kind: 'stage'; stage: number }
  | { kind: 'human_gate' }
  | { kind: 'context_worker'; context: 'global' };

export const BRAIN_KEY_TO_TARGET: Record<string, BrainWorkerTarget> = {
  G0_GLOBAL_WORKFLOW: { kind: 'context_worker', context: 'global' },
  G1_VALIDATION_TRUTH: { kind: 'context_worker', context: 'global' },
  G2_JOURNALIST_PSYCHOLOGY: { kind: 'context_worker', context: 'global' },
  S0_CAMPAIGN_CLARIFICATION: { kind: 'stage', stage: 1 },
  S1_CAMPAIGN_INTAKE: { kind: 'stage', stage: 1 },
  S2_DATA_EXTRACTION: { kind: 'stage', stage: 2 },
  S3_RESEARCH_ENRICHMENT: { kind: 'stage', stage: 3 },
  S4A_DATA_RESEARCH_ANALYST: { kind: 'stage', stage: 4 },
  S4B_INSIGHT_ANALYST: { kind: 'stage', stage: 4 },
  S5_ANGLE_GENERATION: { kind: 'stage', stage: 5 },
  S6_BEAT_MATCHING: { kind: 'stage', stage: 6 },
  S7_HUMAN_GATE: { kind: 'human_gate' },
  S8_JOURNALIST_COLLECTION: { kind: 'stage', stage: 8 },
  S9_JOURNALIST_INTELLIGENCE: { kind: 'stage', stage: 9 },
  S10_PITCH_DRAFTING: { kind: 'stage', stage: 10 },
  S11_PITCH_OPTIMIZATION: { kind: 'stage', stage: 11 },
  S12_PACKAGE_ASSEMBLY: { kind: 'stage', stage: 12 },
  S13_VALIDATION: { kind: 'stage', stage: 13 },
  S14_FINAL_FORMATTING: { kind: 'stage', stage: 14 },
  S15_OUTREACH_ASSET_CREATION: { kind: 'stage', stage: 15 },
  S16_CAMPAIGN_LOG_LEARNING_LOOP: { kind: 'stage', stage: 16 },
};

export function getBrainWorkerScriptPath() {
  return path.join(REPO_ROOT, 'scripts', 'run-brain-worker.mjs');
}
