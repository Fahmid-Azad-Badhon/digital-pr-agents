import fs from 'fs';
import path from 'path';
import { SYSTEM_MODELS, SYSTEM_STAGE_ROUTING, STAGE_CONTRACTS } from './systemConfigLoader';
import { PITCH_JOBS_ROOT, DATA_ROOT, LOGS_ROOT } from '@/lib/requestGuard';

export interface PreFlightCheckResult {
  passed: boolean;
  checks: PreFlightCheck[];
  failedCriticalCount: number;
  failedWarningCount: number;
  canProceed: boolean;
  blockReason?: string;
}

export interface PreFlightCheck {
  category: string;
  check: string;
  status: 'pass' | 'fail' | 'warning';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  details?: string;
}

export async function runPreFlightChecks(campaignId?: string): Promise<PreFlightCheckResult> {
  const allChecks: PreFlightCheck[] = [];

  allChecks.push(await checkApiKeys());
  allChecks.push(checkModelIds());
  allChecks.push(checkRequiredFolders());
  allChecks.push(checkDashboardConnection());
  allChecks.push(checkAuditLogging());
  allChecks.push(checkS7HumanGate());
  allChecks.push(checkS13Validation());

  if (campaignId) {
    allChecks.push(checkCampaignBrief(campaignId));
    allChecks.push(checkPrimaryDataSource(campaignId));
  }

  const failedCritical = allChecks.filter(c => c.status === 'fail' && c.severity === 'critical');
  const failedWarning = allChecks.filter(c => c.status === 'fail' && c.severity === 'warning');
  const warnings = allChecks.filter(c => c.status === 'warning');

  return {
    passed: failedCritical.length === 0,
    checks: allChecks,
    failedCriticalCount: failedCritical.length,
    failedWarningCount: failedWarning.length + warnings.length,
    canProceed: failedCritical.length === 0,
    blockReason: failedCritical.length > 0 ? failedCritical[0].message : undefined
  };
}

async function checkApiKeys(): Promise<PreFlightCheck> {
  return {
    category: 'Configuration',
    check: 'API Keys Available',
    status: 'pass',
    severity: 'info',
    message: 'API keys can be provided at runtime'
  };
}

function checkModelIds(): PreFlightCheck {
  const modelsWithoutIds = Object.entries(SYSTEM_MODELS)
    .filter(([_, m]) => !m.modelId || m.modelId.trim() === '')
    .map(([key]) => key);

  if (modelsWithoutIds.length > 0) {
    return {
      category: 'Configuration',
      check: 'Model IDs Configured',
      status: 'fail',
      severity: 'critical',
      message: `Models missing modelId: ${modelsWithoutIds.join(', ')}`,
      details: 'Configure model IDs in /system/model-routing.config.json'
    };
  }

  const enabledProductionModels = Object.values(SYSTEM_MODELS)
    .filter(m => m.enabledInProductionWorkflow);

  if (enabledProductionModels.length === 0) {
    return {
      category: 'Configuration',
      check: 'Model IDs Configured',
      status: 'fail',
      severity: 'critical',
      message: 'No models enabled for production workflow',
      details: 'Enable at least one model in /system/model-routing.config.json'
    };
  }

  return {
    category: 'Configuration',
    check: 'Model IDs Configured',
    status: 'pass',
    severity: 'critical',
    message: `${enabledProductionModels.length} models configured for production`
  };
}

function checkRequiredFolders(): PreFlightCheck {
  const requiredPaths = [
    PITCH_JOBS_ROOT,
    DATA_ROOT,
    LOGS_ROOT
  ];

  const missingFolders: string[] = [];

  for (const p of requiredPaths) {
    try {
      if (!fs.existsSync(p)) {
        missingFolders.push(p);
      }
    } catch {
      missingFolders.push(p);
    }
  }

  if (missingFolders.length > 0) {
    return {
      category: 'File System',
      check: 'Required Folders Created',
      status: 'fail',
      severity: 'critical',
      message: `Missing folders: ${missingFolders.join(', ')}`,
      details: 'Create required directories before starting campaign'
    };
  }

  return {
    category: 'File System',
    check: 'Required Folders Created',
    status: 'pass',
    severity: 'info',
    message: 'All required system folders present',
    details: 'Verified: pitch-jobs, data, logs'
  };
}

function checkCampaignBrief(campaignId: string): PreFlightCheck {
  const briefPath = path.join(PITCH_JOBS_ROOT, campaignId, '00-brief.md');

  try {
    if (!fs.existsSync(briefPath)) {
      return {
        category: 'Campaign Data',
        check: 'Campaign Brief Present',
        status: 'fail',
        severity: 'critical',
        message: `Brief file not found: ${briefPath}`,
        details: 'Create 00-brief.md before starting campaign'
      };
    }

    const content = fs.readFileSync(briefPath, 'utf-8');
    if (content.length < 50) {
      return {
        category: 'Campaign Data',
        check: 'Campaign Brief Present',
        status: 'fail',
        severity: 'critical',
        message: 'Brief file exists but is empty or too small',
        details: 'Brief must contain at least 50 characters'
      };
    }

    return {
      category: 'Campaign Data',
      check: 'Campaign Brief Present',
      status: 'pass',
      severity: 'critical',
      message: 'Campaign brief is present and valid'
    };
  } catch {
    return {
      category: 'Campaign Data',
      check: 'Campaign Brief Present',
      status: 'fail',
      severity: 'critical',
      message: 'Error checking brief',
      details: 'Ensure brief file is readable'
    };
  }
}

function checkPrimaryDataSource(campaignId: string): PreFlightCheck {
  const sourcePath = path.join(PITCH_JOBS_ROOT, campaignId, 'source-files');

  try {
    if (!fs.existsSync(sourcePath)) {
      return {
        category: 'Campaign Data',
        check: 'Primary Data Source Present',
        status: 'warning',
        severity: 'warning',
        message: 'Source files folder not found',
        details: 'Create source-files/ folder with campaign data'
      };
    }

    const files = fs.readdirSync(sourcePath);
    if (files.length === 0) {
      return {
        category: 'Campaign Data',
        check: 'Primary Data Source Present',
        status: 'warning',
        severity: 'warning',
        message: 'Source files folder is empty',
        details: 'Add campaign data files to source-files/'
      };
    }

    return {
      category: 'Campaign Data',
      check: 'Primary Data Source Present',
      status: 'pass',
      severity: 'info',
      message: `Found ${files.length} source file(s)`
    };
  } catch {
    return {
      category: 'Campaign Data',
      check: 'Primary Data Source Present',
      status: 'warning',
      severity: 'warning',
      message: 'Error checking source'
    };
  }
}

function checkDashboardConnection(): PreFlightCheck {
  try {
    require('./db');
    return {
      category: 'Dashboard',
      check: 'Dashboard Connected',
      status: 'pass',
      severity: 'critical',
      message: 'Dashboard module available (initDatabase exported)'
    };
  } catch {
    return {
      category: 'Dashboard',
      check: 'Dashboard Connected',
      status: 'fail',
      severity: 'critical',
      message: 'Dashboard module not available',
      details: 'Ensure db.ts is properly configured'
    };
  }
}

function checkAuditLogging(): PreFlightCheck {
  const logPath = LOGS_ROOT;

  try {
    if (!fs.existsSync(logPath)) {
      fs.mkdirSync(logPath, { recursive: true });
    }

    const testLogFile = path.join(logPath, 'preflight-test.log');
    fs.writeFileSync(testLogFile, `Pre-flight test: ${new Date().toISOString()}\n`);
    fs.unlinkSync(testLogFile);

    return {
      category: 'Audit',
      check: 'Audit Logging Working',
      status: 'pass',
      severity: 'critical',
      message: 'Audit logging directory is writable'
    };
  } catch {
    return {
      category: 'Audit',
      check: 'Audit Logging Working',
      status: 'fail',
      severity: 'critical',
      message: 'Audit logging check failed',
      details: 'Ensure logs/ directory is writable'
    };
  }
}

function checkS7HumanGate(): PreFlightCheck {
  const s7Config = SYSTEM_STAGE_ROUTING['S7_PITCH_SELECTION_HUMAN_GATE'];
  const s7Contract = STAGE_CONTRACTS?.['S7_PITCH_SELECTION_HUMAN_GATE'];

  const isEnabled = s7Config?.requiresHumanApproval || s7Contract?.humanApprovalRequired;

  if (!isEnabled) {
    return {
      category: 'Workflow',
      check: 'S7 Human Gate Enabled',
      status: 'fail',
      severity: 'warning',
      message: 'S7 human gate is disabled',
      details: 'Enable human approval for pitch selection in /system/stage-contracts.json'
    };
  }

  return {
    category: 'Workflow',
    check: 'S7 Human Gate Enabled',
    status: 'pass',
    severity: 'critical',
    message: 'S7 human gate is properly configured'
  };
}

function checkS13Validation(): PreFlightCheck {
  const s13Config = SYSTEM_STAGE_ROUTING['S13_VALIDATION'];
  const s13Contract = STAGE_CONTRACTS?.['S13_VALIDATION'];

  const isEnabled = s13Config?.requiresHumanApproval || s13Contract?.humanApprovalRequired;

  if (!isEnabled) {
    return {
      category: 'Workflow',
      check: 'S13 Validation Enabled',
      status: 'fail',
      severity: 'warning',
      message: 'S13 validation gate is disabled',
      details: 'Enable validation stage in /system/stage-contracts.json'
    };
  }

  return {
    category: 'Workflow',
    check: 'S13 Validation Enabled',
    status: 'pass',
    severity: 'critical',
    message: 'S13 validation is properly configured'
  };
}

export function formatPreFlightReport(result: PreFlightCheckResult): string {
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('                    PRE-FLIGHT CHECK REPORT');
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('');

  if (result.passed) {
    lines.push('✅ ALL CHECKS PASSED - Ready to proceed');
  } else {
    lines.push('❌ PRE-FLIGHT FAILED - Cannot start campaign');
  }
  lines.push('');

  lines.push(`Critical Failures: ${result.failedCriticalCount}`);
  lines.push(`Warnings: ${result.failedWarningCount}`);
  lines.push('');

  const byCategory = result.checks.reduce((acc, check) => {
    if (!acc[check.category]) acc[check.category] = [];
    acc[check.category].push(check);
    return acc;
  }, {} as Record<string, PreFlightCheck[]>);

  for (const [category, categoryChecks] of Object.entries(byCategory)) {
    lines.push(`─── ${category} ───`);

    for (const check of categoryChecks) {
      const icon = check.status === 'pass' ? '✅' : check.status === 'fail' ? '❌' : '⚠️';
      const severity = check.severity.toUpperCase();
      lines.push(`${icon} [${severity}] ${check.check}: ${check.message}`);
    }
    lines.push('');
  }

  if (result.blockReason) {
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push(`BLOCK REASON: ${result.blockReason}`);
    lines.push('═══════════════════════════════════════════════════════════');
  }

  return lines.join('\n');
}
