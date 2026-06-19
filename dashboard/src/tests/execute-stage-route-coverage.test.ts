import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import fs from 'fs/promises';

vi.mock('fs/promises', () => ({
  default: {
    access: vi.fn(),
    stat: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
    rename: vi.fn(),
    readdir: vi.fn(),
    unlink: vi.fn(),
    appendFile: vi.fn(),
  },
}));

vi.mock('@/lib/authGuard', () => ({
  evaluateMutationAuth: vi.fn().mockReturnValue({ allowed: true }),
}));

vi.mock('@/lib/requestGuard', () => ({
  assertValidCampaignId: vi.fn((id: string) => id),
  resolveCampaignPath: vi.fn((id: string) => `D:\\tmp\\coverage-route-test\\${id}`),
}));

vi.mock('@/lib/logger', () => ({
  writeApiAuditLog: vi.fn().mockResolvedValue(undefined),
  writeSystemLog: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/runMode', () => ({
  getRunModeFromRequest: vi.fn(() => 'live' as const),
  shouldBlockExternalAction: vi.fn(() => false),
}));

vi.mock('@/lib/provenance', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return { ...actual };
});

vi.mock('@/lib/scriptRunner', () => ({
  runScriptAction: vi.fn().mockResolvedValue({
    exitCode: 0,
    stdout: 'mocked script output',
    stderr: '',
    durationMs: 100,
    command: 'mocked-command',
  }),
}));

vi.mock('@/lib/runtimeEvents', () => ({
  appendRuntimeEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/rateLimiter', () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true, remaining: 29, resetAt: Date.now() + 60000 })),
}));

vi.mock('@/lib/pitchGovernanceValidator', () => ({
  validateStagePitchGovernance: vi.fn().mockResolvedValue({ valid: true, issues: [] }),
}));

vi.mock('@/lib/fallbackMarkers', () => ({
  looksLikeFallback: vi.fn(() => false),
  FALLBACK_MARKERS: [],
}));

vi.mock('@/lib/stageOutputContractValidator', () => ({
  validateS10OutputContract: vi.fn().mockResolvedValue(undefined),
  validateS1OutputContract: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/types', () => ({
  STAGES: Array.from({ length: 16 }, (_, i) => ({
    number: i + 1,
    name: `Stage ${i + 1}`,
    owner: 'test',
  })),
}));

import { POST } from '@/app/api/campaigns/[id]/execute-stage/route';

const mockNow = '2026-06-01T12:00:00.000Z';

function mockRequest(body: unknown) {
  const req = new NextRequest(
    'http://localhost/api/campaigns/test/execute-stage',
    {
      method: 'POST',
      headers: {
        authorization: 'Bearer test',
        'content-type': 'application/json',
      },
    },
  );
  Object.defineProperty(req, 'json', { value: async () => body });
  return req;
}

function makeStageState(stage: number, status = 'running') {
  return JSON.stringify({
    currentStage: stage,
    status,
    updatedAt: mockNow,
  });
}

function makeApproval(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    status: 'approved',
    selectedAngleTitle: 'Test Angle',
    selectedAngleId: 'angle-001',
    provenanceStatus: 'verified',
    provenanceWarning: undefined,
    runMode: 'live',
    source: 'human_approval_ui',
    schemaVersion: 1,
    ...overrides,
  });
}

const VALID_BRIEF = '# Campaign Brief\n\nTest campaign brief content for S1 execution.\n'.repeat(10);

type FsFilePath = Parameters<typeof fs.readFile>[0];
type FsFileData = Parameters<typeof fs.writeFile>[1];

const DEFAULT_SETUP = {
  stat: () => vi.mocked(fs.stat).mockResolvedValue({ isDirectory: () => true } as import('fs').Stats),
  access: () => vi.mocked(fs.access).mockResolvedValue(undefined),
  mkdir: () => vi.mocked(fs.mkdir).mockResolvedValue(undefined),
  rename: () => vi.mocked(fs.rename).mockResolvedValue(undefined),
  writeFile: () => vi.mocked(fs.writeFile).mockResolvedValue(undefined),
  unlink: () => vi.mocked(fs.unlink).mockResolvedValue(undefined),
  appendFile: () => vi.mocked(fs.appendFile).mockResolvedValue(undefined),
};

function applyDefaultSetup() {
  DEFAULT_SETUP.stat();
  DEFAULT_SETUP.access();
  DEFAULT_SETUP.mkdir();
  DEFAULT_SETUP.rename();
  DEFAULT_SETUP.writeFile();
  DEFAULT_SETUP.unlink();
  DEFAULT_SETUP.appendFile();
}

// ---------------------------------------------------------------------------
// Guards — shared across all stages
// ---------------------------------------------------------------------------
describe('execute-stage route coverage: input guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(mockNow));
    applyDefaultSetup();
  });

  it('rejects stage 0 as out of range', async () => {
    const response = await POST(
      mockRequest({ stage: 0 }),
      { params: Promise.resolve({ id: 'test' }) },
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('INVALID_EXECUTE_STAGE_INPUT');
  });

  it('rejects stage 17 as out of range', async () => {
    const response = await POST(
      mockRequest({ stage: 17 }),
      { params: Promise.resolve({ id: 'test' }) },
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('INVALID_EXECUTE_STAGE_INPUT');
  });

  it('rejects non-integer stage', async () => {
    const response = await POST(
      mockRequest({ stage: 'abc' }),
      { params: Promise.resolve({ id: 'test' }) },
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('INVALID_EXECUTE_STAGE_INPUT');
  });

  it('rejects stage > currentStage with STAGE_ORDER_BLOCKED', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike: FsFilePath) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(5);
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest({ stage: 7 }),
      { params: Promise.resolve({ id: 'test' }) },
    );
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error).toBe('STAGE_ORDER_BLOCKED');
  });
});

// ---------------------------------------------------------------------------
// S1 — campaign intake
// ---------------------------------------------------------------------------
describe('execute-stage route coverage: S1', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(mockNow));
    applyDefaultSetup();
  });

  it('S1 blocked when 00-brief.md is missing', async () => {
    vi.mocked(fs.access).mockImplementation(async (pathLike: FsFilePath) => {
      const pStr = String(pathLike);
      if (pStr.includes('00-brief.md')) throw new Error('ENOENT');
    });

    vi.mocked(fs.readFile).mockImplementation(async (pathLike: FsFilePath) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(1);
      if (pStr.includes('circuit-state.json')) throw new Error('ENOENT');
      if (pStr.includes('.stage-lock')) throw new Error('ENOENT');
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest({ stage: 1 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();
    expect(response.status).toBe(409);
    expect(body.error).toBe('STAGE_DEPENDENCY_BLOCKED');
    expect(body.message).toMatch(/00-brief\.md/i);
  });

  it('S1 blocked when output fails schema validation (RED)', async () => {
    const { validateS1OutputContract } = await import('@/lib/stageOutputContractValidator');
    vi.mocked(validateS1OutputContract).mockRejectedValue(
      new Error('01-campaign-intake.json failed schema validation: /generatedAt: must have required property generatedAt')
    );

    vi.mocked(fs.readFile).mockImplementation(async (pathLike: FsFilePath) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(1);
      if (pStr.includes('circuit-state.json')) throw new Error('ENOENT');
      if (pStr.includes('.stage-lock')) throw new Error('ENOENT');
      if (pStr.includes('00-brief.md')) return VALID_BRIEF;
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest({ stage: 1 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('EXECUTE_STAGE_FAILED');
  });

  it('S1 succeeds when 00-brief.md exists and output passes schema validation (GREEN)', async () => {
    const { validateS1OutputContract } = await import('@/lib/stageOutputContractValidator');
    vi.mocked(validateS1OutputContract).mockResolvedValue(undefined);

    const writtenFiles: Record<string, string> = {};

    vi.mocked(fs.writeFile).mockImplementation(async (pathLike: FsFilePath, data: FsFileData) => {
      writtenFiles[String(pathLike)] = String(data);
    });

    vi.mocked(fs.rename).mockImplementation(async (from: FsFilePath, to: FsFilePath) => {
      const fromStr = String(from);
      if (writtenFiles[fromStr]) {
        writtenFiles[String(to)] = writtenFiles[fromStr];
      }
    });

    vi.mocked(fs.readFile).mockImplementation(async (pathLike: FsFilePath) => {
      const pStr = String(pathLike);
      if (writtenFiles[pStr]) return writtenFiles[pStr];
      if (pStr.includes('stage-state.json')) return makeStageState(1);
      if (pStr.includes('circuit-state.json')) throw new Error('ENOENT');
      if (pStr.includes('.stage-lock')) throw new Error('ENOENT');
      if (pStr.includes('00-brief.md')) return VALID_BRIEF;
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest({ stage: 1 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data.stage).toBe(1);
    expect(body.data.outputFile).toBe('01-campaign-intake.json');
    expect(body.data.status).toBe('running');
    expect(body.data.currentStage).toBe(2);

    expect(vi.mocked(validateS1OutputContract)).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// S2 — study input extraction
// ---------------------------------------------------------------------------
describe('execute-stage route coverage: S2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(mockNow));
    applyDefaultSetup();
  });

  it('S2 script fails and blocks in strict mode', async () => {
    const { runScriptAction } = await import('@/lib/scriptRunner');
    vi.mocked(runScriptAction).mockResolvedValue({
      exitCode: 1,
      stdout: '',
      stderr: 'script error',
      durationMs: 50,
      command: 'draft_study_input',
    });

    vi.mocked(fs.readFile).mockImplementation(async (pathLike: FsFilePath) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(2);
      if (pStr.includes('circuit-state.json')) throw new Error('ENOENT');
      if (pStr.includes('.stage-lock')) throw new Error('ENOENT');
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest({ stage: 2 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();
    // Strict mode blocks when script fails
    expect(response.status).toBe(409);
    expect(body.error).toBe('STAGE_DEPENDENCY_BLOCKED');
    expect(body.message).toMatch(/S2 blocked/i);
  });
});

// ---------------------------------------------------------------------------
// S3 — research enrichment
// ---------------------------------------------------------------------------
describe('execute-stage route coverage: S3', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(mockNow));
    applyDefaultSetup();
  });

  it('S3 blocked when 02-insights.md is missing or empty', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike: FsFilePath) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(3);
      if (pStr.includes('circuit-state.json')) throw new Error('ENOENT');
      if (pStr.includes('.stage-lock')) throw new Error('ENOENT');
      // 02-insights.md is empty/missing -> blocked
      if (pStr.includes('02-insights.md')) throw new Error('ENOENT');
      // 00-brief.md is optional for S3 (caught), but we return empty to avoid crash
      if (pStr.includes('00-brief.md')) return '';
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest({ stage: 3 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();
    expect(response.status).toBe(409);
    expect(body.error).toBe('STAGE_DEPENDENCY_BLOCKED');
    expect(body.message).toMatch(/02-insights\.md/i);
  });
});

// ---------------------------------------------------------------------------
// S7 — human gate (angle selection)
// ---------------------------------------------------------------------------
describe('execute-stage route coverage: S7', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(mockNow));
    applyDefaultSetup();
  });

  it('S7 live mode returns paused with human-approval.json', async () => {
    const writtenFiles: Record<string, string> = {};

    vi.mocked(fs.writeFile).mockImplementation(async (pathLike: FsFilePath, data: FsFileData) => {
      writtenFiles[String(pathLike)] = String(data);
    });

    vi.mocked(fs.rename).mockImplementation(async (from: FsFilePath, to: FsFilePath) => {
      const fromStr = String(from);
      if (writtenFiles[fromStr]) {
        writtenFiles[String(to)] = writtenFiles[fromStr];
      }
    });

    vi.mocked(fs.readFile).mockImplementation(async (pathLike: FsFilePath) => {
      const pStr = String(pathLike);
      if (writtenFiles[pStr]) return writtenFiles[pStr];
      if (pStr.includes('stage-state.json')) return makeStageState(7);
      if (pStr.includes('circuit-state.json')) throw new Error('ENOENT');
      if (pStr.includes('.stage-lock')) throw new Error('ENOENT');
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest({ stage: 7 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data.stage).toBe(7);
    expect(body.data.outputFile).toBe('human-approval.json');
    expect(body.data.status).toBe('paused');
    expect(body.data.currentStage).toBe(8);
  });

  it('S7 dry-run mode returns running without output', async () => {
    const { shouldBlockExternalAction } = await import('@/lib/runMode');
    vi.mocked(shouldBlockExternalAction).mockReturnValue(true);

    vi.mocked(fs.readFile).mockImplementation(async (pathLike: FsFilePath) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(7);
      if (pStr.includes('circuit-state.json')) throw new Error('ENOENT');
      if (pStr.includes('.stage-lock')) throw new Error('ENOENT');
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest({ stage: 7 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data.stage).toBe(7);
    expect(body.data.outputFile).toBeNull();
    expect(body.data.status).toBe('running');
    expect(body.data.currentStage).toBe(8);
  });
});

// ---------------------------------------------------------------------------
// S8 — journalist collection
// ---------------------------------------------------------------------------
describe('execute-stage route coverage: S8', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(mockNow));
    applyDefaultSetup();
  });

  it('S8 succeeds with existing 08-journalist-list.csv', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike: FsFilePath) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(8);
      if (pStr.includes('circuit-state.json')) throw new Error('ENOENT');
      if (pStr.includes('.stage-lock')) throw new Error('ENOENT');
      if (pStr.includes('human-approval.json')) return makeApproval();
      if (pStr.includes('08-journalist-list.csv')) return 'name,outlet,beat,email\nJohn,Demo,Tech,john@test.com\nJane,Sample,Health,jane@test.com';
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest({ stage: 8 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data.stage).toBe(8);
    expect(body.data.outputFile).toBe('08-journalist-list.csv');
    expect(body.data.script).toBe('existing_artifact');
  });
});

// ---------------------------------------------------------------------------
// S12 — outreach package
// ---------------------------------------------------------------------------
describe('execute-stage route coverage: S12', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(mockNow));
    applyDefaultSetup();
  });

  it('S12 blocked when no pitch inputs exist', async () => {
    vi.mocked(fs.access).mockImplementation(async (pathLike: FsFilePath) => {
      const pStr = String(pathLike);
      // Block all pitch input files
      if (pStr.includes('08-pitch-draft.md')) throw new Error('ENOENT');
      if (pStr.includes('09-optimized-email.md')) throw new Error('ENOENT');
      if (pStr.includes('10-pitch-draft.md')) throw new Error('ENOENT');
      if (pStr.includes('11-optimized-pitch.md')) throw new Error('ENOENT');
    });

    vi.mocked(fs.readFile).mockImplementation(async (pathLike: FsFilePath) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(12);
      if (pStr.includes('circuit-state.json')) throw new Error('ENOENT');
      if (pStr.includes('.stage-lock')) throw new Error('ENOENT');
      if (pStr.includes('human-approval.json')) return makeApproval();
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest({ stage: 12 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();
    expect(response.status).toBe(409);
    expect(body.error).toBe('STAGE_DEPENDENCY_BLOCKED');
    expect(body.message).toMatch(/S12 blocked/i);
  });
});

// ---------------------------------------------------------------------------
// S14 — final formatting
// ---------------------------------------------------------------------------
describe('execute-stage route coverage: S14', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(mockNow));
    applyDefaultSetup();
  });

  it('S14 blocked when 12-outreach-package.md is missing', async () => {
    vi.mocked(fs.access).mockImplementation(async (pathLike: FsFilePath) => {
      const pStr = String(pathLike);
      if (pStr.includes('12-outreach-package.md')) throw new Error('ENOENT');
    });

    vi.mocked(fs.readFile).mockImplementation(async (pathLike: FsFilePath) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(14);
      if (pStr.includes('circuit-state.json')) throw new Error('ENOENT');
      if (pStr.includes('.stage-lock')) throw new Error('ENOENT');
      if (pStr.includes('human-approval.json')) return makeApproval();
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest({ stage: 14 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();
    expect(response.status).toBe(409);
    expect(body.error).toBe('STAGE_DEPENDENCY_BLOCKED');
    expect(body.message).toMatch(/12-outreach-package\.md/i);
  });
});

// ---------------------------------------------------------------------------
// S15 — outreach assets
// ---------------------------------------------------------------------------
describe('execute-stage route coverage: S15', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(mockNow));
    applyDefaultSetup();
  });

  it('S15 blocked when 14-final-formatted-package.md is missing', async () => {
    vi.mocked(fs.access).mockImplementation(async (pathLike: FsFilePath) => {
      const pStr = String(pathLike);
      if (pStr.includes('14-final-formatted-package.md')) throw new Error('ENOENT');
    });

    vi.mocked(fs.readFile).mockImplementation(async (pathLike: FsFilePath) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(15);
      if (pStr.includes('circuit-state.json')) throw new Error('ENOENT');
      if (pStr.includes('.stage-lock')) throw new Error('ENOENT');
      if (pStr.includes('human-approval.json')) return makeApproval();
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest({ stage: 15 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();
    expect(response.status).toBe(409);
    expect(body.error).toBe('STAGE_DEPENDENCY_BLOCKED');
    expect(body.message).toMatch(/14-final-formatted-package\.md/i);
  });
});
