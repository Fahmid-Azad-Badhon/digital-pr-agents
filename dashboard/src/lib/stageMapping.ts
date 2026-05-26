/**
 * =============================================================================
 * STAGE MAPPING - Reconciles WorkflowState with Agent Brain System
 * =============================================================================
 * 
 * This file maps between the legacy workflow stage definitions and the
 * Agent Brain system stage IDs. This ensures both systems are synchronized.
 * 
 * Legacy WorkflowState (13 stages) -> Agent Brain System (16 stages)
 * 
 * =============================================================================
 */

export type LegacyStageId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | -1;
export type AgentBrainStageId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;

export interface StageMapping {
  legacyId: LegacyStageId;
  agentBrainId: AgentBrainStageId;
  legacyName: string;
  agentBrainName: string;
  primaryAgent: string;
  internalAgents?: string[];
  description: string;
}

/**
 * Complete stage mapping between legacy and Agent Brain systems
 */
export const STAGE_MAPPING: StageMapping[] = [
  {
    legacyId: 1,
    agentBrainId: 1,
    legacyName: 'Campaign Intake',
    agentBrainName: 'Campaign Intake',
    primaryAgent: 'orchestrator',
    description: 'Collect campaign brief and study data',
  },
  {
    legacyId: 2,
    agentBrainId: 2,
    legacyName: 'Study Extraction',
    agentBrainName: 'Data Extraction',
    primaryAgent: 'extractor',
    description: 'Extract key insights and findings from raw study',
  },
  {
    legacyId: 3,
    agentBrainId: 3,
    legacyName: 'Research Enrichment',
    agentBrainName: 'Research Enrichment',
    primaryAgent: 'researcher',
    description: 'Enrich with supporting context and SERP research',
  },
  {
    legacyId: 4,
    agentBrainId: 4,
    legacyName: 'Data & Research Analysis',
    agentBrainName: 'Data & Research Analysis',
    primaryAgent: 'data-analyst',
    internalAgents: ['data-analyst', 'insight-analyst'],
    description: 'Two-phase analysis: evidence validation + insight generation',
  },
  {
    legacyId: 5,
    agentBrainId: 5,
    legacyName: 'Angle Generation',
    agentBrainName: 'Angle Generation',
    primaryAgent: 'strategist',
    description: 'Generate 40 pitch angles from Stage 4 output',
  },
  {
    legacyId: 6,
    agentBrainId: 6,
    legacyName: 'Beat Matching',
    agentBrainName: 'Beat Matching',
    primaryAgent: 'beat-matcher',
    description: 'Map angles to journalist beats and priorities',
  },
  {
    legacyId: 7,
    agentBrainId: 7,
    legacyName: 'Pitch Selection',
    agentBrainName: 'Pitch Selection / Human Gate',
    primaryAgent: 'human-reviewer',
    description: 'User selects best angle to proceed with - must be beat-matched first',
  },
  {
    legacyId: 8,
    agentBrainId: 8,
    legacyName: 'Journalist Collection',
    agentBrainName: 'Media Intelligence Collection',
    primaryAgent: 'collector',
    description: 'Collect 800 journalists per beat',
  },
  {
    legacyId: 9,
    agentBrainId: 9,
    legacyName: 'Journalist Matching',
    agentBrainName: 'Media Intelligence Matching',
    primaryAgent: 'intelligence',
    description: 'Score, deduplicate, and match journalists',
  },
  {
    legacyId: 10,
    agentBrainId: 10,
    legacyName: 'Email Writer',
    agentBrainName: 'Pitch Drafting',
    primaryAgent: 'copywriter',
    description: 'Draft 6 pitch email variants',
  },
  {
    legacyId: 11,
    agentBrainId: 11,
    legacyName: 'Email Optimization',
    agentBrainName: 'Pitch Optimization',
    primaryAgent: 'optimizer',
    description: 'Optimize for deliverability and engagement',
  },
  {
    legacyId: 12,
    agentBrainId: 12,
    legacyName: 'Final Package',
    agentBrainName: 'Package Assembly',
    primaryAgent: 'packager',
    description: 'Assemble final package for export',
  },
  {
    legacyId: 13,
    agentBrainId: 13,
    legacyName: 'Validation & Production',
    agentBrainName: 'Validation & Production',
    primaryAgent: 'validator',
    description: 'Validate and send to production',
  },
  // Additional Agent Brain stages (not in legacy)
  {
    legacyId: -1,
    agentBrainId: 14,
    legacyName: 'N/A',
    agentBrainName: 'Human Review',
    primaryAgent: 'human-reviewer',
    description: 'Human approval gate after validation',
  },
  {
    legacyId: -1,
    agentBrainId: 15,
    legacyName: 'N/A',
    agentBrainName: 'Distribution',
    primaryAgent: 'production',
    description: 'Distribution and follow-up management',
  },
  {
    legacyId: -1,
    agentBrainId: 16,
    legacyName: 'N/A',
    agentBrainName: 'Google Doc Export',
    primaryAgent: 'orchestrator',
    description: 'Export final package to Google Docs',
  },
];

/**
 * Convert legacy stage ID to Agent Brain stage ID
 */
export function legacyToAgentBrain(legacyId: number): AgentBrainStageId | undefined {
  const mapping = STAGE_MAPPING.find(m => m.legacyId === legacyId);
  return mapping?.agentBrainId;
}

/**
 * Convert Agent Brain stage ID to legacy stage ID
 */
export function agentBrainToLegacy(agentBrainId: AgentBrainStageId): LegacyStageId | undefined {
  const mapping = STAGE_MAPPING.find(m => m.agentBrainId === agentBrainId && m.legacyId > 0);
  return mapping?.legacyId;
}

/**
 * Get mapping for a specific stage
 */
export function getStageMapping(stageId: number): StageMapping | undefined {
  return STAGE_MAPPING.find(m => m.legacyId === stageId || m.agentBrainId === stageId);
}

/**
 * Get primary agent for a stage
 */
export function getPrimaryAgentForStage(stageId: number): string {
  const mapping = getStageMapping(stageId);
  return mapping?.primaryAgent || 'orchestrator';
}

/**
 * Check if a stage has internal agents
 */
export function stageHasInternalAgents(stageId: number): boolean {
  const mapping = getStageMapping(stageId);
  return !!(mapping?.internalAgents && mapping.internalAgents.length > 0);
}

/**
 * Get internal agents for a stage
 */
export function getInternalAgentsForStage(stageId: number): string[] {
  const mapping = getStageMapping(stageId);
  return mapping?.internalAgents || [];
}

/**
 * Get all stage names for display
 */
export function getAllStageNames(): { id: number; name: string }[] {
  return STAGE_MAPPING.filter(m => m.legacyId > 0).map(m => ({
    id: m.legacyId,
    name: m.legacyName,
  }));
}