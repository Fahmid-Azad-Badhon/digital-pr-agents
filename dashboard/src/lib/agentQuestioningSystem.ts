/**
 * =============================================================================
 * AGENT QUESTIONING SYSTEM MODULE
 * =============================================================================
 * 
 * Enables structured agent-to-agent questioning for context clarification,
 * verification, and handoff without guessing or hallucinating.
 * 
 * =============================================================================
 */

import fs from 'fs/promises';
import path from 'path';
import { PITCH_JOBS_ROOT } from '@/lib/requestGuard';

const CAMPAIGNS_DIR = PITCH_JOBS_ROOT;

const SYSTEM_DIR = path.join(path.dirname(PITCH_JOBS_ROOT), 'system');

// =============================================================================
// QUESTION BANK TYPES
// =============================================================================

export interface QuestionBankTemplate {
  questionTemplateId: string;
  issueType: string;
  askingAgent: string;
  ownerAgent: string;
  fallbackOwner?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  blocking: boolean;
  exactQuestion: string;
  whenToAsk: string;
  requiredContextFields: string[];
  requiredAnswerFields: string[];
  expectedAnswerFormat: 'json' | 'text';
}

export interface QuestionBank {
  version: string;
  purpose: string;
  rules: string[];
  questionTemplates: QuestionBankTemplate[];
  v1MinimumQuestions: string[];
}

// =============================================================================
// QUESTION BANK LOADING
// =============================================================================

async function loadQuestionBank(): Promise<QuestionBank | null> {
  const bankPath = path.join(SYSTEM_DIR, 'agent-question-bank.json');
  try {
    const data = await fs.readFile(bankPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load question bank:', error);
    return null;
  }
}

export async function getApprovedQuestionsForAgent(askingAgent: string): Promise<QuestionBankTemplate[]> {
  const bank = await loadQuestionBank();
  if (!bank) return [];
  return bank.questionTemplates.filter(t => t.askingAgent === askingAgent);
}

export async function getQuestionTemplate(templateId: string): Promise<QuestionBankTemplate | null> {
  const bank = await loadQuestionBank();
  if (!bank) return null;
  return bank.questionTemplates.find(t => t.questionTemplateId === templateId) || null;
}

export async function canAskQuestion(askingAgent: string, templateId: string): Promise<{ allowed: boolean; reason?: string }> {
  const template = await getQuestionTemplate(templateId);
  if (!template) {
    return { allowed: false, reason: 'Question template not found' };
  }
  if (template.askingAgent !== askingAgent) {
    return { allowed: false, reason: `${askingAgent} is not authorized to ask template ${templateId}` };
  }
  return { allowed: true };
}

// =============================================================================
// TYPES
// =============================================================================

export interface AgentQuestion {
  questionId: string;
  threadId: string;
  status: 'open' | 'answered' | 'resolved' | 'reopened' | 'escalated' | 'blocked' | 'cancelled' | 'stale';
  askingStageId: string;
  askingAgent: string;
  targetStageId: string;
  targetAgent: string;
  issueType: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  blocking: boolean;
  createdAt: string;
  updatedAt: string;
  relatedFiles: string[];
  relatedClaimIds: string[];
  relatedStatIds: string[];
  relatedJournalistIds: string[];
  exactQuestion: string;
  contextForTargetAgent: Record<string, any>;
  expectedAnswerFormat: 'json' | 'text';
  requiredAnswerFields: string[];
  canAskingAgentContinueWithoutAnswer: boolean;
  escalationTargetIfUnanswered: string | null;
  humanEscalationAllowed: boolean;
  notes: string[];
}

export interface AgentAnswer {
  answerId: string;
  questionId: string;
  threadId: string;
  status: 'answered' | 'insufficient' | 'needs_human_review' | 'cannot_answer' | 'blocked';
  answeringStageId: string;
  answeringAgent: string;
  answeredAt: string;
  directAnswer: string;
  structuredAnswer: Record<string, any>;
  evidenceFilesUsed: string[];
  sourceIdsUsed: string[];
  claimIdsUsed: string[];
  confidence: 'high' | 'medium' | 'low';
  limitations: string[];
  canOriginalAgentContinue: boolean;
  recommendedNextStage: string | null;
  requiresHumanReview: boolean;
  notes: string[];
}

export interface QuestionThread {
  threadId: string;
  createdAt: string;
  updatedAt: string;
  status: 'open' | 'resolved' | 'blocked' | 'escalated';
  issueType: string;
  blocking: boolean;
  askingStageId: string;
  currentTargetStageId: string;
  events: {
    timestamp: string;
    eventType: string;
    byStageId: string;
    details: string;
  }[];
}

export interface ContextResolutionStatus {
  campaignSlug: string;
  updatedAt: string;
  summary: {
    totalQuestions: number;
    openQuestions: number;
    blockingQuestions: number;
    answeredQuestions: number;
    resolvedQuestions: number;
    humanQuestionsPending: number;
  };
  canWorkflowContinue: boolean;
  blockedStages: string[];
  pendingQuestions: string[];
  resolvedQuestions: string[];
  humanActionRequired: boolean;
  nextRecommendedAction: string;
}

export interface PendingHumanQuestion {
  questionId: string;
  threadId: string;
  askedByStageId: string;
  priority: string;
  blocking: boolean;
  question: string;
  answerType: 'text' | 'choice' | 'multi_choice' | 'file_upload' | 'approval';
  options: string[];
  defaultAssumptionIfSkipped: string | null;
  canSkip: boolean;
  createdAt: string;
}

// =============================================================================
// CONFIG LOADING
// =============================================================================

async function loadRoutingRules() {
  const routingPath = path.join(SYSTEM_DIR, 'agent-question-routing.json');
  try {
    const data = await fs.readFile(routingPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { routingRules: [] };
  }
}

// =============================================================================
// QUESTION CREATION
// =============================================================================

export function generateQuestionId(stageId: string): string {
  return `Q-${stageId}-${Date.now()}`;
}

export function generateThreadId(): string {
  return `QT-${Date.now()}`;
}

export async function createQuestion(
  campaignSlug: string,
  question: Omit<AgentQuestion, 'questionId' | 'threadId' | 'createdAt' | 'updatedAt' | 'status'>
): Promise<AgentQuestion> {
  const campaignPath = path.join(CAMPAIGNS_DIR, campaignSlug);
  const questionsPath = path.join(campaignPath, 'agent-questions.json');
  
  let existing: { questions: AgentQuestion[] } = { questions: [] };
  try {
    const data = await fs.readFile(questionsPath, 'utf-8');
    existing = JSON.parse(data);
  } catch {
    // File doesn't exist yet
  }
  
  const routing = await loadRoutingRules();
  const targetRule = routing.routingRules?.find((r: { issueType: string }) => r.issueType === question.issueType);
  
  const newQuestion: AgentQuestion = {
    ...question,
    questionId: generateQuestionId(question.askingStageId),
    threadId: generateThreadId(),
    status: 'open',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    targetStageId: targetRule?.primaryTargetAgent || question.targetStageId,
    targetAgent: question.targetAgent
  };
  
  existing.questions.push(newQuestion);
  await fs.writeFile(questionsPath, JSON.stringify(existing, null, 2), 'utf-8');
  
  await createQuestionThread(campaignSlug, newQuestion);
  await updateContextResolutionStatus(campaignSlug);
  
  return newQuestion;
}

// =============================================================================
// CREATE QUESTION FROM APPROVED TEMPLATE
// =============================================================================

export async function createQuestionFromTemplate(
  campaignSlug: string,
  templateId: string,
  contextValues: Record<string, any>
): Promise<AgentQuestion> {
  const template = await getQuestionTemplate(templateId);
  if (!template) {
    throw new Error(`Template ${templateId} not found in question bank`);
  }

  const question: Omit<AgentQuestion, 'questionId' | 'threadId' | 'createdAt' | 'updatedAt' | 'status'> = {
    askingStageId: template.askingAgent,
    askingAgent: template.askingAgent,
    targetStageId: template.ownerAgent,
    targetAgent: template.ownerAgent,
    issueType: template.issueType,
    category: template.issueType,
    priority: template.priority,
    blocking: template.blocking,
    relatedFiles: [],
    relatedClaimIds: contextValues.relatedClaimIds || [],
    relatedStatIds: contextValues.relatedStatIds || [],
    relatedJournalistIds: contextValues.relatedJournalistIds || [],
    exactQuestion: template.exactQuestion,
    contextForTargetAgent: contextValues,
    expectedAnswerFormat: template.expectedAnswerFormat,
    requiredAnswerFields: template.requiredAnswerFields,
    canAskingAgentContinueWithoutAnswer: !template.blocking,
    escalationTargetIfUnanswered: template.fallbackOwner || null,
    humanEscalationAllowed: template.ownerAgent === 'HUMAN',
    notes: [`Created from template ${templateId}`, template.whenToAsk]
  };

  return createQuestion(campaignSlug, question);
}

// =============================================================================
// QUESTION THREAD MANAGEMENT
// =============================================================================

async function createQuestionThread(campaignSlug: string, question: AgentQuestion): Promise<void> {
  const campaignPath = path.join(CAMPAIGNS_DIR, campaignSlug);
  const threadPath = path.join(campaignPath, 'question-thread-log.json');
  
  let existing: { threads: QuestionThread[] } = { threads: [] };
  try {
    const data = await fs.readFile(threadPath, 'utf-8');
    existing = JSON.parse(data);
  } catch {
    // File doesn't exist yet
  }
  
  const thread: QuestionThread = {
    threadId: question.threadId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'open',
    issueType: question.issueType,
    blocking: question.blocking,
    askingStageId: question.askingStageId,
    currentTargetStageId: question.targetStageId,
    events: [
      {
        timestamp: new Date().toISOString(),
        eventType: 'question_created',
        byStageId: question.askingStageId,
        details: `Question created: ${question.issueType}`
      }
    ]
  };
  
  existing.threads.push(thread);
  await fs.writeFile(threadPath, JSON.stringify(existing, null, 2), 'utf-8');
}

// =============================================================================
// ANSWER SUBMISSION
// =============================================================================

export async function submitAnswer(
  campaignSlug: string,
  answer: Omit<AgentAnswer, 'answerId' | 'answeredAt' | 'status'>
): Promise<AgentAnswer> {
  const campaignPath = path.join(CAMPAIGNS_DIR, campaignSlug);
  const answersPath = path.join(campaignPath, 'agent-answers.json');
  
  let existing: { answers: AgentAnswer[] } = { answers: [] };
  try {
    const data = await fs.readFile(answersPath, 'utf-8');
    existing = JSON.parse(data);
  } catch {
    // File doesn't exist yet
  }
  
  const newAnswer: AgentAnswer = {
    ...answer,
    answerId: `A-${answer.answeringStageId}-${Date.now()}`,
    answeredAt: new Date().toISOString(),
    status: 'answered'
  };
  
  existing.answers.push(newAnswer);
  await fs.writeFile(answersPath, JSON.stringify(existing, null, 2), 'utf-8');
  
  await updateQuestionStatus(campaignSlug, answer.questionId, 'answered');
  await addThreadEvent(campaignSlug, answer.questionId, 'answer_submitted', answer.answeringStageId, 'Answer provided');
  await updateContextResolutionStatus(campaignSlug);
  
  return newAnswer;
}

// =============================================================================
// QUESTION STATUS MANAGEMENT
// =============================================================================

async function updateQuestionStatus(
  campaignSlug: string,
  questionId: string,
  newStatus: AgentQuestion['status']
): Promise<void> {
  const campaignPath = path.join(CAMPAIGNS_DIR, campaignSlug);
  const questionsPath = path.join(campaignPath, 'agent-questions.json');
  
  let data: { questions: AgentQuestion[] } = { questions: [] };
  try {
    const raw = await fs.readFile(questionsPath, 'utf-8');
    data = JSON.parse(raw);
  } catch {
    return;
  }
  
  const question = data.questions.find(q => q.questionId === questionId);
  if (question) {
    question.status = newStatus;
    question.updatedAt = new Date().toISOString();
    await fs.writeFile(questionsPath, JSON.stringify(data, null, 2), 'utf-8');
  }
}

export async function resolveQuestion(campaignSlug: string, questionId: string): Promise<void> {
  await updateQuestionStatus(campaignSlug, questionId, 'resolved');
  await addThreadEvent(campaignSlug, questionId, 'question_resolved', 'ASKING_AGENT', 'Question resolved by asking agent');
  await updateContextResolutionStatus(campaignSlug);
}

export async function reopenQuestion(campaignSlug: string, questionId: string, reason: string): Promise<void> {
  await updateQuestionStatus(campaignSlug, questionId, 'reopened');
  await addThreadEvent(campaignSlug, questionId, 'question_reopened', 'ASKING_AGENT', `Question reopened: ${reason}`);
  await updateContextResolutionStatus(campaignSlug);
}

export async function escalateToHuman(
  campaignSlug: string,
  questionId: string,
  reason: string
): Promise<void> {
  await updateQuestionStatus(campaignSlug, questionId, 'escalated');
  await addThreadEvent(campaignSlug, questionId, 'question_escalated', 'SYSTEM', `Escalated to human: ${reason}`);
  await updatePendingHumanQuestions(campaignSlug, questionId);
  await updateContextResolutionStatus(campaignSlug);
}

// =============================================================================
// THREAD EVENT LOGGING
// =============================================================================

async function addThreadEvent(
  campaignSlug: string,
  questionId: string,
  eventType: string,
  byStageId: string,
  details: string
): Promise<void> {
  const campaignPath = path.join(CAMPAIGNS_DIR, campaignSlug);
  const threadPath = path.join(campaignPath, 'question-thread-log.json');
  
  let data: { threads: QuestionThread[] } = { threads: [] };
  try {
    const raw = await fs.readFile(threadPath, 'utf-8');
    data = JSON.parse(raw);
  } catch {
    return;
  }
  
  // Find thread by question ID
  const questionsPath = path.join(campaignPath, 'agent-questions.json');
  let question: AgentQuestion | undefined;
  try {
    const qData = JSON.parse(await fs.readFile(questionsPath, 'utf-8'));
    question = qData.questions.find((q: AgentQuestion) => q.questionId === questionId);
  } catch {
    return;
  }
  
  if (question) {
    const thread = data.threads.find(t => t.threadId === question?.threadId);
    if (thread) {
      thread.events.push({
        timestamp: new Date().toISOString(),
        eventType,
        byStageId,
        details
      });
      thread.updatedAt = new Date().toISOString();
      await fs.writeFile(threadPath, JSON.stringify(data, null, 2), 'utf-8');
    }
  }
}

// =============================================================================
// CONTEXT RESOLUTION STATUS
// =============================================================================

export async function updateContextResolutionStatus(campaignSlug: string): Promise<void> {
  const campaignPath = path.join(CAMPAIGNS_DIR, campaignSlug);
  
  let questions: AgentQuestion[] = [];
  const questionsPath = path.join(campaignPath, 'agent-questions.json');
  try {
    const data = JSON.parse(await fs.readFile(questionsPath, 'utf-8'));
    questions = data.questions || [];
  } catch {
    // No questions yet
  }
  
  const activeBlockingStatuses: AgentQuestion['status'][] = ['open', 'reopened', 'escalated', 'blocked'];
  const pendingStatuses: AgentQuestion['status'][] = ['open', 'reopened', 'escalated', 'blocked'];
  const blockingQuestions = questions.filter(q => q.blocking && activeBlockingStatuses.includes(q.status));
  const openQuestions = questions.filter(q => pendingStatuses.includes(q.status));
  const answeredQuestions = questions.filter(q => q.status === 'answered');
  const resolvedQuestions = questions.filter(q => q.status === 'resolved');
  const humanQuestions = questions.filter(q => q.targetStageId === 'HUMAN' && pendingStatuses.includes(q.status));
  
  const status: ContextResolutionStatus = {
    campaignSlug,
    updatedAt: new Date().toISOString(),
    summary: {
      totalQuestions: questions.length,
      openQuestions: openQuestions.length,
      blockingQuestions: blockingQuestions.length,
      answeredQuestions: answeredQuestions.length,
      resolvedQuestions: resolvedQuestions.length,
      humanQuestionsPending: humanQuestions.length
    },
    canWorkflowContinue: blockingQuestions.length === 0 && humanQuestions.length === 0,
    blockedStages: blockingQuestions.map(q => q.askingStageId),
    pendingQuestions: openQuestions.map(q => q.questionId),
    resolvedQuestions: resolvedQuestions.map(q => q.questionId),
    humanActionRequired: humanQuestions.length > 0,
    nextRecommendedAction: blockingQuestions.length > 0
      ? `Resolve ${blockingQuestions.length} blocking question(s) to continue`
      : humanQuestions.length > 0
        ? `Human response required for ${humanQuestions.length} escalated question(s)`
        : openQuestions.length > 0
          ? `${openQuestions.length} question(s) pending, workflow can continue`
          : 'No questions pending'
  };
  
  const statusPath = path.join(campaignPath, 'context-resolution-status.json');
  await fs.writeFile(statusPath, JSON.stringify(status, null, 2), 'utf-8');
}

// =============================================================================
// PENDING HUMAN QUESTIONS
// =============================================================================

async function updatePendingHumanQuestions(campaignSlug: string, questionId: string): Promise<void> {
  const campaignPath = path.join(CAMPAIGNS_DIR, campaignSlug);
  const questionsPath = path.join(campaignPath, 'agent-questions.json');
  const pendingPath = path.join(campaignPath, 'pending-human-questions.json');
  
  let question: AgentQuestion | undefined;
  try {
    const data = JSON.parse(await fs.readFile(questionsPath, 'utf-8'));
    question = data.questions?.find((q: AgentQuestion) => q.questionId === questionId);
  } catch {
    return;
  }
  
  if (!question) return;
  
  let existing: { humanQuestions: PendingHumanQuestion[] } = { humanQuestions: [] };
  try {
    const raw = await fs.readFile(pendingPath, 'utf-8');
    existing = JSON.parse(raw);
  } catch {
    // File doesn't exist
  }
  
  const humanQuestion: PendingHumanQuestion = {
    questionId: question.questionId,
    threadId: question.threadId,
    askedByStageId: question.askingStageId,
    priority: question.priority,
    blocking: question.blocking,
    question: question.exactQuestion,
    answerType: 'text',
    options: [],
    defaultAssumptionIfSkipped: null,
    canSkip: false,
    createdAt: new Date().toISOString()
  };
  
  existing.humanQuestions.push(humanQuestion);
  await fs.writeFile(pendingPath, JSON.stringify(existing, null, 2), 'utf-8');
}

// =============================================================================
// GETTERS
// =============================================================================

export async function getQuestions(campaignSlug: string): Promise<AgentQuestion[]> {
  const questionsPath = path.join(CAMPAIGNS_DIR, campaignSlug, 'agent-questions.json');
  try {
    const data = JSON.parse(await fs.readFile(questionsPath, 'utf-8'));
    return data.questions || [];
  } catch {
    return [];
  }
}

export async function getAnswers(campaignSlug: string): Promise<AgentAnswer[]> {
  const answersPath = path.join(CAMPAIGNS_DIR, campaignSlug, 'agent-answers.json');
  try {
    const data = JSON.parse(await fs.readFile(answersPath, 'utf-8'));
    return data.answers || [];
  } catch {
    return [];
  }
}

export async function getQuestionById(campaignSlug: string, questionId: string): Promise<AgentQuestion | null> {
  const questions = await getQuestions(campaignSlug);
  return questions.find(q => q.questionId === questionId) || null;
}

export async function getAnswerForQuestion(campaignSlug: string, questionId: string): Promise<AgentAnswer | null> {
  const answers = await getAnswers(campaignSlug);
  return answers.find(a => a.questionId === questionId) || null;
}

export async function getContextResolutionStatus(campaignSlug: string): Promise<ContextResolutionStatus> {
  const statusPath = path.join(CAMPAIGNS_DIR, campaignSlug, 'context-resolution-status.json');
  try {
    return JSON.parse(await fs.readFile(statusPath, 'utf-8'));
  } catch {
    return {
      campaignSlug,
      updatedAt: new Date().toISOString(),
      summary: { totalQuestions: 0, openQuestions: 0, blockingQuestions: 0, answeredQuestions: 0, resolvedQuestions: 0, humanQuestionsPending: 0 },
      canWorkflowContinue: true,
      blockedStages: [],
      pendingQuestions: [],
      resolvedQuestions: [],
      humanActionRequired: false,
      nextRecommendedAction: 'No questions pending'
    };
  }
}

export async function getPendingHumanQuestions(campaignSlug: string): Promise<PendingHumanQuestion[]> {
  const pendingPath = path.join(CAMPAIGNS_DIR, campaignSlug, 'pending-human-questions.json');
  try {
    const data = JSON.parse(await fs.readFile(pendingPath, 'utf-8'));
    return data.humanQuestions || [];
  } catch {
    return [];
  }
}

// =============================================================================
// VALIDATION
// =============================================================================

export async function validateQuestion(question: Partial<AgentQuestion>): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];
  
  if (!question.askingStageId) errors.push('askingStageId is required');
  if (!question.targetStageId) errors.push('targetStageId is required');
  if (!question.issueType) errors.push('issueType is required');
  if (!question.exactQuestion || question.exactQuestion.trim() === '') errors.push('exactQuestion is required');
  if (!question.priority) errors.push('priority is required');
  if (question.blocking === undefined) errors.push('blocking is required');
  
  const routing = await loadRoutingRules();
  const routingRule = routing.routingRules?.find((r: { issueType: string; doNotAsk?: string[] }) => r.issueType === question.issueType);
  if (routingRule?.doNotAsk?.includes(question.askingStageId || '')) {
    errors.push(`Stage ${question.askingStageId} is not allowed to ask this issue type`);
  }
  
  return { valid: errors.length === 0, errors };
}

export async function validateAnswer(answer: Partial<AgentAnswer>): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];
  
  if (!answer.questionId) errors.push('questionId is required');
  if (!answer.answeringStageId) errors.push('answeringStageId is required');
  if (!answer.status) errors.push('status is required');
  if (!answer.directAnswer && answer.status !== 'cannot_answer') errors.push('directAnswer is required');
  if (!answer.confidence) errors.push('confidence is required');
  
  if (answer.confidence === 'medium' || answer.confidence === 'low') {
    if (!answer.limitations || answer.limitations.length === 0) {
      errors.push('Limitations required when confidence is medium or low');
    }
  }
  
  return { valid: errors.length === 0, errors };
}

// =============================================================================
// ROUTING
// =============================================================================

export async function routeQuestion(issueType: string): Promise<{ targetStageId: string; fallbackStageIds: string[] }> {
  const routing = await loadRoutingRules();
  const rule = routing.routingRules?.find((r: { issueType: string; primaryTargetAgent: string; fallbackTargetAgents?: string[] }) => r.issueType === issueType);
  
  if (rule) {
    return {
      targetStageId: rule.primaryTargetAgent,
      fallbackStageIds: rule.fallbackTargetAgents || []
    };
  }
  
  return {
    targetStageId: 'HUMAN',
    fallbackStageIds: []
  };
}

// =============================================================================
// QUESTION STALE MARKING (FOR REPLAY MODE)
// =============================================================================

export async function markQuestionStale(campaignSlug: string, questionId: string, reason: string): Promise<void> {
  const campaignPath = path.join(CAMPAIGNS_DIR, campaignSlug);
  const questionsPath = path.join(campaignPath, 'agent-questions.json');
  
  let data: { questions: AgentQuestion[] } = { questions: [] };
  try {
    const raw = await fs.readFile(questionsPath, 'utf-8');
    data = JSON.parse(raw);
  } catch {
    return;
  }
  
  const question = data.questions.find(q => q.questionId === questionId);
  if (question) {
    question.status = 'stale';
    question.updatedAt = new Date().toISOString();
    question.notes.push(`Marked stale: ${reason}`);
    await fs.writeFile(questionsPath, JSON.stringify(data, null, 2), 'utf-8');
    await updateContextResolutionStatus(campaignSlug);
  }
}
