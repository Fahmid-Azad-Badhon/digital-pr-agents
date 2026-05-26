/**
 * =============================================================================
 * AGENT TRACE TYPES - Trace Logs for Execution History
 * =============================================================================
 * 
 * These types define trace logging for agent execution,
 * supporting the "log what happened" requirement.
 * 
 * =============================================================================
 */

import type { AgentId } from './agentBrain';

/**
 * TraceStatus - Status of an agent run
 */
export type TraceStatus = 'started' | 'completed' | 'blocked' | 'failed';

/**
 * TraceInputArtifact - Input artifact for trace
 */
export interface TraceInputArtifact {
  artifactId: string;
  fileName: string;
  size: number;
  checksum: string;
}

/**
 * TraceToolUsage - Record of tool usage
 */
export interface TraceToolUsage {
  toolId: string;
  toolName: string;
  input: unknown;
  output?: unknown;
  error?: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  hallucinationsDetected?: boolean;
}

/**
 * TraceOutputArtifact - Output artifact from trace
 */
export interface TraceOutputArtifact {
  artifactId: string;
  fileName: string;
  artifactType: string;
  size: number;
  checksum: string;
  createdAt: string;
}

/**
 * TraceGuardrailResult - Result of a guardrail check
 */
export interface TraceGuardrailResult {
  guardrailId: string;
  guardrailName: string;
  passed: boolean;
  message?: string;
  severity?: 'warning' | 'blocker';
}

/**
 * AgentRunTrace - Complete trace of an agent execution
 */
export interface AgentRunTrace {
  runId: string;
  campaignId: string;
  workflowRunId: string;
  stageId: number;
  stageName: string;
  agentId: AgentId;
  agentName: string;
  executionId: string;
  parentExecutionId?: string;
  status: TraceStatus;
  inputArtifacts: TraceInputArtifact[];
  toolsUsed: TraceToolUsage[];
  outputArtifacts: TraceOutputArtifact[];
  guardrailsPassed: string[];
  guardrailsFailed: TraceGuardrailResult[];
  warnings: string[];
  errorMessage?: string;
  errorStack?: string;
  handoffTarget?: {
    agentId: AgentId;
    stageId: number;
    status: 'pending' | 'completed' | 'failed';
  };
  metadata: TraceMetadata;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
}

/**
 * TraceMetadata - Additional metadata for trace
 */
export interface TraceMetadata {
  modelUsed?: string;
  temperature?: number;
  tokenCount?: {
    input: number;
    output: number;
    total: number;
  };
  retryCount: number;
  fallbackUsed: boolean;
  stageSpecificData?: Record<string, unknown>;
}

/**
 * TraceSummary - Summary view of a trace
 */
export interface TraceSummary {
  runId: string;
  campaignId: string;
  stageName: string;
  agentName: string;
  status: TraceStatus;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  artifactsCreated: number;
  toolsUsed: number;
  guardrailsPassed: number;
  guardrailsFailed: number;
}

/**
 * WorkflowRunTrace - Complete trace of a workflow run
 */
export interface WorkflowRunTrace {
  workflowRunId: string;
  campaignId: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  status: 'running' | 'completed' | 'failed' | 'paused';
  stageTraces: AgentRunTrace[];
  overallMetrics: WorkflowMetrics;
}

/**
 * WorkflowMetrics - Metrics for workflow execution
 */
export interface WorkflowMetrics {
  totalStages: number;
  completedStages: number;
  failedStages: number;
  totalRuntimeMs: number;
  totalTokensUsed: number;
  totalToolCalls: number;
  totalGuardrails: number;
  guardrailsPassed: number;
  guardrailsFailed: number;
}

/**
 * Create a new trace for an agent run
 */
export function createAgentRunTrace(
  campaignId: string,
  workflowRunId: string,
  stageId: number,
  stageName: string,
  agentId: AgentId,
  agentName: string
): AgentRunTrace {
  return {
    runId: `run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    campaignId,
    workflowRunId,
    stageId,
    stageName,
    agentId,
    agentName,
    executionId: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    status: 'started',
    inputArtifacts: [],
    toolsUsed: [],
    outputArtifacts: [],
    guardrailsPassed: [],
    guardrailsFailed: [],
    warnings: [],
    metadata: {
      retryCount: 0,
      fallbackUsed: false,
    },
    startedAt: new Date().toISOString(),
  };
}

/**
 * Complete a trace with results
 */
export function completeAgentRunTrace(
  trace: AgentRunTrace,
  status: TraceStatus,
  outputArtifacts?: TraceOutputArtifact[],
  errorMessage?: string,
  errorStack?: string
): AgentRunTrace {
  const completedAt = new Date().toISOString();
  const durationMs = new Date(completedAt).getTime() - new Date(trace.startedAt).getTime();
  
  return {
    ...trace,
    status,
    outputArtifacts: outputArtifacts || trace.outputArtifacts,
    errorMessage,
    errorStack,
    completedAt,
    durationMs,
  };
}

/**
 * Add tool usage to trace
 */
export function addToolUsageToTrace(
  trace: AgentRunTrace,
  toolUsage: TraceToolUsage
): AgentRunTrace {
  return {
    ...trace,
    toolsUsed: [...trace.toolsUsed, toolUsage],
  };
}

/**
 * Add guardrail result to trace
 */
export function addGuardrailResultToTrace(
  trace: AgentRunTrace,
  result: TraceGuardrailResult
): AgentRunTrace {
  if (result.passed) {
    return {
      ...trace,
      guardrailsPassed: [...trace.guardrailsPassed, result.guardrailId],
    };
  }
  
  return {
    ...trace,
    guardrailsFailed: [...trace.guardrailsFailed, result],
  };
}

/**
 * Add warning to trace
 */
export function addWarningToTrace(
  trace: AgentRunTrace,
  warning: string
): AgentRunTrace {
  return {
    ...trace,
    warnings: [...trace.warnings, warning],
  };
}

/**
 * Create workflow run trace
 */
export function createWorkflowRunTrace(
  campaignId: string
): WorkflowRunTrace {
  const workflowRunId = `wf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    workflowRunId,
    campaignId,
    startedAt: new Date().toISOString(),
    status: 'running',
    stageTraces: [],
    overallMetrics: {
      totalStages: 16,
      completedStages: 0,
      failedStages: 0,
      totalRuntimeMs: 0,
      totalTokensUsed: 0,
      totalToolCalls: 0,
      totalGuardrails: 0,
      guardrailsPassed: 0,
      guardrailsFailed: 0,
    },
  };
}

/**
 * Add stage trace to workflow trace
 */
export function addStageTraceToWorkflow(
  workflowTrace: WorkflowRunTrace,
  stageTrace: AgentRunTrace
): WorkflowRunTrace {
  const updatedStageTraces = [...workflowTrace.stageTraces, stageTrace];
  
  // Recalculate metrics
  const completedStages = updatedStageTraces.filter(t => t.status === 'completed').length;
  const failedStages = updatedStageTraces.filter(t => t.status === 'failed').length;
  const totalRuntimeMs = updatedStageTraces.reduce((sum, t) => sum + (t.durationMs || 0), 0);
  const totalTokensUsed = updatedStageTraces.reduce((sum, t) => sum + (t.metadata.tokenCount?.total || 0), 0);
  const totalToolCalls = updatedStageTraces.reduce((sum, t) => sum + t.toolsUsed.length, 0);
  const totalGuardrails = updatedStageTraces.reduce((sum, t) => t.guardrailsPassed.length + t.guardrailsFailed.length + sum, 0);
  const guardrailsPassed = updatedStageTraces.reduce((sum, t) => sum + t.guardrailsPassed.length, 0);
  const guardrailsFailed = updatedStageTraces.reduce((sum, t) => sum + t.guardrailsFailed.length, 0);
  
  // Determine overall status
  let status: WorkflowRunTrace['status'] = 'running';
  if (failedStages > 0) status = 'failed';
  else if (completedStages === 16) status = 'completed';
  
  return {
    ...workflowTrace,
    stageTraces: updatedStageTraces,
    status,
    completedAt: status !== 'running' ? new Date().toISOString() : undefined,
    durationMs: status !== 'running' ? totalRuntimeMs : undefined,
    overallMetrics: {
      ...workflowTrace.overallMetrics,
      completedStages,
      failedStages,
      totalRuntimeMs,
      totalTokensUsed,
      totalToolCalls,
      totalGuardrails,
      guardrailsPassed,
      guardrailsFailed,
    },
  };
}

/**
 * Export trace to JSON-serializable format
 */
export function serializeTrace(trace: AgentRunTrace): string {
  // Truncate large outputs for storage
  const truncated = {
    ...trace,
    toolsUsed: trace.toolsUsed.map(t => ({
      ...t,
      input: truncateForStorage(t.input, 1000),
      output: truncateForStorage(t.output, 2000),
    })),
  };
  
  return JSON.stringify(truncated, null, 2);
}

function truncateForStorage(data: unknown, maxLength: number): unknown {
  if (typeof data === 'string' && data.length > maxLength) {
    return data.substring(0, maxLength) + `... [truncated, original length: ${data.length}]`;
  }
  return data;
}