/**
 * =============================================================================
 * LEGACY CAMPAIGN ADAPTER
 * =============================================================================
 * 
 * Provides read-only access to legacy markdown files as REFERENCE ONLY.
 * Never returns legacy content as authoritative stage completion.
 * Use CampaignPathResolver for all new campaign file access.
 * 
 * Legacy files (reference only):
 * - 00-brief.md
 * - 01-study-notes.md
 * - 02-insights.md
 * - 03-research.md
 * - 04-angles.md
 * - 05-beats.md
 * - 06-journalist-intel.md
 * - 07-journalist-coverage.md
 * - 08-pitch-draft.md
 * - 09-optimized-email.md
 * - 10-google-doc.md
 * 
 * =============================================================================
 */

import fs from 'fs/promises';
import path from 'path';

const CAMPAIGN_ROOT = 'D:\\Codex Folder\\digital-pr-agents\\pitch-jobs';

export interface LegacyFileMapping {
  legacyFile: string;
  modernEquivalent: string | null;
  status: 'reference' | 'deprecated' | 'superseded';
  description: string;
}

const LEGACY_FILE_MAPPINGS: LegacyFileMapping[] = [
  { legacyFile: '00-brief.md', modernEquivalent: 'input/campaign-brief.json', status: 'reference', description: 'Original campaign brief' },
  { legacyFile: '01-study-notes.md', modernEquivalent: null, status: 'deprecated', description: 'Replaced by structured extraction' },
  { legacyFile: '02-insights.md', modernEquivalent: 'outputs/InsightAnalysisMap.json', status: 'superseded', description: 'Replaced by S4B output' },
  { legacyFile: '03-research.md', modernEquivalent: 'outputs/03-research-enrichment.json', status: 'superseded', description: 'Replaced by S3 output' },
  { legacyFile: '04-angles.md', modernEquivalent: 'outputs/05-angles.json', status: 'superseded', description: 'Replaced by S5 output' },
  { legacyFile: '05-beats.md', modernEquivalent: 'outputs/06-beat-match.json', status: 'superseded', description: 'Replaced by S6 output' },
  { legacyFile: '06-journalist-intel.md', modernEquivalent: 'outputs/09-journalist-intelligence.json', status: 'superseded', description: 'Replaced by S9 output' },
  { legacyFile: '07-journalist-coverage.md', modernEquivalent: null, status: 'deprecated', description: 'No direct replacement' },
  { legacyFile: '08-pitch-draft.md', modernEquivalent: 'outputs/10-pitch-draft.json', status: 'superseded', description: 'Replaced by S10 output' },
  { legacyFile: '09-optimized-email.md', modernEquivalent: 'outputs/11-optimized-pitch.json', status: 'superseded', description: 'Replaced by S11 output' },
  { legacyFile: '10-google-doc.md', modernEquivalent: 'outputs/12-outreach-package.json', status: 'superseded', description: 'Replaced by S12 output' }
];

export function getLegacyFileMappings(): LegacyFileMapping[] {
  return LEGACY_FILE_MAPPINGS;
}

export async function readLegacyFile(campaignSlug: string, legacyFileName: string): Promise<{
  content: string | null;
  mapping: LegacyFileMapping | null;
  warning: string;
}> {
  const legacyPath = path.join(CAMPAIGN_ROOT, campaignSlug, legacyFileName);
  
  const foundMapping = LEGACY_FILE_MAPPINGS.find(m => m.legacyFile === legacyFileName);
  const mapping = foundMapping || null;
  
  try {
    const content = await fs.readFile(legacyPath, 'utf-8');
    
    let warning = 'Legacy file loaded as reference only. ';
    if (mapping) {
      if (mapping.modernEquivalent) {
        warning += `Modern equivalent exists: ${mapping.modernEquivalent}. Use structured JSON output for stage completion.`;
      } else if (mapping.status === 'deprecated') {
        warning += 'This file format is deprecated. Do not use for new workflows.';
      }
    }
    
    return { content, mapping, warning };
  } catch {
    return { content: null, mapping: null, warning: 'Legacy file not found.' };
  }
}

export async function listLegacyFiles(campaignSlug: string): Promise<{
  found: string[];
  missing: string[];
}> {
  const campaignRoot = path.join(CAMPAIGN_ROOT, campaignSlug);
  const found: string[] = [];
  const missing: string[] = [];
  
  for (const mapping of LEGACY_FILE_MAPPINGS) {
    const legacyPath = path.join(campaignRoot, mapping.legacyFile);
    try {
      await fs.access(legacyPath);
      found.push(mapping.legacyFile);
    } catch {
      missing.push(mapping.legacyFile);
    }
  }
  
  return { found, missing };
}

export function isLegacyFile(fileName: string): boolean {
  return LEGACY_FILE_MAPPINGS.some(m => m.legacyFile === fileName);
}

export function getModernEquivalent(legacyFileName: string): string | null {
  const mapping = LEGACY_FILE_MAPPINGS.find(m => m.legacyFile === legacyFileName);
  return mapping?.modernEquivalent || null;
}

export async function migrateLegacyToModern(campaignSlug: string): Promise<{
  migrated: string[];
  failed: string[];
  skipped: string[];
}> {
  const results = {
    migrated: [] as string[],
    failed: [] as string[],
    skipped: [] as string[]
  };
  
  for (const mapping of LEGACY_FILE_MAPPINGS) {
    if (!mapping.modernEquivalent) {
      results.skipped.push(mapping.legacyFile);
      continue;
    }
    
    const legacyPath = path.join(CAMPAIGN_ROOT, campaignSlug, mapping.legacyFile);
    const modernPath = path.join(CAMPAIGN_ROOT, campaignSlug, mapping.modernEquivalent);
    
    try {
      await fs.access(legacyPath);
      try {
        await fs.access(modernPath);
        results.skipped.push(`${mapping.legacyFile} -> ${mapping.modernEquivalent} (already exists)`);
      } catch {
        const content = await fs.readFile(legacyPath, 'utf-8');
        const modernDir = path.dirname(modernPath);
        await fs.mkdir(modernDir, { recursive: true });
        await fs.writeFile(modernPath, `# Migrated from ${mapping.legacyFile}\n\n${content}`, 'utf-8');
        results.migrated.push(`${mapping.legacyFile} -> ${mapping.modernEquivalent}`);
      }
    } catch {
      results.failed.push(`${mapping.legacyFile} (not found)`);
    }
  }
  
  return results;
}

export function getLegacyFileStatus(fileName: string): 'reference' | 'deprecated' | 'superseded' | 'unknown' {
  const mapping = LEGACY_FILE_MAPPINGS.find(m => m.legacyFile === fileName);
  return mapping?.status || 'unknown';
}