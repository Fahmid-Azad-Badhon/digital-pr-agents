'use client'

import { ReactNode } from 'react'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  color?: 'purple' | 'blue' | 'emerald' | 'amber' | 'red' | 'pink'
  glow?: boolean
}

const colorClasses = {
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    glow: 'shadow-purple-500/20'
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    glow: 'shadow-blue-500/20'
  },
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    glow: 'shadow-emerald-500/20'
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    glow: 'shadow-amber-500/20'
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    glow: 'shadow-red-500/20'
  },
  pink: {
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    text: 'text-pink-700',
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-600',
    glow: 'shadow-pink-500/20'
  }
}

export default function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend,
  trendValue,
  color = 'purple',
  glow = false
}: MetricCardProps) {
  const colors = colorClasses[color]
  
  return (
    <div className={`p-6 rounded-2xl border ${colors.bg} ${colors.border} ${glow ? `shadow-lg ${colors.glow}` : 'shadow-sm'} transition-all hover:scale-[1.02]`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{title}</p>
          <h3 className={`text-3xl font-black ${colors.text}`}>{value}</h3>
        </div>
        {icon && (
          <div className={`w-12 h-12 rounded-xl ${colors.iconBg} flex items-center justify-center ${colors.iconColor}`}>
            {icon}
          </div>
        )}
      </div>
      
      {(subtitle || trend) && (
        <div className="flex items-center gap-2">
          {subtitle && (
            <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
          )}
          {trend && trendValue && (
            <span className={`text-xs font-bold ${
              trend === 'up' ? 'text-emerald-600' : 
              trend === 'down' ? 'text-red-600' : 'text-slate-500'
            }`}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
            </span>
          )}
        </div>
      )}
    </div>
  )
}