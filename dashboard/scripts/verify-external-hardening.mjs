import fs from 'fs/promises';
import path from 'path';

const root = process.cwd();
const repoRoot = path.resolve(root, '..');

async function read(filePath) {
  return fs.readFile(path.join(root, filePath), 'utf-8');
}

function assertPattern(content, regex, message, failures) {
  if (!regex.test(content)) failures.push(message);
}

async function main() {
  const failures = [];

  const integrationsHealth = await read('src/app/api/integrations/health/route.ts');
  assertPattern(integrationsHealth, /googleDocs:/, 'integration health missing googleDocs block', failures);
  assertPattern(integrationsHealth, /muckRack:/, 'integration health missing muckRack block', failures);
  assertPattern(integrationsHealth, /oauthConfigured|refreshTokenConfigured/, 'integration health missing OAuth readiness checks', failures);
  assertPattern(integrationsHealth, /externalization/, 'integration health missing externalization status block', failures);

  const preflightRoute = await read('src/app/api/integrations/preflight/route.ts');
  assertPattern(preflightRoute, /productionExternalizationReady/, 'integration preflight route missing production readiness signal', failures);
  assertPattern(preflightRoute, /blockers/, 'integration preflight route missing blockers array', failures);

  const externalizationLib = await read('src/lib/integrationExternalization.ts');
  assertPattern(externalizationLib, /EXTERNALIZATION_MODE/, 'externalization library missing mode resolution', failures);
  assertPattern(externalizationLib, /GOOGLE_OAUTH_APP_VERIFIED/, 'externalization library missing Google verification gate', failures);
  assertPattern(externalizationLib, /MUCKRACK_ROBUSTNESS_APPROVED/, 'externalization library missing Muck Rack robustness gate', failures);

  const executeStage = await read('src/app/api/campaigns/[id]/execute-stage/route.ts');
  assertPattern(executeStage, /runScriptWithRetry\(/, 'stage execution route missing script retry for external actions', failures);
  assertPattern(executeStage, /writeCircuitState\(/, 'stage execution route missing circuit-breaker writes', failures);
  assertPattern(executeStage, /import_muckrack_output|draft_journalist_intel|draft_pitch_draft/, 'stage execution route missing external script action wiring', failures);

  const requiredRepoScripts = [
    'scripts/export-google-doc.cmd',
    'scripts/import-muckrack-output.cmd',
    'scripts/draft-journalist-intel.cmd',
  ];
  for (const relativeScript of requiredRepoScripts) {
    try {
      await fs.access(path.join(repoRoot, relativeScript));
    } catch {
      failures.push(`missing required integration script: ${relativeScript}`);
    }
  }

  if (failures.length > 0) {
    console.error('External integration hardening guard: FAIL');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log('External integration hardening guard: PASS');
}

main().catch((error) => {
  console.error('External integration hardening guard: FAIL');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
