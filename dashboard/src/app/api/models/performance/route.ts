// GET /api/models/performance - Get model performance metrics
import { NextResponse } from 'next/server';
import { getAllModelPerformance, getAutoRecommendations } from '@/lib/modelPerformanceTracker';

export async function GET() {
  try {
    const performance = await getAllModelPerformance();
    const recommendations = await getAutoRecommendations();
    
    return NextResponse.json({
      performance,
      recommendations,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to retrieve performance data',
      details: String(error)
    }, { status: 500 });
  }
}