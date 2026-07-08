// GET /api/campaigns/[id]/questions - Get all questions
// POST /api/campaigns/[id]/questions - Create a question
// GET /api/campaigns/[id]/questions/[questionId] - Get specific question
// POST /api/campaigns/[id]/questions/[questionId]/answer - Submit answer
// POST /api/campaigns/[id]/questions/[questionId]/resolve - Resolve question
// POST /api/campaigns/[id]/questions/[questionId]/reopen - Reopen question
// POST /api/campaigns/[id]/questions/[questionId]/escalate - Escalate to human
// GET /api/campaigns/[id]/questions/status - Get context resolution status

import { ok, fail } from '@/lib/apiResponse';
import { resolveCampaignPath } from '@/lib/requestGuard';
import fs from 'fs/promises';
import path from 'path';
import {
  createQuestion,
  submitAnswer,
  resolveQuestion,
  reopenQuestion,
  escalateToHuman,
  getQuestions,
  getAnswers,
  getQuestionById,
  updateContextResolutionStatus,
  getContextResolutionStatus,
  getPendingHumanQuestions,
  validateQuestion,
  validateAnswer,
  routeQuestion,
  markQuestionStale,
  type AgentQuestion,
  type AgentAnswer
} from '@/lib/agentQuestioningSystem';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const campaignSlug = params.id;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  
  try {
    switch (action) {
      case 'status': {
        await updateContextResolutionStatus(campaignSlug);
        const status = await getContextResolutionStatus(campaignSlug);
        return ok(status);
      }
      
      case 'answers': {
        const answers = await getAnswers(campaignSlug);
        return ok({ answers });
      }
      
      case 'human': {
        const humanQuestions = await getPendingHumanQuestions(campaignSlug);
        return ok({ humanQuestions });
      }
      
      default: {
        const questions = await getQuestions(campaignSlug);
        await updateContextResolutionStatus(campaignSlug);
        const status = await getContextResolutionStatus(campaignSlug);
        return ok({ questions, status });
      }
    }
  } catch (error) {
    return fail(
      'QUESTIONS_FETCH_FAILED',
      `Failed to get questions: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const campaignSlug = params.id;
  const url = new URL(request.url);
  const questionId = url.searchParams.get('questionId');
  const action = url.searchParams.get('action');
  
  try {
    const body = await request.json();
    
    // Handle question-specific actions
    if (questionId) {
      switch (action) {
        case 'answer': {
          const answerData = body as Omit<AgentAnswer, 'answerId' | 'answeredAt' | 'status'>;
          
          const validation = await validateAnswer(answerData);
          if (!validation.valid) {
            return fail('INVALID_ANSWER', `Invalid answer: ${validation.errors.join(', ')}`, { status: 400 });
          }
          
          const question = await getQuestionById(campaignSlug, questionId);
          if (!question) {
            return fail('QUESTION_NOT_FOUND', 'Question not found', { status: 404 });
          }
          
          const answer = await submitAnswer(campaignSlug, {
            ...answerData,
            questionId,
            threadId: question.threadId,
            answeringStageId: question.targetStageId,
            answeringAgent: question.targetAgent
          });

          // Auto-resume workflow when a blocking approval-queue question is answered.
          if (question.blocking) {
            await resolveQuestion(campaignSlug, questionId);
            const stageFromQuestion = Number(String(question.askingStageId || '').replace(/[^0-9]/g, '')) || 1;
            const campaignPath = resolveCampaignPath(campaignSlug);
            const stageStatePath = path.join(campaignPath, 'stage-state.json');
            const existingState = await fs.readFile(stageStatePath, 'utf-8')
              .then(content => JSON.parse(content) as { currentStage?: number; status?: string })
              .catch(() => ({ currentStage: stageFromQuestion, status: 'running' }));
            const nextState = {
              ...existingState,
              currentStage: stageFromQuestion,
              status: 'running',
              blockedStage: null,
              lastBlockedAt: null,
              updatedAt: new Date().toISOString(),
            };
            await fs.writeFile(stageStatePath, JSON.stringify(nextState, null, 2), 'utf-8');

            const origin = new URL(request.url).origin;
            await fetch(`${origin}/api/campaigns/${encodeURIComponent(campaignSlug)}/auto-progress`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ mode: stageFromQuestion < 7 ? 'pre_pitch' : 'full' }),
            }).catch(() => undefined);
          }
          
          return ok(answer);
        }
        
        case 'resolve': {
          await resolveQuestion(campaignSlug, questionId);
          return ok({ success: true, questionId, status: 'resolved' });
        }
        
        case 'reopen': {
          const { reason } = body;
          if (!reason) {
            return fail('REOPEN_REASON_REQUIRED', 'Reopen reason is required', { status: 400 });
          }
          await reopenQuestion(campaignSlug, questionId, reason);
          return ok({ success: true, questionId, status: 'reopened' });
        }
        
        case 'escalate': {
          const { reason } = body;
          await escalateToHuman(campaignSlug, questionId, reason || 'No answer available');
          return ok({ success: true, questionId, status: 'escalated' });
        }
        
        case 'stale': {
          const { reason } = body;
          await markQuestionStale(campaignSlug, questionId, reason || 'Related file changed');
          return ok({ success: true, questionId, status: 'stale' });
        }
        
        default: {
          return fail('INVALID_QUESTION_ACTION', 'Invalid action for question', { status: 400 });
        }
      }
    }
    
    // Create new question
    const questionData = body as Omit<AgentQuestion, 'questionId' | 'threadId' | 'createdAt' | 'updatedAt' | 'status'>;
    
    const validation = await validateQuestion(questionData);
    if (!validation.valid) {
      return fail('INVALID_QUESTION', `Invalid question: ${validation.errors.join(', ')}`, { status: 400 });
    }
    
    // Route the question to the correct target
    const routing = await routeQuestion(questionData.issueType);
    questionData.targetStageId = routing.targetStageId;
    
    const question = await createQuestion(campaignSlug, questionData);
    
    return ok(question);
  } catch (error) {
    return fail(
      'QUESTION_OPERATION_FAILED',
      `Question operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 }
    );
  }
}
