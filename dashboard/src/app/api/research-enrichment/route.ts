import { NextRequest, NextResponse } from 'next/server';
import { resolveCampaignPath } from '@/lib/requestGuard';
import fs from 'fs/promises';
import path from 'path';
import { safeReadJsonFile } from '@/lib/fileReadSafety';

type AnyRecord = Record<string, unknown>;

function normalizeString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toStringArray(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values
    .map(item => normalizeString(item))
    .filter((item): item is string => Boolean(item));
}

function fromExpansionNodes(topicMap: AnyRecord | null): string[] {
  if (!topicMap || !Array.isArray(topicMap.expansionNodes)) return [];
  return topicMap.expansionNodes
    .map(node => {
      if (!node || typeof node !== 'object') return null;
      return normalizeString((node as AnyRecord).label);
    })
    .filter((label): label is string => Boolean(label))
    .filter(label => !/^#\s*stage\s*\d+/i.test(label))
    .slice(0, 8);
}

function deriveQueries(topic: string | null, beats: string[]): string[] {
  const root = topic || 'campaign topic';
  const beatHints = beats.slice(0, 3);
  const suggestions = [
    `${root} statistics by location and demographics`,
    `${root} journalist angle and public impact`,
    `${root} recent policy, legal, and trend coverage`,
    `${root} expert commentary and evidence sources`,
  ];
  if (beatHints.length > 0) {
    suggestions.push(`${root} for ${beatHints.join(', ')} journalists`);
  }
  return Array.from(new Set(suggestions.map(item => item.trim()).filter(Boolean)));
}

function deriveTimingHooks(topic: string | null): Array<{ type: string; description: string; relevance: string }> {
  const normalized = topic || 'campaign topic';
  return [
    {
      type: 'Breaking News Alignment',
      description: `Monitor current coverage and policy updates related to "${normalized}" for rapid outreach windows.`,
      relevance: 'high',
    },
    {
      type: 'Local Data Refresh',
      description: 'Prioritize state/city-level updates so local desks can publish jurisdiction-specific angles.',
      relevance: 'medium',
    },
    {
      type: 'Editorial Calendar Fit',
      description: 'Map findings to weekly business/health/policy desk cycles for better publish timing.',
      relevance: 'medium',
    },
  ];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('campaignId');

  if (!campaignId) {
    return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 });
  }

  try {
    const pitchJobsPath = resolveCampaignPath(campaignId);
    
    const exists = await fs.access(pitchJobsPath).then(() => true).catch(() => false);
    if (!exists) {
      return NextResponse.json({ 
        enrichment: null,
        message: 'Campaign not found' 
      });
    }

    const intake = await safeReadJsonFile<AnyRecord>(path.join(pitchJobsPath, '01-campaign-intake.json'));
    const briefText = await fs.readFile(path.join(pitchJobsPath, '00-brief.md'), 'utf-8').catch(() => '');
    const researchMarkdown = await fs.readFile(path.join(pitchJobsPath, '03-research.md'), 'utf-8').catch(() => '');

    const topicFromIntake = normalizeString(intake?.topic);
    const studyTitleFromIntake = normalizeString(intake?.studyTitle);
    const beatsFromIntake = toStringArray(intake?.targetBeats);
    const rootTopic = topicFromIntake || studyTitleFromIntake;

    const researchData: any = {
      campaign: {
        name: normalizeString(intake?.name) || campaignId,
        stage: 'Stage 3',
        startedAt: new Date().toISOString()
      },
      enrichment: {
        queries: [] as string[],
        sources: [] as any[],
        findings: [] as any[],
        timingHooks: [] as any[]
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        agent: 'research-agent',
        processingTime: '2.3s',
      },
      warnings: [] as string[],
    };

    const filesToCheck = [
      { file: '03-research-enrichment.json', key: 'enrichment' },
      { file: 'topic-expansion-map.json', key: 'topicExpansion' },
      { file: 'data-inventory.json', key: 'dataInventory' },
      { file: 'source-registry.json', key: 'sourceRegistry' },
      { file: 'verified-findings.json', key: 'verifiedFindings' }
    ];

    let hasRealResearchSignal = false;

    for (const { file, key } of filesToCheck) {
      const filePath = path.join(pitchJobsPath, file);
      const content = await safeReadJsonFile<any>(filePath);
      if (content) {
        hasRealResearchSignal = true;
        
        if (key === 'enrichment' && content.enrichment) {
          researchData.enrichment = { ...researchData.enrichment, ...content.enrichment };
        } else if (key === 'topicExpansion') {
          const mappedQueries = toStringArray(content.queries);
          if (mappedQueries.length > 0) {
            researchData.enrichment.queries = mappedQueries;
          }
          const mappedHooks = Array.isArray(content.timingHooks)
            ? content.timingHooks
              .map((hook: AnyRecord) => ({
                type: normalizeString(hook?.type) || 'Timing Hook',
                description: normalizeString(hook?.description) || '',
                relevance: normalizeString(hook?.relevance) || 'medium',
              }))
              .filter((hook: { type: string; description: string }) => hook.type || hook.description)
            : [];
          if (mappedHooks.length > 0) {
            researchData.enrichment.timingHooks = mappedHooks;
          }
        } else if (key === 'sourceRegistry' && content.sources) {
          researchData.enrichment.sources = content.sources.map((s: any) => ({
            name: normalizeString(s.name) || normalizeString(s.domain) || normalizeString(s.id) || 'unknown-source',
            type: s.type || 'web',
            url: s.url,
            credibility: typeof s.credibilityScore === 'number'
              ? s.credibilityScore
              : typeof s.reliability === 'number'
                ? s.reliability
                : 0.8,
            lastVerified: s.lastVerified || new Date().toISOString()
          }));
        } else if (key === 'verifiedFindings' && content.findings) {
          researchData.enrichment.findings = content.findings.map((f: any) => ({
            id: f.id || Math.random().toString(36).slice(2, 11),
            claim: normalizeString(f.claim) || normalizeString(f.statement) || '',
            evidence: normalizeString(f.evidence) || normalizeString(f.verification) || '',
            source: f.source || 'verified',
            verified: f.verified !== false
          }));
        } else if (key === 'verifiedFindings' && Array.isArray(content.verified)) {
          researchData.enrichment.findings = content.verified.map((f: any) => ({
            id: f.id || Math.random().toString(36).slice(2, 11),
            claim: normalizeString(f.claim) || normalizeString(f.statement) || '',
            evidence: normalizeString(f.evidence) || normalizeString(f.verificationStatus) || '',
            source: Array.isArray(f.evidenceSourceIds) ? f.evidenceSourceIds.join(', ') : 'verified',
            verified: true
          }));
        }
        
        if (content.metadata?.processingTime) {
          researchData.metadata.processingTime = content.metadata.processingTime;
        }
        if (content.metadata?.agent) {
          researchData.metadata.agent = content.metadata.agent;
        }
      }
    }

    if (researchData.enrichment.queries.length === 0) {
      const topicMap = await safeReadJsonFile<AnyRecord>(path.join(pitchJobsPath, 'topic-expansion-map.json'));
      const fromNodes = fromExpansionNodes(topicMap);
      researchData.enrichment.queries = fromNodes.length > 0 ? fromNodes : deriveQueries(rootTopic, beatsFromIntake);
    }

    if (researchData.enrichment.sources.length === 0) {
      researchData.enrichment.sources = [
        {
          name: 'campaign-brief',
          type: 'internal-brief',
          credibility: 0.8,
          lastVerified: new Date().toISOString(),
        },
      ];
      if (!briefText.trim()) {
        researchData.warnings.push('Campaign brief file is missing or empty.');
      }
    }

    if (researchData.enrichment.findings.length === 0) {
      const markdownSignals = researchMarkdown
        .split(/\r?\n/)
        .map(line => line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim())
        .filter(line => line.length > 35)
        .slice(0, 5);
      researchData.enrichment.findings = markdownSignals.map((line, index) => ({
        id: `md_${index + 1}`,
        claim: line,
        evidence: '03-research.md',
        source: 'stage-output',
        verified: true,
      }));
      if (researchData.enrichment.findings.length === 0) {
        researchData.warnings.push('No verified findings were produced yet. Run Stage 3 execution.');
      }
    }

    if (researchData.enrichment.timingHooks.length === 0) {
      researchData.enrichment.timingHooks = deriveTimingHooks(rootTopic);
    }

    if (!hasRealResearchSignal) {
      researchData.warnings.push('No Stage 3 structured artifacts found. Displaying campaign-derived fallback summary only.');
    }

    return NextResponse.json(researchData, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Error loading research enrichment data:', error);
    return NextResponse.json(
      { error: 'FAILED_TO_LOAD_RESEARCH_ENRICHMENT', message: 'Failed to load research enrichment data.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
