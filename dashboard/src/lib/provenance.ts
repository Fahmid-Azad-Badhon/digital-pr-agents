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

export type ProvenanceDecision =
  | { allowed: true; provenanceStatus: 'verified'; warning?: undefined }
  | { allowed: true; provenanceStatus: 'unknown'; warning: string }
  | { allowed: false; provenanceStatus: 'non_live'; reason: string }
  | { allowed: false; provenanceStatus: 'missing'; reason: string };

export type ApprovalProgressionInput = {
  status: string | null;
  provenanceStatus?: ProvenanceStatus | null;
};

export function getApprovalProgressionDecision(
  input: ApprovalProgressionInput,
): ProvenanceDecision {
  if (!input.status) {
    return {
      allowed: false,
      provenanceStatus: 'missing',
      reason: 'No approval status found',
    };
  }

  if (input.status !== 'approved') {
    return {
      allowed: false,
      provenanceStatus: 'missing',
      reason: `Approval status is: ${input.status}`,
    };
  }

  if (!input.provenanceStatus) {
    return {
      allowed: true,
      provenanceStatus: 'unknown',
      warning: 'Artifact written before provenance tracking (Batch 5F)',
    };
  }

  switch (input.provenanceStatus) {
    case 'verified':
      return { allowed: true, provenanceStatus: 'verified' };
    case 'non_live':
      return {
        allowed: false,
        provenanceStatus: 'non_live',
        reason: 'Artifact was written in non-live mode',
      };
    case 'unknown':
      return {
        allowed: true,
        provenanceStatus: 'unknown',
        warning: 'Partial provenance metadata',
      };
    case 'missing':
      return {
        allowed: false,
        provenanceStatus: 'missing',
        reason: 'Artifact written before provenance tracking (Batch 5F)',
      };
  }
}
