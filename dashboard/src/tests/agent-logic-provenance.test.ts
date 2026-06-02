import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';

const { mockFileContents } = vi.hoisted(() => {
  const mc = new Map<string, string>();
  return { mockFileContents: mc };
});

vi.mock('fs/promises', () => {
  const mockReadFile = vi.fn(async (p: string) => {
    const c = mockFileContents.get(p);
    if (c === undefined) throw new Error(`ENOENT: ${p}`);
    return c;
  });
  const mockAccess = vi.fn(async (p: string) => {
    if (!mockFileContents.has(p)) throw new Error(`ENOENT: ${p}`);
  });
  const mockWriteFile = vi.fn(async () => undefined);
  return {
    readFile: mockReadFile,
    access: mockAccess,
    writeFile: mockWriteFile,
    default: { readFile: mockReadFile, access: mockAccess, writeFile: mockWriteFile },
  };
});

vi.mock('@/lib/requestGuard', () => ({
  PITCH_JOBS_ROOT: 'D:\\Codex Folder\\digital-pr-agents\\pitch-jobs',
}));

const PITCH_JOBS_ROOT = 'D:\\Codex Folder\\digital-pr-agents\\pitch-jobs';
const SYSTEM_DIR = 'D:\\Codex Folder\\digital-pr-agents\\system';
const CAMPAIGN_SLUG = 'test-campaign';
const STAGE_ID = 'S7_HUMAN_GATE';

const SYSTEM_CONFIG = {
  version: '1.0',
  updatedAt: '2026-05-09T00:00:00Z',
  globalRules: { noAgentMayRunIf: [], noWritingAgentMayUse: [], humanApprovalRequiredBefore: [] },
  stageLogic: [{
    stageId: STAGE_ID,
    canRunIf: [],
    mustStopIf: [],
    mustAskHumanIf: [],
    mustWarnIf: [],
    mustRerunIf: [],
    mustEscalateIf: [],
    canContinueIf: ['human-approval.json status = approved'],
    handoffIf: [],
  }],
};

function setMockFile(name: string, content: string) {
  mockFileContents.set(path.join(PITCH_JOBS_ROOT, CAMPAIGN_SLUG, name), content);
}

function setHumanApproval(content: unknown) {
  setMockFile('human-approval.json', JSON.stringify(content));
}

function removeHumanApproval() {
  mockFileContents.delete(path.join(PITCH_JOBS_ROOT, CAMPAIGN_SLUG, 'human-approval.json'));
}

let evaluateCanContinue: typeof import('@/lib/agentLogicConditionEngine').evaluateCanContinue;

beforeEach(async () => {
  vi.resetModules();
  mockFileContents.clear();
  mockFileContents.set(
    path.join(SYSTEM_DIR, 'agent-logic-conditions.json'),
    JSON.stringify(SYSTEM_CONFIG),
  );
  evaluateCanContinue = (await import('@/lib/agentLogicConditionEngine')).evaluateCanContinue;
});

describe('Batch 5G-b3 — agentLogicConditionEngine provenance hardening', () => {

  it('verified provenance + selectedAngleId passes', async () => {
    setHumanApproval({ status: 'approved', provenanceStatus: 'verified', selectedAngleId: 'angle-1' });
    const result = await evaluateCanContinue(CAMPAIGN_SLUG, STAGE_ID);
    expect(result.canContinue).toBe(true);
    expect(result.blockedBy).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('verified provenance + selectedAngleTitle passes', async () => {
    setHumanApproval({ status: 'approved', provenanceStatus: 'verified', selectedAngleTitle: 'Best Angle' });
    const result = await evaluateCanContinue(CAMPAIGN_SLUG, STAGE_ID);
    expect(result.canContinue).toBe(true);
    expect(result.blockedBy).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('non_live provenance blocks', async () => {
    setHumanApproval({ status: 'approved', provenanceStatus: 'non_live', selectedAngleId: 'angle-1' });
    const result = await evaluateCanContinue(CAMPAIGN_SLUG, STAGE_ID);
    expect(result.canContinue).toBe(false);
    expect(result.blockedBy).toContain('human-approval.json status = approved');
  });

  it('explicit provenanceStatus "missing" blocks', async () => {
    setHumanApproval({ status: 'approved', provenanceStatus: 'missing', selectedAngleId: 'angle-1' });
    const result = await evaluateCanContinue(CAMPAIGN_SLUG, STAGE_ID);
    expect(result.canContinue).toBe(false);
    expect(result.blockedBy).toContain('human-approval.json status = approved');
  });

  it('approved with no selectedAngleId and no selectedAngleTitle blocks', async () => {
    setHumanApproval({ status: 'approved', provenanceStatus: 'verified' });
    const result = await evaluateCanContinue(CAMPAIGN_SLUG, STAGE_ID);
    expect(result.canContinue).toBe(false);
    expect(result.blockedBy).toContain('human-approval.json status = approved');
  });

  it('whitespace-only selectedAngleId and selectedAngleTitle blocks', async () => {
    setHumanApproval({ status: 'approved', provenanceStatus: 'verified', selectedAngleId: '   ', selectedAngleTitle: '   ' });
    const result = await evaluateCanContinue(CAMPAIGN_SLUG, STAGE_ID);
    expect(result.canContinue).toBe(false);
    expect(result.blockedBy).toContain('human-approval.json status = approved');
  });

  it('pending/not-approved blocks', async () => {
    setHumanApproval({ status: 'pending', provenanceStatus: 'verified', selectedAngleId: 'angle-1' });
    const result = await evaluateCanContinue(CAMPAIGN_SLUG, STAGE_ID);
    expect(result.canContinue).toBe(false);
    expect(result.blockedBy).toContain('human-approval.json status = approved');
  });

  it('missing human-approval.json blocks', async () => {
    removeHumanApproval();
    const result = await evaluateCanContinue(CAMPAIGN_SLUG, STAGE_ID);
    expect(result.canContinue).toBe(false);
    expect(result.blockedBy).toContain('human-approval.json status = approved');
  });

  it('malformed JSON blocks', async () => {
    setMockFile('human-approval.json', '{ invalid json!!! }');
    const result = await evaluateCanContinue(CAMPAIGN_SLUG, STAGE_ID);
    expect(result.canContinue).toBe(false);
    expect(result.blockedBy).toContain('human-approval.json status = approved');
  });

  it('unknown provenance continues with warning', async () => {
    setHumanApproval({ status: 'approved', provenanceStatus: 'unknown', selectedAngleId: 'angle-1' });
    const result = await evaluateCanContinue(CAMPAIGN_SLUG, STAGE_ID);
    expect(result.canContinue).toBe(true);
    expect(result.blockedBy).toHaveLength(0);
    expect(result.warnings).toContainEqual(expect.stringMatching(/Provenance: .*Partial provenance metadata/));
  });

  it('legacy/no-provenance continues with warning', async () => {
    setHumanApproval({ status: 'approved', selectedAngleId: 'angle-1' });
    const result = await evaluateCanContinue(CAMPAIGN_SLUG, STAGE_ID);
    expect(result.canContinue).toBe(true);
    expect(result.blockedBy).toHaveLength(0);
    expect(result.warnings).toContainEqual(
      expect.stringMatching(/Provenance: .*before provenance tracking/),
    );
  });

  it('writeConditionResult deduplicates warnings across sub-results', async () => {
    const multiConfig = {
      version: '1.0',
      updatedAt: '2026-05-09T00:00:00Z',
      globalRules: { noAgentMayRunIf: [], noWritingAgentMayUse: [], humanApprovalRequiredBefore: [] },
      stageLogic: [{
        stageId: STAGE_ID,
        canRunIf: ['human-approval.json status = approved'],
        mustStopIf: [],
        mustAskHumanIf: [],
        mustWarnIf: [],
        mustRerunIf: [],
        mustEscalateIf: [],
        canContinueIf: ['human-approval.json status = approved'],
        handoffIf: [],
      }],
    };

    vi.resetModules();
    mockFileContents.clear();
    mockFileContents.set(
      path.join(SYSTEM_DIR, 'agent-logic-conditions.json'),
      JSON.stringify(multiConfig),
    );
    setHumanApproval({ status: 'approved', selectedAngleId: 'angle-1' });

    const engine = await import('@/lib/agentLogicConditionEngine');
    const result = await engine.writeConditionResult(CAMPAIGN_SLUG, STAGE_ID);

    const entry = result.results[0];
    expect(entry.canContinue).toBe(true);
    expect(entry.warnings).toHaveLength(1);
    expect(entry.warnings[0]).toMatch(/Provenance:/);
  });

});
