/**
 * =============================================================================
 * AGENT BRAIN TYPES - Core Brain Architecture Contracts
 * =============================================================================
 * 
 * These types define the brain system that prevents agents from behaving
 * like disconnected prompt blocks. Every agent should be able to:
 * - Read the correct campaign state
 * - Read only allowed memory
 * - Use only allowed tools
 * - Validate required inputs
 * - Produce typed outputs
 * - Save artifacts
 * - Run guardrails
 * - Update workflow state
 * - Handoff safely
 * - Log what happened
 * - Learn from feedback
 * 
 * =============================================================================
 */

import type { Campaign, WorkflowStage, StageStatus, ActivityLog } from './index';
import type { AgentMemoryContract } from './agentMemory';
import type { AgentToolContract } from './agentTool';
import type { AgentHandoffContract } from './agentHandoff';
import type { AgentArtifactRule } from './agentArtifact';

// =============================================================================
// ADDITIONAL TYPE REFERENCES - Forward declarations for AgentBrain
// =============================================================================

export type AgentInputContract = Record<string, unknown>;

export interface AgentOutputContract {
  outputType: string;
  requiredFields: string[];
  optionalFields: string[];
  validationSchema?: Record<string, unknown>;
}

export interface AgentGuardrail {
  id: string;
  appliesToAgent: AgentId;
  appliesToStage?: number;
  rule: string;
  checkType: 'input' | 'output' | 'handoff' | 'tool-use' | 'artifact' | 'state';
  failureMessage: string;
  severity: 'warning' | 'blocker';
  enabled: boolean;
}

export interface AgentStateUpdateRule {
  id: string;
  ruleName: string;
  appliesToAgent: AgentId;
  appliesToStage: number;
  updateType: 'stage-status' | 'campaign-status' | 'progress' | 'gate' | 'custom';
  updateField: string;
  updateValue: unknown;
  condition?: string;
}

export interface AgentTraceRule {
  id: string;
  ruleName: string;
  appliesToAgent: AgentId;
  appliesToStage: number;
  traceLevel: 'minimal' | 'standard' | 'detailed' | 'verbose';
  logInputArtifacts: boolean;
  logOutputArtifacts: boolean;
  logToolCalls: boolean;
  logGuardrails: boolean;
}

export interface AgentFeedbackRule {
  id: string;
  ruleName: string;
  appliesToAgent: AgentId;
  appliesToStage: number;
  feedbackTrigger: 'always' | 'on-rejection' | 'on-error' | 'manual';
  autoCaptureEnabled: boolean;
  requireHumanReview: boolean;
}

// =============================================================================
// STAGE DEFINITIONS - Supports 16 stages with special Stage 4 dual-agent
// =============================================================================

export const BRAIN_STAGES = [
  { number: 1, name: 'Campaign Intake', owner: 'orchestrator' },
  { number: 2, name: 'Data Extraction', owner: 'extractor' },
  { number: 3, name: 'Research Enrichment', owner: 'researcher' },
  { number: 4, name: 'Data & Research Analysis', owner: 'data-analyst', secondaryOwner: 'insight-analyst', description: 'Stage 4 contains two internal agents (4A: Data & Research Analyst, 4B: Insight Analyst)' },
  { number: 5, name: 'Angle Generation', owner: 'strategist' },
  { number: 6, name: 'Beat Matching', owner: 'beat-matcher' },
  { number: 7, name: 'Pitch Selection / Human Gate', owner: 'human-reviewer' },
  { number: 8, name: 'Journalist Collection', owner: 'collector' },
  { number: 9, name: 'Journalist Intelligence', owner: 'intelligence' },
  { number: 10, name: 'Pitch Drafting', owner: 'copywriter' },
  { number: 11, name: 'Email Optimization', owner: 'optimizer' },
  { number: 12, name: 'Final Package', owner: 'packager' },
  { number: 13, name: 'Google Doc Export', owner: 'orchestrator' },
  { number: 14, name: 'Technical Validation', owner: 'validator' },
  { number: 15, name: 'Browser Validation', owner: 'collector' },
  { number: 16, name: 'Regression & Production', owner: 'production' },
] as const;

export type BrainStageNumber = typeof BRAIN_STAGES[number]['number'];

// =============================================================================
// AGENT DEFINITIONS - 15 agents including Stage 4 dual agents
// =============================================================================

export const BRAIN_AGENTS = [
  { id: 'orchestrator', name: 'Orchestrator', role: 'Workflow Controller', color: 'bg-blue-600', stages: [1, 7, 13] },
  { id: 'extractor', name: 'Data Extractor', role: 'Study Analyst', color: 'bg-green-600', stages: [2] },
  { id: 'researcher', name: 'Researcher', role: 'SERP Analyst', color: 'bg-purple-600', stages: [3] },
  { id: 'data-analyst', name: 'Data & Research Analyst', role: 'Evidence Validator', color: 'bg-emerald-600', stages: [4], description: '4A - First layer of Stage 4: Validates statistics, claims, sources, evidence quality' },
  { id: 'insight-analyst', name: 'Insight Analyst', role: 'Storyline Strategist', color: 'bg-teal-600', stages: [4], description: '4B - Second layer of Stage 4: Turns verified evidence into strategic storylines' },
  { id: 'strategist', name: 'Strategist', role: 'Angle Planner', color: 'bg-orange-600', stages: [5] },
  { id: 'beat-matcher', name: 'Beat Matcher', role: 'Beat Mapper', color: 'bg-pink-600', stages: [6] },
  { id: 'human-reviewer', name: 'Human Reviewer', role: 'Decision Maker', color: 'bg-amber-500', stages: [7] },
  { id: 'collector', name: 'Collector', role: 'Journalist Hunter', color: 'bg-cyan-600', stages: [8, 15] },
  { id: 'intelligence', name: 'Intelligence', role: 'Profile Analyzer', color: 'bg-indigo-600', stages: [9] },
  { id: 'copywriter', name: 'Copywriter', role: 'Pitch Creator', color: 'bg-yellow-600', stages: [10] },
  { id: 'optimizer', name: 'Optimizer', role: 'Email Refiner', color: 'bg-amber-600', stages: [11] },
  { id: 'packager', name: 'Packager', role: 'Doc Builder', color: 'bg-rose-600', stages: [12] },
  { id: 'validator', name: 'Validator', role: 'Quality Checker', color: 'bg-violet-600', stages: [14] },
  { id: 'production', name: 'Production', role: 'Final QA', color: 'bg-red-600', stages: [16] },
] as const;

export type AgentId = typeof BRAIN_AGENTS[number]['id'];

// =============================================================================
// CORE BRAIN TYPES
// =============================================================================

/**
 * AgentBrain - The complete brain configuration for a single agent
 * Contains all contracts, rules, and configurations needed for agent execution
 */
export interface AgentBrain {
  agentId: AgentId;
  agentName: string;
  role: string;
  stageIds: number[];
  stageName: string;
  brainFilePath?: string;
  memoryContract: AgentMemoryContract;
  inputContract: AgentInputContract;
  toolContract: AgentToolContract;
  outputContract: AgentOutputContract;
  handoffContracts: AgentHandoffContract[];
  guardrails: AgentGuardrail[];
  stateUpdateRules: AgentStateUpdateRule[];
  artifactRules: AgentArtifactRule[];
  traceRules: AgentTraceRule[];
  feedbackRules: AgentFeedbackRule[];
}

/**
 * AgentBrainRegistryItem - Entry in the global brain registry
 */
export interface AgentBrainRegistryItem {
  agentId: AgentId;
  agentName: string;
  isActive: boolean;
  registeredAt: string;
  lastUsedAt?: string;
  brainVersion: string;
  brain: AgentBrain;
}

/**
 * AgentContextPackage - Complete context passed to an agent at execution time
 * This is what the agent receives when it's triggered to run
 */
export interface AgentContextPackage {
  workflowRunId: string;
  campaignId: string;
  stageId: number;
  stageName: string;
  agentId: AgentId;
  agentName: string;
  activeCampaign: Campaign;
  workflowState: AgentWorkflowState;
  allowedMemoryKeys: string[];
  shortTermMemory: Record<string, unknown>;
  campaignMemory: Record<string, unknown>;
  previousArtifacts: AgentArtifactReference[];
  input: unknown;
  allowedTools: string[];
  requiredOutputs: string[];
  guardrails: AgentGuardrail[];
  executionId: string;
  parentAgentId?: AgentId;
}

/**
 * AgentWorkflowState - Current state of the workflow from agent's perspective
 */
export interface AgentWorkflowState {
  currentStage: number;
  completedStages: number[];
  currentPhase: string;
  activeAgents: AgentId[];
  campaignStatus: Campaign['status'];
  stageStatuses: Record<number, StageStatus>;
  lastHandoff?: AgentHandoffReference;
  recentLogs: ActivityLog[];
}

// =============================================================================
// STAGE 4 DUAL-AGENT SUPPORT TYPES
// =============================================================================

/**
 * Stage4AgentConfig - Configuration for the two agents inside Stage 4
 */
export interface Stage4AgentConfig {
  stageId: 4;
  stageName: 'Data & Research Analysis';
  isDualAgentStage: true;
  primaryAgent: {
    id: 'data-analyst';
    name: 'Data & Research Analyst';
    internalId: '4A';
    role: 'Evidence Validator';
  };
  secondaryAgent: {
    id: 'insight-analyst';
    name: 'Insight Analyst';
    internalId: '4B';
    role: 'Storyline Strategist';
  };
  executionOrder: ['data-analyst', 'insight-analyst'];
  sharedArtifacts: string[];
  mergeRequiredBeforeStage5: boolean;
}

/**
 * Checks if a stage is a dual-agent stage
 */
export function isDualAgentStage(stageId: number): stageId is 4 {
  return stageId === 4;
}

/**
 * Gets the dual-agent config for Stage 4
 */
export function getStage4Config(): Stage4AgentConfig {
  return {
    stageId: 4,
    stageName: 'Data & Research Analysis',
    isDualAgentStage: true,
    primaryAgent: {
      id: 'data-analyst',
      name: 'Data & Research Analyst',
      internalId: '4A',
      role: 'Evidence Validator',
    },
    secondaryAgent: {
      id: 'insight-analyst',
      name: 'Insight Analyst',
      internalId: '4B',
      role: 'Storyline Strategist',
    },
    executionOrder: ['data-analyst', 'insight-analyst'],
    sharedArtifacts: ['04-analysis.md'],
    mergeRequiredBeforeStage5: true,
  };
}

/**
 * AgentHandoffReference - Reference to a handoff
 */
export interface AgentHandoffReference {
  handoffId: string;
  fromAgent: AgentId;
  toAgent: AgentId;
  fromStage: number;
  toStage: number;
  completedAt: string;
}

/**
 * AgentArtifactReference - Reference to an artifact
 */
export interface AgentArtifactReference {
  artifactId: string;
  artifactType: string;
  fileName: string;
  createdAt: string;
  createdBy: AgentId;
  stageId: number;
}