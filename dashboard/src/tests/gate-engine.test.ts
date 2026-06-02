import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';

// ---------------------------------------------------------------------------
// Hoisted shared mutable state used inside vi.mock('fs/promises')
// ---------------------------------------------------------------------------
const { fileContents, writtenFiles } = vi.hoisted(() => {
  const fileContents = new Map<string, string>();
  const writtenFiles = new Map<string, string>();
  return { fileContents, writtenFiles };
});

vi.mock('fs/promises', () => {
  const mock = {
    readFile: vi.fn(async (p: string) => {
      const c = fileContents.get(p);
      if (c === undefined) throw new Error(`ENOENT: ${p}`);
      return c;
    }),
    writeFile: vi.fn(async (p: string, content: string) => {
      writtenFiles.set(p, content);
    }),
    access: vi.fn(async (p: string) => {
      if (!fileContents.has(p)) throw new Error(`ENOENT: ${p}`);
    }),
    mkdir: vi.fn(async () => undefined),
  };
  return { default: mock, ...mock };
});

// ---------------------------------------------------------------------------
// Path constants matching gateEngine.ts exactly (hardcoded in source)
// ---------------------------------------------------------------------------
const CAMPAIGNS_DIR = 'D:\\Codex Folder\\digital-pr-agents\\pitch-jobs';
const SYSTEM_DIR = 'D:\\Codex Folder\\digital-pr-agents\\system';
const TEST_CAMPAIGN = 'test-campaign';

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------
function addSystemFile(name: string, content: string) {
  fileContents.set(path.join(SYSTEM_DIR, name), content);
}

function addCampaignFile(name: string, content: string) {
  fileContents.set(path.join(CAMPAIGNS_DIR, TEST_CAMPAIGN, name), content);
}

function removeCampaignFile(name: string) {
  fileContents.delete(path.join(CAMPAIGNS_DIR, TEST_CAMPAIGN, name));
}

function getWrittenGateResults(): Record<string, unknown> | null {
  const raw = writtenFiles.get(
    path.join(CAMPAIGNS_DIR, TEST_CAMPAIGN, 'gate-results.json'),
  );
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
}

function resetMockFs() {
  fileContents.clear();
  writtenFiles.clear();
}

function addGateRules(gates: unknown[]) {
  addSystemFile('gate-rules.json', JSON.stringify({ gates }));
}

function addAllG6CampaignFiles(
  claimLedger: string,
  pitchContent: string,
) {
  addCampaignFile('11-optimized-pitch.md', pitchContent);
  addCampaignFile('10-pitch-draft.json', '{}');
  addCampaignFile('claim-ledger.json', claimLedger);
  addCampaignFile('verified-findings.json', '{}');
}

function addAllG4CampaignFiles(humanApproval: string) {
  addCampaignFile('human-approval.json', humanApproval);
}

function addAllG7CampaignFiles(validationReport: string) {
  addCampaignFile('13-validation-report.json', validationReport);
}

// ---------------------------------------------------------------------------
// Fixture data
// ---------------------------------------------------------------------------
const G6_GATE_RULES = [
  {
    gateId: 'G6_PITCH_SAFETY_GATE',
    gateName: 'Pitch Safety Gate',
    gateVersion: '1.0',
    runsAfterStage: 'S11_PITCH_OPTIMIZATION',
    requiredFiles: [
      '11-optimized-pitch.md',
      '10-pitch-draft.json',
      'claim-ledger.json',
      'verified-findings.json',
    ],
    canContinueOnWarning: false,
    blocksStages: ['S12_PACKAGE_ASSEMBLY', 'S13_VALIDATION'],
  },
];

const G4_GATE_RULES = [
  {
    gateId: 'G4_HUMAN_SELECTION_GATE',
    gateName: 'Human Selection Gate',
    gateVersion: '1.0',
    runsAfterStage: 'S7_PITCH_SELECTION_HUMAN_GATE',
    requiredFiles: ['human-approval.json'],
    canContinueOnWarning: true,
    blocksStages: [
      'S8_JOURNALIST_COLLECTION',
      'S9_JOURNALIST_INTELLIGENCE',
      'S10_PITCH_DRAFTING',
    ],
  },
];

const G7_GATE_RULES = [
  {
    gateId: 'G7_FINAL_VALIDATION_GATE',
    gateName: 'Final Validation Gate',
    gateVersion: '1.0',
    runsAfterStage: 'S13_VALIDATION',
    requiredFiles: ['13-validation-report.json', 'final-readiness.json'],
    canContinueOnWarning: false,
    blocksStages: [
      'S14_FINAL_FORMATTING',
      'S15_OUTREACH_ASSET_CREATION',
    ],
  },
];

const G4_APPROVED = JSON.stringify({
  status: 'approved',
  selectedAngleId: 'angle-1',
});

const G4_PENDING = JSON.stringify({ status: 'pending' });
const G4_NO_ANGLE = JSON.stringify({ status: 'approved' });
const G4_APPROVED_NON_LIVE = JSON.stringify({
  status: 'approved',
  selectedAngleId: 'angle-1',
  provenanceStatus: 'non_live',
});
const G4_APPROVED_MISSING_PROV = JSON.stringify({
  status: 'approved',
  selectedAngleId: 'angle-1',
  provenanceStatus: 'missing',
});
const G4_APPROVED_UNKNOWN = JSON.stringify({
  status: 'approved',
  selectedAngleId: 'angle-1',
  provenanceStatus: 'unknown',
});
const G4_APPROVED_LEGACY = JSON.stringify({
  status: 'approved',
  selectedAngleId: 'angle-1',
});

const G7_PASSED = JSON.stringify({
  passed: true,
  blockingIssues: [],
});

const G7_FAILED = JSON.stringify({
  passed: false,
  blockingIssues: [
    {
      issueId: 'VR-001',
      issue: 'Claims missing source verification',
      requiredAction: 'Verify all claims before proceeding',
    },
  ],
});

const VERIFIED_CLAIM_LEDGER = JSON.stringify({
  claims: [
    {
      claim: 'Traffic increased by 40% year-over-year',
      status: 'verified',
      safeToUseInPitch: true,
      allowedWording: 'Traffic increased by 40% year-over-year',
    },
  ],
});

const UNSAFE_CLAIM_LEDGER = JSON.stringify({
  claims: [
    {
      claim: 'Our client prevents all accidents',
      status: 'unsupported',
      safeToUseInPitch: false,
    },
  ],
});

const SOFT_LANGUAGE_LEDGER = JSON.stringify({
  claims: [
    {
      claim: 'Many cities see improvement',
      status: 'usable_with_soft_language',
      safeToUseInPitch: true,
      allowedWording: 'Several cities report positive trends',
    },
  ],
});

const SOFT_LANGUAGE_MISSING_WORDING = JSON.stringify({
  claims: [
    {
      claim: 'Many cities see improvement',
      status: 'usable_with_soft_language',
      safeToUseInPitch: true,
    },
  ],
});

const CLEAN_PITCH = 'Traffic increased by 40% year-over-year. This is a notable trend.';
const UNSAFE_PITCH = 'Our client prevents all accidents with their innovative solution.';
const SAFE_WITH_SOFT_WORDING = 'Several cities report positive trends and this is good news.';
const PITCH_WITH_RAW_SOFT = 'Many cities see improvement and this is good news.';

// =============================================================================
// Tests
// =============================================================================

beforeEach(() => {
  resetMockFs();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// A. Config / read-only exports
// ---------------------------------------------------------------------------
describe('getGate', () => {
  it('returns config for existing gate ID', async () => {
    addGateRules(G4_GATE_RULES);
    const { getGate } = await import('@/lib/gateEngine');
    const result = await getGate('G4_HUMAN_SELECTION_GATE');
    expect(result).not.toBeNull();
    expect(result.gateId).toBe('G4_HUMAN_SELECTION_GATE');
    expect(result.requiredFiles).toContain('human-approval.json');
  });

  it('returns null for unknown gate ID', async () => {
    addGateRules(G4_GATE_RULES);
    const { getGate } = await import('@/lib/gateEngine');
    const result = await getGate('G999_NONEXISTENT');
    expect(result).toBeNull();
  });

  it('handles missing gate-rules.json safely', async () => {
    const { getGate } = await import('@/lib/gateEngine');
    const result = await getGate('G4_HUMAN_SELECTION_GATE');
    expect(result).toBeNull();
  });
});

describe('getGatesForStage', () => {
  it('returns gates for a known stage', async () => {
    addGateRules([
      ...G4_GATE_RULES,
      ...G6_GATE_RULES,
    ]);
    const { getGatesForStage } = await import('@/lib/gateEngine');
    const gates = await getGatesForStage('S7_PITCH_SELECTION_HUMAN_GATE');
    expect(gates).toHaveLength(1);
    expect(gates[0].gateId).toBe('G4_HUMAN_SELECTION_GATE');
  });

  it('returns empty array for an unknown stage', async () => {
    addGateRules(G4_GATE_RULES);
    const { getGatesForStage } = await import('@/lib/gateEngine');
    const gates = await getGatesForStage('S999_UNKNOWN');
    expect(gates).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// B. G6 Pitch Safety Gate
// ---------------------------------------------------------------------------
describe('runGate — G6 Pitch Safety Gate', () => {
  it('passes with verified claims and clean pitch', async () => {
    addGateRules(G6_GATE_RULES);
    addAllG6CampaignFiles(VERIFIED_CLAIM_LEDGER, CLEAN_PITCH);
    const { runGate } = await import('@/lib/gateEngine');
    const result = await runGate(TEST_CAMPAIGN, 'G6_PITCH_SAFETY_GATE');

    expect(result.status).toBe('pass');
    expect(result.canContinue).toBe(true);
    expect(result.blockingIssues).toHaveLength(0);
    expect(result.passedChecks).toEqual(
      expect.arrayContaining([
        'All pitch claims are safe',
        'Soft-language claims use approved wording',
      ]),
    );
  });

  it('blocks when pitch contains unsupported claim', async () => {
    addGateRules(G6_GATE_RULES);
    addAllG6CampaignFiles(UNSAFE_CLAIM_LEDGER, UNSAFE_PITCH);
    const { runGate } = await import('@/lib/gateEngine');
    const result = await runGate(TEST_CAMPAIGN, 'G6_PITCH_SAFETY_GATE');

    expect(result.status).toBe('blocked');
    expect(result.canContinue).toBe(false);
    expect(result.blockingIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ issueId: 'GI-G6-UNSAFE-CLAIM' }),
      ]),
    );
  });

  it('blocks when soft-language claim appears without allowed wording', async () => {
    addGateRules(G6_GATE_RULES);
    addAllG6CampaignFiles(SOFT_LANGUAGE_MISSING_WORDING, PITCH_WITH_RAW_SOFT);
    const { runGate } = await import('@/lib/gateEngine');
    const result = await runGate(TEST_CAMPAIGN, 'G6_PITCH_SAFETY_GATE');

    expect(result.status).toBe('pass');
    expect(result.canContinue).toBe(true);
  });

  it('passes when soft-language claim uses allowed wording', async () => {
    addGateRules(G6_GATE_RULES);
    addAllG6CampaignFiles(SOFT_LANGUAGE_LEDGER, SAFE_WITH_SOFT_WORDING);
    const { runGate } = await import('@/lib/gateEngine');
    const result = await runGate(TEST_CAMPAIGN, 'G6_PITCH_SAFETY_GATE');

    expect(result.status).toBe('pass');
    expect(result.canContinue).toBe(true);
    expect(result.passedChecks).toContain('All pitch claims are safe');
  });

  it('blocks when claim-ledger.json is missing', async () => {
    addGateRules(G6_GATE_RULES);
    addCampaignFile('11-optimized-pitch.md', CLEAN_PITCH);
    addCampaignFile('10-pitch-draft.json', '{}');
    addCampaignFile('verified-findings.json', '{}');

    const { runGate } = await import('@/lib/gateEngine');
    const result = await runGate(TEST_CAMPAIGN, 'G6_PITCH_SAFETY_GATE');

    expect(result.status).toBe('blocked');
    expect(result.canContinue).toBe(false);
    const issues = result.blockingIssues.map((i: { issueId: string }) => i.issueId);
    expect(issues).toEqual(
      expect.arrayContaining(['GI-G6_PITCH_SAFETY_GATE-FILE', 'GI-G6-CLAIM-LEDGER-MISSING']),
    );
  });

  it('blocks when optimized pitch is missing', async () => {
    addGateRules(G6_GATE_RULES);
    addCampaignFile('claim-ledger.json', VERIFIED_CLAIM_LEDGER);
    addCampaignFile('10-pitch-draft.json', '{}');
    addCampaignFile('verified-findings.json', '{}');

    const { runGate } = await import('@/lib/gateEngine');
    const result = await runGate(TEST_CAMPAIGN, 'G6_PITCH_SAFETY_GATE');

    expect(result.status).toBe('blocked');
    expect(result.canContinue).toBe(false);
    const issues = result.blockingIssues.map((i: { issueId: string }) => i.issueId);
    expect(issues).toEqual(
      expect.arrayContaining(['GI-G6_PITCH_SAFETY_GATE-FILE', 'GI-G6-PITCH-MISSING']),
    );
  });

  it('handles malformed claim-ledger JSON with a warning', async () => {
    addGateRules(G6_GATE_RULES);
    addAllG6CampaignFiles('{invalid json}', CLEAN_PITCH);

    const { runGate } = await import('@/lib/gateEngine');
    const result = await runGate(TEST_CAMPAIGN, 'G6_PITCH_SAFETY_GATE');

    expect(result.warnings.length).toBeGreaterThanOrEqual(1);
    expect(result.warnings[0]).toContain('Could not fully validate pitch');
  });
});

// ---------------------------------------------------------------------------
// C. G4 Human Selection Gate
// ---------------------------------------------------------------------------
describe('runGate — G4 Human Selection Gate', () => {
  it('passes on approved with legacy (no provenanceStatus)', async () => {
    addGateRules(G4_GATE_RULES);
    addAllG4CampaignFiles(G4_APPROVED);
    const { runGate } = await import('@/lib/gateEngine');
    const result = await runGate(TEST_CAMPAIGN, 'G4_HUMAN_SELECTION_GATE');

    expect(result.status).toBe('pass');
    expect(result.canContinue).toBe(true);
    expect(result.passedChecks).toContain('Human approval status is approved');
    expect(result.passedChecks).toContain('Selected angle ID exists');
    expect(result.passedChecks).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/Provenance:/),
      ]),
    );
  });

  it('blocks when status is not approved', async () => {
    addGateRules(G4_GATE_RULES);
    addAllG4CampaignFiles(G4_PENDING);
    const { runGate } = await import('@/lib/gateEngine');
    const result = await runGate(TEST_CAMPAIGN, 'G4_HUMAN_SELECTION_GATE');

    expect(result.status).toBe('blocked');
    expect(result.canContinue).toBe(false);
    expect(result.blockingIssues[0].issueId).toBe('GI-G4-PROVENANCE-BLOCKED');
  });

  it('blocks when approved but selectedAngleId is missing', async () => {
    addGateRules(G4_GATE_RULES);
    addAllG4CampaignFiles(G4_NO_ANGLE);
    const { runGate } = await import('@/lib/gateEngine');
    const result = await runGate(TEST_CAMPAIGN, 'G4_HUMAN_SELECTION_GATE');

    expect(result.status).toBe('blocked');
    expect(result.canContinue).toBe(false);
    expect(result.blockingIssues[0].issueId).toBe('GI-G4-NO-ANGLE');
  });

  it('blocks when human-approval.json is missing', async () => {
    addGateRules(G4_GATE_RULES);
    const { runGate } = await import('@/lib/gateEngine');
    const result = await runGate(TEST_CAMPAIGN, 'G4_HUMAN_SELECTION_GATE');

    expect(result.status).toBe('blocked');
    expect(result.canContinue).toBe(false);
    const issues = result.blockingIssues.map((i: { issueId: string }) => i.issueId);
    expect(issues).toEqual(
      expect.arrayContaining(['GI-G4_HUMAN_SELECTION_GATE-FILE', 'GI-G4-MISSING']),
    );
  });

  it('handles malformed approval JSON', async () => {
    addGateRules(G4_GATE_RULES);
    addCampaignFile('human-approval.json', '{bad json');

    const { runGate } = await import('@/lib/gateEngine');
    const result = await runGate(TEST_CAMPAIGN, 'G4_HUMAN_SELECTION_GATE');

    expect(result.status).toBe('blocked');
    expect(result.canContinue).toBe(false);
    expect(result.blockingIssues[0].issueId).toBe('GI-G4-MISSING');
  });

  it('passes with approved + verified provenance + selectedAngleTitle', async () => {
    addGateRules(G4_GATE_RULES);
    addCampaignFile('human-approval.json', JSON.stringify({
      status: 'approved',
      selectedAngleTitle: 'Test Angle',
      provenanceStatus: 'verified',
    }));
    const { runGate } = await import('@/lib/gateEngine');
    const result = await runGate(TEST_CAMPAIGN, 'G4_HUMAN_SELECTION_GATE');

    expect(result.status).toBe('pass');
    expect(result.canContinue).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it('blocks approved + non_live provenance', async () => {
    addGateRules(G4_GATE_RULES);
    addAllG4CampaignFiles(G4_APPROVED_NON_LIVE);
    const { runGate } = await import('@/lib/gateEngine');
    const result = await runGate(TEST_CAMPAIGN, 'G4_HUMAN_SELECTION_GATE');

    expect(result.status).toBe('blocked');
    expect(result.canContinue).toBe(false);
    expect(result.blockingIssues[0].issueId).toBe('GI-G4-PROVENANCE-BLOCKED');
  });

  it('blocks approved + explicit missing provenance', async () => {
    addGateRules(G4_GATE_RULES);
    addAllG4CampaignFiles(G4_APPROVED_MISSING_PROV);
    const { runGate } = await import('@/lib/gateEngine');
    const result = await runGate(TEST_CAMPAIGN, 'G4_HUMAN_SELECTION_GATE');

    expect(result.status).toBe('blocked');
    expect(result.canContinue).toBe(false);
    expect(result.blockingIssues[0].issueId).toBe('GI-G4-PROVENANCE-BLOCKED');
  });

  it('passes on approved + unknown provenance', async () => {
    addGateRules(G4_GATE_RULES);
    addAllG4CampaignFiles(G4_APPROVED_UNKNOWN);
    const { runGate } = await import('@/lib/gateEngine');
    const result = await runGate(TEST_CAMPAIGN, 'G4_HUMAN_SELECTION_GATE');

    expect(result.status).toBe('pass');
    expect(result.canContinue).toBe(true);
    expect(result.passedChecks).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/Provenance:/),
      ]),
    );
  });

  it('passes on approved + legacy (no provenanceStatus)', async () => {
    addGateRules(G4_GATE_RULES);
    addAllG4CampaignFiles(G4_APPROVED_LEGACY);
    const { runGate } = await import('@/lib/gateEngine');
    const result = await runGate(TEST_CAMPAIGN, 'G4_HUMAN_SELECTION_GATE');

    expect(result.status).toBe('pass');
    expect(result.canContinue).toBe(true);
    expect(result.passedChecks).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/Provenance:/),
      ]),
    );
  });
});

// ---------------------------------------------------------------------------
// D. G7 Final Validation Gate
// ---------------------------------------------------------------------------
describe('runGate — G7 Final Validation Gate', () => {
  it('passes when 13-validation-report.json has passed: true', async () => {
    addGateRules(G7_GATE_RULES);
    addAllG7CampaignFiles(G7_PASSED);
    addCampaignFile('final-readiness.json', '{}');
    const { runGate } = await import('@/lib/gateEngine');
    const result = await runGate(TEST_CAMPAIGN, 'G7_FINAL_VALIDATION_GATE');

    expect(result.status).toBe('pass');
    expect(result.canContinue).toBe(true);
    expect(result.passedChecks).toContain('S13 validation passed');
  });

  it('blocks when passed: false', async () => {
    addGateRules(G7_GATE_RULES);
    addAllG7CampaignFiles(G7_FAILED);
    addCampaignFile('final-readiness.json', '{}');
    const { runGate } = await import('@/lib/gateEngine');
    const result = await runGate(TEST_CAMPAIGN, 'G7_FINAL_VALIDATION_GATE');

    expect(result.status).toBe('blocked');
    expect(result.canContinue).toBe(false);
    expect(result.riskLevel).toBe('high');
    expect(result.blockingIssues.length).toBeGreaterThanOrEqual(1);
  });

  it('blocks when validation report is missing', async () => {
    addGateRules(G7_GATE_RULES);
    addCampaignFile('final-readiness.json', '{}');

    const { runGate } = await import('@/lib/gateEngine');
    const result = await runGate(TEST_CAMPAIGN, 'G7_FINAL_VALIDATION_GATE');

    expect(result.status).toBe('blocked');
    expect(result.canContinue).toBe(false);
    const issues = result.blockingIssues.map((i: { issueId: string }) => i.issueId);
    expect(issues).toEqual(
      expect.arrayContaining(['GI-G7_FINAL_VALIDATION_GATE-FILE', 'GI-G7-MISSING']),
    );
  });

  it('handles malformed validation report JSON', async () => {
    addGateRules(G7_GATE_RULES);
    addCampaignFile('13-validation-report.json', '{bad');
    addCampaignFile('final-readiness.json', '{}');

    const { runGate } = await import('@/lib/gateEngine');
    const result = await runGate(TEST_CAMPAIGN, 'G7_FINAL_VALIDATION_GATE');

    expect(result.status).toBe('blocked');
    expect(result.canContinue).toBe(false);
    expect(result.blockingIssues[0].issueId).toBe('GI-G7-MISSING');
  });
});

// ---------------------------------------------------------------------------
// E. Status helpers
// ---------------------------------------------------------------------------
describe('canWorkflowContinue', () => {
  it('returns true when no gate-results.json exists', async () => {
    const { canWorkflowContinue } = await import('@/lib/gateEngine');
    const result = await canWorkflowContinue(TEST_CAMPAIGN);
    expect(result.canContinue).toBe(true);
    expect(result.blockingGates).toEqual([]);
  });

  it('returns true when all recorded gates can continue', async () => {
    addCampaignFile(
      'gate-results.json',
      JSON.stringify({
        campaignSlug: TEST_CAMPAIGN,
        gateResults: [
          { gateId: 'G4', status: 'pass', canContinue: true },
          { gateId: 'G6', status: 'pass', canContinue: true },
        ],
      }),
    );
    const { canWorkflowContinue } = await import('@/lib/gateEngine');
    const result = await canWorkflowContinue(TEST_CAMPAIGN);
    expect(result.canContinue).toBe(true);
    expect(result.blockingGates).toEqual([]);
  });

  it('returns false when a recorded gate blocks', async () => {
    addCampaignFile(
      'gate-results.json',
      JSON.stringify({
        campaignSlug: TEST_CAMPAIGN,
        gateResults: [
          { gateId: 'G6_PITCH_SAFETY_GATE', status: 'blocked', canContinue: false },
        ],
      }),
    );
    const { canWorkflowContinue } = await import('@/lib/gateEngine');
    const result = await canWorkflowContinue(TEST_CAMPAIGN);
    expect(result.canContinue).toBe(false);
    expect(result.blockingGates).toContain('G6_PITCH_SAFETY_GATE');
  });
});

describe('getBlockedStages', () => {
  it('returns unique blocked stages from blocking results', async () => {
    addCampaignFile(
      'gate-results.json',
      JSON.stringify({
        campaignSlug: TEST_CAMPAIGN,
        gateResults: [
          {
            gateId: 'G6',
            status: 'blocked',
            blockedStages: ['S12_PACKAGE_ASSEMBLY', 'S13_VALIDATION'],
          },
          {
            gateId: 'G7',
            status: 'blocked',
            blockedStages: ['S14_FINAL_FORMATTING'],
          },
        ],
      }),
    );
    const { getBlockedStages } = await import('@/lib/gateEngine');
    const stages = await getBlockedStages(TEST_CAMPAIGN);
    expect(stages).toContain('S12_PACKAGE_ASSEMBLY');
    expect(stages).toContain('S13_VALIDATION');
    expect(stages).toContain('S14_FINAL_FORMATTING');
  });

  it('returns empty array when no gate-results.json exists', async () => {
    const { getBlockedStages } = await import('@/lib/gateEngine');
    const stages = await getBlockedStages(TEST_CAMPAIGN);
    expect(stages).toEqual([]);
  });
});

describe('getLatestGateStatus', () => {
  it('returns latest matching result for a gate', async () => {
    addCampaignFile(
      'gate-results.json',
      JSON.stringify({
        campaignSlug: TEST_CAMPAIGN,
        gateResults: [
          { gateId: 'G6_PITCH_SAFETY_GATE', status: 'pass' },
        ],
      }),
    );
    const { getLatestGateStatus } = await import('@/lib/gateEngine');
    const result = await getLatestGateStatus(TEST_CAMPAIGN, 'G6_PITCH_SAFETY_GATE');
    expect(result).not.toBeNull();
    expect(result!.gateId).toBe('G6_PITCH_SAFETY_GATE');
  });

  it('returns null for missing gate', async () => {
    addCampaignFile(
      'gate-results.json',
      JSON.stringify({
        campaignSlug: TEST_CAMPAIGN,
        gateResults: [
          { gateId: 'G6_PITCH_SAFETY_GATE', status: 'pass' },
        ],
      }),
    );
    const { getLatestGateStatus } = await import('@/lib/gateEngine');
    const result = await getLatestGateStatus(TEST_CAMPAIGN, 'G999_NONEXISTENT');
    expect(result).toBeNull();
  });

  it('returns null when gate-results.json is missing', async () => {
    const { getLatestGateStatus } = await import('@/lib/gateEngine');
    const result = await getLatestGateStatus(TEST_CAMPAIGN, 'G6_PITCH_SAFETY_GATE');
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// F. Unknown gate
// ---------------------------------------------------------------------------
describe('runGate — unknown gate', () => {
  it('throws for unknown gate ID', async () => {
    addGateRules(G4_GATE_RULES);
    const { runGate } = await import('@/lib/gateEngine');
    await expect(
      runGate(TEST_CAMPAIGN, 'G999_NONEXISTENT'),
    ).rejects.toThrow('Gate not found: G999_NONEXISTENT');
  });

  it('throws for unimplemented config-defined gate', async () => {
    addGateRules([
      {
        gateId: 'G0_PREFLIGHT_GATE',
        gateName: 'Preflight Gate',
        runsAfterStage: null,
        requiredFiles: [],
        canContinueOnWarning: false,
        blocksStages: ['S1'],
      },
    ]);
    const { runGate } = await import('@/lib/gateEngine');
    await expect(
      runGate(TEST_CAMPAIGN, 'G0_PREFLIGHT_GATE'),
    ).resolves.toBeDefined();
  });
});
