import { z } from 'zod';

export const ClusterItemSchema = z.object({
  id: z.string().min(1, 'Cluster ID is required'),
  insight: z.string().min(1, 'Insight text is required'),
  confidence: z.string(),
  priority: z.string(),
});

export const ClusterTotalsSchema = z.object({
  insights: z.number().int().nonnegative(),
  highPriority: z.number().int().nonnegative(),
});

export const ClustersAnalysisSchema = z.object({
  generatedAt: z.string().min(1, 'Generated timestamp is required'),
  clusters: z.array(ClusterItemSchema),
  totals: ClusterTotalsSchema,
});

export type ClusterItem = z.infer<typeof ClusterItemSchema>;
export type ClusterTotals = z.infer<typeof ClusterTotalsSchema>;
export type ClustersAnalysis = z.infer<typeof ClustersAnalysisSchema>;

export default ClustersAnalysisSchema;
