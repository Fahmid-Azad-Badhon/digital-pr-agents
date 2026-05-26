/**
 * =============================================================================
 * S13: Validation Report Schema
 * =============================================================================
 */

import { z } from 'zod';

export const ValidationReportSchema = z.object({
  passed: z.boolean(),
  failed_checks: z.array(z.string()),
  hallucinated_or_unsupported_claims: z.array(z.string()),
  statistics_checked: z.boolean(),
  source_alignment: z.boolean(),
  tone_check: z.boolean(),
  journalist_fit_check: z.boolean(),
  CTA_check: z.boolean(),
  overclaiming_check: z.boolean(),
  schema_check: z.boolean(),
  final_recommendation: z.string(),
  required_edits: z.array(z.string())
});

export type ValidationReport = z.infer<typeof ValidationReportSchema>;

export default ValidationReportSchema;