'use client'

import { useState, useCallback } from 'react'

export type WorkflowStepStatus = 'locked' | 'ready' | 'running' | 'paused' | 'completed' | 'failed'

export interface WorkflowStep {
  id: number
  name: string
  route: string
  agentName: string
  agentEmoji: string
  description: string
  status: WorkflowStepStatus
  dependsOn: number[]
  requiredInputs: string[]
  outputs: string[]
  handoverTo?: number
}

export interface WorkflowState {
  currentStep: number
  steps: WorkflowStep[]
  selectedAngle?: string
  campaignId?: string
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 1,
    name: 'Campaign Intake',
    route: '/campaigns',
    agentName: 'Orchestrator Agent',
    agentEmoji: '📋',
    description: 'Collect campaign brief and study data',
    status: 'completed',
    dependsOn: [],
    requiredInputs: ['Campaign name', 'Brief', 'Raw study copy'],
    outputs: ['00-brief.md', 'raw-study-copy.md']
  },
  {
    id: 2,
    name: 'Study Extraction',
    route: '/workflow?stage=2',
    agentName: 'Data Scientist Agent',
    agentEmoji: '🔬',
    description: 'Extract key insights and findings',
    status: 'completed',
    dependsOn: [1],
    requiredInputs: ['00-brief.md', 'raw-study-copy.md'],
    outputs: ['01-study-notes.md', '02-insights.md']
  },
  {
    id: 3,
    name: 'Research Enrichment',
    route: '/workflow?stage=3',
    agentName: 'Research Agent',
    agentEmoji: '📚',
    description: 'Enrich with supporting context',
    status: 'completed',
    dependsOn: [2],
    requiredInputs: ['01-study-notes.md', '02-insights.md'],
    outputs: ['03-research.md']
  },
  {
    id: 4,
    name: 'Angle Generation',
    route: '/workflow?stage=4',
    agentName: 'Strategist Agent',
    agentEmoji: '💡',
    description: 'Generate pitch angles per beat',
    status: 'completed',
    dependsOn: [3],
    requiredInputs: ['02-insights.md', '03-research.md'],
    outputs: ['04-angles.md']
  },
  {
    id: 5,
    name: 'Pitch Selection',
    route: '/angles',
    agentName: 'Decision Agent',
    agentEmoji: '✅',
    description: 'Choose angle to proceed with',
    status: 'paused',
    dependsOn: [4],
    requiredInputs: ['04-angles.md'],
    outputs: ['05-beats.md'],
    handoverTo: 6
  },
  {
    id: 6,
    name: 'Journalist Collection',
    route: '/journalists',
    agentName: 'Collector Agent',
    agentEmoji: '🔍',
    description: 'Collect 800 journalists per beat',
    status: 'locked',
    dependsOn: [5],
    requiredInputs: ['05-beats.md'],
    outputs: ['journalist-intel/']
  },
  {
    id: 7,
    name: 'Journalist Matching',
    route: '/artifacts',
    agentName: 'Matcher Agent',
    agentEmoji: '🎯',
    description: 'Score and deduplicate targets',
    status: 'locked',
    dependsOn: [6],
    requiredInputs: ['journalist-intel/'],
    outputs: ['06-journalist-intel.md', '07-journalist-coverage.md']
  },
  {
    id: 8,
    name: 'Email Writer',
    route: '/pitch',
    agentName: 'Copywriter Agent',
    agentEmoji: '✍️',
    description: 'Draft pitch email variants',
    status: 'locked',
    dependsOn: [7],
    requiredInputs: ['04-05-06-07 context'],
    outputs: ['draft-variants/', '08-pitch-draft.md']
  },
  {
    id: 9,
    name: 'Email Optimization',
    route: '/email',
    agentName: 'Optimizer Agent',
    agentEmoji: '⚡',
    description: 'Optimize for deliverability',
    status: 'locked',
    dependsOn: [8],
    requiredInputs: ['08-pitch-draft.md'],
    outputs: ['09-optimized-email.md']
  },
  {
    id: 10,
    name: 'Final Package',
    route: '/package',
    agentName: 'Packager Agent',
    agentEmoji: '📦',
    description: 'Package for export',
    status: 'locked',
    dependsOn: [9],
    requiredInputs: ['09-optimized-email.md'],
    outputs: ['10-google-doc.md']
  },
  {
    id: 11,
    name: 'Export',
    route: '/validation',
    agentName: 'Export Agent',
    agentEmoji: '🚀',
    description: 'Export to Google Docs',
    status: 'locked',
    dependsOn: [10],
    requiredInputs: ['10-google-doc.md'],
    outputs: ['Google Doc export']
  }
]

export function useWorkflow() {
  const [state, setState] = useState<WorkflowState>({
    currentStep: 5,
    steps: WORKFLOW_STEPS,
    selectedAngle: undefined,
    campaignId: undefined
  })

  const getStepStatus = useCallback((stepId: number): WorkflowStepStatus => {
    if (stepId === 1) return 'completed'
    if (stepId === state.currentStep) return 'running'
    if (stepId < state.currentStep) return 'completed'
    if (stepId === 5 && !state.selectedAngle) return 'paused'
    if (stepId > state.currentStep) return 'locked'
    return 'ready'
  }, [state.currentStep, state.selectedAngle])

  const canAccessStep = useCallback((stepId: number): boolean => {
    const step = state.steps.find(s => s.id === stepId)
    if (!step) return false
    
    // Check dependencies
    for (const depId of step.dependsOn) {
      const depStep = state.steps.find(s => s.id === depId)
      if (depStep && getStepStatus(depId) !== 'completed') {
        return false
      }
    }
    
    return true
  }, [state.steps, getStepStatus])

  const getCurrentStep = useCallback((): WorkflowStep | undefined => {
    return state.steps.find(s => s.id === state.currentStep)
  }, [state.steps, state.currentStep])

  const getNextStep = useCallback((): WorkflowStep | undefined => {
    const nextId = state.steps.find(s => s.id > state.currentStep && getStepStatus(s.id) !== 'locked')?.id
    return nextId ? state.steps.find(s => s.id === nextId) : undefined
  }, [state.steps, state.currentStep, getStepStatus])

  const setSelectedAngle = useCallback((angle: string) => {
    setState(prev => ({
      ...prev,
      selectedAngle: angle,
      currentStep: 6
    }))
  }, [])

  const advanceStep = useCallback(() => {
    setState(prev => {
      const nextStep = prev.steps.find(s => s.id > prev.currentStep && canAccessStep(s.id))
      return nextStep ? { ...prev, currentStep: nextStep.id } : prev
    })
  }, [canAccessStep])

  const getProgress = useCallback((): number => {
    const completed = state.steps.filter(s => getStepStatus(s.id) === 'completed').length
    return Math.round((completed / state.steps.length) * 100)
  }, [state.steps, getStepStatus])

  return {
    state,
    steps: state.steps,
    currentStep: state.currentStep,
    getStepStatus,
    canAccessStep,
    getCurrentStep,
    getNextStep,
    setSelectedAngle,
    advanceStep,
    getProgress
  }
}

export default useWorkflow