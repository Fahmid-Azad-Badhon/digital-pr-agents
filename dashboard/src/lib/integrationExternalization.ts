export type ExternalizationMode = 'local' | 'staging' | 'production';

type IntegrationBlock = {
  name: string;
  ready: boolean;
  blockers: string[];
};

export type ExternalizationStatus = {
  mode: ExternalizationMode;
  productionExternalizationReady: boolean;
  blockers: string[];
  integrations: {
    google: IntegrationBlock;
    muckrack: IntegrationBlock;
  };
};

function hasEnv(name: string): boolean {
  const value = process.env[name];
  return Boolean(value && value.trim().length > 0);
}

function resolveMode(): ExternalizationMode {
  const raw = (process.env.EXTERNALIZATION_MODE || '').toLowerCase();
  if (raw === 'production' || raw === 'staging' || raw === 'local') {
    return raw;
  }
  return process.env.NODE_ENV === 'production' ? 'production' : 'local';
}

function evaluateGoogle(mode: ExternalizationMode): IntegrationBlock {
  const blockers: string[] = [];
  if (!hasEnv('GOOGLE_CLIENT_ID')) blockers.push('GOOGLE_CLIENT_ID missing');
  if (!hasEnv('GOOGLE_CLIENT_SECRET')) blockers.push('GOOGLE_CLIENT_SECRET missing');
  if (!hasEnv('GOOGLE_REFRESH_TOKEN')) blockers.push('GOOGLE_REFRESH_TOKEN missing');
  if (!hasEnv('GOOGLE_REDIRECT_URI')) blockers.push('GOOGLE_REDIRECT_URI missing');

  if (mode !== 'local' && !hasEnv('GOOGLE_OAUTH_APP_VERIFIED')) {
    blockers.push('GOOGLE_OAUTH_APP_VERIFIED missing for non-local mode');
  }
  if (mode === 'production' && !hasEnv('GOOGLE_OAUTH_PUBLISH_STATUS')) {
    blockers.push('GOOGLE_OAUTH_PUBLISH_STATUS missing for production mode');
  }

  return {
    name: 'google',
    ready: blockers.length === 0,
    blockers,
  };
}

function evaluateMuckrack(mode: ExternalizationMode): IntegrationBlock {
  const blockers: string[] = [];
  const hasApiKey = hasEnv('MUCKRACK_API_KEY');
  const hasSession = hasEnv('MUCKRACK_SESSION_COOKIE');
  const hasEmail = hasEnv('MUCKRACK_EMAIL');
  const hasDebug = hasEnv('MUCKRACK_DEBUG_PORT') || hasEnv('MUCKRACK_CHROME_PROFILE_DIR');

  if (!(hasApiKey || hasSession || hasEmail || hasDebug)) {
    blockers.push('No Muck Rack auth strategy configured');
  }
  if (mode !== 'local' && !hasEnv('MUCKRACK_COLLECTION_CONCURRENCY')) {
    blockers.push('MUCKRACK_COLLECTION_CONCURRENCY missing for non-local mode');
  }
  if (mode !== 'local' && !hasEnv('MUCKRACK_MAX_RETRIES')) {
    blockers.push('MUCKRACK_MAX_RETRIES missing for non-local mode');
  }
  if (mode === 'production' && !hasEnv('MUCKRACK_ROBUSTNESS_APPROVED')) {
    blockers.push('MUCKRACK_ROBUSTNESS_APPROVED missing for production mode');
  }

  return {
    name: 'muckrack',
    ready: blockers.length === 0,
    blockers,
  };
}

export function getExternalizationStatus(): ExternalizationStatus {
  const mode = resolveMode();
  const google = evaluateGoogle(mode);
  const muckrack = evaluateMuckrack(mode);
  const blockers = [...google.blockers, ...muckrack.blockers];

  return {
    mode,
    productionExternalizationReady: blockers.length === 0,
    blockers,
    integrations: {
      google,
      muckrack,
    },
  };
}

