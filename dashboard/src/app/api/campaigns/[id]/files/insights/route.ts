import { NextResponse } from 'next/server';
import { resolveCampaignPath } from '@/lib/requestGuard';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const filePath = join(resolveCampaignPath(id), '02-insights.md');

  if (!existsSync(filePath)) {
    // Return empty insights if file doesn't exist yet
    return NextResponse.json({ content: '# Extracted Insights\n\n*No insights extracted yet. Run the Data Extractor agent to process the raw study.*\n' });
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ error: 'Failed to read insights file' }, { status: 500 });
  }
}