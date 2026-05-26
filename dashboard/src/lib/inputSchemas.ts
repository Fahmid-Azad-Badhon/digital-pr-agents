import { z } from 'zod';

const OptionalSafeString = (max: number, fallback = '') =>
  z.preprocess(
    value => {
      if (value === undefined || value === null) {
        return fallback;
      }
      if (typeof value === 'string') {
        return value;
      }
      return String(value);
    },
    z.string().trim().max(max).optional().default(fallback)
  );

export const CampaignCreateInputSchema = z.object({
  name: z.string().trim().min(1).max(180),
  slug: z.string().trim().regex(/^[a-z0-9][a-z0-9-_]{1,120}$/i).optional(),
  clientName: OptionalSafeString(180, ''),
  studyTitle: OptionalSafeString(240, ''),
  topic: OptionalSafeString(240, ''),
  targetRegion: OptionalSafeString(180, 'United States'),
  targetBeats: z.array(z.string().trim().min(1).max(80)).max(20).optional().default([]),
  goal: OptionalSafeString(5000, ''),
  tone: OptionalSafeString(80, 'Professional'),
  notes: OptionalSafeString(5000, ''),
});

export const CampaignFilesInputSchema = z.object({
  brief: z.string().max(2_000_000).optional(),
  rawStudy: z.string().max(4_000_000).optional(),
});

export const CampaignPatchInputSchema = z.object({
  currentStage: z.number().int().min(0).max(16).optional(),
  status: z.enum(['draft', 'running', 'paused', 'completed', 'failed']).optional(),
  forceStage: z.boolean().optional().default(false),
});

export const WorkflowActionInputSchema = z.object({
  action: z.enum(['start', 'pause', 'resume', 'advance', 'complete_stage', 'select_angles']),
  campaignId: z.string().regex(/^[a-z0-9][a-z0-9-_]{1,120}$/i),
  stage: z.number().int().min(1).max(16).optional(),
  selectedAngles: z.array(z.unknown()).optional().default([]),
});

export const ScriptActionInputSchema = z.object({
  action: z.enum([
    'validate_stage',
    'draft_study_input',
    'import_muckrack_output',
    'draft_journalist_intel',
    'draft_pitch_draft',
    'export_google_doc',
  ]),
  stageFile: z.string().regex(/^[a-z0-9._-]{3,120}$/i).optional(),
  all: z.boolean().optional(),
  title: z.string().trim().max(140).optional(),
});

export const BackupActionInputSchema = z.object({
  action: z.enum(['create', 'restore']),
  backupId: z.string().regex(/^[a-z0-9][a-z0-9._-]{1,180}$/i).optional(),
  note: z.string().trim().max(240).optional(),
});

export const StageStateUpdateInputSchema = z.object({
  action: z.enum(['advance', 'set', 'pause', 'resume']).default('advance'),
  toStage: z.number().int().min(1).max(16).optional(),
  status: z.string().trim().min(1).max(80).optional(),
  force: z.boolean().optional().default(false),
});
