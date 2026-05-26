import { ZodSchema } from 'zod';

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: string[] };

export function validateInput<T>(schema: ZodSchema<T>, payload: unknown): ValidationResult<T> {
  const result = schema.safeParse(payload);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map(issue => `${issue.path.join('.') || 'body'}: ${issue.message}`),
    };
  }

  return { success: true, data: result.data };
}
