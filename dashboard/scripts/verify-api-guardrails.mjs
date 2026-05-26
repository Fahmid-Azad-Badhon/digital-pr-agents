import fs from 'fs/promises';
import path from 'path';

const projectRoot = process.cwd();
const apiRoot = path.join(projectRoot, 'src', 'app', 'api');
const middlewarePath = path.join(projectRoot, 'middleware.ts');

const MUTATION_FN_REGEX = /export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)\s*\(/g;

async function walkRoutes(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const output = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      output.push(...(await walkRoutes(full)));
    } else if (entry.isFile() && entry.name === 'route.ts') {
      output.push(full);
    }
  }
  return output;
}

function routeNameFromPath(filePath) {
  const rel = path.relative(apiRoot, filePath).replace(/\\/g, '/');
  return `/api/${rel.replace(/\/route\.ts$/, '')}`;
}

function getHandlerSlice(content, startIndex, nextStartIndex) {
  const end = nextStartIndex > startIndex ? nextStartIndex : content.length;
  return content.slice(startIndex, end);
}

function checkMiddlewareWiring(middleware) {
  const checks = [
    { ok: middleware.includes("matcher: ['/api/:path*']"), reason: 'middleware matcher missing /api/:path*' },
    { ok: middleware.includes("requestHeaders.set('x-request-id', requestId)"), reason: 'request-id not injected into request headers' },
    { ok: middleware.includes("response.headers.set('x-request-id', requestId)"), reason: 'request-id not set on mutation passthrough response' },
    { ok: middleware.includes("passthrough.headers.set('x-request-id', requestId)"), reason: 'request-id not set on non-mutation passthrough response' },
    { ok: middleware.includes('rateLimitedEnvelope('), reason: 'rate limit response helper missing' },
  ];

  return checks.filter(check => !check.ok).map(check => check.reason);
}

async function main() {
  const middleware = await fs.readFile(middlewarePath, 'utf-8');
  const middlewareErrors = checkMiddlewareWiring(middleware);

  const files = await walkRoutes(apiRoot);
  const violations = [];
  let mutationRouteCount = 0;
  let mutationHandlerCount = 0;

  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    const routeName = routeNameFromPath(file);
    const hasMutation = MUTATION_FN_REGEX.test(content);
    MUTATION_FN_REGEX.lastIndex = 0;
    if (!hasMutation) continue;

    mutationRouteCount += 1;

    const hasApiResponseImport = /from\s+['"]@\/lib\/apiResponse['"]/.test(content);
    if (!hasApiResponseImport) {
      violations.push(`${routeName}: missing @/lib/apiResponse import`);
    }

    const matches = Array.from(content.matchAll(MUTATION_FN_REGEX));
    for (let i = 0; i < matches.length; i += 1) {
      const match = matches[i];
      const method = match[1];
      mutationHandlerCount += 1;
      const startIndex = match.index ?? 0;
      const nextStart = matches[i + 1]?.index ?? content.length;
      const body = getHandlerSlice(content, startIndex, nextStart);

      if (!/\bok\(/.test(body)) {
        violations.push(`${routeName}#${method}: missing ok(...) response path`);
      }
      if (!/\bfail\(/.test(body)) {
        violations.push(`${routeName}#${method}: missing fail(...) response path`);
      }
      if (/NextResponse\.json\(/.test(body)) {
        violations.push(`${routeName}#${method}: uses NextResponse.json instead of ok/fail envelope`);
      }
      if (/return\s+new\s+Response\(/.test(body)) {
        violations.push(`${routeName}#${method}: uses raw Response instead of ok/fail envelope`);
      }
    }
  }

  if (middlewareErrors.length || violations.length) {
    console.error('API guardrail verification: FAIL');
    if (middlewareErrors.length) {
      console.error('- Middleware wiring errors:');
      for (const err of middlewareErrors) {
        console.error(`  - ${err}`);
      }
    }
    if (violations.length) {
      console.error('- Mutation route violations:');
      for (const v of violations) {
        console.error(`  - ${v}`);
      }
    }
    process.exit(1);
  }

  console.log('API guardrail verification: PASS');
  console.log(`- Mutation routes scanned: ${mutationRouteCount}`);
  console.log(`- Mutation handlers scanned: ${mutationHandlerCount}`);
  console.log('- Standard error envelope enforcement: OK');
  console.log('- Request-id middleware wiring: OK');
}

main().catch(error => {
  console.error('API guardrail verification: FAIL');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
