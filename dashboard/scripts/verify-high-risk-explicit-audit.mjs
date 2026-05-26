import fs from 'fs/promises';
import path from 'path';

const projectRoot = process.cwd();
const apiRoot = path.join(projectRoot, 'src', 'app', 'api');

const HIGH_RISK_ENDPOINTS = [
  '/api/workflow',
  '/api/campaigns/[id]/execute-stage',
  '/api/campaigns/[id]/scripts',
  '/api/campaigns/[id]/backup',
  '/api/campaigns/[id]/stage-state',
  '/api/campaigns/[id]/human-approval',
  '/api/campaigns/[id]/governance',
  '/api/campaigns/[id]/gates',
];

const MUTATION_REGEX = /export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)\s*\(/g;

async function routeFileFromApiRoute(routePath) {
  const rel = routePath.replace(/^\/api\//, '');
  const filePath = path.join(apiRoot, ...rel.split('/'), 'route.ts');
  return filePath;
}

function methodSlices(content) {
  const matches = Array.from(content.matchAll(MUTATION_REGEX));
  return matches.map((match, index) => {
    const method = match[1];
    const start = match.index ?? 0;
    const end = matches[index + 1]?.index ?? content.length;
    return { method, body: content.slice(start, end) };
  });
}

function hasExplicitAuditWithFields(section) {
  const hasWriteAudit = /writeApiAuditLog\s*\(/.test(section);
  if (!hasWriteAudit) return false;

  const hasStage = /\bstage\b/.test(section);
  const hasCampaign = /\bcampaignId\b/.test(section);
  const hasActor = /\bactor\s*:/.test(section);
  const hasAction = /\baction\s*:/.test(section);
  return hasStage && hasCampaign && hasActor && hasAction;
}

async function main() {
  const failures = [];
  let scannedHandlers = 0;

  for (const route of HIGH_RISK_ENDPOINTS) {
    const filePath = await routeFileFromApiRoute(route);
    let content = '';
    try {
      content = await fs.readFile(filePath, 'utf-8');
    } catch {
      failures.push(`${route}: route file missing (${filePath})`);
      continue;
    }

    const slices = methodSlices(content);
    const mutationSlices = slices.filter(slice => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(slice.method));
    if (mutationSlices.length === 0) {
      failures.push(`${route}: no mutation handlers found`);
      continue;
    }

    for (const slice of mutationSlices) {
      scannedHandlers += 1;
      if (!hasExplicitAuditWithFields(slice.body)) {
        failures.push(
          `${route}#${slice.method}: missing explicit writeApiAuditLog with stage/campaignId/actor/action`
        );
      }
    }
  }

  if (failures.length > 0) {
    console.error('High-risk explicit audit guard: FAIL');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log('High-risk explicit audit guard: PASS');
  console.log(`- High-risk endpoints checked: ${HIGH_RISK_ENDPOINTS.length}`);
  console.log(`- Mutation handlers checked: ${scannedHandlers}`);
}

main().catch(error => {
  console.error('High-risk explicit audit guard: FAIL');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
