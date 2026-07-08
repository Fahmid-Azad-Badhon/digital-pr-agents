/**
 * =============================================================================
 * STAGE EXECUTION MODULE
 * =============================================================================
 * 
 * Integrates ModelRouter with campaign workflow.
 * Handles prompt loading, model execution, validation, and output persistence.
 * 
 * =============================================================================
 */

import path from 'path';
import fs from 'fs/promises';
import { z } from 'zod';
import {
  runStageWithFallback,
  getStageOutputFile,
  getStageRoutingInfo,
  stageRequiresHumanApproval,
  logModelRun,
  getPromptVersionForStage,
  type ModelCallResult
} from '../lib/modelRouter';
import { addLog } from '../lib/db';
import { validateJsonBeforeWrite, extractJsonFromOutput, isDryRunOutput } from './llmStageValidator';
import { type RunMode } from './runMode';
import { type ApprovalSource, getApprovalProgressionDecision } from './provenance';

// =============================================================================
// CONFIGURATION
// =============================================================================

const PROMPTS_DIR = 'D:\\Codex Folder\\digital-pr-agents\\dashboard\\prompts\\campaign';
const CAMPAIGNS_DIR = 'D:\\Codex Folder\\digital-pr-agents\\pitch-jobs';

// =============================================================================
// STAGE PROMPT LOADING
// =============================================================================

export async function loadStagePrompt(stageId: string): Promise<string> {
  const promptFile = stageId.replace('S', 'S').replace('_', '_') + '.md';
  const promptPath = path.join(PROMPTS_DIR, promptFile);
  
  try {
    return await fs.readFile(promptPath, 'utf-8');
  } catch {
    return `Process stage ${stageId} with the given input and produce the expected output.`;
  }
}

// =============================================================================
// OUTPUT VALIDATORS
// =============================================================================

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// JSON Validation using Zod
export function validateJsonOutput(output: string, schema: z.ZodSchema<unknown>): ValidationResult {
  try {
    const parsed = JSON.parse(output);
    schema.parse(parsed);
    return { valid: true, errors: [], warnings: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errList = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`);
      return { valid: false, errors: errList, warnings: [] };
    }
    return { valid: false, errors: ['Invalid JSON'], warnings: [] };
  }
}

// Markdown Required Sections Validation
export function validateMarkdownSections(output: string, requiredSections: string[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  for (const section of requiredSections) {
    if (!output.toLowerCase().includes(section.toLowerCase())) {
      errors.push(`Missing required section: ${section}`);
    }
  }
  
  return { valid: errors.length === 0, errors, warnings };
}

// CSV Validation for Journalist List
export function validateJournalistCsv(output: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const lines = output.split('\n').filter(l => l.trim());
  if (lines.length < 2) {
    errors.push('CSV must have header row and at least one data row');
    return { valid: false, errors, warnings };
  }
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const requiredHeaders = ['journalist_name', 'publication', 'beat', 'relevance_reason', 'priority_score'];
  
  for (const required of requiredHeaders) {
    if (!headers.includes(required)) {
      errors.push(`Missing required column: ${required}`);
    }
  }
  
  // Check for empty required fields
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map(c => c.trim());
    if (row[headers.indexOf('journalist_name')] === '') {
      errors.push(`Row ${i + 1}: journalist_name is empty`);
    }
    if (row[headers.indexOf('publication')] === '') {
      errors.push(`Row ${i + 1}: publication is empty`);
    }
    if (row[headers.indexOf('beat')] === '') {
      errors.push(`Row ${i + 1}: beat is empty`);
    }
  }
  
  return { valid: errors.length === 0, errors, warnings };
}

// =============================================================================
// OUTPUT PERSISTENCE
// =============================================================================

export async function saveStageOutput(
  campaignSlug: string,
  stageId: string,
  output: string,
  outputType: 'json' | 'markdown' | 'csv'
): Promise<string> {
  const outputFile = getStageOutputFile(stageId);
  if (!outputFile) {
    throw new Error(`No output file configured for stage: ${stageId}`);
  }

  let outputToWrite = output;

  if (outputType === 'json') {
    const validation = validateJsonBeforeWrite(stageId, output);
    if (!validation.allowed) {
      throw new Error(
        `JSON validation blocked write for stage ${stageId} [${validation.status}]: ${validation.errors.join('; ')}`
      );
    }
    const extracted = extractJsonFromOutput(output);
    if (extracted) {
      outputToWrite = JSON.stringify(JSON.parse(extracted), null, 2);
    }
  }
  
  const campaignDir = path.join(CAMPAIGNS_DIR, campaignSlug);
  
  try {
    await fs.access(campaignDir);
  } catch {
    await fs.mkdir(campaignDir, { recursive: true });
  }
  
  const filePath = path.join(campaignDir, outputFile);
  await fs.writeFile(filePath, outputToWrite, 'utf-8');
  
  return filePath;
}

// =============================================================================
// HUMAN APPROVAL HANDLING
// =============================================================================

export interface HumanApprovalState {
  stageId: string;
  status: 'waiting' | 'approved' | 'rejected' | 'needs_revision';
  selectedAngleId: string | null;
  selectedAngleTitle: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  notes: string | null;
  provenanceStatus: 'verified' | 'missing' | 'non_live' | 'unknown';
  provenanceWarning?: string;
  runMode: RunMode | null;
  source: ApprovalSource | null;
  schemaVersion: number | null;
}

const HUMAN_APPROVAL_FILE = 'human-approval.json';

export async function saveHumanApprovalState(
  campaignSlug: string,
  state: HumanApprovalState
): Promise<void> {
  const campaignDir = path.join(CAMPAIGNS_DIR, campaignSlug);
  const filePath = path.join(campaignDir, HUMAN_APPROVAL_FILE);
  
  await fs.writeFile(filePath, JSON.stringify(state, null, 2), 'utf-8');
}

export async function getHumanApprovalState(campaignSlug: string): Promise<HumanApprovalState | null> {
  const campaignDir = path.join(CAMPAIGNS_DIR, campaignSlug);
  const filePath = path.join(campaignDir, HUMAN_APPROVAL_FILE);
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function checkCanResumeFromS8(campaignSlug: string): Promise<{
  canResume: boolean;
  selectedAngle: string | null;
  reason?: string;
}> {
  const approvalState = await getHumanApprovalState(campaignSlug);
  
  if (!approvalState) {
    return { canResume: false, selectedAngle: null, reason: 'No human approval record found' };
  }
  
  if (approvalState.status !== 'approved') {
    return { 
      canResume: false, 
      selectedAngle: null, 
      reason: `Human approval status is: ${approvalState.status}` 
    };
  }
  
  if (!approvalState.selectedAngleTitle && !approvalState.selectedAngleId) {
    return { canResume: false, selectedAngle: null, reason: 'No angle selected by human' };
  }

  const provenanceDecision = getApprovalProgressionDecision({ status: approvalState.status, provenanceStatus: approvalState.provenanceStatus });
  if (!provenanceDecision.allowed) {
    return { canResume: false, selectedAngle: null, reason: provenanceDecision.reason };
  }

  const reason = 'warning' in provenanceDecision ? provenanceDecision.warning : undefined;
  
  return { 
    canResume: true, 
    selectedAngle: approvalState.selectedAngleTitle || approvalState.selectedAngleId,
    ...(reason ? { reason } : {}),
  };
}

// =============================================================================
// STAGE EXECUTION
// =============================================================================

export interface StageExecutionParams {
  campaignId: string;
  campaignSlug: string;
  stageId: string;
  input: Record<string, unknown>;
  useCase: string;
  validator?: (output: string) => Promise<ValidationResult>;
}

export interface StageExecutionResult {
  success: boolean;
  output: string;
  outputFile: string | null;
  validationResult: ValidationResult | null;
  paused: boolean;
  modelResult: ModelCallResult;
  error?: string;
}

export async function executeStage(params: StageExecutionParams): Promise<StageExecutionResult> {
  const { campaignId, campaignSlug, stageId, input, useCase, validator } = params;
  
  // Get routing info
  const routingInfo = getStageRoutingInfo(stageId);
  if (!routingInfo) {
    return {
      success: false,
      output: '',
      outputFile: null,
      validationResult: null,
      paused: false,
      modelResult: {} as ModelCallResult,
      error: `No routing config for stage: ${stageId}`
    };
  }
  
  // Load prompt template
  const promptTemplate = await loadStagePrompt(stageId);
  
  // Build prompt from input
  const prompt = buildPrompt(promptTemplate, input);
  
  // Check if this is S7 (human gate)
  const requiresHumanApproval = stageRequiresHumanApproval(stageId);
  
  if (requiresHumanApproval) {
    // For S7, we run but then pause for human approval
    console.log(`[StageExecutor] Stage ${stageId} requires human approval - will pause after execution`);
  }
  
  // Run through ModelRouter with fallback
  const modelResult = await runStageWithFallback(
    stageId,
    prompt,
    input,
    { useCase, temperature: 0.7 }
  );
  
  if (!modelResult.success) {
    await addLog(campaignId, stageId, 'model-router', 'error', `Stage failed: ${modelResult.errorMessage}`);
    
    return {
      success: false,
      output: modelResult.output,
      outputFile: null,
      validationResult: null,
      paused: requiresHumanApproval,
      modelResult,
      error: modelResult.errorMessage
    };
  }
  
  // Validate output if validator provided
  let validationResult: ValidationResult | null = null;
  if (validator) {
    validationResult = await validator(modelResult.output);
    
    if (!validationResult.valid) {
      // Log validation failure
      await addLog(
        campaignId, 
        stageId, 
        'model-router', 
        'warning', 
        `Validation failed: ${validationResult.errors.join(', ')}`
      );
      
      // Return with validation error - could trigger retry in production
      return {
        success: false,
        output: modelResult.output,
        outputFile: null,
        validationResult,
        paused: false,
        modelResult,
        error: `Output validation failed: ${validationResult.errors.join(', ')}`
      };
    }
  }
  
  // Determine output type
  const outputType = getOutputType(stageId);
  
  // Save output
  let outputFile: string | null = null;
  let outputSaved = false;
  try {
    outputFile = await saveStageOutput(campaignSlug, stageId, modelResult.output, outputType);
    outputSaved = true;
    await addLog(campaignId, stageId, 'model-router', 'info', `Output saved to: ${outputFile}`);
  } catch (saveError) {
    await addLog(campaignId, stageId, 'model-router', 'error', `Failed to save output: ${saveError}`);
  }
  
  // Detect dry-run mode from output content
  const isDryRun = isDryRunOutput(modelResult.output);
  
  // Log model usage
  const promptVersion = getPromptVersionForStage(stageId) ?? undefined;
  logModelRun({
    timestamp: new Date().toISOString(),
    contextType: 'campaign_stage',
    stageId,
    primaryModel: routingInfo.primary || '',
    modelUsed: modelResult.modelUsed,
    provider: modelResult.provider,
    fallbackUsed: modelResult.fallbackUsed,
    fallbackReason: modelResult.fallbackReason,
    retryCount: modelResult.retryCount,
    status: modelResult.success ? 'success' : 'failed',
    durationMs: modelResult.durationMs,
    validationStatus: validationResult?.valid ? 'passed' : validationResult ? 'failed' : 'skipped',
    outputFile: outputFile || undefined,
    promptVersion
  });
  
  // Handle S7 human gate pause
  if (requiresHumanApproval && outputSaved && !isDryRun) {
    // Save initial approval state as "waiting"
    await saveHumanApprovalState(campaignSlug, {
      stageId: stageId,
      status: 'waiting',
      selectedAngleId: null,
      selectedAngleTitle: null,
      approvedBy: null,
      approvedAt: null,
      notes: 'Awaiting human selection',
      provenanceStatus: 'unknown',
      provenanceWarning: 'Run mode unavailable at stageExecutor write site',
      runMode: null,
      source: 'stage_executor',
      schemaVersion: 1,
    });
    
    await addLog(campaignId, stageId, 'human-gate', 'info', 'Workflow paused for human approval');
    
    return {
      success: true,
      output: modelResult.output,
      outputFile,
      validationResult,
      paused: true,
      modelResult
    };
  }
  
  return {
    success: true,
    output: modelResult.output,
    outputFile,
    validationResult,
    paused: false,
    modelResult
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function buildPrompt(template: string, input: Record<string, unknown>): string {
  // Simple template replacement
  let prompt = template;
  
  // Add input context
  prompt += '\n\n## Input Data\n';
  prompt += JSON.stringify(input, null, 2);
  
  return prompt;
}

export function getOutputType(stageId: string): 'json' | 'markdown' | 'csv' {
  const jsonPrefixes = ['S1_', 'S2_', 'S3_', 'S4A_', 'S4B_', 'S9_', 'S13_', 'S16_'];
  const csvPrefixes = ['S8_'];
  
  if (jsonPrefixes.some(p => stageId.startsWith(p))) return 'json';
  if (csvPrefixes.some(p => stageId.startsWith(p))) return 'csv';
  return 'markdown';
}

// =============================================================================
// RESUME FROM S8
// =============================================================================

export async function resumeWorkflowFromS8(
  campaignId: string,
  campaignSlug: string,
  selectedAngle: string
): Promise<{ success: boolean; error?: string }> {
  // Check if human has approved
  const resumeCheck = await checkCanResumeFromS8(campaignSlug);
  
  if (!resumeCheck.canResume) {
    return { success: false, error: resumeCheck.reason };
  }
  
  // Update human approval state to approved
  const approvalState = await getHumanApprovalState(campaignSlug);
  if (approvalState) {
    await saveHumanApprovalState(campaignSlug, {
      ...approvalState,
      status: 'approved',
      selectedAngleTitle: selectedAngle,
      approvedAt: new Date().toISOString(),
      provenanceStatus: 'unknown',
      provenanceWarning: 'Run mode unavailable at stageExecutor write site',
      runMode: null,
      source: 'stage_executor',
      schemaVersion: 1,
    });
  }
  
  // Log resume event
  await addLog(campaignId, 'S8', 'workflow', 'info', `Workflow resumed from S8 with angle: ${selectedAngle}`);
  
  return { success: true };
}

// =============================================================================
// EXPORTS
// =============================================================================

const stageExecutorExports = {
  loadStagePrompt,
  validateJsonOutput,
  validateMarkdownSections,
  validateJournalistCsv,
  saveStageOutput,
  saveHumanApprovalState,
  getHumanApprovalState,
  checkCanResumeFromS8,
  executeStage,
  resumeWorkflowFromS8
};

export default stageExecutorExports;