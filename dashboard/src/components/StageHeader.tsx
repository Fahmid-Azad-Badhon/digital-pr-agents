'use client'

import { Brain, UserCheck, Database, Search, Lightbulb, Target, Users, FileText, Mail, Package, Shield, Rocket } from 'lucide-react'
import { AGENTS } from '@/types/index'
import clsx from 'clsx'

interface StageHeaderProps {
  stageNumber: number
  stageName: string
  agentId: string
  showDetails?: boolean
}

const agentIcons: Record<string, React.ReactNode> = {
  orchestrator: <Brain size={16} />,
  'human-reviewer': <UserCheck size={16} />,
  extractor: <Database size={16} />,
  researcher: <Search size={16} />,
  strategist: <Lightbulb size={16} />,
  'beat-matcher': <Target size={16} />,
  collector: <Users size={16} />,
  intelligence: <Search size={16} />,
  copywriter: <FileText size={16} />,
  optimizer: <Mail size={16} />,
  packager: <Package size={16} />,
  validator: <Shield size={16} />,
  production: <Rocket size={16} />
}

const agentColors: Record<string, string> = {
  orchestrator: 'blue',
  'human-reviewer': 'amber',
  extractor: 'green',
  researcher: 'purple',
  strategist: 'orange',
  'beat-matcher': 'pink',
  collector: 'cyan',
  intelligence: 'indigo',
  copywriter: 'yellow',
  optimizer: 'teal',
  packager: 'rose',
  validator: 'violet',
  production: 'lime'
}

export default function StageHeader({ stageNumber, stageName, agentId }: StageHeaderProps) {
  const agent = AGENTS.find(a => a.id === agentId)
  const colorName = agentColors[agentId] || 'blue'
  const icon = agentIcons[agentId] || <Brain size={16} />

  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-[#1E293B] border border-[#334155] rounded-lg mb-6">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-[#64748B] uppercase">Stage</span>
        <span className="text-lg font-bold text-white">{stageNumber}</span>
      </div>
      <div className="h-6 w-px bg-[#334155]" />
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-[#64748B] uppercase">Name</span>
        <span className="text-sm text-white">{stageName}</span>
      </div>
      <div className="h-6 w-px bg-[#334155]" />
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-[#64748B] uppercase">Agent</span>
        <div className={clsx(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full',
          `bg-${colorName}-500/20`
        )}>
          <span className={`text-${colorName}-400`}>
            {icon}
          </span>
          <span className="text-sm font-medium text-white">{agent?.name || agentId}</span>
        </div>
      </div>
    </div>
  )
}