/**
 * =============================================================================
 * MODEL ROUTING TESTS
 * =============================================================================
 * 
 * Tests for:
 * 1. Campaign stage routing
 * 2. Dashboard feature routing
 * 3. Fallback chains
 * 4. Model restrictions
 * 
 * =============================================================================
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getModelForStage,
  getFallbacksForStage,
  getModelsToTryForStage,
  getModelForDashboardFeature,
  getDashboardFallbacks,
  validateModelAllowedForUse,
  getStageRoutingInfo,
  stageRequiresHumanApproval,
  getAllAvailableModels,
  runStageWithFallback,
  getModelRunLogs,
  runDashboardAI
} from '../lib/modelRouter';
import {
  CAMPAIGN_STAGE_ROUTING,
  DASHBOARD_ROUTING,
  MODEL_CONFIG,
  ROUTER_SETTINGS
} from '../config/model-routing.config';
import stageContractsJson from '@system/stage-contracts.json';

// =============================================================================
// CAMPAIGN STAGE ROUTING TESTS
// =============================================================================

describe('Campaign Stage Routing - S1 Campaign Intake', () => {
  it('S1 should use nemotron_3_ultra as primary', () => {
    const model = getModelForStage('S1_CAMPAIGN_INTAKE');
    expect(model).toBe('nemotron_3_ultra');
  });

  it('S1 should have correct fallback chain', () => {
    const fallbacks = getFallbacksForStage('S1_CAMPAIGN_INTAKE');
    expect(fallbacks).toEqual(['nemotron_3_super', 'gpt_oss_120b']);
  });

  it('S1 should return all models to try', () => {
    const models = getModelsToTryForStage('S1_CAMPAIGN_INTAKE');
    expect(models).toEqual(['nemotron_3_ultra', 'nemotron_3_super', 'gpt_oss_120b']);
  });
});

describe('Campaign Stage Routing - S2 Data Extraction', () => {
  it('S2 should use nemotron_3_super as primary', () => {
    const model = getModelForStage('S2_DATA_EXTRACTION');
    expect(model).toBe('nemotron_3_super');
  });

  it('S2 should have correct fallback chain', () => {
    const fallbacks = getFallbacksForStage('S2_DATA_EXTRACTION');
    expect(fallbacks).toEqual(['gpt_oss_120b', 'gemma_4_31b']);
  });
});

describe('Campaign Stage Routing - S5 Angle Generation', () => {
  it('S5 should use nemotron_3_ultra as primary', () => {
    const model = getModelForStage('S5_ANGLE_GENERATION');
    expect(model).toBe('nemotron_3_ultra');
  });

  it('S5 should have hermes_3_405b and gpt_oss_120b as fallbacks', () => {
    const fallbacks = getFallbacksForStage('S5_ANGLE_GENERATION');
    expect(fallbacks).toEqual(['hermes_3_405b', 'gpt_oss_120b']);
  });
});

describe('Campaign Stage Routing - S7 Human Gate', () => {
  it('S7 should use gpt_oss_120b as primary', () => {
    const model = getModelForStage('S7_PITCH_SELECTION_HUMAN_GATE');
    expect(model).toBe('gpt_oss_120b');
  });

  it('S7 should have correct fallback chain', () => {
    const fallbacks = getFallbacksForStage('S7_PITCH_SELECTION_HUMAN_GATE');
    expect(fallbacks).toEqual(['nemotron_3_ultra', 'nemotron_3_super']);
  });

  it('S7 should require human approval', () => {
    const requiresApproval = stageRequiresHumanApproval('S7_PITCH_SELECTION_HUMAN_GATE');
    expect(requiresApproval).toBe(true);
  });

  it('S7 routing info should show requiresHumanApproval', () => {
    const info = getStageRoutingInfo('S7_PITCH_SELECTION_HUMAN_GATE');
    expect(info?.requiresHumanApproval).toBe(true);
  });
});

describe('Campaign Stage Routing - S10 Pitch Drafting', () => {
  it('S10 should use minimax_m25 as primary', () => {
    const model = getModelForStage('S10_PITCH_DRAFTING');
    expect(model).toBe('minimax_m25');
  });

  it('S10 should have hermes_3_405b and gpt_oss_120b as fallbacks', () => {
    const fallbacks = getFallbacksForStage('S10_PITCH_DRAFTING');
    expect(fallbacks).toEqual(['hermes_3_405b', 'gpt_oss_120b']);
  });
});

describe('Campaign Stage Routing - S11 Pitch Optimization', () => {
  it('S11 should use hermes_3_405b as primary', () => {
    const model = getModelForStage('S11_PITCH_OPTIMIZATION');
    expect(model).toBe('hermes_3_405b');
  });

  it('S11 should have minimax_m25 and gpt_oss_120b as fallbacks', () => {
    const fallbacks = getFallbacksForStage('S11_PITCH_OPTIMIZATION');
    expect(fallbacks).toEqual(['minimax_m25', 'gpt_oss_120b']);
  });
});

describe('Campaign Stage Routing - S13 Validation', () => {
  it('S13 should use gpt_oss_120b as primary', () => {
    const model = getModelForStage('S13_VALIDATION');
    expect(model).toBe('gpt_oss_120b');
  });

  it('S13 should have nemotron_3_ultra and qwen3_coder as fallbacks', () => {
    const fallbacks = getFallbacksForStage('S13_VALIDATION');
    expect(fallbacks).toEqual(['nemotron_3_ultra', 'qwen3_coder']);
  });
});

describe('Campaign Stage Routing - S15 Outreach Asset Creation', () => {
  it('S15 should use minimax_m25 as primary', () => {
    const model = getModelForStage('S15_OUTREACH_ASSET_CREATION');
    expect(model).toBe('minimax_m25');
  });

  it('S15 should have hermes_3_405b and gpt_oss_120b fallbacks', () => {
    const fallbacks = getFallbacksForStage('S15_OUTREACH_ASSET_CREATION');
    expect(fallbacks).toEqual(['hermes_3_405b', 'gpt_oss_120b']);
  });
});

// =============================================================================
// DASHBOARD ROUTING TESTS
// =============================================================================

describe('Dashboard Feature Routing', () => {
  it('workflow_status_summary should use nemotron_3_nano_30b', () => {
    const model = getModelForDashboardFeature('workflow_status_summary');
    expect(model).toBe('nemotron_3_nano_30b');
  });

  it('stage_failure_explanation should use gpt_oss_120b', () => {
    const model = getModelForDashboardFeature('stage_failure_explanation');
    expect(model).toBe('gpt_oss_120b');
  });

  it('fallback_event_analysis should use gpt_oss_120b', () => {
    const model = getModelForDashboardFeature('fallback_event_analysis');
    expect(model).toBe('gpt_oss_120b');
  });

  it('campaign_progress_overview should use nemotron_3_ultra', () => {
    const model = getModelForDashboardFeature('campaign_progress_overview');
    expect(model).toBe('nemotron_3_ultra');
  });

  it('recommended_next_action should use nemotron_3_ultra', () => {
    const model = getModelForDashboardFeature('recommended_next_action');
    expect(model).toBe('nemotron_3_ultra');
  });

  it('audit_log_analysis should use gpt_oss_120b', () => {
    const model = getModelForDashboardFeature('audit_log_analysis');
    expect(model).toBe('gpt_oss_120b');
  });

  it('output_quality_score should use gpt_oss_120b', () => {
    const model = getModelForDashboardFeature('output_quality_score');
    expect(model).toBe('gpt_oss_120b');
  });

  it('pitch_readability_preview should use hermes_3_405b', () => {
    const model = getModelForDashboardFeature('pitch_readability_preview');
    expect(model).toBe('hermes_3_405b');
  });

  it('dashboard_copy_labels should use minimax_m25', () => {
    const model = getModelForDashboardFeature('dashboard_copy_labels');
    expect(model).toBe('minimax_m25');
  });

  it('search_across_campaign_files should use nemotron_3_super', () => {
    const model = getModelForDashboardFeature('search_across_campaign_files');
    expect(model).toBe('nemotron_3_super');
  });

  it('chart_image_interpretation should use gemma_4_31b', () => {
    const model = getModelForDashboardFeature('chart_image_interpretation');
    expect(model).toBe('gemma_4_31b');
  });

  it('dashboard_visual_asset_generation should use gemma_4_31b', () => {
    const model = getModelForDashboardFeature('dashboard_visual_asset_generation');
    expect(model).toBe('gemma_4_31b');
  });
});

describe('Dashboard Feature Fallbacks', () => {
  it('workflow_status_summary should have minimax_m25 as fallback', () => {
    const fallbacks = getDashboardFallbacks('workflow_status_summary');
    expect(fallbacks).toContain('minimax_m25');
  });

  it('search_across_campaign_files should have gpt_oss_120b as fallback', () => {
    const fallbacks = getDashboardFallbacks('search_across_campaign_files');
    expect(fallbacks).toContain('gpt_oss_120b');
  });
});

// =============================================================================
// MODEL RESTRICTION TESTS
// =============================================================================

describe('Model Restrictions - Nemotron 3 Nano 30B', () => {
  it('should reject pitch_drafting use case', () => {
    const result = validateModelAllowedForUse('nemotron_3_nano_30b', 'pitch_drafting');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('can only be used for');
  });

  it('should reject validation use case', () => {
    const result = validateModelAllowedForUse('nemotron_3_nano_30b', 'validation');
    expect(result.allowed).toBe(false);
  });

  it('should allow deduplication', () => {
    const result = validateModelAllowedForUse('nemotron_3_nano_30b', 'deduplication');
    expect(result.allowed).toBe(true);
  });

  it('should allow simple_classification', () => {
    const result = validateModelAllowedForUse('nemotron_3_nano_30b', 'simple_classification');
    expect(result.allowed).toBe(true);
  });
});

describe('Model Restrictions - Gemma 4 31B', () => {
  it('should reject pitch_drafting use case', () => {
    const result = validateModelAllowedForUse('gemma_4_31b', 'pitch_drafting');
    expect(result.allowed).toBe(false);
  });

  it('should reject text_reasoning use case', () => {
    const result = validateModelAllowedForUse('gemma_4_31b', 'text_reasoning');
    expect(result.allowed).toBe(false);
  });

  it('should allow multimodal_input_extraction', () => {
    const result = validateModelAllowedForUse('gemma_4_31b', 'multimodal_input_extraction');
    expect(result.allowed).toBe(true);
  });

  it('should allow chart_image_interpretation', () => {
    const result = validateModelAllowedForUse('gemma_4_31b', 'chart_image_interpretation');
    expect(result.allowed).toBe(true);
  });
});

// =============================================================================
// FALLBACK CHAIN TESTS
// =============================================================================

describe('Fallback Chain Logic', () => {
  it('should try primary first, then fallbacks', async () => {
    const logs: string[] = [];
    
    // This tests the fallback order - primary should be tried first
    const models = getModelsToTryForStage('S1_CAMPAIGN_INTAKE');
    expect(models[0]).toBe('nemotron_3_ultra'); // primary
    expect(models[1]).toBe('nemotron_3_super'); // fallback1
    expect(models[2]).toBe('gpt_oss_120b'); // fallback2
  });

  it('should have at least one fallback for each stage', () => {
    Object.keys(CAMPAIGN_STAGE_ROUTING).forEach(stageId => {
      const fallbacks = getFallbacksForStage(stageId);
      expect(fallbacks.length).toBeGreaterThanOrEqual(1);
    });
  });
});

// =============================================================================
// STAGE ROUTING INFO TESTS
// =============================================================================

describe('Stage Routing Info', () => {
  it('should return routing info for S7', () => {
    const info = getStageRoutingInfo('S7_PITCH_SELECTION_HUMAN_GATE');
    expect(info).not.toBeNull();
    expect(info?.primary).toBe('gpt_oss_120b');
    expect(info?.fallbacks).toEqual(['nemotron_3_ultra', 'nemotron_3_super']);
    expect(info?.requiresHumanApproval).toBe(true);
  });

  it('should return null for unknown stage', () => {
    const info = getStageRoutingInfo('S99_UNKNOWN');
    expect(info).toBeNull();
  });
});

// =============================================================================
// AVAILABLE MODELS TESTS
// =============================================================================

describe('Available Models', () => {
  it('should return only production-enabled models', () => {
    const models = getAllAvailableModels();
    const productionModels = models.filter(m => m.enabledInProductionWorkflow);
    expect(productionModels.length).toBe(8);
  });

  it('should have correct number of models', () => {
    const models = getAllAvailableModels();
    // 8 production models (all enabled in production)
    expect(models.length).toBe(8);
  });
});

// =============================================================================
// CONFIGURATION INTEGRITY TESTS
// =============================================================================

describe('Configuration Integrity', () => {
  it('all stage routings should have primary model defined', () => {
    Object.entries(CAMPAIGN_STAGE_ROUTING).forEach(([stageId, config]) => {
      expect(config.primary).toBeDefined();
      expect(config.primary).not.toBe('');
    });
  });

  it('all stage routings should have at least one fallback', () => {
    Object.entries(CAMPAIGN_STAGE_ROUTING).forEach(([stageId, config]) => {
      expect(config.fallback1).toBeDefined();
    });
  });

  it('all dashboard features should have primary model defined', () => {
    Object.entries(DASHBOARD_ROUTING).forEach(([featureId, config]) => {
      expect(config.primary).toBeDefined();
      expect(config.primary).not.toBe('');
    });
  });

  it('model config should have required fields', () => {
    Object.entries(MODEL_CONFIG).forEach(([key, config]) => {
      expect(config.modelId).toBeDefined();
      expect(config.provider).toBe('openrouter');
      expect(config.timeoutMs).toBeGreaterThan(0);
    });
  });

  it('router settings should have fallback triggers defined', () => {
    expect(ROUTER_SETTINGS.fallbackTriggers.apiError).toBe(true);
    expect(ROUTER_SETTINGS.fallbackTriggers.timeout).toBe(true);
    expect(ROUTER_SETTINGS.fallbackTriggers.invalidJson).toBe(true);
    expect(ROUTER_SETTINGS.fallbackTriggers.schemaValidationFailed).toBe(true);
  });
});

// =============================================================================
// STAGE-SPECIFIC ROUTING VERIFICATION
// =============================================================================

describe('All Stage Routing Verification', () => {
  const stageRoutingMap: Record<string, { primary: string; fallbacks: string[] }> = {
    'S1_CAMPAIGN_INTAKE': { primary: 'nemotron_3_ultra', fallbacks: ['nemotron_3_super', 'gpt_oss_120b'] },
    'S2_DATA_EXTRACTION': { primary: 'nemotron_3_super', fallbacks: ['gpt_oss_120b', 'gemma_4_31b'] },
    'S3_RESEARCH_ENRICHMENT': { primary: 'nemotron_3_super', fallbacks: ['nemotron_3_ultra', 'qwen3_coder'] },
    'S4A_DATA_RESEARCH_ANALYST': { primary: 'gpt_oss_120b', fallbacks: ['nemotron_3_super', 'nemotron_3_ultra'] },
    'S4B_INSIGHT_ANALYST': { primary: 'gpt_oss_120b', fallbacks: ['nemotron_3_super', 'nemotron_3_ultra'] },
    'S5A_RAW_ANGLES': { primary: 'nemotron_3_ultra', fallbacks: ['hermes_3_405b', 'gpt_oss_120b'] },
    'S5B_JOURNALIST_FRAMED_ANGLES': { primary: 'hermes_3_405b', fallbacks: ['minimax_m25', 'gpt_oss_120b'] },
    'S5_ANGLE_GENERATION': { primary: 'nemotron_3_ultra', fallbacks: ['hermes_3_405b', 'gpt_oss_120b'] },
    'S6_BEAT_MATCHING': { primary: 'nemotron_3_nano_30b', fallbacks: ['nemotron_3_super', 'gpt_oss_120b'] },
    'S7_PITCH_SELECTION_HUMAN_GATE': { primary: 'gpt_oss_120b', fallbacks: ['nemotron_3_ultra', 'nemotron_3_super'] },
    'S8A_JOURNALIST_COLLECTION': { primary: 'nemotron_3_nano_30b', fallbacks: ['nemotron_3_super', 'qwen3_coder'] },
    'S8B_JOURNALIST_RELEVANCE_FILTER': { primary: 'nemotron_3_nano_30b', fallbacks: ['nemotron_3_super', 'gpt_oss_120b'] },
    'S8_JOURNALIST_COLLECTION': { primary: 'nemotron_3_nano_30b', fallbacks: ['nemotron_3_super', 'qwen3_coder'] },
    'S9_JOURNALIST_INTELLIGENCE': { primary: 'nemotron_3_super', fallbacks: ['gpt_oss_120b', 'minimax_m25'] },
    'S10_PITCH_DRAFTING': { primary: 'minimax_m25', fallbacks: ['hermes_3_405b', 'gpt_oss_120b'] },
    'S11_PITCH_OPTIMIZATION': { primary: 'hermes_3_405b', fallbacks: ['minimax_m25', 'gpt_oss_120b'] },
    'S12_PACKAGE_ASSEMBLY': { primary: 'minimax_m25', fallbacks: ['qwen3_coder', 'hermes_3_405b'] },
    'S13_VALIDATION': { primary: 'gpt_oss_120b', fallbacks: ['nemotron_3_ultra', 'qwen3_coder'] },
    'S14_FINAL_FORMATTING': { primary: 'qwen3_coder', fallbacks: ['minimax_m25', 'hermes_3_405b'] },
    'S15_OUTREACH_ASSET_CREATION': { primary: 'minimax_m25', fallbacks: ['hermes_3_405b', 'gpt_oss_120b'] },
    'S16_CAMPAIGN_LOG_LEARNING_LOOP': { primary: 'nemotron_3_ultra', fallbacks: ['gpt_oss_120b', 'nemotron_3_super'] }
  };

  Object.entries(stageRoutingMap).forEach(([stageId, expected]) => {
    it(`${stageId} should route to ${expected.primary}`, () => {
      expect(getModelForStage(stageId)).toBe(expected.primary);
    });

    it(`${stageId} should have correct fallbacks`, () => {
      expect(getFallbacksForStage(stageId)).toEqual(expected.fallbacks);
    });
  });
});

// =============================================================================
// ROUTE KEY EXISTENCE REGRESSION TEST
// =============================================================================

describe('Campaign Stage Route Key Existence', () => {
  const requiredStageKeys = [
    'S1_CAMPAIGN_INTAKE',
    'S2_DATA_EXTRACTION',
    'S3_RESEARCH_ENRICHMENT',
    'S4A_DATA_RESEARCH_ANALYST',
    'S4B_INSIGHT_ANALYST',
    'S5A_RAW_ANGLES',
    'S5B_JOURNALIST_FRAMED_ANGLES',
    'S5_ANGLE_GENERATION',
    'S6_BEAT_MATCHING',
    'S7_PITCH_SELECTION_HUMAN_GATE',
    'S8A_JOURNALIST_COLLECTION',
    'S8B_JOURNALIST_RELEVANCE_FILTER',
    'S8_JOURNALIST_COLLECTION',
    'S9_JOURNALIST_INTELLIGENCE',
    'S10_PITCH_DRAFTING',
    'S11_PITCH_OPTIMIZATION',
    'S12_PACKAGE_ASSEMBLY',
    'S13_VALIDATION',
    'S14_FINAL_FORMATTING',
    'S15_OUTREACH_ASSET_CREATION',
    'S16_CAMPAIGN_LOG_LEARNING_LOOP',
  ];

  it('campaignStageRouting should contain exactly the 21 required keys', () => {
    const actual = Object.keys(CAMPAIGN_STAGE_ROUTING).sort();
    const expected = [...requiredStageKeys].sort();
    expect(new Set(actual)).toEqual(new Set(expected));
  });

  it('no campaign stage should route to an undefined primary model', () => {
    for (const stageId of requiredStageKeys) {
      const primary = getModelForStage(stageId);
      expect(primary).toBeDefined();
      expect(typeof primary).toBe('string');
      expect(primary).not.toBeNull();
      expect(primary?.length).toBeGreaterThan(0);
    }
  });

  it('no campaign stage should reference an undefined model in routing', () => {
    for (const stageId of requiredStageKeys) {
      const routing = CAMPAIGN_STAGE_ROUTING[stageId];
      expect(routing).toBeDefined();
      expect(routing.primary).toBeDefined();
      expect(MODEL_CONFIG[routing.primary]).toBeDefined();
    }
  });
});

// =============================================================================
// STAGE CONTRACT CROSS-VALIDATION TESTS
// =============================================================================

describe('Stage Contract Cross-Validation', () => {
  const STAGE_CONTRACTS = stageContractsJson.stages as Record<string, {
    readonly description: string;
    readonly requires: readonly string[];
    readonly produces: readonly string[];
    readonly allowedModelRoles: readonly string[];
    readonly modelRouting: { readonly primary: string; readonly fallback1: string; readonly fallback2: string };
    readonly canContinueAutomatically: boolean;
    readonly humanApprovalRequired: boolean;
  }>;

  it('every campaignStageRouting key has a matching stage contract', () => {
    const routeKeys = Object.keys(CAMPAIGN_STAGE_ROUTING).sort();
    for (const key of routeKeys) {
      expect(STAGE_CONTRACTS[key]).toBeDefined();
      expect(STAGE_CONTRACTS[key].allowedModelRoles).toBeDefined();
      expect(STAGE_CONTRACTS[key].allowedModelRoles.length).toBeGreaterThan(0);
    }
  });

  it('every contracted stage key has a matching campaignStageRouting entry', () => {
    const contractKeys = Object.keys(STAGE_CONTRACTS).sort();
    for (const key of contractKeys) {
      expect(CAMPAIGN_STAGE_ROUTING[key]).toBeDefined();
    }
  });

  it('each campaign route primary model exists in MODEL_CONFIG', () => {
    const entries = Object.entries(CAMPAIGN_STAGE_ROUTING);
    for (const [stageId, routing] of entries) {
      expect(MODEL_CONFIG[routing.primary]).toBeDefined();
    }
  });

  it('each campaign route primary model role is included in that stage contract allowedModelRoles', () => {
    const entries = Object.entries(CAMPAIGN_STAGE_ROUTING);
    for (const [stageId, routing] of entries) {
      const contract = STAGE_CONTRACTS[stageId];
      expect(contract).toBeDefined();
      const primaryModelConfig = MODEL_CONFIG[routing.primary];
      expect(primaryModelConfig).toBeDefined();
      expect(contract.allowedModelRoles).toContain(primaryModelConfig.role);
    }
  });

  it('repaired sub-stages S5A, S5B, S8A, S8B now have contracts', () => {
    const repairedKeys = [
      'S5A_RAW_ANGLES',
      'S5B_JOURNALIST_FRAMED_ANGLES',
      'S8A_JOURNALIST_COLLECTION',
      'S8B_JOURNALIST_RELEVANCE_FILTER'
    ];
    for (const key of repairedKeys) {
      expect(STAGE_CONTRACTS[key]).toBeDefined();
      expect(STAGE_CONTRACTS[key].allowedModelRoles).toBeDefined();
      expect(STAGE_CONTRACTS[key].allowedModelRoles.length).toBeGreaterThan(0);
      expect(STAGE_CONTRACTS[key].modelRouting).toBeDefined();
    }
  });
});
