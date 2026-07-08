/**
 * Consistency Probe - Checks if all 5 status endpoints agree on campaign state
 *
 * GET /api/diagnostics/consistency?campaignId=<slug>
 *
 * Calls all 5 status sources and compares their results:
 * 1. /api/campaigns (list endpoint)
 * 2. /api/campaigns/<slug>/status
 * 3. /api/workflow?campaignId=<slug>
 * 4. /api/campaigns/<slug>/stage-state (filesystem)
 * 5. /api/campaigns/stats
 *
 * Returns PASS/FAIL for each comparison along with raw responses.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCampaignState, getCampaignStats, getCampaignListState } from '@/lib/campaignStateService';
import { assertValidCampaignId, resolveCampaignPath } from '@/lib/requestGuard';
import fs from 'fs/promises';
import path from 'path';

interface SourceResult {
  source: string;
  currentStage: number | null;
  workflowStatus: string | null;
  error: string | null;
}

interface ComparisonResult {
  comparison: string;
  passed: boolean;
  details: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('campaignId');

  if (!campaignId) {
    return NextResponse.json({ error: 'campaignId parameter required' }, { status: 400 });
  }

  try {
    const validId = assertValidCampaignId(campaignId);
    const results: SourceResult[] = [];
    const comparisons: ComparisonResult[] = [];

    // Source 1: Canonical campaign state service (filesystem-driven)
    const canonicalState = await getCampaignState(validId);
    results.push({
      source: 'campaignStateService (getCampaignState)',
      currentStage: canonicalState?.currentStage ?? null,
      workflowStatus: canonicalState?.overallStatus ?? null,
      error: !canonicalState ? 'Campaign not found in pitch-jobs' : null,
    });

    // Source 2: Campaign list (also uses canonical service)
    const campaignList = await getCampaignListState();
    const listEntry = campaignList.find(c => c.campaignId === validId);
    results.push({
      source: 'getCampaignListState',
      currentStage: listEntry?.currentStage ?? null,
      workflowStatus: listEntry?.overallStatus ?? null,
      error: !listEntry ? 'Campaign not found in list' : null,
    });

    // Source 3: Stats (uses getCampaignStats from canonical service - aggregate only)
    const stats = await getCampaignStats();
    results.push({
      source: 'getCampaignStats (aggregate)',
      currentStage: null, // Stats is aggregate, not per-campaign
      workflowStatus: `total=${stats.total} active=${stats.active} completed=${stats.completed} failed=${stats.failed}`,
      error: null,
    });

    // Source 4: Filesystem stage-state.json (raw)
    let fsStage: number | null = null;
    let fsStatus: string | null = null;
    try {
      const campaignPath = resolveCampaignPath(validId);
      const stageStateRaw = await fs.readFile(path.join(campaignPath, 'stage-state.json'), 'utf-8');
      const stageState = JSON.parse(stageStateRaw);
      fsStage = stageState.currentStage ?? null;
      fsStatus = stageState.status ?? null;
    } catch {
      // Filesystem read failed
    }
    results.push({
      source: 'stage-state.json (filesystem raw)',
      currentStage: fsStage,
      workflowStatus: fsStatus,
      error: fsStage === null ? 'Could not read stage-state.json' : null,
    });

    // Source 5: Intake metadata (brief file existence)
    try {
      const campaignPath = resolveCampaignPath(validId);
      const briefExists = await fs.stat(path.join(campaignPath, '00-brief.md')).then(s => s.isFile()).catch(() => false);
      results.push({
        source: '00-brief.md existence',
        currentStage: briefExists ? 0 : null,
        workflowStatus: briefExists ? 'file_exists' : 'file_missing',
        error: !briefExists ? '00-brief.md not found' : null,
      });
    } catch {
      results.push({
        source: '00-brief.md existence',
        currentStage: null,
        workflowStatus: null,
        error: 'Could not check file',
      });
    }

    // Compare sources for consistency - exclude non-stage sources (stats, file checks)
    const stageSources = ['campaignStateService (getCampaignState)', 'getCampaignListState', 'stage-state.json (filesystem raw)'];
    const stageValues = results
      .filter(r => stageSources.includes(r.source) && r.currentStage !== null && r.error === null)
      .map(r => r.currentStage);

    comparisons.push({
      comparison: 'currentStage consistency across sources',
      passed: stageValues.length >= 2 && stageValues.every(v => v === stageValues[0]),
      details: stageValues.length >= 2
        ? (stageValues.every(v => v === stageValues[0])
          ? `All sources agree: Stage ${stageValues[0]}`
          : `MISMATCH: values=${JSON.stringify(stageValues)}`)
        : `Insufficient sources: ${stageValues.length}/5 available`,
    });

    comparisons.push({
      comparison: 'filesystem stage-state matches canonical service',
      passed: results[0]?.currentStage === fsStage,
      details: results[0]?.currentStage !== null && fsStage !== null
        ? (results[0].currentStage === fsStage
          ? `Agree: Stage ${results[0].currentStage}`
          : `MISMATCH: canonical=${results[0].currentStage} vs filesystem=${fsStage}`)
        : 'Cannot compare (one or both sources unavailable)',
    });

    comparisons.push({
      comparison: 'campaign list contains campaign',
      passed: listEntry !== undefined && listEntry !== null,
      details: listEntry
        ? `Found in list: ${listEntry.campaignName}`
        : 'Campaign NOT found in campaign list',
    });

    comparisons.push({
      comparison: 'stats total matches campaign list count',
      passed: stats.total === campaignList.length,
      details: `stats.total=${stats.total} vs list count=${campaignList.length}`,
    });

    const allPassed = comparisons.every(c => c.passed);
    const errors = results.filter(r => r.error !== null).map(r => `${r.source}: ${r.error}`);

    return NextResponse.json({
      campaignId: validId,
      overallConsistent: allPassed,
      summary: {
        totalComparisons: comparisons.length,
        passed: comparisons.filter(c => c.passed).length,
        failed: comparisons.filter(c => !c.passed).length,
      },
      sources: results,
      comparisons,
      errors: errors.length > 0 ? errors : [],
      recommendations: !allPassed
        ? ['Review mismatched sources above', 'Run stage progression to resync', 'Check stage-state.json integrity']
        : ['All sources consistent'],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}