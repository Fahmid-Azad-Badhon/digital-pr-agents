/**
 * =============================================================================
 * AGENT HANDOFF SYSTEM - Handoff Validation and Package Building
 * =============================================================================
 * 
 * Validates handoff contracts between stages.
 * Builds handoff packages with required artifacts and fields.
 * Blocks invalid handoffs with clear error messages.
 * 
 * =============================================================================
 */

import { 
  getHandoff, 
  type HandoffRegistryEntry 
} from '@/data/agentHandoffRegistry';

/**
 * Get the handoff contract between two stages
 */
export function getHandoffContract(fromStage: number, toStage: number): HandoffRegistryEntry | undefined {
  return getHandoff(fromStage, toStage);
}

/**
 * Validate if a handoff is ready to proceed
 */
export function validateHandoffReadiness(params: {
  fromStage: number;
  toStage: number;
  artifacts: Record<string, unknown>;
  fields: Record<string, unknown>;
}): HandoffValidationResult {
  const { fromStage, toStage, artifacts, fields } = params;
  
  // Get the handoff contract
  const contract = getHandoff(fromStage, toStage);
  
  if (!contract) {
    return {
      ready: false,
      missingArtifacts: [],
      missingFields: [],
      blockers: [{
        blockerId: 'no-contract',
        message: `No handoff contract defined for ${fromStage} → ${toStage}`,
        missingArtifact: undefined,
        missingField: undefined,
        requiredAction: 'Define handoff contract',
      }],
      warnings: [],
    };
  }
  
  const missingArtifacts: string[] = [];
  const missingFields: string[] = [];
  const warnings: string[] = [];
  const blockers: HandoffBlocker[] = [];
  
  // Check required artifacts
  for (const reqArtifact of contract.requiredArtifacts) {
    if (reqArtifact.required) {
      const artifactExists = artifacts[reqArtifact.artifactId] !== undefined ||
                             artifacts[reqArtifact.fileName] !== undefined;
      
      if (!artifactExists) {
        missingArtifacts.push(reqArtifact.fileName);
        
        if (contract.blockedIfMissing.includes(reqArtifact.artifactId)) {
          blockers.push({
            blockerId: `missing-artifact-${reqArtifact.artifactId}`,
            message: `Required artifact missing: ${reqArtifact.fileName}`,
            missingArtifact: reqArtifact.fileName,
            requiredAction: reqArtifact.description,
          });
        }
      }
    }
  }
  
  // Check required fields
  for (const reqField of contract.requiredFields) {
    if (reqField.required) {
      const fieldExists = fields[reqField.fieldName] !== undefined && 
                         fields[reqField.fieldName] !== null &&
                         fields[reqField.fieldName] !== '';
      
      if (!fieldExists) {
        missingFields.push(reqField.fieldName);
        
        if (contract.blockedIfMissing.includes(reqField.fieldName)) {
          blockers.push({
            blockerId: `missing-field-${reqField.fieldName}`,
            message: `Required field missing: ${reqField.fieldName}`,
            missingField: reqField.fieldName,
            requiredAction: reqField.description,
          });
        }
      }
    }
  }
  
  // Add warnings to carry forward
  for (const warning of contract.warningsToCarryForward) {
    warnings.push(warning);
  }
  
  // Special check for Stage 4 → 5
  if (fromStage === 4 && toStage === 5) {
    const s4To5Validation = validateStage4To5Handoff(fields);
    blockers.push(...s4To5Validation.blockers);
    warnings.push(...s4To5Validation.warnings);
  }
  
  return {
    ready: blockers.length === 0,
    missingArtifacts,
    missingFields,
    blockers,
    warnings,
  };
}

/**
 * Special validation for Stage 4 → Stage 5 handoff
 */
function validateStage4To5Handoff(fields: Record<string, unknown>): { blockers: HandoffBlocker[]; warnings: string[] } {
  const blockers: HandoffBlocker[] = [];
  const warnings: string[] = [];
  
  // Check for required Stage 5 inputs
  const requiredFields = [
    'campaignId',
    'approvedFindings', 
    'campaignInsights',
    'angleDirections',
    'handoffSummary',
  ];
  
  for (const field of requiredFields) {
    if (!fields[field]) {
      blockers.push({
        blockerId: `s4-s5-missing-${field}`,
        message: `Stage 4 → 5 handoff missing required field: ${field}`,
        missingField: field,
        requiredAction: `Complete ${field} before transitioning to Stage 5`,
      });
    }
  }
  
  // Check for specific Stage 5 artifacts
  const requiredArtifacts = [
    '04-analysis.md',
    'InsightAnalysisMap',
    'AngleGenerationHandoff',
  ];
  
  for (const artifact of requiredArtifacts) {
    const fieldValue = fields as Record<string, unknown>;
    if (!fieldValue[artifact] && !(fieldValue['artifacts'] as Record<string, unknown>)?.[artifact]) {
      blockers.push({
        blockerId: `s4-s5-missing-artifact`,
        message: `Stage 4 → 5 handoff missing required artifact: ${artifact}`,
        missingArtifact: artifact,
        requiredAction: `Generate ${artifact} in Stage 4 before proceeding`,
      });
    }
  }
  
  // Add warnings about evidence and research
  if (fields['realSearchAvailable'] === false) {
    warnings.push('Placeholder research detected - verify all sources before angle generation');
  }
  
  if (fields['weakClaims'] && (fields['weakClaims'] as unknown[]).length > 0) {
    warnings.push('Weak claims detected - do not use as primary storylines');
  }
  
  if (fields['anglesToAvoid'] && (fields['anglesToAvoid'] as unknown[]).length > 0) {
    warnings.push('Some angle directions marked to avoid - do not generate');
  }
  
  return { blockers, warnings };
}

/**
 * Build a handoff package for transition
 */
export function buildHandoffPackage(params: {
  fromStage: number;
  toStage: number;
  campaignId: string;
  artifacts: Record<string, unknown>;
  fields: Record<string, unknown>;
}): HandoffPackage {
  const { fromStage, toStage, campaignId, artifacts, fields } = params;
  
  const contract = getHandoff(fromStage, toStage);
  
  if (!contract) {
    throw new Error(`No handoff contract for ${fromStage} → ${toStage}`);
  }
  
  // Build the package
  const package_: HandoffPackage = {
    handoffId: `handoff-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    campaignId,
    fromStage,
    toStage,
    fromAgent: contract.fromAgent,
    toAgent: contract.toAgent,
    description: contract.description,
    artifacts: [],
    fields: {},
    warnings: contract.warningsToCarryForward,
    createdAt: new Date().toISOString(),
  };
  
  // Add required artifacts
  for (const reqArtifact of contract.requiredArtifacts) {
    const artifactContent = artifacts[reqArtifact.artifactId] || artifacts[reqArtifact.fileName];
    if (artifactContent) {
      package_.artifacts.push({
        artifactId: reqArtifact.artifactId,
        fileName: reqArtifact.fileName,
        content: typeof artifactContent === 'string' ? artifactContent : JSON.stringify(artifactContent),
        transferredAt: new Date().toISOString(),
      });
    }
  }
  
  // Add required fields
  for (const reqField of contract.requiredFields) {
    if (fields[reqField.fieldName] !== undefined) {
      package_.fields[reqField.fieldName] = fields[reqField.fieldName];
    }
  }
  
  return package_;
}

/**
 * Block a handoff with clear reason
 */
export function blockHandoff(validationResult: HandoffValidationResult): HandoffBlock {
  return {
    blocked: true,
    reason: validationResult.blockers.map(b => b.message).join('; '),
    blockers: validationResult.blockers,
    canRetry: validationResult.blockers.every(b => 
      !b.message.includes('missing') || b.message.includes('optional')
    ),
  };
}

/**
 * Check if handoff should block workflow
 */
export function shouldBlockHandoff(validationResult: HandoffValidationResult): boolean {
  return !validationResult.ready && validationResult.blockers.length > 0;
}

// Type definitions

export interface HandoffValidationResult {
  ready: boolean;
  missingArtifacts: string[];
  missingFields: string[];
  blockers: HandoffBlocker[];
  warnings: string[];
}

export interface HandoffBlocker {
  blockerId: string;
  message: string;
  missingArtifact?: string;
  missingField?: string;
  requiredAction: string;
}

export interface HandoffPackage {
  handoffId: string;
  campaignId: string;
  fromStage: number;
  toStage: number;
  fromAgent: string;
  toAgent: string;
  description: string;
  artifacts: TransferredArtifact[];
  fields: Record<string, unknown>;
  warnings: string[];
  createdAt: string;
}

export interface TransferredArtifact {
  artifactId: string;
  fileName: string;
  content: string;
  transferredAt: string;
}

export interface HandoffBlock {
  blocked: boolean;
  reason: string;
  blockers: HandoffBlocker[];
  canRetry: boolean;
}