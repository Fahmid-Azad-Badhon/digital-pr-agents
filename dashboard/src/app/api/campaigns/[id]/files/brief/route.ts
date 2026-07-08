import { NextResponse } from 'next/server';
import { resolveCampaignPath } from '@/lib/requestGuard';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const filePath = join(resolveCampaignPath(id), '00-brief.md');

  if (!existsSync(filePath)) {
    // Return empty brief if file doesn't exist yet
    return NextResponse.json({ content: '# Campaign Brief\n\n*No brief submitted yet.*\n' });
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ error: 'Failed to read brief file' }, { status: 500 });
  }
}