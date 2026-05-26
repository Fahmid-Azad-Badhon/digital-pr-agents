// GET /api/health - Health check
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    name: 'Digital PR Orchestrator Dashboard API'
  });
}