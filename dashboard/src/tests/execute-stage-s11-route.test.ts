import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import fs from 'fs/promises';
import type { PathLike } from 'node:fs';

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
  resolveCampaignPath: vi.fn((id: string) => `D:\\tmp\\s11-route-test\\${id}`),
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
  validateStagePitchGovernance: vi.fn().mockResolvedValue({
    valid: true,
    issues: [],
    stage: 11,
    filePath: null,
    warnings: [],
  }),
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

const VALID_DRAFT = [
  '# Subject Line',
  'Test: New data reveals key insights about campaign strategy',
  '',
  '## Body',
  'This is the body of the pitch draft that contains several lines of meaningful content about the campaign and why the journalist coverage would be valuable. The story covers emerging trends in the industry that align with the journalist beat.',
  'The research shows compelling evidence that this angle resonates with current market dynamics and audience interests. The data points included here demonstrate the newsworthiness of this story.',
  'This pitch draft has been carefully crafted based on journalist intelligence and beat analysis to ensure maximum relevance and engagement.',
  '',
  '## CTA',
  'Reply to this email if you are interested in covering this story and would like more information about the campaign.',
].join('\n');

type FsFilePath = Parameters<typeof fs.readFile>[0];
type FsFileData = Parameters<typeof fs.writeFile>[1];

describe('S11 route-level integration behavior', () => {
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

  it('successful S11 route execution produces 11-optimized-pitch.md', async () => {
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
      if (pStr.includes('stage-state.json')) return makeStageState(11);
      if (pStr.includes('circuit-state.json')) throw new Error('ENOENT');
      if (pStr.includes('.stage-lock')) throw new Error('ENOENT');
      if (pStr.includes('human-approval.json')) return makeApproval();
      if (pStr.includes('10-pitch-draft.md')) return VALID_DRAFT;
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest({ stage: 11 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.stage).toBe(11);
    expect(body.data.outputFile).toBe('11-optimized-pitch.md');
    expect(body.data.status).toBe('running');
    expect(body.data.currentStage).toBe(12);

    const outputWrite = Object.entries(writtenFiles).find(
      ([path]) => path.includes('11-optimized-pitch.md') && !path.endsWith('.tmp'),
    );
    expect(outputWrite).toBeDefined();
    expect(outputWrite![1]).toContain('# Stage 11 Optimized Pitch');
    expect(outputWrite![1]).toContain('## Subject Line');
    expect(outputWrite![1]).toContain('## Subject Line Variants');
    expect(outputWrite![1]).toContain('## Body');
    expect(outputWrite![1]).toContain('## Call to Action');
    expect(outputWrite![1]).toContain('## Optimization Notes');
  });

  it('S11 blocked when S10 draft is too thin', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike: FsFilePath) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(11);
      if (pStr.includes('circuit-state.json')) throw new Error('ENOENT');
      if (pStr.includes('.stage-lock')) throw new Error('ENOENT');
      if (pStr.includes('human-approval.json')) return makeApproval();
      if (pStr.includes('10-pitch-draft.md')) return 'short';
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest({ stage: 11 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe('STAGE_DEPENDENCY_BLOCKED');
    expect(body.message).toMatch(/too thin/i);
  });

  it('RED: S11 blocks when claim-ledger.json is missing', async () => {
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
      if (pStr.includes('stage-state.json')) return makeStageState(11);
      if (pStr.includes('circuit-state.json')) throw new Error('ENOENT');
      if (pStr.includes('.stage-lock')) throw new Error('ENOENT');
      if (pStr.includes('human-approval.json')) return makeApproval();
      if (pStr.includes('10-pitch-draft.md')) return VALID_DRAFT;
      if (pStr.includes('11-optimized-pitch.md')) return '# Stage 11 Optimized Pitch\n\nValid output.\n' + 'x'.repeat(500);
      throw new Error('ENOENT');
    });

    vi.mocked(fs.access).mockImplementation(async (pathLike: PathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('claim-ledger.json')) throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest({ stage: 11 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );

    expect(response.status).toBe(409);
    const body = await response.json().catch(() => ({}));
    const message = typeof body === 'object' && body !== null && 'message' in body
      ? String((body as { message?: unknown }).message)
      : '';
    expect(message).toMatch(/claim-ledger\.json/);
  });

  it('S11 governance validation failure blocks execution', async () => {
    const { validateStagePitchGovernance } = await import('@/lib/pitchGovernanceValidator');
    vi.mocked(validateStagePitchGovernance).mockResolvedValue({
      valid: false,
      issues: [{ code: 'GOVERNANCE_ERROR', severity: 'high' as const, message: 'S11 governance check failed: subject line does not meet character guidelines' }],
      stage: 11,
      filePath: null,
      warnings: [],
    });

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
      if (pStr.includes('stage-state.json')) return makeStageState(11);
      if (pStr.includes('circuit-state.json')) throw new Error('ENOENT');
      if (pStr.includes('.stage-lock')) throw new Error('ENOENT');
      if (pStr.includes('human-approval.json')) return makeApproval();
      if (pStr.includes('10-pitch-draft.md')) return VALID_DRAFT;
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest({ stage: 11 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('EXECUTE_STAGE_FAILED');
    expect(body.details).toMatch(/S11 governance failed/i);
  });

  it('S11 does NOT produce phantom JSON output files', async () => {
    const { validateStagePitchGovernance } = await import('@/lib/pitchGovernanceValidator');
    vi.mocked(validateStagePitchGovernance).mockResolvedValue({
      valid: true,
      issues: [],
      stage: 11,
      filePath: null,
      warnings: [],
    });

    const writtenPaths: string[] = [];

    vi.mocked(fs.writeFile).mockImplementation(async (pathLike: FsFilePath) => {
      writtenPaths.push(String(pathLike));
    });

    vi.mocked(fs.readFile).mockImplementation(async (pathLike: FsFilePath) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(11);
      if (pStr.includes('circuit-state.json')) throw new Error('ENOENT');
      if (pStr.includes('.stage-lock')) throw new Error('ENOENT');
      if (pStr.includes('human-approval.json')) return makeApproval();
      if (pStr.includes('10-pitch-draft.md')) return VALID_DRAFT;
      if (pStr.includes('11-optimized-pitch.md')) return '# Stage 11 Optimized Pitch\n\nValid output content for validation.\n' + 'x'.repeat(500);
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest({ stage: 11 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    expect(response.status).toBe(200);

    const phantomJsonPaths = writtenPaths.filter(
      p => p.includes('.json') && (p.includes('11-optimization-diff') || p.includes('11-optimized-pitch')),
    );
    expect(phantomJsonPaths).toHaveLength(0);

    const markdownPaths = writtenPaths.filter(p => p.includes('.md'));
    expect(markdownPaths.length).toBeGreaterThanOrEqual(1);
    expect(markdownPaths.some(p => p.includes('11-optimized-pitch'))).toBe(true);
  });

  it('S11 output markdown has expected optimization structure', async () => {
    const { validateStagePitchGovernance } = await import('@/lib/pitchGovernanceValidator');
    vi.mocked(validateStagePitchGovernance).mockResolvedValue({
      valid: true,
      issues: [],
      stage: 11,
      filePath: null,
      warnings: [],
    });

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
      if (pStr.includes('stage-state.json')) return makeStageState(11);
      if (pStr.includes('circuit-state.json')) throw new Error('ENOENT');
      if (pStr.includes('.stage-lock')) throw new Error('ENOENT');
      if (pStr.includes('human-approval.json')) return makeApproval();
      if (pStr.includes('10-pitch-draft.md')) return VALID_DRAFT;
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest({ stage: 11 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    expect(response.status).toBe(200);

    const outputEntry = Object.entries(writtenFiles).find(
      ([path]) => path.includes('11-optimized-pitch.md') && !path.endsWith('.tmp'),
    );
    expect(outputEntry).toBeDefined();
    const output = outputEntry![1];

    expect(output).toContain('# Stage 11 Optimized Pitch');
    expect(output).toContain('Generated at:');
    expect(output).toContain('## Subject Line');
    expect(output).toContain('## Subject Line Variants');
    expect(output).toContain('## Body');
    expect(output).toContain('## Call to Action');
    expect(output).toContain('## Optimization Notes');

    expect(output).toContain('Subject line optimized for length');
    expect(output).toContain('CTA softened to:');
    expect(output).toContain('Anti-sales language filtered');
    expect(output).toContain('Subject line variants provided for A/B testing');

    expect(output).toContain('let me know');
    expect(output).not.toContain('Reply to this email');
  });

  it('S11 blocked when optimized pitch output is too thin after write', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike: FsFilePath) => {
      const pStr = String(pathLike);
      if (pStr.includes('stage-state.json')) return makeStageState(11);
      if (pStr.includes('circuit-state.json')) throw new Error('ENOENT');
      if (pStr.includes('.stage-lock')) throw new Error('ENOENT');
      if (pStr.includes('human-approval.json')) return makeApproval();
      if (pStr.includes('10-pitch-draft.md')) return VALID_DRAFT;
      if (pStr.includes('11-optimized-pitch.md')) return 'Short thin output.';
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest({ stage: 11 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe('STAGE_DEPENDENCY_BLOCKED');
    expect(body.message).toBe('S11 blocked: optimized pitch output is too thin.');
  });

  it('S11 filters anti-sales language from optimized body', async () => {
    const { validateStagePitchGovernance } = await import('@/lib/pitchGovernanceValidator');
    vi.mocked(validateStagePitchGovernance).mockResolvedValue({
      valid: true,
      issues: [],
      stage: 11,
      filePath: null,
      warnings: [],
    });

    const draftWithSales = [
      '# Subject Line',
      'Test: New data reveals key insights about campaign strategy',
      '',
      '## Body',
      'This is the body of the pitch draft that contains several lines of meaningful content about the campaign and why the journalist coverage would be valuable. limited time',
      'The research shows compelling evidence that this angle resonates with current market dynamics and audience interests. act now',
      'This pitch draft has been carefully crafted based on journalist intelligence and beat analysis to ensure maximum relevance and engagement. exclusive offer',
      'Additional context about this campaign and why it matters for the target audience and their coverage interests. hurry',
      'More supporting evidence drawn from verified findings and journalist intelligence data. last chance',
      '',
      '## CTA',
      'Let me know if you would like more information about the campaign.',
    ].join('\n');

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
      if (pStr.includes('stage-state.json')) return makeStageState(11);
      if (pStr.includes('circuit-state.json')) throw new Error('ENOENT');
      if (pStr.includes('.stage-lock')) throw new Error('ENOENT');
      if (pStr.includes('human-approval.json')) return makeApproval();
      if (pStr.includes('10-pitch-draft.md')) return draftWithSales;
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest({ stage: 11 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    expect(response.status).toBe(200);

    const outputEntry = Object.entries(writtenFiles).find(
      ([path]) => path.includes('11-optimized-pitch.md') && !path.endsWith('.tmp'),
    );
    expect(outputEntry).toBeDefined();
    const output = outputEntry![1];

    expect(output).not.toContain('limited time');
    expect(output).not.toContain('act now');
    expect(output).not.toContain('exclusive offer');
    expect(output).not.toContain('hurry');
    expect(output).not.toContain('last chance');
    expect(output).toContain('Anti-sales language filtered');
  });

  it('S11 selects shortest valid generated subject variant', async () => {
    const draftWithSubject = [
      'Subject: Study reveals latest childcare cost pressure across Ohio families',
      '',
      '## Body',
      'This is the body of the pitch draft that contains several lines of meaningful content about the campaign and why the journalist coverage would be valuable. The story covers emerging trends in the industry that align with the journalist beat.',
      'The research shows compelling evidence that this angle resonates with current market dynamics and audience interests. The data points included here demonstrate the newsworthiness of this story.',
      '',
      '## CTA',
      'Reply to this email if you are interested in covering this story.',
    ].join('\n');

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
      if (pStr.includes('stage-state.json')) return makeStageState(11);
      if (pStr.includes('circuit-state.json')) throw new Error('ENOENT');
      if (pStr.includes('.stage-lock')) throw new Error('ENOENT');
      if (pStr.includes('human-approval.json')) return makeApproval();
      if (pStr.includes('10-pitch-draft.md')) return draftWithSubject;
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest({ stage: 11 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.data.outputFile).toBe('11-optimized-pitch.md');

    const outputEntry = Object.entries(writtenFiles).find(
      ([path]) => path.includes('11-optimized-pitch.md') && !path.endsWith('.tmp'),
    );
    expect(outputEntry).toBeDefined();
    const output = outputEntry![1];

    const outputLines = output.split('\n');

    expect(outputLines).toContain('  1. Study reveals latest childcare cost pressure across Ohio families');
    expect(outputLines).toContain('  2. Study reveals  childcare cost pressure across Ohio families');
    expect(outputLines).toContain('  3. Data point: Study reveals latest childcare cost pressure across Ohio fam');

    expect(output).toContain('## Subject Line');
    const subjectSectionStart = output.indexOf('## Subject Line');
    const subjectSectionEnd = output.indexOf('## Subject Line Variants');
    const subjectSection = output.slice(subjectSectionStart, subjectSectionEnd);

    expect(subjectSection).toContain('Study reveals  childcare cost pressure across Ohio families');
    expect(subjectSection).not.toContain('Study reveals latest');
    expect(subjectSection).not.toContain('Data point:');
  });

  it('S11 uses fallback subject variants when draft has no subject line', async () => {
    const draftWithoutSubject = [
      '## Body',
      'This pitch draft intentionally has no subject line, but it still contains enough meaningful body content for S11 to optimize. The campaign explains a timely data-backed story angle with clear journalist relevance and enough detail to avoid thin-draft blocking.',
      'The body continues with additional context about audience interest, current coverage value, and why this angle can be useful for reporters covering this beat. It includes multiple sentences so the route receives a realistic draft body for optimization.',
      'The final body paragraph preserves a practical story angle and gives the optimizer enough content to assemble a complete artifact without relying on a subject heading.',
      '',
      '## CTA',
      'Reply to this email if you are interested in covering this story.',
    ].join('\n');

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
      if (pStr.includes('stage-state.json')) return makeStageState(11);
      if (pStr.includes('circuit-state.json')) throw new Error('ENOENT');
      if (pStr.includes('.stage-lock')) throw new Error('ENOENT');
      if (pStr.includes('human-approval.json')) return makeApproval();
      if (pStr.includes('10-pitch-draft.md')) return draftWithoutSubject;
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest({ stage: 11 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.data.outputFile).toBe('11-optimized-pitch.md');

    const outputEntry = Object.entries(writtenFiles).find(
      ([path]) => path.includes('11-optimized-pitch.md') && !path.endsWith('.tmp'),
    );
    expect(outputEntry).toBeDefined();
    const output = outputEntry![1];

    const outputLines = output.split('\n');

    expect(outputLines).toContain('  1. Pitch: Campaign angle overview');
    expect(outputLines).toContain('  2. Story idea for your beat');
    expect(outputLines).toContain('  3. Data-backed angle for your coverage');

    expect(output).toContain('## Subject Line');
    const subjectSectionStart = output.indexOf('## Subject Line');
    const subjectSectionEnd = output.indexOf('## Subject Line Variants');
    const subjectSection = output.slice(subjectSectionStart, subjectSectionEnd);

    expect(subjectSection).toContain('Story idea for your beat');
    expect(subjectSection).not.toContain('Pitch: Campaign angle overview');
    expect(subjectSection).not.toContain('Data-backed angle for your coverage');
  });

  it('S11 uses default CTA when draft has no CTA section', async () => {
    const draftWithoutCta = [
      '# Subject Line',
      'New data shows how newsroom-relevant campaign angles can be refined for coverage',
      '',
      '## Body',
      'This pitch draft intentionally has no CTA section, but it still contains enough meaningful body content for S11 to optimize. The campaign explains a timely data-backed story angle with clear journalist relevance and enough detail to avoid thin-draft blocking.',
      'The body continues with additional context about audience interest, current coverage value, and why this angle can be useful for reporters covering this beat. It includes multiple sentences so the route receives a realistic draft body for optimization.',
      'The final body paragraph preserves a practical story angle and gives the optimizer enough content to assemble a complete artifact without relying on a CTA heading.',
    ].join('\n');

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
      if (pStr.includes('stage-state.json')) return makeStageState(11);
      if (pStr.includes('circuit-state.json')) throw new Error('ENOENT');
      if (pStr.includes('.stage-lock')) throw new Error('ENOENT');
      if (pStr.includes('human-approval.json')) return makeApproval();
      if (pStr.includes('10-pitch-draft.md')) return draftWithoutCta;
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest({ stage: 11 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.data.outputFile).toBe('11-optimized-pitch.md');

    const outputEntry = Object.entries(writtenFiles).find(
      ([path]) => path.includes('11-optimized-pitch.md') && !path.endsWith('.tmp'),
    );
    expect(outputEntry).toBeDefined();
    const output = outputEntry![1];

    const ctaSectionStart = output.indexOf('## Call to Action');
    const ctaSectionEnd = output.indexOf('## Optimization Notes');
    const ctaSection = output.slice(ctaSectionStart, ctaSectionEnd);

    expect(ctaSection).toContain('Let me know if this resonates with your beat coverage.');

    const notesSection = output.slice(ctaSectionEnd);

    expect(notesSection).toContain('CTA softened to: "Let me know if this resonates with your beat coverage."');
  });

  it('S11 normalizes exclamation marks in softened CTA', async () => {
    const draftWithExclamationCta = [
      '# Subject Line',
      'New data shows how newsroom-relevant campaign angles can be refined for coverage',
      '',
      '## Body',
      'This pitch draft contains a CTA with exclamation marks that S11 must normalize to a period. The campaign explains a timely data-backed story angle with clear journalist relevance and enough detail to avoid thin-draft blocking.',
      'The body continues with additional context about audience interest, current coverage value, and why this angle can be useful for reporters covering this beat. It includes multiple sentences so the route receives a realistic draft body for optimization.',
      '',
      '## CTA',
      'Respond today!!!',
    ].join('\n');

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
      if (pStr.includes('stage-state.json')) return makeStageState(11);
      if (pStr.includes('circuit-state.json')) throw new Error('ENOENT');
      if (pStr.includes('.stage-lock')) throw new Error('ENOENT');
      if (pStr.includes('human-approval.json')) return makeApproval();
      if (pStr.includes('10-pitch-draft.md')) return draftWithExclamationCta;
      throw new Error('ENOENT');
    });

    const response = await POST(
      mockRequest({ stage: 11 }),
      { params: Promise.resolve({ id: 'test-campaign' }) },
    );
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.data.outputFile).toBe('11-optimized-pitch.md');

    const outputEntry = Object.entries(writtenFiles).find(
      ([path]) => path.includes('11-optimized-pitch.md') && !path.endsWith('.tmp'),
    );
    expect(outputEntry).toBeDefined();
    const output = outputEntry![1];

    const ctaSectionStart = output.indexOf('## Call to Action');
    const ctaSectionEnd = output.indexOf('## Optimization Notes');
    const ctaSection = output.slice(ctaSectionStart, ctaSectionEnd);

    expect(ctaSection).toContain('let me know today.');
    expect(ctaSection).not.toContain('Respond today!!!');
    expect(ctaSection).not.toContain('!!!');
    expect(ctaSection).not.toContain('!');

    const notesSection = output.slice(ctaSectionEnd);

    expect(notesSection).toContain('CTA softened to: "let me know today."');
  });
});
