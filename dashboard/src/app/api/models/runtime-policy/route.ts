import { ok } from '@/lib/apiResponse';
import { CAMPAIGN_STAGE_ROUTING, MODEL_CONFIG } from '@/config/model-routing.config';

const COST_WEIGHTS: Record<string, number> = {
  free: 0,
  low: 1,
  medium: 2,
  high: 3,
};

export async function GET() {
  const stages = Object.entries(CAMPAIGN_STAGE_ROUTING).map(([stageId, routing]) => {
    const primary = MODEL_CONFIG[routing.primary];
    const fallback1 = MODEL_CONFIG[routing.fallback1];
    const fallback2 = MODEL_CONFIG[routing.fallback2];
    const reviewer = routing.mandatoryReviewer ? MODEL_CONFIG[routing.mandatoryReviewer] : null;

    const weightedCost =
      (COST_WEIGHTS[primary?.costLevel || 'medium'] ?? 2) +
      (fallback1 ? (COST_WEIGHTS[fallback1.costLevel] ?? 2) : 0) +
      (fallback2 ? (COST_WEIGHTS[fallback2.costLevel] ?? 2) : 0) +
      (reviewer ? (COST_WEIGHTS[reviewer.costLevel] ?? 2) : 0);

    return {
      stageId,
      primary: routing.primary,
      fallback1: routing.fallback1,
      fallback2: routing.fallback2,
      mandatoryReviewer: routing.mandatoryReviewer || null,
      fallbackChainLength: [routing.primary, routing.fallback1, routing.fallback2].filter(Boolean).length,
      estimatedCostWeight: weightedCost,
      estimatedRisk: primary?.enabledInProductionWorkflow ? 'controlled' : 'elevated',
    };
  });

  return ok({
    generatedAt: new Date().toISOString(),
    totalStages: stages.length,
    stages,
  });
}

