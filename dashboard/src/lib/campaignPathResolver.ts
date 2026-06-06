/**
 * =============================================================================
 * CAMPAIGN PATH RESOLVER
 * =============================================================================
 * 
 * All campaign file reads and writes must use this resolver.
 * Do not hardcode campaigns/{slug} or pitch-jobs/{slug} in other modules.
 * 
 * Expected folder pattern:
 * pitch-jobs/{campaignSlug}/
 *   input/
 *   outputs/
 *   qc/
 *   logs/
 *   source-files/
 *   exports/
 * 
 * =============================================================================
 */

import fs from 'fs/promises';
import path from 'path';

const CAMPAIGN_ROOT = 'D:\\Codex Folder\\digital-pr-agents\\pitch-jobs';

export interface CampaignFolderStructure {
  root: string;
  input: string;
  outputs: string;
  qc: string;
  logs: string;
  sourceFiles: string;
  exports: string;
}

export function getCampaignRoot(campaignSlug: string): string {
  return path.join(CAMPAIGN_ROOT, campaignSlug);
}

export function getInputDir(campaignSlug: string): string {
  return path.join(CAMPAIGN_ROOT, campaignSlug, 'input');
}

export function getOutputDir(campaignSlug: string): string {
  return path.join(CAMPAIGN_ROOT, campaignSlug, 'outputs');
}

export function getQcDir(campaignSlug: string): string {
  return path.join(CAMPAIGN_ROOT, campaignSlug, 'qc');
}

export function getLogsDir(campaignSlug: string): string {
  return path.join(CAMPAIGN_ROOT, campaignSlug, 'logs');
}

export function getSourceFilesDir(campaignSlug: string): string {
  return path.join(CAMPAIGN_ROOT, campaignSlug, 'source-files');
}

export function getExportDir(campaignSlug: string): string {
  return path.join(CAMPAIGN_ROOT, campaignSlug, 'exports');
}

export function getStageOutputPath(campaignSlug: string, stageId: string, fileName: string): string {
  return path.join(getOutputDir(campaignSlug), `${stageId.toLowerCase()}_${fileName}`);
}

export function getQcFilePath(campaignSlug: string, fileName: string): string {
  return path.join(getQcDir(campaignSlug), fileName);
}

export function getLogFilePath(campaignSlug: string, fileName: string): string {
  return path.join(getLogsDir(campaignSlug), fileName);
}

export async function ensureCampaignStructure(campaignSlug: string): Promise<void> {
  const dirs = [
    getInputDir(campaignSlug),
    getOutputDir(campaignSlug),
    getQcDir(campaignSlug),
    getLogsDir(campaignSlug),
    getSourceFilesDir(campaignSlug),
    getExportDir(campaignSlug)
  ];
  
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch {
      // Directory already exists
    }
  }
}

export function getLegacyRootFiles(campaignSlug: string): string[] {
  const root = getCampaignRoot(campaignSlug);
  return [
    path.join(root, '00-brief.md'),
    path.join(root, '01-study-notes.md'),
    path.join(root, '02-insights.md'),
    path.join(root, '03-research.md'),
    path.join(root, '04-angles.md'),
    path.join(root, '05-beats.md'),
    path.join(root, '06-journalist-intel.md'),
    path.join(root, '07-journalist-coverage.md'),
    path.join(root, '08-pitch-draft.md'),
    path.join(root, '09-optimized-email.md'),
    path.join(root, '10-google-doc.md')
  ];
}

export async function getStructuredOutputPath(campaignSlug: string, stageId: string, fileName: string): Promise<string> {
  const outputDir = getOutputDir(campaignSlug);
  
  const stageOutputMap: Record<string, string> = {
    'S1': '01-campaign-intake.json',
    'S2': '02-raw-extracted-data.json',
    'S3': '03-research-enrichment.json',
    'S4A': 'verified-findings.json',
    'S4B': 'InsightAnalysisMap.json',
    'S5': '05-angles.json',
    'S6': '06-beat-match.json',
    'S7': 'human-approval.json',
    'S8': '08-journalist-list.json',
    'S9': '09-journalist-intelligence.json',
    'S10': '10-pitch-draft.json',
    'S11': '11-optimized-pitch.md',
    'S12': '12-outreach-package.json',
    'S13': '13-validation-report.json'
  };
  
  const defaultName = stageOutputMap[stageId] || `${stageId.toLowerCase()}_${fileName}`;
  return path.join(outputDir, defaultName);
}

export async function campaignExists(campaignSlug: string): Promise<boolean> {
  try {
    const root = getCampaignRoot(campaignSlug);
    await fs.access(root);
    return true;
  } catch {
    return false;
  }
}

export function getSourceFilesSubdir(campaignSlug: string, subdir: string): string {
  return path.join(getSourceFilesDir(campaignSlug), subdir);
}