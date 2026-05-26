/**
 * =============================================================================
 * AGENT HANDOFF TYPES - Handoff Contracts Between Stages/Agents
 * =============================================================================
 * 
 * These types define how agents safely hand off to other agents,
 * supporting the "handoff safely" requirement.
 * 
 * =============================================================================
 */

import type { AgentId } from './agentBrain';

/**
 * HandoffStatus - Status of a handoff
 */
export type HandoffStatus = 'pending' | 'in-progress' | 'completed' | 'blocked' | 'failed';

/**
 * HandoffFieldRequirement - Requirement for a specific field
 */
export interface HandoffFieldRequirement {
  fieldName: string;
  required: boolean;
  type: string;
  description: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    enum?: string[];
  };
}

/**
 * AgentHandoffContract - Contract for handoff between two agents/stages
 */
export interface AgentHandoffContract {
  id: string;
  fromStage: number;
  toStage: number;
  fromAgent: AgentId;
  toAgent: AgentId;
  requiredArtifacts: ArtifactRequirement[];
  requiredFields: HandoffFieldRequirement[];
  blockedIfMissing: string[];
  warningsToCarryForward: string[];
  handoffSummary: string;
  autoMergeRequired?: boolean;
  mergeFunction?: string;
}

/**
 * ArtifactRequirement - Requirement for an artifact
 */
export interface ArtifactRequirement {
  artifactId: string;
  artifactType: string;
  fileName: string;
  required: boolean;
  description: string;
  validationRules?: {
    minSize?: number;
    maxSize?: number;
    requiredSections?: string[];
    format?: 'json' | 'markdown' | 'text' | 'html';
  };
}

/**
 * HandoffRecord - Actual record of a handoff
 */
export interface HandoffRecord {
  handoffId: string;
  campaignId: string;
  workflowRunId: string;
  contract: AgentHandoffContract;
  status: HandoffStatus;
  fromAgent: AgentId;
  toAgent: AgentId;
  fromStage: number;
  toStage: number;
  artifactsTransferred: TransferredArtifact[];
  fieldsTransferred: Record<string, unknown>;
  warnings: HandoffWarning[];
  blockers: HandoffBlocker[];
  initiatedAt: string;
  completedAt?: string;
  durationMs?: number;
  initiatedBy: AgentId;
}

/**
 * TransferredArtifact - Artifact being transferred
 */
export interface TransferredArtifact {
  artifactId: string;
  fileName: string;
  content: string;
  size: number;
  checksum: string;
  transferredAt: string;
}

/**
 * HandoffWarning - Warning carried forward
 */
export interface HandoffWarning {
  warningId: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  sourceStage: number;
  sourceAgent: AgentId;
}

/**
 * HandoffBlocker - Blocker preventing handoff
 */
export interface HandoffBlocker {
  blockerId: string;
  message: string;
  missingArtifact?: string;
  missingField?: string;
  requiredAction: string;
}

/**
 * HandoffValidationResult - Result of validating a handoff
 */
export interface HandoffValidationResult {
  valid: boolean;
  missingArtifacts: string[];
  missingFields: string[];
  warnings: string[];
  blockers: HandoffBlocker[];
}

/**
 * Stage 4 Special Handoff - Data Analyst to Insight Analyst
 */
export const STAGE4_INTERNAL_HANDOFF: AgentHandoffContract = {
  id: 'handoff-s4-internal',
  fromStage: 4,
  toStage: 4,
  fromAgent: 'data-analyst',
  toAgent: 'insight-analyst',
  requiredArtifacts: [
    { artifactId: 'verified-findings', artifactType: 'json', fileName: 'verified-findings.json', required: true, description: 'Verified statistics and evidence from Data Analyst' },
    { artifactId: 'evidence-quality-scores', artifactType: 'json', fileName: 'evidence-scores.json', required: true, description: 'Quality scores for all evidence' },
  ],
  requiredFields: [
    { fieldName: 'verifiedStatistics', required: true, type: 'array', description: 'Array of verified statistics with confidence scores' },
    { fieldName: 'approvedFindings', required: true, type: 'array', description: 'Approved findings from evidence validation' },
    { fieldName: 'blockedEvidence', required: false, type: 'array', description: 'Evidence blocked from use' },
    { fieldName: 'sourceCredibility', required: true, type: 'object', description: 'Source credibility assessments' },
  ],
  blockedIfMissing: ['verifiedStatistics', 'approvedFindings'],
  warningsToCarryForward: [
    'Research was conducted in demo/placeholder mode - verify all sources',
    'Some statistics may lack verification - flag in angle generation',
    'Source credibility scores are estimates - human review recommended',
  ],
  handoffSummary: 'Data Analyst passes verified evidence and quality scores to Insight Analyst for strategic storyline development. Both agents work within Stage 4.',
  autoMergeRequired: true,
  mergeFunction: 'mergeS4AgentOutputs',
};

/**
 * Stage 4 to Stage 5 Handoff - After both internal agents complete
 */
export const STAGE4_TO_5_HANDOFF: AgentHandoffContract = {
  id: 'handoff-s4-s5',
  fromStage: 4,
  toStage: 5,
  fromAgent: 'insight-analyst',
  toAgent: 'strategist',
  requiredArtifacts: [
    { artifactId: '04-analysis', artifactType: 'markdown', fileName: '04-analysis.md', required: true, description: 'Complete analysis report with both agents\' outputs' },
    { artifactId: 'angle-generation-guidance', artifactType: 'json', fileName: 'angle-guidance.json', required: true, description: 'Guidance for angle generation' },
  ],
  requiredFields: [
    { fieldName: 'verifiedFindings', required: true, type: 'array', description: 'Findings verified by Data Analyst' },
    { fieldName: 'campaignInsights', required: true, type: 'array', description: 'Strategic insights from Insight Analyst' },
    { fieldName: 'angleDirections', required: true, type: 'array', description: 'Recommended angle directions' },
    { fieldName: 'riskWarnings', required: true, type: 'array', description: 'Risk warnings to pass to strategist' },
    { fieldName: 'mustUseEvidence', required: true, type: 'array', description: 'Evidence that must be used in angles' },
    { fieldName: 'mustAvoidClaims', required: true, type: 'array', description: 'Claims to avoid' },
  ],
  blockedIfMissing: ['verifiedFindings', 'campaignInsights', 'angleDirections'],
  warningsToCarryForward: [
    'Only use evidence marked as approved in 04-analysis.md',
    'Do not invent statistics - only use verified_findings',
    'Include risk warnings from analysis in angle descriptions',
    'All angles must cite VF_XX references from verified findings',
  ],
  handoffSummary: 'Insight Analyst hands off complete analysis package to Strategist for angle generation. Includes verified evidence, strategic insights, and required constraints.',
};

/**
 * Default handoff contracts for workflow
 */
export const DEFAULT_HANDOFF_CONTRACTS: AgentHandoffContract[] = [
  STAGE4_INTERNAL_HANDOFF,
  STAGE4_TO_5_HANDOFF,
  // Stage 1 to 2
  {
    id: 'handoff-s1-s2',
    fromStage: 1,
    toStage: 2,
    fromAgent: 'orchestrator',
    toAgent: 'extractor',
    requiredArtifacts: [
      { artifactId: 'campaign-brief', artifactType: 'markdown', fileName: '00-brief.md', required: true, description: 'Campaign brief' },
      { artifactId: 'raw-study', artifactType: 'file', fileName: 'raw-study-copy.md', required: true, description: 'Raw study content' },
    ],
    requiredFields: [
      { fieldName: 'campaignId', required: true, type: 'string', description: 'Unique campaign identifier' },
      { fieldName: 'topic', required: true, type: 'string', description: 'Campaign topic' },
      { fieldName: 'goal', required: true, type: 'string', description: 'Campaign goal' },
    ],
    blockedIfMissing: ['campaignId', 'topic'],
    warningsToCarryForward: [],
    handoffSummary: 'Orchestrator passes campaign brief and raw study to Data Extractor for extraction.',
  },
  // Stage 2 to 3
  {
    id: 'handoff-s2-s3',
    fromStage: 2,
    toStage: 3,
    fromAgent: 'extractor',
    toAgent: 'researcher',
    requiredArtifacts: [
      { artifactId: 'extracted-insights', artifactType: 'markdown', fileName: '02-insights.md', required: true, description: 'Extracted insights' },
    ],
    requiredFields: [
      { fieldName: 'keyFindings', required: true, type: 'array', description: 'Key findings from extraction' },
      { fieldName: 'statistics', required: true, type: 'array', description: 'Extracted statistics' },
      { fieldName: 'methodology', required: false, type: 'object', description: 'Study methodology' },
    ],
    blockedIfMissing: ['keyFindings'],
    warningsToCarryForward: ['Some statistics may need verification'],
    handoffSummary: 'Data Extractor passes extracted insights to Researcher for enrichment.',
  },
  // Stage 3 to 4 (dual agent)
  {
    id: 'handoff-s3-s4',
    fromStage: 3,
    toStage: 4,
    fromAgent: 'researcher',
    toAgent: 'data-analyst',
    requiredArtifacts: [
      { artifactId: 'research-enrichment', artifactType: 'markdown', fileName: '03-research.md', required: true, description: 'Research enrichment' },
      { artifactId: 'extracted-insights', artifactType: 'markdown', fileName: '02-insights.md', required: true, description: 'Extracted insights' },
    ],
    requiredFields: [
      { fieldName: 'verifiedSources', required: true, type: 'array', description: 'Verified research sources' },
      { fieldName: 'researchFindings', required: true, type: 'array', description: 'Research findings' },
    ],
    blockedIfMissing: ['verifiedSources'],
    warningsToCarryForward: [],
    handoffSummary: 'Researcher passes enriched research to Data & Research Analyst for validation.',
  },
  // Stage 5 to 6
  {
    id: 'handoff-s5-s6',
    fromStage: 5,
    toStage: 6,
    fromAgent: 'strategist',
    toAgent: 'beat-matcher',
    requiredArtifacts: [
      { artifactId: 'pitch-angles', artifactType: 'markdown', fileName: '05-angles.md', required: true, description: 'Generated pitch angles' },
    ],
    requiredFields: [
      { fieldName: 'angles', required: true, type: 'array', description: 'Generated angles with scores' },
      { fieldName: 'selectedAngles', required: false, type: 'array', description: 'User-selected angles' },
    ],
    blockedIfMissing: ['angles'],
    warningsToCarryForward: [],
    handoffSummary: 'Strategist passes pitch angles to Beat Matcher for beat mapping.',
  },
  // Stage 6 to 7 (Human Gate)
  {
    id: 'handoff-s6-s7',
    fromStage: 6,
    toStage: 7,
    fromAgent: 'beat-matcher',
    toAgent: 'human-reviewer',
    requiredArtifacts: [
      { artifactId: 'beat-mapping', artifactType: 'markdown', fileName: '06-beat-match.md', required: true, description: 'Beat mapping' },
      { artifactId: 'pitch-angles', artifactType: 'markdown', fileName: '05-angles.md', required: true, description: 'Pitch angles' },
    ],
    requiredFields: [
      { fieldName: 'angleBeatMapping', required: true, type: 'object', description: 'Mapping of angles to beats' },
    ],
    blockedIfMissing: ['angleBeatMapping'],
    warningsToCarryForward: [],
    handoffSummary: 'Beat Matcher passes beat mappings to Human Reviewer for approval.',
  },
  // Stage 7 to 8
  {
    id: 'handoff-s7-s8',
    fromStage: 7,
    toStage: 8,
    fromAgent: 'human-reviewer',
    toAgent: 'collector',
    requiredArtifacts: [
      { artifactId: 'approved-angles', artifactType: 'markdown', fileName: '07-selected-angle.md', required: true, description: 'Approved angles' },
    ],
    requiredFields: [
      { fieldName: 'selectedAngles', required: true, type: 'array', description: 'Angles selected by human' },
    ],
    blockedIfMissing: ['selectedAngles'],
    warningsToCarryForward: [],
    handoffSummary: 'Human Reviewer passes approved angles to Collector for journalist collection.',
  },
  // Stage 8 to 9
  {
    id: 'handoff-s8-s9',
    fromStage: 8,
    toStage: 9,
    fromAgent: 'collector',
    toAgent: 'intelligence',
    requiredArtifacts: [
      { artifactId: 'journalist-list', artifactType: 'json', fileName: 'journalists.json', required: true, description: 'Collected journalists' },
    ],
    requiredFields: [
      { fieldName: 'journalists', required: true, type: 'array', description: 'Collected journalist profiles' },
    ],
    blockedIfMissing: ['journalists'],
    warningsToCarryForward: [],
    handoffSummary: 'Collector passes journalist list to Intelligence for profile enrichment.',
  },
  // Stage 9 to 10
  {
    id: 'handoff-s9-s10',
    fromStage: 9,
    toStage: 10,
    fromAgent: 'intelligence',
    toAgent: 'copywriter',
    requiredArtifacts: [
      { artifactId: 'journalist-profiles', artifactType: 'markdown', fileName: '06-journalist-intel.md', required: true, description: 'Enriched journalist profiles' },
    ],
    requiredFields: [
      { fieldName: 'enrichedProfiles', required: true, type: 'array', description: 'Journalist profiles with personalization notes' },
    ],
    blockedIfMissing: ['enrichedProfiles'],
    warningsToCarryForward: [],
    handoffSummary: 'Intelligence passes enriched journalist profiles to Copywriter for pitch drafting.',
  },
  // Stage 10 to 11
  {
    id: 'handoff-s10-s11',
    fromStage: 10,
    toStage: 11,
    fromAgent: 'copywriter',
    toAgent: 'optimizer',
    requiredArtifacts: [
      { artifactId: 'pitch-draft', artifactType: 'markdown', fileName: '08-pitch-draft.md', required: true, description: 'Pitch draft' },
    ],
    requiredFields: [
      { fieldName: 'pitchVariants', required: true, type: 'array', description: 'Generated pitch variants' },
    ],
    blockedIfMissing: ['pitchVariants'],
    warningsToCarryForward: [],
    handoffSummary: 'Copywriter passes pitch variants to Optimizer for email optimization.',
  },
  // Stage 11 to 12
  {
    id: 'handoff-s11-s12',
    fromStage: 11,
    toStage: 12,
    fromAgent: 'optimizer',
    toAgent: 'packager',
    requiredArtifacts: [
      { artifactId: 'optimized-email', artifactType: 'markdown', fileName: '09-optimized-email.md', required: true, description: 'Optimized email' },
    ],
    requiredFields: [
      { fieldName: 'optimizedEmail', required: true, type: 'object', description: 'Optimized email with subject lines' },
      { fieldName: 'qualityScore', required: true, type: 'number', description: 'Quality score (min 8.5)' },
    ],
    blockedIfMissing: ['optimizedEmail'],
    warningsToCarryForward: [],
    handoffSummary: 'Optimizer passes optimized email to Packager for final packaging.',
  },
  // Stage 12 to 13
  {
    id: 'handoff-s12-s13',
    fromStage: 12,
    toStage: 13,
    fromAgent: 'packager',
    toAgent: 'orchestrator',
    requiredArtifacts: [
      { artifactId: 'final-package', artifactType: 'markdown', fileName: 'final-package.md', required: true, description: 'Final export package' },
    ],
    requiredFields: [
      { fieldName: 'packageContents', required: true, type: 'object', description: 'Complete package contents' },
    ],
    blockedIfMissing: ['packageContents'],
    warningsToCarryForward: [],
    handoffSummary: 'Packager passes final package to Orchestrator for Google Doc export.',
  },
  // Stage 13 to 14
  {
    id: 'handoff-s13-s14',
    fromStage: 13,
    toStage: 14,
    fromAgent: 'orchestrator',
    toAgent: 'validator',
    requiredArtifacts: [
      { artifactId: 'google-doc-export', artifactType: 'file', fileName: 'google-doc-export.md', required: true, description: 'Google Doc export' },
    ],
    requiredFields: [
      { fieldName: 'exportReady', required: true, type: 'boolean', description: 'Ready for validation' },
    ],
    blockedIfMissing: ['exportReady'],
    warningsToCarryForward: [],
    handoffSummary: 'Orchestrator passes export to Validator for technical validation.',
  },
  // Stage 14 to 15
  {
    id: 'handoff-s14-s15',
    fromStage: 14,
    toStage: 15,
    fromAgent: 'validator',
    toAgent: 'collector',
    requiredArtifacts: [
      { artifactId: 'validation-results', artifactType: 'json', fileName: 'validation-results.json', required: true, description: 'Technical validation results' },
    ],
    requiredFields: [
      { fieldName: 'technicalPassed', required: true, type: 'boolean', description: 'Technical validation passed' },
    ],
    blockedIfMissing: ['technicalPassed'],
    warningsToCarryForward: [],
    handoffSummary: 'Validator passes validation results to Collector for browser validation.',
  },
  // Stage 15 to 16
  {
    id: 'handoff-s15-s16',
    fromStage: 15,
    toStage: 16,
    fromAgent: 'collector',
    toAgent: 'production',
    requiredArtifacts: [
      { artifactId: 'browser-validation', artifactType: 'json', fileName: 'browser-validation.json', required: true, description: 'Browser validation results' },
    ],
    requiredFields: [
      { fieldName: 'browserPassed', required: true, type: 'boolean', description: 'Browser validation passed' },
    ],
    blockedIfMissing: ['browserPassed'],
    warningsToCarryForward: [],
    handoffSummary: 'Collector passes browser validation to Production for final regression check.',
  },
];

/**
 * Get handoff contract between two stages
 */
export function getHandoffContract(fromStage: number, toStage: number): AgentHandoffContract | undefined {
  // Special case: Stage 4 internal handoff
  if (fromStage === 4 && toStage === 4) {
    return STAGE4_INTERNAL_HANDOFF;
  }
  
  return DEFAULT_HANDOFF_CONTRACTS.find(
    c => c.fromStage === fromStage && c.toStage === toStage
  );
}

/**
 * Validate a handoff
 */
export function validateHandoff(
  contract: AgentHandoffContract,
  artifacts: TransferredArtifact[],
  fields: Record<string, unknown>
): HandoffValidationResult {
  const missingArtifacts: string[] = [];
  const missingFields: string[] = [];
  const warnings: string[] = [...contract.warningsToCarryForward];
  const blockers: HandoffBlocker[] = [];

  // Check required artifacts
  for (const req of contract.requiredArtifacts) {
    if (req.required) {
      const found = artifacts.find(a => a.fileName === req.fileName);
      if (!found) {
        missingArtifacts.push(req.fileName);
        if (contract.blockedIfMissing.includes(req.artifactId)) {
          blockers.push({
            blockerId: `missing-artifact-${req.artifactId}`,
            message: `Required artifact missing: ${req.fileName}`,
            missingArtifact: req.artifactId,
            requiredAction: `Complete ${req.description} before handoff`,
          });
        }
      }
    }
  }

  // Check required fields
  for (const req of contract.requiredFields) {
    if (req.required && (fields[req.fieldName] === undefined || fields[req.fieldName] === null)) {
      missingFields.push(req.fieldName);
      if (contract.blockedIfMissing.includes(req.fieldName)) {
        blockers.push({
          blockerId: `missing-field-${req.fieldName}`,
          message: `Required field missing: ${req.fieldName}`,
          missingField: req.fieldName,
          requiredAction: `Provide ${req.description} before handoff`,
        });
      }
    }
  }

  return {
    valid: blockers.length === 0,
    missingArtifacts,
    missingFields,
    warnings,
    blockers,
  };
}