import { describe, it, expect } from 'vitest';
import {
  getPromptMappingForRoute,
  getPromptVersionForRoute,
  requirePromptVersionForRoute,
  getPromptIdForRoute,
  getRoutePromptMappings,
} from '@/lib/promptVersionResolver';
import {
  getPromptVersionForStage,
  getPromptVersionForDashboardFeature,
} from '@/lib/modelRouter';
import { CAMPAIGN_STAGE_ROUTING } from '@/config/model-routing.config';
import promptVersionLogJson from '@system/prompt-version-log.json';

interface RoutePromptMapping {
  routeKey: string;
  routeType: 'campaignStage' | 'dashboardFeature';
  promptId: string;
  modelKey: string;
  promptVersion: string;
}

const MAPPINGS: RoutePromptMapping[] = (promptVersionLogJson as { routePromptMappings: RoutePromptMapping[] }).routePromptMappings ?? [];

const KNOWN_CAMPAIGN_STAGES = Object.keys(CAMPAIGN_STAGE_ROUTING);

const dashboardFeatureMappings = MAPPINGS.filter(m => m.routeType === 'dashboardFeature');
const KNOWN_DASHBOARD_FEATURES = dashboardFeatureMappings.map(m => m.routeKey);

// =============================================================================
// REPRESENTATIVE ROUTE CHECKS
// =============================================================================

describe('Representative Route Resolutions', () => {
  it('S1_CAMPAIGN_INTAKE resolves to orchestrator_strategy_v1 / 1.0.0', () => {
    expect(getPromptIdForRoute('S1_CAMPAIGN_INTAKE')).toBe('orchestrator_strategy_v1');
    expect(getPromptVersionForRoute('S1_CAMPAIGN_INTAKE')).toBe('1.0.0');
    expect(getPromptVersionForStage('S1_CAMPAIGN_INTAKE')).toBe('1.0.0');
  });

  it('S10_PITCH_DRAFTING resolves to production_writer_v1 / 1.0.0', () => {
    expect(getPromptIdForRoute('S10_PITCH_DRAFTING')).toBe('production_writer_v1');
    expect(getPromptVersionForRoute('S10_PITCH_DRAFTING')).toBe('1.0.0');
    expect(getPromptVersionForStage('S10_PITCH_DRAFTING')).toBe('1.0.0');
  });

  it('S14_FINAL_FORMATTING resolves to strict_formatting_v1 / 1.0.0', () => {
    expect(getPromptIdForRoute('S14_FINAL_FORMATTING')).toBe('strict_formatting_v1');
    expect(getPromptVersionForRoute('S14_FINAL_FORMATTING')).toBe('1.0.0');
    expect(getPromptVersionForStage('S14_FINAL_FORMATTING')).toBe('1.0.0');
  });

  it('workflow_status_summary resolves to fast_prefilter_v1 / 1.0.0', () => {
    expect(getPromptIdForRoute('workflow_status_summary')).toBe('fast_prefilter_v1');
    expect(getPromptVersionForRoute('workflow_status_summary')).toBe('1.0.0');
    expect(getPromptVersionForDashboardFeature('workflow_status_summary')).toBe('1.0.0');
  });

  it('chart_image_interpretation resolves to multimodal_document_v1 / 1.0.0', () => {
    expect(getPromptIdForRoute('chart_image_interpretation')).toBe('multimodal_document_v1');
    expect(getPromptVersionForRoute('chart_image_interpretation')).toBe('1.0.0');
    expect(getPromptVersionForDashboardFeature('chart_image_interpretation')).toBe('1.0.0');
  });
});

// =============================================================================
// PROMPT VERSION RESOLVER
// =============================================================================

describe('getPromptMappingForRoute', () => {
  it.each(MAPPINGS)('returns mapping for $routeKey', (mapping) => {
    const result = getPromptMappingForRoute(mapping.routeKey);
    expect(result).not.toBeNull();
    expect(result!.routeKey).toBe(mapping.routeKey);
    expect(result!.promptVersion).toBe(mapping.promptVersion);
    expect(result!.promptId).toBe(mapping.promptId);
  });

  it('returns null for unknown route', () => {
    expect(getPromptMappingForRoute('S99_UNKNOWN')).toBeNull();
    expect(getPromptMappingForRoute('nonexistent_feature')).toBeNull();
  });
});

describe('getPromptVersionForRoute', () => {
  it.each(MAPPINGS)('returns "$promptVersion" for $routeKey', (mapping) => {
    expect(getPromptVersionForRoute(mapping.routeKey)).toBe(mapping.promptVersion);
  });

  it('returns null for unknown route', () => {
    expect(getPromptVersionForRoute('S99_UNKNOWN')).toBeNull();
  });
});

describe('requirePromptVersionForRoute', () => {
  it.each(MAPPINGS)('returns "$promptVersion" for $routeKey', (mapping) => {
    expect(requirePromptVersionForRoute(mapping.routeKey)).toBe(mapping.promptVersion);
  });

  it('throws for unknown route', () => {
    expect(() => requirePromptVersionForRoute('S99_UNKNOWN')).toThrow('No prompt version mapping found for route: S99_UNKNOWN');
  });
});

describe('getPromptIdForRoute', () => {
  it.each(MAPPINGS)('returns "$promptId" for $routeKey', (mapping) => {
    expect(getPromptIdForRoute(mapping.routeKey)).toBe(mapping.promptId);
  });

  it('returns null for unknown route', () => {
    expect(getPromptIdForRoute('S99_UNKNOWN')).toBeNull();
  });
});

describe('getRoutePromptMappings', () => {
  it('returns all 33 route prompt mappings', () => {
    const result = getRoutePromptMappings();
    expect(result).toHaveLength(33);
  });

  it('returns a frozen copy (not the original array)', () => {
    const first = getRoutePromptMappings();
    const second = getRoutePromptMappings();
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
  });

  it('returned array is readonly (Object.isFrozen)', () => {
    const result = getRoutePromptMappings();
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('every mapping has required fields', () => {
    const result = getRoutePromptMappings();
    for (const m of result) {
      expect(m.routeKey).toBeDefined();
      expect(m.routeType).toMatch(/^(campaignStage|dashboardFeature)$/);
      expect(m.promptId).toBeDefined();
      expect(m.modelKey).toBeDefined();
      expect(m.promptVersion).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });
});

// =============================================================================
// MODEL ROUTER ACCESSORS
// =============================================================================

describe('getPromptVersionForStage', () => {
  it.each(KNOWN_CAMPAIGN_STAGES)('returns a version for stage %s', (stageId) => {
    const version = getPromptVersionForStage(stageId);
    expect(version).not.toBeNull();
    expect(version!).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('returns null for unknown stage', () => {
    expect(getPromptVersionForStage('S99_UNKNOWN')).toBeNull();
  });

  it('returns same value as resolver for every campaign stage', () => {
    for (const stageId of KNOWN_CAMPAIGN_STAGES) {
      expect(getPromptVersionForStage(stageId)).toBe(getPromptVersionForRoute(stageId));
    }
  });
});

describe('getPromptVersionForDashboardFeature', () => {
  it.each(KNOWN_DASHBOARD_FEATURES)('returns a version for feature "%s"', (featureId) => {
    const version = getPromptVersionForDashboardFeature(featureId);
    expect(version).not.toBeNull();
    expect(version!).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('returns null for unknown dashboard feature', () => {
    expect(getPromptVersionForDashboardFeature('nonexistent_feature')).toBeNull();
  });

  it('returns null for dashboard mode keys not in routePromptMappings', () => {
    expect(getPromptVersionForDashboardFeature('dashboard_default_assistant')).toBeNull();
    expect(getPromptVersionForDashboardFeature('dashboard_fast_mode')).toBeNull();
    expect(getPromptVersionForDashboardFeature('dashboard_visual_mode')).toBeNull();
  });

  it('returns same value as resolver for every mapped dashboard feature', () => {
    for (const featureId of KNOWN_DASHBOARD_FEATURES) {
      expect(getPromptVersionForDashboardFeature(featureId)).toBe(getPromptVersionForRoute(featureId));
    }
  });
});
