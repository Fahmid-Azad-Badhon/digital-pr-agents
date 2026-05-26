import { NextRequest } from 'next/server';
import { ok, fail } from '@/lib/apiResponse';
import { buildObservabilitySummary } from '@/lib/observabilitySummary';

export async function GET(_request: NextRequest) {
  try {
    const summary = await buildObservabilitySummary();
    return ok(summary);
  } catch (error) {
    return fail(
      'OBSERVABILITY_SUMMARY_FAILED',
      'Failed to build observability summary.',
      { status: 500 },
      error instanceof Error ? error.message : String(error)
    );
  }
}

