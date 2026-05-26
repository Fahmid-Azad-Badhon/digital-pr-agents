/**
 * =============================================================================
 * PART 2 - DRY RUN EXAMPLE
 * =============================================================================
 * 
 * Demonstrates model routing for:
 * - S1_CAMPAIGN_INTAKE
 * - S2_DATA_EXTRACTION  
 * - S10_PITCH_DRAFTING
 * - S13_VALIDATION
 * - dashboard_default_assistant
 * 
 * =============================================================================
 */

import { 
  getModelForStage, 
  getFallbacksForStage, 
  getModelsToTryForStage,
  getModelForDashboardFeature,
  getDashboardFallbacks,
  validateModelAllowedForUse,
  getStageRoutingInfo,
  stageRequiresHumanApproval,
  runStageWithFallback,
  runDashboardAI,
  getAllAvailableModels
} from '../src/lib/modelRouter';

console.log('===============================================');
console.log('MODEL ROUTING SYSTEM - DRY RUN DEMONSTRATION');
console.log('===============================================\n');

// ============================================================================
// 1. CAMPAIGN STAGE ROUTING
// ============================================================================

console.log('--- CAMPAIGN STAGE ROUTING ---\n');

const stages = [
  'S1_CAMPAIGN_INTAKE',
  'S2_DATA_EXTRACTION', 
  'S10_PITCH_DRAFTING',
  'S13_VALIDATION'
];

for (const stageId of stages) {
  console.log(`Stage: ${stageId}`);
  
  const primary = getModelForStage(stageId);
  const fallbacks = getFallbacksForStage(stageId);
  const allModels = getModelsToTryForStage(stageId);
  const routingInfo = getStageRoutingInfo(stageId);
  const needsHuman = stageRequiresHumanApproval(stageId);
  
  console.log(`  Primary Model:    ${primary}`);
  console.log(`  Fallbacks:        ${fallbacks.join(' → ')}`);
  console.log(`  All Models to Try: ${allModels.join(' → ')}`);
  console.log(`  Requires Human:   ${needsHuman ? 'YES' : 'No'}`);
  console.log(`  Special:          ${routingInfo?.specialInstructions || 'None'}`);
  console.log('');
}

// ============================================================================
// 2. DASHBOARD FEATURE ROUTING
// ============================================================================

console.log('--- DASHBOARD FEATURE ROUTING ---\n');

const dashboardFeatures = [
  'dashboard_default_assistant',
  'dashboard_fast_mode',
  'dashboard_strategy_mode',
  'dashboard_multimodal_mode'
];

for (const featureId of dashboardFeatures) {
  console.log(`Feature: ${featureId}`);
  
  const primary = getModelForDashboardFeature(featureId);
  const fallbacks = getDashboardFallbacks(featureId);
  
  console.log(`  Primary: ${primary}`);
  console.log(`  Fallbacks: ${fallbacks.join(' → ') || 'None'}`);
  console.log('');
}

// ============================================================================
// 3. MODEL USAGE RESTRICTION GUARDS
// ============================================================================

console.log('--- MODEL USAGE RESTRICTION GUARDS ---\n');

const restrictionTests = [
  { model: 'riverflow_v2', useCase: 'visual_generation', shouldAllow: true },
  { model: 'riverflow_v2', useCase: 'pitch_drafting', shouldAllow: false },
  { model: 'nemotron_3_nano_omni', useCase: 'multimodal_input_extraction', inputType: 'image', shouldAllow: true },
  { model: 'nemotron_3_nano_omni', useCase: 'pitch_drafting', shouldAllow: false },
  { model: 'lfm_25_12b', useCase: 'fast_cleanup', shouldAllow: true },
  { model: 'lfm_25_12b', useCase: 'final_validation', shouldAllow: false },
  { model: 'big_pickle', useCase: 'experimental_debugging', shouldAllow: true },
  { model: 'big_pickle', useCase: 'pitch_drafting', shouldAllow: false },
];

for (const test of restrictionTests) {
  const result = validateModelAllowedForUse(test.model, test.useCase, test.inputType);
  const status = result.allowed === test.shouldAllow ? '✓' : '✗';
  console.log(`${status} ${test.model} for ${test.useCase}: ${result.allowed ? 'ALLOWED' : 'BLOCKED'} (expected: ${test.shouldAllow ? 'ALLOWED' : 'BLOCKED'})`);
  if (!result.allowed) {
    console.log(`    Reason: ${result.reason}`);
  }
}

console.log('');

// ============================================================================
// 4. AVAILABLE MODELS
// ============================================================================

console.log('--- AVAILABLE MODELS ---\n');

const availableModels = getAllAvailableModels();
console.log(`Total enabled in production: ${availableModels.length}`);
for (const model of availableModels) {
  console.log(`  - ${model.displayName} (${model.key})`);
  console.log(`    Role: ${model.role}`);
  console.log(`    Timeout: ${model.timeoutMs}ms`);
  console.log(`    Cost: ${model.costLevel}`);
  console.log('');
}

// ============================================================================
// 5. EXAMPLE: S1 ROUTING DETAILS
// ============================================================================

console.log('--- S1 CAMPAIGN INTAKE DETAILED ---\n');

const s1Info = getStageRoutingInfo('S1_CAMPAIGN_INTAKE');
console.log('S1_CAMPAIGN_INTAKE Configuration:');
console.log(JSON.stringify(s1Info, null, 2));

console.log('\n===============================================');
console.log('DRY RUN COMPLETE');
console.log('===============================================');