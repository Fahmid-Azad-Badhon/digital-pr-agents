'use client'

/**
 * WorkflowTimeline Component
 * Visual timeline of workflow stages with connections
 */

import { CheckCircle, Circle, Loader2, Lock, AlertTriangle, ArrowRight } from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

export type TimelineStageStatus = 'pending' | 'in-progress' | 'completed' | 'failed' | 'locked' | 'skipped'

export interface TimelineStage {
  id: string
  number: number
  name: string
  label: string
  status: TimelineStageStatus
  duration?: number
  error?: string
  owner?: string
  artifacts?: string[]
}

interface WorkflowTimelineProps {
  stages: TimelineStage[]
  currentStageId?: string
  compact?: boolean
  showDetails?: boolean
  onStageClick?: (stageId: string) => void
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function WorkflowTimeline({
  stages,
  currentStageId,
  compact = false,
  showDetails = false,
  onStageClick
}: WorkflowTimelineProps) {
  const getStatusIcon = (status: TimelineStageStatus, isCurrent: boolean) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />
      case 'in-progress':
        return <Loader2 className={`w-5 h-5 text-cyan-400 ${isCurrent ? 'animate-spin' : ''}`} />
      case 'failed':
        return <AlertTriangle className="w-5 h-5 text-red-400" />
      case 'locked':
        return <Lock className="w-5 h-5 text-slate-500" />
      case 'skipped':
        return <Circle className="w-5 h-5 text-slate-600" />
      default:
        return <Circle className="w-5 h-5 text-slate-500" />
    }
  }

  const getStatusColor = (status: TimelineStageStatus) => {
    switch (status) {
      case 'completed':
        return 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
      case 'in-progress':
        return 'border-cyan-500 bg-cyan-500/10 text-cyan-400 ring-2 ring-cyan-500/30'
      case 'failed':
        return 'border-red-500 bg-red-500/10 text-red-400'
      case 'locked':
        return 'border-slate-700 bg-slate-800 text-slate-500'
      case 'skipped':
        return 'border-slate-600 bg-slate-700/50 text-slate-500'
      default:
        return 'border-slate-700 bg-slate-800 text-slate-500'
    }
  }

  const getConnectorColor = (index: number) => {
    if (index >= stages.length - 1) return 'transparent'
    const currentStatus = stages[index].status
    return currentStatus === 'completed' ? 'bg-emerald-500' : 'bg-slate-700'
  }

  const formatDuration = (ms?: number) => {
    if (!ms) return ''
    const seconds = Math.floor(ms / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m ${seconds % 60}s`
  }

  return (
    <div className={compact ? 'space-y-2' : 'space-y-4'}>
      {stages.map((stage, index) => {
        const isCurrent = stage.id === currentStageId || stage.status === 'in-progress'
        
        return (
          <div key={stage.id} className="flex items-start gap-4">
            {/* Stage Node */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => onStageClick?.(stage.id)}
                disabled={stage.status === 'locked'}
                className={`
                  w-12 h-12 rounded-full border-2 flex items-center justify-center
                  transition-all ${getStatusColor(stage.status)}
                  ${stage.status !== 'locked' ? 'hover:scale-105 cursor-pointer' : 'cursor-not-allowed'}
                `}
              >
                {getStatusIcon(stage.status, isCurrent)}
              </button>

              {/* Connector */}
              {index < stages.length - 1 && (
                <div className={`
                  w-0.5 h-8 mt-1
                  ${getConnectorColor(index)}
                `} />
              )}
            </div>

            {/* Stage Content */}
            <div className={`
              flex-1 pb-4 ${compact ? 'py-1' : 'py-2'}
            `}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Step {stage.number}</span>
                    {stage.owner && (
                      <span className="px-2 py-0.5 text-xs bg-slate-700 text-slate-400 rounded">
                        {stage.owner}
                      </span>
                    )}
                  </div>
                  <h4 className="font-medium text-slate-200 mt-0.5">{stage.label}</h4>
                </div>

                {!compact && stage.duration && (
                  <span className="text-xs text-slate-500">
                    {formatDuration(stage.duration)}
                  </span>
                )}
              </div>

              {/* Details */}
              {showDetails && !compact && (
                <div className="mt-2 space-y-2">
                  <p className="text-sm text-slate-400">{stage.name}</p>
                  
                  {stage.error && (
                    <p className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded">
                      {stage.error}
                    </p>
                  )}

                  {stage.artifacts && stage.artifacts.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {stage.artifacts.map((artifact, i) => (
                        <span 
                          key={i} 
                          className="px-2 py-0.5 text-xs bg-slate-700 text-slate-400 rounded"
                        >
                          {artifact}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}