import fs from 'fs/promises';
import path from 'path';
import { NextRequest } from 'next/server';
import { fail, ok } from '@/lib/apiResponse';
import { assertValidCampaignId, resolveCampaignPath } from '@/lib/requestGuard';

const SUPPORTED_EXTENSIONS = new Set(['.md', '.json', '.csv']);
const MAX_PREVIEW_BYTES = 512 * 1024;

function resolveArtifactFilePath(campaignDir: string, relativeFilePath: string): string {
  const normalizedRelative = relativeFilePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const absolutePath = path.resolve(campaignDir, normalizedRelative);
  const normalizedCampaignDir = path.resolve(campaignDir);

  if (!absolutePath.startsWith(`${normalizedCampaignDir}${path.sep}`) && absolutePath !== normalizedCampaignDir) {
    throw new Error('Invalid artifact path.');
  }

  return absolutePath;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignIdParam = searchParams.get('campaignId');
    const fileParam = searchParams.get('file');

    if (!campaignIdParam) {
      return fail('CAMPAIGN_ID_REQUIRED', 'campaignId query parameter is required.', { status: 400 });
    }
    if (!fileParam) {
      return fail('FILE_PATH_REQUIRED', 'file query parameter is required.', { status: 400 });
    }

    const campaignId = assertValidCampaignId(campaignIdParam);
    const campaignDir = resolveCampaignPath(campaignId);
    const absoluteFilePath = resolveArtifactFilePath(campaignDir, fileParam);
    const extension = path.extname(absoluteFilePath).toLowerCase();

    if (!SUPPORTED_EXTENSIONS.has(extension)) {
      return fail(
        'UNSUPPORTED_PREVIEW_FORMAT',
        'Only .md, .json, and .csv previews are supported.',
        { status: 400 },
        { extension }
      );
    }

    const stats = await fs.stat(absoluteFilePath);
    if (!stats.isFile()) {
      return fail('ARTIFACT_NOT_FILE', 'Requested artifact is not a file.', { status: 400 });
    }
    if (stats.size > MAX_PREVIEW_BYTES) {
      return fail(
        'ARTIFACT_TOO_LARGE',
        `File is too large for inline preview (max ${MAX_PREVIEW_BYTES} bytes).`,
        { status: 413 },
        { sizeBytes: stats.size, maxBytes: MAX_PREVIEW_BYTES }
      );
    }

    const rawContent = await fs.readFile(absoluteFilePath, 'utf-8');
    const content = extension === '.json' ? JSON.stringify(JSON.parse(rawContent), null, 2) : rawContent;

    return ok({
      campaignId,
      file: fileParam.replace(/\\/g, '/'),
      extension,
      sizeBytes: stats.size,
      updatedAt: stats.mtime.toISOString(),
      content,
    });
  } catch (error) {
    if (error instanceof Error && /Invalid campaign/i.test(error.message)) {
      return fail('INVALID_CAMPAIGN_ID', error.message, { status: 400 });
    }
    if (error instanceof SyntaxError) {
      return fail('INVALID_JSON_FILE', 'JSON file could not be parsed.', { status: 400 });
    }
    if (error instanceof Error && /Invalid artifact path/i.test(error.message)) {
      return fail('INVALID_ARTIFACT_PATH', error.message, { status: 400 });
    }
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
      return fail('ARTIFACT_NOT_FOUND', 'Requested artifact was not found.', { status: 404 });
    }

    return fail(
      'FAILED_TO_LOAD_ARTIFACT_CONTENT',
      'Failed to load artifact preview.',
      { status: 500 },
      error instanceof Error ? error.message : String(error)
    );
  }
}
