import modelRoutingJson from '@system/model-routing.config.json';
import stageContractsJson from '@system/stage-contracts.json';
import dashboardFeatureContractsJson from '@system/dashboard-feature-contracts.json';
import modelRestrictionsJson from '@system/model-restrictions.json';
import validationRulesJson from '@system/validation-rules.json';
import promptVersionLogJson from '@system/prompt-version-log.json';

export interface SystemModelConfig {
  key: string;
  displayName: string;
  provider: string;
  modelId: string;
  role: string;
  timeoutMs: number;
  maxRetries: number;
  allowedUseCases: string[];
  restrictedTo?: string[];
  enabledInProductionWorkflow: boolean;
  costLevel: string;
  speedLevel: string;
}

export interface StageRoutingConfig {
  primary: string;
  fallback1: string;
  fallback2: string;
  mandatoryReviewer?: string;
  requiresHumanApproval?: boolean;
  specialInstructions?: string;
}

export interface DashboardFeatureRouting {
  primary: string;
  fallback1?: string;
  fallback2?: string;
}

export interface ModelRestriction {
  displayName: string;
  role: string;
  restrictedUseCases?: string[];
  blockedUseCases?: string[];
  maxOutputTokens?: number | null;
  maxInputTokens?: number;
  restrictions?: string[];
  enabledInProductionWorkflow?: boolean;
}

function transformModelConfig(json: any): Record<string, SystemModelConfig> {
  const models: Record<string, SystemModelConfig> = {};
  for (const [key, value] of Object.entries(json.models)) {
    const m = value as any;
    models[key] = {
      key,
      displayName: m.displayName,
      provider: m.provider,
      modelId: m.modelId,
      role: m.role,
      timeoutMs: m.timeoutMs,
      maxRetries: m.maxRetries,
      allowedUseCases: m.allowedUseCases,
      restrictedTo: m.restrictedTo,
      enabledInProductionWorkflow: m.enabledInProductionWorkflow,
      costLevel: m.costLevel,
      speedLevel: m.speedLevel
    };
  }
  return models;
}

function transformStageRouting(json: any): Record<string, StageRoutingConfig> {
  const routing: Record<string, StageRoutingConfig> = {};
  for (const [key, value] of Object.entries(json.campaignStageRouting)) {
    const r = value as any;
    routing[key] = {
      primary: r.primary,
      fallback1: r.fallback1,
      fallback2: r.fallback2,
      mandatoryReviewer: r.mandatoryReviewer,
      requiresHumanApproval: r.requiresHumanApproval,
      specialInstructions: r.specialInstructions
    };
  }
  return routing;
}

function transformDashboardRouting(json: any): Record<string, DashboardFeatureRouting> {
  const routing: Record<string, DashboardFeatureRouting> = {};
  for (const [key, value] of Object.entries(json.dashboardFeatureRouting)) {
    const r = value as any;
    routing[key] = {
      primary: r.primary,
      fallback1: r.fallback1,
      fallback2: r.fallback2
    };
  }
  return routing;
}

export const SYSTEM_MODELS = transformModelConfig(modelRoutingJson);
export const SYSTEM_STAGE_ROUTING = transformStageRouting(modelRoutingJson);
export const SYSTEM_DASHBOARD_ROUTING = transformDashboardRouting(modelRoutingJson);
export const STAGE_CONTRACTS = stageContractsJson.stages;
export const DASHBOARD_FEATURE_CONTRACTS = dashboardFeatureContractsJson.features;
export const MODEL_RESTRICTIONS = modelRestrictionsJson.modelRestrictions;
export const GLOBAL_RESTRICTIONS = modelRestrictionsJson.globalRestrictions;
export const VALIDATION_RULES = validationRulesJson;
export const PROMPT_VERSIONS = promptVersionLogJson;

export function getSystemModel(key: string): SystemModelConfig | undefined {
  return SYSTEM_MODELS[key];
}

export function getSystemStageRouting(stageId: string): StageRoutingConfig | undefined {
  return SYSTEM_STAGE_ROUTING[stageId];
}

export function getSystemDashboardRouting(featureId: string): DashboardFeatureRouting | undefined {
  return SYSTEM_DASHBOARD_ROUTING[featureId];
}

export function getModelRestriction(key: string): ModelRestriction | undefined {
  return (MODEL_RESTRICTIONS as Record<string, ModelRestriction>)[key];
}

export function isModelRestrictedForUseCase(modelKey: string, useCase: string): boolean {
  const restriction = (MODEL_RESTRICTIONS as Record<string, ModelRestriction>)[modelKey];
  if (!restriction) return false;
  
  if (restriction.blockedUseCases?.includes(useCase)) {
    return true;
  }
  
  if (restriction.restrictedUseCases && !restriction.restrictedUseCases.includes(useCase)) {
    return true;
  }
  
  return false;
}

export function isModelEnabledInProduction(modelKey: string): boolean {
  const model = (SYSTEM_MODELS as Record<string, SystemModelConfig>)[modelKey];
  const restriction = (MODEL_RESTRICTIONS as Record<string, ModelRestriction>)[modelKey];
  
  if (restriction?.enabledInProductionWorkflow !== undefined) {
    return restriction.enabledInProductionWorkflow;
  }
  
  return model?.enabledInProductionWorkflow ?? false;
}

export const SYSTEM_VERSION = modelRoutingJson.version;
export const SYSTEM_LAST_UPDATED = modelRoutingJson.lastUpdated;
