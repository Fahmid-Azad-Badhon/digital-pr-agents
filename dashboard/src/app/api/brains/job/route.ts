import fs from 'fs/promises';
import path from 'path';
import { NextRequest } from 'next/server';
import { fail, ok } from '@/lib/apiResponse';
import { evaluateMutationAuth } from '@/lib/authGuard';

const JOBS_DIR = path.join(process.cwd(), 'logs', 'brain-jobs');

export async function GET(request: NextRequest) {
  const auth = evaluateMutationAuth(request);
  if (!auth.allowed) {
    return fail('AUTH_REQUIRED', auth.reason, { status: 401 });
  }

  const jobId = new URL(request.url).searchParams.get('jobId');
  if (!jobId) {
    return fail('JOB_ID_REQUIRED', 'jobId query parameter is required.', { status: 400 });
  }

  const jobPath = path.join(JOBS_DIR, `${jobId}.json`);
  const content = await fs.readFile(jobPath, 'utf-8').catch(() => null);
  if (!content) {
    return fail('JOB_NOT_FOUND', `Job not found: ${jobId}`, { status: 404 });
  }
  return ok(JSON.parse(content));
}

