/**
 * =============================================================================
 * S4B: Insight Analysis Map Schema
 * =============================================================================
 */

import { z } from 'zod';

export const InsightAnalysisMapSchema = z.object({
  core_tension: z.string(),
  surprise_factor: z.string(),
  human_consequence: z.string(),
  public_impact: z.string(),
  policy_relevance: z.string().optional(),
  geographic_relevance: z.record(z.string(), z.string()).optional(),
  seasonal_or_timely_hook: z.string().optional(),
  journalist_interest_drivers: z.array(z.string()),
  emotional_angle: z.string().optional(),
  data_angle: z.string(),
  risk_notes: z.array(z.string()).optional()
});

export const AngleGenerationHandoffSchema = z.object({
  recommended_angle_types: z.array(z.string()),
  strongest_stats: z.array(z.string()),
  possible_headlines: z.array(z.string()),
  audience_segments: z.array(z.string()),
  preferred_beats: z.array(z.string()),
  must_avoid_claims: z.array(z.string()),
  usable_story_frames: z.array(z.string())
});

export type InsightAnalysisMap = z.infer<typeof InsightAnalysisMapSchema>;
export type AngleGenerationHandoff = z.infer<typeof AngleGenerationHandoffSchema>;

export default InsightAnalysisMapSchema;