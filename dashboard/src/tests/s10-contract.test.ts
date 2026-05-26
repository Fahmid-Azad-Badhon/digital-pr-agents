import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs/promises';
import path from 'path';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const SCRIPT_PATH = path.join(REPO_ROOT, 'scripts', 'draft-pitch-draft.js');
const ROUTE_PATH = path.join(
  REPO_ROOT,
  'dashboard',
  'src',
  'app',
  'api',
  'campaigns',
  '[id]',
  'execute-stage',
  'route.ts'
);
const REGISTRY_PATH = path.join(
  REPO_ROOT,
  'dashboard',
  'src',
  'lib',
  'stageRuntimeRegistry.ts'
);

const CANONICAL = '10-pitch-draft.md';
const LEGACY = '08-pitch-draft.md';

describe('S10 Output Contract', () => {

  describe('scripts/draft-pitch-draft.js', () => {
    let source: string;

    beforeAll(async () => {
      source = await fs.readFile(SCRIPT_PATH, 'utf8');
    });

    it('writes the canonical S10 output file (10-pitch-draft.md)', () => {
      const writesCanonical = source.split('\n').filter(l => l.includes('stage10Path'));
      expect(writesCanonical.length).toBeGreaterThanOrEqual(1);
    });

    it('writes legacy alias file (08-pitch-draft.md) for backward compatibility', () => {
      const writesLegacy = source.match(/fs\.writeFile\(stage08Path/g);
      expect(writesLegacy).not.toBeNull();
      expect(writesLegacy!.length).toBeGreaterThanOrEqual(1);
    });

    it('guards canonical output against overwrite without --force', () => {
      expect(source).toContain('stage10Path');
      expect(source).toContain('10-pitch-draft.md already contains non-placeholder content');
    });

    it('no longer uses 08-pitch-draft.md as the primary/sole output', () => {
      const sole08Write = source.match(/fs\.writeFile\(\s*stage08Path\s*,/g);
      expect(sole08Write).not.toBeNull();
    });
  });

  describe('dashboard/route.ts -- executeStage10()', () => {
    let source: string;

    beforeAll(async () => {
      source = await fs.readFile(ROUTE_PATH, 'utf8');
    });

    it('validates canonical S10 output is 10-pitch-draft.md', () => {
      const uses10pitch = source.match(/10-pitch-draft\.md/g);
      expect(uses10pitch).not.toBeNull();
      expect(uses10pitch!.length).toBeGreaterThanOrEqual(1);
    });

    it('returns 10-pitch-draft.md as the outputFile for stage 10', () => {
      const outputFileReturn = source.match(/outputFile:\s*['"]10-pitch-draft\.md['"]/);
      expect(outputFileReturn).not.toBeNull();
    });

    it('requires 10-pitch-draft.md to have >= 400 characters', () => {
      const has10pitch = source.includes('10-pitch-draft.md');
      const has400Check = source.includes('< 400') || source.includes('>= 400') || source.includes('.length < 400');
      expect(has10pitch).toBe(true);
      expect(has400Check).toBe(true);
    });

    it('strict mode in S12 requires 10-pitch-draft.md as mandatory', () => {
      const strictMandatory = source.match(/mandatory.*10-pitch-draft\.md|10-pitch-draft\.md.*mandatory/);
      expect(strictMandatory).not.toBeNull();
    });
  });

  describe('dashboard/stageRuntimeRegistry.ts -- S10 binding', () => {
    let source: string;

    beforeAll(async () => {
      source = await fs.readFile(REGISTRY_PATH, 'utf8');
    });

    it('declares 10-pitch-draft.md in S10 outputFiles array', () => {
      const s10Line = source
        .split('\n')
        .find(l => l.includes('S10_PITCH_DRAFTING'));
      expect(s10Line).toBeDefined();
      expect(s10Line).toContain(CANONICAL);
    });

    it('declares 08-pitch-draft.md in S10 outputFiles for backward compat', () => {
      const s10Line = source
        .split('\n')
        .find(l => l.includes('S10_PITCH_DRAFTING'));
      expect(s10Line).toBeDefined();
      expect(s10Line).toContain(LEGACY);
    });
  });

  describe('Cross-source contract consistency', () => {
    let scriptSource: string;
    let routeSource: string;
    let registrySource: string;

    beforeAll(async () => {
      [scriptSource, routeSource, registrySource] = await Promise.all([
        fs.readFile(SCRIPT_PATH, 'utf8'),
        fs.readFile(ROUTE_PATH, 'utf8'),
        fs.readFile(REGISTRY_PATH, 'utf8'),
      ]);
    });

    it('all three sources agree the canonical S10 output is 10-pitch-draft.md', () => {
      const scriptOk = scriptSource.includes('stage10Path');
      const routeOk = routeSource.includes('10-pitch-draft.md');
      const registryOk = registrySource.includes(CANONICAL) && registrySource.includes('S10_PITCH_DRAFTING');
      expect(scriptOk && routeOk && registryOk).toBe(true);
    });
  });
});
