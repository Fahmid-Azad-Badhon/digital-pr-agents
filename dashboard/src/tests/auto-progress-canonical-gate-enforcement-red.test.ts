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
  },
}));

vi.mock('@/lib/authGuard', () => ({
  evaluateMutationAuth: vi.fn().mockReturnValue({ allowed: true }),
}));

vi.mock('@/lib/requestGuard', () => ({
  assertValidCampaignId: vi.fn((id: string) => id),
  resolveCampaignPath: vi.fn((id: string) => `D:\\tmp\\auto-progress-gate-red\\${id}`),
  REPO_ROOT: 'D:\\tmp\\auto-progress-gate-red\\repo',
}));

vi.mock('@/lib/logger', () => ({
  writeApiAuditLog: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/agentQuestioningSystem', () => ({
  createQuestion: vi.fn().mockResolvedValue({ questionId: 'q-red-001' }),
  escalateToHuman: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/stageRuntimeRegistry', () => ({
  getRuntimeBinding: vi.fn().mockReturnValue(undefined),
  verifyRuntimeBinding: vi.fn().mockResolvedValue({ ok: false }),
}));

vi.mock('@/lib/stageHandoffValidator', () => ({
  validateStageHandoff: vi.fn().mockResolvedValue({ valid: true }),
}));

const mockNow = '2026-06-01T12:00:00.000Z';

vi.mock('@/lib/provenance', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return { ...actual };
});

// Auto-progress does NOT import gateEngine.
// These mocks exist only so tests can assert expected-but-missing gate calls.
vi.mock('@/lib/gateEngine', () => ({
  getGatesForStage: vi.fn(),
  runGate: vi.fn(),
  canWorkflowContinue: vi.fn(),
  getBlockedStages: vi.fn(),
}));

import { POST } from '@/app/api/campaigns/[id]/auto-progress/route';
import { getGatesForStage, runGate } from '@/lib/gateEngine';

function mockRequest(method: string, body?: unknown) {
  const req = new NextRequest(
    'http://localhost/api/campaigns/test/auto-progress',
    {
      method,
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
    stageId: 'S7_PITCH_SELECTION_HUMAN_GATE',
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

describe('auto-progress canonical gate enforcement — expected red tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(mockNow));

    vi.mocked(fs.stat).mockResolvedValue({ isDirectory: () => true } as import('fs').Stats);
    vi.mocked(fs.access).mockResolvedValue(undefined);
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.rename).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
  });

  it('S7→S8 should call getGatesForStage before advancing to S8', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(7);
      if (pStr.includes('human-approval.json')) return makeApproval();
      throw new Error('ENOENT');
    });

    vi.mocked(getGatesForStage).mockResolvedValue([]);
    vi.mocked(runGate).mockResolvedValue({
      gateId: '',
      gateName: '',
      stageAfter: null,
      status: 'pass',
      canContinue: true,
      riskLevel: 'low',
      checkedAt: mockNow,
      passedChecks: [],
      warnings: [],
      blockingIssues: [],
      requiredAction: '',
      blockedStages: [],
    });

    const response = await POST(
      mockRequest('POST', { mode: 'pre_pitch', maxSteps: 16 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();
    expect(body.success).toBe(true);

    // RED EXPECTATION: auto-progress should call getGatesForStage before advancing.
    // Current code does NOT import or call gateEngine, so this will fail.
    expect(getGatesForStage).toHaveBeenCalled();
    expect(getGatesForStage).toHaveBeenCalledWith('S7_PITCH_SELECTION_HUMAN_GATE');
  });

  it('S7→S8 should return GATE_BLOCKED when G4_HUMAN_SELECTION_GATE blocks', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(7);
      if (pStr.includes('human-approval.json')) return makeApproval();
      throw new Error('ENOENT');
    });

    vi.mocked(getGatesForStage).mockResolvedValue(['G4_HUMAN_SELECTION_GATE']);
    vi.mocked(runGate).mockResolvedValue({
      gateId: 'G4_HUMAN_SELECTION_GATE',
      gateName: 'Human Selection Gate',
      stageAfter: 'S8',
      status: 'blocked',
      canContinue: false,
      riskLevel: 'high',
      checkedAt: mockNow,
      passedChecks: [],
      warnings: [],
      blockingIssues: [],
      requiredAction: 'Review gate',
      blockedStages: ['S8'],
    });

    const response = await POST(
      mockRequest('POST', { mode: 'pre_pitch', maxSteps: 16 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();

    // RED EXPECTATION: auto-progress should block when canonical G4 gate blocks.
    // Current code ignores gateEngine entirely and advances to S8.
    expect(response.status).toBe(409);
    expect(String(body.error || '')).toMatch(/GATE_BLOCKED|CANONICAL_GATE/i);
    expect(body.details?.finalStage).not.toBe(8);
    expect(getGatesForStage).toHaveBeenCalledWith('S7_PITCH_SELECTION_HUMAN_GATE');
  });

  it('S13→S14 should call getGatesForStage and runGate before advancing to S14', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(13);
      if (pStr.includes('human-approval.json')) return makeApproval();
      throw new Error('ENOENT');
    });

    vi.mocked(getGatesForStage).mockResolvedValue(['G7_FINAL_VALIDATION_GATE']);
    vi.mocked(runGate).mockResolvedValue({
      gateId: 'G7_FINAL_VALIDATION_GATE',
      gateName: 'Final Validation Gate',
      stageAfter: 'S14',
      status: 'pass',
      canContinue: true,
      riskLevel: 'low',
      checkedAt: mockNow,
      passedChecks: [],
      warnings: [],
      blockingIssues: [],
      requiredAction: '',
      blockedStages: [],
    });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { stage: 13, status: 'completed' } }),
      status: 200,
    }));

    const response = await POST(
      mockRequest('POST', { mode: 'full', maxSteps: 16 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();
    expect(body.success).toBe(true);

    // RED EXPECTATION: auto-progress should call gateEngine before advancing to S14.
    // Current code does NOT.
    expect(getGatesForStage).toHaveBeenCalled();
    expect(getGatesForStage).toHaveBeenCalledWith('S13_VALIDATION');
    expect(runGate).toHaveBeenCalledWith(expect.any(String), 'G7_FINAL_VALIDATION_GATE');
  });

  it('S13→S14 should return GATE_BLOCKED when G7_FINAL_VALIDATION_GATE blocks', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(13);
      if (pStr.includes('human-approval.json')) return makeApproval();
      throw new Error('ENOENT');
    });

    vi.mocked(getGatesForStage).mockResolvedValue(['G7_FINAL_VALIDATION_GATE']);
    vi.mocked(runGate).mockResolvedValue({
      gateId: 'G7_FINAL_VALIDATION_GATE',
      gateName: 'Final Validation Gate',
      stageAfter: 'S14',
      status: 'blocked',
      canContinue: false,
      riskLevel: 'high',
      checkedAt: mockNow,
      passedChecks: [],
      warnings: [],
      blockingIssues: [],
      requiredAction: 'Review gate',
      blockedStages: ['S14'],
    });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { stage: 13, status: 'completed' } }),
      status: 200,
    }));

    const response = await POST(
      mockRequest('POST', { mode: 'full', maxSteps: 16 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();

    // RED EXPECTATION: auto-progress should block when G7 gate blocks.
    // Current code advances to S14 regardless.
    expect(response.status).toBe(409);
    expect(String(body.error || '')).toMatch(/GATE_BLOCKED|CANONICAL_GATE/i);
    expect(body.details?.finalStage).toBe(13);
    expect(getGatesForStage).toHaveBeenCalledWith('S13_VALIDATION');
  });
});
