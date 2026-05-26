import fs from 'fs/promises';
import path from 'path';
import { PITCH_JOBS_ROOT, DATA_ROOT } from '@/lib/requestGuard';

export interface PitchVariant {
  id: string;
  type: 'national-safety' | 'local-data' | 'policy-accountability' | 'human-impact' | 'seasonal';
  name: string;
  description: string;
  headline: string;
  angle: string;
}

export const CONTROLLED_VARIANTS: PitchVariant[] = [
  { id: 'A', type: 'national-safety', name: 'National Safety Angle', description: 'National trend and public safety', headline: '', angle: 'National safety data trend' },
  { id: 'B', type: 'local-data', name: 'Local Data Angle', description: 'Local market specific data', headline: '', angle: 'Local data comparison' },
  { id: 'C', type: 'policy-accountability', name: 'Policy Accountability', description: 'Policy gaps and accountability', headline: '', angle: 'Policy implications' },
  { id: 'D', type: 'human-impact', name: 'Human Impact', description: 'Personal stories and impact', headline: '', angle: 'Human impact narrative' }
];

export async function getJournalistFitExplanation(
  journalistName: string,
  journalistData: any,
  selectedAngle: any
): Promise<{ score: number; reason: string; risk: string }> {
  let score = 50;
  let reason = '';
  let risk = '';
  
  const recentCoverage = journalistData.recentArticles || [];
  const targetBeat = selectedAngle.journalistBeats?.[0] || '';
  
  const beatMatch = recentCoverage.some((article: string) => 
    article.toLowerCase().includes(targetBeat.toLowerCase())
  );
  
  if (beatMatch) {
    score += 20;
    reason += `Recently covered ${targetBeat}. `;
  } else {
    score -= 10;
    risk += `Has not covered ${targetBeat} before. `;
  }
  
  const dataKeywords = ['data', 'study', 'research', 'report', 'analysis', 'statistics'];
  const dataCoverage = recentCoverage.some((article: string) => 
    dataKeywords.some(k => article.toLowerCase().includes(k))
  );
  
  if (dataCoverage) {
    score += 15;
    reason += 'Covers data-driven stories. ';
  } else {
    risk += 'Rarely covers data stories. ';
  }
  
  if (journalistData.relevanceScore >= 8) {
    score += 15;
    reason += 'High relevance score. ';
  }
  
  return {
    score: Math.min(100, score),
    reason: reason.trim() || 'Generic fit based on beat match.',
    risk: risk.trim() || 'No significant risks identified.'
  };
}

export async function createDebugBundle(campaignId: string, outputPath: string): Promise<string> {
  const campaignPath = path.join(PITCH_JOBS_ROOT, campaignId);
  const bundlePath = outputPath || path.join(DATA_ROOT, 'debug-bundles', `${campaignId}-debug-${Date.now()}.zip`);
  
  const filesToInclude = [
    'audit-log.json',
    'stage-state.json',
    'validation-results.json',
    'claim-ledger.json',
    'do-not-say.md',
    'evidence-pack.json',
    'approvals.json'
  ];
  
  const includedFiles: string[] = [];
  
  try {
    await fs.mkdir(path.dirname(bundlePath), { recursive: true });
    
    for (const file of filesToInclude) {
      const filePath = path.join(campaignPath, file);
      try {
        await fs.access(filePath);
        includedFiles.push(file);
      } catch {
        // File doesn't exist, skip
      }
    }
    
    return bundlePath;
  } catch (error) {
    console.error('Error creating debug bundle:', error);
    throw error;
  }
}

export interface FinalSendGate {
  canSend: boolean;
  s13Passed: boolean;
  humanApproval: boolean;
  issues: string[];
}

export async function checkFinalSendGate(campaignId: string): Promise<FinalSendGate> {
  const campaignPath = path.join(PITCH_JOBS_ROOT, campaignId);
  
  const result: FinalSendGate = {
    canSend: false,
    s13Passed: false,
    humanApproval: false,
    issues: []
  };
  
  try {
    const validationFile = path.join(campaignPath, 'validation-results.json');
    const validationContent = await fs.readFile(validationFile, 'utf-8');
    const validation = JSON.parse(validationContent);
    
    result.s13Passed = validation.passed === true;
    if (!result.s13Passed) {
      result.issues.push('S13 validation did not pass');
    }
    
    const approvalFile = path.join(campaignPath, 'approvals.json');
    const approvalContent = await fs.readFile(approvalFile, 'utf-8');
    const approvals = JSON.parse(approvalContent);
    
    const s7Approval = approvals.find((a: any) => a.stage === 'S7_PITCH_SELECTION_HUMAN_GATE');
    const s13Approval = approvals.find((a: any) => a.stage === 'S13_VALIDATION');
    
    result.humanApproval = s7Approval?.status === 'approved' && (s13Approval?.status === 'approved' || result.s13Passed);
    
    if (!result.humanApproval) {
      result.issues.push('Human approval not complete');
    }
    
    result.canSend = result.s13Passed && result.humanApproval && result.issues.length === 0;
    
  } catch (error) {
    result.issues.push('Error checking send gate: ' + String(error));
  }
  
  return result;
}