import fs from 'fs/promises';
import path from 'path';
import { spawn, spawnSync } from 'child_process';

const dashboardRoot = process.cwd();
const repoRoot = path.join(dashboardRoot, '..');
const pitchJobsRoot = path.join(repoRoot, 'pitch-jobs');
const seedCampaignId = 'ci-seeded-strict-audit-campaign';
const campaignPath = path.join(pitchJobsRoot, seedCampaignId);
const port = 4100 + Math.floor(Math.random() * 200);
const baseUrl = `http://127.0.0.1:${port}`;

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function seedCampaign() {
  await ensureDir(campaignPath);
  await ensureDir(path.join(campaignPath, 'source-files', 'study-inputs'));
  await ensureDir(path.join(campaignPath, 'source-files', 'journalist-intel', 'bulk-beat-collection'));
  await ensureDir(path.join(campaignPath, 'source-files', 'journalist-intel', 'selected-angle'));
  await ensureDir(path.join(campaignPath, 'draft-variants'));

  await fs.writeFile(path.join(campaignPath, '00-brief.md'), '# Seed Brief\n\nThis is a CI fixture.', 'utf-8');
  await fs.writeFile(path.join(campaignPath, '01-campaign-intake.json'), JSON.stringify({
    name: 'CI Seeded Strict Audit Campaign',
    topic: 'Strict Audit Contract Verification',
    generatedAt: new Date().toISOString(),
    status: 'intake-complete',
  }, null, 2), 'utf-8');
  await fs.writeFile(path.join(campaignPath, 'stage-state.json'), JSON.stringify({
    currentStage: 3,
    status: 'running',
    updatedAt: new Date().toISOString(),
  }, null, 2), 'utf-8');

  await fs.writeFile(path.join(campaignPath, '03-research.md'), 'Auto-generated stage research placeholder', 'utf-8');
  await fs.writeFile(path.join(campaignPath, '03-research-enrichment.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    status: 'completed',
    enrichmentSummary: 'Auto-generated placeholder',
  }, null, 2), 'utf-8');
}

function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

async function waitForServer(timeoutMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${baseUrl}/api/campaigns`);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise(resolve => setTimeout(resolve, 750));
  }
  throw new Error(`Timed out waiting for Next server on ${baseUrl}`);
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

async function run() {
  const failures = [];
  await seedCampaign();

  let startupLogs = '';
  const server = process.platform === 'win32'
    ? spawn('cmd.exe', ['/c', `npx next dev -p ${port} --hostname 127.0.0.1`], {
      cwd: dashboardRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: '1',
      },
      shell: false,
    })
    : spawn('npx', ['next', 'dev', '-p', String(port), '--hostname', '127.0.0.1'], {
      cwd: dashboardRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: '1',
      },
      shell: false,
    });

  server.stdout?.on('data', (chunk) => {
    startupLogs += chunk.toString();
    if (startupLogs.length > 5000) startupLogs = startupLogs.slice(-5000);
  });
  server.stderr?.on('data', (chunk) => {
    startupLogs += chunk.toString();
    if (startupLogs.length > 5000) startupLogs = startupLogs.slice(-5000);
  });

  try {
    try {
      await waitForServer();
    } catch (error) {
      const wrapped = new Error(error instanceof Error ? error.message : String(error));
      wrapped.startupLogs = startupLogs;
      throw wrapped;
    }

    const response = await fetchWithTimeout(`${baseUrl}/api/campaigns/${seedCampaignId}/strict-audit`);
    const payload = await response.json();

    assert(response.status === 200, `strict-audit response status expected 200, got ${response.status}`, failures);
    assert(payload?.success === true, 'strict-audit success flag should be true', failures);
    assert(typeof payload?.data === 'object' && payload.data !== null, 'strict-audit payload missing data object', failures);

    const data = payload?.data ?? {};
    assert(data.campaignId === seedCampaignId, 'strict-audit campaignId mismatch', failures);
    assert(typeof data.strictReady === 'boolean', 'strict-audit strictReady must be boolean', failures);

    assert(typeof data.summary === 'object' && data.summary !== null, 'strict-audit summary missing', failures);
    assert(typeof data.summary?.totalChecks === 'number', 'summary.totalChecks must be number', failures);
    assert(typeof data.summary?.passedChecks === 'number', 'summary.passedChecks must be number', failures);
    assert(typeof data.summary?.failedChecks === 'number', 'summary.failedChecks must be number', failures);

    assert(Array.isArray(data.failedItems), 'failedItems must be an array', failures);
    assert(Array.isArray(data.allItems), 'allItems must be an array', failures);
    assert(typeof data.byStage === 'object' && data.byStage !== null, 'byStage must be an object map', failures);

    if (Array.isArray(data.failedItems)) {
      assert(data.failedItems.length > 0, 'failedItems should contain at least one seeded failure', failures);
      for (const [index, item] of data.failedItems.entries()) {
        assert(typeof item === 'object' && item !== null, `failedItems[${index}] must be object`, failures);
        assert(Number.isInteger(item.stage), `failedItems[${index}].stage must be integer`, failures);
        assert(typeof item.file === 'string' && item.file.length > 0, `failedItems[${index}].file must be non-empty string`, failures);
        assert(item.passed === false, `failedItems[${index}].passed must be false`, failures);
        assert(typeof item.reason === 'string' && item.reason.length > 0, `failedItems[${index}].reason must be non-empty string`, failures);
      }
    }

    if (Array.isArray(data.allItems)) {
      for (const [index, item] of data.allItems.entries()) {
        assert(typeof item === 'object' && item !== null, `allItems[${index}] must be object`, failures);
        assert(Number.isInteger(item.stage), `allItems[${index}].stage must be integer`, failures);
        assert(typeof item.file === 'string' && item.file.length > 0, `allItems[${index}].file must be non-empty string`, failures);
        assert(typeof item.passed === 'boolean', `allItems[${index}].passed must be boolean`, failures);
        assert(typeof item.reason === 'string' && item.reason.length > 0, `allItems[${index}].reason must be non-empty string`, failures);
      }
    }
  } finally {
    killProcessTree(server.pid);
  }

  if (failures.length > 0) {
    console.error('Strict-audit contract smoke: FAIL');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log('Strict-audit contract smoke: PASS');
}

run()
  .catch((error) => {
    console.error('Strict-audit contract smoke: FAIL');
    console.error(error instanceof Error ? error.message : String(error));
    if (typeof error === 'object' && error !== null && 'startupLogs' in error) {
      console.error(String(error.startupLogs));
    }
    process.exit(1);
  })
  .finally(async () => {
    try {
      await fs.rm(campaignPath, { recursive: true, force: true });
    } catch {
      // no-op
    }
  });
