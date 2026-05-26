/**
 * =============================================================================
 * MODEL TEST RESULTS MODULE
 * =============================================================================
 * 
 * Tracks model comparison testing results for Replay Mode.
 * Stores results in campaigns/{slug}/model-test-results.json
 * 
 * =============================================================================
 */

import fs from 'fs/promises';
import path from 'path';

const CAMPAIGNS_DIR = 'D:\\Codex Folder\\digital-pr-agents\\pitch-jobs';

export interface ModelTestResult {
  testId: string;
  stageId: string;
  defaultModel: string;
  testModel: string;
  defaultRunId: string;
  testRunId: string;
  scoreDelta: number;
  validationImproved: boolean;
  fallbackRateImpact: string;
  recommendation: 'keep_default' | 'consider_override' | 'reject_override';
  testedAt: string;
  testedBy: string;
  notes: string[];
  routingUpdatedAt?: string;
  routingUpdatedBy?: string;
  promotedAt?: string;
  promotedBy?: string;
}

export interface ModelTestResults {
  campaignSlug: string;
  updatedAt: string;
  tests: ModelTestResult[];
}

export async function getModelTestResults(campaignSlug: string): Promise<ModelTestResults> {
  const resultsPath = path.join(CAMPAIGNS_DIR, campaignSlug, 'model-test-results.json');
  try {
    const data = await fs.readFile(resultsPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {
      campaignSlug,
      updatedAt: new Date().toISOString(),
      tests: []
    };
  }
}

export async function addModelTestResult(
  campaignSlug: string,
  testResult: Omit<ModelTestResult, 'testId' | 'testedAt'>
): Promise<ModelTestResult> {
  const results = await getModelTestResults(campaignSlug);
  
  const newTest: ModelTestResult = {
    ...testResult,
    testId: `MODELTEST-${Date.now()}`,
    testedAt: new Date().toISOString()
  };
  
  results.tests.push(newTest);
  results.updatedAt = new Date().toISOString();
  
  const resultsPath = path.join(CAMPAIGNS_DIR, campaignSlug, 'model-test-results.json');
  await fs.writeFile(resultsPath, JSON.stringify(results, null, 2), 'utf-8');
  
  return newTest;
}

export async function getModelTestByStage(campaignSlug: string, stageId: string): Promise<ModelTestResult[]> {
  const results = await getModelTestResults(campaignSlug);
  return results.tests.filter(t => t.stageId === stageId);
}

export async function getLatestModelTest(campaignSlug: string, stageId: string): Promise<ModelTestResult | null> {
  const tests = await getModelTestByStage(campaignSlug, stageId);
  if (tests.length === 0) return null;
  
  const sorted = tests.sort((a, b) => new Date(b.testedAt).getTime() - new Date(a.testedAt).getTime());
  return sorted[0];
}

export async function updateModelRouting(
  campaignSlug: string,
  stageId: string,
  newModel: string,
  updatedBy: string
): Promise<{ success: boolean; error?: string }> {
  const results = await getModelTestResults(campaignSlug);
  const latestTest = results.tests
    .filter(t => t.stageId === stageId && t.testModel === newModel)
    .sort((a, b) => new Date(b.testedAt).getTime() - new Date(a.testedAt).getTime())[0];
  
  if (!latestTest) {
    return { success: false, error: 'No test found for this model' };
  }
  
  if (latestTest.recommendation !== 'consider_override' && latestTest.recommendation !== 'keep_default') {
    return { success: false, error: 'Test not recommended for routing update' };
  }
  
  latestTest.routingUpdatedAt = new Date().toISOString();
  latestTest.routingUpdatedBy = updatedBy;
  results.updatedAt = new Date().toISOString();
  
  const resultsPath = path.join(CAMPAIGNS_DIR, campaignSlug, 'model-test-results.json');
  await fs.writeFile(resultsPath, JSON.stringify(results, null, 2), 'utf-8');
  
  return { success: true };
}

export async function getModelTestStats(campaignSlug: string): Promise<{
  totalTests: number;
  keepDefault: number;
  considerOverride: number;
  rejectOverride: number;
  modelsTested: string[];
}> {
  const results = await getModelTestResults(campaignSlug);
  const modelsTested = [...new Set(results.tests.map(t => t.testModel))];
  
  return {
    totalTests: results.tests.length,
    keepDefault: results.tests.filter(t => t.recommendation === 'keep_default').length,
    considerOverride: results.tests.filter(t => t.recommendation === 'consider_override').length,
    rejectOverride: results.tests.filter(t => t.recommendation === 'reject_override').length,
    modelsTested
  };
}