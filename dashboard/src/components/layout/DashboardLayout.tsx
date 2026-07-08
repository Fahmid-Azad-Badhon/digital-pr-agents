'use client'

/**
 * Dashboard Layout Component
 * Main layout wrapper with Sidebar, Header, and Content area
 * 
 * Features:
 * - Responsive sidebar integration
 * - Agent status in header
 * - Page title and breadcrumbs
 * - Mobile-friendly design
 */

import { useState, ReactNode } from 'react'
import Sidebar from './Sidebar'
import { 
  Bell, 
  Search, 
  Settings, 
  Wifi,
  WifiOff,
  Clock
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface AgentStatus {
  id: string
  name: string
  status: 'idle' | 'working' | 'completed' | 'error'
  progress?: number
}

interface DashboardLayoutProps {
  children: ReactNode
  title?: string
  breadcrumbs?: { label: string; href?: string }[]
  agentStatuses?: AgentStatus[]
  showTime?: boolean
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function DashboardLayout({
  children,
  title = 'Dashboard',
  breadcrumbs = [],
  agentStatuses = [],
  showTime = true
}: DashboardLayoutProps) {
  const [isOnline] = useState(true)
  const [currentTime] = useState(new Date())


  return (
    <div className="min-h-screen bg-slate-900">
      {/* Sidebar */}
      <Sidebar agentStatuses={agentStatuses} />

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            {/* Left: Title & Breadcrumbs */}
            <div>
              {breadcrumbs.length > 0 && (
                <nav className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                  {breadcrumbs.map((crumb, idx) => (
                    <span key={idx} className="flex items-center gap-2">
                      {idx > 0 && <span>/</span>}
                      {crumb.href ? (
                        <a href={crumb.href} className="hover:text-cyan-400">
                          {crumb.label}
                        </a>
                      ) : (
                        <span>{crumb.label}</span>
                      )}
                    </span>
                  ))}
                </nav>
              )}
              <h1 className="text-xl lg:text-2xl font-bold text-slate-200">
                {title}
              </h1>
            </div>

            {/* Right: Actions & Status */}
            <div className="flex items-center gap-3 lg:gap-4">
              {/* Online Status */}
              <div className={`
                hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
                ${isOnline ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}
              `}>
                {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                <span className="hidden md:inline">{isOnline ? 'Online' : 'Offline'}</span>
              </div>

              {/* Time */}
              {showTime && (
                <div className="hidden lg:flex items-center gap-2 text-slate-400 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{currentTime.toLocaleTimeString()}</span>
                </div>
              )}

              {/* Search */}
              <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                <Search className="w-5 h-5 text-slate-400" />
              </button>

              {/* Notifications */}
              <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors relative">
                <Bell className="w-5 h-5 text-slate-400" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-cyan-500 rounded-full" />
              </button>

              {/* Settings */}
              <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                <Settings className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Agent Status Bar */}
          {agentStatuses.length > 0 && (
            <div className="px-4 lg:px-8 pb-3 overflow-x-auto">
              <div className="flex gap-2">
                {agentStatuses.map(agent => {
                  const statusColors = {
                    idle: 'bg-slate-600',
                    working: 'bg-cyan-500',
                    completed: 'bg-emerald-500',
                    error: 'bg-red-500'
                  }
                  const statusLabels = {
                    idle: 'Idle',
                    working: 'Working',
                    completed: 'Done',
                    error: 'Error'
                  }
                  return (
                    <div 
                      key={agent.id}
                      className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg text-xs whitespace-nowrap"
                    >
                      <div className={`w-2 h-2 rounded-full ${statusColors[agent.status]} ${agent.status === 'working' ? 'animate-pulse' : ''}`} />
                      <span className="text-slate-300">{agent.name}</span>
                      {agent.progress !== undefined && (
                        <span className="text-slate-500">{agent.progress}%</span>
                      )}
                      <span className={`text-slate-500 ${agent.status === 'completed' ? 'text-emerald-400' : ''}`}>
                        {statusLabels[agent.status]}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}