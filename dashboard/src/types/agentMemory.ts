/**
 * =============================================================================
 * AGENT MEMORY TYPES - Memory Contracts and Access Rules
 * =============================================================================
 * 
 * These types define what memory each agent can read/write,
 * supporting the "read only allowed memory" requirement.
 * 
 * =============================================================================
 */

import type { AgentId } from './agentBrain';

/**
 * MemoryKey - Identifier for a specific memory store
 */
export type MemoryKey = string;

/**
 * MemoryScope - Defines the scope of memory access
 */
export type MemoryScope = 'campaign' | 'stage' | 'agent' | 'global';

/**
 * MemoryAccessLevel - Permission level for memory access
 */
export type MemoryAccessLevel = 'read' | 'write' | 'read-write' | 'none';

/**
 * AgentMemoryContract - Defines what memory an agent can access
 */
export interface AgentMemoryContract {
  agentId: AgentId;
  allowedMemoryKeys: MemoryAccessRule[];
  maxMemorySizeBytes: number;
  retentionPolicy: MemoryRetentionPolicy;
  isolationLevel: 'strict' | 'campaign' | 'shared';
}

/**
 * MemoryAccessRule - Rule for accessing a specific memory key
 */
export interface MemoryAccessRule {
  key: MemoryKey;
  scope: MemoryScope;
  accessLevel: MemoryAccessLevel;
  description: string;
  requiredForExecution: boolean;
  expiresAfterStages?: number[];
}

/**
 * MemoryRetentionPolicy - How long memory is retained
 */
export interface MemoryRetentionPolicy {
  shortTermTTLMinutes: number;
  campaignMemoryTTL: 'until-complete' | 'until-archived' | number;
  globalMemoryTTL: 'forever' | number;
  autoCleanupEnabled: boolean;
}

/**
 * MemoryStore - Actual memory storage structure
 */
export interface MemoryStore {
  shortTerm: ShortTermMemory;
  campaign: CampaignMemory;
  global: GlobalMemory;
}

/**
 * ShortTermMemory - Ephemeral memory for current workflow run
 */
export interface ShortTermMemory {
  workflowRunId: string;
  currentStageMemory: Record<string, unknown>;
  previousStageMemory: Record<string, unknown>;
  agentSharedMemory: Record<AgentId, Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
}

/**
 * CampaignMemory - Memory tied to a specific campaign
 */
export interface CampaignMemory {
  campaignId: string;
  stageOutputs: Record<number, StageMemoryOutput>;
  cumulativeInsights: string[];
  approvedArtifacts: string[];
  rejectedArtifacts: string[];
  humanFeedback: HumanFeedbackMemory[];
  createdAt: string;
  updatedAt: string;
}

/**
 * StageMemoryOutput - Output from a specific stage
 */
export interface StageMemoryOutput {
  stageId: number;
  agentId: AgentId;
  output: unknown;
  artifacts: string[];
  qualityScore?: number;
  completedAt: string;
}

/**
 * HumanFeedbackMemory - Stored human feedback
 */
export interface HumanFeedbackMemory {
  feedbackId: string;
  stageId: number;
  agentId: AgentId;
  feedbackType: 'approved' | 'rejected' | 'revised';
  notes: string;
  createdAt: string;
}

/**
 * GlobalMemory - System-wide memory (rules, examples, patterns)
 */
export interface GlobalMemory {
  goldenExamples: GoldenExample[];
  correctionRules: CorrectionRule[];
  learnedPatterns: LearnedPattern[];
  immutableAnchors: ImmutableAnchor[];
  lastUpdated: string;
}

/**
 * GoldenExample - Successful example for few-shot learning
 */
export interface GoldenExample {
  id: string;
  campaignType: string;
  stageId: number;
  input: unknown;
  output: unknown;
  qualityScore: number;
  source: 'human-approved' | 'auto-verified';
  createdAt: string;
}

/**
 * CorrectionRule - Rule learned from corrections
 */
export interface CorrectionRule {
  id: string;
  ruleText: string;
  appliesToStage: number;
  appliesToAgent: AgentId;
  confidence: number;
  evidenceCount: number;
  createdAt: string;
  lastUsedAt?: string;
}

/**
 * LearnedPattern - Pattern learned from multiple executions
 */
export interface LearnedPattern {
  id: string;
  patternType: 'prompt' | 'output' | 'validation' | 'handoff';
  pattern: string;
  successRate: number;
  sampleCount: number;
  createdAt: string;
}

/**
 * ImmutableAnchor - Rule that cannot be overridden by evolved persona
 */
export interface ImmutableAnchor {
  id: string;
  anchorType: 'global' | 'stage-specific';
  stageId?: number;
  rule: string;
  reason: string;
  createdAt: string;
}

/**
 * MemoryQuery - Request for memory data
 */
export interface MemoryQuery {
  campaignId: string;
  workflowRunId?: string;
  stageId?: number;
  agentId?: AgentId;
  memoryKeys: MemoryKey[];
  includeExpired?: boolean;
}

/**
 * MemoryWrite - Write operation to memory
 */
export interface MemoryWrite {
  memoryKey: MemoryKey;
  scope: MemoryScope;
  data: unknown;
  ttlMinutes?: number;
  createdBy: AgentId;
  campaignId?: string;
}

/**
 * Default memory contracts for each agent
 */
export const DEFAULT_MEMORY_CONTRACTS: Record<AgentId, AgentMemoryContract> = {
  orchestrator: {
    agentId: 'orchestrator',
    allowedMemoryKeys: [
      { key: 'campaign-state', scope: 'campaign', accessLevel: 'read-write', description: 'Full campaign state', requiredForExecution: true },
      { key: 'stage-progress', scope: 'stage', accessLevel: 'read-write', description: 'Stage completion status', requiredForExecution: true },
      { key: 'global-rules', scope: 'global', accessLevel: 'read', description: 'Immutable anchors and rules', requiredForExecution: true },
    ],
    maxMemorySizeBytes: 1024 * 1024,
    retentionPolicy: { shortTermTTLMinutes: 60, campaignMemoryTTL: 'until-complete', globalMemoryTTL: 'forever', autoCleanupEnabled: true },
    isolationLevel: 'campaign',
  },
  extractor: {
    agentId: 'extractor',
    allowedMemoryKeys: [
      { key: 'campaign-brief', scope: 'campaign', accessLevel: 'read', description: 'Campaign brief and goals', requiredForExecution: true },
      { key: 'raw-study-data', scope: 'campaign', accessLevel: 'read', description: 'Raw study input', requiredForExecution: true },
      { key: 'extracted-insights', scope: 'campaign', accessLevel: 'write', description: 'Extracted insights output', requiredForExecution: true },
    ],
    maxMemorySizeBytes: 512 * 1024,
    retentionPolicy: { shortTermTTLMinutes: 30, campaignMemoryTTL: 'until-complete', globalMemoryTTL: 'forever', autoCleanupEnabled: true },
    isolationLevel: 'strict',
  },
  researcher: {
    agentId: 'researcher',
    allowedMemoryKeys: [
      { key: 'extracted-insights', scope: 'campaign', accessLevel: 'read', description: 'Stage 2 output', requiredForExecution: true },
      { key: 'serp-research', scope: 'campaign', accessLevel: 'write', description: 'SERP research results', requiredForExecution: true },
      { key: 'source-credibility', scope: 'global', accessLevel: 'read-write', description: 'Source credibility cache', requiredForExecution: false },
    ],
    maxMemorySizeBytes: 512 * 1024,
    retentionPolicy: { shortTermTTLMinutes: 30, campaignMemoryTTL: 'until-complete', globalMemoryTTL: 'forever', autoCleanupEnabled: true },
    isolationLevel: 'strict',
  },
  'data-analyst': {
    agentId: 'data-analyst',
    allowedMemoryKeys: [
      { key: 'extracted-insights', scope: 'campaign', accessLevel: 'read', description: 'Stage 2 data', requiredForExecution: true },
      { key: 'serp-research', scope: 'campaign', accessLevel: 'read', description: 'Stage 3 research', requiredForExecution: true },
      { key: 'verified-findings', scope: 'campaign', accessLevel: 'write', description: 'Verified evidence', requiredForExecution: true },
      { key: 'stage4-shared', scope: 'agent', accessLevel: 'read-write', description: 'Shared with Insight Analyst', requiredForExecution: true },
    ],
    maxMemorySizeBytes: 768 * 1024,
    retentionPolicy: { shortTermTTLMinutes: 45, campaignMemoryTTL: 'until-complete', globalMemoryTTL: 'forever', autoCleanupEnabled: true },
    isolationLevel: 'campaign',
  },
  'insight-analyst': {
    agentId: 'insight-analyst',
    allowedMemoryKeys: [
      { key: 'verified-findings', scope: 'campaign', accessLevel: 'read', description: 'Data Analyst output', requiredForExecution: true },
      { key: 'insights', scope: 'campaign', accessLevel: 'write', description: 'Strategic insights', requiredForExecution: true },
      { key: 'stage4-shared', scope: 'agent', accessLevel: 'read-write', description: 'Shared with Data Analyst', requiredForExecution: true },
    ],
    maxMemorySizeBytes: 768 * 1024,
    retentionPolicy: { shortTermTTLMinutes: 45, campaignMemoryTTL: 'until-complete', globalMemoryTTL: 'forever', autoCleanupEnabled: true },
    isolationLevel: 'campaign',
  },
  strategist: {
    agentId: 'strategist',
    allowedMemoryKeys: [
      { key: 'insights', scope: 'campaign', accessLevel: 'read', description: 'Stage 4 insights', requiredForExecution: true },
      { key: 'pitch-angles', scope: 'campaign', accessLevel: 'write', description: 'Generated angles', requiredForExecution: true },
    ],
    maxMemorySizeBytes: 512 * 1024,
    retentionPolicy: { shortTermTTLMinutes: 30, campaignMemoryTTL: 'until-complete', globalMemoryTTL: 'forever', autoCleanupEnabled: true },
    isolationLevel: 'strict',
  },
  'beat-matcher': {
    agentId: 'beat-matcher',
    allowedMemoryKeys: [
      { key: 'pitch-angles', scope: 'campaign', accessLevel: 'read', description: 'Selected angles', requiredForExecution: true },
      { key: 'beat-mapping', scope: 'campaign', accessLevel: 'write', description: 'Beat to angle mapping', requiredForExecution: true },
    ],
    maxMemorySizeBytes: 256 * 1024,
    retentionPolicy: { shortTermTTLMinutes: 30, campaignMemoryTTL: 'until-complete', globalMemoryTTL: 'forever', autoCleanupEnabled: true },
    isolationLevel: 'strict',
  },
  'human-reviewer': {
    agentId: 'human-reviewer',
    allowedMemoryKeys: [
      { key: 'pitch-angles', scope: 'campaign', accessLevel: 'read', description: 'All pitch angles', requiredForExecution: true },
      { key: 'human-decision', scope: 'campaign', accessLevel: 'write', description: 'Approval/rejection', requiredForExecution: true },
    ],
    maxMemorySizeBytes: 256 * 1024,
    retentionPolicy: { shortTermTTLMinutes: 480, campaignMemoryTTL: 'until-complete', globalMemoryTTL: 'forever', autoCleanupEnabled: false },
    isolationLevel: 'strict',
  },
  collector: {
    agentId: 'collector',
    allowedMemoryKeys: [
      { key: 'beat-mapping', scope: 'campaign', accessLevel: 'read', description: 'Beat mappings', requiredForExecution: true },
      { key: 'journalist-list', scope: 'campaign', accessLevel: 'write', description: 'Collected journalists', requiredForExecution: true },
      { key: 'muckrack-cache', scope: 'global', accessLevel: 'read-write', description: 'Muck Rack data cache', requiredForExecution: false },
    ],
    maxMemorySizeBytes: 1024 * 1024,
    retentionPolicy: { shortTermTTLMinutes: 60, campaignMemoryTTL: 'until-complete', globalMemoryTTL: 1440, autoCleanupEnabled: true },
    isolationLevel: 'campaign',
  },
  intelligence: {
    agentId: 'intelligence',
    allowedMemoryKeys: [
      { key: 'journalist-list', scope: 'campaign', accessLevel: 'read', description: 'Collected journalists', requiredForExecution: true },
      { key: 'journalist-profiles', scope: 'campaign', accessLevel: 'write', description: 'Enriched profiles', requiredForExecution: true },
    ],
    maxMemorySizeBytes: 768 * 1024,
    retentionPolicy: { shortTermTTLMinutes: 60, campaignMemoryTTL: 'until-complete', globalMemoryTTL: 'forever', autoCleanupEnabled: true },
    isolationLevel: 'strict',
  },
  copywriter: {
    agentId: 'copywriter',
    allowedMemoryKeys: [
      { key: 'journalist-profiles', scope: 'campaign', accessLevel: 'read', description: 'Target journalist info', requiredForExecution: true },
      { key: 'pitch-variants', scope: 'campaign', accessLevel: 'write', description: 'Draft pitch variants', requiredForExecution: true },
    ],
    maxMemorySizeBytes: 512 * 1024,
    retentionPolicy: { shortTermTTLMinutes: 30, campaignMemoryTTL: 'until-complete', globalMemoryTTL: 'forever', autoCleanupEnabled: true },
    isolationLevel: 'strict',
  },
  optimizer: {
    agentId: 'optimizer',
    allowedMemoryKeys: [
      { key: 'pitch-variants', scope: 'campaign', accessLevel: 'read', description: 'Pitch drafts', requiredForExecution: true },
      { key: 'optimized-email', scope: 'campaign', accessLevel: 'write', description: 'Final optimized email', requiredForExecution: true },
    ],
    maxMemorySizeBytes: 256 * 1024,
    retentionPolicy: { shortTermTTLMinutes: 30, campaignMemoryTTL: 'until-complete', globalMemoryTTL: 'forever', autoCleanupEnabled: true },
    isolationLevel: 'strict',
  },
  packager: {
    agentId: 'packager',
    allowedMemoryKeys: [
      { key: 'optimized-email', scope: 'campaign', accessLevel: 'read', description: 'Final email', requiredForExecution: true },
      { key: 'final-package', scope: 'campaign', accessLevel: 'write', description: 'Export package', requiredForExecution: true },
    ],
    maxMemorySizeBytes: 256 * 1024,
    retentionPolicy: { shortTermTTLMinutes: 30, campaignMemoryTTL: 'until-complete', globalMemoryTTL: 'forever', autoCleanupEnabled: true },
    isolationLevel: 'strict',
  },
  validator: {
    agentId: 'validator',
    allowedMemoryKeys: [
      { key: 'final-package', scope: 'campaign', accessLevel: 'read', description: 'Package to validate', requiredForExecution: true },
      { key: 'validation-results', scope: 'campaign', accessLevel: 'write', description: 'Validation output', requiredForExecution: true },
    ],
    maxMemorySizeBytes: 512 * 1024,
    retentionPolicy: { shortTermTTLMinutes: 30, campaignMemoryTTL: 'until-complete', globalMemoryTTL: 'forever', autoCleanupEnabled: true },
    isolationLevel: 'strict',
  },
  production: {
    agentId: 'production',
    allowedMemoryKeys: [
      { key: 'validation-results', scope: 'campaign', accessLevel: 'read', description: 'All validation results', requiredForExecution: true },
      { key: 'production-status', scope: 'campaign', accessLevel: 'write', description: 'Production ready status', requiredForExecution: true },
    ],
    maxMemorySizeBytes: 256 * 1024,
    retentionPolicy: { shortTermTTLMinutes: 30, campaignMemoryTTL: 'until-archived', globalMemoryTTL: 'forever', autoCleanupEnabled: true },
    isolationLevel: 'strict',
  },
};