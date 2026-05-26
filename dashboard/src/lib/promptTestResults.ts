/**
 * =============================================================================
 * PROMPT TEST RESULTS MODULE
 * =============================================================================
 * 
 * Tracks prompt version testing results for Replay Mode.
 * Stores results in campaigns/{slug}/prompt-test-results.json
 * 
 * =============================================================================
 */

import fs from 'fs/promises';
import path from 'path';

const CAMPAIGNS_DIR = 'D:\\Codex Folder\\digital-pr-agents\\pitch-jobs';

export interface PromptTestResult {
  testId: string;
  stageId: string;
  oldPromptVersion: string;
  newPromptVersion: string;
  oldRunId: string;
  newRunId: string;
  scoreDelta: number;
  validationImproved: boolean;
  recommendation: 'promote' | 'reject' | 'needs_more_testing';
  testedAt: string;
  testedBy: string;
  notes: string[];
  promotedAt?: string;
  promotedBy?: string;
}

export interface PromptTestResults {
  campaignSlug: string;
  updatedAt: string;
  tests: PromptTestResult[];
}

export async function getPromptTestResults(campaignSlug: string): Promise<PromptTestResults> {
  const resultsPath = path.join(CAMPAIGNS_DIR, campaignSlug, 'prompt-test-results.json');
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

export async function addPromptTestResult(
  campaignSlug: string,
  testResult: Omit<PromptTestResult, 'testId' | 'testedAt'>
): Promise<PromptTestResult> {
  const results = await getPromptTestResults(campaignSlug);
  
  const newTest: PromptTestResult = {
    ...testResult,
    testId: `PROMPTTEST-${Date.now()}`,
    testedAt: new Date().toISOString()
  };
  
  results.tests.push(newTest);
  results.updatedAt = new Date().toISOString();
  
  const resultsPath = path.join(CAMPAIGNS_DIR, campaignSlug, 'prompt-test-results.json');
  await fs.writeFile(resultsPath, JSON.stringify(results, null, 2), 'utf-8');
  
  return newTest;
}

export async function getPromptTestByStage(campaignSlug: string, stageId: string): Promise<PromptTestResult[]> {
  const results = await getPromptTestResults(campaignSlug);
  return results.tests.filter(t => t.stageId === stageId);
}

export async function getLatestPromptTest(campaignSlug: string, stageId: string): Promise<PromptTestResult | null> {
  const tests = await getPromptTestByStage(campaignSlug, stageId);
  if (tests.length === 0) return null;
  
  const sorted = tests.sort((a, b) => new Date(b.testedAt).getTime() - new Date(a.testedAt).getTime());
  return sorted[0];
}

export async function promotePromptVersion(
  campaignSlug: string,
  testId: string,
  promotedBy: string
): Promise<{ success: boolean; error?: string }> {
  const results = await getPromptTestResults(campaignSlug);
  const test = results.tests.find(t => t.testId === testId);
  
  if (!test) {
    return { success: false, error: 'Test not found' };
  }
  
  if (test.recommendation !== 'promote') {
    return { success: false, error: 'Test not recommended for promotion' };
  }
  
  test.promotedAt = new Date().toISOString();
  test.promotedBy = promotedBy;
  results.updatedAt = new Date().toISOString();
  
  const resultsPath = path.join(CAMPAIGNS_DIR, campaignSlug, 'prompt-test-results.json');
  await fs.writeFile(resultsPath, JSON.stringify(results, null, 2), 'utf-8');
  
  return { success: true };
}

export async function getPromptTestStats(campaignSlug: string): Promise<{
  totalTests: number;
  promoted: number;
  rejected: number;
  needsMoreTesting: number;
}> {
  const results = await getPromptTestResults(campaignSlug);
  
  return {
    totalTests: results.tests.length,
    promoted: results.tests.filter(t => t.recommendation === 'promote').length,
    rejected: results.tests.filter(t => t.recommendation === 'reject').length,
    needsMoreTesting: results.tests.filter(t => t.recommendation === 'needs_more_testing').length
  };
}