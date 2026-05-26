// GET /api/angles - List angles for current campaign
import { fail, ok } from '@/lib/apiResponse';
import { resolveCampaignPath } from '@/lib/requestGuard';
import fs from 'fs/promises';
import path from 'path';

interface Angle {
  id: number;
  category: string;
  journalistBeats: string[];
  headline: string;
  whyNewsworthy: string;
  score: number;
  newsworthiness: number;
  timeliness: number;
  outreachDifficulty: number;
  publicationType: string;
  localNational: string;
  status: string;
  notes: string;
}

type BeatMatchMap = Map<string, { beat: string; affinityScore?: number; reasoning?: string }>;

async function readBeatMatches(campaignId: string): Promise<BeatMatchMap> {
  const beatMatchPath = path.join(resolveCampaignPath(campaignId), '06-beat-match.json');
  try {
    const raw = await fs.readFile(beatMatchPath, 'utf-8');
    const parsed = JSON.parse(raw) as {
      mappings?: Array<{ beat?: string; angleId?: string; affinityScore?: number; reasoning?: string }>;
    };
    const map: BeatMatchMap = new Map();
    for (const row of parsed.mappings || []) {
      const angleId = (row.angleId || '').trim();
      const beat = (row.beat || '').trim();
      if (!angleId || !beat) continue;
      map.set(angleId.toUpperCase(), { beat, affinityScore: row.affinityScore, reasoning: row.reasoning });
    }
    return map;
  } catch {
    return new Map();
  }
}

function parseStage5Angles(content: string, beatMap: BeatMatchMap): Angle[] {
  const lines = content.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const angleRows = lines.filter(line => /^-\s*\[[ xX]\]\s*A\d+/i.test(line));
  if (angleRows.length === 0) {
    return [];
  }

  const rationaleByAngle = new Map<string, string>();
  for (const line of lines) {
    const m = line.match(/^-+\s*A(\d+):\s*(.+)$/i);
    if (m) {
      rationaleByAngle.set(`A${m[1]}`.toUpperCase(), m[2].trim());
    }
  }

  const parsed: Angle[] = [];
  for (const row of angleRows) {
    const m = row.match(/^-\s*\[([ xX])\]\s*(A\d+)\s*\|\s*Score\s*(\d+)\s*\|\s*(.+)$/i);
    if (!m) continue;
    const checked = m[1].toLowerCase() === 'x';
    const angleKey = m[2].toUpperCase();
    const rawScore = Number.parseInt(m[3], 10);
    const title = m[4].trim();
    const beatInfo = beatMap.get(angleKey);
    const score10 = Math.max(1, Math.min(10, Math.round(rawScore / 10)));

    parsed.push({
      id: parsed.length + 1,
      category: 'Data-Backed Angle',
      journalistBeats: beatInfo?.beat ? [beatInfo.beat] : ['General'],
      headline: title,
      whyNewsworthy: rationaleByAngle.get(angleKey) || beatInfo?.reasoning || 'Derived from Stage 4 validated insights.',
      score: score10,
      newsworthiness: score10,
      timeliness: Math.max(1, Math.min(10, score10 - 1)),
      outreachDifficulty: score10 >= 8 ? 4 : score10 >= 6 ? 5 : 6,
      publicationType: 'Digital News',
      localNational: 'National',
      status: checked ? 'selected' : 'pending',
      notes: angleKey,
    });
  }

  return parsed;
}

async function parseAnglesFile(campaignId: string): Promise<Angle[]> {
  const campaignPath = resolveCampaignPath(campaignId);
  const anglesPath = path.join(campaignPath, '04-angles.md');
  const stage5Path = path.join(campaignPath, '05-angles.md');
  
  try {
    const beatMap = await readBeatMatches(campaignId);
    const stage5Content = await fs.readFile(stage5Path, 'utf-8').catch(() => '');
    const stage5Angles = parseStage5Angles(stage5Content, beatMap);
    if (stage5Angles.length > 0) {
      return stage5Angles;
    }

    const content = await fs.readFile(anglesPath, 'utf-8');
    const angles: Angle[] = [];
    
    const angleBlocks = content.split(/^## Angle \d+/m).filter(Boolean);
    
    for (let i = 0; i < angleBlocks.length; i++) {
      const block = angleBlocks[i].trim();
      if (!block) continue;
      
      const headlineMatch = block.match(/^###? (.+)$/m) || block.match(/^# (.+)$/m);
      const categoryMatch = block.match(/\*\*Category\*\*:?\s*(.+)/i) || block.match(/Category:?\s*(.+)/i);
      const beatsMatch = block.match(/\*\*Beats?\*\*:?\s*(.+)/i) || block.match(/Beats?:?\s*(.+)/i);
      const newsworthyMatch = block.match(/\*\*Why Newsworthy\*\*:?\s*(.+)/i) || block.match(/Why Newsworthy:?\s*(.+)/i);
      const scoreMatch = block.match(/\*\*Score\*\*:?\s*(\d+)/i) || block.match(/Score:?\s*(\d+)/i);
      
      const headline = headlineMatch?.[1]?.trim() || `Angle ${i + 1}`;
      const category = categoryMatch?.[1]?.trim() || 'General';
      const beats = beatsMatch?.[1]?.split(',').map(b => b.trim()) || ['General'];
      const whyNewsworthy = newsworthyMatch?.[1]?.trim() || 'Data-driven insight';
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 7;
      
      const mappedBeat = beatMap.get(`A${i + 1}`.toUpperCase());
      angles.push({
        id: i + 1,
        category,
        journalistBeats: mappedBeat?.beat ? [mappedBeat.beat, ...beats.filter(b => b !== mappedBeat.beat)] : beats,
        headline,
        whyNewsworthy: mappedBeat?.reasoning || whyNewsworthy,
        score,
        newsworthiness: Math.min(10, score),
        timeliness: Math.min(10, score - 1),
        outreachDifficulty: score >= 8 ? 4 : score >= 6 ? 5 : 6,
        publicationType: ['Local TV', 'National News', 'Trade Publication'][i % 3],
        localNational: i % 2 === 0 ? 'Local' : 'National',
        status: i === 0 ? 'selected' : i < 5 ? 'favorite' : 'pending',
        notes: ''
      });
    }
    
    return angles.length > 0 ? angles : [];
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('campaignId') || 'default';
  
  const angles = await parseAnglesFile(campaignId);
  
  if (angles.length === 0) {
    return fail('ANGLES_NOT_FOUND', 'Create 04-angles.md in your campaign folder.', { status: 404 });
  }
  
  return ok(angles);
}

export async function POST(request: Request) {
  const { angleId, action, campaignId } = await request.json().catch(() => ({} as Record<string, unknown>));
  
  if (!campaignId) {
    return fail('CAMPAIGN_ID_REQUIRED', 'campaignId required.', { status: 400 });
  }
  
  const anglesPath = path.join(resolveCampaignPath(campaignId), '04-angles.md');
  
  try {
    const content = await fs.readFile(anglesPath, 'utf-8');
    
    const newStatus = action === 'select' ? 'selected' : 
                      action === 'reject' ? 'rejected' : 
                      action === 'favorite' ? 'favorite' : 'pending';
    
    const updatedContent = content.replace(
      new RegExp(`^(## Angle ${angleId}\\b)`, 'm'),
      `## Angle ${angleId} [${newStatus.toUpperCase()}]`
    );
    
    await fs.writeFile(anglesPath, updatedContent, 'utf-8');
    
    return ok({ message: `Angle ${angleId} marked as ${newStatus}` });
  } catch (error) {
    return fail('FAILED_TO_UPDATE_ANGLE', 'Failed to update angle.', { status: 500 }, String(error));
  }
}
