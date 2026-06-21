import { describe, it, expect } from 'vitest';
import promptVersionLogJson from '@system/prompt-version-log.json';
import modelRoutingConfigJson from '@system/model-routing.config.json';
import { CAMPAIGN_STAGE_ROUTING, MODEL_CONFIG } from '@/config/model-routing.config';

interface PromptEntry {
  id: string;
  model: string;
  useCase: string;
  version: string;
  promptText: string;
  variables: string[];
  maxTokens: number;
}

interface RoutePromptMapping {
  routeKey: string;
  routeType: 'campaignStage' | 'dashboardFeature';
  promptId: string;
  modelKey: string;
  promptVersion: string;
}

const EXPECTED_PROMPT_IDS: string[] = [
  'orchestrator_strategy_v1',
  'research_extraction_v1',
  'production_writer_v1',
  'reasoning_judge_v1',
  'natural_writing_polish_v1',
  'fast_prefilter_v1',
  'multimodal_document_v1',
  'strict_formatting_v1',
];

const REQUIRED_PROMPT_FIELDS: (keyof PromptEntry)[] = [
  'id', 'model', 'useCase', 'version', 'promptText', 'variables', 'maxTokens',
];

const SEMVER_REGEX = /^\d+\.\d+\.\d+$/;

const PROMPT_MODEL_MAP: Record<string, string> = {
  orchestrator_strategy_v1: 'nemotron_3_ultra',
  research_extraction_v1: 'nemotron_3_super',
  production_writer_v1: 'minimax_m25',
  reasoning_judge_v1: 'gpt_oss_120b',
  natural_writing_polish_v1: 'hermes_3_405b',
  fast_prefilter_v1: 'nemotron_3_nano_30b',
  multimodal_document_v1: 'gemma_4_31b',
  strict_formatting_v1: 'qwen3_coder',
};

const prompts = (promptVersionLogJson.prompts ?? []) as PromptEntry[];
const routePromptMappings = (promptVersionLogJson.routePromptMappings ?? []) as RoutePromptMapping[];
const dashboardFeatureKeys = Object.keys(
  (modelRoutingConfigJson as { dashboardFeatureRouting: Record<string, unknown> }).dashboardFeatureRouting
);
const campaignRouteKeys = Object.keys(CAMPAIGN_STAGE_ROUTING);

// =============================================================================
// PROMPT REGISTRY STRUCTURE
// =============================================================================

describe('Prompt Registry Structure', () => {
  it('should contain exactly the 8 expected prompt ids', () => {
    const actual = prompts.map((p) => p.id).sort();
    expect(actual).toEqual([...EXPECTED_PROMPT_IDS].sort());
  });

  it.each(prompts)('prompt $id should have all required fields', (prompt) => {
    for (const field of REQUIRED_PROMPT_FIELDS) {
      expect(prompt).toHaveProperty(field);
      expect(prompt[field]).toBeDefined();
    }
  });

  it.each(prompts)('prompt $id model should exist in MODEL_CONFIG', (prompt) => {
    expect(MODEL_CONFIG[prompt.model]).toBeDefined();
  });

  it.each(prompts)('prompt $id model should match expected model mapping', (prompt) => {
    expect(prompt.model).toBe(PROMPT_MODEL_MAP[prompt.id]);
  });

  it.each(prompts)('prompt $id version should be semver-like x.y.z', (prompt) => {
    expect(prompt.version).toMatch(SEMVER_REGEX);
  });

  it('all prompts should use semver-like x.y.z versions', () => {
    for (const prompt of prompts) {
      expect(prompt.version).toMatch(SEMVER_REGEX);
    }
  });
});

// =============================================================================
// ROUTE COVERAGE COMPLETENESS
// =============================================================================

describe('Route Coverage Completeness', () => {
  const expectedTotal = campaignRouteKeys.length + dashboardFeatureKeys.length;

  it('every campaignStageRouting key should have exactly one routePromptMappings entry', () => {
    for (const key of campaignRouteKeys) {
      const matching = routePromptMappings.filter((m) => m.routeKey === key);
      expect(matching).toHaveLength(1);
    }
  });

  it('every dashboardFeatureRouting key should have exactly one routePromptMappings entry', () => {
    for (const key of dashboardFeatureKeys) {
      const matching = routePromptMappings.filter((m) => m.routeKey === key);
      expect(matching).toHaveLength(1);
    }
  });

  it('should have correct total number of routePromptMappings entries', () => {
    expect(routePromptMappings.length).toBe(expectedTotal);
  });

  it('should have no missing routePromptMappings - every route key is covered', () => {
    const mappedKeys = new Set(routePromptMappings.map((m) => m.routeKey));
    const allRouteKeys = new Set([...campaignRouteKeys, ...dashboardFeatureKeys]);
    for (const key of allRouteKeys) {
      expect(mappedKeys.has(key)).toBe(true);
    }
  });

  it('should have no extra routePromptMappings - every mapping references a known route', () => {
    const allRouteKeys = new Set([...campaignRouteKeys, ...dashboardFeatureKeys]);
    for (const mapping of routePromptMappings) {
      expect(allRouteKeys.has(mapping.routeKey)).toBe(true);
    }
  });
});

// =============================================================================
// ROUTE PROMPT MAPPING VALIDITY
// =============================================================================

describe('Route Prompt Mapping Validity', () => {
  const promptById = new Map(prompts.map((p) => [p.id, p]));

  it.each(routePromptMappings)(
    'mapping for $routeKey should reference an existing route key',
    (mapping) => {
      const allRouteKeys = new Set([...campaignRouteKeys, ...dashboardFeatureKeys]);
      expect(allRouteKeys.has(mapping.routeKey)).toBe(true);
    }
  );

  it.each(routePromptMappings)(
    'mapping for $routeKey should reference an existing prompt id: $promptId',
    (mapping) => {
      expect(promptById.has(mapping.promptId)).toBe(true);
    }
  );

  it.each(routePromptMappings)(
    'mapping for $routeKey should have routeType matching the route source',
    (mapping) => {
      const isCampaign = campaignRouteKeys.includes(mapping.routeKey);
      const isDashboard = dashboardFeatureKeys.includes(mapping.routeKey);
      if (isCampaign) {
        expect(mapping.routeType).toBe('campaignStage');
      } else if (isDashboard) {
        expect(mapping.routeType).toBe('dashboardFeature');
      }
    }
  );

  it.each(routePromptMappings)(
    'mapping for $routeKey modelKey should equal that route primary model',
    (mapping) => {
      const isCampaign = campaignRouteKeys.includes(mapping.routeKey);
      if (isCampaign) {
        const routeConfig = CAMPAIGN_STAGE_ROUTING[mapping.routeKey];
        expect(mapping.modelKey).toBe(routeConfig.primary);
      } else {
        const routeConfig = (
          modelRoutingConfigJson as {
            dashboardFeatureRouting: Record<string, { primary: string }>;
          }
        ).dashboardFeatureRouting[mapping.routeKey];
        expect(mapping.modelKey).toBe(routeConfig.primary);
      }
    }
  );

  it.each(routePromptMappings)(
    'mapping for $routeKey prompt $promptId should have matching model',
    (mapping) => {
      const prompt = promptById.get(mapping.promptId);
      expect(prompt).toBeDefined();
      expect(prompt!.model).toBe(mapping.modelKey);
    }
  );

  it.each(routePromptMappings)(
    'mapping for $routeKey promptVersion should equal referenced prompt version',
    (mapping) => {
      const prompt = promptById.get(mapping.promptId);
      expect(prompt).toBeDefined();
      expect(mapping.promptVersion).toBe(prompt!.version);
    }
  );

  it.each(routePromptMappings)(
    'mapping for $routeKey should have semver-like promptVersion',
    (mapping) => {
      expect(mapping.promptVersion).toMatch(SEMVER_REGEX);
    }
  );
});
