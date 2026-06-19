import path from 'path';
import { validateJsonFileAgainstSchema } from '@/lib/jsonSchemaValidator';

const S1_CAMPAIGN_INTAKE_JSON = '01-campaign-intake.json';
const CAMPAIGN_INTAKE_SCHEMA_PATH = path.resolve(process.cwd(), '..', 'schemas', 'campaign-intake.schema.json');

const S10_PITCH_DRAFT_JSON = '10-pitch-draft.json';
const PITCH_DRAFT_SCHEMA_PATH = path.resolve(process.cwd(), '..', 'schemas', 'pitch-draft.schema.json');

export async function validateS1OutputContract(campaignPath: string): Promise<void> {
  await validateJsonFileAgainstSchema({
    dataFilePath: path.join(campaignPath, S1_CAMPAIGN_INTAKE_JSON),
    schemaFilePath: CAMPAIGN_INTAKE_SCHEMA_PATH,
    artifactName: S1_CAMPAIGN_INTAKE_JSON,
  });
}

export async function validateS10OutputContract(campaignPath: string): Promise<void> {
  await validateJsonFileAgainstSchema({
    dataFilePath: path.join(campaignPath, S10_PITCH_DRAFT_JSON),
    schemaFilePath: PITCH_DRAFT_SCHEMA_PATH,
    artifactName: S10_PITCH_DRAFT_JSON,
  });
}
