import { z } from 'zod'

export const VerifiedFindingSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  finding: z.string().min(10, 'Finding must be at least 10 characters'),
  source: z.string().min(1, 'Source is required'),
  confidence: z.number().min(0).max(10).optional()
})

export const S4AnalysisSchema = z.object({
  verified_findings: z.array(VerifiedFindingSchema).min(1, 'At least one verified finding required'),
  dataQualityScore: z.number().min(0).max(100),
  recommendationSummary: z.string()
})

export const InsightNoteSchema = z.object({
  id: z.string().min(1),
  content: z.string().min(5),
  source: z.string().optional(),
  category: z.enum(['statistics', 'findings', 'locations', 'methodology', 'other']).optional()
})

export const PitchOutputSchema = z.object({
  subject_line: z.string().min(5, 'Subject line too short').max(100, 'Subject line too long'),
  body: z.string().min(50, 'Pitch body too short').max(2000, 'Pitch body too long'),
  citations_used: z.array(z.string()).min(1, 'At least one citation required')
})

export const JournalistProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  outlet: z.string().min(1),
  coverage: z.string().optional(),
  expertise: z.array(z.string()).optional(),
  recentAngles: z.array(z.string()).optional()
})

export function validateS4Analysis(data: unknown): { valid: boolean; errors: string[]; parsed?: any } {
  try {
    const parsed = S4AnalysisSchema.parse(data)
    return { valid: true, errors: [], parsed }
  } catch (error: any) {
    const errors = error.errors?.map((e: any) => e.path.join('.') + ': ' + e.message) || [error.message]
    console.error('[Zod Guardrail] S4 Analysis validation failed:', errors)
    return { valid: false, errors }
  }
}

export function validateS10Pitch(data: unknown): { valid: boolean; errors: string[]; parsed?: any } {
  try {
    const parsed = PitchOutputSchema.parse(data)
    return { valid: true, errors: [], parsed }
  } catch (error: any) {
    const errors = error.errors?.map((e: any) => e.path.join('.') + ': ' + e.message) || [error.message]
    console.error('[Zod Guardrail] S10 Pitch validation failed:', errors)
    return { valid: false, errors }
  }
}

export function validateS2Insights(data: unknown): { valid: boolean; errors: string[]; parsed?: any } {
  try {
    const parsed = z.array(InsightNoteSchema).parse(data)
    return { valid: true, errors: [], parsed }
  } catch (error: any) {
    const errors = error.errors?.map((e: any) => e.path.join('.') + ': ' + e.message) || [error.message]
    console.error('[Zod Guardrail] S2 Insights validation failed:', errors)
    return { valid: false, errors }
  }
}

export function validateJournalistProfiles(data: unknown): { valid: boolean; errors: string[]; parsed?: any } {
  try {
    const parsed = z.array(JournalistProfileSchema).parse(data)
    return { valid: true, errors: [], parsed }
  } catch (error: any) {
    const errors = error.errors?.map((e: any) => e.path.join('.') + ': ' + e.message) || [error.message]
    console.error('[Zod Guardrail] Journalist profiles validation failed:', errors)
    return { valid: false, errors }
  }
}

export function validateStageOutput<T>(schema: z.ZodSchema<T>, data: unknown, stageName: string): { valid: boolean; errors: string[]; parsed?: T } {
  try {
    const parsed = schema.parse(data)
    console.log('[Zod Guardrail] ' + stageName + ' validation passed')
    return { valid: true, errors: [], parsed }
  } catch (error: any) {
    const errors = error.errors?.map((e: any) => e.path.join('.') + ': ' + e.message) || [error.message]
    console.error('[Zod Guardrail] ' + stageName + ' validation failed:', errors)
    return { valid: false, errors }
  }
}
