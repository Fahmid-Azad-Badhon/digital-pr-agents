'use client'

/**
 * RecentActivityLog Component
 * Displays recent activity log entries with filtering
 */

import { useState } from 'react'
import { 
  Clock, 
  Filter, 
  AlertCircle, 
  Info, 
  AlertTriangle,
  RefreshCw,
  ExternalLink
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical'

export interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  message: string
  stage?: string
  agent?: string
  metadata?: Record<string, unknown>
}

interface RecentActivityLogProps {
  logs: LogEntry[]
  maxHeight?: string
  showFilters?: boolean
  showTimestamp?: boolean
  onEntryClick?: (entry: LogEntry) => void
  onRefresh?: () => void
  autoRefresh?: boolean
  refreshInterval?: number
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function RecentActivityLog({
  logs,
  maxHeight = 'h-96',
  showFilters = true,
  showTimestamp = true,
  onEntryClick,
  onRefresh,
  autoRefresh: _autoRefresh = false,
  refreshInterval: _refreshInterval = 5000
}: RecentActivityLogProps) {
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const getLevelConfig = (level: LogLevel) => {
    switch (level) {
      case 'debug':
        return { icon: <Info className="w-4 h-4" />, color: 'text-slate-500', bg: 'bg-slate-500/10' }
      case 'info':
        return { icon: <Info className="w-4 h-4" />, color: 'text-blue-400', bg: 'bg-blue-500/10' }
      case 'warning':
        return { icon: <AlertTriangle className="w-4 h-4" />, color: 'text-amber-400', bg: 'bg-amber-500/10' }
      case 'error':
        return { icon: <AlertCircle className="w-4 h-4" />, color: 'text-red-400', bg: 'bg-red-500/10' }
      case 'critical':
        return { icon: <AlertCircle className="w-4 h-4" />, color: 'text-red-500', bg: 'bg-red-500/20' }
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    })
  }

  const filteredLogs = logs.filter(log => {
    if (levelFilter !== 'all' && log.level !== levelFilter) return false
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const levelCounts = logs.reduce((acc, log) => {
    acc[log.level] = (acc[log.level] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-slate-400" />
          <h3 className="font-semibold text-slate-200">Activity Log</h3>
          <span className="px-2 py-0.5 bg-slate-700 text-slate-400 text-xs rounded">
            {filteredLogs.length} entries
          </span>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </button>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex items-center gap-4 p-4 border-b border-slate-700/50">
          {/* Level Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as LogLevel | 'all')}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-300"
            >
              <option value="all">All Levels</option>
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Level Counts */}
          <div className="flex items-center gap-2">
            {Object.entries(levelCounts).map(([level, count]) => {
              const config = getLevelConfig(level as LogLevel)
              return (
                <button
                  key={level}
                  onClick={() => setLevelFilter(level as LogLevel)}
                  className={`
                    px-2 py-1 text-xs rounded flex items-center gap-1
                    ${levelFilter === level ? config.bg : 'bg-slate-700 text-slate-400'}
                  `}
                >
                  <span className={config.color}>{level}</span>
                  <span className="text-slate-500">{count}</span>
                </button>
              )
            })}
          </div>

          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-300 placeholder-slate-500"
            />
          </div>
        </div>
      )}

      {/* Log Entries */}
      <div className={`overflow-y-auto ${maxHeight}`}>
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No log entries found
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {filteredLogs.map((entry) => {
              const config = getLevelConfig(entry.level)
              
              return (
                <div 
                  key={entry.id}
                  onClick={() => onEntryClick?.(entry)}
                  className={`
                    p-4 hover:bg-slate-700/30 cursor-pointer transition-colors
                    ${entry.level === 'error' || entry.level === 'critical' ? 'bg-red-500/5' : ''}
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* Level Icon */}
                    <div className={`mt-0.5 ${config.color}`}>
                      {config.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {showTimestamp && (
                          <span className="text-xs text-slate-500 font-mono">
                            {formatTimestamp(entry.timestamp)}
                          </span>
                        )}
                        {entry.agent && (
                          <span className="px-1.5 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded">
                            {entry.agent}
                          </span>
                        )}
                        {entry.stage && (
                          <span className="text-xs text-slate-500">
                            Stage: {entry.stage}
                          </span>
                        )}
                      </div>

                      <p className={`text-sm mt-1 ${entry.level === 'error' || entry.level === 'critical' ? 'text-red-300' : 'text-slate-300'}`}>
                        {entry.message}
                      </p>

                      {entry.metadata && (
                        <div className="mt-2 text-xs text-slate-500 font-mono bg-slate-900/50 p-2 rounded">
                          {JSON.stringify(entry.metadata, null, 1).slice(0, 100)}
                        </div>
                      )}
                    </div>

                    {/* Action */}
                    {onEntryClick && (
                      <ExternalLink className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}