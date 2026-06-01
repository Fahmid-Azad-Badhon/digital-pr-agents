export type ProvenanceStatus = 'verified' | 'missing' | 'non_live' | 'unknown';

export type ApprovalSource = 'stage_executor' | 'route_execute_stage' | 'human_approval_ui' | 'replay_manager';

export interface ProvenanceMetadata {
  provenanceStatus: ProvenanceStatus;
  provenanceWarning?: string;
  runMode: import('./runMode').RunMode | null;
  source: ApprovalSource | null;
  schemaVersion: number | null;
}

export function classifyProvenance(
  hasRunMode: boolean,
  hasSource: boolean,
  hasSchemaVersion: boolean,
  runModeValue: unknown,
): { provenanceStatus: ProvenanceStatus; provenanceWarning?: string } {
  if (hasRunMode && hasSource && hasSchemaVersion) {
    if (runModeValue === 'live') {
      return { provenanceStatus: 'verified' };
    }

    if (runModeValue === 'dry_run' || runModeValue === 'preview' || runModeValue === 'test') {
      return {
        provenanceStatus: 'non_live',
        provenanceWarning: 'Artifact was written in non-live mode',
      };
    }

    return {
      provenanceStatus: 'unknown',
      provenanceWarning: 'Partial provenance metadata',
    };
  }

  if (hasRunMode || hasSource || hasSchemaVersion) {
    return {
      provenanceStatus: 'unknown',
      provenanceWarning: 'Partial provenance metadata',
    };
  }

  return {
    provenanceStatus: 'unknown',
    provenanceWarning: 'Artifact written before provenance tracking (Batch 5F)',
  };
}
