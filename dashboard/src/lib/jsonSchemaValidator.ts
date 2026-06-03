import fs from 'fs/promises';
import Ajv, { type ErrorObject } from 'ajv';

export class JsonSchemaValidationError extends Error {
  public readonly errors: ReadonlyArray<{ path: string; message: string }>;

  constructor(
    message: string,
    errors: ReadonlyArray<{ path: string; message: string }> = [],
  ) {
    super(message);
    this.name = 'JsonSchemaValidationError';
    this.errors = errors;
  }
}

export interface JsonSchemaValidationResult {
  valid: true;
}

export async function validateJsonFileAgainstSchema(params: {
  dataFilePath: string;
  schemaFilePath: string;
  artifactName?: string;
}): Promise<JsonSchemaValidationResult> {
  const { dataFilePath, schemaFilePath, artifactName } = params;
  const label = artifactName ?? dataFilePath;

  let schemaRaw: unknown;
  try {
    const schemaText = await fs.readFile(schemaFilePath, 'utf-8');
    schemaRaw = JSON.parse(schemaText);
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new JsonSchemaValidationError(
      `Schema file "${schemaFilePath}" could not be loaded for ${label}: ${detail}`,
    );
  }

  let dataRaw: unknown;
  try {
    const dataText = await fs.readFile(dataFilePath, 'utf-8');
    dataRaw = JSON.parse(dataText);
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new JsonSchemaValidationError(
      `Data file "${dataFilePath}" could not be loaded or parsed for ${label}: ${detail}`,
    );
  }

  if (typeof schemaRaw !== 'object' || schemaRaw === null) {
    throw new JsonSchemaValidationError(
      `Schema "${schemaFilePath}" is not a valid JSON object for ${label}.`,
    );
  }

  const ajv = new Ajv({ strict: true });
  let validate: ReturnType<typeof ajv.compile>;
  try {
    validate = ajv.compile(schemaRaw as object);
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new JsonSchemaValidationError(
      `Schema "${schemaFilePath}" compilation failed for ${label}: ${detail}`,
    );
  }

  const valid = validate(dataRaw);
  if (!valid) {
    const errors: Array<{ path: string; message: string }> =
      (validate.errors as ErrorObject[] | undefined)?.map((e) => ({
        path: e.instancePath || '/',
        message: e.message ?? 'validation error',
      })) ?? [];
    throw new JsonSchemaValidationError(
      `"${label}" failed schema validation:\n${errors.map((e) => `  ${e.path}: ${e.message}`).join('\n')}`,
      errors,
    );
  }

  return { valid: true };
}
