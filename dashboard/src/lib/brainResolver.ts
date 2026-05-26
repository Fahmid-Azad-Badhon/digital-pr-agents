/**
 * =============================================================================
 * BRAIN RESOLVER
 * =============================================================================
 * 
 * Resolves correct brain files for each stage.
 * Enforces loading order.
 * Rejects duplicate non-authoritative brain loading.
 * Warns if duplicate brain files exist in legacy folders.
 * Returns clear error if required brain is missing.
 * 
 * =============================================================================
 */

import fs from 'fs/promises';
import path from 'path';

const BRAIN_DIR = 'D:\\Codex Folder\\digital-pr-agents\\brain';
const SYSTEM_DIR = 'D:\\Codex Folder\\digital-pr-agents\\system';

export interface BrainManifest {
  version: string;
  globalBrains: string[];
  sharedBrains: string[];
  agentBrains: Record<string, string>;
  loadingOrder: Record<string, string[]>;
  deprecatedBrainPaths: string[];
  validationRules: string[];
  authorityRule: string;
}

export interface BrainStack {
  stageId: string;
  globalBrains: string[];
  sharedBrains: string[];
  agentBrain: string;
  loadingOrder: string[];
}

export interface BrainValidationResult {
  valid: boolean;
  stageId: string;
  globalBrainsFound: string[];
  globalBrainsMissing: string[];
  agentBrainFound: boolean;
  agentBrainPath: string | null;
  errors: string[];
  warnings: string[];
}

let cachedManifest: BrainManifest | null = null;

async function loadBrainManifest(): Promise<BrainManifest> {
  if (cachedManifest) return cachedManifest;
  
  const manifestPath = path.join(BRAIN_DIR, 'brain-manifest.json');
  try {
    const data = await fs.readFile(manifestPath, 'utf-8');
    cachedManifest = JSON.parse(data);
    return cachedManifest!;
  } catch (error) {
    console.error('Failed to load brain manifest:', error);
    throw new Error('Brain manifest not found. Run setup first.');
  }
}

export function getGlobalBrains(): string[] {
  if (!cachedManifest) return [];
  return cachedManifest.globalBrains;
}

export function getAgentBrain(stageId: string): string | null {
  if (!cachedManifest) return null;
  return cachedManifest.agentBrains[stageId] || null;
}

export function getLoadingOrder(stageId: string): string[] {
  if (!cachedManifest) return [];
  return cachedManifest.loadingOrder[stageId] || [];
}

export function getAllAgentBrainPaths(): Record<string, string> {
  if (!cachedManifest) return {};
  return { ...cachedManifest.agentBrains };
}

export async function resolveBrainStack(stageId: string): Promise<BrainStack> {
  const manifest = await loadBrainManifest();
  
  const loadingOrder = manifest.loadingOrder[stageId] || [];
  const agentBrainPath = manifest.agentBrains[stageId];
  
  const globalBrains = manifest.globalBrains.filter(b => 
    loadingOrder.some(orderKey => b.includes(orderKey))
  );
  
  return {
    stageId,
    globalBrains,
    sharedBrains: manifest.sharedBrains,
    agentBrain: agentBrainPath || '',
    loadingOrder
  };
}

export async function validateBrainStack(stageId: string): Promise<BrainValidationResult> {
  const manifest = await loadBrainManifest();
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const globalBrainsFound: string[] = [];
  const globalBrainsMissing: string[] = [];
  
  for (const brainFile of manifest.globalBrains) {
    const brainPath = path.join(BRAIN_DIR, brainFile);
    try {
      await fs.access(brainPath);
      globalBrainsFound.push(brainFile);
    } catch {
      globalBrainsMissing.push(brainFile);
    }
  }
  
  if (globalBrainsMissing.length > 0) {
    errors.push(`Missing global brains: ${globalBrainsMissing.join(', ')}`);
  }
  
  const agentBrainPath = manifest.agentBrains[stageId];
  let agentBrainFound = false;
  
  if (agentBrainPath) {
    const fullPath = path.join(BRAIN_DIR, agentBrainPath);
    try {
      await fs.access(fullPath);
      agentBrainFound = true;
    } catch {
      errors.push(`Missing agent brain for ${stageId}: ${agentBrainPath}`);
    }
  } else {
    errors.push(`No agent brain mapping found for stage: ${stageId}`);
  }
  
  const deprecatedPaths = manifest.deprecatedBrainPaths || [];
  for (const deprecatedPath of deprecatedPaths) {
    const fullDeprecatedPath = path.join('D:\\Codex Folder\\digital-pr-agents', deprecatedPath);
    try {
      const files = await fs.readdir(fullDeprecatedPath);
      if (files.length > 0) {
        warnings.push(`Deprecated brain path has files: ${deprecatedPath} (${files.length} files). These should not be loaded as primary truth.`);
      }
    } catch {
      // Directory doesn't exist, skip
    }
  }
  
  return {
    valid: errors.length === 0,
    stageId,
    globalBrainsFound,
    globalBrainsMissing,
    agentBrainFound,
    agentBrainPath: agentBrainPath || null,
    errors,
    warnings
  };
}

export async function detectBrainDrift(): Promise<{
  driftDetected: boolean;
  duplicateGroups: {
    canonicalFile: string;
    duplicates: string[];
    contentMatches: boolean;
    severity: string;
  }[];
}> {
  const manifest = await loadBrainManifest();
  const duplicateGroups: any[] = [];
  
  const canonicalBrainFiles = [
    ...manifest.globalBrains,
    ...Object.values(manifest.agentBrains)
  ];
  
  const legacyPaths = [
    'D:\\Codex Folder\\digital-pr-agents\\dashboard\\src\\brain',
    'D:\\Codex Folder\\digital-pr-agents\\dashboard\\skills\\agent-brains'
  ];
  
  for (const canonical of canonicalBrainFiles) {
    const canonicalPath = path.join(BRAIN_DIR, canonical);
    let canonicalContent: string | null = null;
    
    try {
      canonicalContent = await fs.readFile(canonicalPath, 'utf-8');
    } catch {
      continue;
    }
    
    const duplicates: string[] = [];
    
    for (const legacyBase of legacyPaths) {
      const legacyPath = path.join(legacyBase, path.basename(canonical));
      try {
        const legacyContent = await fs.readFile(legacyPath, 'utf-8');
        if (legacyContent && canonicalContent && legacyContent !== canonicalContent) {
          duplicates.push(legacyPath);
        }
      } catch {
        // File doesn't exist in legacy path, that's fine
      }
    }
    
    if (duplicates.length > 0) {
      duplicateGroups.push({
        canonicalFile: canonical,
        duplicates,
        contentMatches: false,
        severity: duplicates.length > 1 ? 'high' : 'medium'
      });
    }
  }
  
  return {
    driftDetected: duplicateGroups.length > 0,
    duplicateGroups
  };
}

export async function listDeprecatedBrainFiles(): Promise<string[]> {
  const manifest = await loadBrainManifest();
  const deprecatedFiles: string[] = [];
  
  for (const deprecatedPath of manifest.deprecatedBrainPaths) {
    const fullPath = path.join('D:\\Codex Folder\\digital-pr-agents', deprecatedPath);
    try {
      const files = await fs.readdir(fullPath);
      for (const file of files) {
        deprecatedFiles.push(path.join(deprecatedPath, file));
      }
    } catch {
      // Directory doesn't exist
    }
  }
  
  return deprecatedFiles;
}

export async function validateAllStages(): Promise<Record<string, BrainValidationResult>> {
  const manifest = await loadBrainManifest();
  const stages = Object.keys(manifest.agentBrains);
  const results: Record<string, BrainValidationResult> = {};
  
  for (const stageId of stages) {
    results[stageId] = await validateBrainStack(stageId);
  }
  
  return results;
}
