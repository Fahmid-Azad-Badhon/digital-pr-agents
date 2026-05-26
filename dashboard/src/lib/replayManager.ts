/**
 * =============================================================================
 * REPLAY MODE MODULE
 * =============================================================================
 * 
 * Enables safe rerunning of campaign stages with:
 * - Snapshot creation before replay
 * - Archive of old outputs before overwrite
 * - Run ID tracking with full metadata
 * - Comparison reports between old and new outputs
 * - Stale artifact marking
 * - S7 approval staleness handling
 * - Dry-run support
 * - Prompt and model testing
 * 
 * =============================================================================
 */

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const CAMPAIGNS_DIR = 'D:\\Codex Folder\\digital-pr-agents\\pitch-jobs';
const SYSTEM_DIR = 'D:\\Codex Folder\\digital-pr-agents\\system';

// =============================================================================
// TYPES
// =============================================================================

export type ReplayType = 
  | 'stage_only' 
  | 'stage_and_downstream' 
  | 'validation_only' 
  | 'evaluation_only' 
  | 'prompt_test' 
  | 'model_test' 
  | 'dry_run' 
  | 'comparison_only';

export type TriggerSource = 'human' | 'system' | 'dashboard' | 'test';
export type RunType = 'initial' | 'replay';
export type RunStatus = 'running' | 'completed' | 'failed' | 'blocked';

export interface ReplayRun {
  runId: string;
  campaignSlug: string;
  stageId: string;
  runType: RunType;
  replayType: ReplayType;
  startedAt: string;
  completedAt: string | null;
  status: RunStatus;
  rerunReason: string;
  triggeredBy: TriggerSource;
  modelUsed: string | null;
  primaryModel: string | null;
  fallbackUsed: boolean;
  promptVersion: string | null;
  brainVersion: string | null;
  inputSnapshotId: string;
  outputSnapshotId: string | null;
  validationStatus: 'passed' | 'failed' | 'not_run' | null;
  evaluationScore: number;
  notes: string[];
}

export interface ReplayHistory {
  campaignSlug: string;
  updatedAt: string;
  runs: ReplayRun[];
  comparisons: ReplayComparison[];
  restores: ReplayRestore[];
}

export interface ReplayComparison {
  comparisonId: string;
  campaignSlug: string;
  stageId: string;
  oldRunId: string;
  newRunId: string;
  createdAt: string;
  summary: string;
  qualityImproved: boolean;
  validationImproved: boolean;
  newRisksIntroduced: boolean;
  diffSummary: {
    added: string[];
    removed: string[];
    changed: string[];
  };
  claimChanges: {
    claimsAdded: string[];
    claimsRemoved: string[];
    claimsChanged: string[];
    unsupportedClaimsAdded: string[];
  };
  scoreChanges: {
    oldScore: number;
    newScore: number;
    delta: number;
  };
  recommendation: 'keep_new' | 'restore_old' | 'needs_human_review';
}

export interface ReplayRestore {
  restoreId: string;
  runIdRestored: string;
  stageId: string;
  restoreReason: string;
  triggeredBy: TriggerSource;
  restoredAt: string;
  staleArtifactsCreated: string[];
}

export interface SnapshotManifest {
  snapshotId: string;
  campaignSlug: string;
  stageId: string;
  createdAt: string;
  createdForRunId: string;
  filesIncluded: string[];
  promptVersion: string | null;
  brainVersion: string | null;
  modelRoutingVersion: string | null;
  stageContractVersion: string | null;
  notes: string[];
}

export interface StaleArtifact {
  file: string;
  reason: string;
  affectedByRunId: string;
  requiresRerun: boolean;
}

export interface StaleArtifactsFile {
  updatedAt: string;
  staleArtifacts: StaleArtifact[];
}

export interface PromptTestResult {
  testId: string;
  stageId: string;
  oldPromptVersion: string;
  newPromptVersion: string;
  oldRunId: string;
  newRunId: string;
  scoreDelta: number;
  validationImproved: boolean;
  recommendation: 'promote' | 'reject' | 'needs_more_testing';
}

export interface ModelTestResult {
  testId: string;
  stageId: string;
  defaultModel: string;
  testModel: string;
  defaultRunId: string;
  testRunId: string;
  scoreDelta: number;
  validationImproved: boolean;
  fallbackRateImpact: string;
  recommendation: 'keep_default' | 'consider_override' | 'reject_override';
}

export interface DryRunReport {
  campaignSlug: string;
  requestedStageId: string;
  requestedReplayType: ReplayType;
  createdAt: string;
  checksPassed: boolean;
  requiredInputsCheck: {
    passed: boolean;
    missing: string[];
    existing: string[];
  };
  stageDependencyImpact: {
    downstreamStages: string[];
    willBecomeStale: string[];
  };
  staleArtifactDetection: {
    filesThatWillBeStale: string[];
  };
  approvalInvalidationCheck: {
    s7WillBecomeStale: boolean;
    reason: string | null;
  };
  expectedFilesToArchive: string[];
  expectedFilesToRewrite: string[];
  gatesThatWouldRerun: string[];
  validationsThatWouldRerun: string[];
  warnings: string[];
}

// =============================================================================
// CONFIG LOADING
// =============================================================================

async function loadReplayConfig() {
  const configPath = path.join(SYSTEM_DIR, 'replay-config.json');
  try {
    const data = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { runIdFormat: '{campaignSlug}-{stageId}-{YYYYMMDD-HHMMSS}-run{runNumber}' };
  }
}

async function loadReplayRules() {
  const rulesPath = path.join(SYSTEM_DIR, 'replay-rules.json');
  try {
    const data = await fs.readFile(rulesPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { preReplayChecks: [], humanApprovalRules: [], claimLedgerRules: [] };
  }
}

async function loadStageDependencies() {
  const depsPath = path.join(SYSTEM_DIR, 'replay-stage-dependencies.json');
  try {
    const data = await fs.readFile(depsPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { dependencies: {}, staleArtifactTriggers: {} };
  }
}

async function loadStageContracts() {
  const contractsPath = path.join(SYSTEM_DIR, 'stage-contracts.json');
  try {
    const data = await fs.readFile(contractsPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { stages: {} };
  }
}

async function loadModelRouting() {
  const routingPath = path.join(SYSTEM_DIR, 'model-routing.config.json');
  try {
    const data = await fs.readFile(routingPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { campaignStageRouting: {} };
  }
}

// =============================================================================
// RUN ID GENERATION
// =============================================================================

export function generateRunId(campaignSlug: string, stageId: string): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
  const random = Math.floor(Math.random() * 999) + 1;
  return `${campaignSlug}-${stageId}-${dateStr}-${timeStr}-run${random.toString().padStart(3, '0')}`;
}

// =============================================================================
// SNAPSHOT MANAGEMENT
// =============================================================================

export async function createInputSnapshot(
  campaignSlug: string,
  stageId: string,
  runId: string,
  promptVersion?: string,
  brainVersion?: string
): Promise<SnapshotManifest> {
  const campaignPath = path.join(CAMPAIGNS_DIR, campaignSlug);
  const snapshotsDir = path.join(campaignPath, 'snapshots', runId);
  
  await fs.mkdir(snapshotsDir, { recursive: true });
  
  const contracts = await loadStageContracts();
  const stageContract = contracts.stages?.[stageId];
  const requiredFiles = stageContract?.requires || [];
  
  const filesIncluded: string[] = [];
  for (const file of requiredFiles) {
    const filePath = path.join(campaignPath, file);
    try {
      await fs.access(filePath);
      const content = await fs.readFile(filePath, 'utf-8');
      await fs.writeFile(path.join(snapshotsDir, file), content, 'utf-8');
      filesIncluded.push(file);
    } catch {
      filesIncluded.push(`${file} (missing)`);
    }
  }
  
  const manifest: SnapshotManifest = {
    snapshotId: runId,
    campaignSlug,
    stageId,
    createdAt: new Date().toISOString(),
    createdForRunId: runId,
    filesIncluded,
    promptVersion: promptVersion || null,
    brainVersion: brainVersion || null,
    modelRoutingVersion: '1.0.0',
    stageContractVersion: contracts.version || '1.0.1',
    notes: []
  };
  
  await fs.writeFile(
    path.join(snapshotsDir, 'snapshot-manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf-8'
  );
  
  return manifest;
}

export async function getSnapshot(snapshotId: string, campaignSlug: string): Promise<SnapshotManifest | null> {
  const manifestPath = path.join(CAMPAIGNS_DIR, campaignSlug, 'snapshots', snapshotId, 'snapshot-manifest.json');
  try {
    const data = await fs.readFile(manifestPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// =============================================================================
// ARCHIVE MANAGEMENT
// =============================================================================

export async function archiveStageOutput(
  campaignSlug: string,
  stageId: string,
  runId: string
): Promise<boolean> {
  const campaignPath = path.join(CAMPAIGNS_DIR, campaignSlug);
  const contracts = await loadStageContracts();
  const stageContract = contracts.stages?.[stageId];
  const outputFiles = stageContract?.produces || [];
  
  const archiveDir = path.join(campaignPath, 'archive', stageId, runId);
  await fs.mkdir(archiveDir, { recursive: true });
  
  let archivedAny = false;
  for (const file of outputFiles) {
    const sourcePath = path.join(campaignPath, file);
    try {
      const content = await fs.readFile(sourcePath, 'utf-8');
      await fs.writeFile(path.join(archiveDir, file), content, 'utf-8');
      archivedAny = true;
    } catch {
      // File doesn't exist, skip
    }
  }
  
  if (archivedAny) {
    await fs.writeFile(
      path.join(archiveDir, 'archive-meta.json'),
      JSON.stringify({
        originalRunId: runId,
        archivedAt: new Date().toISOString(),
        stageId,
        filesArchived: outputFiles
      }, null, 2),
      'utf-8'
    );
  }
  
  return archivedAny;
}

export async function getArchivedRuns(campaignSlug: string, stageId: string): Promise<string[]> {
  const archiveDir = path.join(CAMPAIGNS_DIR, campaignSlug, 'archive', stageId);
  try {
    const entries = await fs.readdir(archiveDir);
    return entries.filter(e => !e.endsWith('.json'));
  } catch {
    return [];
  }
}

// =============================================================================
// STALE ARTIFACTS MANAGEMENT
// =============================================================================

export async function markStaleArtifacts(
  campaignSlug: string,
  stageId: string,
  runId: string,
  reason: string
): Promise<void> {
  const campaignPath = path.join(CAMPAIGNS_DIR, campaignSlug);
  const staleArtifactsPath = path.join(campaignPath, 'stale-artifacts.json');
  
  const deps = await loadStageDependencies();
  const staleTriggers = deps.staleArtifactTriggers?.[stageId];
  const filesToMarkStale = staleTriggers?.staleFiles || [];
  
  let existing: StaleArtifactsFile = { updatedAt: '', staleArtifacts: [] };
  try {
    const data = await fs.readFile(staleArtifactsPath, 'utf-8');
    existing = JSON.parse(data);
  } catch {
    // File doesn't exist yet
  }
  
  for (const file of filesToMarkStale) {
    if (!existing.staleArtifacts.some(a => a.file === file && a.affectedByRunId === runId)) {
      existing.staleArtifacts.push({
        file,
        reason: `${stageId} was replayed: ${reason}`,
        affectedByRunId: runId,
        requiresRerun: true
      });
    }
  }
  
  existing.updatedAt = new Date().toISOString();
  
  await fs.writeFile(staleArtifactsPath, JSON.stringify(existing, null, 2), 'utf-8');
}

export async function getStaleArtifacts(campaignSlug: string): Promise<StaleArtifactsFile> {
  const staleArtifactsPath = path.join(CAMPAIGNS_DIR, campaignSlug, 'stale-artifacts.json');
  try {
    const data = await fs.readFile(staleArtifactsPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { updatedAt: '', staleArtifacts: [] };
  }
}

export async function clearStaleArtifact(campaignSlug: string, file: string): Promise<void> {
  const stale = await getStaleArtifacts(campaignSlug);
  stale.staleArtifacts = stale.staleArtifacts.filter(a => a.file !== file);
  stale.updatedAt = new Date().toISOString();
  const staleArtifactsPath = path.join(CAMPAIGNS_DIR, campaignSlug, 'stale-artifacts.json');
  await fs.writeFile(staleArtifactsPath, JSON.stringify(stale, null, 2), 'utf-8');
}

// =============================================================================
// HUMAN APPROVAL STALENESS
// =============================================================================

export async function handleApprovalStaleness(
  campaignSlug: string,
  stageId: string,
  runId: string
): Promise<{ stalenessTriggered: boolean; action: string }> {
  const deps = await loadStageDependencies();
  const invalidationStages = deps.humanApprovalInvalidation?.stagesThatInvalidateApproval || [];
  
  const campaignPath = path.join(CAMPAIGNS_DIR, campaignSlug);
  const approvalPath = path.join(campaignPath, 'human-approval.json');
  
  if (invalidationStages.includes(stageId)) {
    try {
      const approval = JSON.parse(await fs.readFile(approvalPath, 'utf-8'));
      approval.status = 'needs_revision';
      approval.reason = `Upstream stage ${stageId} was replayed. Human selection must be reviewed again.`;
      approval.invalidatedByRunId = runId;
      approval.invalidatedAt = new Date().toISOString();
      await fs.writeFile(approvalPath, JSON.stringify(approval, null, 2), 'utf-8');
      return { stalenessTriggered: true, action: 'S7 approval marked as needs_revision' };
    } catch {
      return { stalenessTriggered: false, action: 'No human-approval.json to update' };
    }
  }
  
  return { stalenessTriggered: false, action: 'No staleness trigger' };
}

// =============================================================================
// REPLAY HISTORY MANAGEMENT
// =============================================================================

export async function getReplayHistory(campaignSlug: string): Promise<ReplayHistory> {
  const historyPath = path.join(CAMPAIGNS_DIR, campaignSlug, 'replay-history.json');
  try {
    const data = await fs.readFile(historyPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {
      campaignSlug,
      updatedAt: new Date().toISOString(),
      runs: [],
      comparisons: [],
      restores: []
    };
  }
}

export async function addReplayRun(campaignSlug: string, run: ReplayRun): Promise<void> {
  const history = await getReplayHistory(campaignSlug);
  history.runs.push(run);
  history.updatedAt = new Date().toISOString();
  
  const historyPath = path.join(CAMPAIGNS_DIR, campaignSlug, 'replay-history.json');
  await fs.writeFile(historyPath, JSON.stringify(history, null, 2), 'utf-8');
}

export async function addComparison(campaignSlug: string, comparison: ReplayComparison): Promise<void> {
  const history = await getReplayHistory(campaignSlug);
  history.comparisons.push(comparison);
  history.updatedAt = new Date().toISOString();
  
  const historyPath = path.join(CAMPAIGNS_DIR, campaignSlug, 'replay-history.json');
  await fs.writeFile(historyPath, JSON.stringify(history, null, 2), 'utf-8');
}

export async function addRestore(campaignSlug: string, restore: ReplayRestore): Promise<void> {
  const history = await getReplayHistory(campaignSlug);
  history.restores.push(restore);
  history.updatedAt = new Date().toISOString();
  
  const historyPath = path.join(CAMPAIGNS_DIR, campaignSlug, 'replay-history.json');
  await fs.writeFile(historyPath, JSON.stringify(history, null, 2), 'utf-8');
}

// =============================================================================
// PRE-REPLAY CHECKS
// =============================================================================

export async function runPreReplayChecks(
  campaignSlug: string,
  stageId: string
): Promise<{ passed: boolean; errors: string[]; warnings: string[] }> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const campaignPath = path.join(CAMPAIGNS_DIR, campaignSlug);
  
  try {
    await fs.access(campaignPath);
  } catch {
    errors.push('Campaign directory does not exist');
    return { passed: false, errors, warnings };
  }
  
  const contracts = await loadStageContracts();
  const stageContract = contracts.stages?.[stageId];
  
  if (!stageContract) {
    errors.push(`Stage ${stageId} not found in stage contracts`);
    return { passed: false, errors, warnings };
  }
  
  const requiredFiles = stageContract.requires || [];
  for (const file of requiredFiles) {
    const filePath = path.join(campaignPath, file);
    try {
      await fs.access(filePath);
    } catch {
      errors.push(`Required input file missing: ${file}`);
    }
  }
  
  const routing = await loadModelRouting();
  const stageRouting = routing.campaignStageRouting?.[stageId];
  if (!stageRouting) {
    warnings.push(`No model routing defined for ${stageId}`);
  }
  
  if (stageId === 'S7_PITCH_SELECTION_HUMAN_GATE') {
    warnings.push('Replaying S7 will require new human approval');
  }
  
  const invalidationStages = (await loadStageDependencies()).humanApprovalInvalidation?.stagesThatInvalidateApproval || [];
  if (invalidationStages.includes(stageId)) {
    warnings.push('Replaying this stage will invalidate S7 human approval');
  }
  
  return { passed: errors.length === 0, errors, warnings };
}

// =============================================================================
// DRY RUN
// =============================================================================

export async function runDryRunReplay(
  campaignSlug: string,
  stageId: string,
  replayType: ReplayType,
  rerunReason: string,
  triggeredBy: TriggerSource
): Promise<DryRunReport> {
  const report: DryRunReport = {
    campaignSlug,
    requestedStageId: stageId,
    requestedReplayType: replayType,
    createdAt: new Date().toISOString(),
    checksPassed: false,
    requiredInputsCheck: {
      passed: false,
      missing: [],
      existing: []
    },
    stageDependencyImpact: {
      downstreamStages: [],
      willBecomeStale: []
    },
    staleArtifactDetection: {
      filesThatWillBeStale: []
    },
    approvalInvalidationCheck: {
      s7WillBecomeStale: false,
      reason: null
    },
    expectedFilesToArchive: [],
    expectedFilesToRewrite: [],
    gatesThatWouldRerun: [],
    validationsThatWouldRerun: [],
    warnings: []
  };
  
  const checks = await runPreReplayChecks(campaignSlug, stageId);
  report.checksPassed = checks.passed;
  report.requiredInputsCheck.passed = checks.errors.length === 0;
  report.requiredInputsCheck.missing = checks.errors;
  report.warnings.push(...checks.warnings);
  
  const campaignPath = path.join(CAMPAIGNS_DIR, campaignSlug);
  const contracts = await loadStageContracts();
  const stageContract = contracts.stages?.[stageId];
  const requiredFiles = stageContract?.requires || [];
  
  for (const file of requiredFiles) {
    const filePath = path.join(campaignPath, file);
    try {
      await fs.access(filePath);
      report.requiredInputsCheck.existing.push(file);
    } catch {
      // Already in missing
    }
  }
  
  const outputFiles = stageContract?.produces || [];
  report.expectedFilesToRewrite = outputFiles;
  report.expectedFilesToArchive = outputFiles;
  
  const deps = await loadStageDependencies();
  const downstream = deps.dependencies?.[stageId]?.affects || [];
  report.stageDependencyImpact.downstreamStages = downstream;
  
  const staleTriggers = deps.staleArtifactTriggers?.[stageId];
  if (staleTriggers) {
    report.staleArtifactDetection.filesThatWillBeStale = staleTriggers.staleFiles || [];
    report.stageDependencyImpact.willBecomeStale = staleTriggers.staleFiles || [];
  }
  
  const invalidationStages = deps.humanApprovalInvalidation?.stagesThatInvalidateApproval || [];
  if (invalidationStages.includes(stageId)) {
    report.approvalInvalidationCheck.s7WillBecomeStale = true;
    report.approvalInvalidationCheck.reason = `${stageId} replay invalidates S7 approval`;
  }
  
  if (stageId === 'S10_PITCH_DRAFTING' || stageId === 'S11_PITCH_OPTIMIZATION' || stageId === 'S12_PACKAGE_ASSEMBLY') {
    report.validationsThatWouldRerun.push('S13_VALIDATION');
  }
  
  const gateAfter = stageContract?.gateAfter;
  if (gateAfter) {
    report.gatesThatWouldRerun.push(gateAfter);
  }
  
  const reportPath = path.join(campaignPath, 'dry-run-replay-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  
  return report;
}

// =============================================================================
// RESTORE FUNCTIONALITY
// =============================================================================

export async function restoreArchivedOutput(
  campaignSlug: string,
  stageId: string,
  runIdToRestore: string,
  restoreReason: string,
  triggeredBy: TriggerSource
): Promise<{ success: boolean; staleArtifactsCreated: string[]; error?: string }> {
  const campaignPath = path.join(CAMPAIGNS_DIR, campaignSlug);
  const archiveDir = path.join(campaignPath, 'archive', stageId, runIdToRestore);
  
  try {
    await fs.access(archiveDir);
  } catch {
    return { success: false, staleArtifactsCreated: [], error: 'Archive not found' };
  }
  
  const archivedFiles = await fs.readdir(archiveDir);
  const outputFiles = archivedFiles.filter(f => !f.endsWith('.json') && f !== 'archive-meta.json');
  
  for (const file of outputFiles) {
    const archiveFilePath = path.join(archiveDir, file);
    const destPath = path.join(campaignPath, file);
    const content = await fs.readFile(archiveFilePath, 'utf-8');
    await fs.writeFile(destPath, content, 'utf-8');
  }
  
  const deps = await loadStageDependencies();
  const staleTriggers = deps.staleArtifactTriggers?.[stageId];
  const staleFiles = staleTriggers?.staleFiles || [];
  
  for (const staleFile of staleFiles) {
    await markStaleArtifacts(campaignSlug, staleFile.split('-')[0] + '_' + staleFile.split('-')[1], runIdToRestore, 'Restored older version');
  }
  
  const restoreId = `RESTORE-${Date.now()}`;
  const restoreEntry: ReplayRestore = {
    restoreId,
    runIdRestored: runIdToRestore,
    stageId,
    restoreReason,
    triggeredBy,
    restoredAt: new Date().toISOString(),
    staleArtifactsCreated: staleFiles
  };
  
  await addRestore(campaignSlug, restoreEntry);
  
  return { success: true, staleArtifactsCreated: staleFiles };
}

// =============================================================================
// COMPARISON FUNCTIONALITY
// =============================================================================

export async function compareRunOutputs(
  campaignSlug: string,
  oldRunId: string,
  newRunId: string,
  stageId: string
): Promise<ReplayComparison> {
  const campaignPath = path.join(CAMPAIGNS_DIR, campaignSlug);
  
  const contracts = await loadStageContracts();
  const stageContract = contracts.stages?.[stageId];
  const outputFiles = stageContract?.produces || [];
  
  const comparisonId = `CMP-${Date.now()}`;
  const diffSummary: { added: string[]; removed: string[]; changed: string[] } = { added: [], removed: [], changed: [] };
  const claimChanges: { claimsAdded: string[]; claimsRemoved: string[]; claimsChanged: string[]; unsupportedClaimsAdded: string[] } = { claimsAdded: [], claimsRemoved: [], claimsChanged: [], unsupportedClaimsAdded: [] };
  
  let oldContent = '';
  let newContent = '';
  
  const mainOutputFile = outputFiles[0];
  if (mainOutputFile) {
    const oldPath = path.join(campaignPath, 'archive', stageId, oldRunId, mainOutputFile);
    const newPath = path.join(campaignPath, mainOutputFile);
    
    try {
      oldContent = await fs.readFile(oldPath, 'utf-8');
    } catch {
      diffSummary.removed.push(`${mainOutputFile} (old run archive not found)`);
    }
    
    try {
      newContent = await fs.readFile(newPath, 'utf-8');
    } catch {
      diffSummary.added.push(`${mainOutputFile} (new file not found)`);
    }
  }
  
  const summary = diffSummary.added.length > 0 || diffSummary.removed.length > 0 || diffSummary.changed.length > 0
    ? `Changes detected in ${stageId} output`
    : `No significant changes detected`;
  
  const comparison: ReplayComparison = {
    comparisonId,
    campaignSlug,
    stageId,
    oldRunId,
    newRunId,
    createdAt: new Date().toISOString(),
    summary,
    qualityImproved: false,
    validationImproved: false,
    newRisksIntroduced: false,
    diffSummary,
    claimChanges,
    scoreChanges: { oldScore: 0, newScore: 0, delta: 0 },
    recommendation: 'needs_human_review'
  };
  
  await addComparison(campaignSlug, comparison);
  
  return comparison;
}

// =============================================================================
// MAIN REPLAY EXECUTION
// =============================================================================

export interface ReplayRequest {
  campaignSlug: string;
  stageId: string;
  replayType: ReplayType;
  rerunReason: string;
  triggeredBy: TriggerSource;
  promptVersion?: string;
  brainVersion?: string;
  modelOverride?: string;
}

export async function executeReplay(request: ReplayRequest): Promise<{ success: boolean; run?: ReplayRun; error?: string }> {
  const { campaignSlug, stageId, replayType, rerunReason, triggeredBy, promptVersion, brainVersion, modelOverride } = request;
  
  if (replayType === 'dry_run') {
    await runDryRunReplay(campaignSlug, stageId, replayType, rerunReason, triggeredBy);
    return { success: true, run: undefined };
  }
  
  if (replayType === 'comparison_only') {
    return { success: false, error: 'comparison_only requires two run IDs' };
  }
  
  const checks = await runPreReplayChecks(campaignSlug, stageId);
  if (!checks.passed) {
    return { success: false, error: `Pre-replay checks failed: ${checks.errors.join(', ')}` };
  }
  
  const runId = generateRunId(campaignSlug, stageId);
  const routing = await loadModelRouting();
  const stageRouting = routing.campaignStageRouting?.[stageId];
  const primaryModel = modelOverride || stageRouting?.primary || null;
  
  const run: ReplayRun = {
    runId,
    campaignSlug,
    stageId,
    runType: 'replay',
    replayType,
    startedAt: new Date().toISOString(),
    completedAt: null,
    status: 'running',
    rerunReason,
    triggeredBy,
    modelUsed: primaryModel,
    primaryModel,
    fallbackUsed: false,
    promptVersion: promptVersion || null,
    brainVersion: brainVersion || null,
    inputSnapshotId: runId,
    outputSnapshotId: null,
    validationStatus: null,
    evaluationScore: 0,
    notes: checks.warnings
  };
  
  await addReplayRun(campaignSlug, run);
  
  if (replayType !== 'prompt_test' && replayType !== 'model_test' && replayType !== 'evaluation_only') {
    await archiveStageOutput(campaignSlug, stageId, runId);
  }
  
  await createInputSnapshot(campaignSlug, stageId, runId, promptVersion, brainVersion);
  
  if (replayType !== 'evaluation_only') {
    await markStaleArtifacts(campaignSlug, stageId, runId, rerunReason);
  }
  
  const stalenessResult = await handleApprovalStaleness(campaignSlug, stageId, runId);
  if (stalenessResult.stalenessTriggered) {
    run.notes.push(stalenessResult.action);
  }
  
  run.status = 'completed';
  run.completedAt = new Date().toISOString();
  run.outputSnapshotId = runId;
  
  await addReplayRun(campaignSlug, run);
  
  return { success: true, run };
}

// =============================================================================
// GETTERS FOR DASHBOARD
// =============================================================================

export async function getReplayStatus(campaignSlug: string): Promise<{
  hasReplayHistory: boolean;
  lastReplayDate: string | null;
  staleArtifactsCount: number;
  hasPendingApprovals: boolean;
}> {
  const history = await getReplayHistory(campaignSlug);
  const stale = await getStaleArtifacts(campaignSlug);
  
  const campaignPath = path.join(CAMPAIGNS_DIR, campaignSlug);
  let hasPendingApprovals = false;
  
  try {
    const approval = JSON.parse(await fs.readFile(path.join(campaignPath, 'human-approval.json'), 'utf-8'));
    hasPendingApprovals = approval.status === 'needs_revision';
  } catch {
    // No approval file
  }
  
  return {
    hasReplayHistory: history.runs.length > 0,
    lastReplayDate: history.runs.length > 0 ? history.runs[history.runs.length - 1].completedAt : null,
    staleArtifactsCount: stale.staleArtifacts.length,
    hasPendingApprovals
  };
}