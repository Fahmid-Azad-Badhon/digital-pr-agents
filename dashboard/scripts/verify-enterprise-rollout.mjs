import fs from 'fs/promises';
import path from 'path';

const root = process.cwd();

async function read(filePath) {
  return fs.readFile(path.join(root, filePath), 'utf-8');
}

function must(content, regex, message, failures) {
  if (!regex.test(content)) failures.push(message);
}

async function main() {
  const failures = [];

  const authGuard = await read('src/lib/authGuard.ts');
  must(authGuard, /DASHBOARD_ROUTE_POLICIES_JSON/, 'auth guard missing route policy env support', failures);
  must(authGuard, /getRequiredRoleForPath\(/, 'auth guard missing route-level required role resolver', failures);
  must(authGuard, /hasRequiredRole\(/, 'auth guard missing role rank enforcement', failures);

  const brainsCatalog = await read('src/app/api/brains/catalog/route.ts');
  must(brainsCatalog, /independentWorkerReady/, 'brains catalog missing independent worker readiness signal', failures);
  must(brainsCatalog, /verifyRuntimeBinding\(/, 'brains catalog missing runtime binding verification', failures);

  const observabilityApi = await read('src/app/api/observability/summary/route.ts');
  must(observabilityApi, /buildObservabilitySummary\(/, 'observability summary route missing summary builder call', failures);

  const observabilityPage = await read('src/app/observability/page.tsx');
  must(observabilityPage, /\/api\/observability\/summary/, 'observability page missing observability summary API wiring', failures);

  const workflow = await read('.github/workflows/dashboard-ci.yml');
  must(workflow, /release-gates:/, 'CI workflow missing release-gates job', failures);
  must(workflow, /startsWith\(github\.ref,\s*'refs\/tags\/'\)/, 'release-gates job missing tag-trigger guard', failures);

  if (failures.length > 0) {
    console.error('Enterprise rollout guard: FAIL');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log('Enterprise rollout guard: PASS');
}

main().catch((error) => {
  console.error('Enterprise rollout guard: FAIL');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

