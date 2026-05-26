import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { NextRequest } from 'next/server';
import { fail, ok } from '@/lib/apiResponse';
import { evaluateMutationAuth } from '@/lib/authGuard';
import { assertValidCampaignId } from '@/lib/requestGuard';
import { BRAIN_KEY_TO_TARGET, getBrainWorkerScriptPath } from '@/lib/brainWorkerRuntime';
import { writeApiAuditLog } from '@/lib/logger';

const JOBS_DIR = path.join(process.cwd(), 'logs', 'brain-jobs');

export async function POST(request: NextRequest) {
  const auth = evaluateMutationAuth(request);
  if (!auth.allowed) {
    return fail('AUTH_REQUIRED', auth.reason, { status: 401 });
  }

  const body = await request.json().catch(() => null) as { campaignId?: string; brainKey?: string } | null;
  const campaignIdRaw = body?.campaignId;
  const brainKey = body?.brainKey;
  if (!campaignIdRaw || !brainKey) {
    return fail('INVALID_BODY', 'campaignId and brainKey are required.', { status: 400 });
  }

  const campaignId = assertValidCampaignId(campaignIdRaw);
  const target = BRAIN_KEY_TO_TARGET[brainKey];
  if (!target) {
    return fail('UNKNOWN_BRAIN_KEY', `Unknown brain key: ${brainKey}`, { status: 400 });
  }

  const jobId = crypto.randomUUID();
  const jobFile = path.join(JOBS_DIR, `${jobId}.json`);
  const scriptPath = getBrainWorkerScriptPath();
  const baseUrl = process.env.DASHBOARD_BASE_URL || 'http://localhost:3002';
  const token = process.env.DASHBOARD_API_TOKEN || '';

  await fs.mkdir(JOBS_DIR, { recursive: true });

  const child = spawn(process.execPath, [
    scriptPath,
    `--baseUrl=${baseUrl}`,
    `--campaignId=${campaignId}`,
    `--brainKey=${brainKey}`,
    `--token=${token}`,
    `--jobFile=${jobFile}`,
  ], {
    cwd: process.cwd(),
    windowsHide: true,
    detached: true,
    stdio: 'ignore',
  });
  child.unref();

  await writeApiAuditLog(request, {
    level: 'info',
    source: 'brain-worker',
    message: `Brain worker spawned for ${brainKey}`,
    fields: {
      stage: target.kind === 'stage' ? target.stage : target.kind === 'human_gate' ? 7 : 0,
      campaignId,
      actor: 'dashboard_user',
      action: 'spawn_brain_worker',
      extra: { jobId, brainKey, target },
    },
  });

  return ok({ jobId, campaignId, brainKey, target, jobFile });
}
