import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGateSystem = {
  runG4HumanSelectionGate: vi.fn<[string], Promise<Record<string, unknown>>>(),
};

vi.mock('@/lib/gateSystem', () => mockGateSystem);

vi.mock('@/lib/apiResponse', () => ({
  ok: vi.fn((data: Record<string, unknown>) => ({ ok: true, ...data })),
  fail: vi.fn((msg: string) => ({ ok: false, error: msg })),
}));

vi.mock('@/lib/requestGuard', () => ({
  resolveCampaignPath: vi.fn((id: string) => `C:\\mock\\campaigns\\${id}`),
}));

vi.mock('@/lib/logger', () => ({
  writeApiAuditLog: vi.fn(async () => {}),
}));

vi.mock('fs/promises', () => ({
  default: {
    readdir: vi.fn(async () => ['00-brief.md', 'pitch-jobs', 'stage.json']),
    readFile: vi.fn(async () => JSON.stringify({ currentStage: 1 })),
    writeFile: vi.fn(async () => undefined),
    mkdir: vi.fn(async () => undefined),
    stat: vi.fn(async () => ({ isDirectory: () => false, isFile: () => true })),
    access: vi.fn(async () => undefined),
  },
}));

describe('G4 Human Selection Gate — route.ts delegation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates G4 to canonical runG4HumanSelectionGate from @/lib/gateSystem', async () => {
    mockGateSystem.runG4HumanSelectionGate.mockResolvedValueOnce({
      gateId: 'G4_HUMAN_SELECTION_GATE',
      status: 'pass',
      canContinue: true,
      reason: 'Delegated to canonical gateSystem',
      requiredAction: 'none',
      riskLevel: 'low',
    });

    const { POST } = await import('@/app/api/campaigns/[id]/gates/route');

    const mockRequest = {
      json: vi.fn().mockResolvedValue({ runGates: true }),
    } as unknown as import('next/server').NextRequest;

    const result = await POST(
      mockRequest,
      { params: Promise.resolve({ id: 'delegation-test' }) }
    );

    expect(result).toBeDefined();
    expect(mockGateSystem.runG4HumanSelectionGate).toHaveBeenCalled();
    expect(mockGateSystem.runG4HumanSelectionGate).toHaveBeenCalledWith('delegation-test');
  });

  it('returns pass when canonical returns pass with verified provenance and selectedAngleId', async () => {
    mockGateSystem.runG4HumanSelectionGate.mockResolvedValueOnce({
      gateId: 'G4_HUMAN_SELECTION_GATE',
      status: 'pass',
      canContinue: true,
      reason: 'Human selection approved (verified provenance)',
      requiredAction: 'none',
      riskLevel: 'low',
      details: { provenanceWarning: false, provenance: 'verified', selectedAngleId: 'angle-42' },
    });

    const { POST } = await import('@/app/api/campaigns/[id]/gates/route');

    const mockRequest = {
      json: vi.fn().mockResolvedValue({ runGates: true }),
    } as unknown as import('next/server').NextRequest;

    const response = await POST(
      mockRequest,
      { params: Promise.resolve({ id: 'camp-verified-angle' }) }
    ) as unknown as Record<string, unknown>;

    const results = response.results as Record<string, unknown>;
    const gates = results.gates as Array<Record<string, unknown>>;
    const g4 = gates.find((g) => g.gateId === 'G4_HUMAN_SELECTION_GATE')!;

    expect(g4.status).toBe('pass');
    expect(g4.details).toBeDefined();
    const details = g4.details as Record<string, unknown>;
    expect(details.provenanceWarning).toBe(false);
    expect(details.selectedAngleId).toBe('angle-42');
  });

  it('returns pass when canonical returns pass with verified provenance and selectedAngleTitle', async () => {
    mockGateSystem.runG4HumanSelectionGate.mockResolvedValueOnce({
      gateId: 'G4_HUMAN_SELECTION_GATE',
      status: 'pass',
      canContinue: true,
      reason: 'Human selection approved (verified provenance)',
      requiredAction: 'none',
      riskLevel: 'low',
      details: { provenanceWarning: false, provenance: 'verified', selectedAngleTitle: 'Main Angle' },
    });

    const result = await mockGateSystem.runG4HumanSelectionGate('camp-angle-title');
    expect(result.status).toBe('pass');
    const details = result.details as Record<string, unknown> | undefined;
    expect(details).toBeDefined();
    expect(details!.selectedAngleTitle).toBe('Main Angle');
  });

  it('blocks when canonical returns blocked for non_live provenance', async () => {
    mockGateSystem.runG4HumanSelectionGate.mockResolvedValueOnce({
      gateId: 'G4_HUMAN_SELECTION_GATE',
      status: 'blocked',
      canContinue: false,
      reason: 'Non-live human approval artifact found',
      requiredAction: 'Upload a live human approval',
      riskLevel: 'critical',
      details: { provenanceWarning: true, provenance: 'non_live' },
    });

    const result = await mockGateSystem.runG4HumanSelectionGate('camp-non-live');
    expect(result.status).toBe('blocked');
    expect(result.canContinue).toBe(false);
    const details = result.details as Record<string, unknown> | undefined;
    expect(details!.provenance).toBe('non_live');
  });

  it('blocks when canonical returns blocked for explicit missing provenance', async () => {
    mockGateSystem.runG4HumanSelectionGate.mockResolvedValueOnce({
      gateId: 'G4_HUMAN_SELECTION_GATE',
      status: 'blocked',
      canContinue: false,
      reason: 'Missing explicit provenance context',
      requiredAction: 'Upload human approval with explicit provenance',
      riskLevel: 'critical',
      details: { provenanceWarning: true, provenance: 'missing' },
    });

    const result = await mockGateSystem.runG4HumanSelectionGate('camp-missing-prov');
    expect(result.status).toBe('blocked');
    const details = result.details as Record<string, unknown> | undefined;
    expect(details!.provenance).toBe('missing');
  });

  it('approved + unknown provenance returns pass with details.provenanceWarning', async () => {
    mockGateSystem.runG4HumanSelectionGate.mockResolvedValueOnce({
      gateId: 'G4_HUMAN_SELECTION_GATE',
      status: 'pass',
      canContinue: true,
      reason: 'Human selection approved (unknown provenance)',
      requiredAction: 'none',
      riskLevel: 'low',
      details: { provenanceWarning: true, provenance: 'unknown' },
    });

    const result = await mockGateSystem.runG4HumanSelectionGate('camp-unknown-prov');
    expect(result.status).toBe('pass');
    const details = result.details as Record<string, unknown> | undefined;
    expect(details!.provenanceWarning).toBe(true);
    expect(details!.provenance).toBe('unknown');
  });

  it('legacy/no provenance returns pass with details.provenanceWarning', async () => {
    mockGateSystem.runG4HumanSelectionGate.mockResolvedValueOnce({
      gateId: 'G4_HUMAN_SELECTION_GATE',
      status: 'pass',
      canContinue: true,
      reason: 'Human selection approved (legacy provenance)',
      requiredAction: 'none',
      riskLevel: 'low',
      details: { provenanceWarning: true, provenance: 'legacy' },
    });

    const result = await mockGateSystem.runG4HumanSelectionGate('camp-legacy');
    expect(result.status).toBe('pass');
    const details = result.details as Record<string, unknown> | undefined;
    expect(details!.provenanceWarning).toBe(true);
    expect(details!.provenance).toBe('legacy');
  });

  it('missing selected angle returns needs_human_review with correct requiredAction', async () => {
    mockGateSystem.runG4HumanSelectionGate.mockResolvedValueOnce({
      gateId: 'G4_HUMAN_SELECTION_GATE',
      status: 'needs_human_review',
      canContinue: false,
      reason: 'S7 reached but no selected angle found',
      requiredAction: 'Human must select angle in S7',
      riskLevel: 'critical',
    });

    const result = await mockGateSystem.runG4HumanSelectionGate('camp-no-angle');
    expect(result.status).toBe('needs_human_review');
    expect(result.requiredAction).toBe('Human must select angle in S7');
  });

  it('array-shaped human-approval.json returns blocked status', async () => {
    mockGateSystem.runG4HumanSelectionGate.mockResolvedValueOnce({
      gateId: 'G4_HUMAN_SELECTION_GATE',
      status: 'blocked',
      canContinue: false,
      reason: 'Invalid array-shaped human-approval.json',
      requiredAction: 'Provide a valid object-shaped human approval',
      riskLevel: 'critical',
      details: { provenanceWarning: true, provenance: 'malformed' },
    });

    const result = await mockGateSystem.runG4HumanSelectionGate('camp-array');
    expect(result.status).toBe('blocked');
    const details = result.details as Record<string, unknown> | undefined;
    expect(details!.provenanceWarning).toBe(true);
  });

  it('malformed human-approval.json returns blocked status', async () => {
    mockGateSystem.runG4HumanSelectionGate.mockResolvedValueOnce({
      gateId: 'G4_HUMAN_SELECTION_GATE',
      status: 'blocked',
      canContinue: false,
      reason: 'Malformed human-approval.json',
      requiredAction: 'Check human approval file format',
      riskLevel: 'critical',
      details: { provenanceWarning: true, provenance: 'malformed' },
    });

    const result = await mockGateSystem.runG4HumanSelectionGate('camp-malformed');
    expect(result.status).toBe('blocked');
  });

  it('legacy approvals.json array with approved selected angle works', async () => {
    mockGateSystem.runG4HumanSelectionGate.mockResolvedValueOnce({
      gateId: 'G4_HUMAN_SELECTION_GATE',
      status: 'pass',
      canContinue: true,
      reason: 'Human selection approved (legacy approvals.json)',
      requiredAction: 'none',
      riskLevel: 'low',
      details: { provenanceWarning: true, provenance: 'legacy', selectedAngleId: 'angle-1' },
    });

    const result = await mockGateSystem.runG4HumanSelectionGate('camp-legacy-array');
    expect(result.status).toBe('pass');
    const details = result.details as Record<string, unknown> | undefined;
    expect(details!.selectedAngleId).toBe('angle-1');
  });

  it('object-shaped approvals.json returns blocked status', async () => {
    mockGateSystem.runG4HumanSelectionGate.mockResolvedValueOnce({
      gateId: 'G4_HUMAN_SELECTION_GATE',
      status: 'blocked',
      canContinue: false,
      reason: 'Invalid object-shaped approvals.json',
      requiredAction: 'Provide a valid array-shaped approvals.json',
      riskLevel: 'critical',
      details: { provenanceWarning: true, provenance: 'malformed' },
    });

    const result = await mockGateSystem.runG4HumanSelectionGate('camp-obj-approvals');
    expect(result.status).toBe('blocked');
  });

  it('no approval file returns needs_human_review', async () => {
    mockGateSystem.runG4HumanSelectionGate.mockResolvedValueOnce({
      gateId: 'G4_HUMAN_SELECTION_GATE',
      status: 'needs_human_review',
      canContinue: false,
      reason: 'S7 reached but no human approval found',
      requiredAction: 'Human must select angle in S7',
      riskLevel: 'critical',
    });

    const result = await mockGateSystem.runG4HumanSelectionGate('camp-no-file');
    expect(result.status).toBe('needs_human_review');
  });

  it('provenance warning appears in details.provenanceWarning (not only in reason)', async () => {
    mockGateSystem.runG4HumanSelectionGate.mockResolvedValueOnce({
      gateId: 'G4_HUMAN_SELECTION_GATE',
      status: 'pass',
      canContinue: true,
      reason: 'Human selection approved',
      requiredAction: 'none',
      riskLevel: 'low',
      details: { provenanceWarning: true, provenance: 'unknown' },
    });

    const result = await mockGateSystem.runG4HumanSelectionGate('camp-prov-flag');
    const details = result.details as Record<string, unknown> | undefined;
    expect(details!.provenanceWarning).toBe(true);
    expect(result.reason).toBeDefined();
    expect(result.reason).not.toContain('provenanceWarning');
  });

  it('stage before S7 returns pass without approval details', async () => {
    mockGateSystem.runG4HumanSelectionGate.mockResolvedValueOnce({
      gateId: 'G4_HUMAN_SELECTION_GATE',
      status: 'pass',
      canContinue: true,
      reason: 'Stage before S7 - human selection not yet required',
      requiredAction: 'none',
      riskLevel: 'low',
    });

    const result = await mockGateSystem.runG4HumanSelectionGate('camp-early');
    expect(result.status).toBe('pass');
    expect(result.reason).toContain('Stage before S7');
    expect(result.details).toBeUndefined();
  });

  it('whitespace-only selectedAngleId returns needs_human_review from canonical G4', async () => {
    mockGateSystem.runG4HumanSelectionGate.mockResolvedValueOnce({
      gateId: 'G4_HUMAN_SELECTION_GATE',
      status: 'needs_human_review',
      canContinue: false,
      reason: 'S7 approval found but no angle selected',
      requiredAction: 'Human must select angle in S7',
      riskLevel: 'high',
    });

    const result = await mockGateSystem.runG4HumanSelectionGate('camp-ws-angle-id');
    expect(result.status).toBe('needs_human_review');
    expect(result.requiredAction).toBe('Human must select angle in S7');
  });

  it('whitespace-only selectedAngleTitle returns needs_human_review from canonical G4', async () => {
    mockGateSystem.runG4HumanSelectionGate.mockResolvedValueOnce({
      gateId: 'G4_HUMAN_SELECTION_GATE',
      status: 'needs_human_review',
      canContinue: false,
      reason: 'S7 approval found but no angle selected',
      requiredAction: 'Human must select angle in S7',
      riskLevel: 'high',
    });

    const result = await mockGateSystem.runG4HumanSelectionGate('camp-ws-angle-title');
    expect(result.status).toBe('needs_human_review');
    expect(result.requiredAction).toBe('Human must select angle in S7');
  });
});
