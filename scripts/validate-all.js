const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DASHBOARD = path.join(ROOT, 'dashboard');

function run(desc, command, opts) {
  console.log(`\n=== ${desc} ===`);
  try {
    execSync(command, { stdio: 'inherit', ...opts });
    console.log(`${desc} PASSED`);
  } catch (e) {
    if (e.status !== undefined) {
      console.error(`${desc} FAILED (exit ${e.status})`);
      process.exit(e.status);
    }
    console.error(`Failed to start: ${e.message}`);
    process.exit(1);
  }
}

run('Lint', 'npm run lint', { cwd: DASHBOARD });
run('Typecheck', 'npm run typecheck -- --incremental false', { cwd: DASHBOARD });
run('Tests', 'npm run test', { cwd: DASHBOARD });

console.log('\n=== ALL VALIDATIONS PASSED ===');
