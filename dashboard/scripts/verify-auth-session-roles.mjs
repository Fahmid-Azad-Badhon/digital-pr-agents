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
  must(authGuard, /getSessionTokenFromRequest\(/, 'auth guard missing session token extraction', failures);
  must(authGuard, /verifySessionToken\(/, 'auth guard missing session token verification', failures);
  must(authGuard, /getRequiredRoleForPath\(/, 'auth guard missing route role resolver', failures);

  const sessionLib = await read('src/lib/sessionAuth.ts');
  must(sessionLib, /issueSessionToken\(/, 'session library missing issueSessionToken', failures);
  must(sessionLib, /verifySessionToken\(/, 'session library missing verifySessionToken', failures);
  must(sessionLib, /DASHBOARD_AUTH_USERS_JSON/, 'session library missing auth user parsing env support', failures);

  const loginRoute = await read('src/app/api/auth/login/route.ts');
  must(loginRoute, /parseAuthUsers\(/, 'auth login route missing user registry parse', failures);
  must(loginRoute, /response\.cookies\.set\(/, 'auth login route missing session cookie set', failures);

  const logoutRoute = await read('src/app/api/auth/logout/route.ts');
  must(logoutRoute, /response\.cookies\.set\(/, 'auth logout route missing cookie clear', failures);

  const meRoute = await read('src/app/api/auth/me/route.ts');
  must(meRoute, /verifySessionToken\(/, 'auth me route missing session verification', failures);

  const middleware = await read('middleware.ts');
  must(middleware, /PUBLIC_MUTATION_PATHS/, 'middleware missing public mutation auth path allowlist', failures);
  must(middleware, /\/api\/auth\/login/, 'middleware public login route missing', failures);

  if (failures.length > 0) {
    console.error('Auth/session/roles guard: FAIL');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log('Auth/session/roles guard: PASS');
}

main().catch((error) => {
  console.error('Auth/session/roles guard: FAIL');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

