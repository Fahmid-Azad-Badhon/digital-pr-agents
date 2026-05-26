import path from 'path';

const CAMPAIGN_ID_PATTERN = /^[a-z0-9][a-z0-9-_]{1,120}$/i;

export const PITCH_JOBS_ROOT = path.join(process.cwd(), '..', 'pitch-jobs');
export const SCRIPTS_ROOT = path.join(process.cwd(), '..', 'scripts');

export function isValidCampaignId(value: unknown): value is string {
  return typeof value === 'string' && CAMPAIGN_ID_PATTERN.test(value);
}

export function assertValidCampaignId(value: unknown): string {
  if (!isValidCampaignId(value)) {
    throw new Error('Invalid campaignId format.');
  }
  return value;
}

export function resolveCampaignPath(campaignId: string): string {
  const candidate = path.resolve(PITCH_JOBS_ROOT, campaignId);
  const normalizedRoot = path.resolve(PITCH_JOBS_ROOT);
  if (!candidate.startsWith(normalizedRoot + path.sep) && candidate !== normalizedRoot) {
    throw new Error('Invalid campaign path.');
  }
  return candidate;
}

export function sanitizeStageFile(value: unknown): string {
  if (typeof value !== 'string' || value.length < 3 || value.length > 120) {
    throw new Error('Invalid stage file name.');
  }
  if (!/^[a-z0-9._-]+$/i.test(value)) {
    throw new Error('Invalid stage file characters.');
  }
  return value;
}

export const REPO_ROOT = path.join(process.cwd(), '..');
export const DATA_ROOT = path.join(REPO_ROOT, 'data');
export const LOGS_ROOT = path.join(REPO_ROOT, 'logs');
export const SYSTEM_ROOT = path.join(REPO_ROOT, 'system');
export const BROWSER_TOOLS_ROOT = path.join(REPO_ROOT, 'browser-tools');
export const BACKUPS_ROOT = path.join(REPO_ROOT, 'pitch-jobs-backups');

export function sanitizeText(value: unknown, maxLen = 180): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLen);

  return normalized.length > 0 ? normalized : undefined;
}
