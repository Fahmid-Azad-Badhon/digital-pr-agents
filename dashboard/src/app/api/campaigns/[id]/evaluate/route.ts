import { NextRequest } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { fail, ok } from '@/lib/apiResponse';
import { resolveCampaignPath } from '@/lib/requestGuard';

async function evaluateCampaign(campaignSlug: string): Promise<any> {
  const campaignPath = resolveCampaignPath(campaignSlug);
  const files = await fs.readdir(campaignPath).catch(() => []);

  let campaignName = campaignSlug;
  const evaluations: any[] = [];

  const evaluateS1 = async () => {
    const topicExpansionFile = files.find(f => f.includes('topic-expansion'));
    if (!topicExpansionFile) return null;
    return { stageId: 'S1_CAMPAIGN_INTAKE', stageName: 'Campaign Intake', overallScore: 65, canProceed: true };
  };

  const evaluateS2 = async () => {
    const rawDataFile = files.find(f => f.includes('02-') && f.includes('extracted'));
    if (!rawDataFile) return null;
    return { stageId: 'S2_DATA_EXTRACTION', stageName: 'Data Extraction', overallScore: 70, canProceed: true };
  };

  const evaluateS10 = async () => {
    const pitchFile = files.find(f => f.includes('10-pitch-draft'));
    if (!pitchFile) return null;
    const pitchContent = await fs.readFile(path.join(campaignPath, pitchFile), 'utf-8').catch(() => '');
    const hasAggressiveCTA = pitchContent.toLowerCase().includes('call now');
    return { 
      stageId: 'S10_PITCH_DRAFTING', 
      stageName: 'Pitch Drafting', 
      overallScore: hasAggressiveCTA ? 55 : 75, 
      canProceed: !hasAggressiveCTA 
    };
  };

  const evaluateS13 = async () => {
    const validationFile = files.find(f => f.includes('validation'));
    if (!validationFile) return null;
    try {
      const validation = JSON.parse(await fs.readFile(path.join(campaignPath, validationFile), 'utf-8'));
      return { 
        stageId: 'S13_VALIDATION', 
        stageName: 'Final Validation', 
        overallScore: validation.passed ? 80 : 30, 
        canProceed: validation.passed !== false 
      };
    } catch {
      return { stageId: 'S13_VALIDATION', stageName: 'Final Validation', overallScore: 0, canProceed: false };
    }
  };

  if (files.some(f => f.includes('topic'))) evaluations.push(await evaluateS1());
  if (files.some(f => f.includes('02-'))) evaluations.push(await evaluateS2());
  if (files.some(f => f.includes('10-pitch'))) evaluations.push(await evaluateS10());
  if (files.some(f => f.includes('validation'))) evaluations.push(await evaluateS13());

  const overallScore = evaluations.length > 0
    ? Math.round(evaluations.reduce((a, b) => a + (b?.overallScore || 0), 0) / evaluations.length)
    : 0;

  const s13Failed = evaluations.some(e => e?.stageId === 'S13_VALIDATION' && !e?.canProceed);
  
  const result = {
    campaignSlug,
    campaignName,
    evaluationVersion: '1.0',
    generatedAt: new Date().toISOString(),
    overallCampaignScore: overallScore,
    overallReadinessLevel: s13Failed ? 'needs_revision' : overallScore >= 75 ? 'strong' : overallScore >= 65 ? 'acceptable' : 'needs_revision',
    stageEvaluations: evaluations.filter(Boolean),
    topStrengths: evaluations.filter(e => e?.overallScore >= 70).map(e => `${e.stageName} is strong`),
    topWeaknesses: evaluations.filter(e => e?.overallScore < 65).map(e => `${e.stageName} needs attention`),
    blockingIssues: evaluations.filter(e => !e?.canProceed).map(e => `${e.stageName} failed evaluation`),
    dashboardSummary: {
      dataQuality: overallScore >= 75 ? 'green' : overallScore >= 65 ? 'yellow' : 'orange',
      claimSafety: s13Failed ? 'red' : 'green',
      angleQuality: 'yellow',
      journalistFit: 'yellow',
      pitchQuality: evaluations.find(e => e?.stageId === 'S10_PITCH_DRAFTING')?.overallScore >= 70 ? 'green' : 'orange',
      finalReadiness: s13Failed ? 'red' : 'green'
    }
  };

  try {
    await fs.writeFile(path.join(campaignPath, 'evaluation-results.json'), JSON.stringify(result, null, 2));
  } catch {}

  return result;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignSlug } = await params;
  
  if (!campaignSlug) {
    return fail('CAMPAIGN_ID_REQUIRED', 'Campaign ID required.', { status: 400 });
  }

  try {
    const result = await evaluateCampaign(campaignSlug);
    return ok({ message: 'Evaluation completed', results: result });
  } catch (error: any) {
    return fail('EVALUATION_FAILED', 'Evaluation failed.', { status: 500 }, error.message);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignSlug } = await params;
  
  if (!campaignSlug) {
    return fail('CAMPAIGN_ID_REQUIRED', 'Campaign ID required.', { status: 400 });
  }

  try {
    const campaignPath = resolveCampaignPath(campaignSlug);
    const evaluationPath = path.join(campaignPath, 'evaluation-results.json');
    
    let evaluation = null;
    try {
      const content = await fs.readFile(evaluationPath, 'utf-8');
      evaluation = JSON.parse(content);
    } catch {}

    return ok({ evaluation });
  } catch (error: any) {
    return fail('FAILED_TO_GET_EVALUATION', 'Failed to get evaluation.', { status: 500 }, error.message);
  }
}
