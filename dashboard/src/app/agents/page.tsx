'use client'

import { ALL_AGENTS } from '@/types/agentData'
import { getAgentRegistryEntry } from '@/data/agentBrainRegistry'
import { Brain, UserCheck, Database, Search, Lightbulb, Target, Users, FileText, Mail, Package, Shield, Rocket, Activity, ChevronDown, ChevronRight, Clock, Zap, CheckCircle, AlertCircle, BarChart3, Layers, ArrowRight, Workflow, BrainCircuit } from 'lucide-react'
import clsx from 'clsx'
import { useState } from 'react'

const agentIcons: Record<string, React.ReactNode> = {
  orchestrator: <Brain size={20} />,
  'human-reviewer': <UserCheck size={20} />,
  extractor: <Database size={20} />,
  researcher: <Search size={20} />,
  strategist: <Lightbulb size={20} />,
  'beat-matcher': <Target size={20} />,
  collector: <Users size={20} />,
  intelligence: <Search size={20} />,
  copywriter: <FileText size={20} />,
  optimizer: <Mail size={20} />,
  packager: <Package size={20} />,
  validator: <Shield size={20} />,
  production: <Rocket size={20} />
}

const agentColors: Record<string, { bg: string; text: string; border: string; soft: string }> = {
  orchestrator: { bg: 'bg-blue-600', text: 'text-blue-400', border: 'border-blue-600/30', soft: 'bg-blue-500/10' },
  'human-reviewer': { bg: 'bg-amber-600', text: 'text-amber-400', border: 'border-amber-600/30', soft: 'bg-amber-500/10' },
  extractor: { bg: 'bg-green-600', text: 'text-green-400', border: 'border-green-600/30', soft: 'bg-green-500/10' },
  researcher: { bg: 'bg-purple-600', text: 'text-purple-400', border: 'border-purple-600/30', soft: 'bg-purple-500/10' },
  strategist: { bg: 'bg-orange-600', text: 'text-orange-400', border: 'border-orange-600/30', soft: 'bg-orange-500/10' },
  'beat-matcher': { bg: 'bg-pink-600', text: 'text-pink-400', border: 'border-pink-600/30', soft: 'bg-pink-500/10' },
  collector: { bg: 'bg-cyan-600', text: 'text-cyan-400', border: 'border-cyan-600/30', soft: 'bg-cyan-500/10' },
  intelligence: { bg: 'bg-indigo-600', text: 'text-indigo-400', border: 'border-indigo-600/30', soft: 'bg-indigo-500/10' },
  copywriter: { bg: 'bg-yellow-600', text: 'text-yellow-400', border: 'border-yellow-600/30', soft: 'bg-yellow-500/10' },
  optimizer: { bg: 'bg-teal-600', text: 'text-teal-400', border: 'border-teal-600/30', soft: 'bg-teal-500/10' },
  packager: { bg: 'bg-rose-600', text: 'text-rose-400', border: 'border-rose-600/30', soft: 'bg-rose-500/10' },
  validator: { bg: 'bg-violet-600', text: 'text-violet-400', border: 'border-violet-600/30', soft: 'bg-violet-500/10' },
  production: { bg: 'bg-lime-600', text: 'text-lime-400', border: 'border-lime-600/30', soft: 'bg-lime-500/10' }
}

const priorityColors: Record<string, string> = {
  critical: 'text-red-400 bg-red-500/10',
  high: 'text-orange-400 bg-orange-500/10',
  medium: 'text-yellow-400 bg-yellow-500/10',
  low: 'text-slate-400 bg-slate-500/10'
}

interface AgentSectionProps {
  agent: typeof ALL_AGENTS[0]
  colors: typeof agentColors[string]
  icon: React.ReactNode
  expandedSections: string[]
  toggleSection: (section: string) => void
}

function AgentCard({ agent, colors, icon, expandedSections, toggleSection }: AgentSectionProps) {
  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden hover:border-cyan-500/30 transition-all">
      {/* Header */}
      <div className="p-4 border-b border-[#334155]">
        <div className="flex items-start gap-3">
          <div className={clsx('w-12 h-12 rounded-lg flex items-center justify-center', colors.bg)}>
            <span className="text-white">{icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white">{agent.identity.displayName}</h3>
            <p className="text-sm text-[#64748B]">{agent.role.title}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={clsx('text-xs px-2 py-0.5 rounded-full', colors.soft, colors.text)}>
                {agent.identity.category}
              </span>
              <span className={clsx('text-xs px-2 py-0.5 rounded-full', priorityColors[agent.identity.priority])}>
                {agent.identity.priority}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="p-4 border-b border-[#334155]">
        <p className="text-sm text-[#94A3B8]">{agent.description.short}</p>
        <p className="text-xs text-[#64748B] mt-2">{agent.identity.oneLineSummary}</p>
      </div>

      {/* Stats */}
      <div className="p-4 border-b border-[#334155]">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-cyan-400">
              <CheckCircle size={16} />
              <span className="text-lg font-bold">{agent.tasks.length}</span>
            </div>
            <p className="text-xs text-[#64748B] mt-1">Tasks</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-purple-400">
              <Zap size={16} />
              <span className="text-lg font-bold">{agent.capabilities.length}</span>
            </div>
            <p className="text-xs text-[#64748B] mt-1">Capabilities</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-green-400">
              <Clock size={16} />
              <span className="text-lg font-bold">{agent.identity.agentNumber}</span>
            </div>
            <p className="text-xs text-[#64748B] mt-1">Agent #</p>
          </div>
        </div>
      </div>

      {/* Workflow Info */}
      <div className="p-4 border-b border-[#334155]">
        <div className="flex items-center gap-2 mb-2">
          <Workflow size={14} className="text-[#64748B]" />
          <span className="text-xs text-[#64748B]">Workflow</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs px-2 py-1 bg-[#273449] rounded text-[#94A3B8]">
            Stage: {agent.identity.workflowStage}
          </span>
          <span className="text-xs px-2 py-1 bg-[#273449] rounded text-[#94A3B8]">
            Complexity: {agent.identity.complexityLevel}
          </span>
          <span className="text-xs px-2 py-1 bg-[#273449] rounded text-[#94A3B8]">
            Automation: {agent.automation.automationLevel}
          </span>
        </div>
      </div>

      {/* Primary Responsibilities */}
      <div className="p-4 border-b border-[#334155]">
        <div className="flex items-center gap-2 mb-2">
          <Layers size={14} className="text-[#64748B]" />
          <span className="text-xs text-[#64748B]">Primary Responsibilities</span>
        </div>
        <ul className="space-y-1">
          {agent.responsibilities.primaryResponsibilities.slice(0, 3).map((resp, idx) => (
            <li key={idx} className="text-xs text-[#94A3B8] flex items-start gap-2">
              <ArrowRight size={12} className="text-cyan-500 mt-0.5 flex-shrink-0" />
              {resp}
            </li>
          ))}
        </ul>
      </div>

      {/* Efficiency Metrics */}
      <div className="p-4 border-b border-[#334155]">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 size={14} className="text-[#64748B]" />
          <span className="text-xs text-[#64748B]">Efficiency</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-[#64748B]">Manual Time:</span>
            <span className="text-[#94A3B8]">{agent.efficiency.estimatedManualTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#64748B]">Agent Time:</span>
            <span className="text-[#94A3B8]">{agent.efficiency.estimatedAgentTime}</span>
          </div>
          <div className="flex justify-between col-span-2">
            <span className="text-[#64748B]">Time Saved:</span>
            <span className="text-green-400">{agent.efficiency.estimatedTimeSaved}</span>
          </div>
        </div>
      </div>

      {/* Expandable Sections */}
      <div className="divide-y divide-[#334155]">
        {/* Tasks Section */}
        <button
          onClick={() => toggleSection(`${agent.identity.id}-tasks`)}
          className="w-full p-3 flex items-center justify-between hover:bg-[#273449] transition-colors"
        >
          <span className="text-sm text-white flex items-center gap-2">
            <CheckCircle size={14} className="text-cyan-400" />
            Tasks ({agent.tasks.length})
          </span>
          {expandedSections.includes(`${agent.identity.id}-tasks`) ? (
            <ChevronDown size={16} className="text-[#64748B]" />
          ) : (
            <ChevronRight size={16} className="text-[#64748B]" />
          )}
        </button>
        {expandedSections.includes(`${agent.identity.id}-tasks`) && (
          <div className="p-3 bg-[#0F172A] max-h-64 overflow-y-auto">
            <div className="space-y-2">
              {agent.tasks.map((task) => (
                <div key={task.id} className="text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[#64748B] font-mono">{task.id}</span>
                    <span className="text-white">{task.name}</span>
                    <span className={clsx('ml-auto text-xs px-1.5 py-0.5 rounded', priorityColors[(task as any).priority || 'medium'])}>
                      {(task as any).priority}
                    </span>
                  </div>
                  <p className="text-[#64748B] mt-1 ml-4">{task.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Capabilities Section */}
        <button
          onClick={() => toggleSection(`${agent.identity.id}-capabilities`)}
          className="w-full p-3 flex items-center justify-between hover:bg-[#273449] transition-colors"
        >
          <span className="text-sm text-white flex items-center gap-2">
            <Zap size={14} className="text-purple-400" />
            Capabilities ({agent.capabilities.length})
          </span>
          {expandedSections.includes(`${agent.identity.id}-capabilities`) ? (
            <ChevronDown size={16} className="text-[#64748B]" />
          ) : (
            <ChevronRight size={16} className="text-[#64748B]" />
          )}
        </button>
        {expandedSections.includes(`${agent.identity.id}-capabilities`) && (
          <div className="p-3 bg-[#0F172A] max-h-64 overflow-y-auto">
            <div className="space-y-2">
              {agent.capabilities.map((cap) => (
                <div key={cap.id} className="text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[#64748B] font-mono">{cap.id}</span>
                    <span className="text-white">{cap.name}</span>
                    <span className="ml-auto text-xs px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-400">
                      {cap.strengthLevel}
                    </span>
                  </div>
                  <p className="text-[#64748B] mt-1 ml-4">{cap.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Workflow Connections Section */}
        <button
          onClick={() => toggleSection(`${agent.identity.id}-workflow`)}
          className="w-full p-3 flex items-center justify-between hover:bg-[#273449] transition-colors"
        >
          <span className="text-sm text-white flex items-center gap-2">
            <Workflow size={14} className="text-green-400" />
            Workflow Connections
          </span>
          {expandedSections.includes(`${agent.identity.id}-workflow`) ? (
            <ChevronDown size={16} className="text-[#64748B]" />
          ) : (
            <ChevronRight size={16} className="text-[#64748B]" />
          )}
        </button>
        {expandedSections.includes(`${agent.identity.id}-workflow`) && (
          <div className="p-3 bg-[#0F172A]">
            <div className="text-xs space-y-2">
              <div>
                <span className="text-[#64748B]">Receives From:</span>
                <span className="text-[#94A3B8] ml-2">{agent.workflow.receivesFrom?.join(', ') || 'None'}</span>
              </div>
              <div>
                <span className="text-[#64748B]">Sends To:</span>
                <span className="text-[#94A3B8] ml-2">{agent.workflow.sendsTo || 'None'}</span>
              </div>
              <div>
                <span className="text-[#64748B]">Previous Agents:</span>
                <span className="text-[#94A3B8] ml-2">{agent.workflow.previousAgents?.join(', ') || 'None'}</span>
              </div>
              <div>
                <span className="text-[#64748B]">Next Agents:</span>
                <span className="text-[#94A3B8] ml-2">{agent.workflow.nextAgents?.join(', ') || 'None'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="p-3 flex items-center justify-between bg-[#0F172A]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs text-[#64748B]">Status: {agent.status.label}</span>
        </div>
        <span className="text-xs text-[#64748B]">v{agent.status.version}</span>
      </div>

      {/* Brain Status */}
      {(function() {
        const brain = getAgentRegistryEntry(agent.identity.id as any);
        return brain ? (
          <div className="p-3 bg-[#1E293B] border-t border-[#334155]">
            <div className="flex items-center gap-2 mb-2">
              <BrainCircuit size={12} className="text-cyan-400" />
              <span className="text-xs text-[#94A3B8]">Brain Status</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <CheckCircle size={10} className="text-green-400" />
                <span className="text-[#64748B]">Brain File:</span>
                <span className="text-[#94A3B8]">Loaded</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle size={10} className="text-green-400" />
                <span className="text-[#64748B]">Inputs:</span>
                <span className="text-[#94A3B8]">{brain.requiredInputs.length} required</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle size={10} className="text-green-400" />
                <span className="text-[#64748B]">Tools:</span>
                <span className="text-[#94A3B8]">{brain.allowedTools.length} allowed</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle size={10} className="text-green-400" />
                <span className="text-[#64748B]">Guardrails:</span>
                <span className="text-[#94A3B8]">{brain.guardrailIds.length} active</span>
              </div>
            </div>
          </div>
        ) : null;
      })()}
    </div>
  )
}

export default function AgentsPage() {
  const [expandedSections, setExpandedSections] = useState<string[]>([])

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Agent Fleet</h1>
          <p className="text-[#94A3B8] mt-1">
            All {ALL_AGENTS.length} AI agents with {ALL_AGENTS.reduce((acc, a) => acc + a.tasks.length, 0)} tasks and {ALL_AGENTS.reduce((acc, a) => acc + a.capabilities.length, 0)} capabilities
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-[#1E293B] border border-[#334155] rounded-lg">
          <Activity size={16} className="text-cyan-400" />
          <span className="text-sm text-white">{ALL_AGENTS.length} Agents</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-4">
          <div className="flex items-center gap-2 text-[#64748B] mb-2">
            <CheckCircle size={16} className="text-cyan-400" />
            <span className="text-xs">Total Tasks</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {ALL_AGENTS.reduce((acc, a) => acc + a.tasks.length, 0)}
          </p>
        </div>
        <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-4">
          <div className="flex items-center gap-2 text-[#64748B] mb-2">
            <Zap size={16} className="text-purple-400" />
            <span className="text-xs">Total Capabilities</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {ALL_AGENTS.reduce((acc, a) => acc + a.capabilities.length, 0)}
          </p>
        </div>
        <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-4">
          <div className="flex items-center gap-2 text-[#64748B] mb-2">
            <Clock size={16} className="text-green-400" />
            <span className="text-xs">Avg Time Saved</span>
          </div>
          <p className="text-2xl font-bold text-white">90%+</p>
        </div>
        <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-4">
          <div className="flex items-center gap-2 text-[#64748B] mb-2">
            <AlertCircle size={16} className="text-amber-400" />
            <span className="text-xs">Active Agents</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {ALL_AGENTS.filter(a => a.status.label === 'active').length}
          </p>
        </div>
      </div>

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {ALL_AGENTS.map((agent) => {
          const colors = agentColors[agent.identity.id] || agentColors.orchestrator
          const icon = agentIcons[agent.identity.id] || agentIcons.orchestrator
          
          return (
            <AgentCard
              key={agent.identity.id}
              agent={agent}
              colors={colors}
              icon={icon}
              expandedSections={expandedSections}
              toggleSection={toggleSection}
            />
          )
        })}
      </div>
    </div>
  )
}