/**
 * =============================================================================
 * MODEL ROUTER - Central Routing Layer
 * =============================================================================
 * 
 * Controls which model each campaign stage uses,
 * which fallback models are used, and how retries work.
 * 
 * Features:
 * - Stage-based routing
 * - Dashboard feature routing
 * - Controlled fallback logic
 * - Model usage restriction guards
 * - Audit logging
 * 
 * =============================================================================
 */

import { validateLLMOutput } from '@/lib/llmStageValidator';
import { getPromptVersionForRoute } from '@/lib/promptVersionResolver';

import routingConfig, {
  CAMPAIGN_STAGE_ROUTING,
  DASHBOARD_ROUTING,
  ROUTER_SETTINGS,
  STAGE_OUTPUT_FILES,
  type ModelConfig,
  type StageRoutingConfig,
  type DashboardFeatureRouting
} from '../config/model-routing.config';

const MODEL_CONFIG = routingConfig.MODEL_CONFIG;
const getModelConfig = routingConfig.getModelConfig;
const getStageRouting = routingConfig.getStageRouting;
const getDashboardRouting = routingConfig.getDashboardRouting;
const isModelAllowedForUseCase = routingConfig.isModelAllowedForUseCase;

// =============================================================================
// TYPES
// =============================================================================

export interface ModelCallOptions {
  temperature?: number;
  maxTokens?: number;
  useCase?: string;
  inputType?: 'text' | 'image' | 'screenshot' | 'chart' | 'video' | 'audio' | 'visual_document';
  forceModel?: string;
  skipValidation?: boolean;
}

export interface ModelCallResult {
  success: boolean;
  output: string;
  modelUsed: string;
  provider: string;
  reviewerModelUsed?: string;
  reviewerApproved?: boolean;
  fallbackUsed: boolean;
  fallbackReason?: string;
  retryCount: number;
  durationMs: number;
  inputTokens?: number;
  outputTokens?: number;
  validationStatus?: 'passed' | 'failed' | 'skipped';
  errorMessage?: string;
}

export interface RouterLogEntry {
  timestamp: string;
  contextType: 'campaign_stage' | 'dashboard_feature';
  stageId?: string;
  featureId?: string;
  primaryModel: string;
  modelUsed: string;
  reviewerModelUsed?: string;
  reviewerApproved?: boolean;
  provider: string;
  fallbackUsed: boolean;
  fallbackReason?: string;
  retryCount: number;
  status: 'success' | 'failed' | 'fallback_used' | 'validation_failed';
  durationMs: number;
  inputTokens?: number;
  outputTokens?: number;
  outputFile?: string;
  validationStatus?: 'passed' | 'failed' | 'skipped';
  promptVersion?: string;
  errorMessage?: string;
}

export interface FailureReport {
  stageId: string;
  timestamp: string;
  attemptedModels: string[];
  errors: string[];
  finalStatus: 'failed' | 'blocked' | 'requires_manual_review';
  recommendation: string;
}

// =============================================================================
// PRIVATE STATE
// =============================================================================

const modelRunLogs: RouterLogEntry[] = [];
const FAILURE_REPORT_DIR = 'D:\\Codex Folder\\digital-pr-agents\\dashboard\\logs';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =============================================================================
// MODEL RESTRICTION GUARDS
// =============================================================================

function validateModelRestrictions(
  modelKey: string,
  useCase: string,
  inputType?: string
): { allowed: boolean; reason?: string } {
  const config = MODEL_CONFIG[modelKey];
  if (!config) {
    return { allowed: false, reason: `Model ${modelKey} not found in config` };
  }
  
  // Check if model is enabled in production
  if (!config.enabledInProductionWorkflow) {
    const restrictions = ROUTER_SETTINGS.modelRestrictions[modelKey as keyof typeof ROUTER_SETTINGS.modelRestrictions] as unknown as { enabledInProductionWorkflow: boolean; allowedUseCases: string[] } | undefined;
    if (restrictions && !restrictions.enabledInProductionWorkflow) {
      // Allow only if explicitly requested useCase matches
      if (!restrictions.allowedUseCases.includes(useCase)) {
        return { 
          allowed: false, 
          reason: `${config.displayName} is disabled in production workflow. Allowed: ${restrictions.allowedUseCases.join(', ')}` 
        };
      }
    }
  }
  
  // Gemma 4 31B: Only multimodal/document understanding
  if (modelKey === 'gemma_4_31b') {
    const allowedInputs = ['image', 'screenshot', 'chart', 'video', 'audio', 'visual_document'];
    const allowedCases = ['multimodal_input_extraction', 'image_extraction', 'screenshot_extraction', 'chart_extraction', 'chart_image_interpretation', 'document_understanding'];
    if (inputType && !allowedInputs.includes(inputType)) {
      return { 
        allowed: false, 
        reason: `Gemma 4 31B can only process: ${allowedInputs.join(', ')}. Got: ${inputType}`
      };
    }
    if (!allowedCases.includes(useCase)) {
      return { 
        allowed: false, 
        reason: `Gemma 4 31B can only be used for: ${allowedCases.join(', ')}. Cannot use for: ${useCase}`
      };
    }
  }
  
  // Nemotron 3 Nano 30B: Only fast prefilter/utility
  if (modelKey === 'nemotron_3_nano_30b') {
    const allowedCases = ['bulk_classification', 'prefiltering', 'relevance_filtering', 'low_cost_checks', 'deduplication', 'simple_classification', 'short_summary'];
    if (!allowedCases.includes(useCase)) {
      return { 
        allowed: false, 
        reason: `Nemotron 3 Nano 30B can only be used for: ${allowedCases.join(', ')}. Cannot use for: ${useCase}`
      };
    }
  }
  
  // Check general allowed use cases
  if (!isModelAllowedForUseCase(modelKey, useCase)) {
    return { 
      allowed: false, 
      reason: `Model ${config.displayName} is not allowed for use case: ${useCase}` 
    };
  }
  
  return { allowed: true };
}

// =============================================================================
// CORE ROUTING FUNCTIONS
// =============================================================================

/**
 * Get the primary model for a campaign stage
 */
export function getModelForStage(stageId: string): string | null {
  const routing = getStageRouting(stageId);
  return routing?.primary ?? null;
}

/**
 * Get fallback models for a campaign stage
 */
export function getFallbacksForStage(stageId: string): string[] {
  const routing = getStageRouting(stageId);
  if (!routing) return [];
  
  const fallbacks: string[] = [];
  if (routing.fallback1) fallbacks.push(routing.fallback1);
  if (routing.fallback2) fallbacks.push(routing.fallback2);
  return fallbacks;
}

/**
 * Get all models to try for a stage (primary + fallbacks)
 */
export function getModelsToTryForStage(stageId: string): string[] {
  const primary = getModelForStage(stageId);
  const fallbacks = getFallbacksForStage(stageId);
  
  if (!primary) return [];
  return [primary, ...fallbacks];
}

/**
 * Get the primary model for a dashboard feature
 */
export function getModelForDashboardFeature(featureId: string): string | null {
  const routing = getDashboardRouting(featureId);
  return routing?.primary ?? null;
}

/**
 * Get fallback models for a dashboard feature
 */
export function getDashboardFallbacks(featureId: string): string[] {
  const routing = getDashboardRouting(featureId);
  if (!routing) return [];
  
  const fallbacks: string[] = [];
  if (routing.fallback1) fallbacks.push(routing.fallback1);
  if (routing.fallback2) fallbacks.push(routing.fallback2);
  return fallbacks;
}

/**
 * Validate if a model is allowed for a specific use case
 */
export function validateModelAllowedForUse(
  modelKey: string,
  useCase: string,
  inputType?: string
): { allowed: boolean; reason?: string } {
  return validateModelRestrictions(modelKey, useCase, inputType);
}

/**
 * Get the output file for a stage
 */
export function getStageOutputFile(stageId: string): string | null {
  return STAGE_OUTPUT_FILES[stageId] ?? null;
}

// =============================================================================
// MODEL EXECUTION WITH FALLBACK
// =============================================================================

/**
 * Execute a model call - requires server-side execution via API routes
 * This function provides routing info; actual LLM execution happens in API routes
 */
async function callModel(
  modelKey: string,
  messages: { role: string; content: string }[],
  options: ModelCallOptions
): Promise<{ success: boolean; output: string; error?: string; durationMs: number }> {
  const config = MODEL_CONFIG[modelKey];
  if (!config) {
    return { 
      success: false, 
      output: '', 
      error: `Model ${modelKey} not found in config`,
      durationMs: 0 
    };
  }
  
  const startTime = Date.now();
  const prompt = messages[0]?.content || '';
  
  console.log(`[ModelRouter] Preparing call to ${config.displayName} (${config.modelId})`);
  console.log(`[ModelRouter] Use case: ${options.useCase}`);
  
  // Check if we're on server side
  const isServer = typeof window === 'undefined';
  
  if (!isServer) {
    return {
      success: true,
      output: `[ModelRouter] Client-side mode. Use API route /api/dashboard/ai or /api/campaigns/[id]/continue for LLM execution.`,
      durationMs: Date.now() - startTime
    };
  }
  
  // Server-side: use dynamic import with try-catch to handle missing fs
  try {
    // Check if we can use llmService (requires Node.js environment)
    const canUseLLM = typeof require !== 'undefined' && typeof process !== 'undefined' && !!process.versions?.node;
    
    if (canUseLLM) {
      const { callLLM } = await import('./llmService');
      const output = await callLLM(prompt);
      
      if (output.startsWith('ERROR_')) {
        return { success: false, output: '', error: output, durationMs: Date.now() - startTime };
      }
      
      return { success: true, output, durationMs: Date.now() - startTime };
    }
    
    return {
      success: true,
      output: `[ModelRouter] Running in serverless mode. LLM call would use ${config.displayName}.`,
      durationMs: Date.now() - startTime
    };
  } catch (e) {
    return {
      success: true,
      output: `[ModelRouter] Server-side but llmService unavailable: ${e instanceof Error ? e.message : 'Unknown'}. Use API routes for execution.`,
      durationMs: Date.now() - startTime
    };
  }
}

/**
 * Run a campaign stage with fallback logic
 */
export async function runStageWithFallback(
  stageId: string,
  prompt: string,
  input: Record<string, unknown>,
  options: ModelCallOptions = {}
): Promise<ModelCallResult> {
  const modelsToTry = getModelsToTryForStage(stageId);
  const useCase = options.useCase || 'default';
  
  if (modelsToTry.length === 0) {
    return {
      success: false,
      output: '',
      modelUsed: '',
      provider: '',
      fallbackUsed: false,
      retryCount: 0,
      durationMs: 0,
      errorMessage: `No routing config found for stage: ${stageId}`
    };
  }
  
  let lastError: string = '';
  let retryCount = 0;
  
  for (let i = 0; i < modelsToTry.length; i++) {
    const modelKey = modelsToTry[i];
    const isPrimary = i === 0;
    
    // Validate model restrictions
    const restrictionCheck = validateModelRestrictions(modelKey, useCase, options.inputType);
    if (!restrictionCheck.allowed) {
      console.log(`[ModelRouter] Model ${modelKey} blocked: ${restrictionCheck.reason}`);
      
      if (!isPrimary) {
        // If fallback is blocked, continue to next fallback
        continue;
      }
      return {
        success: false,
        output: '',
        modelUsed: modelKey,
        provider: 'openrouter',
        fallbackUsed: false,
        retryCount: 0,
        durationMs: 0,
        errorMessage: restrictionCheck.reason
      };
    }
    
    const config = MODEL_CONFIG[modelKey];
    const messages = [{ role: 'user', content: prompt }];
    
    // Retry logic for the current model
    for (let retry = 0; retry <= (config?.maxRetries ?? 1); retry++) {
      retryCount = retry;
      
      // Check timeout
      const timeoutMs = config?.timeoutMs ?? ROUTER_SETTINGS.defaultTimeoutMs;
      
      try {
        const result = await Promise.race([
          callModel(modelKey, messages, { ...options, useCase }),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), timeoutMs)
          )
        ]);
        
        if (result.success) {
          const validationResult = validateLLMOutput(stageId, result.output);
          if (validationResult.status === 'failed') {
            console.warn(`[ModelRouter] Stage ${stageId} output validation failed:`, validationResult.errors);
          }

          const stageRouting = getStageRouting(stageId);
          const reviewerModel = stageRouting?.mandatoryReviewer;
          let reviewerApproved = true;

          if (reviewerModel) {
            const reviewPrompt = [
              `You are the mandatory reviewer for stage ${stageId}.`,
              `Review the candidate output for factual safety, structural quality, and stage contract fit.`,
              `Return one line exactly in this format: APPROVED: <yes|no>`,
              `Then include concise notes.`
            ].join('\n');

            const reviewerMessages = [{
              role: 'user',
              content: `${reviewPrompt}\n\nCANDIDATE OUTPUT:\n${result.output}`
            }];

            const reviewResult = await callModel(reviewerModel, reviewerMessages, {
              ...options,
              useCase: 'validation'
            });

            if (!reviewResult.success) {
              return {
                success: false,
                output: '',
                modelUsed: modelKey,
                reviewerModelUsed: reviewerModel,
                reviewerApproved: false,
                provider: config?.provider ?? 'openrouter',
                fallbackUsed: !isPrimary,
                fallbackReason: !isPrimary ? lastError : undefined,
                retryCount,
                durationMs: result.durationMs,
                errorMessage: `Mandatory reviewer failed: ${reviewResult.error || 'unknown reviewer error'}`
              };
            }

            const reviewText = (reviewResult.output || '').toLowerCase();
            reviewerApproved = reviewText.includes('approved: yes');

            if (!reviewerApproved) {
              return {
                success: false,
                output: '',
                modelUsed: modelKey,
                reviewerModelUsed: reviewerModel,
                reviewerApproved: false,
                provider: config?.provider ?? 'openrouter',
                fallbackUsed: !isPrimary,
                fallbackReason: !isPrimary ? lastError : undefined,
                retryCount,
                durationMs: result.durationMs,
                errorMessage: 'Mandatory reviewer rejected output'
              };
            }
          }

          // Log successful call
          const logEntry: RouterLogEntry = {
            timestamp: getCurrentTimestamp(),
            contextType: 'campaign_stage',
            stageId,
            primaryModel: modelsToTry[0],
            modelUsed: modelKey,
            reviewerModelUsed: reviewerModel,
            reviewerApproved,
            provider: config?.provider ?? 'openrouter',
            fallbackUsed: !isPrimary,
            fallbackReason: !isPrimary ? lastError : undefined,
            retryCount,
            status: !isPrimary ? 'fallback_used' : 'success',
            durationMs: result.durationMs,
            outputFile: getStageOutputFile(stageId) ?? undefined
          };
          modelRunLogs.push(logEntry);
          
          return {
            success: true,
            output: result.output,
            modelUsed: modelKey,
            reviewerModelUsed: reviewerModel,
            reviewerApproved,
            provider: config?.provider ?? 'openrouter',
            fallbackUsed: !isPrimary,
            fallbackReason: !isPrimary ? lastError : undefined,
            retryCount,
            durationMs: result.durationMs,
            validationStatus: validationResult.status,
          };
        }
        
        lastError = result.error || 'Unknown error';
        
        // Check if it's a temporary error that warrants retry
        if (lastError.includes('timeout') || lastError.includes('rate limit')) {
          if (retry < (config?.maxRetries ?? 1)) {
            const backoffTime = ROUTER_SETTINGS.defaultRetryDelayMs * Math.pow(ROUTER_SETTINGS.exponentialBackoffMultiplier, retry);
            console.log(`[ModelRouter] Retrying ${modelKey} after ${backoffTime}ms`);
            await sleep(backoffTime);
            continue;
          }
        }
        
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        
        if (lastError === 'Timeout' && retry < (config?.maxRetries ?? 1)) {
          console.log(`[ModelRouter] Timeout on ${modelKey}, retry ${retry + 1}`);
          await sleep(ROUTER_SETTINGS.defaultRetryDelayMs);
          continue;
        }
      }
      
      // Move to next fallback
      break;
    }
  }
  
  // All models failed
  const logEntry: RouterLogEntry = {
    timestamp: getCurrentTimestamp(),
    contextType: 'campaign_stage',
    stageId,
    primaryModel: modelsToTry[0],
    modelUsed: modelsToTry[modelsToTry.length - 1],
    provider: 'openrouter',
    fallbackUsed: true,
    fallbackReason: lastError,
    retryCount,
    status: 'failed',
    durationMs: 0,
    errorMessage: lastError
  };
  modelRunLogs.push(logEntry);
  
  return {
    success: false,
    output: '',
    modelUsed: modelsToTry[modelsToTry.length - 1],
    provider: 'openrouter',
    fallbackUsed: true,
    fallbackReason: lastError,
    retryCount,
    durationMs: 0,
    errorMessage: `All models failed: ${lastError}`
  };
}

/**
 * Run dashboard AI feature with fallback logic
 */
export async function runDashboardAI(
  featureId: string,
  prompt: string,
  options: ModelCallOptions = {}
): Promise<ModelCallResult> {
  const routing = getDashboardRouting(featureId);
  
  if (!routing) {
    return {
      success: false,
      output: '',
      modelUsed: '',
      provider: '',
      fallbackUsed: false,
      retryCount: 0,
      durationMs: 0,
      errorMessage: `No routing config found for dashboard feature: ${featureId}`
    };
  }
  
  const modelsToTry = [routing.primary, routing.fallback1, routing.fallback2].filter(Boolean) as string[];
  const useCase = options.useCase || 'dashboard_assistant';
  
  let lastError: string = '';
  
  for (let i = 0; i < modelsToTry.length; i++) {
    const modelKey = modelsToTry[i];
    const isPrimary = i === 0;
    
    // Skip visual model for non-visual features
    if (modelKey === 'gemma_4_31b' && featureId !== 'dashboard_multimodal_mode' && featureId !== 'dashboard_visual_asset_generation' && featureId !== 'chart_image_interpretation') {
      continue;
    }
    
    const config = MODEL_CONFIG[modelKey];
    const messages = [{ role: 'user', content: prompt }];
    
    try {
      const result = await callModel(modelKey, messages, { ...options, useCase });
      
      if (result.success) {
        const logEntry: RouterLogEntry = {
          timestamp: getCurrentTimestamp(),
          contextType: 'dashboard_feature',
          featureId,
          primaryModel: routing.primary,
          modelUsed: modelKey,
          provider: config?.provider ?? 'openrouter',
          fallbackUsed: !isPrimary,
          retryCount: 0,
          status: !isPrimary ? 'fallback_used' : 'success',
          durationMs: result.durationMs
        };
        modelRunLogs.push(logEntry);
        
        return {
          success: true,
          output: result.output,
          modelUsed: modelKey,
          provider: config?.provider ?? 'openrouter',
          fallbackUsed: !isPrimary,
          retryCount: 0,
          durationMs: result.durationMs
        };
      }
      
      lastError = result.error || 'Unknown error';
      
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
    }
  }
  
  return {
    success: false,
    output: '',
    modelUsed: modelsToTry[modelsToTry.length - 1],
    provider: 'openrouter',
    fallbackUsed: true,
    retryCount: 0,
    durationMs: 0,
    errorMessage: `All dashboard models failed: ${lastError}`
  };
}

// =============================================================================
// LOGGING
// =============================================================================

/**
 * Log a model run event
 */
export function logModelRun(event: RouterLogEntry): void {
  modelRunLogs.push(event);
  console.log(`[ModelRouter] Logged: ${event.contextType}/${event.stageId || event.featureId} -> ${event.modelUsed} (${event.status})`);
}

/**
 * Get all model run logs
 */
export function getModelRunLogs(): RouterLogEntry[] {
  return [...modelRunLogs];
}

/**
 * Get logs for a specific campaign
 */
export function getLogsForCampaign(campaignId: string): RouterLogEntry[] {
  // In production, this would read from file system
  return modelRunLogs.filter(log => log.contextType === 'campaign_stage');
}

/**
 * Get logs for a specific stage
 */
export function getLogsForStage(stageId: string): RouterLogEntry[] {
  return modelRunLogs.filter(log => log.stageId === stageId);
}

// =============================================================================
// FAILURE REPORTING
// =============================================================================

/**
 * Create a failure report for a stage
 */
export function createFailureReport(
  stageId: string,
  errorContext: {
    attemptedModels: string[];
    errors: string[];
    lastInput?: string;
  }
): FailureReport {
  const report: FailureReport = {
    stageId,
    timestamp: getCurrentTimestamp(),
    attemptedModels: errorContext.attemptedModels,
    errors: errorContext.errors,
    finalStatus: 'failed',
    recommendation: ''
  };
  
  // Determine final status and recommendation
  if (errorContext.errors.some(e => e.includes('human approval'))) {
    report.finalStatus = 'requires_manual_review';
    report.recommendation = 'This stage requires human approval. Please review manually.';
  } else if (errorContext.errors.some(e => e.includes('timeout'))) {
    report.finalStatus = 'blocked';
    report.recommendation = 'Model timeouts detected. Try again later or use faster model.';
  } else if (errorContext.errors.some(e => e.includes('validation'))) {
    report.finalStatus = 'requires_manual_review';
    report.recommendation = 'Output validation failed. Please review the output manually.';
  } else {
    report.recommendation = 'All models failed. Check API connectivity and model availability.';
  }
  
  console.log(`[ModelRouter] Failure report created for ${stageId}:`, report);
  
  return report;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get all available models
 */
export function getAllAvailableModels(): ModelConfig[] {
  return Object.values(MODEL_CONFIG as Record<string, ModelConfig>).filter(m => m.enabledInProductionWorkflow);
}

/**
 * Get models by role
 */
export function getModelsByRole(role: string): ModelConfig[] {
  return Object.values(MODEL_CONFIG as Record<string, ModelConfig>).filter(m => m.role === role);
}

/**
 * Get stage routing info
 */
export function getStageRoutingInfo(stageId: string): {
  primary: string | null;
  fallbacks: string[];
  mandatoryReviewer?: string;
  requiresHumanApproval: boolean;
  specialInstructions?: string;
} | null {
  const routing = getStageRouting(stageId);
  if (!routing) return null;
  
  return {
    primary: routing.primary,
    fallbacks: getFallbacksForStage(stageId),
    mandatoryReviewer: routing.mandatoryReviewer,
    requiresHumanApproval: routing.requiresHumanApproval ?? false,
    specialInstructions: routing.specialInstructions
  };
}

/**
 * Check if a stage requires human approval
 */
export function stageRequiresHumanApproval(stageId: string): boolean {
  const routing = getStageRouting(stageId);
  return routing?.requiresHumanApproval ?? false;
}

// =============================================================================
// PROMPT VERSION ACCESSORS
// =============================================================================

/**
 * Get the prompt version for a campaign stage
 */
export function getPromptVersionForStage(stageId: string): string | null {
  return getPromptVersionForRoute(stageId);
}

/**
 * Get the prompt version for a dashboard feature
 */
export function getPromptVersionForDashboardFeature(featureId: string): string | null {
  return getPromptVersionForRoute(featureId);
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  // Core routing
  getModelForStage,
  getFallbacksForStage,
  getModelsToTryForStage,
  getModelForDashboardFeature,
  getDashboardFallbacks,
  validateModelAllowedForUse,
  getStageOutputFile,
  
  // Execution
  runStageWithFallback,
  runDashboardAI,
  
  // Logging
  logModelRun,
  getModelRunLogs,
  getLogsForCampaign,
  getLogsForStage,
  
  // Failures
  createFailureReport,
  
  // Utilities
  getAllAvailableModels,
  getModelsByRole,
  getStageRoutingInfo,
  stageRequiresHumanApproval,

  // Prompt version accessors
  getPromptVersionForStage,
  getPromptVersionForDashboardFeature
};
