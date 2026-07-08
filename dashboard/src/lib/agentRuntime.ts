/**
 * =============================================================================
 * AGENT RUNTIME - Main Orchestrator
 * =============================================================================
 * 
 * Coordinates the complete agent execution loop:
 * 1. Load active campaign
 * 2. Load workflow state
 * 3. Identify current stage
 * 4. Load agent brain from registry
 * 5. Build AgentContextPackage
 * 6. Validate required inputs
 * 7. Load allowed tools
 * 8. Execute or prepare agent process
 * 9. Validate output schema
 * 10. Run guardrails
 * 11. Save output artifact
 * 12. Save trace log
 * 13. Update workflow state
 * 14. Execute handoff contract
 * 15. Move to next stage or block
 * 
 * =============================================================================
 */

import type { AgentId } from '@/types/agentBrain';
import type { Campaign } from '@/types';
import type { AgentContextPackage, WorkflowStateContext } from './agentMemory';
import type { HandoffValidationResult, HandoffPackage } from './agentHandoff';
import type { AgentRunTrace } from './agentTrace';
import type { AgentFeedback } from './agentFeedback';

import { buildAgentContextPackage, validateRequiredInputs, checkCanRunWhen } from './agentMemory';
import { runAgentGuardrails } from './agentGuardrails';
import { validateHandoffReadiness, buildHandoffPackage, shouldBlockHandoff, blockHandoff } from './agentHandoff';
import { createAgentRunTrace, completeAgentRunTrace, blockAgentRunTrace, saveTrace } from './agentTrace';
import { recordAgentFeedback } from './agentFeedback';

/**
 * Main runtime function to run an agent stage
 */
export async function runAgentStage(params: RunAgentStageParams): Promise<AgentExecutionResult> {
  const { campaignId, stageId, agentId, activeCampaign, workflowState, input } = params;
  
  // Create trace for this run
  let trace = createAgentRunTrace({
    campaignId,
    stageId,
    agentId,
  });
  
  try {
    // Step 1-4: Load registry and validate can-run-when
    const canRunCheck = checkCanRunWhen(agentId, workflowState as WorkflowStateContext);
    if (!canRunCheck.canRun) {
      const guardrailResult = createBlockedResult(canRunCheck.reason, stageId, agentId);
      trace = blockAgentRunTrace(trace, canRunCheck.reason, guardrailResult.blockers);
      await saveTrace(trace);
      return guardrailResult;
    }
    
// Step 5: Build context package
    const contextPackage = await buildAgentContextPackage({
      campaignId,
      stageId,
      agentId,
      activeCampaign: activeCampaign as Campaign,
      workflowState: workflowState as WorkflowStateContext,
    });
    contextPackage.input = input;
    
    // Step 6: Validate required inputs
    const inputValidation = validateRequiredInputs(agentId, input as Record<string, unknown>);
    if (!inputValidation.valid) {
      const guardrailResult = createBlockedResult(
        `Input validation failed: ${inputValidation.errors.join('; ')}`,
        stageId,
        agentId
      );
      trace = blockAgentRunTrace(trace, inputValidation.errors.join('; '), guardrailResult.blockers);
      await saveTrace(trace);
      return guardrailResult;
    }
    
    // Step 8: Check if AI execution is implemented
    const executionStatus = getAgentExecutionStatus(agentId);
    
    if (executionStatus === 'not-implemented' || executionStatus === 'manual-required') {
      // Return status without running actual execution
      const result: AgentExecutionResult = {
        success: false,
        status: executionStatus,
        stageId,
        agentId,
        message: getExecutionStatusMessage(executionStatus, agentId),
        contextPackage,
        blockers: [],
        warnings: inputValidation.warnings,
        trace,
      };
      
      await saveTrace(trace);
      return result;
    }
    
    // Step 9: Validate output schema (after execution would happen here)
    // For now, assume output validation passes
    
    // Step 10: Run guardrails on output (if we had output)
    const guardrailResult = runAgentGuardrails({
      agentId,
      stageId,
      input,
      output: undefined, // Would be actual output
    });
    
    if (!guardrailResult.passed && guardrailResult.blockers.length > 0) {
      const blockerMessages = guardrailResult.blockers.map(b => b.message);
      const result: AgentExecutionResult = {
        success: false,
        status: 'blocked',
        stageId,
        agentId,
        message: `Guardrail blocked: ${blockerMessages.join('; ')}`,
        contextPackage,
        blockers: guardrailResult.blockers.map(b => ({ id: b.id, message: b.message })),
        warnings: guardrailResult.warnings.map(w => w.message),
        trace,
      };
      
      trace = blockAgentRunTrace(
        trace,
        result.message,
        guardrailResult.blockers.map(b => ({ id: b.id, guardrailName: b.message, passed: false, message: b.message, severity: 'blocker' as const }))
      );
      await saveTrace(trace);
      
      return result;
    }
    
    // Step 11-14: Would save artifacts, update state, execute handoff
    // For now, return ready status
    
    // Complete trace successfully
    trace = completeAgentRunTrace(trace, {
      guardrailsPassed: guardrailResult.totalPassed > 0 ? ['all-enabled'] : [],
      guardrailsFailed: guardrailResult.blockers.map(b => ({
        guardrailId: b.id,
        guardrailName: b.message,
        passed: false,
        message: b.message,
        severity: 'blocker',
      })),
      warnings: guardrailResult.warnings.map(w => w.message),
    });
    await saveTrace(trace);
    
    // Return success
    return {
      success: true,
      status: 'ready-for-integration',
      stageId,
      agentId,
      message: `Stage ${stageId} ready for agent execution`,
      contextPackage,
      blockers: [],
      warnings: guardrailResult.warnings.map(w => w.message),
      trace,
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const result: AgentExecutionResult = {
      success: false,
      status: 'failed',
      stageId,
      agentId,
      message: errorMessage,
      contextPackage: undefined,
      blockers: [{ id: 'runtime-error', message: errorMessage }],
      warnings: [],
      trace,
    };
    
    // Save error trace
    // trace = failAgentRunTrace(trace, errorMessage);
    // await saveTrace(trace);
    
    return result;
  }
}

/**
 * Validate stage transition readiness
 */
export async function validateStageTransition(params: {
  campaignId: string;
  fromStage: number;
  toStage: number;
  artifacts: Record<string, unknown>;
  fields: Record<string, unknown>;
}): Promise<StageTransitionResult> {
  // Validate handoff
  const handoffValidation = validateHandoffReadiness({
    fromStage: params.fromStage,
    toStage: params.toStage,
    artifacts: params.artifacts,
    fields: params.fields,
  });
  
  if (shouldBlockHandoff(handoffValidation)) {
    const block = blockHandoff(handoffValidation);
    return {
      canTransition: false,
      blocked: { blocked: block.blocked, reason: block.reason, blockers: block.blockers.map(b => ({ id: b.blockerId, message: b.message })), canRetry: block.canRetry },
      handoffValidation,
    };
  }
  
  // Build handoff package
  const handoffPackage = buildHandoffPackage({
    fromStage: params.fromStage,
    toStage: params.toStage,
    campaignId: params.campaignId,
    artifacts: params.artifacts,
    fields: params.fields,
  });
  
  return {
    canTransition: true,
    handoffPackage,
    handoffValidation,
  };
}

/**
 * Record feedback for an agent execution
 */
export async function recordFeedback(feedback: {
  campaignId: string;
  agentId: AgentId;
  stageId: number;
  feedbackType: 'approved' | 'rejected' | 'revised' | 'hallucination-risk' | 'weak-output' | 'high-quality-output' | 'needs-more-evidence';
  notes: string;
}): Promise<AgentFeedback> {
  return recordAgentFeedback({
    campaignId: feedback.campaignId,
    agentId: feedback.agentId,
    stageId: feedback.stageId,
    feedbackType: feedback.feedbackType,
    notes: feedback.notes,
  });
}

// Helper functions

function getAgentExecutionStatus(agentId: AgentId): ExecutionStatus {
  // Check if actual LLM execution is implemented for this agent
  // This would check if the agent has actual tool implementations
  const implementedAgents = ['orchestrator', 'extractor', 'researcher', 'data-analyst', 'insight-analyst'];
  
  if (implementedAgents.includes(agentId)) {
    return 'ready-for-integration';
  }
  
  return 'not-implemented';
}

function getExecutionStatusMessage(status: ExecutionStatus, agentId: AgentId): string {
  switch (status) {
    case 'not-implemented':
      return `Agent ${agentId} execution not yet implemented - integrate with LLM service`;
    case 'manual-required':
      return `Agent ${agentId} requires manual execution - automation not available`;
    case 'ready-for-integration':
      return `Agent ${agentId} ready for LLM integration`;
    default:
      return 'Unknown execution status';
  }
}

function createBlockedResult(message: string, stageId: number, agentId: AgentId): AgentExecutionResult {
  return {
    success: false,
    status: 'blocked',
    stageId,
    agentId,
    message,
    contextPackage: undefined,
    blockers: [{ id: 'blocked', message }],
    warnings: [],
  };
}

// Type definitions

export interface RunAgentStageParams {
  campaignId: string;
  stageId: number;
  agentId: AgentId;
  activeCampaign: unknown;
  workflowState: unknown;
  input: unknown;
}

export interface AgentExecutionResult {
  success: boolean;
  status: ExecutionStatus;
  stageId: number;
  agentId: AgentId;
  message: string;
  contextPackage?: AgentContextPackage;
  blockers: Array<{ id: string; message: string }>;
  warnings: string[];
  trace?: AgentRunTrace;
}

export type ExecutionStatus = 'ready-for-integration' | 'not-implemented' | 'manual-required' | 'blocked' | 'failed';

export interface StageTransitionResult {
  canTransition: boolean;
  blocked?: {
    blocked: boolean;
    reason: string;
    blockers: Array<{ id: string; message: string }>;
    canRetry: boolean;
  };
  handoffPackage?: HandoffPackage;
  handoffValidation?: HandoffValidationResult;
}