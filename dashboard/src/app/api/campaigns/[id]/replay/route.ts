// POST /api/campaigns/[id]/replay - Execute a replay operation
// GET /api/campaigns/[id]/replay - Get replay history and status
// GET /api/campaigns/[id]/replay/history - Get replay history only
// GET /api/campaigns/[id]/replay/stale - Get stale artifacts
// GET /api/campaigns/[id]/replay/snapshots - Get available snapshots
// POST /api/campaigns/[id]/replay/restore - Restore an archived output
// POST /api/campaigns/[id]/replay/compare - Compare two runs

import { fail, ok } from '@/lib/apiResponse';
import { resolveCampaignPath } from '@/lib/requestGuard';
import { getPromptVersionForRoute } from '@/lib/promptVersionResolver';
import fs from 'fs/promises';
import path from 'path';
import {
  executeReplay,
  getReplayHistory,
  getReplayStatus,
  getStaleArtifacts,
  getSnapshot,
  getArchivedRuns,
  restoreArchivedOutput,
  compareRunOutputs,
  runDryRunReplay,
  type ReplayRequest
} from '@/lib/replayManager';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const campaignSlug = params.id;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  
  try {
    switch (action) {
      case 'status': {
        const status = await getReplayStatus(campaignSlug);
        return ok(status);
      }
      
      case 'history': {
        const history = await getReplayHistory(campaignSlug);
        return ok(history);
      }
      
      case 'stale': {
        const stale = await getStaleArtifacts(campaignSlug);
        return ok(stale);
      }
      
      case 'snapshots': {
        const snapshotsDir = path.join(resolveCampaignPath(campaignSlug), 'snapshots');
        try {
          const entries = await fs.readdir(snapshotsDir, { withFileTypes: true });
          const snapshots = [];
          for (const entry of entries) {
            if (entry.isDirectory()) {
              const manifest = await getSnapshot(entry.name, campaignSlug);
              if (manifest) {
                snapshots.push(manifest);
              }
            }
          }
          return ok({ snapshots });
        } catch {
          return ok({ snapshots: [] });
        }
      }
      
      case 'archives': {
        const stageId = url.searchParams.get('stageId');
        if (!stageId) {
          return fail('STAGE_ID_REQUIRED', 'stageId required.', { status: 400 });
        }
        const runs = await getArchivedRuns(campaignSlug, stageId);
        return ok({ archivedRuns: runs });
      }
      
      default: {
        const status = await getReplayStatus(campaignSlug);
        const history = await getReplayHistory(campaignSlug);
        const stale = await getStaleArtifacts(campaignSlug);
        return ok({
          ...status,
          history: history.runs.slice(-10),
          staleArtifacts: stale.staleArtifacts.slice(0, 10)
        });
      }
    }
  } catch (error) {
    return fail('FAILED_TO_GET_REPLAY_DATA', 'Failed to get replay data.', { status: 500 }, error instanceof Error ? error.message : 'Unknown error');
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const campaignSlug = params.id;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  
  try {
    const body = await request.json();
    
    switch (action) {
      case 'restore': {
        const { stageId, runIdToRestore, restoreReason } = body;
        if (!stageId || !runIdToRestore || !restoreReason) {
          return fail('INVALID_RESTORE_INPUT', 'stageId, runIdToRestore, and restoreReason are required.', { status: 400 });
        }
        const result = await restoreArchivedOutput(
          campaignSlug,
          stageId,
          runIdToRestore,
          restoreReason,
          body.triggeredBy || 'dashboard'
        );
        return ok(result);
      }
      
      case 'compare': {
        const { oldRunId, newRunId, stageId } = body;
        if (!oldRunId || !newRunId || !stageId) {
          return fail('INVALID_COMPARE_INPUT', 'oldRunId, newRunId, and stageId are required.', { status: 400 });
        }
        const comparison = await compareRunOutputs(campaignSlug, oldRunId, newRunId, stageId);
        return ok(comparison);
      }
      
      case 'dry_run': {
        const { stageId, replayType, rerunReason } = body;
        if (!stageId || !replayType || !rerunReason) {
          return fail('INVALID_DRYRUN_INPUT', 'stageId, replayType, and rerunReason are required.', { status: 400 });
        }
        const report = await runDryRunReplay(
          campaignSlug,
          stageId,
          replayType,
          rerunReason,
          body.triggeredBy || 'dashboard'
        );
        return ok(report);
      }
      
      default: {
        const { stageId, replayType, rerunReason, triggeredBy, promptVersion, brainVersion, modelOverride } = body;
        
        if (!stageId || !replayType || !rerunReason || !triggeredBy) {
          return fail('INVALID_REPLAY_INPUT', 'stageId, replayType, rerunReason, and triggeredBy are required.', { status: 400 });
        }
        
        const resolvedPromptVersion = promptVersion === undefined
          ? getPromptVersionForRoute(stageId)
          : promptVersion;

        const replayRequest: ReplayRequest = {
          campaignSlug,
          stageId,
          replayType,
          rerunReason,
          triggeredBy,
          promptVersion: resolvedPromptVersion,
          brainVersion,
          modelOverride
        };
        
        const result = await executeReplay(replayRequest);
        
        if (!result.success) {
          return fail('REPLAY_FAILED', result.error || 'Replay failed.', { status: 400 });
        }
        
        return ok({ run: result.run });
      }
    }
  } catch (error) {
    return fail('REPLAY_OPERATION_FAILED', 'Replay operation failed.', { status: 500 }, error instanceof Error ? error.message : 'Unknown error');
  }
}
