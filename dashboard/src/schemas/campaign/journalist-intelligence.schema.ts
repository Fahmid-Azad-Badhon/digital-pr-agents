/**
 * =============================================================================
 * S9: Journalist Intelligence Schema
 * =============================================================================
 */

import { z } from 'zod';

export const JournalistIntelligenceSchema = z.object({
  journalist_name: z.string().min(1, 'Journalist name is required'),
  publication: z.string().min(1, 'Publication is required'),
  beat_fit: z.string(),
  recent_coverage_summary: z.string().optional(),
  article_patterns: z.array(z.string()).optional(),
  likely_interest_angle: z.string(),
  personalization_note: z.string().optional(),
  risk_of_poor_fit: z.enum(['low', 'medium', 'high']),
  recommended_subject_line_direction: z.string().optional(),
  recommended_pitch_angle: z.string().optional(),
  do_not_pitch_notes: z.string().optional()
});

export const JournalistIntelligenceArraySchema = z.array(JournalistIntelligenceSchema);

export type JournalistIntelligence = z.infer<typeof JournalistIntelligenceSchema>;

export default JournalistIntelligenceSchema;