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
  resolveCampaignPath: vi.fn((id: string) => `D:\\tmp\\auto-progress-test\\${id}`),
  REPO_ROOT: 'D:\\tmp\\auto-progress-test\\repo',
}));

vi.mock('@/lib/logger', () => ({
  writeApiAuditLog: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/agentQuestioningSystem', () => ({
  createQuestion: vi.fn().mockResolvedValue({ questionId: 'q-test-001' }),
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

interface GateDecision {
  current_stage: string;
  stage_gate_status: string;
}

import { POST } from '@/app/api/campaigns/[id]/auto-progress/route';

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

describe('auto-progress S7 gate — provenance check', () => {
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

  it('no human-approval.json returns waiting_for_pitch_selection', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(7);
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest('POST', { mode: 'pre_pitch', maxSteps: 1 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();
    const s7decision = body.data?.decisions?.find(
      (d: GateDecision) => d.current_stage === 'S7',
    );
    expect(s7decision?.stage_gate_status).toBe('waiting_for_pitch_selection');
  });

  it('status waiting returns waiting_for_pitch_selection', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(7);
      if (pStr.includes('human-approval.json')) return makeApproval({ status: 'waiting' });
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest('POST', { mode: 'pre_pitch', maxSteps: 1 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();
    const s7decision = body.data?.decisions?.find(
      (d: GateDecision) => d.current_stage === 'S7',
    );
    expect(s7decision?.stage_gate_status).toBe('waiting_for_pitch_selection');
  });

  it('approved + no angle returns waiting_for_pitch_selection', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(7);
      if (pStr.includes('human-approval.json')) return makeApproval({
        selectedAngleTitle: undefined,
        selectedAngleId: undefined,
      });
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest('POST', { mode: 'pre_pitch', maxSteps: 1 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();
    const s7decision = body.data?.decisions?.find(
      (d: GateDecision) => d.current_stage === 'S7',
    );
    expect(s7decision?.stage_gate_status).toBe('waiting_for_pitch_selection');
  });

  it('approved + angle + missing provenance — pitch_selected (legacy compat)', async () => {
    let stateReadCount = 0;
    vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) {
        stateReadCount++;
        if (stateReadCount >= 2) return makeStageState(8, 'running');
        return makeStageState(7);
      }
      if (pStr.includes('human-approval.json')) return makeApproval({
        provenanceStatus: undefined,
        provenanceWarning: undefined,
        runMode: undefined,
        source: undefined,
        schemaVersion: undefined,
      });
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest('POST', { mode: 'pre_pitch', maxSteps: 16 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();
    expect(body.success).toBe(true);
    const s7decision = body.data?.decisions?.find(
      (d: GateDecision) => d.current_stage === 'S7',
    );
    expect(s7decision?.stage_gate_status).toBe('pitch_selected');
    expect(s7decision?.provenanceWarning).toContain('Batch 5F');
  });

  it('approved + angle + non_live provenance — PROVENANCE_BLOCKED', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(7);
      if (pStr.includes('human-approval.json')) return makeApproval({
        provenanceStatus: 'non_live',
        provenanceWarning: 'Artifact was written in non-live mode',
        runMode: 'dry_run',
      });
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest('POST', { mode: 'pre_pitch', maxSteps: 1 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();
    expect(body.error).toBe('PROVENANCE_BLOCKED');
  });

  it('approved + angle + verified provenance — pitch_selected without warning', async () => {
    let stateReadCount = 0;
    vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) {
        stateReadCount++;
        if (stateReadCount >= 2) return makeStageState(8, 'running');
        return makeStageState(7);
      }
      if (pStr.includes('human-approval.json')) return makeApproval({ provenanceStatus: 'verified' });
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest('POST', { mode: 'pre_pitch', maxSteps: 16 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();
    expect(body.success).toBe(true);
    const s7decision = body.data?.decisions?.find(
      (d: GateDecision) => d.current_stage === 'S7',
    );
    expect(s7decision?.stage_gate_status).toBe('pitch_selected');
    expect(s7decision?.provenanceWarning).toBeUndefined();
    expect(body.data.finalStage).toBe(8);
  });

  it('approved + angle + unknown provenance — pitch_selected with warning', async () => {
    let stateReadCount = 0;
    vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) {
        stateReadCount++;
        if (stateReadCount >= 2) return makeStageState(8, 'running');
        return makeStageState(7);
      }
      if (pStr.includes('human-approval.json')) return makeApproval({
        provenanceStatus: 'unknown',
        provenanceWarning: 'Partial provenance metadata',
      });
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest('POST', { mode: 'pre_pitch', maxSteps: 16 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();
    expect(body.success).toBe(true);
    const s7decision = body.data?.decisions?.find(
      (d: GateDecision) => d.current_stage === 'S7',
    );
    expect(s7decision?.stage_gate_status).toBe('pitch_selected');
    expect(s7decision?.provenanceWarning).toBe('Partial provenance metadata');
  });

  it('legacy file without provenanceStatus — pitch_selected with warning', async () => {
    let stateReadCount = 0;
    vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) {
        stateReadCount++;
        if (stateReadCount >= 2) return makeStageState(8, 'running');
        return makeStageState(7);
      }
      if (pStr.includes('human-approval.json')) {
        return JSON.stringify({
          stageId: 'S7_PITCH_SELECTION_HUMAN_GATE',
          status: 'approved',
          selectedAngleTitle: 'Old Angle',
          approvedAt: '2025-01-01T00:00:00.000Z',
        });
      }
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest('POST', { mode: 'pre_pitch', maxSteps: 16 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();
    expect(body.success).toBe(true);
    const s7decision = body.data?.decisions?.find(
      (d: GateDecision) => d.current_stage === 'S7',
    );
    expect(s7decision?.stage_gate_status).toBe('pitch_selected');
    expect(s7decision?.provenanceWarning).toContain('Batch 5F');
  });

  it('approved + angle + verified + selectedAngleId (no title) — proceeds', async () => {
    let stateReadCount = 0;
    vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) {
        stateReadCount++;
        if (stateReadCount >= 2) return makeStageState(8, 'running');
        return makeStageState(7);
      }
      if (pStr.includes('human-approval.json')) return makeApproval({
        selectedAngleTitle: undefined,
        selectedAngleId: 'angle-042',
        provenanceStatus: 'verified',
      });
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest('POST', { mode: 'pre_pitch', maxSteps: 16 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();
    expect(body.success).toBe(true);
    const s7decision = body.data?.decisions?.find(
      (d: GateDecision) => d.current_stage === 'S7',
    );
    expect(s7decision?.stage_gate_status).toBe('pitch_selected');
  });

  it('approved + angle + provenanceStatus missing (explicit) — PROVENANCE_BLOCKED', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(7);
      if (pStr.includes('human-approval.json')) return makeApproval({
        provenanceStatus: 'missing',
      });
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest('POST', { mode: 'pre_pitch', maxSteps: 1 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();
    expect(body.error).toBe('PROVENANCE_BLOCKED');
  });
});
