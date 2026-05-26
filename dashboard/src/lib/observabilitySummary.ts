import fs from 'fs/promises';
import path from 'path';
import { REPO_ROOT } from '@/lib/requestGuard';
import { readSystemLogs } from '@/lib/logger';

type RuntimeEventRow = {
  timestamp?: string;
  campaignId?: string;
  stage?: number;
  status?: string;
};

async function collectCampaignDirs(repoRoot: string) {
  const pitchJobsRoot = path.join(repoRoot, 'pitch-jobs');
  const entries = await fs.readdir(pitchJobsRoot, { withFileTypes: true }).catch(() => []);
  return entries.filter(entry => entry.isDirectory()).map(entry => ({
    slug: entry.name,
    path: path.join(pitchJobsRoot, entry.name),
  }));
}

function safeParseJsonLine(line: string): RuntimeEventRow | null {
  try {
    return JSON.parse(line) as RuntimeEventRow;
  } catch {
    return null;
  }
}

async function readRuntimeEvents(campaignPath: string): Promise<RuntimeEventRow[]> {
  const eventsPath = path.join(campaignPath, 'runtime-events.jsonl');
  const raw = await fs.readFile(eventsPath, 'utf-8').catch(() => '');
  if (!raw.trim()) return [];
  return raw
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(safeParseJsonLine)
    .filter((item): item is RuntimeEventRow => Boolean(item));
}

export async function buildObservabilitySummary() {
  const repoRoot = REPO_ROOT;
  const campaigns = await collectCampaignDirs(repoRoot);
  const runtimeRows = (await Promise.all(campaigns.map(async campaign => ({
    campaign: campaign.slug,
    rows: await readRuntimeEvents(campaign.path),
    hasCircuitState: await fs.access(path.join(campaign.path, 'circuit-state.json')).then(() => true).catch(() => false),
  })))).flatMap(entry => entry.rows.map(row => ({ ...row, campaign: entry.campaign, hasCircuitState: entry.hasCircuitState })));

  const systemLogs = await readSystemLogs({ limit: 5000 });
  const levelCounts = systemLogs.reduce<Record<string, number>>((acc, row) => {
    acc[row.level] = (acc[row.level] || 0) + 1;
    return acc;
  }, {});

  const stageCounts = runtimeRows.reduce<Record<string, number>>((acc, row) => {
    const key = row.stage ? `S${row.stage}` : 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const statusCounts = runtimeRows.reduce<Record<string, number>>((acc, row) => {
    const key = row.status || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const campaignsWithCircuits = new Set(runtimeRows.filter(row => row.hasCircuitState).map(row => row.campaign));
  const latestRuntimeEvent = runtimeRows
    .map(row => row.timestamp)
    .filter(Boolean)
    .sort((a, b) => String(b).localeCompare(String(a)))[0] || null;

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      campaigns: campaigns.length,
      runtimeEvents: runtimeRows.length,
      logEntries: systemLogs.length,
      campaignsWithCircuitState: campaignsWithCircuits.size,
    },
    logLevels: levelCounts,
    runtimeStatuses: statusCounts,
    runtimeStageDistribution: stageCounts,
    latestRuntimeEvent,
  };
}

