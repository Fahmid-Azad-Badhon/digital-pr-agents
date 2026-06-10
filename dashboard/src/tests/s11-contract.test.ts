import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../..');

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v): v is string => typeof v === 'string');
}

function readRouteSource(): string {
  const routePath = path.join(
    PROJECT_ROOT,
    'dashboard/src/app/api/campaigns/[id]/execute-stage/route.ts',
  );
  return fs.readFileSync(routePath, 'utf-8');
}

function parseJsonFile(filePath: string): unknown {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function getStageRequires(data: unknown, stageKey: string): string[] | null {
  if (!isRecord(data)) return null;
  const stages = data.stages;
  if (!isRecord(stages)) return null;
  const stage = stages[stageKey];
  if (!isRecord(stage)) return null;
  const requires = stage.requires;
  if (!isStringArray(requires)) return null;
  return requires;
}

function getStageInputs(data: unknown, stageKey: string): string[] | null {
  if (!isRecord(data)) return null;
  const stages = data.stages;
  if (!isRecord(stages)) return null;
  const stage = stages[stageKey];
  if (!isRecord(stage)) return null;
  const inputs = stage.inputs;
  if (!isStringArray(inputs)) return null;
  return inputs;
}

describe('S11 contract dependency alignment', () => {
  it('RED: S11 runtime dependencies include claim-ledger.json', () => {
    const content = readRouteSource();
    const match = content.match(/11:\s*\[([^\]]+)\]/);
    expect(match).not.toBeNull();
    if (match === null) return;
    const depsRaw = match[1];
    const deps = depsRaw
      .split(',')
      .map((s) => s.trim().replace(/['"`]/g, ''))
      .filter(Boolean);
    expect(deps).toContain('10-pitch-draft.md');
    expect(deps).toContain('claim-ledger.json');
    expect(deps).not.toContain('10-pitch-draft.json');
  });

  it('RED: S11 stage contract requires runtime dependency set', () => {
    const contractPath = path.join(PROJECT_ROOT, 'system/stage-contracts.json');
    const data = parseJsonFile(contractPath);
    const requires = getStageRequires(data, 'S11_PITCH_OPTIMIZATION');
    expect(requires).toEqual(['10-pitch-draft.md', 'claim-ledger.json']);
  });

  it('RED: S11 registry inputs match contract/runtime dependency set', () => {
    const registryPath = path.join(PROJECT_ROOT, 'system/stage-output-registry.json');
    const data = parseJsonFile(registryPath);
    const inputs = getStageInputs(data, 'S11');
    expect(inputs).toEqual(['10-pitch-draft.md', 'claim-ledger.json']);
  });
});
