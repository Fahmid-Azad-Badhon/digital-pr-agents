'use client'

/**
 * Advanced Sidebar Component
 * Navigation sidebar with active state, icons, and responsive design
 * 
 * Features:
 * - Active route highlighting
 * - Icon + label navigation
 * - Agent status indicators
 * - Collapse/expand functionality
 * - Windows-compatible paths
 */

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Workflow, 
  Target, 
  Users, 
  FileText, 
  Mail, 
  Package, 
  CheckCircle,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Clock,
  Shield,
  Zap,
  Search
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: number
  badgeColor?: string
}

interface AgentStatus {
  id: string
  status: 'idle' | 'working' | 'completed' | 'error'
}

// ============================================================================
// NAVIGATION ITEMS
// ============================================================================

const MAIN_NAV: NavItem[] = [
  { 
    label: 'Overview', 
    href: '/', 
    icon: <LayoutDashboard className="w-5 h-5" /> 
  },
  { 
    label: 'Workflow Monitor', 
    href: '/workflow', 
    icon: <Workflow className="w-5 h-5" /> 
  },
  { 
    label: 'Approval Queue', 
    href: '/approvals', 
    icon: <CheckCircle className="w-5 h-5" /> 
  },
]

const CAMPAIGN_BUILD_NAV: NavItem[] = [
  { 
    label: 'S1 Campaign Intake', 
    href: '/campaigns/create', 
    icon: <FileText className="w-5 h-5" /> 
  },
  { 
    label: 'S2 Data Extraction', 
    href: '/data-extraction', 
    icon: <Package className="w-5 h-5" /> 
  },
  { 
    label: 'S3 Research Enrichment', 
    href: '/research-enrichment', 
    icon: <Search className="w-5 h-5" />
  },
  { 
    label: 'S4 Data & Research Analyst', 
    href: '/analysis', 
    icon: <BarChart3 className="w-5 h-5" /> 
  },
  { 
    label: 'S5 Angle Generation', 
    href: '/angles', 
    icon: <Target className="w-5 h-5" />,
    badge: 40,
    badgeColor: 'bg-cyan-500'
  },
  { 
    label: 'S6 Beat Matching', 
    href: '/angle-selection', 
    icon: <Target className="w-5 h-5" /> 
  },
  { 
    label: 'S7 Pitch Selection (Human Gate)', 
    href: '/pitch-selection', 
    icon: <Mail className="w-5 h-5" /> 
  },
]

const OUTREACH_NAV: NavItem[] = [
  { 
    label: 'S8 Journalist Collection', 
    href: '/journalists', 
    icon: <Users className="w-5 h-5" /> 
  },
  { 
    label: 'S9 Journalist Intelligence', 
    href: '/media-list', 
    icon: <Users className="w-5 h-5" /> 
  },
  { 
    label: 'S10 Pitch Drafting', 
    href: '/pitches', 
    icon: <Mail className="w-5 h-5" /> 
  },
  { 
    label: 'S11 Email Optimization', 
    href: '/optimization', 
    icon: <Zap className="w-5 h-5" /> 
  },
  { 
    label: 'S12 Final Package', 
    href: '/package', 
    icon: <Package className="w-5 h-5" /> 
  },
  { 
    label: 'Follow-Up Tracker', 
    href: '/follow-up', 
    icon: <Clock className="w-5 h-5" /> 
  },
]

const VALIDATION_NAV: NavItem[] = [
  { 
    label: 'S13 Google Doc Export', 
    href: '/package', 
    icon: <Package className="w-5 h-5" /> 
  },
  { 
    label: 'S14 Technical Validation', 
    href: '/validation', 
    icon: <CheckCircle className="w-5 h-5" /> 
  },
  { 
    label: 'S15 Browser Validation', 
    href: '/validation', 
    icon: <Shield className="w-5 h-5" /> 
  },
  { 
    label: 'S16 Regression & Production', 
    href: '/reporting', 
    icon: <BarChart3 className="w-5 h-5" /> 
  },
  { 
    label: 'Placement Tracker', 
    href: '/placements', 
    icon: <Target className="w-5 h-5" /> 
  },
  { 
    label: 'Reporting', 
    href: '/reporting', 
    icon: <BarChart3 className="w-5 h-5" /> 
  },
]

const SYSTEM_NAV: NavItem[] = [
  { 
    label: 'Connection Audit', 
    href: '/connection-audit', 
    icon: <CheckCircle className="w-5 h-5" /> 
  },
  { 
    label: 'Agent Fleet', 
    href: '/agents', 
    icon: <Zap className="w-5 h-5" /> 
  },
  { 
    label: 'Model Routing', 
    href: '/models', 
    icon: <Zap className="w-5 h-5" /> 
  },
  { 
    label: 'Logs & Errors', 
    href: '/logs', 
    icon: <Clock className="w-5 h-5" /> 
  },
  { 
    label: 'Observability', 
    href: '/observability', 
    icon: <BarChart3 className="w-5 h-5" /> 
  },
  { 
    label: 'Settings', 
    href: '/settings', 
    icon: <Settings className="w-5 h-5" /> 
  },
]

// ============================================================================
// COMPONENT
// ============================================================================

export default function Sidebar({ 
  agentStatuses = [] 
}: { 
  agentStatuses?: AgentStatus[]
}) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const getAgentStatus = (agentId: string): AgentStatus['status'] => {
    const agent = agentStatuses.find(a => a.id === agentId)
    return agent?.status || 'idle'
  }

  const renderNavItem = (item: NavItem, isActive: boolean) => (
    <Link
      key={item.href}
      href={item.href}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
        ${isActive 
          ? 'bg-cyan-500/20 text-cyan-400 border-l-2 border-cyan-400' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
        }
        ${isCollapsed ? 'justify-center' : ''}
      `}
      onClick={() => setIsMobileOpen(false)}
    >
      <span className={isActive ? 'text-cyan-400' : 'text-slate-500'}>
        {item.icon}
      </span>
      
      {!isCollapsed && (
        <>
          <span className="flex-1 text-sm font-medium">{item.label}</span>
          
          {item.badge && (
            <span className={`px-2 py-0.5 text-xs rounded-full ${item.badgeColor || 'bg-slate-700'} text-white`}>
              {item.badge}
            </span>
          )}
        </>
      )}
      
      {isCollapsed && item.badge && (
        <span className={`absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-[10px] rounded-full ${item.badgeColor || 'bg-slate-700'} text-white`}>
          {item.badge}
        </span>
      )}
    </Link>
  )

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-screen bg-slate-900 border-r border-slate-800 
        z-50 flex flex-col transition-all duration-300
        ${isCollapsed ? 'w-20' : 'w-64'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                  <Workflow className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Digital PR
                </span>
              </div>
            )}
            
            {isCollapsed && (
              <div className="w-8 h-8 mx-auto rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                <Workflow className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Agent Status Bar */}
        {!isCollapsed && (
          <div className="px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-1 mb-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-medium text-slate-400">Agents</span>
            </div>
            <div className="flex gap-1">
              {['orchestrator', 'extractor', 'strategist', 'collector'].map(id => {
                const status = getAgentStatus(id)
                const colors = {
                  idle: 'bg-slate-600',
                  working: 'bg-cyan-500 animate-pulse',
                  completed: 'bg-emerald-500',
                  error: 'bg-red-500'
                }
                return (
                  <div 
                    key={id} 
                    className={`w-2 h-2 rounded-full ${colors[status]}`}
                    title={id}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Main Nav */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 py-2 text-xs font-semibold text-cyan-400/70 uppercase tracking-wider">
                Main
              </div>
            )}
            {MAIN_NAV.map(item => renderNavItem(item, pathname === item.href))}
          </div>

          {/* Campaign Build */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 py-2 text-xs font-semibold text-cyan-400/70 uppercase tracking-wider">
                Campaign Build
              </div>
            )}
            {CAMPAIGN_BUILD_NAV.map(item => renderNavItem(item, pathname === item.href))}
          </div>

          {/* Outreach */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 py-2 text-xs font-semibold text-cyan-400/70 uppercase tracking-wider">
                Outreach
              </div>
            )}
            {OUTREACH_NAV.map(item => renderNavItem(item, pathname === item.href))}
          </div>

          {/* Delivery */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 py-2 text-xs font-semibold text-cyan-400/70 uppercase tracking-wider">
                Delivery
              </div>
            )}
            {VALIDATION_NAV.map(item => renderNavItem(item, pathname === item.href))}
          </div>

          {/* System */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 py-2 text-xs font-semibold text-cyan-400/70 uppercase tracking-wider">
                System
              </div>
            )}
            {SYSTEM_NAV.map(item => renderNavItem(item, pathname === item.href))}
          </div>
        </nav>

        {/* Footer - Collapse Button */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`
              hidden lg:flex items-center gap-3 px-3 py-2.5 rounded-lg 
              text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors w-full
              ${isCollapsed ? 'justify-center' : ''}
            `}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed bottom-4 left-4 z-40 lg:hidden w-12 h-12 bg-cyan-600 hover:bg-cyan-700 rounded-full shadow-lg flex items-center justify-center"
      >
        <Workflow className="w-6 h-6 text-white" />
      </button>
    </>
  )
}
