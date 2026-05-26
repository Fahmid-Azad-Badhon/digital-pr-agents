'use client'

/**
 * OverviewMetricCard Component
 * Displays key metrics with trend indicators
 */

import { ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface OverviewMetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  color?: 'cyan' | 'emerald' | 'amber' | 'red' | 'purple' | 'blue' | 'pink'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function OverviewMetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  color = 'cyan',
  size = 'md',
  onClick
}: OverviewMetricCardProps) {
  const colorClasses = {
    cyan: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      iconBg: 'bg-cyan-500/20',
      iconColor: 'text-cyan-400',
      glow: 'group-hover:shadow-cyan-500/20'
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-400',
      glow: 'group-hover:shadow-emerald-500/20'
    },
    amber: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-400',
      glow: 'group-hover:shadow-amber-500/20'
    },
    red: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-400',
      glow: 'group-hover:shadow-red-500/20'
    },
    purple: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-400',
      glow: 'group-hover:shadow-purple-500/20'
    },
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      glow: 'group-hover:shadow-blue-500/20'
    },
    pink: {
      bg: 'bg-pink-500/10',
      border: 'border-pink-500/30',
      iconBg: 'bg-pink-500/20',
      iconColor: 'text-pink-400',
      glow: 'group-hover:shadow-pink-500/20'
    }
  }

  const c = colorClasses[color]

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5'
  }

  const valueSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  }

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColors = {
    up: 'text-emerald-400',
    down: 'text-red-400',
    neutral: 'text-slate-400'
  }

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`
        group w-full text-left rounded-xl border ${c.bg} ${c.border}
        ${sizeClasses[size]} transition-all hover:scale-[1.02]
        hover:shadow-lg ${c.glow} disabled:cursor-default disabled:hover:scale-100
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-400 mb-1">{title}</p>
          
          <div className={`font-bold ${valueSizes[size]} text-slate-200`}>
            {value}
          </div>

          {subtitle && (
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          )}

          {trend && trendValue && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${trendColors[trend]}`}>
              <TrendIcon className="w-3 h-3" />
              <span>{trendValue}</span>
            </div>
          )}
        </div>

        {icon && (
          <div className={`w-10 h-10 rounded-lg ${c.iconBg} flex items-center justify-center ${c.iconColor}`}>
            {icon}
          </div>
        )}
      </div>
    </button>
  )
}