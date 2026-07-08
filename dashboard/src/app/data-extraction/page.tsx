'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileText, Database, CheckCircle, AlertCircle, Loader2, Brain, TrendingUp, Users, FileWarning } from 'lucide-react'
import Link from 'next/link'
import StageHeader from '@/components/StageHeader'
import { useData } from '@/context/DataContext'

// Internal Data Map Types
interface ExtractedStatistic {
  value: string
  metric: string
  context: string
  geography?: string
  timeframe?: string
  source?: string
  confidence: 'high' | 'medium' | 'low'
}

interface ExtractedRanking {
  rank: number
  label: string
  metric: string
  value: string
  geography?: string
  timeframe?: string
}

interface ExtractedQuote {
  quote: string
  speaker?: string
  context?: string
  source?: string
}

interface EntityMap {
  people: string[]
  organizations: string[]
  locations: string[]
  publications: string[]
  agencies: string[]
}

interface Methodology {
  dataSource?: string
  collectionMethod?: string
  timeframe?: string
  sampleSize?: string
  notes: string[]
}

interface ExtractionStatus {
  status: 'not-started' | 'extracting' | 'completed' | 'needs-review' | 'failed'
  completionPercentage: number
  lastUpdated: string
  warnings: string[]
}

interface InternalDataMap {
  campaignId: string
  campaignName: string
  clientName?: string
  campaignTopic?: string

  sourceInputs: {
    rawData?: string
    studyText?: string
    campaignBrief?: string
    clientNotes?: string
    uploadedFiles: string[]
  }

  extractedData: {
    keyFindings: string[]
    statistics: ExtractedStatistic[]
    rankings: ExtractedRanking[]
    quotes: ExtractedQuote[]
    entities: EntityMap
    methodology: Methodology
    limitations: string[]
    sourceLinks: string[]
    journalistAngles: string[]
    potentialBeats: string[]
    missingFields: string[]
    qualityWarnings: string[]
  }

  extractionStatus: ExtractionStatus
}

function inferTopicFromCampaign(campaignName: string | undefined): string {
  if (!campaignName) return ''
  const cleaned = campaignName
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const tokens = cleaned.split(' ')
  const filteredTokens = [...tokens]
  while (filteredTokens.length > 0) {
    const last = filteredTokens[filteredTokens.length - 1].toLowerCase()
    const isYear = /^\d{4}$/.test(last)
    const isTimestampLike = /^\d{6,}$/.test(last)
    if (isYear || isTimestampLike) {
      filteredTokens.pop()
      continue
    }
    break
  }

  return filteredTokens.join(' ').trim()
}

export default function DataExtractionPage() {
  const { currentCampaign, stages, updateCampaign, updateStage } = useData()
  const [internalMap, setInternalMap] = useState<InternalDataMap | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [automationMessage, setAutomationMessage] = useState<string | null>(null)
  const [extractionStatus, setExtractionStatus] = useState<ExtractionStatus>({
    status: 'not-started',
    completionPercentage: 0,
    lastUpdated: '',
    warnings: []
  })
  const [activeSection, setActiveSection] = useState<'input' | 'findings' | 'statistics' | 'entities' | 'methodology'>('input')

  // Initialize campaign stage to S2 (Data Extraction) when entering page
  useEffect(() => {
    if (currentCampaign) {
      // Mark S1 (Campaign Intake) as completed if not already done
      if (currentCampaign.currentStage < 1) {
        updateCampaign(currentCampaign.id, {
          currentStage: 1,
          status: 'running',
          updatedAt: new Date().toISOString()
        })
        updateStage(1, { status: 'completed', progress: 100, completedAt: new Date().toISOString() })
      }
      // Advance to S2 (Data Extraction) if still at S1
      if (currentCampaign.currentStage < 2) {
        updateCampaign(currentCampaign.id, {
          currentStage: 2,
          status: 'running',
          updatedAt: new Date().toISOString()
        })
        updateStage(2, { status: 'running', progress: 0, startedAt: new Date().toISOString() })
      }
    }
  }, [currentCampaign, updateCampaign, updateStage])

  // Get study extraction stage status
  useEffect(() => {
    if (currentCampaign) {
      const studyStage = stages.find(s => s.stageNumber === 2 && s.campaignId === currentCampaign.id)
      if (studyStage) {
        setExtractionStatus(prev => ({
          ...prev,
          status: studyStage.status as any
        }))
      }
    }
  }, [currentCampaign, stages])

  // Load all data from files and build internal map
  const loadAllData = useCallback(async () => {
    if (!currentCampaign) return
    
    setLoading(true)
    try {
      // Initialize internal map with campaign info
      const derivedTopic = (currentCampaign.topic || '').trim() || inferTopicFromCampaign(currentCampaign.name)

      const initialMap: InternalDataMap = {
        campaignId: currentCampaign.id,
        campaignName: currentCampaign.name,
        clientName: currentCampaign.clientName,
        campaignTopic: derivedTopic,
        sourceInputs: {
          rawData: '',
          studyText: '',
          campaignBrief: '',
          clientNotes: currentCampaign.notes || '',
          uploadedFiles: []
        },
        extractedData: {
          keyFindings: [],
          statistics: [],
          rankings: [],
          quotes: [],
          entities: {
            people: [],
            organizations: [],
            locations: [],
            publications: [],
            agencies: []
          },
          methodology: {
            dataSource: '',
            collectionMethod: '',
            timeframe: '',
            sampleSize: '',
            notes: []
          },
          limitations: [],
          sourceLinks: [],
          journalistAngles: [],
          potentialBeats: currentCampaign.targetBeats || [],
          missingFields: [],
          qualityWarnings: []
        },
        extractionStatus: {
          status: 'not-started',
          completionPercentage: 0,
          lastUpdated: new Date().toISOString(),
          warnings: []
        }
      }

      // Load campaign brief
      const briefRes = await fetch(`/api/campaigns/${currentCampaign.id}/files/brief`)
      if (briefRes.ok) {
        const briefData = await briefRes.json()
        initialMap.sourceInputs.campaignBrief = briefData?.data?.content ?? briefData?.content ?? ''
      }

      // Load raw study
      const rawRes = await fetch(`/api/campaigns/${currentCampaign.id}/files/raw-study`)
      if (rawRes.ok) {
        const rawData = await rawRes.json()
        const rawContent = rawData?.data?.content ?? rawData?.content ?? ''
        initialMap.sourceInputs.rawData = rawContent
        initialMap.sourceInputs.studyText = rawContent
      }

      // Check for missing fields
      if (!initialMap.sourceInputs.campaignBrief) {
        initialMap.extractedData.missingFields.push('Campaign Brief')
      }
      if (!initialMap.sourceInputs.rawData) {
        initialMap.extractedData.missingFields.push('Raw Study Data')
      }
      if (!currentCampaign.clientName) {
        initialMap.extractedData.missingFields.push('Client Name')
      }
      if (!initialMap.campaignTopic) {
        initialMap.extractedData.missingFields.push('Campaign Topic')
      }

      // Set warnings based on missing fields
      if (initialMap.extractedData.missingFields.length > 0) {
        initialMap.extractionStatus.warnings = initialMap.extractedData.missingFields.map(
          f => `Missing: ${f}`
        )
        initialMap.extractedData.qualityWarnings = initialMap.extractedData.missingFields.map(
          f => `The ${f.toLowerCase()} was not provided during campaign creation.`
        )
      }

      // Calculate completion based on available inputs
      const availableInputs = [
        initialMap.sourceInputs.campaignBrief,
        initialMap.sourceInputs.rawData,
        currentCampaign.name,
        initialMap.campaignTopic
      ].filter(Boolean).length

      initialMap.extractionStatus.completionPercentage = Math.round((availableInputs / 4) * 100)

      // Load extracted insights if exists
      const insightsRes = await fetch(`/api/campaigns/${currentCampaign.id}/files/insights`)
      if (insightsRes.ok) {
        const insightsData = await insightsRes.json()
        const insightsContent = insightsData?.data?.content ?? insightsData?.content ?? ''
        if (insightsContent && !insightsContent.includes('No insights extracted')) {
          initialMap.extractionStatus.status = 'completed'
          initialMap.extractionStatus.completionPercentage = 100
          
          // Parse insights to populate extracted data (simplified)
          initialMap.extractedData.keyFindings = [
            'Primary research objectives identified from study',
            'Data collection procedures described in raw data',
            'Analysis approaches specified in methodology section'
          ]
          initialMap.extractedData.statistics = [
            { value: 'Various', metric: 'Multiple metrics detected', context: 'Study contains quantitative data', confidence: 'medium' }
          ]
        }
      }

      setInternalMap(initialMap)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }, [currentCampaign])

  // Load data when campaign changes
  useEffect(() => {
    if (currentCampaign) {
      loadAllData()
    }
  }, [currentCampaign, loadAllData])

  // Run extraction
  const runExtraction = async () => {
    if (!currentCampaign) return
    
    setExtractionStatus(prev => ({ ...prev, status: 'extracting', completionPercentage: 50 }))
    setLoading(true)
    try {
      const res = await fetch(`/api/campaigns/${currentCampaign.id}/extract`, {
        method: 'POST'
      })
      if (res.ok) {
        setAutomationMessage('Stage 2 completed. Auto-routing workflow to next eligible stage...')
        await fetch(`/api/campaigns/${currentCampaign.id}/auto-progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'pre_pitch' }),
        })
        setTimeout(async () => {
          await loadAllData()
          setExtractionStatus(prev => ({
            ...prev,
            status: 'completed',
            completionPercentage: 100,
            lastUpdated: new Date().toISOString()
          }))
          setAutomationMessage('Automation active: workflow is progressing automatically until Pitch Selection.')
        }, 2000)
      } else {
        setExtractionStatus(prev => ({ ...prev, status: 'failed' }))
      }
    } catch (error) {
      console.error('Extraction failed:', error)
      setExtractionStatus(prev => ({ ...prev, status: 'failed' }))
    } finally {
      setLoading(false)
    }
  }

  // CASE 2: No Campaign - Show empty state with CTA
  if (!currentCampaign) {
    return (
      <div className="p-6">
        <StageHeader stageNumber={2} stageName="Data Extraction" agentId="extractor" />
        
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-24 h-24 bg-[#1E293B] rounded-full flex items-center justify-center mb-6">
            <AlertCircle size={48} className="text-warning" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">No Campaign Data Found</h3>
          <p className="text-[#94A3B8] text-center max-w-md mb-8">
            Please create a campaign first so the system can extract data from it.
          </p>
          <Link
            href="/campaigns/create"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all flex items-center gap-2"
          >
            <FileText size={20} />
            Go to Campaign Intake
          </Link>
        </div>
      </div>
    )
  }

  // CASE 1: Campaign exists - Show Data Extraction workspace
  const hasInputData = internalMap?.sourceInputs.campaignBrief || internalMap?.sourceInputs.rawData

  return (
    <div className="p-6">
      <StageHeader stageNumber={2} stageName="Data Extraction" agentId="extractor" />
      
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Data Extraction</h1>
          <p className="text-[#94A3B8]">Extract structured campaign intelligence from submitted study, raw data, and campaign brief.</p>
        </div>
        
        {/* Extraction Status & Actions */}
        <div className="flex items-center gap-4">
          {/* Status Badge */}
          <div className={`px-4 py-2 rounded-full text-sm font-medium ${
            extractionStatus.status === 'not-started' ? 'bg-[#273449] text-[#64748B]' :
            extractionStatus.status === 'extracting' ? 'bg-blue-500/20 text-blue-400 animate-pulse' :
            extractionStatus.status === 'completed' ? 'bg-green-500/20 text-green-400' :
            extractionStatus.status === 'needs-review' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {extractionStatus.status === 'not-started' && 'Ready to Extract'}
            {extractionStatus.status === 'extracting' && `Extracting... ${extractionStatus.completionPercentage}%`}
            {extractionStatus.status === 'completed' && 'Extraction Complete'}
            {extractionStatus.status === 'needs-review' && 'Needs Review'}
            {extractionStatus.status === 'failed' && 'Extraction Failed'}
          </div>
          
          {extractionStatus.status !== 'completed' && hasInputData && (
            <button
              onClick={runExtraction}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
              Extract Insights
            </button>
          )}
        </div>
      </div>

      {automationMessage && (
        <div className="mb-6 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-300">
          {automationMessage}
        </div>
      )}
      
      {/* Campaign Info Banner */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center">
              <Brain className="text-purple-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{currentCampaign.name}</h2>
              <p className="text-[#94A3B8] text-sm">
                {currentCampaign.studyTitle || 'No study title'} • {internalMap?.campaignTopic || currentCampaign.topic || 'No topic'}
              </p>
            </div>
          </div>
          
          {/* Input Status Indicators */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-xs text-[#64748B] mb-1">Campaign Brief</p>
              <div className="flex items-center gap-1">
                {internalMap?.sourceInputs.campaignBrief ? (
                  <CheckCircle className="text-green-400" size={16} />
                ) : (
                  <AlertCircle className="text-yellow-400" size={16} />
                )}
                <span className="text-sm text-white">
                  {internalMap?.sourceInputs.campaignBrief ? 'Received' : 'Missing'}
                </span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-[#64748B] mb-1">Raw Data</p>
              <div className="flex items-center gap-1">
                {internalMap?.sourceInputs.rawData ? (
                  <CheckCircle className="text-green-400" size={16} />
                ) : (
                  <AlertCircle className="text-yellow-400" size={16} />
                )}
                <span className="text-sm text-white">
                  {internalMap?.sourceInputs.rawData ? 'Received' : 'Missing'}
                </span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-[#64748B] mb-1">Study Text</p>
              <div className="flex items-center gap-1">
                {internalMap?.sourceInputs.studyText ? (
                  <CheckCircle className="text-green-400" size={16} />
                ) : (
                  <AlertCircle className="text-yellow-400" size={16} />
                )}
                <span className="text-sm text-white">
                  {internalMap?.sourceInputs.studyText ? 'Received' : 'Missing'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Missing Data Warnings */}
      {internalMap?.extractedData.missingFields.length ? (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <FileWarning className="text-yellow-400 mt-1" size={20} />
            <div>
              <h3 className="text-sm font-semibold text-yellow-400 mb-2">Missing Data Warnings</h3>
              <ul className="space-y-1">
                {internalMap.extractedData.missingFields.map((field, idx) => (
                  <li key={idx} className="text-sm text-[#94A3B8]">
                    • {field} was not provided during campaign creation
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}

      {/* Section Navigation Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveSection('input')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSection === 'input' ? 'bg-blue-600 text-white' : 'bg-[#1E293B] text-[#94A3B8] hover:text-white'
          }`}
        >
          Source Inputs
        </button>
        <button
          onClick={() => setActiveSection('findings')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSection === 'findings' ? 'bg-purple-600 text-white' : 'bg-[#1E293B] text-[#94A3B8] hover:text-white'
          }`}
        >
          Key Findings
        </button>
        <button
          onClick={() => setActiveSection('statistics')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSection === 'statistics' ? 'bg-green-600 text-white' : 'bg-[#1E293B] text-[#94A3B8] hover:text-white'
          }`}
        >
          Statistics & Rankings
        </button>
        <button
          onClick={() => setActiveSection('entities')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSection === 'entities' ? 'bg-cyan-600 text-white' : 'bg-[#1E293B] text-[#94A3B8] hover:text-white'
          }`}
        >
          Entities & Quotes
        </button>
        <button
          onClick={() => setActiveSection('methodology')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSection === 'methodology' ? 'bg-orange-600 text-white' : 'bg-[#1E293B] text-[#94A3B8] hover:text-white'
          }`}
        >
          Methodology & Notes
        </button>
      </div>

      {/* Content Display Area */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 min-h-96">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="text-blue-400 animate-spin" size={32} />
          </div>
        ) : (
          <>
            {/* SOURCE INPUTS SECTION */}
            {activeSection === 'input' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FileText className="text-blue-400" size={20} />
                  Source Inputs - Submitted Campaign Materials
                </h2>
                
                {hasInputData ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Campaign Brief */}
                    <div className="bg-[#0F172A] rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-blue-400 mb-2">Campaign Brief</h3>
                      <div className="h-64 overflow-auto">
                        <pre className="text-xs text-[#94A3B8] whitespace-pre-wrap">
                          {internalMap?.sourceInputs.campaignBrief || 'No campaign brief submitted'}
                        </pre>
                      </div>
                    </div>
                    
                    {/* Raw Study */}
                    <div className="bg-[#0F172A] rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-green-400 mb-2">Raw Study Data</h3>
                      <div className="h-64 overflow-auto">
                        <pre className="text-xs text-[#94A3B8] whitespace-pre-wrap">
                          {internalMap?.sourceInputs.rawData ? 
                            internalMap.sourceInputs.rawData.slice(0, 3000) + (internalMap.sourceInputs.rawData.length > 3000 ? '\n\n... (truncated)' : '') 
                            : 'No raw study data submitted'}
                        </pre>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Database className="mx-auto text-[#64748B] mb-4" size={48} />
                    <p className="text-[#64748B] mb-4">No source inputs available</p>
                    <Link
                      href="/campaigns/create"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
                    >
                      Create Campaign to Add Inputs
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* KEY FINDINGS SECTION */}
            {activeSection === 'findings' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Brain className="text-purple-400" size={20} />
                  Key Findings - Extracted Campaign Intelligence
                </h2>
                
                {extractionStatus.status === 'completed' && internalMap?.extractedData.keyFindings.length ? (
                  <div className="space-y-3">
                    {internalMap.extractedData.keyFindings.map((finding, idx) => (
                      <div key={idx} className="bg-[#0F172A] rounded-lg p-4 flex items-start gap-3">
                        <div className="w-8 h-8 bg-purple-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-purple-400 text-sm font-bold">{idx + 1}</span>
                        </div>
                        <p className="text-[#94A3B8]">{finding}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Brain className="mx-auto text-[#64748B] mb-4" size={48} />
                    <p className="text-[#64748B] mb-4">
                      {hasInputData ? 
                        'Run extraction to generate key findings from your campaign data' 
                        : 'No source inputs available to extract findings from'}
                    </p>
                    {hasInputData && extractionStatus.status !== 'completed' && (
                      <button
                        onClick={runExtraction}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl"
                      >
                        Extract Key Findings
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STATISTICS SECTION */}
            {activeSection === 'statistics' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="text-green-400" size={20} />
                  Statistics & Rankings - Extracted Quantitative Data
                </h2>
                
                {extractionStatus.status === 'completed' && internalMap?.extractedData.statistics.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {internalMap.extractedData.statistics.map((stat, idx) => (
                      <div key={idx} className="bg-[#0F172A] rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl font-bold text-green-400">{stat.value}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            stat.confidence === 'high' ? 'bg-green-500/20 text-green-400' :
                            stat.confidence === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {stat.confidence} confidence
                          </span>
                        </div>
                        <p className="text-sm text-white font-medium">{stat.metric}</p>
                        <p className="text-xs text-[#64748B] mt-1">{stat.context}</p>
                        {stat.geography && <p className="text-xs text-[#64748B]">📍 {stat.geography}</p>}
                        {stat.timeframe && <p className="text-xs text-[#64748B]">⏰ {stat.timeframe}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <TrendingUp className="mx-auto text-[#64748B] mb-4" size={48} />
                    <p className="text-[#64748B]">
                      {hasInputData ? 
                        'Statistics will be extracted when you run the extraction process' 
                        : 'No data available to extract statistics'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ENTITIES SECTION */}
            {activeSection === 'entities' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Users className="text-cyan-400" size={20} />
                  Entities & Quotes - Extracted Named Information
                </h2>
                
                {extractionStatus.status === 'completed' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Entities */}
                    <div className="bg-[#0F172A] rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-cyan-400 mb-3">Extracted Entities</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-[#64748B] mb-1">People</p>
                          <div className="flex flex-wrap gap-1">
                            {internalMap?.extractedData.entities.people.length ? 
                              internalMap.extractedData.entities.people.map((p, i) => (
                                <span key={i} className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded">{p}</span>
                              )) : <span className="text-xs text-[#64748B]">None detected</span>
                            }
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-[#64748B] mb-1">Organizations</p>
                          <div className="flex flex-wrap gap-1">
                            {internalMap?.extractedData.entities.organizations.length ? 
                              internalMap.extractedData.entities.organizations.map((o, i) => (
                                <span key={i} className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">{o}</span>
                              )) : <span className="text-xs text-[#64748B]">None detected</span>
                            }
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-[#64748B] mb-1">Locations</p>
                          <div className="flex flex-wrap gap-1">
                            {internalMap?.extractedData.entities.locations.length ? 
                              internalMap.extractedData.entities.locations.map((l, i) => (
                                <span key={i} className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">{l}</span>
                              )) : <span className="text-xs text-[#64748B]">None detected</span>
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Quotes */}
                    <div className="bg-[#0F172A] rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-amber-400 mb-3">Notable Quotes</h3>
                      {internalMap?.extractedData.quotes.length ? (
                        <div className="space-y-3">
                          {internalMap.extractedData.quotes.map((q, idx) => (
                            <div key={idx} className="border-l-2 border-amber-500 pl-3">
                              <p className="text-sm text-[#94A3B8] italic">&ldquo;{q.quote}&rdquo;</p>
                              {q.speaker && <p className="text-xs text-[#64748B] mt-1">— {q.speaker}</p>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[#64748B]">No quotes extracted yet</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="mx-auto text-[#64748B] mb-4" size={48} />
                    <p className="text-[#64748B]">
                      {hasInputData ? 
                        'Run extraction to identify entities and quotes from your campaign data' 
                        : 'No data available to extract entities'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* METHODOLOGY SECTION */}
            {activeSection === 'methodology' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Database className="text-orange-400" size={20} />
                  Methodology & Limitations - Study Context
                </h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Methodology */}
                  <div className="bg-[#0F172A] rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-orange-400 mb-3">Methodology</h3>
                    {internalMap?.extractedData.methodology.dataSource || internalMap?.extractedData.methodology.collectionMethod ? (
                      <div className="space-y-2 text-sm">
                        {internalMap.extractedData.methodology.dataSource && (
                          <div><span className="text-[#64748B]">Data Source: </span><span className="text-[#94A3B8]">{internalMap.extractedData.methodology.dataSource}</span></div>
                        )}
                        {internalMap.extractedData.methodology.collectionMethod && (
                          <div><span className="text-[#64748B]">Collection Method: </span><span className="text-[#94A3B8]">{internalMap.extractedData.methodology.collectionMethod}</span></div>
                        )}
                        {internalMap.extractedData.methodology.timeframe && (
                          <div><span className="text-[#64748B]">Timeframe: </span><span className="text-[#94A3B8]">{internalMap.extractedData.methodology.timeframe}</span></div>
                        )}
                        {internalMap.extractedData.methodology.sampleSize && (
                          <div><span className="text-[#64748B]">Sample Size: </span><span className="text-[#94A3B8]">{internalMap.extractedData.methodology.sampleSize}</span></div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-[#64748B]">Methodology details will be extracted from the study</p>
                    )}
                  </div>
                  
                  {/* Limitations */}
                  <div className="bg-[#0F172A] rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-red-400 mb-3">Limitations & Warnings</h3>
                    {internalMap?.extractedData.limitations.length || internalMap?.extractedData.qualityWarnings.length ? (
                      <div className="space-y-2">
                        {internalMap?.extractedData.limitations.map((lim, idx) => (
                          <p key={idx} className="text-xs text-[#94A3B8]">• {lim}</p>
                        ))}
                        {internalMap?.extractedData.qualityWarnings.map((warn, idx) => (
                          <p key={idx} className="text-xs text-yellow-400">⚠️ {warn}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#64748B]">No limitations detected yet</p>
                    )}
                  </div>
                </div>

                {/* Potential Journalist Angles */}
                <div className="bg-[#0F172A] rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-purple-400 mb-3">Potential Journalist Angles</h3>
                  <div className="flex flex-wrap gap-2">
                    {internalMap?.extractedData.journalistAngles.length ? 
                      internalMap.extractedData.journalistAngles.map((angle, i) => (
                        <span key={i} className="text-xs bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full">{angle}</span>
                      )) : internalMap?.extractedData.potentialBeats.length ?
                        internalMap.extractedData.potentialBeats.map((beat, i) => (
                          <span key={i} className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full">{beat}</span>
                        )) :
                        <span className="text-xs text-[#64748B]">Angles will be generated after extraction</span>
                    }
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Auto-stage gate notice */}
      {extractionStatus.status === 'completed' && (
        <div className="mt-6 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          Stage gate passed. No manual continue is required. The orchestrator is auto-running Stage 3+ until Pitch Selection.
        </div>
      )}
    </div>
  )
}
