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
  resolveCampaignPath: vi.fn((id: string) => `D:\\tmp\\canonical-gate-enforcement-test\\${id}`),
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
import { runScriptAction } from '@/lib/scriptRunner';

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

type FsFilePath = Parameters<typeof fs.readFile>[0];

describe('execute-stage canonical gate enforcement', () => {
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

  it('calls getGatesForStage before executing S8', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike: FsFilePath) => {
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
      checkedAt: new Date().toISOString(),
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

    expect(getGatesForStage).toHaveBeenCalled();
  });

  it('calls runGate for G4_HUMAN_SELECTION_GATE when executing S8', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike: FsFilePath) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(8);
      if (pStr.includes('human-approval.json')) return makeApproval();
      if (pStr.includes('08-journalist-list.csv')) return 'name,outlet,beat,email\nTest,Outlet,beat,test@test.com';
      return '';
    });

    vi.mocked(getGatesForStage).mockResolvedValue(['G4_HUMAN_SELECTION_GATE']);
    vi.mocked(runGate).mockResolvedValue({
      gateId: 'G4_HUMAN_SELECTION_GATE',
      gateName: 'Human Selection Gate',
      stageAfter: 'S8',
      status: 'pass',
      canContinue: true,
      riskLevel: 'low',
      checkedAt: new Date().toISOString(),
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

    expect(runGate).toHaveBeenCalledWith(expect.any(String), 'G4_HUMAN_SELECTION_GATE');
  });

  it('blocks S8 when G4_HUMAN_SELECTION_GATE returns canContinue=false', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike: FsFilePath) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(8);
      if (pStr.includes('human-approval.json')) return makeApproval();
      if (pStr.includes('08-journalist-list.csv')) return 'name,outlet,beat,email\nTest,Outlet,beat,test@test.com';
      return '';
    });

    vi.mocked(getGatesForStage).mockResolvedValue(['G4_HUMAN_SELECTION_GATE']);
    vi.mocked(runGate).mockResolvedValue({
      gateId: 'G4_HUMAN_SELECTION_GATE',
      gateName: 'Human Selection Gate',
      stageAfter: 'S8',
      status: 'blocked',
      canContinue: false,
      riskLevel: 'high',
      checkedAt: new Date().toISOString(),
      passedChecks: [],
      warnings: [],
      blockingIssues: [{
        issueId: 'G4_BLOCKED',
        issue: 'Human selection gate blocked',
        affectedFile: null,
        affectedText: null,
        requiredAction: 'Complete human approval',
      }],
      requiredAction: 'Complete human approval',
      blockedStages: ['S8'],
    });

    const response = await POST(
      mockRequest({ stage: 8 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toMatch(/GATE_BLOCKED|CANONICAL_GATE/i);
  });

  it('does not call script runner when canonical gate blocks S8', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike: FsFilePath) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(8);
      if (pStr.includes('human-approval.json')) return makeApproval();
      if (pStr.includes('08-journalist-list.csv')) return 'name,outlet,beat,email\nTest,Outlet,beat,test@test.com';
      return '';
    });

    vi.mocked(getGatesForStage).mockResolvedValue(['G4_HUMAN_SELECTION_GATE']);
    vi.mocked(runGate).mockResolvedValue({
      gateId: 'G4_HUMAN_SELECTION_GATE',
      gateName: 'Human Selection Gate',
      stageAfter: 'S8',
      status: 'blocked',
      canContinue: false,
      riskLevel: 'high',
      checkedAt: new Date().toISOString(),
      passedChecks: [],
      warnings: [],
      blockingIssues: [{
        issueId: 'G4_BLOCKED',
        issue: 'Human selection gate blocked',
        affectedFile: null,
        affectedText: null,
        requiredAction: 'Complete human approval',
      }],
      requiredAction: 'Complete human approval',
      blockedStages: ['S8'],
    });

    const response = await POST(
      mockRequest({ stage: 8 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );

    expect(response.status).toBe(409);

    expect(runScriptAction).not.toHaveBeenCalled();
  });

  it('calls getGatesForStage before executing S14', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike: FsFilePath) => {
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
      checkedAt: new Date().toISOString(),
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

    expect(getGatesForStage).toHaveBeenCalled();
  });
});
