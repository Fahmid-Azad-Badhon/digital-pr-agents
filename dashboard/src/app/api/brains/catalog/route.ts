import fs from 'fs/promises';
import path from 'path';
import { ok } from '@/lib/apiResponse';
import { REPO_ROOT } from '@/lib/requestGuard';
import { STAGE_RUNTIME_BINDINGS, verifyRuntimeBinding } from '@/lib/stageRuntimeRegistry';

type BrainManifest = {
  agentBrains?: Record<string, string | null>;
  globalBrains?: string[];
};

const GLOBAL_BRAIN_KEY_BY_FILE: Record<string, string> = {
  '00_Global_Workflow_Brain.md': 'G0_GLOBAL_WORKFLOW',
  '02_Validation_And_Truth_Brain.md': 'G1_VALIDATION_TRUTH',
  '03_Journalist_Psychology_And_Emotional_Intelligence_Brain.md': 'G2_JOURNALIST_PSYCHOLOGY',
};

export async function GET() {
  const manifestPath = path.join(REPO_ROOT, 'brain', 'brain-manifest.json');
  const workerScriptPath = path.join(REPO_ROOT, 'scripts', 'run-brain-worker.mjs');

  const [manifestRaw, workerScriptExists] = await Promise.all([
    fs.readFile(manifestPath, 'utf-8').catch(() => '{}'),
    fs.access(workerScriptPath).then(() => true).catch(() => false),
  ]);

  const manifest = JSON.parse(manifestRaw) as BrainManifest;
  const agentBrains = manifest.agentBrains || {};
  const globalBrains = manifest.globalBrains || [];
  const globalEntries = globalBrains.map((brainFile) => ({
    key: GLOBAL_BRAIN_KEY_BY_FILE[brainFile] || `GLOBAL_${brainFile.replace(/[^A-Za-z0-9]+/g, '_').toUpperCase()}`,
    file: brainFile,
    type: 'global' as const,
  }));
  const agentEntries = Object.entries(agentBrains).map(([key, brainFile]) => ({
    key,
    file: brainFile,
    type: 'agent' as const,
  }));
  const entries = [...globalEntries, ...agentEntries];

  const services = await Promise.all(entries.map(async ({ key: brainKey, file: brainFile, type }) => {
    const brainPath = brainFile ? path.join(REPO_ROOT, 'brain', brainFile) : null;
    const brainFileExists = brainPath ? await fs.access(brainPath).then(() => true).catch(() => false) : false;
    const binding = STAGE_RUNTIME_BINDINGS.find(item => item.brainManifestKey === brainKey) || null;
    const runtime = type === 'global'
      ? { ok: true as const, reason: null }
      : binding
        ? await verifyRuntimeBinding(binding)
        : { ok: false as const, reason: 'No stage runtime binding.' };

    return {
      brainKey,
      brainFile,
      brainType: type,
      brainFileExists,
      workerScriptExists,
      stage: binding?.stage ?? null,
      runtimeKind: binding?.runtimeKind ?? null,
      executionTarget: type === 'global' ? 'context_worker' : binding?.executionTarget ?? null,
      independentWorkerReady: Boolean(workerScriptExists && brainFileExists && runtime.ok),
      blockingReason: runtime.ok ? null : runtime.reason || 'Runtime binding not executable.',
    };
  }));

  const total = services.length;
  const ready = services.filter(item => item.independentWorkerReady).length;

  return ok({
    generatedAt: new Date().toISOString(),
    totals: {
      brains: total,
      independentWorkerReady: ready,
      missing: total - ready,
    },
    services,
  });
}
