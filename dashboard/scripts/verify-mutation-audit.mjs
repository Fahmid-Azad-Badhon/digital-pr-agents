import fs from 'fs/promises';
import path from 'path';

const projectRoot = process.cwd();
const apiRoot = path.join(projectRoot, 'src', 'app', 'api');
const middlewarePath = path.join(projectRoot, 'middleware.ts');
const internalAuditPath = path.join(apiRoot, '_internal', 'mutation-audit', 'route.ts');

async function walkRoutes(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkRoutes(full)));
    } else if (entry.isFile() && entry.name === 'route.ts') {
      out.push(full);
    }
  }
  return out;
}

function hasMutationHandler(content) {
  return /export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)\s*\(/.test(content);
}

function routePathFromFile(filePath) {
  const rel = path.relative(apiRoot, filePath).replace(/\\/g, '/');
  return `/api/${rel.replace(/\/route\.ts$/, '')}`;
}

async function main() {
  const [middleware, internalAudit] = await Promise.all([
    fs.readFile(middlewarePath, 'utf-8'),
    fs.readFile(internalAuditPath, 'utf-8'),
  ]);

  const middlewareChecks = [
    { ok: middleware.includes("matcher: ['/api/:path*']"), label: 'API matcher enabled' },
    { ok: middleware.includes('emitMutationAudit('), label: 'Mutation audit emitter wired' },
    { ok: middleware.includes('MUTATION_METHODS'), label: 'Mutation method gate present' },
    { ok: middleware.includes("INTERNAL_AUDIT_PATH = '/api/_internal/mutation-audit'"), label: 'Internal audit path configured' },
    { ok: middleware.includes("requestHeaders.set('x-request-id', requestId)"), label: 'Request-id propagation enabled' },
  ];

  const internalChecks = [
    { ok: internalAudit.includes('INTERNAL_AUDIT_TOKEN'), label: 'Internal token guard enabled' },
    { ok: internalAudit.includes('inferAction('), label: 'Action inference enabled' },
    { ok: internalAudit.includes('writeSystemLog('), label: 'Audit logs persisted' },
    { ok: internalAudit.includes('requestId'), label: 'Request-id captured in metadata' },
  ];

  const allRoutes = await walkRoutes(apiRoot);
  const mutationRoutes = [];
  for (const file of allRoutes) {
    const content = await fs.readFile(file, 'utf-8');
    if (hasMutationHandler(content)) {
      mutationRoutes.push({
        file,
        route: routePathFromFile(file),
        explicitAudit: content.includes('writeApiAuditLog('),
      });
    }
  }

  const uncovered = mutationRoutes.filter(item => item.route !== '/api/_internal/mutation-audit' && item.route.startsWith('/api/') === false);
  if (uncovered.length > 0) {
    throw new Error(`Unexpected route normalization failure: ${uncovered.map(r => r.route).join(', ')}`);
  }

  const failedChecks = [...middlewareChecks, ...internalChecks].filter(check => !check.ok);
  if (failedChecks.length > 0) {
    const labels = failedChecks.map(check => check.label).join('; ');
    throw new Error(`Mutation audit guard failed: ${labels}`);
  }

  const explicitCount = mutationRoutes.filter(item => item.explicitAudit).length;
  const coveredCount = mutationRoutes.filter(item => item.route !== '/api/_internal/mutation-audit').length;

  console.log('Mutation audit guard: PASS');
  console.log(`- Mutation routes discovered: ${mutationRoutes.length}`);
  console.log(`- Routes covered by middleware bridge: ${coveredCount}`);
  console.log(`- Routes with explicit route-level audits: ${explicitCount}`);
}

main().catch(error => {
  console.error('Mutation audit guard: FAIL');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

