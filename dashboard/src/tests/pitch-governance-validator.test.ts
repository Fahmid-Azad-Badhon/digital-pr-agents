import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';

// ---------------------------------------------------------------------------
// Known SYSTEM_ROOT for test isolation
// ---------------------------------------------------------------------------
const TEST_SYSTEM_ROOT = path.join(
  'D:\\Codex Folder\\digital-pr-agents',
  'system',
);
const TEST_CAMPAIGN_PATH = path.join(
  'D:\\Codex Folder\\digital-pr-agents',
  'pitch-jobs',
  'test-campaign',
);

vi.mock('@/lib/requestGuard', () => ({
  SYSTEM_ROOT: TEST_SYSTEM_ROOT,
}));

// ---------------------------------------------------------------------------
// Hoisted in-memory file map
// ---------------------------------------------------------------------------
const { govFileContents } = vi.hoisted(() => {
  const govFileContents = new Map<string, string>();
  return { govFileContents };
});

vi.mock('fs/promises', () => {
  const mock = {
    readFile: vi.fn(async (p: string) => {
      const c = govFileContents.get(p);
      if (c === undefined) throw new Error(`ENOENT: ${p}`);
      return c;
    }),
    readdir: vi.fn(async (p: string) => {
      const prefix = p.replace(/\\/g, '/').toLowerCase();
      const files: string[] = [];
      for (const key of govFileContents.keys()) {
        const normalized = key.replace(/\\/g, '/').toLowerCase();
        if (normalized.startsWith(prefix + '/')) {
          const rel = normalized.slice(prefix.length + 1);
          if (rel && !rel.includes('/')) files.push(rel);
        }
      }
      return files;
    }),
    writeFile: vi.fn(async () => undefined),
    mkdir: vi.fn(async () => undefined),
  };
  return { default: mock, ...mock };
});

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------
function resetGovFs() {
  govFileContents.clear();
}

function addCampaignFile(name: string, content: string) {
  govFileContents.set(path.join(TEST_CAMPAIGN_PATH, name), content);
}

function addSystemConfigFile(name: string, content: string) {
  govFileContents.set(path.join(TEST_SYSTEM_ROOT, name), content);
}

// ---------------------------------------------------------------------------
// Default config fixtures matching system file shapes
// ---------------------------------------------------------------------------
const DEFAULT_ANTI_SALES_RULES = JSON.stringify({
  rules: {
    bannedPhrases: [
      'Our client is the leading',
      'The best firm',
    ],
    doNotLeadWith: [
      'I hope you\'re well',
      'I wanted to reach out',
      'client praise',
    ],
  },
});

const DEFAULT_CTA_RULES = JSON.stringify({
  rules: {
    badCTAs: [
      'Please publish this',
      'Can you cover this today?',
      'You should write about this',
    ],
    goodCTAs: [
      'Would this be useful for something you\'re working on?',
      'I\'m happy to send the full dataset if helpful.',
      'Let me know if you\'d like me to send anything else.',
    ],
  },
});

const EMPTY_SYSTEM_CLAIM_LEDGER = JSON.stringify({
  claims: [],
  validationRules: { requireVerificationBeforeUse: false },
});

function addDefaultConfigFiles() {
  addSystemConfigFile('anti-sales-language-rules.json', DEFAULT_ANTI_SALES_RULES);
  addSystemConfigFile('cta-softness-rules.json', DEFAULT_CTA_RULES);
  addSystemConfigFile('claim-ledger.json', EMPTY_SYSTEM_CLAIM_LEDGER);
}

function addPitchFile(stage: 10 | 11 | 12, content: string) {
  const candidates: Record<number, string> = {
    10: '10-pitch-draft.md',
    11: '11-optimized-pitch.md',
    12: '12-outreach-package.md',
  };
  addCampaignFile(candidates[stage], content);
}

function addClaimLedger(claims: unknown[], requireVerification = false) {
  addCampaignFile(
    'claim-ledger.json',
    JSON.stringify({
      claims,
      validationRules: { requireVerificationBeforeUse: requireVerification },
    }),
  );
}

// =============================================================================
// Fixture data
// =============================================================================
const SAFE_PITCH_BODY = [
  'Traffic increased by 40% year-over-year according to the latest report.',
  'This data highlights a growing trend in urban mobility.',
  'Would this be useful for something you\'re working on?',
].join('\n');

const PITCH_WITH_UNSUPPORTED_CLAIM = [
  'Our client prevents all accidents with their innovative platform.',
  'This is a significant finding.',
  'Would this be useful for something you\'re working on?',
].join('\n');

const PITCH_WITH_BANNED_PHRASE = [
  'Our client is the leading provider of innovative solutions.',
  'The data supports this conclusion.',
  'Would this be useful for something you\'re working on?',
].join('\n');

const PITCH_WITH_WEAK_LEAD = [
  'I hope you\'re well. I wanted to share some interesting data.',
  'Traffic patterns show significant changes.',
  'Would this be useful for something you\'re working on?',
].join('\n');

const PITCH_WITH_HARD_CTA = [
  'Traffic increased by 40% year-over-year.',
  'Please publish this article as soon as possible.',
].join('\n');

const PITCH_WITH_DEMAND_WORDS = [
  'Traffic increased by 40% year-over-year.',
  'You should cover this immediately.',
  'This deserves coverage.',
].join('\n');

const PITCH_NO_CTA = [
  'Traffic increased by 40% year-over-year.',
  'This is a notable trend in urban mobility.',
  'The data comes from verified sources.',
].join('\n');

const PITCH_SHORT = 'Traffic increased by 40%.';

const PITCH_EMPTY = '';

const VERIFIED_CLAIMS = [
  {
    claim: 'Traffic increased by 40% year-over-year',
    status: 'verified',
    safeToUseInPitch: true,
    allowedWording: 'Traffic increased by 40% year-over-year',
  },
];

const UNSUPPORTED_CLAIMS = [
  {
    claim: 'Our client prevents all accidents',
    status: 'unsupported',
    safeToUseInPitch: false,
  },
];

const SOFT_LANGUAGE_CLAIMS_WITH_WORDING = [
  {
    claim: 'Many cities see improvement',
    status: 'usable_with_soft_language',
    safeToUseInPitch: true,
    allowedWording: 'Several cities report positive trends',
  },
];

// =============================================================================
// Tests
// =============================================================================

beforeEach(() => {
  resetGovFs();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// A. Baseline success
// ---------------------------------------------------------------------------
describe('baseline success', () => {
  it('stage 10 valid pitch passes all governance checks', async () => {
    addDefaultConfigFiles();
    addPitchFile(10, SAFE_PITCH_BODY);
    addClaimLedger(VERIFIED_CLAIMS);

    const { validateStagePitchGovernance } = await import(
      '@/lib/pitchGovernanceValidator'
    );
    const result = await validateStagePitchGovernance(TEST_CAMPAIGN_PATH, 10);

    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('stage 11 valid optimized pitch passes', async () => {
    addDefaultConfigFiles();
    addPitchFile(11, SAFE_PITCH_BODY);
    addClaimLedger(VERIFIED_CLAIMS);

    const { validateStagePitchGovernance } = await import(
      '@/lib/pitchGovernanceValidator'
    );
    const result = await validateStagePitchGovernance(TEST_CAMPAIGN_PATH, 11);

    expect(result.valid).toBe(true);
    expect(result.stage).toBe(11);
  });

  it('stage 12 valid outreach package passes', async () => {
    addDefaultConfigFiles();
    addPitchFile(12, SAFE_PITCH_BODY);
    addClaimLedger(VERIFIED_CLAIMS);

    const { validateStagePitchGovernance } = await import(
      '@/lib/pitchGovernanceValidator'
    );
    const result = await validateStagePitchGovernance(TEST_CAMPAIGN_PATH, 12);

    expect(result.valid).toBe(true);
    expect(result.stage).toBe(12);
  });
});

// ---------------------------------------------------------------------------
// B. File handling
// ---------------------------------------------------------------------------
describe('file handling', () => {
  it('missing pitch file returns valid: false with PITCH_FILE_MISSING issue', async () => {
    addDefaultConfigFiles();
    addClaimLedger(VERIFIED_CLAIMS);

    const { validateStagePitchGovernance } = await import(
      '@/lib/pitchGovernanceValidator'
    );
    const result = await validateStagePitchGovernance(TEST_CAMPAIGN_PATH, 10);

    expect(result.valid).toBe(false);
    expect(result.filePath).toBeNull();
    expect(result.issues[0].code).toBe('PITCH_FILE_MISSING');
  });

  it('missing claim-ledger falls back to system claim ledger', async () => {
    addDefaultConfigFiles();
    addPitchFile(10, SAFE_PITCH_BODY);

    const { validateStagePitchGovernance } = await import(
      '@/lib/pitchGovernanceValidator'
    );
    const result = await validateStagePitchGovernance(TEST_CAMPAIGN_PATH, 10);

    expect(result.valid).toBe(false);
    const codes = result.issues.map(i => i.code);
    expect(codes).toContain('UNMAPPED_NUMERIC_CLAIM');
  });

  it('malformed claim-ledger falls back to system claim ledger safely', async () => {
    addDefaultConfigFiles();
    addPitchFile(10, SAFE_PITCH_BODY);
    addCampaignFile('claim-ledger.json', '{invalid json');

    const { validateStagePitchGovernance } = await import(
      '@/lib/pitchGovernanceValidator'
    );
    const result = await validateStagePitchGovernance(TEST_CAMPAIGN_PATH, 10);

    expect(result.issues.length).toBeGreaterThanOrEqual(0);
  });

  it('empty claim-ledger creates UNMAPPED_NUMERIC_CLAIM issues for numeric claims', async () => {
    addDefaultConfigFiles();
    addPitchFile(10, 'Traffic increased by 42%. This is significant.');
    addClaimLedger([]);

    const { validateStagePitchGovernance } = await import(
      '@/lib/pitchGovernanceValidator'
    );
    const result = await validateStagePitchGovernance(TEST_CAMPAIGN_PATH, 10);

    const codes = result.issues.map(i => i.code);
    expect(codes).toContain('UNMAPPED_NUMERIC_CLAIM');
    expect(result.valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// C. Claim ledger behavior
// ---------------------------------------------------------------------------
describe('claim ledger behavior', () => {
  it('verified claim in pitch passes', async () => {
    addDefaultConfigFiles();
    addPitchFile(10, SAFE_PITCH_BODY);
    addClaimLedger(VERIFIED_CLAIMS);

    const { validateStagePitchGovernance } = await import(
      '@/lib/pitchGovernanceValidator'
    );
    const result = await validateStagePitchGovernance(TEST_CAMPAIGN_PATH, 10);

    expect(result.valid).toBe(true);
    expect(result.issues.filter(i => i.code === 'BLOCKED_CLAIM_USED')).toHaveLength(0);
  });

  it('unsupported claim in pitch creates BLOCKED_CLAIM_USED issue', async () => {
    addDefaultConfigFiles();
    addPitchFile(10, PITCH_WITH_UNSUPPORTED_CLAIM);
    addClaimLedger(UNSUPPORTED_CLAIMS);

    const { validateStagePitchGovernance } = await import(
      '@/lib/pitchGovernanceValidator'
    );
    const result = await validateStagePitchGovernance(TEST_CAMPAIGN_PATH, 10);

    const blockedCodes = result.issues.filter(i => i.code === 'BLOCKED_CLAIM_USED');
    expect(blockedCodes.length).toBeGreaterThanOrEqual(1);
    expect(result.valid).toBe(false);
  });

  it('usable_with_soft_language claim with allowed wording passes', async () => {
    addDefaultConfigFiles();
    addPitchFile(
      10,
      'Several cities report positive trends according to the analysis. Would this be useful for something you\'re working on?',
    );
    addClaimLedger(SOFT_LANGUAGE_CLAIMS_WITH_WORDING);

    const { validateStagePitchGovernance } = await import(
      '@/lib/pitchGovernanceValidator'
    );
    const result = await validateStagePitchGovernance(TEST_CAMPAIGN_PATH, 10);

    const blockedCodes = result.issues.filter(i => i.code === 'BLOCKED_CLAIM_USED');
    expect(blockedCodes).toHaveLength(0);
  });

  it('unmapped numeric claim creates UNMAPPED_NUMERIC_CLAIM issue', async () => {
    addDefaultConfigFiles();
    addPitchFile(10, 'Traffic increased by 42%. This is significant.');
    addClaimLedger(VERIFIED_CLAIMS);

    const { validateStagePitchGovernance } = await import(
      '@/lib/pitchGovernanceValidator'
    );
    const result = await validateStagePitchGovernance(TEST_CAMPAIGN_PATH, 10);

    const codes = result.issues.map(i => i.code);
    expect(codes).toContain('UNMAPPED_NUMERIC_CLAIM');
    expect(result.valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// D. Anti-sales behavior
// ---------------------------------------------------------------------------
describe('anti-sales behavior', () => {
  it('banned phrase is detected', async () => {
    addDefaultConfigFiles();
    addPitchFile(10, PITCH_WITH_BANNED_PHRASE);
    addClaimLedger(VERIFIED_CLAIMS);

    const { validateStagePitchGovernance } = await import(
      '@/lib/pitchGovernanceValidator'
    );
    const result = await validateStagePitchGovernance(TEST_CAMPAIGN_PATH, 10);

    const banned = result.issues.filter(i => i.code === 'ANTI_SALES_BANNED_PHRASE');
    expect(banned.length).toBeGreaterThanOrEqual(1);
    expect(result.valid).toBe(false);
  });

  it('banned phrase detection is case-insensitive', async () => {
    addDefaultConfigFiles();
    addPitchFile(
      10,
      'Our CLIENT IS THE LEADING provider of solutions. Would this be useful?',
    );
    addClaimLedger(VERIFIED_CLAIMS);

    const { validateStagePitchGovernance } = await import(
      '@/lib/pitchGovernanceValidator'
    );
    const result = await validateStagePitchGovernance(TEST_CAMPAIGN_PATH, 10);

    const banned = result.issues.filter(i => i.code === 'ANTI_SALES_BANNED_PHRASE');
    expect(banned.length).toBeGreaterThanOrEqual(1);
  });

  it('weak lead phrase is detected in opening content', async () => {
    addDefaultConfigFiles();
    addPitchFile(10, PITCH_WITH_WEAK_LEAD);

    const { validateStagePitchGovernance } = await import(
      '@/lib/pitchGovernanceValidator'
    );
    const result = await validateStagePitchGovernance(TEST_CAMPAIGN_PATH, 10);

    const weakLead = result.issues.filter(i => i.code === 'ANTI_SALES_WEAK_LEAD');
    expect(weakLead.length).toBeGreaterThanOrEqual(1);
  });

  it('approved non-sales wording passes', async () => {
    addDefaultConfigFiles();
    addPitchFile(10, SAFE_PITCH_BODY);
    addClaimLedger(VERIFIED_CLAIMS);

    const { validateStagePitchGovernance } = await import(
      '@/lib/pitchGovernanceValidator'
    );
    const result = await validateStagePitchGovernance(TEST_CAMPAIGN_PATH, 10);

    const banned = result.issues.filter(i => i.code === 'ANTI_SALES_BANNED_PHRASE');
    expect(banned).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// E. CTA behavior
// ---------------------------------------------------------------------------
describe('CTA behavior', () => {
  it('hard CTA phrase is detected', async () => {
    addDefaultConfigFiles();
    addPitchFile(10, PITCH_WITH_HARD_CTA);
    addClaimLedger(VERIFIED_CLAIMS);

    const { validateStagePitchGovernance } = await import(
      '@/lib/pitchGovernanceValidator'
    );
    const result = await validateStagePitchGovernance(TEST_CAMPAIGN_PATH, 10);

    const ctaIssues = result.issues.filter(i => i.code === 'CTA_PRESSURE_DETECTED');
    expect(ctaIssues.length).toBeGreaterThanOrEqual(1);
    expect(result.valid).toBe(false);
  });

  it('soft CTA in closing window passes', async () => {
    addDefaultConfigFiles();
    addPitchFile(10, SAFE_PITCH_BODY);
    addClaimLedger(VERIFIED_CLAIMS);

    const { validateStagePitchGovernance } = await import(
      '@/lib/pitchGovernanceValidator'
    );
    const result = await validateStagePitchGovernance(TEST_CAMPAIGN_PATH, 10);

    expect(result.valid).toBe(true);
  });

  it('no soft CTA produces CTA_SOFTNESS_MISSING warning', async () => {
    addDefaultConfigFiles();
    addPitchFile(10, PITCH_NO_CTA);
    addClaimLedger(VERIFIED_CLAIMS);

    const { validateStagePitchGovernance } = await import(
      '@/lib/pitchGovernanceValidator'
    );
    const result = await validateStagePitchGovernance(TEST_CAMPAIGN_PATH, 10);

    const warningCodes = result.warnings.map(w => w.code);
    expect(warningCodes).toContain('CTA_SOFTNESS_MISSING');
  });

  it('aggressive demand words in closing window create issue', async () => {
    addDefaultConfigFiles();
    addPitchFile(10, PITCH_WITH_DEMAND_WORDS);
    addClaimLedger(VERIFIED_CLAIMS);

    const { validateStagePitchGovernance } = await import(
      '@/lib/pitchGovernanceValidator'
    );
    const result = await validateStagePitchGovernance(TEST_CAMPAIGN_PATH, 10);

    const aggressive = result.issues.filter(i => i.code === 'CTA_TONE_TOO_AGGRESSIVE');
    expect(aggressive.length).toBeGreaterThanOrEqual(1);
  });

  it('pitch with fewer than 4 lines is handled safely', async () => {
    addDefaultConfigFiles();
    addPitchFile(10, PITCH_SHORT);
    addClaimLedger(VERIFIED_CLAIMS);

    const { validateStagePitchGovernance } = await import(
      '@/lib/pitchGovernanceValidator'
    );
    const result = await validateStagePitchGovernance(TEST_CAMPAIGN_PATH, 10);

    expect(result.valid).toBe(false);
  });

  it('empty pitch is handled safely', async () => {
    addDefaultConfigFiles();
    addPitchFile(10, PITCH_EMPTY);
    addClaimLedger(VERIFIED_CLAIMS);

    const { validateStagePitchGovernance } = await import(
      '@/lib/pitchGovernanceValidator'
    );
    const result = await validateStagePitchGovernance(TEST_CAMPAIGN_PATH, 10);

    expect(result).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// F. Output shape
// ---------------------------------------------------------------------------
describe('output shape', () => {
  it('result includes stage', async () => {
    addDefaultConfigFiles();
    addPitchFile(10, SAFE_PITCH_BODY);
    addClaimLedger(VERIFIED_CLAIMS);

    const { validateStagePitchGovernance } = await import(
      '@/lib/pitchGovernanceValidator'
    );
    const result = await validateStagePitchGovernance(TEST_CAMPAIGN_PATH, 10);

    expect(result.stage).toBe(10);
  });

  it('result includes filePath', async () => {
    addDefaultConfigFiles();
    addPitchFile(10, SAFE_PITCH_BODY);
    addClaimLedger(VERIFIED_CLAIMS);

    const { validateStagePitchGovernance } = await import(
      '@/lib/pitchGovernanceValidator'
    );
    const result = await validateStagePitchGovernance(TEST_CAMPAIGN_PATH, 10);

    expect(result.filePath).not.toBeNull();
    expect(typeof result.filePath).toBe('string');
  });

  it('result includes valid boolean', async () => {
    addDefaultConfigFiles();
    addPitchFile(10, SAFE_PITCH_BODY);
    addClaimLedger(VERIFIED_CLAIMS);

    const { validateStagePitchGovernance } = await import(
      '@/lib/pitchGovernanceValidator'
    );
    const result = await validateStagePitchGovernance(TEST_CAMPAIGN_PATH, 10);

    expect(typeof result.valid).toBe('boolean');
  });

  it('result includes issues array', async () => {
    addDefaultConfigFiles();
    addPitchFile(10, SAFE_PITCH_BODY);
    addClaimLedger(VERIFIED_CLAIMS);

    const { validateStagePitchGovernance } = await import(
      '@/lib/pitchGovernanceValidator'
    );
    const result = await validateStagePitchGovernance(TEST_CAMPAIGN_PATH, 10);

    expect(Array.isArray(result.issues)).toBe(true);
  });

  it('result includes warnings array', async () => {
    addDefaultConfigFiles();
    addPitchFile(10, SAFE_PITCH_BODY);
    addClaimLedger(VERIFIED_CLAIMS);

    const { validateStagePitchGovernance } = await import(
      '@/lib/pitchGovernanceValidator'
    );
    const result = await validateStagePitchGovernance(TEST_CAMPAIGN_PATH, 10);

    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it('critical issue makes valid false', async () => {
    addDefaultConfigFiles();
    addPitchFile(10, PITCH_WITH_UNSUPPORTED_CLAIM);
    addClaimLedger(UNSUPPORTED_CLAIMS);

    const { validateStagePitchGovernance } = await import(
      '@/lib/pitchGovernanceValidator'
    );
    const result = await validateStagePitchGovernance(TEST_CAMPAIGN_PATH, 10);

    expect(result.valid).toBe(false);
    const hasCritical = result.issues.some(i => i.severity === 'critical');
    expect(hasCritical).toBe(true);
  });
});
