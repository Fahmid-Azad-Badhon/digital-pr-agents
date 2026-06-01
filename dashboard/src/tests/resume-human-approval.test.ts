import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const TEST_ROOT = vi.hoisted(() => {
  const p = require('path');
  const o = require('os');
  return p.join(o.tmpdir(), 'test-resume-human-approval-' + Date.now());
});

vi.mock('@/lib/requestGuard', () => ({
  PITCH_JOBS_ROOT: TEST_ROOT,
}));

vi.mock('@/lib/logger', () => ({
  writeApiAuditLog: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from '@/app/api/campaigns/[id]/resume/route';

function mockRequest(method: string, body?: unknown) {
  const req = new NextRequest('http://localhost', { method });
  Object.defineProperty(req, 'json', { value: async () => body });
  return req;
}

async function writeApproval(campaignSlug: string, data: Record<string, unknown>) {
  const dir = path.join(TEST_ROOT, campaignSlug);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    path.join(dir, 'human-approval.json'),
    JSON.stringify(data),
    'utf-8',
  );
}

describe('resume route — provenance gate', () => {
  beforeEach(async () => {
    await fs.mkdir(TEST_ROOT, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(TEST_ROOT, { recursive: true, force: true }).catch(() => undefined);
  });

  it('missing approval file returns APPROVAL_RECORD_MISSING', async () => {
    await fs.mkdir(path.join(TEST_ROOT, 'no-approval-campaign'), { recursive: true });
    const response = await POST(
      mockRequest('POST', { targetStage: 'S8' }),
      { params: Promise.resolve({ id: 'no-approval-campaign' }) },
    );
    const body = await response.json();
    expect(body.error).toBe('APPROVAL_RECORD_MISSING');
  });

  it('status waiting returns APPROVAL_NOT_APPROVED', async () => {
    await writeApproval('status-waiting', { status: 'waiting' });
    const response = await POST(
      mockRequest('POST', { targetStage: 'S8' }),
      { params: Promise.resolve({ id: 'status-waiting' }) },
    );
    const body = await response.json();
    expect(body.error).toBe('APPROVAL_NOT_APPROVED');
  });

  it('status rejected returns APPROVAL_NOT_APPROVED', async () => {
    await writeApproval('status-rejected', { status: 'rejected' });
    const response = await POST(
      mockRequest('POST', { targetStage: 'S8' }),
      { params: Promise.resolve({ id: 'status-rejected' }) },
    );
    const body = await response.json();
    expect(body.error).toBe('APPROVAL_NOT_APPROVED');
  });

  it('status needs_revision returns APPROVAL_NOT_APPROVED', async () => {
    await writeApproval('status-needs-revision', { status: 'needs_revision' });
    const response = await POST(
      mockRequest('POST', { targetStage: 'S8' }),
      { params: Promise.resolve({ id: 'status-needs-revision' }) },
    );
    const body = await response.json();
    expect(body.error).toBe('APPROVAL_NOT_APPROVED');
  });

  it('approved with no provenanceStatus — allows (legacy compat)', async () => {
    await writeApproval('no-provenance', {
      stageId: 'S7_PITCH_SELECTION_HUMAN_GATE',
      status: 'approved',
      selectedAngleTitle: 'Test Angle',
    });
    const response = await POST(
      mockRequest('POST', { targetStage: 'S8' }),
      { params: Promise.resolve({ id: 'no-provenance' }) },
    );
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.selectedAngle).toBe('Test Angle');
    expect(body.data.provenanceWarning).toContain('Batch 5F');
  });

  it('approved with provenanceStatus non_live — PROVENANCE_BLOCKED', async () => {
    await writeApproval('non-live', {
      stageId: 'S7_PITCH_SELECTION_HUMAN_GATE',
      status: 'approved',
      selectedAngleTitle: 'Test Angle',
      provenanceStatus: 'non_live',
      provenanceWarning: 'Artifact was written in non-live mode',
    });
    const response = await POST(
      mockRequest('POST', { targetStage: 'S8' }),
      { params: Promise.resolve({ id: 'non-live' }) },
    );
    const body = await response.json();
    expect(body.error).toBe('PROVENANCE_BLOCKED');
    expect(body.message).toContain('non-live');
  });

  it('approved with provenanceStatus missing — PROVENANCE_BLOCKED', async () => {
    await writeApproval('prov-missing', {
      stageId: 'S7_PITCH_SELECTION_HUMAN_GATE',
      status: 'approved',
      selectedAngleTitle: 'Test Angle',
      provenanceStatus: 'missing',
    });
    const response = await POST(
      mockRequest('POST', { targetStage: 'S8' }),
      { params: Promise.resolve({ id: 'prov-missing' }) },
    );
    const body = await response.json();
    expect(body.error).toBe('PROVENANCE_BLOCKED');
  });

  it('approved verified + no angle — ANGLE_NOT_SELECTED', async () => {
    await writeApproval('verified-no-angle', {
      stageId: 'S7_PITCH_SELECTION_HUMAN_GATE',
      status: 'approved',
      provenanceStatus: 'verified',
    });
    const response = await POST(
      mockRequest('POST', { targetStage: 'S8' }),
      { params: Promise.resolve({ id: 'verified-no-angle' }) },
    );
    const body = await response.json();
    expect(body.error).toBe('ANGLE_NOT_SELECTED');
  });

  it('approved unknown + no angle — ANGLE_NOT_SELECTED', async () => {
    await writeApproval('unknown-no-angle', {
      stageId: 'S7_PITCH_SELECTION_HUMAN_GATE',
      status: 'approved',
      provenanceStatus: 'unknown',
      provenanceWarning: 'Partial provenance metadata',
    });
    const response = await POST(
      mockRequest('POST', { targetStage: 'S8' }),
      { params: Promise.resolve({ id: 'unknown-no-angle' }) },
    );
    const body = await response.json();
    expect(body.error).toBe('ANGLE_NOT_SELECTED');
  });

  it('approved verified + angle — success without warning', async () => {
    await writeApproval('verified-angle', {
      stageId: 'S7_PITCH_SELECTION_HUMAN_GATE',
      status: 'approved',
      selectedAngleTitle: 'My Angle',
      provenanceStatus: 'verified',
      runMode: 'live',
    });
    const response = await POST(
      mockRequest('POST', { targetStage: 'S8' }),
      { params: Promise.resolve({ id: 'verified-angle' }) },
    );
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.selectedAngle).toBe('My Angle');
    expect(body.data.provenanceWarning).toBeUndefined();
  });

  it('approved unknown + angle — success (legacy compat)', async () => {
    await writeApproval('unknown-angle', {
      stageId: 'S7_PITCH_SELECTION_HUMAN_GATE',
      status: 'approved',
      selectedAngleTitle: 'Legacy Angle',
      provenanceStatus: 'unknown',
      provenanceWarning: 'Partial provenance metadata',
    });
    const response = await POST(
      mockRequest('POST', { targetStage: 'S8' }),
      { params: Promise.resolve({ id: 'unknown-angle' }) },
    );
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.selectedAngle).toBe('Legacy Angle');
    expect(body.data.provenanceWarning).toBe('Partial provenance metadata');
  });
});
