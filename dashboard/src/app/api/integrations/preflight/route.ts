import { NextRequest } from 'next/server';
import { ok } from '@/lib/apiResponse';
import { getExternalizationStatus } from '@/lib/integrationExternalization';

export async function GET(_request: NextRequest) {
  const externalization = getExternalizationStatus();

  return ok({
    generatedAt: new Date().toISOString(),
    mode: externalization.mode,
    productionExternalizationReady: externalization.productionExternalizationReady,
    blockers: externalization.blockers,
    integrations: externalization.integrations,
  });
}

