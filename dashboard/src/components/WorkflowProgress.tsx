'use client'

/**
 * WorkflowProgress Component
 * Displays workflow stage progress with visual indicators
 */

import { CheckCircle, Circle, Loader2, Lock, Play, AlertTriangle } from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

export type StageStatus = 'pending' | 'in-progress' | 'completed' | 'failed' | 'locked' | 'manual-action'

export interface WorkflowStage {
  number: number
  name: string
  label: string
  status: StageStatus
  duration?: number
  error?: string
}

interface WorkflowProgressProps {
  stages: WorkflowStage[]
  currentStage?: number
  onStageClick?: (stageNumber: number) => void
  showDuration?: boolean
  compact?: boolean
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function WorkflowProgress({
  stages,
  currentStage: _currentStage,
  onStageClick,
  showDuration = true,
  compact = false
}: WorkflowProgressProps) {
  const getStageIcon = (stage: WorkflowStage) => {
    switch (stage.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />
      case 'in-progress':
        return <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
      case 'failed':
        return <AlertTriangle className="w-5 h-5 text-red-400" />
      case 'locked':
        return <Lock className="w-5 h-5 text-slate-500" />
      case 'manual-action':
        return <Play className="w-5 h-5 text-amber-400" />
      default:
        return <Circle className="w-5 h-5 text-slate-600" />
    }
  }

  const getStageColor = (stage: WorkflowStage) => {
    switch (stage.status) {
      case 'completed':
        return 'border-emerald-500 bg-emerald-500/10'
      case 'in-progress':
        return 'border-cyan-500 bg-cyan-500/10'
      case 'failed':
        return 'border-red-500 bg-red-500/10'
      case 'locked':
        return 'border-slate-700 bg-slate-800'
      case 'manual-action':
        return 'border-amber-500 bg-amber-500/10'
      default:
        return 'border-slate-700 bg-slate-800'
    }
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
        const isClickable = stage.status !== 'locked' && onStageClick
        const isActive = stage.status === 'in-progress'
        const isLast = index === stages.length - 1

        return (
          <div key={stage.number} className="flex items-start gap-4">
            {/* Stage Indicator */}
            <div className={`
              flex flex-col items-center
              ${isLast ? '' : 'flex-1'}
            `}>
              <button
                onClick={() => isClickable && onStageClick(stage.number)}
                disabled={!isClickable}
                className={`
                  w-10 h-10 rounded-full border-2 flex items-center justify-center
                  transition-all ${getStageColor(stage)}
                  ${isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                  ${isActive ? 'ring-2 ring-cyan-500 ring-offset-2 ring-offset-slate-900' : ''}
                `}
              >
                {getStageIcon(stage)}
              </button>

              {/* Connector Line */}
              {!isLast && (
                <div className={`
                  w-0.5 h-8 my-1
                  ${stage.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-700'}
                `} />
              )}
            </div>

            {/* Stage Info */}
            <div className={`flex-1 ${compact ? 'py-1' : 'py-2'}`}>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Stage {stage.number}</span>
                <h4 className={`font-medium ${stage.status === 'locked' ? 'text-slate-500' : 'text-slate-200'}`}>
                  {stage.label}
                </h4>
              </div>

              {!compact && (
                <>
                  <p className="text-sm text-slate-400 mt-0.5">{stage.name}</p>
                  
                  {showDuration && stage.duration && (
                    <p className="text-xs text-slate-500 mt-1">
                      Duration: {formatDuration(stage.duration)}
                    </p>
                  )}

                  {stage.error && (
                    <p className="text-xs text-red-400 mt-1">{stage.error}</p>
                  )}
                </>
              )}

              {stage.status === 'manual-action' && !compact && (
                <div className="mt-2 px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-400">
                  Manual action required
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}