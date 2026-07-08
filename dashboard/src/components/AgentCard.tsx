'use client'

/**
 * AgentCard Component
 * Displays agent information with status, progress, and actions
 */

import { useState } from 'react'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  MoreVertical
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

export type AgentStatus = 'idle' | 'working' | 'completed' | 'error'

interface AgentCardProps {
  id: string
  name: string
  role: string
  emoji: string
  status: AgentStatus
  progress?: number
  currentTask?: string
  lastActive?: string
  onStart?: () => void
  onPause?: () => void
  onRetry?: () => void
  bgGradient?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function AgentCard({
  id: _id,
  name,
  role,
  emoji,
  status,
  progress = 0,
  currentTask,
  lastActive,
  onStart,
  onPause,
  onRetry,
  bgGradient = 'from-purple-500 to-indigo-600'
}: AgentCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  const statusConfig = {
    idle: {
      icon: <div className="w-3 h-3 rounded-full bg-slate-500" />,
      label: 'Idle',
      color: 'text-slate-400',
      bgColor: 'bg-slate-800'
    },
    working: {
      icon: <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />,
      label: 'Working',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-900/30'
    },
    completed: {
      icon: <CheckCircle className="w-3 h-3 text-emerald-400" />,
      label: 'Completed',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-900/30'
    },
    error: {
      icon: <AlertCircle className="w-3 h-3 text-red-400" />,
      label: 'Error',
      color: 'text-red-400',
      bgColor: 'bg-red-900/30'
    }
  }

  const config = statusConfig[status]

  return (
    <div className="relative bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${bgGradient} flex items-center justify-center text-2xl shadow-lg`}>
            {emoji}
          </div>
          
          {/* Name & Role */}
          <div>
            <h3 className="font-semibold text-slate-200">{name}</h3>
            <p className="text-sm text-slate-400">{role}</p>
          </div>
        </div>

        {/* Menu Button */}
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-slate-400" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-8 bg-slate-700 border border-slate-600 rounded-lg shadow-xl py-1 min-w-[120px] z-10">
              {status === 'idle' && onStart && (
                <button 
                  onClick={() => { onStart(); setShowMenu(false); }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-600 flex items-center gap-2"
                >
                  <Play className="w-4 h-4" /> Start
                </button>
              )}
              {status === 'working' && onPause && (
                <button 
                  onClick={() => { onPause(); setShowMenu(false); }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-600 flex items-center gap-2"
                >
                  <Pause className="w-4 h-4" /> Pause
                </button>
              )}
              {status === 'error' && onRetry && (
                <button 
                  onClick={() => { onRetry(); setShowMenu(false); }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-600 flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Retry
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status */}
      <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs ${config.bgColor}`}>
        {config.icon}
        <span className={config.color}>{config.label}</span>
      </div>

      {/* Progress Bar */}
      {status === 'working' && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Current Task */}
      {currentTask && status === 'working' && (
        <div className="mt-3 p-2 bg-slate-700/50 rounded-lg">
          <p className="text-xs text-slate-400">Current task:</p>
          <p className="text-sm text-slate-200 truncate">{currentTask}</p>
        </div>
      )}

      {/* Last Active */}
      {lastActive && (
        <div className="mt-3 text-xs text-slate-500">
          Last active: {lastActive}
        </div>
      )}
    </div>
  )
}