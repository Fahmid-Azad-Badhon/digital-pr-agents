/**
 * =============================================================================
 * S1: Campaign Intake Schema
 * =============================================================================
 */

import { z } from 'zod';

export const CampaignIntakeSchema = z.object({
  campaign_name: z.string().min(1, 'Campaign name is required'),
  client_name: z.string().min(1, 'Client name is required'),
  campaign_topic: z.string().min(1, 'Campaign topic is required'),
  campaign_goal: z.string().min(1, 'Campaign goal is required'),
  primary_data_source: z.string().min(1, 'Primary data source is required'),
  secondary_data_sources: z.array(z.string()).optional(),
  geography: z.string().optional(),
  target_audience: z.array(z.string()).optional(),
  target_journalist_beats: z.array(z.string()).optional(),
  key_claims_to_investigate: z.array(z.string()).optional(),
  missing_inputs: z.array(z.string()).optional(),
  risk_level: z.enum(['low', 'medium', 'high']),
  recommended_next_step: z.string().optional()
});

export type CampaignIntake = z.infer<typeof CampaignIntakeSchema>;

export default CampaignIntakeSchema;