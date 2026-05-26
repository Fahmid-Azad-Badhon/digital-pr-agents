import fs from 'fs/promises';
import path from 'path';
import { ok } from '@/lib/apiResponse';
import { REPO_ROOT } from '@/lib/requestGuard';
import { getExternalizationStatus } from '@/lib/integrationExternalization';

function hasEnv(name: string) {
  const value = process.env[name];
  return Boolean(value && value.trim().length > 0);
}

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  const scriptsRoot = path.join(REPO_ROOT, 'scripts');

  const googleExportScript = path.join(scriptsRoot, 'export-google-doc.cmd');
  const muckrackImportScript = path.join(scriptsRoot, 'import-muckrack-output.cmd');
  const muckrackCollectorScript = path.join(scriptsRoot, 'collect-muckrack-journalists.cmd');

  const [googleScriptExists, muckrackImportExists, muckrackCollectorExists] = await Promise.all([
    fileExists(googleExportScript),
    fileExists(muckrackImportScript),
    fileExists(muckrackCollectorScript),
  ]);

  const googleOAuthConfigured =
    hasEnv('GOOGLE_CLIENT_ID') &&
    hasEnv('GOOGLE_CLIENT_SECRET') &&
    hasEnv('GOOGLE_REFRESH_TOKEN');

  const googleClientConfigured =
    hasEnv('GOOGLE_CLIENT_ID') &&
    hasEnv('GOOGLE_CLIENT_SECRET');
  const googleRefreshTokenConfigured = hasEnv('GOOGLE_REFRESH_TOKEN');
  const googleRedirectConfigured = hasEnv('GOOGLE_REDIRECT_URI');

  const muckrackConfigured =
    hasEnv('MUCKRACK_API_KEY') ||
    hasEnv('MUCKRACK_SESSION_COOKIE') ||
    hasEnv('MUCKRACK_EMAIL');

  const muckrackApiKeyConfigured = hasEnv('MUCKRACK_API_KEY');
  const muckrackSessionConfigured = hasEnv('MUCKRACK_SESSION_COOKIE');
  const muckrackEmailConfigured = hasEnv('MUCKRACK_EMAIL');
  const muckrackPasswordConfigured = hasEnv('MUCKRACK_PASSWORD');
  const muckrackDebugPortConfigured = hasEnv('MUCKRACK_DEBUG_PORT');
  const muckrackDebugProfileConfigured = hasEnv('MUCKRACK_CHROME_PROFILE_DIR');
  const muckrackDebugBrowserConfigured = muckrackDebugPortConfigured || muckrackDebugProfileConfigured;

  const google = {
    scriptExists: googleScriptExists,
    clientConfigured: googleClientConfigured,
    refreshTokenConfigured: googleRefreshTokenConfigured,
    redirectConfigured: googleRedirectConfigured,
    oauthConfigured: googleOAuthConfigured,
    ready: googleScriptExists && googleOAuthConfigured,
  };

  const muckrack = {
    importScriptExists: muckrackImportExists,
    collectorScriptExists: muckrackCollectorExists,
    apiKeyConfigured: muckrackApiKeyConfigured,
    sessionCookieConfigured: muckrackSessionConfigured,
    emailConfigured: muckrackEmailConfigured,
    passwordConfigured: muckrackPasswordConfigured,
    debugBrowserConfigured: muckrackDebugBrowserConfigured,
    credentialsConfigured: muckrackConfigured,
    ready: muckrackImportExists && muckrackCollectorExists && (muckrackConfigured || muckrackDebugBrowserConfigured),
  };

  const externalization = getExternalizationStatus();

  return ok({
    generatedAt: new Date().toISOString(),
    integrations: {
      googleDocs: google,
      muckRack: muckrack,
    },
    externalization,
    overallReady: google.ready && muckrack.ready,
  });
}
