/**
 * =============================================================================
 * AGENT ARTIFACT TYPES - Artifact Rules and Management
 * =============================================================================
 * 
 * These types define artifact creation and storage rules,
 * supporting the "save artifacts" requirement.
 * 
 * =============================================================================
 */

import type { AgentId } from './agentBrain';

/**
 * ArtifactType - Type of artifact
 */
export type ArtifactType = 
  | 'markdown' 
  | 'json' 
  | 'text' 
  | 'html' 
  | 'pdf' 
  | 'image' 
  | 'data' 
  | 'config';

/**
 * ArtifactStatus - Status of an artifact
 */
export type ArtifactStatus = 'draft' | 'pending-review' | 'approved' | 'rejected' | 'archived';

/**
 * ArtifactRule - Rule for artifact creation
 */
export interface AgentArtifactRule {
  ruleId: string;
  ruleName: string;
  description: string;
  appliesToAgent: AgentId;
  appliesToStage: number;
  requiredArtifact?: boolean;
  artifactType: ArtifactType;
  fileNamePattern: string;
  minSizeBytes?: number;
  maxSizeBytes?: number;
  requiredSections?: string[];
  validationRules?: ArtifactValidationRule[];
  storageLocation: 'campaign' | 'global' | 'temporary';
  retentionPeriod?: 'until-complete' | 'until-archived' | number;
}

/**
 * ArtifactValidationRule - Validation rule for artifact
 */
export interface ArtifactValidationRule {
  rule: 'required-fields' | 'format' | 'size' | 'encoding' | 'custom';
  field?: string;
  value?: unknown;
  errorMessage: string;
}

/**
 * Artifact - Actual artifact instance
 */
export interface AgentArtifact {
  artifactId: string;
  campaignId: string;
  workflowRunId: string;
  stageId: number;
  stageName: string;
  agentId: AgentId;
  agentName: string;
  artifactType: ArtifactType;
  fileName: string;
  filePath: string;
  content: string;
  size: number;
  checksum: string;
  status: ArtifactStatus;
  metadata: ArtifactMetadata;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: AgentId;
}

/**
 * ArtifactMetadata - Metadata for artifact
 */
export interface ArtifactMetadata {
  description?: string;
  tags?: string[];
  sourceUrl?: string;
  relatedArtifactIds?: string[];
  qualityScore?: number;
  validationResults?: ArtifactValidationResult[];
  rejectionReason?: string;
}

/**
 * ArtifactValidationResult - Result of artifact validation
 */
export interface ArtifactValidationResult {
  rule: string;
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

/**
 * ArtifactReference - Reference to an artifact
 */
export interface ArtifactReference {
  artifactId: string;
  fileName: string;
  artifactType: ArtifactType;
  stageId: number;
  agentId: AgentId;
  checksum: string;
}

/**
 * Default artifact rules for each stage
 */
export const DEFAULT_ARTIFACT_RULES: AgentArtifactRule[] = [
  // Stage 1 - Campaign Intake
  {
    ruleId: 'artifact-s1-brief',
    ruleName: 'Campaign Brief',
    description: 'Campaign brief document',
    appliesToAgent: 'orchestrator',
    appliesToStage: 1,
    requiredArtifact: true,
    artifactType: 'markdown',
    fileNamePattern: '00-brief.md',
    storageLocation: 'campaign',
    retentionPeriod: 'until-archived',
  },
  // Stage 2 - Data Extraction
  {
    ruleId: 'artifact-s2-insights',
    ruleName: 'Extracted Insights',
    description: 'Structured extracted insights',
    appliesToAgent: 'extractor',
    appliesToStage: 2,
    requiredArtifact: true,
    artifactType: 'markdown',
    fileNamePattern: '02-insights.md',
    minSizeBytes: 100,
    storageLocation: 'campaign',
    retentionPeriod: 'until-archived',
  },
  // Stage 3 - Research Enrichment
  {
    ruleId: 'artifact-s3-research',
    ruleName: 'Research Enrichment',
    description: 'Research enrichment results',
    appliesToAgent: 'researcher',
    appliesToStage: 3,
    requiredArtifact: true,
    artifactType: 'markdown',
    fileNamePattern: '03-research.md',
    storageLocation: 'campaign',
    retentionPeriod: 'until-archived',
  },
  // Stage 4 - Data & Research Analysis (Dual Agent)
  {
    ruleId: 'artifact-s4-analysis',
    ruleName: 'Data & Research Analysis',
    description: 'Complete analysis with both agents outputs',
    appliesToAgent: 'data-analyst',
    appliesToStage: 4,
    requiredArtifact: true,
    artifactType: 'markdown',
    fileNamePattern: '04-analysis.md',
    requiredSections: [
      '## Executive Summary',
      '## Data Validation Layer (Data & Research Analyst)',
      '## Insight Strategy Layer (Insight Analyst)',
      '## Anti-Hallucination Review',
      '## Handoff to Stage 5',
    ],
    storageLocation: 'campaign',
    retentionPeriod: 'until-archived',
  },
  // Stage 5 - Angle Generation
  {
    ruleId: 'artifact-s5-angles',
    ruleName: 'Pitch Angles',
    description: 'Generated pitch angles',
    appliesToAgent: 'strategist',
    appliesToStage: 5,
    requiredArtifact: true,
    artifactType: 'markdown',
    fileNamePattern: '04-angles.md',
    minSizeBytes: 500,
    storageLocation: 'campaign',
    retentionPeriod: 'until-archived',
  },
  // Stage 6 - Beat Matching
  {
    ruleId: 'artifact-s6-beats',
    ruleName: 'Beat Mapping',
    description: 'Beat to angle mapping',
    appliesToAgent: 'beat-matcher',
    appliesToStage: 6,
    requiredArtifact: true,
    artifactType: 'markdown',
    fileNamePattern: '05-beats.md',
    storageLocation: 'campaign',
    retentionPeriod: 'until-archived',
  },
  // Stage 7 - Human Review (no artifacts created by agent)
  {
    ruleId: 'artifact-s7-review',
    ruleName: 'Human Decision',
    description: 'Human approval decision',
    appliesToAgent: 'human-reviewer',
    appliesToStage: 7,
    requiredArtifact: false,
    artifactType: 'markdown',
    fileNamePattern: '04-angles-selected.md',
    storageLocation: 'campaign',
    retentionPeriod: 'until-archived',
  },
  // Stage 8 - Journalist Collection
  {
    ruleId: 'artifact-s8-journalists',
    ruleName: 'Journalist List',
    description: 'Collected journalist profiles',
    appliesToAgent: 'collector',
    appliesToStage: 8,
    requiredArtifact: true,
    artifactType: 'json',
    fileNamePattern: 'journalists.json',
    storageLocation: 'campaign',
    retentionPeriod: 'until-archived',
  },
  // Stage 9 - Journalist Intelligence
  {
    ruleId: 'artifact-s9-intel',
    ruleName: 'Journalist Intelligence',
    description: 'Enriched journalist profiles',
    appliesToAgent: 'intelligence',
    appliesToStage: 9,
    requiredArtifact: true,
    artifactType: 'markdown',
    fileNamePattern: '06-journalist-intel.md',
    storageLocation: 'campaign',
    retentionPeriod: 'until-archived',
  },
  // Stage 10 - Pitch Drafting
  {
    ruleId: 'artifact-s10-pitch',
    ruleName: 'Pitch Draft',
    description: 'Pitch variants',
    appliesToAgent: 'copywriter',
    appliesToStage: 10,
    requiredArtifact: true,
    artifactType: 'markdown',
    fileNamePattern: '08-pitch-draft.md',
    storageLocation: 'campaign',
    retentionPeriod: 'until-archived',
  },
  // Stage 11 - Email Optimization
  {
    ruleId: 'artifact-s11-optimized',
    ruleName: 'Optimized Email',
    description: 'Final optimized email',
    appliesToAgent: 'optimizer',
    appliesToStage: 11,
    requiredArtifact: true,
    artifactType: 'markdown',
    fileNamePattern: '09-optimized-email.md',
    storageLocation: 'campaign',
    retentionPeriod: 'until-archived',
  },
  // Stage 12 - Final Package
  {
    ruleId: 'artifact-s12-package',
    ruleName: 'Final Package',
    description: 'Export-ready package',
    appliesToAgent: 'packager',
    appliesToStage: 12,
    requiredArtifact: true,
    artifactType: 'markdown',
    fileNamePattern: 'final-package.md',
    storageLocation: 'campaign',
    retentionPeriod: 'until-archived',
  },
  // Stage 13 - Google Doc Export
  {
    ruleId: 'artifact-s13-export',
    ruleName: 'Google Doc Export',
    description: 'Google Doc export file',
    appliesToAgent: 'orchestrator',
    appliesToStage: 13,
    requiredArtifact: true,
    artifactType: 'markdown',
    fileNamePattern: 'google-doc-export.md',
    storageLocation: 'campaign',
    retentionPeriod: 'until-archived',
  },
  // Stage 14 - Technical Validation
  {
    ruleId: 'artifact-s14-validation',
    ruleName: 'Validation Results',
    description: 'Technical validation results',
    appliesToAgent: 'validator',
    appliesToStage: 14,
    requiredArtifact: true,
    artifactType: 'json',
    fileNamePattern: 'validation-results.json',
    storageLocation: 'campaign',
    retentionPeriod: 'until-archived',
  },
  // Stage 15 - Browser Validation
  {
    ruleId: 'artifact-s15-browser',
    ruleName: 'Browser Validation',
    description: 'Browser validation results',
    appliesToAgent: 'collector',
    appliesToStage: 15,
    requiredArtifact: true,
    artifactType: 'json',
    fileNamePattern: 'browser-validation.json',
    storageLocation: 'campaign',
    retentionPeriod: 'until-archived',
  },
  // Stage 16 - Regression & Production
  {
    ruleId: 'artifact-s16-production',
    ruleName: 'Production Status',
    description: 'Production ready status',
    appliesToAgent: 'production',
    appliesToStage: 16,
    requiredArtifact: true,
    artifactType: 'json',
    fileNamePattern: 'production-status.json',
    storageLocation: 'campaign',
    retentionPeriod: 'until-archived',
  },
];

/**
 * Get artifact rules for a stage
 */
export function getArtifactRulesForStage(stageId: number): AgentArtifactRule[] {
  return DEFAULT_ARTIFACT_RULES.filter(r => r.appliesToStage === stageId);
}

/**
 * Get artifact rules for an agent
 */
export function getArtifactRulesForAgent(agentId: AgentId): AgentArtifactRule[] {
  return DEFAULT_ARTIFACT_RULES.filter(r => r.appliesToAgent === agentId);
}

/**
 * Validate an artifact against its rules
 */
export function validateArtifact(
  artifact: AgentArtifact,
  rules: AgentArtifactRule[]
): ArtifactValidationResult[] {
  const results: ArtifactValidationResult[] = [];
  
  for (const rule of rules) {
    if (rule.fileNamePattern !== artifact.fileName) continue;
    
    // Check size
    if (rule.minSizeBytes && artifact.size < rule.minSizeBytes) {
      results.push({
        rule: 'size',
        passed: false,
        message: `Artifact size ${artifact.size} is below minimum ${rule.minSizeBytes}`,
        severity: 'error',
      });
    }
    
    if (rule.maxSizeBytes && artifact.size > rule.maxSizeBytes) {
      results.push({
        rule: 'size',
        passed: false,
        message: `Artifact size ${artifact.size} exceeds maximum ${rule.maxSizeBytes}`,
        severity: 'error',
      });
    }
    
    // Check required sections for markdown
    if (rule.requiredSections && artifact.artifactType === 'markdown') {
      for (const section of rule.requiredSections) {
        if (!artifact.content.includes(section)) {
          results.push({
            rule: 'required-fields',
            passed: false,
            message: `Missing required section: ${section}`,
            severity: 'error',
          });
        }
      }
    }
  }
  
  return results;
}

/**
 * Create a new artifact
 */
export function createArtifact(
  campaignId: string,
  workflowRunId: string,
  stageId: number,
  stageName: string,
  agentId: AgentId,
  agentName: string,
  artifactType: ArtifactType,
  fileName: string,
  content: string
): AgentArtifact {
  const artifactId = `art-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const checksum = generateChecksum(content);
  
  return {
    artifactId,
    campaignId,
    workflowRunId,
    stageId,
    stageName,
    agentId,
    agentName,
    artifactType,
    fileName,
    filePath: `campaigns/${campaignId}/stages/${stageId}/${fileName}`,
    content,
    size: new Blob([content]).size,
    checksum,
    status: 'draft',
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Generate checksum for content
 */
function generateChecksum(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Approve an artifact
 */
export function approveArtifact(
  artifact: AgentArtifact,
  approvedBy: AgentId
): AgentArtifact {
  return {
    ...artifact,
    status: 'approved',
    approvedAt: new Date().toISOString(),
    approvedBy,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Reject an artifact
 */
export function rejectArtifact(
  artifact: AgentArtifact,
  rejectionReason: string
): AgentArtifact {
  return {
    ...artifact,
    status: 'rejected',
    metadata: {
      ...artifact.metadata,
      rejectionReason,
    },
    updatedAt: new Date().toISOString(),
  };
}