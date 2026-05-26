import { NextRequest } from 'next/server';
import fs from 'fs/promises';
import { join } from 'path';
import { fail, ok } from '@/lib/apiResponse';
import { evaluateMutationAuth } from '@/lib/authGuard';
import { CampaignFilesInputSchema } from '@/lib/inputSchemas';
import { validateInput } from '@/lib/schemaValidation';
import { assertValidCampaignId, resolveCampaignPath } from '@/lib/requestGuard';

async function atomicWriteFile(filePath: string, content: string): Promise<void> {
  const tempPath = `${filePath}.tmp`;
  await fs.writeFile(tempPath, content, 'utf-8');
  await fs.rename(tempPath, filePath);
}

function buildFallbackBrief(campaignId: string, intake: {
  name?: string;
  clientName?: string;
  studyTitle?: string;
  topic?: string;
  targetRegion?: string;
  targetBeats?: string[];
  goal?: string;
  tone?: string;
  notes?: string;
}): string {
  const beats = Array.isArray(intake.targetBeats) && intake.targetBeats.length > 0
    ? intake.targetBeats.join(', ')
    : 'Not specified';

  return [
    `# Campaign Brief`,
    ``,
    `Campaign ID: ${campaignId}`,
    `Campaign Name: ${intake.name || campaignId}`,
    `Client: ${intake.clientName || 'Not specified'}`,
    `Study Title: ${intake.studyTitle || 'Not specified'}`,
    `Topic: ${intake.topic || 'Not specified'}`,
    `Target Region: ${intake.targetRegion || 'United States'}`,
    `Target Beats: ${beats}`,
    `Goal: ${intake.goal || 'Not specified'}`,
    `Tone: ${intake.tone || 'Professional'}`,
    ``,
    `Notes:`,
    intake.notes || 'No additional notes.',
    ``,
  ].join('\n');
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = evaluateMutationAuth(request);
    if (!auth.allowed) {
      return fail('AUTH_REQUIRED', auth.reason, { status: 401 });
    }

    const campaignId = assertValidCampaignId(params.id);
    const rawBody = await request.json().catch(() => null);
    const parsedInput = validateInput(CampaignFilesInputSchema, rawBody);
    if (!parsedInput.success) {
      return fail(
        'INVALID_CAMPAIGN_FILES_INPUT',
        'Campaign files payload validation failed.',
        { status: 400 },
        parsedInput.errors
      );
    }
    const data = parsedInput.data;
    const pitchJobDir = resolveCampaignPath(campaignId);

    await fs.mkdir(pitchJobDir, { recursive: true });
    await fs.mkdir(join(pitchJobDir, 'source-files', 'study-inputs'), { recursive: true });
    await fs.mkdir(join(pitchJobDir, 'source-files', 'journalist-intel', 'bulk-beat-collection'), { recursive: true });
    await fs.mkdir(join(pitchJobDir, 'source-files', 'journalist-intel', 'selected-angle'), { recursive: true });
    await fs.mkdir(join(pitchJobDir, 'draft-variants'), { recursive: true });

    const briefPath = join(pitchJobDir, '00-brief.md');
    const incomingBrief = typeof data.brief === 'string' ? data.brief.trim() : '';
    if (incomingBrief.length > 0) {
      await atomicWriteFile(briefPath, incomingBrief);
    } else {
      const intakePath = join(pitchJobDir, '01-campaign-intake.json');
      const intake = await fs.readFile(intakePath, 'utf-8')
        .then(content => JSON.parse(content) as Record<string, unknown>)
        .catch(() => ({} as Record<string, unknown>));
      const fallbackBrief = buildFallbackBrief(campaignId, {
        name: typeof intake.name === 'string' ? intake.name : undefined,
        clientName: typeof intake.clientName === 'string' ? intake.clientName : undefined,
        studyTitle: typeof intake.studyTitle === 'string' ? intake.studyTitle : undefined,
        topic: typeof intake.topic === 'string' ? intake.topic : undefined,
        targetRegion: typeof intake.targetRegion === 'string' ? intake.targetRegion : undefined,
        targetBeats: Array.isArray(intake.targetBeats) ? intake.targetBeats.filter(item => typeof item === 'string') as string[] : undefined,
        goal: typeof intake.goal === 'string' ? intake.goal : undefined,
        tone: typeof intake.tone === 'string' ? intake.tone : undefined,
        notes: typeof intake.notes === 'string' ? intake.notes : undefined,
      });
      await atomicWriteFile(briefPath, fallbackBrief);
    }

    if (data.rawStudy) {
      await atomicWriteFile(join(pitchJobDir, 'source-files', 'study-inputs', 'raw-study-copy.md'), data.rawStudy);
    }

    await atomicWriteFile(
      join(pitchJobDir, 'stage-state.json'),
      JSON.stringify(
        {
          currentStage: 1,
          status: 'running',
          updatedAt: new Date().toISOString(),
        },
        null,
        2
      )
    );

    return ok({ campaignId, saved: true });
  } catch (error) {
    console.error('Failed to save campaign files:', error);
    return fail(
      'FAILED_TO_SAVE_CAMPAIGN_FILES',
      'Failed to save campaign files.',
      { status: 500 },
      error instanceof Error ? error.message : String(error)
    );
  }
}
