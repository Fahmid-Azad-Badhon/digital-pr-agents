import fs from 'fs/promises';
import path from 'path';
import { SYSTEM_ROOT } from '@/lib/requestGuard';

type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface GovernanceIssue {
  code: string;
  severity: Severity;
  message: string;
  evidence?: string;
}

export interface GovernanceValidationResult {
  stage: 10 | 11 | 12;
  filePath: string | null;
  valid: boolean;
  issues: GovernanceIssue[];
  warnings: GovernanceIssue[];
}

type ClaimRecord = {
  claim?: string;
  status?: string;
  safeToUseInPitch?: boolean;
  allowedWording?: string | null;
};

type ClaimLedgerFile = {
  claims?: ClaimRecord[];
  validationRules?: { requireVerificationBeforeUse?: boolean };
};

// SYSTEM_ROOT imported from requestGuard

const STAGE_FILE_CANDIDATES: Record<10 | 11 | 12, string[]> = {
  10: ['10-pitch-draft.md', '08-pitch-draft.md'],
  11: ['11-optimized-pitch.md', '09-optimized-email.md'],
  12: ['12-outreach-package.md'],
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function findFirstExisting(
  files: Set<string>,
  campaignPath: string,
  candidates: string[]
): string | null {
  for (const fileName of candidates) {
    if (files.has(fileName)) {
      return path.join(campaignPath, fileName);
    }
  }
  return null;
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function loadClaimLedger(campaignPath: string): Promise<ClaimLedgerFile | null> {
  const campaignLedgerPath = path.join(campaignPath, 'claim-ledger.json');
  const campaignLedger = await readJsonFile<ClaimLedgerFile>(campaignLedgerPath);
  if (campaignLedger) {
    return campaignLedger;
  }

  const systemLedgerPath = path.join(SYSTEM_ROOT, 'claim-ledger.json');
  return readJsonFile<ClaimLedgerFile>(systemLedgerPath);
}

function collectClaimRules(ledger: ClaimLedgerFile | null) {
  const claims = Array.isArray(ledger?.claims) ? ledger!.claims : [];
  const blockedStatuses = new Set(['needs_source', 'unsupported', 'rejected', 'human_review_required']);

  const safeClaims = claims.filter(claim =>
    claim.safeToUseInPitch === true || claim.status === 'verified' || claim.status === 'usable_with_soft_language'
  );
  const blockedClaims = claims.filter(claim => claim.status && blockedStatuses.has(claim.status));
  return { safeClaims, blockedClaims };
}

function readCandidateClaimSentences(content: string): string[] {
  const lines = content
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  return lines.filter(line => {
    if (!/[0-9]/.test(line)) {
      return false;
    }
    if (/%/.test(line)) {
      return true;
    }
    if (/\b\d{1,3}(,\d{3})+\b/.test(line)) {
      return true;
    }
    if (/\b(one|two|three|four|five|six|seven|eight|nine|ten)\s+in\s+\d+\b/i.test(line)) {
      return true;
    }

    const numberMatches = line.match(/\b\d{2,}\b/g) || [];
    const hasOnlyYearLikeValues = numberMatches.length > 0 && numberMatches.every(value => /^20\d{2}$/.test(value));
    if (hasOnlyYearLikeValues) {
      return false;
    }

    return numberMatches.length > 0;
  });
}

function validateClaimLedgerUsage(content: string, ledger: ClaimLedgerFile | null): GovernanceIssue[] {
  const issues: GovernanceIssue[] = [];
  const normalizedContent = normalize(content);

  if (!ledger) {
    issues.push({
      code: 'CLAIM_LEDGER_MISSING',
      severity: 'critical',
      message: 'Claim ledger file is missing. Cannot verify factual claims for S10-S12 output.',
    });
    return issues;
  }

  const { safeClaims, blockedClaims } = collectClaimRules(ledger);
  const requireVerificationBeforeUse = Boolean(ledger.validationRules?.requireVerificationBeforeUse);

  for (const blockedClaim of blockedClaims) {
    const snippets = [blockedClaim.claim, blockedClaim.allowedWording].filter((snippet): snippet is string => Boolean(snippet));
    for (const snippet of snippets) {
      if (normalizedContent.includes(normalize(snippet))) {
        issues.push({
          code: 'BLOCKED_CLAIM_USED',
          severity: 'critical',
          message: `Blocked claim status "${blockedClaim.status}" is used in pitch content.`,
          evidence: snippet.slice(0, 180),
        });
      }
    }
  }

  const safeSnippets = safeClaims
    .flatMap(claim => [claim.claim, claim.allowedWording])
    .filter((snippet): snippet is string => Boolean(snippet))
    .map(snippet => normalize(snippet));

  const candidateSentences = readCandidateClaimSentences(content);
  for (const sentence of candidateSentences) {
    const normalizedSentence = normalize(sentence);
    const hasKnownClaim = safeSnippets.some(snippet =>
      normalizedSentence.includes(snippet) || snippet.includes(normalizedSentence)
    );
    if (!hasKnownClaim) {
      issues.push({
        code: 'UNMAPPED_NUMERIC_CLAIM',
        severity: requireVerificationBeforeUse ? 'critical' : 'high',
        message: 'Numeric/statistical claim not mapped to a safe claim-ledger entry.',
        evidence: sentence.slice(0, 200),
      });
    }
  }

  return issues;
}

async function loadLanguageRules() {
  const antiSales = await readJsonFile<{
    rules?: {
      bannedPhrases?: string[];
      doNotLeadWith?: string[];
    };
  }>(path.join(SYSTEM_ROOT, 'anti-sales-language-rules.json'));

  const cta = await readJsonFile<{
    rules?: {
      badCTAs?: string[];
      goodCTAs?: string[];
    };
  }>(path.join(SYSTEM_ROOT, 'cta-softness-rules.json'));

  return { antiSales, cta };
}

function validateAntiSales(content: string, antiSalesRules: Awaited<ReturnType<typeof loadLanguageRules>>['antiSales']): GovernanceIssue[] {
  const issues: GovernanceIssue[] = [];
  if (!antiSalesRules?.rules) {
    return issues;
  }

  const normalizedContent = normalize(content);
  const openingChunk = normalize(content.slice(0, 320));
  const bannedPhrases = antiSalesRules.rules.bannedPhrases || [];
  const doNotLeadWith = antiSalesRules.rules.doNotLeadWith || [];

  for (const phrase of bannedPhrases) {
    if (normalizedContent.includes(normalize(phrase))) {
      issues.push({
        code: 'ANTI_SALES_BANNED_PHRASE',
        severity: 'critical',
        message: 'Pitch includes banned sales-like language.',
        evidence: phrase,
      });
    }
  }

  for (const phrase of doNotLeadWith) {
    const normalizedPhrase = normalize(phrase);
    if (openingChunk.includes(normalizedPhrase)) {
      issues.push({
        code: 'ANTI_SALES_WEAK_LEAD',
        severity: 'high',
        message: 'Pitch lead starts with language disallowed by anti-sales rules.',
        evidence: phrase,
      });
    }
  }

  return issues;
}

function validateCtaSoftness(content: string, ctaRules: Awaited<ReturnType<typeof loadLanguageRules>>['cta']) {
  const issues: GovernanceIssue[] = [];
  const warnings: GovernanceIssue[] = [];
  if (!ctaRules?.rules) {
    return { issues, warnings };
  }

  const normalizedContent = normalize(content);
  const badCtas = ctaRules.rules.badCTAs || [];
  const goodCtas = ctaRules.rules.goodCTAs || [];

  for (const phrase of badCtas) {
    if (normalizedContent.includes(normalize(phrase))) {
      issues.push({
        code: 'CTA_PRESSURE_DETECTED',
        severity: 'critical',
        message: 'High-pressure CTA phrase detected.',
        evidence: phrase,
      });
    }
  }

  const lines = content.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const closingWindow = lines.slice(Math.max(lines.length - 4, 0)).join(' ').toLowerCase();
  const hasSoftCta = goodCtas.some(phrase => closingWindow.includes(normalize(phrase)));
  const hasDemandWords = /\b(asap|immediately|must|urgent|cover this|publish this|you should)\b/i.test(closingWindow);

  if (hasDemandWords) {
    issues.push({
      code: 'CTA_TONE_TOO_AGGRESSIVE',
      severity: 'high',
      message: 'CTA tone is aggressive and conflicts with softness rules.',
      evidence: closingWindow.slice(0, 200),
    });
  } else if (!hasSoftCta) {
    warnings.push({
      code: 'CTA_SOFTNESS_MISSING',
      severity: 'medium',
      message: 'No recognized low-pressure CTA detected in closing lines.',
      evidence: closingWindow.slice(0, 200),
    });
  }

  return { issues, warnings };
}

export async function validateStagePitchGovernance(
  campaignPath: string,
  stage: 10 | 11 | 12
): Promise<GovernanceValidationResult> {
  const files = new Set(await fs.readdir(campaignPath).catch(() => []));
  const filePath = findFirstExisting(files, campaignPath, STAGE_FILE_CANDIDATES[stage]);

  if (!filePath) {
    return {
      stage,
      filePath: null,
      valid: false,
      issues: [
        {
          code: 'PITCH_FILE_MISSING',
          severity: 'critical',
          message: `No stage output file found for S${stage}.`,
        },
      ],
      warnings: [],
    };
  }

  const content = await fs.readFile(filePath, 'utf-8').catch(() => '');
  const ledger = await loadClaimLedger(campaignPath);
  const claimIssues = validateClaimLedgerUsage(content, ledger);
  const languageRules = await loadLanguageRules();
  const antiSalesIssues = validateAntiSales(content, languageRules.antiSales);
  const ctaResult = validateCtaSoftness(content, languageRules.cta);

  const issues = [...claimIssues, ...antiSalesIssues, ...ctaResult.issues];
  const warnings = [...ctaResult.warnings];

  const valid = issues.filter(issue => issue.severity === 'critical' || issue.severity === 'high').length === 0;
  return {
    stage,
    filePath,
    valid,
    issues,
    warnings,
  };
}

