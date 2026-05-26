import fs from 'fs/promises';
import path from 'path';

const root = process.cwd();

async function read(filePath) {
  return fs.readFile(path.join(root, filePath), 'utf-8');
}

function requirePattern(content, regex, message, failures) {
  if (!regex.test(content)) failures.push(message);
}

async function main() {
  const failures = [];

  const executeStage = await read('src/app/api/campaigns/[id]/execute-stage/route.ts');
  requirePattern(executeStage, /writeStageState\(/, 'execute-stage missing stage state updates', failures);
  requirePattern(executeStage, /appendRuntimeEvent\(/, 'execute-stage missing runtime event stream append', failures);
  requirePattern(executeStage, /STAGE_ORDER_BLOCKED/, 'execute-stage missing stage-order enforcement response', failures);
  requirePattern(executeStage, /missingDependencies\(/, 'execute-stage missing dependency validation helper', failures);
  requirePattern(executeStage, /STAGE_DEPENDENCY_BLOCKED/, 'execute-stage missing dependency-blocked response', failures);

  requirePattern(executeStage, /precheckStage\(/, 'execute-stage missing precheck stage orchestration', failures);
  requirePattern(executeStage, /export async function GET/, 'execute-stage route missing precheck GET endpoint', failures);

  const runtimeRegistry = await read('src/lib/stageRuntimeRegistry.ts');
  requirePattern(runtimeRegistry, /STAGE_RUNTIME_BINDINGS/, 'stage runtime registry missing bindings object', failures);
  requirePattern(runtimeRegistry, /S16_CAMPAIGN_LOG_LEARNING_LOOP/, 'stage runtime registry missing S16 binding', failures);

  const statusPolling = await read('src/app/api/brains/job/route.ts');
  requirePattern(statusPolling, /JOB_NOT_FOUND|JOB_ID_REQUIRED/, 'brain job polling route missing robustness guards', failures);

  if (failures.length > 0) {
    console.error('Orchestration coverage guard: FAIL');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log('Orchestration coverage guard: PASS');
}

main().catch((error) => {
  console.error('Orchestration coverage guard: FAIL');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
