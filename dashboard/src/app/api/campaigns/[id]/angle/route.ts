// GET /api/campaigns/[id]/angle - Get selected angle
import { NextResponse } from 'next/server';
import { resolveCampaignPath } from '@/lib/requestGuard';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const campaignId = params.id;
  const campaignPath = resolveCampaignPath(campaignId);
  
  try {
    const files = await fs.readdir(campaignPath);
    const angleFile = files.find(f => f.startsWith('04-angles') || f.startsWith('angle'));
    
    if (!angleFile) {
      return NextResponse.json({ 
        error: 'No angles file found',
        message: 'Complete S5 angle generation first'
      }, { status: 404 });
    }
    
    const content = await fs.readFile(path.join(campaignPath, angleFile), 'utf-8');
    
    const angleBlocks = content.split(/^##? Angle \d+/m).filter(Boolean);
    
    for (let i = 0; i < angleBlocks.length; i++) {
      const block = angleBlocks[i];
      if (block.includes('[SELECTED]') || block.includes('selected')) {
        const headlineMatch = block.match(/^###?\s+(.+)$/m) || block.match(/^#\s+(.+)$/m);
        const categoryMatch = block.match(/\*\*Category\*\*:?\s*(.+)/i) || block.match(/Category:?\s*(.+)/i);
        const scoreMatch = block.match(/\*\*Score\*\*:?\s*(\d+)/i);
        
        return NextResponse.json({
          id: i + 1,
          headline: headlineMatch?.[1]?.trim() || `Angle ${i + 1}`,
          category: categoryMatch?.[1]?.trim() || 'General',
          score: scoreMatch ? parseInt(scoreMatch[1]) : 7,
          status: 'selected'
        });
      }
    }
    
    return NextResponse.json({ 
      error: 'No angle selected',
      message: 'Select an angle in S7'
    }, { status: 404 });
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to read angle',
      details: String(error)
    }, { status: 500 });
  }
}