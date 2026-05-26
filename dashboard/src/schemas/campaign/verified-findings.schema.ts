/**
 * =============================================================================
 * S4A: Verified Findings Schema
 * =============================================================================
 */

import { z } from 'zod';

export const VerifiedFindingSchema = z.object({
  id: z.string(),
  finding: z.string(),
  supporting_evidence_ids: z.array(z.string()),
  confidence: z.enum(['high', 'medium', 'low']),
  newsworthiness_score: z.number().min(0).max(10),
  safest_language: z.string(),
  recommended_use: z.enum(['lead', 'supporting', 'context', 'do_not_use'])
});

export const UnsupportedClaimSchema = z.object({
  id: z.string(),
  original_claim: z.string(),
  issue: z.string(),
  evidence_required: z.array(z.string())
});

export const ContradictionSchema = z.object({
  id: z.string(),
  claim_a: z.string(),
  claim_b: z.string(),
  resolution: z.string().optional()
});

export const VerifiedFindingsSchema = z.object({
  strongest_findings: z.array(VerifiedFindingSchema),
  weak_findings: z.array(z.string()),
  verified_statistics: z.array(VerifiedFindingSchema),
  unsupported_claims: z.array(UnsupportedClaimSchema),
  claims_to_soften: z.array(z.string()),
  contradictions: z.array(ContradictionSchema).optional(),
  safest_language: z.string(),
  findings_ranked_by_newsworthiness: z.array(VerifiedFindingSchema),
  validation_notes: z.array(z.string())
});

export type VerifiedFindings = z.infer<typeof VerifiedFindingsSchema>;

export default VerifiedFindingsSchema;