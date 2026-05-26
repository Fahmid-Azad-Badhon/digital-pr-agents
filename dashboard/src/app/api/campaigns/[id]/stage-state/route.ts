import fs from 'fs/promises';
import path from 'path';
import { NextRequest } from 'next/server';
import { fail, ok } from '@/lib/apiResponse';
import { evaluateMutationAuth } from '@/lib/authGuard';
import { StageStateUpdateInputSchema } from '@/lib/inputSchemas';
import { assertValidCampaignId, resolveCampaignPath } from '@/lib/requestGuard';
import { validateInput } from '@/lib/schemaValidation';
import { validateStageHandoff } from '@/lib/stageHandoffValidator';
import { validateStagePitchGovernance } from '@/lib/pitchGovernanceValidator';
import { TOTAL_WORKFLOW_STAGES } from '@/types';
import { writeApiAuditLog } from '@/lib/logger';

type StageState = {
  currentStage: number;
  status: string;
  updatedAt: string;
  [key: string]: unknown;
};

const DEFAULT_STATE: StageState = {
  currentStage: 1,
  status: 'running',
  updatedAt: new Date(0).toISOString(),
};

async function readStageState(campaignPath: string): Promise<StageState> {
  const stagePath = path.join(campaignPath, 'stage-state.json');
  const parsed = await fs.readFile(stagePath, 'utf-8')
    .then(content => JSON.parse(content) as Partial<StageState>)
    .catch(() => null);

  return {
    ...(parsed || {}),
    currentStage: Number.isFinite(parsed?.currentStage) ? Number(parsed?.currentStage) : DEFAULT_STATE.currentStage,
    status: typeof parsed?.status === 'string' && parsed.status.trim() ? parsed.status.trim() : DEFAULT_STATE.status,
    updatedAt: typeof parsed?.updatedAt === 'string' ? parsed.updatedAt : DEFAULT_STATE.updatedAt,
  };
}

async function writeStageState(campaignPath: string, state: StageState): Promise<void> {
  const stagePath = path.join(campaignPath, 'stage-state.json');
  const tempPath = `${stagePath}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(state, null, 2), 'utf-8');
  await fs.rename(tempPath, stagePath);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = assertValidCampaignId(params.id);
    const campaignPath = resolveCampaignPath(campaignId);
    const exists = await fs.stat(campaignPath).then(stat => stat.isDirectory()).catch(() => false);
    if (!exists) {
      return fail('CAMPAIGN_NOT_FOUND', `Campaign "${campaignId}" not found.`, { status: 404 });
    }

    const state = await readStageState(campaignPath);
    const handoff = await validateStageHandoff(campaignPath, state.currentStage);
    const canAdvance = handoff.valid && state.currentStage < TOTAL_WORKFLOW_STAGES;
    const governanceStages: Array<10 | 11 | 12> = [10, 11, 12];
    const governanceResults = [];
    if (state.currentStage >= 10) {
      for (const stage of governanceStages) {
        if (stage > state.currentStage) {
          continue;
        }
        const governance = await validateStagePitchGovernance(campaignPath, stage);
        governanceResults.push({
          stage,
          filePath: governance.filePath,
          valid: governance.valid,
          issues: governance.issues,
          warnings: governance.warnings,
        });
      }
    }

    return ok({
      campaignId,
      stageState: state,
      enforcement: {
        canAdvance,
        blockedByMissingFiles: !handoff.valid,
        missingRequirements: handoff.missingRequirements,
        nextAllowedStage: Math.min(state.currentStage + 1, TOTAL_WORKFLOW_STAGES),
        maxStage: TOTAL_WORKFLOW_STAGES,
      },
      governance: {
        hasBlockingIssues: governanceResults.some(result => !result.valid),
        results: governanceResults,
      },
    });
  } catch (error) {
    return fail(
      'FAILED_TO_READ_STAGE_STATE',
      'Failed to read campaign stage state.',
      { status: 500 },
      error instanceof Error ? error.message : String(error)
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = evaluateMutationAuth(request);
    if (!auth.allowed) {
      return fail('AUTH_REQUIRED', auth.reason, { status: 401 });
    }

    const campaignId = assertValidCampaignId(params.id);
    const campaignPath = resolveCampaignPath(campaignId);
    const exists = await fs.stat(campaignPath).then(stat => stat.isDirectory()).catch(() => false);
    if (!exists) {
      return fail('CAMPAIGN_NOT_FOUND', `Campaign "${campaignId}" not found.`, { status: 404 });
    }

    const rawBody = await request.json().catch(() => null);
    const parsedInput = validateInput(StageStateUpdateInputSchema, rawBody);
    if (!parsedInput.success) {
      return fail('INVALID_STAGE_STATE_INPUT', 'Stage state payload validation failed.', { status: 400 }, parsedInput.errors);
    }

    const input = parsedInput.data;
    const existing = await readStageState(campaignPath);
    let targetStage = existing.currentStage;
    let targetStatus = input.status || existing.status;

    if (input.action === 'pause') {
      targetStatus = 'paused';
    } else if (input.action === 'resume') {
      targetStatus = 'running';
    } else if (input.action === 'advance') {
      targetStage = Math.min(existing.currentStage + 1, TOTAL_WORKFLOW_STAGES);
      targetStatus = targetStage >= TOTAL_WORKFLOW_STAGES ? 'completed' : 'running';
    } else if (input.action === 'set') {
      if (!input.toStage) {
        return fail('TARGET_STAGE_REQUIRED', 'toStage is required when action="set".', { status: 400 });
      }
      targetStage = input.toStage;
      targetStatus = input.status || (targetStage >= TOTAL_WORKFLOW_STAGES ? 'completed' : existing.status);
    }

    if (targetStage > existing.currentStage + 1 && !input.force) {
      return fail(
        'STAGE_JUMP_BLOCKED',
        `Cannot jump from stage ${existing.currentStage} to ${targetStage} without force=true.`,
        { status: 409 },
        { existingStage: existing.currentStage, requestedStage: targetStage, allowedMax: existing.currentStage + 1 }
      );
    }

    if (targetStage > existing.currentStage && !input.force) {
      const handoff = await validateStageHandoff(campaignPath, existing.currentStage);
      if (!handoff.valid) {
        return fail(
          'STAGE_HANDOFF_BLOCKED',
          `Stage ${existing.currentStage} handoff is blocked by missing required files.`,
          { status: 409 },
          handoff.missingRequirements
        );
      }

      if (existing.currentStage === 10 || existing.currentStage === 11 || existing.currentStage === 12) {
        const governance = await validateStagePitchGovernance(campaignPath, existing.currentStage);
        if (!governance.valid) {
          return fail(
            'PITCH_GOVERNANCE_BLOCKED',
            `Stage ${existing.currentStage} failed claim-ledger or language governance checks.`,
            { status: 409 },
            {
              stage: existing.currentStage,
              filePath: governance.filePath,
              issues: governance.issues,
              warnings: governance.warnings,
            }
          );
        }
      }
    }

    const nextState: StageState = {
      ...existing,
      currentStage: targetStage,
      status: targetStatus,
      updatedAt: new Date().toISOString(),
    };

    await writeStageState(campaignPath, nextState);
    await writeApiAuditLog(request, {
      level: 'info',
      source: 'stage-state',
      message: `Stage state updated via action: ${input.action}`,
      fields: {
        stage: nextState.currentStage,
        campaignId,
        actor: 'dashboard_user',
        action: `stage_state_${input.action}`,
      },
    });

    return ok({
      campaignId,
      previousState: existing,
      stageState: nextState,
      forced: input.force,
    });
  } catch (error) {
    const campaignId = params.id;
    await writeApiAuditLog(request, {
      level: 'error',
      source: 'stage-state',
      message: 'Failed to update campaign stage state.',
      details: error instanceof Error ? error.message : String(error),
      fields: {
        stage: null,
        campaignId,
        actor: 'dashboard_user',
        action: 'stage_state_update_failed',
      },
    }).catch(() => undefined);
    return fail(
      'FAILED_TO_UPDATE_STAGE_STATE',
      'Failed to update campaign stage state.',
      { status: 500 },
      error instanceof Error ? error.message : String(error)
    );
  }
}
