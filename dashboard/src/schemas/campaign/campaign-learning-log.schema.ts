/**
 * =============================================================================
 * S16: Campaign Learning Log Schema
 * =============================================================================
 */

import { z } from 'zod';

export const FallbackEventSchema = z.object({
  stage: z.string(),
  attempted_models: z.array(z.string()),
  reason: z.string(),
  timestamp: z.string()
});

export const ModelUsageSchema = z.record(z.string(), z.object({
  model: z.string(),
  calls: z.number(),
  failures: z.number(),
  fallback_used: z.boolean()
}));

export const CampaignLearningLogSchema = z.object({
  campaign_summary: z.string(),
  models_used: ModelUsageSchema,
  fallback_events: z.array(FallbackEventSchema),
  strongest_angle: z.string(),
  selected_beats: z.array(z.string()),
  journalist_targets: z.array(z.string()),
  final_pitch_summary: z.string(),
  validation_result: z.string(),
  reusable_learning: z.array(z.string()),
  improvement_notes: z.array(z.string())
});

export type CampaignLearningLog = z.infer<typeof CampaignLearningLogSchema>;

export default CampaignLearningLogSchema;