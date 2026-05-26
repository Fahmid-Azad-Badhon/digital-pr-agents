import fs from 'fs/promises';
import path from 'path';
import { runBrainService, resolveBrainService } from './brain-worker-services.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).map((part) => {
    const [key, ...rest] = part.split('=');
    return [key.replace(/^--/, ''), rest.join('=')];
  })
);

const baseUrl = args.baseUrl || 'http://localhost:3002';
const campaignId = args.campaignId;
const brainKey = args.brainKey;
const token = args.token || '';
const jobFile = args.jobFile;

async function writeJobStatus(status, extra = {}) {
  if (!jobFile) return;
  const payload = {
    updatedAt: new Date().toISOString(),
    status,
    campaignId,
    brainKey,
    ...extra,
  };
  await fs.mkdir(path.dirname(jobFile), { recursive: true });
  await fs.writeFile(jobFile, JSON.stringify(payload, null, 2), 'utf-8');
}

async function run() {
  if (!campaignId || !brainKey) {
    throw new Error('Missing required --campaignId or --brainKey');
  }
  const target = resolveBrainService(brainKey);
  if (!target) {
    throw new Error(`Unsupported brainKey: ${brainKey}`);
  }

  await writeJobStatus('running', { target });

  const result = await runBrainService({
    baseUrl,
    campaignId,
    brainKey,
    token,
  });
  await writeJobStatus('completed', { target, result });
}

run().catch(async (error) => {
  await writeJobStatus('failed', { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});
