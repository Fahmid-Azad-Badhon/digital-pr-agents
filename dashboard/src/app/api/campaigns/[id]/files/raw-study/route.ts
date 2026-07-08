import { fail, ok } from '@/lib/apiResponse';
import { resolveCampaignPath } from '@/lib/requestGuard';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const filePath = join(resolveCampaignPath(id), 'source-files', 'study-inputs', 'raw-study-copy.md');

  if (!existsSync(filePath)) {
    return fail('RAW_STUDY_NOT_FOUND', 'Raw study file not found.', { status: 404 });
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    return ok({ content });
  } catch {
    return fail('FAILED_TO_READ_FILE', 'Failed to read file.', { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return fail('FILE_REQUIRED', 'No file provided.', { status: 400 });
  }

  const pitchJobDir = resolveCampaignPath(id);
  const studyInputsDir = join(pitchJobDir, 'source-files', 'study-inputs');

  // Ensure directories exist
  if (!existsSync(pitchJobDir)) {
    mkdirSync(pitchJobDir, { recursive: true });
    mkdirSync(studyInputsDir, { recursive: true });
  }

  const filePath = join(studyInputsDir, 'raw-study-copy.md');
  
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    writeFileSync(filePath, buffer);
    return ok({ message: 'File uploaded successfully' });
  } catch {
    return fail('FAILED_TO_SAVE_FILE', 'Failed to save file.', { status: 500 });
  }
}
