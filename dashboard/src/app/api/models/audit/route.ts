import { NextResponse } from 'next/server';
import { CAMPAIGN_STAGE_ROUTING, MODEL_CONFIG } from '@/config/model-routing.config';
import { getModelRunLogs } from '@/lib/modelRouter';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stageId = searchParams.get('stageId') || undefined;
  const limitParam = parseInt(searchParams.get('limit') || '200', 10);
  const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(limitParam, 2000)) : 200;

  const allLogs = getModelRunLogs().filter(l => l.contextType === 'campaign_stage');
  const filtered = stageId ? allLogs.filter(l => l.stageId === stageId) : allLogs;
  const events = filtered.slice(-limit).reverse();

  const stages = Object.entries(CAMPAIGN_STAGE_ROUTING).map(([id, routing]) => {
    const runs = events.filter(e => e.stageId === id);
    const fallbackRuns = runs.filter(r => r.fallbackUsed).length;
    const reviewerRuns = runs.filter(r => r.reviewerModelUsed).length;
    const reviewerApprovedRuns = runs.filter(r => r.reviewerApproved === true).length;

    return {
      stageId: id,
      primaryModel: routing.primary,
      primaryModelName: MODEL_CONFIG[routing.primary]?.displayName || routing.primary,
      fallback1: routing.fallback1,
      fallback1Name: MODEL_CONFIG[routing.fallback1]?.displayName || routing.fallback1,
      fallback2: routing.fallback2,
      fallback2Name: MODEL_CONFIG[routing.fallback2]?.displayName || routing.fallback2,
      mandatoryReviewer: routing.mandatoryReviewer || null,
      mandatoryReviewerName: routing.mandatoryReviewer ? (MODEL_CONFIG[routing.mandatoryReviewer]?.displayName || routing.mandatoryReviewer) : null,
      requiresHumanApproval: routing.requiresHumanApproval || false,
      runs: runs.length,
      fallbackRate: runs.length ? Math.round((fallbackRuns / runs.length) * 100) : 0,
      reviewerPassRate: reviewerRuns ? Math.round((reviewerApprovedRuns / reviewerRuns) * 100) : null,
      lastRunAt: runs[0]?.timestamp || null
    };
  });

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    filters: { stageId: stageId || null, limit },
    totals: {
      loggedStageRuns: allLogs.length,
      returnedEvents: events.length,
      configuredStages: stages.length
    },
    events: events.map(e => ({
      timestamp: e.timestamp,
      stageId: e.stageId,
      primaryModel: e.primaryModel,
      modelUsed: e.modelUsed,
      reviewerModelUsed: e.reviewerModelUsed || null,
      reviewerApproved: e.reviewerApproved ?? null,
      fallbackUsed: e.fallbackUsed,
      fallbackReason: e.fallbackReason || null,
      retryCount: e.retryCount,
      status: e.status,
      durationMs: e.durationMs,
      errorMessage: e.errorMessage || null
    })),
    stages
  });
}
