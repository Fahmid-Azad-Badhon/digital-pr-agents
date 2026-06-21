/**
 * =============================================================================
 * Dashboard AI API Route
 * =============================================================================
 * 
 * Handles all dashboard AI actions with proper model routing.
 * All dashboard AI features route through ModelRouter.
 * 
 * =============================================================================
 */

import { NextRequest } from 'next/server';
import { runDashboardAI, getModelForDashboardFeature, getDashboardFallbacks } from '@/lib/modelRouter';
import { fail, ok } from '@/lib/apiResponse';

// =============================================================================
// REQUEST TYPES
// =============================================================================

export interface DashboardAIRequest {
  campaignSlug?: string;
  featureId: string;
  input: Record<string, unknown>;
  mode?: 'default' | 'fast' | 'strategy' | 'research' | 'writing' | 'editorial' | 'multimodal' | 'visual';
}

// =============================================================================
// FEATURE HANDLERS
// =============================================================================

async function handleRecommendedNextAction(input: {
  currentStage: string;
  auditLog: unknown[];
  errors: unknown[];
  validationReport: unknown;
  humanApprovalStatus: string;
  outputFiles: string[];
}): Promise<unknown> {
  const featureId = 'recommended_next_action';
  
  const prompt = `You are a Digital PR workflow advisor. Based on the current workflow state:
  
Current Stage: ${input.currentStage}
Human Approval Status: ${input.humanApprovalStatus}
Output Files Present: ${input.outputFiles.join(', ')}

Errors: ${JSON.stringify(input.errors)}
Validation: ${JSON.stringify(input.validationReport)}

What is the next recommended action? Provide in JSON format:
{
  "nextAction": "string",
  "reason": "string",
  "riskLevel": "low|medium|high",
  "requiresHumanAction": true/false,
  "recommendedStageToRun": "string or null",
  "blockingIssues": [],
  "safeToContinue": true/false
}`;

  const result = await runDashboardAI(featureId, prompt, { useCase: 'strategy_recommendation' });
  
  // Try to parse JSON response
  try {
    return JSON.parse(result.output);
  } catch {
    return {
      nextAction: 'Review workflow status manually',
      reason: result.output.substring(0, 200),
      riskLevel: 'medium',
      requiresHumanAction: false,
      recommendedStageToRun: null,
      blockingIssues: [],
      safeToContinue: false
    };
  }
}

async function handleStageFailureExplanation(input: {
  failedStage: string;
  errorMessage: string;
  modelUsed: string;
}): Promise<unknown> {
  const featureId = 'stage_failure_explanation';
  
  const prompt = `You are a Digital PR technical analyst. Analyze this stage failure:

Failed Stage: ${input.failedStage}
Error: ${input.errorMessage}
Model Used: ${input.modelUsed}

Provide analysis in JSON format:
{
  "summary": "string",
  "likelyCause": "string",
  "technicalCause": "string",
  "recommendedFix": "string",
  "safeRetry": true/false,
  "shouldUseFallback": true/false
}`;

  const result = await runDashboardAI(featureId, prompt, { useCase: 'failure_analysis' });
  
  try {
    return JSON.parse(result.output);
  } catch {
    return {
      summary: 'Analysis unavailable',
      likelyCause: 'Check error logs',
      technicalCause: input.errorMessage,
      recommendedFix: 'Review error details',
      safeRetry: false,
      shouldUseFallback: true
    };
  }
}

async function handleFallbackEventAnalysis(input: {
  stage: string;
  primaryModel: string;
  fallbackModel: string;
  reason: string;
}): Promise<unknown> {
  const featureId = 'fallback_event_analysis';
  
  const prompt = `You are a Digital PR model analyst. Analyze this fallback event:

Stage: ${input.stage}
Primary Model: ${input.primaryModel}
Fallback Model Used: ${input.fallbackModel}
Fallback Reason: ${input.reason}

Provide analysis in JSON format:
{
  "summary": "string",
  "fallbackReason": "string",
  "wasFallbackAppropriate": true/false,
  "patternDetected": true/false,
  "recommendedAction": "string"
}`;

  const result = await runDashboardAI(featureId, prompt, { useCase: 'fallback_analysis' });
  
  try {
    return JSON.parse(result.output);
  } catch {
    return {
      summary: 'Fallback analysis unavailable',
      fallbackReason: input.reason,
      wasFallbackAppropriate: true,
      patternDetected: false,
      recommendedAction: 'Continue monitoring'
    };
  }
}

async function handleOutputQualityScore(input: {
  outputContent: string;
  outputType: 'pitch' | 'package' | 'email';
}): Promise<unknown> {
  const featureId = 'output_quality_score';
  
  const prompt = `You are a Digital PR quality scorer. Evaluate this ${input.outputType}:

${input.outputContent.substring(0, 2000)}

Provide quality score in JSON format:
{
  "score": 0-10,
  "strengths": [],
  "weaknesses": [],
  "risks": [],
  "recommendedEdits": []
}`;

  const result = await runDashboardAI(featureId, prompt, { useCase: 'quality_scoring' });
  
  try {
    return JSON.parse(result.output);
  } catch {
    return {
      score: 5,
      strengths: ['Content present'],
      weaknesses: ['Analysis failed'],
      risks: ['Unable to validate'],
      recommendedEdits: []
    };
  }
}

async function handlePitchReadability(input: {
  pitchContent: string;
}): Promise<unknown> {
  const featureId = 'pitch_readability_preview';
  
  const prompt = `You are a Digital PR editorial reviewer. Check if this pitch sounds natural:

${input.pitchContent.substring(0, 2000)}

Provide review in JSON format:
{
  "readabilityScore": 0-10,
  "soundsNatural": true/false,
  "salesyPhrases": [],
  "awkwardPhrases": [],
  "suggestedImprovements": []
}`;

  const result = await runDashboardAI(featureId, prompt, { useCase: 'editorial_review' });
  
  try {
    return JSON.parse(result.output);
  } catch {
    return {
      readabilityScore: 5,
      soundsNatural: true,
      salesyPhrases: [],
      awkwardPhrases: [],
      suggestedImprovements: []
    };
  }
}

async function handleSearchCampaign(input: {
  query: string;
  campaignFiles: Record<string, string>;
}): Promise<unknown> {
  const featureId = 'search_across_campaign_files';
  
  const prompt = `Search these campaign files for: "${input.query}"

Files:
${Object.entries(input.campaignFiles).map(([name, content]) => 
  `--- ${name} ---\n${content.substring(0, 1000)}`
).join('\n\n')}

Provide search results in JSON format:
{
  "answer": "string",
  "relevantFiles": [],
  "confidence": "high|medium|low"
}`;

  const result = await runDashboardAI(featureId, prompt, { useCase: 'research_search' });
  
  try {
    return JSON.parse(result.output);
  } catch {
    return {
      answer: 'Search failed',
      relevantFiles: [],
      confidence: 'low'
    };
  }
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body: DashboardAIRequest = await request.json();
    const { campaignSlug, featureId, input, mode } = body;
    
    // Get routing info for the feature
    const primaryModel = getModelForDashboardFeature(featureId);
    const fallbacks = getDashboardFallbacks(featureId);
    
    console.log(`[Dashboard AI] Feature: ${featureId}, Mode: ${mode || 'default'}`);
    console.log(`[Dashboard AI] Primary model: ${primaryModel}`);
    
    // Route to appropriate handler
    let result: unknown;
    
    switch (featureId) {
      case 'recommended_next_action':
        result = await handleRecommendedNextAction(input as {
          currentStage: string;
          auditLog: unknown[];
          errors: unknown[];
          validationReport: unknown;
          humanApprovalStatus: string;
          outputFiles: string[];
        });
        break;
        
      case 'stage_failure_explanation':
        result = await handleStageFailureExplanation(input as {
          failedStage: string;
          errorMessage: string;
          modelUsed: string;
        });
        break;
        
      case 'fallback_event_analysis':
        result = await handleFallbackEventAnalysis(input as {
          stage: string;
          primaryModel: string;
          fallbackModel: string;
          reason: string;
        });
        break;
        
      case 'output_quality_score':
        result = await handleOutputQualityScore(input as {
          outputContent: string;
          outputType: 'pitch' | 'package' | 'email';
        });
        break;
        
      case 'pitch_readability_preview':
        result = await handlePitchReadability(input as {
          pitchContent: string;
        });
        break;
        
      case 'search_across_campaign_files':
        result = await handleSearchCampaign(input as {
          query: string;
          campaignFiles: Record<string, string>;
        });
        break;
        
      default:
        // General AI request - use default routing
        const prompt = (input.prompt as string) || 'Process this request.';
        const aiResult = await runDashboardAI(featureId, prompt, { useCase: mode || 'default' });
        result = { output: aiResult.output, modelUsed: aiResult.modelUsed };
    }
    
    return ok({
      featureId,
      primaryModel,
      fallbackModels: fallbacks,
      result
    });
    
  } catch (error) {
    console.error('[Dashboard AI] Error:', error);
    return fail('DASHBOARD_AI_FAILED', 'Dashboard AI request failed.', { status: 500 }, error instanceof Error ? error.message : 'Unknown error');
  }
}

export async function GET() {
  // Return available features
  return ok({
    features: [
      'recommended_next_action',
      'stage_failure_explanation',
      'fallback_event_analysis',
      'output_quality_score',
      'pitch_readability_preview',
      'search_across_campaign_files',
      'dashboard_copy_labels',
      'campaign_progress_overview',
      'audit_log_analysis'
    ],
    routing: {
      default: 'gpt_oss_120b',
      fast: 'nemotron_3_nano_30b',
      strategy: 'nemotron_3_ultra',
      research: 'nemotron_3_super',
      writing: 'minimax_m25',
      editorial: 'hermes_3_405b',
      multimodal: 'gemma_4_31b',
      visual: 'gemma_4_31b'
    }
  });
}
