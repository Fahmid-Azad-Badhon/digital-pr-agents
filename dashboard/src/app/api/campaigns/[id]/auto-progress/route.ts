import fs from 'fs/promises';
import path from 'path';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { fail, ok } from '@/lib/apiResponse';
import { evaluateMutationAuth } from '@/lib/authGuard';
import { writeApiAuditLog } from '@/lib/logger';
import { assertValidCampaignId, resolveCampaignPath, REPO_ROOT } from '@/lib/requestGuard';
import { validateStageHandoff } from '@/lib/stageHandoffValidator';
import { createQuestion, escalateToHuman } from '@/lib/agentQuestioningSystem';
import { getRuntimeBinding, verifyRuntimeBinding } from '@/lib/stageRuntimeRegistry';
import { getApprovalProgressionDecision, type ProvenanceStatus } from '@/lib/provenance';
import { getGatesForStage, runGate } from '@/lib/gateEngine';

const AutoProgressInputSchema = z.object({
  mode: z.enum(['pre_pitch', 'post_pitch', 'full']).optional().default('pre_pitch'),
  maxSteps: z.number().int().min(1).max(32).optional().default(16),
});

type StageGateStatus =
  | 'pass'
  | 'fail_repairable'
  | 'fail_after_repair'
  | 'blocker'
  | 'waiting_for_pitch_selection'
  | 'pitch_selected'
  | 'system_error';

type StageGateDecision = {
  campaign_id: string;
  current_stage: string;
  current_agent: string;
  stage_gate_status: StageGateStatus;
  decision: string;
  requires_human: boolean;
  confidence_score: number | null;
  instruction_compliance: {
    skill_file_used: boolean;
    brain_file_used: boolean;
    logic_file_used: boolean;
    workflow_rules_used: boolean;
    questioning_rules_used: boolean;
    agent_performed_at_expected_level: boolean;
  };
  quality_checks: {
    required_fields_complete: boolean;
    output_is_structured: boolean;
    output_is_relevant: boolean;
    output_is_actionable: boolean;
    output_is_ready_for_next_agent: boolean;
    data_conflicts_found: boolean;
    critical_gaps_found: boolean;
  };
  provenanceWarning?: string;
  issues: {
    missing_fields: string[];
    weak_areas: string[];
    unresolved_questions: string[];
    blockers: string[];
  };
  repair_attempt?: {
    repair_needed: boolean;
    repair_attempted: boolean;
    repair_successful: boolean | null;
    max_repair_attempts?: number;
    current_repair_attempt?: number;
    repair_notes?: string[];
  };
  handoff: {
    next_stage: string | null;
    next_agent: string | null;
    handoff_summary: string | null;
    handoff_payload_ready: boolean;
  };
  system_action: {
    update_campaign_status: boolean;
    new_campaign_status: string;
    auto_route_to_next_stage: boolean;
    create_approval_queue_item: boolean;
    pause_workflow?: boolean;
    resume_agent_workflow?: boolean;
  };
};

type StageState = {
  currentStage?: number;
  status?: string;
  lastExecutedStage?: number;
  updatedAt?: string;
  blockedStage?: number;
  lastBlockedAt?: string;
  autoRepairAttempts?: Record<string, number>;
};

const STAGE_AGENT: Record<number, string> = {
  1: 'campaign_intake_agent',
  2: 'data_extraction_agent',
  3: 'research_enrichment_agent',
  4: 'analysis_agent',
  5: 'angle_generation_agent',
  6: 'beat_matching_agent',
  7: 'human_pitch_selection',
  8: 'journalist_collection_agent',
  9: 'journalist_intelligence_agent',
  10: 'pitch_copywriter_agent',
  11: 'pitch_optimizer_agent',
  12: 'final_package_agent',
  13: 'validator_agent',
  14: 'final_formatting_agent',
  15: 'browser_validation_agent',
  16: 'production_agent',
};

const MAX_REPAIR_ATTEMPTS = 2;

const STAGE_SKILL_HINT: Record<number, string> = {
  1: 'digital-pr-orchestrator',
  2: 'study-insight-extractor',
  3: 'research-enrichment-agent',
  4: 'research-enrichment-agent',
  5: 'angle-generator',
  6: 'beat-matcher',
  7: 'pitch-selection',
  8: 'muck-rack-bulk-collector',
  9: 'journalist-intelligence-agent',
  10: 'pitch-writer',
  11: 'email-optimizer',
  12: 'final-doc-packager',
};

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

function stageLabel(stage: number) {
  return `S${stage}`;
}

function nextStageLabel(stage: number) {
  return stage >= 16 ? null : `S${stage + 1}`;
}

async function readStageState(campaignPath: string): Promise<StageState> {
  const filePath = path.join(campaignPath, 'stage-state.json');
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as StageState;
  } catch {
    return { currentStage: 1, status: 'running', updatedAt: new Date().toISOString() };
  }
}

async function writeStageState(campaignPath: string, state: StageState): Promise<void> {
  const filePath = path.join(campaignPath, 'stage-state.json');
  const tempPath = `${filePath}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(state, null, 2), 'utf-8');
  await fs.rename(tempPath, filePath);
}

async function appendStageGateDecision(campaignPath: string, decision: StageGateDecision): Promise<void> {
  const decisionPath = path.join(campaignPath, 'stage-gate-decisions.json');
  const existing = await fs.readFile(decisionPath, 'utf-8')
    .then(content => JSON.parse(content) as { decisions?: Array<StageGateDecision & { timestamp: string }> })
    .catch(() => ({ decisions: [] as Array<StageGateDecision & { timestamp: string }> }));
  const decisions = Array.isArray(existing.decisions) ? existing.decisions : [];
  decisions.push({ ...decision, timestamp: new Date().toISOString() });
  await fs.writeFile(decisionPath, JSON.stringify({ decisions }, null, 2), 'utf-8');
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function callExecuteStage(
  request: NextRequest,
  campaignId: string,
  stage: number
): Promise<{ ok: true; data: any } | { ok: false; error: any; status: number }> {
  const origin = request.nextUrl.origin;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const authHeader = request.headers.get('authorization');
  const apiKeyHeader = request.headers.get('x-api-key');
  const requestId = request.headers.get('x-request-id');
  if (authHeader) headers.authorization = authHeader;
  if (apiKeyHeader) headers['x-api-key'] = apiKeyHeader;
  if (requestId) headers['x-request-id'] = requestId;

  const response = await fetch(`${origin}/api/campaigns/${encodeURIComponent(campaignId)}/execute-stage`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ stage }),
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => null);
  if (response.ok && payload?.success) {
    return { ok: true, data: payload.data };
  }
  return { ok: false, error: payload, status: response.status };
}

async function evaluateInstructionCompliance(stage: number): Promise<StageGateDecision['instruction_compliance']> {
  const runtimeBinding = getRuntimeBinding(stage);
  const runtimeVerified = runtimeBinding ? await verifyRuntimeBinding(runtimeBinding) : { ok: false };
  const brainManifestPath = path.join(REPO_ROOT, 'brain', 'brain-manifest.json');
  const brainManifest = await fs.readFile(brainManifestPath, 'utf-8')
    .then(content => JSON.parse(content) as { agentBrains?: Record<string, string | null> })
    .catch(() => ({ agentBrains: {} as Record<string, string | null> }));
  const brainKey = runtimeBinding?.brainManifestKey;
  const brainMap = (brainManifest.agentBrains || {}) as Record<string, string | null>;
  const brainFileName = brainKey ? brainMap[brainKey] : null;
  const brainFileUsed = Boolean(brainFileName && await exists(path.join(REPO_ROOT, 'brain', String(brainFileName))));

  const skillHint = STAGE_SKILL_HINT[stage];
  const skillFileUsed = Boolean(skillHint && await exists(path.join(REPO_ROOT, 'skills', skillHint, 'SKILL.md')));
  const logicFileUsed = await exists(path.join(REPO_ROOT, 'workflow-architecture.md'));
  const workflowRulesUsed = await exists(path.join(REPO_ROOT, 'runbook.md'));
  const questioningRulesUsed = await exists(path.join(REPO_ROOT, 'system', 'agent-question-bank.json'));

  return {
    skill_file_used: skillFileUsed,
    brain_file_used: brainFileUsed && runtimeVerified.ok,
    logic_file_used: logicFileUsed,
    workflow_rules_used: workflowRulesUsed,
    questioning_rules_used: questioningRulesUsed,
    agent_performed_at_expected_level: skillFileUsed && brainFileUsed && logicFileUsed && workflowRulesUsed && questioningRulesUsed && runtimeVerified.ok,
  };
}

function buildPassDecision(campaignId: string, stage: number): StageGateDecision {
  return {
    campaign_id: campaignId,
    current_stage: stageLabel(stage),
    current_agent: STAGE_AGENT[stage] || 'unknown_agent',
    stage_gate_status: 'pass',
    decision: 'continue_to_next_stage',
    requires_human: false,
    confidence_score: 0.92,
    instruction_compliance: {
      skill_file_used: true,
      brain_file_used: true,
      logic_file_used: true,
      workflow_rules_used: true,
      questioning_rules_used: true,
      agent_performed_at_expected_level: true,
    },
    quality_checks: {
      required_fields_complete: true,
      output_is_structured: true,
      output_is_relevant: true,
      output_is_actionable: true,
      output_is_ready_for_next_agent: true,
      data_conflicts_found: false,
      critical_gaps_found: false,
    },
    issues: {
      missing_fields: [],
      weak_areas: [],
      unresolved_questions: [],
      blockers: [],
    },
    handoff: {
      next_stage: nextStageLabel(stage),
      next_agent: stage < 16 ? STAGE_AGENT[stage + 1] : null,
      handoff_summary: stage < 16 ? `Stage ${stageLabel(stage)} completed and handed off automatically.` : 'Workflow completed.',
      handoff_payload_ready: true,
    },
    system_action: {
      update_campaign_status: true,
      new_campaign_status: stage >= 16 ? 'completed' : 'running',
      auto_route_to_next_stage: stage < 16,
      create_approval_queue_item: false,
    },
  };
}

function buildPitchWaitDecision(campaignId: string): StageGateDecision {
  return {
    campaign_id: campaignId,
    current_stage: 'S7',
    current_agent: STAGE_AGENT[7],
    stage_gate_status: 'waiting_for_pitch_selection',
    decision: 'wait_for_user_pitch_choice',
    requires_human: true,
    confidence_score: 0.9,
    instruction_compliance: {
      skill_file_used: true,
      brain_file_used: true,
      logic_file_used: true,
      workflow_rules_used: true,
      questioning_rules_used: true,
      agent_performed_at_expected_level: true,
    },
    quality_checks: {
      required_fields_complete: true,
      output_is_structured: true,
      output_is_relevant: true,
      output_is_actionable: true,
      output_is_ready_for_next_agent: false,
      data_conflicts_found: false,
      critical_gaps_found: false,
    },
    issues: {
      missing_fields: ['selected_pitch'],
      weak_areas: [],
      unresolved_questions: ['User must select one pitch direction.'],
      blockers: ['Human selection is required at Pitch Selection stage.'],
    },
    handoff: {
      next_stage: null,
      next_agent: null,
      handoff_summary: null,
      handoff_payload_ready: false,
    },
    system_action: {
      update_campaign_status: true,
      new_campaign_status: 'waiting-for-pitch-selection',
      auto_route_to_next_stage: false,
      create_approval_queue_item: false,
      pause_workflow: true,
    },
  };
}

function resolveCanonicalGateId(gate: unknown): string | null {
  if (typeof gate === 'string') return gate;
  if (typeof gate === 'object' && gate !== null) {
    const g = gate as Record<string, unknown>;
    if (typeof g.gateId === 'string') return g.gateId;
    if (typeof g.id === 'string') return g.id;
  }
  return null;
}

async function runCanonicalGatePrecheck(
  campaignId: string,
  currentStage: number
): Promise<Response | null> {
  const contractName = STAGE_CONTRACT_NAME[currentStage];
  if (!contractName) return null;

  const targetStage = currentStage + 1;
  const gates: unknown = await getGatesForStage(contractName);

  if (!Array.isArray(gates)) return null;
  if (gates.length === 0) return null;

  for (const gate of gates) {
    const gateId = resolveCanonicalGateId(gate);
    if (!gateId) continue;

    const result = await runGate(campaignId, gateId);

    if (typeof result === 'object' && result !== null && 'canContinue' in result) {
      const r = result as { canContinue?: boolean };
      if (r.canContinue === false) {
        const gateResult = result as {
          status?: string;
          blockingIssues?: unknown;
          warnings?: unknown;
          blockedStages?: unknown;
        };
        return fail(
          'GATE_BLOCKED',
          `Canonical gate "${gateId}" blocked advancement to S${targetStage}.`,
          { status: 409 },
          {
            stage: contractName,
            targetStage,
            finalStage: currentStage,
            gateId,
            status: gateResult.status,
            blockingIssues: gateResult.blockingIssues,
            warnings: gateResult.warnings,
            blockedStages: gateResult.blockedStages,
          }
        );
      }
    }
  }

  return null;
}

async function createApprovalQueueBlocker(
  campaignId: string,
  stage: number,
  blockerMessage: string,
  missingFields: string[]
) {
  const question = await createQuestion(campaignId, {
    askingStageId: stageLabel(stage),
    askingAgent: STAGE_AGENT[stage] || 'unknown_agent',
    targetStageId: 'HUMAN',
    targetAgent: 'HUMAN',
    issueType: 'workflow_blocker',
    category: 'missing_input',
    priority: 'high',
    blocking: true,
    relatedFiles: [],
    relatedClaimIds: [],
    relatedStatIds: [],
    relatedJournalistIds: [],
    exactQuestion: blockerMessage,
    contextForTargetAgent: {
      campaignId,
      stage: stageLabel(stage),
      missingFields,
      requiredAction: 'Provide missing input to unblock workflow.',
    },
    expectedAnswerFormat: 'text',
    requiredAnswerFields: ['resolution'],
    canAskingAgentContinueWithoutAnswer: false,
    escalationTargetIfUnanswered: 'HUMAN',
    humanEscalationAllowed: true,
    notes: ['Created by auto-stage-gate blocker detection'],
  });
  await escalateToHuman(campaignId, question.questionId, blockerMessage);
  return question.questionId;
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
    const rawBody = await request.json().catch(() => ({}));
    const parsed = AutoProgressInputSchema.safeParse(rawBody);
    if (!parsed.success) {
      return fail('INVALID_AUTO_PROGRESS_INPUT', 'Auto-progress payload is invalid.', { status: 400 }, parsed.error.issues);
    }

    const campaignPath = resolveCampaignPath(campaignId);
    const isDir = await fs.stat(campaignPath).then(s => s.isDirectory()).catch(() => false);
    if (!isDir) {
      return fail('CAMPAIGN_NOT_FOUND', `Campaign "${campaignId}" not found.`, { status: 404 });
    }

    const mode = parsed.data.mode;
    const decisions: StageGateDecision[] = [];
    const maxSteps = parsed.data.maxSteps;
    let steps = 0;

    while (steps < maxSteps) {
      steps += 1;
      const state = await readStageState(campaignPath);
      const stage = Math.max(1, Math.min(16, Number(state.currentStage || 1)));

      if (stage >= 16 && state.status === 'completed') {
        break;
      }

      if (mode === 'pre_pitch' && stage > 7) {
        break;
      }

      if (stage === 7) {
        const approvalPath = path.join(campaignPath, 'human-approval.json');
        const approval = await fs.readFile(approvalPath, 'utf-8')
          .then(content => JSON.parse(content) as { status?: string; selectedAngleTitle?: string; selectedAngleId?: string | number; provenanceStatus?: ProvenanceStatus; provenanceWarning?: string })
          .catch(() => null);

        const hasPitchSelection = approval?.status === 'approved' && Boolean(approval?.selectedAngleTitle || approval?.selectedAngleId);
        let provenanceWarning: string | undefined;
        if (hasPitchSelection) {
          const provenanceDecision = getApprovalProgressionDecision({ status: approval?.status ?? null, provenanceStatus: approval?.provenanceStatus });
          if (!provenanceDecision.allowed) {
            return fail('PROVENANCE_BLOCKED', provenanceDecision.reason, { status: 400 });
          }
          provenanceWarning = 'warning' in provenanceDecision ? provenanceDecision.warning : undefined;
        }
        if (!hasPitchSelection) {
          const waitDecision = buildPitchWaitDecision(campaignId);
          waitDecision.instruction_compliance = await evaluateInstructionCompliance(7);
          decisions.push(waitDecision);
          await appendStageGateDecision(campaignPath, waitDecision);
          await writeStageState(campaignPath, {
            ...state,
            status: 'waiting-for-pitch-selection',
            blockedStage: 7,
            lastBlockedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          break;
        }

        const selectedAnglePath = path.join(campaignPath, '07-selected-angle.md');
        if (!(await exists(selectedAnglePath))) {
          const selectedTitle = approval?.selectedAngleTitle || `Selected Angle ${approval?.selectedAngleId || ''}`.trim();
          await fs.writeFile(
            selectedAnglePath,
            `# Selected Angle\n\n${selectedTitle}\n\n---\nApproved at: ${new Date().toISOString()}\n`,
            'utf-8'
          );
        }

        const s8GateCheck = await runCanonicalGatePrecheck(campaignId, 7);
        if (s8GateCheck) return s8GateCheck;

        const pitchDecision: StageGateDecision = {
          ...buildPassDecision(campaignId, 7),
          stage_gate_status: 'pitch_selected',
          decision: 'continue_to_next_stage',
          requires_human: false,
          handoff: {
            next_stage: 'S8',
            next_agent: STAGE_AGENT[8],
            handoff_summary: 'Pitch selected by human reviewer. Workflow resumed automatically.',
            handoff_payload_ready: true,
          },
          system_action: {
            update_campaign_status: true,
            new_campaign_status: 'running',
            auto_route_to_next_stage: true,
            create_approval_queue_item: false,
            resume_agent_workflow: true,
          },
        };
        if (provenanceWarning) {
          pitchDecision.provenanceWarning = provenanceWarning;
        }
        decisions.push(pitchDecision);
        const pitchSelectedDecision = decisions[decisions.length - 1];
        pitchSelectedDecision.instruction_compliance = await evaluateInstructionCompliance(7);
        await appendStageGateDecision(campaignPath, pitchSelectedDecision);

        await writeStageState(campaignPath, {
          ...state,
          currentStage: 8,
          status: 'running',
          blockedStage: undefined,
          lastBlockedAt: undefined,
          updatedAt: new Date().toISOString(),
        });
        continue;
      }

      const execution = await callExecuteStage(request, campaignId, stage);
      if (!execution.ok) {
        const reason = execution.error?.message || execution.error?.error || 'Stage execution failed.';
        const detailCode = execution.error?.code || execution.error?.error;
        const dependencyMissing = Array.isArray(execution.error?.details?.missing)
          ? execution.error.details.missing.map((item: unknown) => String(item))
          : [];
        const blockerMessage = `${stageLabel(stage)} execution failed: ${reason}`;
        if (execution.status === 409 || detailCode === 'STAGE_DEPENDENCY_BLOCKED' || detailCode === 'STAGE_ORDER_BLOCKED') {
          const questionId = await createApprovalQueueBlocker(campaignId, stage, blockerMessage, dependencyMissing);
          const blockerDecision: StageGateDecision = {
            ...buildPassDecision(campaignId, stage),
            stage_gate_status: 'blocker',
            decision: 'send_to_approval_queue',
            requires_human: true,
            confidence_score: 0.4,
            instruction_compliance: await evaluateInstructionCompliance(stage),
            quality_checks: {
              required_fields_complete: false,
              output_is_structured: false,
              output_is_relevant: false,
              output_is_actionable: false,
              output_is_ready_for_next_agent: false,
              data_conflicts_found: false,
              critical_gaps_found: true,
            },
            issues: {
              missing_fields: dependencyMissing,
              weak_areas: [],
              unresolved_questions: [blockerMessage],
              blockers: [blockerMessage],
            },
            handoff: {
              next_stage: null,
              next_agent: null,
              handoff_summary: null,
              handoff_payload_ready: false,
            },
            system_action: {
              update_campaign_status: true,
              new_campaign_status: 'waiting-for-user-input',
              auto_route_to_next_stage: false,
              create_approval_queue_item: true,
              pause_workflow: true,
            },
          };
          decisions.push(blockerDecision);
          await appendStageGateDecision(campaignPath, blockerDecision);
          await writeStageState(campaignPath, {
            ...state,
            currentStage: stage,
            status: 'waiting-for-user-input',
            blockedStage: stage,
            lastBlockedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          await writeApiAuditLog(request, {
            level: 'warning',
            source: 'auto-progress',
            message: `Auto progression blocked at ${stageLabel(stage)}.`,
            details: `Approval queue item created: ${questionId}; reason: ${reason}`,
            fields: {
              stage,
              campaignId,
              actor: 'workflow_automation',
              action: 'auto_progress_blocked_dependency',
            },
          });
          break;
        } else {
          const questionId = await createApprovalQueueBlocker(campaignId, stage, blockerMessage, []);
          const errorDecision: StageGateDecision = {
            ...buildPassDecision(campaignId, stage),
            stage_gate_status: 'system_error',
            decision: 'pause_workflow_and_log_error',
            requires_human: true,
            confidence_score: null,
            instruction_compliance: await evaluateInstructionCompliance(stage),
            quality_checks: {
              required_fields_complete: false,
              output_is_structured: false,
              output_is_relevant: false,
              output_is_actionable: false,
              output_is_ready_for_next_agent: false,
              data_conflicts_found: false,
              critical_gaps_found: true,
            },
            issues: {
              missing_fields: [],
              weak_areas: [],
              unresolved_questions: [blockerMessage],
              blockers: [blockerMessage],
            },
            handoff: {
              next_stage: null,
              next_agent: null,
              handoff_summary: null,
              handoff_payload_ready: false,
            },
            system_action: {
              update_campaign_status: true,
              new_campaign_status: 'error',
              auto_route_to_next_stage: false,
              create_approval_queue_item: true,
              pause_workflow: true,
            },
          };
          decisions.push(errorDecision);
          await appendStageGateDecision(campaignPath, errorDecision);
          await writeStageState(campaignPath, {
            ...state,
            currentStage: stage,
            status: 'error',
            blockedStage: stage,
            lastBlockedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          await writeApiAuditLog(request, {
            level: 'error',
            source: 'auto-progress',
            message: `Auto progression failed at ${stageLabel(stage)}.`,
            details: `Approval queue item created: ${questionId}; reason: ${reason}`,
            fields: {
              stage,
              campaignId,
              actor: 'workflow_automation',
              action: 'auto_progress_error',
            },
          });
          break;
        }
      }

      const handoffCheck = await validateStageHandoff(campaignPath, stage);
      if (!handoffCheck.valid) {
        const attemptKey = String(stage);
        const attempts = (state.autoRepairAttempts?.[attemptKey] || 0) + 1;
        const attemptMap = { ...(state.autoRepairAttempts || {}), [attemptKey]: attempts };
        const missing = handoffCheck.missingRequirements.map(item => `${item.requirement} (${item.acceptedFiles.join(' OR ')})`);
        if (attempts <= MAX_REPAIR_ATTEMPTS) {
          const repairDecision: StageGateDecision = {
            ...buildPassDecision(campaignId, stage),
            stage_gate_status: 'fail_repairable',
            decision: 'repair_and_retry',
            requires_human: false,
            confidence_score: 0.68,
            instruction_compliance: await evaluateInstructionCompliance(stage),
            quality_checks: {
              required_fields_complete: false,
              output_is_structured: true,
              output_is_relevant: true,
              output_is_actionable: false,
              output_is_ready_for_next_agent: false,
              data_conflicts_found: false,
              critical_gaps_found: true,
            },
            issues: {
              missing_fields: missing,
              weak_areas: ['Stage output exists but required handoff artifacts are incomplete.'],
              unresolved_questions: ['Auto-repair is re-running the stage to fill required artifacts.'],
              blockers: [],
            },
            repair_attempt: {
              repair_needed: true,
              repair_attempted: true,
              repair_successful: null,
              max_repair_attempts: MAX_REPAIR_ATTEMPTS,
              current_repair_attempt: attempts,
              repair_notes: [`Retrying ${stageLabel(stage)} due to missing artifacts.`],
            },
            handoff: {
              next_stage: null,
              next_agent: null,
              handoff_summary: null,
              handoff_payload_ready: false,
            },
            system_action: {
              update_campaign_status: true,
              new_campaign_status: `${stageLabel(stage)}-repairing`,
              auto_route_to_next_stage: false,
              create_approval_queue_item: false,
            },
          };
          decisions.push(repairDecision);
          await appendStageGateDecision(campaignPath, repairDecision);
          await writeStageState(campaignPath, {
            ...state,
            currentStage: stage,
            status: 'repairing',
            autoRepairAttempts: attemptMap,
            updatedAt: new Date().toISOString(),
          });
          continue;
        } else {
          const blockerMessage = `${stageLabel(stage)} failed after ${MAX_REPAIR_ATTEMPTS} repair attempts. Missing: ${missing.join('; ')}`;
          const questionId = await createApprovalQueueBlocker(campaignId, stage, blockerMessage, missing);
          const failAfterRepairDecision: StageGateDecision = {
            ...buildPassDecision(campaignId, stage),
            stage_gate_status: 'fail_after_repair',
            decision: 'request_agent_review_or_escalate',
            requires_human: true,
            confidence_score: 0.55,
            instruction_compliance: await evaluateInstructionCompliance(stage),
            quality_checks: {
              required_fields_complete: false,
              output_is_structured: true,
              output_is_relevant: true,
              output_is_actionable: false,
              output_is_ready_for_next_agent: false,
              data_conflicts_found: false,
              critical_gaps_found: true,
            },
            issues: {
              missing_fields: missing,
              weak_areas: ['Stage artifact set remained incomplete after repair retries.'],
              unresolved_questions: ['Human decision required: provide missing inputs or allow manual override.'],
              blockers: [blockerMessage],
            },
            repair_attempt: {
              repair_needed: true,
              repair_attempted: true,
              repair_successful: false,
              max_repair_attempts: MAX_REPAIR_ATTEMPTS,
              current_repair_attempt: attempts,
              repair_notes: [`Approval queue item created: ${questionId}`],
            },
            handoff: {
              next_stage: null,
              next_agent: null,
              handoff_summary: null,
              handoff_payload_ready: false,
            },
            system_action: {
              update_campaign_status: true,
              new_campaign_status: 'waiting-for-agent-review',
              auto_route_to_next_stage: false,
              create_approval_queue_item: true,
              pause_workflow: true,
            },
          };
          decisions.push(failAfterRepairDecision);
          await appendStageGateDecision(campaignPath, failAfterRepairDecision);
          await writeStageState(campaignPath, {
            ...state,
            currentStage: stage,
            status: 'waiting-for-agent-review',
            blockedStage: stage,
            lastBlockedAt: new Date().toISOString(),
            autoRepairAttempts: attemptMap,
            updatedAt: new Date().toISOString(),
          });
          await writeApiAuditLog(request, {
            level: 'warning',
            source: 'auto-progress',
            message: `${stageLabel(stage)} failed after repair attempts.`,
            details: `Approval queue item created: ${questionId}`,
            fields: {
              stage,
              campaignId,
              actor: 'workflow_automation',
              action: 'auto_progress_fail_after_repair',
            },
          });
          break;
        }
      }

      const advanceGateCheck = await runCanonicalGatePrecheck(campaignId, stage);
      if (advanceGateCheck) return advanceGateCheck;

      const passDecision = buildPassDecision(campaignId, stage);
      passDecision.instruction_compliance = await evaluateInstructionCompliance(stage);
      decisions.push(passDecision);
      await appendStageGateDecision(campaignPath, passDecision);
      const postState = await readStageState(campaignPath);
      if ((postState.currentStage || 1) <= stage && stage < 16) {
        await writeStageState(campaignPath, {
          ...postState,
          currentStage: stage + 1,
          status: 'running',
          updatedAt: new Date().toISOString(),
        });
      }
      if (postState.currentStage === 7 && mode === 'pre_pitch') {
        continue;
      }
      if ((postState.currentStage || 1) >= 16 && postState.status === 'completed') {
        break;
      }
    }

    const finalState = await readStageState(campaignPath);
    await writeApiAuditLog(request, {
      level: 'success',
      source: 'auto-progress',
      message: `Auto progression executed in mode ${mode}.`,
      fields: {
        campaignId,
        stage: Number(finalState.currentStage || 1),
        actor: 'workflow_automation',
        action: `auto_progress_${mode}`,
      },
    });

    return ok({
      campaignId,
      mode,
      finalStage: finalState.currentStage || 1,
      finalStatus: finalState.status || 'unknown',
      decisions,
    });
  } catch (error) {
    return fail(
      'AUTO_PROGRESS_FAILED',
      'Failed to auto-progress campaign workflow.',
      { status: 500 },
      error instanceof Error ? error.message : String(error)
    );
  }
}
