/**
 * =============================================================================
 * ASK THE OWNER SYSTEM MODULE
 * =============================================================================
 * 
 * Structured question/answer system ensuring agents ask the correct owner
 * for information rather than guessing or hallucinating.
 * 
 * =============================================================================
 */

import fs from 'fs/promises';
import path from 'path';
import { PITCH_JOBS_ROOT } from '@/lib/requestGuard';

const CAMPAIGNS_DIR = PITCH_JOBS_ROOT;

const SYSTEM_DIR = path.join(path.dirname(PITCH_JOBS_ROOT), 'system');

const SCHEMAS_DIR = path.join(path.dirname(PITCH_JOBS_ROOT), 'schemas', 'questions');

// =============================================================================
// TYPES (Aligned with JSON Schemas)
// =============================================================================

export type StageId = 'S1' | 'S2' | 'S3' | 'S4A' | 'S4B' | 'S5' | 'S6' | 'S7' | 'S8' | 'S9' | 'S10' | 'S11' | 'S12' | 'S13' | 'HUMAN';

export interface Question {
  questionId: string;
  questionText: string;
  askedBy: StageId;
  askedAt: string;
  stage: StageId;
  priority: 'critical' | 'high' | 'medium' | 'low';
  issueType: string;
  context?: {
    claimId?: string;
    sourceId?: string;
    artifactId?: string;
    relatedQuestions?: string[];
  };
  requiresAnswer: boolean;
  blockingGate?: string;
}

export interface Answer {
  answerId: string;
  questionId: string;
  answeredBy: StageId;
  answeredAt: string;
  answerText: string;
  ownerType: 'source_owner' | 'stage_owner' | 'claim_owner' | 'human_owner';
  confidence: 'certain' | 'likely' | 'uncertain';
  source?: {
    type: 'artifact' | 'external' | 'knowledge' | 'human_input';
    reference: string;
  };
  resolvesQuestion: boolean;
}

export interface QuestionAnswerSession {
  sessionId: string;
  campaignId: string;
  startedAt: string;
  endedAt?: string;
  status: 'active' | 'resolved' | 'blocked' | 'escalated';
  questions: Question[];
  answers: Answer[];
  unansweredQuestions: string[];
  blockingGates: string[];
  escalationPath: string[];
}

export interface OwnerMapping {
  issueType: string;
  description: string;
  owner: StageId;
  ownerType: 'source_owner' | 'stage_owner' | 'claim_owner' | 'human_owner';
  fallbackOwner?: StageId;
  canEscalateTo: StageId[];
  requiresBlockingGate: boolean;
  blockingGate?: string;
}

export interface QuestionTemplate {
  templateId: string;
  templateText: string;
  stage: StageId;
  issueType: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  requiresContext: ('claimId' | 'sourceId' | 'artifactId' | 'stageOutput')[];
  blockingGate?: string;
}

export interface QuestionBank {
  questionBankId: 'default' | 'safety' | 'statistics' | 'legal' | 'campaign';
  version: string;
  lastUpdated: string;
  questions: QuestionTemplate[];
}

// =============================================================================
// SCHEMA LOADING
// =============================================================================

async function loadSchema(schemaName: string): Promise<any> {
  const schemaPath = path.join(SCHEMAS_DIR, `${schemaName}.schema.json`);
  try {
    const data = await fs.readFile(schemaPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Failed to load schema ${schemaName}:`, error);
    return null;
  }
}

async function loadOwnerMappings(): Promise<OwnerMapping[]> {
  const routingPath = path.join(SYSTEM_DIR, 'agent-question-routing.json');
  try {
    const data = await fs.readFile(routingPath, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.routingRules?.map((r: any) => ({
      issueType: r.issueType,
      description: r.description || '',
      owner: r.primaryTargetAgent as StageId,
      ownerType: r.ownerType || 'stage_owner',
      fallbackOwner: r.fallbackTargetAgents?.[0] as StageId | undefined,
      canEscalateTo: (r.fallbackTargetAgents || []) as StageId[],
      requiresBlockingGate: r.blockingGate ? true : false,
      blockingGate: r.blockingGate
    })) || [];
  } catch {
    return [];
  }
}

async function loadQuestionBank(bankId: string = 'default'): Promise<QuestionBank | null> {
  const banks: Record<string, string> = {
    'default': 'question-bank.json',
    'safety': 'question-bank.json',
    'statistics': 'question-bank.json',
    'legal': 'question-bank.json',
    'campaign': 'question-bank.json'
  };
  
  const bankPath = path.join(SYSTEM_DIR, banks[bankId] || 'question-bank.json');
  try {
    const data = await fs.readFile(bankPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// =============================================================================
// ID GENERATION
// =============================================================================

let questionCounter = 0;
let answerCounter = 0;
let sessionCounter = 0;

function generateQuestionId(): string {
  questionCounter = (questionCounter + 1) % 999999;
  return `Q-${String(questionCounter).padStart(6, '0')}`;
}

function generateAnswerId(): string {
  answerCounter = (answerCounter + 1) % 999999;
  return `A-${String(answerCounter).padStart(6, '0')}`;
}

function generateSessionId(): string {
  sessionCounter = (sessionCounter + 1) % 99999999;
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `QAS-${date}-${String(sessionCounter).padStart(4, '0')}`;
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

export async function validateQuestionSchema(question: Partial<Question>): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];
  
  if (!question.questionId) errors.push('questionId is required');
  else if (!/^Q-[0-9]{6}$/.test(question.questionId)) errors.push('questionId must match format Q-000000');
  
  if (!question.questionText) errors.push('questionText is required');
  else if (question.questionText.length < 10) errors.push('questionText must be at least 10 characters');
  else if (question.questionText.length > 500) errors.push('questionText must not exceed 500 characters');
  
  if (!question.askedBy) errors.push('askedBy is required');
  else if (!isValidStage(question.askedBy)) errors.push('askedBy must be a valid stage ID');
  
  if (!question.stage) errors.push('stage is required');
  else if (!isValidStage(question.stage)) errors.push('stage must be a valid stage ID');
  
  if (!question.priority) errors.push('priority is required');
  else if (!['critical', 'high', 'medium', 'low'].includes(question.priority)) errors.push('priority must be valid');
  
  if (!question.issueType) errors.push('issueType is required');
  
  if (question.blockingGate && !/^G[0-8]$/.test(question.blockingGate)) {
    errors.push('blockingGate must be a valid gate ID (G0-G8)');
  }
  
  const mappings = await loadOwnerMappings();
  const mapping = mappings.find(m => m.issueType === question.issueType);
  if (mapping?.requiresBlockingGate && !question.blockingGate) {
    errors.push(`Issue type ${question.issueType} requires a blockingGate`);
  }
  
  return { valid: errors.length === 0, errors };
}

export async function validateAnswerSchema(answer: Partial<Answer>): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];
  
  if (!answer.answerId) errors.push('answerId is required');
  else if (!/^A-[0-9]{6}$/.test(answer.answerId)) errors.push('answerId must match format A-000000');
  
  if (!answer.questionId) errors.push('questionId is required');
  else if (!/^Q-[0-9]{6}$/.test(answer.questionId)) errors.push('questionId must match format Q-000000');
  
  if (!answer.answeredBy) errors.push('answeredBy is required');
  else if (!isValidStage(answer.answeredBy)) errors.push('answeredBy must be a valid stage ID');
  
  if (!answer.answerText) errors.push('answerText is required');
  else if (answer.answerText.length > 2000) errors.push('answerText must not exceed 2000 characters');
  
  if (!answer.ownerType) errors.push('ownerType is required');
  else if (!['source_owner', 'stage_owner', 'claim_owner', 'human_owner'].includes(answer.ownerType)) {
    errors.push('ownerType must be valid');
  }
  
  if (!answer.confidence) errors.push('confidence is required');
  else if (!['certain', 'likely', 'uncertain'].includes(answer.confidence)) {
    errors.push('confidence must be valid');
  }
  
  if (answer.confidence === 'uncertain' && !answer.source) {
    errors.push('source required when confidence is uncertain');
  }
  
  return { valid: errors.length === 0, errors };
}

export async function validateSessionSchema(session: Partial<QuestionAnswerSession>): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];
  
  if (!session.sessionId) errors.push('sessionId is required');
  if (!session.campaignId) errors.push('campaignId is required');
  if (!session.status) errors.push('status is required');
  else if (!['active', 'resolved', 'blocked', 'escalated'].includes(session.status)) {
    errors.push('status must be valid');
  }
  
  if (session.status === 'resolved' && !session.endedAt) {
    errors.push('endedAt required when status is resolved');
  }
  
  return { valid: errors.length === 0, errors };
}

export async function validateOwnerMapping(ownerType: string, issueType: string, answeringStage: StageId): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];
  const mappings = await loadOwnerMappings();
  const mapping = mappings.find(m => m.issueType === issueType);
  
  if (!mapping) {
    errors.push(`No owner mapping found for issue type: ${issueType}`);
    return { valid: false, errors };
  }
  
  if (mapping.owner !== answeringStage && mapping.fallbackOwner !== answeringStage && answeringStage !== 'HUMAN') {
    errors.push(`${answeringStage} is not an authorized owner for issue type ${issueType}. Expected: ${mapping.owner}`);
  }
  
  if (ownerType !== mapping.ownerType) {
    errors.push(`ownerType mismatch: expected ${mapping.ownerType}, got ${ownerType}`);
  }
  
  return { valid: errors.length === 0, errors };
}

// =============================================================================
// HELPERS
// =============================================================================

function isValidStage(stage: string): boolean {
  return ['S1', 'S2', 'S3', 'S4A', 'S4B', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11', 'S12', 'S13', 'HUMAN'].includes(stage);
}

// =============================================================================
// QUESTION CREATION
// =============================================================================

export async function createQuestion(
  campaignSlug: string,
  questionData: {
    questionText: string;
    askedBy: StageId;
    stage: StageId;
    issueType: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    context?: Question['context'];
    requiresAnswer?: boolean;
    blockingGate?: string;
  }
): Promise<Question> {
  const mappings = await loadOwnerMappings();
  const mapping = mappings.find(m => m.issueType === questionData.issueType);
  
  const question: Question = {
    questionId: generateQuestionId(),
    questionText: questionData.questionText,
    askedBy: questionData.askedBy,
    askedAt: new Date().toISOString(),
    stage: questionData.stage,
    priority: questionData.priority,
    issueType: questionData.issueType,
    context: questionData.context,
    requiresAnswer: questionData.requiresAnswer ?? true,
    blockingGate: questionData.blockingGate || mapping?.blockingGate
  };
  
  const validation = await validateQuestionSchema(question);
  if (!validation.valid) {
    throw new Error(`Invalid question: ${validation.errors.join(', ')}`);
  }
  
  const campaignPath = path.join(CAMPAIGNS_DIR, campaignSlug);
  const questionsPath = path.join(campaignPath, 'ask-owner-questions.json');
  
  let existing: { questions: Question[] } = { questions: [] };
  try {
    const data = await fs.readFile(questionsPath, 'utf-8');
    existing = JSON.parse(data);
  } catch {
    // File doesn't exist yet
  }
  
  existing.questions.push(question);
  await fs.writeFile(questionsPath, JSON.stringify(existing, null, 2), 'utf-8');
  
  await updateSessionStatus(campaignSlug);
  
  return question;
}

// =============================================================================
// ANSWER SUBMISSION
// =============================================================================

export async function submitAnswer(
  campaignSlug: string,
  answerData: {
    questionId: string;
    answeredBy: StageId;
    answerText: string;
    ownerType: 'source_owner' | 'stage_owner' | 'claim_owner' | 'human_owner';
    confidence: 'certain' | 'likely' | 'uncertain';
    source?: Answer['source'];
    resolvesQuestion?: boolean;
  }
): Promise<Answer> {
  const answer: Answer = {
    answerId: generateAnswerId(),
    questionId: answerData.questionId,
    answeredBy: answerData.answeredBy,
    answeredAt: new Date().toISOString(),
    answerText: answerData.answerText,
    ownerType: answerData.ownerType,
    confidence: answerData.confidence,
    source: answerData.source,
    resolvesQuestion: answerData.resolvesQuestion ?? true
  };
  
  const campaignPath = path.join(CAMPAIGNS_DIR, campaignSlug);
  const questionsPath = path.join(campaignPath, 'ask-owner-questions.json');
  let questionsData: { questions: Question[] } = { questions: [] };
  
  try {
    const qData = await fs.readFile(questionsPath, 'utf-8');
    questionsData = JSON.parse(qData);
  } catch {
    throw new Error('Question not found');
  }
  
  const question = questionsData.questions.find(q => q.questionId === answerData.questionId);
  if (!question) {
    throw new Error('Question not found');
  }
  
  const ownerValidation = await validateOwnerMapping(
    answerData.ownerType,
    question.issueType,
    answerData.answeredBy
  );
  if (!ownerValidation.valid) {
    throw new Error(`Answer validation failed: ${ownerValidation.errors.join(', ')}`);
  }
  
  const answerValidation = await validateAnswerSchema(answer);
  if (!answerValidation.valid) {
    throw new Error(`Invalid answer: ${answerValidation.errors.join(', ')}`);
  }
  
  const answersPath = path.join(campaignPath, 'ask-owner-answers.json');
  let existing: { answers: Answer[] } = { answers: [] };
  try {
    const data = await fs.readFile(answersPath, 'utf-8');
    existing = JSON.parse(data);
  } catch {
    // File doesn't exist
  }
  
  existing.answers.push(answer);
  await fs.writeFile(answersPath, JSON.stringify(existing, null, 2), 'utf-8');
  
  await updateSessionStatus(campaignSlug);
  
  return answer;
}

// =============================================================================
// SESSION MANAGEMENT
// =============================================================================

async function updateSessionStatus(campaignSlug: string): Promise<void> {
  const campaignPath = path.join(CAMPAIGNS_DIR, campaignSlug);
  
  let questions: Question[] = [];
  let answers: Answer[] = [];
  
  try {
    const qData = JSON.parse(await fs.readFile(path.join(campaignPath, 'ask-owner-questions.json'), 'utf-8'));
    questions = qData.questions || [];
  } catch {
    // No questions yet
  }
  
  try {
    const aData = JSON.parse(await fs.readFile(path.join(campaignPath, 'ask-owner-answers.json'), 'utf-8'));
    answers = aData.answers || [];
  } catch {
    // No answers yet
  }
  
  const answeredIds = new Set(answers.map(a => a.questionId));
  const unanswered = questions.filter(q => !answeredIds.has(q.questionId) && q.requiresAnswer);
  const blockingGates = [...new Set(unanswered.filter(q => q.blockingGate).map(q => q.blockingGate!))];
  
  let status: QuestionAnswerSession['status'] = 'active';
  if (unanswered.some(q => q.priority === 'critical')) {
    status = 'blocked';
  } else if (unanswered.length === 0 && questions.length > 0) {
    status = 'resolved';
  }
  
  const session: QuestionAnswerSession = {
    sessionId: generateSessionId(),
    campaignId: campaignSlug,
    startedAt: questions[0]?.askedAt || new Date().toISOString(),
    endedAt: status === 'resolved' ? new Date().toISOString() : undefined,
    status,
    questions,
    answers,
    unansweredQuestions: unanswered.map(q => q.questionId),
    blockingGates,
    escalationPath: []
  };
  
  const sessionPath = path.join(campaignPath, 'ask-owner-session.json');
  await fs.writeFile(sessionPath, JSON.stringify(session, null, 2), 'utf-8');
}

// =============================================================================
// GETTERS
// =============================================================================

export async function getQuestions(campaignSlug: string): Promise<Question[]> {
  const questionsPath = path.join(CAMPAIGNS_DIR, campaignSlug, 'ask-owner-questions.json');
  try {
    const data = JSON.parse(await fs.readFile(questionsPath, 'utf-8'));
    return data.questions || [];
  } catch {
    return [];
  }
}

export async function getAnswers(campaignSlug: string): Promise<Answer[]> {
  const answersPath = path.join(CAMPAIGNS_DIR, campaignSlug, 'ask-owner-answers.json');
  try {
    const data = JSON.parse(await fs.readFile(answersPath, 'utf-8'));
    return data.answers || [];
  } catch {
    return [];
  }
}

export async function getSession(campaignSlug: string): Promise<QuestionAnswerSession | null> {
  const sessionPath = path.join(CAMPAIGNS_DIR, campaignSlug, 'ask-owner-session.json');
  try {
    return JSON.parse(await fs.readFile(sessionPath, 'utf-8'));
  } catch {
    return null;
  }
}

export async function getOwnerForIssueType(issueType: string): Promise<OwnerMapping | null> {
  const mappings = await loadOwnerMappings();
  return mappings.find(m => m.issueType === issueType) || null;
}

// =============================================================================
// ROUTING HELPERS
// =============================================================================

export async function getAuthorizedAnswerer(
  issueType: string,
  requestedBy: StageId
): Promise<{ authorized: boolean; owner: StageId; reason?: string }> {
  const mapping = await getOwnerForIssueType(issueType);
  
  if (!mapping) {
    return { authorized: false, owner: 'HUMAN', reason: 'No mapping found for issue type' };
  }
  
  if (requestedBy === mapping.owner || requestedBy === mapping.fallbackOwner) {
    return { authorized: true, owner: mapping.owner };
  }
  
  if (requestedBy === 'HUMAN') {
    return { authorized: true, owner: 'HUMAN', reason: 'Human override allowed' };
  }
  
  return {
    authorized: false,
    owner: mapping.owner,
    reason: `${requestedBy} is not the authorized owner for ${issueType}. Expected: ${mapping.owner}`
  };
}

// =============================================================================
// QUESTION BANK
// =============================================================================

export async function getQuestionTemplates(
  stage?: StageId,
  issueType?: string,
  priority?: string
): Promise<QuestionTemplate[]> {
  const bank = await loadQuestionBank();
  if (!bank) return [];
  
  let templates = bank.questions;
  
  if (stage) {
    templates = templates.filter(t => t.stage === stage);
  }
  if (issueType) {
    templates = templates.filter(t => t.issueType === issueType);
  }
  if (priority) {
    templates = templates.filter(t => t.priority === priority);
  }
  
  return templates;
}

// =============================================================================
// REPLAY MODE SUPPORT
// =============================================================================

export async function markQuestionStale(campaignSlug: string, questionId: string): Promise<void> {
  const campaignPath = path.join(CAMPAIGNS_DIR, campaignSlug);
  const questionsPath = path.join(campaignPath, 'ask-owner-questions.json');
  
  let data: { questions: Question[] } = { questions: [] };
  try {
    const raw = await fs.readFile(questionsPath, 'utf-8');
    data = JSON.parse(raw);
  } catch {
    return;
  }
  
  const question = data.questions.find(q => q.questionId === questionId);
  if (question) {
    question.questionText = `[STALE] ${question.questionText}`;
    await fs.writeFile(questionsPath, JSON.stringify(data, null, 2), 'utf-8');
    await updateSessionStatus(campaignSlug);
  }
}

export async function archiveSession(campaignSlug: string, runId: string): Promise<void> {
  const campaignPath = path.join(CAMPAIGNS_DIR, campaignSlug);
  const sessionPath = path.join(campaignPath, 'ask-owner-session.json');
  const archivePath = path.join(campaignPath, `ask-owner-session-${runId}.json`);
  
  try {
    const sessionData = await fs.readFile(sessionPath, 'utf-8');
    await fs.writeFile(archivePath, sessionData, 'utf-8');
  } catch {
    // No session to archive
  }
}