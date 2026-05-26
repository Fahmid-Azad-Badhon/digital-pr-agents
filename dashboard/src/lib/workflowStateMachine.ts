/**
 * =============================================================================
 * WORKFLOW STATE MACHINE MODULE
 * =============================================================================
 * 
 * Manages workflow state transitions.
 * 
 * =============================================================================
 */

import fs from 'fs/promises';
import path from 'path';
import { getBlockedStages } from './gateEngine';
import { PITCH_JOBS_ROOT } from '@/lib/requestGuard';

const CAMPAIGNS_DIR = PITCH_JOBS_ROOT;

const SYSTEM_DIR = path.join(path.dirname(PITCH_JOBS_ROOT), 'system');

export type WorkflowState = 
  | 'not_started'
  | 'preflight_checking'
  | 'running'
  | 'stage_completed'
  | 'gate_checking'
  | 'waiting_for_human_approval'
  | 'needs_revision'
  | 'blocked'
  | 'validation_failed'
  | 'ready_for_final_review'
  | 'ready_to_send'
  | 'completed';

export interface WorkflowStateFile {
  campaignSlug: string;
  currentState: WorkflowState;
  currentStage: string | null;
  lastCompletedStage: string | null;
  blockedBy: string[];
  canContinue: boolean;
  nextAllowedActions: string[];
  updatedAt: string;
}

async function loadStateMachine() {
  const statePath = path.join(SYSTEM_DIR, 'workflow-state-machine.json');
  try {
    const data = await fs.readFile(statePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { states: {}, unsafeTransitions: [], stageGateRequirements: {} };
  }
}

export async function getWorkflowState(campaignSlug: string): Promise<WorkflowStateFile> {
  const statePath = path.join(CAMPAIGNS_DIR, campaignSlug, 'workflow-state.json');
  
  try {
    return JSON.parse(await fs.readFile(statePath, 'utf-8'));
  } catch {
    return {
      campaignSlug,
      currentState: 'not_started',
      currentStage: null,
      lastCompletedStage: null,
      blockedBy: [],
      canContinue: true,
      nextAllowedActions: ['start_campaign'],
      updatedAt: new Date().toISOString()
    };
  }
}

export async function updateWorkflowState(
  campaignSlug: string,
  newState: WorkflowState,
  currentStage?: string,
  lastCompletedStage?: string
): Promise<WorkflowStateFile> {
  const currentState = await getWorkflowState(campaignSlug);
  
  // Validate transition is allowed
  const stateMachine = await loadStateMachine();
  const allowedTransitions = stateMachine.states?.[currentState.currentState]?.allowedTransitions || [];
  
  if (!allowedTransitions.includes(newState) && newState !== currentState.currentState) {
    // Check for unsafe transitions
    const unsafe = stateMachine.unsafeTransitions?.find((t: any) => 
      t.from === currentState.currentState && t.to === newState
    );
    
    if (unsafe) {
      throw new Error(`Unsafe transition blocked: ${unsafe.blockMessage}`);
    }
  }
  
  // Check for blocking gates
  const blockedStages = await getBlockedStages(campaignSlug);
  
  const updatedState: WorkflowStateFile = {
    campaignSlug,
    currentState: newState,
    currentStage: currentStage || currentState.currentStage,
    lastCompletedStage: lastCompletedStage || currentState.lastCompletedStage,
    blockedBy: blockedStages,
    canContinue: blockedStages.length === 0 && newState !== 'blocked',
    nextAllowedActions: getNextAllowedActions(newState, blockedStages),
    updatedAt: new Date().toISOString()
  };
  
  const statePath = path.join(CAMPAIGNS_DIR, campaignSlug, 'workflow-state.json');
  await fs.writeFile(statePath, JSON.stringify(updatedState, null, 2), 'utf-8');
  
  return updatedState;
}

function getNextAllowedActions(state: WorkflowState, blockedStages: string[]): string[] {
  if (blockedStages.length > 0) {
    return ['resolve_blockers', 'rerun_stage'];
  }
  
  switch (state) {
    case 'not_started':
      return ['start_campaign'];
    case 'running':
      return ['complete_stage', 'pause_workflow'];
    case 'stage_completed':
      return ['run_gate', 'continue_to_next_stage'];
    case 'gate_checking':
      return ['pass_gate', 'fail_gate', 'needs_human_review'];
    case 'waiting_for_human_approval':
      return ['provide_approval', 'reject_approval'];
    case 'needs_revision':
      return ['rerun_stage', 'restart_workflow'];
    case 'blocked':
      return ['resolve_blockers', 'cancel_workflow'];
    case 'ready_for_final_review':
      return ['approve_send', 'request_changes'];
    case 'ready_to_send':
      return ['send_campaign', 'cancel_campaign'];
    case 'completed':
      return ['view_results'];
    default:
      return [];
  }
}

export async function isStateTransitionAllowed(
  campaignSlug: string,
  fromState: WorkflowState,
  toState: WorkflowState
): Promise<{ allowed: boolean; reason?: string }> {
  const stateMachine = await loadStateMachine();
  const allowed = stateMachine.states?.[fromState]?.allowedTransitions?.includes(toState) || false;
  
  if (!allowed) {
    const unsafe = stateMachine.unsafeTransitions?.find((t: any) => 
      t.from === fromState && t.to === toState
    );
    
    return {
      allowed: false,
      reason: unsafe?.blockMessage || 'Transition not allowed'
    };
  }
  
  return { allowed: true };
}