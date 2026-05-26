// POST /api/validate - Run validation checks with "No source, no claim" rule
import { fail, ok } from '@/lib/apiResponse';
import { SYSTEM_ROOT, PITCH_JOBS_ROOT, resolveCampaignPath } from '@/lib/requestGuard';
import fs from 'fs/promises';
import path from 'path';

const CLAIM_LEDGER_PATH = path.join(SYSTEM_ROOT, 'claim-ledger.json');

interface ValidationResult {
  passed: boolean;
  score: number;
  checks: ValidationCheck[];
  unsupportedClaims: UnsupportedClaim[];
  rewriteSuggestions: RewriteSuggestion[];
}

interface ValidationCheck {
  name: string;
  passed: boolean;
  message: string;
  severity: 'critical' | 'warning' | 'info';
}

interface UnsupportedClaim {
  claim: string;
  location: string;
  suggestion?: string;
}

interface RewriteSuggestion {
  original: string;
  safer: string;
  reason: string;
}

export async function POST(request: Request) {
  const { campaignId, stage, content, checkClaimLedger = true } = await request.json().catch(() => ({} as Record<string, unknown>));
  
  const checks: ValidationCheck[] = [];
  const unsupportedClaims: UnsupportedClaim[] = [];
  const rewriteSuggestions: RewriteSuggestion[] = [];
  
  if (!content) {
    return fail('VALIDATION_CONTENT_REQUIRED', 'No content provided for validation.', { status: 400 });
  }
  
  // =============================================================================
  // RULE 1: No Source, No Claim - Check for statistics without sources
  // =============================================================================
  
  const statsPattern = /(\d+(?:\.\d+)?%|\d+ in \d+|\d+\s+(?:million|billion|thousand|percent|people|deaths|crashes))/gi;
  const sourcePatterns = [
    /(?:according to|from|per|via|as per|based on|source:|data from|cited:)/i,
    /NHTSA|CDC|BLS|IIHS|Nielsen|Gallup|Census/i,
    /\(\d{4}\)|([A-Z][a-z]+\s+\d{4})/
  ];
  
  const statsMatches = content.match(statsPattern) || [];
  
  for (const stat of statsMatches) {
    const statContext = content.substring(
      Math.max(0, content.indexOf(stat) - 100),
      Math.min(content.length, content.indexOf(stat) + 100)
    );
    
    const hasSource = sourcePatterns.some(pattern => pattern.test(statContext));
    
    if (!hasSource) {
      unsupportedClaims.push({
        claim: stat,
        location: `Found at position ${content.indexOf(stat)}`,
        suggestion: `Add source citation (e.g., "according to NHTSA 2024") or remove claim`
      });
      
      checks.push({
        name: 'No Source No Claim',
        passed: false,
        message: `Statistic "${stat}" has no source attribution`,
        severity: 'critical'
      });
    }
  }
  
  if (unsupportedClaims.length === 0) {
    checks.push({
      name: 'No Source No Claim',
      passed: true,
      message: 'All statistics have source attribution',
      severity: 'info'
    });
  }
  
  // =============================================================================
  // RULE 2: Claim Ledger Check - Match against known verified claims
  // =============================================================================
  
  if (checkClaimLedger && campaignId) {
    let ledger: any = { claims: [] };
    
    try {
      const ledgerPath = path.join(resolveCampaignPath(campaignId), 'claim-ledger.json');
      const ledgerContent = await fs.readFile(ledgerPath, 'utf-8');
      ledger = JSON.parse(ledgerContent);
    } catch {
      try {
        const systemLedger = await fs.readFile(CLAIM_LEDGER_PATH, 'utf-8');
        ledger = JSON.parse(systemLedger);
      } catch {
        // No ledger found
      }
    }
    
    const verifiedClaims = ledger.claims?.filter((c: any) => c.verified) || [];
    const claimedInContent: string[] = [];
    
    for (const verified of verifiedClaims) {
      if (content.toLowerCase().includes(verified.claim.toLowerCase())) {
        claimedInContent.push(verified.claim);
      }
    }
    
    if (claimedInContent.length > 0) {
      checks.push({
        name: 'Claim Ledger Match',
        passed: true,
        message: `${claimedInContent.length} claims matched from verified ledger`,
        severity: 'info'
      });
    }
  }
  
  // =============================================================================
  // RULE 3: Claim Rewrite Mode - Suggest safer wording for risky claims
  // =============================================================================
  
  const riskyPhrases = [
    { pattern: /crisis/gi, safer: 'important topic', reason: 'Crisis is hyperbolic' },
    { pattern: /epidemic/gi, safer: 'significant issue', reason: 'Epidemic is alarmist' },
    { pattern: /skyrocketed/gi, safer: 'increased', reason: 'Skyrocketed is sensational' },
    { pattern: /surged?\s+(\d+%)/gi, safer: 'increased to $1', reason: 'Be specific about context' },
    { pattern: /deadly/gi, safer: 'fatal', reason: 'Deadly can be sensationalized' },
    { pattern: /horrific/gi, safer: 'serious', reason: 'Horrific is emotional' },
    { pattern: /devastating/gi, safer: 'significant', reason: 'Devastating is subjective' },
    { pattern: /catastrophic/gi, safer: 'major', reason: 'Catastrophic is alarmist' }
  ];
  
  for (const { pattern, safer, reason } of riskyPhrases) {
    const matches = content.match(pattern);
    if (matches) {
      for (const match of matches) {
        rewriteSuggestions.push({
          original: match,
          safer: match.replace(pattern, safer),
          reason
        });
        
        checks.push({
          name: 'Claim Rewrite Mode',
          passed: false,
          message: `Found risky phrase "${match}" - suggested safer wording`,
          severity: 'warning'
        });
      }
    }
  }
  
  if (rewriteSuggestions.length === 0) {
    checks.push({
      name: 'Claim Rewrite Mode',
      passed: true,
      message: 'No risky phrases detected',
      severity: 'info'
    });
  }
  
  // =============================================================================
  // RULE 4: Factual Consistency Check
  // =============================================================================
  
  const verifiedFindingsPath = campaignId
    ? path.join(resolveCampaignPath(campaignId), 'verified-findings.json')
    : path.join(PITCH_JOBS_ROOT, 'default', 'verified-findings.json');
  try {
    const findingsContent = await fs.readFile(verifiedFindingsPath, 'utf-8');
    const findings = JSON.parse(findingsContent);
    
    checks.push({
      name: 'Factual Consistency',
      passed: true,
      message: 'Verified findings file present - facts can be cross-referenced',
      severity: 'info'
    });
  } catch {
    checks.push({
      name: 'Factual Consistency',
      passed: false,
      message: 'Verified findings not found - cannot cross-check facts',
      severity: 'warning'
    });
  }
  
  // =============================================================================
  // Calculate Score
  // =============================================================================
  
  const criticalFailures = checks.filter(c => c.severity === 'critical' && !c.passed).length;
  const warnings = checks.filter(c => c.severity === 'warning' && !c.passed).length;
  
  let score = 100;
  score -= criticalFailures * 20;
  score -= warnings * 10;
  score = Math.max(0, score);
  
  const passed = criticalFailures === 0 && warnings <= 2;
  
  const result: ValidationResult = {
    passed,
    score,
    checks,
    unsupportedClaims,
    rewriteSuggestions
  };
  
  return ok(result);
}

export async function GET() {
  return ok({
    validationTypes: [
      'no-source-no-claim',
      'claim-ledger-match',
      'claim-rewrite-mode',
      'factual-consistency'
    ],
    rules: {
      noSourceNoClaim: {
        description: 'Every statistic must have source attribution',
        severity: 'critical'
      },
      claimRewriteMode: {
        description: 'Suggest safer wording for risky phrases',
        severity: 'warning'
      },
      claimLedgerMatch: {
        description: 'Match claims against verified claim ledger',
        severity: 'info'
      }
    },
    status: 'ready'
  });
}
