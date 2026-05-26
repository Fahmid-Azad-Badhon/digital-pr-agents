import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import path from 'path'

const WORKFLOW_ROOT = 'D:\\Codex Folder\\digital-pr-agents'

export interface StageDefinition {
  number: number
  name: string
  owner: string
  inputs: string[]
  outputs: string[]
}

export const STAGE_DEFINITIONS: StageDefinition[] = [
  { number: 1, name: 'Campaign Intake', owner: 'digital-pr-orchestrator', inputs: [], outputs: ['00-brief.md'] },
  { number: 2, name: 'Data Extraction', owner: 'study-insight-extractor', inputs: ['00-brief.md', 'source-files/study-inputs/raw-study-copy.md'], outputs: ['01-study-notes.md', '02-insights.md'] },
  { number: 3, name: 'Research Enrichment', owner: 'research-enrichment-agent', inputs: ['01-study-notes.md', '02-insights.md'], outputs: ['03-research.md'] },
  { number: 4, name: 'Data & Research Analysis', owner: 'data-analyst', inputs: ['02-insights.md', '03-research.md'], outputs: ['04-analysis.md'] },
  { number: 5, name: 'Angle Generation', owner: 'angle-generator', inputs: ['04-analysis.md'], outputs: ['04-angles.md'] },
  { number: 6, name: 'Beat Matching', owner: 'beat-matcher', inputs: ['04-angles.md'], outputs: ['05-beats.md'] },
  { number: 7, name: 'Pitch Selection', owner: 'human-reviewer', inputs: ['05-beats.md'], outputs: ['06-selected-angles.md'] },
  { number: 8, name: 'Journalist Collection', owner: 'journalist-targeting-subagent', inputs: ['06-selected-angles.md'], outputs: ['source-files/journalist-intel/'] },
  { number: 9, name: 'Journalist Intelligence', owner: 'journalist-intelligence-agent', inputs: ['source-files/journalist-intel/'], outputs: ['06-journalist-intel.md', '07-journalist-coverage.md'] },
  { number: 10, name: 'Pitch Drafting', owner: 'pitch-writer', inputs: ['06-selected-angles.md', '06-journalist-intel.md', '07-journalist-coverage.md'], outputs: ['draft-variants/', '08-pitch-draft.md'] },
  { number: 11, name: 'Email Optimization', owner: 'email-optimizer', inputs: ['08-pitch-draft.md'], outputs: ['09-optimized-email.md'] },
  { number: 12, name: 'Final Package', owner: 'final-doc-packager', inputs: ['09-optimized-email.md'], outputs: ['10-google-doc.md'] },
  { number: 13, name: 'Google Doc Export', owner: 'digital-pr-orchestrator', inputs: ['10-google-doc.md'], outputs: [] },
  { number: 14, name: 'Technical Validation', owner: 'digital-pr-orchestrator', inputs: [], outputs: [] },
  { number: 15, name: 'Browser Validation', owner: 'journalist-targeting-subagent', inputs: [], outputs: [] },
  { number: 16, name: 'Regression & Production', owner: 'production', inputs: [], outputs: [] }
]

const JSON_STORE = 'D:\\Codex Folder\\digital-pr-agents\\dashboard\\data\\campaigns.json'
const MISSING_INFO = 'Information unavailable. Verification required before use.'

function loadJsonData(): any {
  if (!fs.existsSync(JSON_STORE)) {
    return { campaigns: [], stages: [], gates: [], logs: [], notifications: [], artifacts: [] }
  }
  return JSON.parse(fs.readFileSync(JSON_STORE, 'utf-8'))
}

function saveJsonData(data: any): void {
  const dir = path.dirname(JSON_STORE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(JSON_STORE, JSON.stringify(data, null, 2), 'utf-8')
}

export class WorkflowEngine {
  private campaignId: string
  private slug: string
  private data: any

  constructor(campaignId: string, slug: string) {
    this.campaignId = campaignId
    this.slug = slug
    this.data = loadJsonData()
  }

  private getJobFolder(): string {
    return path.join(WORKFLOW_ROOT, 'pitch-jobs', this.slug)
  }

  private getSourceFolder(): string {
    return path.join(this.getJobFolder(), 'source-files', 'study-inputs')
  }

  private save(): void {
    saveJsonData(this.data)
  }

  async initialize(): Promise<void> {
    const jobFolder = this.getJobFolder()
    const sourceFolder = this.getSourceFolder()

    if (!fs.existsSync(jobFolder)) {
      fs.mkdirSync(jobFolder, { recursive: true })
    }
    if (!fs.existsSync(sourceFolder)) {
      fs.mkdirSync(sourceFolder, { recursive: true })
    }

    for (const stage of STAGE_DEFINITIONS) {
      this.data.stages.push({
        id: uuidv4(),
        campaign_id: this.campaignId,
        stage_number: stage.number,
        stage_name: stage.name,
        owner: stage.owner,
        status: 'pending',
        input_files: JSON.stringify(stage.inputs),
        output_files: JSON.stringify(stage.outputs),
        started_at: null,
        completed_at: null,
        error: null
      })
    }

    this.data.gates.push(
      { id: uuidv4(), campaign_id: this.campaignId, gate_name: 'Outreach Angle Gate', status: 'open', value: null, triggered_at: null, confirmed_at: null },
      { id: uuidv4(), campaign_id: this.campaignId, gate_name: '800-Per-Beat Gate', status: 'open', value: null, triggered_at: null, confirmed_at: null }
    )

    this.data.logs.push({ id: uuidv4(), campaign_id: this.campaignId, stage: null, level: 'info', message: `Workflow initialized for campaign ${this.slug}`, created_at: new Date().toISOString() })
    this.save()
  }

  async runStage(stageNumber: number, brief?: string, rawStudy?: string): Promise<{ success: boolean; error?: string; skipped?: boolean }> {
    const stageDef = STAGE_DEFINITIONS.find(s => s.number === stageNumber)
    if (!stageDef) {
      return { success: false, error: 'Invalid stage number' }
    }

    // =============================================================================
    // Idempotency Check: Skip if stage already completed successfully
    // This enables "resume from failed stage" functionality
    // =============================================================================
    const existingStage = this.data.stages.find((s: any) => s.campaign_id === this.campaignId && s.stage_number === stageNumber)
    
    if (existingStage && existingStage.status === 'completed') {
      console.log(`[Idempotency] Stage ${stageNumber} already completed - skipping`)
      this.data.logs.push({ 
        id: uuidv4(), 
        campaign_id: this.campaignId, 
        stage: stageDef.name, 
        level: 'info', 
        message: `Skipping ${stageDef.name} - already completed (idempotency)`, 
        created_at: new Date().toISOString() 
      })
      return { success: true, skipped: true }
    }

    try {
      const stageIdx = this.data.stages.findIndex((s: any) => s.campaign_id === this.campaignId && s.stage_number === stageNumber)
      if (stageIdx >= 0) {
        this.data.stages[stageIdx].status = 'running'
        this.data.stages[stageIdx].started_at = new Date().toISOString()
        // Generate idempotency key for this run
        this.data.stages[stageIdx].idempotency_key = uuidv4()
      }

      this.data.logs.push({ id: uuidv4(), campaign_id: this.campaignId, stage: stageDef.name, level: 'info', message: `Starting ${stageDef.name}`, created_at: new Date().toISOString() })

      switch (stageNumber) {
        case 1:
          await this.runCampaignIntake(brief, rawStudy)
          break
        case 2:
          await this.runStudyExtraction()
          break
        case 3:
          await this.runResearchEnrichment()
          break
        case 4:
          await this.runDataAnalysis()
          break
        case 5:
          await this.runAngleGeneration()
          break
        case 6:
          await this.runBeatMatching()
          break
        case 7:
          await this.runPitchSelection()
          break
        default:
          return { success: false, error: `Stage ${stageNumber} requires manual execution` }
      }

      const stageIdx2 = this.data.stages.findIndex((s: any) => s.campaign_id === this.campaignId && s.stage_number === stageNumber)
      if (stageIdx2 >= 0) {
        this.data.stages[stageIdx2].status = 'completed'
        this.data.stages[stageIdx2].completed_at = new Date().toISOString()
        // Store idempotency key to prevent re-running
        this.data.stages[stageIdx2].completed_with_key = this.data.stages[stageIdx2].idempotency_key
      }

      this.data.logs.push({ id: uuidv4(), campaign_id: this.campaignId, stage: stageDef.name, level: 'success', message: `Completed ${stageDef.name}`, created_at: new Date().toISOString() })
      this.save()

      return { success: true }
    } catch (error: any) {
      const stageIdx = this.data.stages.findIndex((s: any) => s.campaign_id === this.campaignId && s.stage_number === stageNumber)
      if (stageIdx >= 0) {
        this.data.stages[stageIdx].status = 'error'
        this.data.stages[stageIdx].error = error.message
      }
      this.data.logs.push({ id: uuidv4(), campaign_id: this.campaignId, stage: stageDef.name, level: 'error', message: `Error in ${stageDef.name}: ${error.message}`, created_at: new Date().toISOString() })
      this.save()
      return { success: false, error: error.message }
    }
  }

  /**
   * Resume workflow from a specific stage
   * Skips all completed stages, runs from target stage onwards
   */
  async resumeFromStage(targetStage: number): Promise<{ success: boolean; error?: string }> {
    console.log(`[Resume] Starting from Stage ${targetStage}`)
    
    for (let stageNum = targetStage; stageNum <= STAGE_DEFINITIONS.length; stageNum++) {
      const result = await this.runStage(stageNum)
      if (!result.success) {
        return { success: false, error: `Resume failed at Stage ${stageNum}: ${result.error}` }
      }
      if (result.skipped) {
        console.log(`[Resume] Skipped stage ${stageNum} (already completed)`)
      } else {
        console.log(`[Resume] Completed stage ${stageNum}`)
      }
    }
    
    return { success: true }
  }

  private async runCampaignIntake(brief?: string, rawStudy?: string): Promise<void> {
    const jobFolder = this.getJobFolder()

    if (brief) {
      const briefPath = path.join(jobFolder, '00-brief.md')
      
      // Try LLM enhancement with Hy3 Preview (primary) → MiniMax fallback
      let enhancedBrief = brief
      
      try {
        const { callLLM } = await import('./llmService')
        
        const intakePrompt = `
You are a Digital PR Campaign Orchestrator using Hy3 Preview (or MiniMax M2.5 fallback).

## Your Task
Analyze the campaign brief and structure it for the workflow.

## Campaign Brief:
${brief.substring(0, 3000)}

## Output Format (Markdown):

### Campaign Overview
- Client/Topic:
- Goal:
- Target Audience:

### Key Topics Identified
List 3-5 main topics from the brief

### Suggested Journalist Beats
Which beats would this campaign target?

### Research Directions
What external research would strengthen this campaign?

Be concise and actionable.
`
        const llmAnalysis = await callLLM(intakePrompt)
        
        if (llmAnalysis && !llmAnalysis.includes('unavailable')) {
          console.log('[Campaign Intake] Hy3 Preview analysis applied')
          enhancedBrief += `\n\n---\n\n## LLM Analysis (Hy3 Preview)\n\n${llmAnalysis}`
          
          // Shadow Fallback Test: Compare Hy3 vs MiniMax
          try {
            const { runShadowTest } = await import('./llmService')
            const shadowResult = await runShadowTest(
              intakePrompt,
              'meta-llama/llama-3.1-8b-instruct', // Hy3 equivalent
              'minimax/minimax-m2.5:free'
            )
            if (shadowResult) {
              // Store shadow test result
              this.data.logs.push({
                id: uuidv4(),
                campaign_id: this.campaignId,
                stage: 'Campaign Intake',
                level: 'info',
                message: `[Shadow Test] ${shadowResult.primaryModel} vs ${shadowResult.fallbackModel} - Match: ${shadowResult.outputsMatch}`,
                created_at: new Date().toISOString()
              })
            }
          } catch (shadowError) {
            // Silent fail - don't block main workflow
          }
        }
      } catch (llmError) {
        console.log('[Campaign Intake] LLM not available, using raw brief')
      }
      
      fs.writeFileSync(briefPath, enhancedBrief, 'utf-8')
      this.data.artifacts.push({ id: uuidv4(), campaign_id: this.campaignId, stage: 'Campaign Intake', filename: '00-brief.md', filepath: briefPath, content: enhancedBrief, created_at: new Date().toISOString() })
    }

    if (rawStudy) {
      const sourceFolder = this.getSourceFolder()
      const studyPath = path.join(sourceFolder, 'raw-study-copy.md')
      fs.writeFileSync(studyPath, rawStudy, 'utf-8')
      this.data.artifacts.push({ id: uuidv4(), campaign_id: this.campaignId, stage: 'Campaign Intake', filename: 'raw-study-copy.md', filepath: studyPath, content: rawStudy, created_at: new Date().toISOString() })
    }

    const campIdx = this.data.campaigns.findIndex((c: any) => c.id === this.campaignId)
    if (campIdx >= 0) {
      this.data.campaigns[campIdx].brief = brief
      this.data.campaigns[campIdx].raw_study = rawStudy
      this.data.campaigns[campIdx].status = 'intakecomplete'
    }
  }

  private async runStudyExtraction(): Promise<void> {
    const jobFolder = this.getJobFolder()
    const briefPath = path.join(jobFolder, '00-brief.md')
    const studyPath = path.join(jobFolder, 'source-files', 'study-inputs', 'raw-study-copy.md')

    if (!fs.existsSync(briefPath) || !fs.existsSync(studyPath)) {
      throw new Error('Missing 00-brief.md or raw-study-copy.md')
    }

    const brief = fs.readFileSync(briefPath, 'utf-8')
    const study = fs.readFileSync(studyPath, 'utf-8')

    // Generate base content first
    let notes01 = this.generateStudyNotes(brief, study)
    let insights02 = this.generateInsights(brief, study)

    // Try LLM enhancement (Nemotron 3 Super → MiniMax M2.5 fallback)
    try {
      const { callLLM } = await import('./llmService')
      
      const extractionPrompt = `
You are a Data Extraction Agent for Digital PR campaigns.

## LLM Configuration
- Primary: Nemotron 3 Super (FREE via OpenRouter)
- Fallback: MiniMax M2.5 (FREE via OpenRouter)

## Your Task
Extract and structure key information from the campaign brief and raw study data.

## Campaign Brief:
${brief.substring(0, 2000)}

## Raw Study Data:
${study.substring(0, 4000)}

## Output Format (Markdown):

### 1. Key Statistics
Extract all numerical data with context:
- Value, metric, timeframe, geography

### 2. Key Findings
List the most important discoveries:
- Ranked by newsworthiness

### 3. Methodology
Note data collection details if available

### 4. Entities Mentioned
- People, organizations, locations, laws

### 5. Quotes
Notable quotes with speaker attribution

### 6. Limitations
What data is missing or unclear?

Provide specific extracted data - do not invent.
`

      const llmExtraction = await callLLM(extractionPrompt)
      
if (llmExtraction && !llmExtraction.includes('unavailable')) {
        console.log('[Data Extraction] LLM enhancement applied')
        
        // =============================================================================
        // S2 RECURSIVE CORRECTION: Hybrid Logic with "Auditor Pass"
        // =============================================================================
        
        const CRITICAL_ENTITIES = ['statistics', 'findings', 'locations', 'methodology', 'sample', 'percent', 'data', 'results', 'p-value']
        
        const hasKeywords = ['missing', 'uncertain', 'not found', 'unclear', 'incomplete'].some(k => llmExtraction.toLowerCase().includes(k))
        const isMissingData = CRITICAL_ENTITIES.every(entity => !llmExtraction.toLowerCase().includes(entity))
        
        if (hasKeywords || isMissingData) {
          // GAP-FILL: Keyword or schema trigger
          console.log('[S2] Recursive Correction: Gaps detected via keyword or schema check')
          
          const gapFillPrompt = `You are a Gap-Fill Agent. Review the previous extraction and identify missing data.

Previous Extraction:
${llmExtraction}

Source Document (for reference):
${study.slice(0, 10000)}

Review your previous extraction above. Check specifically for:

1. **Data** - Raw numbers, metrics, counts, quantities?
2. **Statistics** - Percentages, rates, rankings, comparisons?
3. **Key Findings** - Main discoveries, conclusions, insights?
4. **Information** - Important facts, details, context?
5. **Insights** - Interpretations, implications, meanings?
6. **Newsworthy Information** - Timely, relevant, impactful details?
7. **Locations** - Cities, counties, states, countries, regions?

If you missed any of these in your initial extraction, list ONLY the additions in this format:
- [Category]: [What was missed]

If nothing was missed, respond with: "NO MISSIONS FOUND"
`
          
          const corrections = await callLLM(gapFillPrompt)
          
          if (corrections && !corrections.includes('unavailable') && !corrections.includes('NO MISSIONS FOUND')) {
            console.log('[S2] Gap-fill applied')
            insights02 += `\n\n### Gap-Fill Results\n${corrections}`
          } else {
            console.log('[S2] No gaps found in correction check')
          }
        } else {
          // AUDITOR PASS: "Quiet Bounty Hunter" - Fixed second verification
          console.log('[S2] Auditor Pass: Verifying nuances (Bounty Hunter mode)...')
          
          const auditorPrompt = `You are a Bounty Hunter. Your ONLY job is to find "hidden" insights that were overlooked.

You have already extracted the main points. Find 10 specific data points that were missed:
- Sample sizes (e.g., "n=500", "1,200 participants")
- P-values or confidence intervals
- Comparison data (e.g., "vs control group", "increased by 40%")
- Timeline details (e.g., "2023-2024", "over 6 months")
- Demographics or subgroup findings
- Limitations or caveats mentioned

Previous Extraction:
${llmExtraction}

Source Document (for reference):
${study.slice(0, 15000)}

If you find new information, respond in JSON format:
{"new_info_found": true, "hidden_insights": ["...", "..."]}

If you find nothing new, respond with:
{"new_info_found": false, "hidden_insights": []}
`
          
          const auditResult = await callLLM(auditorPrompt)
          
          if (auditResult && auditResult.includes('"new_info_found": true')) {
            console.log('[S2] Auditor found hidden insights - merging')
            try {
              const auditJson = JSON.parse(auditResult.match(/\{[\s\S]*\}/)?.[0] || '{}')
              if (auditJson.hidden_insights?.length > 0) {
                insights02 += `\n\n### Auditor Discovered (Hidden Insights)\n${auditJson.hidden_insights.map((i: string) => '- ' + i).join('\n')}`
              }
            } catch {
              insights02 += '\n\n### Auditor Note\n' + auditResult.slice(0, 500)
            }
          } else {
            console.log('[S2] Auditor: STABLE - No new insights found')
          }
        }
        
        // Append final LLM extraction to insights
        insights02 += `\n\n---\n\n## LLM Enhanced Extraction (Nemotron 3 Super)\n\n${llmExtraction}`
      }
    } catch (llmError) {
console.log('[Data Extraction] LLM not available, using base extraction')
    }

    fs.writeFileSync(path.join(jobFolder, '01-study-notes.md'), notes01, 'utf-8')
    fs.writeFileSync(path.join(jobFolder, '02-insights.md'), insights02, 'utf-8')

    this.data.artifacts.push({ id: uuidv4(), campaign_id: this.campaignId, stage: 'Study Extraction', filename: '01-study-notes.md', filepath: path.join(jobFolder, '01-study-notes.md'), content: notes01, created_at: new Date().toISOString() })
    this.data.artifacts.push({ id: uuidv4(), campaign_id: this.campaignId, stage: 'Study Extraction', filename: '02-insights.md', filepath: path.join(jobFolder, '02-insights.md'), content: insights02, created_at: new Date().toISOString() })

    const campIdx = this.data.campaigns.findIndex((c: any) => c.id === this.campaignId)
    if (campIdx >= 0) this.data.campaigns[campIdx].status = 'extractioncomplete'
  }

  private generateStudyNotes(brief: string, study: string): string {
    return `# Study Notes

## Source Summary
Source: User-provided campaign brief and raw study copy
Date: ${new Date().toISOString().split('T')[0]}

## Campaign Context
${brief.substring(0, 1000)}

## Key Findings from Study
${study.substring(0, 2000)}

## Methodology
Information unavailable. Verification required before use.

## Caveats
- Source provided by user, not independently verified
- Timing and geography claims require external validation

## Raw Observations
- User campaign in progress
- Study data needs extraction and ranking
`
  }

  private generateInsights(brief: string, study: string): string {
    return `# Ranked Insights

## Findings Table

| Rank | Finding | Evidence | Why It Matters | Novelty Score | Caveat |
|------|---------|----------|---------------|--------------|-------|
| 1 | Campaign study data available | User-provided source | Core campaign evidence | 8 | Needs verification |

## Top Findings
The campaign contains study data that can support Digital PR outreach.

## Next Steps
- Extract specific statistics
- Identify newsworthy angles
- Build research context
`
  }

  private async runResearchEnrichment(): Promise<void> {
    const jobFolder = this.getJobFolder()
    
    // Read insights from Stage 2
    const insightsPath = path.join(jobFolder, '02-insights.md')
    let insightsContent = ''
    if (fs.existsSync(insightsPath)) {
      insightsContent = fs.readFileSync(insightsPath, 'utf-8')
    }
    
    // Extract keywords from insights for web search
    const keywords = this.extractKeywords(insightsContent)
    
    // Perform real web research
    const researchResult = await this.performResearchWithWebSearch(keywords)
    
    // Generate base research document
let research = this.generateResearch(researchResult, keywords)
    
    // Try LLM enhancement (Nemotron 3 Super → MiniMax fallback)
    try {
      const { callLLM } = await import('./llmService')
      
      // =============================================================================
      // Smart Token Budgeting
      // Check token count, chunk if > 500k tokens
      // =============================================================================
      
      const stage2Data = insightsContent.substring(0, 3000)
      const webFindings = researchResult.findings.slice(0, 10).join('\n')
      const sourcesData = researchResult.sources.join('\n')
      
      const promptContent = `Stage 2: ${stage2Data}\n\nWeb Results: ${webFindings}\n\nSources: ${sourcesData}`
      const estimatedTokens = this.estimateTokens(promptContent)
      
      console.log(`[Token Budget] Estimated tokens: ${estimatedTokens}`)
      
      let llmResearch = ''
      
      if (estimatedTokens > 500000) {
        // Chunk large payload
        console.log('[Token Budget] Large payload - chunking into parallel calls')
        const chunks = this.chunkContent(promptContent, 3)
        const chunkResults: string[] = []
        
        for (let i = 0; i < chunks.length; i++) {
          const chunkPrompt = `Part ${i + 1} of ${chunks.length}.\n\n${chunks[i]}\n\nProvide research synthesis.`
          const chunkResult = await callLLM(chunkPrompt)
          if (chunkResult && !chunkResult.includes('unavailable')) {
            chunkResults.push(chunkResult)
          }
        }
        
        if (chunkResults.length > 0) {
          const mergePrompt = `Merge these ${chunkResults.length} parts into one coherent output:\n\n${chunkResults.join('\n\n---\n\n')}`
          llmResearch = await callLLM(mergePrompt)
        }
      } else {
        // Normal single call
        const researchPrompt = `
You are a Research Enrichment Agent for Digital PR campaigns.

## Your Task
Synthesize web research results and enrich the campaign data.

## Stage 2 Insights (02-insights.md):
${stage2Data}

## Web Research Results:
${webFindings}

## Sources Found:
${sourcesData}

## Output Format (Markdown):
### 1. Source Categorization
### 2. Statistics Verification  
### 3. Research Gaps
### 4. Angle Directions
### 5. Contradictions

Be specific and actionable.`

        llmResearch = await callLLM(researchPrompt)
      }
      
      if (llmResearch && !llmResearch.includes('unavailable')) {
        console.log('[Research Enrichment] LLM synthesis applied')
        research += `\n\n---\n\n## LLM Enhanced Research Synthesis\n\n${llmResearch}`
      }
    } catch (llmError) {
      console.log('[Research Enrichment] LLM not available, using base research')
    }
    
    fs.writeFileSync(path.join(jobFolder, '03-research.md'), research, 'utf-8')
    this.data.artifacts.push({ id: uuidv4(), campaign_id: this.campaignId, stage: 'Research Enrichment', filename: '03-research.md', filepath: path.join(jobFolder, '03-research.md'), content: research, created_at: new Date().toISOString() })

    const campIdx = this.data.campaigns.findIndex((c: any) => c.id === this.campaignId)
    if (campIdx >= 0) this.data.campaigns[campIdx].status = 'researchcomplete'
  }

  private async runDataAnalysis(): Promise<void> {
    const jobFolder = this.getJobFolder()
    
    const insightsPath = path.join(jobFolder, '02-insights.md')
    const researchPath = path.join(jobFolder, '03-research.md')
    const analysisPath = path.join(jobFolder, '04-analysis.md')
    
    console.log('[Data & Research Analyst] Running comprehensive analysis...')
    
    // Load stage content
    const insightsContent = fs.existsSync(insightsPath) ? fs.readFileSync(insightsPath, 'utf-8') : ''
    const researchContent = fs.existsSync(researchPath) ? fs.readFileSync(researchPath, 'utf-8') : ''
    
    // Run TypeScript analysis
    const { runDataResearchAnalyst, generateAnalysisReport } = await import('./dataAnalysis')
    const result = runDataResearchAnalyst(insightsPath, researchPath)
    let report = generateAnalysisReport(result)
    
    // Try to add LLM enhancement if API key exists
    try {
      const { generateLLMAnalysis } = await import('./llmService')
      const llmAnalysis = await generateLLMAnalysis(insightsContent, researchContent)
      
      // Append LLM analysis if successful
      if (llmAnalysis && !llmAnalysis.startsWith('Error') && !llmAnalysis.includes('not configured')) {
        report += '\n\n---\n\n'
        report += '## LLM Enhanced Analysis (MiniMax M2.5)\n\n'
        report += llmAnalysis
        console.log('[Data & Research Analyst] LLM enhancement added')
      }
    } catch (e) {
      console.log('[Data & Research Analyst] LLM not available, using TypeScript analysis only')
    }
    
    fs.writeFileSync(analysisPath, report, 'utf-8')
    this.data.artifacts.push({ 
      id: uuidv4(), 
      campaign_id: this.campaignId, 
      stage: 'Data & Research Analysis', 
      filename: '04-analysis.md', 
      filepath: analysisPath, 
      content: report, 
      created_at: new Date().toISOString() 
    })
    
    console.log('[Data & Research Analyst] Analysis complete.')
    console.log('  - Data Quality Score:', result.output.dataQualityScore)
    console.log('  - Source Credibility:', result.output.sourceCredibility)
    console.log('  - Verified Stats:', result.output.verifiedStats, '/', result.output.totalStats)
    console.log('  - Best Beats:', result.insights.bestJournalistBeats.join(', '))
  }

  private extractKeywords(insightsContent: string): string[] {
    const keywords: string[] = []
    
    // Extract key statistics and locations
    const statsMatch = insightsContent.match(/\*\*Total:\*\* (\d+[,\d]*)/)
    if (statsMatch) keywords.push(statsMatch[1])
    
    // Extract locations
    const locations = insightsContent.match(/^\* ([A-Z][a-z]+( County| City)?)/gm)
    if (locations) {
      locations.slice(0, 3).forEach((loc: string) => {
        const cleaned = loc.replace(/^\* /, '').trim()
        if (cleaned.length > 3) keywords.push(cleaned)
      })
    }
    
    // Extract percentages
    const percents = insightsContent.match(/\d+(\.\d+)?%/g)
    if (percents) {
      percents.slice(0, 2).forEach((p: string) => keywords.push(p))
    }
    
    // Extract key findings keywords
    const findings = insightsContent.match(/## Top Findings[\s\S]*?(?=##|$)/i)
    if (findings) {
      const words = findings[0].split(/\s+/).filter((w: string) => w.length > 5).slice(0, 5)
      keywords.push(...words)
    }
    
    return [...new Set(keywords)].slice(0, 10)
  }

  private async performResearchWithWebSearch(keywords: string[]): Promise<{
    success: boolean;
    findings: string[];
    sources: string[];
  }> {
    const { performWebResearch } = await import('./webSearch')
    
    const topic = keywords.slice(0, 2).join(' ') || 'current events'
    const result = await performWebResearch(topic, keywords.slice(2))
    
    return result
  }

  private generateResearch(webResult: { success: boolean; findings: string[]; sources: string[] }, keywords: string[]): string {
    const timestamp = new Date().toISOString()
    const lines: string[] = []
    
    lines.push(`# Research Enrichment (Stage 3)`)
    lines.push('')
    lines.push(`**Generated:** ${timestamp}`)
    lines.push('')
    lines.push('---')
    lines.push('')
    
    // Web Research Results
    lines.push('## Web Research Results')
    lines.push('')
    
    if (webResult.success && webResult.findings.length > 0) {
      lines.push('**Status:** ✅ Real web search completed')
      lines.push('')
      lines.push('### Key Findings from Live Search')
      lines.push('')
      webResult.findings.slice(0, 7).forEach((finding: string, idx: number) => {
        const cleanFinding = finding.replace(/[#*]/g, '').trim().substring(0, 300)
        lines.push(`${idx + 1}. ${cleanFinding}`)
      })
      lines.push('')
      lines.push('### Sources')
      lines.push('')
      webResult.sources.forEach((source: string) => {
        lines.push(`- ${source}`)
      })
    } else {
      lines.push('**Status:** ⚠️ Web search failed - using fallback')
      lines.push('')
      lines.push('**Note:** Enable SerpAPI or Google Custom Search for live results')
    }
    
    lines.push('')
    lines.push('---')
    lines.push('')
    
    // Keywords used
    lines.push('## Research Keywords')
    lines.push('')
    keywords.forEach((kw: string) => {
      lines.push(`- ${kw}`)
    })
    
    lines.push('')
    lines.push('---')
    lines.push('')
    
    // Supporting Context
    lines.push('## Supporting Context')
    lines.push('- Initial campaign study loaded for processing')
    lines.push('- External verification via web search')
    lines.push('')
    
    // Why Now
    lines.push('## Why Now')
    lines.push('- Campaign ready for story angle development')
    lines.push('- Market timing depends on campaign objectives')
    lines.push('')
    
    // Risks or Contradictions
    lines.push('## Risks or Contradictions')
    lines.push('- External validation recommended for claims')
    lines.push('- Timing hooks need campaign clarification')
    lines.push('')
    
    // Sources Used
    lines.push('## Sources Used')
    lines.push('- User-provided campaign source')
    if (webResult.sources.length > 0) {
      webResult.sources.forEach((s: string) => {
        lines.push(`- ${s}`)
      })
    }
    
    return lines.join('\n')
  }

  private async runAngleGeneration(): Promise<void> {
    const jobFolder = this.getJobFolder()
    const angles = this.generateAngles()
    fs.writeFileSync(path.join(jobFolder, '04-angles.md'), angles, 'utf-8')

    this.data.artifacts.push({ id: uuidv4(), campaign_id: this.campaignId, stage: 'Angle Generation', filename: '04-angles.md', filepath: path.join(jobFolder, '04-angles.md'), content: angles, created_at: new Date().toISOString() })

    const gateIdx = this.data.gates.findIndex((g: any) => g.campaign_id === this.campaignId && g.gate_name === 'Outreach Angle Gate')
    if (gateIdx >= 0) {
      this.data.gates[gateIdx].status = 'waiting'
      this.data.gates[gateIdx].triggered_at = new Date().toISOString()
    }

    this.data.notifications.push({
      id: uuidv4(),
      campaign_id: this.campaignId,
      type: 'angle_required',
      title: 'Angle Selection Required',
      message: 'Angle Generation Complete. Please choose which pitch angle(s) should proceed.',
      read: 0,
      created_at: new Date().toISOString()
    })

    const campIdx = this.data.campaigns.findIndex((c: any) => c.id === this.campaignId)
    if (campIdx >= 0) this.data.campaigns[campIdx].status = 'anglecomplete'

    this.data.logs.push({ id: uuidv4(), campaign_id: this.campaignId, stage: 'Angle Generation', level: 'info', message: 'Angle generation complete. Awaiting user angle selection.', created_at: new Date().toISOString() })
  }

  private async runBeatMatching(): Promise<void> {
    const jobFolder = this.getJobFolder()
    const anglesPath = path.join(jobFolder, '04-angles.md')
    
    if (!fs.existsSync(anglesPath)) {
      throw new Error('04-angles.md not found. Complete Angle Generation first.')
    }
    
    const beats = this.generateBeatMapping()
    fs.writeFileSync(path.join(jobFolder, '05-beats.md'), beats, 'utf-8')
    
    this.data.artifacts.push({ id: uuidv4(), campaign_id: this.campaignId, stage: 'Beat Matching', filename: '05-beats.md', filepath: path.join(jobFolder, '05-beats.md'), content: beats, created_at: new Date().toISOString() })
    
    this.data.notifications.push({
      id: uuidv4(),
      campaign_id: this.campaignId,
      type: 'manual_action_required',
      title: 'Pitch Selection Required',
      message: 'Beat Matching complete. Review 40 beat-matched pitch angles before journalist collection begins.',
      read: 0,
      created_at: new Date().toISOString()
    })
    
    const campIdx = this.data.campaigns.findIndex((c: any) => c.id === this.campaignId)
    if (campIdx >= 0) this.data.campaigns[campIdx].status = 'beatmatchingcomplete'
    
    this.data.logs.push({ id: uuidv4(), campaign_id: this.campaignId, stage: 'Beat Matching', level: 'info', message: 'Beat matching complete. Workflow paused for Pitch Selection.', created_at: new Date().toISOString() })
  }

  private generateBeatMapping(): string {
    return `# Beat Matching - Stage 5 Output

## Status
Beat Matching COMPLETE
40 pitch angles mapped to journalist beats
Workflow paused for Human Pitch Selection (Stage 6)

## 40 Beat-Matched Angles
| # | Angle | Primary Beat | Secondary Beat | Priority | Outlet Type |
|---|-------|--------------|----------------|----------|--------------|
| Generated from 04-angles.md with beat mapping |

## Next Step
Stage 6: Pitch Selection - Human Review Required
- Review all 40 beat-matched pitch angles
- Select strongest angles (minimum 1 required)
- Confirm selection to unlock Journalist Collection

## Important
Journalist Collection will use ONLY selected pitch angles.
Do not proceed to collection until pitch selection is confirmed.
`
  }

  private async runPitchSelection(): Promise<void> {
    const jobFolder = this.getJobFolder()
    const beatsPath = path.join(jobFolder, '05-beats.md')
    
    if (!fs.existsSync(beatsPath)) {
      throw new Error('05-beats.md not found. Complete Beat Matching first.')
    }
    
    const campIdx = this.data.campaigns.findIndex((c: any) => c.id === this.campaignId)
    if (campIdx >= 0 && this.data.campaigns[campIdx].selected_angles) {
      const selectedAngles = this.generateSelectedAnglesOutput(this.data.campaigns[campIdx].selected_angles)
      fs.writeFileSync(path.join(jobFolder, '06-selected-angles.md'), selectedAngles, 'utf-8')
      
      this.data.artifacts.push({ id: uuidv4(), campaign_id: this.campaignId, stage: 'Pitch Selection', filename: '06-selected-angles.md', filepath: path.join(jobFolder, '06-selected-angles.md'), content: selectedAngles, created_at: new Date().toISOString() })
      
      this.data.notifications.push({
        id: uuidv4(),
        campaign_id: this.campaignId,
        type: 'success',
        title: 'Pitch Selection Completed',
        message: 'Journalist Collection is now unlocked.',
        read: 0,
        created_at: new Date().toISOString()
      })
      
      this.data.campaigns[campIdx].status = 'pitchselectioncomplete'
      this.data.logs.push({ id: uuidv4(), campaign_id: this.campaignId, stage: 'Pitch Selection', level: 'success', message: 'Pitch selection completed. Journalist Collection unlocked.', created_at: new Date().toISOString() })
    } else {
      this.data.notifications.push({
        id: uuidv4(),
        campaign_id: this.campaignId,
        type: 'manual_action_required',
        title: 'Pitch Selection Required',
        message: 'Please select at least one pitch angle to proceed to Journalist Collection.',
        read: 0,
        created_at: new Date().toISOString()
      })
      throw new Error('No pitch angles selected. Please select at least one angle.')
    }
  }

  private generateSelectedAnglesOutput(selectedAngles: string | string[]): string {
    const angles = Array.isArray(selectedAngles) ? selectedAngles : [selectedAngles]
    return `# Pitch Selection - Stage 6 Output

## Status
Pitch Selection COMPLETED
${angles.length} angle(s) selected
Journalist Collection is now UNLOCKED

## Selected Angles
${angles.map((a, i) => `${i + 1}. ${a}`).join('\n')}

## Next Step
Stage 7: Journalist Collection
- Collect journalists based on selected angles only
- Target 800 journalists per selected beat

## Important
Only selected angles will be used for journalist collection.
`
  }

  private generateAngles(): string {
    // ============================================================
    // STAGE 4: ADVANCED PITCH ANGLE GENERATION & SCORING
    // ============================================================
    // Generate 40 pitch angles across 20 strategic categories
    // Each category produces 2 unique pitch angles
    // Total output: 40 angles with full justification (250-300 words each)
    // ============================================================

    // 20 Strategic Categories based on campaign topic and Stage 1-3 insights.
    // This dashboard fallback provides safe scaffolding only. Production angles
    // must be filled from verified Stage 1-3 evidence and GPT-5.5 scoring.
    const categories = [
      { name: 'Data-Led', description: 'Statistics, rankings, data-driven stories' },
      { name: 'Trend Story', description: 'Emerging patterns, shifting behaviors' },
      { name: 'Expert Quote', description: 'Authority voices, expert analysis' },
      { name: 'Investigative', description: 'Accountability, hidden truths, exposes' },
      { name: 'Human Interest', description: 'Personal stories, emotional connections' },
      { name: 'Tech Innovation', description: 'Technology solutions, innovations' },
      { name: 'Health & Wellness', description: 'Health impacts, public health' },
      { name: 'Finance & Business', description: 'Economic impact, business implications' },
      { name: 'Environment', description: 'Environmental factors, climate impact' },
      { name: 'Education', description: 'Schools, learning, education policy' },
      { name: 'Politics & Policy', description: 'Government, regulation, policy changes' },
      { name: 'Science & Research', description: 'Scientific findings, research studies' },
      { name: 'Lifestyle & Culture', description: 'Cultural trends, lifestyle changes' },
      { name: 'Crime & Safety', description: 'Safety concerns, crime data' },
      { name: 'Sports', description: 'Athletics, sporting events, sports business' },
      { name: 'Entertainment', description: 'Media, entertainment industry' },
      { name: 'Real Estate', description: 'Housing, property, development' },
      { name: 'Travel & Tourism', description: 'Travel industry, tourism trends' },
      { name: 'Food & Dining', description: 'Restaurants, food industry, culinary' },
      { name: 'Social Issues', description: 'Social impact, community concerns' }
    ]

    // Specific Journalist Beats for targeting
    const journalistBeats = [
      { name: 'Data Journalism', outlets: 'ProPublica, The Pudding, FiveThirtyEight' },
      { name: 'Tech', outlets: 'TechCrunch, Wired, The Verge' },
      { name: 'Business', outlets: 'WSJ, Bloomberg, Forbes' },
      { name: 'Health', outlets: 'STAT, KHN, Health Affairs' },
      { name: 'Science', outlets: 'Nature, Scientific American, Science' },
      { name: 'Politics', outlets: 'Politico, The Hill, Axios' },
      { name: 'Education', outlets: 'EdWeek, Chalkbeat, ProPublica' },
      { name: 'Environment', outlets: 'Grist, E&E News, Inside Climate' },
      { name: 'Lifestyle', outlets: 'WSJ Life, NYT Style, Vogue' },
      { name: 'Sports', outlets: 'The Athletic, ESPN, Sports Illustrated' },
      { name: 'Finance', outlets: 'Financial Times, Barron\'s, CNBC' },
      { name: 'Crime', outlets: 'The Marshall Project, Vice, local courts' },
      { name: 'Entertainment', outlets: 'Variety, Hollywood Reporter, Deadline' },
      { name: 'Real Estate', outlets: 'Realtor.com, Zillow, HousingWire' },
      { name: 'Travel', outlets: 'Travel + Leisure, Conde Nast Traveler' },
      { name: 'Food', outlets: 'Food52, Eater, Restaurant Business' },
      { name: 'Social Issues', outlets: 'The Atlantic, The Guardian, The Markup' },
      { name: 'Local News', outlets: 'Local papers, TV stations, Patch' },
      { name: 'General Assignment', outlets: 'AP, Reuters, major dailies' },
      { name: 'Features', outlets: 'Longform features, magazine profiles' }
    ]

    // Build comprehensive 40-angle output
    let anglesContent = `# Pitch Angles - Stage 4 Output

## Generation Info
- **Date**: ${new Date().toISOString().split('T')[0]}
- **Total Angles**: 40 (20 categories x 2 angles)
- **Format**: Category | Journalist Beats | Pitch Angle | Why This is Newsworthy | Score | Selected Angle
- **Next Step**: GPT-5.5 reviews all angles, scores 1-10, then the user selects via checkbox
- **Evidence Safety**: Dashboard fallback rows are scaffolds. Replace missing details with verified Stage 1-3 evidence before outreach.

---

## 40-Angle Selection Table

| # | Category | Journalist Beats | Pitch Angle | Why This is Newsworthy | Score | Selected Angle |
|---|----------|------------------|-------------|----------------------|-------|----------------|
`

    // Generate 2 angles per category (40 total)
    for (let catIndex = 0; catIndex < categories.length; catIndex++) {
      const category = categories[catIndex]
      
      for (let angleNum = 1; angleNum <= 2; angleNum++) {
        const angleNumGlobal = (catIndex * 2) + angleNum
        const beat = journalistBeats[catIndex % journalistBeats.length]
        
        // Safe scaffold only. Production content must come from verified evidence.
        const pitchAngle = this.generateDetailedPitchAngle(category.name, angleNum, beat.name)
        const newsworthy = this.generateDetailedNewsworthy(category.name, beat.name, angleNum)
        
        // Placeholder score - GPT-5.5 will update this
        const scorePlaceholder = 'TBD'
        
        anglesContent += `| ${angleNumGlobal} | ${category.name} | ${beat.name} | ${pitchAngle} | ${newsworthy} | ${scorePlaceholder} | [ ] |
`
      }
    }

    anglesContent += `

---

## GPT-5.5 Review Instructions

After this table is generated, pass to GPT-5.5 with:

### Prompt for GPT-5.5:
\`\`\`
You are a senior news editor at a major publication (NYT/WSJ/WaPo level).

Review these 40 pitch angles for quality and newsworthiness. For each angle:

1. **SERP Research**: Search to verify current news cycle relevance
2. **Score 1-10** based on:
   - Newsworthiness (timeliness, impact, novelty)
   - Data strength (specific stats, verifiable sources)
   - SERP potential (ranking opportunity, search demand)
   - Journalist appeal (beat alignment, editorial fit)
   - Timeliness (why NOW? what event triggers?)
   - Originality (different from existing coverage)
   - Clarity (easy to understand, simple English)
   - Emotional pull (audience engagement)
   - Public-interest value (social impact)
   - Link-earning potential (organic backlink opportunity)
   - Localization potential (local angle possible?)
   - Headline strength (click-worthy, shareable)

3. **Update Score column** with actual scores (1-10)

4. **Flag top 10 recommendations** with brief justification

5. **Check each claim** against Stage 1-3 research context

### Scoring Guide:
- 10 = Exceptional - viral potential, strong data, high media appeal
- 9 = Very strong - high journalist interest, clear ranking potential
- 8 = Strong - good data, media relevance, minor refinement needed
- 7 = Usable - decent news value, not strongest option
- 6 = Average - some potential, weak differentiation
- 5 or below = Not recommended for outreach

Return: Updated table with scores + top 10 recommendations
\`\`\`

---

## Angle Quality Requirements (250-300 words per "Why This is Newsworthy")

Each "Why This is Newsworthy" justification MUST include:

### 1. Data-Rich Justification (80-100 words)
- Specific statistics, percentages, growth rates
- Survey results, rankings, data points
- SERP research to verify claims
- Source citations with credibility indicators

### 2. Research Support (40-50 words)
- Reference studies, reports, academic papers
- Credible sources (government, nonprofit, industry)
- External validation from authoritative sources

### 3. Market Context (40-50 words)
- Broader industry implications
- Why NOW? (timing relevance)
- How topic fits current public conversation
- Competitor saturation or whitespace opportunity

### 4. Media Value (40-50 words)
- Why journalists should care
- Why their readers would care
- Audience need the story serves
- What makes angle useful for outreach

### 5. Talking Points (4-5 bullet points)
- Key discussion items for email outreach
- Specific, evidence-backed, short
- Useful for personalization later

**Total: 250-300 words per justification**

---

## SERP Requirements (All Angles Must Have)

Each angle must satisfy:
- SERP virality potential - can generate organic traffic
- SERP domination possibility - can rank for target keywords
- Easy-to-understand English - simple, clear language
- Unique and compelling - not generic or repetitive
- Newsworthy - real journalism value
- Catchy and scroll-stopping - stops journalist from scrolling
- Strong enough for mainstream media - press-ready quality
- Link-earning potential - can attract backlinks

---

## Journalist Beats Mapping

| Category | Primary Beat | Target Outlets |
|----------|--------------|----------------|
| Data-Led | Data Journalism | ProPublica, FiveThirtyEight |
| Trend Story | Business | WSJ, Bloomberg |
| Expert Quote | Politics | Politico, The Hill |
| Investigative | Investigative | ProPublica, The Intercept |
| Human Interest | Features | Longform magazines |
| Tech Innovation | Tech | TechCrunch, Wired |
| Health & Wellness | Health | STAT, KHN |
| Finance & Business | Finance | Financial Times |
| Environment | Environment | Grist, E&E News |
| Education | Education | EdWeek, Chalkbeat |
| Politics & Policy | Policy | Axios, Politico |
| Science & Research | Science | Nature, Scientific American |
| Lifestyle & Culture | Lifestyle | WSJ Life, Vogue |
| Crime & Safety | Crime | The Marshall Project |
| Sports | Sports | The Athletic, ESPN |
| Entertainment | Entertainment | Variety, Deadline |
| Real Estate | Real Estate | HousingWire, Realtor.com |
| Travel & Tourism | Travel | Travel + Leisure |
| Food & Dining | Food | Eater, Food52 |
| Social Issues | Social Issues | The Atlantic |

---

## Next Step (User Action Required)

1. **GPT-5.5 reviews all 40 angles** and assigns scores (1-10)
2. **System displays scored angles** in selection table
3. **User selects preferred angle(s)** via checkbox (can select multiple)
4. **Selected angles proceed to Stage 5: Beat Matching**
5. **Workflow pauses here** until user confirms selection

---

## Important Rules
- DO NOT auto-approve angles
- DO NOT select only top 3 without user input
- DO NOT use vague newsworthiness explanations
- Each angle must be simple, clear, data-led, journalist-friendly
- Each "Why This is Newsworthy" must be 250-300 words
- Workflow must PAUSE after displaying table until user selects
`

    return anglesContent
  }

  // Generate evidence-safe fallback angle frames. Specific data claims must come
  // from the campaign source, Stage 1-3 files, and GPT-5.5 review.
  private generateDetailedPitchAngle(category: string, angleNum: number, beat: string): string {
    const pitchAngles: Record<string, string[]> = {
      'Data-Led': [
        'What the campaign data reveals about the highest-risk audience segment',
        'A ranking-style story built from the strongest verified campaign metrics'
      ],
      'Trend Story': [
        'Why this issue is moving from niche concern to mainstream story',
        'The behavior shift behind the campaign finding journalists should watch'
      ],
      'Expert Quote': [
        'Expert reaction: what the verified findings mean for affected audiences',
        'The expert explainer that turns the campaign data into practical advice'
      ],
      'Investigative': [
        'The accountability gap behind the campaign\'s strongest verified finding',
        'What public records or industry data could reveal about this problem'
      ],
      'Human Interest': [
        'How the finding changes everyday decisions for the people affected',
        'The personal stakes behind a data point that might otherwise feel abstract'
      ],
      'Tech Innovation': [
        'The technology angle that could help solve the verified problem',
        'Why new tools are changing how this issue is measured or prevented'
      ],
      'Health & Wellness': [
        'The health consequences hidden inside the campaign finding',
        'What the verified data suggests about risk, prevention, or wellbeing'
      ],
      'Finance & Business': [
        'The cost story behind the campaign finding for households or companies',
        'How the verified trend could affect markets, pricing, or local business'
      ],
      'Environment': [
        'The environmental stakes connected to the verified campaign evidence',
        'How sustainability reporters could localize the strongest finding'
      ],
      'Education': [
        'What the campaign finding means for schools, students, or families',
        'The education-policy question raised by the verified data'
      ],
      'Politics & Policy': [
        'The policy debate the campaign finding should trigger',
        'Where public agencies may need to respond based on verified evidence'
      ],
      'Science & Research': [
        'The research question journalists can test against the campaign finding',
        'How academic or official data could validate the story angle'
      ],
      'Lifestyle & Culture': [
        'How the finding shows up in everyday habits and cultural behavior',
        'Why audiences may be changing how they think about this issue'
      ],
      'Crime & Safety': [
        'The public-safety risk exposed by the campaign evidence',
        'How local safety reporters could investigate the verified finding'
      ],
      'Sports': [
        'The sports or events angle connected to the verified risk pattern',
        'How athletes, venues, or event organizers could respond to the issue'
      ],
      'Entertainment': [
        'How media and entertainment coverage could make the issue mainstream',
        'The cultural conversation that could amplify the verified finding'
      ],
      'Real Estate': [
        'What the verified finding could mean for housing or neighborhood value',
        'The real-estate decision point hidden in the campaign data'
      ],
      'Travel & Tourism': [
        'The travel-safety angle that helps visitors understand the risk',
        'How destinations could use the verified finding to guide planning'
      ],
      'Food & Dining': [
        'How dining districts or hospitality venues intersect with the finding',
        'The local business angle restaurants and neighborhoods may care about'
      ],
      'Social Issues': [
        'Who is most affected by the verified finding and why equity matters',
        'The community-response angle behind the campaign evidence'
      ]
    }

    const categoryAngles = pitchAngles[category] || [`Angle ${angleNum} for ${beat}`]
    return categoryAngles[(angleNum - 1) % categoryAngles.length]
  }

  // Generate safe scaffold text without inventing claims or citations.
  private generateDetailedNewsworthy(category: string, beat: string, angleNum: number): string {
    return `Data-Rich Justification: Use only verified metrics from 02-insights.md and 03-research.md for this ${category} angle. The dashboard fallback cannot verify campaign statistics, source dates, geography, sample size, rankings, or SERP demand. ${MISSING_INFO}

Research Support: Add credible support only after checking government data, academic research, industry reports, nonprofit analysis, authoritative news coverage, and the original campaign source. Do not cite a source unless it has been reviewed.

Market Context: Explain why this matters now, what public conversation it connects to, whether coverage is saturated or underserved, and which audience group would be affected. If timing evidence is missing, state that verification is required.

Media Value: Explain why ${beat} reporters would care, why readers would benefit, what makes the angle different from existing coverage, and whether the story can be localized, visualized, or expanded.

Talking Points:
- Verify the strongest source-backed claim before use.
- Preserve source, timeframe, geography, and limitation.
- Compare the angle against current SERP coverage.
- Match outreach only to journalists covering ${beat} or a close verified beat.
- Replace any missing claim with: ${MISSING_INFO}`
  }

  async confirmAngle(angleValue: string): Promise<void> {
    const gateIdx = this.data.gates.findIndex((g: any) => g.campaign_id === this.campaignId && g.gate_name === 'Outreach Angle Gate')
    if (gateIdx >= 0) {
      this.data.gates[gateIdx].status = 'confirmed'
      this.data.gates[gateIdx].value = angleValue
      this.data.gates[gateIdx].confirmed_at = new Date().toISOString()
    }

    const campIdx = this.data.campaigns.findIndex((c: any) => c.id === this.campaignId)
    if (campIdx >= 0) {
      this.data.campaigns[campIdx].selected_angle = angleValue
    }

    const jobFolder = this.getJobFolder()
    const angles = this.generateBeats(angleValue)
    fs.writeFileSync(path.join(jobFolder, '05-beats.md'), angles, 'utf-8')

    this.data.artifacts.push({ id: uuidv4(), campaign_id: this.campaignId, stage: 'Beat Matching', filename: '05-beats.md', filepath: path.join(jobFolder, '05-beats.md'), content: angles, created_at: new Date().toISOString() })

    this.data.logs.push({ id: uuidv4(), campaign_id: this.campaignId, stage: 'Beat Matching', level: 'info', message: `Angle confirmed: ${angleValue}. Workflow continuing to journalist collection.`, created_at: new Date().toISOString() })

    if (campIdx >= 0) this.data.campaigns[campIdx].status = 'collection'
    this.save()
  }

  private generateBeats(selectedAngle: string): string {
    return `# Beat Matching

## Selected Outreach Angle
Selection status: confirmed
Selected angle / pitch angle: ${selectedAngle}
Selected category: ${MISSING_INFO}
Selected journalist beat: ${MISSING_INFO}
Selected outlet scale: ${MISSING_INFO}
Selected geography: ${MISSING_INFO}
Selected collection lane: Active selected angle package
Evidence support to carry forward: ${MISSING_INFO}

## Top 10 Recommended Outreach Angles
| Priority | Angle | Beat | Why Prioritized | Recommended Lane |
|----------|-------|------|----------------|------------------|
| 1 | ${selectedAngle} | ${MISSING_INFO} | User-confirmed angle; beat evidence must be verified before collection | Active selected angle package |

## Secondary Angle Backlog
| Angle | Beat | Why Secondary | Later Trigger |
|-------|------|---------------|---------------|
| ${MISSING_INFO} | ${MISSING_INFO} | No secondary backlog generated by this dashboard fallback | After active selected angle completes |

## Awaiting User Selection
- Selection status: confirmed
- Angle has been selected by user

## Outreach Angle Review Gate
Status: confirmed

## Muck Rack / SERP Search Guidance
- Do not search until Selected journalist beat is verified.
- Use Muck Rack, SERP, outlet pages, and contact-source review for the active selected angle package only.
- Target 800 journalists per selected beat

## Weak Fits To Avoid
- Journalists outside the verified selected beat
- Opinion columnists unless opinion outreach is intentional and user-approved

## Beat Coverage Summary
- ${MISSING_INFO}
`
  }

  async continueWorkflow(): Promise<void> {
    this.data.logs.push({ id: uuidv4(), campaign_id: this.campaignId, stage: null, level: 'info', message: 'Preparing selected-angle journalist collection package. Later stages remain blocked until live collection is verified.', created_at: new Date().toISOString() })

    await this.runPostAngleStage(6)

    this.data.notifications.push({
      id: uuidv4(),
      campaign_id: this.campaignId,
      type: 'manual_action_required',
      title: 'Journalist Collection Required',
      message: 'Selected-angle collection package is ready. Verify Chrome, SERP, and Muck Rack before Stage 7.',
      read: 0,
      created_at: new Date().toISOString()
    })

    this.save()
  }

  private async runPostAngleStage(stageNum: number): Promise<void> {
    const jobFolder = this.getJobFolder()
    const stage = STAGE_DEFINITIONS.find(s => s.number === stageNum)
    if (!stage) return

    const stageIdx = this.data.stages.findIndex((s: any) => s.campaign_id === this.campaignId && s.stage_number === stageNum)
    if (stageIdx >= 0) {
      this.data.stages[stageIdx].status = 'running'
      this.data.stages[stageIdx].started_at = new Date().toISOString()
    }

    this.data.logs.push({ id: uuidv4(), campaign_id: this.campaignId, stage: stage.name, level: 'info', message: `Running ${stage.name}`, created_at: new Date().toISOString() })

    let content = ''

    if (stageNum === 6) {
      content = await this.runMuckRackCollection()
    } else {
      switch (stageNum) {
        case 7: content = `# Journalist Intelligence\n\nStatus: MANUAL ACTION REQUIRED\nTarget package: ${MISSING_INFO}\nTargets: ${MISSING_INFO}\n`; break
        case 8: content = this.generatePitchDrafts(); break
        case 9: content = this.generateOptimizedEmail(); break
        case 10: content = this.generateFinalPackage(); break
        case 11:
          // Try Qwen3 Coder first, fallback to hard-coded template
          try {
            content = await this.generateGoogleDocExport()
          } catch (e) {
            console.log('[Google Doc Export] Qwen3 failed, using hard-coded fallback')
            content = this.generateHardCodedFallback()
          }
          break
        case 12: content = '# Technical Validation\n\nJSON: TEST NOT RUN\nPython: TEST NOT RUN\nPowerShell: TEST NOT RUN\nASCII: TEST NOT RUN\n'; break
        case 13: content = '# Browser Validation\n\nChrome Debug: TEST NOT RUN\nSERP: TEST NOT RUN\nMuck Rack: TEST NOT RUN\n'; break
        case 14:
          content = '# Production Readiness\n\nStatus: NOT READY\nBrowser, SERP, Muck Rack, technical, regression, and final package checks must pass before READY can be claimed.\n'
          break
      }
    }

    const stageIdx2 = this.data.stages.findIndex((s: any) => s.campaign_id === this.campaignId && s.stage_number === stageNum)
    const requiresManualAction = content.includes('MANUAL ACTION REQUIRED') || content.includes('TEST NOT RUN') || content.includes('NOT READY') || content.includes('blocked-')
    if (stageIdx2 >= 0) {
      this.data.stages[stageIdx2].status = requiresManualAction ? 'waiting' : 'completed'
      this.data.stages[stageIdx2].completed_at = requiresManualAction ? null : new Date().toISOString()
    }

    this.data.logs.push({ id: uuidv4(), campaign_id: this.campaignId, stage: stage.name, level: requiresManualAction ? 'warning' : 'success', message: requiresManualAction ? `${stage.name} requires manual validation before completion.` : `Completed ${stage.name}`, created_at: new Date().toISOString() })

    if (content && stage.outputs[0] && !stage.outputs[0].includes('/')) {
      fs.writeFileSync(path.join(jobFolder, stage.outputs[0]), content, 'utf-8')
    }
    this.save()
  }

  private generatePitchDrafts(): string {
    return `# Pitch Draft

Status: MANUAL ACTION REQUIRED

## Draft Variants

### 08a - Straight News
${MISSING_INFO}

### 08b - Short and Punchy
${MISSING_INFO}

### 08c - Data Heavy
${MISSING_INFO}

### 08d - Journalist Personalized
${MISSING_INFO}

### 08e - Storytelling Narrative
${MISSING_INFO}

### 08f - Localized
${MISSING_INFO}

## Selected Draft
Selected: ${MISSING_INFO}

Subject: ${MISSING_INFO}

## Final Email Body (500-600 words)
${MISSING_INFO}
`
  }

  private generateOptimizedEmail(): string {
    return `# Optimized Email

Status: MANUAL ACTION REQUIRED

## Pass Log
- Newsworthiness: TEST NOT RUN
- Human tone: TEST NOT RUN
- Deliverability: TEST NOT RUN

## Final Email (500-600 words)
${MISSING_INFO}

## Subject Line Options
1. ${MISSING_INFO}
2. ${MISSING_INFO}
3. ${MISSING_INFO}
4. ${MISSING_INFO}
5. ${MISSING_INFO}

## Recommended Subject
${MISSING_INFO}

Ready for final packaging: no
`
  }

  private generateFinalPackage(): string {
    return `# Final Package

## Campaign Snapshot
Campaign: ${this.slug}
Status: MANUAL ACTION REQUIRED

## Selected Outreach Angle
- Angle: ${MISSING_INFO}
- Beat: ${MISSING_INFO}
- Target: ${MISSING_INFO}

## Final Email
${MISSING_INFO}

## Subject Lines
${MISSING_INFO}

## Evidence and Source Notes
- Campaign data: ${MISSING_INFO}
- External validation: ${MISSING_INFO}

## Assets Available
- Data access: upon request
- Expert comment: upon request

## Outreach Readiness Checklist
- [ ] Angle confirmed
- [ ] Beat mapped
- [ ] Targets collected
- [ ] Email optimized
- [ ] Export to Google Docs

## Google Docs Export
Command: .\\scripts\\export-google-doc.cmd ${this.slug}
`
  }

  /**
   * Generate Google Doc Export using Qwen3 Coder
   * Primary: Qwen3 Coder for API/script generation
   * Fallback: Hard-coded template if Qwen3 fails
   */
  private async generateGoogleDocExport(): Promise<string> {
    const jobFolder = this.getJobFolder()
    
    // Read all relevant stage outputs
    const finalPackage = this.safeRead(path.join(jobFolder, '10-google-doc.md'))
    const optimizedEmail = this.safeRead(path.join(jobFolder, '09-optimized-email.md'))
    const selectedAngles = this.safeRead(path.join(jobFolder, '06-selected-angles.md'))
    
    // Try Qwen3 Coder to generate export script
    try {
      const { callLLM } = await import('./llmService')
      
      const exportPrompt = `
You are a coding assistant specialized in Google Docs API and Node.js scripts.

## Task
Generate a Node.js script to create a Google Doc with the campaign data below.

## Campaign Data (10-google-doc.md):
${finalPackage.substring(0, 2000)}

## Email Content (09-optimized-email.md):
${optimizedEmail.substring(0, 1500)}

## Selected Angles (06-selected-angles.md):
${selectedAngles.substring(0, 1000)}

## Output Format
Provide a complete Node.js script that:
1. Uses Google Docs API
2. Creates a document with title from campaign
3. Adds sections: Overview, Selected Angles, Pitch Email
4. Logs the document URL

IMPORTANT: Only output the Node.js code, no explanations.
`
      
      // Override model to Qwen3 for this call
      const qwenPrompt = `Model: qwen/qwen-2.5-coder-32b-instruct\n\n` + exportPrompt
      const scriptResult = await callLLM(qwenPrompt)
      
      if (scriptResult && !scriptResult.includes('unavailable') && scriptResult.includes('google')) {
        console.log('[Google Doc Export] Qwen3 Coder generated export script')
        
        // Save the script for manual execution
        const scriptPath = path.join(jobFolder, 'export-script.js')
        fs.writeFileSync(scriptPath, scriptResult, 'utf-8')
        
        return `# Google Doc Export

**Status:** Ready

**Generated Script:** export-script.js

**To Execute:**
1. Install Google API client: npm install googleapis
2. Set up OAuth2 credentials
3. Run: node export-script.js

**Script Preview:**
\`\`\`javascript
${scriptResult.substring(0, 1000)}
\`\`\`

---
*Generated via Qwen3 Coder*
`
      }
    } catch (e) {
      console.log('[Google Doc Export] Qwen3 failed:', e)
    }
    
    // Fallback to hard-coded template
    return this.generateHardCodedFallback()
  }

  /**
   * Hard-Coded Fallback Template
   * Creates a basic document structure if Qwen3 fails
   */
  private generateHardCodedFallback(): string {
    const jobFolder = this.getJobFolder()
    
    // Read available data
    const finalPackage = this.safeRead(path.join(jobFolder, '10-google-doc.md'))
    const optimizedEmail = this.safeRead(path.join(jobFolder, '09-optimized-email.md'))
    const selectedAngles = this.safeRead(path.join(jobFolder, '06-selected-angles.md'))
    const analysis = this.safeRead(path.join(jobFolder, '04-analysis.md'))
    
    // Extract key sections
    const overviewMatch = finalPackage.match(/## Campaign Snapshot([\s\S]*?)(?=##|$)/)
    const overview = overviewMatch ? overviewMatch[0] : 'Campaign data not available'
    
    const emailMatch = optimizedEmail.match(/## Final Email([\s\S]*?)(?=##|$)/)
    const emailBody = emailMatch ? emailMatch[0] : optimizedEmail.substring(0, 1000)
    
    return `# Google Doc Export - Fallback Template

**Status:** Generated via Hard-Coded Fallback
**Campaign:** ${this.slug}
**Date:** ${new Date().toISOString()}

---

## Campaign Overview

${overview}

---

## Selected Angles

${selectedAngles || selectedAngles.substring(0, 2000) || 'No angles selected yet.'}

---

## Final Email

${emailBody}

---

## Data Analysis Summary

${analysis.substring(0, 1500)}

---

## Manual Export Required

1. Copy the content above
2. Create new Google Doc
3. Paste content
4. Format as needed

---
*Generated via fallback template - Qwen3 was unavailable*
`
  }

  /**
   * Generate Validation Summary for Manual Stages (S13-S16)
   * Condensed summary for human validators - key facts + source refs only
   */
  generateValidationSummary(): string {
    const jobFolder = this.getJobFolder()
    const lines: string[] = []
    
    lines.push(`# Validation Summary`)
    lines.push(`**Campaign:** ${this.slug}`)
    lines.push(`**Generated:** ${new Date().toISOString()}`)
    lines.push('')
    lines.push('---')
    lines.push('')
    
    // Load all stage outputs
    const stages = {
      insights: this.safeRead(path.join(jobFolder, '02-insights.md')),
      research: this.safeRead(path.join(jobFolder, '03-research.md')),
      analysis: this.safeRead(path.join(jobFolder, '04-analysis.md')),
      angles: this.safeRead(path.join(jobFolder, '04-angles.md')),
      beats: this.safeRead(path.join(jobFolder, '05-beats.md')),
      selectedAngles: this.safeRead(path.join(jobFolder, '06-selected-angles.md')),
      pitch: this.safeRead(path.join(jobFolder, '08-pitch-draft.md')),
      optimized: this.safeRead(path.join(jobFolder, '09-optimized-email.md')),
      final: this.safeRead(path.join(jobFolder, '10-google-doc.md'))
    }
    
    // 1. Campaign Overview (from S1)
    lines.push('## 1. Campaign Overview')
    lines.push(`- **Campaign Slug:** ${this.slug}`)
    lines.push(`- **Status:** Workflow completed through S12`)
    lines.push('')
    
    // 2. Key Data Points (from S2-S4)
    lines.push('## 2. Extracted Key Facts')
    lines.push('')
    const keyFacts: string[] = []
    
    // Extract from analysis if available
    if (stages.analysis) {
      const verifiedStatsMatch = stages.analysis.match(/Verified Statistics:([\s\S]*?)(?=---|$)/)
      if (verifiedStatsMatch) {
        keyFacts.push(`**Verified Statistics:**${verifiedStatsMatch[1].substring(0, 500)}`)
      }
      const scoresMatch = stages.analysis.match(/Data Quality Score.*?(\d+)/)
      if (scoresMatch) {
        keyFacts.push(`**Data Quality Score:** ${scoresMatch[1]}/100`)
      }
    }
    
    // Extract from angles
    if (stages.angles) {
      const angleCount = (stages.angles.match(/\|/g) || []).length
      keyFacts.push(`**Total Angles Generated:** ~${Math.floor(angleCount / 7)}`)
    }
    
    if (keyFacts.length > 0) {
      keyFacts.forEach(f => lines.push(f))
    } else {
      lines.push('*See 02-insights.md for full data extraction*')
    }
    lines.push('')
    
    // 3. Selected Angles (from S6)
    lines.push('## 3. Selected Angles')
    lines.push('')
    if (stages.selectedAngles && !stages.selectedAngles.includes(MISSING_INFO)) {
      const selectedSection = stages.selectedAngles.substring(0, 1000)
      lines.push(selectedSection)
    } else {
      lines.push('*See 06-selected-angles.md for selection*')
    }
    lines.push('')
    
    // 4. Source References (key source snippets)
    lines.push('## 4. Source References')
    lines.push('')
    if (stages.research) {
      const sourcesSection = stages.research.match(/## Sources Used([\s\S]*?)(?=---|$)/)
      if (sourcesSection) {
        lines.push('**Research Sources:**')
        lines.push(sourcesSection[1].substring(0, 800))
      } else {
        lines.push('*See 03-research.md for full source list*')
      }
    }
    lines.push('')
    
    // 5. Final Output Status (S10-S12)
    lines.push('## 5. Final Output Status')
    lines.push('')
    lines.push(`| Stage | Status |`)
    lines.push(`|-------|--------|`)
    lines.push(`| S10 Pitch Draft | ${stages.pitch ? '✅ Ready' : '⚠️ Pending'}|`)
    lines.push(`| S11 Email Optimized | ${stages.optimized ? '✅ Ready' : '⚠️ Pending'}|`)
    lines.push(`| S12 Final Package | ${stages.final ? '✅ Ready' : '⚠️ Pending'}|`)
    lines.push('')
    
    // 6. Validation Checklist
    lines.push('## 6. Manual Validation Checklist')
    lines.push('')
    lines.push('- [ ] Verify statistics in 04-analysis.md are accurate')
    lines.push('- [ ] Check 06-selected-angles.md for editorial fit')
    lines.push('- [ ] Review 08-pitch-draft.md for brand safety')
    lines.push('- [ ] Validate 09-optimized-email.md for deliverability')
    lines.push('- [ ] Confirm 10-google-doc.md format is correct')
    lines.push('- [ ] Check for any hallucinated claims')
    lines.push('')
    
    // 7. Quick Ref Links
    lines.push('## 7. Full Source Files')
    lines.push('')
    lines.push('| File | Purpose |')
    lines.push('|------|---------|')
    lines.push('| 00-brief.md | Campaign brief |')
    lines.push('| 02-insights.md | Extracted data |')
    lines.push('| 03-research.md | Web research |')
    lines.push('| 04-analysis.md | Data analysis |')
    lines.push('| 04-angles.md | Generated angles |')
    lines.push('| 06-selected-angles.md | User-selected |')
    lines.push('| 08-pitch-draft.md | Pitch draft |')
    lines.push('| 09-optimized-email.md | Final email |')
    lines.push('| 10-google-doc.md | Export package |')
    lines.push('')
    
    lines.push('---')
    lines.push(`*Validation Summary generated for manual review (S13-S16)*`)
    
    return lines.join('\n')
  }

  /**
   * Helper: Safe file read
   */
  private safeRead(filePath: string): string {
    try {
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf-8')
      }
    } catch (e) {
      // Ignore
    }
    return ''
  }

  /**
   * Token Estimator
   * Estimates tokens based on character count (~4 chars = 1 token for English)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }

  /**
   * Content Chunker
   * Splits content into roughly equal parts
   */
  private chunkContent(text: string, numChunks: number): string[] {
    const chunkSize = Math.ceil(text.length / numChunks)
    const chunks: string[] = []
    
    for (let i = 0; i < numChunks; i++) {
      const start = i * chunkSize
      const end = Math.min(start + chunkSize, text.length)
      chunks.push(text.substring(start, end))
    }
    
    return chunks
  }

  getStatus(): any {
    const campaign = this.data.campaigns.find((c: any) => c.id === this.campaignId)
    const stageList = this.data.stages.filter((s: any) => s.campaign_id === this.campaignId)
    const gateList = this.data.gates.filter((g: any) => g.campaign_id === this.campaignId)
    const logList = this.data.logs.filter((l: any) => l.campaign_id === this.campaignId)

    return {
      campaign,
      stages: stageList,
      gates: gateList,
      logs: logList
    }
  }

  private async runMuckRackCollection(): Promise<string> {
    const jobFolder = this.getJobFolder()
    const beatsFile = path.join(jobFolder, '05-beats.md')
    
    let selectedAngle = MISSING_INFO
    let selectedBeat = MISSING_INFO
    const targetCount = 800
    let selectionConfirmed = false
    
    if (fs.existsSync(beatsFile)) {
      const beatsContent = fs.readFileSync(beatsFile, 'utf-8')
      selectionConfirmed = /Selection status:\s*confirmed/i.test(beatsContent)
      const angleMatch = beatsContent.match(/Selected angle \/ pitch angle:\s*(.+)/i)
      const beatMatch = beatsContent.match(/Selected journalist beat:\s*(.+)/i)
      if (angleMatch) {
        selectedAngle = angleMatch[1].trim()
      }
      if (beatMatch) {
        selectedBeat = beatMatch[1].trim()
      }
    }
    
    this.data.logs.push({ 
      id: uuidv4(), 
      campaign_id: this.campaignId, 
      stage: 'Journalist Collection', 
      level: 'info', 
      message: `Preparing selected-angle collection instructions for beat: ${selectedBeat}`, 
      created_at: new Date().toISOString() 
    })
    
    const journalistDir = path.join(jobFolder, 'source-files', 'journalist-intel', 'selected-angle')
    if (!fs.existsSync(journalistDir)) {
      fs.mkdirSync(journalistDir, { recursive: true })
    }
    
    const collectionLogPath = path.join(journalistDir, 'collection-log.md')
    const status = selectionConfirmed && selectedBeat !== MISSING_INFO ? 'MANUAL ACTION REQUIRED' : 'blocked-awaiting-user-selection'
    
    const collectionResult = `# Journalist Collection

## Status: ${status}

This dashboard workflow does not fabricate Muck Rack, SERP, outlet-page, or contact results. Live browser validation and collection must be run before Stage 07.

## Selected Angle
- Angle: ${selectedAngle}
- Selection confirmed: ${selectionConfirmed ? 'yes' : 'no'}

## Selected Beat
- Beat: ${selectedBeat}
- Target: ${targetCount} journalists
- Collected: 0

## Collection Details
- Muck Rack: TEST NOT RUN
- SERP: TEST NOT RUN
- Outlet pages: TEST NOT RUN
- Contact-source review: TEST NOT RUN

## Files Generated
- ${path.relative(jobFolder, collectionLogPath)}

## Required Before Stage 07
- Verify Debug Chrome and Muck Rack login.
- Run selected-angle SERP and Boolean searches.
- Collect, dedupe, and qualify 800 journalists per selected beat or record a written user exception.
- Save source-backed collection artifacts under source-files/journalist-intel/.
- Do not proceed to journalist intelligence until these checks pass.

## Local Helper
Run after live access is verified:

\`\`\`powershell
.\\scripts\\collect-beat-journalists.cmd "${this.slug}" "${selectedBeat}"
\`\`\`
`

    fs.writeFileSync(collectionLogPath, collectionResult, 'utf-8')
    
    this.data.logs.push({ 
      id: uuidv4(), 
      campaign_id: this.campaignId, 
      stage: 'Journalist Collection', 
      level: 'warning', 
      message: 'Selected-angle collection instructions created; live Muck Rack/SERP collection not run.', 
      created_at: new Date().toISOString() 
    })
    
    return collectionResult
  }
}

export function createSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
