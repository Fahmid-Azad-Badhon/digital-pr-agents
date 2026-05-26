import fs from 'fs/promises';
import path from 'path';
import { NextRequest } from 'next/server';
import { fail, ok } from '@/lib/apiResponse';
import { assertValidCampaignId, resolveCampaignPath, REPO_ROOT } from '@/lib/requestGuard';
import { getRuntimeBinding, verifyRuntimeBinding } from '@/lib/stageRuntimeRegistry';

type StageAuditConfig = {
  stage: number;
  label: string;
  stageKey: string;
  brainManifestKey: string;
  additionalBrainManifestKeys?: string[];
  uiRoutes: string[];
  apiRoutes: string[];
  outputFiles: string[];
};

type StageAuditResult = {
  stage: number;
  label: string;
  uiWired: boolean;
  apiWired: boolean;
  brainExecutable: boolean;
  modelBound: boolean;
  outputFileVerified: boolean;
  details: {
    uiRoutesFound: string[];
    apiRoutesFound: string[];
    brainFilePath: string | null;
    modelRoutingKey: string | null;
    runtimeBinding: {
      kind: string;
      target: string;
      executable: boolean;
      reason: string | null | undefined;
    } | null;
    existingOutputFiles: string[];
    missingOutputFiles: string[];
  };
};

type BrainManifest = {
  agentBrains?: Record<string, string | null>;
};

type ModelRouting = {
  campaignStageRouting?: Record<string, unknown>;
};

const DASHBOARD_ROOT = process.cwd();
const BRAIN_MANIFEST_PATH = path.join(REPO_ROOT, 'brain', 'brain-manifest.json');
const MODEL_ROUTING_PATH = path.join(REPO_ROOT, 'system', 'model-routing.config.json');
const APP_ROUTES_ROOT = path.join(DASHBOARD_ROOT, 'src', 'app');
const API_ROUTES_ROOT = path.join(DASHBOARD_ROOT, 'src', 'app', 'api');

const STAGE_AUDIT_CONFIG: StageAuditConfig[] = [
  { stage: 1, label: 'Campaign Intake', stageKey: 'S1_CAMPAIGN_INTAKE', brainManifestKey: 'S1_CAMPAIGN_INTAKE', additionalBrainManifestKeys: ['S0_CAMPAIGN_CLARIFICATION'], uiRoutes: ['/campaigns/create'], apiRoutes: ['/api/campaigns'], outputFiles: ['00-brief.md', '01-campaign-intake.json', 'stage-state.json'] },
  { stage: 2, label: 'Data Extraction', stageKey: 'S2_DATA_EXTRACTION', brainManifestKey: 'S2_DATA_EXTRACTION', uiRoutes: ['/data-extraction'], apiRoutes: ['/api/campaigns/[id]/extract'], outputFiles: ['01-study-notes.md', '02-insights.md', '02-raw-extracted-data.json'] },
  { stage: 3, label: 'Research Enrichment', stageKey: 'S3_RESEARCH_ENRICHMENT', brainManifestKey: 'S3_RESEARCH_ENRICHMENT', uiRoutes: ['/research-enrichment'], apiRoutes: ['/api/research-enrichment'], outputFiles: ['03-research.md', '03-research-enrichment.json', 'topic-expansion-map.json', 'data-inventory.json', 'source-registry.json', 'verified-findings.json'] },
  { stage: 4, label: 'Data & Research Analysis', stageKey: 'S4A_DATA_RESEARCH_ANALYST', brainManifestKey: 'S4A_DATA_RESEARCH_ANALYST', additionalBrainManifestKeys: ['S4B_INSIGHT_ANALYST'], uiRoutes: ['/analysis'], apiRoutes: ['/api/analysis'], outputFiles: ['04-angles.md', 'InsightAnalysisMap.json', 'AngleGenerationHandoff.json'] },
  { stage: 5, label: 'Angle Generation', stageKey: 'S5_ANGLE_GENERATION', brainManifestKey: 'S5_ANGLE_GENERATION', uiRoutes: ['/angles'], apiRoutes: ['/api/angles'], outputFiles: ['05-angles.md'] },
  { stage: 6, label: 'Beat Matching', stageKey: 'S6_BEAT_MATCHING', brainManifestKey: 'S6_BEAT_MATCHING', uiRoutes: ['/angle-selection'], apiRoutes: ['/api/angles'], outputFiles: ['05-beats.md', '06-beat-match.json'] },
  { stage: 7, label: 'Human Gate', stageKey: 'S7_PITCH_SELECTION_HUMAN_GATE', brainManifestKey: 'S7_HUMAN_GATE', uiRoutes: ['/pitch-selection', '/approvals'], apiRoutes: ['/api/campaigns/[id]/approve', '/api/campaigns/[id]/human-approval'], outputFiles: ['human-approval.json'] },
  { stage: 8, label: 'Journalist Collection', stageKey: 'S8_JOURNALIST_COLLECTION', brainManifestKey: 'S8_JOURNALIST_COLLECTION', uiRoutes: ['/journalists'], apiRoutes: ['/api/journalists'], outputFiles: ['06-journalist-intel.md', '08-journalist-list.csv'] },
  { stage: 9, label: 'Journalist Intelligence', stageKey: 'S9_JOURNALIST_INTELLIGENCE', brainManifestKey: 'S9_JOURNALIST_INTELLIGENCE', uiRoutes: ['/media-list'], apiRoutes: ['/api/journalists'], outputFiles: ['07-journalist-coverage.md', '09-journalist-intelligence.json'] },
  { stage: 10, label: 'Pitch Drafting', stageKey: 'S10_PITCH_DRAFTING', brainManifestKey: 'S10_PITCH_DRAFTING', uiRoutes: ['/pitches', '/pitch'], apiRoutes: ['/api/campaigns/[id]/scripts'], outputFiles: ['08-pitch-draft.md', '10-pitch-draft.md'] },
  { stage: 11, label: 'Email Optimization', stageKey: 'S11_PITCH_OPTIMIZATION', brainManifestKey: 'S11_PITCH_OPTIMIZATION', uiRoutes: ['/optimization', '/email'], apiRoutes: ['/api/models'], outputFiles: ['09-optimized-email.md', '11-optimized-pitch.md'] },
  { stage: 12, label: 'Final Package', stageKey: 'S12_PACKAGE_ASSEMBLY', brainManifestKey: 'S12_PACKAGE_ASSEMBLY', uiRoutes: ['/package', '/final-package'], apiRoutes: ['/api/campaigns/[id]/files'], outputFiles: ['12-outreach-package.md'] },
  { stage: 13, label: 'Google Doc Export', stageKey: 'S13_VALIDATION', brainManifestKey: 'S13_VALIDATION', uiRoutes: ['/package'], apiRoutes: ['/api/campaigns/[id]/scripts'], outputFiles: ['10-google-doc.md'] },
  { stage: 14, label: 'Technical Validation', stageKey: 'S14_FINAL_FORMATTING', brainManifestKey: 'S14_FINAL_FORMATTING', uiRoutes: ['/validation'], apiRoutes: ['/api/validation', '/api/validate'], outputFiles: ['13-validation-report.json'] },
  { stage: 15, label: 'Browser Validation', stageKey: 'S15_OUTREACH_ASSET_CREATION', brainManifestKey: 'S15_OUTREACH_ASSET_CREATION', uiRoutes: ['/validation'], apiRoutes: ['/api/validation'], outputFiles: ['14-final-formatted-package.md', '15-outreach-assets.md'] },
  { stage: 16, label: 'Regression & Production', stageKey: 'S16_CAMPAIGN_LOG_LEARNING_LOOP', brainManifestKey: 'S16_CAMPAIGN_LOG_LEARNING_LOOP', uiRoutes: ['/reporting'], apiRoutes: ['/api/workflow', '/api/logs'], outputFiles: ['16-campaign-learning-log.json'] },
];

function routeToAppPath(route: string): string {
  const cleaned = route.replace(/^\//, '');
  return cleaned.length === 0 ? path.join(APP_ROUTES_ROOT, 'page.tsx') : path.join(APP_ROUTES_ROOT, cleaned, 'page.tsx');
}

function routeToApiPath(route: string): string {
  const cleaned = route.replace(/^\/api\//, '').replace(/^\//, '');
  return path.join(API_ROUTES_ROOT, cleaned, 'route.ts');
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolveCampaignId(queryValue: string | null): Promise<string | null> {
  if (queryValue) {
    return assertValidCampaignId(queryValue);
  }

  const pitchJobsRoot = path.join(REPO_ROOT, 'pitch-jobs');
  const entries = await fs.readdir(pitchJobsRoot, { withFileTypes: true }).catch(() => []);
  const dirs = entries.filter(entry => entry.isDirectory()).map(entry => entry.name);
  if (dirs.length === 0) {
    return null;
  }
  dirs.sort((a, b) => b.localeCompare(a));
  return dirs[0];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = await resolveCampaignId(searchParams.get('campaignId'));

    const brainManifestRaw = await fs.readFile(BRAIN_MANIFEST_PATH, 'utf-8');
    const brainManifest = JSON.parse(brainManifestRaw) as BrainManifest;
    const modelRoutingRaw = await fs.readFile(MODEL_ROUTING_PATH, 'utf-8');
    const modelRouting = JSON.parse(modelRoutingRaw) as ModelRouting;

    const campaignPath = campaignId ? resolveCampaignPath(campaignId) : null;

    const stageResults: StageAuditResult[] = [];
    for (const stage of STAGE_AUDIT_CONFIG) {
      const uiChecks = await Promise.all(stage.uiRoutes.map(async route => {
        const fullPath = routeToAppPath(route);
        const exists = await fileExists(fullPath);
        return { route, exists };
      }));
      const apiChecks = await Promise.all(stage.apiRoutes.map(async route => {
        const fullPath = routeToApiPath(route);
        const exists = await fileExists(fullPath);
        return { route, exists };
      }));

      const allBrainKeys = [stage.brainManifestKey, ...(stage.additionalBrainManifestKeys ?? [])];
      const brainFiles = allBrainKeys.map(key => ({ key, file: brainManifest.agentBrains?.[key] ?? null }));
      const brainPaths = brainFiles
        .filter(item => Boolean(item.file))
        .map(item => ({ key: item.key, path: path.join(REPO_ROOT, 'brain', item.file as string) }));
      const brainExistsChecks = await Promise.all(brainPaths.map(async item => ({ ...item, exists: await fileExists(item.path) })));
      const allBrainsExist = brainExistsChecks.length > 0 && brainExistsChecks.every(item => item.exists);
      const runtimeBinding = getRuntimeBinding(stage.stage);
      const runtimeCheck = runtimeBinding ? await verifyRuntimeBinding(runtimeBinding) : { ok: false, reason: 'No runtime binding found.' };

      const modelBound = Boolean(modelRouting.campaignStageRouting?.[stage.stageKey]);

      const existingOutputFiles: string[] = [];
      const missingOutputFiles: string[] = [];
      if (campaignPath) {
        for (const relativeFile of stage.outputFiles) {
          const fullPath = path.join(campaignPath, relativeFile);
          if (await fileExists(fullPath)) {
            existingOutputFiles.push(relativeFile);
          } else {
            missingOutputFiles.push(relativeFile);
          }
        }
      } else {
        missingOutputFiles.push(...stage.outputFiles);
      }

      stageResults.push({
        stage: stage.stage,
        label: stage.label,
        uiWired: uiChecks.some(item => item.exists),
        apiWired: apiChecks.some(item => item.exists),
        brainExecutable: allBrainsExist && runtimeCheck.ok,
        modelBound,
        outputFileVerified: stage.outputFiles.length > 0 ? missingOutputFiles.length === 0 : false,
        details: {
          uiRoutesFound: uiChecks.filter(item => item.exists).map(item => item.route),
          apiRoutesFound: apiChecks.filter(item => item.exists).map(item => item.route),
          brainFilePath: brainExistsChecks.length > 0
            ? brainExistsChecks
                .filter(item => item.exists)
                .map(item => path.relative(REPO_ROOT, item.path).replace(/\\/g, '/'))
                .join(', ')
            : null,
          modelRoutingKey: modelBound ? stage.stageKey : null,
          runtimeBinding: runtimeBinding
            ? {
                kind: runtimeBinding.runtimeKind,
                target: runtimeBinding.executionTarget,
                executable: runtimeCheck.ok,
                reason: runtimeCheck.ok ? null : runtimeCheck.reason,
              }
            : null,
          existingOutputFiles,
          missingOutputFiles,
        },
      });
    }

    const totals = {
      stages: stageResults.length,
      uiWired: stageResults.filter(result => result.uiWired).length,
      apiWired: stageResults.filter(result => result.apiWired).length,
      brainExecutable: stageResults.filter(result => result.brainExecutable).length,
      modelBound: stageResults.filter(result => result.modelBound).length,
      outputFileVerified: stageResults.filter(result => result.outputFileVerified).length,
      fullyConnected: stageResults.filter(result =>
        result.uiWired &&
        result.apiWired &&
        result.brainExecutable &&
        result.modelBound &&
        result.outputFileVerified
      ).length,
    };

    return ok({
      campaignId,
      generatedAt: new Date().toISOString(),
      totals,
      stages: stageResults,
    });
  } catch (error) {
    if (error instanceof Error && /Invalid campaignId/i.test(error.message)) {
      return fail('INVALID_CAMPAIGN_ID', error.message, { status: 400 });
    }
    return fail(
      'FAILED_TO_BUILD_CONNECTION_AUDIT',
      'Failed to generate connection audit.',
      { status: 500 },
      error instanceof Error ? error.message : String(error)
    );
  }
}
