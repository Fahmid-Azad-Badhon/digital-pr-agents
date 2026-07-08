/**
 * =============================================================================
 * AGENT GUARDRAILS SYSTEM - Runtime Guardrail Execution
 * =============================================================================
 * 
 * Executes guardrails for agents at input, output, and handoff stages.
 * Prevents invalid data from flowing through the workflow.
 * 
 * =============================================================================
 */

import { getGuardrailsForAgent, getBlockerGuardrailsForAgent, type GuardrailRegistryEntry } from '@/data/agentGuardrails';
import type { AgentId } from '@/types/agentBrain';

/**
 * Run all guardrails for an agent execution
 */
export function runAgentGuardrails(params: {
  agentId: AgentId;
  stageId: number;
  input: unknown;
  output?: unknown;
  handoffData?: Record<string, unknown>;
}): GuardrailResult {
  const { agentId, input, output, handoffData } = params;
  
  const results: GuardrailCheckResult[] = [];
  
  // Get guardrails for this agent
  const guardrails = getGuardrailsForAgent(agentId);
  
  for (const guardrail of guardrails) {
    if (!guardrail.enabled) continue;
    
    let passed = true;
    let message = '';
    
    switch (guardrail.checkType) {
      case 'input':
        const inputResult = runInputGuardrail(guardrail, input);
        passed = inputResult.passed;
        message = inputResult.message;
        break;
        
      case 'output':
        const outputResult = runOutputGuardrail(guardrail, output);
        passed = outputResult.passed;
        message = outputResult.message;
        break;
        
      case 'handoff':
        const handoffResult = runHandoffGuardrail(guardrail, handoffData || {});
        passed = handoffResult.passed;
        message = handoffResult.message;
        break;
        
      default:
        // Guardrail type not yet implemented - pass
        passed = true;
    }
    
    results.push({
      guardrailId: guardrail.id,
      guardrailName: guardrail.rule,
      passed,
      message: passed ? undefined : message || guardrail.failureMessage,
      severity: guardrail.severity,
    });
  }
  
  // Determine overall result
  const blockers = results.filter(r => !r.passed && r.severity === 'blocker');
  const warnings = results.filter(r => !r.passed && r.severity === 'warning');
  
  return {
    passed: blockers.length === 0,
    blockers: blockers.map(b => ({
      id: b.guardrailId,
      message: b.message || b.guardrailName,
    })),
    warnings: warnings.map(w => ({
      id: w.guardrailId,
      message: w.message || w.guardrailName,
    })),
    totalChecked: results.length,
    totalPassed: results.filter(r => r.passed).length,
  };
}

/**
 * Run input-specific guardrails
 */
function runInputGuardrail(guardrail: GuardrailRegistryEntry, input: unknown): { passed: boolean; message: string } {
  const inputObj = input as Record<string, unknown>;
  
  // Special guardrail checks based on agent and stage
  if (guardrail.id === 'strategist-1') {
    // Strategist: Must receive angles only from Stage 4 output
    const hasAnalysis = inputObj['04-analysis-md'] || inputObj['insights'] || inputObj['angleGenerationGuidance'];
    if (!hasAnalysis) {
      return { passed: false, message: 'Angles generated from sources other than Stage 4 output' };
    }
  }
  
  return { passed: true, message: '' };
}

/**
 * Run output-specific guardrails
 */
function runOutputGuardrail(guardrail: GuardrailRegistryEntry, output: unknown): { passed: boolean; message: string } {
  if (!output) {
    return { passed: guardrail.severity !== 'blocker', message: '' };
  }
  
  const outputObj = output as Record<string, unknown>;
  
  // Researcher: Cannot mark real research if realSearchAvailable=false
  if (guardrail.id === 'researcher-1' || guardrail.id === 'researcher-2') {
    const realSearchAvailable = outputObj['realSearchAvailable'];
    const outputMode = outputObj['outputMode'];
    
    if (realSearchAvailable === false && outputMode !== 'manual-research-required') {
      return { passed: false, message: 'Search tools not available - must mark as manual-research-required' };
    }
  }
  
  // Strategist: Every angle must include approvedFindingId
  if (guardrail.id === 'strategist-2') {
    const angles = outputObj['angles'] as Array<Record<string, unknown>> | undefined;
    if (angles && angles.length > 0) {
      const anglesWithoutEvidence = angles.filter(a => 
        !a['approvedFindingIds'] || (a['approvedFindingIds'] as string[]).length === 0
      );
      if (anglesWithoutEvidence.length > 0) {
        return { passed: false, message: `Angle generated without approvedFindingId reference` };
      }
    }
  }
  
  // Data & Research Analyst: Cannot approve evidence without source
  if (guardrail.id === 'data-analyst-1') {
    const verifiedFindings = outputObj['verifiedFindings'] as Array<Record<string, unknown>> | undefined;
    if (verifiedFindings) {
      const findingsWithoutSource = verifiedFindings.filter(f => !f['source'] && !f['sourceContext']);
      if (findingsWithoutSource.length > 0) {
        return { passed: false, message: 'Evidence approved without source - violates guardrail' };
      }
    }
  }
  
  // Insight Analyst: Can only use approved evidence
  if (guardrail.id === 'insight-analyst-1' || guardrail.id === 'insight-analyst-2') {
    const storylines = outputObj['dataBackedStorylines'] as Array<Record<string, unknown>> | undefined;
    if (storylines) {
      const usingBlockedEvidence = storylines.filter(s => s['usesBlockedEvidence'] === true);
      if (usingBlockedEvidence.length > 0) {
        return { passed: false, message: 'Primary storyline uses blocked evidence' };
      }
    }
  }
  
  // Optimizer: Quality score must be >= 8.5
  if (guardrail.id === 'optimizer-1') {
    const qualityScore = outputObj['qualityScore'] as number | undefined;
    if (qualityScore !== undefined && qualityScore < 8.5) {
      return { passed: false, message: 'Quality score below 8.5 - does not pass threshold' };
    }
  }
  
  // Copywriter: Must not introduce new facts
  if (guardrail.id === 'copywriter-1') {
    const introducesNewFacts = outputObj['introducesNewFacts'] as boolean | undefined;
    if (introducesNewFacts === true) {
      return { passed: false, message: 'Pitch contains new facts not in source materials' };
    }
  }
  
  return { passed: true, message: '' };
}

/**
 * Run handoff-specific guardrails
 */
function runHandoffGuardrail(guardrail: GuardrailRegistryEntry, handoffData: Record<string, unknown>): { passed: boolean; message: string } {
  // Check for missing required fields in handoff
  if (guardrail.id === 'handoff-s4-s5') {
    // Stage 4 → 5 handoff must have specific fields
    const requiredFields = ['campaignId', 'approvedFindings', 'campaignInsights', 'angleDirections', 'handoffSummary'];
    const missing = requiredFields.filter(f => !handoffData[f]);
    if (missing.length > 0) {
      return { passed: false, message: `Missing required handoff fields: ${missing.join(', ')}` };
    }
  }
  
  return { passed: true, message: '' };
}

/**
 * Run input guardrails only
 */
export function runInputGuardrails(agentId: AgentId, input: unknown): GuardrailResult {
  const guardrails = getGuardrailsForAgent(agentId).filter(g => g.checkType === 'input');
  return runGuardrailSubset(guardrails, input, undefined, undefined);
}

/**
 * Run output guardrails only
 */
export function runOutputGuardrails(agentId: AgentId, output: unknown): GuardrailResult {
  const guardrails = getGuardrailsForAgent(agentId).filter(g => g.checkType === 'output');
  return runGuardrailSubset(guardrails, undefined, output, undefined);
}

/**
 * Run handoff guardrails only
 */
export function runHandoffGuardrails(agentId: AgentId, handoffData: Record<string, unknown>): GuardrailResult {
  const guardrails = getGuardrailsForAgent(agentId).filter(g => g.checkType === 'handoff');
  return runGuardrailSubset(guardrails, undefined, undefined, handoffData);
}

function runGuardrailSubset(
  guardrails: GuardrailRegistryEntry[],
  input: unknown,
  output: unknown,
  handoffData: Record<string, unknown> | undefined
): GuardrailResult {
  const results: GuardrailCheckResult[] = [];
  
  for (const guardrail of guardrails) {
    if (!guardrail.enabled) continue;
    
    let passed = true;
    let message = '';
    
    if (guardrail.checkType === 'input') {
      const r = runInputGuardrail(guardrail, input);
      passed = r.passed;
      message = r.message;
    } else if (guardrail.checkType === 'output') {
      const r = runOutputGuardrail(guardrail, output);
      passed = r.passed;
      message = r.message;
    } else if (guardrail.checkType === 'handoff' && handoffData) {
      const r = runHandoffGuardrail(guardrail, handoffData);
      passed = r.passed;
      message = r.message;
    }
    
    results.push({
      guardrailId: guardrail.id,
      guardrailName: guardrail.rule,
      passed,
      message: passed ? undefined : message || guardrail.failureMessage,
      severity: guardrail.severity,
    });
  }
  
  const blockers = results.filter(r => !r.passed && r.severity === 'blocker');
  
  return {
    passed: blockers.length === 0,
    blockers: blockers.map(b => ({ id: b.guardrailId, message: b.message || b.guardrailName })),
    warnings: [],
    totalChecked: results.length,
    totalPassed: results.filter(r => r.passed).length,
  };
}

/**
 * Check if an agent has any blocker guardrails that would prevent execution
 */
export function hasBlockingGuardrails(agentId: AgentId): boolean {
  const blockers = getBlockerGuardrailsForAgent(agentId);
  return blockers.length > 0;
}

export interface GuardrailResult {
  passed: boolean;
  blockers: Array<{ id: string; message: string }>;
  warnings: Array<{ id: string; message: string }>;
  totalChecked: number;
  totalPassed: number;
}

export interface GuardrailCheckResult {
  guardrailId: string;
  guardrailName: string;
  passed: boolean;
  message?: string;
  severity: 'warning' | 'blocker';
}