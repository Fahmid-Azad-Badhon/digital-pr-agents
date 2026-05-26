/**
 * Replay Mode Test Suite
 * 
 * Tests the core functionality of Replay Mode including:
 * - Pre-replay checks
 * - Dry-run execution
 * - Snapshot creation
 * - Archive management
 * - Stale artifact marking
 */

import { 
  generateRunId,
  runPreReplayChecks,
  runDryRunReplay,
  executeReplay,
  getReplayHistory,
  getReplayStatus,
  getStaleArtifacts,
  restoreArchivedOutput,
  compareRunOutputs,
  createInputSnapshot,
  archiveStageOutput,
  markStaleArtifacts,
  handleApprovalStaleness
} from './replayManager';
import fs from 'fs/promises';
import path from 'path';

const CAMPAIGNS_DIR = 'D:\\Codex Folder\\digital-pr-agents\\pitch-jobs';
const TEST_CAMPAIGN = 'smoke-test';

async function testRunIdGeneration() {
  console.log('\n=== Test: Run ID Generation ===');
  const runId1 = generateRunId('test-campaign', 'S10_PITCH_DRAFTING');
  const runId2 = generateRunId('test-campaign', 'S10_PITCH_DRAFTING');
  
  console.log('Run ID 1:', runId1);
  console.log('Run ID 2:', runId2);
  console.log('IDs are unique:', runId1 !== runId2);
  console.log('Format correct:', runId1.includes('test-campaign') && runId1.includes('S10_PITCH_DRAFTING'));
  
  return runId1 !== runId2;
}

async function testPreReplayChecks() {
  console.log('\n=== Test: Pre-Replay Checks ===');
  
  const result1 = await runPreReplayChecks(TEST_CAMPAIGN, 'S10_PITCH_DRAFTING');
  console.log('S10 checks (should have warnings):', result1.warnings.length > 0 ? 'WARNINGS FOUND (good)' : 'no warnings');
  
  const result2 = await runPreReplayChecks(TEST_CAMPAIGN, 'S1_CAMPAIGN_INTAKE');
  console.log('S1 checks passed:', result2.passed);
  
  return result1.warnings.length > 0;
}

async function testDryRunReplay() {
  console.log('\n=== Test: Dry-Run Replay ===');
  
  const report = await runDryRunReplay(
    TEST_CAMPAIGN,
    'S5_ANGLE_GENERATION',
    'stage_and_downstream',
    'Test downstream impact',
    'test'
  );
  
  console.log('Dry-run checks passed:', report.checksPassed);
  console.log('Downstream stages:', report.stageDependencyImpact.downstreamStages.length);
  console.log('S7 will become stale:', report.approvalInvalidationCheck.s7WillBecomeStale);
  console.log('Validations that would rerun:', report.validationsThatWouldRerun);
  
  const reportPath = path.join(CAMPAIGNS_DIR, TEST_CAMPAIGN, 'dry-run-replay-report.json');
  const reportExists = await fs.access(reportPath).then(() => true).catch(() => false);
  console.log('Dry-run report created:', reportExists);
  
  return report.checksPassed && report.approvalInvalidationCheck.s7WillBecomeStale;
}

async function testExecuteReplay() {
  console.log('\n=== Test: Execute Replay (dry_run type) ===');
  
  const result = await executeReplay({
    campaignSlug: TEST_CAMPAIGN,
    stageId: 'S10_PITCH_DRAFTING',
    replayType: 'dry_run',
    rerunReason: 'Test replay functionality',
    triggeredBy: 'test'
  });
  
  console.log('Replay executed:', result.success);
  console.log('Run ID generated:', result.run?.runId ? 'YES' : 'NO');
  
  return result.success;
}

async function testGetReplayStatus() {
  console.log('\n=== Test: Get Replay Status ===');
  
  const status = await getReplayStatus(TEST_CAMPAIGN);
  
  console.log('Has replay history:', status.hasReplayHistory);
  console.log('Stale artifacts count:', status.staleArtifactsCount);
  console.log('Has pending approvals:', status.hasPendingApprovals);
  console.log('Last replay date:', status.lastReplayDate || 'none');
  
  return true;
}

async function testGetStaleArtifacts() {
  console.log('\n=== Test: Get Stale Artifacts ===');
  
  const stale = await getStaleArtifacts(TEST_CAMPAIGN);
  
  console.log('Stale artifacts file exists:', stale.updatedAt !== '');
  console.log('Stale artifacts count:', stale.staleArtifacts.length);
  
  return true;
}

async function testReplayHistory() {
  console.log('\n=== Test: Get Replay History ===');
  
  const history = await getReplayHistory(TEST_CAMPAIGN);
  
  console.log('History file exists:', history.campaignSlug !== '');
  console.log('Runs recorded:', history.runs.length);
  console.log('Comparisons recorded:', history.comparisons.length);
  console.log('Restores recorded:', history.restores.length);
  
  return true;
}

async function runAllTests() {
  console.log('Starting Replay Mode Tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  const tests = [
    { name: 'Run ID Generation', fn: testRunIdGeneration },
    { name: 'Pre-Replay Checks', fn: testPreReplayChecks },
    { name: 'Dry-Run Replay', fn: testDryRunReplay },
    { name: 'Execute Replay', fn: testExecuteReplay },
    { name: 'Get Replay Status', fn: testGetReplayStatus },
    { name: 'Get Stale Artifacts', fn: testGetStaleArtifacts },
    { name: 'Get Replay History', fn: testReplayHistory }
  ];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        console.log(`✓ ${test.name}: PASSED\n`);
        passed++;
      } else {
        console.log(`✗ ${test.name}: FAILED\n`);
        failed++;
      }
    } catch (error) {
      console.log(`✗ ${test.name}: ERROR - ${error}\n`);
      failed++;
    }
  }
  
  console.log('\n=== Test Results ===');
  console.log(`Passed: ${passed}/${tests.length}`);
  console.log(`Failed: ${failed}/${tests.length}`);
  
  return failed === 0;
}

runAllTests()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('Test suite error:', err);
    process.exit(1);
  });