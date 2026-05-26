/**
 * =============================================================================
 * WORKFLOW INTEGRATION - Connects Agent Runtime to Workflow API
 * =============================================================================
 * 
 * This layer connects the Agent Brain runtime system to the existing
 * workflow API for stage progression and execution.
 * 
 * =============================================================================
 */

import { runAgentStage, type AgentExecutionResult } from './agentRuntime';
import { legacyToAgentBrain, getStageMapping, getPrimaryAgentForStage } from './stageMapping';
import type { Campaign, WorkflowStage } from '@/types';
import type { AgentId } from '@/types/agentBrain';

export interface WorkflowProgressRequest {
  campaignId: string;
  legacyStageId: number;
  action: 'validate' | 'execute' | 'advance';
  campaign: Campaign;
  workflowState?: WorkflowStage[];
}

export interface WorkflowProgressResult {
  success: boolean;
  canAdvance: boolean;
  currentStage: number;
  agentResult?: AgentExecutionResult;
  errors: string[];
  warnings: string[];
  nextStage?: number;
}

/**
 * Validate if a stage can advance based on Agent Brain guardrails and handoffs
 */
export async function validateStageTransition(params: WorkflowProgressRequest): Promise<WorkflowProgressResult> {
  const { campaignId, legacyStageId, campaign } = params;
  
  const agentBrainStageId = legacyToAgentBrain(legacyStageId);
  if (!agentBrainStageId) {
    return {
      success: false,
      canAdvance: false,
      currentStage: legacyStageId,
      errors: [`No Agent Brain mapping for legacy stage ${legacyStageId}`],
      warnings: [],
    };
  }
  
  const primaryAgentId = getPrimaryAgentForStage(agentBrainStageId);
  const mapping = getStageMapping(agentBrainStageId);
  
  // Run agent validation (not execution - just validation)
  try {
    const agentResult = await runAgentStage({
      campaignId,
      stageId: agentBrainStageId,
      agentId: primaryAgentId as AgentId,
      activeCampaign: campaign,
      workflowState: {},
      input: undefined,
    });
    
    const canAdvance = agentResult.success && agentResult.status !== 'blocked';
    
    return {
      success: agentResult.success,
      canAdvance,
      currentStage: legacyStageId,
      agentResult,
      errors: agentResult.blockers.map(b => b.message),
      warnings: agentResult.warnings,
      nextStage: canAdvance ? legacyStageId + 1 : undefined,
    };
  } catch (error) {
    return {
      success: false,
      canAdvance: false,
      currentStage: legacyStageId,
      errors: [`Runtime error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: [],
    };
  }
}

/**
 * Execute a stage using the Agent Brain runtime
 */
export async function executeStage(params: WorkflowProgressRequest): Promise<WorkflowProgressResult> {
  const { campaignId, legacyStageId, campaign } = params;
  
  const agentBrainStageId = legacyToAgentBrain(legacyStageId);
  if (!agentBrainStageId) {
    return {
      success: false,
      canAdvance: false,
      currentStage: legacyStageId,
      errors: [`No Agent Brain mapping for legacy stage ${legacyStageId}`],
      warnings: [],
    };
  }
  
  const primaryAgentId = getPrimaryAgentForStage(agentBrainStageId);
  
  try {
    const agentResult = await runAgentStage({
      campaignId,
      stageId: agentBrainStageId,
      agentId: primaryAgentId as AgentId,
      activeCampaign: campaign,
      workflowState: {},
      input: undefined,
    });
    
    return {
      success: agentResult.success,
      canAdvance: agentResult.status === 'ready-for-integration',
      currentStage: legacyStageId,
      agentResult,
      errors: agentResult.blockers.map(b => b.message),
      warnings: agentResult.warnings,
    };
  } catch (error) {
    return {
      success: false,
      canAdvance: false,
      currentStage: legacyStageId,
      errors: [`Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: [],
    };
  }
}

/**
 * Get stage information from Agent Brain perspective
 */
export function getStageInfo(stageId: number) {
  const mapping = getStageMapping(stageId);
  if (!mapping) return null;
  
  return {
    legacyId: mapping.legacyId,
    agentBrainId: mapping.agentBrainId,
    legacyName: mapping.legacyName,
    agentBrainName: mapping.agentBrainName,
    primaryAgent: mapping.primaryAgent,
    hasInternalAgents: mapping.internalAgents && mapping.internalAgents.length > 0,
    internalAgents: mapping.internalAgents || [],
    description: mapping.description,
  };
}

/**
 * Validate handoff between two stages
 */
export async function validateHandoff(fromStage: number, toStage: number): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const fromBrainId = legacyToAgentBrain(fromStage);
  const toBrainId = legacyToAgentBrain(toStage);
  
  if (!fromBrainId || !toBrainId) {
    return {
      valid: false,
      errors: [`Invalid stage mapping: ${fromStage} -> ${toStage}`],
      warnings: [],
    };
  }
  
  // Import handoff validation from agentHandoff
  const { validateHandoffReadiness } = await import('./agentHandoff');
  
  const result = validateHandoffReadiness({
    fromStage: fromBrainId,
    toStage: toBrainId,
    artifacts: {},
    fields: {},
  });
  
  return {
    valid: result.blockers.length === 0,
    errors: result.blockers.map(b => b.message),
    warnings: result.warnings,
  };
}

/**
 * Get available actions for a stage based on Agent Brain status
 */
export function getStageActions(stageId: number, agentResult?: AgentExecutionResult): {
  canValidate: boolean;
  canExecute: boolean;
  canAdvance: boolean;
  requiresManualApproval: boolean;
  status: string;
} {
  if (!agentResult) {
    return {
      canValidate: true,
      canExecute: false,
      canAdvance: false,
      requiresManualApproval: false,
      status: 'not-started',
    };
  }
  
  switch (agentResult.status) {
    case 'ready-for-integration':
      return {
        canValidate: true,
        canExecute: true,
        canAdvance: true,
        requiresManualApproval: false,
        status: 'ready',
      };
    case 'not-implemented':
      return {
        canValidate: true,
        canExecute: false,
        canAdvance: false,
        requiresManualApproval: true,
        status: 'manual-required',
      };
    case 'blocked':
      return {
        canValidate: true,
        canExecute: false,
        canAdvance: false,
        requiresManualApproval: false,
        status: 'blocked',
      };
    case 'manual-required':
      return {
        canValidate: true,
        canExecute: false,
        canAdvance: false,
        requiresManualApproval: true,
        status: 'manual',
      };
    default:
      return {
        canValidate: true,
        canExecute: false,
        canAdvance: false,
        requiresManualApproval: false,
        status: 'unknown',
      };
  }
}