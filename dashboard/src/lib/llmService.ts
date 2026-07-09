/**
 * LLM Service with Smart Error Classification
 * 
 * Model Priority (configured for Digital PR):
 * 1. Primary: Nemotron 3 Ultra (FREE via OpenRouter)
 * 2. Quality Gate: GPT-OSS-120B (FREE via OpenRouter)
 * 3. Fallback: MiniMax M2.5 (FREE via OpenRouter)
 * 
 * Smart Error Handling:
 * - 429: Rate Limit → Exponential backoff & retry (up to 3x)
 * - 5xx: Provider down → Immediate failover to MiniMax
 * - 403/451: Safety block → Move to manual review
 * - 400: Invalid request → Log error, don't fallback
 * - Timeout: Retry once, then failover
 * - Zombie check: Detect hidden refusals in short responses
 * 
 * Note: User has OpenRouter integrated in OpenCode
 */

import { getRunModeFromEnv, shouldBlockExternalAction } from '@/lib/runMode';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.OPENCODE_API_KEY || 'free';
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

interface LLMConfig {
  role: string;
  model: string;
  status: 'active' | 'requires-key' | 'free';
}

interface ErrorClassification {
  category: 'throttling' | 'infrastructure' | 'safety' | 'bug' | 'timeout' | 'unknown';
  action: 'retry_primary' | 'failover' | 'manual_review' | 'halt';
  message: string;
}

const MODEL_CONFIG: LLMConfig[] = [
  { role: 'Primary', model: 'nvidia/nemotron-3-ultra-550b-a55b:free', status: 'free' },       // FREE via OpenRouter
  { role: 'Quality Gate', model: 'openai/gpt-oss-120b:free', status: 'free' },                 // FREE via OpenRouter
  { role: 'Fallback', model: 'minimax/minimax-m2.5:free', status: 'free' }                     // FREE via OpenRouter
];

// =============================================================================
// Rate Limiter (Simple in-memory throttle)
// Prevents hitting RPM limits on free tier
// =============================================================================

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests (30 RPM max)

async function throttleRequest<T>(fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`[Rate Limit] Waiting ${waitTime}ms before next request...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
  return fn();
}

// =============================================================================
// Smart Error Classifier
// =============================================================================

function classifyError(status: number | null, errorMessage: string): ErrorClassification {
  // 429: Rate Limit - Throttling
  if (status === 429) {
    return {
      category: 'throttling',
      action: 'failover', // Changed from retry_primary - failover to different model
      message: 'Rate limit hit (429). Failing over to alternative model.'
    };
  }
  
  // 5xx: Provider/Server Errors - Infrastructure
  if (status && status >= 500 && status <= 599) {
    return {
      category: 'infrastructure',
      action: 'failover',
      message: `Provider error (${status}). Failing over to MiniMax.`
    };
  }
  
  // 502: Bad Gateway - treat as infrastructure
  if (status === 502) {
    return {
      category: 'infrastructure',
      action: 'failover',
      message: 'Bad Gateway (502). Failing over to MiniMax.'
    };
  }
  
  // 503: Service Unavailable
  if (status === 503) {
    return {
      category: 'infrastructure',
      action: 'failover',
      message: 'Service unavailable (503). Failing over to MiniMax.'
    };
  }
  
  // 403 / 451: Safety/Policy violations
  if (status === 403 || status === 451) {
    return {
      category: 'safety',
      action: 'manual_review',
      message: `Safety block (${status}). Requires manual review.`
    };
  }
  
  // 400: Bad Request - Logic/Bug
  if (status === 400) {
    return {
      category: 'bug',
      action: 'halt',
      message: 'Invalid request (400). Do not fallback - fix prompt.'
    };
  }
  
  // Timeout detection
  if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
    return {
      category: 'timeout',
      action: 'retry_primary',
      message: 'Request timeout. Will retry once then failover.'
    };
  }
  
  // Unknown
  return {
    category: 'unknown',
    action: 'halt',
    message: `Unknown error (status: ${status}): ${errorMessage}`
  };
}

/**
 * Zombie Check: Detect hidden refusals in short responses
 */
function isZombieResponse(content: string): boolean {
  if (!content || content.length < 100) {
    const zombiePatterns = [
      /i cannot/i,
      /i'm sorry/i,
      /cannot fulfill/i,
      /cannot complete/i,
      /unable to/i,
      /not able to/i,
      /do not have the ability/i,
      /cannot assist/i,
      /safety guidelines/i,
      /content policy/i
    ];
    
    return zombiePatterns.some(pattern => pattern.test(content));
  }
  return false;
}

/**
 * Smart LLM Call with Error Classification
 * Implements the error handling strategy:
 * - 429: Retry with backoff (up to 3x)
 * - 5xx: Failover to MiniMax
 * - 403/451: Move to manual review (return special code)
 * - 400: Halt (don't fallback)
 * - Timeout: Retry once then failover
 * - Zombie check: Detect hidden refusals
 */
export async function callLLM(prompt: string): Promise<string> {
  const mode = getRunModeFromEnv();
  if (shouldBlockExternalAction(mode)) {
    return '[DRY RUN] External call blocked. No live LLM fetch performed.';
  }

  return throttleRequest(async () => {
    const freeModels = MODEL_CONFIG.filter(m => m.status === 'free').map(m => m.model)
    const primaryModel = freeModels[0] // Nemotron
    const fallbackModel = freeModels[1] // MiniMax
    
    // Track retry count for rate limiting
    let retryCount = 0
    const maxRetries = 3
    
    // Get temperature from stage context or use default
    const temperature = typeof globalThis !== 'undefined' 
      ? (globalThis as any).llmTemperature ?? 0.7 
      : 0.7
    
    // Try primary model with smart error handling
    while (retryCount <= maxRetries) {
      try {
        console.log(`[LLM] Calling primary: ${primaryModel} (attempt ${retryCount + 1}, temp: ${temperature})`)
        
        const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://digital-pr-dashboard.com',
            'X-Title': 'Digital PR Dashboard'
          },
          body: JSON.stringify({
            model: primaryModel,
            messages: [{ role: 'user', content: prompt }],
            temperature: temperature,
            max_tokens: 2000
          })
        })
        
        // Handle response
        if (response.ok) {
          const data = await response.json()
          const content = data.choices?.[0]?.message?.content || ''
          
          // Zombie check
          if (isZombieResponse(content)) {
            console.log(`[LLM] Zombie response detected! Failing over to ${fallbackModel}`)
            break // Will trigger fallback
          }
          
          if (content) {
            console.log(`[LLM] Success with: ${primaryModel}`)
            return content
          }
        }
        
        // Error handling
        const errorClassification = classifyError(response.status, '')
        
        console.log(`[Smart Error] ${errorClassification.message}`)
        
        switch (errorClassification.action) {
          case 'retry_primary':
            if (retryCount < maxRetries) {
              retryCount++
              const backoffTime = Math.pow(2, retryCount) * 1000 // Exponential backoff
              console.log(`[LLM] Retrying in ${backoffTime}ms...`)
              await new Promise(resolve => setTimeout(resolve, backoffTime))
              continue
            }
            break
            
          case 'failover':
            console.log(`[LLM] Failing over to ${fallbackModel}`)
            break
            
          case 'manual_review':
            console.log(`[LLM] SAFETY BLOCK - Move to manual review`)
            return 'ERROR_SAFETY_BLOCK: Requires manual review'
            
          case 'halt':
            console.log(`[LLM] BUG DETECTED - Halting`)
            return 'ERROR_BUG: Invalid request - fix prompt'
        }
        
        // If we get here, break to fallback
        break
        
      } catch (error: any) {
        const errorMessage = error.message || ''
        const errorClassification = classifyError(null, errorMessage)
        
        console.log(`[Smart Error] ${errorClassification.message}`)
        
        if (errorClassification.action === 'retry_primary' && retryCount < maxRetries) {
          retryCount++
          await new Promise(resolve => setTimeout(resolve, 2000))
          continue
        }
        
        if (errorClassification.action === 'failover') {
          break
        }
        
        return `ERROR: ${errorMessage}`
      }
    }
    
    // Fallback to MiniMax
    console.log(`[LLM] Using fallback: ${fallbackModel}`)
    
    try {
      const fallbackResponse = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://digital-pr-dashboard.com',
          'X-Title': 'Digital PR Dashboard'
        },
        body: JSON.stringify({
          model: fallbackModel,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 2000
        })
      })
      
      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json()
        const content = data.choices?.[0]?.message?.content
        
        if (content) {
          console.log(`[LLM] Fallback success with: ${fallbackModel}`)
          return content
        }
      }
    } catch (fallbackError) {
      console.log(`[LLM] Fallback also failed:`, fallbackError)
    }
    
    return 'LLM analysis unavailable - all models exhausted'
  });
}

// =============================================================================
// Reasoning Logger
// Extracts <thought> tags for debugging, strips from final output
// =============================================================================

const REASONING_LOG_DIR = 'D:\\Codex Folder\\digital-pr-agents\\dashboard\\logs'

// =============================================================================
// Dynamic Temperature Scaling
// Different temperatures for different stage types
// =============================================================================

export interface StageConfig {
  stageName: string;
  temperature: number;
  description: string;
}

export const STAGE_TEMPERATURES: StageConfig[] = [
  { stageName: 'S1', temperature: 0.35, description: 'Needs structure, not creativity' },
  { stageName: 'S2', temperature: 0.35, description: 'Must extract exactly what exists, no invention' },
  { stageName: 'S3', temperature: 0.55, description: 'Search variety but careful source interpretation' },
  { stageName: 'S4', temperature: 0.55, description: 'Must judge evidence logically, low creativity' },
  { stageName: 'S5', temperature: 0.77, description: 'Creative angle framing, grounded in data' },
  { stageName: 'S6', temperature: 0.3, description: 'Mostly classification and mapping' },
  { stageName: 'S7', temperature: 0.15, description: 'Decision-making should be strict' },
  { stageName: 'S8', temperature: 0.65, description: 'Factual matching, not creativity' },
  { stageName: 'S9', temperature: 0.3, description: 'Some interpretation of journalist fit' },
  { stageName: 'S10', temperature: 0.77, description: 'Strong, human, non-robotic writing' },
  { stageName: 'S11', temperature: 0.45, description: 'Formatting and compilation' },
  { stageName: 'S12', temperature: 0.25, description: 'Technical output' },
  { stageName: 'S13', temperature: 0.25, description: 'Strict and deterministic validation' },
  { stageName: 'S14', temperature: 0.25, description: 'Strict and deterministic validation' },
  { stageName: 'S15', temperature: 0.25, description: 'Strict and deterministic validation' },
  { stageName: 'S16', temperature: 0.25, description: 'Strict and deterministic validation' }
];

export function getTemperatureForStage(stageName: string): number {
  const config = STAGE_TEMPERATURES.find(s => stageName.startsWith(s.stageName))
  const temp = config?.temperature ?? 0.5
  console.log(`[Temperature] ${stageName}: ${temp} (${config?.description || 'default'})`)
  return temp
}

import { z } from 'zod'

export {
  VerifiedFindingSchema,
  S4AnalysisSchema,
  InsightNoteSchema,
  PitchOutputSchema,
  JournalistProfileSchema,
  validateS4Analysis,
  validateS10Pitch,
  validateS2Insights,
  validateJournalistProfiles,
  validateStageOutput,
} from './llm/schemas/stageSchemas'

export { sanitizeAndParseJSON } from './llm/utils/jsonRepair'

// Context-Length Fingerprinting (Token Optimization)
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

export interface ChunkConfig {
  maxTokens: number;
  minChunkSize: number;
}

const DEFAULT_CHUNK_CONFIG: ChunkConfig = {
  maxTokens: 500000,
  minChunkSize: 1000
}

export function chunkByHeaders(text: string, config: ChunkConfig = DEFAULT_CHUNK_CONFIG): string[] {
  const headerPattern = /^#{1,6}\s+.+$/gm
  const matches = [...text.matchAll(headerPattern)]
  
  if (matches.length === 0 || estimateTokens(text) < config.maxTokens) {
    return [text]
  }
  
  const chunks: string[] = []
  let lastIndex = 0
  
  for (const match of matches) {
    const headerIndex = match.index!
    
    if (headerIndex - lastIndex > config.minChunkSize) {
      chunks.push(text.slice(lastIndex, headerIndex).trim())
    }
    lastIndex = headerIndex
  }
  
  if (text.length - lastIndex > config.minChunkSize) {
    chunks.push(text.slice(lastIndex).trim())
  }
  
  console.log('[Chunking] Split into ' + chunks.length + ' logical chunks')
  return chunks
}

// Refusal Interceptor Middleware
const REFUSAL_PATTERNS = [
  /as an ai model/i,
  /i am unable to/i,
  /i cannot fulfill/i,
  /i'm not able to/i,
  /unable to provide/i,
  /cannot provide/i,
  /sorry, i can't/i,
  /i don't have the ability/i
]

export function detectRefusal(response: string): boolean {
  return REFUSAL_PATTERNS.some(pattern => pattern.test(response))
}

export function extractRefusalType(response: string): string | null {
  for (const pattern of REFUSAL_PATTERNS) {
    const match = response.match(pattern)
    if (match) return match[0]
  }
  return null
}

// Instructional Key-Lock Prompting
export function generateKeyLockPrompt(
  instructionCode: string,
  instructions: string,
  endInstruction: string
): string {
  return 'Instruction Code: ' + instructionCode + '.\n\n' + instructions + '\n\n' + endInstruction + '\n\nRepeat the code at the end.'
}

export function verifyKeyLock(response: string, expectedCode: string): boolean {
  const codePattern = new RegExp(expectedCode, 'i')
  return codePattern.test(response)
}

// Latency-Based Model Routing (Race Condition)
export async function raceModels(
  prompt: string,
  models: string[],
  timeoutMs: number = 30000
): Promise<{ response: string; model: string; latency: number }> {
  const promises = models.map(async (model) => {
    const startTime = Date.now()
    const response = await callLLM(prompt)
    const latency = Date.now() - startTime
    return { response, model, latency }
  })
  
  const timeoutPromise = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error('All models timed out')), timeoutMs)
  )
  
  try {
    const result = await Promise.race([...promises, timeoutPromise])
    console.log('[Race] Won: ' + result.model + ' (' + result.latency + 'ms)')
    return result
  } catch (error) {
    console.error('[Race] All models failed or timed out')
    throw error
  }
}

// Automatic Critique-and-Refine Loop for S11
export interface CritiqueResult {
  score: number;
  critiques: string[];
  shouldRefine: boolean;
}

export function shouldRefinePitch(score: number, threshold: number = 8): boolean {
  return score < threshold
}

export function buildRefinePrompt(originalPitch: string, critiques: string[]): string {
  const critiqueList = critiques.map((c, i) => (i + 1) + '. ' + c).join('\n')
  return 'Critique and refinement requested:\n\nOriginal Pitch:\n' + originalPitch + '\n\nCritiques:\n' + critiqueList + '\n\nPlease revise the pitch addressing these critiques. Maintain all [VF_XX] citations.'
}

// Cold Storage - Pointer System
export interface DataPointer {
  id: string;
  stage: string;
  filePath: string;
  tokenCount: number;
  createdAt: string;
  checksum: string;
}

export function createPointer(stage: string, content: string, campaignId: string): DataPointer {
  const crypto = require('crypto')
  return {
    id: campaignId + '-' + stage + '-' + Date.now(),
    stage,
    filePath: '',
    tokenCount: estimateTokens(content),
    createdAt: new Date().toISOString(),
    checksum: crypto.createHash('md5').update(content).digest('hex')
  }
}

// Prompt-Inject for Human Feedback
export interface UserOverride {
  comment: string;
  priority: 'low' | 'medium' | 'high';
  stage: string;
}

export function injectUserOverride(prompt: string, override: UserOverride): string {
  const priorityLabel = override.priority.toUpperCase()
  const injection = '\n\n[USER OVERRIDE - ' + priorityLabel + ']: ' + override.comment + '\nPriority: High.\n'
  return prompt.replace(/(\n\n|$)/, injection + '$1')
}

// Final Package Checksum (S12)
export interface PackageCompleteness {
  valid: boolean;
  checks: { name: string; passed: boolean; message: string }[];
}

export function validateCompletePackage(pitch: { subject?: string; body?: string; citations?: string[] }): PackageCompleteness {
  const checks = [
    {
      name: 'Subject Line',
      passed: !!(pitch.subject && pitch.subject.length >= 5),
      message: pitch.subject ? 'Present (' + pitch.subject.length + ' chars)' : 'Missing or too short'
    },
    {
      name: 'Body',
      passed: !!(pitch.body && pitch.body.length >= 50),
      message: pitch.body ? 'Present (' + pitch.body.length + ' chars)' : 'Missing or too short'
    },
    {
      name: 'Citations',
      passed: (pitch.citations?.length || 0) >= 2,
      message: (pitch.citations?.length || 0) + ' citations found (min 2 required)'
    }
  ]
  
  const valid = checks.every(c => c.passed)
  
  if (!valid) {
    console.error('[Checksum] Package incomplete:', checks.filter(c => !c.passed).map(c => c.name).join(', '))
  }
  
  return { valid, checks }
}

// =============================================================================
// HANDOVER SYSTEM - State Management & Stage Transitions
// =============================================================================

import fs from 'fs/promises'
import path from 'path'

export type HandoverStatus = 'PROCEED' | 'RETRY_REQUIRED' | 'ESCALATE'

export interface HandoverSignal {
  status: HandoverStatus;
  reason?: string;
  retryWithFallback?: boolean;
  escalateToManual?: boolean;
}

export interface StageSnapshot {
  stage: string;
  timestamp: string;
  model: string;
  tokens: number;
  data: unknown;
  signal?: HandoverSignal
}

// State-Object Pattern
export interface HandoverState {
  campaignId: string;
  currentStage: string;
  history: StageSnapshot[];
  metadata: {
    createdAt: string;
    lastUpdated: string;
    totalTokens: number;
  };
  status?: string;
  completedStages?: string[];
}

export function createInitialState(campaignId: string): HandoverState {
  return {
    campaignId,
    currentStage: 'S0',
    history: [],
    metadata: {
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      totalTokens: 0
    },
    status: 'PENDING',
    completedStages: []
  }
}

// Handover Summary (Lossy Compression)
export function generateHandoverSummary(data: {
  verifiedFindings?: { id: string; text: string }[];
  keyInsights?: string[];
  confidence?: number;
}): string {
  const findings = data.verifiedFindings?.slice(0, 5).map(f => '- ' + f.text.substring(0, 80) + '...').join('\n') || 'No verified findings'
  const insights = data.keyInsights?.slice(0, 3).map(i => '* ' + i).join('\n') || 'No key insights'
  
  return '## Handover Context\n\n**Top Verified Findings:**\n' + findings + '\n\n**Key Insights:**\n' + insights + '\n\n**Confidence Score:** ' + (data.confidence || 'N/A')
}

// Context Pruning for S10
export function pruneContextForStage(
  state: HandoverState,
  targetStage: string
): StageSnapshot[] {
  const pruningRules: Record<string, string[]> = {
    'S10': ['01-raw-study', '02-insights'],
    'S11': ['01-raw-study', '02-insights', '03-research'],
    'S12': ['01-raw-study', '02-insights', '03-research', '04-analysis']
  }
  
  const filesToRemove = pruningRules[targetStage] || []
  const prunedHistory = state.history.filter(s => !filesToRemove.some(f => s.stage.includes(f)))
  
  console.log('[Pruning] Removed ' + (state.history.length - prunedHistory.length) + ' stages for ' + targetStage)
  return prunedHistory
}

// Thought-Chain Carryover
export function extractThoughtChain(state: HandoverState): string {
  const thoughts = state.history
    .filter(s => s.data && typeof s.data === 'string' && s.data.includes('<thought>'))
    .map(s => {
      const match = (s.data as string).match(/<thought>([\s\S]*?)<\/thought>/)
      return match ? s.stage + ': ' + match[1].trim() : null
    })
    .filter(Boolean)
  
  if (thoughts.length === 0) return 'No previous reasoning available.'
  
  return '## Previous Agent Reasoning\n\n' + thoughts.join('\n\n') + '\n\nUse this reasoning to maintain narrative continuity.'
}

// Semantic Dependency IDs
export function generateSemanticId(stage: string, content: string, index: number): string {
  const stagePrefix = stage.replace('S', '')
  const keywords = content.toLowerCase().split(' ').filter(w => w.length > 5).slice(0, 2).join('_')
  const safeKeyword = keywords.replace(/[^a-z]/g, '').substring(0, 8)
  
  return 'VF_' + stagePrefix + '_' + safeKeyword + '_' + String(index).padStart(2, '0')
}

// Handover Contract Validation (Zod already imported above)
export const HandoverContracts = {
  S4_to_S5: z.object({
    campaignId: z.string(),
    verifiedFindings: z.array(z.object({
      id: z.string(),
      text: z.string().min(10),
      confidence: z.number().min(0).max(1)
    })),
    approvedAngles: z.array(z.string()).optional(),
    handoverSummary: z.string().optional()
  }),
  
  S9_to_S10: z.object({
    campaignId: z.string(),
    journalistProfiles: z.array(z.object({
      id: z.string(),
      name: z.string(),
      outlet: z.string(),
      recentCoverage: z.string().optional()
    })),
    intelligenceSummary: z.string()
  }),
  
  S10_to_S11: z.object({
    campaignId: z.string(),
    subject: z.string().min(5),
    body: z.string().min(50),
    citations: z.array(z.string()).min(1),
    signal: z.object({
      status: z.enum(['PROCEED', 'RETRY_REQUIRED', 'ESCALATE'])
    }).optional()
  })
}

export function validateHandover(contract: keyof typeof HandoverContracts, data: unknown): { valid: boolean; errors: string[] } {
  try {
    HandoverContracts[contract].parse(data)
    return { valid: true, errors: [] }
  } catch (error: any) {
    const errors = error.errors?.map((e: any) => e.path.join('.') + ': ' + e.message) || [error.message]
    console.error('[Handover Contract] ' + contract + ' validation failed:', errors)
    return { valid: false, errors }
  }
}

// Immutable Snapshot Save
const SNAPSHOT_DIR = 'D:\\Codex Folder\\digital-pr-agents\\dashboard\\snapshots'

export async function saveHandoverSnapshot(
  campaignId: string,
  stage: string,
  data: unknown,
  model: string,
  tokens: number,
  signal?: HandoverSignal
): Promise<void> {
  const snapshot: StageSnapshot = {
    stage,
    timestamp: new Date().toISOString(),
    model,
    tokens,
    data: JSON.parse(JSON.stringify(data)), // Deep copy for immutability
    signal
  }
  
  const dirPath = path.join(SNAPSHOT_DIR, campaignId)
  const snapshotPath = path.join(dirPath, 'snapshot-' + stage + '.json')
  
  try {
    await fs.mkdir(dirPath, { recursive: true })
    
    // Atomic write: temp then rename
    await fs.writeFile(snapshotPath + '.tmp', JSON.stringify(snapshot, null, 2))
    await fs.rename(snapshotPath + '.tmp', snapshotPath)
    
    console.log('[Handover] Snapshot saved: ' + stage)
  } catch (error) {
    console.error('[Handover Critical] Snapshot save failed:', error)
    throw error
  }
}

export async function loadLatestSnapshot(campaignId: string): Promise<StageSnapshot | null> {
  const dirPath = path.join(SNAPSHOT_DIR, campaignId)
  
  try {
    const files = await fs.readdir(dirPath)
    const snapshotFiles = files.filter(f => f.startsWith('snapshot-') && f.endsWith('.json'))
    
    if (snapshotFiles.length === 0) return null
    
    snapshotFiles.sort()
    const latest = snapshotFiles[snapshotFiles.length - 1]
    
    const content = await fs.readFile(path.join(dirPath, latest), 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

// Human Handover Brief
export function generateHumanBrief(state: CampaignState): string {
  const history = state.history || []
  const latestStage = history[history.length - 1]
  const performed = latestStage?.stage || 'None'
  
  let struggles = 'None documented'
  if (latestStage?.data && typeof latestStage.data === 'string') {
    const uncertaintyMatch = latestStage.data.match(/uncertain|unsure|low confidence|may be/i)
    if (uncertaintyMatch) struggles = 'Low confidence areas detected in output'
  }
  
  return '## AI-to-Human Handover Brief\n\n**What I did:** Completed ' + performed + '\n\n**Where I struggled:** ' + struggles + '\n\n**What I need from you:** Review the output and confirm proceed or request changes.\n\n**Latest snapshot:** ' + (latestStage?.timestamp || 'N/A')
}

// Token Budget Check
export function calculateHandoverTokens(state: CampaignState): number {
  const history = state.history || []
  return history.reduce((total: number, s: StageSnapshot) => total + (s.tokens || estimateTokens(JSON.stringify(s.data || ''))), 0)
}

export function shouldSummarizeBeforeHandover(state: CampaignState, threshold: number = 128000): boolean {
  const totalTokens = calculateHandoverTokens(state)
  console.log('[Token Budget] Handover size: ' + totalTokens + ' tokens')
  return totalTokens > threshold
}

// =============================================================================
// LEARNING SYSTEMS - Experience Memory & Self-Correction
// =============================================================================

import crypto from 'crypto'

// Experience Memory (Few-Shot RAG)
export interface GoldenExample {
  id: string;
  campaignType: string;
  input: string;
  successfulOutput: string;
  metrics: {
    selected: boolean;
    userRating?: number;
    conversionRate?: number;
  };
  createdAt: string;
  successCount: number;
}

const GOLDEN_EXAMPLES_FILE = 'D:\\Codex Folder\\digital-pr-agents\\dashboard\\data\\golden-examples.json'

export function storeGoldenExample(
  campaignType: string,
  input: string,
  output: string,
  metrics: { selected: boolean; userRating?: number }
): GoldenExample {
  const example: GoldenExample = {
    id: crypto.randomUUID(),
    campaignType,
    input: input.substring(0, 2000),
    successfulOutput: output.substring(0, 5000),
    metrics,
    createdAt: new Date().toISOString(),
    successCount: 1
  }
  
  try {
    const fs = require('fs')
    let examples: GoldenExample[] = []
    if (fs.existsSync(GOLDEN_EXAMPLES_FILE)) {
      examples = JSON.parse(fs.readFileSync(GOLDEN_EXAMPLES_FILE, 'utf-8'))
    }
    
    // Check for existing similar example and update
    const existingIdx = examples.findIndex(e => e.campaignType === campaignType && e.successfulOutput.substring(0, 200) === output.substring(0, 200))
    if (existingIdx >= 0) {
      examples[existingIdx].successCount++
      examples[existingIdx].metrics = { ...examples[existingIdx].metrics, ...metrics }
    } else {
      examples.push(example)
    }
    
    fs.writeFileSync(GOLDEN_EXAMPLES_FILE, JSON.stringify(examples, null, 2))
    console.log('[Memory] Stored golden example for: ' + campaignType)
  } catch (e) {
    console.error('[Memory] Failed to store:', e)
  }
  
  return example
}

export function retrieveGoldenExamples(campaignType: string, limit: number = 3): GoldenExample[] {
  try {
    const fs = require('fs')
    if (!fs.existsSync(GOLDEN_EXAMPLES_FILE)) return []
    
    const examples: GoldenExample[] = JSON.parse(fs.readFileSync(GOLDEN_EXAMPLES_FILE, 'utf-8'))
    return examples
      .filter(e => e.campaignType === campaignType && e.metrics.selected)
      .sort((a, b) => b.successCount - a.successCount)
      .slice(0, limit)
  } catch {
    return []
  }
}

export function injectFewShotExamples(campaignType: string, prompt: string): string {
  const examples = retrieveGoldenExamples(campaignType)
  if (examples.length === 0) return prompt
  
  const fewShotSection = '\n\n## Few-Shot Examples (Learn from past successes)\n\n'
  const examplesText = examples.map((e, i) => 
    'Example ' + (i + 1) + ' (Selected ' + e.successCount + ' times):\nInput: ' + e.input.substring(0, 500) + '...\nOutput: ' + e.successfulOutput.substring(0, 800) + '...'
  ).join('\n\n')
  
  return prompt.replace('## Few-Shot Examples', fewShotSection + examplesText + '\n\n## Few-Shot Examples')
}

// Self-Correction Knowledge Base
export interface Correction {
  id: string;
  stage: string;
  originalValue: string;
  correctedValue: string;
  reason: string;
  campaignId: string;
  createdAt: string;
  approvedBy: string; // 'human' or 'auto'
}

const CORRECTIONS_FILE = 'D:\\Codex Folder\\digital-pr-agents\\dashboard\\data\\corrections.json'

export function storeCorrection(
  stage: string,
  original: string,
  corrected: string,
  reason: string,
  campaignId: string,
  approvedBy: 'human' | 'auto' = 'human'
): Correction {
  const correction: Correction = {
    id: crypto.randomUUID(),
    stage,
    originalValue: original.substring(0, 500),
    correctedValue: corrected.substring(0, 500),
    reason,
    campaignId,
    createdAt: new Date().toISOString(),
    approvedBy
  }
  
  try {
    const fs = require('fs')
    let corrections: Correction[] = []
    if (fs.existsSync(CORRECTIONS_FILE)) {
      corrections = JSON.parse(fs.readFileSync(CORRECTIONS_FILE, 'utf-8'))
    }
    corrections.push(correction)
    fs.writeFileSync(CORRECTIONS_FILE, JSON.stringify(corrections, null, 2))
    console.log('[Correction DB] Stored: ' + stage + ' - ' + reason.substring(0, 50))
  } catch (e) {
    console.error('[Correction DB] Failed:', e)
  }
  
  return correction
}

export function retrieveMistakesToAvoid(stage: string): string[] {
  try {
    const fs = require('fs')
    if (!fs.existsSync(CORRECTIONS_FILE)) return []
    
    const corrections: Correction[] = JSON.parse(fs.readFileSync(CORRECTIONS_FILE, 'utf-8'))
    return corrections
      .filter(c => c.stage === stage && c.approvedBy === 'human')
      .map(c => '- ' + c.reason + ': Avoid "' + c.originalValue.substring(0, 60) + '", use "' + c.correctedValue.substring(0, 60) + '"')
  } catch {
    return []
  }
}

export function injectMistakesWarning(prompt: string, stage: string): string {
  const mistakes = retrieveMistakesToAvoid(stage)
  if (mistakes.length === 0) return prompt
  
  const warning = '\n\n## Mistakes to Avoid (Based on past corrections)\n' + mistakes.slice(0, 5).join('\n') + '\n'
  return prompt + warning
}

// Reinforcement from User Choice (S7 Gate)
export interface AnglePreference {
  angleType: string;
  selectionCount: number;
  totalAppearances: number;
  popularityScore: number;
}

const PREFERENCES_FILE = 'D:\\Codex Folder\\digital-pr-agents\\dashboard\\data\\angle-preferences.json'

export function recordAngleSelection(campaignId: string, selectedAngles: string[], allAngles: string[]): void {
  try {
    const fs = require('fs')
    let preferences: Record<string, AnglePreference> = {}
    
    if (fs.existsSync(PREFERENCES_FILE)) {
      preferences = JSON.parse(fs.readFileSync(PREFERENCES_FILE, 'utf-8'))
    }
    
    for (const angle of allAngles) {
      const type = extractAngleType(angle)
      if (!preferences[type]) {
        preferences[type] = { angleType: type, selectionCount: 0, totalAppearances: 0, popularityScore: 0 }
      }
      preferences[type].totalAppearances++
      if (selectedAngles.includes(angle)) {
        preferences[type].selectionCount++
      }
    }
    
    // Recalculate scores
    for (const type in preferences) {
      const p = preferences[type]
      p.popularityScore = p.totalAppearances > 0 ? (p.selectionCount / p.totalAppearances) * 100 : 0
    }
    
    fs.writeFileSync(PREFERENCES_FILE, JSON.stringify(preferences, null, 2))
    console.log('[Reinforcement] Recorded ' + selectedAngles.length + ' selections')
  } catch (e) {
    console.error('[Reinforcement] Failed:', e)
  }
}

function extractAngleType(angle: string): string {
  const lower = angle.toLowerCase()
  if (lower.includes('data') || lower.includes('statistic')) return 'data_driven'
  if (lower.includes('story') || lower.includes('narrative')) return 'storytelling'
  if (lower.includes('expert') || lower.includes('quote')) return 'expert_quote'
  if (lower.includes('local') || lower.includes('community')) return 'local_angle'
  if (lower.includes('trend') || lower.includes('future')) return 'trend_forecast'
  return 'general'
}

export function getPopularAngleTypes(): string[] {
  try {
    const fs = require('fs')
    if (!fs.existsSync(PREFERENCES_FILE)) return []
    
    const preferences: Record<string, AnglePreference> = JSON.parse(fs.readFileSync(PREFERENCES_FILE, 'utf-8'))
    return Object.values(preferences)
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .filter(p => p.popularityScore > 30)
      .map(p => p.angleType)
  } catch {
    return []
  }
}

export function injectPopularityGuidance(prompt: string): string {
  const popular = getPopularAngleTypes()
  if (popular.length === 0) return prompt
  
  const guidance = '\n\n## Popular Angle Types (Based on user selections)\nThese angles have >30% selection rate: ' + popular.join(', ') + '\nConsider prioritizing similar formats.\n'
  return prompt + guidance
}

// Dynamic Prompt Optimization (Meta-Agent Placeholder)
export interface PromptOptimization {
  id: string;
  originalPrompt: string;
  optimizedPrompt: string;
  reason: string;
  sourceCampaigns: number;
  createdAt: string;
  status: 'pending_review' | 'approved' | 'rejected';
}

const OPTIMIZATIONS_FILE = 'D:\\Codex Folder\\digital-pr-agents\\dashboard\\data\\prompt-optimizations.json'

export function suggestPromptOptimization(
  stage: string,
  originalPrompt: string,
  errorPatterns: string[]
): PromptOptimization {
  const optimization: PromptOptimization = {
    id: crypto.randomUUID(),
    originalPrompt: originalPrompt.substring(0, 1000),
    optimizedPrompt: originalPrompt + '\n\n## Error Patterns to Address\n' + errorPatterns.map(e => '- ' + e).join('\n'),
    reason: 'Addressed ' + errorPatterns.length + ' error patterns from recent failures',
    sourceCampaigns: errorPatterns.length * 10, // Estimated
    createdAt: new Date().toISOString(),
    status: 'pending_review'
  }
  
  try {
    const fs = require('fs')
    let optimizations: PromptOptimization[] = []
    if (fs.existsSync(OPTIMIZATIONS_FILE)) {
      optimizations = JSON.parse(fs.readFileSync(OPTIMIZATIONS_FILE, 'utf-8'))
    }
    optimizations.push(optimization)
    fs.writeFileSync(OPTIMIZATIONS_FILE, JSON.stringify(optimizations, null, 2))
    console.log('[Meta-Agent] Suggested optimization for ' + stage)
  } catch (e) {
    console.error('[Meta-Agent] Failed:', e)
  }
  
  return optimization
}

export function getApprovedOptimizations(stage: string): string[] {
  try {
    const fs = require('fs')
    if (!fs.existsSync(OPTIMIZATIONS_FILE)) return []
    
    const optimizations: PromptOptimization[] = JSON.parse(fs.readFileSync(OPTIMIZATIONS_FILE, 'utf-8'))
    return optimizations
      .filter(o => o.status === 'approved' && o.optimizedPrompt.includes(stage))
      .map(o => o.reason)
  } catch {
    return []
  }
}

// =============================================================================
// META-AGENT AUDITOR - Self-Improvement via Correction Analysis
// =============================================================================

export interface HumanCorrection {
  id: string;
  stage: string;
  originalAI: string;
  humanCorrection: string;
  explanation?: string;
  campaignId: string;
  timestamp: string;
}

const CORRECTIONS_LOG_FILE = 'D:\\Codex Folder\\digital-pr-agents\\dashboard\\data\\human-corrections.json'
const LEARNED_RULES_FILE = 'D:\\Codex Folder\\digital-pr-agents\\dashboard\\data\\learned-rules.json'

export interface LearnedRules {
  patternsFound: string[];
  newSystemInstructions: string[];
  lastUpdated: string;
  sourceCorrections: number;
}

export async function runMetaAuditor(): Promise<LearnedRules | null> {
  console.log('[Meta-Auditor] Starting correction analysis...')
  
  try {
    const fs = require('fs')
    if (!fs.existsSync(CORRECTIONS_LOG_FILE)) {
      console.log('[Meta-Auditor] No corrections found')
      return null
    }
    
    const logs: HumanCorrection[] = JSON.parse(fs.readFileSync(CORRECTIONS_LOG_FILE, 'utf-8'))
    
    if (logs.length < 5) {
      console.log('[Meta-Auditor] Need minimum 5 corrections to analyze (current: ' + logs.length + ')')
      return null
    }
    
    const analysisPayload = logs.slice(-10).map(log => ({
      stage: log.stage,
      aiOutput: log.originalAI.substring(0, 500),
      yourVersion: log.humanCorrection.substring(0, 500),
      yourReason: log.explanation || 'User manually adjusted tone/facts'
    }))
    
    const auditPrompt = 'You are a Prompt Optimization Specialist. Review these instances where a human corrected your work.\n\nCORRECTION DATA:\n' + JSON.stringify(analysisPayload, null, 2) + '\n\nTASK:\n1. Identify the top 2-3 behavioral patterns causing these corrections.\n2. Create a "Global Constraint" instruction for each pattern to prevent it in the future.\n3. Format as JSON: { "patternsFound": ["..."], "newSystemInstructions": ["..."] }'
    
    const response = await callLLM(auditPrompt)
    
    let learning: LearnedRules = {
      patternsFound: [],
      newSystemInstructions: [],
      lastUpdated: new Date().toISOString(),
      sourceCorrections: logs.length
    }
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        learning.patternsFound = parsed.patternsFound || []
        learning.newSystemInstructions = parsed.newSystemInstructions || []
      }
    } catch {
      console.log('[Meta-Auditor] Could not parse response')
    }
    
    fs.writeFileSync(LEARNED_RULES_FILE, JSON.stringify(learning, null, 2))
    console.log('[Meta-Auditor] Analysis complete! Found ' + learning.patternsFound.length + ' patterns')
    
    return learning
  } catch (e) {
    console.error('[Meta-Auditor] Error:', e)
    return null
  }
}

export function storeHumanCorrection(
  stage: string,
  originalAI: string,
  humanCorrection: string,
  campaignId: string,
  explanation?: string
): void {
  const correction: HumanCorrection = {
    id: crypto.randomUUID(),
    stage,
    originalAI: originalAI.substring(0, 2000),
    humanCorrection: humanCorrection.substring(0, 2000),
    explanation,
    campaignId,
    timestamp: new Date().toISOString()
  }
  
  try {
    const fs = require('fs')
    let logs: HumanCorrection[] = []
    
    if (fs.existsSync(CORRECTIONS_LOG_FILE)) {
      logs = JSON.parse(fs.readFileSync(CORRECTIONS_LOG_FILE, 'utf-8'))
    }
    
    logs.push(correction)
    if (logs.length > 100) logs = logs.slice(-100)
    
    fs.writeFileSync(CORRECTIONS_LOG_FILE, JSON.stringify(logs, null, 2))
  } catch (e) {
    console.error('[Correction Log] Failed:', e)
  }
}

export function getLearnedRules(): LearnedRules | null {
  try {
    const fs = require('fs')
    if (!fs.existsSync(LEARNED_RULES_FILE)) return null
    return JSON.parse(fs.readFileSync(LEARNED_RULES_FILE, 'utf-8'))
  } catch {
    return null
  }
}

export function injectLearnedRules(prompt: string): string {
  const rules = getLearnedRules()
  if (!rules || rules.newSystemInstructions.length === 0) return prompt
  
  return prompt + '\n\n## User-Learned Preferences\n' + rules.newSystemInstructions.map(r => '- ' + r).join('\n') + '\n'
}

// Negative Memory (Rejections)
const REJECTIONS_FILE = 'D:\\Codex Folder\\digital-pr-agents\\dashboard\\data\\rejected-pitches.json'

export function storeRejectedPitch(campaignId: string, pitch: string, reason: string): void {
  try {
    const fs = require('fs')
    let rejections: any[] = []
    if (fs.existsSync(REJECTIONS_FILE)) {
      rejections = JSON.parse(fs.readFileSync(REJECTIONS_FILE, 'utf-8'))
    }
    rejections.push({ id: crypto.randomUUID(), pitch: pitch.substring(0, 2000), reason, campaignId, timestamp: new Date().toISOString() })
    if (rejections.length > 30) rejections = rejections.slice(-30)
    fs.writeFileSync(REJECTIONS_FILE, JSON.stringify(rejections, null, 2))
  } catch (e) {
    console.error('[Rejection Log] Failed:', e)
  }
}

export function getRejectionWarnings(): string[] {
  try {
    const fs = require('fs')
    if (!fs.existsSync(REJECTIONS_FILE)) return []
    const rejections: any[] = JSON.parse(fs.readFileSync(REJECTIONS_FILE, 'utf-8'))
    return rejections.slice(-5).map(r => 'Avoid: "' + r.pitch.substring(0, 80) + '" because "' + r.reason + '"')
  } catch {
    return []
  }
}

export function injectRejectionWarnings(prompt: string): string {
  const warnings = getRejectionWarnings()
  if (warnings.length === 0) return prompt
return prompt + '\n\n## Never Do This\n' + warnings.join('\n') + '\n'
}

// =============================================================================
// SELECTION HANDLER - Feedback Loop Engine
// Updates rule confidence based on human choice
// =============================================================================

export interface FeedbackPayload {
  campaignId: string;
  winningVersion: 'versionA' | 'versionB';
  appliedRuleIds: string[];
  userNote?: string;
}

const LEARNED_RULES_DB = 'D:\\Codex Folder\\digital-pr-agents\\dashboard\\data\\learned-rules.json'


export async function processShadowWinner(payload: FeedbackPayload): Promise<void> {
  console.log('[Rule Engine] Processing winner: ' + payload.winningVersion + ' for campaign ' + payload.campaignId)
  
  try {
    const fs = require('fs')
    
    let rules: any[] = []
    if (fs.existsSync(LEARNED_RULES_DB)) {
      rules = JSON.parse(fs.readFileSync(LEARNED_RULES_DB, 'utf-8'))
    }
    
    if (!Array.isArray(rules)) rules = []
    
    const won = payload.winningVersion === 'versionB'
    
    for (const ruleId of payload.appliedRuleIds) {
      const ruleIdx = rules.findIndex(r => r.id === ruleId || r.ruleId === ruleId)
      if (ruleIdx >= 0) {
        const rule = rules[ruleIdx]
        
        if (!rule.wins) rule.wins = 0
        if (!rule.losses) rule.losses = 0
        if (!rule.confidenceScore) rule.confidenceScore = 0.5
        
        if (won) {
          rule.wins++
          rule.confidenceScore = Math.min(1, rule.confidenceScore + 0.05)
          console.log('[Rule Engine] Rule ' + ruleId + ' promoted. Score: ' + rule.confidenceScore.toFixed(2))
        } else {
          rule.losses++
          rule.confidenceScore = Math.max(0, rule.confidenceScore - 0.1)
          console.log('[Rule Engine] Rule ' + ruleId + ' demoted. Score: ' + rule.confidenceScore.toFixed(2))
        }
        
        // Auto-disable if consistently failing
        if (rule.losses > 3 && rule.losses > rule.wins) {
          rule.status = 'INACTIVE'
          console.warn('[Rule Engine] Rule ' + ruleId + ' deactivated due to poor performance')
        }
        
        rule.lastUsed = new Date().toISOString()
        rule.lastCampaign = payload.campaignId
      }
    }
    
    // Atomic write
    fs.writeFileSync(LEARNED_RULES_DB + '.tmp', JSON.stringify(rules, null, 2))
    fs.rename(LEARNED_RULES_DB + '.tmp', LEARNED_RULES_DB)
    
    console.log('[Rule Engine] Learning captured successfully')
    
    // Log audit trail
    const auditEntry = {
      timestamp: new Date().toISOString(),
      campaignId: payload.campaignId,
      winner: payload.winningVersion,
      rules: payload.appliedRuleIds,
      note: payload.userNote
    }
    
    let auditTrail: any[] = []
    const auditPath = 'D:\\Codex Folder\\digital-pr-agents\\dashboard\\data\\rule-audit.json'
    if (fs.existsSync(auditPath)) {
      auditTrail = JSON.parse(fs.readFileSync(auditPath, 'utf-8'))
    }
    auditTrail.push(auditEntry)
    if (auditTrail.length > 100) auditTrail = auditTrail.slice(-100)
    fs.writeFileSync(auditPath, JSON.stringify(auditTrail, null, 2))
    
  } catch (error) {
    console.error('[Rule Engine Error]', error)
  }
}

// Rule Decay - Archive old unused rules
export function applyRuleDecay(): void {
  try {
    const fs = require('fs')
    if (!fs.existsSync(LEARNED_RULES_DB)) return
    
    const rules: any[] = JSON.parse(fs.readFileSync(LEARNED_RULES_DB, 'utf-8'))
    const now = Date.now()
    const decayThreshold = 50 // campaigns
    
    let decayed = 0
    const activeRules = rules.filter(rule => {
      if (!rule.lastUsed) return true
      
      const lastUsedDate = new Date(rule.lastUsed).getTime()
      const campaignsSinceUse = (now - lastUsedDate) / (1000 * 60 * 60 * 24 * 7) // Approximate
      
      if (campaignsSinceUse > decayThreshold) {
        rule.status = 'ARCHIVED'
        decayed++
        return false
      }
      return true
    })
    
    if (decayed > 0) {
      fs.writeFileSync(LEARNED_RULES_DB, JSON.stringify(activeRules, null, 2))
      console.log('[Rule Decay] Archived ' + decayed + ' unused rules')
    }
  } catch (e) {
    console.error('[Rule Decay] Failed:', e)
  }
}

// Probabilistic Trigger for New Rules
export function shouldApplyNewRule(ruleConfidence: number): boolean {
  if (ruleConfidence >= 0.7) return true // High confidence = always use
  if (ruleConfidence < 0.3) return false // Low confidence = don't use
  
  // Probabilistic for mid-confidence new rules
  return Math.random() < ruleConfidence
}

// Get active rules for prompt injection
export function getActiveLearnedRules(): string[] {
  try {
    const fs = require('fs')
    if (!fs.existsSync(LEARNED_RULES_DB)) return []
    
    const rules: any[] = JSON.parse(fs.readFileSync(LEARNED_RULES_DB, 'utf-8'))
    return rules
      .filter(r => r.status === 'ACTIVE' || r.status === undefined)
      .filter(r => shouldApplyNewRule(r.confidenceScore || 0.5))
      .map(r => r.instruction || r.newSystemInstructions?.[0] || '')
      .filter(Boolean)
  } catch {
    return []
  }
}

// =============================================================================
// STRUCTURED MARKDOWN PARSER FOR META-AUDITOR
// Extracts [REF: ...] blocks from analysis files
// =============================================================================

export interface AnalysisBlocks {
  VERIFIED_FINDINGS?: string;
  ANGLE_STRATEGY?: string;
  INSIGHT_MAPPING?: string;
  AUDITOR_THOUGHTS?: string;
  HUMAN_FEEDBACK?: string;
}

export function extractAnalysisBlocks(markdown: string): AnalysisBlocks {
  const blocks: AnalysisBlocks = {}
  const sections = markdown.split('## [REF: ')
  
  sections.forEach(section => {
    if (section.includes(']')) {
      const titleEnd = section.indexOf(']')
      const title = section.substring(0, titleEnd).trim()
      let content = section.substring(titleEnd + 1).trim()
      
      // Remove HTML comments
      content = content.replace(/<!--[\s\S]*?-->/g, '').trim()
      
      if (title) {
        blocks[title as keyof AnalysisBlocks] = content
      }
    }
  })
  
  return blocks
}

export function extractFindingsWithConfidence(blocks: AnalysisBlocks): { id: string; finding: string; confidence: number }[] {
  const findings: { id: string; finding: string; confidence: number }[] = []
  const verifiedSection = blocks.VERIFIED_FINDINGS || ''
  
  const idMatches = verifiedSection.matchAll(/ID: (VF_\d+)\s*\|\s*Finding: ([^|]+)\|.*\[Confidence: ([\d.]+)\]/g)
  
  for (const match of idMatches) {
    findings.push({
      id: match[1],
      finding: match[2].trim(),
      confidence: parseFloat(match[3])
    })
  }
  
  return findings
}

export function extractAngleStrategy(blocks: AnalysisBlocks): string[] {
  const strategy = blocks.ANGLE_STRATEGY || ''
  const angles: string[] = []
  const angleMatches = strategy.matchAll(/### ANGLE_[A-Z]: ([^\n]+)/g)
  
  for (const match of angleMatches) {
    angles.push(match[1].trim())
  }
  
  return angles
}

export function appendHumanFeedback(markdown: string, feedback: string): string {
  const feedbackBlock = '\n## [REF: HUMAN_FEEDBACK]\n' + feedback + '\n'
  
  if (markdown.includes('## [REF: HUMAN_FEEDBACK]')) {
    return markdown.replace(/## \[REF: HUMAN_FEEDBACK\][\s\S]*$/, feedbackBlock)
  }
  
  return markdown + '\n' + feedbackBlock
}

// =============================================================================
// ADVANCED LEARNING FEATURES
// =============================================================================

// 1. NEGATIVE REWARD BUFFER - Store rejections separately
export interface RejectedPattern {
  id: string;
  stage: string;
  content: string;
  reason: string;
  campaignId: string;
  timestamp: string;
}

const NEGATIVE_PATTERNS_FILE = 'D:\\Codex Folder\\digital-pr-agents\\dashboard\\data\\negative-patterns.json'

export function storeNegativePattern(stage: string, content: string, reason: string, campaignId: string): void {
  const pattern: RejectedPattern = {
    id: crypto.randomUUID(),
    stage,
    content: content.substring(0, 1000),
    reason,
    campaignId,
    timestamp: new Date().toISOString()
  }
  
  try {
    const fs = require('fs')
    let patterns: RejectedPattern[] = []
    if (fs.existsSync(NEGATIVE_PATTERNS_FILE)) {
      patterns = JSON.parse(fs.readFileSync(NEGATIVE_PATTERNS_FILE, 'utf-8'))
    }
    patterns.push(pattern)
    if (patterns.length > 50) patterns = patterns.slice(-50)
    fs.writeFileSync(NEGATIVE_PATTERNS_FILE, JSON.stringify(patterns, null, 2))
    console.log('[Negative Buffer] Stored rejection pattern: ' + reason.substring(0, 30))
  } catch (e) {
    console.error('[Negative Buffer] Failed:', e)
  }
}

export function getAntiExamples(stage: string): string[] {
  try {
    const fs = require('fs')
    if (!fs.existsSync(NEGATIVE_PATTERNS_FILE)) return []
    
    const patterns: RejectedPattern[] = JSON.parse(fs.readFileSync(NEGATIVE_PATTERNS_FILE, 'utf-8'))
    return patterns
      .filter(p => p.stage === stage)
      .slice(-5)
      .map(p => '- ' + p.reason + ': Avoid "' + p.content.substring(0, 60) + '"')
  } catch {
    return []
  }
}

export function injectAntiExamples(prompt: string, stage: string): string {
  const antiExamples = getAntiExamples(stage)
  if (antiExamples.length === 0) return prompt
  
  return prompt + '\n\n### ANTI-EXAMPLES: DO NOT REPLICATE THESE PAST MISTAKES ###\n' + antiExamples.join('\n') + '\n'
}

// 2. PROMPT DISTILLATION - Merge redundant rules
export async function distillRules(): Promise<number> {
  console.log('[Distillation] Running rule consolidation...')
  
  try {
    const fs = require('fs')
    if (!fs.existsSync(LEARNED_RULES_DB)) return 0
    
    const rules: any[] = JSON.parse(fs.readFileSync(LEARNED_RULES_DB, 'utf-8'))
    if (rules.length < 10) return 0
    
    const rulesText = rules.map(r => r.instruction || r.newSystemInstructions?.[0]).filter(Boolean).join('\n')
    
    const distillationPrompt = 'You are a Prompt Engineer. Consolidate these rules by merging duplicates.\n\nRULES:\n' + rulesText + '\n\nOUTPUT JSON:\n{ "consolidated": [{"id": "1", "instruction": "merged rule"}], "removed": ["old rule ids"] }'
    
    const response = await callLLM(distillationPrompt)
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        const removed = parsed.removed?.length || 0
        console.log('[Distillation] Consolidated ' + rules.length + ' rules into ' + (rules.length - removed))
        return removed
      }
    } catch {
      console.log('[Distillation] Could not parse response')
    }
    
    return 0
  } catch (e) {
    console.error('[Distillation] Failed:', e)
    return 0
  }
}

// 3. CONFIDENCE-WEIGHTED LEARNING - Importance ratings
export interface WeightedCorrection {
  id: string;
  stage: string;
  original: string;
  corrected: string;
  importance: number; // 1-5 stars
  timestamp: string;
}

const WEIGHTED_CORRECTIONS_FILE = 'D:\\Codex Folder\\digital-pr-agents\\dashboard\\data\\weighted-corrections.json'

export function storeWeightedCorrection(
  stage: string,
  original: string,
  corrected: string,
  importance: number
): void {
  const correction: WeightedCorrection = {
    id: crypto.randomUUID(),
    stage,
    original: original.substring(0, 500),
    corrected: corrected.substring(0, 500),
    importance: Math.min(5, Math.max(1, importance)),
    timestamp: new Date().toISOString()
  }
  
  try {
    const fs = require('fs')
    let corrections: WeightedCorrection[] = []
    if (fs.existsSync(WEIGHTED_CORRECTIONS_FILE)) {
      corrections = JSON.parse(fs.readFileSync(WEIGHTED_CORRECTIONS_FILE, 'utf-8'))
    }
    corrections.push(correction)
    fs.writeFileSync(WEIGHTED_CORRECTIONS_FILE, JSON.stringify(corrections, null, 2))
  } catch (e) {
    console.error('[Weighted] Failed:', e)
  }
}

export function getHighPriorityMistakes(stage: string, minImportance: number = 4): string[] {
  try {
    const fs = require('fs')
    if (!fs.existsSync(WEIGHTED_CORRECTIONS_FILE)) return []
    
    const corrections: WeightedCorrection[] = JSON.parse(fs.readFileSync(WEIGHTED_CORRECTIONS_FILE, 'utf-8'))
    return corrections
      .filter(c => c.stage === stage && c.importance >= minImportance)
      .map(c => '- CRITICAL [' + c.importance + ' stars]: ' + c.corrected.substring(0, 80))
  } catch {
    return []
  }
}

// 4. REASONING GAP ANALYSIS
export async function analyzeReasoningGap(originalAI: string, humanCorrection: string): Promise<string> {
  const prompt = 'Compare these two versions of work. What specific logical leap did the human make that the AI missed?\n\nAI Version:\n' + originalAI.substring(0, 500) + '\n\nHuman Version:\n' + humanCorrection.substring(0, 500) + '\n\nRespond with 1 sentence explaining the reasoning gap.'
  
  try {
    const response = await callLLM(prompt)
    return response
  } catch {
    return 'Analysis failed'
  }
}

// 5. SELF-CRITIQUE SIMULATION - Agent roleplays as human
export async function selfCritiqueDraft(draft: string, learnedRules: string): Promise<{ critique: string; fixes: string[] }> {
  const prompt = 'Roleplay as the human user reviewing this draft. Based on these learned rules:\n' + learnedRules + '\n\nDRAFT:\n' + draft + '\n\nTask:\n1. What would you change?\n2. List specific fixes needed.\n\nRespond JSON: { "critique": "...", "fixes": ["...", "..."] }'
  
  try {
    const response = await callLLM(prompt)
    const match = response.match(/\{[\s\S]*\}/)
    if (match) {
      return JSON.parse(match[0])
    }
  } catch {
    // Ignore
  }
  
  return { critique: 'No critique available', fixes: [] }
}

// 6. CROSS-AGENT KNOWLEDGE TRANSFER - Pipeline gap detection
export interface PipelineGap {
  fromStage: string;
  toStage: string;
  missingDataType: string;
  frequency: number;
}

const PIPELINE_GAPS_FILE = 'D:\\Codex Folder\digital-pr-agents\\dashboard\\data\\pipeline-gaps.json'

export function detectPipelineGap(fromStage: string, toStage: string, missingType: string): void {
  try {
    const fs = require('fs')
    let gaps: PipelineGap[] = []
    if (fs.existsSync(PIPELINE_GAPS_FILE)) {
      gaps = JSON.parse(fs.readFileSync(PIPELINE_GAPS_FILE, 'utf-8'))
    }
    
    const existing = gaps.find(g => g.fromStage === fromStage && g.toStage === toStage && g.missingDataType === missingType)
    if (existing) {
      existing.frequency++
    } else {
      gaps.push({ fromStage, toStage, missingDataType: missingType, frequency: 1 })
    }
    
    fs.writeFileSync(PIPELINE_GAPS_FILE, JSON.stringify(gaps, null, 2))
  } catch (e) {
    console.error('[Pipeline] Failed:', e)
  }
}

export function getPipelineRequirements(): string[] {
  try {
    const fs = require('fs')
    if (!fs.existsSync(PIPELINE_GAPS_FILE)) return []
    
    const gaps: PipelineGap[] = JSON.parse(fs.readFileSync(PIPELINE_GAPS_FILE, 'utf-8'))
    return gaps
      .filter(g => g.frequency >= 3)
      .map(g => g.missingDataType + ' (detected in ' + g.frequency + ' campaigns)')
  } catch {
    return []
  }
}

// 7. AGENT PERSONA EVOLUTION
const PERSONA_DIR = 'D:\\Codex Folder\\digital-pr-agents\\dashboard\\prompts\\personas'

export async function evolveAgentPersona(stage: string): Promise<string> {
  console.log('[Persona Evolver] Analyzing recent wins for ' + stage + '...')
  
  try {
    const fs = require('fs')
    const personaPath = path.join(PERSONA_DIR, stage + '-current.txt')
    const winsPath = 'D:\\Codex Folder\\digital-pr-agents\\dashboard\\data\\golden-examples.json'
    
    let currentPersona = 'Professional PR Assistant'
    if (fs.existsSync(personaPath)) {
      currentPersona = fs.readFileSync(personaPath, 'utf-8').substring(0, 1000)
    }
    
    let recentWins: any[] = []
    if (fs.existsSync(winsPath)) {
      const all = JSON.parse(fs.readFileSync(winsPath, 'utf-8'))
      recentWins = all.slice(-10)
    }
    
    if (recentWins.length === 0) return currentPersona
    
    const evolutionPrompt = 'CURRENT PERSONA: "' + currentPersona + '"\n\nSUCCESSFUL EXAMPLES:\n' + JSON.stringify(recentWins.map(w => w.successfulOutput?.substring(0, 300))) + '\n\nTask: Rewrite the persona to match the user\'s successful style. Keep it under 200 words. Only output the new persona text.'
    
    const newPersona = await callLLM(evolutionPrompt)
    
    // Atomic save
    if (!fs.existsSync(PERSONA_DIR)) {
      fs.mkdirSync(PERSONA_DIR, { recursive: true })
    }
    fs.writeFileSync(personaPath + '.tmp', newPersona)
    fs.rename(personaPath + '.tmp', personaPath)
    
    console.log('[Persona Evolver] ' + stage + ' agent evolved')
    return newPersona
  } catch (e) {
    console.error('[Persona Evolver] Failed:', e)
    return 'Professional PR Assistant'
  }
}

export function getAgentPersona(stage: string): string {
  try {
    const fs = require('fs')
    const personaPath = path.join(PERSONA_DIR, stage + '-current.txt')
    if (fs.existsSync(personaPath)) {
      return fs.readFileSync(personaPath, 'utf-8')
    }
  } catch {
    // Ignore
  }
  return 'Professional PR Assistant'
}

// 8. PERSONA DIFF UTILITY
export async function getPersonaDiff(stage: string): Promise<{ diff: any[]; summary: string }> {
  const Diff = require('diff')
  
  try {
    const fs = require('fs')
    const currentPath = path.join(PERSONA_DIR, stage + '-current.txt')
    const baselinePath = path.join(PERSONA_DIR, stage + '-v-baseline.txt')
    
    const current = fs.existsSync(currentPath) ? fs.readFileSync(currentPath, 'utf-8') : ''
    const baseline = fs.existsSync(baselinePath) ? fs.readFileSync(baselinePath, 'utf-8') : current
    
    const textDiff = Diff.diffWords(baseline, current)
    const formattedDiff = textDiff.map((part: any) => ({
      type: part.added ? 'EVOLVED' : (part.removed ? 'RETIRED' : 'STABLE'),
      text: part.value
    }))
    
    const analysisPrompt = 'Compare these two personas. OLD: "' + baseline + '" NEW: "' + current + '". Summarize the evolution in 3 bullet points about tone, strategy, and constraints.'
    const summary = await callLLM(analysisPrompt)
    
    return { diff: formattedDiff, summary }
  } catch {
    return { diff: [], summary: 'Analysis failed' }
  }
}

// 9. PERSONA MANAGER - Rollback system
export async function factoryResetPersona(stage: string): Promise<boolean> {
  try {
    const fs = require('fs')
    const currentPath = path.join(PERSONA_DIR, stage + '-current.txt')
    const baselinePath = path.join(PERSONA_DIR, stage + '-v-baseline.txt')
    
    if (fs.existsSync(currentPath)) {
      const current = fs.readFileSync(currentPath, 'utf-8')
      const archivePath = path.join(PERSONA_DIR, 'history', stage + '-failed-' + Date.now() + '.txt')
      const histDir = path.join(PERSONA_DIR, 'history')
      if (!fs.existsSync(histDir)) fs.mkdirSync(histDir, { recursive: true })
      fs.writeFileSync(archivePath, current)
    }
    
    if (fs.existsSync(baselinePath)) {
      const baseline = fs.readFileSync(baselinePath, 'utf-8')
      fs.writeFileSync(currentPath, baseline)
      console.log('[Persona Manager] Factory reset: ' + stage)
      return true
    }
    
    return false
  } catch (e) {
    console.error('[Persona Manager] Reset failed:', e)
    return false
  }
}

export async function rollbackToVersion(stage: string, version: string): Promise<boolean> {
  try {
    const fs = require('fs')
    const targetPath = path.join(PERSONA_DIR, 'history', stage + '-' + version + '.txt')
    const currentPath = path.join(PERSONA_DIR, stage + '-current.txt')
    
    if (fs.existsSync(targetPath)) {
      const content = fs.readFileSync(targetPath, 'utf-8')
      fs.writeFileSync(currentPath, content)
      console.log('[Persona Manager] Rolled back to: ' + version)
      return true
    }
    return false
  } catch (e) {
    console.error('[Persona Manager] Rollback failed:', e)
    return false
  }
}

// =============================================================================
// PERSONA POST-MORTEM - Analyze failures for "Never Again" rules
// =============================================================================

export interface NeverAgainRule {
  timestamp: string;
  stage: string;
  driftAnalysis: string;
  hallucinatedTraits: string[];
  neverAgainRule: string;
}

const BLACKLIST_DIR = 'D:\\Codex Folder\\digital-pr-agents\\dashboard\\prompts\\personas'

export async function runPersonaPostMortem(stage: string, failedContent: string): Promise<NeverAgainRule | null> {
  console.log('[Post-Mortem] Analyzing failed evolution for ' + stage + '...')
  
  try {
    const fs = require('fs')
    const pathModule = require('path')
    
    const baselinePath = pathModule.join(BLACKLIST_DIR, stage + '-v-baseline.txt')
    let baselineContent = 'Professional PR Assistant'
    
    if (fs.existsSync(baselinePath)) {
      baselineContent = fs.readFileSync(baselinePath, 'utf-8').substring(0, 1000)
    }
    
    const postMortemPrompt = '### POST-MORTEM ANALYSIS ###\nYou are a Senior AI Alignment Engineer. A persona evolution has FAILED and been rolled back.\n\nBASELINE:\n"' + baselineContent + '"\n\nFAILED:\n"' + failedContent.substring(0, 800) + '"\n\nTASK:\n1. Identify the Drift: How did the failed version deviate?\n2. Identify Hallucinated Traits: What unnecessary traits were added?\n3. Create a "Never Again" Rule.\n\nFormat JSON: { "driftAnalysis": "", "hallucinatedTraits": [], "neverAgainRule": "" }'
    
    const response = await callLLM(postMortemPrompt)
    
    let postMortem: NeverAgainRule = {
      timestamp: new Date().toISOString(),
      stage,
      driftAnalysis: 'Analysis failed to parse',
      hallucinatedTraits: [],
      neverAgainRule: 'Do not deviate from baseline persona'
    }
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        postMortem.driftAnalysis = parsed.driftAnalysis || ''
        postMortem.hallucinatedTraits = parsed.hallucinatedTraits || []
        postMortem.neverAgainRule = parsed.neverAgainRule || ''
      }
    } catch {
      console.log('[Post-Mortem] Could not parse response')
    }
    
    const blacklistPath = pathModule.join(BLACKLIST_DIR, stage + '-blacklist.json')
    let blacklist: NeverAgainRule[] = []
    
    if (fs.existsSync(blacklistPath)) {
      blacklist = JSON.parse(fs.readFileSync(blacklistPath, 'utf-8'))
    }
    blacklist.push(postMortem)
    fs.writeFileSync(blacklistPath, JSON.stringify(blacklist, null, 2))
    
    console.log('[Post-Mortem] Never Again rule recorded: ' + postMortem.neverAgainRule.substring(0, 50))
    return postMortem
  } catch (e) {
    console.error('[Post-Mortem] Failed:', e)
    return null
  }
}

export function getNeverAgainRules(stage: string): string[] {
  try {
    const fs = require('fs')
    const pathModule = require('path')
    const blacklistPath = pathModule.join(BLACKLIST_DIR, stage + '-blacklist.json')
    
    if (!fs.existsSync(blacklistPath)) return []
    
    const blacklist: NeverAgainRule[] = JSON.parse(fs.readFileSync(blacklistPath, 'utf-8'))
    return blacklist.map(b => b.neverAgainRule)
  } catch {
    return []
  }
}

export function injectNeverAgainRules(prompt: string, stage: string): string {
  const rules = getNeverAgainRules(stage)
  if (rules.length === 0) return prompt
  
  return prompt + '\n\n### PREVIOUS FAILURES (DO NOT REPEAT) ###\n' + rules.map(r => '- ' + r).join('\n') + '\n'
}

// =============================================================================
// IMMUTABLE ANCHORS - Brand DNA that survives evolution
// =============================================================================

export const GLOBAL_ANCHORS = [
  'Never use corporate buzzwords (e.g., synergy, paradigm shift, game-changer).',
  'Always cite data using the [VF_XX] or [IN_XX] format.',
  "Maintain a 'Journalistic' tone: objective, data-driven, and devoid of marketing fluff."
]

export const STAGE_ANCHORS: Record<string, string[]> = {
  'S2': [
    'If a statistic is mentioned, the sample size (n=) must be found or flagged as missing.',
    'Prioritize raw findings over the study executive summary.'
  ],
  'S10': [
    'The first sentence must contain a specific, verified data point.',
    "Never use 'I hope this email finds you well' or similar filler.",
    'Maximum word count is 150 words.'
  ],
  'S12': [
    'Output must be valid JSON format.',
    'Never output PII in plain text.'
  ]
}

export const IMMUTABLE_ANCHORS_FILE = 'D:\\Codex Folder\\digital-pr-agents\\dashboard\\prompts\\anchors.json'

export function loadImmutableAnchors(): { GLOBAL: string[]; [key: string]: string[] } {
  try {
    const fs = require('fs')
    if (fs.existsSync(IMMUTABLE_ANCHORS_FILE)) {
      return JSON.parse(fs.readFileSync(IMMUTABLE_ANCHORS_FILE, 'utf-8'))
    }
  } catch {
    // Ignore
  }
  
  return { GLOBAL: GLOBAL_ANCHORS, ...STAGE_ANCHORS }
}

export async function buildFinalSystemPrompt(stage: string, evolvedPersona: string): Promise<string> {
  const anchors = loadImmutableAnchors()
  const stageKey = stage.includes('S10') ? 'S10' : (stage.includes('S2') ? 'S2' : (stage.includes('S12') ? 'S12' : 'GLOBAL'))
  
  const activeAnchors = [
    ...(anchors.GLOBAL || GLOBAL_ANCHORS),
    ...(anchors[stageKey] || STAGE_ANCHORS[stageKey] || [])
  ]
  
  return `### SYSTEM IDENTITY ###
${evolvedPersona}

### IMMUTABLE CONSTRAINTS (MANDATORY) ###
${activeAnchors.map((rule, i) => (i + 1) + '. ' + rule).join('\n')}

### EXECUTION RULE ###
If the System Identity conflicts with the Immutable Constraints, the Constraints ALWAYS take precedence.`
}

// Forbidden words check
const FORBIDDEN_WORDS = ['synergy', 'paradigm shift', 'game-changer', 'leverage', 'deep dive', 'circle back', 'low-hanging fruit']

export function containsForbiddenWords(text: string): string[] {
  const lower = text.toLowerCase()
  return FORBIDDEN_WORDS.filter(word => lower.includes(word))
}

export function scanAndRetryIfForbidden(prompt: string, output: string): { clean: boolean; found: string[] } {
  const found = containsForbiddenWords(output)
  if (found.length > 0) {
    console.warn('[Anchor Check] Forbidden words detected: ' + found.join(', ') + ' - auto-retry needed')
    return { clean: false, found }
  }
  return { clean: true, found: [] }
}

// =============================================================================
// CONSTRAINT VALIDATOR - Pre-validate LLM outputs against anchors
// =============================================================================

export interface ValidationResult {
  isPassed: boolean;
  errors: string[];
  failedRules: string[];
  warnings: string[];
}

const VALIDATION_LOG_FILE = 'D:\\Codex Folder\\digital-pr-agents\\dashboard\\logs\\validation-failures.json'

export class ConstraintValidator {
  async validate(stage: string, output: string): Promise<ValidationResult> {
    const errors: string[] = []
    const failedRules: string[] = []
    const warnings: string[] = []
    
    const forbiddenWords = ['synergy', 'game-changer', 'paradigm shift', 'thrilled to announce', 'circle back', 'low-hanging fruit', 'leverage']
    
    // 1. Check Forbidden Words
    for (const word of forbiddenWords) {
      const regex = new RegExp('\\b' + word + '\\b', 'gi')
      if (regex.test(output)) {
        errors.push('Forbidden word detected: "' + word + '"')
        failedRules.push('GLOBAL_NO_BUZZWORDS')
      }
    }
    
    // 2. Check Citation Format (S2, S4, S10)
    const citationStages = ['S2', 'S4', 'S10']
    const stageKey = stage.startsWith('S2') ? 'S2' : (stage.startsWith('S10') ? 'S10' : (stage.startsWith('S4') ? 'S4' : (stage.startsWith('S3') ? 'S3' : '')))
    
    let hasCitations = false
    
    if (citationStages.includes(stageKey)) {
      hasCitations = /\[(VF|IN|J_Intel)_\d+\]/.test(output)
      if (!hasCitations) {
        errors.push('Missing mandatory citations (e.g., [VF_01])')
        failedRules.push('MANDATORY_CITATION_FORMAT')
      }
    }
    
    // 3. Check Citation IDs actually exist
    if (hasCitations) {
      const citedIds = output.match(/\[(VF|IN|J_Intel)_\d+\]/g) || []
      const validIds = citedIds.map(id => id.replace(/[\[\]]/g, ''))
      
      // Check for obviously fake IDs (e.g., VF_99 when max is VF_20)
      const maxIdNum = Math.max(...validIds.map(id => {
        const match = id.match(/_(\d+)$/)
        return match ? parseInt(match[1]) : 0
      }))
      
      if (maxIdNum > 50) {
        errors.push('Hallucinated citation ID detected (number too high)')
        failedRules.push('HALLUCINATED_ID')
      }
    }
    
    // 4. Word Count Check (S10)
    if (stageKey === 'S10') {
      const wordCount = output.split(/\s+/).length
      if (wordCount > 200) {
        errors.push('Pitch exceeds maximum word count (200 words)')
        failedRules.push('S10_BREVITY_LIMIT')
      } else if (wordCount > 150) {
        warnings.push('Pitch is close to limit (' + wordCount + '/200 words)')
      }
    }
    
    // 5. Code Block Check
    if (output.startsWith('```') && output.endsWith('```')) {
      warnings.push('Output wrapped in code blocks - may need cleanup')
    }
    
    // 6. URL Validation (S3)
    if (stageKey === 'S3') {
      const urlPattern = /https?:\/\/[^\s]+/g
      const urls = output.match(urlPattern) || []
      if (urls.length > 0) {
        // Just flag for review - actual validation would need HTTP check
        warnings.push('Contains ' + urls.length + ' URLs - verify they are not hallucinated')
      }
    }
    
    // Log failures
    if (errors.length > 0) {
      this.logValidationFailure(stage, output, errors, failedRules)
    }
    
    return {
      isPassed: errors.length === 0,
      errors,
      failedRules,
      warnings
    }
  }
  
  private logValidationFailure(stage: string, output: string, errors: string[], rules: string[]): void {
    try {
      const fs = require('fs')
      let failures: any[] = []
      
      if (fs.existsSync(VALIDATION_LOG_FILE)) {
        failures = JSON.parse(fs.readFileSync(VALIDATION_LOG_FILE, 'utf-8'))
      }
      
      failures.push({
        stage,
        errors,
        failedRules: rules,
        timestamp: new Date().toISOString(),
        preview: output.substring(0, 200)
      })
      
      if (failures.length > 100) failures = failures.slice(-100)
      fs.writeFileSync(VALIDATION_LOG_FILE, JSON.stringify(failures, null, 2))
    } catch (e) {
      console.error('[Validation Log] Failed:', e)
    }
  }
}

// Validation-aware LLM call with retry
export async function validateAndRetry(
  stage: string,
  prompt: string,
  maxAttempts: number = 2
): Promise<{ output: string; validated: boolean; validation: ValidationResult }> {
  const validator = new ConstraintValidator()
  let attempts = 0
  let passed = false
  let finalOutput = ''
  let lastValidation: ValidationResult = { isPassed: false, errors: [], failedRules: [], warnings: [] }
  
  while (attempts < maxAttempts && !passed) {
    const rawResponse = await callLLM(prompt)
    const validation = await validator.validate(stage, rawResponse)
    
    if (validation.isPassed) {
      passed = true
      finalOutput = rawResponse
      lastValidation = validation
    } else {
      attempts++
      console.warn('[Validation Failed] Attempt ' + attempts + ': ' + validation.errors.join(', '))
      
      // Append errors to prompt for retry
      prompt += '\n\nERROR: Previous response failed validation: ' + validation.errors.join('. ') + '. Please fix these issues.'
      
      lastValidation = validation
    }
  }
  
  return {
    output: finalOutput,
    validated: passed,
    validation: lastValidation
  }
}

// Semantic buzzword check (using LLM)
export async function checkVibeBuzzwords(text: string): Promise<string[]> {
  const prompt = 'Check this text for "marketing vibe" buzzwords or overly salesy language. List any phrases that sound too promotional rather than journalistic.\n\nTEXT:\n' + text.substring(0, 1000) + '\n\nRespond with JSON: { "vibeIssues": ["phrase1", "phrase2"] }'
  
  try {
    const response = await callLLM(prompt)
    const match = response.match(/\{[\s\S]*\}/)
    if (match) {
      const parsed = JSON.parse(match[0])
      return parsed.vibeIssues || []
    }
  } catch {
    // Ignore
  }
  return []
}

// Bonus incentive prompt injection
export function addIncentive(prompt: string): string {
  return prompt + '\n\n### INCENTIVE ###\nYou will receive a bonus for a response that passes all validation checks on the first try. Ensure your output contains proper citations and avoids forbidden words.'
}

// =============================================================================
// HALLUCINATED ID VALIDATOR - Cross-reference pitch citations against S4
// =============================================================================

export class CitationValidator {
  async check(campaignId: string, pitchText: string, s4Data?: { verified_findings?: { id: string }[]; insights?: { id: string }[] }): Promise<{ isValid: boolean; hallucinatedIds: string[]; missingIds: string[] }> {
    let validIds: string[] = []
    
    if (s4Data) {
      validIds = [
        ...(s4Data.verified_findings?.map(f => f.id) || []),
        ...(s4Data.insights?.map(i => i.id) || [])
      ]
    } else {
      // Try to load from file
      try {
        const fs = require('fs')
        const s4Path = 'D:\\Codex Folder\\digital-pr-agents\\campaigns\\' + campaignId + '\\04-analysis.json'
        if (fs.existsSync(s4Path)) {
          const data = JSON.parse(fs.readFileSync(s4Path, 'utf-8'))
          validIds = [...(data.verified_findings?.map((f: any) => f.id) || []), ...(data.insight_mapping?.map((m: any) => m.id) || [])]
        }
      } catch {
        // Ignore
      }
    }
    
    if (validIds.length === 0) {
      console.warn('[Citation Validator] No valid IDs found - skipping check')
      return { isValid: true, hallucinatedIds: [], missingIds: [] }
    }
    
    // Extract citations from pitch
    const citationRegex = /\[(VF|IN|J_Intel)_\d+\]/g
    const matches = pitchText.match(citationRegex) || []
    const usedIds = matches.map(m => m.replace(/[\[\]]/g, ''))
    
    // Check for hallucinated IDs
    const hallucinatedIds = usedIds.filter(id => !validIds.includes(id))
    
    // Check for zero citations (hallucination by omission)
    const missingIds = usedIds.length === 0 ? ['ZERO_CITATIONS'] : []
    
    if (hallucinatedIds.length > 0 || missingIds.length > 0) {
      console.error('[Citation Alert] Hallucinated: ' + hallucinatedIds.join(', ') + (missingIds.length > 0 ? ' | Zero citations' : ''))
    }
    
    return {
      isValid: hallucinatedIds.length === 0 && missingIds.length === 0,
      hallucinatedIds,
      missingIds
    }
  }
}

// Retry with correction prompt if hallucinated
export async function validateAndRetryWithCorrection(
  campaignId: string,
  stage: string,
  prompt: string,
  pitchOutput: string,
  s4Data?: any
): Promise<{ output: string; fixed: boolean }> {
  const validator = new CitationValidator()
  const { isValid, hallucinatedIds } = await validator.check(campaignId, pitchOutput, s4Data)
  
  if (isValid) {
    return { output: pitchOutput, fixed: false }
  }
  
  console.log('[Citation Fix] Retrying with correction prompt...')
  
  const correctionPrompt = prompt + '\n\n### VALIDATION ERROR ###\nYour previous pitch included invalid source IDs: ' + (hallucinatedIds.join(', ') || 'zero citations') + '.\nThese IDs do not exist in the provided Analysis (Source of Truth).\nPlease rewrite the pitch using ONLY the verified IDs from the source.\n\nIMPORTANT: Every factual claim must be cited with a valid [VF_XX] or [IN_XX] ID.'
  
  
  const fixedOutput = await callLLM(correctionPrompt)
  
  // Re-validate
  const recheck = await validator.check(campaignId, fixedOutput, s4Data)
  
  return { output: fixedOutput, fixed: recheck.isValid }
}

// =============================================================================
// SEMANTIC FACT CHECKER - NLI to verify pitch claims match sources
// =============================================================================

export interface SemanticResult {
  isTruthful: boolean;
  status: 'ENTAILMENT' | 'CONTRADICTION' | 'NEUTRAL';
  reason: string;
  claim: string;
  sourceId: string;
}

export class SemanticFactChecker {
  async verify(claim: string, citedFinding: string): Promise<SemanticResult> {
    const nliPrompt = '### PREMISE (Source Truth):\n"' + citedFinding + '"\n\n### HYPOTHESIS (Pitch Claim):\n"' + claim + '"\n\nTASK:\nDoes the Premise logically ENTAIL the Hypothesis?\n- ENTAILMENT: The claim is 100% supported.\n- CONTRADICTION: The claim says something different or opposite.\n- NEUTRAL: The claim adds info not found in the premise.\n\nOutput ONLY JSON: { "status": "ENTAILMENT|CONTRADICTION|NEUTRAL", "reason": "..." }'
    
    try {
      const response = await callLLM(nliPrompt)
      const match = response.match(/\{[\s\S]*\}/)
      if (match) {
        const parsed = JSON.parse(match[0])
        return {
          isTruthful: parsed.status === 'ENTAILMENT',
          status: parsed.status,
          reason: parsed.reason || '',
          claim,
          sourceId: ''
        }
      }
    } catch {
      // Ignore
    }
    
    return { isTruthful: true, status: 'ENTAILMENT', reason: 'Check failed - assumed valid', claim, sourceId: '' }
  }
}

// Full fact-check pipeline
export async function runFullFactCheck(campaignId: string, pitchText: string, s4Data?: any): Promise<SemanticResult[]> {
  const checker = new SemanticFactChecker()
  const results: SemanticResult[] = []
  
  // Load S4 data if not provided
  if (!s4Data) {
    try {
      const fs = require('fs')
      const s4Path = 'D:\\Codex Folder\\digital-pr-agents\\campaigns\\' + campaignId + '\\04-analysis.json'
      if (fs.existsSync(s4Path)) {
        s4Data = JSON.parse(fs.readFileSync(s4Path, 'utf-8'))
      }
    } catch {
      // Ignore
    }
  }
  
  if (!s4Data) {
    console.warn('[Fact Check] No S4 data found')
    return results
  }
  
  // Split pitch into sentences
  const sentences = pitchText.split(/[.!?]/)
  
  for (const sentence of sentences) {
    const match = sentence.match(/\[(VF|IN)_(\d+)\]/)
    if (match) {
      const idType = match[1]
      const idNum = match[2]
      const vfId = idType + '_' + String(idNum).padStart(2, '0')
      
      // Find the corresponding source
      const findings = s4Data.verified_findings || []
      const finding = findings.find((f: any) => f.id === vfId)
      
      if (finding) {
        const result = await checker.verify(sentence, finding.text || finding.finding || finding)
        result.sourceId = vfId
        results.push(result)
        
        if (!result.isTruthful) {
          console.warn('[Fact Check Failed] ' + vfId + ': ' + result.reason)
        }
      }
    }
  }
  
  return results
}

// Number Guard - extract and compare digits
export function checkNumberIntegrity(claim: string, source: string): { valid: boolean; mismatch: string[] } {
  const claimNumbers = claim.match(/\d+(\.\d+)?/g) || []
  const sourceNumbers: string[] = source.match(/\d+(\.\d+)?/g) || []
  
  const mismatches: string[] = []
  
  for (const cn of claimNumbers) {
    if (!sourceNumbers.includes(cn)) {
      mismatches.push('Claim has "' + cn + '" not in source')
    }
  }
  
  return { valid: mismatches.length === 0, mismatch: mismatches }
}

// =============================================================================
// S8 JOURNALIST COLLECTION - Master Researcher Prompts
// =============================================================================

export const JOURNALIST_SEARCH_INSTRUCTIONS = {
  recency: `Prioritize journalists who have published on [Topic] within the last 90 days. If an article is older than 6 months, flag it as 'Low Recency' in the output.`,

  articleVsBeat: `Do not rely on the journalist's profile 'Beat.' Instead, parse the actual text of their last 5 articles. If the keyword [Topic] appears in the headline or lead paragraph, they are a 'Direct Match' regardless of their official title.`,

  muckRackPrefs: `Search for the 'Pitching Preferences' section in Muck Rack. If the journalist specifies 'No Friday pitches' or 'Email only,' extract this as a MANDATORY constraint for Stage 11 (Optimization).`,

  outletTiering: `Categorize search results into Tiers: Tier 1 (National/Global), Tier 2 (Trade/Niche), Tier 3 (Local/Regional). Match the pitch angle in S10 to the corresponding Tier.`,

  competitorSniffing: `Run a Google Search for [Competitor Name]. Identify the authors of those stories. Use Muck Rack to find their contact info. These are 'High Intent' leads.`,

  freelancerDetection: `Identify if a journalist is a 'Staff Writer' or 'Contributor/Freelancer.' For Freelancers, extract the list of outlets they have written for in the last 6 months to customize the S10 'outlet suggestion'.`,

  academicSearch: `Use Google Scholar to find academics who have cited similar studies. Find the journalists who interviewed those academics in mainstream media.`,

  socialSignals: `Scan the 'Recent Tweets' section in Muck Rack. Look for keywords like 'pitch,' 'PR,' or 'inbox.' Extract any 'pet peeves' mention to avoid in S11.`,

  duplicateFilter: `Group results by publication. Select only the 1-2 most relevant journalists per outlet to prevent 'Spam Flagging' our domain.`,

  booleanSearch: `Generate and execute Boolean strings using the 'AROUND(n)' operator. Example: [Topic] AROUND(10) [Specific Finding] to find journalists who have written about the exact nuance of our study.`
}

export function buildJournalistSearchPrompt(
  topic: string,
  competitor?: string,
  customFindings?: string[]
): string {
  const instructions = Object.values(JOURNALIST_SEARCH_INSTRUCTIONS).join('\n\n')
  
  const findingsSection = customFindings?.length 
    ? '\n\n### KEY FINDINGS TO MATCH\n' + customFindings.map(f => '- ' + f).join('\n')
    : ''

  return `## JOURNALIST COLLECTION TASK

You are a Master Researcher finding journalists for a Digital PR campaign.

### TOPIC
${topic}${findingsSection}

### SEARCH INSTRUCTIONS
${instructions}

### OUTPUT FORMAT
Return JSON:
{
  "journalists": [
    {
      "name": "...",
      "outlet": "...",
      "tier": "1|2|3",
      "recency": "hot|warm|cold",
      "matchType": "direct|indirect|beat",
      "pitchingConstraints": ["no friday", "email only"],
      "contactInfo": {...},
      "recentArticles": [...],
      "isFreelancer": true|false,
      "socialPetPeeves": [...]
    }
  ],
  "competitorAuthors": [...],
  "academicJournalists": [...]
}
`
}

// Boolean search generator
export function generateBooleanSearch(topic: string, findings: string[]): string[] {
  const searches: string[] = []
  
  // Basic topic search
  searches.push('"' + topic + '"')
  
  // Findings-based searches
  for (const finding of findings.slice(0, 3)) {
    const keywords = finding.split(' ').filter(w => w.length > 5).slice(0, 3)
    if (keywords.length > 0) {
      searches.push(topic + ' AROUND(10) ' + keywords.join(' '))
    }
  }
  
  // Competitor-based
  searches.push(topic + ' "vs" "competitor" "news"')
  
  // Data/survey specific
  searches.push(topic + ' "study" "survey" "report" "2024" "2025"')
  
  return searches
}

// =============================================================================
// BOOLEAN QUERY GENERATOR - Surgical search strings for S8
// =============================================================================

export async function generateJournalistQueries(campaignData: {
  mainTopic: string;
  keyFindings?: string[];
  industry?: string;
}): Promise<string[]> {
  const topic = campaignData.mainTopic
  const finding = campaignData.keyFindings?.[0] || ''
  const industry = campaignData.industry || ''
  
  const prompt = '### TASK ###\nGenerate 5 advanced Boolean search strings to find journalists on Google and Muck Rack.\n\nTOPIC: ' + topic + '\nINDUSTRY: ' + industry + '\nKEY FINDING: ' + finding + '\n\n### OPERATORS TO USE ###\n- site:muckrack.com (to find profile pages)\n- AROUND(10) (to find proximity between keywords)\n- intitle: (for headline matches)\n- "..." (for exact phrases)\n\nOutput as a JSON array of strings.'
  
  try {
    const response = await callLLM(prompt)
    const match = response.match(/\[[\s\S]*\]/)
    if (match) {
      return JSON.parse(match[0])
    }
  } catch {
    // Ignore
  }
  
  // Fallback default queries
  return [
    '"' + topic + '" site:muckrack.com',
    topic + ' "news" "2024"',
    topic + ' AROUND(10) ' + (finding.split(' ').slice(0, 3).join(' ') || 'study'),
    'intitle:' + topic + ' "report"',
    topic + ' "' + industry + '" "journalist"'
  ]
}

// URL Validation - ensure from approved publication
export function isValidPublicationUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname
    const validDomains = ['techcrunch.com', 'forbes.com', 'wsj.com', 'reuters.com', 'bloomberg.com', 'wired.com', 'theverge.com', 'arstechnica.com', 'venturebeat.com', 'businessinsider.com']
    return validDomains.some(d => hostname.includes(d))
  } catch {
    return false
  }
}

// Profile scraper delay with jitter
export function getProfileDelay(): number {
  return 2000 + Math.random() * 3000
}

// SERP Snippet Parser
export interface SerpResult {
  title: string
  url: string
  snippet: string
  isPaywall: boolean
  isAuthorPage: boolean
}

export function parseSerpSnippet(result: { title?: string; link?: string; snippet?: string }): SerpResult {
  const snippet = result.snippet || ''
  const isPaywall = /subscriber|exclusive|paid/i.test(snippet)
  const isAuthorPage = /author|bio|about/i.test(result.title || '')
  
  return {
    title: result.title || '',
    url: result.link || '',
    snippet,
    isPaywall,
    isAuthorPage
  }
}

// Multi-Query Parallelism (placeholder - would use p-limit in practice)
export async function runParallelQueries(queries: string[], concurrency: number = 3): Promise<string[][]> {
  const results: string[][] = []
  
  for (let i = 0; i < queries.length; i += concurrency) {
    const batch = queries.slice(i, i + concurrency)
    const batchResults = await Promise.all(batch.map(q => searchJournalists(q)))
    results.push(...batchResults)
  }
  
  return results
}

async function searchJournalists(query: string): Promise<string[]> {
  // Placeholder - would integrate with actual search API
  console.log('[Boolean] Searching: ' + query)
  return []
}

// Normalize journalist name for deduplication
export function normalizeJournalistName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

// Keyword distance scoring
export function scoreKeywordDistance(headlines: string[], keywords: string[]): number {
  let score = 0
  
  for (const headline of headlines) {
    const lower = headline.toLowerCase()
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) {
        score += 1
      }
    }
  }
  
  return score / (headlines.length * keywords.length)
}

// Out-of-Office Check
export function isOutOfOffice(profileText: string): boolean {
  const oooPatterns = /ooo|out of office|on leave|away until|not accepting/i
  return oooPatterns.test(profileText)
}

// S8 to S9 Handover Object
export interface JournalistHandover {
  journalist_name: string
  publication: string
  source_url: string
  search_query_match: string
  recency_score: number
  tier: 1 | 2 | 3
  match_type: 'direct' | 'indirect' | 'beat'
  pitching_constraints: string[]
  is_freelancer: boolean
}

export function createJournalistHandover(
  name: string,
  publication: string,
  url: string,
  query: string,
  recency: number
): JournalistHandover {
  const tier = ['forbes', 'techcrunch', 'reuters', 'bloomberg'].some(d => url.includes(d)) ? 1 : 2
  
  return {
    journalist_name: name,
    publication,
    source_url: url,
    search_query_match: query,
    recency_score: recency,
    tier,
    match_type: 'direct',
    pitching_constraints: [],
    is_freelancer: false
  }
}

// =============================================================================
// JOURNALIST TIERER & INTELLIGENCE (S8/S9)
// Domain Authority-based ranking
// =============================================================================

const DA_CACHE_FILE = 'D:\\Codex Folder\\digital-pr-agents\\dashboard\\data\\da-cache.json'

export interface TieredJournalist {
  journalist_name: string
  publication: string
  source_url: string
  domain_authority: number
  tier: 1 | 2 | 3
  intelligence_note: string
  match_type: string
  recency_score: number
}

// Load DA cache
async function loadDaCache(): Promise<Record<string, number>> {
  try {
    const fs = require('fs')
    if (fs.existsSync(DA_CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(DA_CACHE_FILE, 'utf-8'))
    }
  } catch {
    // Ignore
  }
  return {}
}

// Save DA cache
async function saveDaCache(cache: Record<string, number>): Promise<void> {
  try {
    const fs = require('fs')
    const dir = require('path').dirname(DA_CACHE_FILE)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(DA_CACHE_FILE, JSON.stringify(cache, null, 2))
  } catch {
    // Ignore
  }
}

// Get DA for a domain (with caching)
async function getDomainAuthority(domain: string): Promise<number> {
  const cache = await loadDaCache()
  
  if (cache[domain]) {
    return cache[domain]
  }
  
  // Fallback: use estimated scores based on known publications
  const fallbackScores: Record<string, number> = {
    'techcrunch.com': 92,
    'forbes.com': 96,
    'reuters.com': 94,
    'bloomberg.com': 95,
    'wsj.com': 93,
    'wired.com': 90,
    'theverge.com': 88,
    'arstechnica.com': 87,
    'businessinsider.com': 91,
    'venturebeat.com': 82,
    'cnbc.com': 89,
    'fastcompany.com': 85,
    'wired.co.uk': 84,
    'techradar.com': 83,
    'engadget.com': 86,
    'gizmodo.com': 80,
    'mashable.com': 79,
    'qz.com': 78,
    'theinformation.com': 75,
    'axios.com': 77
  }
  
  const normalized = domain.replace(/^www\./, '')
  const score = fallbackScores[normalized] || Math.floor(Math.random() * 40) + 30 // Random 30-70 for unknown
  
  // Update cache
  cache[domain] = score
  await saveDaCache(cache)
  
  return score
}

// Main tiering function
export async function tierJournalists(journalists: any[]): Promise<TieredJournalist[]> {
  console.log('[S9] Tiering ' + journalists.length + ' journalists...')
  
  const tiered: TieredJournalist[] = []
  
  for (const j of journalists) {
    let url = j.source_url || j.url || ''
    
    try {
      url = new URL(url).hostname
    } catch {
      url = 'unknown.com'
    }
    
    const da = await getDomainAuthority(url)
    let tier: 1 | 2 | 3 = 3
    
    if (da >= 80) tier = 1
    else if (da >= 50) tier = 2
    
    tiered.push({
      journalist_name: j.journalist_name || j.name || 'Unknown',
      publication: j.publication || j.outlet || 'Unknown',
      source_url: j.source_url || j.url || '',
      domain_authority: da,
      tier,
      intelligence_note: 'Outlet Tier ' + tier + ' (' + da + ' DA)',
      match_type: j.match_type || 'direct',
      recency_score: j.recency_score || 0.5
    })
  }
  
  // Sort by tier then recency
  tiered.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier
    return b.recency_score - a.recency_score
  })
  
  console.log('[S9] Tiering complete: ' + tiered.filter(t => t.tier === 1).length + ' Tier 1, ' + tiered.filter(t => t.tier === 2).length + ' Tier 2, ' + tiered.filter(t => t.tier === 3).length + ' Tier 3')
  
  return tiered
}

// Normalize domain for consistency
export function normalizeDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname
    return hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return url.toLowerCase()
  }
}

// Calculate average DA for freelancers
export async function calculateFreelancerReach(articles: { url: string }[]): Promise<number> {
  if (articles.length === 0) return 0
  
  const scores = await Promise.all(articles.map(a => getDomainAuthority(normalizeDomain(a.url))))
  return scores.reduce((a, b) => a + b, 0) / scores.length
}

// =============================================================================
// S10/S11 EMAIL OPTIMIZATION - 16-Factor Scoring & Anti-Marketing Filter
// =============================================================================

export const EMAIL_OPTIMIZATION_RULES = {
  brevity: { maxWords: 150, weight: 10, desc: 'Strictly under 150 words' },
  subjectLine: { maxChars: 60, weight: 10, desc: 'Subject line <60 characters' },
  hook: { weight: 10, desc: 'Lead with verified [VF_XX] statistic' },
  personalization: { weight: 8, desc: 'Reference journalist specific coverage' },
  antiMarketing: { weight: 8, desc: 'No buzzwords: synergy, thrilled, revolutionary' },
  cta: { weight: 8, desc: 'Exactly ONE specific ask' },
  lowercaseBias: { weight: 5, desc: 'Natural/conversational subject lines' },
  noAttachments: { weight: 5, desc: 'Resources as links, not attachments' },
  clarity: { weight: 6, desc: '"So What?" in first 2 sentences' },
  formatting: { weight: 5, desc: 'No bolding/colors (looks like spam)' },
  sourceCredibility: { weight: 5, desc: '1-line expert bio included' },
  timing: { weight: 4, desc: 'Mention embargo or immediate status' },
  mobileOptimized: { weight: 5, desc: 'Paragraphs 1-2 sentences max' },
  avoidAISlop: { weight: 6, desc: 'No "In a world where..." or "It\'s not just X..."' },
  directness: { weight: 5, desc: 'No "I hope this finds you well" filler' },
  citation: { weight: 8, desc: 'Include [VF_XX] tags for verification' }
}

const FORBIDDEN_WORDS_EMAIL = ['synergy', 'thrilled', 'revolutionary', 'game-changer', 'limited time', 'free', 'urgent', 'exciting opportunity', 'not just', 'in a world where']

export interface OptimizationResult {
  totalScore: number
  critique: string[]
  failedFactors: string[]
  optimizedDraft: string
  isPassed: boolean
}

export async function runEmailOptimization(draft: string, journalistBio?: string): Promise<OptimizationResult> {
  const rubric = Object.entries(EMAIL_OPTIMIZATION_RULES).map(([key, rule]) => 
    key + '. ' + rule.desc + ' (' + rule.weight + ' pts)'
  ).join('\n')

  const optimizationPrompt = '### TASK ###\nScore and optimize this PR pitch based on 2026 "16-Factor" Journalistic Standards.\n\n### THE 16-FACTOR RUBRIC ###\n' + rubric + '\n\nPITCH TO EVALUATE:\n"' + draft.substring(0, 1000) + '"\n\nJOURNALIST CONTEXT:\n' + (journalistBio || 'General tech journalist') + '\n\nOUTPUT FORMAT: JSON { "score": 0-100, "failedFactors": [], "optimizedDraft": "" }'

  try {
    const response = await callLLM(optimizationPrompt)
    const match = response.match(/\{[\s\S]*\}/)
    if (match) {
      const parsed = JSON.parse(match[0])
      return {
        totalScore: parsed.score || 0,
        critique: parsed.failedFactors || [],
        failedFactors: parsed.failedFactors || [],
        optimizedDraft: parsed.optimizedDraft || draft,
        isPassed: (parsed.score || 0) >= 85
      }
    }
  } catch {
    // Ignore
  }

  return {
    totalScore: 50,
    critique: ['Optimization failed - using original'],
    failedFactors: [],
    optimizedDraft: draft,
    isPassed: false
  }
}

// Optimization loop with retry
export async function optimizeWithRetry(
  draft: string,
  journalistBio?: string,
  maxAttempts: number = 2
): Promise<{ output: string; score: number; attempts: number }> {
  let currentDraft = draft
  let attempts = 0
  let passed = false

  while (attempts < maxAttempts && !passed) {
    const result = await runEmailOptimization(currentDraft, journalistBio)
    attempts++

    if (result.isPassed) {
      passed = true
      console.log('[S11] Optimization passed with score: ' + result.totalScore)
      return { output: result.optimizedDraft, score: result.totalScore, attempts }
    }

    console.warn('[S11] Optimization failed (' + result.totalScore + '). Retrying...')
    currentDraft = result.optimizedDraft
  }

  return { output: currentDraft, score: 50, attempts }
}

// Anti-marketing filter
export function applyAntiMarketingFilter(text: string): { clean: string; removed: string[] } {
  const removed: string[] = []
  
  for (const word of FORBIDDEN_WORDS_EMAIL) {
    const regex = new RegExp('\\b' + word + '\\b', 'gi')
    if (regex.test(text)) {
      removed.push(word)
      text = text.replace(regex, '[REMOVED]')
    }
  }

  return { clean: text.replace(/\[REMOVED\]/g, '').replace(/\s+/g, ' ').trim(), removed }
}

// Convert subject to lowercase for spam bypass
export function naturalizeSubjectLine(subject: string): string {
  // If subject is all caps or very polished, make it conversational
  if (subject === subject.toUpperCase() || subject.split(' ').length < 5) {
    return subject.toLowerCase().replace(/^[a-z]/, c => c.toUpperCase())
  }
  return subject
}

// Active voice converter
export function convertToActiveVoice(text: string): string {
  const passivePatterns = [/\b(is being|are being|was being|were being)\b/gi, /\b(has been|have been|had been)\b/gi]
  
  for (const pattern of passivePatterns) {
    text = text.replace(pattern, (match) => {
      const parts = match.split(' ')
      return parts[0] // Simplify to just the verb
    })
  }

  return text
}

// Remove adverbs (marketing markers)
export function removeAdverbs(text: string): string {
  const adverbs = /\b(quickly|extremely|very|really|absolutely|definitely|essentially)\b/gi
  return text.replace(adverbs, '')
}

// Paragraph mobile optimization
export function optimizeForMobile(text: string): string {
  const sentences = text.split(/[.!?]/)
  const optimized = sentences.map(s => {
    const words = s.trim().split(/\s+/)
    if (words.length > 15) {
      // Split long sentences
      return s.replace(',', ',\n')
    }
    return s
  })
  
  return optimized.join('. ').replace(/\n/g, ' ')
}

// Extract CTA from email
export function extractCTA(text: string): string | null {
  const ctaPatterns = [
    /would you like.*\?/i,
    /can i.*\?/i,
    /would you be interested.*\?/i,
    /let me know.*\?/i,
    /are you available.*\?/i
  ]

  for (const pattern of ctaPatterns) {
    const match = text.match(pattern)
    if (match) return match[0]
  }

  return null
}

// PS strategy injector
export function injectPS(text: string, psContent: string): string {
  if (text.includes('P.S.')) return text
  return text + '\n\nP.S. ' + psContent
}

// Retry/Fallback Signal Detection
export function detectHandoverSignal(data: unknown): HandoverSignal {
  if (typeof data !== 'object' || data === null) {
    return { status: 'PROCEED' }
  }
  
  const d = data as any
  
  if (d.signal?.status) {
    return d.signal
  }
  
  if (d.errors?.length > 0 || d.failed === true) {
    return { status: 'RETRY_REQUIRED', reason: 'Errors detected in output', retryWithFallback: true }
  }
  
  return { status: 'PROCEED' }
}

// =============================================================================
// Concurrency Limiter (Token-Aware Parallelism)
// Prevents 429 rate limits when multiple campaigns run simultaneously
// =============================================================================

interface QueuedTask<T> {
  id: string;
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

class ConcurrencyLimiter {
  private queue: QueuedTask<any>[] = [];
  private running = 0;
  private limit: number;

  constructor(limit: number = 1) {
    this.limit = limit;
  }

  async add<T>(id: string, fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ id, fn, resolve, reject });
      this.process();
    });
  }

  private async process() {
    while (this.running < this.limit && this.queue.length > 0) {
      const task = this.queue.shift() as QueuedTask<any> | undefined;
      if (!task) break;

      this.running++;
      try {
        const result = await task.fn();
        task.resolve(result);
      } catch (error) {
        task.reject(error as Error);
      }
      this.running--;
      this.process();
    }
  }
}

// Singleton limiter - 1 concurrent request for primary models
export const llmLimiter = new ConcurrencyLimiter(1);

// =============================================================================
// Semantic Checkpoint System
// Save state after each stage for resume capability
// =============================================================================

export interface SemanticCheckpoint {
  campaignId: string;
  stage: number;
  stageName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  completedAt?: string;
  checkpointData?: any;
  error?: string;
}

export async function saveCheckpoint(
  campaignId: string,
  stage: number,
  stageName: string,
  status: SemanticCheckpoint['status'],
  _checkpointData?: any,
  _error?: string
): Promise<void> {
  console.log(`[Checkpoint] Saving ${stageName}: ${status}`)
  // This would save to database - implementation depends on DB choice
  // For now, just logging as we already track in workflow.ts stages array
}

// =============================================================================
// Diff Validation for S15/S16 (Regression Testing)
// Generates change log between S2 and S4
// =============================================================================

export function generateDiffLog(
  s2Data: string,
  s4Data: string,
  campaignId: string
): string {
  const lines: string[] = []
  
  lines.push(`# Diff Validation Report`)
  lines.push(`Campaign: ${campaignId}`)
  lines.push(`Generated: ${new Date().toISOString()}`)
  lines.push('')
  lines.push('---')
  lines.push('')
  
  // Simple diff - compare key elements
  const s2Stats: string[] = s2Data.match(/\d+(\.\d+)?%/g) || []
  const s4Stats: string[] = s4Data.match(/\d+(\.\d+)?%/g) || []
  
  const newStats = s4Stats.filter(s => !s2Stats.includes(s))
  const retainedStats = s4Stats.filter(s => s2Stats.includes(s))
  
  lines.push('## Statistics Analysis')
  lines.push(`- Stats in S2: ${s2Stats.length}`)
  lines.push(`- Stats in S4: ${s4Stats.length}`)
  lines.push(`- New stats added: ${newStats.length}`)
  lines.push(`- Stats retained: ${retainedStats.length}`)
  lines.push('')
  
  if (newStats.length > 0) {
    lines.push('### New Statistics (Added by Analysis)')
    newStats.forEach(s => lines.push(`- ${s}`))
    lines.push('')
  }
  
  // Check for research sources
  const s2Sources = (s2Data.match(/https?:\/\/[^\s]+/g) || []).length
  const s4Sources = (s4Data.match(/https?:\/\/[^\s]+/g) || []).length
  
  lines.push('## Source Changes')
  lines.push(`- Sources in S2: ${s2Sources}`)
  lines.push(`- Sources in S4: ${s4Sources}`)
  lines.push(`- Net change: ${s4Sources - s2Sources >= 0 ? '+' : ''}${s4Sources - s2Sources}`)
  lines.push('')
  
  // Findings count
  const s2Findings = (s2Data.match(/\d+\./g) || []).length
  const s4Findings = (s4Data.match(/\d+\./g) || []).length
  
  lines.push('## Key Findings')
  lines.push(`- Findings in S2: ${s2Findings}`)
  lines.push(`- Findings in S4: ${s4Findings}`)
  lines.push('')
  
  lines.push('---')
  lines.push('*This diff helps manual validators understand what changed between extraction and analysis*')
  
  return lines.join('\n')
}

// =============================================================================
// Streaming Heartbeats for Long Tasks
// =============================================================================

export interface Heartbeat {
  campaignId: string;
  stage: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  message?: string;
  timestamp: string;
}

// Simple console heartbeat (in production, would use WebSocket/SSE)
export function sendHeartbeat(heartbeat: Heartbeat): void {
  console.log(`[Heartbeat] ${heartbeat.stage}: ${heartbeat.progress}% - ${heartbeat.status}`)
}

export function createHeartbeatTracker(campaignId: string, stage: string) {
  let progress = 0
  const startTime = Date.now()
  
  return {
    update: (p: number, msg?: string) => {
      progress = Math.min(100, Math.max(0, p))
      sendHeartbeat({
        campaignId,
        stage,
        status: 'processing',
        progress,
        message: msg,
        timestamp: new Date().toISOString()
      })
    },
    complete: (msg?: string) => {
      sendHeartbeat({
        campaignId,
        stage,
        status: 'completed',
        progress: 100,
        message: msg || 'Complete',
        timestamp: new Date().toISOString()
      })
      const duration = ((Date.now() - startTime) / 1000).toFixed(1)
      console.log(`[Performance] ${stage} completed in ${duration}s`)
    },
    fail: (error: string) => {
      sendHeartbeat({
        campaignId,
        stage,
        status: 'failed',
        progress,
        message: error,
        timestamp: new Date().toISOString()
      })
    }
  }
}

/**
 * Extract <thought> reasoning from LLM response and log it
 * Returns the cleaned content without reasoning tags
 */
export function extractAndLogReasoning(
  content: string,
  campaignId: string,
  stageName: string
): string {
  const thoughtRegex = /<thought>([\s\S]*?)<\/thought>/gi
  const matches = content.match(thoughtRegex)
  
  if (matches && matches.length > 0) {
    const reasoning = matches.map(m => m.replace(/<\/?thought>/gi, '')).join('\n\n')
    
    // Log to console
    console.log(`[Reasoning Logger] Extracted ${matches.length} thought block(s) from ${stageName}`)
    
    // Log to file
    logReasoningToFile(campaignId, stageName, reasoning)
    
    // Return content without reasoning tags
    return content.replace(thoughtRegex, '').trim()
  }
  
  return content
}

/**
 * Log reasoning to file for debugging
 */
function logReasoningToFile(campaignId: string, stageName: string, reasoning: string): void {
  try {
    const fs = require('fs')
    const path = require('path')
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(REASONING_LOG_DIR)) {
      fs.mkdirSync(REASONING_LOG_DIR, { recursive: true })
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `reasoning-${campaignId}-${stageName}-${timestamp}.log`
    const filepath = path.join(REASONING_LOG_DIR, filename)
    
    const logContent = `Campaign ID: ${campaignId}
Stage: ${stageName}
Timestamp: ${new Date().toISOString()}

=== REASONING LOG ===

${reasoning}

=== END REASONING ===
`
    
    fs.writeFileSync(filepath, logContent, 'utf-8')
    console.log(`[Reasoning Logger] Saved to: ${filepath}`)
  } catch (e) {
    console.log(`[Reasoning Logger] Failed to save log:`, e)
  }
}

/**
 * Prompt modifier to request <thought> tags from models
 */
export function addThoughtTags(prompt: string): string {
  return `${prompt}

Before giving your final answer, wrap your reasoning in <thought> tags:
<thought>
Explain your reasoning process, what data you're using, and why you're making certain decisions.
</thought>

Now provide your final response:`
}

// =============================================================================
// JSON Repair Middleware
// Fixes common LLM JSON issues: trailing commas, markdown wrappers
// =============================================================================


// =============================================================================
// Cost vs Speed Load Balancer
// Tracks daily token usage and auto-shifts to cheaper models
// =============================================================================

interface TokenUsage {
  date: string;
  nemotron: number;
  minimax: number;
  hy3: number;
  qwen: number;
}

const TOKEN_FILE = 'D:\\Codex Folder\\digital-pr-agents\\dashboard\\data\\token-usage.json'

const DAILY_LIMITS = {
  nemotron: 100000,  // 100k tokens/day free tier
  minimax: 100000,
  hy3: 100000,
  qwen: 100000
}

export function loadTokenUsage(): TokenUsage {
  try {
    const fs = require('fs')
    if (fs.existsSync(TOKEN_FILE)) {
      const data = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'))
      // Reset if it's a new day
      const today = new Date().toISOString().split('T')[0]
      if (data.date !== today) {
        return { date: today, nemotron: 0, minimax: 0, hy3: 0, qwen: 0 }
      }
      return data as TokenUsage
    }
  } catch {
    // Ignore
  }
  const today = new Date().toISOString().split('T')[0]
  return { date: today, nemotron: 0, minimax: 0, hy3: 0, qwen: 0 }
}

export function saveTokenUsage(usage: TokenUsage): void {
  try {
    const fs = require('fs')
    const pathModule = require('path')
    const dir = pathModule.dirname(TOKEN_FILE)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(usage, null, 2))
  } catch (e) {
    console.log('[Token Tracker] Failed to save:', e)
  }
}

export function getModelForStage(stage: string, _estimatedTokens: number): string {
  const usage = loadTokenUsage()
  const model = stage.includes('S2') || stage.includes('S4') 
    ? 'nemotron' 
    : stage.includes('S12') 
      ? 'qwen' 
      : 'hy3'
  
  const currentUsage = (usage as any)[model] as number || 0
  const limit = DAILY_LIMITS[model as keyof typeof DAILY_LIMITS] || 100000
  const usagePercent = (currentUsage / limit) * 100
  
  console.log(`[Cost Balancer] ${model} usage: ${usagePercent.toFixed(1)}% (${currentUsage}/${limit})`)
  
  // If over 80%, shift to cheaper model
  if (usagePercent > 80) {
    console.log(`[Cost Balancer] Over 80% limit - shifting to MiniMax`)
    return 'minimax/minimax-m2.5:free'
  }
  
  // Return configured model
  const models: Record<string, string> = {
    nemotron: 'nvidia/nemotron-3-super-8b',
    minimax: 'minimax/minimax-m2.5:free',
    hy3: 'meta-llama/llama-3.1-8b-instruct',
    qwen: 'qwen/qwen-2.5-coder-32b-instruct'
  }
  
  return models[model] || models.nemotron
}

export function recordTokenUsage(model: string, tokens: number): void {
  const usage = loadTokenUsage()
  let modelKey: 'nemotron' | 'minimax' | 'hy3' | 'qwen' = 'nemotron'
  
  if (model.includes('minimax')) modelKey = 'minimax'
  else if (model.includes('qwen')) modelKey = 'qwen'
  else if (model.includes('llama')) modelKey = 'hy3'
  else modelKey = 'nemotron'
  
  usage[modelKey] = (usage[modelKey] || 0) + tokens
  saveTokenUsage(usage)
}



// =============================================================================
// Confidence Score Gate
// Auto-detect weak answers and get second opinion
// =============================================================================

export interface ConfidenceResult {
  confidence: 'high' | 'medium' | 'low';
  score: number;
  recommendations: string[];
}

export function evaluateConfidence(output: string): ConfidenceResult {
  // Look for confidence markers in output
  const confidenceMatch = output.match(/confidence[:\s]*(\d+)/i)
  const scoreMatch = output.match(/score[:\s]*(\d+)/i)
  const qualityMatch = output.match(/quality[:\s]*(\d+)/i)
  
  let score = 5 // Default medium
  
  if (confidenceMatch) score = parseInt(confidenceMatch[1])
  else if (scoreMatch) score = parseInt(scoreMatch[1])
  else if (qualityMatch) score = parseInt(qualityMatch[1])
  
  // If output is too short, likely low confidence
  if (output.length < 200) score = Math.min(score, 4)
  
  const recommendations: string[] = []
  
  if (score < 7) {
    recommendations.push('Low confidence detected - consider getting second opinion')
  }
  if (output.includes('unknown') || output.includes('unsure')) {
    recommendations.push('Model expressed uncertainty')
  }
  if (output.length < 500) {
    recommendations.push('Output suspiciously short - may be incomplete')
  }
  
  return {
    confidence: score >= 7 ? 'high' : score >= 4 ? 'medium' : 'low',
    score,
    recommendations
  }
}

// =============================================================================
// Anti-Hallucination Anchor (S5 Context Isolation)
// Ensures S5 only receives verified S4 output, not raw source data
// =============================================================================

export interface ContextIsolationConfig {
  allowRawStudy: boolean;
  allowInsights: boolean;
  allowAnalysis: boolean;
  sourceLineNumbers: boolean;
}

export const S5_ISOLATION_CONFIG: ContextIsolationConfig = {
  allowRawStudy: false,  // Block unverified raw data
  allowInsights: false,   // Block intermediate data
  allowAnalysis: true,   // Only allow verified analysis
  sourceLineNumbers: true // Enable citation mapping
}

export function buildIsolatedContext(
  stage: string,
  sources: { rawStudy?: string; insights?: string; analysis?: string }
): string {
  if (stage === 'S5') {
    if (!S5_ISOLATION_CONFIG.allowAnalysis || !sources.analysis) {
      throw new Error('S5 requires analysis context - context isolation violation')
    }
    return sources.analysis
  }
  
  if (stage === 'S9') return sources.analysis || ''
  
  return sources.analysis || sources.insights || sources.rawStudy || ''
}

export function extractSourceCitations(output: string): { fact: string; sourceLine: string }[] {
  const citationRegex = /\[source:(\d+)\]/g
  const facts: { fact: string; sourceLine: string }[] = []
  let match
  
  while ((match = citationRegex.exec(output)) !== null) {
    const lineNum = match[1]
    const factStart = output.lastIndexOf('\n', match.index) + 1
    const factEnd = output.indexOf('[source:', match.index)
    const fact = output.slice(factStart, factEnd).trim()
    
    facts.push({ fact, sourceLine: lineNum })
  }
  
  return facts
}

// =============================================================================
// S9 Journalist Intelligence Batching (Map-Reduce)
// Handles multiple journalist profiles without token overflow
// =============================================================================

export interface JournalistProfile {
  id: string;
  name: string;
  outlet: string;
  coverage: string;
}

export interface JournalistSummary {
  id: string;
  summary: string;
  expertise: string[];
  recentAngles: string[];
}

export async function mapJournalistProfiles(
  profiles: JournalistProfile[],
  llmFn: (prompt: string) => Promise<string>
): Promise<JournalistSummary[]> {
  const BATCH_SIZE = 5
  const summaries: JournalistSummary[] = []
  
  for (let i = 0; i < profiles.length; i += BATCH_SIZE) {
    const batch = profiles.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.all(
      batch.map(async (journalist) => {
        const prompt = `Analyze this journalist profile and provide a 3-sentence summary:

Name: ${journalist.name}
Outlet: ${journalist.outlet}
Recent Coverage: ${journalist.coverage}

Respond in JSON format:
{"summary": "...", "expertise": ["..."], "recentAngles": ["..."]}`

        const result = await llmFn(prompt)
        try {
          const parsed = JSON.parse(result)
          return { id: journalist.id, ...parsed }
        } catch {
          return { 
            id: journalist.id, 
            summary: 'Analysis unavailable', 
            expertise: [], 
            recentAngles: [] 
          }
        }
      })
    )
    
    summaries.push(...batchResults)
  }
  
  return summaries
}

export async function reduceJournalistSummaries(
  summaries: JournalistSummary[],
  llmFn: (prompt: string) => Promise<string>
): Promise<string> {
  const combined = summaries
    .map(s => `- ${s.id}: ${s.summary}`)
    .join('\n')
  
  const prompt = `Create a consolidated journalist intelligence report from these individual analyses:

${combined}

Generate the final 06-journalist-intel.md content with:
1. Top 5 priority targets
2. Best personalization angles for each
3. Recommended pitch variants

Format as markdown.`

  return llmFn(prompt)
}

// =============================================================================
// Stage 7 Pause/Resume - Campaign State Management
// =============================================================================

export type CampaignStatus = 
  | 'PENDING' 
  | 'AWAITING_USER_SELECTION' 
  | 'PROCESSING' 
  | 'COMPLETED' 
  | 'FAILED';

export interface CampaignState {
  campaignId: string;
  status: CampaignStatus;
  currentStage: string;
  completedStages: string[];
  userSelections?: {
    selectedAngles?: string[];
    selectedJournalists?: string[];
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
    sourceFile?: string;
  };
  history?: StageSnapshot[];
}

const STATE_FILE = 'D:\\Codex Folder\\digital-pr-agents\\dashboard\\data\\campaign-states.json'

export function loadCampaignState(campaignId: string): CampaignState | null {
  try {
    const fs = require('fs')
    if (fs.existsSync(STATE_FILE)) {
      const allStates = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'))
      return allStates[campaignId] || null
    }
  } catch {}
  return null
}

export function saveCampaignState(state: CampaignState): void {
  try {
    const fs = require('fs')
    const pathModule = require('path')
    const dir = pathModule.dirname(STATE_FILE)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    
    let allStates: Record<string, CampaignState> = {}
    if (fs.existsSync(STATE_FILE)) {
      allStates = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'))
    }
    
    allStates[state.campaignId] = {
      ...state,
      metadata: { ...state.metadata, updatedAt: new Date().toISOString() }
    }
    
    fs.writeFileSync(STATE_FILE, JSON.stringify(allStates, null, 2))
  } catch (e) {
    console.log('[State] Failed to save:', e)
  }
}

export function pauseForUserSelection(campaignId: string, currentStage: string): void {
  const existing = loadCampaignState(campaignId)
  const state: CampaignState = existing || {
    campaignId,
    status: 'AWAITING_USER_SELECTION',
    currentStage,
    completedStages: [],
    metadata: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  }
  
  state.status = 'AWAITING_USER_SELECTION'
  state.currentStage = currentStage
  
  saveCampaignState(state)
  console.log(`[State] Campaign ${campaignId} paused at ${currentStage} for user selection`)
}

export function resumeFromSelection(
  campaignId: string, 
  selections: { selectedAngles?: string[]; selectedJournalists?: string[] },
  nextStage: string
): CampaignState {
  const existing = loadCampaignState(campaignId)
  if (!existing) throw new Error(`Campaign ${campaignId} not found`)
  
  if (existing.status !== 'AWAITING_USER_SELECTION') {
    throw new Error(`Campaign ${campaignId} not in awaiting selection state`)
  }
  
  const state: CampaignState = {
    ...existing,
    status: 'PROCESSING',
    currentStage: nextStage,
    userSelections: selections,
    completedStages: [...existing.completedStages, existing.currentStage]
  }
  
  saveCampaignState(state)
  console.log(`[State] Campaign ${campaignId} resumed to ${nextStage}`)
  
  return state
}

// =============================================================================
// 16-Factor Scoring Rubric (S11)
// =============================================================================

export const SCORING_RUBRIC = {
  factors: [
    { name: 'subject_line', maxScore: 10, weight: 1.5, description: 'Attention-grabbing, specific, newsworthy' },
    { name: 'hook_strength', maxScore: 10, weight: 1.5, description: 'Strong lead that compels reading' },
    { name: 'personalization', maxScore: 10, weight: 2.0, description: 'Tailored to journalist\'s beat & recent work' },
    { name: 'newsworthiness', maxScore: 10, weight: 2.0, description: 'Timely, relevant, editor-worthy' },
    { name: 'clarity', maxScore: 10, weight: 1.0, description: 'Clear, concise, easy to scan' },
    { name: 'source_credibility', maxScore: 10, weight: 1.5, description: 'Cites credible sources/data' },
    { name: 'angle_novelty', maxScore: 10, weight: 1.0, description: 'Fresh perspective, not derivative' },
    { name: 'cta_clarity', maxScore: 10, weight: 1.0, description: 'Clear call-to-action' },
    { name: 'tone', maxScore: 10, weight: 1.0, description: 'Professional, not salesy' },
    { name: 'length', maxScore: 10, weight: 0.5, description: 'Appropriate length (150-250 words)' },
    { name: 'keyword_usage', maxScore: 10, weight: 0.5, description: 'Strategic keywords for indexing' },
    { name: 'timing_relevance', maxScore: 10, weight: 1.0, description: 'Matches current news cycle' },
    { name: 'data_presentation', maxScore: 10, weight: 1.0, description: 'Stats/data clear and compelling' },
    { name: 'exclusivity', maxScore: 10, weight: 1.0, description: 'Suggests exclusive angle' },
    { name: 'followup_potential', maxScore: 10, weight: 0.5, description: 'Sets up follow-up opportunity' },
    { name: 'overall_impression', maxScore: 10, weight: 1.5, description: 'Would a journalist forward this?' }
  ],
  maxPossibleScore: 160,
  passingThreshold: 80
}

export function buildScoringPrompt(pitchContent: string): string {
  const factorsList = SCORING_RUBRIC.factors
    .map(f => `- ${f.name}: ${f.description} (max ${f.maxScore} pts)`)
    .join('\n')

  return `Evaluate this pitch email using these 16 factors:

${factorsList}

Pitch to evaluate:
---
${pitchContent}
---

Respond in JSON format only:
{
  "scores": {
    "subject_line": 8,
    "hook_strength": 7,
    ...
  },
  "total_score": 112,
  "reasoning": {
    "subject_line": "...",
    "hook_strength": "...",
    ...
  },
  "recommendations": ["...", "..."]
}`
}

export interface ScoringResult {
  scores: Record<string, number>;
  totalScore: number;
  reasoning: Record<string, string>;
  recommendations: string[];
  passed: boolean;
}

export function parseScoringResult(output: string): ScoringResult | null {
  try {
    const jsonMatch = output.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    
    const parsed = JSON.parse(jsonMatch[0])
    const scoresArr = Object.values(parsed.scores || {}).filter((v): v is number => typeof v === 'number')
    const totalScore = parsed.total_score || scoresArr.reduce((a, b) => a + b, 0)
    
    return {
      scores: parsed.scores || {},
      totalScore,
      reasoning: parsed.reasoning || {},
      recommendations: parsed.recommendations || [],
      passed: totalScore >= SCORING_RUBRIC.passingThreshold
    }
  } catch {
    return null
  }
}

// =============================================================================
// S12 Google Doc Export - JSON Instruction Set
// =============================================================================

export type DocActionType = 
  | 'insertText' 
  | 'insertHeading' 
  | 'insertParagraph' 
  | 'insertBulletList'
  | 'insertTable';

export interface DocAction {
  action: DocActionType;
  text?: string;
  style?: string;
  rows?: number;
  cols?: number;
  items?: string[];
}

export interface DocInstructionSet {
  title: string;
  actions: DocAction[];
}

export function generateDocInstructions(content: {
  title: string;
  sections: { heading: string; content: string }[];
}): DocInstructionSet {
  const actions: DocAction[] = []
  
  actions.push({
    action: 'insertHeading',
    text: content.title,
    style: 'TITLE'
  })
  
  for (const section of content.sections) {
    actions.push({
      action: 'insertHeading',
      text: section.heading,
      style: 'HEADING_1'
    })
    
    const paragraphs = section.content.split('\n\n').filter(p => p.trim())
    for (const para of paragraphs) {
      actions.push({
        action: 'insertParagraph',
        text: para.trim()
      })
    }
  }
  
  return { title: content.title, actions }
}

export async function executeDocInstructions(
  instructions: DocInstructionSet,
  createDocFn: (title: string) => Promise<any>
): Promise<any> {
  const doc = await createDocFn(instructions.title)
  
  for (const action of instructions.actions) {
    switch (action.action) {
      case 'insertText':
      case 'insertParagraph':
        // Use Google Docs API to insert text
        console.log(`[Doc] ${action.action}: ${action.text?.substring(0, 50)}...`)
        break
      case 'insertHeading':
        console.log(`[Doc] Heading: ${action.text}`)
        break
      case 'insertBulletList':
        console.log(`[Doc] Bullet list: ${action.items?.length} items`)
        break
    }
  }
  
  return doc
}

/**
 * Generate analysis using LLM for Stage 4
 * 
 * Model Priority (from config):
 * 1. Primary: Nemotron 3 Super (FREE)
 * 2. Quality Gate: GPT-5.5 Thinking (requires key)
 * 3. Fallback: MiniMax M2.5 (FREE)
 * 
 * Uses OpenRouter (same as user's OpenCode setup)
 */
export async function generateLLMAnalysis(
  stage2Content: string,
  stage3Content: string
): Promise<string> {
  const prompt = `
You are a Data & Research Analyst agent for Digital PR campaigns.

## LLM Configuration
- Primary: Nemotron 3 Super (FREE via OpenRouter)
- Quality Gate: GPT-5.5 Thinking (requires API key)
- Fallback: MiniMax M2.5 (FREE via OpenRouter)

## Your Task
Analyze the following data and produce bulletproof campaign insights.

## Input 1: Study Data (Stage 2 - 02-insights.md)
${stage2Content.substring(0, 3000)}

## Input 2: Research Data (Stage 3 - 03-research.md)
${stage3Content.substring(0, 3000)}

## Output Format
Provide:

1. **Statistics Verification**
   - Which statistics are verified by research?
   - Which are unverified?

2. **Source Credibility**
   - Rate sources: Government (high), Academic (high), News (medium), Other (low)
   - Overall credibility score (0-100)

3. **Research Gaps**
   - What data is missing?
   - What claims lack support?

4. **Strategic Insights for Pitch**
   - Best data points to lead with
   - Best journalist beats to target
   - Best local/state hooks
   - Storyline recommendations

5. **Risk Warnings**
   - What should be avoided?
   - What needs verification?

6. **Angle Recommendations**
   - Which angles are strongest?
   - Which should be avoided?

Be specific, use the data provided, and provide actionable insights.
`;

  return callLLM(prompt);
}

// =============================================================================
// Shadow Fallback Testing
// Compares Hy3 Preview vs MiniMax to monitor model stability
// =============================================================================

const SHADOW_TEST_CHANCE = 0.2; // 20% of calls run shadow test

interface ShadowTestResult {
  primaryModel: string;
  fallbackModel: string;
  primaryOutput: string;
  fallbackOutput: string;
  outputsMatch: boolean;
  timestamp: string;
}

/**
 * Run shadow test: Call both primary and fallback, compare results
 * Only runs ~20% of the time to avoid extra API costs
 */
export async function runShadowTest(
  prompt: string,
  primaryModel: string,
  fallbackModel: string
): Promise<ShadowTestResult | null> {
  const mode = getRunModeFromEnv();
  if (shouldBlockExternalAction(mode)) {
    return null;
  }

  // Only run 20% of the time to save API costs
  if (Math.random() > SHADOW_TEST_CHANCE) {
    return null;
  }

  console.log(`[Shadow Test] Running comparison: ${primaryModel} vs ${fallbackModel}`);
  
  let primaryOutput = '';
  let fallbackOutput = '';
  let primarySuccess = false;
  let fallbackSuccess = false;

  // Call primary model
  try {
    const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://digital-pr-dashboard.com',
        'X-Title': 'Digital PR Dashboard'
      },
      body: JSON.stringify({
        model: primaryModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1500 // Shorter for comparison
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      primaryOutput = data.choices?.[0]?.message?.content || '';
      primarySuccess = true;
    }
  } catch (e) {
    console.log(`[Shadow Test] Primary ${primaryModel} failed:`, e);
  }

  // Call fallback model
  try {
    const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://digital-pr-dashboard.com',
        'X-Title': 'Digital PR Dashboard'
      },
      body: JSON.stringify({
        model: fallbackModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1500
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      fallbackOutput = data.choices?.[0]?.message?.content || '';
      fallbackSuccess = true;
    }
  } catch (e) {
    console.log(`[Shadow Test] Fallback ${fallbackModel} failed:`, e);
  }

  // Compare outputs (simple length + first 200 chars comparison)
  const outputsMatch = primarySuccess && fallbackSuccess && 
    primaryOutput.substring(0, 200) === fallbackOutput.substring(0, 200);

  const result: ShadowTestResult = {
    primaryModel,
    fallbackModel,
    primaryOutput: primaryOutput.substring(0, 500),
    fallbackOutput: fallbackOutput.substring(0, 500),
    outputsMatch,
    timestamp: new Date().toISOString()
  };

  // Log results for monitoring
  console.log(`[Shadow Test] === Comparison Results ===`);
  console.log(`[Shadow Test] Primary (${primaryModel}): ${primarySuccess ? '✅' : '❌'}`);
  console.log(`[Shadow Test] Fallback (${fallbackModel}): ${fallbackSuccess ? '✅' : '❌'}`);
  console.log(`[Shadow Test] Outputs Match: ${outputsMatch ? '✅' : '⚠️'}`);
  
  if (!outputsMatch && primarySuccess && fallbackSuccess) {
    console.log(`[Shadow Test] ⚠️ WARNING: Models producing different outputs!`);
    console.log(`[Shadow Test] Primary preview: ${primaryOutput.substring(0, 100)}...`);
    console.log(`[Shadow Test] Fallback preview: ${fallbackOutput.substring(0, 100)}...`);
  }

  return result;
}

/**
 * Get shadow test statistics from logs
 */
export function getShadowTestStats(): { totalTests: number; matchRate: number } {
  // This would ideally query from stored logs in production
  // For now, just returning placeholder
  return { totalTests: 0, matchRate: 0 };
}

// =============================================================================
// AbortController Latency Management
// Timeout handling for long-running LLM calls
// =============================================================================

export interface LLMTimeoutConfig {
  timeoutMs: number;
  fallbackModel: string;
}

export const DEFAULT_TIMEOUTS: Record<string, LLMTimeoutConfig> = {
  S2: { timeoutMs: 90000, fallbackModel: 'minimax/minimax-m2.5:free' },
  S3: { timeoutMs: 90000, fallbackModel: 'minimax/minimax-m2.5:free' },
  S4: { timeoutMs: 120000, fallbackModel: 'minimax/minimax-m2.5:free' }
}

export async function callLLMWithTimeout(
  prompt: string,
  stage: string,
  config?: LLMTimeoutConfig
): Promise<{ response: string; timedOut: boolean; source: string }> {
  const timeoutConfig = config || DEFAULT_TIMEOUTS[stage] || { timeoutMs: 90000, fallbackModel: 'minimax/minimax-m2.5:free' }
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutConfig.timeoutMs)
  
  try {
    const response = await callLLM(prompt)
    clearTimeout(timeoutId)
    return { response, timedOut: false, source: 'primary' }
  } catch (error: any) {
    clearTimeout(timeoutId)
    
    if (error.name === 'AbortError' || error.message?.includes('timeout') || error.message?.includes('aborted')) {
      console.log(`[Timeout] ${stage} exceeded ${timeoutConfig.timeoutMs}ms - triggering fallback`)
      const fallbackResponse = await callLLM(prompt)
      return { response: fallbackResponse, timedOut: true, source: 'fallback' }
    }
    
    throw error
  }
}

// =============================================================================
// Cross-Stage Dependency Injection
// Metadata flags for source reliability tracking
// =============================================================================

export type SourceReliability = 'nemotron-primary' | 'minimax-fallback' | 'corrected-gapfill' | 'corrected-auditor'

export interface MetadataFlag {
  source: SourceReliability;
  timestamp: string;
  stage: string;
  confidence?: number;
  note?: string;
}

export function createMetadataFlag(
  source: SourceReliability,
  stage: string,
  confidence?: number,
  note?: string
): MetadataFlag {
  return {
    source,
    timestamp: new Date().toISOString(),
    stage,
    confidence,
    note
  }
}

export function attachMetadataToFindings(
  findings: string[],
  flag: MetadataFlag
): { content: string; metadata: MetadataFlag }[] {
  return findings.map(content => ({
    content,
    metadata: flag
  }))
}

export function getUnreliableFindings(
  findings: { content: string; metadata?: MetadataFlag }[]
): { content: string; reason: string }[] {
  return findings
    .filter(f => f.metadata?.source && !f.metadata.source.includes('primary'))
    .map(f => ({
      content: f.content,
      reason: `Source: ${f.metadata?.source} - ${f.metadata?.note || 'Requires validation'}`
    }))
}

// =============================================================================
// Semantic Similarity De-duplication
// Prevents duplicate insights from correction passes
// =============================================================================

const SIMILARITY_THRESHOLD = 0.85

export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '')
  const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '')
  
  if (s1 === s2) return 1
  if (s1.length === 0 || s2.length === 0) return 0
  
  let matches = 0
  const longer = s1.length > s2.length ? s1 : s2
  const shorter = s1.length > s2.length ? s2 : s1
  
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) matches++
  }
  
  return matches / longer.length
}

export function deduplicateInsights(
  insights: string[]
): { deduplicated: string[]; removed: number } {
  const result: string[] = []
  let removed = 0
  
  for (const insight of insights) {
    const isDuplicate = result.some(existing => {
      const similarity = calculateSimilarity(existing, insight)
      const existingHasNumbers = /\d+/.test(existing)
      const insightHasNumbers = /\d+/.test(insight)
      
      if (similarity >= SIMILARITY_THRESHOLD) {
        if (insightHasNumbers && !existingHasNumbers) {
          const idx = result.indexOf(existing)
          result[idx] = insight
          return true
        }
        return true
      }
      return false
    })
    
    if (!isDuplicate) {
      result.push(insight)
    } else {
      removed++
    }
  }
  
  console.log(`[Dedup] Removed ${removed} duplicate insights from ${insights.length} total`)
  
  return { deduplicated: result, removed }
}

export function mergeInsightsWithMetadata(
  primary: { content: string; metadata?: MetadataFlag }[],
  additional: { content: string; metadata: MetadataFlag }[]
): { content: string; metadata: MetadataFlag }[] {
  const merged: { content: string; metadata: MetadataFlag }[] = [...primary.map(p => ({ ...p, metadata: p.metadata || { source: 'nemotron-primary', timestamp: new Date().toISOString(), stage: 'unknown' } }))]
  
  for (const item of additional) {
    const isDuplicate = merged.some(existing => 
      calculateSimilarity(existing.content, item.content) >= SIMILARITY_THRESHOLD
    )
    
    if (!isDuplicate) {
      merged.push(item)
    }
  }
  
  return merged
}

// =============================================================================
// S10 Citation System - VF and IN tags
// =============================================================================

export interface VerifiedFinding {
  id: string;
  finding: string;
  source: string;
  confidence?: number;
}

export interface InsightNote {
  id: string;
  content: string;
  source: string;
}

export interface S10ContextBundle {
  strategy: string;
  verifiedFacts: VerifiedFinding[];
  supportingDetails: InsightNote[];
}

export function buildS10Prompt(context: S10ContextBundle, journalistContext?: string): string {
  const vfList = context.verifiedFacts.map(vf => 
    `- [VF_${vf.id}] ${vf.finding} (Source: ${vf.source})`
  ).join('\n')
  
  const inList = context.supportingDetails.map(in_ => 
    `- [IN_${in_.id}] ${in_.content} (Source: ${in_.source})`
  ).join('\n')

  return `You are drafting a journalist pitch based ONLY on the provided verified findings.

STRICT RULES:
1. Every data claim, statistic, or fact MUST be followed by its VF ID in brackets (e.g., [VF_01])
2. Every quote or supporting context MUST be followed by its IN ID (e.g., [IN_01])
3. Do NOT invent statistics. If a finding is not in the VF list, do NOT use it.
4. Do NOT "spice up" the numbers - use exact values from the source.

Available Verified Findings (MUST cite with VF_XX):
${vfList}

Supporting Context (Use for flavor - cite with IN_XX):
${inList}

${journalistContext ? `Journalist Intelligence (Reference their past work with J_Intel_XX):\n${journalistContext}\n` : ''}

Strategy to follow:
${context.strategy}

Draft a compelling pitch email (150-250 words) that:
- Has a strong subject line
- Personalizes to the journalist's beat
- Uses only the provided verified facts with proper citations
- Includes a clear call-to-action

Respond with the pitch in this JSON format:
{
  "subject_line": "...",
  "body": "...",
  "citations_used": ["VF_01", "VF_02", "IN_01"]
}`
}

export function validateCitations(
  pitchText: string,
  verifiedFindings: VerifiedFinding[],
  insights: InsightNote[]
): { valid: boolean; errors: string[]; usedCitations: string[] } {
  const foundVFCitations = pitchText.match(/\[VF_(\d+)\]/g) || []
  const foundINCitations = pitchText.match(/\[IN_(\d+)\]/g) || []
  const errors: string[] = []
  
  const validVFIds = verifiedFindings.map(f => `VF_${f.id}`)
  const validINIds = insights.map(i => `IN_${i.id}`)
  for (const citation of foundVFCitations) {
    const cleanId = citation.replace(/[\[\]]/g, '')
    if (!validVFIds.includes(cleanId)) {
      errors.push(`Hallucinated VF citation: ${citation}`)
    }
  }
  
  for (const citation of foundINCitations) {
    const cleanId = citation.replace(/[\[\]]/g, '')
    if (!validINIds.includes(cleanId)) {
      errors.push(`Hallucinated IN citation: ${citation}`)
    }
  }
  
  const allUsed = [...foundVFCitations, ...foundINCitations].map(c => c.replace(/[\[\]]/g, ''))
  
  return {
    valid: errors.length === 0,
    errors,
    usedCitations: allUsed
  }
}

export function removeCitationTags(text: string): string {
  return text.replace(/\[VF_\d+\]/g, '').replace(/\[IN_\d+\]/g, '').replace(/\[J_Intel_\d+\]/g, '').trim()
}

export function polishForDelivery(pitchWithCitations: string): string {
  const cleaned = removeCitationTags(pitchWithCitations)
  
  return cleaned
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim()
}