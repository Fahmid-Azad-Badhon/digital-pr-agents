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
  resolveCampaignPath: vi.fn((id: string) => `D:\\tmp\\s10-route-test\\${id}`),
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
    stdout: 'mocked pitch draft output',
    stderr: '',
    durationMs: 100,
    command: 'draft-pitch-draft.cmd test-campaign',
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
}));

vi.mock('@/types', () => ({
  STAGES: Array.from({ length: 16 }, (_, i) => ({
    number: i + 1,
    name: `Stage ${i + 1}`,
    owner: 'test',
  })),
}));

import { POST } from '@/app/api/campaigns/[id]/execute-stage/route';
import { validateS10OutputContract } from '@/lib/stageOutputContractValidator';

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

const VALID_CONTENT = '# Pitch Draft\n\n' + 'x'.repeat(400);

describe('S10 route-level integration behavior', () => {
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
    vi.mocked(fs.appendFile).mockResolvedValue(undefined);
    vi.mocked(validateS10OutputContract).mockResolvedValue(undefined);
  });

  it('successful S10 route execution preserves markdown output contract', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(10);
      if (pStr.includes('circuit-state.json')) throw new Error('ENOENT');
      if (pStr.includes('.stage-lock')) throw new Error('ENOENT');
      if (pStr.includes('human-approval.json')) return makeApproval();
      if (pStr.includes('09-journalist-intelligence.json')) {
        return JSON.stringify({ journalists: [{ name: 'Test Journalist', outlet: 'Test Outlet' }] });
      }
      if (pStr.includes('10-pitch-draft.md')) return VALID_CONTENT;
      if (pStr.includes('10-pitch-draft.json')) {
        return JSON.stringify({ campaignId: 'test', pitchContent: 'content', angle: 'test angle' });
      }
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest({ stage: 10 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.stage).toBe(10);
    expect(body.data.outputFile).toBe('10-pitch-draft.md');
    expect(body.data.status).toBe('running');
    expect(body.data.currentStage).toBe(11);
  });

  it('S10 fails when 10-pitch-draft.json is missing', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(10);
      if (pStr.includes('circuit-state.json')) throw new Error('ENOENT');
      if (pStr.includes('.stage-lock')) throw new Error('ENOENT');
      if (pStr.includes('human-approval.json')) return makeApproval();
      if (pStr.includes('09-journalist-intelligence.json')) {
        return JSON.stringify({ journalists: [{ name: 'Test Journalist', outlet: 'Test Outlet' }] });
      }
      if (pStr.includes('10-pitch-draft.md')) return VALID_CONTENT;
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest({ stage: 10 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe('STAGE_DEPENDENCY_BLOCKED');
    expect(body.message).toMatch(/10-pitch-draft\.json/i);
  });

  it('S10 fails when validateS10OutputContract rejects', async () => {
    const { JsonSchemaValidationError } = await import('@/lib/jsonSchemaValidator');
    const validationError = new JsonSchemaValidationError(
      '"10-pitch-draft.json" failed schema validation: /pitchContent: must have required field',
      [{ path: '/pitchContent', message: 'must have required field' }],
    );

    vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(10);
      if (pStr.includes('circuit-state.json')) throw new Error('ENOENT');
      if (pStr.includes('.stage-lock')) throw new Error('ENOENT');
      if (pStr.includes('human-approval.json')) return makeApproval();
      if (pStr.includes('09-journalist-intelligence.json')) {
        return JSON.stringify({ journalists: [{ name: 'Test Journalist', outlet: 'Test Outlet' }] });
      }
      if (pStr.includes('10-pitch-draft.md')) return VALID_CONTENT;
      if (pStr.includes('10-pitch-draft.json')) {
        return JSON.stringify({ campaignId: 'test' });
      }
      throw new Error('ENOENT');
    });

    const { validateS10OutputContract } = await import('@/lib/stageOutputContractValidator');
    vi.mocked(validateS10OutputContract).mockRejectedValue(validationError);

    const response = await POST(
      mockRequest({ stage: 10 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('EXECUTE_STAGE_FAILED');
  });

  it('S10 does not require legacy 08-pitch-draft.md', async () => {
    let legacyReadAttempted = false;

    vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('08-pitch-draft.md')) {
        legacyReadAttempted = true;
        throw new Error('ENOENT');
      }
      if (pStr.includes('stage-state.json')) return makeStageState(10);
      if (pStr.includes('circuit-state.json')) throw new Error('ENOENT');
      if (pStr.includes('.stage-lock')) throw new Error('ENOENT');
      if (pStr.includes('human-approval.json')) return makeApproval();
      if (pStr.includes('09-journalist-intelligence.json')) {
        return JSON.stringify({ journalists: [{ name: 'Test Journalist', outlet: 'Test Outlet' }] });
      }
      if (pStr.includes('10-pitch-draft.md')) return VALID_CONTENT;
      if (pStr.includes('10-pitch-draft.json')) {
        return JSON.stringify({ campaignId: 'test', pitchContent: 'content', angle: 'test angle' });
      }
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest({ stage: 10 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.stage).toBe(10);
    expect(body.data.outputFile).toBe('10-pitch-draft.md');
    expect(legacyReadAttempted).toBe(false);
  });

  it('S10 stage is blocked by HumanApproval provenance guard before script execution', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(10);
      if (pStr.includes('circuit-state.json')) throw new Error('ENOENT');
      if (pStr.includes('human-approval.json')) return makeApproval({ status: 'waiting' });
      throw new Error('ENOENT');
    });

    const { runScriptAction } = await import('@/lib/scriptRunner');

    const response = await POST(
      mockRequest({ stage: 10 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('PROVENANCE_BLOCKED');
    expect(runScriptAction).not.toHaveBeenCalled();
  });

  it('S10 fails when 10-pitch-draft.md is too thin', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(10);
      if (pStr.includes('circuit-state.json')) throw new Error('ENOENT');
      if (pStr.includes('.stage-lock')) throw new Error('ENOENT');
      if (pStr.includes('human-approval.json')) return makeApproval();
      if (pStr.includes('09-journalist-intelligence.json')) {
        return JSON.stringify({ journalists: [{ name: 'Test Journalist', outlet: 'Test Outlet' }] });
      }
      if (pStr.includes('10-pitch-draft.md')) return 'short';
      throw new Error('ENOENT');
    });

    const { runScriptAction } = await import('@/lib/scriptRunner');

    const response = await POST(
      mockRequest({ stage: 10 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe('STAGE_DEPENDENCY_BLOCKED');
    expect(body.message).toBe('S10 blocked: pitch draft is too thin to qualify as production output.');
    expect(body.details.missing).toContain('10-pitch-draft.md');
    expect(runScriptAction).toHaveBeenCalled();
  });
});
