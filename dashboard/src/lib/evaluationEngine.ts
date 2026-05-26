import fs from 'fs/promises';
import path from 'path';
import { resolveCampaignPath } from '@/lib/requestGuard';

interface StageEvaluation {
  evaluationId: string;
  stageId: string;
  stageName: string;
  evaluatedFile: string | null;
  modelUsed: string | null;
  overallScore: number;
  readinessLevel: string;
  scores: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  recommendedActions: string[];
  canProceed: boolean;
  requiresHumanReview: boolean;
}

interface CampaignEvaluation {
  campaignSlug: string;
  campaignName: string;
  evaluationVersion: string;
  generatedAt: string;
  overallCampaignScore: number;
  overallReadinessLevel: string;
  stageEvaluations: StageEvaluation[];
  topStrengths: string[];
  topWeaknesses: string[];
  blockingIssues: string[];
  recommendedActions: string[];
  dashboardSummary: Record<string, string>;
}

function scoreToColor(score: number): string {
  if (score >= 75) return 'green';
  if (score >= 65) return 'yellow';
  if (score >= 50) return 'orange';
  return 'red';
}

function scoreToReadiness(score: number): string {
  if (score >= 85) return 'excellent';
  if (score >= 75) return 'strong';
  if (score >= 65) return 'acceptable';
  if (score >= 50) return 'needs_revision';
  return 'blocked';
}

async function evaluateS1(campaignPath: string): Promise<StageEvaluation> {
  const files = await fs.readdir(campaignPath).catch(() => []);
  const topicExpansionFile = files.find(f => f.includes('topic-expansion'));
  
  if (!topicExpansionFile) {
    return {
      evaluationId: 'EVAL-S1-001',
      stageId: 'S1_CAMPAIGN_INTAKE',
      stageName: 'Campaign Intake',
      evaluatedFile: null,
      modelUsed: null,
      overallScore: 0,
      readinessLevel: 'blocked',
      scores: {},
      strengths: [],
      weaknesses: ['topic-expansion-map.json missing'],
      risks: ['Cannot proceed'],
      recommendedActions: ['Complete S1'],
      canProceed: false,
      requiresHumanReview: true
    };
  }

  try {
    const data = JSON.parse(await fs.readFile(path.join(campaignPath, topicExpansionFile), 'utf-8'));
    let score = 50;
    if (data.possibleMetrics?.length > 0) score += 15;
    if (data.relatedTerms?.length >= 3) score += 10;
    if (data.journalistBeats?.length > 0) score += 10;
    if (data.riskWarnings?.length > 0) score += 5;
    
    return {
      evaluationId: 'EVAL-S1-001',
      stageId: 'S1_CAMPAIGN_INTAKE',
      stageName: 'Campaign Intake',
      evaluatedFile: topicExpansionFile,
      modelUsed: null,
      overallScore: score,
      readinessLevel: scoreToReadiness(score),
      scores: { topicClarity: score, metricCoverage: score },
      strengths: data.possibleMetrics?.length ? ['Good metrics'] : [],
      weaknesses: !data.possibleMetrics?.length ? ['No metrics'] : [],
      risks: [],
      recommendedActions: [],
      canProceed: score >= 50,
      requiresHumanReview: score < 65
    };
  } catch {
    return {
      evaluationId: 'EVAL-S1-001',
      stageId: 'S1_CAMPAIGN_INTAKE',
      stageName: 'Campaign Intake',
      evaluatedFile: topicExpansionFile,
      modelUsed: null,
      overallScore: 30,
      readinessLevel: 'blocked',
      scores: {},
      strengths: [],
      weaknesses: ['Parse error'],
      risks: ['Cannot read'],
      recommendedActions: ['Fix file'],
      canProceed: false,
      requiresHumanReview: true
    };
  }
}

async function evaluateS2(campaignPath: string): Promise<StageEvaluation> {
  const files = await fs.readdir(campaignPath).catch(() => []);
  const rawDataFile = files.find(f => f.includes('02-') && f.includes('extracted'));
  
  if (!rawDataFile) {
    return {
      evaluationId: 'EVAL-S2-001',
      stageId: 'S2_DATA_EXTRACTION',
      stageName: 'Data Extraction',
      evaluatedFile: null,
      modelUsed: null,
      overallScore: 0,
      readinessLevel: 'blocked',
      scores: {},
      strengths: [],
      weaknesses: ['No data extracted'],
      risks: ['Cannot proceed'],
      recommendedActions: ['Complete S2'],
      canProceed: false,
      requiresHumanReview: true
    };
  }

  try {
    const data = JSON.parse(await fs.readFile(path.join(campaignPath, rawDataFile), 'utf-8'));
    const stats = data.extractedStatistics || [];
    const score = stats.length > 5 ? 75 : stats.length > 0 ? 60 : 40;
    
    return {
      evaluationId: 'EVAL-S2-001',
      stageId: 'S2_DATA_EXTRACTION',
      stageName: 'Data Extraction',
      evaluatedFile: rawDataFile,
      modelUsed: null,
      overallScore: score,
      readinessLevel: scoreToReadiness(score),
      scores: { dataCompleteness: score, sourceTraceability: score },
      strengths: stats.length > 0 ? [`${stats.length} stats extracted`] : [],
      weaknesses: stats.length < 3 ? ['Low data volume'] : [],
      risks: [],
      recommendedActions: [],
      canProceed: score >= 50,
      requiresHumanReview: score < 65
    };
  } catch {
    return {
      evaluationId: 'EVAL-S2-001',
      stageId: 'S2_DATA_EXTRACTION',
      stageName: 'Data Extraction',
      evaluatedFile: rawDataFile,
      modelUsed: null,
      overallScore: 30,
      readinessLevel: 'blocked',
      scores: {},
      strengths: [],
      weaknesses: ['Parse error'],
      risks: ['Cannot read'],
      recommendedActions: ['Fix file'],
      canProceed: false,
      requiresHumanReview: true
    };
  }
}

async function evaluateS10(campaignPath: string): Promise<StageEvaluation> {
  const files = await fs.readdir(campaignPath).catch(() => []);
  const pitchFile = files.find(f => f.includes('10-pitch-draft') && f.endsWith('.md'));
  
  if (!pitchFile) {
    return {
      evaluationId: 'EVAL-S10-001',
      stageId: 'S10_PITCH_DRAFTING',
      stageName: 'Pitch Drafting',
      evaluatedFile: null,
      modelUsed: null,
      overallScore: 0,
      readinessLevel: 'blocked',
      scores: {},
      strengths: [],
      weaknesses: ['Pitch not found'],
      risks: ['Cannot evaluate'],
      recommendedActions: ['Complete S10'],
      canProceed: false,
      requiresHumanReview: true
    };
  }

  try {
    const content = await fs.readFile(path.join(campaignPath, pitchFile), 'utf-8');
    const hasAggressiveCTA = /call now|buy now|immediately/i.test(content);
    const hasPromotional = /guarantee|best|amazing/i.test(content);
    const hasSource = content.includes('# Sources') || content.includes('Sources:');
    
    let score = 70;
    if (!hasAggressiveCTA) score += 10;
    if (hasSource) score += 5;
    if (hasPromotional) score -= 15;
    
    return {
      evaluationId: 'EVAL-S10-001',
      stageId: 'S10_PITCH_DRAFTING',
      stageName: 'Pitch Drafting',
      evaluatedFile: pitchFile,
      modelUsed: null,
      overallScore: score,
      readinessLevel: scoreToReadiness(score),
      scores: { claimSafety: hasAggressiveCTA ? 30 : 75, toneQuality: hasPromotional ? 40 : 70 },
      strengths: !hasAggressiveCTA ? ['CTA is soft'] : [],
      weaknesses: hasAggressiveCTA ? ['CTA too aggressive'] : hasPromotional ? ['Too promotional'] : [],
      risks: hasAggressiveCTA ? ['CTA violates rules'] : [],
      recommendedActions: hasAggressiveCTA ? ['Fix CTA'] : [],
      canProceed: !hasAggressiveCTA && score >= 50,
      requiresHumanReview: hasAggressiveCTA || score < 75
    };
  } catch {
    return {
      evaluationId: 'EVAL-S10-001',
      stageId: 'S10_PITCH_DRAFTING',
      stageName: 'Pitch Drafting',
      evaluatedFile: pitchFile,
      modelUsed: null,
      overallScore: 30,
      readinessLevel: 'blocked',
      scores: {},
      strengths: [],
      weaknesses: ['Parse error'],
      risks: ['Cannot read'],
      recommendedActions: ['Fix file'],
      canProceed: false,
      requiresHumanReview: true
    };
  }
}

async function evaluateS13(campaignPath: string): Promise<StageEvaluation> {
  const files = await fs.readdir(campaignPath).catch(() => []);
  const validationFile = files.find(f => f.includes('validation'));
  
  if (!validationFile) {
    return {
      evaluationId: 'EVAL-S13-001',
      stageId: 'S13_VALIDATION',
      stageName: 'Final Validation',
      evaluatedFile: null,
      modelUsed: null,
      overallScore: 0,
      readinessLevel: 'blocked',
      scores: {},
      strengths: [],
      weaknesses: ['Validation not run'],
      risks: ['Cannot proceed'],
      recommendedActions: ['Run S13'],
      canProceed: false,
      requiresHumanReview: true
    };
  }

  try {
    const validation = JSON.parse(await fs.readFile(path.join(campaignPath, validationFile), 'utf-8'));
    const passed = validation.passed !== false;
    const blockingIssues = validation.blockingIssues?.length || 0;
    const score = passed ? 85 : 30;
    
    return {
      evaluationId: 'EVAL-S13-001',
      stageId: 'S13_VALIDATION',
      stageName: 'Final Validation',
      evaluatedFile: validationFile,
      modelUsed: null,
      overallScore: score,
      readinessLevel: scoreToReadiness(score),
      scores: { blockingIssueSeverity: score },
      strengths: passed ? ['Validation passed'] : [],
      weaknesses: !passed ? ['Validation failed'] : [],
      risks: !passed ? ['Not ready for send'] : [],
      recommendedActions: !passed ? ['Fix issues and rerun'] : [],
      canProceed: passed,
      requiresHumanReview: !passed
    };
  } catch {
    return {
      evaluationId: 'EVAL-S13-001',
      stageId: 'S13_VALIDATION',
      stageName: 'Final Validation',
      evaluatedFile: validationFile,
      modelUsed: null,
      overallScore: 30,
      readinessLevel: 'blocked',
      scores: {},
      strengths: [],
      weaknesses: ['Parse error'],
      risks: ['Cannot read'],
      recommendedActions: ['Fix file'],
      canProceed: false,
      requiresHumanReview: true
    };
  }
}

export async function evaluateCampaign(campaignSlug: string): Promise<CampaignEvaluation> {
  const campaignPath = resolveCampaignPath(campaignSlug);
  const files = await fs.readdir(campaignPath).catch(() => []);

  let campaignName = campaignSlug;
  const evaluations: StageEvaluation[] = [];

  if (files.some(f => f.includes('topic'))) evaluations.push(await evaluateS1(campaignPath));
  if (files.some(f => f.includes('02-'))) evaluations.push(await evaluateS2(campaignPath));
  if (files.some(f => f.includes('10-pitch'))) evaluations.push(await evaluateS10(campaignPath));
  if (files.some(f => f.includes('validation'))) evaluations.push(await evaluateS13(campaignPath));

  const overallScore = evaluations.length > 0
    ? Math.round(evaluations.reduce((a, b) => a + b.overallScore, 0) / evaluations.length)
    : 0;

  const s13Failed = evaluations.some(e => e.stageId === 'S13_VALIDATION' && !e.canProceed);
  
  let overallReadiness: string;
  if (s13Failed) {
    overallReadiness = 'needs_revision';
  } else if (overallScore >= 85) {
    overallReadiness = 'excellent';
  } else if (overallScore >= 75) {
    overallReadiness = 'strong';
  } else if (overallScore >= 65) {
    overallReadiness = 'acceptable';
  } else if (overallScore >= 50) {
    overallReadiness = 'needs_revision';
  } else {
    overallReadiness = 'blocked';
  }

  const result: CampaignEvaluation = {
    campaignSlug,
    campaignName,
    evaluationVersion: '1.0',
    generatedAt: new Date().toISOString(),
    overallCampaignScore: overallScore,
    overallReadinessLevel: overallReadiness,
    stageEvaluations: evaluations,
    topStrengths: evaluations.filter(e => e.overallScore >= 70).map(e => e.stageName + ' is strong').slice(0, 3),
    topWeaknesses: evaluations.filter(e => e.overallScore < 65).map(e => e.stageName + ' needs attention').slice(0, 3),
    blockingIssues: evaluations.filter(e => !e.canProceed).map(e => e.stageName + ' blocked'),
    recommendedActions: s13Failed ? ['Fix S13 validation issues'] : [],
    dashboardSummary: {
      dataQuality: scoreToColor(evaluations.find(e => e.stageId === 'S2_DATA_EXTRACTION')?.overallScore || 0),
      claimSafety: s13Failed ? 'red' : 'green',
      angleQuality: 'yellow',
      journalistFit: 'yellow',
      pitchQuality: scoreToColor(evaluations.find(e => e.stageId === 'S10_PITCH_DRAFTING')?.overallScore || 0),
      finalReadiness: s13Failed ? 'red' : scoreToColor(overallScore)
    }
  };

  try {
    await fs.writeFile(path.join(campaignPath, 'evaluation-results.json'), JSON.stringify(result, null, 2));
  } catch {}

  return result;
}