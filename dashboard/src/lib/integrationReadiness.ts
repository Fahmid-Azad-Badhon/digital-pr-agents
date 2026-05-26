/**
 * =============================================================================
 * Integration Readiness Checks
 * =============================================================================
 *
 * Real checks for:
 * - Muck Rack (Chrome debug port, session, scripts)
 * - Google OAuth (tokens, credentials)
 * - Script/runtime availability
 *
 * These replace the placeholder TODOs in campaignStateService.
 *
 * =============================================================================
 */

import fs from 'fs/promises';
import path from 'path';
import { PITCH_JOBS_ROOT, BROWSER_TOOLS_ROOT, DATA_ROOT, SCRIPTS_ROOT } from './requestGuard';

export type IntegrationStatus = 'ready' | 'not_configured' | 'session_expired' | 'token_expired' | 'missing' | 'failed';

export interface IntegrationReadinessResult {
  muckrack: IntegrationStatus;
  googleOAuth: IntegrationStatus;
  scripts: IntegrationStatus;
  details: {
    muckrack?: {
      chromeDebugPort?: string;
      sessionStatus?: string;
      scriptPath?: string;
      error?: string;
    };
    googleOAuth?: {
      tokenPath?: string;
      clientIdConfigured?: boolean;
      error?: string;
    };
    scripts?: {
      availableScripts?: string[];
      missingScripts?: string[];
      error?: string;
    };
  };
}

// Check if Muck Rack integration is ready
async function checkMuckRackReadiness(): Promise<{ status: IntegrationStatus; details: IntegrationReadinessResult['details']['muckrack'] }> {
  const details: IntegrationReadinessResult['details']['muckrack'] = {};

  // Check for Chrome debug port configuration
  const chromePort = process.env.CHROME_DEBUG_PORT || process.env.MUCKRACK_DEBUG_PORT || process.env.PUPPETEER_DEBUG_PORT;
  const chromeHost = process.env.CHROME_HOST || 'localhost';

  // Check for required scripts
  const scriptsPath = BROWSER_TOOLS_ROOT;
  let scriptPathExists = false;
  try {
    const stats = await fs.stat(scriptsPath);
    scriptPathExists = stats.isDirectory();
  } catch {
    scriptPathExists = false;
  }

  // Check for Muck Rack specific scripts
  const muckrackScripts = ['import_muckrack_output.cmd', 'collect_muckrack_data.cmd'];
  const availableScripts: string[] = [];
  const missingScripts: string[] = [];

  if (scriptPathExists) {
    for (const script of muckrackScripts) {
      const scriptFile = path.join(scriptsPath, script);
      try {
        await fs.access(scriptFile);
        availableScripts.push(script);
      } catch {
        missingScripts.push(script);
      }
    }
  } else {
    missingScripts.push(...muckrackScripts);
  }

  details.scriptPath = scriptsPath;

  // Determine status
  if (!chromePort) {
    return {
      status: 'not_configured',
      details: {
        ...details,
        chromeDebugPort: undefined,
        sessionStatus: 'no debug port configured',
        error: 'Chrome debug port not configured'
      }
    };
  }

  if (!scriptPathExists || missingScripts.length > 0) {
    return {
      status: 'not_configured',
      details: {
        ...details,
        sessionStatus: 'scripts missing',
        error: `Missing scripts: ${missingScripts.join(', ')}`
      }
    };
  }

  // Check if output directory exists and has recent data
  const outputPath = path.join(PITCH_JOBS_ROOT, 'source-files', 'journalist-intel');
  let hasRecentData = false;
  try {
    const stats = await fs.stat(outputPath);
    hasRecentData = stats.isDirectory();
    if (hasRecentData) {
      const files = await fs.readdir(outputPath);
      // Check for files created in last 24 hours
      const recentFiles = files.filter(async (f) => {
        const fileStat = await fs.stat(path.join(outputPath, f));
        const ageHours = (Date.now() - fileStat.mtimeMs) / (1000 * 60 * 60);
        return ageHours < 24;
      });
      hasRecentData = recentFiles.length > 0;
    }
  } catch {
    hasRecentData = false;
  }

  return {
    status: hasRecentData ? 'ready' : 'not_configured',
    details: {
      ...details,
      chromeDebugPort: chromePort,
      sessionStatus: hasRecentData ? 'active' : 'no recent data',
      error: hasRecentData ? undefined : 'No recent Muck Rack data'
    }
  };
}

// Check if Google OAuth is ready
async function checkGoogleOAuthReadiness(): Promise<{ status: IntegrationStatus; details: IntegrationReadinessResult['details']['googleOAuth'] }> {
  const details: IntegrationReadinessResult['details']['googleOAuth'] = {};

  // Check for OAuth credentials
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const detailsTokenPath = path.join(DATA_ROOT, 'google-token.json');

  // Validate redirect URI matches actual server port
  if (redirectUri) {
    const serverPort = process.env.PORT || process.env.NEXT_PUBLIC_PORT || '3000';
    const redirectPort = new URL(redirectUri).port || '443';
    if (redirectPort !== serverPort) {
      return {
        status: 'not_configured' as IntegrationStatus,
        details: {
          ...details,
          error: `GOOGLE_REDIRECT_URI port (${redirectPort}) does not match server port (${serverPort})`,
        },
      };
    }
  }

  details.clientIdConfigured = !!clientId;

  // Check for token file
  let tokenExists = false;
  let tokenValid = false;
  try {
    const stats = await fs.stat(detailsTokenPath);
    tokenExists = stats.isFile();
    if (tokenExists) {
      const tokenContent = await fs.readFile(detailsTokenPath, 'utf-8');
      const token = JSON.parse(tokenContent);
      // Check if token has expiry and if it's still valid
      if (token.expiry_date) {
        tokenValid = token.expiry_date > Date.now();
      } else if (token.access_token) {
        tokenValid = true; // Assume valid if access token exists
      }
    }
  } catch {
    tokenExists = false;
  }

  details.tokenPath = detailsTokenPath;

  if (!clientId && !clientSecret && !tokenExists) {
    return {
      status: 'not_configured',
      details: {
        ...details,
        error: 'No Google OAuth credentials or token configured'
      }
    };
  }

  if (!clientId) {
    return {
      status: 'not_configured',
      details: {
        ...details,
        error: 'Google Client ID not configured'
      }
    };
  }

  if (!tokenExists) {
    return {
      status: 'not_configured',
      details: {
        ...details,
        error: 'Google OAuth token file not found'
      }
    };
  }

  if (!tokenValid) {
    return {
      status: 'token_expired',
      details: {
        ...details,
        error: 'Google OAuth token has expired'
      }
    };
  }

  return {
    status: 'ready',
    details: {
      ...details,
      error: undefined
    }
  };
}

// Check if scripts are ready
async function checkScriptsReadiness(): Promise<{ status: IntegrationStatus; details: IntegrationReadinessResult['details']['scripts'] }> {
  const details: IntegrationReadinessResult['details']['scripts'] = {};

  // Check for script directories
  const scriptDirs = [
    SCRIPTS_ROOT,
    path.join(process.cwd(), 'browser-tools'),
    BROWSER_TOOLS_ROOT
  ];

  const availableScripts: string[] = [];
  const errors: string[] = [];

  for (const dir of scriptDirs) {
    try {
      const stats = await fs.stat(dir);
      if (stats.isDirectory()) {
        const files = await fs.readdir(dir);
        // Look for .cmd, .ps1, .sh scripts
        const scripts = files.filter(f => f.endsWith('.cmd') || f.endsWith('.ps1') || f.endsWith('.sh'));
        availableScripts.push(...scripts.map(s => path.join(dir, s)));
      }
    } catch {
      // Directory doesn't exist, skip
    }
  }

  details.availableScripts = availableScripts.map(s => path.basename(s));
  details.missingScripts = [];

  // Check for required critical scripts
  // Note: actual script names use hyphens, not underscores (e.g. draft-study-input.cmd)
  const criticalScripts = [
    'draft-study-input.cmd',
    'import-muckrack-output.cmd',
    'draft-journalist-intel.cmd',
    'draft-pitch-draft.cmd'
  ];

  const missingCritical: string[] = [];
  for (const script of criticalScripts) {
    const found = availableScripts.some(s => s.includes(script));
    if (!found) {
      missingCritical.push(script);
    }
  }

  if (missingCritical.length > 0 && availableScripts.length === 0) {
    return {
      status: 'not_configured',
      details: {
        ...details,
        error: `Required scripts missing: ${missingCritical.join(', ')}`,
        missingScripts: missingCritical
      }
    };
  }

  return {
    status: availableScripts.length > 0 ? 'ready' : 'not_configured',
    details: {
      ...details,
      error: availableScripts.length > 0 ? undefined : 'No scripts found'
    }
  };
}

// Main function to get all integration readiness
export async function getIntegrationReadiness(): Promise<IntegrationReadinessResult> {
  const [muckrack, googleOAuth, scripts] = await Promise.all([
    checkMuckRackReadiness(),
    checkGoogleOAuthReadiness(),
    checkScriptsReadiness()
  ]);

  return {
    muckrack: muckrack.status,
    googleOAuth: googleOAuth.status,
    scripts: scripts.status,
    details: {
      muckrack: muckrack.details,
      googleOAuth: googleOAuth.details,
      scripts: scripts.details
    }
  };
}

// Check if a specific stage requires external integrations
export function stageRequiresIntegration(stage: number): boolean {
  // Stages 8-10 require external integrations
  return stage >= 8 && stage <= 10;
}

// Get blocked reason for integration-dependent stage
export async function getIntegrationBlockerReason(stage: number): Promise<{
  blocked: boolean;
  reason?: string;
  errorCode?: string;
  retryable: boolean;
} | null> {
  if (!stageRequiresIntegration(stage)) {
    return null;
  }

  const readiness = await getIntegrationReadiness();

  if (stage === 8 || stage === 9) {
    // Journalist collection/intelligence - requires Muck Rack
    if (readiness.muckrack !== 'ready') {
      return {
        blocked: true,
        reason: readiness.details.muckrack?.error || 'Muck Rack not ready',
        errorCode: 'MUCKRACK_NOT_READY',
        retryable: true
      };
    }
  }

  if (stage === 10) {
    // Pitch drafting - requires scripts
    if (readiness.scripts !== 'ready') {
      return {
        blocked: true,
        reason: readiness.details.scripts?.error || 'Scripts not ready',
        errorCode: 'SCRIPTS_NOT_READY',
        retryable: true
      };
    }
  }

  return null;
}