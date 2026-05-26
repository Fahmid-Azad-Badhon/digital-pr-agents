import fs from 'fs/promises';
import path from 'path';

const root = process.cwd();
const repoRoot = path.join(root, '..');

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function read(file) {
  return fs.readFile(path.join(root, file), 'utf-8');
}

async function main() {
  const failures = [];

  const registryFile = path.join(root, 'src/lib/stageRuntimeRegistry.ts');
  const registryContent = await fs.readFile(registryFile, 'utf-8');
  const stageMatches = [...registryContent.matchAll(/stage:\s*(\d+)/g)].map(m => Number(m[1]));
  const stageSet = new Set(stageMatches);

  for (let stage = 1; stage <= 16; stage += 1) {
    if (!stageSet.has(stage)) {
      failures.push(`Missing runtime binding entry for S${stage}`);
    }
  }

  const executableFalse = registryContent.match(/executable:\s*false/g);
  if (executableFalse?.length) {
    failures.push('One or more stage bindings are marked executable:false');
  }

  const scriptTargets = [...registryContent.matchAll(/executionTarget:\s*'([^']+\.cmd)'/g)].map(m => m[1]);
  for (const target of scriptTargets) {
    const scriptPath = path.join(repoRoot, target);
    if (!(await pathExists(scriptPath))) {
      failures.push(`Missing script runner target: ${target}`);
    }
  }

  const executeStageRoute = await read('src/app/api/campaigns/[id]/execute-stage/route.ts');
  for (let stage = 1; stage <= 16; stage += 1) {
    if (!new RegExp(`stage === ${stage}`).test(executeStageRoute) && stage !== 16) {
      failures.push(`Execute-stage route missing explicit branch for S${stage}`);
    }
  }
  if (!/executeStage16/.test(executeStageRoute)) {
    failures.push('Execute-stage route missing S16 executor wiring');
  }

  const strictAuditRoutePath = path.join(root, 'src/app/api/campaigns/[id]/strict-audit/route.ts');
  if (!(await pathExists(strictAuditRoutePath))) {
    failures.push('Missing strict-audit endpoint route');
  } else {
    const strictAuditRoute = await fs.readFile(strictAuditRoutePath, 'utf-8');
    if (!/strictReady/.test(strictAuditRoute)) {
      failures.push('strict-audit route missing strictReady summary output');
    }
    if (!/16-campaign-learning-log\.json/.test(strictAuditRoute)) {
      failures.push('strict-audit route missing S16 checks');
    }
  }

  const expectedBrainFiles = [
    'S1_Campaign_Intake_Brain.md',
    '02_Data_Extractor_Brain.md',
    'S3_Research_Enrichment_Brain.md',
    'S4A_Data_Research_Analyst_Brain.md',
    'S4B_Insight_Analyst_Brain.md',
    'S5_Angle_Generation_Brain.md',
    'S6_Beat_Matching_Brain.md',
    'S8_Journalist_Collection_Brain.md',
    'S9_Journalist_Intelligence_Brain.md',
    '10_Pitch_Copywriter_Brain.md',
    '11_Pitch_Optimizer_Brain.md',
    '13_Validator_Brain.md',
  ];
  const brainDirs = [path.join(root, 'src/brain'), path.join(repoRoot, 'brain')];
  for (const brainFile of expectedBrainFiles) {
    // eslint-disable-next-line no-await-in-loop
    const found = (await Promise.all(brainDirs.map(dir => pathExists(path.join(dir, brainFile))))).some(Boolean);
    if (!found) {
      failures.push(`Missing expected brain definition file: ${brainFile}`);
    }
  }

  if (failures.length > 0) {
    console.error('Stage/brain binding guard: FAIL');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log('Stage/brain binding guard: PASS');
}

main().catch((error) => {
  console.error('Stage/brain binding guard: FAIL');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
