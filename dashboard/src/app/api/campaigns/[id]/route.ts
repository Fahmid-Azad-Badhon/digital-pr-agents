// GET /api/campaigns/[id] - Get single campaign
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { fail, ok } from '@/lib/apiResponse';
import { evaluateMutationAuth } from '@/lib/authGuard';
import { CampaignPatchInputSchema } from '@/lib/inputSchemas';
import { validateStagePitchGovernance } from '@/lib/pitchGovernanceValidator';
import { validateInput } from '@/lib/schemaValidation';
import { validateStageHandoff } from '@/lib/stageHandoffValidator';
import { assertValidCampaignId, resolveCampaignPath } from '@/lib/requestGuard';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const campaignId = assertValidCampaignId(params.id);
  const campaignPath = resolveCampaignPath(campaignId);
  
  try {
    const files = await fs.readdir(campaignPath);
    
    const briefFile = files.find(f => f.startsWith('00-brief'));
    let brief = null;
    
    if (briefFile) {
      const content = await fs.readFile(path.join(campaignPath, briefFile), 'utf-8');
      const nameMatch = content.match(/^#\s+(.+)$/m) || content.match(/Campaign:\s*(.+)/i);
      const clientMatch = content.match(/Client:\s*(.+)/i);
      
      brief = {
        name: nameMatch?.[1]?.trim() || campaignId,
        clientName: clientMatch?.[1]?.trim() || 'Unknown'
      };
    }
    
    let currentStage = 1;
    const stageFile = files.find(f => f.startsWith('stage') && f.endsWith('.json'));
    if (stageFile) {
      const stageData = JSON.parse(await fs.readFile(path.join(campaignPath, stageFile), 'utf-8'));
      currentStage = stageData.currentStage || 1;
    }
    
    const angleFile = files.find(f => f.startsWith('04-angles'));
    let selectedAngleId = null;
    if (angleFile) {
      const content = await fs.readFile(path.join(campaignPath, angleFile), 'utf-8');
      const selectedMatch = content.match(/\[SELECTED\]/i);
      if (selectedMatch) {
        selectedAngleId = 1;
      }
    }
    
    return NextResponse.json({
      id: campaignId,
      name: brief?.name || campaignId,
      clientName: brief?.clientName || 'Unknown',
      status: currentStage >= 16 ? 'completed' : 'running',
      currentStage,
      selectedAngleId
    });
  } catch {
    return NextResponse.json({ 
      id: campaignId,
      name: campaignId,
      clientName: 'Unknown',
      status: 'draft',
      currentStage: 1,
      selectedAngleId: null
    });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = evaluateMutationAuth(request);
  if (!auth.allowed) {
    return fail('AUTH_REQUIRED', auth.reason, { status: 401 });
  }

  const campaignId = assertValidCampaignId(params.id);
  const rawBody = await request.json().catch(() => null);
    const parsedInput = validateInput(CampaignPatchInputSchema, rawBody);
    if (!parsedInput.success) {
      return fail(
        'INVALID_CAMPAIGN_PATCH_INPUT',
        'Campaign patch payload validation failed.',
        { status: 400 },
        parsedInput.errors
      );
    }
  const data = parsedInput.data;
  const campaignPath = resolveCampaignPath(campaignId);
  
  try {
    await fs.mkdir(campaignPath, { recursive: true });
    
    const stageFile = path.join(campaignPath, 'stage-state.json');
    const existingData = await fs.readFile(stageFile, 'utf-8')
      .then(content => JSON.parse(content) as { currentStage?: number; status?: string })
      .catch(() => ({ currentStage: 1, status: 'draft' }));

    const existingStage = Number.isFinite(existingData.currentStage) ? Number(existingData.currentStage) : 1;
    const requestedStage = data.currentStage;
    if (typeof requestedStage === 'number' && !data.forceStage) {
      const maxForwardStage = existingStage + 1;
      if (requestedStage > maxForwardStage) {
        return fail(
          'STAGE_JUMP_BLOCKED',
          `Cannot jump from stage ${existingStage} to ${requestedStage} without forceStage=true.`,
          { status: 409 },
          { existingStage, requestedStage, allowedMax: maxForwardStage }
        );
      }

      if (requestedStage > existingStage) {
        const handoff = await validateStageHandoff(campaignPath, existingStage);
        if (!handoff.valid) {
          return fail(
            'STAGE_HANDOFF_BLOCKED',
            `Stage ${existingStage} handoff is blocked by missing required files.`,
            { status: 409 },
            handoff.missingRequirements
          );
        }

        if (existingStage === 10 || existingStage === 11 || existingStage === 12) {
          const governance = await validateStagePitchGovernance(campaignPath, existingStage);
          if (!governance.valid) {
            return fail(
              'PITCH_GOVERNANCE_BLOCKED',
              `Stage ${existingStage} failed claim-ledger or language governance checks.`,
              { status: 409 },
              {
                stage: existingStage,
                filePath: governance.filePath,
                issues: governance.issues,
                warnings: governance.warnings,
              }
            );
          }
        }
      }
    }

    const nextState = {
      ...existingData,
      ...(typeof data.currentStage === 'number' ? { currentStage: data.currentStage } : {}),
      ...(data.status ? { status: data.status } : {}),
    };
    
    await fs.writeFile(stageFile, JSON.stringify(nextState, null, 2));
    
    return ok({
      id: campaignId,
      ...nextState,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    return fail(
      'FAILED_TO_UPDATE_CAMPAIGN',
      'Failed to update campaign.',
      { status: 500 },
      error instanceof Error ? error.message : String(error)
    );
  }
}
