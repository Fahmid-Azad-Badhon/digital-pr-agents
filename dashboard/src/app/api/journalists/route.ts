// GET /api/journalists - List journalists for a campaign
import { NextResponse } from 'next/server';
import { resolveCampaignPath } from '@/lib/requestGuard';
import fs from 'fs/promises';
import path from 'path';

interface Journalist {
  id: string;
  name: string;
  outlet: string;
  beat: string;
  relevanceScore: number;
  recentArticles: string[];
}

async function getJournalistsFromFile(campaignId: string): Promise<Journalist[]> {
  const journalistPath = path.join(resolveCampaignPath(campaignId), '06-journalist-intel.md');
  
  try {
    const content = await fs.readFile(journalistPath, 'utf-8');
    const journalists: Journalist[] = [];
    
    const blocks = content.split(/^## Journalist /m).filter(Boolean);
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i].trim();
      if (!block) continue;
      
      const nameMatch = block.match(/^###? (.+)$/m) || block.match(/^# (.+)$/m);
      const outletMatch = block.match(/\*\*Outlet\*\*:?\s*(.+)/i) || block.match(/Outlet:?\s*(.+)/i);
      const beatMatch = block.match(/\*\*Beat\*\*:?\s*(.+)/i) || block.match(/Beat:?\s*(.+)/i);
      const relevanceMatch = block.match(/\*\*Relevance\*\*:?\s*(\d+)/i) || block.match(/Relevance:?\s*(\d+)/i);
      
      const name = nameMatch?.[1]?.trim() || `Journalist ${i + 1}`;
      const outlet = outletMatch?.[1]?.trim() || 'Unknown';
      const beat = beatMatch?.[1]?.trim() || 'General';
      const relevanceScore = relevanceMatch ? parseInt(relevanceMatch[1]) : 7;
      
      journalists.push({
        id: String(i + 1),
        name,
        outlet,
        beat,
        relevanceScore,
        recentArticles: []
      });
    }
    
    return journalists;
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('campaignId') || 'default';
  const currentStage = parseInt(searchParams.get('currentStage') || '0');
  const selectedAnglesCount = parseInt(searchParams.get('selectedAnglesCount') || '0');
  
  if (currentStage < 8) {
    return NextResponse.json({ 
      error: 'Journalist Collection is locked until Pitch Selection is completed.',
      requiredStage: 8,
      requiredAction: 'Select at least one pitch angle.',
      redirectTo: '/pitch-selection',
      canAccess: false
    }, { status: 403 });
  }
  
  if (currentStage >= 8 && selectedAnglesCount === 0) {
    return NextResponse.json({ 
      error: 'Select at least one pitch angle to unlock Journalist Collection.',
      requiredStage: 8,
      requiredAction: 'Select pitch angles',
      redirectTo: '/pitch-selection',
      canAccess: false
    }, { status: 403 });
  }
  
  const journalists = await getJournalistsFromFile(campaignId);
  
  if (journalists.length === 0) {
    return NextResponse.json({ 
      error: 'No journalists found', 
      message: 'Complete S8 journalist collection to see journalists',
      canAccess: true,
      journalists: []
    });
  }
  
  return NextResponse.json({ 
    journalists,
    usedForCollection: 'selected-angles-only',
    selectedAnglesCount,
    canAccess: true
  });
}
