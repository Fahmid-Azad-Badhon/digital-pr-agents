/**
 * =============================================================================
 * AGENT FEEDBACK SYSTEM - Feedback Loop Recording
 * =============================================================================
 * 
 * Records feedback on agent outputs for learning.
 * Supports workflow memory only - not model training.
 * 
 * =============================================================================
 */

import type { AgentId } from '@/types/agentBrain';

/**
 * Record feedback on an agent's output
 */
export function recordAgentFeedback(feedback: FeedbackInput): AgentFeedback {
  const newFeedback: AgentFeedback = {
    id: `fb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    campaignId: feedback.campaignId,
    workflowRunId: feedback.workflowRunId || `wf-${Date.now()}`,
    agentId: feedback.agentId,
    stageId: feedback.stageId,
    outputArtifactId: feedback.outputArtifactId,
    feedbackType: feedback.feedbackType,
    feedbackSource: feedback.feedbackSource || 'human',
    severity: getSeverityFromType(feedback.feedbackType),
    category: getCategoryFromType(feedback.feedbackType),
    notes: feedback.notes,
    details: feedback.details || [],
    suggestedCorrection: feedback.suggestedCorrection,
    createdAt: new Date().toISOString(),
  };
  
  // Store in memory (in production, would persist to DB)
  feedbackStore.push(newFeedback);
  
  return newFeedback;
}

/**
 * Get feedback for a specific campaign
 */
export function getAgentFeedbackForCampaign(campaignId: string): AgentFeedback[] {
  return feedbackStore.filter(f => f.campaignId === campaignId);
}

/**
 * Get feedback for a specific agent
 */
export function getAgentFeedbackForAgent(agentId: AgentId): AgentFeedback[] {
  return feedbackStore.filter(f => f.agentId === agentId);
}

/**
 * Get feedback for a specific stage
 */
export function getAgentFeedbackForStage(stageId: number): AgentFeedback[] {
  return feedbackStore.filter(f => f.stageId === stageId);
}

/**
 * Calculate feedback summary for an agent
 */
export function calculateAgentFeedbackSummary(agentId: AgentId): FeedbackSummary {
  const feedbacks = getAgentFeedbackForAgent(agentId);
  
  const approved = feedbacks.filter(f => f.feedbackType === 'approved').length;
  const rejected = feedbacks.filter(f => f.feedbackType === 'rejected').length;
  const revised = feedbacks.filter(f => f.feedbackType === 'revised').length;
  const hallucinationRisk = feedbacks.filter(f => f.feedbackType === 'hallucination-risk').length;
  const weakOutput = feedbacks.filter(f => f.feedbackType === 'weak-output').length;
  const highQuality = feedbacks.filter(f => f.feedbackType === 'high-quality-output').length;
  const needsEvidence = feedbacks.filter(f => f.feedbackType === 'needs-more-evidence').length;
  
  const severityScores: number[] = feedbacks.map(f => {
    switch (f.severity) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 2;
    }
  });
  
  const avgSeverity = severityScores.length > 0
    ? severityScores.reduce((a, b) => a + b, 0) / severityScores.length
    : 0;
  
  return {
    agentId,
    totalFeedback: feedbacks.length,
    approvedCount: approved,
    rejectedCount: rejected,
    revisionCount: revised,
    hallucinationRisks: hallucinationRisk,
    weakOutputs: weakOutput,
    highQualityOutputs: highQuality,
    needsMoreEvidence: needsEvidence,
    averageSeverity: avgSeverity,
  };
}

/**
 * Get recent feedback for improving future executions
 */
export function getLearningFeedbackForAgent(agentId: AgentId): LearningInsight[] {
  const feedbacks = getAgentFeedbackForAgent(agentId);
  
  const insights: LearningInsight[] = [];
  
  // Approved outputs become positive patterns
  const approvedFeedbacks = feedbacks.filter(f => f.feedbackType === 'approved');
  if (approvedFeedbacks.length > 0) {
    insights.push({
      insightType: 'positive-pattern',
      description: `${approvedFeedbacks.length} outputs approved - use as examples`,
      evidenceCount: approvedFeedbacks.length,
    });
  }
  
  // Rejected outputs become avoid patterns
  const rejectedFeedbacks = feedbacks.filter(f => f.feedbackType === 'rejected');
  if (rejectedFeedbacks.length > 0) {
    insights.push({
      insightType: 'avoid-pattern',
      description: `${rejectedFeedbacks.length} outputs rejected - avoid these patterns`,
      evidenceCount: rejectedFeedbacks.length,
    });
  }
  
  // Hallucination risks become critical warnings
  const hallucinationFeedbacks = feedbacks.filter(f => f.feedbackType === 'hallucination-risk');
  if (hallucinationFeedbacks.length > 0) {
    insights.push({
      insightType: 'critical-warning',
      description: `${hallucinationFeedbacks.length} hallucination risks detected - strengthen validation`,
      evidenceCount: hallucinationFeedbacks.length,
    });
  }
  
  return insights;
}

// In-memory feedback storage (would be DB in production)
const feedbackStore: AgentFeedback[] = [];

// Helper functions

function getSeverityFromType(type: FeedbackType): FeedbackSeverity {
  switch (type) {
    case 'hallucination-risk':
    case 'rejected':
      return 'critical';
    case 'weak-output':
    case 'needs-more-evidence':
      return 'high';
    case 'revised':
      return 'medium';
    case 'approved':
    case 'high-quality-output':
      return 'low';
    default:
      return 'medium';
  }
}

function getCategoryFromType(type: FeedbackType): FeedbackCategory {
  switch (type) {
    case 'hallucination-risk':
      return 'hallucination';
    case 'weak-output':
    case 'needs-more-evidence':
      return 'quality';
    case 'high-quality-output':
      return 'quality';
    case 'approved':
    case 'rejected':
    case 'revised':
      return 'accuracy';
    default:
      return 'accuracy';
  }
}

// Type definitions

export type FeedbackType = 
  | 'approved' 
  | 'rejected' 
  | 'revised' 
  | 'hallucination-risk' 
  | 'weak-output' 
  | 'high-quality-output' 
  | 'needs-more-evidence';

export type FeedbackSource = 'human' | 'auto-validator' | 'meta-auditor' | 'shadow-tester';

export type FeedbackSeverity = 'low' | 'medium' | 'high' | 'critical';

export type FeedbackCategory = 'accuracy' | 'relevance' | 'quality' | 'hallucination' | 'compliance' | 'style';

export interface FeedbackInput {
  campaignId: string;
  workflowRunId?: string;
  agentId: AgentId;
  stageId: number;
  outputArtifactId?: string;
  feedbackType: FeedbackType;
  feedbackSource?: FeedbackSource;
  notes: string;
  details?: FeedbackDetail[];
  suggestedCorrection?: string;
}

export interface AgentFeedback {
  id: string;
  campaignId: string;
  workflowRunId: string;
  agentId: AgentId;
  stageId: number;
  outputArtifactId?: string;
  feedbackType: FeedbackType;
  feedbackSource: FeedbackSource;
  severity: FeedbackSeverity;
  category: FeedbackCategory;
  notes: string;
  details: FeedbackDetail[];
  suggestedCorrection?: string;
  createdAt: string;
}

export interface FeedbackDetail {
  field: string;
  value: string;
  issue: string;
  suggestion?: string;
}

export interface FeedbackSummary {
  agentId: AgentId;
  totalFeedback: number;
  approvedCount: number;
  rejectedCount: number;
  revisionCount: number;
  hallucinationRisks: number;
  weakOutputs: number;
  highQualityOutputs: number;
  needsMoreEvidence: number;
  averageSeverity: number;
}

export interface LearningInsight {
  insightType: 'positive-pattern' | 'avoid-pattern' | 'critical-warning';
  description: string;
  evidenceCount: number;
}