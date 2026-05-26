import fs from 'fs/promises';
import path from 'path';
import { NextRequest } from 'next/server';
import { fail, ok } from '@/lib/apiResponse';
import { evaluateMutationAuth } from '@/lib/authGuard';
import { BackupActionInputSchema } from '@/lib/inputSchemas';
import { writeApiAuditLog } from '@/lib/logger';
import { assertValidCampaignId, resolveCampaignPath, BACKUPS_ROOT } from '@/lib/requestGuard';
import { validateInput } from '@/lib/schemaValidation';

const BACKUP_ROOT = BACKUPS_ROOT;

function createBackupId(campaignId: string): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${campaignId}__${stamp}`;
}

function resolveBackupPath(backupId: string): string {
  const target = path.resolve(BACKUP_ROOT, backupId);
  const normalizedRoot = path.resolve(BACKUP_ROOT);
  if (!target.startsWith(normalizedRoot + path.sep) && target !== normalizedRoot) {
    throw new Error('Invalid backup path.');
  }
  return target;
}

async function listBackups(campaignId: string) {
  await fs.mkdir(BACKUP_ROOT, { recursive: true });
  const entries = await fs.readdir(BACKUP_ROOT, { withFileTypes: true }).catch(() => []);
  const backups = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith(`${campaignId}__`)) {
      continue;
    }
    const fullPath = path.join(BACKUP_ROOT, entry.name);
    const stats = await fs.stat(fullPath).catch(() => null);
    backups.push({
      backupId: entry.name,
      createdAt: stats?.mtime.toISOString() || null,
      path: fullPath,
    });
  }
  return backups.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = evaluateMutationAuth(request);
    if (!auth.allowed) {
      return fail('AUTH_REQUIRED', auth.reason, { status: 401 });
    }

    const { id } = await params;
    const campaignId = assertValidCampaignId(id);
    const backups = await listBackups(campaignId);
    return ok({ campaignId, backups, total: backups.length });
  } catch (error) {
    return fail(
      'FAILED_TO_LIST_BACKUPS',
      'Failed to list campaign backups.',
      { status: 500 },
      error instanceof Error ? error.message : String(error)
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = evaluateMutationAuth(request);
    if (!auth.allowed) {
      return fail('AUTH_REQUIRED', auth.reason, { status: 401 });
    }

    const { id } = await params;
    const campaignId = assertValidCampaignId(id);
    const campaignPath = resolveCampaignPath(campaignId);
    const campaignExists = await fs.stat(campaignPath).then(stat => stat.isDirectory()).catch(() => false);
    if (!campaignExists) {
      return fail('CAMPAIGN_NOT_FOUND', `Campaign "${campaignId}" not found.`, { status: 404 });
    }

    const rawBody = await request.json().catch(() => null);
    const parsedInput = validateInput(BackupActionInputSchema, rawBody);
    if (!parsedInput.success) {
      return fail('INVALID_BACKUP_INPUT', 'Backup payload validation failed.', { status: 400 }, parsedInput.errors);
    }
    const body = parsedInput.data;

    await fs.mkdir(BACKUP_ROOT, { recursive: true });

    if (body.action === 'create') {
      const backupId = createBackupId(campaignId);
      const backupPath = resolveBackupPath(backupId);
      await fs.cp(campaignPath, backupPath, { recursive: true, force: false });

      await writeApiAuditLog(request, {
        level: 'success',
        source: 'backup',
        message: `Backup created: ${backupId}`,
        details: body.note,
        fields: {
          stage: null,
          campaignId,
          action: 'backup_create',
          actor: 'dashboard_user',
        },
      });

      return ok({ campaignId, action: 'create', backupId, backupPath });
    }

    if (!body.backupId) {
      return fail('BACKUP_ID_REQUIRED', 'backupId is required for restore.', { status: 400 });
    }

    const sourceBackupPath = resolveBackupPath(body.backupId);
    const backupExists = await fs.stat(sourceBackupPath).then(stat => stat.isDirectory()).catch(() => false);
    if (!backupExists) {
      return fail('BACKUP_NOT_FOUND', `Backup "${body.backupId}" not found.`, { status: 404 });
    }

    const safetyBackupId = `${campaignId}__pre_restore__${new Date().toISOString().replace(/[:.]/g, '-')}`;
    const safetyBackupPath = resolveBackupPath(safetyBackupId);
    await fs.cp(campaignPath, safetyBackupPath, { recursive: true, force: false });

    await fs.rm(campaignPath, { recursive: true, force: true });
    await fs.cp(sourceBackupPath, campaignPath, { recursive: true, force: true });

    await writeApiAuditLog(request, {
      level: 'warning',
      source: 'backup',
      message: `Campaign restored from backup: ${body.backupId}`,
      details: `safety snapshot: ${safetyBackupId}`,
      fields: {
        stage: null,
        campaignId,
        action: 'backup_restore',
        actor: 'dashboard_user',
      },
    });

    return ok({
      campaignId,
      action: 'restore',
      restoredFrom: body.backupId,
      safetyBackupId,
    });
  } catch (error) {
    return fail(
      'BACKUP_OPERATION_FAILED',
      'Failed to execute backup operation.',
      { status: 500 },
      error instanceof Error ? error.message : String(error)
    );
  }
}
