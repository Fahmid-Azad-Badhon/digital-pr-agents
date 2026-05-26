/**
 * =============================================================================
 * RUNTIME HEALTH CHECK
 * =============================================================================
 * 
 * Validates system health on startup.
 * Checks brain files, schemas, campaign paths, permissions.
 * Reports drift detection and authority issues.
 * 
 * =============================================================================
 */

import fs from 'fs/promises';
import path from 'path';
import { validateBrainStack, detectBrainDrift, listDeprecatedBrainFiles } from './brainResolver.js';
import { validateAllStages } from './brainResolver.js';

const BRAIN_DIR = 'D:\\Codex Folder\\digital-pr-agents\\brain';
const SYSTEM_DIR = 'D:\\Codex Folder\\digital-pr-agents\\system';
const SCHEMAS_DIR = 'D:\\Codex Folder\\digital-pr-agents\\schemas';
const CAMPAIGN_ROOT = 'D:\\Codex Folder\\digital-pr-agents\\pitch-jobs';

export interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'critical';
  checks: HealthCheckItem[];
  timestamp: string;
}

export interface HealthCheckItem {
  check: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string[];
}

export async function runHealthCheck(): Promise<HealthCheckResult> {
  const checks: HealthCheckItem[] = [];
  
  const globalBrains = [
    '00_Global_Workflow_Brain.md',
    '02_Validation_And_Truth_Brain.md',
    '03_Journalist_Psychology_And_Emotional_Intelligence_Brain.md'
  ];
  
  let missingBrains: string[] = [];
  for (const brain of globalBrains) {
    const brainPath = path.join(BRAIN_DIR, brain);
    try {
      await fs.access(brainPath);
    } catch {
      missingBrains.push(brain);
    }
  }
  
  if (missingBrains.length > 0) {
    checks.push({
      check: 'Global Brains',
      status: 'fail',
      message: `Missing global brains: ${missingBrains.join(', ')}`,
      details: ['All global brains must exist before workflow can run']
    });
  } else {
    checks.push({
      check: 'Global Brains',
      status: 'pass',
      message: 'All global brains present'
    });
  }
  
  const stageResults = await validateAllStages();
  const stagesWithIssues = Object.entries(stageResults)
    .filter(([_, result]) => !result.valid)
    .map(([stage, result]) => ({ stage, errors: result.errors }));
  
  if (stagesWithIssues.length > 0) {
    checks.push({
      check: 'Agent Brain Stacks',
      status: 'fail',
      message: `${stagesWithIssues.length} stages have missing agent brains`,
      details: stagesWithIssues.map(s => `${s.stage}: ${s.errors.join(', ')}`)
    });
  } else {
    checks.push({
      check: 'Agent Brain Stacks',
      status: 'pass',
      message: 'All stage brain stacks valid'
    });
  }
  
  const driftResult = await detectBrainDrift();
  if (driftResult.driftDetected) {
    checks.push({
      check: 'Brain Drift Detection',
      status: 'warning',
      message: 'Duplicate brain files detected in legacy paths',
      details: driftResult.duplicateGroups.map(g => `${g.canonicalFile}: ${g.duplicates.join(', ')}`)
    });
  } else {
    checks.push({
      check: 'Brain Drift Detection',
      status: 'pass',
      message: 'No brain drift detected'
    });
  }
  
  const deprecatedFiles = await listDeprecatedBrainFiles();
  if (deprecatedFiles.length > 0) {
    checks.push({
      check: 'Deprecated Brain Files',
      status: 'warning',
      message: `${deprecatedFiles.length} files in deprecated paths`,
      details: deprecatedFiles.slice(0, 10)
    });
  } else {
    checks.push({
      check: 'Deprecated Brain Files',
      status: 'pass',
      message: 'No deprecated brain files found'
    });
  }
  
  const schemaFiles = ['campaign-brief.schema.json', 'campaign-intake.schema.json', 'extracted-data.schema.json'];
  let missingSchemas: string[] = [];
  for (const schema of schemaFiles) {
    const schemaPath = path.join(SCHEMAS_DIR, schema);
    try {
      await fs.access(schemaPath);
    } catch {
      missingSchemas.push(schema);
    }
  }
  
  if (missingSchemas.length > 0) {
    checks.push({
      check: 'Core Schemas',
      status: 'fail',
      message: `Missing core schemas: ${missingSchemas.join(', ')}`
    });
  } else {
    checks.push({
      check: 'Core Schemas',
      status: 'pass',
      message: 'All core schemas present'
    });
  }
  
  try {
    await fs.access(CAMPAIGN_ROOT);
    checks.push({
      check: 'Campaign Root',
      status: 'pass',
      message: 'Campaign root accessible'
    });
  } catch {
    checks.push({
      check: 'Campaign Root',
      status: 'fail',
      message: 'Campaign root not accessible'
    });
  }
  
  const criticalFailures = checks.filter(c => c.status === 'fail').length;
  const warnings = checks.filter(c => c.status === 'warning').length;
  
  let overallStatus: 'healthy' | 'warning' | 'critical';
  if (criticalFailures > 0) {
    overallStatus = 'critical';
  } else if (warnings > 0) {
    overallStatus = 'warning';
  } else {
    overallStatus = 'healthy';
  }
  
  return {
    status: overallStatus,
    checks,
    timestamp: new Date().toISOString()
  };
}

export function formatHealthCheck(result: HealthCheckResult): string {
  let output = `=== SYSTEM HEALTH CHECK ===\n`;
  output += `Status: ${result.status.toUpperCase()}\n`;
  output += `Timestamp: ${result.timestamp}\n\n`;
  
  for (const check of result.checks) {
    const icon = check.status === 'pass' ? '✓' : check.status === 'warning' ? '⚠' : '✗';
    output += `${icon} ${check.check}: ${check.message}\n`;
    if (check.details && check.details.length > 0) {
      for (const detail of check.details.slice(0, 5)) {
        output += `    - ${detail}\n`;
      }
      if (check.details.length > 5) {
        output += `    ... and ${check.details.length - 5} more\n`;
      }
    }
  }
  
  return output;
}

export async function isSystemHealthy(): Promise<boolean> {
  const result = await runHealthCheck();
  return result.status !== 'critical';
}
