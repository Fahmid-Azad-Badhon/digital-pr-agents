import fs from 'fs/promises';
import path from 'path';
import { NextRequest } from 'next/server';
import { fail, ok } from '@/lib/apiResponse';
import { assertValidCampaignId, resolveCampaignPath } from '@/lib/requestGuard';
import { safeReadJsonFile } from '@/lib/fileReadSafety';

type ArtifactStatus = 'completed' | 'pending' | 'running';

type ArtifactRecord = {
  name: string;
  stage: number;
  status: ArtifactStatus;
  size: string;
  sizeBytes: number;
  updatedAt: string;
};

type StageState = {
  currentStage?: number;
  status?: string;
};

function clampStage(stage: number): number {
  if (!Number.isFinite(stage)) {
    return 1;
  }
  return Math.max(1, Math.min(16, Math.trunc(stage)));
}

function inferStageFromPath(relativePath: string, currentStage: number): number {
  const normalized = relativePath.replace(/\\/g, '/');
  const baseName = path.basename(normalized).toLowerCase();

  if (baseName === 'stage-state.json') {
    return clampStage(currentStage);
  }

  if (baseName === 'human-approval.json') {
    return 7;
  }

  if (normalized.startsWith('source-files/study-inputs/')) {
    return 2;
  }

  if (normalized.startsWith('source-files/journalist-intel/')) {
    return 8;
  }

  if (normalized.startsWith('draft-variants/')) {
    return 10;
  }

  const stageMatch = baseName.match(/^(\d{1,2})[-_]/);
  if (!stageMatch) {
    return clampStage(currentStage);
  }

  const parsed = Number.parseInt(stageMatch[1], 10);
  if (Number.isNaN(parsed)) {
    return clampStage(currentStage);
  }

  if (parsed === 0) {
    return 1;
  }

  if (parsed === 1 && baseName.includes('study-notes')) {
    return 2;
  }

  return clampStage(parsed);
}

function formatBytes(sizeBytes: number): string {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }
  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }
  return `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function walkCampaignFiles(
  rootDir: string,
  currentDir: string
): Promise<Array<{ relativePath: string; stats: Awaited<ReturnType<typeof fs.stat>> }>> {
  const entries = await fs.readdir(currentDir, { withFileTypes: true });
  const files: Array<{ relativePath: string; stats: Awaited<ReturnType<typeof fs.stat>> }> = [];

  for (const entry of entries) {
    const absolutePath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      const nested = await walkCampaignFiles(rootDir, absolutePath);
      files.push(...nested);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const stats = await fs.stat(absolutePath);
    files.push({
      relativePath: path.relative(rootDir, absolutePath).replace(/\\/g, '/'),
      stats,
    });
  }

  return files;
}

function resolveArtifactStatus(stage: number, currentStage: number, workflowStatus: string): ArtifactStatus {
  if (stage < currentStage) {
    return 'completed';
  }
  if (stage === currentStage && workflowStatus === 'running') {
    return 'running';
  }
  if (stage > currentStage) {
    return 'pending';
  }
  return 'completed';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignIdParam = searchParams.get('campaignId');

    if (!campaignIdParam) {
      return fail('CAMPAIGN_ID_REQUIRED', 'campaignId query parameter is required.', { status: 400 });
    }

    const campaignId = assertValidCampaignId(campaignIdParam);
    const campaignDir = resolveCampaignPath(campaignId);
    const stageStatePath = path.join(campaignDir, 'stage-state.json');

    await fs.access(campaignDir);

    const stageState = await safeReadJsonFile<StageState>(stageStatePath);
    const currentStage = clampStage(stageState?.currentStage ?? 1);
    const workflowStatus = typeof stageState?.status === 'string' ? stageState.status : 'running';

    const files = await walkCampaignFiles(campaignDir, campaignDir);
    files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

    const artifacts: ArtifactRecord[] = files.map(file => {
      const stage = inferStageFromPath(file.relativePath, currentStage);
      const sizeBytes = Number(file.stats.size);
      return {
        name: file.relativePath,
        stage,
        status: resolveArtifactStatus(stage, currentStage, workflowStatus),
        size: formatBytes(sizeBytes),
        sizeBytes,
        updatedAt: file.stats.mtime.toISOString(),
      };
    });

    return ok({
      campaignId,
      currentStage,
      total: artifacts.length,
      artifacts,
    });
  } catch (error) {
    if (error instanceof Error && /Invalid campaign/i.test(error.message)) {
      return fail('INVALID_CAMPAIGN_ID', error.message, { status: 400 });
    }
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
      return fail('CAMPAIGN_NOT_FOUND', 'Campaign folder not found.', { status: 404 });
    }

    return fail(
      'FAILED_TO_LIST_ARTIFACTS',
      'Failed to read campaign artifacts from filesystem.',
      { status: 500 },
      error instanceof Error ? error.message : String(error)
    );
  }
}
