/**
 * =============================================================================
 * Model Routing Config - Client-safe exports
 * =============================================================================
 * 
 * These functions are config-only and safe to import on client-side.
 * For actual LLM execution, use API routes.
 * 
 * =============================================================================
 */

import routingConfig, {
  STAGE_OUTPUT_FILES
} from '../config/model-routing.config';

const getStageRouting = routingConfig.getStageRouting;
const getDashboardRouting = routingConfig.getDashboardRouting;

// =============================================================================
// CONFIG-ONLY FUNCTIONS (Safe for client)
// =============================================================================

export function getModelForStage(stageId: string): string | null {
  const routing = getStageRouting(stageId);
  return routing?.primary ?? null;
}

export function getFallbacksForStage(stageId: string): string[] {
  const routing = getStageRouting(stageId);
  if (!routing) return [];
  
  const fallbacks: string[] = [];
  if (routing.fallback1) fallbacks.push(routing.fallback1);
  if (routing.fallback2) fallbacks.push(routing.fallback2);
  return fallbacks;
}

export function getModelsToTryForStage(stageId: string): string[] {
  const primary = getModelForStage(stageId);
  const fallbacks = getFallbacksForStage(stageId);
  
  if (!primary) return [];
  return [primary, ...fallbacks];
}

export function getModelForDashboardFeature(featureId: string): string | null {
  const routing = getDashboardRouting(featureId);
  return routing?.primary ?? null;
}

export function getDashboardFallbacks(featureId: string): string[] {
  const routing = getDashboardRouting(featureId);
  if (!routing) return [];
  
  const fallbacks: string[] = [];
  if (routing.fallback1) fallbacks.push(routing.fallback1);
  if (routing.fallback2) fallbacks.push(routing.fallback2);
  return fallbacks;
}

export function getStageOutputFile(stageId: string): string | null {
  return STAGE_OUTPUT_FILES[stageId] ?? null;
}

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

export function stageRequiresHumanApproval(stageId: string): boolean {
  const routing = getStageRouting(stageId);
  return routing?.requiresHumanApproval ?? false;
}
