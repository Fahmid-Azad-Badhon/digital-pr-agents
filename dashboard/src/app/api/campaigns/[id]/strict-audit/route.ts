import fs from 'fs/promises';
import path from 'path';
import { NextRequest } from 'next/server';
import { fail, ok } from '@/lib/apiResponse';
import { assertValidCampaignId, resolveCampaignPath } from '@/lib/requestGuard';

import { looksLikeFallback } from '@/lib/fallbackMarkers';

type AuditItem = {
  stage: number;
  file: string;
  passed: boolean;
  reason: string;
};

function looksLikeScaffold(content: string): boolean {
  return looksLikeFallback(content);
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readText(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf-8');
}

function stageFile(campaignPath: string, fileName: string): string {
  return path.join(campaignPath, fileName);
}

async function checkMarkdown(campaignPath: string, stage: number, file: string, minLength: number): Promise<AuditItem> {
  const fullPath = stageFile(campaignPath, file);
  if (!(await exists(fullPath))) return { stage, file, passed: false, reason: 'missing file' };
  const content = await readText(fullPath).catch(() => '');
  if (!content.trim()) return { stage, file, passed: false, reason: 'empty content' };
  if (looksLikeScaffold(content)) return { stage, file, passed: false, reason: 'scaffold/placeholder content detected' };
  if (content.trim().length < minLength) return { stage, file, passed: false, reason: `content too thin (<${minLength} chars)` };
  return { stage, file, passed: true, reason: 'ok' };
}

async function checkJson(campaignPath: string, stage: number, file: string): Promise<{ item: AuditItem; parsed: any | null }> {
  const fullPath = stageFile(campaignPath, file);
  if (!(await exists(fullPath))) return { item: { stage, file, passed: false, reason: 'missing file' }, parsed: null };
  const raw = await readText(fullPath).catch(() => '');
  if (!raw.trim()) return { item: { stage, file, passed: false, reason: 'empty content' }, parsed: null };
  if (looksLikeScaffold(raw)) return { item: { stage, file, passed: false, reason: 'scaffold/placeholder content detected' }, parsed: null };
  try {
    const parsed = JSON.parse(raw);
    return { item: { stage, file, passed: true, reason: 'ok' }, parsed };
  } catch {
    return { item: { stage, file, passed: false, reason: 'invalid json' }, parsed: null };
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaignId = assertValidCampaignId(id);
    const campaignPath = resolveCampaignPath(campaignId);
    const isDir = await fs.stat(campaignPath).then(stat => stat.isDirectory()).catch(() => false);
    if (!isDir) {
      return fail('CAMPAIGN_NOT_FOUND', `Campaign "${campaignId}" not found.`, { status: 404 });
    }

    const items: AuditItem[] = [];

    // S1 checks - campaign intake
    items.push((await checkJson(campaignPath, 1, '01-campaign-intake.json')).item);
    items.push(await checkMarkdown(campaignPath, 1, '00-brief.md', 100));

    // S2 checks - data extraction
    items.push(await checkMarkdown(campaignPath, 2, '02-insights.md', 200));
    items.push(await checkMarkdown(campaignPath, 2, '01-study-notes.md', 200));

    items.push(await checkMarkdown(campaignPath, 3, '03-research.md', 200));
    items.push((await checkJson(campaignPath, 3, '03-research-enrichment.json')).item);
    items.push((await checkJson(campaignPath, 3, 'topic-expansion-map.json')).item);
    items.push((await checkJson(campaignPath, 3, 'data-inventory.json')).item);
    items.push((await checkJson(campaignPath, 3, 'source-registry.json')).item);
    items.push((await checkJson(campaignPath, 3, 'verified-findings.json')).item);

    items.push(await checkMarkdown(campaignPath, 4, '04-angles.md', 200));
    items.push((await checkJson(campaignPath, 4, 'InsightAnalysisMap.json')).item);
    items.push((await checkJson(campaignPath, 4, 'AngleGenerationHandoff.json')).item);

    items.push(await checkMarkdown(campaignPath, 5, '05-angles.md', 200));
    items.push(await checkMarkdown(campaignPath, 5, '05-beats.md', 80));

    const beatMatch = await checkJson(campaignPath, 6, '06-beat-match.json');
    if (beatMatch.item.passed && (!Array.isArray(beatMatch.parsed?.mappings) || beatMatch.parsed.mappings.length === 0)) {
      beatMatch.item.passed = false;
      beatMatch.item.reason = 'no mappings in beat-match output';
    }
    items.push(beatMatch.item);

    items.push(await checkMarkdown(campaignPath, 9, '06-journalist-intel.md', 300));
    items.push(await checkMarkdown(campaignPath, 9, '07-journalist-coverage.md', 300));
    const journalistIntel = await checkJson(campaignPath, 9, '09-journalist-intelligence.json');
    if (journalistIntel.item.passed && (!Array.isArray(journalistIntel.parsed?.journalists) || journalistIntel.parsed.journalists.length === 0)) {
      journalistIntel.item.passed = false;
      journalistIntel.item.reason = 'no journalists[] entries';
    }
    items.push(journalistIntel.item);

    items.push(await checkMarkdown(campaignPath, 10, '10-pitch-draft.md', 400));
    items.push(await checkMarkdown(campaignPath, 11, '11-optimized-pitch.md', 450));
    items.push(await checkMarkdown(campaignPath, 12, '12-outreach-package.md', 700));

    const validation = await checkJson(campaignPath, 13, '13-validation-report.json');
    if (validation.item.passed && (!Array.isArray(validation.parsed?.checks) || validation.parsed.checks.length === 0)) {
      validation.item.passed = false;
      validation.item.reason = 'no validation checks';
    }
    items.push(validation.item);

    items.push(await checkMarkdown(campaignPath, 14, '14-final-formatted-package.md', 900));
    items.push(await checkMarkdown(campaignPath, 15, '15-outreach-assets.md', 450));

    const learning = await checkJson(campaignPath, 16, '16-campaign-learning-log.json');
    if (learning.item.passed) {
      const hasInputs = Array.isArray(learning.parsed?.inputs) && learning.parsed.inputs.length >= 3;
      const hasRecommendations = Array.isArray(learning.parsed?.recommendations) && learning.parsed.recommendations.length > 0;
      if (!hasInputs) {
        learning.item.passed = false;
        learning.item.reason = 'missing/insufficient inputs[] audit';
      } else if (!hasRecommendations) {
        learning.item.passed = false;
        learning.item.reason = 'missing recommendations[]';
      }
    }
    items.push(learning.item);

    const failed = items.filter(item => !item.passed);
    const byStage = items.reduce<Record<string, { total: number; passed: number; failed: number }>>((acc, item) => {
      const key = `S${item.stage}`;
      if (!acc[key]) acc[key] = { total: 0, passed: 0, failed: 0 };
      acc[key].total += 1;
      if (item.passed) acc[key].passed += 1;
      else acc[key].failed += 1;
      return acc;
    }, {});

    return ok({
      campaignId,
      strictReady: failed.length === 0,
      summary: {
        totalChecks: items.length,
        passedChecks: items.length - failed.length,
        failedChecks: failed.length,
      },
      byStage,
      failedItems: failed,
      allItems: items,
    });
  } catch (error) {
    return fail(
      'STRICT_AUDIT_FAILED',
      'Failed to run strict stage artifact audit.',
      { status: 500 },
      error instanceof Error ? error.message : String(error)
    );
  }
}

