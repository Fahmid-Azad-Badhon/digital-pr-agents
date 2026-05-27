import { describe, it, expect } from 'vitest';
import {
  validateLLMOutput,
  validateJsonBeforeWrite,
  isDryRunOutput,
  isFallbackContent,
  extractJsonFromOutput,
  STAGE_SCHEMA_REGISTRY,
} from '@/lib/llmStageValidator';

const DRY_RUN_STRING = '[DRY RUN] External call blocked. No live LLM fetch performed.';

const VALID_S4_OUTPUT = JSON.stringify({
  verified_findings: [{ id: 'VF_01', finding: 'Traffic increased by 40% year-over-year', source: 'State DOT Report 2024' }],
  dataQualityScore: 85,
  recommendationSummary: 'Lead with infrastructure investment data',
});

const VALID_S10_OUTPUT = JSON.stringify({
  subject_line: 'Traffic data reveals surprising trends in your coverage area',
  body: 'New data from the State DOT shows a 40% increase in traffic congestion in downtown areas over the past year. This trend has significant implications for local commuters and small businesses.',
  citations_used: ['VF_01', 'VF_02'],
});

const VALID_S2_OUTPUT = JSON.stringify([
  { id: 'IN_01', content: 'Sample size of 1,200 participants across 5 counties', source: 'Study methodology section', category: 'statistics' },
  { id: 'IN_02', content: 'P-value of 0.003 indicates statistical significance', category: 'statistics' },
]);

const VALID_S9_OUTPUT = JSON.stringify([
  { id: 'JP_01', name: 'Jane Smith', outlet: 'TechCrunch', coverage: 'Covers transportation tech', expertise: ['transportation', 'urban planning'] },
  { id: 'JP_02', name: 'John Doe', outlet: 'Wired', coverage: 'Infrastructure reporter' },
]);

const VALID_S1_OUTPUT = JSON.stringify({
  name: 'Birth Injury Law March 2026',
  clientName: 'Birth Injury Law',
  studyTitle: 'The Cost of Having a Baby',
  topic: 'Birth injury costs in America',
  targetRegion: 'United States',
  targetBeats: ['Health', 'Personal Finance', "Women's Health"],
  goal: 'Earn national media coverage about birth injury costs',
  tone: 'Professional',
  notes: 'Campaign targeting personal finance and health journalists',
  generatedAt: '2026-05-14T15:04:36.130Z',
  status: 'intake-complete',
  briefLength: 2163,
});

const VALID_S4B_OUTPUT = JSON.stringify({
  generatedAt: '2026-05-14T15:10:00.000Z',
  clusters: [
    { id: 'cluster_1', insight: 'Birth injury costs vary significantly by state', confidence: 'high', priority: 'high' },
    { id: 'cluster_2', insight: 'Insurance coverage gaps create financial strain', confidence: 'medium', priority: 'medium' },
  ],
  totals: { insights: 2, highPriority: 1 },
});

// ---------------------------------------------------------------------------
// isDryRunOutput
// ---------------------------------------------------------------------------
describe('isDryRunOutput', () => {
  it('returns true for exact dry-run string', () => {
    expect(isDryRunOutput(DRY_RUN_STRING)).toBe(true);
  });

  it('returns true for dry-run string with extra trailing whitespace', () => {
    expect(isDryRunOutput(DRY_RUN_STRING + '  ')).toBe(true);
  });

  it('returns false for normal output', () => {
    expect(isDryRunOutput(JSON.stringify({ key: 'value' }))).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isDryRunOutput('')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isFallbackContent
// ---------------------------------------------------------------------------
describe('isFallbackContent', () => {
  it('returns true for fallback-marker content', () => {
    expect(isFallbackContent('This is a (Fallback) extraction')).toBe(true);
  });

  it('returns true for scaffold content', () => {
    expect(isFallbackContent('inventory scaffold content here')).toBe(true);
  });

  it('returns false for clean content', () => {
    expect(isFallbackContent('Real analysis output with actual data')).toBe(false);
  });

  it('returns false for valid JSON output', () => {
    expect(isFallbackContent(VALID_S4_OUTPUT)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// extractJsonFromOutput
// ---------------------------------------------------------------------------
describe('extractJsonFromOutput', () => {
  it('returns plain JSON verbatim', () => {
    expect(extractJsonFromOutput(VALID_S4_OUTPUT)).toBe(VALID_S4_OUTPUT);
  });

  it('extracts JSON from ```json code block', () => {
    const markdown = `Here is the analysis:\n\`\`\`json\n${VALID_S10_OUTPUT}\n\`\`\`\nEnd.`;
    expect(extractJsonFromOutput(markdown)).toBe(VALID_S10_OUTPUT);
  });

  it('extracts { } object from ad-hoc text', () => {
    const adhoc = `Analysis complete. Result: ${VALID_S4_OUTPUT}. References attached.`;
    expect(extractJsonFromOutput(adhoc)).toBe(VALID_S4_OUTPUT);
  });

  it('extracts [ ] array from ad-hoc text', () => {
    const adhoc = `Here are the insights:\n${VALID_S2_OUTPUT}`;
    expect(extractJsonFromOutput(adhoc)).toBe(VALID_S2_OUTPUT);
  });

  it('returns null for output with no JSON', () => {
    expect(extractJsonFromOutput('Just a plain text response with no JSON at all.')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(extractJsonFromOutput('')).toBeNull();
  });

  it('prefers ```json block over ad-hoc { }', () => {
    const tricky = `Some text \`\`\`json\n${VALID_S10_OUTPUT}\n\`\`\` and also { "invalid": `;
    expect(extractJsonFromOutput(tricky)).toBe(VALID_S10_OUTPUT);
  });
});

// ---------------------------------------------------------------------------
// validateLLMOutput — basic scenarios
// ---------------------------------------------------------------------------
describe('validateLLMOutput', () => {
  it('returns passed for valid S4 output matching S4AnalysisSchema', () => {
    const result = validateLLMOutput('S4A_DATA_RESEARCH_ANALYST', VALID_S4_OUTPUT);
    expect(result.status).toBe('passed');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.parsed).toBeDefined();
  });

  it('returns passed for valid S10 output matching PitchOutputSchema', () => {
    const result = validateLLMOutput('S10_PITCH_DRAFTING', VALID_S10_OUTPUT);
    expect(result.status).toBe('passed');
    expect(result.valid).toBe(true);
  });

  it('returns passed for valid S2 output matching InsightNoteSchema array', () => {
    const result = validateLLMOutput('S2_DATA_EXTRACTION', VALID_S2_OUTPUT);
    expect(result.status).toBe('passed');
    expect(result.valid).toBe(true);
  });

  it('returns passed for valid S9 output matching JournalistProfileSchema array', () => {
    const result = validateLLMOutput('S9_JOURNALIST_INTELLIGENCE', VALID_S9_OUTPUT);
    expect(result.status).toBe('passed');
    expect(result.valid).toBe(true);
  });

  it('returns failed for output that does not match schema', () => {
    const badOutput = JSON.stringify({ wrong_field: 'value', dataQualityScore: 'not-a-number' });
    const result = validateLLMOutput('S4A_DATA_RESEARCH_ANALYST', badOutput);
    expect(result.status).toBe('failed');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('returns failed for malformed JSON that cannot be parsed', () => {
    const result = validateLLMOutput('S4A_DATA_RESEARCH_ANALYST', '{ invalid json here');
    expect(result.status).toBe('failed');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('No valid JSON found in output');
  });
});

// ---------------------------------------------------------------------------
// validateLLMOutput — dry-run, fallback, edge cases
// ---------------------------------------------------------------------------
describe('validateLLMOutput — safety modes', () => {
  it('skips validation for dry-run output', () => {
    const result = validateLLMOutput('S4A_DATA_RESEARCH_ANALYST', DRY_RUN_STRING);
    expect(result.status).toBe('skipped');
    expect(result.valid).toBe(true);
    expect(result.errors).toContain('Dry-run mode');
  });

  it('skips validation for fallback content', () => {
    const result = validateLLMOutput('S4A_DATA_RESEARCH_ANALYST', 'This is a (Fallback) extraction');
    expect(result.status).toBe('skipped');
    expect(result.valid).toBe(true);
    expect(result.errors).toContain('Fallback content detected');
  });

  it('skips validation when no schema is registered for stage', () => {
    const result = validateLLMOutput('UNKNOWN_STAGE', VALID_S4_OUTPUT);
    expect(result.status).toBe('skipped');
    expect(result.valid).toBe(true);
    expect(result.errors).toContain('No schema registered for stage: UNKNOWN_STAGE');
  });

  it('skips validation for empty output', () => {
    const result = validateLLMOutput('S4A_DATA_RESEARCH_ANALYST', '');
    expect(result.status).toBe('skipped');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Empty output');
  });
});

// ---------------------------------------------------------------------------
// validateLLMOutput — extraction + validation combined
// ---------------------------------------------------------------------------
describe('validateLLMOutput — extraction from various formats', () => {
  it('validates JSON extracted from ```json code block', () => {
    const markdown = `Here is the pitch:\n\`\`\`json\n${VALID_S10_OUTPUT}\n\`\`\`\n`;
    const result = validateLLMOutput('S10_PITCH_DRAFTING', markdown);
    expect(result.status).toBe('passed');
    expect(result.valid).toBe(true);
  });

  it('validates JSON extracted from ad-hoc text', () => {
    const adhoc = `Result: ${VALID_S4_OUTPUT}. Please review.`;
    const result = validateLLMOutput('S4A_DATA_RESEARCH_ANALYST', adhoc);
    expect(result.status).toBe('passed');
    expect(result.valid).toBe(true);
  });

  it('validates JSON array extracted from ad-hoc text', () => {
    const adhoc = `Discovered the following insights:\n${VALID_S2_OUTPUT}`;
    const result = validateLLMOutput('S2_DATA_EXTRACTION', adhoc);
    expect(result.status).toBe('passed');
    expect(result.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// STAGE_SCHEMA_REGISTRY completeness
// ---------------------------------------------------------------------------
describe('STAGE_SCHEMA_REGISTRY', () => {
  it('contains all expected registered stages', () => {
    const expectedStages = [
      'S1_CAMPAIGN_INTAKE',
      'S4A_DATA_RESEARCH_ANALYST',
      'S4B_INSIGHT_ANALYST',
      'S10_PITCH_DRAFTING',
      'S9_JOURNALIST_INTELLIGENCE',
      'S2_DATA_EXTRACTION',
    ];
    for (const stage of expectedStages) {
      expect(STAGE_SCHEMA_REGISTRY).toHaveProperty(stage);
    }
  });

  it('does not contain intentionally deferred stages S3, S13, S16', () => {
    expect(STAGE_SCHEMA_REGISTRY).not.toHaveProperty('S3_RESEARCH_ENRICHMENT');
    expect(STAGE_SCHEMA_REGISTRY).not.toHaveProperty('S13_VALIDATION');
    expect(STAGE_SCHEMA_REGISTRY).not.toHaveProperty('S16_CAMPAIGN_LOG_LEARNING_LOOP');
  });

  it('each entry is a Zod schema (has safeParse)', () => {
    for (const [, schema] of Object.entries(STAGE_SCHEMA_REGISTRY)) {
      expect(schema).toHaveProperty('safeParse');
    }
  });
});

// ---------------------------------------------------------------------------
// validateJsonBeforeWrite — Blocking write-time validation
// ---------------------------------------------------------------------------
describe('validateJsonBeforeWrite', () => {
  it('allows valid registered JSON', () => {
    const result = validateJsonBeforeWrite('S4A_DATA_RESEARCH_ANALYST', VALID_S4_OUTPUT);
    expect(result.allowed).toBe(true);
    expect(result.status).toBe('passed');
    expect(result.errors).toHaveLength(0);
  });

  it('blocks invalid registered JSON', () => {
    const badOutput = JSON.stringify({ wrong_field: 'value', dataQualityScore: 'not-a-number' });
    const result = validateJsonBeforeWrite('S4A_DATA_RESEARCH_ANALYST', badOutput);
    expect(result.allowed).toBe(false);
    expect(result.status).toBe('failed');
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('blocks dry-run string for registered JSON stage', () => {
    const result = validateJsonBeforeWrite('S4A_DATA_RESEARCH_ANALYST', DRY_RUN_STRING);
    expect(result.allowed).toBe(false);
    expect(result.status).toBe('skipped_dry_run');
    expect(result.errors).toContain('Dry-run mode');
  });

  it('blocks fallback content for registered JSON stage', () => {
    const result = validateJsonBeforeWrite('S4A_DATA_RESEARCH_ANALYST', 'This is a (Fallback) extraction');
    expect(result.allowed).toBe(false);
    expect(result.status).toBe('skipped_fallback');
    expect(result.errors).toContain('Fallback content detected');
  });

  it('blocks empty output for registered JSON stage', () => {
    const result = validateJsonBeforeWrite('S4A_DATA_RESEARCH_ANALYST', '');
    expect(result.allowed).toBe(false);
    expect(result.status).toBe('skipped_empty');
    expect(result.errors).toContain('Empty output');
  });

  it('allows unregistered JSON stage (pass-through policy)', () => {
    const result = validateJsonBeforeWrite('UNKNOWN_STAGE', VALID_S4_OUTPUT);
    expect(result.allowed).toBe(true);
    expect(result.status).toBe('skipped_unregistered');
    expect(result.errors).toContain('No schema registered for stage: UNKNOWN_STAGE');
  });
});

// ---------------------------------------------------------------------------
// S1 Campaign Intake Schema Tests
// ---------------------------------------------------------------------------
describe('S1 CampaignIntakeRealSchema', () => {
  it('returns passed for valid S1 camelCase output', () => {
    const result = validateLLMOutput('S1_CAMPAIGN_INTAKE', VALID_S1_OUTPUT);
    expect(result.status).toBe('passed');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.parsed).toBeDefined();
  });

  it('returns failed for S1 output missing required name', () => {
    const bad = JSON.stringify({ topic: 'test', targetRegion: 'US', tone: 'Professional', generatedAt: 'now', status: 'ok', briefLength: 100 });
    const result = validateLLMOutput('S1_CAMPAIGN_INTAKE', bad);
    expect(result.status).toBe('failed');
    expect(result.valid).toBe(false);
  });

  it('returns failed for S1 output with briefLength as string', () => {
    const bad = JSON.stringify({
      name: 'Test', topic: 'test', targetRegion: 'US', tone: 'Professional',
      generatedAt: 'now', status: 'ok', briefLength: 'not-a-number',
    });
    const result = validateLLMOutput('S1_CAMPAIGN_INTAKE', bad);
    expect(result.status).toBe('failed');
    expect(result.valid).toBe(false);
  });

  it('returns failed for empty S1 object', () => {
    const result = validateLLMOutput('S1_CAMPAIGN_INTAKE', '{}');
    expect(result.status).toBe('failed');
    expect(result.valid).toBe(false);
  });

  it('validateJsonBeforeWrite blocks invalid S1 JSON', () => {
    const result = validateJsonBeforeWrite('S1_CAMPAIGN_INTAKE', '{}');
    expect(result.allowed).toBe(false);
    expect(result.status).toBe('failed');
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// S4B ClustersAnalysisSchema Tests
// ---------------------------------------------------------------------------
describe('S4B ClustersAnalysisSchema', () => {
  it('returns passed for valid S4B clusters output', () => {
    const result = validateLLMOutput('S4B_INSIGHT_ANALYST', VALID_S4B_OUTPUT);
    expect(result.status).toBe('passed');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.parsed).toBeDefined();
  });

  it('returns failed for S4B output missing generatedAt', () => {
    const bad = JSON.stringify({
      clusters: [{ id: 'c1', insight: 'test', confidence: 'high', priority: 'high' }],
      totals: { insights: 1, highPriority: 1 },
    });
    const result = validateLLMOutput('S4B_INSIGHT_ANALYST', bad);
    expect(result.status).toBe('failed');
    expect(result.valid).toBe(false);
  });

  it('returns failed for S4B output missing clusters', () => {
    const bad = JSON.stringify({ generatedAt: 'now', totals: { insights: 1, highPriority: 0 } });
    const result = validateLLMOutput('S4B_INSIGHT_ANALYST', bad);
    expect(result.status).toBe('failed');
    expect(result.valid).toBe(false);
  });

  it('returns failed for S4B output missing totals', () => {
    const bad = JSON.stringify({
      generatedAt: 'now',
      clusters: [{ id: 'c1', insight: 'test', confidence: 'high', priority: 'high' }],
    });
    const result = validateLLMOutput('S4B_INSIGHT_ANALYST', bad);
    expect(result.status).toBe('failed');
    expect(result.valid).toBe(false);
  });

  it('returns failed when clusters is not an array', () => {
    const bad = JSON.stringify({ generatedAt: 'now', clusters: 'not-an-array', totals: { insights: 1, highPriority: 0 } });
    const result = validateLLMOutput('S4B_INSIGHT_ANALYST', bad);
    expect(result.status).toBe('failed');
    expect(result.valid).toBe(false);
  });

  it('returns failed when totals.insights is a string', () => {
    const bad = JSON.stringify({
      generatedAt: 'now',
      clusters: [{ id: 'c1', insight: 'test', confidence: 'high', priority: 'high' }],
      totals: { insights: 'not-a-number', highPriority: 0 },
    });
    const result = validateLLMOutput('S4B_INSIGHT_ANALYST', bad);
    expect(result.status).toBe('failed');
    expect(result.valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Deferred Stage Pass-Through Tests
// ---------------------------------------------------------------------------
describe('Deferred stages S3, S13, S16 remain unregistered', () => {
  it('S3_RESEARCH_ENRICHMENT passes through as unregistered', () => {
    const telemetry = validateLLMOutput('S3_RESEARCH_ENRICHMENT', VALID_S1_OUTPUT);
    expect(telemetry.status).toBe('skipped');
    expect(telemetry.valid).toBe(true);
    expect(telemetry.errors).toContain('No schema registered for stage: S3_RESEARCH_ENRICHMENT');

    const write = validateJsonBeforeWrite('S3_RESEARCH_ENRICHMENT', VALID_S1_OUTPUT);
    expect(write.allowed).toBe(true);
    expect(write.status).toBe('skipped_unregistered');
  });

  it('S13_VALIDATION passes through as unregistered', () => {
    const telemetry = validateLLMOutput('S13_VALIDATION', VALID_S1_OUTPUT);
    expect(telemetry.status).toBe('skipped');
    expect(telemetry.valid).toBe(true);
    expect(telemetry.errors).toContain('No schema registered for stage: S13_VALIDATION');

    const write = validateJsonBeforeWrite('S13_VALIDATION', VALID_S1_OUTPUT);
    expect(write.allowed).toBe(true);
    expect(write.status).toBe('skipped_unregistered');
  });

  it('S16_CAMPAIGN_LOG_LEARNING_LOOP passes through as unregistered', () => {
    const telemetry = validateLLMOutput('S16_CAMPAIGN_LOG_LEARNING_LOOP', VALID_S1_OUTPUT);
    expect(telemetry.status).toBe('skipped');
    expect(telemetry.valid).toBe(true);
    expect(telemetry.errors).toContain('No schema registered for stage: S16_CAMPAIGN_LOG_LEARNING_LOOP');

    const write = validateJsonBeforeWrite('S16_CAMPAIGN_LOG_LEARNING_LOOP', VALID_S1_OUTPUT);
    expect(write.allowed).toBe(true);
    expect(write.status).toBe('skipped_unregistered');
  });
});
