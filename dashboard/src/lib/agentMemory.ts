/**
 * =============================================================================
 * AGENT MEMORY SYSTEM - Context Package Building and Memory Access
 * =============================================================================
 * 
 * Builds AgentContextPackage for each agent run.
 * Respects memory contracts - agents only get what they're allowed to see.
 * 
 * =============================================================================
 */

import type { AgentId } from '@/types/agentBrain';
import type { Campaign } from '@/types';
import { AGENT_BRAIN_REGISTRY, type AgentBrainRegistryEntry } from '@/data/agentBrainRegistry';
import { DEFAULT_MEMORY_CONTRACTS } from '@/types/agentMemory';

/**
 * Build a complete AgentContextPackage for an agent execution
 */
export async function buildAgentContextPackage(params: {
  campaignId: string;
  stageId: number;
  agentId: AgentId;
  workflowRunId?: string;
  activeCampaign: Campaign;
  workflowState: WorkflowStateContext;
}): Promise<AgentContextPackage> {
  const { campaignId, stageId, agentId, workflowRunId, activeCampaign, workflowState } = params;
  
  // Get registry entry for the agent
  const registryEntry = getAgentRegistryEntry(agentId);
  if (!registryEntry) {
    throw new Error(`Agent ${agentId} not found in registry`);
  }
  
  // Get memory contract for the agent
  const memoryContract = DEFAULT_MEMORY_CONTRACTS[agentId];
  
  // Build the context package
  const contextPackage: AgentContextPackage = {
    workflowRunId: workflowRunId || `wf-${Date.now()}`,
    campaignId,
    stageId,
    stageName: getStageName(stageId),
    agentId,
    agentName: registryEntry.agentName,
    activeCampaign: activeCampaign as Campaign,
    workflowState: workflowState as unknown as AgentWorkflowState,
    allowedMemoryKeys: memoryContract.allowedMemoryKeys.map(m => m.key),
    shortTermMemory: await loadShortTermMemory(campaignId, stageId),
    campaignMemory: await loadCampaignMemory(campaignId),
    previousArtifacts: await getPreviousArtifactsForStage(campaignId, stageId),
    input: undefined, // Set by caller
    allowedTools: registryEntry.allowedTools,
    requiredOutputs: getRequiredOutputsForAgent(agentId),
    guardrails: getGuardrailsForAgent(agentId),
    executionId: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
  
  return contextPackage;
}

/**
 * Get allowed memory keys for an agent
 */
export function getAllowedMemoryForAgent(agentId: AgentId): string[] {
  const contract = DEFAULT_MEMORY_CONTRACTS[agentId];
  return contract.allowedMemoryKeys.map(m => m.key);
}

/**
 * Get previous artifacts for a stage
 */
export async function getPreviousArtifactsForStage(
  campaignId: string,
  stageId: number
): Promise<AgentArtifactReference[]> {
  const artifacts: AgentArtifactReference[] = [];
  
  // Map stage to its input artifacts (output of previous stage)
  const stageToArtifacts: Record<number, { fileName: string; artifactId: string }[]> = {
    2: [{ fileName: '00-brief.md', artifactId: 'campaign-brief' }],
    3: [{ fileName: '02-insights.md', artifactId: 'extracted-insights' }],
    4: [{ fileName: '03-research.md', artifactId: 'research-enrichment' }],
    5: [{ fileName: '04-analysis.md', artifactId: 'analysis-complete' }],
    6: [{ fileName: '04-angles.md', artifactId: 'pitch-angles' }],
    7: [{ fileName: '05-beats.md', artifactId: 'beat-mapping' }],
    8: [{ fileName: '04-angles-selected.md', artifactId: 'approved-angles' }],
    9: [{ fileName: 'journalists.json', artifactId: 'journalist-list' }],
    10: [{ fileName: '06-journalist-intel.md', artifactId: 'journalist-profiles' }],
    11: [{ fileName: '08-pitch-draft.md', artifactId: 'pitch-draft' }],
    12: [{ fileName: '09-optimized-email.md', artifactId: 'optimized-email' }],
    14: [{ fileName: 'final-package.md', artifactId: 'final-package' }],
    15: [{ fileName: 'validation-results.json', artifactId: 'validation-results' }],
    16: [{ fileName: 'browser-validation.json', artifactId: 'browser-validation' }],
  };
  
  const previousStageArtifacts = stageToArtifacts[stageId];
  if (!previousStageArtifacts) {
    return artifacts;
  }
  
  for (const artifact of previousStageArtifacts) {
    artifacts.push({
      artifactId: artifact.artifactId,
      artifactType: artifact.fileName.split('.').pop() || 'unknown',
      fileName: artifact.fileName,
      createdAt: new Date().toISOString(), // Would come from actual artifact storage
      createdBy: getPreviousAgent(stageId) as AgentId,
      stageId: stageId - 1,
    });
  }
  
  return artifacts;
}

/**
 * Validate required inputs for an agent
 */
export function validateRequiredInputs(
  agentId: AgentId,
  input: Record<string, unknown>
): ValidationResult {
  const registryEntry = getAgentRegistryEntry(agentId);
  if (!registryEntry) {
    return { valid: false, errors: [`Agent ${agentId} not found in registry`], warnings: [] };
  }
  
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check required inputs
  for (const requiredInput of registryEntry.requiredInputs) {
    if (!(requiredInput in input) || input[requiredInput] === undefined || input[requiredInput] === null) {
      errors.push(`Missing required input: ${requiredInput}`);
    }
  }
  
  // Check must-stop-when conditions
  for (const stopCondition of registryEntry.mustStopWhen) {
    if (matchesStopCondition(stopCondition, input)) {
      errors.push(`Blocking condition met: ${stopCondition}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if can-run-when conditions are met
 */
export function checkCanRunWhen(
  agentId: AgentId,
  workflowState: WorkflowStateContext
): { canRun: boolean; reason: string } {
  const registryEntry = getAgentRegistryEntry(agentId);
  if (!registryEntry) {
    return { canRun: false, reason: `Agent ${agentId} not found` };
  }
  
  for (const condition of registryEntry.canRunWhen) {
    if (!matchesRunCondition(condition, workflowState)) {
      return { canRun: false, reason: `Condition not met: ${condition}` };
    }
  }
  
  return { canRun: true, reason: 'All conditions met' };
}

// Helper functions

function getAgentRegistryEntry(agentId: AgentId): AgentBrainRegistryEntry | undefined {
  return AGENT_BRAIN_REGISTRY.find(e => e.agentId === agentId);
}

function getStageName(stageId: number): string {
  const stageNames: Record<number, string> = {
    1: 'Campaign Intake',
    2: 'Data Extraction',
    3: 'Research Enrichment',
    4: 'Data & Research Analysis',
    5: 'Angle Generation',
    6: 'Beat Matching',
    7: 'Pitch Selection',
    8: 'Journalist Collection',
    9: 'Journalist Intelligence',
    10: 'Pitch Drafting',
    11: 'Email Optimization',
    12: 'Final Package',
    13: 'Google Doc Export',
    14: 'Technical Validation',
    15: 'Browser Validation',
    16: 'Regression & Production',
  };
  return stageNames[stageId] || `Stage ${stageId}`;
}

function getPreviousAgent(stageId: number): string {
  const agentMap: Record<number, string> = {
    2: 'orchestrator',
    3: 'extractor',
    4: 'researcher',
    5: 'insight-analyst',
    6: 'strategist',
    7: 'beat-matcher',
    8: 'human-reviewer',
    9: 'collector',
    10: 'intelligence',
    11: 'copywriter',
    12: 'optimizer',
    14: 'orchestrator',
    15: 'validator',
    16: 'collector',
  };
  return agentMap[stageId] || 'unknown';
}

function getRequiredOutputsForAgent(agentId: AgentId): string[] {
  const entry = getAgentRegistryEntry(agentId);
  return entry?.outputArtifacts || [];
}

function getGuardrailsForAgent(agentId: AgentId): string[] {
  const entry = getAgentRegistryEntry(agentId);
  return entry?.guardrailIds || [];
}

async function loadShortTermMemory(campaignId: string, stageId: number): Promise<Record<string, unknown>> {
  // In production, this would load from actual memory store
  // For now, return empty - actual implementation would query Redis/DB
  return {
    currentStage: stageId,
    workflowRunId: `wf-${Date.now()}`,
  };
}

async function loadCampaignMemory(campaignId: string): Promise<Record<string, unknown>> {
  // In production, this would load campaign-specific memory
  return {
    campaignId,
  };
}

function matchesStopCondition(condition: string, input: Record<string, unknown>): boolean {
  // Simple pattern matching for stop conditions
  if (condition.includes('missing') && condition.includes('campaignId')) {
    return !input.campaignId;
  }
  if (condition.includes('missing') && condition.includes('internalDataMap')) {
    return !input.internalDataMap;
  }
  if (condition.includes('missing') && condition.includes('researchEnrichment')) {
    return !input.researchEnrichment;
  }
  return false;
}

function matchesRunCondition(condition: string, state: WorkflowStateContext): boolean {
  // Simple pattern matching for run conditions
  if (condition.includes('completed')) {
    const stageNum = parseInt(condition.match(/S(\d+)/)?.[1] || '0');
    return state.completedStages.includes(stageNum);
  }
  if (condition.includes('approved')) {
    return state.humanGatePassed === true;
  }
  return true;
}

// Type exports

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
  guardrails: string[];
  executionId: string;
}

export interface AgentWorkflowState {
  currentStage: number;
  completedStages: number[];
  currentPhase: string;
  activeAgents: string[];
  campaignStatus: string;
  stageStatuses: Record<number, string>;
  lastHandoff?: unknown;
  recentLogs: unknown[];
}

export interface WorkflowStateContext {
  currentStage: number;
  completedStages: number[];
  humanGatePassed?: boolean;
  [key: string]: unknown;
}

export interface AgentArtifactReference {
  artifactId: string;
  artifactType: string;
  fileName: string;
  createdAt: string;
  createdBy: string;
  stageId: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}