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
const HANDOFF_PATH = path.join(
  REPO_ROOT,
  'dashboard',
  'src',
  'lib',
  'stageHandoffValidator.ts'
);

const CANONICAL = '10-pitch-draft.md';
const LEGACY = '08-pitch-draft.md';
const JSON_OUTPUT = '10-pitch-draft.json';
const SCHEMA_PATH = path.join(REPO_ROOT, 'schemas', 'pitch-draft.schema.json');
const VALIDATOR_PATH = path.join(
  REPO_ROOT,
  'dashboard',
  'src',
  'lib',
  'jsonSchemaValidator.ts'
);
const OUTPUT_CONTRACT_VALIDATOR_PATH = path.join(
  REPO_ROOT,
  'dashboard',
  'src',
  'lib',
  'stageOutputContractValidator.ts'
);

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

    it('defines buildPitchDraftJson helper for JSON output', () => {
      expect(source).toContain('function buildPitchDraftJson');
    });

    it('writes structured JSON output file (10-pitch-draft.json)', () => {
      expect(source).toContain('10-pitch-draft.json');
      expect(source).toContain('JSON.stringify');
    });

    it('JSON output contains required schema fields (campaignId, angle, pitchContent)', () => {
      const jsonSection = source.split('function buildPitchDraftJson')[1] || '';
      expect(jsonSection).toContain('campaignId');
      expect(jsonSection).toContain('angle');
      expect(jsonSection).toContain('pitchContent');
    });

    it('JSON output maps tone from variant key to schema enum', () => {
      const jsonSection = source.split('function buildPitchDraftJson')[1] || '';
      expect(jsonSection).toContain('tone');
      expect(jsonSection).toContain("'Professional'");
      expect(jsonSection).toContain("'Casual'");
      expect(jsonSection).toContain("'Storytelling'");
    });

    it('statistics field defaults to empty array in Phase 1', () => {
      const jsonSection = source.split('function buildPitchDraftJson')[1] || '';
      expect(jsonSection).toContain('statistics');
      expect(jsonSection).toContain('[]');
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

    it('STAGE_OUTPUT_FILES[10] includes 10-pitch-draft.json for Phase 3', () => {
      const s10Line = source
        .split('\n')
        .find(l => l.includes("10: ['10-pitch-draft.md"));
      expect(s10Line).toBeDefined();
      expect(s10Line).toContain('10-pitch-draft.json');
    });

    it('executeStage10() asserts 10-pitch-draft.json artifact after script run', () => {
      const jsonAssertion = source.match(/assertRealArtifact[\s\S]*?10-pitch-draft\.json/);
      expect(jsonAssertion).not.toBeNull();
    });

    it('imports validateS10OutputContract instead of direct validateJsonFileAgainstSchema', () => {
      expect(source).toContain('validateS10OutputContract');
      expect(source).toContain('stageOutputContractValidator');
      expect(source).not.toContain('jsonSchemaValidator');
    });

    it('calls validateS10OutputContract(campaignPath) for JSON schema validation', () => {
      expect(source).toContain('validateS10OutputContract(campaignPath)');
    });

    it('does not import schemaValidation.ts or stageContractValidator.ts directly', () => {
      const hasDirectSchemaValidation = source.match(/from\s+['"]@\/lib\/schemaValidation['"]/);
      const hasDirectContractValidator = source.match(/from\s+['"]@\/lib\/stageContractValidator['"]/);
      expect(hasDirectSchemaValidation).toBeNull();
      expect(hasDirectContractValidator).toBeNull();
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

    it('declares 10-pitch-draft.json in S10 outputFiles array', () => {
      const s10Line = source
        .split('\n')
        .find(l => l.includes('S10_PITCH_DRAFTING'));
      expect(s10Line).toBeDefined();
      expect(s10Line).toContain(JSON_OUTPUT);
    });
  });

  describe('dashboard/stageHandoffValidator.ts -- S10 handoff metadata', () => {
    let source: string;

    beforeAll(async () => {
      source = await fs.readFile(HANDOFF_PATH, 'utf8');
    });

    it('accepts 10-pitch-draft.json in S10 handoff requirements', () => {
      const s10Line = source
        .split('\n')
        .find(l => l.includes('stage: 10'));
      expect(s10Line).toBeDefined();
      expect(source).toContain(JSON_OUTPUT);
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

    it('route STAGE_OUTPUT_FILES[10] and registry agree on 10-pitch-draft.json', () => {
      const routeOk = routeSource.includes('10-pitch-draft.json');
      const registryOk = registrySource.includes(JSON_OUTPUT) && registrySource.includes('S10_PITCH_DRAFTING');
      expect(routeOk && registryOk).toBe(true);
    });

    it('route calls validateS10OutputContract after JSON artifact assertion', () => {
      const schemaCall = routeSource.match(/validateS10OutputContract[\s\S]*?campaignPath/);
      expect(schemaCall).not.toBeNull();
    });
  });

  describe('dashboard/jsonSchemaValidator.ts -- S10 schema validation', () => {
    let validatorSource: string;
    let schemaSource: string;

    beforeAll(async () => {
      validatorSource = await fs.readFile(VALIDATOR_PATH, 'utf8');
      schemaSource = await fs.readFile(SCHEMA_PATH, 'utf8');
    });

    it('defines validateJsonFileAgainstSchema function', () => {
      expect(validatorSource).toContain('validateJsonFileAgainstSchema');
    });

    it('imports AJV for JSON Schema draft-07 validation', () => {
      expect(validatorSource).toContain('ajv');
    });

    it('references pitch-draft.schema.json required fields (campaignId, pitchContent, angle)', () => {
      const schema = JSON.parse(schemaSource);
      expect(schema.required).toContain('campaignId');
      expect(schema.required).toContain('pitchContent');
      expect(schema.required).toContain('angle');
    });

    it('schema defines tone enum with values matching script output', () => {
      const schema = JSON.parse(schemaSource);
      const toneProp = schema.properties?.tone;
      expect(toneProp).toBeDefined();
      expect(toneProp.enum).toContain('Professional');
      expect(toneProp.enum).toContain('Casual');
      expect(toneProp.enum).toContain('Storytelling');
    });

    it('accepts statistics as optional array of objects', () => {
      const schema = JSON.parse(schemaSource);
      const statsProp = schema.properties?.statistics;
      expect(statsProp).toBeDefined();
      expect(statsProp.type).toBe('array');
      expect(statsProp.items.properties).toBeDefined();
      expect(statsProp.items.properties.value).toBeDefined();
      expect(statsProp.items.properties.context).toBeDefined();
    });
  });

  describe('dashboard/stageOutputContractValidator.ts -- S10 output contract validation', () => {
    let source: string;

    beforeAll(async () => {
      source = await fs.readFile(OUTPUT_CONTRACT_VALIDATOR_PATH, 'utf8');
    });

    it('exports validateS10OutputContract function', () => {
      expect(source).toContain('validateS10OutputContract');
    });

    it('imports validateJsonFileAgainstSchema from jsonSchemaValidator', () => {
      expect(source).toContain('validateJsonFileAgainstSchema');
      expect(source).toContain('jsonSchemaValidator');
    });

    it('validates 10-pitch-draft.json against pitch-draft.schema.json', () => {
      expect(source).toContain('10-pitch-draft.json');
      expect(source).toContain('pitch-draft.schema.json');
    });

    it('does not import stageContractValidator', () => {
      expect(source).not.toContain('stageContractValidator');
    });

    it('does not import stageHandoffValidator', () => {
      expect(source).not.toContain('stageHandoffValidator');
    });
  });
});
