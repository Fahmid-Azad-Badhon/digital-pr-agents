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

  const middleware = await read('middleware.ts');
  must(middleware, /evaluateMutationAuth\(/, 'global auth middleware evaluation missing', failures);
  must(middleware, /checkRateLimit\(/, 'global rate limit check missing', failures);
  must(middleware, /x-request-id/i, 'request-id propagation missing in middleware', failures);

  const logger = await read('src/lib/logger.ts');
  must(logger, /writeApiAuditLog\(/, 'structured API audit logger missing', failures);
  must(logger, /OTEL_LOG_ENDPOINT/, 'OTEL endpoint support missing in logger', failures);

  const responseGuard = await read('src/lib/apiResponse.ts');
  must(responseGuard, /code/, 'standardized error envelope missing error code field', failures);
  must(responseGuard, /details/, 'standardized error envelope missing details support', failures);

  const pkg = await read('package.json');
  must(pkg, /"verify:ci":\s*".*verify:.*build"/, 'verify:ci chain missing', failures);

  const workflow = await read('.github/workflows/dashboard-ci.yml');
  must(workflow, /npm run verify:ci/, 'CI workflow not enforcing verify:ci', failures);

  if (failures.length > 0) {
    console.error('Enterprise depth guard: FAIL');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log('Enterprise depth guard: PASS');
}

main().catch((error) => {
  console.error('Enterprise depth guard: FAIL');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
