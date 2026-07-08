import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';

const { mockFiles, mockFileContents } = vi.hoisted(() => {
  const mockFiles: string[] = [];
  const mockFileContents = new Map<string, string>();
  return { mockFiles, mockFileContents };
});

vi.mock('fs/promises', () => {
  const mock = {
    readdir: vi.fn(async () => mockFiles),
    readFile: vi.fn(async (p: string) => {
      const c = mockFileContents.get(p);
      if (c === undefined) throw new Error(`ENOENT: ${p}`);
      return c;
    }),
    access: vi.fn(async (p: string) => {
      if (!mockFileContents.has(p)) throw new Error(`ENOENT: ${p}`);
    }),
    mkdir: vi.fn(async () => undefined),
  };
  return { default: mock, ...mock };
});

vi.mock('@/lib/requestGuard', () => ({
  PITCH_JOBS_ROOT: 'D:\\Codex Folder\\digital-pr-agents\\pitch-jobs',
}));

const PITCH_JOBS_ROOT = 'D:\\Codex Folder\\digital-pr-agents\\pitch-jobs';
const TEST_CAMPAIGN = 'test-campaign';
const CAMPAIGN_PATH = path.join(PITCH_JOBS_ROOT, TEST_CAMPAIGN);

function addCampaignFile(name: string, content: string) {
  if (!mockFiles.includes(name)) {
    mockFiles.push(name);
  }
  mockFileContents.set(path.join(CAMPAIGN_PATH, name), content);
}

function resetMockFs() {
  mockFiles.length = 0;
  mockFileContents.clear();
}

function addStageFileForCurrentStage(stage: number) {
  addCampaignFile('stage.json', JSON.stringify({ currentStage: stage }));
}

describe('runG4HumanSelectionGate - human-approval.json (single object)', () => {
  beforeEach(() => {
    resetMockFs();
    addStageFileForCurrentStage(7);
  });

  it('passes before S7 regardless of approval state', async () => {
    addStageFileForCurrentStage(6);
    const { runG4HumanSelectionGate } = await import('@/lib/gateSystem');
    const result = await runG4HumanSelectionGate(TEST_CAMPAIGN);

    expect(result.status).toBe('pass');
    expect(result.canContinue).toBe(true);
    expect(result.reason).toContain('before S7');
  });

  it('passes with approved + verified + selectedAngleId', async () => {
    addCampaignFile('human-approval.json', JSON.stringify({
      status: 'approved',
      selectedAngleId: 'angle-1',
      provenanceStatus: 'verified',
    }));
    const { runG4HumanSelectionGate } = await import('@/lib/gateSystem');
    const result = await runG4HumanSelectionGate(TEST_CAMPAIGN);

    expect(result.status).toBe('pass');
    expect(result.canContinue).toBe(true);
    expect(result.details?.provenanceWarning).toBeUndefined();
  });

  it('passes with approved + verified + selectedAngleTitle', async () => {
    addCampaignFile('human-approval.json', JSON.stringify({
      status: 'approved',
      selectedAngleTitle: 'Test Angle Title',
      provenanceStatus: 'verified',
    }));
    const { runG4HumanSelectionGate } = await import('@/lib/gateSystem');
    const result = await runG4HumanSelectionGate(TEST_CAMPAIGN);

    expect(result.status).toBe('pass');
    expect(result.canContinue).toBe(true);
  });

  it('blocks with non_live provenance', async () => {
    addCampaignFile('human-approval.json', JSON.stringify({
      status: 'approved',
      selectedAngleId: 'angle-1',
      provenanceStatus: 'non_live',
    }));
    const { runG4HumanSelectionGate } = await import('@/lib/gateSystem');
    const result = await runG4HumanSelectionGate(TEST_CAMPAIGN);

    expect(result.status).toBe('blocked');
    expect(result.canContinue).toBe(false);
    expect(result.reason).toContain('non-live');
  });

  it('blocks with explicit missing provenance', async () => {
    addCampaignFile('human-approval.json', JSON.stringify({
      status: 'approved',
      selectedAngleId: 'angle-1',
      provenanceStatus: 'missing',
    }));
    const { runG4HumanSelectionGate } = await import('@/lib/gateSystem');
    const result = await runG4HumanSelectionGate(TEST_CAMPAIGN);

    expect(result.status).toBe('blocked');
    expect(result.canContinue).toBe(false);
  });

  it('allows with warning on unknown provenance', async () => {
    addCampaignFile('human-approval.json', JSON.stringify({
      status: 'approved',
      selectedAngleId: 'angle-1',
      provenanceStatus: 'unknown',
    }));
    const { runG4HumanSelectionGate } = await import('@/lib/gateSystem');
    const result = await runG4HumanSelectionGate(TEST_CAMPAIGN);

    expect(result.status).toBe('pass');
    expect(result.canContinue).toBe(true);
    expect(result.details?.provenanceWarning).toBeDefined();
  });

  it('allows with warning on legacy (no provenanceStatus)', async () => {
    addCampaignFile('human-approval.json', JSON.stringify({
      status: 'approved',
      selectedAngleId: 'angle-1',
    }));
    const { runG4HumanSelectionGate } = await import('@/lib/gateSystem');
    const result = await runG4HumanSelectionGate(TEST_CAMPAIGN);

    expect(result.status).toBe('pass');
    expect(result.canContinue).toBe(true);
    expect(result.details?.provenanceWarning).toBeDefined();
  });

  it('blocks when no selectedAngleId and no selectedAngleTitle', async () => {
    addCampaignFile('human-approval.json', JSON.stringify({
      status: 'approved',
      provenanceStatus: 'verified',
    }));
    const { runG4HumanSelectionGate } = await import('@/lib/gateSystem');
    const result = await runG4HumanSelectionGate(TEST_CAMPAIGN);

    expect(result.status).toBe('needs_human_review');
    expect(result.canContinue).toBe(false);
    expect(result.reason).toContain('no angle selected');
  });

  it('blocks with whitespace-only selectedAngleId and selectedAngleTitle', async () => {
    addCampaignFile('human-approval.json', JSON.stringify({
      status: 'approved',
      selectedAngleId: '   ',
      selectedAngleTitle: '   ',
      provenanceStatus: 'verified',
    }));
    const { runG4HumanSelectionGate } = await import('@/lib/gateSystem');
    const result = await runG4HumanSelectionGate(TEST_CAMPAIGN);

    expect(result.status).toBe('needs_human_review');
    expect(result.canContinue).toBe(false);
    expect(result.reason).toContain('no angle selected');
  });

  it('blocks with whitespace-only selectedAngleId only', async () => {
    addCampaignFile('human-approval.json', JSON.stringify({
      status: 'approved',
      selectedAngleId: '   ',
      provenanceStatus: 'verified',
    }));
    const { runG4HumanSelectionGate } = await import('@/lib/gateSystem');
    const result = await runG4HumanSelectionGate(TEST_CAMPAIGN);

    expect(result.status).toBe('needs_human_review');
    expect(result.canContinue).toBe(false);
    expect(result.reason).toContain('no angle selected');
  });

  it('blocks with whitespace-only selectedAngleTitle only', async () => {
    addCampaignFile('human-approval.json', JSON.stringify({
      status: 'approved',
      selectedAngleTitle: '   ',
      provenanceStatus: 'verified',
    }));
    const { runG4HumanSelectionGate } = await import('@/lib/gateSystem');
    const result = await runG4HumanSelectionGate(TEST_CAMPAIGN);

    expect(result.status).toBe('needs_human_review');
    expect(result.canContinue).toBe(false);
    expect(result.reason).toContain('no angle selected');
  });

  it('blocks with whitespace-only selectedAngleId only (approvals.json legacy)', async () => {
    addCampaignFile('approvals.json', JSON.stringify([
      { stage: 'S7', status: 'approved', selectedAngleId: '   ', provenanceStatus: 'verified' },
    ]));
    const { runG4HumanSelectionGate } = await import('@/lib/gateSystem');
    const result = await runG4HumanSelectionGate(TEST_CAMPAIGN);

    expect(result.status).toBe('needs_human_review');
    expect(result.canContinue).toBe(false);
    expect(result.reason).toContain('no angle selected');
  });

  it('blocks when not approved (pending status)', async () => {
    addCampaignFile('human-approval.json', JSON.stringify({
      status: 'pending',
      selectedAngleId: 'angle-1',
    }));
    const { runG4HumanSelectionGate } = await import('@/lib/gateSystem');
    const result = await runG4HumanSelectionGate(TEST_CAMPAIGN);

    expect(result.status).toBe('blocked');
    expect(result.canContinue).toBe(false);
  });

  it('returns needs_human_review when human-approval.json is missing', async () => {
    const { runG4HumanSelectionGate } = await import('@/lib/gateSystem');
    const result = await runG4HumanSelectionGate(TEST_CAMPAIGN);

    expect(result.status).toBe('needs_human_review');
    expect(result.canContinue).toBe(false);
  });

  it('blocks on malformed human-approval.json', async () => {
    addCampaignFile('human-approval.json', '{bad json');
    const { runG4HumanSelectionGate } = await import('@/lib/gateSystem');
    const result = await runG4HumanSelectionGate(TEST_CAMPAIGN);

    expect(result.status).toBe('blocked');
    expect(result.canContinue).toBe(false);
    expect(result.reason).toContain('Failed to read or parse');
  });
});

describe('runG4HumanSelectionGate - legacy approvals.json (array format)', () => {
  beforeEach(() => {
    resetMockFs();
    addStageFileForCurrentStage(7);
  });

  it('passes with approved + verified + selectedAngleId', async () => {
    addCampaignFile('approvals.json', JSON.stringify([
      { stage: 'S7', status: 'approved', selectedAngleId: 'angle-1', provenanceStatus: 'verified' },
    ]));
    const { runG4HumanSelectionGate } = await import('@/lib/gateSystem');
    const result = await runG4HumanSelectionGate(TEST_CAMPAIGN);

    expect(result.status).toBe('pass');
    expect(result.canContinue).toBe(true);
  });

  it('blocks with non_live provenance', async () => {
    addCampaignFile('approvals.json', JSON.stringify([
      { stage: 'S7', status: 'approved', selectedAngleId: 'angle-1', provenanceStatus: 'non_live' },
    ]));
    const { runG4HumanSelectionGate } = await import('@/lib/gateSystem');
    const result = await runG4HumanSelectionGate(TEST_CAMPAIGN);

    expect(result.status).toBe('blocked');
    expect(result.canContinue).toBe(false);
    expect(result.reason).toContain('non-live');
  });

  it('allows with warning on legacy approvals.json entry (no provenanceStatus)', async () => {
    addCampaignFile('approvals.json', JSON.stringify([
      { stage: 'S7', status: 'approved', selectedAngleId: 'angle-1' },
    ]));
    const { runG4HumanSelectionGate } = await import('@/lib/gateSystem');
    const result = await runG4HumanSelectionGate(TEST_CAMPAIGN);

    expect(result.status).toBe('pass');
    expect(result.canContinue).toBe(true);
    expect(result.details?.provenanceWarning).toBeDefined();
  });

  it('blocks with whitespace-only selectedAngleId (legacy)', async () => {
    addCampaignFile('approvals.json', JSON.stringify([
      { stage: 'S7', status: 'approved', selectedAngleId: '   ', provenanceStatus: 'verified' },
    ]));
    const { runG4HumanSelectionGate } = await import('@/lib/gateSystem');
    const result = await runG4HumanSelectionGate(TEST_CAMPAIGN);

    expect(result.status).toBe('needs_human_review');
    expect(result.canContinue).toBe(false);
    expect(result.reason).toContain('no angle selected');
  });

  it('blocks with whitespace-only selectedAngleTitle (legacy)', async () => {
    addCampaignFile('approvals.json', JSON.stringify([
      { stage: 'S7', status: 'approved', selectedAngleTitle: '   ', provenanceStatus: 'verified' },
    ]));
    const { runG4HumanSelectionGate } = await import('@/lib/gateSystem');
    const result = await runG4HumanSelectionGate(TEST_CAMPAIGN);

    expect(result.status).toBe('needs_human_review');
    expect(result.canContinue).toBe(false);
    expect(result.reason).toContain('no angle selected');
  });

  it('blocks when no S7 entry found', async () => {
    addCampaignFile('approvals.json', JSON.stringify([
      { stage: 'S6', status: 'approved', selectedAngleId: 'angle-1' },
    ]));
    const { runG4HumanSelectionGate } = await import('@/lib/gateSystem');
    const result = await runG4HumanSelectionGate(TEST_CAMPAIGN);

    expect(result.status).toBe('needs_human_review');
    expect(result.canContinue).toBe(false);
  });

  it('returns needs_human_review when approvals.json is missing', async () => {
    const { runG4HumanSelectionGate } = await import('@/lib/gateSystem');
    const result = await runG4HumanSelectionGate(TEST_CAMPAIGN);

    expect(result.status).toBe('needs_human_review');
    expect(result.canContinue).toBe(false);
  });
});

describe('runG4HumanSelectionGate - regression: silent-pass bug', () => {
  beforeEach(() => {
    resetMockFs();
    addStageFileForCurrentStage(7);
  });

  it('does not silently pass when human-approval.json contains an array', async () => {
    addCampaignFile('human-approval.json', JSON.stringify([
      { stage: 'S7', status: 'approved', selectedAngleId: 'angle-1' },
    ]));
    const { runG4HumanSelectionGate } = await import('@/lib/gateSystem');
    const result = await runG4HumanSelectionGate(TEST_CAMPAIGN);

    expect(result.status).toBe('blocked');
    expect(result.canContinue).toBe(false);
    expect(result.reason).toContain('unexpected format');
  });

  it('does not silently pass when approvals.json contains an object', async () => {
    addCampaignFile('approvals.json', JSON.stringify({ status: 'approved' }));
    const { runG4HumanSelectionGate } = await import('@/lib/gateSystem');
    const result = await runG4HumanSelectionGate(TEST_CAMPAIGN);

    expect(result.status).toBe('blocked');
    expect(result.canContinue).toBe(false);
    expect(result.reason).toContain('unexpected format');
  });
});
