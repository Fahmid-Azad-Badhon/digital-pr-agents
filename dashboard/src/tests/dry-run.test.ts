import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseRunMode, shouldBlockExternalAction, getRunModeFromEnv, getRunModeFromRequest, describeRunMode, RunMode } from '@/lib/runMode';

// =============================================================================
// Helpers
// =============================================================================

function setRunMode(mode: RunMode | undefined) {
  if (mode === undefined) {
    delete process.env.RUN_MODE;
  } else {
    process.env.RUN_MODE = mode;
  }
}

// =============================================================================
// RunMode Utility Tests
// =============================================================================

describe('parseRunMode', () => {
  it('parses valid dry_run', () => {
    expect(parseRunMode('dry_run')).toBe('dry_run');
  });

  it('parses valid preview', () => {
    expect(parseRunMode('preview')).toBe('preview');
  });

  it('parses valid live', () => {
    expect(parseRunMode('live')).toBe('live');
  });

  it('parses valid test', () => {
    expect(parseRunMode('test')).toBe('test');
  });

  it('returns dry_run for null input', () => {
    expect(parseRunMode(null)).toBe('dry_run');
  });

  it('returns dry_run for undefined input', () => {
    expect(parseRunMode(undefined)).toBe('dry_run');
  });

  it('returns dry_run for empty string', () => {
    expect(parseRunMode('')).toBe('dry_run');
  });

  it('returns dry_run for random string', () => {
    expect(parseRunMode('invalid_mode_here')).toBe('dry_run');
  });

  it('returns dry_run for number input', () => {
    expect(parseRunMode(42)).toBe('dry_run');
  });

  it('returns dry_run for object input', () => {
    expect(parseRunMode({})).toBe('dry_run');
  });
});

describe('shouldBlockExternalAction', () => {
  it('blocks dry_run', () => {
    expect(shouldBlockExternalAction('dry_run')).toBe(true);
  });

  it('blocks preview', () => {
    expect(shouldBlockExternalAction('preview')).toBe(true);
  });

  it('blocks test', () => {
    expect(shouldBlockExternalAction('test')).toBe(true);
  });

  it('allows live', () => {
    expect(shouldBlockExternalAction('live')).toBe(false);
  });
});

describe('getRunModeFromEnv', () => {
  afterEach(() => {
    setRunMode(undefined);
  });

  it('reads RUN_MODE from env', () => {
    setRunMode('live');
    expect(getRunModeFromEnv()).toBe('live');
  });

  it('returns dry_run when env is not set', () => {
    setRunMode(undefined);
    expect(getRunModeFromEnv()).toBe('dry_run');
  });

  it('returns dry_run when env is invalid', () => {
    process.env.RUN_MODE = 'bogus';
    expect(getRunModeFromEnv()).toBe('dry_run');
  });
});

describe('getRunModeFromRequest', () => {
  afterEach(() => {
    setRunMode(undefined);
  });

  it('reads x-run-mode header', () => {
    const request = { headers: { get: (name: string) => name === 'x-run-mode' ? 'live' : null } };
    expect(getRunModeFromRequest(request)).toBe('live');
  });

  it('falls back to env when header is missing', () => {
    setRunMode('preview');
    const request = { headers: { get: () => null } };
    expect(getRunModeFromRequest(request)).toBe('preview');
  });

  it('falls back to dry_run when both header and env are missing/invalid', () => {
    setRunMode(undefined);
    const request = { headers: { get: () => null } };
    expect(getRunModeFromRequest(request)).toBe('dry_run');
  });

  it('returns dry_run for invalid header value', () => {
    setRunMode(undefined);
    const request = { headers: { get: () => 'nope' } };
    expect(getRunModeFromRequest(request)).toBe('dry_run');
  });
});

describe('describeRunMode', () => {
  it('returns description for each mode', () => {
    expect(describeRunMode('dry_run')).toContain('blocked');
    expect(describeRunMode('preview')).toContain('blocked');
    expect(describeRunMode('test')).toContain('blocked');
    expect(describeRunMode('live')).toContain('allowed');
  });
});

// =============================================================================
// LLM Service Guard Tests
// =============================================================================

describe('callLLM dry-run guard', () => {
  beforeEach(() => {
    setRunMode('dry_run');
  });

  afterEach(() => {
    setRunMode(undefined);
    vi.restoreAllMocks();
  });

  it('does not call globalThis.fetch in dry_run mode', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { callLLM } = await import('@/lib/llmService');

    const result = await callLLM('test prompt');

    expect(result).toContain('DRY RUN');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('runShadowTest dry-run guard', () => {
  beforeEach(() => {
    setRunMode('dry_run');
  });

  afterEach(() => {
    setRunMode(undefined);
    vi.restoreAllMocks();
  });

  it('returns null and does not call globalThis.fetch in dry_run mode', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { runShadowTest } = await import('@/lib/llmService');

    const result = await runShadowTest('test prompt', 'model-a', 'model-b');

    expect(result).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

// =============================================================================
// Web Search Guard Tests
// =============================================================================

describe('fetchWebPage dry-run guard', () => {
  beforeEach(() => {
    setRunMode('dry_run');
  });

  afterEach(() => {
    setRunMode(undefined);
    vi.restoreAllMocks();
  });

  it('returns null and does not call globalThis.fetch in dry_run mode', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { fetchWebPage } = await import('@/lib/webSearch');

    const result = await fetchWebPage('https://example.com');

    expect(result).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('searchNews dry-run guard', () => {
  beforeEach(() => {
    setRunMode('dry_run');
  });

  afterEach(() => {
    setRunMode(undefined);
    vi.restoreAllMocks();
  });

  it('returns fallback URLs and does not call globalThis.fetch in dry_run mode', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { searchNews } = await import('@/lib/webSearch');

    const result = await searchNews(['test', 'keywords']);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('performWebResearch dry-run guard', () => {
  beforeEach(() => {
    setRunMode('dry_run');
  });

  afterEach(() => {
    setRunMode(undefined);
    vi.restoreAllMocks();
  });

  it('returns empty result and does not call globalThis.fetch in dry_run mode', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { performWebResearch } = await import('@/lib/webSearch');

    const result = await performWebResearch('test topic', ['keyword']);

    expect(result.success).toBe(false);
    expect(result.findings).toEqual([]);
    expect(result.sources).toEqual([]);
    expect(result.error).toContain('Dry run');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

// =============================================================================
// Script Runner Guard Tests
// =============================================================================

describe('runScriptAction dry-run guard', () => {
  beforeEach(() => {
    setRunMode('dry_run');
  });

  afterEach(() => {
    setRunMode(undefined);
    vi.restoreAllMocks();
  });

  it('blocks export_google_doc before spawn is called', async () => {
    const { runScriptAction } = await import('@/lib/scriptRunner');

    const error = await runScriptAction('export_google_doc', { campaignId: 'test' })
      .then(() => null, e => e);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('external script blocked');
  });

  it('blocks import_muckrack_output before spawn is called', async () => {
    const { runScriptAction } = await import('@/lib/scriptRunner');

    const error = await runScriptAction('import_muckrack_output', { campaignId: 'test' })
      .then(() => null, e => e);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('external script blocked');
  });

});
