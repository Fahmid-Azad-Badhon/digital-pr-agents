import { NextRequest, NextResponse } from 'next/server';
import { resolveCampaignPath } from '@/lib/requestGuard';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignId } = await params;
  
  if (!campaignId) {
    return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 });
  }

  try {
    const campaignPath = resolveCampaignPath(campaignId);
    const files = await fs.readdir(campaignPath).catch(() => []);

    const qualityScore = await calculateDataQualityScore(campaignPath, files);
    const validationResults = await runAllEarlyStageValidations(campaignPath, files);

    return NextResponse.json({
      campaignId,
      qualityScore,
      validations: validationResults,
      canProceed: validationResults.every(v => v.passed)
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Failed to get data intelligence quality',
      details: error.message 
    }, { status: 500 });
  }
}

interface ValidationResult {
  stage: string;
  passed: boolean;
  score: number;
  issues: any[];
  warnings: any[];
}

interface QualityScore {
  extractionQualityScore: number;
  researchEnrichmentScore: number;
  overallDataReadiness: string;
  mainWeakness: string;
  recommendedAction: string;
}

async function calculateDataQualityScore(campaignPath: string, files: string[]): Promise<QualityScore> {
  let s1Score = 50, s2Score = 50, s3Score = 50;
  
  const topicExpansionFile = files.find(f => f.includes('topic-expansion'));
  const rawDataFile = files.find(f => f.includes('02-') && f.includes('extracted'));
  const dataInventoryFile = files.find(f => f.includes('data-inventory'));
  const sourceRegistryFile = files.find(f => f.includes('source-registry'));
  const enrichmentFile = files.find(f => f.includes('research-enrichment'));
  const qualityReportFile = files.find(f => f.includes('source-quality'));
  const evidencePackFile = files.find(f => f.includes('evidence-pack'));

  if (topicExpansionFile) {
    try {
      const content = await fs.readFile(path.join(campaignPath, topicExpansionFile), 'utf-8');
      const data = JSON.parse(content);
      let score = 50;
      if (data.relatedTerms?.length >= 3) score += 15;
      if (data.possibleMetrics?.length >= 1) score += 15;
      if (data.journalistBeats?.length >= 1) score += 10;
      if (data.riskWarnings) score += 10;
      s1Score = Math.min(100, score);
    } catch {}
  }

  if (rawDataFile && dataInventoryFile && sourceRegistryFile) {
    let score = 50;
    try {
      const rawData = JSON.parse(await fs.readFile(path.join(campaignPath, rawDataFile), 'utf-8'));
      if (rawData.extractedStatistics?.length > 0) score += 25;
      if (!rawData.unclearDataPoints?.length) score += 10;
      if (rawData.methodologyNotes?.length > 0) score += 15;
    } catch {}
    s2Score = Math.min(100, score);
  }

  if (enrichmentFile && qualityReportFile && evidencePackFile) {
    let score = 50;
    try {
      const enrichment = JSON.parse(await fs.readFile(path.join(campaignPath, enrichmentFile), 'utf-8'));
      if (enrichment.officialSources?.length > 0 || enrichment.supportingStudies?.length > 0) score += 20;
      if (enrichment.localizationOpportunities?.length > 0) score += 15;
      if (enrichment.safeContextForPitch?.length > 0) score += 15;
    } catch {}
    s3Score = Math.min(100, score);
  }

  const extractionScore = Math.round((s1Score + s2Score) / 2);
  const totalScore = Math.round((extractionScore + s3Score) / 2);

  let readiness: string;
  if (totalScore >= 80) readiness = 'high';
  else if (totalScore >= 60) readiness = 'medium-high';
  else if (totalScore >= 40) readiness = 'medium';
  else readiness = 'low';

  let weakness = 'None';
  let action = 'Proceed to next stage';

  if (!topicExpansionFile) {
    weakness = 'S1 topic expansion missing';
    action = 'Complete S1 Campaign Intake first';
  } else if (!rawDataFile || !sourceRegistryFile) {
    weakness = 'S2 data extraction incomplete';
    action = 'Complete S2 Data Extraction first';
  } else if (!enrichmentFile) {
    weakness = 'S3 research enrichment missing';
    action = 'Complete S3 Research Enrichment first';
  } else if (totalScore < 60) {
    weakness = 'Multiple validation issues';
    action = 'Review quality warnings and fix issues';
  }

  return {
    extractionQualityScore: extractionScore,
    researchEnrichmentScore: s3Score,
    overallDataReadiness: readiness,
    mainWeakness: weakness,
    recommendedAction: action
  };
}

async function runAllEarlyStageValidations(campaignPath: string, files: string[]): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  const topicExpansionFile = files.find(f => f.includes('topic-expansion'));
  const rawDataFile = files.find(f => f.includes('02-') && f.includes('extracted'));
  const dataInventoryFile = files.find(f => f.includes('data-inventory'));
  const sourceRegistryFile = files.find(f => f.includes('source-registry'));
  const enrichmentFile = files.find(f => f.includes('research-enrichment'));
  const qualityReportFile = files.find(f => f.includes('source-quality'));
  const gapsFile = files.find(f => f.includes('research-gaps'));
  const localizationFile = files.find(f => f.includes('localization-map'));
  const doNotUseFile = files.find(f => f.includes('do-not-use-claims'));
  const evidencePackFile = files.find(f => f.includes('evidence-pack'));
  const claimLedgerFile = files.find(f => f.includes('claim-ledger'));

  const s1Issues: any[] = [];
  if (!topicExpansionFile) {
    s1Issues.push({ type: 'missing_file', severity: 'critical', message: 'topic-expansion-map.json missing' });
  } else {
    try {
      const content = await fs.readFile(path.join(campaignPath, topicExpansionFile), 'utf-8');
      const data = JSON.parse(content);
      if (!data.relatedTerms || data.relatedTerms.length < 3) {
        s1Issues.push({ type: 'missing_required_field', severity: 'high', message: 'relatedTerms must have at least 3 items' });
      }
      if (!data.possibleMetrics || data.possibleMetrics.length < 1) {
        s1Issues.push({ type: 'missing_required_field', severity: 'high', message: 'possibleMetrics must have at least 1 item' });
      }
      if (!data.journalistBeats || data.journalistBeats.length < 1) {
        s1Issues.push({ type: 'missing_required_field', severity: 'high', message: 'journalistBeats must have at least 1 item' });
      }
    } catch {}
  }

  results.push({
    stage: 'S1_CAMPAIGN_INTAKE',
    passed: s1Issues.filter(i => i.severity === 'critical').length === 0,
    score: s1Issues.length > 0 ? Math.max(0, 100 - s1Issues.length * 15) : 100,
    issues: s1Issues,
    warnings: []
  });

  const s2Issues: any[] = [];
  if (!rawDataFile) s2Issues.push({ type: 'missing_file', severity: 'critical', message: '02-raw-extracted-data.json missing' });
  if (!dataInventoryFile) s2Issues.push({ type: 'missing_file', severity: 'critical', message: 'data-inventory.json missing' });
  if (!sourceRegistryFile) s2Issues.push({ type: 'missing_file', severity: 'critical', message: 'source-registry.json missing' });

  if (rawDataFile) {
    try {
      const rawData = JSON.parse(await fs.readFile(path.join(campaignPath, rawDataFile), 'utf-8'));
      if (!rawData.extractedStatistics || rawData.extractedStatistics.length === 0) {
        s2Issues.push({ type: 'empty_data', severity: 'high', message: 'No statistics extracted' });
      }
    } catch {}
  }

  results.push({
    stage: 'S2_DATA_EXTRACTION',
    passed: s2Issues.filter(i => i.severity === 'critical').length === 0,
    score: s2Issues.length > 0 ? Math.max(0, 100 - s2Issues.length * 20) : 100,
    issues: s2Issues,
    warnings: []
  });

  const s3Issues: any[] = [];
  const s3Warnings: any[] = [];
  
  if (!enrichmentFile) s3Issues.push({ type: 'missing_file', severity: 'critical', message: '03-research-enrichment.json missing' });
  if (!evidencePackFile) s3Issues.push({ type: 'missing_file', severity: 'high', message: 'evidence-pack.md missing' });
  if (!claimLedgerFile) s3Issues.push({ type: 'missing_file', severity: 'high', message: 'claim-ledger.json missing' });
  if (!qualityReportFile) s3Warnings.push({ type: 'missing_file', message: 'source-quality-report.json missing' });
  if (!gapsFile) s3Warnings.push({ type: 'missing_file', message: 'research-gaps.json missing' });
  if (!localizationFile) s3Warnings.push({ type: 'missing_file', message: 'localization-map.json missing' });
  if (!doNotUseFile) s3Warnings.push({ type: 'missing_file', message: 'do-not-use-claims.json missing' });

  if (enrichmentFile) {
    try {
      const enrichment = JSON.parse(await fs.readFile(path.join(campaignPath, enrichmentFile), 'utf-8'));
      if (enrichment.findings) {
        for (const f of enrichment.findings) {
          if (f.sourceQuality === 'E' && f.canUseInPitch === true) {
            s3Issues.push({ type: 'weak_source', severity: 'high', message: `Finding ${f.findingId} uses weak source (E) but marked for pitch use` });
          }
        }
      }
    } catch {}
  }

  results.push({
    stage: 'S3_RESEARCH_ENRICHMENT',
    passed: s3Issues.filter(i => i.severity === 'critical').length === 0,
    score: s3Issues.length > 0 ? Math.max(0, 100 - s3Issues.length * 15) : 100,
    issues: s3Issues,
    warnings: s3Warnings
  });

  return results;
}