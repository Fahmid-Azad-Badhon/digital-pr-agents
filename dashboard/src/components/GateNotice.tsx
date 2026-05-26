'use client'

/**
 * GateNotice Component
 * Displays workflow gate status with actions
 */

import { useState } from 'react'
import { 
  AlertTriangle, 
  CheckCircle, 
  Lock, 
  Unlock, 
  ChevronDown, 
  ChevronUp,
  ExternalLink,
  Target,
  XCircle
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

export type GateType = 'selection' | 'validation' | 'handoff'

interface GateNoticeProps {
  gateName: string
  gateType: GateType
  status: 'pending' | 'confirmed' | 'rejected' | 'expired'
  description?: string
  requiredAction?: string
  onConfirm?: () => void
  onReject?: () => void
  onNavigate?: () => void
  value?: string
  expiresAt?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function GateNotice({
  gateName,
  gateType,
  status,
  description,
  requiredAction,
  onConfirm,
  onReject,
  onNavigate,
  value,
  expiresAt
}: GateNoticeProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const typeConfig = {
    selection: {
      icon: <Target className="w-5 h-5" />,
      label: 'Selection Gate',
      color: 'cyan'
    },
    validation: {
      icon: <CheckCircle className="w-5 h-5" />,
      label: 'Validation Gate',
      color: 'emerald'
    },
    handoff: {
      icon: <Unlock className="w-5 h-5" />,
      label: 'Handoff Gate',
      color: 'purple'
    }
  }

  const statusConfig = {
    pending: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400" />
    },
    confirmed: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      icon: <CheckCircle className="w-5 h-5 text-emerald-400" />
    },
    rejected: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      icon: <XCircle className="w-5 h-5 text-red-400" />
    },
    expired: {
      bg: 'bg-slate-500/10',
      border: 'border-slate-500/30',
      text: 'text-slate-400',
      icon: <Lock className="w-5 h-5 text-slate-400" />
    }
  }

  const c = typeConfig[gateType]
  const s = statusConfig[status]

  const colorClasses: Record<string, string> = {
    cyan: 'from-cyan-500 to-blue-500',
    emerald: 'from-emerald-500 to-green-500',
    purple: 'from-purple-500 to-pink-500'
  }

  return (
    <div className={`rounded-xl border ${s.bg} ${s.border} overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClasses[c.color] || 'from-cyan-500 to-blue-500'} flex items-center justify-center text-white`}>
            {c.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 uppercase tracking-wider">{c.label}</span>
              {s.icon}
            </div>
            <h3 className="font-semibold text-slate-200">{gateName}</h3>
          </div>
        </div>

        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-slate-700/50">
          {description && (
            <p className="mt-4 text-sm text-slate-300">{description}</p>
          )}

          {value && (
            <div className="mt-3 p-3 bg-slate-800/50 rounded-lg">
              <p className="text-xs text-slate-500">Current Value</p>
              <p className="text-sm text-slate-200 font-medium">{value}</p>
            </div>
          )}

          {requiredAction && (
            <div className="mt-3 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <p className="text-xs text-cyan-400 font-medium">Required Action</p>
              <p className="text-sm text-slate-300 mt-1">{requiredAction}</p>
            </div>
          )}

          {expiresAt && (
            <p className="mt-3 text-xs text-slate-500">
              Expires: {expiresAt}
            </p>
          )}

          {/* Action Buttons */}
          <div className="mt-4 flex gap-2">
            {status === 'pending' && onConfirm && (
              <button
                onClick={onConfirm}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Confirm
              </button>
            )}
            {status === 'pending' && onReject && (
              <button
                onClick={onReject}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-colors"
              >
                Reject
              </button>
            )}
            {onNavigate && (
              <button
                onClick={onNavigate}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                View Details
                <ExternalLink className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}