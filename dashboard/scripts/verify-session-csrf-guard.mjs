import fs from 'fs/promises';
import path from 'path';

const projectRoot = process.cwd();
const middlewarePath = path.join(projectRoot, 'middleware.ts');
const loginRoutePath = path.join(projectRoot, 'src', 'app', 'api', 'auth', 'login', 'route.ts');
const logoutRoutePath = path.join(projectRoot, 'src', 'app', 'api', 'auth', 'logout', 'route.ts');
const meRoutePath = path.join(projectRoot, 'src', 'app', 'api', 'auth', 'me', 'route.ts');
const sessionAuthPath = path.join(projectRoot, 'src', 'lib', 'sessionAuth.ts');

function requireIncludes(content, checks, fileLabel) {
  const failures = [];
  for (const check of checks) {
    if (!content.includes(check.snippet)) {
      failures.push(`${fileLabel}: ${check.message}`);
    }
  }
  return failures;
}

async function main() {
  const [middleware, loginRoute, logoutRoute, meRoute, sessionAuth] = await Promise.all([
    fs.readFile(middlewarePath, 'utf-8'),
    fs.readFile(loginRoutePath, 'utf-8'),
    fs.readFile(logoutRoutePath, 'utf-8'),
    fs.readFile(meRoutePath, 'utf-8'),
    fs.readFile(sessionAuthPath, 'utf-8'),
  ]);

  const failures = [];
  failures.push(
    ...requireIncludes(sessionAuth, [
      { snippet: "const CSRF_COOKIE_NAME = 'dashboard_csrf';", message: 'csrf cookie constant missing' },
      { snippet: 'export function generateCsrfToken()', message: 'csrf token generator missing' },
      { snippet: 'export function getCsrfCookieName()', message: 'csrf cookie accessor missing' },
    ], 'src/lib/sessionAuth.ts')
  );

  failures.push(
    ...requireIncludes(loginRoute, [
      { snippet: 'const csrfToken = generateCsrfToken();', message: 'login does not generate csrf token' },
      { snippet: 'name: getCsrfCookieName()', message: 'login does not set csrf cookie' },
      { snippet: 'csrfToken,', message: 'login response does not return csrf token' },
    ], 'src/app/api/auth/login/route.ts')
  );

  failures.push(
    ...requireIncludes(logoutRoute, [
      { snippet: 'name: getCsrfCookieName()', message: 'logout does not clear csrf cookie' },
    ], 'src/app/api/auth/logout/route.ts')
  );

  failures.push(
    ...requireIncludes(meRoute, [
      { snippet: 'csrfToken:', message: 'auth/me does not surface csrf token' },
    ], 'src/app/api/auth/me/route.ts')
  );

  failures.push(
    ...requireIncludes(middleware, [
      { snippet: "const CSRF_COOKIE_NAME = 'dashboard_csrf';", message: 'middleware missing csrf cookie constant' },
      { snippet: 'function hasValidCsrfToken(', message: 'middleware missing csrf validator' },
      { snippet: 'CSRF_REQUIRED', message: 'middleware missing csrf error envelope' },
      { snippet: 'if (hasSessionCookie(request) && !hasValidCsrfToken(request))', message: 'middleware not enforcing csrf on session mutations' },
      { snippet: "const PUBLIC_MUTATION_PATHS = new Set([", message: 'public mutation allowlist missing' },
      { snippet: "'/api/auth/login'", message: 'login must remain public mutation path' },
      { snippet: "'/api/auth/logout'", message: 'logout must remain public mutation path' },
    ], 'middleware.ts')
  );

  if (failures.length > 0) {
    console.error('Session CSRF guard verification: FAIL');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log('Session CSRF guard verification: PASS');
  console.log('- Session cookie + CSRF cookie model: OK');
  console.log('- Middleware CSRF enforcement for session mutations: OK');
  console.log('- Auth login/logout/me CSRF plumbing: OK');
}

main().catch((error) => {
  console.error('Session CSRF guard verification: FAIL');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
