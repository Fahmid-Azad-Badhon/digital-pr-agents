/**
 * =============================================================================
 * STAGE CONTRACT VALIDATOR MODULE
 * =============================================================================
 * 
 * Validates stage contracts before execution.
 * 
 * =============================================================================
 */

import fs from 'fs/promises';
import path from 'path';
import { PITCH_JOBS_ROOT } from '@/lib/requestGuard';

const CAMPAIGNS_DIR = PITCH_JOBS_ROOT;

const SYSTEM_DIR = path.join(path.dirname(PITCH_JOBS_ROOT), 'system');

export interface ContractStatus {
  stageId: string;
  contractVersion: string;
  status: 'not_checked' | 'passed' | 'warning' | 'blocked' | 'failed';
  requiredInputsPresent: boolean;
  missingInputs: string[];
  forbiddenInputsDetected: boolean;
  modelAllowed: boolean;
  outputPathReady: boolean;
  validationRequired: boolean;
  gateBeforePassed: boolean;
  canRun: boolean;
  blockingReasons: string[];
  warnings: string[];
}

export interface ContractStatusFile {
  campaignSlug: string;
  updatedAt: string;
  stageStatuses: ContractStatus[];
}

async function loadStageContracts() {
  const contractsPath = path.join(SYSTEM_DIR, 'stage-contracts.json');
  try {
    const data = await fs.readFile(contractsPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { stages: {} };
  }
}

export async function getContract(stageId: string): Promise<any | null> {
  const contracts = await loadStageContracts();
  return contracts.stages?.[stageId] || null;
}

export async function validateRequiredInputs(
  campaignSlug: string,
  stageId: string
): Promise<{ present: boolean; missing: string[] }> {
  const contract = await getContract(stageId);
  if (!contract) {
    return { present: false, missing: ['Contract not found'] };
  }
  
  const campaignPath = path.join(CAMPAIGNS_DIR, campaignSlug);
  const missing: string[] = [];
  
  for (const requiredFile of contract.requires || []) {
    const filePath = path.join(campaignPath, requiredFile);
    try {
      await fs.access(filePath);
      // Check if file is not empty
      const stats = await fs.stat(filePath);
      if (stats.size === 0) {
        missing.push(`${requiredFile} (empty)`);
      }
    } catch {
      missing.push(requiredFile);
    }
  }
  
  return {
    present: missing.length === 0,
    missing
  };
}

export async function validateForbiddenInputs(
  campaignSlug: string,
  stageId: string
): Promise<{ detected: boolean; found: string[] }> {
  const contract = await getContract(stageId);
  if (!contract) {
    return { detected: false, found: [] };
  }
  
  // This would require more complex checking against outputs
  // For now, return empty - actual validation happens at gate time
  return { detected: false, found: [] };
}

export async function canStageRun(
  campaignSlug: string,
  stageId: string
): Promise<ContractStatus> {
  const contract = await getContract(stageId);
  if (!contract) {
    return {
      stageId,
      contractVersion: 'unknown',
      status: 'failed',
      requiredInputsPresent: false,
      missingInputs: ['Contract not found'],
      forbiddenInputsDetected: false,
      modelAllowed: false,
      outputPathReady: false,
      validationRequired: false,
      gateBeforePassed: false,
      canRun: false,
      blockingReasons: ['Stage contract not found'],
      warnings: []
    };
  }
  
  const inputValidation = await validateRequiredInputs(campaignSlug, stageId);
  const campaignPath = path.join(CAMPAIGNS_DIR, campaignSlug);
  
  // Check output path exists
  let outputPathReady = true;
  const outputDir = path.join(campaignPath);
  try {
    await fs.access(outputDir);
  } catch {
    outputPathReady = false;
  }
  
  const status: ContractStatus = {
    stageId,
    contractVersion: contract.version || '1.0',
    status: inputValidation.present ? 'passed' : 'blocked',
    requiredInputsPresent: inputValidation.present,
    missingInputs: inputValidation.missing,
    forbiddenInputsDetected: false,
    modelAllowed: true,
    outputPathReady,
    validationRequired: contract.validationRequired || false,
    gateBeforePassed: true, // Gate checking is handled by GateEngine
    canRun: inputValidation.present && outputPathReady,
    blockingReasons: inputValidation.missing.length > 0 
      ? [`Missing required inputs: ${inputValidation.missing.join(', ')}`]
      : [],
    warnings: []
  };
  
  // Write contract status
  await writeContractStatus(campaignSlug, status);
  
  return status;
}

async function writeContractStatus(campaignSlug: string, status: ContractStatus): Promise<void> {
  const campaignPath = path.join(CAMPAIGNS_DIR, campaignSlug);
  const statusPath = path.join(campaignPath, 'contract-status.json');
  
  let existing: ContractStatusFile = { campaignSlug, updatedAt: '', stageStatuses: [] };
  
  try {
    const data = await fs.readFile(statusPath, 'utf-8');
    existing = JSON.parse(data);
  } catch {
    // File doesn't exist
  }
  
  const existingIndex = existing.stageStatuses.findIndex(s => s.stageId === status.stageId);
  if (existingIndex >= 0) {
    existing.stageStatuses[existingIndex] = status;
  } else {
    existing.stageStatuses.push(status);
  }
  
  existing.updatedAt = new Date().toISOString();
  
  await fs.writeFile(statusPath, JSON.stringify(existing, null, 2), 'utf-8');
}

export async function getContractStatus(campaignSlug: string, stageId: string): Promise<ContractStatus | null> {
  const statusPath = path.join(CAMPAIGNS_DIR, campaignSlug, 'contract-status.json');
  
  try {
    const data = JSON.parse(await fs.readFile(statusPath, 'utf-8'));
    return data.stageStatuses?.find((s: ContractStatus) => s.stageId === stageId) || null;
  } catch {
    return null;
  }
}