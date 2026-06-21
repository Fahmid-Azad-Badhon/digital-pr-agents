import { PROMPT_VERSIONS } from '@/lib/systemConfigLoader';

type RouteType = 'campaignStage' | 'dashboardFeature';

interface RoutePromptMapping {
  routeKey: string;
  routeType: RouteType;
  promptId: string;
  modelKey: string;
  promptVersion: string;
}

interface PromptVersionResolution {
  routeKey: string;
  routeType: RouteType;
  promptId: string;
  modelKey: string;
  promptVersion: string;
  promptText: string;
}

function getMappings(): RoutePromptMapping[] {
  return (PROMPT_VERSIONS as { routePromptMappings: RoutePromptMapping[] }).routePromptMappings ?? [];
}

export function getPromptMappingForRoute(routeKey: string): RoutePromptMapping | null {
  return getMappings().find(m => m.routeKey === routeKey) ?? null;
}

export function getPromptVersionForRoute(routeKey: string): string | null {
  return getMappings().find(m => m.routeKey === routeKey)?.promptVersion ?? null;
}

export function requirePromptVersionForRoute(routeKey: string): string {
  const mapping = getMappings().find(m => m.routeKey === routeKey);
  if (!mapping) {
    throw new Error(`No prompt version mapping found for route: ${routeKey}`);
  }
  return mapping.promptVersion;
}

export function getPromptIdForRoute(routeKey: string): string | null {
  return getMappings().find(m => m.routeKey === routeKey)?.promptId ?? null;
}

export function getRoutePromptMappings(): readonly RoutePromptMapping[] {
  return Object.freeze([...getMappings()]);
}

export type { RouteType, RoutePromptMapping, PromptVersionResolution };
