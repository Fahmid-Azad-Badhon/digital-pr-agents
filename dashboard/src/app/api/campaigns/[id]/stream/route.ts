import fs from 'fs/promises';
import path from 'path';
import { NextRequest } from 'next/server';
import { fail } from '@/lib/apiResponse';
import { assertValidCampaignId, resolveCampaignPath } from '@/lib/requestGuard';
import { readRecentRuntimeEvents } from '@/lib/runtimeEvents';

type StageStateShape = {
  currentStage?: number;
  status?: string;
  lastBlockedAt?: string;
  blockedStage?: number;
};

function sseHeaders() {
  return {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  };
}

async function readStatusSnapshot(campaignPath: string) {
  const stagePath = path.join(campaignPath, 'stage-state.json');
  const errorsPath = path.join(campaignPath, 'errors.json');

  const stage = await fs.readFile(stagePath, 'utf-8')
    .then(content => JSON.parse(content) as StageStateShape)
    .catch(() => ({} as StageStateShape));

  const errors = await fs.readFile(errorsPath, 'utf-8')
    .then(content => JSON.parse(content) as { errors?: unknown[]; warnings?: unknown[]; info?: unknown[] })
    .catch(() => null);

  const runtimeEvents = await readRecentRuntimeEvents(campaignPath, 20);
  const latestRuntimeEvent = runtimeEvents.length > 0 ? runtimeEvents[runtimeEvents.length - 1] : null;

  return {
    currentStage: Number.isFinite(stage.currentStage) ? stage.currentStage : 1,
    status: typeof stage.status === 'string' ? stage.status : 'unknown',
    blockedStage: Number.isFinite(stage.blockedStage) ? stage.blockedStage : undefined,
    lastBlockedAt: typeof stage.lastBlockedAt === 'string' ? stage.lastBlockedAt : undefined,
    errors: Array.isArray(errors?.errors) ? errors.errors.length : 0,
    warnings: Array.isArray(errors?.warnings) ? errors.warnings.length : 0,
    info: Array.isArray(errors?.info) ? errors.info.length : 0,
    runtimeEvents,
    latestRuntimeEvent,
    timestamp: new Date().toISOString(),
  };
}

function formatEvent(event: string, payload: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaignId = assertValidCampaignId(id);
    const campaignPath = resolveCampaignPath(campaignId);
    const exists = await fs.stat(campaignPath).then(stat => stat.isDirectory()).catch(() => false);
    if (!exists) {
      return fail('CAMPAIGN_NOT_FOUND', `Campaign "${campaignId}" not found.`, { status: 404 });
    }

    const encoder = new TextEncoder();
    let closed = false;

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        request.signal.addEventListener('abort', () => {
          closed = true;
          controller.close();
        });

        let lastHash = '';
        const streamStartedAt = Date.now();
        controller.enqueue(encoder.encode(formatEvent('connected', { campaignId, timestamp: new Date().toISOString() })));

        while (!closed && Date.now() - streamStartedAt < 10 * 60 * 1000) {
          const snapshot = await readStatusSnapshot(campaignPath);
          const hash = JSON.stringify(snapshot);
          if (hash !== lastHash) {
            controller.enqueue(encoder.encode(formatEvent('status', snapshot)));
            lastHash = hash;
          } else {
            controller.enqueue(encoder.encode(': ping\n\n'));
          }
          await delay(2000);
        }

        if (!closed) {
          controller.enqueue(encoder.encode(formatEvent('closed', { reason: 'stream_timeout' })));
          controller.close();
        }
      },
      cancel() {
        closed = true;
      },
    });

    return new Response(stream, { headers: sseHeaders() });
  } catch (error) {
    return fail(
      'STREAM_FAILED',
      'Failed to start campaign status stream.',
      { status: 500 },
      error instanceof Error ? error.message : String(error)
    );
  }
}
