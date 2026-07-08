// GET /api/workflow - Get workflow status from canonical state
import { NextRequest } from 'next/server';
import { fail, ok } from '@/lib/apiResponse';
import { evaluateMutationAuth } from '@/lib/authGuard';
import { WorkflowActionInputSchema } from '@/lib/inputSchemas';
import { writeApiAuditLog } from '@/lib/logger';
import { validateStagePitchGovernance } from '@/lib/pitchGovernanceValidator';
import { checkRateLimit } from '@/lib/rateLimiter';
import { assertValidCampaignId, resolveCampaignPath } from '@/lib/requestGuard';
import { validateInput } from '@/lib/schemaValidation';
import { appendCircuitBreakerError, validateStageHandoff } from '@/lib/stageHandoffValidator';
import { getCampaignState } from '@/lib/campaignStateService';
import { looksLikeFallback } from '@/lib/fallbackMarkers';
import { STAGES, TOTAL_WORKFLOW_STAGES } from '@/types';
import fs from 'fs/promises';
import path from 'path';

async function readStageState(campaignPath: string) {
  const stageStatePath = path.join(campaignPath, 'stage-state.json');
  const state = await fs.readFile(stageStatePath, 'utf-8')
    .then(content => JSON.parse(content) as { currentStage?: number; status?: string; lastExecutedStage?: number })
    .catch(() => null);

  return {
    currentStage: state?.currentStage && Number.isFinite(state.currentStage) ? state.currentStage : 1,
    status: state?.status || 'running',
    lastExecutedStage: state?.lastExecutedStage && Number.isFinite(state.lastExecutedStage) ? state.lastExecutedStage : 0,
  };
}

const STAGE_EXPECTED_FILES: Record<number, string[]> = {
  1: ['01-campaign-intake.json'],
  2: ['02-insights.md', '01-study-notes.md'],
  3: ['03-research.md'],
  4: ['04-angles.md'],
  5: ['05-angles.md', '05-beats.md'],
  6: ['06-beat-match.json'],
  7: ['human-approval.json'],
  8: ['08-journalist-list.csv'],
  9: ['09-journalist-intelligence.json'],
  10: ['10-pitch-draft.md'],
  11: ['11-optimized-pitch.md'],
  12: ['12-outreach-package.md'],
  13: ['13-validation-report.json'],
  14: ['14-final-formatted-package.md'],
  15: ['15-outreach-assets.md'],
  16: ['16-campaign-learning-log.json'],
};

async function validateStageOutputExists(campaignPath: string, stage: number): Promise<{ valid: boolean; missing: string[]; fallback: string[] }> {
  const files = STAGE_EXPECTED_FILES[stage] || [];
  const missing: string[] = [];
  const fallback: string[] = [];

  for (const file of files) {
    const fullPath = path.join(campaignPath, file);
    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      if (!content.trim()) {
        missing.push(`${file} (empty)`);
      } else if (looksLikeFallback(content)) {
        fallback.push(file);
      }
    } catch {
      missing.push(file);
    }
  }

  return { valid: missing.length === 0 && fallback.length === 0, missing, fallback };
}

async function writeStageState(campaignPath: string, newState: { currentStage: number; status: string }, options?: { allowRegression?: boolean; reset?: boolean }) {
  const stageStatePath = path.join(campaignPath, 'stage-state.json');

  // Read current state first to prevent regression
  let currentState = { currentStage: 1, status: 'running' as string };
  try {
    const existing = await fs.readFile(stageStatePath, 'utf-8');
    const parsed = JSON.parse(existing);
    if (parsed && typeof parsed.currentStage === 'number') {
      currentState = parsed;
    }
  } catch {
    // File doesn't exist or is malformed - use defaults
  }

  // Allow regression only for explicit reset/start actions
  // Otherwise prevent accidental stage regression
  let safeStage: number;
  if (options?.allowRegression || options?.reset) {
    // Explicit reset allowed - can go back to stage 1
    safeStage = newState.currentStage;
  } else {
    // Prevent accidental regression - only allow advancement or same stage
    safeStage = Math.max(currentState.currentStage, newState.currentStage);
  }

  // Merge state with updatedAt for stale-write detection
  const mergedState = {
    ...newState,
    currentStage: safeStage,
    updatedAt: new Date().toISOString(),
    // Preserve original stage if we prevented regression
    _previousStage: safeStage !== newState.currentStage ? newState.currentStage : undefined,
    // Track if this was an explicit reset
    _reset: options?.reset ? true : undefined
  };

  const tempPath = `${stageStatePath}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(mergedState, null, 2), 'utf-8');
  await fs.rename(tempPath, stageStatePath);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('campaignId') || 'default';

  try {
    // Use canonical campaign state service for consistency
    const state = await getCampaignState(campaignId);

    if (!state) {
      return fail('CAMPAIGN_NOT_FOUND', `Campaign "${campaignId}" not found.`, { status: 404 });
    }

    // Get selected angles count from human approval
    const selectedAnglesCount = state.humanApproval.status === 'approved' ? 1 : 0;

    // Transform canonical stages to legacy format
    const stages = state.stages.map(stage => ({
      number: stage.number,
      name: stage.name,
      owner: stage.owner,
      phase: stage.phase,
      status: stage.status === 'completed' ? 'completed' :
             stage.status === 'running' ? 'running' :
             stage.status === 'paused' ? 'paused' :
             stage.status === 'blocked' ? 'blocked' :
             stage.status === 'failed' ? 'failed' : 'waiting',
      progress: stage.progress
    }));

    // Map canonical status to workflow status
    let status: string;
    switch (state.overallStatus) {
      case 'completed':
        status = 'completed';
        break;
      case 'waiting_for_human_approval':
        status = 'needs_review';
        break;
      case 'failed':
        status = 'failed';
        break;
      case 'paused':
        status = 'paused';
        break;
      default:
        status = state.currentStage >= TOTAL_WORKFLOW_STAGES ? 'completed' : 'running';
    }

    const confidenceScore = calculateConfidence(state.currentStage, selectedAnglesCount, state.blockers.length > 0);
    const warningLevel = getWarningLevelFromStatus(state.currentStage, selectedAnglesCount, state.blockers.map(b => b.reason));

    const workflowStatus = {
      currentStage: state.currentStage,
      totalStages: TOTAL_WORKFLOW_STAGES,
      currentPhase: state.currentPhase,
      status,
      isPaused: state.overallStatus === 'paused',
      needsUserSelection: state.humanActionRequired,
      activeActor: state.humanActionRequired ? 'Human Reviewer + Orchestrator' : 'Orchestrator',
      confidence: confidenceScore,
      warningLevel,
      stages,
      pitchSelection: {
        availableAngles: 40,
        selectedAngles: selectedAnglesCount,
        rejectedAngles: 0,
        status: state.currentStage >= 7 ? (selectedAnglesCount > 0 ? 'completed' : 'needs_review') : 'pending'
      },
      nextStage: state.currentStage + 1,
      nextStageName: STAGES[state.currentStage]?.name || 'Complete',
      lockedStages: state.currentStage < 7 ? [7, 8, 9, 10, 11, 12, 13, 14, 15, 16] : [],
      canWorkflowContinue: state.canWorkflowContinue,
      blockers: state.blockers,
      strictAuditReady: state.strictAuditReady
    };

    return ok(workflowStatus, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return fail('WORKFLOW_STATUS_FAILED', 'Failed to get workflow status', { status: 500 });
  }
}

function calculateConfidence(stage: number, angles: number, hasBlockers: boolean): { level: string; score: number; reason: string } {
  if (hasBlockers) return { level: 'Failed', score: 0, reason: 'Workflow has blockers that need resolution' };
  if (stage < 5) return { level: 'Medium', score: 65, reason: 'Early stages - data gathering in progress' };
  if (stage === 5) return { level: 'Medium', score: 70, reason: 'Angle generation complete - human selection pending' };
  if (stage === 6) return { level: 'High', score: 85, reason: 'Strong angle selection with beat matching' };
  if (stage === 7) {
    if (angles === 0) return { level: 'Needs Human Review', score: 0, reason: 'No angles selected - human approval required' };
    return { level: 'High', score: 90, reason: 'Angles selected - ready for journalist collection' };
  }
  if (stage >= 8 && stage <= 10) return { level: 'Medium', score: 75, reason: 'Pitch drafting in progress' };
  if (stage === 11) return { level: 'High', score: 80, reason: 'Pitch optimized - validation pending' };
  if (stage === 13) return { level: 'High', score: 88, reason: 'Validation complete - quality verified' };
  if (stage >= 14) return { level: 'High', score: 95, reason: 'Final stages - ready for outreach' };
  return { level: 'Medium', score: 70, reason: 'Workflow progressing normally' };
}

function getWarningLevelFromStatus(stage: number, angles: number, issues: string[]): string {
  if (issues.some((i: string) => i.toLowerCase().includes('critical'))) return 'red';
  if (stage === 7 && angles === 0) return 'red';
  if (stage === 13 && issues.some((i: string) => i.toLowerCase().includes('warning'))) return 'orange';
  if (stage >= 8 && stage <= 12) return 'yellow';
  if (issues.length > 0) return 'orange';
  return 'green';
}

export async function POST(request: NextRequest) {
  try {
    const auth = evaluateMutationAuth(request);
    if (!auth.allowed) {
      return fail('AUTH_REQUIRED', auth.reason, { status: 401 });
    }

    const rawBody = await request.json().catch(() => null);
    const parsedInput = validateInput(WorkflowActionInputSchema, rawBody);
    if (!parsedInput.success) {
      return fail('INVALID_BODY', 'Request body must be valid JSON.', { status: 400 });
    }

    const body = parsedInput.data;
    const action = body.action;
    const campaignIdRaw = body.campaignId;
    const selectedAngles = body.selectedAngles;

    if (!campaignIdRaw) {
      return fail('CAMPAIGN_ID_REQUIRED', 'campaignId is required.', { status: 400 });
    }
    const campaignId = assertValidCampaignId(campaignIdRaw);

    const clientKey = request.headers.get('x-forwarded-for')
      || request.headers.get('x-real-ip')
      || 'local';
    const limit = checkRateLimit(`workflow:${clientKey}:${campaignId}`, { max: 40, windowMs: 60_000 });
    if (!limit.allowed) {
      return fail(
        'RATE_LIMITED',
        'Too many workflow actions. Please wait and retry.',
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': String(limit.remaining),
            'X-RateLimit-Reset': String(limit.resetAt),
          },
        }
      );
    }

    const campaignPath = resolveCampaignPath(campaignId);
    const exists = await fs.stat(campaignPath).then(stat => stat.isDirectory()).catch(() => false);
    if (!exists) {
      return fail('CAMPAIGN_NOT_FOUND', `Campaign "${campaignId}" not found.`, { status: 404 });
    }

    const stageState = await readStageState(campaignPath);
    const maxStage = TOTAL_WORKFLOW_STAGES;

    if (action === 'start') {
      // Explicit reset - allow regression to stage 1
      await writeStageState(campaignPath, { currentStage: 1, status: 'running' }, { allowRegression: true, reset: true });
      await writeApiAuditLog(request, {
        level: 'info',
        source: 'workflow',
        message: 'Workflow started.',
        fields: { campaignId, stage: 1, actor: 'dashboard_user', action: 'start' },
      });
      return ok({ campaignId, currentStage: 1, status: 'running' });
    }

    if (action === 'pause') {
      await writeStageState(campaignPath, { currentStage: stageState.currentStage, status: 'paused' });
      await writeApiAuditLog(request, {
        level: 'warning',
        source: 'workflow',
        message: `Workflow paused at stage ${stageState.currentStage}.`,
        fields: { campaignId, stage: stageState.currentStage, actor: 'dashboard_user', action: 'pause' },
      });
      return ok({ campaignId, currentStage: stageState.currentStage, status: 'paused' });
    }

    if (action === 'resume') {
      await writeStageState(campaignPath, { currentStage: stageState.currentStage, status: 'running' });
      await writeApiAuditLog(request, {
        level: 'info',
        source: 'workflow',
        message: `Workflow resumed at stage ${stageState.currentStage}.`,
        fields: { campaignId, stage: stageState.currentStage, actor: 'dashboard_user', action: 'resume' },
      });
      return ok({ campaignId, currentStage: stageState.currentStage, status: 'running' });
    }

    if (action === 'advance' || action === 'complete_stage') {
      if (typeof body.stage === 'number' && body.stage !== stageState.currentStage) {
        return fail(
          'STAGE_MISMATCH',
          `Requested stage ${body.stage} does not match current stage ${stageState.currentStage}.`,
          { status: 409 }
        );
      }

      const normalizedStage = Math.min(stageState.currentStage, maxStage);

      if (normalizedStage === 7 && selectedAngles.length === 0) {
        return fail(
          'PITCH_SELECTION_REQUIRED',
          'Select at least one angle before advancing from Stage 7.',
          { status: 409 }
        );
      }

      const handoffValidation = await validateStageHandoff(campaignPath, normalizedStage);
      if (!handoffValidation.valid) {
        await appendCircuitBreakerError(campaignPath, normalizedStage, handoffValidation.missingRequirements);
        await writeApiAuditLog(request, {
          level: 'error',
          source: 'workflow',
          message: `Stage ${normalizedStage} handoff blocked by missing requirements.`,
          details: JSON.stringify(handoffValidation.missingRequirements),
          fields: {
            campaignId,
            stage: normalizedStage,
            actor: 'dashboard_user',
            action: 'advance_blocked_handoff',
          },
        });
        return fail(
          'STAGE_HANDOFF_BLOCKED',
          `Stage ${normalizedStage} handoff is blocked.`,
          { status: 409 },
          handoffValidation.missingRequirements
        );
      }

      const outputValidation = await validateStageOutputExists(campaignPath, normalizedStage);
      if (!outputValidation.valid) {
        await writeApiAuditLog(request, {
          level: 'error',
          source: 'workflow',
          message: `Stage ${normalizedStage} output validation failed before advance.`,
          details: JSON.stringify({ missing: outputValidation.missing, fallback: outputValidation.fallback }),
          fields: { campaignId, stage: normalizedStage, actor: 'dashboard_user', action: 'advance_blocked_output' },
        });
        return fail('STAGE_OUTPUT_INVALID', `Stage ${normalizedStage} output artifacts are missing or contain fallback markers.`, { status: 409 }, outputValidation);
      }

      if (normalizedStage === 10 || normalizedStage === 11 || normalizedStage === 12) {
        const governance = await validateStagePitchGovernance(campaignPath, normalizedStage);
        if (!governance.valid) {
          await writeApiAuditLog(request, {
            level: 'error',
            source: 'governance',
            message: `S${normalizedStage} governance validation blocked stage advancement.`,
            details: JSON.stringify(governance.issues),
            fields: {
              campaignId,
              stage: normalizedStage,
              actor: 'dashboard_user',
              action: 'advance_blocked_governance',
              extra: { filePath: governance.filePath },
            },
          });

          return fail(
            'PITCH_GOVERNANCE_BLOCKED',
            `Stage ${normalizedStage} failed claim-ledger or language governance checks.`,
            { status: 409 },
            {
              stage: normalizedStage,
              filePath: governance.filePath,
              issues: governance.issues,
              warnings: governance.warnings,
            }
          );
        }
      }

      const nextStage = Math.min(normalizedStage + 1, maxStage);
      const nextStatus = nextStage >= maxStage ? 'completed' : 'running';
      await writeStageState(campaignPath, { currentStage: nextStage, status: nextStatus });
      await writeApiAuditLog(request, {
        level: 'success',
        source: 'workflow',
        message: `Workflow advanced from stage ${normalizedStage} to stage ${nextStage}.`,
        fields: {
          campaignId,
          stage: normalizedStage,
          actor: 'dashboard_user',
          action: action === 'complete_stage' ? 'complete_stage' : 'advance',
        },
      });

      return ok({
        campaignId,
        previousStage: normalizedStage,
        currentStage: nextStage,
        status: nextStatus,
        nextStageName: STAGES[nextStage - 1]?.name || 'Completed',
      });
    }

    if (action === 'select_angles') {
      await writeApiAuditLog(request, {
        level: 'info',
        source: 'workflow',
        message: `Angles selected at Stage 7: ${selectedAngles.length}.`,
        fields: { campaignId, stage: 7, actor: 'dashboard_user', action: 'select_angles' },
      });
      return ok({ campaignId, selectedCount: selectedAngles.length });
    }

    return fail('UNKNOWN_ACTION', `Unknown action: ${action}`, { status: 400 });
  } catch (error) {
    return fail(
      'WORKFLOW_ACTION_FAILED',
      'Failed to process workflow action.',
      { status: 500 },
      error instanceof Error ? error.message : String(error)
    );
  }
}
