import fs from 'fs/promises';
import path from 'path';

const root = process.cwd();
const repoRoot = path.resolve(root, '..');

async function read(filePath) {
  return fs.readFile(path.join(root, filePath), 'utf-8');
}

async function main() {
  const failures = [];

  const stageRegistryRaw = await read('src/lib/stageRuntimeRegistry.ts');
  const stageMatches = [...stageRegistryRaw.matchAll(/stage:\s*(\d+)/g)].map((match) => Number(match[1]));
  const uniqueStages = [...new Set(stageMatches)].sort((a, b) => a - b);
  for (let stage = 1; stage <= 16; stage += 1) {
    if (!uniqueStages.includes(stage)) {
      failures.push(`stage runtime binding missing for S${stage}`);
    }
  }

  const workerRuntime = await read('src/lib/brainWorkerRuntime.ts');
  if (!/BRAIN_KEY_TO_TARGET/.test(workerRuntime)) failures.push('brain worker runtime missing brain key target map');
  if (!/getBrainWorkerScriptPath\(/.test(workerRuntime)) failures.push('brain worker runtime missing script path resolver');

  const runRoute = await read('src/app/api/brains/run/route.ts');
  if (!/getBrainWorkerScriptPath\(/.test(runRoute)) failures.push('brains/run route missing brain worker path usage');
  if (!/spawn\(/.test(runRoute)) failures.push('brains/run route missing worker process spawn');
  if (!/writeApiAuditLog\(/.test(runRoute)) failures.push('brains/run route missing structured audit logging');

  const serviceCatalog = await read('scripts/brain-worker-services.mjs');
  if (!/runBrainService\(/.test(serviceCatalog)) failures.push('brain worker service catalog missing runBrainService executor');
  if (!/S16_CAMPAIGN_LOG_LEARNING_LOOP/.test(serviceCatalog)) failures.push('brain worker service catalog missing S16 mapping');

  const brainDir = path.join(repoRoot, 'brain');
  const brainFiles = await fs.readdir(brainDir);
  const manifestRaw = await fs.readFile(path.join(brainDir, 'brain-manifest.json'), 'utf-8');
  const manifest = JSON.parse(manifestRaw);
  const manifestBrains = Object.entries(manifest.agentBrains || {});
  const globalBrains = manifest.globalBrains || [];
  const manifestBrainFiles = manifestBrains.map(([, file]) => file);
  if (manifestBrains.length < 16) failures.push('brain manifest does not include full stage agent mapping');

  for (const file of manifestBrainFiles) {
    if (!brainFiles.includes(file)) failures.push(`brain manifest references missing file: ${file}`);
  }
  for (const [brainKey] of manifestBrains) {
    if (!serviceCatalog.includes(`${brainKey}:`)) {
      failures.push(`brain worker service catalog missing brain key mapping: ${brainKey}`);
    }
  }

  const expectedGlobalKeys = [
    'G0_GLOBAL_WORKFLOW',
    'G1_VALIDATION_TRUTH',
    'G2_JOURNALIST_PSYCHOLOGY',
  ];
  if (globalBrains.length < expectedGlobalKeys.length) {
    failures.push('brain manifest does not include required global brains');
  }
  for (const globalKey of expectedGlobalKeys) {
    if (!workerRuntime.includes(`${globalKey}:`)) {
      failures.push(`brain worker runtime missing global key target map: ${globalKey}`);
    }
    if (!serviceCatalog.includes(`${globalKey}:`)) {
      failures.push(`brain worker service catalog missing global key mapping: ${globalKey}`);
    }
  }

  if (failures.length > 0) {
    console.error('Brain worker independence guard: FAIL');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log('Brain worker independence guard: PASS');
}

main().catch((error) => {
  console.error('Brain worker independence guard: FAIL');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
