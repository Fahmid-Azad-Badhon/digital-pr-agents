import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs/promises';
import { getOutputType, saveStageOutput, executeStage } from '@/lib/stageExecutor';
import { getStageRoutingInfo, stageRequiresHumanApproval, runStageWithFallback, logModelRun } from '@/lib/modelRouter';

vi.mock('fs/promises', () => ({
  default: {
    access: vi.fn().mockResolvedValue(undefined),
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/lib/modelRouter', () => ({
  getStageOutputFile: vi.fn((stageId: string) => {
    const map: Record<string, string> = {
      S1_CAMPAIGN_INTAKE: '01-campaign-intake.json',
      S2_DATA_EXTRACTION: '02-insights.md',
      S10_PITCH_DRAFTING: '08-pitch-draft.md',
      S11_OPTIMIZED_PITCH: '09-optimized-email.md',
      S13_VALIDATION: 's13-output.json',
      S16_LEARNING: 's16-output.json',
      S8_JOURNALIST_LIST: 's8-output.csv',
    };
    return map[stageId] || null;
  }),
  runStageWithFallback: vi.fn(),
  getStageRoutingInfo: vi.fn(),
  stageRequiresHumanApproval: vi.fn(),
  logModelRun: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  addLog: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Deterministic schema-valid fixtures
// ---------------------------------------------------------------------------
// S1_CAMPAIGN_INTAKE must satisfy CampaignIntakeRealSchema (z.object with 12 fields)
const VALID_S1_FIXTURE = {
  name: 'Test Campaign',
  clientName: 'Test Client',
  studyTitle: 'Study',
  topic: 'Test topic',
  targetRegion: 'US',
  targetBeats: ['Tech'],
  goal: 'Get coverage',
  tone: 'Professional',
  notes: '',
  generatedAt: '2026-05-28T00:00:00.000Z',
  status: 'intake-complete',
  briefLength: 500,
};
const VALID_S1_JSON = JSON.stringify(VALID_S1_FIXTURE);
const VALID_S1_NORMALIZED = JSON.stringify(VALID_S1_FIXTURE, null, 2);
const FENCED_S1_JSON = '```json\n' + VALID_S1_JSON + '\n```';
const ADHOC_S1_JSON = 'Some prefix text\n' + VALID_S1_JSON + '\nSome suffix text';

// S2_DATA_EXTRACTION must satisfy z.array(InsightNoteSchema)
const VALID_S2_FIXTURE = [
  { id: 'IN_01', content: 'Traffic increased by 40% year-over-year', source: 'State DOT Report 2024', category: 'statistics' },
];
const VALID_S2_JSON = JSON.stringify(VALID_S2_FIXTURE);
const VALID_S2_NORMALIZED = JSON.stringify(VALID_S2_FIXTURE, null, 2);
const FENCED_S2_JSON = '```json\n' + VALID_S2_JSON + '\n```';
const ADHOC_S2_JSON = 'Prefix\n[]\nSuffix';

// Block inputs
const INVALID_JSON = JSON.stringify({ wrong_field: 'value', dataQualityScore: 'not-a-number' });
const NON_EXTRACTABLE = 'Just plain text with no JSON structure whatsoever';
const DRY_RUN_STRING = '[DRY RUN] External call blocked. No live LLM fetch performed.';

// =========================================================================
// getOutputType — Classification
// =========================================================================
describe('getOutputType', () => {
  // JSON-producing stages (must match jsonPrefixes in getOutputType)
  it('returns json for S1 stage', () => {
    expect(getOutputType('S1_CAMPAIGN_INTAKE')).toBe('json');
  });

  it('returns json for S2 stage', () => {
    expect(getOutputType('S2_DATA_EXTRACTION')).toBe('json');
  });

  it('returns json for S3 stage', () => {
    expect(getOutputType('S3_RESEARCH_ENRICHMENT')).toBe('json');
  });

  it('returns json for S4A stage', () => {
    expect(getOutputType('S4A_DATA_RESEARCH_ANALYST')).toBe('json');
  });

  it('returns json for S4B stage', () => {
    expect(getOutputType('S4B_INSIGHT_ANALYST')).toBe('json');
  });

  it('returns json for S9 stage', () => {
    expect(getOutputType('S9_JOURNALIST_INTELLIGENCE')).toBe('json');
  });

  it('returns json for S13 stage', () => {
    expect(getOutputType('S13_VALIDATION')).toBe('json');
  });

  it('returns json for S16 stage', () => {
    expect(getOutputType('S16_LEARNING')).toBe('json');
  });

  // Markdown-producing stages (default when no JSON/CSV prefix matches)
  it('returns markdown for S5 stage', () => {
    expect(getOutputType('S5_ANGLE_GENERATION')).toBe('markdown');
  });

  it('returns markdown for S6 stage', () => {
    expect(getOutputType('S6_BEAT_MATCHING')).toBe('markdown');
  });

  it('returns markdown for S7 stage', () => {
    expect(getOutputType('S7_PITCH_SELECTION_HUMAN_GATE')).toBe('markdown');
  });

  it('returns markdown for S10 stage', () => {
    expect(getOutputType('S10_PITCH_DRAFTING')).toBe('markdown');
  });

  it('returns markdown for S11 stage', () => {
    expect(getOutputType('S11_OPTIMIZED_PITCH')).toBe('markdown');
  });

  it('returns markdown for S12 stage', () => {
    expect(getOutputType('S12_PACKAGE_ASSEMBLY')).toBe('markdown');
  });

  it('returns markdown for S14 stage', () => {
    expect(getOutputType('S14_FINAL_FORMATTING')).toBe('markdown');
  });

  it('returns markdown for S15 stage', () => {
    expect(getOutputType('S15_OUTREACH_ASSET_CREATION')).toBe('markdown');
  });

  // CSV-producing stages
  it('returns csv for S8 stage', () => {
    expect(getOutputType('S8_JOURNALIST_LIST')).toBe('csv');
  });
});

// =============================================================================
// Group A: Registered JSON stages — normalization + validation blocking
// =============================================================================
describe('saveStageOutput — registered JSON stages', () => {
  beforeEach(() => {
    vi.mocked(fs.writeFile).mockClear();
  });

  // --- S1 object normalization ---

  it('writes normalized JSON for registered S1 plain object JSON', async () => {
    await saveStageOutput('test-campaign', 'S1_CAMPAIGN_INTAKE', VALID_S1_JSON, 'json');
    expect(vi.mocked(fs.writeFile)).toHaveBeenCalledWith(
      expect.stringContaining('01-campaign-intake.json'),
      VALID_S1_NORMALIZED,
      'utf-8'
    );
  });

  it('unwraps and normalizes fenced ```json for registered S1', async () => {
    await saveStageOutput('test-campaign', 'S1_CAMPAIGN_INTAKE', FENCED_S1_JSON, 'json');
    expect(vi.mocked(fs.writeFile)).toHaveBeenCalledWith(
      expect.stringContaining('01-campaign-intake.json'),
      VALID_S1_NORMALIZED,
      'utf-8'
    );
  });

  it('unwraps and normalizes ad-hoc object JSON with surrounding text for registered S1', async () => {
    await saveStageOutput('test-campaign', 'S1_CAMPAIGN_INTAKE', ADHOC_S1_JSON, 'json');
    expect(vi.mocked(fs.writeFile)).toHaveBeenCalledWith(
      expect.stringContaining('01-campaign-intake.json'),
      VALID_S1_NORMALIZED,
      'utf-8'
    );
  });

  // --- S2 array normalization ---

  it('writes normalized JSON for registered S2 plain array JSON', async () => {
    await saveStageOutput('test-campaign', 'S2_DATA_EXTRACTION', VALID_S2_JSON, 'json');
    expect(vi.mocked(fs.writeFile)).toHaveBeenCalledWith(
      expect.stringContaining('02-insights.md'),
      VALID_S2_NORMALIZED,
      'utf-8'
    );
  });

  it('unwraps and normalizes fenced ```json array for registered S2', async () => {
    await saveStageOutput('test-campaign', 'S2_DATA_EXTRACTION', FENCED_S2_JSON, 'json');
    expect(vi.mocked(fs.writeFile)).toHaveBeenCalledWith(
      expect.stringContaining('02-insights.md'),
      VALID_S2_NORMALIZED,
      'utf-8'
    );
  });

  it('unwraps and normalizes ad-hoc empty array JSON with surrounding text for registered S2', async () => {
    await saveStageOutput('test-campaign', 'S2_DATA_EXTRACTION', ADHOC_S2_JSON, 'json');
    expect(vi.mocked(fs.writeFile)).toHaveBeenCalledWith(
      expect.stringContaining('02-insights.md'),
      '[]',
      'utf-8'
    );
  });

  // --- Validation blocking (no writeFile) ---

  it('blocks Zod-invalid JSON for registered stage and does not call writeFile', async () => {
    await expect(
      saveStageOutput('test-campaign', 'S2_DATA_EXTRACTION', INVALID_JSON, 'json')
    ).rejects.toThrow('JSON validation blocked write for stage S2_DATA_EXTRACTION [failed]');
    expect(vi.mocked(fs.writeFile)).not.toHaveBeenCalled();
  });

  it('blocks non-extractable output for registered stage and does not call writeFile', async () => {
    await expect(
      saveStageOutput('test-campaign', 'S2_DATA_EXTRACTION', NON_EXTRACTABLE, 'json')
    ).rejects.toThrow('JSON validation blocked write for stage S2_DATA_EXTRACTION [failed]');
    expect(vi.mocked(fs.writeFile)).not.toHaveBeenCalled();
  });

  it('blocks dry-run output for registered stage and does not call writeFile', async () => {
    await expect(
      saveStageOutput('test-campaign', 'S2_DATA_EXTRACTION', DRY_RUN_STRING, 'json')
    ).rejects.toThrow('JSON validation blocked write for stage S2_DATA_EXTRACTION [skipped_dry_run]');
    expect(vi.mocked(fs.writeFile)).not.toHaveBeenCalled();
  });

  it('blocks fallback content for registered stage and does not call writeFile', async () => {
    await expect(
      saveStageOutput('test-campaign', 'S2_DATA_EXTRACTION', 'This is a (Fallback) extraction', 'json')
    ).rejects.toThrow('JSON validation blocked write for stage S2_DATA_EXTRACTION [skipped_fallback]');
    expect(vi.mocked(fs.writeFile)).not.toHaveBeenCalled();
  });

  it('blocks empty output for registered stage and does not call writeFile', async () => {
    await expect(
      saveStageOutput('test-campaign', 'S2_DATA_EXTRACTION', '', 'json')
    ).rejects.toThrow('JSON validation blocked write for stage S2_DATA_EXTRACTION [skipped_empty]');
    expect(vi.mocked(fs.writeFile)).not.toHaveBeenCalled();
  });

  it('blocks invalid S1 schema for registered stage and does not call writeFile', async () => {
    const invalidS1 = JSON.stringify({ name: 'Test', topic: 'test' });
    await expect(
      saveStageOutput('test-campaign', 'S1_CAMPAIGN_INTAKE', invalidS1, 'json')
    ).rejects.toThrow('JSON validation blocked write for stage S1_CAMPAIGN_INTAKE');
    expect(vi.mocked(fs.writeFile)).not.toHaveBeenCalled();
  });
});

// =============================================================================
// Group B: Non-JSON output types — pass-through unchanged
// =============================================================================
describe('saveStageOutput — non-JSON pass-through', () => {
  beforeEach(() => {
    vi.mocked(fs.writeFile).mockClear();
  });

  it('S10 markdown writes content unchanged', async () => {
    const markdown = '# Hello\n\nSome **bold** text.';
    await saveStageOutput('test-campaign', 'S10_PITCH_DRAFTING', markdown, 'markdown');
    expect(vi.mocked(fs.writeFile)).toHaveBeenCalledWith(
      expect.stringContaining('08-pitch-draft.md'),
      markdown,
      'utf-8'
    );
  });

  it('writes CSV output unchanged', async () => {
    const csv = 'name,title,beat\nJohn,Reporter,Tech';
    await saveStageOutput('test-campaign', 'S8_JOURNALIST_LIST', csv, 'csv');
    expect(vi.mocked(fs.writeFile)).toHaveBeenCalledWith(
      expect.stringContaining('s8-output.csv'),
      csv,
      'utf-8'
    );
  });
});

// =============================================================================
// Group C: Unregistered JSON stages — pass-through with normalization
// =============================================================================
describe('saveStageOutput — unregistered JSON pass-through', () => {
  beforeEach(() => {
    vi.mocked(fs.writeFile).mockClear();
  });

  it('writes normalized JSON for unregistered S13', async () => {
    const simple = JSON.stringify({ foo: 'bar' });
    await saveStageOutput('test-campaign', 'S13_VALIDATION', simple, 'json');
    expect(vi.mocked(fs.writeFile)).toHaveBeenCalledWith(
      expect.stringContaining('s13-output.json'),
      JSON.stringify({ foo: 'bar' }, null, 2),
      'utf-8'
    );
  });

  it('writes normalized JSON for fenced unregistered S13', async () => {
    await saveStageOutput('test-campaign', 'S13_VALIDATION', '```json\n{"kept": true}\n```', 'json');
    expect(vi.mocked(fs.writeFile)).toHaveBeenCalledWith(
      expect.stringContaining('s13-output.json'),
      JSON.stringify({ kept: true }, null, 2),
      'utf-8'
    );
  });

  it('writes raw non-extractable content for unregistered S13 (pass-through policy)', async () => {
    const raw = 'Just some raw text without JSON structure';
    await saveStageOutput('test-campaign', 'S13_VALIDATION', raw, 'json');
    expect(vi.mocked(fs.writeFile)).toHaveBeenCalledWith(
      expect.stringContaining('s13-output.json'),
      raw,
      'utf-8'
    );
  });
});

// =============================================================================
// Group D: executeStage — human approval dry-run safety
// =============================================================================
describe('executeStage — human approval dry-run safety', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getStageRoutingInfo).mockReturnValue({
      primary: 'gpt_oss_120b',
      fallbacks: ['hy3_preview'],
      requiresHumanApproval: true,
    });
    vi.mocked(stageRequiresHumanApproval).mockReturnValue(true);
    vi.mocked(runStageWithFallback).mockResolvedValue({
      success: true,
      output: '',
      modelUsed: 'gpt_oss_120b',
      provider: 'openai',
      fallbackUsed: false,
      fallbackReason: undefined,
      retryCount: 0,
      durationMs: 100,
    });
    vi.mocked(logModelRun).mockReturnValue(undefined);
    vi.mocked(fs.access).mockResolvedValue(undefined);
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
  });

  it('saves human approval state when stage output is saved successfully', async () => {
    vi.mocked(runStageWithFallback).mockResolvedValue({
      success: true,
      output: VALID_S1_JSON,
      modelUsed: 'gpt_oss_120b',
      provider: 'openai',
      fallbackUsed: false,
      fallbackReason: undefined,
      retryCount: 0,
      durationMs: 100,
    });

    const result = await executeStage({
      campaignId: 'test-campaign',
      campaignSlug: 'test-campaign',
      stageId: 'S1_CAMPAIGN_INTAKE',
      input: {},
      useCase: 'test',
    });

    const writeCalls = vi.mocked(fs.writeFile).mock.calls;
    const humanApprovalCalls = writeCalls.filter(
      ([path]) => typeof path === 'string' && path.includes('human-approval.json')
    );
    expect(humanApprovalCalls).toHaveLength(1);
    expect(humanApprovalCalls[0][1]).toContain('"status": "waiting"');
    expect(result.paused).toBe(true);
  });

  it('does not save human approval state when output save is blocked (dry-run)', async () => {
    vi.mocked(runStageWithFallback).mockResolvedValue({
      success: true,
      output: DRY_RUN_STRING,
      modelUsed: 'gpt_oss_120b',
      provider: 'openai',
      fallbackUsed: false,
      fallbackReason: undefined,
      retryCount: 0,
      durationMs: 100,
    });

    const result = await executeStage({
      campaignId: 'test-campaign',
      campaignSlug: 'test-campaign',
      stageId: 'S1_CAMPAIGN_INTAKE',
      input: {},
      useCase: 'test',
    });

    const writeCalls = vi.mocked(fs.writeFile).mock.calls;
    const humanApprovalCalls = writeCalls.filter(
      ([path]) => typeof path === 'string' && path.includes('human-approval.json')
    );
    expect(humanApprovalCalls).toHaveLength(0);
    expect(result.paused).toBe(false);
  });
});
