import { z } from 'zod';

export const CampaignIntakeRealSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  clientName: z.string(),
  studyTitle: z.string(),
  topic: z.string().min(1, 'Campaign topic is required'),
  targetRegion: z.string().min(1, 'Target region is required'),
  targetBeats: z.array(z.string()),
  goal: z.string(),
  tone: z.string().min(1, 'Tone is required'),
  notes: z.string(),
  generatedAt: z.string().min(1, 'Generated timestamp is required'),
  status: z.string().min(1, 'Status is required'),
  briefLength: z.number().int().nonnegative(),
});

export type CampaignIntakeReal = z.infer<typeof CampaignIntakeRealSchema>;

export default CampaignIntakeRealSchema;
