import { z } from 'zod';
import {
  S4AnalysisSchema,
  PitchOutputSchema,
  InsightNoteSchema,
  JournalistProfileSchema,
} from '@/lib/llmService';
import { looksLikeFallback } from '@/lib/fallbackMarkers';

const DRY_RUN_OUTPUT = '[DRY RUN] External call blocked. No live LLM fetch performed.';

export const STAGE_SCHEMA_REGISTRY: Record<string, z.ZodSchema> = {
  S4A_DATA_RESEARCH_ANALYST: S4AnalysisSchema,
  S4B_INSIGHT_ANALYST: S4AnalysisSchema,
  S10_PITCH_DRAFTING: PitchOutputSchema,
  S9_JOURNALIST_INTELLIGENCE: z.array(JournalistProfileSchema),
  S2_DATA_EXTRACTION: z.array(InsightNoteSchema),
};

export function isDryRunOutput(output: string): boolean {
  return output.startsWith(DRY_RUN_OUTPUT);
}

export function isFallbackContent(output: string): boolean {
  return looksLikeFallback(output);
}

export function extractJsonFromOutput(output: string): string | null {
  try {
    JSON.parse(output);
    return output;
  } catch {}

  const jsonBlockMatch = output.match(/```json\s*([\s\S]*?)```/);
  if (jsonBlockMatch) {
    const trimmed = jsonBlockMatch[1].trim();
    try {
      JSON.parse(trimmed);
      return trimmed;
    } catch {}
  }

  const objectMatch = output.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    const trimmed = objectMatch[0].trim();
    try {
      JSON.parse(trimmed);
      return trimmed;
    } catch {}
  }

  const arrayMatch = output.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    const trimmed = arrayMatch[0].trim();
    try {
      JSON.parse(trimmed);
      return trimmed;
    } catch {}
  }

  return null;
}

export interface LLMValidationResult {
  valid: boolean;
  status: 'passed' | 'failed' | 'skipped';
  errors: string[];
  parsed?: unknown;
}

export function validateLLMOutput(stageId: string, output: string): LLMValidationResult {
  if (!output) {
    return { valid: false, status: 'skipped', errors: ['Empty output'] };
  }

  if (isDryRunOutput(output)) {
    return { valid: true, status: 'skipped', errors: ['Dry-run mode'] };
  }

  if (isFallbackContent(output)) {
    return { valid: true, status: 'skipped', errors: ['Fallback content detected'] };
  }

  const schema = STAGE_SCHEMA_REGISTRY[stageId];
  if (!schema) {
    return { valid: true, status: 'skipped', errors: [`No schema registered for stage: ${stageId}`] };
  }

  const jsonStr = extractJsonFromOutput(output);
  if (!jsonStr) {
    return { valid: false, status: 'failed', errors: ['No valid JSON found in output'] };
  }

  try {
    const parsed = JSON.parse(jsonStr);
    const result = schema.safeParse(parsed);
    if (result.success) {
      return { valid: true, status: 'passed', errors: [], parsed: result.data };
    }
    return {
      valid: false,
      status: 'failed',
      errors: result.error.issues.map(i => `${i.path.join('.') || 'root'}: ${i.message}`),
      parsed,
    };
  } catch {
    return { valid: false, status: 'failed', errors: ['Invalid JSON'], parsed: undefined };
  }
}

export interface JsonWriteValidationResult {
  allowed: boolean;
  status: 'passed' | 'failed' | 'skipped_dry_run' | 'skipped_fallback' | 'skipped_empty' | 'skipped_unregistered';
  errors: string[];
}

export function validateJsonBeforeWrite(stageId: string, output: string): JsonWriteValidationResult {
  const telemetry = validateLLMOutput(stageId, output);

  if (telemetry.status === 'passed') {
    return { allowed: true, status: 'passed', errors: [] };
  }

  if (telemetry.status === 'failed') {
    return { allowed: false, status: 'failed', errors: telemetry.errors };
  }

  const skippedReason = telemetry.errors[0] || '';
  if (skippedReason.includes('Dry-run')) {
    return { allowed: false, status: 'skipped_dry_run', errors: telemetry.errors };
  }
  if (skippedReason.includes('Fallback')) {
    return { allowed: false, status: 'skipped_fallback', errors: telemetry.errors };
  }
  if (skippedReason.includes('Empty')) {
    return { allowed: false, status: 'skipped_empty', errors: telemetry.errors };
  }

  return { allowed: true, status: 'skipped_unregistered', errors: telemetry.errors };
}
