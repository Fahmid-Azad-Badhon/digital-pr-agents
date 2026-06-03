import path from 'path';
import { validateJsonFileAgainstSchema } from '@/lib/jsonSchemaValidator';

const S10_PITCH_DRAFT_JSON = '10-pitch-draft.json';
const PITCH_DRAFT_SCHEMA_PATH = path.resolve(process.cwd(), '..', 'schemas', 'pitch-draft.schema.json');

export async function validateS10OutputContract(campaignPath: string): Promise<void> {
  await validateJsonFileAgainstSchema({
    dataFilePath: path.join(campaignPath, S10_PITCH_DRAFT_JSON),
    schemaFilePath: PITCH_DRAFT_SCHEMA_PATH,
    artifactName: S10_PITCH_DRAFT_JSON,
  });
}
