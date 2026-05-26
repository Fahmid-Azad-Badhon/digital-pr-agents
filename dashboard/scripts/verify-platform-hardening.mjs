import fs from 'fs/promises';
import path from 'path';

const root = process.cwd();

async function read(file) {
  return fs.readFile(path.join(root, file), 'utf-8');
}

function mustContain(content, pattern, label, failures) {
  if (!pattern.test(content)) {
    failures.push(label);
  }
}

async function main() {
  const failures = [];

  const middleware = await read('middleware.ts');
  mustContain(middleware, /evaluateMutationAuth\(/, 'middleware auth enforcement missing', failures);
  mustContain(middleware, /checkRateLimit\(/, 'middleware global rate limit missing', failures);
  mustContain(middleware, /x-request-id/, 'middleware request-id propagation missing', failures);

  const executeStage = await read('src/app/api/campaigns/[id]/execute-stage/route.ts');
  mustContain(executeStage, /readCircuitState\(/, 'execute-stage circuit read missing', failures);
  mustContain(executeStage, /writeCircuitState\(/, 'execute-stage circuit write missing', failures);
  mustContain(executeStage, /runScriptWithRetry\(/, 'execute-stage retry helper missing', failures);
  mustContain(executeStage, /appendRuntimeEvent\(/, 'execute-stage live runtime event logging missing', failures);

  const logsRoute = await read('src/app/api/logs/route.ts');
  mustContain(logsRoute, /readSystemLogs\(/, 'logs route not wired to structured logs', failures);

  const integrationsHealthRoute = await read('src/app/api/integrations/health/route.ts');
  mustContain(integrationsHealthRoute, /googleDocs:/, 'integration health route missing googleDocs block', failures);
  mustContain(integrationsHealthRoute, /muckRack:/, 'integration health route missing muckRack block', failures);

  const brainRunRoute = await read('src/app/api/brains/run/route.ts');
  mustContain(brainRunRoute, /spawn\(/, 'brain run route missing worker process spawn', failures);
  mustContain(brainRunRoute, /writeApiAuditLog\(/, 'brain run route missing audit logging', failures);

  const brainJobRoute = await read('src/app/api/brains/job/route.ts');
  mustContain(brainJobRoute, /JOB_ID_REQUIRED/, 'brain job route missing validation', failures);

  const stageRuntimeRegistry = await read('src/lib/stageRuntimeRegistry.ts');
  mustContain(stageRuntimeRegistry, /STAGE_RUNTIME_BINDINGS/, 'stage runtime bindings registry missing', failures);
  mustContain(stageRuntimeRegistry, /S16_CAMPAIGN_LOG_LEARNING_LOOP/, 'stage runtime bindings missing stage 16', failures);

  const logger = await read('src/lib/logger.ts');
  mustContain(logger, /OTEL_LOG_ENDPOINT/, 'logger missing OTEL log export endpoint support', failures);

  const verifyCi = await read('package.json');
  mustContain(
    verifyCi,
    /"verify:ci":\s*".*verify:mutation-audit.*verify:api-guardrails.*verify:high-risk-audit.*verify:platform-hardening.*verify:stage-brain-bindings.*verify:integration-readiness.*verify:strict-audit-contract.*build"/,
    'verify:ci chain missing required guardrails',
    failures
  );

  if (failures.length > 0) {
    console.error('Platform hardening guard: FAIL');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log('Platform hardening guard: PASS');
}

main().catch((error) => {
  console.error('Platform hardening guard: FAIL');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
