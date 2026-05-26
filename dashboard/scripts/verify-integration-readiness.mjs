import fs from 'fs/promises';
import path from 'path';

const root = process.cwd();

async function read(file) {
  return fs.readFile(path.join(root, file), 'utf-8');
}

function mustContain(content, pattern, label, failures) {
  if (!pattern.test(content)) failures.push(label);
}

async function main() {
  const failures = [];

  const healthRoute = await read('src/app/api/integrations/health/route.ts');
  mustContain(healthRoute, /googleDocs/i, 'integrations health route missing google docs block', failures);
  mustContain(healthRoute, /muckRack/i, 'integrations health route missing muckrack block', failures);

  const autoProgressRoute = await read('src/app/api/campaigns/[id]/auto-progress/route.ts');
  mustContain(autoProgressRoute, /waiting_for_pitch_selection/, 'auto-progress missing pitch selection pause contract', failures);
  mustContain(autoProgressRoute, /stage_gate_status/i, 'auto-progress missing stage-gate status contract', failures);

  const executeStageRoute = await read('src/app/api/campaigns/[id]/execute-stage/route.ts');
  mustContain(executeStageRoute, /STAGE_DEPENDENCY_BLOCKED/, 'execute-stage missing dependency blocker envelope', failures);
  mustContain(executeStageRoute, /requiredAction/, 'execute-stage missing actionable blocker payload', failures);

  const middleware = await read('middleware.ts');
  mustContain(middleware, /x-request-id/i, 'middleware missing request-id propagation', failures);
  mustContain(middleware, /evaluateMutationAuth\(/, 'middleware missing global mutation auth guard', failures);

  const strictAuditRoute = await read('src/app/api/campaigns/[id]/strict-audit/route.ts');
  mustContain(strictAuditRoute, /strictReady/, 'strict-audit missing strictReady response', failures);
  mustContain(strictAuditRoute, /failedItems/, 'strict-audit missing failedItems response', failures);

  if (failures.length > 0) {
    console.error('Integration readiness guard: FAIL');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log('Integration readiness guard: PASS');
}

main().catch((error) => {
  console.error('Integration readiness guard: FAIL');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

