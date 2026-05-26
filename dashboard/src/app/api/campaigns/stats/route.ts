/**
 * Stats API Route
 * Dashboard statistics endpoint - now uses canonical campaign state service
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCampaignStats } from '@/lib/campaignStateService';

export const dynamic = 'force-dynamic';

// ============================================================================
// GET - Dashboard statistics (from canonical campaign state service)
// ============================================================================

export async function GET(_request: NextRequest) {
  try {
    // Use canonical campaign state service - same source as campaign list
    const stats = await getCampaignStats();

    return NextResponse.json({
      success: true,
      data: {
        total: stats.total,
        active: stats.active,
        completed: stats.completed,
        failed: stats.failed,
        draft: stats.draft,
        paused: stats.paused,
        waitingForHumanApproval: stats.waitingForHumanApproval,
        avgDuration: 0, // Could be added later if needed
        stageStats: {
          completed: stats.completed,
          running: stats.active,
          pending: stats.total - stats.completed - stats.active,
          failed: stats.failed,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}