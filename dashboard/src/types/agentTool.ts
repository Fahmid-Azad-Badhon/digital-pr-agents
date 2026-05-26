/**
 * =============================================================================
 * AGENT TOOL TYPES - Tool Definitions and Contracts
 * =============================================================================
 * 
 * These types define what tools each agent can use,
 * supporting the "use only allowed tools" requirement.
 * 
 * =============================================================================
 */

import type { AgentId } from './agentBrain';

/**
 * ToolImplementationStatus - Status of tool implementation
 */
export type ToolImplementationStatus = 'implemented' | 'planned' | 'manual-required' | 'not-available';

/**
 * HallucinationRisk - Risk level of tool producing hallucinated content
 */
export type HallucinationRisk = 'low' | 'medium' | 'high';

/**
 * ToolCategory - Category of tool
 */
export type ToolCategory = 
  | 'llm' 
  | 'search' 
  | 'database' 
  | 'file-system' 
  | 'api' 
  | 'validation' 
  | 'transform' 
  | 'external-service';

/**
 * AgentToolDefinition - Complete definition of a tool
 */
export interface AgentToolDefinition {
  id: string;
  name: string;
  purpose: string;
  category: ToolCategory;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  available: boolean;
  implementationStatus: ToolImplementationStatus;
  fallbackIfUnavailable?: string;
  hallucinationRisk: HallucinationRisk;
  rateLimitPerMinute?: number;
  requiresAuth?: boolean;
  authType?: 'api-key' | 'oauth' | 'none';
  description: string;
  exampleInput?: unknown;
  exampleOutput?: unknown;
}

/**
 * AgentToolContract - Defines what tools an agent can use
 */
export interface AgentToolContract {
  agentId: AgentId;
  allowedTools: ToolPermission[];
  toolGroupRestrictions: ToolGroupRestriction[];
  maxConcurrentTools: number;
  maxToolCallsPerExecution: number;
  toolTimeoutMs: number;
}

/**
 * ToolPermission - Permission for a specific tool
 */
export interface ToolPermission {
  toolId: string;
  toolName: string;
  allowed: boolean;
  reason?: string;
  maxCallsPerExecution?: number;
  requiresApproval?: boolean;
}

/**
 * ToolGroupRestriction - Restriction on a group of tools
 */
export interface ToolGroupRestriction {
  groupName: string;
  allowed: boolean;
  maxCallsPerExecution?: number;
  requiresApproval?: boolean;
}

/**
 * ToolExecution - Record of a tool being executed
 */
export interface ToolExecution {
  executionId: string;
  toolId: string;
  toolName: string;
  agentId: AgentId;
  campaignId: string;
  stageId: number;
  input: unknown;
  output?: unknown;
  error?: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
}

/**
 * ToolCallResult - Result of a tool call
 */
export interface ToolCallResult<TInput = unknown, TOutput = unknown> {
  success: boolean;
  toolId: string;
  input: TInput;
  output?: TOutput;
  error?: string;
  durationMs: number;
  hallucinationsDetected?: boolean;
  hallucinationWarnings?: string[];
}

/**
 * Global tool registry - All available tools in the system
 */
export const TOOL_REGISTRY: AgentToolDefinition[] = [
  // LLM Tools
  {
    id: 'llm-hy3-preview',
    name: 'Hy3 Preview',
    purpose: 'Campaign orchestration and angle generation',
    category: 'llm',
    inputSchema: { type: 'object', properties: { prompt: { type: 'string' }, temperature: { type: 'number' } }, required: ['prompt'] },
    outputSchema: { type: 'object', properties: { text: { type: 'string' }, tokens: { type: 'number' } } },
    available: true,
    implementationStatus: 'implemented',
    hallucinationRisk: 'medium',
    rateLimitPerMinute: 10,
    description: 'Free model via OpenRouter - best for orchestration tasks',
  },
  {
    id: 'llm-nemotron-super',
    name: 'Nemotron 3 Super',
    purpose: 'Research extraction and journalist intelligence',
    category: 'llm',
    inputSchema: { type: 'object', properties: { prompt: { type: 'string' }, temperature: { type: 'number' } }, required: ['prompt'] },
    outputSchema: { type: 'object', properties: { text: { type: 'string' }, tokens: { type: 'number' } } },
    available: true,
    implementationStatus: 'implemented',
    hallucinationRisk: 'medium',
    rateLimitPerMinute: 10,
    description: 'Free model via OpenRouter - best for research tasks',
  },
  {
    id: 'llm-minimax',
    name: 'MiniMax M2.5',
    purpose: 'Pitch variants and email drafting',
    category: 'llm',
    inputSchema: { type: 'object', properties: { prompt: { type: 'string' }, temperature: { type: 'number' } }, required: ['prompt'] },
    outputSchema: { type: 'object', properties: { text: { type: 'string' }, tokens: { type: 'number' } } },
    available: true,
    implementationStatus: 'implemented',
    hallucinationRisk: 'medium',
    rateLimitPerMinute: 10,
    description: 'Free model via OpenRouter - best for content generation',
  },
  // Search Tools
  {
    id: 'search-serp',
    name: 'SERP Search',
    purpose: 'Search engine results for research',
    category: 'search',
    inputSchema: { type: 'object', properties: { query: { type: 'string' }, numResults: { type: 'number' } }, required: ['query'] },
    outputSchema: { type: 'object', properties: { results: { type: 'array' }, totalResults: { type: 'number' } } },
    available: true,
    implementationStatus: 'implemented',
    hallucinationRisk: 'low',
    rateLimitPerMinute: 60,
    description: 'Google SERP search for research enrichment',
  },
  {
    id: 'search-muckrack',
    name: 'Muck Rack Search',
    purpose: 'Find journalists by beat and publication',
    category: 'search',
    inputSchema: { type: 'object', properties: { beat: { type: 'string' }, outlet: { type: 'string' } }, required: ['beat'] },
    outputSchema: { type: 'object', properties: { journalists: { type: 'array' }, totalFound: { type: 'number' } } },
    available: true,
    implementationStatus: 'implemented',
    hallucinationRisk: 'low',
    description: 'Muck Rack API for journalist discovery',
  },
  // Database Tools
  {
    id: 'db-campaign-read',
    name: 'Read Campaign',
    purpose: 'Read campaign data from database',
    category: 'database',
    inputSchema: { type: 'object', properties: { campaignId: { type: 'string' } }, required: ['campaignId'] },
    outputSchema: { type: 'object' },
    available: true,
    implementationStatus: 'implemented',
    hallucinationRisk: 'low',
    description: 'Read campaign from SQLite database',
  },
  {
    id: 'db-campaign-write',
    name: 'Write Campaign',
    purpose: 'Write campaign data to database',
    category: 'database',
    inputSchema: { type: 'object', properties: { campaign: { type: 'object' } }, required: ['campaign'] },
    outputSchema: { type: 'object', properties: { success: { type: 'boolean' } } },
    available: true,
    implementationStatus: 'implemented',
    hallucinationRisk: 'low',
    description: 'Write campaign to SQLite database',
  },
  {
    id: 'db-stage-read',
    name: 'Read Stage',
    purpose: 'Read stage data from database',
    category: 'database',
    inputSchema: { type: 'object', properties: { stageId: { type: 'string' } }, required: ['stageId'] },
    outputSchema: { type: 'object' },
    available: true,
    implementationStatus: 'implemented',
    hallucinationRisk: 'low',
    description: 'Read stage from SQLite database',
  },
  {
    id: 'db-stage-write',
    name: 'Write Stage',
    purpose: 'Write stage data to database',
    category: 'database',
    inputSchema: { type: 'object', properties: { stage: { type: 'object' } }, required: ['stage'] },
    outputSchema: { type: 'object', properties: { success: { type: 'boolean' } } },
    available: true,
    implementationStatus: 'implemented',
    hallucinationRisk: 'low',
    description: 'Write stage to SQLite database',
  },
  // File System Tools
  {
    id: 'fs-read-file',
    name: 'Read File',
    purpose: 'Read a file from the file system',
    category: 'file-system',
    inputSchema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
    outputSchema: { type: 'object', properties: { content: { type: 'string' } } },
    available: true,
    implementationStatus: 'implemented',
    hallucinationRisk: 'low',
    description: 'Read file from local filesystem',
  },
  {
    id: 'fs-write-file',
    name: 'Write File',
    purpose: 'Write a file to the file system',
    category: 'file-system',
    inputSchema: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] },
    outputSchema: { type: 'object', properties: { success: { type: 'boolean' } } },
    available: true,
    implementationStatus: 'implemented',
    hallucinationRisk: 'low',
    description: 'Write file to local filesystem',
  },
  // Validation Tools
  {
    id: 'validate-json',
    name: 'Validate JSON',
    purpose: 'Validate JSON structure',
    category: 'validation',
    inputSchema: { type: 'object', properties: { json: { type: 'string' } }, required: ['json'] },
    outputSchema: { type: 'object', properties: { valid: { type: 'boolean' }, errors: { type: 'array' } } },
    available: true,
    implementationStatus: 'implemented',
    hallucinationRisk: 'low',
    description: 'Validate JSON using Zod schemas',
  },
  {
    id: 'validate-citation',
    name: 'Validate Citation',
    purpose: 'Verify citations against source data',
    category: 'validation',
    inputSchema: { type: 'object', properties: { citations: { type: 'array' }, sources: { type: 'array' } }, required: ['citations'] },
    outputSchema: { type: 'object', properties: { validCitations: { type: 'array' }, invalidCitations: { type: 'array' } } },
    available: true,
    implementationStatus: 'implemented',
    hallucinationRisk: 'low',
    description: 'Validate citations exist in source data',
  },
  // Transform Tools
  {
    id: 'transform-markdown',
    name: 'Transform Markdown',
    purpose: 'Transform content to markdown format',
    category: 'transform',
    inputSchema: { type: 'object', properties: { content: { type: 'string' }, format: { type: 'string' } }, required: ['content'] },
    outputSchema: { type: 'object', properties: { markdown: { type: 'string' } } },
    available: true,
    implementationStatus: 'implemented',
    hallucinationRisk: 'low',
    description: 'Convert content to markdown',
  },
  // External Services
  {
    id: 'external-google-docs',
    name: 'Google Docs Export',
    purpose: 'Export content to Google Docs',
    category: 'external-service',
    inputSchema: { type: 'object', properties: { title: { type: 'string' }, content: { type: 'string' } }, required: ['title', 'content'] },
    outputSchema: { type: 'object', properties: { docUrl: { type: 'string' } } },
    available: false,
    implementationStatus: 'manual-required',
    hallucinationRisk: 'low',
    description: 'Export to Google Docs - requires OAuth setup',
  },
];

/**
 * Default tool contracts for each agent
 */
export const DEFAULT_TOOL_CONTRACTS: Record<AgentId, AgentToolContract> = {
  orchestrator: {
    agentId: 'orchestrator',
    allowedTools: [
      { toolId: 'llm-hy3-preview', toolName: 'Hy3 Preview', allowed: true },
      { toolId: 'db-campaign-read', toolName: 'Read Campaign', allowed: true },
      { toolId: 'db-campaign-write', toolName: 'Write Campaign', allowed: true },
      { toolId: 'db-stage-read', toolName: 'Read Stage', allowed: true },
      { toolId: 'db-stage-write', toolName: 'Write Stage', allowed: true },
      { toolId: 'fs-read-file', toolName: 'Read File', allowed: true },
      { toolId: 'fs-write-file', toolName: 'Write File', allowed: true },
      { toolId: 'validate-json', toolName: 'Validate JSON', allowed: true },
    ],
    toolGroupRestrictions: [],
    maxConcurrentTools: 3,
    maxToolCallsPerExecution: 50,
    toolTimeoutMs: 30000,
  },
  extractor: {
    agentId: 'extractor',
    allowedTools: [
      { toolId: 'llm-nemotron-super', toolName: 'Nemotron 3 Super', allowed: true },
      { toolId: 'llm-minimax', toolName: 'MiniMax M2.5', allowed: true },
      { toolId: 'db-campaign-read', toolName: 'Read Campaign', allowed: true },
      { toolId: 'fs-read-file', toolName: 'Read File', allowed: true },
      { toolId: 'fs-write-file', toolName: 'Write File', allowed: true },
      { toolId: 'validate-json', toolName: 'Validate JSON', allowed: true },
    ],
    toolGroupRestrictions: [],
    maxConcurrentTools: 2,
    maxToolCallsPerExecution: 20,
    toolTimeoutMs: 60000,
  },
  researcher: {
    agentId: 'researcher',
    allowedTools: [
      { toolId: 'llm-nemotron-super', toolName: 'Nemotron 3 Super', allowed: true },
      { toolId: 'search-serp', toolName: 'SERP Search', allowed: true },
      { toolId: 'db-campaign-read', toolName: 'Read Campaign', allowed: true },
      { toolId: 'db-campaign-write', toolName: 'Write Campaign', allowed: true },
      { toolId: 'fs-write-file', toolName: 'Write File', allowed: true },
      { toolId: 'validate-json', toolName: 'Validate JSON', allowed: true },
      { toolId: 'validate-citation', toolName: 'Validate Citation', allowed: true },
    ],
    toolGroupRestrictions: [],
    maxConcurrentTools: 3,
    maxToolCallsPerExecution: 30,
    toolTimeoutMs: 45000,
  },
  'data-analyst': {
    agentId: 'data-analyst',
    allowedTools: [
      { toolId: 'llm-nemotron-super', toolName: 'Nemotron 3 Super', allowed: true },
      { toolId: 'search-serp', toolName: 'SERP Search', allowed: true, requiresApproval: true },
      { toolId: 'db-campaign-read', toolName: 'Read Campaign', allowed: true },
      { toolId: 'fs-read-file', toolName: 'Read File', allowed: true },
      { toolId: 'fs-write-file', toolName: 'Write File', allowed: true },
      { toolId: 'validate-json', toolName: 'Validate JSON', allowed: true },
      { toolId: 'validate-citation', toolName: 'Validate Citation', allowed: true },
    ],
    toolGroupRestrictions: [],
    maxConcurrentTools: 2,
    maxToolCallsPerExecution: 25,
    toolTimeoutMs: 60000,
  },
  'insight-analyst': {
    agentId: 'insight-analyst',
    allowedTools: [
      { toolId: 'llm-nemotron-super', toolName: 'Nemotron 3 Super', allowed: true },
      { toolId: 'db-campaign-read', toolName: 'Read Campaign', allowed: true },
      { toolId: 'fs-read-file', toolName: 'Read File', allowed: true },
      { toolId: 'fs-write-file', toolName: 'Write File', allowed: true },
      { toolId: 'validate-json', toolName: 'Validate JSON', allowed: true },
    ],
    toolGroupRestrictions: [],
    maxConcurrentTools: 2,
    maxToolCallsPerExecution: 20,
    toolTimeoutMs: 60000,
  },
  strategist: {
    agentId: 'strategist',
    allowedTools: [
      { toolId: 'llm-hy3-preview', toolName: 'Hy3 Preview', allowed: true },
      { toolId: 'db-campaign-read', toolName: 'Read Campaign', allowed: true },
      { toolId: 'fs-read-file', toolName: 'Read File', allowed: true },
      { toolId: 'fs-write-file', toolName: 'Write File', allowed: true },
      { toolId: 'validate-json', toolName: 'Validate JSON', allowed: true },
    ],
    toolGroupRestrictions: [],
    maxConcurrentTools: 2,
    maxToolCallsPerExecution: 20,
    toolTimeoutMs: 30000,
  },
  'beat-matcher': {
    agentId: 'beat-matcher',
    allowedTools: [
      { toolId: 'llm-hy3-preview', toolName: 'Hy3 Preview', allowed: true },
      { toolId: 'db-campaign-read', toolName: 'Read Campaign', allowed: true },
      { toolId: 'fs-write-file', toolName: 'Write File', allowed: true },
      { toolId: 'validate-json', toolName: 'Validate JSON', allowed: true },
    ],
    toolGroupRestrictions: [],
    maxConcurrentTools: 1,
    maxToolCallsPerExecution: 10,
    toolTimeoutMs: 30000,
  },
  'human-reviewer': {
    agentId: 'human-reviewer',
    allowedTools: [
      { toolId: 'db-campaign-read', toolName: 'Read Campaign', allowed: true },
      { toolId: 'db-campaign-write', toolName: 'Write Campaign', allowed: true },
      { toolId: 'fs-read-file', toolName: 'Read File', allowed: true },
    ],
    toolGroupRestrictions: [],
    maxConcurrentTools: 1,
    maxToolCallsPerExecution: 10,
    toolTimeoutMs: 0,
  },
  collector: {
    agentId: 'collector',
    allowedTools: [
      { toolId: 'llm-hy3-preview', toolName: 'Hy3 Preview', allowed: true },
      { toolId: 'search-muckrack', toolName: 'Muck Rack Search', allowed: true },
      { toolId: 'search-serp', toolName: 'SERP Search', allowed: true },
      { toolId: 'db-campaign-read', toolName: 'Read Campaign', allowed: true },
      { toolId: 'db-campaign-write', toolName: 'Write Campaign', allowed: true },
      { toolId: 'fs-write-file', toolName: 'Write File', allowed: true },
    ],
    toolGroupRestrictions: [],
    maxConcurrentTools: 3,
    maxToolCallsPerExecution: 50,
    toolTimeoutMs: 30000,
  },
  intelligence: {
    agentId: 'intelligence',
    allowedTools: [
      { toolId: 'llm-nemotron-super', toolName: 'Nemotron 3 Super', allowed: true },
      { toolId: 'db-campaign-read', toolName: 'Read Campaign', allowed: true },
      { toolId: 'db-campaign-write', toolName: 'Write Campaign', allowed: true },
      { toolId: 'fs-read-file', toolName: 'Read File', allowed: true },
      { toolId: 'fs-write-file', toolName: 'Write File', allowed: true },
      { toolId: 'validate-json', toolName: 'Validate JSON', allowed: true },
    ],
    toolGroupRestrictions: [],
    maxConcurrentTools: 2,
    maxToolCallsPerExecution: 30,
    toolTimeoutMs: 45000,
  },
  copywriter: {
    agentId: 'copywriter',
    allowedTools: [
      { toolId: 'llm-minimax', toolName: 'MiniMax M2.5', allowed: true },
      { toolId: 'llm-hy3-preview', toolName: 'Hy3 Preview', allowed: true },
      { toolId: 'db-campaign-read', toolName: 'Read Campaign', allowed: true },
      { toolId: 'fs-read-file', toolName: 'Read File', allowed: true },
      { toolId: 'fs-write-file', toolName: 'Write File', allowed: true },
      { toolId: 'validate-json', toolName: 'Validate JSON', allowed: true },
    ],
    toolGroupRestrictions: [],
    maxConcurrentTools: 2,
    maxToolCallsPerExecution: 15,
    toolTimeoutMs: 45000,
  },
  optimizer: {
    agentId: 'optimizer',
    allowedTools: [
      { toolId: 'llm-nemotron-super', toolName: 'Nemotron 3 Super', allowed: true },
      { toolId: 'llm-minimax', toolName: 'MiniMax M2.5', allowed: true },
      { toolId: 'db-campaign-read', toolName: 'Read Campaign', allowed: true },
      { toolId: 'db-campaign-write', toolName: 'Write Campaign', allowed: true },
      { toolId: 'fs-read-file', toolName: 'Read File', allowed: true },
      { toolId: 'fs-write-file', toolName: 'Write File', allowed: true },
      { toolId: 'validate-json', toolName: 'Validate JSON', allowed: true },
    ],
    toolGroupRestrictions: [],
    maxConcurrentTools: 2,
    maxToolCallsPerExecution: 20,
    toolTimeoutMs: 60000,
  },
  packager: {
    agentId: 'packager',
    allowedTools: [
      { toolId: 'llm-minimax', toolName: 'MiniMax M2.5', allowed: true },
      { toolId: 'db-campaign-read', toolName: 'Read Campaign', allowed: true },
      { toolId: 'db-campaign-write', toolName: 'Write Campaign', allowed: true },
      { toolId: 'fs-read-file', toolName: 'Read File', allowed: true },
      { toolId: 'fs-write-file', toolName: 'Write File', allowed: true },
      { toolId: 'transform-markdown', toolName: 'Transform Markdown', allowed: true },
    ],
    toolGroupRestrictions: [],
    maxConcurrentTools: 2,
    maxToolCallsPerExecution: 15,
    toolTimeoutMs: 30000,
  },
  validator: {
    agentId: 'validator',
    allowedTools: [
      { toolId: 'llm-nemotron-super', toolName: 'Nemotron 3 Super', allowed: true },
      { toolId: 'fs-read-file', toolName: 'Read File', allowed: true },
      { toolId: 'fs-write-file', toolName: 'Write File', allowed: true },
      { toolId: 'validate-json', toolName: 'Validate JSON', allowed: true },
    ],
    toolGroupRestrictions: [],
    maxConcurrentTools: 2,
    maxToolCallsPerExecution: 20,
    toolTimeoutMs: 30000,
  },
  production: {
    agentId: 'production',
    allowedTools: [
      { toolId: 'llm-nemotron-super', toolName: 'Nemotron 3 Super', allowed: true },
      { toolId: 'db-campaign-read', toolName: 'Read Campaign', allowed: true },
      { toolId: 'db-campaign-write', toolName: 'Write Campaign', allowed: true },
      { toolId: 'fs-read-file', toolName: 'Read File', allowed: true },
      { toolId: 'fs-write-file', toolName: 'Write File', allowed: true },
      { toolId: 'validate-json', toolName: 'Validate JSON', allowed: true },
    ],
    toolGroupRestrictions: [],
    maxConcurrentTools: 2,
    maxToolCallsPerExecution: 20,
    toolTimeoutMs: 30000,
  },
};

/**
 * Get allowed tools for an agent
 */
export function getAllowedTools(agentId: AgentId): AgentToolDefinition[] {
  const contract = DEFAULT_TOOL_CONTRACTS[agentId];
  if (!contract) return [];
  
  return contract.allowedTools
    .filter(p => p.allowed)
    .map(p => TOOL_REGISTRY.find(t => t.id === p.toolId))
    .filter((t): t is AgentToolDefinition => t !== undefined);
}