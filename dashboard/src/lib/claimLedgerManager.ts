/**
 * =============================================================================
 * CLAIM LEDGER MANAGER MODULE
 * =============================================================================
 * 
 * Manages the claim ledger - source of truth for which factual claims
 * can be used in pitch and production outputs.
 * 
 * =============================================================================
 */

import fs from 'fs/promises';
import path from 'path';

const CAMPAIGNS_DIR = 'D:\\Codex Folder\\digital-pr-agents\\pitch-jobs';
const SYSTEM_DIR = 'D:\\Codex Folder\\digital-pr-agents\\system';

export interface Claim {
  claimId: string;
  claim: string;
  claimType: string;
  sourceIds: string[];
  sourceQuality: string | null;
  status: 'verified' | 'usable_with_soft_language' | 'needs_source' | 'unsupported' | 'rejected' | 'human_review_required';
  safeToUseInPitch: boolean;
  allowedWording: string | null;
  blockedWording: string[];
  riskTags: string[];
  confidence: 'high' | 'medium' | 'low';
  usedIn: string[];
  createdByStage: string | null;
  verifiedByStage: string | null;
  lastCheckedByStage: string | null;
  notes: string[];
}

export interface ClaimLedger {
  campaignSlug: string;
  version: string;
  updatedAt: string;
  claims: Claim[];
}

export interface ClaimUsage {
  claimId: string;
  usedInFile: string;
  usedByStage: string;
  usedText: string;
  matchesAllowedWording: boolean;
  usageStatus: 'approved' | 'approved_soft_language' | 'needs_review' | 'blocked' | 'unknown_claim';
  risk: 'low' | 'medium' | 'high';
}

async function loadClaimLedgerRules() {
  const rulesPath = path.join(SYSTEM_DIR, 'claim-ledger-rules.json');
  try {
    const data = await fs.readFile(rulesPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function loadClaimLedger(campaignSlug: string): Promise<ClaimLedger | null> {
  const ledgerPath = path.join(CAMPAIGNS_DIR, campaignSlug, 'claim-ledger.json');
  try {
    const data = await fs.readFile(ledgerPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function createClaimLedger(campaignSlug: string): Promise<ClaimLedger> {
  const ledger: ClaimLedger = {
    campaignSlug,
    version: '1.0',
    updatedAt: new Date().toISOString(),
    claims: []
  };
  
  const ledgerPath = path.join(CAMPAIGNS_DIR, campaignSlug, 'claim-ledger.json');
  await fs.writeFile(ledgerPath, JSON.stringify(ledger, null, 2), 'utf-8');
  
  return ledger;
}

export async function addClaim(
  campaignSlug: string,
  claim: Omit<Claim, 'claimId' | 'createdByStage' | 'verifiedByStage' | 'lastCheckedByStage' | 'usedIn' | 'notes'>
): Promise<Claim> {
  let ledger = await loadClaimLedger(campaignSlug);
  if (!ledger) {
    ledger = await createClaimLedger(campaignSlug);
  }
  
  const newClaim: Claim = {
    ...claim,
    claimId: `CLM-${String(ledger.claims.length + 1).padStart(3, '0')}`,
    createdByStage: null,
    verifiedByStage: null,
    lastCheckedByStage: null,
    usedIn: [],
    notes: []
  };
  
  ledger.claims.push(newClaim);
  ledger.updatedAt = new Date().toISOString();
  
  const ledgerPath = path.join(CAMPAIGNS_DIR, campaignSlug, 'claim-ledger.json');
  await fs.writeFile(ledgerPath, JSON.stringify(ledger, null, 2), 'utf-8');
  
  return newClaim;
}

export async function updateClaimStatus(
  campaignSlug: string,
  claimId: string,
  status: Claim['status'],
  verifiedByStage?: string
): Promise<boolean> {
  const ledger = await loadClaimLedger(campaignSlug);
  if (!ledger) return false;
  
  const claim = ledger.claims.find(c => c.claimId === claimId);
  if (!claim) return false;
  
  claim.status = status;
  claim.lastCheckedByStage = verifiedByStage || null;
  
  if (verifiedByStage) {
    claim.verifiedByStage = verifiedByStage;
  }
  
  // Update safeToUseInPitch based on status
  const rules = await loadClaimLedgerRules();
  const statusRule = rules?.claimStatuses?.find((s: any) => s.status === status);
  if (statusRule) {
    claim.safeToUseInPitch = statusRule.safeToUseInPitch;
  }
  
  ledger.updatedAt = new Date().toISOString();
  
  const ledgerPath = path.join(CAMPAIGNS_DIR, campaignSlug, 'claim-ledger.json');
  await fs.writeFile(ledgerPath, JSON.stringify(ledger, null, 2), 'utf-8');
  
  return true;
}

export async function setAllowedWording(
  campaignSlug: string,
  claimId: string,
  wording: string
): Promise<boolean> {
  const ledger = await loadClaimLedger(campaignSlug);
  if (!ledger) return false;
  
  const claim = ledger.claims.find(c => c.claimId === claimId);
  if (!claim) return false;
  
  claim.allowedWording = wording;
  ledger.updatedAt = new Date().toISOString();
  
  const ledgerPath = path.join(CAMPAIGNS_DIR, campaignSlug, 'claim-ledger.json');
  await fs.writeFile(ledgerPath, JSON.stringify(ledger, null, 2), 'utf-8');
  
  return true;
}

export async function getClaimById(campaignSlug: string, claimId: string): Promise<Claim | null> {
  const ledger = await loadClaimLedger(campaignSlug);
  if (!ledger) return null;
  
  return ledger.claims.find(c => c.claimId === claimId) || null;
}

export async function getSafeClaims(campaignSlug: string): Promise<Claim[]> {
  const ledger = await loadClaimLedger(campaignSlug);
  if (!ledger) return [];
  
  return ledger.claims.filter(c => c.safeToUseInPitch);
}

export async function getUnsafeClaims(campaignSlug: string): Promise<Claim[]> {
  const ledger = await loadClaimLedger(campaignSlug);
  if (!ledger) return [];
  
  return ledger.claims.filter(c => !c.safeToUseInPitch);
}

export async function getClaimsByStatus(
  campaignSlug: string,
  status: Claim['status']
): Promise<Claim[]> {
  const ledger = await loadClaimLedger(campaignSlug);
  if (!ledger) return [];
  
  return ledger.claims.filter(c => c.status === status);
}

export async function validateClaimUsage(
  campaignSlug: string,
  filePath: string,
  stageId: string
): Promise<ClaimUsage[]> {
  const ledger = await loadClaimLedger(campaignSlug);
  if (!ledger) {
    return [{
      claimId: 'UNKNOWN',
      usedInFile: filePath,
      usedByStage: stageId,
      usedText: 'Claim ledger not found',
      matchesAllowedWording: false,
      usageStatus: 'unknown_claim',
      risk: 'high'
    }];
  }
  
  const usage: ClaimUsage[] = [];
  
  try {
    const content = await fs.readFile(path.join(CAMPAIGNS_DIR, campaignSlug, filePath), 'utf-8');
    
    for (const claim of ledger.claims) {
      if (content.includes(claim.claim) || (claim.allowedWording && content.includes(claim.allowedWording))) {
        let matchesAllowed = false;
        
        if (claim.allowedWording) {
          matchesAllowed = content.includes(claim.allowedWording);
        }
        
        let usageStatus: ClaimUsage['usageStatus'] = 'needs_review';
        let risk: ClaimUsage['risk'] = 'low';
        
        if (claim.status === 'verified') {
          usageStatus = matchesAllowed ? 'approved' : 'needs_review';
          risk = matchesAllowed ? 'low' : 'medium';
        } else if (claim.status === 'usable_with_soft_language') {
          usageStatus = matchesAllowed ? 'approved_soft_language' : 'blocked';
          risk = matchesAllowed ? 'low' : 'high';
        } else if (claim.status === 'unsupported' || claim.status === 'rejected' || claim.status === 'needs_source') {
          usageStatus = 'blocked';
          risk = 'high';
        } else if (claim.status === 'human_review_required') {
          usageStatus = 'needs_review';
          risk = 'high';
        }
        
        usage.push({
          claimId: claim.claimId,
          usedInFile: filePath,
          usedByStage: stageId,
          usedText: claim.claim.substring(0, 100),
          matchesAllowedWording: matchesAllowed,
          usageStatus,
          risk
        });
        
        // Mark claim as used
        if (!claim.usedIn.includes(filePath)) {
          claim.usedIn.push(filePath);
        }
      }
    }
    
    // Save updated ledger with usage
    ledger.updatedAt = new Date().toISOString();
    await fs.writeFile(
      path.join(CAMPAIGNS_DIR, campaignSlug, 'claim-ledger.json'),
      JSON.stringify(ledger, null, 2),
      'utf-8'
    );
    
  } catch (error) {
    usage.push({
      claimId: 'ERROR',
      usedInFile: filePath,
      usedByStage: stageId,
      usedText: `Error reading file: ${error}`,
      matchesAllowedWording: false,
      usageStatus: 'unknown_claim',
      risk: 'high'
    });
  }
  
  // Save claim usage map
  const usageMapPath = path.join(CAMPAIGNS_DIR, campaignSlug, 'claim-usage-map.json');
  await fs.writeFile(usageMapPath, JSON.stringify({
    campaignSlug,
    updatedAt: new Date().toISOString(),
    usage
  }, null, 2), 'utf-8');
  
  return usage;
}

export async function approveHumanReviewClaim(
  campaignSlug: string,
  claimId: string,
  approvedWording?: string
): Promise<boolean> {
  const ledger = await loadClaimLedger(campaignSlug);
  if (!ledger) return false;
  
  const claim = ledger.claims.find(c => c.claimId === claimId);
  if (!claim || claim.status !== 'human_review_required') return false;
  
  claim.status = 'verified';
  claim.safeToUseInPitch = true;
  claim.verifiedByStage = 'HUMAN';
  claim.lastCheckedByStage = 'HUMAN';
  
  if (approvedWording) {
    claim.allowedWording = approvedWording;
  }
  
  ledger.updatedAt = new Date().toISOString();
  
  const ledgerPath = path.join(CAMPAIGNS_DIR, campaignSlug, 'claim-ledger.json');
  await fs.writeFile(ledgerPath, JSON.stringify(ledger, null, 2), 'utf-8');
  
  return true;
}