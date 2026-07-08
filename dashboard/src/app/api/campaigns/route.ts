// GET /api/campaigns - List all campaigns (from canonical state service)
// DELETE /api/campaigns - Delete campaign
// POST /api/campaigns - Create new campaign
import { NextRequest, NextResponse } from 'next/server';
import { evaluateMutationAuth } from '@/lib/authGuard';
import { fail, ok } from '@/lib/apiResponse';
import { Campaign } from '@/types';
import { runPreFlightChecks, formatPreFlightReport } from '@/lib/preflightCheck';
import { createWeakEtag, wasNotModified } from '@/lib/httpCaching';
import { CampaignCreateInputSchema } from '@/lib/inputSchemas';
import { validateInput } from '@/lib/schemaValidation';
import { getCampaignListState } from '@/lib/campaignStateService';
import { PITCH_JOBS_ROOT } from '@/lib/requestGuard';
import fs from 'fs/promises';
import path from 'path';

type CampaignIntakeMetadata = {
  name?: string;
  clientName?: string;
  studyTitle?: string;
  topic?: string;
  targetRegion?: string;
  targetBeats?: string[];
  goal?: string;
  tone?: string;
  notes?: string;
  generatedAt?: string;
  status?: string;
};

function buildBriefFromIntake(intake: CampaignIntakeMetadata): string {
  const beats = Array.isArray(intake.targetBeats) && intake.targetBeats.length > 0
    ? intake.targetBeats.join(', ')
    : 'Not specified';

  return [
    `# Campaign Brief`,
    ``,
    `## Campaign Name`,
    intake.name || 'Untitled Campaign',
    ``,
    `## Client`,
    intake.clientName || 'Not specified',
    ``,
    `## Study Title`,
    intake.studyTitle || 'Not specified',
    ``,
    `## Topic`,
    intake.topic || 'Not specified',
    ``,
    `## Target Region`,
    intake.targetRegion || 'United States',
    ``,
    `## Target Beats`,
    beats,
    ``,
    `## Goal`,
    intake.goal || 'Not specified',
    ``,
    `## Tone`,
    intake.tone || 'Professional',
    ``,
    `## Notes`,
    intake.notes || 'No additional notes.',
    ``,
  ].join('\n');
}

// GET - List all campaigns from canonical campaign state service
export async function GET(request: Request) {
  try {
    // Use canonical campaign state service for consistency
    const campaignStates = await getCampaignListState();

    // Transform canonical state to Campaign type for API compatibility
    const campaigns: Campaign[] = campaignStates.map(state => ({
      id: state.campaignId,
      slug: state.campaignId,
      name: state.campaignName,
      clientName: '', // Not stored in canonical state, extracted from intake if needed
      studyTitle: '',
      topic: state.campaignName, // Use campaign name as topic
      targetRegion: 'United States',
      targetBeats: ['Consumer affairs', 'Business'],
      goal: '',
      tone: 'Professional',
      notes: '',
      status: mapCanonicalStatus(state.overallStatus),
      currentStage: state.currentStage,
      createdAt: state.updatedAt,
      updatedAt: state.updatedAt,
      preflightPassed: state.strictAuditReady
    }));

    campaigns.sort((a, b) => a.id.localeCompare(b.id));
    const responseBody = JSON.stringify(campaigns);
    const etag = createWeakEtag(responseBody);
    const ifNoneMatch = request.headers.get('if-none-match');
    const lastModified = new Date().toUTCString();

    if (wasNotModified(ifNoneMatch, etag)) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: etag,
          'Last-Modified': lastModified,
          'Cache-Control': 'private, max-age=0, must-revalidate',
        },
      });
    }

    return new NextResponse(responseBody, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        ETag: etag,
        'Last-Modified': lastModified,
        'Cache-Control': 'private, max-age=0, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Failed to fetch campaigns:', error);
    return NextResponse.json(
      { error: 'FAILED_TO_FETCH_CAMPAIGNS', message: 'Failed to fetch campaigns from canonical state.' },
      { status: 500 }
    );
  }
}

// Map canonical status to Campaign status type
function mapCanonicalStatus(canonicalStatus: string): Campaign['status'] {
  const statusMap: Record<string, Campaign['status']> = {
    'draft': 'draft',
    'running': 'running',
    'paused': 'paused',
    'completed': 'completed',
    'failed': 'failed',
    'waiting_for_human_approval': 'paused',
    'blocked': 'failed'
  };
  return statusMap[canonicalStatus] || 'draft';
}

// DELETE - Remove campaign folder
export async function DELETE(request: NextRequest) {
  const auth = evaluateMutationAuth(request);
  if (!auth.allowed) {
    return fail('AUTH_REQUIRED', auth.reason, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('id');
  
  if (!campaignId) {
    return fail('CAMPAIGN_ID_REQUIRED', 'Campaign ID required.', { status: 400 });
  }
  
  const campaignPath = path.join(PITCH_JOBS_ROOT, campaignId);
  
  try {
    await fs.access(campaignPath);
    await fs.rm(campaignPath, { recursive: true, force: true });
    return ok({ message: `Campaign ${campaignId} deleted` });
  } catch {
    return fail('CAMPAIGN_NOT_FOUND', 'Campaign not found.', { status: 404 });
  }
}

// POST - Create new campaign
export async function POST(request: NextRequest) {
  const auth = evaluateMutationAuth(request);
  if (!auth.allowed) {
    return fail('AUTH_REQUIRED', auth.reason, { status: 401 });
  }

  const rawBody = await request.json().catch(() => null);
  const normalizedBody = rawBody && typeof rawBody === 'object'
    ? {
        ...rawBody,
        name: typeof (rawBody as Record<string, unknown>).name === 'string' ? (rawBody as Record<string, unknown>).name : String((rawBody as Record<string, unknown>).name ?? ''),
        clientName: typeof (rawBody as Record<string, unknown>).clientName === 'string' ? (rawBody as Record<string, unknown>).clientName : String((rawBody as Record<string, unknown>).clientName ?? ''),
        studyTitle: typeof (rawBody as Record<string, unknown>).studyTitle === 'string' ? (rawBody as Record<string, unknown>).studyTitle : String((rawBody as Record<string, unknown>).studyTitle ?? ''),
        topic: typeof (rawBody as Record<string, unknown>).topic === 'string' ? (rawBody as Record<string, unknown>).topic : String((rawBody as Record<string, unknown>).topic ?? ''),
        targetRegion: typeof (rawBody as Record<string, unknown>).targetRegion === 'string' ? (rawBody as Record<string, unknown>).targetRegion : String((rawBody as Record<string, unknown>).targetRegion ?? ''),
        goal: typeof (rawBody as Record<string, unknown>).goal === 'string' ? (rawBody as Record<string, unknown>).goal : String((rawBody as Record<string, unknown>).goal ?? ''),
        tone: typeof (rawBody as Record<string, unknown>).tone === 'string' ? (rawBody as Record<string, unknown>).tone : String((rawBody as Record<string, unknown>).tone ?? ''),
        notes: typeof (rawBody as Record<string, unknown>).notes === 'string' ? (rawBody as Record<string, unknown>).notes : String((rawBody as Record<string, unknown>).notes ?? ''),
      }
    : rawBody;

  const parsedInput = validateInput(CampaignCreateInputSchema, normalizedBody);
  if (!parsedInput.success) {
    return fail(
      'INVALID_CAMPAIGN_INPUT',
      'Campaign payload validation failed.',
      { status: 400 },
      parsedInput.errors
    );
  }
  const data = parsedInput.data;
  
  const preflight = await runPreFlightChecks();
  
  if (!preflight.canProceed) {
    return fail(
      'PRE_FLIGHT_FAILED',
      preflight.blockReason || 'Pre-flight checks failed.',
      { status: 400 },
      {
        preflightReport: formatPreFlightReport(preflight),
        failedChecks: preflight.checks.filter((c: any) => c.status === 'fail'),
      }
    );
  }

  const campaignId = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || crypto.randomUUID();
  
  console.log('[CREATE CAMPAIGN] Starting preflight checks for:', campaignId);
  
  // Don't check campaign-specific files for NEW campaigns - folder doesn't exist yet
  const preflightWithCampaign = await runPreFlightChecks();
  
  console.log('[CREATE CAMPAIGN] Preflight result:', JSON.stringify(preflightWithCampaign.checks.map((c: any) => ({ check: c.check, status: c.status, severity: c.severity }))));
  
  if (!preflightWithCampaign.canProceed) {
    console.log('[CREATE CAMPAIGN] Preflight failed:', preflightWithCampaign.blockReason);
    return fail(
      'PRE_FLIGHT_FAILED',
      preflightWithCampaign.blockReason || 'Pre-flight checks failed.',
      { status: 400 },
      {
        preflightReport: formatPreFlightReport(preflightWithCampaign),
        failedChecks: preflightWithCampaign.checks.filter((c: any) => c.status === 'fail'),
      }
    );
  }

  const newCampaign: Campaign = {
    id: campaignId,
    slug: campaignId,
    name: data.name || 'New Campaign',
    clientName: data.clientName || '',
    studyTitle: data.studyTitle || '',
    topic: data.topic || '',
    targetRegion: data.targetRegion || 'United States',
    targetBeats: data.targetBeats || ['Consumer affairs', 'Business', 'Technology'],
    goal: data.goal || '',
    tone: data.tone || 'Professional',
    notes: data.notes || '',
    status: 'draft',
    currentStage: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    preflightPassed: true,
  };
  
  // Create campaign folder
  const campaignPath = path.join(PITCH_JOBS_ROOT, campaignId);
  await fs.mkdir(campaignPath, { recursive: true });
  
  // Create subfolder structure
  await fs.mkdir(path.join(campaignPath, 'source-files', 'study-inputs'), { recursive: true });
  await fs.mkdir(path.join(campaignPath, 'source-files', 'journalist-intel', 'bulk-beat-collection'), { recursive: true });
  await fs.mkdir(path.join(campaignPath, 'source-files', 'journalist-intel', 'selected-angle'), { recursive: true });
  await fs.mkdir(path.join(campaignPath, 'draft-variants'), { recursive: true });

  const intakeMetadata: CampaignIntakeMetadata = {
    name: newCampaign.name,
    clientName: newCampaign.clientName,
    studyTitle: newCampaign.studyTitle,
    topic: newCampaign.topic,
    targetRegion: newCampaign.targetRegion,
    targetBeats: newCampaign.targetBeats,
    goal: newCampaign.goal,
    tone: newCampaign.tone,
    notes: newCampaign.notes,
    generatedAt: new Date().toISOString(),
    status: 'intake-complete',
  };
  await fs.writeFile(
    path.join(campaignPath, '01-campaign-intake.json'),
    JSON.stringify(intakeMetadata, null, 2),
    'utf-8'
  );

  // Ensure Stage 1 required artifact exists even before optional file-upload call.
  await fs.writeFile(
    path.join(campaignPath, '00-brief.md'),
    buildBriefFromIntake(intakeMetadata),
    'utf-8'
  );
  
  return ok({
    campaign: newCampaign,
    preflightReport: formatPreFlightReport(preflightWithCampaign),
  }, { status: 201 });
}
