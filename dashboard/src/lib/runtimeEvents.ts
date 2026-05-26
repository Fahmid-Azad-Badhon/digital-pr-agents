import fs from 'fs/promises';
import path from 'path';

export type RuntimeEventStatus = 'running' | 'completed' | 'failed' | 'blocked';

export interface RuntimeEvent {
  timestamp: string;
  campaignId: string;
  stage: number;
  action: string;
  status: RuntimeEventStatus;
  message: string;
  requestId?: string | null;
}

function eventLogPath(campaignPath: string) {
  return path.join(campaignPath, 'runtime-events.jsonl');
}

export async function appendRuntimeEvent(campaignPath: string, event: RuntimeEvent) {
  const line = `${JSON.stringify(event)}\n`;
  await fs.appendFile(eventLogPath(campaignPath), line, 'utf-8');
}

export async function readRecentRuntimeEvents(campaignPath: string, limit = 50): Promise<RuntimeEvent[]> {
  const content = await fs.readFile(eventLogPath(campaignPath), 'utf-8').catch(() => '');
  if (!content) {
    return [];
  }
  const lines = content.split('\n').filter(Boolean);
  const parsed: RuntimeEvent[] = [];
  for (const line of lines.slice(-limit)) {
    try {
      parsed.push(JSON.parse(line) as RuntimeEvent);
    } catch {
      // ignore malformed line
    }
  }
  return parsed;
}

