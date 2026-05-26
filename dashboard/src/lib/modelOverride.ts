import { SYSTEM_MODELS, SYSTEM_STAGE_ROUTING } from './systemConfigLoader';

export interface ModelOverride {
  campaignId?: string;
  stageId?: string;
  modelKey: string;
  reason: string;
  appliedAt: string;
  appliedBy: string;
}

export interface OverrideResult {
  success: boolean;
  effectiveModel: string;
  message: string;
}

const OVERRIDE_STORAGE_PATH = 'data/model-overrides.json';

export function applyManualOverride(
  stageId: string,
  campaignId: string,
  requestedModel: string,
  appliedBy: string = 'operator'
): OverrideResult {
  const stageRouting = SYSTEM_STAGE_ROUTING[stageId];
  
  if (!stageRouting) {
    return {
      success: false,
      effectiveModel: 'unknown',
      message: `Unknown stage: ${stageId}`
    };
  }
  
  const availableModels = [
    stageRouting.primary,
    stageRouting.fallback1,
    stageRouting.fallback2
  ].filter(Boolean);
  
  if (!availableModels.includes(requestedModel)) {
    return {
      success: false,
      effectiveModel: stageRouting.primary,
      message: `Model '${requestedModel}' not available for ${stageId}. Available: ${availableModels.join(', ')}`
    };
  }
  
  const modelConfig = SYSTEM_MODELS[requestedModel];
  
  if (!modelConfig.enabledInProductionWorkflow && requestedModel !== 'big_pickle') {
    return {
      success: false,
      effectiveModel: stageRouting.primary,
      message: `Model '${requestedModel}' is not enabled in production workflow`
    };
  }
  
  return {
    success: true,
    effectiveModel: requestedModel,
    message: `Override applied: Using ${modelConfig.displayName} for ${stageId}`
  };
}

export function checkStageSpecificOverride(
  campaignId: string,
  stageId: string
): string | null {
  return null;
}

export function validateOverrideSyntax(overrideArg: string): { valid: boolean; model?: string; stage?: string; error?: string } {
  const match = overrideArg.match(/^(?:--model\s+)?(?:(\w+_[\w-]+)\s+)?(\w+)$/i);
  
  if (!match) {
    return {
      valid: false,
      error: 'Invalid override format. Use: --model <model-key> or --stage S10_PITCH_DRAFTING --model <model-key>'
    };
  }
  
  const [, stage, model] = match;
  
  if (model && !SYSTEM_MODELS[model]) {
    return {
      valid: false,
      error: `Unknown model: ${model}`
    };
  }
  
  if (stage && !SYSTEM_STAGE_ROUTING[stage]) {
    return {
      valid: false,
      error: `Unknown stage: ${stage}`
    };
  }
  
  return {
    valid: true,
    model,
    stage
  };
}

export function formatOverrideHelp(): string {
  const lines: string[] = [];
  
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('                    MANUAL OVERRIDE GUIDE');
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('');
  lines.push('Usage:');
  lines.push('  --model <model-key>              Override primary model');
  lines.push('  --stage <stage-id> --model <model-key>  Override specific stage');
  lines.push('');
  lines.push('Available Models:');
  
  for (const [key, model] of Object.entries(SYSTEM_MODELS)) {
    const status = model.enabledInProductionWorkflow ? '✅' : '❌';
    lines.push(`  ${status} ${key}: ${model.displayName} (${model.role})`);
  }
  
  lines.push('');
  lines.push('Available Stages:');
  
  for (const [stageId, routing] of Object.entries(SYSTEM_STAGE_ROUTING)) {
    lines.push(`  ${stageId}: Primary=${routing.primary}, Fallback=${routing.fallback1}`);
  }
  
  lines.push('');
  lines.push('Examples:');
  lines.push('  --model hermes_3_405b              # Use Hermes for current stage');
  lines.push('  --stage S10_PITCH_DRAFTING --model hermes_3_405b  # Override S10 only');
  lines.push('  --model gpt_oss_120b --rerun      # Rerun with different model');
  
  return lines.join('\n');
}