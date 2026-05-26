import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { resolveCampaignPath } from '@/lib/requestGuard';
import { validateStageHandoff } from '@/lib/stageHandoffValidator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignId } = await params;
  const campaignPath = resolveCampaignPath(campaignId);

  try {
    const { searchParams } = new URL(request.url);
    const stageParam = searchParams.get('stage');
    const requestedStage = stageParam ? Number(stageParam) : null;

    let stageToValidate = requestedStage;
    if (!Number.isFinite(stageToValidate as number)) {
      const stageStatePath = path.join(campaignPath, 'stage-state.json');
      const stageState = await fs.readFile(stageStatePath, 'utf-8')
        .then(content => JSON.parse(content) as { currentStage?: number })
        .catch(() => null);
      stageToValidate = stageState?.currentStage || 1;
    }

    const validation = await validateStageHandoff(campaignPath, stageToValidate as number);

    return NextResponse.json({
      campaignId,
      stage: validation.stage,
      valid: validation.valid,
      canContinue: validation.valid,
      missingRequirements: validation.missingRequirements,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      campaignId,
      error: 'Failed to validate stage handoff.',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
