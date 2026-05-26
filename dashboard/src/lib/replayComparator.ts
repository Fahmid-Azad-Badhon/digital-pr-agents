/**
 * =============================================================================
 * REPLAY COMPARATOR MODULE
 * =============================================================================
 * 
 * Comprehensive comparison for Replay Mode:
 * - JSON field changes
 * - Markdown section changes
 * - CSV row changes
 * - Claim ledger changes
 * - Score changes
 * 
 * =============================================================================
 */

import fs from 'fs/promises';
import path from 'path';

const CAMPAIGNS_DIR = 'D:\\Codex Folder\\digital-pr-agents\\pitch-jobs';

export interface DiffResult {
  type: 'added' | 'removed' | 'changed';
  path: string;
  oldValue?: any;
  newValue?: any;
}

export interface ClaimChange {
  claimId: string;
  changeType: 'added' | 'removed' | 'modified';
  oldClaim?: string;
  newClaim?: string;
}

export interface ComparisonResult {
  hasDifferences: boolean;
  diffs: DiffResult[];
  claimChanges: ClaimChange[];
  summary: string;
  scoreDelta: number;
  qualityImproved: boolean;
  newRisks: string[];
}

export async function compareJsonFiles(
  oldPath: string,
  newPath: string
): Promise<ComparisonResult> {
  const diffs: DiffResult[] = [];
  let claimChanges: ClaimChange[] = [];
  let newRisks: string[] = [];
  
  try {
    const oldContent = await fs.readFile(oldPath, 'utf-8');
    const newContent = await fs.readFile(newPath, 'utf-8');
    
    const oldData = JSON.parse(oldContent);
    const newData = JSON.parse(newContent);
    
    compareObjects(oldData, newData, '', diffs);
    
    if (oldData.claims && newData.claims) {
      claimChanges = compareClaimArrays(oldData.claims, newData.claims);
    }
    
    if (oldData.unsupportedClaims && newData.unsupportedClaims) {
      const addedUnsupported = newData.unsupportedClaims.filter(
        (c: string) => !oldData.unsupportedClaims.includes(c)
      );
      if (addedUnsupported.length > 0) {
        newRisks.push(`New unsupported claims: ${addedUnsupported.join(', ')}`);
      }
    }
    
    const scoreDelta = (newData.score || newData.overallScore || 0) - 
                       (oldData.score || oldData.overallScore || 0);
    
    return {
      hasDifferences: diffs.length > 0 || claimChanges.length > 0,
      diffs,
      claimChanges,
      summary: diffs.length === 0 ? 'No significant changes' : `${diffs.length} changes detected`,
      scoreDelta,
      qualityImproved: scoreDelta > 0,
      newRisks
    };
  } catch (error) {
    return {
      hasDifferences: true,
      diffs: [{ type: 'changed', path: 'parse_error', oldValue: String(error) }],
      claimChanges: [],
      summary: 'Failed to parse JSON files',
      scoreDelta: 0,
      qualityImproved: false,
      newRisks: ['Parse error']
    };
  }
}

function compareObjects(oldObj: any, newObj: any, path: string, diffs: DiffResult[]): void {
  const oldKeys = oldObj ? Object.keys(oldObj) : [];
  const newKeys = newObj ? Object.keys(newObj) : [];
  const allKeys = [...new Set([...oldKeys, ...newKeys])];
  
  for (const key of allKeys) {
    const currentPath = path ? `${path}.${key}` : key;
    
    if (!(key in oldObj)) {
      diffs.push({ type: 'added', path: currentPath, newValue: newObj[key] });
    } else if (!(key in newObj)) {
      diffs.push({ type: 'removed', path: currentPath, oldValue: oldObj[key] });
    } else if (typeof oldObj[key] === 'object' && typeof newObj[key] === 'object') {
      compareObjects(oldObj[key], newObj[key], currentPath, diffs);
    } else if (oldObj[key] !== newObj[key]) {
      diffs.push({ 
        type: 'changed', 
        path: currentPath, 
        oldValue: oldObj[key], 
        newValue: newObj[key] 
      });
    }
  }
}

function compareClaimArrays(oldClaims: any[], newClaims: any[]): ClaimChange[] {
  const changes: ClaimChange[] = [];
  const oldIds = new Set(oldClaims.map((c: any) => c.id || c.claimId || JSON.stringify(c)));
  const newIds = new Set(newClaims.map((c: any) => c.id || c.claimId || JSON.stringify(c)));
  
  for (const claim of newClaims) {
    const id = claim.id || claim.claimId || JSON.stringify(claim);
    if (!oldIds.has(id)) {
      changes.push({ claimId: id, changeType: 'added', newClaim: claim });
    }
  }
  
  for (const claim of oldClaims) {
    const id = claim.id || claim.claimId || JSON.stringify(claim);
    if (!newIds.has(id)) {
      changes.push({ claimId: id, changeType: 'removed', oldClaim: claim });
    }
  }
  
  return changes;
}

export async function compareMarkdownFiles(
  oldPath: string,
  newPath: string
): Promise<ComparisonResult> {
  const diffs: DiffResult[] = [];
  let newRisks: string[] = [];
  
  try {
    const oldContent = await fs.readFile(oldPath, 'utf-8');
    const newContent = await fs.readFile(newPath, 'utf-8');
    
    const oldSections = extractMarkdownSections(oldContent);
    const newSections = extractMarkdownSections(newContent);
    
    for (const section of newSections) {
      if (!oldSections.find(s => s.title === section.title)) {
        diffs.push({ type: 'added', path: `section:${section.title}`, newValue: section.content });
      }
    }
    
    for (const section of oldSections) {
      if (!newSections.find(s => s.title === section.title)) {
        diffs.push({ type: 'removed', path: `section:${section.title}`, oldValue: section.content });
      }
    }
    
    for (const newSection of newSections) {
      const oldSection = oldSections.find(s => s.title === newSection.title);
      if (oldSection && oldSection.content !== newSection.content) {
        const hasAggressiveCTA = /call now|buy now|immediately/i.test(newSection.content);
        const hadAggressiveCTA = /call now|buy now|immediately/i.test(oldSection.content);
        
        if (hasAggressiveCTA && !hadAggressiveCTA) {
          newRisks.push('New aggressive CTA detected');
        }
        
        diffs.push({ 
          type: 'changed', 
          path: `section:${newSection.title}`, 
          oldValue: oldSection.content.substring(0, 100),
          newValue: newSection.content.substring(0, 100)
        });
      }
    }
    
    const summary = diffs.length === 0 
      ? 'No changes' 
      : `${diffs.filter(d => d.type === 'added').length} added, ${diffs.filter(d => d.type === 'removed').length} removed, ${diffs.filter(d => d.type === 'changed').length} changed`;
    
    return {
      hasDifferences: diffs.length > 0,
      diffs,
      claimChanges: [],
      summary,
      scoreDelta: 0,
      qualityImproved: diffs.filter(d => d.type === 'added').length > 0,
      newRisks
    };
  } catch (error) {
    return {
      hasDifferences: true,
      diffs: [{ type: 'changed', path: 'parse_error', oldValue: String(error) }],
      claimChanges: [],
      summary: 'Failed to compare markdown files',
      scoreDelta: 0,
      qualityImproved: false,
      newRisks: ['Parse error']
    };
  }
}

function extractMarkdownSections(content: string): { title: string; content: string }[] {
  const sections: { title: string; content: string }[] = [];
  const lines = content.split('\n');
  let currentTitle = 'ROOT';
  let currentContent: string[] = [];
  
  for (const line of lines) {
    if (line.match(/^#{1,6}\s+/)) {
      if (currentContent.length > 0) {
        sections.push({ title: currentTitle, content: currentContent.join('\n') });
      }
      currentTitle = line.replace(/^#+\s+/, '').trim();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }
  
  if (currentContent.length > 0) {
    sections.push({ title: currentTitle, content: currentContent.join('\n') });
  }
  
  return sections;
}

export async function compareCsvFiles(
  oldPath: string,
  newPath: string
): Promise<ComparisonResult> {
  const diffs: DiffResult[] = [];
  let newRisks: string[] = [];
  
  try {
    const oldContent = await fs.readFile(oldPath, 'utf-8');
    const newContent = await fs.readFile(newPath, 'utf-8');
    
    const oldRows = parseCSV(oldContent);
    const newRows = parseCSV(newContent);
    
    if (oldRows.length !== newRows.length) {
      diffs.push({ 
        type: 'changed', 
        path: 'row_count', 
        oldValue: oldRows.length, 
        newValue: newRows.length 
      });
    }
    
    const emailChanges = compareColumnChanges(oldRows, newRows, 'email');
    if (emailChanges.added.length > 0) diffs.push({ type: 'added', path: 'emails', newValue: emailChanges.added });
    if (emailChanges.removed.length > 0) diffs.push({ type: 'removed', path: 'emails', oldValue: emailChanges.removed });
    
    return {
      hasDifferences: diffs.length > 0,
      diffs,
      claimChanges: [],
      summary: diffs.length === 0 ? 'No significant changes' : `${diffs.length} changes detected`,
      scoreDelta: 0,
      qualityImproved: newRows.length >= oldRows.length,
      newRisks
    };
  } catch (error) {
    return {
      hasDifferences: true,
      diffs: [{ type: 'changed', path: 'parse_error', oldValue: String(error) }],
      claimChanges: [],
      summary: 'Failed to compare CSV files',
      scoreDelta: 0,
      qualityImproved: false,
      newRisks: ['Parse error']
    };
  }
}

function parseCSV(content: string): string[][] {
  const lines = content.split('\n').filter(l => l.trim());
  return lines.map(line => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of line) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
}

function compareColumnChanges(oldRows: string[][], newRows: string[][], column: string): { added: string[]; removed: string[] } {
  const oldColIndex = oldRows[0]?.findIndex(c => c.toLowerCase().includes(column)) ?? -1;
  const newColIndex = newRows[0]?.findIndex(c => c.toLowerCase().includes(column)) ?? -1;
  
  if (oldColIndex === -1 || newColIndex === -1) {
    return { added: [], removed: [] };
  }
  
  const oldValues = oldRows.slice(1).map(r => r[oldColIndex]).filter(Boolean);
  const newValues = newRows.slice(1).map(r => r[newColIndex]).filter(Boolean);
  
  const added = newValues.filter(v => !oldValues.includes(v));
  const removed = oldValues.filter(v => !newValues.includes(v));
  
  return { added, removed };
}

export async function compareStageOutputs(
  campaignSlug: string,
  stageId: string,
  oldRunId: string,
  newRunId: string
): Promise<ComparisonResult> {
  const campaignPath = path.join(CAMPAIGNS_DIR, campaignSlug);
  const contractsPath = 'D:\\Codex Folder\\digital-pr-agents\\system\\stage-contracts.json';
  
  let outputFile: string | undefined;
  
  try {
    const contractsData = await fs.readFile(contractsPath, 'utf-8');
    const contracts = JSON.parse(contractsData);
    outputFile = contracts.stages?.[stageId]?.produces?.[0];
  } catch {
    // Use default mapping
  }
  
  if (!outputFile) {
    const defaultFiles: Record<string, string> = {
      'S10_PITCH_DRAFTING': '10-pitch-draft.md',
      'S11_PITCH_OPTIMIZATION': '11-optimized-pitch.md',
      'S12_PACKAGE_ASSEMBLY': '12-outreach-package.json',
      'S13_VALIDATION': '13-validation-report.json'
    };
    outputFile = defaultFiles[stageId];
  }
  
  if (!outputFile) {
    return {
      hasDifferences: false,
      diffs: [],
      claimChanges: [],
      summary: 'No output file mapping found',
      scoreDelta: 0,
      qualityImproved: false,
      newRisks: []
    };
  }
  
  const oldPath = path.join(campaignPath, 'archive', stageId, oldRunId, outputFile);
  const newPath = path.join(campaignPath, outputFile);
  
  if (outputFile.endsWith('.json')) {
    return compareJsonFiles(oldPath, newPath);
  } else if (outputFile.endsWith('.csv')) {
    return compareCsvFiles(oldPath, newPath);
  } else {
    return compareMarkdownFiles(oldPath, newPath);
  }
}