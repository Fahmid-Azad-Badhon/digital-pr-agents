import fs from 'fs/promises';
import path from 'path';
import { SYSTEM_ROOT, PITCH_JOBS_ROOT } from '@/lib/requestGuard';

interface InputLockResult {
  canProceed: boolean;
  missingInputs: string[];
  stageId: string;
}

interface ContextIsolationResult {
  allowedFiles: string[];
  excludedPatterns: string[];
  maxTokens: number;
  temperature: number;
}

const CONTEXT_ISOLATION_PATH = path.join(SYSTEM_ROOT, 'context-isolation.json');
const INPUT_LOCKS_PATH = path.join(SYSTEM_ROOT, 'input-locks.json');

let contextIsolationConfig: any = null;
let inputLocksConfig: any = null;

async function loadConfigs() {
  if (!contextIsolationConfig) {
    try {
      const content = await fs.readFile(CONTEXT_ISOLATION_PATH, 'utf-8');
      contextIsolationConfig = JSON.parse(content);
    } catch {
      contextIsolationConfig = { stages: {} };
    }
  }
  if (!inputLocksConfig) {
    try {
      const content = await fs.readFile(INPUT_LOCKS_PATH, 'utf-8');
      inputLocksConfig = JSON.parse(content);
    } catch {
      inputLocksConfig = { inputLocks: {} };
    }
  }
}

export async function checkInputLocks(
  campaignId: string,
  stageId: string
): Promise<InputLockResult> {
  await loadConfigs();
  
  const lockConfig = inputLocksConfig?.inputLocks?.[stageId];
  
  if (!lockConfig || lockConfig.initialStage) {
    return { canProceed: true, missingInputs: [], stageId };
  }
  
  const campaignPath = path.join(PITCH_JOBS_ROOT, campaignId);
  const missingInputs: string[] = [];
  
  for (const requiredFile of lockConfig.requiredInputs || []) {
    try {
      await fs.access(path.join(campaignPath, requiredFile));
    } catch {
      missingInputs.push(requiredFile);
    }
  }
  
  const canProceed = !lockConfig.blockedIfMissing || missingInputs.length === 0;
  
  return {
    canProceed,
    missingInputs,
    stageId
  };
}

export async function getContextIsolation(
  stageId: string
): Promise<ContextIsolationResult> {
  await loadConfigs();
  
  const stageConfig = contextIsolationConfig?.stages?.[stageId];
  
  if (!stageConfig) {
    return {
      allowedFiles: ['*'],
      excludedPatterns: [],
      maxTokens: 8192,
      temperature: 0.5
    };
  }
  
  return {
    allowedFiles: stageConfig.allowedContextFiles || ['*'],
    excludedPatterns: stageConfig.excludedPatterns || [],
    maxTokens: stageConfig.maxTokens || 8192,
    temperature: stageConfig.temperature || 0.5
  };
}

export function getTemperatureForStage(stageId: string): number {
  const temperatures: Record<string, number> = {
    'S1_CAMPAIGN_INTAKE': 0.2,
    'S2_DATA_EXTRACTION': 0.1,
    'S3_RESEARCH_ENRICHMENT': 0.3,
    'S4A_DATA_RESEARCH_ANALYST': 0.2,
    'S4B_INSIGHT_ANALYST': 0.4,
    'S5_ANGLE_GENERATION': 0.7,
    'S6_BEAT_MATCHING': 0.3,
    'S7_PITCH_SELECTION_HUMAN_GATE': 0.2,
    'S8_JOURNALIST_COLLECTION': 0.4,
    'S9_JOURNALIST_INTELLIGENCE': 0.3,
    'S10_PITCH_DRAFTING': 0.6,
    'S11_PITCH_OPTIMIZATION': 0.5,
    'S12_PACKAGE_ASSEMBLY': 0.3,
    'S13_VALIDATION': 0.0,
    'S14_FINAL_FORMATTING': 0.2,
    'S15_OUTREACH_ASSET_CREATION': 0.7,
    'S16_CAMPAIGN_LOG_LEARNING_LOOP': 0.3
  };
  
  return temperatures[stageId] || 0.5;
}

export async function filterContextFiles(
  campaignId: string,
  stageId: string
): Promise<string[]> {
  const isolation = await getContextIsolation(stageId);
  const campaignPath = path.join(PITCH_JOBS_ROOT, campaignId);
  
  try {
    const allFiles = await fs.readdir(campaignPath);
    
    return allFiles.filter(file => {
      for (const pattern of isolation.excludedPatterns) {
        if (matchGlob(file, pattern)) {
          return false;
        }
      }
      
      if (isolation.allowedFiles.includes('*')) {
        return true;
      }
      
      return isolation.allowedFiles.some(allowed => 
        matchGlob(file, allowed) || file.includes(allowed.replace('.md', ''))
      );
    });
  } catch {
    return [];
  }
}

function matchGlob(filename: string, pattern: string): boolean {
  const regex = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(regex, 'i').test(filename);
}

export function validateClaimAgainstLedger(claim: string, ledger: any): { valid: boolean; source?: string; risk?: string } {
  const claims = ledger?.claims || [];
  
  for (const entry of claims) {
    if (claim.toLowerCase().includes(entry.claim.toLowerCase()) || 
        entry.claim.toLowerCase().includes(claim.toLowerCase())) {
      return {
        valid: entry.verified && entry.source,
        source: entry.source,
        risk: entry.riskLevel
      };
    }
  }
  
  return { valid: false, risk: 'high' };
}