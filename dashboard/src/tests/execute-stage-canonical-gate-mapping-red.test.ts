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
  resolveCampaignPath: vi.fn((id: string) => `D:\\tmp\\execute-stage-gate-mapping-red\\${id}`),
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
}));

vi.mock('@/types', () => ({
  STAGES: Array.from({ length: 16 }, (_, i) => ({
    number: i + 1,
    name: `Stage ${i + 1}`,
    owner: 'test',
  })),
}));

vi.mock('@/lib/gateEngine', () => ({
  getGatesForStage: vi.fn(),
  runGate: vi.fn(),
  canWorkflowContinue: vi.fn(),
  getBlockedStages: vi.fn(),
}));

import { POST } from '@/app/api/campaigns/[id]/execute-stage/route';
import { getGatesForStage, runGate } from '@/lib/gateEngine';

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

describe('execute-stage canonical gate mapping — expected red tests', () => {
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
  });

  it('S8 should call getGatesForStage with S7_PITCH_SELECTION_HUMAN_GATE', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(8);
      if (pStr.includes('human-approval.json')) return makeApproval();
      if (pStr.includes('08-journalist-list.csv')) return 'name,outlet,beat,email\nTest,Outlet,beat,test@test.com';
      return '';
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
      mockRequest({ stage: 8 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );

    expect(response.status).toBe(200);

    // RED EXPECTATION: execute-stage should call getGatesForStage with the
    // real contract-stage name, not the short ID "S8".
    // Current code calls getGatesForStage("S8"), which will not match any
    // gates in production configuration.
    expect(getGatesForStage).toHaveBeenCalledWith('S7_PITCH_SELECTION_HUMAN_GATE');
  });

  it('S8 should return GATE_BLOCKED when G4 blocks under real mapping', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(8);
      if (pStr.includes('human-approval.json')) return makeApproval();
      if (pStr.includes('08-journalist-list.csv')) return 'name,outlet,beat,email\nTest,Outlet,beat,test@test.com';
      return '';
    });

    // Only return gates when called with the real contract name.
    vi.mocked(getGatesForStage).mockImplementation(async (stageId: string) => {
      if (stageId === 'S7_PITCH_SELECTION_HUMAN_GATE') {
        return ['G4_HUMAN_SELECTION_GATE'];
      }
      return [];
    });

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
      mockRequest({ stage: 8 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();

    // RED EXPECTATION: execute-stage should return 409 GATE_BLOCKED when
    // G4_HUMAN_SELECTION_GATE blocks under the real contract-name mapping.
    // Current code passes "S8" to getGatesForStage, gets empty, does not block.
    expect(response.status).toBe(409);
    expect(String(body.error || '')).toMatch(/GATE_BLOCKED|CANONICAL_GATE/i);
  });

  it('S14 should call getGatesForStage with S13_VALIDATION', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(14);
      if (pStr.includes('human-approval.json')) return makeApproval();
      if (pStr.includes('12-outreach-package.md')) return '# Outreach Package\n\nContent for S14 gate test.';
      if (pStr.includes('13-validation-report.json')) return JSON.stringify({ passed: true, checks: [], qualityIssues: [], summary: 'Validated' });
      return '';
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
      mockRequest({ stage: 14 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );

    // Consume body to avoid unread-response warnings.
    // The route returns 409 from the executeStage14 dependency path
    // after the gate precheck returns null; this test only needs to
    // prove the correct lookup key was used.
    await response.json().catch(() => undefined);

    // RED EXPECTATION: execute-stage should call getGatesForStage with the
    // real contract-stage name "S13_VALIDATION", not the short ID "S14".
    // Current code calls getGatesForStage("S14"), which won't match G7 in production.
    expect(getGatesForStage).toHaveBeenCalledWith('S13_VALIDATION');
  });

  it('S14 should return GATE_BLOCKED when G7 blocks under real mapping', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(14);
      if (pStr.includes('human-approval.json')) return makeApproval();
      if (pStr.includes('12-outreach-package.md')) return '# Outreach Package\n\nContent for S14 gate test.';
      if (pStr.includes('13-validation-report.json')) return JSON.stringify({ passed: true, checks: [], qualityIssues: [], summary: 'Validated' });
      return '';
    });

    // Only return gates when called with the real contract name.
    vi.mocked(getGatesForStage).mockImplementation(async (stageId: string) => {
      if (stageId === 'S13_VALIDATION') {
        return ['G7_FINAL_VALIDATION_GATE'];
      }
      return [];
    });

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

    const response = await POST(
      mockRequest({ stage: 14 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();

    // RED EXPECTATION: execute-stage should return 409 GATE_BLOCKED when
    // G7_FINAL_VALIDATION_GATE blocks under the real contract-name mapping.
    // Current code passes "S14" to getGatesForStage, gets empty, does not block.
    expect(response.status).toBe(409);
    expect(String(body.error || '')).toMatch(/GATE_BLOCKED|CANONICAL_GATE/i);
  });
});
