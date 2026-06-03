import fs from 'fs/promises';
import path from 'path';

export interface StageValidationResult {
  stage: number;
  valid: boolean;
  missingRequirements: Array<{
    requirement: string;
    acceptedFiles: string[];
  }>;
}

type StageRequirement = {
  stage: number;
  requirements: Array<{
    requirement: string;
    acceptedFiles: string[];
  }>;
};

const STAGE_REQUIREMENTS: StageRequirement[] = [
  { stage: 1, requirements: [
    { requirement: 'Campaign brief', acceptedFiles: ['00-brief.md'] },
    { requirement: 'Campaign intake metadata', acceptedFiles: ['01-campaign-intake.json'] },
  ] },
  { stage: 2, requirements: [
    { requirement: 'Study notes', acceptedFiles: ['01-study-notes.md'] },
    { requirement: 'Insights summary', acceptedFiles: ['02-insights.md'] },
    { requirement: 'Raw extracted data', acceptedFiles: ['02-raw-extracted-data.json'] },
  ] },
  { stage: 3, requirements: [
    { requirement: 'Research notes', acceptedFiles: ['03-research.md'] },
    { requirement: 'Research enrichment JSON', acceptedFiles: ['03-research-enrichment.json'] },
    { requirement: 'Topic expansion map', acceptedFiles: ['topic-expansion-map.json'] },
    { requirement: 'Data inventory', acceptedFiles: ['data-inventory.json'] },
    { requirement: 'Source registry', acceptedFiles: ['source-registry.json'] },
    { requirement: 'Verified findings', acceptedFiles: ['verified-findings.json'] },
  ] },
  { stage: 4, requirements: [
    { requirement: 'Stage 4 markdown analysis', acceptedFiles: ['04-angles.md', '04-analysis.md'] },
    { requirement: 'Insight analysis map', acceptedFiles: ['InsightAnalysisMap.json'] },
    { requirement: 'Angle generation handoff', acceptedFiles: ['AngleGenerationHandoff.json'] },
  ] },
  { stage: 5, requirements: [
    { requirement: 'Generated angles', acceptedFiles: ['05-angles.md'] },
    { requirement: 'Beat mappings', acceptedFiles: ['05-beats.md'] },
  ] },
  { stage: 6, requirements: [
    { requirement: 'Beat match results', acceptedFiles: ['06-beat-match.json', '06-beat-match.md'] },
  ] },
  { stage: 7, requirements: [
    { requirement: 'Human approval gate record', acceptedFiles: ['human-approval.json'] },
  ] },
  { stage: 8, requirements: [
    { requirement: 'Journalist list', acceptedFiles: ['08-journalist-list.csv'] },
  ] },
  { stage: 9, requirements: [
    { requirement: 'Journalist intelligence', acceptedFiles: ['09-journalist-intelligence.json'] },
  ] },
  { stage: 10, requirements: [
    { requirement: 'Pitch draft', acceptedFiles: ['10-pitch-draft.md', '08-pitch-draft.md', '10-pitch-draft.json'] },
  ] },
  { stage: 11, requirements: [
    { requirement: 'Optimized pitch', acceptedFiles: ['11-optimized-pitch.md', '09-optimized-email.md'] },
  ] },
  { stage: 12, requirements: [
    { requirement: 'Outreach package', acceptedFiles: ['12-outreach-package.md', '10-google-doc.md'] },
  ] },
  { stage: 13, requirements: [
    { requirement: 'Validation report', acceptedFiles: ['13-validation-report.json'] },
  ] },
  { stage: 14, requirements: [
    { requirement: 'Final formatted package', acceptedFiles: ['14-final-formatted-package.md'] },
  ] },
  { stage: 15, requirements: [
    { requirement: 'Outreach assets', acceptedFiles: ['15-outreach-assets.md'] },
  ] },
  { stage: 16, requirements: [
    { requirement: 'Campaign learning log', acceptedFiles: ['16-campaign-learning-log.json'] },
  ] },
];

export function getStageRequirements(stage: number): StageRequirement | null {
  return STAGE_REQUIREMENTS.find(item => item.stage === stage) || null;
}

export async function validateStageHandoff(campaignPath: string, stage: number): Promise<StageValidationResult> {
  const stageRequirements = getStageRequirements(stage);
  if (!stageRequirements) {
    return {
      stage,
      valid: true,
      missingRequirements: [],
    };
  }

  const files = await fs.readdir(campaignPath).catch(() => []);
  const fileSet = new Set(files);

  const missingRequirements = stageRequirements.requirements.filter(requirement =>
    !requirement.acceptedFiles.some(fileName => fileSet.has(fileName))
  );

  return {
    stage,
    valid: missingRequirements.length === 0,
    missingRequirements,
  };
}

export async function appendCircuitBreakerError(
  campaignPath: string,
  stage: number,
  missingRequirements: StageValidationResult['missingRequirements']
): Promise<void> {
  const now = new Date().toISOString();
  const errorsPath = path.join(campaignPath, 'errors.json');
  const stageStatePath = path.join(campaignPath, 'stage-state.json');

  const errorEntry = {
    timestamp: now,
    stage,
    type: 'stage_handoff_validation_failed',
    missingRequirements: missingRequirements.map(item => ({
      requirement: item.requirement,
      acceptedFiles: item.acceptedFiles,
    })),
  };

  const existingErrors = await fs.readFile(errorsPath, 'utf-8')
    .then(content => JSON.parse(content) as unknown[])
    .catch(() => []);

  const nextErrors = Array.isArray(existingErrors)
    ? [...existingErrors, errorEntry]
    : [errorEntry];

  await fs.writeFile(errorsPath, JSON.stringify(nextErrors, null, 2), 'utf-8');

  const existingState = await fs.readFile(stageStatePath, 'utf-8')
    .then(content => JSON.parse(content) as Record<string, unknown> & { currentStage?: number })
    .catch(() => null);

  const nextState = {
    ...(existingState || {}),
    currentStage: typeof existingState?.currentStage === 'number' ? existingState.currentStage : stage,
    status: 'blocked_on_stage_validation',
    lastBlockedAt: now,
    blockedStage: stage,
  };

  await fs.writeFile(stageStatePath, JSON.stringify(nextState, null, 2), 'utf-8');
}
