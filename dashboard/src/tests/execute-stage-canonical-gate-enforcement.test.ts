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
type FsStatPath = Parameters<typeof fs.stat>[0];

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

    await POST(
      mockRequest({ stage: 14 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );

    expect(getGatesForStage).toHaveBeenCalled();
  });

  it('calls getGatesForStage before executing S12', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike: FsFilePath) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(12);
      if (pStr.includes('human-approval.json')) return makeApproval();
      if (pStr.includes('08-pitch-draft.md')) return '# Pitch Draft\n\nPitch content for S12 testing.';
      if (pStr.includes('09-optimized-email.md')) return '# Optimized Email\n\nEmail content for S12 testing.';
      if (pStr.includes('10-pitch-draft.md')) return '# Pitch Draft 10\n\n' + 'Substantive pitch draft content for S12 testing with enough characters to clear the assertion threshold. '.repeat(15);
      if (pStr.includes('11-optimized-pitch.md')) return '# Optimized Pitch 11\n\n' + 'Optimized pitch content for S12 testing with enough characters to clear the assertion threshold. '.repeat(15);
      if (pStr.includes('12-outreach-package.md')) return '# Outreach Package\n\n' + 'x'.repeat(750);
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
      mockRequest({ stage: 12 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );

    expect(response.status).toBe(200);

    expect(getGatesForStage).toHaveBeenCalled();
  });

  it('calls runGate for G6_PITCH_SAFETY_GATE when executing S12', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike: FsFilePath) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(12);
      if (pStr.includes('human-approval.json')) return makeApproval();
      if (pStr.includes('08-pitch-draft.md')) return '# Pitch Draft\n\nPitch content for S12 testing.';
      if (pStr.includes('09-optimized-email.md')) return '# Optimized Email\n\nEmail content for S12 testing.';
      if (pStr.includes('10-pitch-draft.md')) return '# Pitch Draft 10\n\n' + 'Substantive pitch draft content for S12 testing with enough characters to clear the assertion threshold. '.repeat(15);
      if (pStr.includes('11-optimized-pitch.md')) return '# Optimized Pitch 11\n\n' + 'Optimized pitch content for S12 testing with enough characters to clear the assertion threshold. '.repeat(15);
      if (pStr.includes('12-outreach-package.md')) return '# Outreach Package\n\n' + 'x'.repeat(750);
      return '';
    });

    vi.mocked(getGatesForStage).mockResolvedValue(['G6_PITCH_SAFETY_GATE']);
    vi.mocked(runGate).mockResolvedValue({
      gateId: 'G6_PITCH_SAFETY_GATE',
      gateName: 'Pitch Safety Gate',
      stageAfter: 'S12',
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
      mockRequest({ stage: 12 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );

    expect(response.status).toBe(200);

    expect(runGate).toHaveBeenCalledWith(expect.any(String), 'G6_PITCH_SAFETY_GATE');
  });

  it('blocks S12 when G6_PITCH_SAFETY_GATE returns canContinue=false', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike: FsFilePath) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(12);
      if (pStr.includes('human-approval.json')) return makeApproval();
      if (pStr.includes('08-pitch-draft.md')) return '# Pitch Draft\n\nPitch content for S12 testing.';
      if (pStr.includes('09-optimized-email.md')) return '# Optimized Email\n\nEmail content for S12 testing.';
      if (pStr.includes('10-pitch-draft.md')) return '# Pitch Draft 10\n\n' + 'Substantive pitch draft content for S12 testing with enough characters to clear the assertion threshold. '.repeat(15);
      if (pStr.includes('11-optimized-pitch.md')) return '# Optimized Pitch 11\n\n' + 'Optimized pitch content for S12 testing with enough characters to clear the assertion threshold. '.repeat(15);
      if (pStr.includes('12-outreach-package.md')) return '# Outreach Package\n\n' + 'x'.repeat(750);
      return '';
    });

    vi.mocked(getGatesForStage).mockResolvedValue(['G6_PITCH_SAFETY_GATE']);
    vi.mocked(runGate).mockResolvedValue({
      gateId: 'G6_PITCH_SAFETY_GATE',
      gateName: 'Pitch Safety Gate',
      stageAfter: 'S12',
      status: 'blocked',
      canContinue: false,
      riskLevel: 'high',
      checkedAt: new Date().toISOString(),
      passedChecks: [],
      warnings: [],
      blockingIssues: [{
        issueId: 'G6_BLOCKED',
        issue: 'Pitch safety gate blocked: unsupported claims found',
        affectedFile: null,
        affectedText: null,
        requiredAction: 'Remove unsupported claims from pitch before packaging.',
      }],
      requiredAction: 'Remove unsupported claims from pitch before packaging.',
      blockedStages: ['S12'],
    });

    const response = await POST(
      mockRequest({ stage: 12 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toMatch(/GATE_BLOCKED|CANONICAL_GATE/i);

    expect(runScriptAction).not.toHaveBeenCalled();
  });

  it('calls getGatesForStage before executing S13', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike: FsFilePath) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(13);
      if (pStr.includes('human-approval.json')) return makeApproval();
      if (pStr.includes('12-outreach-package.md')) return '# Outreach Package\n\n' + 'x'.repeat(250);
      if (pStr.includes('08-journalist-list.csv')) return 'name,outlet,beat,email\nTest1,Outlet1,beat1,test1@test.com\nTest2,Outlet2,beat2,test2@test.com\nTest3,Outlet3,beat3,test3@test.com\nTest4,Outlet4,beat4,test4@test.com';
      if (pStr.includes('09-journalist-intelligence.json')) return JSON.stringify({ journalist: 'Test', outlet: 'Outlet' });
      if (pStr.includes('13-validation-report.json')) return JSON.stringify({ passed: true, checks: [{ file: '12-outreach-package.md', exists: true }], qualityIssues: [], summary: 'Validated' });
      return '';
    });

    vi.mocked(fs.stat).mockImplementation(async (path: FsStatPath) => {
      const p = path.toString();
      if (p.includes('12-outreach-package.md') || p.includes('08-journalist-list.csv') || p.includes('09-journalist-intelligence.json')) {
        return { isFile: () => true, isDirectory: () => false, size: 1000 } as import('fs').Stats;
      }
      return { isDirectory: () => true } as import('fs').Stats;
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
      mockRequest({ stage: 13 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );

    expect(response.status).toBe(200);

    expect(getGatesForStage).toHaveBeenCalled();
  });

  it('calls getGatesForStage before executing S15', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike: FsFilePath) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(15);
      if (pStr.includes('human-approval.json')) return makeApproval();
      if (pStr.includes('14-final-formatted-package.md')) return '# Final Package\n\n' + 'x'.repeat(900);
      if (pStr.includes('15-outreach-assets.md')) return '# Stage 15 Outreach Assets\n\n' + 'x'.repeat(500);
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
      mockRequest({ stage: 15 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );

    expect(response.status).toBe(200);

    expect(getGatesForStage).toHaveBeenCalled();
  });

  it('calls runGate for G8_HUMAN_SEND_GATE when executing S15', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike: FsFilePath) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(15);
      if (pStr.includes('human-approval.json')) return makeApproval();
      if (pStr.includes('14-final-formatted-package.md')) return '# Final Package\n\n' + 'x'.repeat(900);
      if (pStr.includes('15-outreach-assets.md')) return '# Stage 15 Outreach Assets\n\n' + 'x'.repeat(500);
      return '';
    });

    vi.mocked(getGatesForStage).mockResolvedValue(['G8_HUMAN_SEND_GATE']);
    vi.mocked(runGate).mockResolvedValue({
      gateId: 'G8_HUMAN_SEND_GATE',
      gateName: 'Human Send Gate',
      stageAfter: 'S15',
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
      mockRequest({ stage: 15 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );

    expect(response.status).toBe(200);

    expect(runGate).toHaveBeenCalledWith(expect.any(String), 'G8_HUMAN_SEND_GATE');
  });

  it('blocks S15 when G8_HUMAN_SEND_GATE returns canContinue=false', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike: FsFilePath) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(15);
      if (pStr.includes('human-approval.json')) return makeApproval();
      if (pStr.includes('14-final-formatted-package.md')) return '# Final Package\n\n' + 'x'.repeat(900);
      return '';
    });

    vi.mocked(getGatesForStage).mockResolvedValue(['G8_HUMAN_SEND_GATE']);
    vi.mocked(runGate).mockResolvedValue({
      gateId: 'G8_HUMAN_SEND_GATE',
      gateName: 'Human Send Gate',
      stageAfter: 'S15',
      status: 'blocked',
      canContinue: false,
      riskLevel: 'high',
      checkedAt: new Date().toISOString(),
      passedChecks: [],
      warnings: [],
      blockingIssues: [{
        issueId: 'G8_BLOCKED',
        issue: 'Human send gate blocked: human approval not granted',
        affectedFile: null,
        affectedText: null,
        requiredAction: 'Obtain human send approval before outreach.',
      }],
      requiredAction: 'Obtain human send approval before outreach.',
      blockedStages: ['S15'],
    });

    const response = await POST(
      mockRequest({ stage: 15 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toMatch(/GATE_BLOCKED|CANONICAL_GATE/i);
  });

  it('does not call script runner when canonical gate blocks S15', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike: FsFilePath) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(15);
      if (pStr.includes('human-approval.json')) return makeApproval();
      if (pStr.includes('14-final-formatted-package.md')) return '# Final Package\n\n' + 'x'.repeat(900);
      return '';
    });

    vi.mocked(getGatesForStage).mockResolvedValue(['G8_HUMAN_SEND_GATE']);
    vi.mocked(runGate).mockResolvedValue({
      gateId: 'G8_HUMAN_SEND_GATE',
      gateName: 'Human Send Gate',
      stageAfter: 'S15',
      status: 'blocked',
      canContinue: false,
      riskLevel: 'high',
      checkedAt: new Date().toISOString(),
      passedChecks: [],
      warnings: [],
      blockingIssues: [{
        issueId: 'G8_BLOCKED',
        issue: 'Human send gate blocked: human approval not granted',
        affectedFile: null,
        affectedText: null,
        requiredAction: 'Obtain human send approval before outreach.',
      }],
      requiredAction: 'Obtain human send approval before outreach.',
      blockedStages: ['S15'],
    });

    const response = await POST(
      mockRequest({ stage: 15 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );

    expect(response.status).toBe(409);

    expect(runScriptAction).not.toHaveBeenCalled();
  });
});
