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
  },
}));

vi.mock('@/lib/authGuard', () => ({
  evaluateMutationAuth: vi.fn().mockReturnValue({ allowed: true }),
}));

vi.mock('@/lib/requestGuard', () => ({
  assertValidCampaignId: vi.fn((id: string) => id),
  resolveCampaignPath: vi.fn((id: string) => `D:\\tmp\\execute-stage-test\\${id}`),
  REPO_ROOT: 'D:\\tmp\\execute-stage-test\\repo',
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
    ok: true,
    result: { stdout: 'mocked', stderr: '' },
  }),
}));

vi.mock('@/lib/runtimeEvents', () => ({
  appendRuntimeEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/rateLimiter', () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true, remaining: 29, resetAt: Date.now() + 60000 })),
}));

vi.mock('@/lib/pitchGovernanceValidator', () => ({
  validateStagePitchGovernance: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/fallbackMarkers', () => ({
  looksLikeFallback: vi.fn(() => false),
  FALLBACK_MARKERS: [],
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

describe('execute-stage S8 provenance guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(mockNow));

    vi.mocked(fs.stat).mockResolvedValue({ isDirectory: () => true } as import('fs').Stats);
    vi.mocked(fs.access).mockResolvedValue(undefined);
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.rename).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    vi.mocked(fs.unlink).mockResolvedValue(undefined);
  });

  it('direct S8 execution with approved + verified + selected angle allows', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(8);
      if (pStr.includes('circuit-state.json')) throw new Error('ENOENT');
      if (pStr.includes('.stage-lock')) throw new Error('ENOENT');
      if (pStr.includes('08-journalist-list.csv')) return 'mock,csv,data\n';
      if (pStr.includes('human-approval.json')) return makeApproval();
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest({ stage: 8 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.stage).toBe(8);
  });

  it('direct S8 execution with approved + non_live + selected angle blocks before S8 side effects', async () => {
    let stage8Called = false;

    vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(8);
      if (pStr.includes('circuit-state.json')) throw new Error('ENOENT');
      if (pStr.includes('human-approval.json')) return makeApproval({ provenanceStatus: 'non_live' });
      stage8Called = true;
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest({ stage: 8 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('PROVENANCE_BLOCKED');
    expect(stage8Called).toBe(false);
  });

  it('direct S8 execution with approved + explicit missing provenance blocks', async () => {
    let stage8Called = false;

    vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(8);
      if (pStr.includes('circuit-state.json')) throw new Error('ENOENT');
      if (pStr.includes('human-approval.json')) return makeApproval({ provenanceStatus: 'missing' });
      stage8Called = true;
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest({ stage: 8 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('PROVENANCE_BLOCKED');
    expect(stage8Called).toBe(false);
  });

  it('direct S8 execution with approved + unknown + selected angle allows with warning', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(8);
      if (pStr.includes('circuit-state.json')) throw new Error('ENOENT');
      if (pStr.includes('.stage-lock')) throw new Error('ENOENT');
      if (pStr.includes('08-journalist-list.csv')) return 'mock,csv,data\n';
      if (pStr.includes('human-approval.json')) return makeApproval({ provenanceStatus: 'unknown' });
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest({ stage: 8 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.provenanceWarning).toBe('Partial provenance metadata');
  });

  it('direct S8 execution with approved + legacy/no provenance allows with warning', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(8);
      if (pStr.includes('circuit-state.json')) throw new Error('ENOENT');
      if (pStr.includes('.stage-lock')) throw new Error('ENOENT');
      if (pStr.includes('08-journalist-list.csv')) return 'mock,csv,data\n';
      if (pStr.includes('human-approval.json')) {
        return JSON.stringify({
          status: 'approved',
          selectedAngleTitle: 'Legacy Angle',
          selectedAngleId: 'angle-999',
        });
      }
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest({ stage: 8 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.provenanceWarning).toContain('Batch 5F');
  });

  it('direct S8 execution with waiting approval blocks', async () => {
    let stage8Called = false;

    vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(8);
      if (pStr.includes('circuit-state.json')) throw new Error('ENOENT');
      if (pStr.includes('human-approval.json')) return makeApproval({ status: 'waiting' });
      stage8Called = true;
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest({ stage: 8 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('PROVENANCE_BLOCKED');
    expect(stage8Called).toBe(false);
  });

  it('direct S8 execution with rejected approval blocks', async () => {
    let stage8Called = false;

    vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(8);
      if (pStr.includes('circuit-state.json')) throw new Error('ENOENT');
      if (pStr.includes('human-approval.json')) return makeApproval({ status: 'rejected' });
      stage8Called = true;
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest({ stage: 8 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('PROVENANCE_BLOCKED');
    expect(stage8Called).toBe(false);
  });

  it('direct S8 execution with missing approval file blocks', async () => {
    let stage8Called = false;

    vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(8);
      if (pStr.includes('circuit-state.json')) throw new Error('ENOENT');
      if (pStr.includes('human-approval.json')) throw new Error('ENOENT');
      stage8Called = true;
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest({ stage: 8 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('PROVENANCE_BLOCKED');
    expect(stage8Called).toBe(false);
  });

  it('direct S8 execution with approved + verified but no selected angle blocks', async () => {
    let stage8Called = false;

    vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(8);
      if (pStr.includes('circuit-state.json')) throw new Error('ENOENT');
      if (pStr.includes('human-approval.json')) {
        return makeApproval({ selectedAngleId: undefined, selectedAngleTitle: undefined });
      }
      stage8Called = true;
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest({ stage: 8 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('PROVENANCE_BLOCKED');
    expect(stage8Called).toBe(false);
  });

  it('direct S8 execution with approved + verified + whitespace-only selectedAngleId blocks', async () => {
    let stage8Called = false;

    vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(8);
      if (pStr.includes('circuit-state.json')) throw new Error('ENOENT');
      if (pStr.includes('human-approval.json')) {
        return makeApproval({
          selectedAngleId: '   ',
          selectedAngleTitle: '   ',
          provenanceStatus: 'verified',
        });
      }
      stage8Called = true;
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest({ stage: 8 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('PROVENANCE_BLOCKED');
    expect(stage8Called).toBe(false);
  });

  it('direct S8 execution with approved + verified + non-blank selectedAngleId still passes', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(8);
      if (pStr.includes('circuit-state.json')) throw new Error('ENOENT');
      if (pStr.includes('.stage-lock')) throw new Error('ENOENT');
      if (pStr.includes('08-journalist-list.csv')) return 'mock,csv,data\n';
      if (pStr.includes('human-approval.json')) {
        return makeApproval({
          selectedAngleId: 'angle-001',
          selectedAngleTitle: '',
          provenanceStatus: 'verified',
        });
      }
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest({ stage: 8 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.stage).toBe(8);
  });
});
