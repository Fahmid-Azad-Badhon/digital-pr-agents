import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import fs from 'fs/promises';
import path from 'path';

const TEST_ROOT = vi.hoisted(() => {
  const p = require('path');
  const o = require('os');
  return p.join(o.tmpdir(), 'test-human-approval-route-' + Date.now());
});

vi.mock('@/lib/requestGuard', () => ({
  PITCH_JOBS_ROOT: TEST_ROOT,
}));

vi.mock('@/lib/logger', () => ({
  writeApiAuditLog: vi.fn().mockResolvedValue(undefined),
}));

interface RunModeModule {
  parseRunMode: (val: string) => unknown;
  getRunModeFromEnv: () => unknown;
}

interface MockRequestHeaders {
  get: (name: string) => string | null;
}

interface MockRequestLike {
  headers: MockRequestHeaders;
}

vi.mock('@/lib/runMode', async (importOriginal) => {
  const actual = await importOriginal() as RunModeModule;
  return {
    ...actual,
    getRunModeFromRequest: vi.fn((request: MockRequestLike) => {
      const headerValue = request?.headers?.get?.('x-run-mode') ?? null;
      if (headerValue !== null) {
        return actual.parseRunMode(headerValue);
      }
      return actual.getRunModeFromEnv();
    }),
  };
});

import { GET, POST } from '@/app/api/campaigns/[id]/human-approval/route';

function mockRequest(method: string, body?: unknown, runModeHeader?: string) {
  const hdrs = new Map<string, string>();
  if (runModeHeader) {
    hdrs.set('x-run-mode', runModeHeader);
  }
  return {
    json: async () => body,
    headers: {
      get: (name: string) => hdrs.get(name) ?? null,
    },
    method,
    url: '',
    nextUrl: new URL('http://localhost'),
  } as import('next/server').NextRequest;
}

describe('Human Approval Route — GET', () => {
  const campaignSlug = 'get-test-campaign';

  beforeEach(async () => {
    vi.clearAllMocks();
    await fs.mkdir(path.join(TEST_ROOT, campaignSlug), { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(TEST_ROOT, { recursive: true, force: true }).catch(() => undefined);
  });

  it('missing file returns provenanceStatus=missing + status=none', async () => {
    const response = await GET(
      mockRequest('GET'),
      { params: Promise.resolve({ id: 'nonexistent-campaign' }) },
    );
    const body = await response.json();

    expect(body.data.provenanceStatus).toBe('missing');
    expect(body.data.status).toBe('none');
    expect(body.data.provenanceWarning).toBeUndefined();
    expect(body.data.runMode).toBeNull();
    expect(body.data.source).toBeNull();
    expect(body.data.schemaVersion).toBeNull();
  });

  it('legacy file returns existing status/fields + provenanceStatus=unknown + warning', async () => {
    await fs.writeFile(
      path.join(TEST_ROOT, campaignSlug, 'human-approval.json'),
      JSON.stringify({
        stageId: 'S7_PITCH_SELECTION_HUMAN_GATE',
        status: 'approved',
        selectedAngleTitle: 'Old Angle',
        approvedAt: '2025-01-01T00:00:00.000Z',
      }),
    );

    const response = await GET(
      mockRequest('GET'),
      { params: Promise.resolve({ id: campaignSlug }) },
    );
    const body = await response.json();

    expect(body.data.status).toBe('approved');
    expect(body.data.selectedAngleTitle).toBe('Old Angle');
    expect(body.data.provenanceStatus).toBe('unknown');
    expect(body.data.provenanceWarning).toBe('Artifact written before provenance tracking (Batch 5F)');
    expect(body.data.runMode).toBeNull();
    expect(body.data.source).toBeNull();
    expect(body.data.schemaVersion).toBeNull();
  });

  it('partial provenance file returns provenanceStatus=unknown + partial warning', async () => {
    await fs.writeFile(
      path.join(TEST_ROOT, campaignSlug, 'human-approval.json'),
      JSON.stringify({
        stageId: 'S7_PITCH_SELECTION_HUMAN_GATE',
        status: 'approved',
        runMode: 'live',
      }),
    );

    const response = await GET(
      mockRequest('GET'),
      { params: Promise.resolve({ id: campaignSlug }) },
    );
    const body = await response.json();

    expect(body.data.provenanceStatus).toBe('unknown');
    expect(body.data.provenanceWarning).toBe('Partial provenance metadata');
    expect(body.data.runMode).toBe('live');
    expect(body.data.source).toBeNull();
    expect(body.data.schemaVersion).toBeNull();
  });

  it('non-live artifact returns provenanceStatus=non_live + warning', async () => {
    await fs.writeFile(
      path.join(TEST_ROOT, campaignSlug, 'human-approval.json'),
      JSON.stringify({
        stageId: 'S7_PITCH_SELECTION_HUMAN_GATE',
        status: 'approved',
        runMode: 'dry_run',
        source: 'human_approval_ui',
        schemaVersion: 1,
      }),
    );

    const response = await GET(
      mockRequest('GET'),
      { params: Promise.resolve({ id: campaignSlug }) },
    );
    const body = await response.json();

    expect(body.data.provenanceStatus).toBe('non_live');
    expect(body.data.provenanceWarning).toBe('Artifact was written in non-live mode');
    expect(body.data.runMode).toBe('dry_run');
  });

  it('live file with all provenance fields returns provenanceStatus=verified', async () => {
    await fs.writeFile(
      path.join(TEST_ROOT, campaignSlug, 'human-approval.json'),
      JSON.stringify({
        stageId: 'S7_PITCH_SELECTION_HUMAN_GATE',
        status: 'approved',
        runMode: 'live',
        source: 'human_approval_ui',
        schemaVersion: 1,
        selectedAngleTitle: 'Test Angle',
        approvedAt: new Date().toISOString(),
      }),
    );

    const response = await GET(
      mockRequest('GET'),
      { params: Promise.resolve({ id: campaignSlug }) },
    );
    const body = await response.json();

    expect(body.data.provenanceStatus).toBe('verified');
    expect(body.data.provenanceWarning).toBeUndefined();
    expect(body.data.runMode).toBe('live');
    expect(body.data.source).toBe('human_approval_ui');
    expect(body.data.schemaVersion).toBe(1);
    expect(body.data.status).toBe('approved');
  });
});

describe('Human Approval Route — POST', () => {
  let campaignSlug: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    campaignSlug = 'post-test-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    await fs.mkdir(path.join(TEST_ROOT, campaignSlug), { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(TEST_ROOT, { recursive: true, force: true }).catch(() => undefined);
  });

  it('live mode writes approval artifact with provenanceStatus=verified', async () => {
    const response = await POST(
      mockRequest('POST', { action: 'approve', selectedAngleTitle: 'Test Angle' }, 'live'),
      { params: Promise.resolve({ id: campaignSlug }) },
    );
    const body = await response.json();

    expect(body.data.approval.provenanceStatus).toBe('verified');
    expect(body.data.approval.runMode).toBe('live');
    expect(body.data.approval.source).toBe('human_approval_ui');
    expect(body.data.approval.schemaVersion).toBe(1);
    expect(body.data.approval.status).toBe('approved');

    const artifact = await fs.readFile(
      path.join(TEST_ROOT, campaignSlug, 'human-approval.json'),
      'utf-8',
    );
    const saved = JSON.parse(artifact);
    expect(saved.provenanceStatus).toBe('verified');
    expect(saved.runMode).toBe('live');
    expect(saved.source).toBe('human_approval_ui');
    expect(saved.schemaVersion).toBe(1);
  });

  it('dry_run mode does NOT write artifact and returns blocked response', async () => {
    const response = await POST(
      mockRequest('POST', { action: 'approve', selectedAngleTitle: 'Dry Angle' }, 'dry_run'),
      { params: Promise.resolve({ id: campaignSlug }) },
    );
    const body = await response.json();

    expect(body.data.blocked).toBe(true);
    expect(body.data.reason).toContain('Non-live mode');

    await expect(
      fs.readFile(path.join(TEST_ROOT, campaignSlug, 'human-approval.json'), 'utf-8'),
    ).rejects.toThrow();
  });

  it('preview mode does NOT write artifact and returns blocked response', async () => {
    const response = await POST(
      mockRequest('POST', { action: 'approve' }, 'preview'),
      { params: Promise.resolve({ id: campaignSlug }) },
    );
    const body = await response.json();

    expect(body.data.blocked).toBe(true);
    expect(body.data.reason).toContain('Non-live mode');

    await expect(
      fs.readFile(path.join(TEST_ROOT, campaignSlug, 'human-approval.json'), 'utf-8'),
    ).rejects.toThrow();
  });

  it('test mode does NOT write artifact and returns blocked response', async () => {
    const response = await POST(
      mockRequest('POST', { action: 'approve' }, 'test'),
      { params: Promise.resolve({ id: campaignSlug }) },
    );
    const body = await response.json();

    expect(body.data.blocked).toBe(true);
    expect(body.data.reason).toContain('Non-live mode');

    await expect(
      fs.readFile(path.join(TEST_ROOT, campaignSlug, 'human-approval.json'), 'utf-8'),
    ).rejects.toThrow();
  });

  it('rejects unknown action with 400', async () => {
    const response = await POST(
      mockRequest('POST', { action: 'invalid_action' }, 'live'),
      { params: Promise.resolve({ id: campaignSlug }) },
    );
    const data = await response.json();

    expect(data.error).toBe('UNKNOWN_ACTION');
  });

  it('rejects missing action with 400', async () => {
    const response = await POST(
      mockRequest('POST', {}, 'live'),
      { params: Promise.resolve({ id: campaignSlug }) },
    );
    const data = await response.json();

    expect(data.error).toBe('ACTION_REQUIRED');
  });
});
