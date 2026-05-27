import { describe, it, expect, vi } from 'vitest';
import { getOutputType, saveStageOutput } from '@/lib/stageExecutor';

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

const VALID_S2_OUTPUT = JSON.stringify([
  { id: 'IN_01', content: 'Traffic increased by 40% year-over-year', source: 'State DOT Report 2024', category: 'statistics' },
]);

const INVALID_JSON = JSON.stringify({ wrong_field: 'value', dataQualityScore: 'not-a-number' });

const DRY_RUN_STRING = '[DRY RUN] External call blocked. No live LLM fetch performed.';

// =========================================================================
// getOutputType — Classification
// =========================================================================
describe('getOutputType', () => {
  it('returns json for S2 stage', () => {
    expect(getOutputType('S2_DATA_EXTRACTION')).toBe('json');
  });

  it('returns markdown for S10 stage', () => {
    expect(getOutputType('S10_PITCH_DRAFTING')).toBe('markdown');
  });

  it('returns markdown for S11 stage', () => {
    expect(getOutputType('S11_OPTIMIZED_PITCH')).toBe('markdown');
  });

  it('returns json for S13 stage', () => {
    expect(getOutputType('S13_VALIDATION')).toBe('json');
  });

  it('returns json for S16 stage', () => {
    expect(getOutputType('S16_LEARNING')).toBe('json');
  });

  it('returns csv for S8 stage', () => {
    expect(getOutputType('S8_JOURNALIST_LIST')).toBe('csv');
  });
});

// =========================================================================
// saveStageOutput — JSON write enforcement
// =========================================================================
describe('saveStageOutput — JSON enforcement', () => {
  it('writes valid JSON for registered stage', async () => {
    const result = await saveStageOutput('test-campaign', 'S2_DATA_EXTRACTION', VALID_S2_OUTPUT, 'json');
    expect(result).toContain('02-insights.md');
  });

  it('blocks invalid JSON before write', async () => {
    await expect(
      saveStageOutput('test-campaign', 'S2_DATA_EXTRACTION', INVALID_JSON, 'json')
    ).rejects.toThrow('JSON validation blocked write for stage S2_DATA_EXTRACTION [failed]');
  });

  it('blocks dry-run string before write', async () => {
    await expect(
      saveStageOutput('test-campaign', 'S2_DATA_EXTRACTION', DRY_RUN_STRING, 'json')
    ).rejects.toThrow('JSON validation blocked write for stage S2_DATA_EXTRACTION [skipped_dry_run]');
  });

  it('blocks fallback content before write', async () => {
    await expect(
      saveStageOutput('test-campaign', 'S2_DATA_EXTRACTION', 'This is a (Fallback) extraction', 'json')
    ).rejects.toThrow('JSON validation blocked write for stage S2_DATA_EXTRACTION [skipped_fallback]');
  });

  it('blocks empty output before write', async () => {
    await expect(
      saveStageOutput('test-campaign', 'S2_DATA_EXTRACTION', '', 'json')
    ).rejects.toThrow('JSON validation blocked write for stage S2_DATA_EXTRACTION [skipped_empty]');
  });

  it('bypasses markdown output', async () => {
    const result = await saveStageOutput('test-campaign', 'S10_PITCH_DRAFTING', 'Some markdown content', 'markdown');
    expect(result).toContain('08-pitch-draft.md');
  });

  it('bypasses CSV output', async () => {
    const result = await saveStageOutput('test-campaign', 'S8_JOURNALIST_LIST', 'name,title,beat\nJohn,Reporter,Tech', 'csv');
    expect(result).toContain('s8-output.csv');
  });

  it('allows unregistered JSON stage', async () => {
    const result = await saveStageOutput('test-campaign', 'S13_VALIDATION', VALID_S2_OUTPUT, 'json');
    expect(result).toContain('s13-output.json');
  });
});
