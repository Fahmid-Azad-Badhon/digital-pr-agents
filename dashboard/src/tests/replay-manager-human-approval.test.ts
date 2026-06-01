import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs/promises';

vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    access: vi.fn(),
    mkdir: vi.fn(),
    readdir: vi.fn().mockResolvedValue([]),
  },
}));

import { handleApprovalStaleness } from '@/lib/replayManager';

const CAMPAIGN_SLUG = 'test-campaign';

function mockDepRead(stagesThatInvalidateApproval: string[]) {
  vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
    const pStr = String(pathLike);
    if (pStr.includes('replay-stage-dependencies.json')) {
      return JSON.stringify({
        dependencies: {},
        staleArtifactTriggers: {},
        humanApprovalInvalidation: { stagesThatInvalidateApproval },
      });
    }
    if (pStr.includes('human-approval.json')) {
      return JSON.stringify({
        stageId: 'S7_PITCH_SELECTION_HUMAN_GATE',
        status: 'approved',
        selectedAngleTitle: 'Test Angle',
        provenanceStatus: 'verified',
        provenanceWarning: undefined,
        runMode: 'live',
        source: 'human_approval_ui',
        schemaVersion: 1,
      });
    }
    throw new Error('ENOENT: ' + pStr);
  });
}

describe('handleApprovalStaleness — provenance preservation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.access).mockResolvedValue(undefined);
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
  });

  it('no staleness when stage not in invalidation list', async () => {
    mockDepRead([]);
    const result = await handleApprovalStaleness(CAMPAIGN_SLUG, 'S8_JOURNALIST_LIST', 'run-001');
    expect(result.stalenessTriggered).toBe(false);
    expect(vi.mocked(fs.writeFile)).not.toHaveBeenCalled();
  });

  it('preserves all provenance fields when rewriting approved approval', async () => {
    mockDepRead(['S5_ANGLE_GENERATION']);
    const result = await handleApprovalStaleness(CAMPAIGN_SLUG, 'S5_ANGLE_GENERATION', 'run-002');
    expect(result.stalenessTriggered).toBe(true);
    const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
    const written = JSON.parse(writeCall[1] as string);
    expect(written.provenanceStatus).toBe('verified');
    expect(written.runMode).toBe('live');
    expect(written.source).toBe('human_approval_ui');
    expect(written.schemaVersion).toBe(1);
    expect(written.status).toBe('needs_revision');
  });

  it('preserves original fields for pre-Batch-5F artifact (no provenance fields invented)', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('replay-stage-dependencies.json')) {
        return JSON.stringify({
          dependencies: {},
          staleArtifactTriggers: {},
          humanApprovalInvalidation: { stagesThatInvalidateApproval: ['S4_ANALYSIS'] },
        });
      }
      if (pStr.includes('human-approval.json')) {
        return JSON.stringify({
          stageId: 'S7_PITCH_SELECTION_HUMAN_GATE',
          status: 'approved',
          selectedAngleTitle: 'Pre-Batch-5F Angle',
          approvedAt: '2025-06-01T00:00:00.000Z',
        });
      }
      throw new Error('ENOENT');
    });

    const result = await handleApprovalStaleness(CAMPAIGN_SLUG, 'S4_ANALYSIS', 'run-003');
    expect(result.stalenessTriggered).toBe(true);
    const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
    const written = JSON.parse(writeCall[1] as string);
    expect(written.provenanceStatus).toBeUndefined();
    expect(written.provenanceWarning).toBeUndefined();
    expect(written.runMode).toBeUndefined();
    expect(written.source).toBeUndefined();
    expect(written.schemaVersion).toBeUndefined();
    expect(written.status).toBe('needs_revision');
    expect(written.selectedAngleTitle).toBe('Pre-Batch-5F Angle');
  });

  it('preserves only existing provenance fields when partial', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('replay-stage-dependencies.json')) {
        return JSON.stringify({
          dependencies: {},
          staleArtifactTriggers: {},
          humanApprovalInvalidation: { stagesThatInvalidateApproval: ['S3_RESEARCH'] },
        });
      }
      if (pStr.includes('human-approval.json')) {
        return JSON.stringify({
          stageId: 'S7_PITCH_SELECTION_HUMAN_GATE',
          status: 'approved',
          selectedAngleTitle: 'Partial',
          provenanceStatus: 'verified',
          runMode: 'live',
        });
      }
      throw new Error('ENOENT');
    });

    const result = await handleApprovalStaleness(CAMPAIGN_SLUG, 'S3_RESEARCH', 'run-004');
    expect(result.stalenessTriggered).toBe(true);
    const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
    const written = JSON.parse(writeCall[1] as string);
    expect(written.provenanceStatus).toBe('verified');
    expect(written.runMode).toBe('live');
    expect(written.source).toBeUndefined();
    expect(written.schemaVersion).toBeUndefined();
    expect(written.provenanceWarning).toBeUndefined();
  });

  it('preserves non_live provenanceStatus through rewrite', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('replay-stage-dependencies.json')) {
        return JSON.stringify({
          dependencies: {},
          staleArtifactTriggers: {},
          humanApprovalInvalidation: { stagesThatInvalidateApproval: ['S2_DATA_EXTRACTION'] },
        });
      }
      if (pStr.includes('human-approval.json')) {
        return JSON.stringify({
          stageId: 'S7_PITCH_SELECTION_HUMAN_GATE',
          status: 'approved',
          selectedAngleTitle: 'Non-live Angle',
          provenanceStatus: 'non_live',
          provenanceWarning: 'Artifact was written in non-live mode',
          runMode: 'dry_run',
          source: 'human_approval_ui',
          schemaVersion: 1,
        });
      }
      throw new Error('ENOENT');
    });

    const result = await handleApprovalStaleness(CAMPAIGN_SLUG, 'S2_DATA_EXTRACTION', 'run-005');
    expect(result.stalenessTriggered).toBe(true);
    const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
    const written = JSON.parse(writeCall[1] as string);
    expect(written.provenanceStatus).toBe('non_live');
    expect(written.provenanceWarning).toBe('Artifact was written in non-live mode');
    expect(written.runMode).toBe('dry_run');
  });

  it('preserves unknown provenanceStatus through rewrite', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('replay-stage-dependencies.json')) {
        return JSON.stringify({
          dependencies: {},
          staleArtifactTriggers: {},
          humanApprovalInvalidation: { stagesThatInvalidateApproval: ['S6_BEAT_MATCHING'] },
        });
      }
      if (pStr.includes('human-approval.json')) {
        return JSON.stringify({
          stageId: 'S7_PITCH_SELECTION_HUMAN_GATE',
          status: 'approved',
          selectedAngleTitle: 'Unknown Angle',
          provenanceStatus: 'unknown',
          provenanceWarning: 'Partial provenance metadata',
          runMode: null,
          source: 'stage_executor',
          schemaVersion: 1,
        });
      }
      throw new Error('ENOENT');
    });

    const result = await handleApprovalStaleness(CAMPAIGN_SLUG, 'S6_BEAT_MATCHING', 'run-006');
    expect(result.stalenessTriggered).toBe(true);
    const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
    const written = JSON.parse(writeCall[1] as string);
    expect(written.provenanceStatus).toBe('unknown');
    expect(written.source).toBe('stage_executor');
  });

  it('no staleness when human-approval.json is missing', async () => {
    vi.mocked(fs.readFile).mockImplementation(async (pathLike) => {
      const pStr = String(pathLike);
      if (pStr.includes('replay-stage-dependencies.json')) {
        return JSON.stringify({
          dependencies: {},
          staleArtifactTriggers: {},
          humanApprovalInvalidation: { stagesThatInvalidateApproval: ['S1_CAMPAIGN_INTAKE'] },
        });
      }
      throw new Error('ENOENT');
    });
    const result = await handleApprovalStaleness(CAMPAIGN_SLUG, 'S1_CAMPAIGN_INTAKE', 'run-007');
    expect(result.stalenessTriggered).toBe(false);
    expect(result.action).toBe('No human-approval.json to update');
  });

  it('preserves invalidatedByRunId and invalidatedAt on rewritten approval', async () => {
    mockDepRead(['S9_JOURNALIST_INTELLIGENCE']);
    const result = await handleApprovalStaleness(CAMPAIGN_SLUG, 'S9_JOURNALIST_INTELLIGENCE', 'run-008');
    expect(result.stalenessTriggered).toBe(true);
    const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
    const written = JSON.parse(writeCall[1] as string);
    expect(written.invalidatedByRunId).toBe('run-008');
    expect(written.invalidatedAt).toBeDefined();
    expect(written.status).toBe('needs_revision');
  });
});
