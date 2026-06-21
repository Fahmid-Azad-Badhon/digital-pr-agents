/**
 * =============================================================================
 * MODEL ROUTING CONFIG - Derived from Single Source of Truth
 * =============================================================================
 * 
 * This config is derived from /system/ JSON files.
 * Edit the JSON files in /system/ to change routing.
 * 
 * =============================================================================
 */

import { 
  SYSTEM_MODELS, 
  SYSTEM_STAGE_ROUTING, 
  SYSTEM_DASHBOARD_ROUTING,
  getSystemModel,
  getSystemStageRouting,
  getSystemDashboardRouting,
  isModelEnabledInProduction,
  isModelRestrictedForUseCase,
  SYSTEM_VERSION,
  SYSTEM_LAST_UPDATED
} from '@/lib/systemConfigLoader';

export { SYSTEM_VERSION, SYSTEM_LAST_UPDATED };

// =============================================================================
// MODEL DEFINITIONS - Derived from /system/model-routing.config.json
// =============================================================================

export interface ModelConfig {
  key: string;
  displayName: string;
  provider: 'openrouter';
  modelId: string;
  role: string;
  timeoutMs: number;
  maxRetries: number;
  allowedUseCases: string[];
  restrictedTo?: string[];
  enabledInProductionWorkflow: boolean;
  costLevel: 'free' | 'low' | 'medium' | 'high';
  speedLevel: 'fast' | 'medium' | 'slow';
}

export const MODEL_CONFIG: Record<string, ModelConfig> = Object.fromEntries(
  Object.entries(SYSTEM_MODELS).map(([key, model]) => [
    key,
    {
      key: model.key,
      displayName: model.displayName,
      provider: model.provider as 'openrouter',
      modelId: model.modelId,
      role: model.role,
      timeoutMs: model.timeoutMs,
      maxRetries: model.maxRetries,
      allowedUseCases: model.allowedUseCases,
      restrictedTo: model.restrictedTo,
      enabledInProductionWorkflow: model.enabledInProductionWorkflow,
      costLevel: model.costLevel as 'free' | 'low' | 'medium' | 'high',
      speedLevel: model.speedLevel as 'fast' | 'medium' | 'slow'
    }
  ])
) as Record<string, ModelConfig>;

// =============================================================================
// CAMPAIGN STAGE ROUTING - Derived from /system/model-routing.config.json
// =============================================================================

export interface StageRoutingConfig {
  primary: string;
  fallback1: string;
  fallback2: string;
  mandatoryReviewer?: string;
  requiresHumanApproval?: boolean;
  specialInstructions?: string;
}

export const CAMPAIGN_STAGE_ROUTING: Record<string, StageRoutingConfig> = SYSTEM_STAGE_ROUTING;

// =============================================================================
// DASHBOARD ROUTING - Derived from /system/model-routing.config.json
// =============================================================================

export interface DashboardFeatureRouting {
  primary: string;
  fallback1?: string;
  fallback2?: string;
}

// Derived from JSON + dashboard modes not in JSON
export const DASHBOARD_ROUTING: Record<string, DashboardFeatureRouting> = {
  ...SYSTEM_DASHBOARD_ROUTING,
  dashboard_default_assistant: {
    primary: 'gpt_oss_120b',
    fallback1: 'nemotron_3_ultra',
    fallback2: 'nemotron_3_super'
  },
  dashboard_fast_mode: {
    primary: 'nemotron_3_nano_30b',
    fallback1: 'minimax_m25'
  },
  dashboard_strategy_mode: {
    primary: 'nemotron_3_ultra',
    fallback1: 'gpt_oss_120b',
    fallback2: 'nemotron_3_super'
  },
  dashboard_research_mode: {
    primary: 'nemotron_3_super',
    fallback1: 'gpt_oss_120b',
    fallback2: 'nemotron_3_ultra'
  },
  dashboard_writing_mode: {
    primary: 'minimax_m25',
    fallback1: 'hermes_3_405b'
  },
  dashboard_editorial_mode: {
    primary: 'hermes_3_405b',
    fallback1: 'minimax_m25',
    fallback2: 'gpt_oss_120b'
  },
  dashboard_multimodal_mode: {
    primary: 'gemma_4_31b',
    fallback1: 'nemotron_3_super',
    fallback2: 'gpt_oss_120b'
  },
  dashboard_visual_mode: {
    primary: 'gemma_4_31b'
  }
};

// =============================================================================
// GLOBAL FALLBACK CHAINS
// =============================================================================

export const GLOBAL_FALLBACK_CHAINS: Record<string, string[]> = {
  text_reasoning: ['nemotron_3_ultra', 'gpt_oss_120b', 'nemotron_3_super', 'minimax_m25'],
  research: ['nemotron_3_super', 'nemotron_3_ultra', 'gpt_oss_120b', 'qwen3_coder'],
  production: ['minimax_m25', 'hermes_3_405b', 'gpt_oss_120b'],
  validation: ['gpt_oss_120b', 'nemotron_3_ultra', 'qwen3_coder', 'nemotron_3_super'],
  utility: ['nemotron_3_nano_30b', 'qwen3_coder', 'minimax_m25'],
  multimodal: ['gemma_4_31b', 'nemotron_3_super', 'gpt_oss_120b']
};

// =============================================================================
// TIMEOUT & RETRY SETTINGS
// =============================================================================

export const ROUTER_SETTINGS = {
  defaultMaxRetries: 2,
  defaultRetryDelayMs: 2000,
  exponentialBackoffMultiplier: 2,
  defaultTimeoutMs: 120000,
  fastTimeoutMs: 60000,
  slowTimeoutMs: 180000,
  rateLimitRPM: 30,
  minRequestIntervalMs: 2000,
  fallbackTriggers: {
    apiError: true,
    timeout: true,
    rateLimit: true,
    emptyOutput: true,
    invalidJson: true,
    schemaValidationFailed: true,
    unsafeModelUsage: true,
    unsupportedOutputFormat: true,
    missingRequiredFields: true,
    hallucinationRiskDetected: true,
    modelBlockedOrUnavailable: true
  },
  modelRestrictions: {
    nemotron_3_nano_30b: {
      enabledInProductionWorkflow: true,
      allowedUseCases: ['bulk_classification', 'prefiltering', 'relevance_filtering', 'low_cost_checks', 'deduplication', 'simple_classification', 'short_summary'],
      blockedUseCases: ['final_validation', 'serious_data_extraction', 'final_pitch_scoring', 'journalist_intelligence_synthesis', 'strategy', 'orchestration']
    },
    gemma_4_31b: {
      enabledInProductionWorkflow: true,
      allowedUseCases: ['multimodal_input_extraction', 'image_extraction', 'screenshot_extraction', 'chart_extraction', 'chart_image_interpretation', 'document_understanding'],
      blockedUseCases: ['final_copywriting', 'pitch_drafting', 'validation', 'research_synthesis', 'text_reasoning', 'writing']
    }
  } as const,
  provider: {
    openrouter: {
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKeyEnvVar: 'OPENROUTER_API_KEY',
      defaultReferer: 'https://digital-pr-dashboard.com',
      defaultTitle: 'Digital PR Dashboard'
    }
  }
};

// =============================================================================
// OUTPUT FILE MAPPING
// =============================================================================

export const STAGE_OUTPUT_FILES: Record<string, string> = {
  S1_CAMPAIGN_INTAKE: '00-brief.md',
  S2_DATA_EXTRACTION: '01-study-notes.md',
  S3_RESEARCH_ENRICHMENT: '03-research.md',
  S4A_DATA_RESEARCH_ANALYST: 'verified-findings.json',
  S4B_INSIGHT_ANALYST: 'InsightAnalysisMap.json',
  S5_ANGLE_GENERATION: '04-angles.md',
  S6_BEAT_MATCHING: '05-beats.md',
  S7_PITCH_SELECTION_HUMAN_GATE: '07-selected-angle.md',
  S8_JOURNALIST_COLLECTION: '06-journalist-intel.md',
  S9_JOURNALIST_INTELLIGENCE: '06-journalist-intel.md',
  S10_PITCH_DRAFTING: '08-pitch-draft.md',
  S11_PITCH_OPTIMIZATION: '09-optimized-email.md',
  S12_PACKAGE_ASSEMBLY: '10-google-doc.md',
  S13_VALIDATION: 'validation-results.json',
  S14_FINAL_FORMATTING: '10-google-doc.md',
  S15_OUTREACH_ASSET_CREATION: '11-follow-ups.md',
  S16_CAMPAIGN_LOG_LEARNING_LOOP: 'campaign-log.json'
};

// =============================================================================
// EXPORTS - Re-export from systemConfigLoader
// =============================================================================

export function getModelConfig(key: string): ModelConfig | undefined {
  return MODEL_CONFIG[key];
}

export function getStageRouting(stageId: string): StageRoutingConfig | undefined {
  return CAMPAIGN_STAGE_ROUTING[stageId];
}

export function getDashboardRouting(featureId: string): DashboardFeatureRouting | undefined {
  return DASHBOARD_ROUTING[featureId];
}

export function isModelAllowedForUseCase(modelKey: string, useCase: string): boolean {
  const config = MODEL_CONFIG[modelKey];
  if (!config) return false;
  
  if (config.restrictedTo && config.restrictedTo.length > 0) {
    if (!config.restrictedTo.includes(useCase)) {
      return false;
    }
  }
  
  return config.allowedUseCases.includes(useCase);
}

export function isModelEnabledInProductionWrapper(modelKey: string): boolean {
  return isModelEnabledInProduction(modelKey);
}

export default {
  MODEL_CONFIG,
  CAMPAIGN_STAGE_ROUTING,
  DASHBOARD_ROUTING,
  GLOBAL_FALLBACK_CHAINS,
  ROUTER_SETTINGS,
  STAGE_OUTPUT_FILES,
  getModelConfig,
  getStageRouting,
  getDashboardRouting,
  isModelAllowedForUseCase,
  isModelEnabledInProduction: isModelEnabledInProductionWrapper
};
