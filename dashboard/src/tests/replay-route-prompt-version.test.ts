import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPromptVersionForRoute } from '@/lib/promptVersionResolver';

const mockExecuteReplay = vi.hoisted(() => vi.fn());
const mockResolveCampaignPath = vi.hoisted(() => vi.fn((slug: string) => `D:\\test-campaigns\\${slug}`));

vi.mock('@/lib/replayManager', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return {
    ...actual,
    executeReplay: mockExecuteReplay,
    runDryRunReplay: vi.fn(),
  };
});

vi.mock('@/lib/requestGuard', () => ({
  resolveCampaignPath: mockResolveCampaignPath,
}));

import { POST } from '@/app/api/campaigns/[id]/replay/route';

function mockRequest(method: string, body?: unknown) {
  return {
    json: async () => body,
    headers: new Map(),
    method,
    url: 'http://localhost/api/campaigns/test-campaign/replay',
    nextUrl: new URL('http://localhost/api/campaigns/test-campaign/replay'),
  } as unknown as import('next/server').NextRequest;
}

describe('Replay Route — promptVersion fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecuteReplay.mockResolvedValue({ success: true, run: { runId: 'test-run-001' } });
  });

  // ===========================================================================
  // 1. Omitted promptVersion for a mapped stage → resolver fallback
  // ===========================================================================

  it('omitted promptVersion for S10_PITCH_DRAFTING resolves from resolver', async () => {
    const resolverVersion = getPromptVersionForRoute('S10_PITCH_DRAFTING');

    await POST(
      mockRequest('POST', {
        stageId: 'S10_PITCH_DRAFTING',
        replayType: 'stage_only',
        rerunReason: 'testing omitted promptVersion',
        triggeredBy: 'dashboard',
      }),
      { params: { id: 'test-campaign' } },
    );

    expect(mockExecuteReplay).toHaveBeenCalledTimes(1);
    const requestArg = mockExecuteReplay.mock.calls[0][0];
    expect(requestArg.promptVersion).toBe(resolverVersion);
    expect(requestArg.promptVersion).toBe('1.0.0');
  });

  // ===========================================================================
  // 2. Explicit string → preserved as authoritative
  // ===========================================================================

  it('explicit string promptVersion preserved as authoritative', async () => {
    await POST(
      mockRequest('POST', {
        stageId: 'S10_PITCH_DRAFTING',
        replayType: 'stage_only',
        rerunReason: 'testing explicit string',
        triggeredBy: 'dashboard',
        promptVersion: '2.0.0',
      }),
      { params: { id: 'test-campaign' } },
    );

    expect(mockExecuteReplay).toHaveBeenCalledTimes(1);
    const requestArg = mockExecuteReplay.mock.calls[0][0];
    expect(requestArg.promptVersion).toBe('2.0.0');
  });

  // ===========================================================================
  // 3. Explicit null → preserved without resolver fallback
  // ===========================================================================

  it('explicit null promptVersion preserved as null', async () => {
    await POST(
      mockRequest('POST', {
        stageId: 'S10_PITCH_DRAFTING',
        replayType: 'stage_only',
        rerunReason: 'testing explicit null',
        triggeredBy: 'dashboard',
        promptVersion: null,
      }),
      { params: { id: 'test-campaign' } },
    );

    expect(mockExecuteReplay).toHaveBeenCalledTimes(1);
    const requestArg = mockExecuteReplay.mock.calls[0][0];
    expect(requestArg.promptVersion).toBeNull();
  });

  // ===========================================================================
  // 4. Explicit empty string → preserved for downstream normalization
  // ===========================================================================

  it('explicit empty string promptVersion preserved at route handoff', async () => {
    await POST(
      mockRequest('POST', {
        stageId: 'S10_PITCH_DRAFTING',
        replayType: 'stage_only',
        rerunReason: 'testing empty string',
        triggeredBy: 'dashboard',
        promptVersion: '',
      }),
      { params: { id: 'test-campaign' } },
    );

    expect(mockExecuteReplay).toHaveBeenCalledTimes(1);
    const requestArg = mockExecuteReplay.mock.calls[0][0];
    expect(requestArg.promptVersion).toBe('');
  });

  // ===========================================================================
  // 5. Omitted promptVersion for unknown stage → resolver returns null
  // ===========================================================================

  it('omitted promptVersion for unknown stage S99_UNKNOWN resolves to null', async () => {
    await POST(
      mockRequest('POST', {
        stageId: 'S99_UNKNOWN',
        replayType: 'stage_only',
        rerunReason: 'testing unknown stage',
        triggeredBy: 'dashboard',
      }),
      { params: { id: 'test-campaign' } },
    );

    expect(mockExecuteReplay).toHaveBeenCalledTimes(1);
    const requestArg = mockExecuteReplay.mock.calls[0][0];
    expect(requestArg.promptVersion).toBeNull();
  });

  // ===========================================================================
  // 6. Required field validation unchanged
  // ===========================================================================

  it('missing stageId returns invalid replay input and does not call executeReplay', async () => {
    const response = await POST(
      mockRequest('POST', {
        replayType: 'stage_only',
        rerunReason: 'test',
        triggeredBy: 'dashboard',
      }),
      { params: { id: 'test-campaign' } },
    );

    expect(mockExecuteReplay).not.toHaveBeenCalled();
    const body = await response.json();
    expect(body.error).toBe('INVALID_REPLAY_INPUT');
  });

  it('missing replayType returns invalid replay input and does not call executeReplay', async () => {
    const response = await POST(
      mockRequest('POST', {
        stageId: 'S10_PITCH_DRAFTING',
        rerunReason: 'test',
        triggeredBy: 'dashboard',
      }),
      { params: { id: 'test-campaign' } },
    );

    expect(mockExecuteReplay).not.toHaveBeenCalled();
    const body = await response.json();
    expect(body.error).toBe('INVALID_REPLAY_INPUT');
  });

  it('missing rerunReason returns invalid replay input and does not call executeReplay', async () => {
    const response = await POST(
      mockRequest('POST', {
        stageId: 'S10_PITCH_DRAFTING',
        replayType: 'stage_only',
        triggeredBy: 'dashboard',
      }),
      { params: { id: 'test-campaign' } },
    );

    expect(mockExecuteReplay).not.toHaveBeenCalled();
    const body = await response.json();
    expect(body.error).toBe('INVALID_REPLAY_INPUT');
  });

  it('missing triggeredBy returns invalid replay input and does not call executeReplay', async () => {
    const response = await POST(
      mockRequest('POST', {
        stageId: 'S10_PITCH_DRAFTING',
        replayType: 'stage_only',
        rerunReason: 'test',
      }),
      { params: { id: 'test-campaign' } },
    );

    expect(mockExecuteReplay).not.toHaveBeenCalled();
    const body = await response.json();
    expect(body.error).toBe('INVALID_REPLAY_INPUT');
  });
});
