const { spawnSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DASHBOARD = path.join(ROOT, 'dashboard');

function run(desc, cmd, args, opts) {
  console.log(`\n=== ${desc} ===`);
  const result = spawnSync(cmd, args, { stdio: 'inherit', shell: true, ...opts });
  if (result.error) {
    console.error(`Failed to start: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`${desc} FAILED (exit ${result.status})`);
    process.exit(result.status);
  }
  console.log(`${desc} PASSED`);
}

run('Lint', 'npm', ['run', 'lint'], { cwd: DASHBOARD });
run('Typecheck', 'npm', ['run', 'typecheck', '--', '--incremental', 'false'], { cwd: DASHBOARD });
run('Tests', 'npm', ['run', 'test'], { cwd: DASHBOARD });

console.log('\n=== ALL VALIDATIONS PASSED ===');
