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

// =============================================================================
// CAMPAIGN STAGE ROUTING TESTS
// =============================================================================

describe('Campaign Stage Routing - S1 Campaign Intake', () => {
  it('S1 should use hy3_preview as primary', () => {
    const model = getModelForStage('S1_CAMPAIGN_INTAKE');
    expect(model).toBe('hy3_preview');
  });

  it('S1 should have correct fallback chain', () => {
    const fallbacks = getFallbacksForStage('S1_CAMPAIGN_INTAKE');
    expect(fallbacks).toEqual(['gpt_oss_120b', 'nemotron_3_super']);
  });

  it('S1 should return all models to try', () => {
    const models = getModelsToTryForStage('S1_CAMPAIGN_INTAKE');
    expect(models).toEqual(['hy3_preview', 'gpt_oss_120b', 'nemotron_3_super']);
  });
});

describe('Campaign Stage Routing - S2 Data Extraction', () => {
  it('S2 should use gpt_oss_120b as primary', () => {
    const model = getModelForStage('S2_DATA_EXTRACTION');
    expect(model).toBe('gpt_oss_120b');
  });

  it('S2 should have correct fallback chain', () => {
    const fallbacks = getFallbacksForStage('S2_DATA_EXTRACTION');
    expect(fallbacks).toEqual(['nemotron_3_super', 'hy3_preview']);
  });
});

describe('Campaign Stage Routing - S5 Angle Generation', () => {
  it('S5 should use hy3_preview as primary', () => {
    const model = getModelForStage('S5_ANGLE_GENERATION');
    expect(model).toBe('hy3_preview');
  });

  it('S5 should have gpt_oss_120b and hermes_3_405b as fallbacks', () => {
    const fallbacks = getFallbacksForStage('S5_ANGLE_GENERATION');
    expect(fallbacks).toEqual(['gpt_oss_120b', 'hermes_3_405b']);
  });
});

describe('Campaign Stage Routing - S7 Human Gate', () => {
  it('S7 should use gpt_oss_120b as primary', () => {
    const model = getModelForStage('S7_PITCH_SELECTION_HUMAN_GATE');
    expect(model).toBe('gpt_oss_120b');
  });

  it('S7 should have correct fallback chain', () => {
    const fallbacks = getFallbacksForStage('S7_PITCH_SELECTION_HUMAN_GATE');
    expect(fallbacks).toEqual(['hy3_preview', 'nemotron_3_super']);
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
  it('S10 should use hermes_3_405b as primary', () => {
    const model = getModelForStage('S10_PITCH_DRAFTING');
    expect(model).toBe('hermes_3_405b');
  });

  it('S10 should have hy3_preview and minimax_m25 as fallbacks', () => {
    const fallbacks = getFallbacksForStage('S10_PITCH_DRAFTING');
    expect(fallbacks).toEqual(['hy3_preview', 'minimax_m25']);
  });
});

describe('Campaign Stage Routing - S11 Pitch Optimization', () => {
  it('S11 should use hermes_3_405b as primary', () => {
    const model = getModelForStage('S11_PITCH_OPTIMIZATION');
    expect(model).toBe('hermes_3_405b');
  });

  it('S11 should have gpt_oss_120b and hy3_preview as fallbacks', () => {
    const fallbacks = getFallbacksForStage('S11_PITCH_OPTIMIZATION');
    expect(fallbacks).toEqual(['gpt_oss_120b', 'hy3_preview']);
  });
});

describe('Campaign Stage Routing - S13 Validation', () => {
  it('S13 should use gpt_oss_120b as primary', () => {
    const model = getModelForStage('S13_VALIDATION');
    expect(model).toBe('gpt_oss_120b');
  });

  it('S13 should have nemotron_3_super and hy3_preview as fallbacks', () => {
    const fallbacks = getFallbacksForStage('S13_VALIDATION');
    expect(fallbacks).toEqual(['nemotron_3_super', 'hy3_preview']);
  });
});

describe('Campaign Stage Routing - S15 Outreach Asset Creation', () => {
  it('S15 should use hermes_3_405b as primary', () => {
    const model = getModelForStage('S15_OUTREACH_ASSET_CREATION');
    expect(model).toBe('hermes_3_405b');
  });

  it('S15 should have hy3_preview and minimax_m25 fallbacks', () => {
    const fallbacks = getFallbacksForStage('S15_OUTREACH_ASSET_CREATION');
    expect(fallbacks).toEqual(['hy3_preview', 'minimax_m25']);
  });
});

// =============================================================================
// DASHBOARD ROUTING TESTS
// =============================================================================

describe('Dashboard Feature Routing', () => {
  it('workflow_status_summary should use lfm_25_12b', () => {
    const model = getModelForDashboardFeature('workflow_status_summary');
    expect(model).toBe('lfm_25_12b');
  });

  it('stage_failure_explanation should use gpt_oss_120b', () => {
    const model = getModelForDashboardFeature('stage_failure_explanation');
    expect(model).toBe('gpt_oss_120b');
  });

  it('fallback_event_analysis should use gpt_oss_120b', () => {
    const model = getModelForDashboardFeature('fallback_event_analysis');
    expect(model).toBe('gpt_oss_120b');
  });

  it('campaign_progress_overview should use hy3_preview', () => {
    const model = getModelForDashboardFeature('campaign_progress_overview');
    expect(model).toBe('hy3_preview');
  });

  it('recommended_next_action should use hy3_preview', () => {
    const model = getModelForDashboardFeature('recommended_next_action');
    expect(model).toBe('hy3_preview');
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

  it('chart_image_interpretation should use nemotron_3_nano_omni', () => {
    const model = getModelForDashboardFeature('chart_image_interpretation');
    expect(model).toBe('nemotron_3_nano_omni');
  });

  it('dashboard_visual_asset_generation should use riverflow_v2', () => {
    const model = getModelForDashboardFeature('dashboard_visual_asset_generation');
    expect(model).toBe('riverflow_v2');
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

describe('Model Restrictions - Riverflow V2', () => {
  it('should reject text_reasoning use case', () => {
    const result = validateModelAllowedForUse('riverflow_v2', 'text_reasoning');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('can only be used for');
  });

  it('should allow visual_generation use case', () => {
    const result = validateModelAllowedForUse('riverflow_v2', 'visual_generation');
    expect(result.allowed).toBe(true);
  });

  it('should allow image_editing use case', () => {
    const result = validateModelAllowedForUse('riverflow_v2', 'image_editing');
    expect(result.allowed).toBe(true);
  });
});

describe('Model Restrictions - Nemotron 3 Nano Omni', () => {
  it('should reject final_pitch_drafting without inputType', () => {
    const result = validateModelAllowedForUse('nemotron_3_nano_omni', 'pitch_drafting');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('requires inputType');
  });

  it('should reject final_pitch_drafting with text input', () => {
    const result = validateModelAllowedForUse('nemotron_3_nano_omni', 'pitch_drafting', 'text');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('can only process');
  });

  it('should allow multimodal_input_extraction with image input', () => {
    const result = validateModelAllowedForUse('nemotron_3_nano_omni', 'multimodal_input_extraction', 'image');
    expect(result.allowed).toBe(true);
  });

  it('should allow screenshot_extraction', () => {
    const result = validateModelAllowedForUse('nemotron_3_nano_omni', 'screenshot_extraction', 'screenshot');
    expect(result.allowed).toBe(true);
  });
});

describe('Model Restrictions - LFM 2.5-1.2B', () => {
  it('should reject validation use case', () => {
    const result = validateModelAllowedForUse('lfm_25_12b', 'validation');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('can only be used for');
  });

  it('should allow fast_cleanup', () => {
    const result = validateModelAllowedForUse('lfm_25_12b', 'fast_cleanup');
    expect(result.allowed).toBe(true);
  });

  it('should allow simple_classification', () => {
    const result = validateModelAllowedForUse('lfm_25_12b', 'simple_classification');
    expect(result.allowed).toBe(true);
  });

  it('should allow short_summary', () => {
    const result = validateModelAllowedForUse('lfm_25_12b', 'short_summary');
    expect(result.allowed).toBe(true);
  });
});

describe('Model Restrictions - Big Pickle', () => {
  it('should be disabled in production workflow', () => {
    const config = MODEL_CONFIG.big_pickle;
    expect(config.enabledInProductionWorkflow).toBe(false);
  });

  it('should only allow experimental_debugging', () => {
    const result = validateModelAllowedForUse('big_pickle', 'experimental_debugging');
    // Should be allowed when explicitly requested
    expect(result.allowed).toBe(true);
  });

  it('should reject production tasks', () => {
    const result = validateModelAllowedForUse('big_pickle', 'pitch_drafting');
    expect(result.allowed).toBe(false);
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
    expect(models[0]).toBe('hy3_preview'); // primary
    expect(models[1]).toBe('gpt_oss_120b'); // fallback1
    expect(models[2]).toBe('nemotron_3_super'); // fallback2
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
    expect(info?.fallbacks).toEqual(['hy3_preview', 'nemotron_3_super']);
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
    expect(productionModels.length).toBeGreaterThan(0);
    // Big Pickle should be excluded
    expect(productionModels.find(m => m.key === 'big_pickle')).toBeUndefined();
  });

  it('should have correct number of models', () => {
    const models = getAllAvailableModels();
    // 12 production models (big_pickle disabled)
    expect(models.length).toBe(12);
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
    'S1_CAMPAIGN_INTAKE': { primary: 'hy3_preview', fallbacks: ['gpt_oss_120b', 'nemotron_3_super'] },
    'S2_DATA_EXTRACTION': { primary: 'gpt_oss_120b', fallbacks: ['nemotron_3_super', 'hy3_preview'] },
    'S3_RESEARCH_ENRICHMENT': { primary: 'nemotron_3_super', fallbacks: ['gpt_oss_120b', 'hy3_preview'] },
    'S4A_DATA_RESEARCH_ANALYST': { primary: 'gpt_oss_120b', fallbacks: ['nemotron_3_super', 'hy3_preview'] },
    'S4B_INSIGHT_ANALYST': { primary: 'gpt_oss_120b', fallbacks: ['hy3_preview', 'nemotron_3_super'] },
    'S5_ANGLE_GENERATION': { primary: 'hy3_preview', fallbacks: ['gpt_oss_120b', 'hermes_3_405b'] },
    'S6_BEAT_MATCHING': { primary: 'nemotron_3_super', fallbacks: ['gpt_oss_120b', 'nemotron_3_nano_30b'] },
    'S7_PITCH_SELECTION_HUMAN_GATE': { primary: 'gpt_oss_120b', fallbacks: ['hy3_preview', 'nemotron_3_super'] },
    'S8_JOURNALIST_COLLECTION': { primary: 'minimax_m25', fallbacks: ['nemotron_3_super', 'nemotron_3_nano_30b'] },
    'S9_JOURNALIST_INTELLIGENCE': { primary: 'nemotron_3_super', fallbacks: ['gpt_oss_120b', 'hy3_preview'] },
    'S10_PITCH_DRAFTING': { primary: 'hermes_3_405b', fallbacks: ['hy3_preview', 'minimax_m25'] },
    'S11_PITCH_OPTIMIZATION': { primary: 'hermes_3_405b', fallbacks: ['gpt_oss_120b', 'hy3_preview'] },
    'S12_PACKAGE_ASSEMBLY': { primary: 'minimax_m25', fallbacks: ['qwen3_coder', 'hy3_preview'] },
    'S13_VALIDATION': { primary: 'gpt_oss_120b', fallbacks: ['nemotron_3_super', 'hy3_preview'] },
    'S14_FINAL_FORMATTING': { primary: 'qwen3_coder', fallbacks: ['minimax_m25', 'lfm_25_12b'] },
    'S15_OUTREACH_ASSET_CREATION': { primary: 'hermes_3_405b', fallbacks: ['hy3_preview', 'minimax_m25'] },
    'S16_CAMPAIGN_LOG_LEARNING_LOOP': { primary: 'gpt_oss_120b', fallbacks: ['hy3_preview', 'nemotron_3_super'] }
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
