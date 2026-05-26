/**
 * =============================================================================
 * AGENT FEEDBACK TYPES - Feedback Loop and Learning
 * =============================================================================
 * 
 * These types define the feedback loop for agent learning,
 * supporting the "learn from feedback" requirement.
 * 
 * =============================================================================
 */

import type { AgentId } from './agentBrain';

/**
 * FeedbackType - Type of feedback
 */
export type FeedbackType = 
  | 'approved' 
  | 'rejected' 
  | 'revised' 
  | 'hallucination-risk' 
  | 'weak-output' 
  | 'high-quality-output' 
  | 'needs-more-evidence';

/**
 * FeedbackSource - Source of feedback
 */
export type FeedbackSource = 'human' | 'auto-validator' | 'meta-auditor' | 'shadow-tester';

/**
 * FeedbackSeverity - Severity of feedback
 */
export type FeedbackSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * FeedbackCategory - Category of feedback
 */
export type FeedbackCategory = 
  | 'accuracy'
  | 'relevance'
  | 'quality'
  | 'hallucination'
  | 'compliance'
  | 'style';

/**
 * AgentFeedback - Feedback on agent output
 */
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
  resolvedAt?: string;
  resolution?: FeedbackResolution;
}

/**
 * FeedbackDetail - Detailed feedback information
 */
export interface FeedbackDetail {
  field: string;
  value: string;
  issue: string;
  suggestion?: string;
  evidence?: string[];
}

/**
 * FeedbackResolution - Resolution of feedback
 */
export interface FeedbackResolution {
  resolvedBy: AgentId;
  resolutionType: 'fixed' | 'accepted' | 'ignored';
  notes: string;
  resolvedAt: string;
}

/**
 * FeedbackSummary - Summary of feedback for an agent
 */
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
  topIssues: FeedbackIssueCount[];
}

/**
 * FeedbackIssueCount - Count of a specific issue
 */
export interface FeedbackIssueCount {
  issue: string;
  count: number;
  severity: FeedbackSeverity;
}

/**
 * LearnedRule - Rule learned from feedback
 */
export interface LearnedRule {
  id: string;
  ruleText: string;
  description: string;
  appliesToStage: number;
  appliesToAgent: AgentId;
  confidence: number;
  evidenceCount: number;
  source: 'human' | 'auto-validator' | 'meta-auditor';
  createdAt: string;
  lastUsedAt?: string;
  effectiveness?: RuleEffectiveness;
}

/**
 * RuleEffectiveness - Effectiveness of a learned rule
 */
export interface RuleEffectiveness {
  timesApplied: number;
  successRate: number;
  lastTestedAt?: string;
}

/**
 * FeedbackTrend - Trend analysis of feedback
 */
export interface FeedbackTrend {
  agentId: AgentId;
  periodStart: string;
  periodEnd: string;
  feedbackCount: number;
  trend: 'improving' | 'declining' | 'stable';
  changePercentage: number;
  keyIssues: string[];
}

/**
 * Create a new feedback entry
 */
export function createFeedback(
  campaignId: string,
  workflowRunId: string,
  agentId: AgentId,
  stageId: number,
  feedbackType: FeedbackType,
  feedbackSource: FeedbackSource,
  notes: string,
  outputArtifactId?: string
): AgentFeedback {
  return {
    id: `fb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    campaignId,
    workflowRunId,
    agentId,
    stageId,
    outputArtifactId,
    feedbackType,
    feedbackSource,
    severity: getSeverityFromType(feedbackType),
    category: getCategoryFromType(feedbackType),
    notes,
    details: [],
    createdAt: new Date().toISOString(),
  };
}

/**
 * Get severity from feedback type
 */
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

/**
 * Get category from feedback type
 */
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

/**
 * Resolve a feedback entry
 */
export function resolveFeedback(
  feedback: AgentFeedback,
  resolvedBy: AgentId,
  resolutionType: 'fixed' | 'accepted' | 'ignored',
  notes: string
): AgentFeedback {
  return {
    ...feedback,
    resolvedAt: new Date().toISOString(),
    resolution: {
      resolvedBy,
      resolutionType,
      notes,
      resolvedAt: new Date().toISOString(),
    },
  };
}

/**
 * Calculate feedback summary for an agent
 */
export function calculateFeedbackSummary(
  agentId: AgentId,
  feedbacks: AgentFeedback[]
): FeedbackSummary {
  const agentFeedbacks = feedbacks.filter(f => f.agentId === agentId);
  
  const approvedCount = agentFeedbacks.filter(f => f.feedbackType === 'approved').length;
  const rejectedCount = agentFeedbacks.filter(f => f.feedbackType === 'rejected').length;
  const revisionCount = agentFeedbacks.filter(f => f.feedbackType === 'revised').length;
  const hallucinationRisks = agentFeedbacks.filter(f => f.feedbackType === 'hallucination-risk').length;
  const weakOutputs = agentFeedbacks.filter(f => f.feedbackType === 'weak-output').length;
  const highQualityOutputs = agentFeedbacks.filter(f => f.feedbackType === 'high-quality-output').length;
  const needsMoreEvidence = agentFeedbacks.filter(f => f.feedbackType === 'needs-more-evidence').length;
  
  const severityValues: number[] = agentFeedbacks.map(f => {
    switch (f.severity) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 2;
    }
  });
  
  const averageSeverity = severityValues.length > 0
    ? severityValues.reduce((a, b) => a + b, 0) / severityValues.length
    : 0;
  
  // Calculate top issues
  const issueCounts: Record<string, number> = {};
  agentFeedbacks.forEach(f => {
    const key = `${f.category}:${f.feedbackType}`;
    issueCounts[key] = (issueCounts[key] || 0) + 1;
  });
  
  const topIssues = Object.entries(issueCounts)
    .map(([issue, count]) => ({
      issue,
      count,
      severity: agentFeedbacks.find(f => `${f.category}:${f.feedbackType}` === issue)?.severity || 'medium',
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  return {
    agentId,
    totalFeedback: agentFeedbacks.length,
    approvedCount,
    rejectedCount,
    revisionCount,
    hallucinationRisks,
    weakOutputs,
    highQualityOutputs,
    needsMoreEvidence,
    averageSeverity,
    topIssues,
  };
}

/**
 * Generate learned rule from feedback
 */
export function generateLearnedRule(
  feedbacks: AgentFeedback[],
  stageId: number,
  agentId: AgentId,
  minEvidenceCount: number = 3
): LearnedRule | null {
  // Find common issues with sufficient evidence
  const relevantFeedbacks = feedbacks.filter(
    f => f.stageId === stageId && 
         f.agentId === agentId && 
         f.resolution?.resolutionType === 'fixed'
  );
  
  if (relevantFeedbacks.length < minEvidenceCount) {
    return null;
  }
  
  // Analyze common patterns
  const commonCategories = relevantFeedbacks.map(f => f.category);
  const categoryCount: Record<string, number> = {};
  commonCategories.forEach(c => {
    categoryCount[c] = (categoryCount[c] || 0) + 1;
  });
  
  const topCategory = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])[0];
  
  if (!topCategory || topCategory[1] < minEvidenceCount) {
    return null;
  }
  
  const ruleId = `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id: ruleId,
    ruleText: `For stage ${stageId}, ensure ${topCategory[0]} is properly validated before output.`,
    description: `Learned from ${relevantFeedbacks.length} feedback instances where ${topCategory[0]} was flagged as an issue.`,
    appliesToStage: stageId,
    appliesToAgent: agentId,
    confidence: topCategory[1] / relevantFeedbacks.length,
    evidenceCount: topCategory[1],
    source: 'meta-auditor',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Analyze feedback trend
 */
export function analyzeFeedbackTrend(
  agentId: AgentId,
  feedbacks: AgentFeedback[],
  periodDays: number = 30
): FeedbackTrend {
  const now = new Date();
  const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
  const periodEnd = now;
  
  const agentFeedbacks = feedbacks.filter(
    f => f.agentId === agentId &&
         new Date(f.createdAt) >= periodStart &&
         new Date(f.createdAt) <= periodEnd
  );
  
  const previousPeriodStart = new Date(periodStart.getTime() - periodDays * 24 * 60 * 60 * 1000);
  const previousPeriodFeedbacks = feedbacks.filter(
    f => f.agentId === agentId &&
         new Date(f.createdAt) >= previousPeriodStart &&
         new Date(f.createdAt) < periodStart
  );
  
  // Calculate trend based on rejection rate
  const currentRejectionRate = agentFeedbacks.length > 0
    ? agentFeedbacks.filter(f => f.feedbackType === 'rejected').length / agentFeedbacks.length
    : 0;
  
  const previousRejectionRate = previousPeriodFeedbacks.length > 0
    ? previousPeriodFeedbacks.filter(f => f.feedbackType === 'rejected').length / previousPeriodFeedbacks.length
    : 0;
  
  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  const changePercentage = previousRejectionRate > 0
    ? ((currentRejectionRate - previousRejectionRate) / previousRejectionRate) * 100
    : 0;
  
  if (changePercentage < -10) trend = 'improving';
  else if (changePercentage > 10) trend = 'declining';
  
  // Get key issues
  const issueCounts: Record<string, number> = {};
  agentFeedbacks.forEach(f => {
    const key = f.category;
    issueCounts[key] = (issueCounts[key] || 0) + 1;
  });
  
  const keyIssues = Object.entries(issueCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([issue]) => issue);
  
  return {
    agentId,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    feedbackCount: agentFeedbacks.length,
    trend,
    changePercentage,
    keyIssues,
  };
}