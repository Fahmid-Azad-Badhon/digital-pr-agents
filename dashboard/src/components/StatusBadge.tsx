'use client'

/**
 * StatusBadge Component
 * Displays status with color-coded badge
 */

import { CheckCircle, Clock, AlertCircle, Pause, Play, XCircle, Archive } from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

export type BadgeStatus = 
  | 'pending' 
  | 'in-progress' 
  | 'completed' 
  | 'failed' 
  | 'paused' 
  | 'running' 
  | 'archived'
  | 'draft'

interface StatusBadgeProps {
  status: BadgeStatus
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  label?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function StatusBadge({ 
  status, 
  size = 'md', 
  showIcon = true,
  label 
}: StatusBadgeProps) {
  const config = {
    pending: {
      bg: 'bg-slate-500/20',
      text: 'text-slate-400',
      border: 'border-slate-500/30',
      icon: <Clock className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />,
      defaultLabel: 'Pending'
    },
    'in-progress': {
      bg: 'bg-cyan-500/20',
      text: 'text-cyan-400',
      border: 'border-cyan-500/30',
      icon: <Clock className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />,
      defaultLabel: 'In Progress'
    },
    completed: {
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      icon: <CheckCircle className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />,
      defaultLabel: 'Completed'
    },
    failed: {
      bg: 'bg-red-500/20',
      text: 'text-red-400',
      border: 'border-red-500/30',
      icon: <XCircle className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />,
      defaultLabel: 'Failed'
    },
    paused: {
      bg: 'bg-amber-500/20',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      icon: <Pause className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />,
      defaultLabel: 'Paused'
    },
    running: {
      bg: 'bg-green-500/20',
      text: 'text-green-400',
      border: 'border-green-500/30',
      icon: <Play className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />,
      defaultLabel: 'Running'
    },
    archived: {
      bg: 'bg-slate-500/20',
      text: 'text-slate-400',
      border: 'border-slate-500/30',
      icon: <Archive className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />,
      defaultLabel: 'Archived'
    },
    draft: {
      bg: 'bg-purple-500/20',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
      icon: <AlertCircle className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />,
      defaultLabel: 'Draft'
    }
  }

  const c = config[status] || config.pending

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-sm'
  }

  return (
    <span className={`
      inline-flex items-center gap-1.5 rounded-full border
      ${c.bg} ${c.text} ${c.border} ${sizeClasses[size]}
    `}>
      {showIcon && c.icon}
      <span className="font-medium">{label || c.defaultLabel}</span>
    </span>
  )
}