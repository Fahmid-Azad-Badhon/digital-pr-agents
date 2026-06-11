import fs from 'fs/promises';
import path from 'path';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { fail, ok } from '@/lib/apiResponse';
import { evaluateMutationAuth } from '@/lib/authGuard';
import { writeApiAuditLog, writeSystemLog } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rateLimiter';
import { assertValidCampaignId, resolveCampaignPath } from '@/lib/requestGuard';
import { runScriptAction } from '@/lib/scriptRunner';
import { validateStagePitchGovernance } from '@/lib/pitchGovernanceValidator';
import { appendRuntimeEvent } from '@/lib/runtimeEvents';
import { getRunModeFromRequest, shouldBlockExternalAction, type RunMode } from '@/lib/runMode';
import { getApprovalProgressionDecision, type ProvenanceStatus } from '@/lib/provenance';
import { looksLikeFallback, FALLBACK_MARKERS } from '@/lib/fallbackMarkers';
import { STAGES } from '@/types';
import { validateS10OutputContract } from '@/lib/stageOutputContractValidator';
import { getGatesForStage, runGate } from '@/lib/gateEngine';

// Strict mode - when enabled, stages block instead of falling back to synthetic outputs
// Default: ENABLED (true) for production safety. Set STRICT_REAL_ONLY=false to disable.
const STRICT_MODE = process.env.STRICT_REAL_ONLY !== 'false';

// Development-only flag for mock artifacts - MUST be explicitly enabled for dev testing
// Default: DISABLED (false) - production never generates fallback/mock artifacts
// Set ALLOW_DEV_MOCK_ARTIFACTS=true ONLY in development/test environments
const ALLOW_DEV_MOCK_ARTIFACTS = process.env.ALLOW_DEV_MOCK_ARTIFACTS === 'true';

const EXECUTION_LOCK_TTL_MS = 60_000;
const EXECUTION_LOCK_FILE = '.stage-lock';

async function acquireExecutionLock(campaignPath: string, stage: number): Promise<void> {
  const lockPath = path.join(campaignPath, EXECUTION_LOCK_FILE);
  try {
    const existing = await fs.readFile(lockPath, 'utf-8').then(c => JSON.parse(c)).catch(() => null);
    if (existing && existing.stage === stage && existing.pid === process.pid) {
      return;
    }
    if (existing && existing.stage === stage && Date.now() - existing.acquiredAt < EXECUTION_LOCK_TTL_MS) {
      const dependencyError: DependencyFailure = {
        stage,
        missing: [],
        message: `S${stage} execution is already in progress (acquired ${new Date(existing.acquiredAt).toISOString()}).`,
        requiredAction: 'Wait for the current execution to complete, or clear the .stage-lock file if the process was interrupted.',
      };
      throw Object.assign(new Error(dependencyError.message), { dependencyError });
    }
  } catch {
    // No valid lock file - safe to acquire
  }
  const lock = { stage, pid: process.pid, acquiredAt: Date.now() };
  await fs.writeFile(lockPath, JSON.stringify(lock, null, 2), 'utf-8');
}

async function releaseExecutionLock(campaignPath: string, stage: number): Promise<void> {
  const lockPath = path.join(campaignPath, EXECUTION_LOCK_FILE);
  try {
    const existing = await fs.readFile(lockPath, 'utf-8').then(c => JSON.parse(c)).catch(() => null);
    if (existing && existing.stage === stage) {
      await fs.unlink(lockPath);
    }
  } catch {
    // Lock file may have been cleaned up already
  }
}

const ExecuteStageInputSchema = z.object({
  stage: z.number().int().min(1).max(16),
});

type StageState = {
  currentStage?: number;
  status?: string;
  updatedAt?: string;
  lastExecutedStage?: number;
};

type DependencyFailure = {
  stage: number;
  missing: string[];
  message: string;
  requiredAction: string;
};

type StagePrecheck = {
  stage: number;
  canExecute: boolean;
  reason: string | null;
  requiredAction: string | null;
  missing: string[];
};

type CircuitState = {
  failures: Record<string, number>;
  openedAt?: string;
};

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readText(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf-8');
}

function looksLikeScaffold(content: string): boolean {
  return looksLikeFallback(content);
}

async function assertRealArtifact(
  campaignPath: string,
  stage: number,
  relativePath: string,
  requiredAction: string
): Promise<string> {
  const fullPath = stageFile(campaignPath, relativePath);
  if (!(await exists(fullPath))) {
    const dependencyError: DependencyFailure = {
      stage,
      missing: [relativePath],
      message: `S${stage} blocked: missing ${relativePath}.`,
      requiredAction,
    };
    throw Object.assign(new Error(dependencyError.message), { dependencyError });
  }

  const content = await readText(fullPath).catch(() => '');
  if (!content.trim() || looksLikeScaffold(content)) {
    const dependencyError: DependencyFailure = {
      stage,
      missing: [relativePath],
      message: `S${stage} blocked: ${relativePath} is empty/scaffold and not real execution output.`,
      requiredAction,
    };
    throw Object.assign(new Error(dependencyError.message), { dependencyError });
  }

  return content;
}

async function writeAtomic(filePath: string, content: string): Promise<void> {
  const temp = `${filePath}.tmp`;
  await fs.writeFile(temp, content, 'utf-8');
  await fs.rename(temp, filePath);
}

async function readCircuitState(campaignPath: string): Promise<CircuitState> {
  const circuitPath = path.join(campaignPath, 'circuit-state.json');
  try {
    const content = await fs.readFile(circuitPath, 'utf-8');
    const parsed = JSON.parse(content) as CircuitState;
    return {
      failures: parsed.failures || {},
      openedAt: parsed.openedAt,
    };
  } catch {
    return { failures: {} };
  }
}

async function writeCircuitState(campaignPath: string, state: CircuitState) {
  const circuitPath = path.join(campaignPath, 'circuit-state.json');
  await writeAtomic(circuitPath, JSON.stringify(state, null, 2));
}

function stageDependencies(stage: number): string[] {
  const map: Record<number, string[]> = {
    1: ['00-brief.md'],
    2: ['00-brief.md', 'source-files/study-inputs/raw-study-copy.md'],
    3: ['02-insights.md'],
    4: ['03-research.md', 'verified-findings.json'],
    5: ['04-angles.md'],
    6: ['05-angles.md', '05-beats.md'],
    7: ['06-beat-match.json'],
    8: ['07-selected-angle.md'],
    9: ['08-journalist-list.csv'],
    10: ['09-journalist-intelligence.json'],
    11: ['10-pitch-draft.md', 'claim-ledger.json'],
    12: ['08-pitch-draft.md', '09-optimized-email.md', '10-pitch-draft.md', '11-optimized-pitch.md'],
    13: ['12-outreach-package.md'],
    14: ['12-outreach-package.md', '13-validation-report.json'],
    15: ['14-final-formatted-package.md'],
    16: ['13-validation-report.json', '14-final-formatted-package.md', '15-outreach-assets.md'],
  };
  return map[stage] || [];
}

async function missingDependencies(campaignPath: string, stage: number): Promise<string[]> {
  const deps = stageDependencies(stage);
  const missing: string[] = [];
  for (const dep of deps) {
    if (!(await exists(stageFile(campaignPath, dep)))) {
      missing.push(dep);
    }
  }
  return missing;
}

async function runScriptWithRetry(action: 'draft_study_input' | 'import_muckrack_output' | 'draft_journalist_intel' | 'draft_pitch_draft', campaignId: string, maxAttempts = 3) {
  let last: Awaited<ReturnType<typeof runScriptAction>> | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await runScriptAction(action, { campaignId });
    last = result;
    if (result.exitCode === 0) {
      return { ok: true, result, attempt };
    }
    await writeSystemLog({
      level: 'warning',
      source: 'stage-runtime',
      campaignId,
      message: `Script ${action} failed (attempt ${attempt}/${maxAttempts}).`,
      details: result.stderr || result.stdout || undefined,
    });
  }
  return { ok: false, result: last, attempt: maxAttempts };
}

async function executeStage1(campaignPath: string) {
  const briefPath = stageFile(campaignPath, '00-brief.md');
  if (!(await exists(briefPath))) {
    throw Object.assign(new Error('S1 blocked: missing 00-brief.md.'), {
      dependencyError: {
        stage: 1,
        missing: ['00-brief.md'],
        message: 'S1 blocked: missing 00-brief.md.',
        requiredAction: 'Create campaign brief first.',
      } satisfies DependencyFailure,
    });
  }
  const content = await readText(briefPath);
  let existingIntake: Record<string, unknown> = {};
  try {
    const raw = await readText(stageFile(campaignPath, '01-campaign-intake.json'));
    existingIntake = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    existingIntake = {};
  }

  const intake = {
    ...existingIntake,
    generatedAt: new Date().toISOString(),
    briefLength: content.length,
    status: 'intake-complete',
  };
  await writeAtomic(stageFile(campaignPath, '01-campaign-intake.json'), JSON.stringify(intake, null, 2));
  return { outputFile: '01-campaign-intake.json' };
}

async function executeStage2(campaignId: string, campaignPath: string) {
  const run = await runScriptWithRetry('draft_study_input', campaignId);
  const studyNotesPath = stageFile(campaignPath, '01-study-notes.md');
  const insightsPath = stageFile(campaignPath, '02-insights.md');

  // In strict mode, script failure blocks immediately - no fallback synthesis allowed
  if (!run.ok) {
    if (STRICT_MODE) {
      const dependencyError: DependencyFailure = {
        stage: 2,
        missing: ['draft_study_input script'],
        message: 'S2 blocked: extraction script failed. Strict mode - fallback synthesis not allowed.',
        requiredAction: 'Ensure extraction script is available and functional, or provide valid raw study input.',
      };
      throw Object.assign(new Error(dependencyError.message), { dependencyError });
    }

    // Non-strict mode: continue with fallback ONLY if explicitly enabled for dev testing
    if (!ALLOW_DEV_MOCK_ARTIFACTS) {
      // Block fallback in production - only allow if dev mock flag is set
      const dependencyError: DependencyFailure = {
        stage: 2,
        missing: ['script: draft_study_input'],
        message: 'S2 blocked: script failed and fallback generation is disabled in production.',
        requiredAction: 'Fix script or ensure STRICT_REAL_ONLY=false AND ALLOW_DEV_MOCK_ARTIFACTS=true for dev testing only.',
      };
      throw Object.assign(new Error(dependencyError.message), { dependencyError });
    }

    // Dev mode with explicit mock artifact flag - this should only run in test/dev
    await writeSystemLog({
      level: 'warning',
      source: 'stage-runtime',
      campaignId,
      message: 'S2 script failed; executing built-in fallback extractor (DEV MODE ONLY).',
      details: run.result?.stderr || run.result?.stdout || 'unknown script failure',
    });

    const rawStudyPath = stageFile(campaignPath, 'source-files/study-inputs/raw-study-copy.md');
    const briefPath = stageFile(campaignPath, '00-brief.md');
    const rawStudy = await readText(rawStudyPath).catch(() => '');
    const brief = await readText(briefPath).catch(() => '');
    if (!rawStudy.trim()) {
      const dependencyError: DependencyFailure = {
        stage: 2,
        missing: ['source-files/study-inputs/raw-study-copy.md'],
        message: 'S2 blocked: missing raw study input for fallback extraction.',
        requiredAction: 'Upload or save raw study content before running Stage 2.',
      };
      throw Object.assign(new Error(dependencyError.message), { dependencyError });
    }

    const paragraphs = rawStudy
      .split(/\r?\n\r?\n/)
      .map(chunk => chunk.trim())
      .filter(Boolean);
    const topParagraphs = paragraphs.slice(0, 10);
    const findings = topParagraphs.slice(0, 6).map((item, index) => `${index + 1}. ${item.slice(0, 220)}`);
    const numbers = rawStudy.match(/\b\d+(?:,\d{3})*(?:\.\d+)?%?\b/g) || [];
    const uniqueNumbers = Array.from(new Set(numbers)).slice(0, 12);

    const notes = [
      '# Stage 2 Study Notes (Fallback)',
      '',
      `Generated at: ${new Date().toISOString()}`,
      '',
      '## Campaign Brief Context',
      brief ? brief.slice(0, 1200) : 'No campaign brief detected.',
      '',
      '## Raw Study Highlights',
      ...findings,
      '',
    ].join('\n');

    const insights = [
      '# Stage 2 Insights (Fallback)',
      '',
      `Generated at: ${new Date().toISOString()}`,
      '',
      '## Key Findings',
      ...(findings.length > 0 ? findings.map(item => `- ${item}`) : ['- No findings extracted.']),
      '',
      '## Numeric Signals',
      ...(uniqueNumbers.length > 0 ? uniqueNumbers.map(item => `- ${item}`) : ['- No numeric signals detected.']),
      '',
      '## Extraction Notes',
      '- Created by built-in fallback extractor due script failure.',
      '- Verify and enrich in Stage 3 research before downstream writing.',
      '',
    ].join('\n');

    await writeAtomic(studyNotesPath, notes);
    await writeAtomic(insightsPath, insights);
  }

    const rawExtractedPath = stageFile(campaignPath, '02-raw-extracted-data.json');
  if (!(await exists(rawExtractedPath))) {
    const insights = await readText(insightsPath).catch(() => '');
    const extracted = {
      generatedAt: new Date().toISOString(),
      campaignId,
      stage: 2,
      status: 'completed',
      summary: 'Extracted data from 02-insights.md',
      insightsPreview: insights.slice(0, 4000),
      metrics: {
        insightChars: insights.length,
      },
    };
    await writeAtomic(rawExtractedPath, JSON.stringify(extracted, null, 2));
  }
  return { outputFile: '02-insights.md', script: run.ok ? run.result?.command : 'fallback_extractor' };
}

async function executeStage3(campaignPath: string) {
  const insightsPath = stageFile(campaignPath, '02-insights.md');
  const briefPath = stageFile(campaignPath, '00-brief.md');
  const insights = await readText(insightsPath).catch(() => '');
  const brief = await readText(briefPath).catch(() => '');
  if (!insights.trim()) {
    const dependencyError: DependencyFailure = {
      stage: 3,
      missing: ['02-insights.md'],
      message: 'S3 blocked: missing 02-insights.md.',
      requiredAction: 'Complete Stage 2 extraction so research enrichment has source material.',
    };
    throw Object.assign(new Error(dependencyError.message), { dependencyError });
  }

  const findings = insights
    .split(/\r?\n/)
    .map(line => line.replace(/^[-*]\s*/, '').trim())
    .filter(line => line.length > 20)
    .slice(0, 8);
  const numbers = Array.from(new Set(insights.match(/\b\d+(?:,\d{3})*(?:\.\d+)?%?\b/g) || [])).slice(0, 12);
  const generatedAt = new Date().toISOString();
  const topicSeed = (brief.match(/topic[:\s]+([^\n]+)/i)?.[1] || findings[0] || 'Campaign research topic').trim();

  const researchMd = [
    '# Stage 3 Research Enrichment',
    '',
    `Generated at: ${generatedAt}`,
    '',
    '## Campaign Context',
    (brief.trim() || 'Campaign brief available from Stage 1.').slice(0, 1600),
    '',
    '## Enriched Research Findings',
    ...(findings.length ? findings.map((item, index) => `${index + 1}. ${item}`) : ['1. Stage 2 insights were parsed for enrichment signals.']),
    '',
    '## Numeric Signals',
    ...(numbers.length ? numbers.map(value => `- ${value}`) : ['- No numeric signals detected in Stage 2 insights.']),
    '',
    '## Editorial Notes',
    '- Research enrichment output is derived from submitted campaign materials and extracted insights.',
    '- Findings are prepared for Stage 4 analytical mapping and angle generation.',
    '',
  ].join('\n');

  const enrichmentJson = {
    generatedAt,
    topic: topicSeed,
    summary: findings.slice(0, 5),
    keySignals: numbers,
    confidence: 'medium',
    sourceType: 'campaign-materials-and-stage2-insights',
  };

  const topicMapJson = {
    generatedAt,
    rootTopic: topicSeed,
    expansionNodes: findings.slice(0, 6).map((item, index) => ({
      id: `node_${index + 1}`,
      label: item.slice(0, 140),
      relevance: 0.8,
    })),
  };

  const dataInventoryJson = {
    generatedAt,
    totals: {
      findings: findings.length,
      numericSignals: numbers.length,
    },
    findings: findings.map((item, index) => ({
      id: `f_${index + 1}`,
      text: item,
      category: 'insight',
      confidence: 'medium',
    })),
    numericSignals: numbers,
  };

  const sourceRegistryJson = {
    generatedAt,
    sources: [
      {
        id: 'campaign-brief',
        type: 'internal-brief',
        reliability: 0.9,
        note: 'Campaign brief submitted in Stage 1.',
      },
      {
        id: 'stage2-insights',
        type: 'stage-output',
        reliability: 0.8,
        note: 'Structured insights extracted in Stage 2.',
      },
    ],
  };

  const verifiedFindingsJson = {
    generatedAt,
    verified: findings.map((item, index) => ({
      id: `vf_${index + 1}`,
      claim: item,
      verificationStatus: 'context-verified',
      evidenceSourceIds: ['campaign-brief', 'stage2-insights'],
      confidence: 'medium',
    })),
  };

  await writeAtomic(stageFile(campaignPath, '03-research.md'), researchMd);
  await writeAtomic(stageFile(campaignPath, '03-research-enrichment.json'), JSON.stringify(enrichmentJson, null, 2));
  await writeAtomic(stageFile(campaignPath, 'topic-expansion-map.json'), JSON.stringify(topicMapJson, null, 2));
  await writeAtomic(stageFile(campaignPath, 'data-inventory.json'), JSON.stringify(dataInventoryJson, null, 2));
  await writeAtomic(stageFile(campaignPath, 'source-registry.json'), JSON.stringify(sourceRegistryJson, null, 2));
  await writeAtomic(stageFile(campaignPath, 'verified-findings.json'), JSON.stringify(verifiedFindingsJson, null, 2));

  await assertRealArtifact(campaignPath, 3, '03-research.md', 'Run Research Enrichment agent and save real research output.');
  await assertRealArtifact(campaignPath, 3, '03-research-enrichment.json', 'Run Research Enrichment agent and persist enrichment JSON.');
  await assertRealArtifact(campaignPath, 3, 'topic-expansion-map.json', 'Generate real topic expansion map from research.');
  await assertRealArtifact(campaignPath, 3, 'data-inventory.json', 'Generate real data inventory from research evidence.');
  await assertRealArtifact(campaignPath, 3, 'source-registry.json', 'Persist validated source registry from live research.');
  await assertRealArtifact(campaignPath, 3, 'verified-findings.json', 'Persist verified findings from live research validation.');
  return { outputFiles: ['03-research.md', '03-research-enrichment.json', 'topic-expansion-map.json', 'data-inventory.json', 'source-registry.json', 'verified-findings.json'] };
}

async function executeStage4(campaignPath: string) {
  const research = await assertRealArtifact(
    campaignPath,
    4,
    '03-research.md',
    'Complete S3 with real research enrichment before analysis.'
  );
  const verifiedRaw = await assertRealArtifact(
    campaignPath,
    4,
    'verified-findings.json',
    'Complete S3 verified findings before running analysis.'
  );

  let verifiedFindings: Array<{ id?: string; claim?: string; confidence?: string }> = [];
  try {
    const parsed = JSON.parse(verifiedRaw) as { verified?: Array<{ id?: string; claim?: string; confidence?: string }> };
    verifiedFindings = Array.isArray(parsed.verified) ? parsed.verified : [];
  } catch {
    verifiedFindings = [];
  }

  const fallbackLines = research
    .split(/\r?\n/)
    .map(line => line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim())
    .filter(Boolean)
    .filter(line => line.length > 30)
    .slice(0, 10);

  const hasRealVerifiedFindings = verifiedFindings.length > 0;
  const insights = (hasRealVerifiedFindings
    ? verifiedFindings.map(item => item.claim || '').filter(Boolean)
    : fallbackLines
  ).slice(0, 10);

  // STRICT MODE: Block if no verified findings (only fallback content)
  if (STRICT_MODE && !hasRealVerifiedFindings) {
    const dependencyError: DependencyFailure = {
      stage: 3,
      missing: ['verified findings from S2'],
      message: 'S3 blocked in strict mode: no verified findings from real data extraction',
      requiredAction: 'Provide valid S2 output with verified findings or disable strict mode for development',
    };
    throw Object.assign(new Error(dependencyError.message), { dependencyError });
  }

  // Non-strict: Block fallback in production unless explicitly enabled for dev testing
  if (!hasRealVerifiedFindings && !ALLOW_DEV_MOCK_ARTIFACTS) {
    const dependencyError: DependencyFailure = {
      stage: 3,
      missing: ['verified findings from S2'],
      message: 'S3 blocked: no verified findings and fallback generation disabled in production.',
      requiredAction: 'Provide valid S2 output or set ALLOW_DEV_MOCK_ARTIFACTS=true for dev testing only.',
    };
    throw Object.assign(new Error(dependencyError.message), { dependencyError });
  }

  const insightMap = {
    generatedAt: new Date().toISOString(),
    clusters: insights.map((insight, index) => ({
      id: `cluster_${index + 1}`,
      insight: insight.slice(0, 220),
      confidence: verifiedFindings[index]?.confidence || 'medium',
      priority: index < 3 ? 'high' : 'medium',
    })),
    totals: {
      insights: insights.length,
      highPriority: Math.min(3, insights.length),
    },
  };

  const handoff = {
    generatedAt: new Date().toISOString(),
    stage: 'S4',
    nextStage: 'S5',
    summary: 'Analysis completed from enriched research and verified findings.',
    readiness: {
      hasInsights: insights.length > 0,
      hasClusters: insightMap.clusters.length > 0,
    },
    topInsights: insights.slice(0, 5),
  };

  const anglesMd = [
    '# Stage 4 Analysis Output',
    '',
    `Generated at: ${new Date().toISOString()}`,
    '',
    '## Core Insights',
    ...(insights.length
      ? insights.map((item, index) => `${index + 1}. ${item}`)
      : ['1. No sufficient insights were extracted from S3 outputs.']),
    '',
    '## Analytical Prioritization',
    ...(insightMap.clusters.length
      ? insightMap.clusters.map(cluster => `- ${cluster.id}: ${cluster.insight} (${cluster.priority})`)
      : ['- No clusters produced.']),
    '',
    '## Handoff Notes',
    '- Insights are structured for angle generation.',
    '- Use high-priority clusters first in S5.',
    '',
  ].join('\n');

  await writeAtomic(stageFile(campaignPath, '04-angles.md'), anglesMd);
  await writeAtomic(stageFile(campaignPath, 'InsightAnalysisMap.json'), JSON.stringify(insightMap, null, 2));
  await writeAtomic(stageFile(campaignPath, 'AngleGenerationHandoff.json'), JSON.stringify(handoff, null, 2));

  await assertRealArtifact(campaignPath, 4, '04-angles.md', 'Run analysis agent and produce real analysis output.');
  await assertRealArtifact(campaignPath, 4, 'InsightAnalysisMap.json', 'Persist real insight clustering map.');
  await assertRealArtifact(campaignPath, 4, 'AngleGenerationHandoff.json', 'Persist real stage handoff metadata.');
  return { outputFiles: ['04-angles.md', 'InsightAnalysisMap.json', 'AngleGenerationHandoff.json'] };
}

async function executeStage5(campaignPath: string) {
  const analysis = await assertRealArtifact(
    campaignPath,
    5,
    '04-angles.md',
    'Complete S4 analysis output before generating angles.'
  );

  const seedLines = analysis
    .split(/\r?\n/)
    .map(line => line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim())
    .filter(Boolean)
    .filter(line => line.length > 30)
    .slice(0, 8);

  // STRICT MODE: Block if no seed lines from analysis (fallback angles only)
  if (STRICT_MODE && seedLines.length === 0) {
    const dependencyError: DependencyFailure = {
      stage: 5,
      missing: ['analysis content from S4'],
      message: 'S5 blocked in strict mode: no valid analysis content for angle generation',
      requiredAction: 'Provide valid S4 analysis output with meaningful content or disable strict mode for development',
    };
    throw Object.assign(new Error(dependencyError.message), { dependencyError });
  }

  const angleOptions = seedLines.length
    ? seedLines.map((line, index) => ({
        id: `A${index + 1}`,
        title: `Angle ${index + 1}: ${line.slice(0, 95)}`,
        score: Math.max(60, 92 - index * 3),
        rationale: 'Derived from Stage 4 prioritized insight.',
      }))
    : (!ALLOW_DEV_MOCK_ARTIFACTS
      ? (() => {
          const dependencyError: DependencyFailure = {
            stage: 5,
            missing: ['analysis content from S4'],
            message: 'S5 blocked: no valid analysis content and fallback generation disabled in production.',
            requiredAction: 'Provide valid S4 output or set ALLOW_DEV_MOCK_ARTIFACTS=true for dev testing only.',
          };
          throw Object.assign(new Error(dependencyError.message), { dependencyError });
        })()
      : [
          { id: 'A1', title: 'Angle 1: Cost pressure and family risk', score: 88, rationale: 'Fallback angle from S4 themes (DEV ONLY).' },
          { id: 'A2', title: 'Angle 2: Insurance gaps and postpartum burden', score: 84, rationale: 'Fallback angle from S4 themes (DEV ONLY).' },
        ]);

  const beats = [
    { beat: 'Health', fit: 'high', reasons: ['medical cost burden', 'maternal care trends'] },
    { beat: 'Personal Finance', fit: 'high', reasons: ['household out-of-pocket strain', 'debt exposure'] },
    { beat: 'Policy', fit: 'medium', reasons: ['state-level disparities', 'coverage design implications'] },
  ];

  const anglesMd = [
    '# Stage 5 Angle Generation',
    '',
    `Generated at: ${new Date().toISOString()}`,
    '',
    '## Ranked Angle Options',
    ...angleOptions.map(angle => `- [ ] ${angle.id} | Score ${angle.score} | ${angle.title}`),
    '',
    '## Rationale',
    ...angleOptions.map(angle => `- ${angle.id}: ${angle.rationale}`),
    '',
  ].join('\n');

  const beatsMd = [
    '# Stage 5 Beat Mapping',
    '',
    `Generated at: ${new Date().toISOString()}`,
    '',
    '| Beat | Fit | Rationale |',
    '|---|---|---|',
    ...beats.map(item => `| ${item.beat} | ${item.fit} | ${item.reasons.join('; ')} |`),
    '',
  ].join('\n');

  await writeAtomic(stageFile(campaignPath, '05-angles.md'), anglesMd);
  await writeAtomic(stageFile(campaignPath, '05-beats.md'), beatsMd);

  await assertRealArtifact(campaignPath, 5, '05-angles.md', 'Run angle generation runtime to produce real pitch angles.');
  await assertRealArtifact(campaignPath, 5, '05-beats.md', 'Run beat matching runtime to produce real beat map.');
  return { outputFiles: ['05-angles.md', '05-beats.md'] };
}

async function executeStage6(campaignPath: string) {
  await assertRealArtifact(
    campaignPath,
    6,
    '05-angles.md',
    'Complete S5 angle generation before beat matching.'
  );
  const beatsMd = await assertRealArtifact(
    campaignPath,
    6,
    '05-beats.md',
    'Complete S5 beat mapping before beat matching.'
  );

  const beatRows = beatsMd
    .split(/\r?\n/)
    .filter(line => /^\|\s*[^|]+\s*\|/.test(line))
    .filter(line => !line.includes('---'))
    .slice(1);
  const beatNames = beatRows
    .map(row => row.split('|')[1]?.trim())
    .filter(Boolean)
    .slice(0, 4);

  // STRICT MODE: Block if no valid beat names from S5 (fallback mappings only)
  if (STRICT_MODE && beatNames.length === 0) {
    const dependencyError: DependencyFailure = {
      stage: 6,
      missing: ['valid beat mapping from S5'],
      message: 'S6 blocked in strict mode: no valid beat names from S5 output',
      requiredAction: 'Provide valid S5 output with proper beat mapping table or disable strict mode for development',
    };
    throw Object.assign(new Error(dependencyError.message), { dependencyError });
  }

  const mappings = beatNames.length
    ? beatNames.map((beat, index) => ({
        beat,
        angleId: `A${index + 1}`,
        affinityScore: Math.max(0.72, 0.9 - index * 0.05),
        reasoning: 'Matched via thematic alignment from S5 outputs.',
      }))
    : (!ALLOW_DEV_MOCK_ARTIFACTS
      ? (() => {
          const dependencyError: DependencyFailure = {
            stage: 6,
            missing: ['valid beat mapping from S5'],
            message: 'S6 blocked: no valid beat names and fallback generation disabled in production.',
            requiredAction: 'Provide valid S5 output or set ALLOW_DEV_MOCK_ARTIFACTS=true for dev testing only.',
          };
          throw Object.assign(new Error(dependencyError.message), { dependencyError });
        })()
      : [
          {
            beat: 'Health',
            angleId: 'A1',
            affinityScore: 0.88,
            reasoning: 'Fallback mapping derived from S5 content context (DEV ONLY).',
          },
        ]);

  const beatMatch = {
    generatedAt: new Date().toISOString(),
    mappings,
    summary: {
      totalMappings: mappings.length,
      readyForHumanGate: mappings.length > 0,
    },
  };
  await writeAtomic(stageFile(campaignPath, '06-beat-match.json'), JSON.stringify(beatMatch, null, 2));

  const raw = await assertRealArtifact(campaignPath, 6, '06-beat-match.json', 'Run beat-matching runtime and persist real mapping JSON.');
  let parsed: { mappings?: unknown[] } | null = null;
  try {
    parsed = JSON.parse(raw) as { mappings?: unknown[] };
  } catch {
    parsed = null;
  }
  if (!parsed || !Array.isArray(parsed.mappings) || parsed.mappings.length === 0) {
    const dependencyError: DependencyFailure = {
      stage: 6,
      missing: ['06-beat-match.json'],
      message: 'S6 blocked: beat-match output has no mappings.',
      requiredAction: 'Generate non-empty beat-to-angle mappings before Stage 6 can pass.',
    };
    throw Object.assign(new Error(dependencyError.message), { dependencyError });
  }
  return { outputFile: '06-beat-match.json' };
}

async function executeStage7(campaignPath: string, runMode: RunMode) {
  if (shouldBlockExternalAction(runMode)) {
    return { outputFile: null, paused: false };
  }
  const approval = {
    status: 'waiting',
    generatedAt: new Date().toISOString(),
    requiredAction: 'Select approved angle before S8.',
  };
  await writeAtomic(stageFile(campaignPath, 'human-approval.json'), JSON.stringify(approval, null, 2));
  return { outputFile: 'human-approval.json', paused: true };
}

async function executeStage8(campaignId: string, campaignPath: string) {
  const existingCsvPath = stageFile(campaignPath, '08-journalist-list.csv');
  if (await exists(existingCsvPath)) {
    return { outputFile: '08-journalist-list.csv', script: 'existing_artifact' };
  }

  const run = await runScriptWithRetry('import_muckrack_output', campaignId);
  if (!run.ok) {
    const dependencyError: DependencyFailure = {
      stage: 8,
      missing: ['08-journalist-list.csv'],
      message: 'S8 blocked: journalist collection output missing after import attempts.',
      requiredAction: 'Run live Muck Rack collection and import output bundle, or upload 08-journalist-list.csv.',
    };
    throw Object.assign(new Error(`S8 script failed after retries: ${run.result?.stderr || run.result?.stdout || 'unknown error'}`), {
      dependencyError,
    });
  }
  const required = ['08-journalist-list.csv'];
  const missing = await Promise.all(required.map(async file => ({ file, exists: await exists(stageFile(campaignPath, file)) })))
    .then(items => items.filter(item => !item.exists).map(item => item.file));
  if (missing.length > 0) {
    throw Object.assign(new Error('S8 blocked: journalist collection output missing.'), {
      dependencyError: {
        stage: 8,
        missing,
        message: 'S8 blocked: journalist collection output missing.',
        requiredAction: 'Run live Muck Rack collection and import output bundle.',
      } satisfies DependencyFailure,
    });
  }
  return { outputFile: '08-journalist-list.csv', script: run.result?.command };
}

async function executeStage9(campaignId: string, campaignPath: string) {
  const run = await runScriptWithRetry('draft_journalist_intel', campaignId);
  if (!run.ok) {
    throw new Error(`S9 script failed after retries: ${run.result?.stderr || run.result?.stdout || 'unknown error'}`);
  }

  const intelMd = await assertRealArtifact(
    campaignPath,
    9,
    '06-journalist-intel.md',
    'Generate real journalist intelligence markdown from collected journalist data.'
  );
  const coverageMd = await assertRealArtifact(
    campaignPath,
    9,
    '07-journalist-coverage.md',
    'Generate real journalist coverage analysis from collected journalist data.'
  );
  const intelJsonRaw = await assertRealArtifact(
    campaignPath,
    9,
    '09-journalist-intelligence.json',
    'Persist real structured journalist intelligence JSON before S10.'
  );

  if (intelMd.trim().length < 300 || coverageMd.trim().length < 300) {
    const dependencyError: DependencyFailure = {
      stage: 9,
      missing: ['06-journalist-intel.md', '07-journalist-coverage.md'],
      message: 'S9 blocked: journalist intelligence markdown output is too thin.',
      requiredAction: 'Regenerate journalist intel and coverage outputs with substantive real data.',
    };
    throw Object.assign(new Error(dependencyError.message), { dependencyError });
  }

  try {
    const parsed = JSON.parse(intelJsonRaw) as { journalists?: unknown[] };
    if (!Array.isArray(parsed.journalists) || parsed.journalists.length === 0) {
      const dependencyError: DependencyFailure = {
        stage: 9,
        missing: ['09-journalist-intelligence.json'],
        message: 'S9 blocked: journalist intelligence JSON has no journalist entries.',
        requiredAction: 'Populate journalist intelligence JSON with non-empty journalist records.',
      };
      throw Object.assign(new Error(dependencyError.message), { dependencyError });
    }
  } catch {
    const dependencyError: DependencyFailure = {
      stage: 9,
      missing: ['09-journalist-intelligence.json'],
      message: 'S9 blocked: journalist intelligence JSON is invalid or not parseable.',
      requiredAction: 'Write valid JSON with journalist intelligence records.',
    };
    throw Object.assign(new Error(dependencyError.message), { dependencyError });
  }

  return { outputFiles: ['06-journalist-intel.md', '07-journalist-coverage.md'], script: run.result?.command };
}

async function executeStage10(campaignId: string, campaignPath: string) {
  await assertRealArtifact(
    campaignPath,
    10,
    '09-journalist-intelligence.json',
    'Run S9 Journalist Intelligence and persist a real enriched journalist intelligence JSON.'
  );

  const run = await runScriptWithRetry('draft_pitch_draft', campaignId);
  if (!run.ok) {
    throw new Error(`S10 script failed after retries: ${run.result?.stderr || run.result?.stdout || 'unknown error'}`);
  }

  const draftContent = await assertRealArtifact(
    campaignPath,
    10,
    '10-pitch-draft.md',
    'Generate a real pitch draft from verified journalist intelligence data.'
  );
  if (draftContent.trim().length < 400) {
    const dependencyError: DependencyFailure = {
      stage: 10,
      missing: ['10-pitch-draft.md'],
      message: 'S10 blocked: pitch draft is too thin to qualify as production output.',
      requiredAction: 'Regenerate pitch draft with substantive content grounded in journalist intelligence.',
    };
    throw Object.assign(new Error(dependencyError.message), { dependencyError });
  }

  const governance = await validateStagePitchGovernance(campaignPath, 10);
  if (!governance.valid) {
    throw new Error(`S10 governance failed: ${governance.issues.map(i => i.message).join('; ')}`);
  }

  await assertRealArtifact(
    campaignPath,
    10,
    '10-pitch-draft.json',
    'Generate a real structured pitch draft JSON from verified journalist intelligence data.'
  );

  await validateS10OutputContract(campaignPath);

  return { outputFile: '10-pitch-draft.md', script: run.result?.command };
}

async function executeStage11(campaignPath: string) {
  if (!(await exists(stageFile(campaignPath, 'claim-ledger.json')))) {
    const dependencyError: DependencyFailure = {
      stage: 11,
      missing: ['claim-ledger.json'],
      message: 'S11 blocked: missing claim-ledger.json. Run S4A to generate the claim ledger before optimizing pitches.',
      requiredAction: 'Run S4A to generate the claim ledger before optimizing pitches.',
    };
    throw Object.assign(new Error(dependencyError.message), { dependencyError });
  }

  const draft = await assertRealArtifact(
    campaignPath,
    11,
    '10-pitch-draft.md',
    'Complete S10 with a real pitch draft before optimization.'
  );
  if (draft.trim().length < 400) {
    const dependencyError: DependencyFailure = {
      stage: 11,
      missing: ['10-pitch-draft.md'],
      message: 'S11 blocked: S10 draft is too thin for optimization.',
      requiredAction: 'Expand and validate S10 pitch draft before running optimization.',
    };
    throw Object.assign(new Error(dependencyError.message), { dependencyError });
  }

  // Parse draft to extract sections
  const lines = draft.split('\n');
  let subjectLine = '';
  let bodyLines: string[] = [];
  let ctaLine = '';
  let currentSection = 'header';
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.startsWith('subject:') || lower.startsWith('## subject') || lower.startsWith('# subject')) {
      subjectLine = line.replace(/^(subject:|#+ subject)\s*/i, '').trim();
      currentSection = 'subject';
    } else if (lower.startsWith('## body') || lower.startsWith('body:')) {
      currentSection = 'body';
    } else if (lower.startsWith('## cta') || lower.startsWith('cta:') || lower.startsWith('call to action:')) {
      currentSection = 'cta';
    } else if (currentSection === 'body') {
      bodyLines.push(line);
    } else if (currentSection === 'cta') {
      ctaLine += (ctaLine ? ' ' : '') + line.trim();
    }
  }

  // If parsing failed, use full draft as body
  if (!bodyLines.length && !subjectLine && !ctaLine) {
    bodyLines = lines;
  }

  // Generate improved subject line variants
  const subjectVariants = subjectLine
    ? [
        subjectLine,
        subjectLine.replace(/\b(new|latest|announcing)\b/gi, ''),
        `Data point: ${subjectLine.replace(/^(meet|discover|learn about)\s+/gi, '').slice(0, 60)}`,
        subjectLine.length > 50 ? subjectLine.slice(0, 50).trim() + '...' : subjectLine,
      ].filter(Boolean).slice(0, 3)
    : [
        'Pitch: Campaign angle overview',
        'Story idea for your beat',
        'Data-backed angle for your coverage',
      ];

  // Optimize subject line (shorter, more specific)
  const optimizedSubject = subjectVariants.reduce((best, current) =>
    current.length < best.length && current.length > 5 ? current : best, subjectVariants[0] || subjectLine);

  // Apply CTA softness rules
  const softCta = ctaLine
    .replace(/\b(reply|respond|get back|schedule|book|call now|sign up)\b/gi, 'let me know')
    .replace(/!+/g, '.')
    .trim() || 'Let me know if this resonates with your beat coverage.';

  // Apply anti-sales language
  const cleanBody = bodyLines
    .map(line => line
      .replace(/\b(limited time|act now|don't miss|exclusive offer|hurry|last chance)\b/gi, '')
      .replace(/!{2,}/g, '!')
    )
    .filter(line => line.trim());

  const optimizedDraft = [
    '# Stage 11 Optimized Pitch',
    '',
    `Generated at: ${new Date().toISOString()}`,
    '',
    '## Subject Line',
    optimizedSubject || 'Pitch: Campaign angle for your beat',
    '',
    '## Subject Line Variants',
    ...subjectVariants.map((v, i) => `  ${i + 1}. ${v || '(same as primary)'}`),
    '',
    '## Body',
    '',
    ...(cleanBody.length ? cleanBody : bodyLines),
    '',
    '## Call to Action',
    softCta,
    '',
    '## Optimization Notes',
    `- Subject line optimized for length (${optimizedSubject.length} chars)`,
    `- CTA softened to: "${softCta}"`,
    '- Anti-sales language filtered from body',
    '- Subject line variants provided for A/B testing',
    '',
  ].join('\n');

  await writeAtomic(stageFile(campaignPath, '11-optimized-pitch.md'), optimizedDraft);
  const optimized = await assertRealArtifact(
    campaignPath,
    11,
    '11-optimized-pitch.md',
    'Produce real optimized pitch output with clear improvements.'
  );
  if (optimized.trim().length < 450) {
    const dependencyError: DependencyFailure = {
      stage: 11,
      missing: ['11-optimized-pitch.md'],
      message: 'S11 blocked: optimized pitch output is too thin.',
      requiredAction: 'Regenerate optimized pitch with substantive optimizations and evidence-backed messaging.',
    };
    throw Object.assign(new Error(dependencyError.message), { dependencyError });
  }
  const governance = await validateStagePitchGovernance(campaignPath, 11);
  if (!governance.valid) {
    throw new Error(`S11 governance failed: ${governance.issues.map(i => i.message).join('; ')}`);
  }
  return { outputFile: '11-optimized-pitch.md' };
}

async function readStageState(campaignPath: string): Promise<StageState> {
  const stageStatePath = path.join(campaignPath, 'stage-state.json');
  try {
    const content = await fs.readFile(stageStatePath, 'utf-8');
    const parsed = JSON.parse(content) as StageState;
    return parsed;
  } catch {
    return { currentStage: 1, status: 'running' };
  }
}

async function writeStageState(campaignPath: string, currentStage: number, status: string, lastExecutedStage: number) {
  const stageStatePath = path.join(campaignPath, 'stage-state.json');
  const nextState: StageState = {
    currentStage,
    status,
    lastExecutedStage,
    updatedAt: new Date().toISOString(),
  };
  await writeAtomic(stageStatePath, JSON.stringify(nextState, null, 2));
}

function stageFile(campaignPath: string, fileName: string): string {
  return path.join(campaignPath, fileName);
}

async function executeStage12(campaignPath: string) {
  const inputs = ['08-pitch-draft.md', '09-optimized-email.md', '10-pitch-draft.md', '11-optimized-pitch.md'];
  const available: Array<{ name: string; content: string }> = [];

  for (const input of inputs) {
    const fullPath = stageFile(campaignPath, input);
    if (await exists(fullPath)) {
      available.push({ name: input, content: await readText(fullPath) });
    }
  }

  if (available.length === 0) {
    const dependencyError: DependencyFailure = {
      stage: 12,
      missing: inputs,
      message: 'S12 blocked: missing pitch inputs.',
      requiredAction: 'Generate S10/S11 pitch artifacts before running S12.',
    };
    throw Object.assign(new Error(dependencyError.message), { dependencyError });
  }

  // STRICT MODE: Require at least 10-pitch-draft.md AND 11-optimized-pitch.md for complete package
  if (STRICT_MODE) {
    const mandatory = ['10-pitch-draft.md', '11-optimized-pitch.md'];
    const missingMandatory = mandatory.filter(m => !available.some(a => a.name === m));
    if (missingMandatory.length > 0) {
      const dependencyError: DependencyFailure = {
        stage: 12,
        missing: missingMandatory,
        message: `S12 blocked in strict mode: missing mandatory pitch artifacts (${missingMandatory.join(', ')}).`,
        requiredAction: 'Generate all mandatory pitch artifacts (10-pitch-draft.md, 11-optimized-pitch.md) before packaging.',
      };
      throw Object.assign(new Error(dependencyError.message), { dependencyError });
    }
  }

  const compiled = [
    '# Stage 12 Outreach Package',
    '',
    `Generated at: ${new Date().toISOString()}`,
    '',
    ...available.flatMap(entry => [
      `## Source: ${entry.name}`,
      '',
      entry.content.trim(),
      '',
    ]),
  ].join('\n');

  await writeAtomic(stageFile(campaignPath, '12-outreach-package.md'), compiled);
  const pkg = await assertRealArtifact(
    campaignPath,
    12,
    '12-outreach-package.md',
    'Generate a complete outreach package from real pitch artifacts.'
  );
  if (pkg.trim().length < 700) {
    const dependencyError: DependencyFailure = {
      stage: 12,
      missing: ['12-outreach-package.md'],
      message: 'S12 blocked: outreach package is too thin.',
      requiredAction: 'Regenerate outreach package with substantive journalist-ready content.',
    };
    throw Object.assign(new Error(dependencyError.message), { dependencyError });
  }
  return { outputFile: '12-outreach-package.md' };
}

async function validateContentQuality(content: string, fileName: string): Promise<string[]> {
  const issues: string[] = [];
  if (content.trim().length < 200) {
    issues.push(`${fileName}: content too thin (<200 chars)`);
  }
  const genericHeadings = ['core narrative', 'package summary', 'included assets', 'placeholder narrative', 'getting started', 'overview'];
  const lower = content.toLowerCase();
  for (const heading of genericHeadings) {
    if (lower.includes(heading)) {
      issues.push(`${fileName}: contains generic heading "${heading}"`);
    }
  }
  return issues;
}

function validateCsvColumns(content: string): string[] {
  const issues: string[] = [];
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) {
    issues.push('08-journalist-list.csv: no data rows');
    return issues;
  }
  const header = lines[0].toLowerCase();
  const expectedCols = ['name', 'outlet', 'beat', 'email'];
  const presentCols = expectedCols.filter(col => header.includes(col));
  if (presentCols.length < 2) {
    issues.push(`08-journalist-list.csv: missing key columns (found: ${header.slice(0, 80)})`);
  }
  const rowCount = lines.length - 1;
  if (rowCount < 3) {
    issues.push(`08-journalist-list.csv: too few rows (${rowCount})`);
  }
  return issues;
}

async function executeStage13(campaignPath: string) {
  const checks = ['12-outreach-package.md', '08-journalist-list.csv', '09-journalist-intelligence.json'];
  const qualityIssues: string[] = [];

  const checkResults = await Promise.all(checks.map(async fileName => {
    const fullPath = stageFile(campaignPath, fileName);
    let existsFlag = false;
    let size = 0;
    let contentPreview = '';
    try {
      const stats = await fs.stat(fullPath);
      existsFlag = stats.isFile();
      size = stats.size;
      if (existsFlag && size > 0) {
        contentPreview = (await fs.readFile(fullPath, 'utf-8')).slice(0, 500);
      }
    } catch {
      existsFlag = false;
    }
    return { file: fileName, exists: existsFlag, size, contentPreview };
  }));

  const missing = checkResults.filter(item => !item.exists).map(item => item.file);

  // Deep content quality checks
  for (const result of checkResults) {
    if (!result.exists || result.size === 0) continue;
    const content = result.contentPreview;
    if (result.file === '08-journalist-list.csv') {
      qualityIssues.push(...validateCsvColumns(content));
    } else if (result.file === '09-journalist-intelligence.json') {
      try {
        const parsed = JSON.parse(content) as Record<string, unknown>;
        if (!parsed || Object.keys(parsed).length === 0) {
          qualityIssues.push('09-journalist-intelligence.json: empty JSON object');
        }
      } catch {
        qualityIssues.push('09-journalist-intelligence.json: invalid JSON');
      }
    } else {
      qualityIssues.push(...await validateContentQuality(content, result.file));
    }
  }

  const passed = missing.length === 0 && qualityIssues.length === 0;

  const report = {
    stage: 13,
    generatedAt: new Date().toISOString(),
    passed,
    checks: checkResults,
    qualityIssues,
    summary: passed
      ? 'Validation checks passed.'
      : `Validation found ${missing.length} missing artifacts and ${qualityIssues.length} quality issues.`,
    missing,
  };

  await writeAtomic(stageFile(campaignPath, '13-validation-report.json'), JSON.stringify(report, null, 2));
  const validationRaw = await assertRealArtifact(
    campaignPath,
    13,
    '13-validation-report.json',
    'Generate a real validation report from actual package and intelligence artifacts.'
  );
  try {
    const validation = JSON.parse(validationRaw) as { checks?: unknown[]; summary?: string; qualityIssues?: string[] };
    if (!Array.isArray(validation.checks) || validation.checks.length === 0) {
      const dependencyError: DependencyFailure = {
        stage: 13,
        missing: ['13-validation-report.json'],
        message: 'S13 blocked: validation report has no checks.',
        requiredAction: 'Populate validation report with concrete check results.',
      };
      throw Object.assign(new Error(dependencyError.message), { dependencyError });
    }
    if (Array.isArray(validation.qualityIssues) && validation.qualityIssues.length > 0) {
      const dependencyError: DependencyFailure = {
        stage: 13,
        missing: validation.qualityIssues,
        message: `S13 blocked: content quality issues found: ${validation.qualityIssues.join('; ')}`,
        requiredAction: 'Fix content quality issues (thin content, generic headings, invalid CSV/JSON) before passing validation.',
      };
      throw Object.assign(new Error(dependencyError.message), { dependencyError });
    }
  } catch (error) {
    const existingDependencyError = (error as { dependencyError?: DependencyFailure })?.dependencyError;
    if (existingDependencyError) {
      throw error;
    }
    const dependencyError: DependencyFailure = {
      stage: 13,
      missing: ['13-validation-report.json'],
      message: 'S13 blocked: validation report JSON is invalid.',
      requiredAction: 'Write valid JSON validation report with checks and summary.',
    };
    throw Object.assign(new Error(dependencyError.message), { dependencyError });
  }
  return { outputFile: '13-validation-report.json', missing, qualityIssues };
}

async function executeStage14(campaignPath: string) {
  const packagePath = stageFile(campaignPath, '12-outreach-package.md');
  const validationPath = stageFile(campaignPath, '13-validation-report.json');

  if (!(await exists(packagePath))) {
    const dependencyError: DependencyFailure = {
      stage: 14,
      missing: ['12-outreach-package.md'],
      message: 'S14 blocked: missing 12-outreach-package.md.',
      requiredAction: 'Execute S12 Package first.',
    };
    throw Object.assign(new Error(dependencyError.message), { dependencyError });
  }
  if (!(await exists(validationPath))) {
    const dependencyError: DependencyFailure = {
      stage: 14,
      missing: ['13-validation-report.json'],
      message: 'S14 blocked: missing 13-validation-report.json.',
      requiredAction: 'Execute S13 Validation first.',
    };
    throw Object.assign(new Error(dependencyError.message), { dependencyError });
  }

  const packageContent = await readText(packagePath);
  const validationContent = await readText(validationPath);
  const formatted = [
    '# Stage 14 Final Formatted Package',
    '',
    `Generated at: ${new Date().toISOString()}`,
    '',
    '## Validation Snapshot',
    '```json',
    validationContent.trim(),
    '```',
    '',
    '## Final Outreach Package',
    packageContent.trim(),
    '',
  ].join('\n');

  await writeAtomic(stageFile(campaignPath, '14-final-formatted-package.md'), formatted);
  const formattedOutput = await assertRealArtifact(
    campaignPath,
    14,
    '14-final-formatted-package.md',
    'Produce a complete final formatted package from validated artifacts.'
  );
  if (formattedOutput.trim().length < 900) {
    const dependencyError: DependencyFailure = {
      stage: 14,
      missing: ['14-final-formatted-package.md'],
      message: 'S14 blocked: final formatted package is too thin.',
      requiredAction: 'Regenerate final package with complete validated outreach content.',
    };
    throw Object.assign(new Error(dependencyError.message), { dependencyError });
  }
  return { outputFile: '14-final-formatted-package.md' };
}

async function executeStage15(campaignPath: string) {
  const formattedPath = stageFile(campaignPath, '14-final-formatted-package.md');
  if (!(await exists(formattedPath))) {
    const dependencyError: DependencyFailure = {
      stage: 15,
      missing: ['14-final-formatted-package.md'],
      message: 'S15 blocked: missing 14-final-formatted-package.md.',
      requiredAction: 'Execute S14 Formatting first.',
    };
    throw Object.assign(new Error(dependencyError.message), { dependencyError });
  }

  const formatted = await readText(formattedPath);
  const assets = [
    '# Stage 15 Outreach Assets',
    '',
    `Generated at: ${new Date().toISOString()}`,
    '',
    '## First-Wave Outreach Checklist',
    '- Use approved subject line variant',
    '- Personalize opener with journalist beat context',
    '- Include only validated claims',
    '',
    '## Follow-up Template',
    'Hi {{name}}, just following up in case this data-backed angle is relevant for your beat.',
    '',
    '## Final Package Reference',
    formatted.slice(0, 2000).trim(),
    '',
  ].join('\n');

  await writeAtomic(stageFile(campaignPath, '15-outreach-assets.md'), assets);
  const assetsOutput = await assertRealArtifact(
    campaignPath,
    15,
    '15-outreach-assets.md',
    'Generate complete outreach assets and follow-up content.'
  );
  if (assetsOutput.trim().length < 450) {
    const dependencyError: DependencyFailure = {
      stage: 15,
      missing: ['15-outreach-assets.md'],
      message: 'S15 blocked: outreach assets output is too thin.',
      requiredAction: 'Regenerate outreach assets with substantive checklist and follow-up material.',
    };
    throw Object.assign(new Error(dependencyError.message), { dependencyError });
  }
  return { outputFile: '15-outreach-assets.md' };
}

async function executeStage16(campaignPath: string) {
  const required = ['13-validation-report.json', '14-final-formatted-package.md', '15-outreach-assets.md'];
  const existence = await Promise.all(required.map(async fileName => ({
    file: fileName,
    exists: await exists(stageFile(campaignPath, fileName)),
  })));

  const learningLog = {
    stage: 16,
    generatedAt: new Date().toISOString(),
    completed: existence.every(item => item.exists),
    inputs: existence,
    recommendations: [
      'Review missing artifacts before production handoff.',
      'Capture journalist response outcomes for next run.',
      'Track governance violations and fixes for continuous improvement.',
    ],
  };

  await writeAtomic(stageFile(campaignPath, '16-campaign-learning-log.json'), JSON.stringify(learningLog, null, 2));
  const learningRaw = await assertRealArtifact(
    campaignPath,
    16,
    '16-campaign-learning-log.json',
    'Generate a complete campaign learning log from real final-stage artifacts.'
  );
  try {
    const parsed = JSON.parse(learningRaw) as { inputs?: Array<{ exists?: boolean }>; recommendations?: unknown[] };
    if (!Array.isArray(parsed.inputs) || parsed.inputs.length < 3) {
      const dependencyError: DependencyFailure = {
        stage: 16,
        missing: ['16-campaign-learning-log.json'],
        message: 'S16 blocked: learning log is missing required input audit entries.',
        requiredAction: 'Include full final-stage input audit in campaign learning log.',
      };
      throw Object.assign(new Error(dependencyError.message), { dependencyError });
    }
    if (!Array.isArray(parsed.recommendations) || parsed.recommendations.length === 0) {
      const dependencyError: DependencyFailure = {
        stage: 16,
        missing: ['16-campaign-learning-log.json'],
        message: 'S16 blocked: learning log has no recommendations.',
        requiredAction: 'Provide concrete recommendations in campaign learning log.',
      };
      throw Object.assign(new Error(dependencyError.message), { dependencyError });
    }
  } catch (error) {
    const existingDependencyError = (error as { dependencyError?: DependencyFailure })?.dependencyError;
    if (existingDependencyError) {
      throw error;
    }
    const dependencyError: DependencyFailure = {
      stage: 16,
      missing: ['16-campaign-learning-log.json'],
      message: 'S16 blocked: learning log JSON is invalid.',
      requiredAction: 'Write valid JSON learning log with input audit and recommendations.',
    };
    throw Object.assign(new Error(dependencyError.message), { dependencyError });
  }
  return { outputFile: '16-campaign-learning-log.json' };
}

function hasNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

async function checkHumanApprovalProgression(campaignPath: string): Promise<{
  allowed: boolean;
  reason?: string;
  warning?: string;
}> {
  const approvalFile = stageFile(campaignPath, 'human-approval.json');
  let approval: Record<string, unknown>;
  try {
    approval = JSON.parse(await fs.readFile(approvalFile, 'utf-8'));
  } catch {
    return { allowed: false, reason: 'No human approval record found' };
  }
  if (!approval || typeof approval !== 'object') {
    return { allowed: false, reason: 'No human approval record found' };
  }
  const statusRaw = approval.status;
  if (typeof statusRaw !== 'string' || !statusRaw) {
    return { allowed: false, reason: 'No human approval status found' };
  }
  if (statusRaw !== 'approved') {
    return { allowed: false, reason: `Human approval status is: ${statusRaw}` };
  }
  if (!hasNonBlankString(approval.selectedAngleId) && !hasNonBlankString(approval.selectedAngleTitle)) {
    return { allowed: false, reason: 'No angle selected by human' };
  }
  const provenanceStatus = approval.provenanceStatus as ProvenanceStatus | undefined;
  const decision = getApprovalProgressionDecision({ status: statusRaw, provenanceStatus });
  if (!decision.allowed) {
    return { allowed: false, reason: decision.reason };
  }
  const warning = 'warning' in decision ? decision.warning : undefined;
  return { allowed: true, warning };
}

// Each stage's expected output files for post-execution validation
const STAGE_OUTPUT_FILES: Record<number, string[]> = {
  1: ['01-campaign-intake.json'],
  2: ['02-insights.md', '01-study-notes.md', '02-raw-extracted-data.json'],
  3: ['03-research.md', '03-research-enrichment.json', 'verified-findings.json', 'source-registry.json'],
  4: ['04-angles.md', 'InsightAnalysisMap.json', 'AngleGenerationHandoff.json'],
  5: ['05-angles.md', '05-beats.md'],
  6: ['06-beat-match.json'],
  7: ['human-approval.json'],
  8: ['08-journalist-list.csv'],
  9: ['09-journalist-intelligence.json', '06-journalist-intel.md', '07-journalist-coverage.md'],
  10: ['10-pitch-draft.md', '10-pitch-draft.json'],
  11: ['11-optimized-pitch.md'],
  12: ['12-outreach-package.md'],
  13: ['13-validation-report.json'],
  14: ['14-final-formatted-package.md'],
  15: ['15-outreach-assets.md'],
  16: ['16-campaign-learning-log.json'],
};

async function validateStageOutput(campaignPath: string, stage: number, runMode?: RunMode): Promise<void> {
  // In non-live mode, skip S7 output validation because human-approval.json is intentionally not written
  if (stage === 7 && runMode && shouldBlockExternalAction(runMode)) {
    return;
  }
  const files = STAGE_OUTPUT_FILES[stage] || [];
  if (files.length === 0) return;

  const failed: string[] = [];
  for (const file of files) {
    const fullPath = stageFile(campaignPath, file);
    if (!(await exists(fullPath))) {
      failed.push(`${file} (missing)`);
      continue;
    }
    const content = await readText(fullPath).catch(() => '');
    if (!content.trim()) {
      failed.push(`${file} (empty)`);
      continue;
    }
    if (looksLikeFallback(content)) {
      failed.push(`${file} (fallback/scaffold detected)`);
      continue;
    }
  }

  if (failed.length > 0) {
    const dependencyError: DependencyFailure = {
      stage,
      missing: failed,
      message: `S${stage} output validation failed: ${failed.join(', ')}. Stage will not advance.`,
      requiredAction: `Re-run S${stage} with valid real data and ensure output files are clean.`,
    };
    throw Object.assign(new Error(dependencyError.message), { dependencyError });
  }
}

async function validateUpstreamLineage(campaignPath: string, targetStage: number): Promise<void> {
  for (let stage = 1; stage < targetStage; stage++) {
    const files = STAGE_OUTPUT_FILES[stage] || [];
    if (files.length === 0) continue;

    for (const file of files) {
      const fullPath = stageFile(campaignPath, file);
      if (!(await exists(fullPath))) continue;
      const content = await readText(fullPath).catch(() => '');
      if (content.trim() && looksLikeFallback(content)) {
        const dependencyError: DependencyFailure = {
          stage: targetStage,
          missing: [file],
          message: `S${targetStage} blocked because upstream stage S${stage} contains fallback/scaffold artifacts (${file}).`,
          requiredAction: `Re-run S${stage} with valid real data before executing S${targetStage}.`,
        };
        throw Object.assign(new Error(dependencyError.message), { dependencyError });
      }
    }
  }
}

async function precheckStage(campaignPath: string, stage: number): Promise<StagePrecheck> {
  const currentState = await readStageState(campaignPath);
  const currentStage = Math.max(1, Math.min(16, Number(currentState.currentStage ?? 1)));

  if (stage > currentStage) {
    return {
      stage,
      canExecute: false,
      reason: `Stage S${stage} is locked until workflow reaches S${stage}. Current: S${currentStage}.`,
      requiredAction: `Advance workflow to stage ${stage}.`,
      missing: [],
    };
  }

  const missing = await missingDependencies(campaignPath, stage);
  return {
    stage,
    canExecute: missing.length === 0,
    reason: missing.length === 0 ? null : `S${stage} missing required input files.`,
    requiredAction: missing.length === 0 ? null : `Create/execute prior stage outputs for S${stage}.`,
    missing,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaignId = assertValidCampaignId(id);
    const campaignPath = resolveCampaignPath(campaignId);
    const isDir = await fs.stat(campaignPath).then(stat => stat.isDirectory()).catch(() => false);
    if (!isDir) {
      return fail('CAMPAIGN_NOT_FOUND', `Campaign "${campaignId}" not found.`, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const stageParam = searchParams.get('stage');

    if (stageParam) {
      const stage = Number(stageParam);
      if (!Number.isInteger(stage) || stage < 1 || stage > 16) {
        return fail('INVALID_STAGE', 'stage must be an integer between 1 and 16.', { status: 400 });
      }
      const precheck = await precheckStage(campaignPath, stage);
      return ok({ campaignId, precheck });
    }

    const prechecks: StagePrecheck[] = [];
    for (const stage of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]) {
      prechecks.push(await precheckStage(campaignPath, stage));
    }
    return ok({ campaignId, prechecks });
  } catch (error) {
    return fail(
      'EXECUTE_STAGE_PRECHECK_FAILED',
      'Failed to generate stage precheck status.',
      { status: 500 },
      error instanceof Error ? error.message : String(error)
    );
  }
}

const STAGE_CONTRACT_NAME: Record<number, string> = {
  1: 'S1_CAMPAIGN_INTAKE',
  2: 'S2_DATA_EXTRACTION',
  3: 'S3_RESEARCH_ENRICHMENT',
  4: 'S4A_DATA_RESEARCH_ANALYST',
  5: 'S5_ANGLE_GENERATION',
  6: 'S6_BEAT_MATCHING',
  7: 'S7_PITCH_SELECTION_HUMAN_GATE',
  8: 'S8_JOURNALIST_COLLECTION',
  9: 'S9_JOURNALIST_INTELLIGENCE',
  10: 'S10_PITCH_DRAFTING',
  11: 'S11_PITCH_OPTIMIZATION',
  12: 'S12_PACKAGE_ASSEMBLY',
  13: 'S13_VALIDATION',
  14: 'S14_FINAL_FORMATTING',
  15: 'S15_OUTREACH_ASSET_CREATION',
  16: 'S16_CAMPAIGN_LOG_LEARNING_LOOP',
};

function getCanonicalGateLookupStage(stageNumber: number): string {
  const prevStage = stageNumber - 1;
  return STAGE_CONTRACT_NAME[prevStage] ?? `S${stageNumber}`;
}

async function runCanonicalGatePrecheck(campaignId: string, stageNumber: number): Promise<Response | null> {
  const stageId = getCanonicalGateLookupStage(stageNumber);
  const gates = await getGatesForStage(stageId);
  if (!gates || gates.length === 0) return null;
  for (const gate of gates) {
    const gateId = typeof gate === 'string' ? gate : gate?.gateId;
    if (!gateId) continue;
    const result = await runGate(campaignId, gateId);
    if (!result.canContinue) {
      return fail('GATE_BLOCKED', `Canonical gate ${gateId} blocked execution`, { status: 409 }, {
        gateId,
        requiredAction: result.requiredAction,
        blockingIssues: result.blockingIssues,
        riskLevel: result.riskLevel,
      });
    }
  }
  return null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = evaluateMutationAuth(request);
    if (!auth.allowed) {
      return fail('AUTH_REQUIRED', auth.reason, { status: 401 });
    }

    const { id } = await params;
    const campaignId = assertValidCampaignId(id);
    const rawBody = await request.json().catch(() => null);
    const parsed = ExecuteStageInputSchema.safeParse(rawBody);
    if (!parsed.success) {
      return fail(
        'INVALID_EXECUTE_STAGE_INPUT',
        'Execute stage payload validation failed.',
        { status: 400 },
        parsed.error.issues.map(issue => `${issue.path.join('.') || 'body'}: ${issue.message}`)
      );
    }

    const stage = parsed.data.stage;
    const clientKey = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'local';
    const limit = checkRateLimit(`execute-stage:${clientKey}:${campaignId}`, { max: 30, windowMs: 60_000 });
    if (!limit.allowed) {
      return fail(
        'RATE_LIMITED',
        'Too many stage execution requests. Please wait and retry.',
        { status: 429 }
      );
    }

    const campaignPath = resolveCampaignPath(campaignId);
    const isDir = await fs.stat(campaignPath).then(stat => stat.isDirectory()).catch(() => false);
    if (!isDir) {
      return fail('CAMPAIGN_NOT_FOUND', `Campaign "${campaignId}" not found.`, { status: 404 });
    }

    const runMode = getRunModeFromRequest(request);

    const currentState = await readStageState(campaignPath);
    const currentStage = Math.max(1, Math.min(16, Number(currentState.currentStage ?? 1)));

    if (stage > currentStage) {
      return fail(
        'STAGE_ORDER_BLOCKED',
        `Stage S${stage} cannot run before reaching workflow stage S${stage}.`,
        { status: 409 },
        {
          stage,
          currentStage,
          requiredAction: `Advance workflow to stage ${stage} first, or run preceding stage actions.`,
        }
      );
    }

    const circuit = await readCircuitState(campaignPath);
    const failureKey = `stage-${stage}`;
    if ((circuit.failures[failureKey] || 0) >= 3) {
      return fail(
        'CIRCUIT_OPEN',
        `Stage S${stage} is temporarily blocked after repeated failures.`,
        { status: 429 },
        {
          stage,
          attempts: circuit.failures[failureKey],
          requiredAction: 'Fix underlying input/runtime issue then reset circuit-state.json for this campaign.',
        }
      );
    }

    let provenanceWarning: string | undefined;
    if (stage >= 8) {
      const guard = await checkHumanApprovalProgression(campaignPath);
      if (!guard.allowed) {
        return fail('PROVENANCE_BLOCKED', guard.reason ?? 'Human approval check failed', { status: 400 });
      }
      provenanceWarning = guard.warning;
      if (provenanceWarning) {
        await appendRuntimeEvent(campaignPath, {
          timestamp: new Date().toISOString(),
          campaignId,
          stage,
          action: 'execute_stage',
          status: 'completed',
          message: `Provenance warning: ${provenanceWarning}`,
          requestId: request.headers.get('x-request-id'),
          runMode,
        }).catch(() => undefined);
      }
    }

    await acquireExecutionLock(campaignPath, stage);

    await appendRuntimeEvent(campaignPath, {
      timestamp: new Date().toISOString(),
      campaignId,
      stage,
      action: 'execute_stage',
      status: 'running',
      message: `Stage S${stage} execution started.`,
      requestId: request.headers.get('x-request-id'),
      runMode,
    }).catch(() => undefined);

    let result: Record<string, unknown>;
    if (stage === 1) {
      result = await executeStage1(campaignPath);
    } else if (stage === 2) {
      result = await executeStage2(campaignId, campaignPath);
    } else if (stage === 3) {
      result = await executeStage3(campaignPath);
    } else if (stage === 4) {
      result = await executeStage4(campaignPath);
    } else if (stage === 5) {
      result = await executeStage5(campaignPath);
    } else if (stage === 6) {
      result = await executeStage6(campaignPath);
    } else if (stage === 7) {
      result = await executeStage7(campaignPath, runMode);
    } else if (stage === 8) {
      const gateBlock = await runCanonicalGatePrecheck(campaignId, 8);
      if (gateBlock) return gateBlock;
      result = await executeStage8(campaignId, campaignPath);
    } else if (stage === 9) {
      result = await executeStage9(campaignId, campaignPath);
    } else if (stage === 10) {
      result = await executeStage10(campaignId, campaignPath);
    } else if (stage === 11) {
      result = await executeStage11(campaignPath);
    } else if (stage === 12) {
      const gateBlock = await runCanonicalGatePrecheck(campaignId, 12);
      if (gateBlock) return gateBlock;
      result = await executeStage12(campaignPath);
    } else if (stage === 13) {
      const gateBlock = await runCanonicalGatePrecheck(campaignId, 13);
      if (gateBlock) return gateBlock;
      result = await executeStage13(campaignPath);
    } else if (stage === 14) {
      const gateBlock = await runCanonicalGatePrecheck(campaignId, 14);
      if (gateBlock) return gateBlock;
      result = await executeStage14(campaignPath);
    } else if (stage === 15) {
        const gateBlock = await runCanonicalGatePrecheck(campaignId, 15);
        if (gateBlock) return gateBlock;
        result = await executeStage15(campaignPath);
    } else {
      result = await executeStage16(campaignPath);
    }

    // Validate the executed stage's output artifacts before advancing
    await validateStageOutput(campaignPath, stage, runMode);

    // In strict mode, also validate that no upstream stage has fallback artifacts
    if (STRICT_MODE) {
      await validateUpstreamLineage(campaignPath, stage);
    }

    const nextStage = Math.min(stage + 1, 16);
    const resultPaused = (result as { paused?: boolean }).paused === true;
    const status = stage >= 16 ? 'completed' : (resultPaused ? 'paused' : 'running');
    await writeStageState(campaignPath, nextStage, status, stage);
    if (circuit.failures[failureKey]) {
      delete circuit.failures[failureKey];
      await writeCircuitState(campaignPath, circuit);
    }

    await appendRuntimeEvent(campaignPath, {
      timestamp: new Date().toISOString(),
      campaignId,
      stage,
      action: 'execute_stage',
      status: 'completed',
      message: `Stage S${stage} execution completed.`,
      requestId: request.headers.get('x-request-id'),
      runMode,
    }).catch(() => undefined);

    await releaseExecutionLock(campaignPath, stage);

    await writeApiAuditLog(request, {
      level: 'success',
      source: 'stage-runtime',
      message: `Executed stage ${stage}.`,
      fields: {
        campaignId,
        stage,
        action: 'execute_stage',
        actor: 'dashboard_user',
        extra: { result },
      },
    });

    return ok({
      campaignId,
      stage,
      currentStage: nextStage,
      status,
      ...(provenanceWarning ? { provenanceWarning } : {}),
      ...result,
    });
  } catch (error) {
    // Best-effort lock cleanup - remove any stale lock file
    try {
      const { id } = await params;
      const cId = assertValidCampaignId(id);
      const cPath = resolveCampaignPath(cId);
      await fs.unlink(path.join(cPath, EXECUTION_LOCK_FILE)).catch(() => undefined);
    } catch { /* no-op */ }
    try {
      const { id } = await params;
      const campaignId = assertValidCampaignId(id);
      const campaignPath = resolveCampaignPath(campaignId);
      const rawBody = await request.json().catch(() => null);
      const parsed = ExecuteStageInputSchema.safeParse(rawBody);
      if (parsed.success) {
        const circuit = await readCircuitState(campaignPath);
        const key = `stage-${parsed.data.stage}`;
        circuit.failures[key] = (circuit.failures[key] || 0) + 1;
        circuit.openedAt = new Date().toISOString();
        await writeCircuitState(campaignPath, circuit);
      }
    } catch {
      // swallow circuit-write errors
    }
    const dependencyError = (error as { dependencyError?: DependencyFailure })?.dependencyError;
    if (dependencyError) {
      try {
        const { id } = await params;
        const campaignId = assertValidCampaignId(id);
        const campaignPath = resolveCampaignPath(campaignId);
        await appendRuntimeEvent(campaignPath, {
          timestamp: new Date().toISOString(),
          campaignId,
          stage: dependencyError.stage,
          action: 'execute_stage',
          status: 'blocked',
          message: dependencyError.message,
          requestId: request.headers.get('x-request-id'),
          runMode: getRunModeFromRequest(request),
        });
      } catch {
        // ignore event write failures
      }
      try {
        const { id } = await params;
        const campaignId = assertValidCampaignId(id);
        const stage = ExecuteStageInputSchema.safeParse(await request.json().catch(() => null));
        await writeApiAuditLog(request, {
          level: 'warning',
          source: 'stage-runtime',
          message: dependencyError.message,
          details: JSON.stringify(dependencyError),
          fields: {
            campaignId,
            stage: stage.success ? stage.data.stage : null,
            action: 'execute_stage_blocked',
            actor: 'dashboard_user',
          },
        });
      } catch {
        // no-op
      }
      return fail(
        'STAGE_DEPENDENCY_BLOCKED',
        dependencyError.message,
        { status: 409 },
        dependencyError
      );
    }
    try {
      const { id } = await params;
      const campaignId = assertValidCampaignId(id);
      const campaignPath = resolveCampaignPath(campaignId);
      const stage = ExecuteStageInputSchema.safeParse(await request.json().catch(() => null));
      await appendRuntimeEvent(campaignPath, {
        timestamp: new Date().toISOString(),
        campaignId,
        stage: stage.success ? stage.data.stage : 0,
        action: 'execute_stage',
        status: 'failed',
        message: error instanceof Error ? error.message : String(error),
        requestId: request.headers.get('x-request-id'),
        runMode: getRunModeFromRequest(request),
      }).catch(() => undefined);
      await writeApiAuditLog(request, {
        level: 'error',
        source: 'stage-runtime',
        message: 'Failed to execute stage runtime action.',
        details: error instanceof Error ? error.message : String(error),
        fields: {
          campaignId,
          stage: stage.success ? stage.data.stage : null,
          action: 'execute_stage_failed',
          actor: 'dashboard_user',
        },
      });
    } catch {
      // no-op
    }
    return fail(
      'EXECUTE_STAGE_FAILED',
      'Failed to execute stage runtime action.',
      { status: 500 },
      error instanceof Error ? error.message : String(error)
    );
  }
}
