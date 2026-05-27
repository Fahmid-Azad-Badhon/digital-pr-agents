import { NextRequest } from 'next/server';
import { evaluateMutationAuth } from '@/lib/authGuard';
import fs from 'fs/promises';
import { fail, ok } from '@/lib/apiResponse';
import { ScriptActionInputSchema } from '@/lib/inputSchemas';
import { writeApiAuditLog } from '@/lib/logger';
import { validateStagePitchGovernance } from '@/lib/pitchGovernanceValidator';
import { checkRateLimit } from '@/lib/rateLimiter';
import { assertValidCampaignId, resolveCampaignPath, sanitizeStageFile, sanitizeText } from '@/lib/requestGuard';
import { validateInput } from '@/lib/schemaValidation';
import { isScriptAction, runScriptAction } from '@/lib/scriptRunner';
import { getRunModeFromRequest } from '@/lib/runMode';

const ACTION_STAGE_HINT: Record<string, number> = {
  draft_study_input: 2,
  import_muckrack_output: 8,
  draft_journalist_intel: 9,
  draft_pitch_draft: 10,
  export_google_doc: 13,
};

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
    const rawBody = await request.json().catch(() => null);
    const parsedInput = validateInput(ScriptActionInputSchema, rawBody);
    if (!parsedInput.success) {
      return fail('INVALID_BODY', 'Request body must be valid JSON.', { status: 400 });
    }
    const body = parsedInput.data;

    const action = body.action;
    if (!isScriptAction(action)) {
      return fail('INVALID_ACTION', 'Unsupported script action.', { status: 400 });
    }
    const stageHint = ACTION_STAGE_HINT[action] ?? null;

    const clientKey = request.headers.get('x-forwarded-for')
      || request.headers.get('x-real-ip')
      || 'local';
    const limit = checkRateLimit(`scripts:${clientKey}:${campaignId}`, { max: 25, windowMs: 60_000 });
    if (!limit.allowed) {
      return fail(
        'RATE_LIMITED',
        'Too many script requests. Please wait and try again.',
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

    const runMode = getRunModeFromRequest(request);

    const payload: Record<string, unknown> = { campaignId };
    if (action === 'validate_stage') {
      payload.stageFile = sanitizeStageFile(body.stageFile);
    }
    if (action === 'import_muckrack_output') {
      payload.all = Boolean(body.all);
    }
    if (action === 'export_google_doc') {
      payload.title = sanitizeText(body.title, 140);
    }

    await writeApiAuditLog(request, {
      level: 'info',
      source: 'script-runner',
      message: `Starting script action: ${action}`,
      fields: {
        campaignId,
        stage: stageHint,
        action,
        actor: 'dashboard_user',
        extra: { runMode },
      },
    });

    const result = await runScriptAction(action, payload);
    const isSuccess = result.exitCode === 0;

    if (isSuccess && stageHint === 10) {
      const governance = await validateStagePitchGovernance(campaignPath, 10);
      if (!governance.valid) {
        await writeApiAuditLog(request, {
          level: 'error',
          source: 'governance',
          message: 'S10 claim-ledger/language validation failed after draft generation.',
          details: JSON.stringify(governance.issues),
          fields: {
            campaignId,
            stage: stageHint,
            action: 'governance_validate',
            actor: 'dashboard_user',
            extra: { filePath: governance.filePath },
          },
        });

        return fail(
          'S10_GOVERNANCE_VALIDATION_FAILED',
          'Stage 10 output violates claim-ledger or language governance rules.',
          {
            status: 409,
            headers: {
              'X-RateLimit-Remaining': String(limit.remaining),
              'X-RateLimit-Reset': String(limit.resetAt),
            },
          },
          {
            stage: 10,
            filePath: governance.filePath,
            issues: governance.issues,
            warnings: governance.warnings,
            stdout: result.stdout,
            stderr: result.stderr,
          }
        );
      }
    }

    await writeApiAuditLog(request, {
      level: isSuccess ? 'success' : 'error',
      source: 'script-runner',
      message: `Completed script action: ${action} (exit ${result.exitCode})`,
      details: result.stderr || result.stdout || undefined,
      fields: {
        campaignId,
        stage: stageHint,
        action,
        actor: 'dashboard_user',
        extra: {
          durationMs: result.durationMs,
          command: result.command,
        },
      },
    });

    return ok({
      action,
      campaignId,
      stageHint,
      success: isSuccess,
      exitCode: result.exitCode,
      durationMs: result.durationMs,
      stdout: result.stdout,
      stderr: result.stderr,
      command: result.command,
    }, {
      status: isSuccess ? 200 : 500,
      headers: {
        'X-RateLimit-Remaining': String(limit.remaining),
        'X-RateLimit-Reset': String(limit.resetAt),
      },
    });
  } catch (error) {
    return fail(
      'SCRIPT_EXECUTION_FAILED',
      'Failed to execute script action.',
      { status: 500 },
      error instanceof Error ? error.message : String(error)
    );
  }
}
