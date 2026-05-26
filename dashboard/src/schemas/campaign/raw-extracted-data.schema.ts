/**
 * =============================================================================
 * S2: Data Extraction Schema
 * =============================================================================
 */

import { z } from 'zod';

export const ExtractedStatisticSchema = z.object({
  id: z.string(),
  value: z.string(),
  metric: z.string(),
  full_text: z.string(),
  context: z.string().optional(),
  geography: z.string().optional(),
  timeframe: z.string().optional(),
  source_location: z.string().optional(),
  confidence: z.enum(['high', 'medium', 'low'])
});

export const UnclearDataPointSchema = z.object({
  id: z.string(),
  original_text: z.string(),
  ambiguity: z.string(),
  suggested_clarification: z.string().optional()
});

export const RawExtractedDataSchema = z.object({
  source_name: z.string().min(1, 'Source name is required'),
  extracted_statistics: z.array(ExtractedStatisticSchema),
  tables: z.array(z.record(z.string(), z.any())).optional(),
  geographic_breakdowns: z.array(z.record(z.string(), z.any())).optional(),
  time_periods: z.array(z.string()).optional(),
  definitions: z.record(z.string(), z.string()).optional(),
  source_notes: z.string().optional(),
  unclear_data_points: z.array(UnclearDataPointSchema).optional(),
  extraction_warnings: z.array(z.string()).optional()
});

export type RawExtractedData = z.infer<typeof RawExtractedDataSchema>;

export default RawExtractedDataSchema;