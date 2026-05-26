import { spawn, spawnSync } from 'child_process';

const dashboardRoot = process.cwd();

function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(baseUrl, timeoutMs = 90_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const res = await fetchWithTimeout(`${baseUrl}/api/integrations/health`);
      if (res.ok) return;
    } catch {
      // retry
    }
    await sleep(900);
  }
  throw new Error(`Timed out waiting for server at ${baseUrl}`);
}

async function fetchWithTimeout(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function killProcessTree(pid) {
  if (!pid) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore', shell: false });
    return;
  }
  try {
    process.kill(pid, 'SIGTERM');
  } catch {
    // no-op
  }
}

async function startServer(port, envOverrides) {
  const env = {
    ...process.env,
    NEXT_TELEMETRY_DISABLED: '1',
    ...envOverrides,
  };

  const child = process.platform === 'win32'
    ? spawn('cmd.exe', ['/c', `npx next dev -p ${port}`], {
      cwd: dashboardRoot,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    })
    : spawn('npx', ['next', 'dev', '-p', String(port)], {
      cwd: dashboardRoot,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    });

  let startupLogs = '';
  child.stdout?.on('data', (chunk) => {
    startupLogs += chunk.toString();
    if (startupLogs.length > 5000) startupLogs = startupLogs.slice(-5000);
  });
  child.stderr?.on('data', (chunk) => {
    startupLogs += chunk.toString();
    if (startupLogs.length > 5000) startupLogs = startupLogs.slice(-5000);
  });

  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    await waitForServer(baseUrl, 120_000);
  } catch (error) {
    const wrapped = new Error(error instanceof Error ? error.message : String(error));
    wrapped.startupLogs = startupLogs;
    throw wrapped;
  }

  return {
    child,
    baseUrl,
    startupLogs,
    async stop() {
      killProcessTree(child.pid);
      await sleep(1200);
    },
  };
}

function validateContractShape(payload, failures, label) {
  assert(payload && typeof payload === 'object', `${label}: payload must be object`, failures);
  assert(payload?.success === true, `${label}: success must be true`, failures);

  const data = payload?.data;
  assert(data && typeof data === 'object', `${label}: data must be object`, failures);
  assert(typeof data?.overallReady === 'boolean', `${label}: overallReady must be boolean`, failures);

  const google = data?.integrations?.googleDocs;
  const muck = data?.integrations?.muckRack;
  assert(google && typeof google === 'object', `${label}: googleDocs block missing`, failures);
  assert(muck && typeof muck === 'object', `${label}: muckRack block missing`, failures);

  const googleFlags = ['scriptExists', 'clientConfigured', 'refreshTokenConfigured', 'redirectConfigured', 'oauthConfigured', 'ready'];
  const muckFlags = ['importScriptExists', 'collectorScriptExists', 'apiKeyConfigured', 'sessionCookieConfigured', 'emailConfigured', 'passwordConfigured', 'debugBrowserConfigured', 'credentialsConfigured', 'ready'];

  for (const key of googleFlags) {
    assert(typeof google?.[key] === 'boolean', `${label}: googleDocs.${key} must be boolean`, failures);
  }
  for (const key of muckFlags) {
    assert(typeof muck?.[key] === 'boolean', `${label}: muckRack.${key} must be boolean`, failures);
  }

  const externalization = data?.externalization;
  assert(externalization && typeof externalization === 'object', `${label}: externalization block missing`, failures);
  assert(typeof externalization?.mode === 'string', `${label}: externalization.mode must be string`, failures);
  assert(typeof externalization?.productionExternalizationReady === 'boolean', `${label}: externalization.productionExternalizationReady must be boolean`, failures);
  assert(Array.isArray(externalization?.blockers), `${label}: externalization.blockers must be array`, failures);

  return { data, google, muck, externalization };
}

function validatePreflightShape(payload, failures, label) {
  assert(payload && typeof payload === 'object', `${label}: preflight payload must be object`, failures);
  assert(payload?.success === true, `${label}: preflight success must be true`, failures);
  assert(payload?.data && typeof payload.data === 'object', `${label}: preflight data must be object`, failures);
  assert(typeof payload?.data?.mode === 'string', `${label}: preflight mode must be string`, failures);
  assert(typeof payload?.data?.productionExternalizationReady === 'boolean', `${label}: preflight productionExternalizationReady must be boolean`, failures);
  assert(Array.isArray(payload?.data?.blockers), `${label}: preflight blockers must be array`, failures);
  return payload.data;
}

async function runScenario({ label, port, envOverrides, assertions }, failures) {
  const server = await startServer(port, envOverrides);
  try {
    const res = await fetchWithTimeout(`${server.baseUrl}/api/integrations/health`);
    const payload = await res.json();
    assert(res.status === 200, `${label}: expected HTTP 200, got ${res.status}`, failures);
    const blocks = validateContractShape(payload, failures, label);

    const preflightRes = await fetchWithTimeout(`${server.baseUrl}/api/integrations/preflight`);
    const preflightPayload = await preflightRes.json();
    assert(preflightRes.status === 200, `${label}: expected preflight HTTP 200, got ${preflightRes.status}`, failures);
    const preflightData = validatePreflightShape(preflightPayload, failures, label);
    assertions({ ...blocks, preflight: preflightData }, failures);
  } finally {
    await server.stop();
  }
}

async function main() {
  const failures = [];
  const basePort = 4200 + Math.floor(Math.random() * 200);

  const blankIntegrationEnv = {
    GOOGLE_CLIENT_ID: '',
    GOOGLE_CLIENT_SECRET: '',
    GOOGLE_REFRESH_TOKEN: '',
    GOOGLE_REDIRECT_URI: '',
    MUCKRACK_API_KEY: '',
    MUCKRACK_SESSION_COOKIE: '',
    MUCKRACK_EMAIL: '',
    MUCKRACK_PASSWORD: '',
    MUCKRACK_DEBUG_PORT: '',
    MUCKRACK_CHROME_PROFILE_DIR: '',
  };

  await runScenario(
    {
      label: 'failure-none-configured',
      port: basePort,
      envOverrides: blankIntegrationEnv,
      assertions: ({ data, google, muck, externalization, preflight }, testFailures) => {
        assert(google.scriptExists === true, 'failure-none-configured: google export script should exist', testFailures);
        assert(google.oauthConfigured === false, 'failure-none-configured: google oauthConfigured must be false', testFailures);
        assert(google.ready === false, 'failure-none-configured: google ready must be false', testFailures);

        assert(muck.importScriptExists === true, 'failure-none-configured: muck import script should exist', testFailures);
        assert(muck.collectorScriptExists === true, 'failure-none-configured: muck collector script should exist', testFailures);
        assert(muck.credentialsConfigured === false, 'failure-none-configured: muck credentialsConfigured must be false', testFailures);
        assert(muck.debugBrowserConfigured === false, 'failure-none-configured: muck debugBrowserConfigured must be false', testFailures);
        assert(muck.ready === false, 'failure-none-configured: muck ready must be false', testFailures);
        assert(data.overallReady === false, 'failure-none-configured: overallReady must be false', testFailures);
        assert(externalization.mode === 'local', 'failure-none-configured: externalization mode should default to local', testFailures);
        assert(externalization.productionExternalizationReady === false, 'failure-none-configured: productionExternalizationReady must be false', testFailures);
        assert(preflight.productionExternalizationReady === false, 'failure-none-configured: preflight productionExternalizationReady must be false', testFailures);
      },
    },
    failures
  );

  await runScenario(
    {
      label: 'failure-google-partial-config',
      port: basePort + 1,
      envOverrides: {
        ...blankIntegrationEnv,
        GOOGLE_CLIENT_ID: 'test-client-id',
        GOOGLE_CLIENT_SECRET: 'test-client-secret',
        GOOGLE_REDIRECT_URI: 'http://localhost:3002/api/integrations/google/callback',
      },
      assertions: ({ data, google, preflight }, testFailures) => {
        assert(google.clientConfigured === true, 'failure-google-partial-config: google clientConfigured must be true', testFailures);
        assert(google.refreshTokenConfigured === false, 'failure-google-partial-config: google refreshTokenConfigured must be false', testFailures);
        assert(google.oauthConfigured === false, 'failure-google-partial-config: google oauthConfigured must be false', testFailures);
        assert(google.ready === false, 'failure-google-partial-config: google ready must be false', testFailures);
        assert(data.overallReady === false, 'failure-google-partial-config: overallReady must be false', testFailures);
        assert(preflight.productionExternalizationReady === false, 'failure-google-partial-config: preflight productionExternalizationReady must be false', testFailures);
      },
    },
    failures
  );

  await runScenario(
    {
      label: 'success-full-config',
      port: basePort + 2,
      envOverrides: {
        ...blankIntegrationEnv,
        GOOGLE_CLIENT_ID: 'test-client-id',
        GOOGLE_CLIENT_SECRET: 'test-client-secret',
        GOOGLE_REFRESH_TOKEN: 'test-refresh-token',
        GOOGLE_REDIRECT_URI: 'http://localhost:3002/api/integrations/google/callback',
        MUCKRACK_EMAIL: 'bot@example.com',
        MUCKRACK_DEBUG_PORT: '9333',
      },
      assertions: ({ data, google, muck, externalization, preflight }, testFailures) => {
        assert(google.oauthConfigured === true, 'success-full-config: google oauthConfigured must be true', testFailures);
        assert(google.ready === true, 'success-full-config: google ready must be true', testFailures);
        assert(muck.credentialsConfigured === true, 'success-full-config: muck credentialsConfigured must be true', testFailures);
        assert(muck.debugBrowserConfigured === true, 'success-full-config: muck debugBrowserConfigured must be true', testFailures);
        assert(muck.ready === true, 'success-full-config: muck ready must be true', testFailures);
        assert(data.overallReady === true, 'success-full-config: overallReady must be true', testFailures);
        assert(externalization.productionExternalizationReady === true, 'success-full-config: productionExternalizationReady must be true', testFailures);
        assert(preflight.productionExternalizationReady === true, 'success-full-config: preflight productionExternalizationReady must be true', testFailures);
      },
    },
    failures
  );

  await runScenario(
    {
      label: 'production-mode-failure-missing-verification',
      port: basePort + 3,
      envOverrides: {
        ...blankIntegrationEnv,
        EXTERNALIZATION_MODE: 'production',
        GOOGLE_CLIENT_ID: 'test-client-id',
        GOOGLE_CLIENT_SECRET: 'test-client-secret',
        GOOGLE_REFRESH_TOKEN: 'test-refresh-token',
        GOOGLE_REDIRECT_URI: 'http://localhost:3002/api/integrations/google/callback',
        MUCKRACK_EMAIL: 'bot@example.com',
        MUCKRACK_COLLECTION_CONCURRENCY: '8',
        MUCKRACK_MAX_RETRIES: '3',
      },
      assertions: ({ preflight, externalization }, testFailures) => {
        assert(preflight.mode === 'production', 'production-mode-failure-missing-verification: preflight mode must be production', testFailures);
        assert(preflight.productionExternalizationReady === false, 'production-mode-failure-missing-verification: readiness must be false', testFailures);
        assert(externalization.productionExternalizationReady === false, 'production-mode-failure-missing-verification: health externalization readiness must be false', testFailures);
      },
    },
    failures
  );

  await runScenario(
    {
      label: 'production-mode-success',
      port: basePort + 4,
      envOverrides: {
        ...blankIntegrationEnv,
        EXTERNALIZATION_MODE: 'production',
        GOOGLE_CLIENT_ID: 'test-client-id',
        GOOGLE_CLIENT_SECRET: 'test-client-secret',
        GOOGLE_REFRESH_TOKEN: 'test-refresh-token',
        GOOGLE_REDIRECT_URI: 'http://localhost:3002/api/integrations/google/callback',
        GOOGLE_OAUTH_APP_VERIFIED: 'true',
        GOOGLE_OAUTH_PUBLISH_STATUS: 'in_production',
        MUCKRACK_EMAIL: 'bot@example.com',
        MUCKRACK_COLLECTION_CONCURRENCY: '8',
        MUCKRACK_MAX_RETRIES: '3',
        MUCKRACK_ROBUSTNESS_APPROVED: 'true',
      },
      assertions: ({ preflight, externalization }, testFailures) => {
        assert(preflight.mode === 'production', 'production-mode-success: preflight mode must be production', testFailures);
        assert(preflight.productionExternalizationReady === true, 'production-mode-success: preflight readiness must be true', testFailures);
        assert(externalization.productionExternalizationReady === true, 'production-mode-success: health externalization readiness must be true', testFailures);
      },
    },
    failures
  );

  if (failures.length > 0) {
    console.error('Integration contract smoke: FAIL');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log('Integration contract smoke: PASS');
}

main().catch((error) => {
  console.error('Integration contract smoke: FAIL');
  console.error(error instanceof Error ? error.message : String(error));
  if (typeof error === 'object' && error !== null && 'startupLogs' in error) {
    console.error(String(error.startupLogs));
  }
  process.exit(1);
});
