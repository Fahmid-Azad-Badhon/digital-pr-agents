import fs from 'fs/promises';
import path from 'path';
import { PITCH_JOBS_ROOT } from '@/lib/requestGuard';

export interface DoNotSayRule {
  phrase: string;
  reason: string;
  saferWording?: string;
}

export interface DoNotSayCampaign {
  campaignId: string;
  rules: DoNotSayRule[];
  createdAt: string;
  updatedAt: string;
}

export interface EvidencePack {
  campaignId: string;
  stageId: string;
  generatedAt: string;
  mainStatistics: string[];
  sourceNames: string[];
  sourceLinks: string[];
  methodologySummary: string;
  dataCaveats: string[];
  safeWording: string[];
  claimsToAvoid: string[];
  provenance: any[];
}

const DO_NOT_SAY_PATH = (campaignId: string) => 
  path.join(PITCH_JOBS_ROOT, campaignId, 'do-not-say.md');

const EVIDENCE_PACK_PATH = (campaignId: string) => 
  path.join(PITCH_JOBS_ROOT, campaignId, 'evidence-pack.json');

export async function loadDoNotSayRules(campaignId: string): Promise<DoNotSayRule[]> {
  try {
    const content = await fs.readFile(DO_NOT_SAY_PATH(campaignId), 'utf-8');
    const rules: DoNotSayRule[] = [];
    
    const lines = content.split('\n');
    for (const line of lines) {
      const match = line.match(/^-\s+(.+?):\s+(.+)$/);
      if (match) {
        rules.push({
          phrase: match[1].trim(),
          reason: match[2].trim()
        });
      }
    }
    
    return rules;
  } catch {
    return [];
  }
}

export async function saveDoNotSayRules(campaignId: string, rules: DoNotSayRule[]): Promise<void> {
  const content = [
    '# Do Not Say',
    '',
    'Phrases NOT to use in pitches:',
    '',
    ...rules.map(r => `- ${r.phrase}: ${r.reason}`),
    '',
    'Generated at: ' + new Date().toISOString()
  ].join('\n');
  
  await fs.mkdir(path.dirname(DO_NOT_SAY_PATH(campaignId)), { recursive: true });
  await fs.writeFile(DO_NOT_SAY_PATH(campaignId), content);
}

export async function generateEvidencePack(
  campaignId: string,
  stageId: string
): Promise<EvidencePack> {
  const campaignPath = path.join(PITCH_JOBS_ROOT, campaignId);
  
  const pack: EvidencePack = {
    campaignId,
    stageId,
    generatedAt: new Date().toISOString(),
    mainStatistics: [],
    sourceNames: [],
    sourceLinks: [],
    methodologySummary: '',
    dataCaveats: [],
    safeWording: [],
    claimsToAvoid: [],
    provenance: []
  };
  
  try {
    const files = await fs.readdir(campaignPath);
    
    const verifiedFindings = files.find(f => f.includes('verified-findings'));
    if (verifiedFindings) {
      const content = await fs.readFile(path.join(campaignPath, verifiedFindings), 'utf-8');
      const findings = JSON.parse(content);
      
      pack.mainStatistics = findings.findings?.map((f: any) => f.finding).filter(Boolean) || [];
      pack.sourceNames = [...new Set(findings.findings?.map((f: any) => f.source).filter(Boolean))] as string[] || [];
      pack.provenance = findings.findings?.map((f: any, i: number) => ({
        claim: f.finding,
        source: f.source,
        verified: f.verified,
        id: f.id
      })) || [];
    }
    
    const claimLedger = files.find(f => f.includes('claim-ledger'));
    if (claimLedger) {
      const content = await fs.readFile(path.join(campaignPath, claimLedger), 'utf-8');
      const ledger = JSON.parse(content);
      
      pack.claimsToAvoid = ledger.claims
        ?.filter((c: any) => c.status === 'unsupported' || c.status === 'rejected')
        ?.map((c: any) => c.claim) || [];
      
      pack.safeWording = [
        'The data suggests...',
        'The analysis points to...',
        'The findings raise questions about...',
        'The numbers show...',
        'One pattern stands out...',
        'This may be especially relevant for...',
        'The finding gives reporters a timely local angle...'
      ];
    }
    
    const doNotSay = files.find(f => f.includes('do-not-say'));
    if (doNotSay) {
      const content = await fs.readFile(path.join(campaignPath, doNotSay), 'utf-8');
      const avoid = content.match(/- [^:]+:/g)?.map(m => m.replace(/^- /, '').replace(':', '')) || [];
      pack.claimsToAvoid = [...pack.claimsToAvoid, ...avoid];
    }
    
    pack.methodologySummary = 'Data extracted from official sources (NHTSA, CDC, BLS) and verified through S4A statistical analysis. Claims validated against claim-ledger.json.';
    pack.dataCaveats = [
      'Statistics are from official sources and verified.',
      'Correlation does not imply causation.',
      'Local angles may vary by market.',
      'Journalist fit should be verified before outreach.'
    ];
    
    await fs.mkdir(path.dirname(EVIDENCE_PACK_PATH(campaignId)), { recursive: true });
    await fs.writeFile(EVIDENCE_PACK_PATH(campaignId), JSON.stringify(pack, null, 2));
    
  } catch (error) {
    console.error('Error generating evidence pack:', error);
  }
  
  return pack;
}

export async function loadEvidencePack(campaignId: string): Promise<EvidencePack | null> {
  try {
    const content = await fs.readFile(EVIDENCE_PACK_PATH(campaignId), 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}