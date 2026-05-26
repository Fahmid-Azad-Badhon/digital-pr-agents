import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import type { NextRequest } from 'next/server';
import { LOGS_ROOT, resolveCampaignPath } from '@/lib/requestGuard';

export type SystemLogLevel = 'debug' | 'info' | 'success' | 'warning' | 'error';

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  level: SystemLogLevel;
  source: string;
  message: string;
  details?: string;
  campaignId?: string;
  metadata?: Record<string, unknown>;
}

type RequestLike = NextRequest | Request;

export type ApiAuditFields = {
  requestId?: string | null;
  route?: string;
  method?: string;
  stage?: number | string | null;
  campaignId?: string | null;
  actor?: string | null;
  action?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  extra?: Record<string, unknown>;
};

type LogQuery = {
  level?: string | null;
  source?: string | null;
  campaignId?: string | null;
  search?: string | null;
  limit?: number;
};

const LOGS_DIR = LOGS_ROOT;
const MAX_LOG_FILES = 30;
const LOG_RETENTION_DAYS = 14;
const OTEL_LOG_ENDPOINT = process.env.OTEL_LOG_ENDPOINT || '';
const OTEL_LOG_API_KEY = process.env.OTEL_LOG_API_KEY || '';

function isValidLevel(level: string): level is SystemLogLevel {
  return ['debug', 'info', 'success', 'warning', 'error'].includes(level);
}

function getDailyLogPath(date: Date): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return path.join(LOGS_DIR, `dashboard-${yyyy}-${mm}-${dd}.jsonl`);
}

async function ensureLogDir(): Promise<void> {
  await fs.mkdir(LOGS_DIR, { recursive: true });
}

async function pruneOldLogs(): Promise<void> {
  const nowMs = Date.now();
  const retentionMs = LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const files = await fs.readdir(LOGS_DIR).catch(() => []);
  const candidates = files
    .filter(fileName => /^dashboard-\d{4}-\d{2}-\d{2}\.jsonl$/i.test(fileName))
    .map(fileName => ({
      fileName,
      fullPath: path.join(LOGS_DIR, fileName),
    }));

  for (const candidate of candidates) {
    const stats = await fs.stat(candidate.fullPath).catch(() => null);
    if (!stats) {
      continue;
    }

    if (nowMs - stats.mtimeMs > retentionMs) {
      await fs.rm(candidate.fullPath, { force: true }).catch(() => undefined);
    }
  }

  const remaining = await fs.readdir(LOGS_DIR).catch(() => []);
  const sorted = remaining
    .filter(fileName => /^dashboard-\d{4}-\d{2}-\d{2}\.jsonl$/i.test(fileName))
    .sort();
  const overflow = sorted.length - MAX_LOG_FILES;
  if (overflow > 0) {
    const filesToRemove = sorted.slice(0, overflow);
    for (const fileName of filesToRemove) {
      await fs.rm(path.join(LOGS_DIR, fileName), { force: true }).catch(() => undefined);
    }
  }
}

export async function writeSystemLog(
  input: Omit<SystemLogEntry, 'id' | 'timestamp'>
): Promise<SystemLogEntry> {
  await ensureLogDir();
  await pruneOldLogs();

  const entry: SystemLogEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    level: input.level,
    source: input.source,
    message: input.message,
    ...(input.details ? { details: input.details } : {}),
    ...(input.campaignId ? { campaignId: input.campaignId } : {}),
    ...(input.metadata ? { metadata: input.metadata } : {}),
  };

  const line = `${JSON.stringify(entry)}\n`;
  await fs.appendFile(getDailyLogPath(new Date()), line, 'utf-8');
  if (OTEL_LOG_ENDPOINT) {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
    };
    if (OTEL_LOG_API_KEY) {
      headers.authorization = `Bearer ${OTEL_LOG_API_KEY}`;
    }
    fetch(OTEL_LOG_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ts: entry.timestamp,
        level: entry.level,
        source: entry.source,
        message: entry.message,
        campaignId: entry.campaignId || null,
        metadata: entry.metadata || null,
      }),
      cache: 'no-store',
    }).catch(() => undefined);
  }
  return entry;
}

function readHeader(request: RequestLike, key: string): string | null {
  return request.headers.get(key) || null;
}

export function getRequestIdFromRequest(request: RequestLike): string | null {
  return readHeader(request, 'x-request-id');
}

export function getRequestActor(request: RequestLike): string {
  const explicitActor = readHeader(request, 'x-actor');
  if (explicitActor) {
    return explicitActor;
  }
  const authHeader = readHeader(request, 'authorization');
  if (authHeader) {
    return 'authenticated';
  }
  return 'anonymous';
}

export function getRequestAuditMetadata(request: RequestLike, fields: ApiAuditFields = {}) {
  const forwardedFor = readHeader(request, 'x-forwarded-for');
  const realIp = readHeader(request, 'x-real-ip');
  return {
    requestId: fields.requestId ?? getRequestIdFromRequest(request),
    route: fields.route ?? new URL(request.url).pathname,
    method: fields.method ?? request.method.toUpperCase(),
    stage: fields.stage ?? null,
    campaignId: fields.campaignId ?? null,
    actor: fields.actor ?? getRequestActor(request),
    action: fields.action ?? null,
    ip: fields.ip ?? forwardedFor?.split(',')[0]?.trim() ?? realIp ?? null,
    userAgent: fields.userAgent ?? readHeader(request, 'user-agent'),
    ...(fields.extra ? fields.extra : {}),
  };
}

export async function writeApiAuditLog(
  request: RequestLike,
  input: {
    level: SystemLogLevel;
    source: string;
    message: string;
    details?: string;
    fields?: ApiAuditFields;
  }
) {
  const metadata = getRequestAuditMetadata(request, input.fields);
  return writeSystemLog({
    level: input.level,
    source: input.source,
    message: input.message,
    ...(input.details ? { details: input.details } : {}),
    ...(metadata.campaignId ? { campaignId: String(metadata.campaignId) } : {}),
    metadata,
  });
}

function parseJsonLines(content: string): SystemLogEntry[] {
  const lines = content.split('\n').filter(Boolean);
  const parsed: SystemLogEntry[] = [];

  for (const line of lines) {
    try {
      const row = JSON.parse(line) as Partial<SystemLogEntry>;
      if (!row.timestamp || !row.level || !row.source || !row.message) {
        continue;
      }
      if (!isValidLevel(String(row.level))) {
        continue;
      }
      parsed.push({
        id: typeof row.id === 'string' ? row.id : crypto.randomUUID(),
        timestamp: row.timestamp,
        level: row.level,
        source: row.source,
        message: row.message,
        ...(typeof row.details === 'string' ? { details: row.details } : {}),
        ...(typeof row.campaignId === 'string' ? { campaignId: row.campaignId } : {}),
        ...(row.metadata && typeof row.metadata === 'object' ? { metadata: row.metadata } : {}),
      });
    } catch {
      continue;
    }
  }

  return parsed;
}

function filterLogs(entries: SystemLogEntry[], query: LogQuery): SystemLogEntry[] {
  const search = query.search?.trim().toLowerCase() || null;

  return entries.filter(entry => {
    if (query.level && query.level !== 'all' && entry.level !== query.level) {
      return false;
    }

    if (query.source && query.source !== 'all' && entry.source !== query.source) {
      return false;
    }

    if (query.campaignId && entry.campaignId !== query.campaignId) {
      return false;
    }

    if (search) {
      const haystack = `${entry.message} ${entry.source} ${entry.details || ''}`.toLowerCase();
      if (!haystack.includes(search)) {
        return false;
      }
    }

    return true;
  });
}

export async function readSystemLogs(query: LogQuery = {}): Promise<SystemLogEntry[]> {
  await ensureLogDir();
  const files = (await fs.readdir(LOGS_DIR).catch(() => []))
    .filter(fileName => /^dashboard-\d{4}-\d{2}-\d{2}\.jsonl$/i.test(fileName))
    .sort()
    .reverse();

  const allEntries: SystemLogEntry[] = [];
  for (const fileName of files) {
    const content = await fs.readFile(path.join(LOGS_DIR, fileName), 'utf-8').catch(() => '');
    if (!content) {
      continue;
    }
    allEntries.push(...parseJsonLines(content));
  }

  const filtered = filterLogs(allEntries, query)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const limit = query.limit && query.limit > 0 ? query.limit : 500;
  return filtered.slice(0, limit);
}

export async function readCampaignLogs(campaignId: string): Promise<SystemLogEntry[]> {
  const campaignPath = resolveCampaignPath(campaignId);
  const auditPath = path.join(campaignPath, 'audit-log.json');
  const errorsPath = path.join(campaignPath, 'errors.json');
  const output: SystemLogEntry[] = [];

  const auditRaw = await fs.readFile(auditPath, 'utf-8').catch(() => null);
  if (auditRaw) {
    try {
      const parsed = JSON.parse(auditRaw) as {
        auditLog?: Array<{ stage?: string; timestamp?: string; action?: string; status?: string; user?: string; details?: string }>;
      };
      const rows = Array.isArray(parsed.auditLog) ? parsed.auditLog : [];
      for (const row of rows) {
        output.push({
          id: crypto.randomUUID(),
          timestamp: row.timestamp || new Date().toISOString(),
          level: row.status === 'success' ? 'success' : 'info',
          source: row.stage || 'workflow',
          message: row.action || 'audit_event',
          ...(row.details ? { details: row.details } : {}),
          campaignId,
          metadata: { user: row.user || 'system' },
        });
      }
    } catch {
      // ignore malformed audit file
    }
  }

  const errorsRaw = await fs.readFile(errorsPath, 'utf-8').catch(() => null);
  if (errorsRaw) {
    try {
      const parsed = JSON.parse(errorsRaw) as {
        errors?: Array<{ timestamp?: string; stage?: string; message?: string }>;
        warnings?: Array<{ timestamp?: string; stage?: string; message?: string }>;
        info?: Array<{ timestamp?: string; stage?: string; message?: string }>;
      };

      const appendRows = (
        rows: Array<{ timestamp?: string; stage?: string; message?: string }> | undefined,
        level: SystemLogLevel
      ) => {
        if (!Array.isArray(rows)) {
          return;
        }
        for (const row of rows) {
          output.push({
            id: crypto.randomUUID(),
            timestamp: row.timestamp || new Date().toISOString(),
            level,
            source: row.stage || 'workflow',
            message: row.message || `${level}_event`,
            campaignId,
          });
        }
      };

      appendRows(parsed.errors, 'error');
      appendRows(parsed.warnings, 'warning');
      appendRows(parsed.info, 'info');
    } catch {
      // ignore malformed errors file
    }
  }

  return output.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
