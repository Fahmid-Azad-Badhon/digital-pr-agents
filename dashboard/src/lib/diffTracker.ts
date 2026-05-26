import fs from 'fs/promises';
import path from 'path';
import { DATA_ROOT } from '@/lib/requestGuard';

export interface DiffEntry {
  stageId: string;
  originalFile: string;
  outputFile: string;
  changes: ChangeRecord[];
  timestamp: string;
  modelUsed: string;
  promptVersion: string;
}

export interface ChangeRecord {
  type: 'added' | 'removed' | 'modified' | 'preserved';
  section: string;
  before?: string;
  after?: string;
  preserved?: boolean;
}

const DIFF_LOG_PATH = path.join(DATA_ROOT, 'diff-logs');

export async function initDiffTracking(): Promise<void> {
  await fs.mkdir(DIFF_LOG_PATH, { recursive: true });
}

export async function logStageDiff(
  campaignId: string,
  stageId: string,
  originalFile: string,
  outputFile: string,
  changes: ChangeRecord[],
  modelUsed: string,
  promptVersion: string
): Promise<void> {
  const diffEntry: DiffEntry = {
    stageId,
    originalFile,
    outputFile,
    changes,
    timestamp: new Date().toISOString(),
    modelUsed,
    promptVersion
  };

  const logFile = path.join(DIFF_LOG_PATH, `${campaignId}-diffs.json`);
  
  let existingDiffs: DiffEntry[] = [];
  
  try {
    const content = await fs.readFile(logFile, 'utf-8');
    existingDiffs = JSON.parse(content);
  } catch {
    existingDiffs = [];
  }

  existingDiffs.push(diffEntry);
  await fs.writeFile(logFile, JSON.stringify(existingDiffs, null, 2));
}

export async function getCampaignDiffs(campaignId: string): Promise<DiffEntry[]> {
  const logFile = path.join(DIFF_LOG_PATH, `${campaignId}-diffs.json`);
  
  try {
    const content = await fs.readFile(logFile, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

export function computeTextDiff(original: string, optimized: string): ChangeRecord[] {
  const changes: ChangeRecord[] = [];
  
  const originalLines = original.split('\n');
  const optimizedLines = optimized.split('\n');
  
  const origSet = new Set(originalLines);
  const optSet = new Set(optimizedLines);
  
  for (const line of optimizedLines) {
    if (!origSet.has(line)) {
      if (line.trim()) {
        changes.push({
          type: 'added',
          section: 'content',
          after: line
        });
      }
    }
  }
  
  for (const line of originalLines) {
    if (!optSet.has(line) && line.trim()) {
      changes.push({
        type: 'removed',
        section: 'content',
        before: line
      });
    }
  }
  
  if (changes.length === 0) {
    changes.push({
      type: 'preserved',
      section: 'all',
      preserved: true
    });
  }
  
  return changes;
}

export function formatDiffReport(diffs: DiffEntry[]): string {
  const lines: string[] = [];
  
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('                    OUTPUT DIFF REPORT');
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('');
  
  for (const diff of diffs) {
    lines.push(`Stage: ${diff.stageId}`);
    lines.push(`Model: ${diff.modelUsed} | Prompt: ${diff.promptVersion}`);
    lines.push(`Original: ${diff.originalFile} → Output: ${diff.outputFile}`);
    lines.push('');
    
    const addedCount = diff.changes.filter(c => c.type === 'added').length;
    const removedCount = diff.changes.filter(c => c.type === 'removed').length;
    const preservedCount = diff.changes.filter(c => c.type === 'preserved').length;
    
    lines.push(`  Added: ${addedCount} | Removed: ${removedCount} | Preserved: ${preservedCount}`);
    lines.push('');
  }
  
  return lines.join('\n');
}