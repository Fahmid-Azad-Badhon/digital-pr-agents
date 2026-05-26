import fs from 'fs/promises';
import path from 'path';

const DASHBOARD_ROOT = process.cwd();
const REPO_ROOT = path.join(DASHBOARD_ROOT, '..');
const BRAIN_ROOT = path.join(REPO_ROOT, 'brain');
const PITCH_JOBS_ROOT = path.join(REPO_ROOT, 'pitch-jobs');
const APP_ROUTES_ROOT = path.join(DASHBOARD_ROOT, 'src', 'app');
const API_ROUTES_ROOT = path.join(DASHBOARD_ROOT, 'src', 'app', 'api');
const MODEL_ROUTING_PATH = path.join(REPO_ROOT, 'system', 'model-routing.config.json');
const BRAIN_MANIFEST_PATH = path.join(BRAIN_ROOT, 'brain-manifest.json');
const STAGE_RUNTIME_BINDINGS_PATH = path.join(DASHBOARD_ROOT, 'src', 'lib', 'stageRuntimeRegistry.ts');

const STAGE_AUDIT_CONFIG = [
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

function routeToAppPath(route) {
  const cleaned = route.replace(/^\//, '');
  return cleaned.length === 0 ? path.join(APP_ROUTES_ROOT, 'page.tsx') : path.join(APP_ROUTES_ROOT, cleaned, 'page.tsx');
}

function routeToApiPath(route) {
  const cleaned = route.replace(/^\/api\//, '').replace(/^\//, '');
  return path.join(API_ROUTES_ROOT, cleaned, 'route.ts');
}

function normalizePath(filePath) {
  return path.relative(REPO_ROOT, filePath).replace(/\\/g, '/');
}

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath, fallback = {}) {
  try {
    const text = await fs.readFile(filePath, 'utf8');
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

async function getLatestCampaignSlug() {
  try {
    const entries = await fs.readdir(PITCH_JOBS_ROOT, { withFileTypes: true });
    const dirs = entries.filter(entry => entry.isDirectory()).map(entry => entry.name).sort((a, b) => b.localeCompare(a));
    return dirs[0] ?? null;
  } catch {
    return null;
  }
}

function parseCliCampaignSlug() {
  const index = process.argv.findIndex(arg => arg === '--campaign');
  if (index >= 0 && process.argv[index + 1]) {
    return process.argv[index + 1].trim();
  }
  return null;
}

function parseRuntimeBindings(tsSource) {
  const re = /\{\s*stage:\s*(\d+)[\s\S]*?brainManifestKey:\s*'([^']+)'[\s\S]*?runtimeKind:\s*'([^']+)'[\s\S]*?executable:\s*(true|false)[\s\S]*?executionTarget:\s*'([^']+)'[\s\S]*?outputFiles:\s*\[([^\]]*)\]/g;
  const bindings = [];
  let match;
  while ((match = re.exec(tsSource)) !== null) {
    const outputFiles = [...match[6].matchAll(/'([^']+)'/g)].map(item => item[1]);
    bindings.push({
      stage: Number(match[1]),
      brainManifestKey: match[2],
      runtimeKind: match[3],
      executable: match[4] === 'true',
      executionTarget: match[5],
      outputFiles,
    });
  }
  return bindings;
}

function stageStatus(stageResult) {
  if (stageResult.uiWired && stageResult.apiWired && stageResult.brainExecutable && stageResult.modelBound && stageResult.outputFileVerified) {
    return 'Executable';
  }
  if (!stageResult.uiWired && !stageResult.apiWired && !stageResult.brainExecutable && !stageResult.modelBound) {
    return 'Missing';
  }
  return 'Partially Connected';
}

function brainStatus(brainResult) {
  if (brainResult.fileExists && brainResult.boundStages.length === 0 && brainResult.brainType === 'global') {
    return 'Executable';
  }
  if (brainResult.fileExists && brainResult.boundStages.length > 0 && brainResult.allBoundStagesExecutable) {
    return 'Executable';
  }
  if (!brainResult.fileExists && brainResult.boundStages.length === 0) {
    return 'Missing';
  }
  return 'Partially Connected';
}

function toMarkdown(report) {
  const lines = [];
  lines.push('# Connection Proof Report');
  lines.push('');
  lines.push(`- Generated at: ${report.generatedAt}`);
  lines.push(`- Campaign used for output verification: ${report.campaignSlug ?? 'None found'}`);
  lines.push(`- Model routing source: \`${report.evidence.modelRoutingPath}\``);
  lines.push(`- Brain manifest source: \`${report.evidence.brainManifestPath}\``);
  lines.push(`- Runtime bindings source: \`${report.evidence.runtimeBindingPath}\``);
  lines.push('');
  lines.push('## Stage Connection Matrix');
  lines.push('');
  lines.push('| Stage | Name | Status | UI | API | Brain Executable | Model Bound | Output Verified |');
  lines.push('|---|---|---|---|---|---|---|---|');
  for (const stage of report.stages) {
    lines.push(`| S${stage.stage} | ${stage.label} | ${stage.status} | ${stage.uiWired ? 'Yes' : 'No'} | ${stage.apiWired ? 'Yes' : 'No'} | ${stage.brainExecutable ? 'Yes' : 'No'} | ${stage.modelBound ? 'Yes' : 'No'} | ${stage.outputFileVerified ? 'Yes' : 'No'} |`);
  }
  lines.push('');
  lines.push('## Stage Evidence');
  lines.push('');
  for (const stage of report.stages) {
    lines.push(`### S${stage.stage} ${stage.label} — ${stage.status}`);
    lines.push(`- UI files checked: ${stage.evidence.uiFiles.map(file => `\`${file}\``).join(', ')}`);
    lines.push(`- API files checked: ${stage.evidence.apiFiles.map(file => `\`${file}\``).join(', ')}`);
    lines.push(`- Brain file: ${stage.evidence.brainFile ? `\`${stage.evidence.brainFile}\`` : 'None'}`);
    lines.push(`- Runtime target: ${stage.evidence.runtimeTarget ? `\`${stage.evidence.runtimeTarget}\`` : 'None'}`);
    lines.push(`- Model route key: ${stage.evidence.modelRouteKey ?? 'Missing'}`);
    lines.push(`- Existing outputs: ${stage.evidence.existingOutputFiles.length ? stage.evidence.existingOutputFiles.map(file => `\`${file}\``).join(', ') : 'None'}`);
    lines.push(`- Missing outputs: ${stage.evidence.missingOutputFiles.length ? stage.evidence.missingOutputFiles.map(file => `\`${file}\``).join(', ') : 'None'}`);
    lines.push('');
  }
  lines.push('## Brain Connection Matrix');
  lines.push('');
  lines.push('| Brain Key | Brain File | Status | Bound Stages |');
  lines.push('|---|---|---|---|');
  for (const brain of report.brains) {
    lines.push(`| ${brain.brainKey} | ${brain.brainFile ?? 'None'} | ${brain.status} | ${brain.boundStages.length ? brain.boundStages.map(stage => `S${stage}`).join(', ') : 'None'} |`);
  }
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Stages Executable: ${report.summary.stagesExecutable}/${report.summary.stagesTotal}`);
  lines.push(`- Stages Partially Connected: ${report.summary.stagesPartial}/${report.summary.stagesTotal}`);
  lines.push(`- Stages Missing: ${report.summary.stagesMissing}/${report.summary.stagesTotal}`);
  lines.push(`- Brains Executable: ${report.summary.brainsExecutable}/${report.summary.brainsTotal}`);
  lines.push(`- Brains Partially Connected: ${report.summary.brainsPartial}/${report.summary.brainsTotal}`);
  lines.push(`- Brains Missing: ${report.summary.brainsMissing}/${report.summary.brainsTotal}`);
  lines.push('');
  return `${lines.join('\n')}\n`;
}

async function main() {
  const brainManifest = await readJson(BRAIN_MANIFEST_PATH, {});
  const modelRouting = await readJson(MODEL_ROUTING_PATH, {});
  const runtimeBindingsSource = await fs.readFile(STAGE_RUNTIME_BINDINGS_PATH, 'utf8');
  const runtimeBindings = parseRuntimeBindings(runtimeBindingsSource);
  const runtimeByStage = new Map(runtimeBindings.map(binding => [binding.stage, binding]));

  const requestedCampaignSlug = parseCliCampaignSlug();
  const campaignSlug = requestedCampaignSlug || await getLatestCampaignSlug();
  const campaignDir = campaignSlug ? path.join(PITCH_JOBS_ROOT, campaignSlug) : null;

  const stages = [];
  for (const stageConfig of STAGE_AUDIT_CONFIG) {
    const runtimeBinding = runtimeByStage.get(stageConfig.stage) ?? null;
    const uiFiles = stageConfig.uiRoutes.map(route => routeToAppPath(route));
    const apiFiles = stageConfig.apiRoutes.map(route => routeToApiPath(route));
    const uiWired = (await Promise.all(uiFiles.map(file => exists(file)))).some(Boolean);
    const apiWired = (await Promise.all(apiFiles.map(file => exists(file)))).some(Boolean);

    const allBrainKeys = [stageConfig.brainManifestKey, ...(stageConfig.additionalBrainManifestKeys ?? [])];
    const brainFiles = allBrainKeys.map(key => ({ key, file: brainManifest?.agentBrains?.[key] ?? null }));
    const brainPaths = brainFiles
      .filter(item => Boolean(item.file))
      .map(item => ({ key: item.key, path: path.join(BRAIN_ROOT, item.file) }));
    const brainChecks = await Promise.all(brainPaths.map(async item => ({ ...item, exists: await exists(item.path) })));
    const allBrainsExist = brainChecks.length > 0 && brainChecks.every(item => item.exists);

    let runtimeExecutable = Boolean(runtimeBinding?.executable);
    if (runtimeBinding && runtimeBinding.runtimeKind === 'script_runner') {
      const scriptFullPath = path.join(REPO_ROOT, runtimeBinding.executionTarget);
      runtimeExecutable = runtimeExecutable && await exists(scriptFullPath);
    }

    const brainExecutable = allBrainsExist && runtimeExecutable;
    const modelBound = Boolean(modelRouting?.campaignStageRouting?.[stageConfig.stageKey]);

    const existingOutputFiles = [];
    const missingOutputFiles = [];
    for (const outputFile of stageConfig.outputFiles) {
      const fullPath = campaignDir ? path.join(campaignDir, outputFile) : null;
      if (fullPath && await exists(fullPath)) {
        existingOutputFiles.push(outputFile);
      } else {
        missingOutputFiles.push(outputFile);
      }
    }
    const outputFileVerified = stageConfig.outputFiles.length > 0 ? missingOutputFiles.length === 0 : false;

    const stageResult = {
      stage: stageConfig.stage,
      label: stageConfig.label,
      uiWired,
      apiWired,
      brainExecutable,
      modelBound,
      outputFileVerified,
      evidence: {
        uiFiles: uiFiles.map(file => normalizePath(file)),
        apiFiles: apiFiles.map(file => normalizePath(file)),
        brainFile: brainChecks.length > 0
          ? brainChecks.filter(item => item.exists).map(item => normalizePath(item.path)).join(', ')
          : null,
        runtimeTarget: runtimeBinding ? runtimeBinding.executionTarget : null,
        modelRouteKey: modelBound ? stageConfig.stageKey : null,
        existingOutputFiles,
        missingOutputFiles,
      },
    };
    stageResult.status = stageStatus(stageResult);
    stages.push(stageResult);
  }

  const brains = [];
  const manifestBrains = brainManifest?.agentBrains ?? {};
  for (const [brainKey, brainFile] of Object.entries(manifestBrains)) {
    const resolvedBrainPath = brainFile ? path.join(BRAIN_ROOT, brainFile) : null;
    const fileExists = resolvedBrainPath ? await exists(resolvedBrainPath) : false;
    const boundStages = stages
      .filter(stage => {
        const config = stageConfigFor(stage.stage);
        if (!config) return false;
        const keys = [config.brainManifestKey, ...(config.additionalBrainManifestKeys ?? [])];
        return keys.includes(brainKey);
      })
      .map(stage => stage.stage);
    const allBoundStagesExecutable = boundStages.every(stageNumber => stages.find(item => item.stage === stageNumber)?.brainExecutable === true);
    const brainResult = {
      brainKey,
      brainFile: resolvedBrainPath ? normalizePath(resolvedBrainPath) : null,
      fileExists,
      boundStages,
      allBoundStagesExecutable,
    };
    brainResult.status = brainStatus(brainResult);
    brains.push(brainResult);
  }

  const globalBrainFiles = Array.isArray(brainManifest?.globalBrains) ? brainManifest.globalBrains : [];
  const globalBrainKeyMap = {
    '00_Global_Workflow_Brain.md': 'G0_GLOBAL_WORKFLOW',
    '02_Validation_And_Truth_Brain.md': 'G1_VALIDATION_TRUTH',
    '03_Journalist_Psychology_And_Emotional_Intelligence_Brain.md': 'G2_JOURNALIST_PSYCHOLOGY',
  };
  for (const globalBrainFile of globalBrainFiles) {
    const resolvedPath = path.join(BRAIN_ROOT, globalBrainFile);
    // eslint-disable-next-line no-await-in-loop
    const fileExists = await exists(resolvedPath);
    const brainKey = globalBrainKeyMap[globalBrainFile] || `GLOBAL_${globalBrainFile.replace(/[^A-Za-z0-9]+/g, '_').toUpperCase()}`;
    const brainResult = {
      brainKey,
      brainType: 'global',
      brainFile: normalizePath(resolvedPath),
      fileExists,
      boundStages: [],
      allBoundStagesExecutable: fileExists,
    };
    brainResult.status = brainStatus(brainResult);
    brains.push(brainResult);
  }

  const summary = {
    stagesTotal: stages.length,
    stagesExecutable: stages.filter(stage => stage.status === 'Executable').length,
    stagesPartial: stages.filter(stage => stage.status === 'Partially Connected').length,
    stagesMissing: stages.filter(stage => stage.status === 'Missing').length,
    brainsTotal: brains.length,
    brainsExecutable: brains.filter(brain => brain.status === 'Executable').length,
    brainsPartial: brains.filter(brain => brain.status === 'Partially Connected').length,
    brainsMissing: brains.filter(brain => brain.status === 'Missing').length,
  };

  const report = {
    generatedAt: new Date().toISOString(),
    campaignSlug,
    evidence: {
      modelRoutingPath: normalizePath(MODEL_ROUTING_PATH),
      brainManifestPath: normalizePath(BRAIN_MANIFEST_PATH),
      runtimeBindingPath: normalizePath(STAGE_RUNTIME_BINDINGS_PATH),
    },
    summary,
    stages,
    brains,
  };

  const reportsDir = path.join(DASHBOARD_ROOT, 'reports');
  await fs.mkdir(reportsDir, { recursive: true });

  const timestamp = report.generatedAt.replace(/[:.]/g, '-');
  const jsonPath = path.join(reportsDir, `connection-proof-${timestamp}.json`);
  const mdPath = path.join(reportsDir, `connection-proof-${timestamp}.md`);
  await fs.writeFile(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  await fs.writeFile(mdPath, toMarkdown(report), 'utf8');

  console.log(`Connection proof report generated.`);
  console.log(`JSON: ${jsonPath}`);
  console.log(`MD:   ${mdPath}`);
}

function stageConfigFor(stageNumber) {
  return STAGE_AUDIT_CONFIG.find(stage => stage.stage === stageNumber);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
