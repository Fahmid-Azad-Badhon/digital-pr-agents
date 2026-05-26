/**
 * =============================================================================
 * S3: Research Enrichment Schema
 * =============================================================================
 */

import { z } from 'zod';

export const ResearchSourceSchema = z.object({
  id: z.string(),
  source_type: z.enum(['serp', 'government', 'academic', 'news', 'report', 'other']),
  title: z.string(),
  url: z.string().url().optional(),
  publisher: z.string().optional(),
  publication_date: z.string().optional(),
  credibility_score: z.number().min(0).max(10),
  key_findings: z.array(z.string()),
  relevance_to_campaign: z.string()
});

export const ResearchEnrichmentSchema = z.object({
  supporting_research: z.array(ResearchSourceSchema),
  government_sources: z.array(ResearchSourceSchema),
  trend_context: z.record(z.string(), z.string()).optional(),
  public_safety_context: z.record(z.string(), z.string()).optional(),
  local_relevance: z.record(z.string(), z.string()).optional(),
  comparable_studies: z.array(z.string()).optional(),
  expert_context: z.array(z.string()).optional(),
  journalist_friendly_background: z.string().optional(),
  citation_notes: z.array(z.string()).optional(),
  research_gaps: z.array(z.string())
});

export type ResearchEnrichment = z.infer<typeof ResearchEnrichmentSchema>;

export default ResearchEnrichmentSchema;