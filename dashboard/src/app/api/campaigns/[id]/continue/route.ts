// POST /api/campaigns/[id]/continue - Resume workflow
import { NextRequest } from 'next/server';
import { fail, ok } from '@/lib/apiResponse';
import { evaluateMutationAuth } from '@/lib/authGuard';
import { z } from 'zod';
import { writeSystemLog } from '@/lib/logger';
import path from 'path';
import { appendCircuitBreakerError, validateStageHandoff } from '@/lib/stageHandoffValidator';
import { assertValidCampaignId, resolveCampaignPath } from '@/lib/requestGuard';

const ContinueInputSchema = z.object({
  currentStage: z.number().int().min(1).max(16),
  selectedAngles: z.array(z.unknown()).optional().default([]),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = evaluateMutationAuth(request);
    if (!auth.allowed) {
      return fail('AUTH_REQUIRED', auth.reason, { status: 401 });
    }

    const rawBody = await request.json().catch(() => null);
    const parsed = ContinueInputSchema.safeParse(rawBody);
    if (!parsed.success) {
      return fail(
        'INVALID_CONTINUE_INPUT',
        'Continue payload validation failed.',
        { status: 400 },
        parsed.error.issues.map(issue => `${issue.path.join('.') || 'body'}: ${issue.message}`)
      );
    }

    const { currentStage, selectedAngles } = parsed.data;
    const stageNumber = Number(currentStage);
    const campaignId = assertValidCampaignId(params.id);
    const campaignPath = resolveCampaignPath(campaignId);

    if (!Number.isFinite(stageNumber) || stageNumber < 1) {
      return fail(
        'INVALID_STAGE',
        'A valid currentStage number is required.',
        { status: 400 },
        { campaignId }
      );
    }

    const handoffValidation = await validateStageHandoff(campaignPath, stageNumber);
    if (!handoffValidation.valid) {
      await appendCircuitBreakerError(campaignPath, stageNumber, handoffValidation.missingRequirements);
      await writeSystemLog({
        level: 'error',
        source: 'workflow',
        campaignId,
        message: `Stage ${stageNumber} handoff blocked by required files.`,
        details: JSON.stringify(handoffValidation.missingRequirements),
      });
      return fail(
        'STAGE_HANDOFF_BLOCKED',
        `Stage ${stageNumber} handoff blocked. Required files are missing.`,
        { status: 409 },
        {
          gate: 'stage_handoff_validation',
          canContinue: false,
          missingRequirements: handoffValidation.missingRequirements,
          campaignId,
        }
      );
    }
    
    // Stage 6 (Beat Matching) -> Stage 7 (Pitch Selection)
    if (stageNumber === 6) {
      return ok({
        message: 'Beat Matching completed. Pitch Selection is required before Journalist Collection.',
        nextStage: 7,
        nextRoute: '/pitch-selection',
        requiresAction: 'Select at least one pitch angle',
        campaignId,
        timestamp: new Date().toISOString()
      });
    }
    
    // Stage 7 (Pitch Selection) -> Stage 8 (Journalist Collection)
    if (stageNumber === 7) {
      if (!selectedAngles || selectedAngles.length === 0) {
        return fail(
          'PITCH_SELECTION_REQUIRED',
          'Select at least one pitch angle before continuing to Journalist Collection.',
          { status: 400 },
          {
            requiredAction: 'Select pitch angles',
            redirectTo: '/pitch-selection',
            campaignId,
          }
        );
      }
      
      return ok({
        message: 'Pitch Selection completed. Journalist Collection unlocked.',
        nextStage: 8,
        nextRoute: '/journalists',
        selectedAnglesCount: selectedAngles.length,
        campaignId,
        timestamp: new Date().toISOString()
      });
    }
    
    // Default: continue normally
    return ok({
      message: 'Workflow resumed',
      nextStage: stageNumber + 1,
      campaignId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return fail(
      'CONTINUE_FAILED',
      'Failed to continue workflow.',
      { status: 500 },
      {
        campaignId: params.id,
        reason: error instanceof Error ? error.message : String(error),
      }
    );
  }
}
