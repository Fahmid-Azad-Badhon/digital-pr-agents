import fs from 'fs/promises';
import path from 'path';

export interface ValidationResult {
  stage: string;
  passed: boolean;
  score: number;
  issues: ValidationIssue[];
  warnings: ValidationWarning[];
}

export interface ValidationIssue {
  type: 'missing_file' | 'empty_data' | 'invalid_structure' | 'missing_required_field' | 'weak_source' | 'invented_source' | 'unverified_claim';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  file?: string;
  field?: string;
}

export interface ValidationWarning {
  type: string;
  message: string;
  suggestion?: string;
}

export interface QualityScore {
  extractionQualityScore: number;
  researchEnrichmentScore: number;
  overallDataReadiness: 'low' | 'medium' | 'medium-high' | 'high';
  mainWeakness: string;
  recommendedAction: string;
}

export async function validateS1(campaignPath: string): Promise<ValidationResult> {
  const issues: ValidationIssue[] = [];
  const warnings: ValidationWarning[] = [];
  let score = 100;

  try {
    const files = await fs.readdir(campaignPath);
    
    const intakeFile = files.find(f => f === '01-campaign-intake.json' || f.startsWith('01-campaign-intake'));
    const topicExpansionFile = files.find(f => f === 'topic-expansion-map.json' || f.startsWith('topic-expansion'));
    const queryMapFile = files.find(f => f === 'research-query-map.json' || f.startsWith('research-query'));

    if (!intakeFile) {
      issues.push({ type: 'missing_file', severity: 'critical', message: '01-campaign-intake.json missing', file: '01-campaign-intake.json' });
      score -= 30;
    }

    if (!topicExpansionFile) {
      issues.push({ type: 'missing_file', severity: 'critical', message: 'topic-expansion-map.json missing', file: 'topic-expansion-map.json' });
      score -= 30;
    } else {
      const content = await fs.readFile(path.join(campaignPath, topicExpansionFile), 'utf-8');
      const data = JSON.parse(content);
      
      if (!data.relatedTerms || data.relatedTerms.length < 3) {
        issues.push({ type: 'missing_required_field', severity: 'high', message: 'relatedTerms must have at least 3 items', field: 'relatedTerms' });
        score -= 15;
      }
      
      if (!data.possibleMetrics || data.possibleMetrics.length < 1) {
        issues.push({ type: 'missing_required_field', severity: 'high', message: 'possibleMetrics must have at least 1 item', field: 'possibleMetrics' });
        score -= 10;
      }
      
      if (!data.journalistBeats || data.journalistBeats.length < 1) {
        issues.push({ type: 'missing_required_field', severity: 'high', message: 'journalistBeats must have at least 1 item', field: 'journalistBeats' });
        score -= 10;
      }
    }

    if (!queryMapFile) {
      issues.push({ type: 'missing_file', severity: 'high', message: 'research-query-map.json missing', file: 'research-query-map.json' });
      score -= 15;
    }

  } catch (error: any) {
    issues.push({ type: 'invalid_structure', severity: 'critical', message: error.message });
    score = 0;
  }

  return {
    stage: 'S1_CAMPAIGN_INTAKE',
    passed: issues.filter(i => i.severity === 'critical').length === 0,
    score: Math.max(0, score),
    issues,
    warnings
  };
}

export async function validateS2(campaignPath: string): Promise<ValidationResult> {
  const issues: ValidationIssue[] = [];
  const warnings: ValidationWarning[] = [];
  let score = 100;

  try {
    const files = await fs.readdir(campaignPath);
    
    const rawDataFile = files.find(f => f.startsWith('02-') && f.includes('extracted-data'));
    const dataInventoryFile = files.find(f => f === 'data-inventory.json' || f.includes('data-inventory'));
    const sourceRegistryFile = files.find(f => f === 'source-registry.json' || f.includes('source-registry'));

    if (!rawDataFile) {
      issues.push({ type: 'missing_file', severity: 'critical', message: '02-raw-extracted-data.json missing', file: '02-raw-extracted-data.json' });
      score -= 35;
    } else {
      const content = await fs.readFile(path.join(campaignPath, rawDataFile), 'utf-8');
      const data = JSON.parse(content);
      
      if (!data.extractedStatistics || data.extractedStatistics.length === 0) {
        issues.push({ type: 'empty_data', severity: 'high', message: 'No statistics extracted', file: rawDataFile });
        score -= 20;
      } else {
        for (const stat of data.extractedStatistics) {
          if (!stat.metricName || !stat.exactValue || !stat.confidence) {
            issues.push({ type: 'missing_required_field', severity: 'medium', message: `Statistic missing required fields: ${stat.statId}`, field: 'extractedStatistics' });
            score -= 5;
          }
        }
      }

      if (data.unclearDataPoints && data.unclearDataPoints.length > 0) {
        warnings.push({ type: 'unclear_data', message: `${data.unclearDataPoints.length} unclear data points flagged` });
      }
    }

    if (!dataInventoryFile) {
      issues.push({ type: 'missing_file', severity: 'critical', message: 'data-inventory.json missing', file: 'data-inventory.json' });
      score -= 25;
    }

    if (!sourceRegistryFile) {
      issues.push({ type: 'missing_file', severity: 'critical', message: 'source-registry.json missing', file: 'source-registry.json' });
      score -= 25;
    } else {
      const content = await fs.readFile(path.join(campaignPath, sourceRegistryFile), 'utf-8');
      const data = JSON.parse(content);
      
      if (!data.sources || data.sources.length === 0) {
        issues.push({ type: 'empty_data', severity: 'high', message: 'No sources in registry', file: sourceRegistryFile });
        score -= 15;
      } else {
        for (const source of data.sources) {
          if (!source.sourceId || !source.sourceName || !source.sourceType || !source.sourceQuality) {
            issues.push({ type: 'missing_required_field', severity: 'medium', message: `Source missing required fields: ${source.sourceId}`, field: 'sources' });
            score -= 5;
          }
        }
      }
    }

  } catch (error: any) {
    issues.push({ type: 'invalid_structure', severity: 'critical', message: error.message });
    score = 0;
  }

  return {
    stage: 'S2_DATA_EXTRACTION',
    passed: issues.filter(i => i.severity === 'critical').length === 0,
    score: Math.max(0, score),
    issues,
    warnings
  };
}

export async function validateS3(campaignPath: string): Promise<ValidationResult> {
  const issues: ValidationIssue[] = [];
  const warnings: ValidationWarning[] = [];
  let score = 100;

  try {
    const files = await fs.readdir(campaignPath);
    
    const enrichmentFile = files.find(f => f.includes('research-enrichment') || f.includes('03-research'));
    const qualityReportFile = files.find(f => f.includes('source-quality-report'));
    const gapsFile = files.find(f => f.includes('research-gaps'));
    const localizationFile = files.find(f => f.includes('localization-map'));
    const doNotUseFile = files.find(f => f.includes('do-not-use-claims'));
    const evidencePackFile = files.find(f => f.includes('evidence-pack'));
    const claimLedgerFile = files.find(f => f.includes('claim-ledger'));

    if (!enrichmentFile) {
      issues.push({ type: 'missing_file', severity: 'critical', message: '03-research-enrichment.json missing', file: '03-research-enrichment.json' });
      score -= 25;
    } else {
      const content = await fs.readFile(path.join(campaignPath, enrichmentFile), 'utf-8');
      const data = JSON.parse(content);
      
      if (data.findings) {
        for (const finding of data.findings) {
          if (finding.sourceQuality === 'E' && finding.canUseInPitch === true) {
            issues.push({ type: 'weak_source', severity: 'high', message: `Finding ${finding.findingId} uses weak source (E) but marked for pitch use`, file: enrichmentFile });
            score -= 10;
          }
          
          if (!finding.sourceId || !finding.sourceQuality) {
            issues.push({ type: 'missing_required_field', severity: 'medium', message: `Finding ${finding.findingId} missing source info`, field: 'findings' });
            score -= 5;
          }
        }
      }
    }

    if (!qualityReportFile) {
      issues.push({ type: 'missing_file', severity: 'high', message: 'source-quality-report.json missing', file: 'source-quality-report.json' });
      score -= 15;
    }

    if (!gapsFile) {
      warnings.push({ type: 'missing_file', message: 'research-gaps.json missing - should identify gaps even if none found' });
    }

    if (!localizationFile) {
      warnings.push({ type: 'missing_file', message: 'localization-map.json missing' });
    }

    if (!doNotUseFile) {
      warnings.push({ type: 'missing_file', message: 'do-not-use-claims.json missing - should exist even if empty' });
    }

    if (!evidencePackFile) {
      issues.push({ type: 'missing_file', severity: 'high', message: 'evidence-pack.md missing', file: 'evidence-pack.md' });
      score -= 15;
    }

    if (!claimLedgerFile) {
      issues.push({ type: 'missing_file', severity: 'high', message: 'claim-ledger.json missing', file: 'claim-ledger.json' });
      score -= 15;
    }

  } catch (error: any) {
    issues.push({ type: 'invalid_structure', severity: 'critical', message: error.message });
    score = 0;
  }

  return {
    stage: 'S3_RESEARCH_ENRICHMENT',
    passed: issues.filter(i => i.severity === 'critical').length === 0,
    score: Math.max(0, score),
    issues,
    warnings
  };
}

export async function calculateDataQualityScore(campaignPath: string): Promise<QualityScore> {
  const s1Result = await validateS1(campaignPath);
  const s2Result = await validateS2(campaignPath);
  const s3Result = await validateS3(campaignPath);

  const extractionScore = Math.round((s1Result.score + s2Result.score) / 2);
  const enrichmentScore = s3Result.score;
  
  const totalScore = Math.round((extractionScore + enrichmentScore) / 2);

  let overallReadiness: 'low' | 'medium' | 'medium-high' | 'high';
  if (totalScore >= 80) overallReadiness = 'high';
  else if (totalScore >= 60) overallReadiness = 'medium-high';
  else if (totalScore >= 40) overallReadiness = 'medium';
  else overallReadiness = 'low';

  const allIssues = [...s1Result.issues, ...s2Result.issues, ...s3Result.issues];
  const criticalIssues = allIssues.filter(i => i.severity === 'critical');
  
  let mainWeakness = 'None';
  let recommendedAction = 'Proceed to next stage';

  if (criticalIssues.length > 0) {
    mainWeakness = `${criticalIssues.length} critical validation issue(s)`;
    recommendedAction = `Fix critical issues before proceeding: ${criticalIssues[0].message}`;
  } else if (totalScore < 60) {
    mainWeakness = 'Multiple validation warnings';
    recommendedAction = 'Review warnings in validation results';
  }

  return {
    extractionQualityScore: extractionScore,
    researchEnrichmentScore: enrichmentScore,
    overallDataReadiness: overallReadiness,
    mainWeakness,
    recommendedAction
  };
}