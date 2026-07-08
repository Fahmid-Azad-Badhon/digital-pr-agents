'use client'

import { useState, useEffect } from 'react'
import { Activity, Cpu, Zap, Radio, Sparkles } from 'lucide-react'

const AGENTS = [
  { 
    id: 'digital-pr-orchestrator', 
    name: 'Orchestrator', 
    avatar: '🎯', 
    face: '😎',
    color: 'from-blue-500 to-indigo-600',
    glowColor: 'shadow-blue-500/50',
    role: 'Central Command',
    accent: 'text-blue-400',
    bgAccent: 'bg-blue-500/20'
  },
  { 
    id: 'study-insight-extractor', 
    name: 'Analyst', 
    avatar: '🔍', 
    face: '🤓',
    color: 'from-emerald-500 to-teal-600',
    glowColor: 'shadow-emerald-500/50',
    role: 'Data Extraction',
    accent: 'text-emerald-400',
    bgAccent: 'bg-emerald-500/20'
  },
  { 
    id: 'research-enrichment-agent', 
    name: 'Researcher', 
    avatar: '📊', 
    face: '🧐',
    color: 'from-amber-500 to-orange-600',
    glowColor: 'shadow-amber-500/50',
    role: 'Enrichment',
    accent: 'text-amber-400',
    bgAccent: 'bg-amber-500/20'
  },
  { 
    id: 'pitch-writer', 
    name: 'Creative Writer', 
    avatar: '✍️', 
    face: '🤩',
    color: 'from-purple-500 to-pink-600',
    glowColor: 'shadow-purple-500/50',
    role: 'Copywriting',
    accent: 'text-purple-400',
    bgAccent: 'bg-purple-500/20'
  },
  { 
    id: 'journalist-targeting-subagent', 
    name: 'Targeter', 
    avatar: '👥', 
    face: '🎭',
    color: 'from-cyan-500 to-blue-600',
    glowColor: 'shadow-cyan-500/50',
    role: 'Journalist Discovery',
    accent: 'text-cyan-400',
    bgAccent: 'bg-cyan-500/20'
  },
  { 
    id: 'pitch-drafter', 
    name: 'Drafter', 
    avatar: '📝', 
    face: '✏️',
    color: 'from-pink-500 to-rose-600',
    glowColor: 'shadow-pink-500/50',
    role: 'Pitch Generation',
    accent: 'text-pink-400',
    bgAccent: 'bg-pink-500/20'
  },
  { 
    id: 'production-packager', 
    name: 'Packager', 
    avatar: '📦', 
    face: '🤖',
    color: 'from-orange-500 to-red-600',
    glowColor: 'shadow-orange-500/50',
    role: 'Final Package',
    accent: 'text-orange-400',
    bgAccent: 'bg-orange-500/20'
  },
  { 
    id: 'email-optimizer', 
    name: 'Optimizer', 
    avatar: '📧', 
    face: '📨',
    color: 'from-teal-500 to-cyan-600',
    glowColor: 'shadow-teal-500/50',
    role: 'Email Optimization',
    accent: 'text-teal-400',
    bgAccent: 'bg-teal-500/20'
  }
]

const CARTOON_FACES = ['😎', '🤓', '🧐', '🤩', '🎭', '✏️', '🤖', '📨']

export default function AgentTracker({ currentAgentId }: { currentAgentId?: string }) {
  const activeAgent = AGENTS.find(a => a.id === currentAgentId) || AGENTS[0]
  const [agentMetrics, setAgentMetrics] = useState<Record<string, { tasks: number; efficiency: number }>>({})

  useEffect(() => {
    const metrics: Record<string, { tasks: number; efficiency: number }> = {}
    AGENTS.forEach(agent => {
      metrics[agent.id] = {
        tasks: Math.floor(Math.random() * 200 + 50),
        efficiency: Math.floor(Math.random() * 25 + 75)
      }
    })
    setAgentMetrics(metrics)
    const interval = setInterval(() => {
      AGENTS.forEach(agent => {
        setAgentMetrics(prev => ({
          ...prev,
          [agent.id]: {
            tasks: (prev[agent.id]?.tasks || 0) + Math.floor(Math.random() * 5),
            efficiency: Math.min(99, Math.max(70, (prev[agent.id]?.efficiency || 85) + (Math.random() * 4 - 2)))
          }
        }))
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="glass-card rounded-3xl relative overflow-hidden group">
      <div className={`absolute inset-0 bg-gradient-to-br ${activeAgent.color} opacity-5 transition-all duration-1000`} />
      
      <div className="absolute top-0 right-0 w-40 h-40 opacity-10">
        <div className="relative w-full h-full">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-8xl animate-bounce" style={{ animationDuration: '2s' }}>
              {activeAgent.face}
            </span>
          </div>
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '20s' }}>
            <div className="absolute top-2 left-2 text-2xl">{CARTOON_FACES[0]}</div>
            <div className="absolute top-2 right-4 text-xl">{CARTOON_FACES[2]}</div>
            <div className="absolute bottom-4 left-4 text-xl">{CARTOON_FACES[4]}</div>
            <div className="absolute bottom-2 right-2 text-2xl">{CARTOON_FACES[6]}</div>
          </div>
        </div>
      </div>

      <div className="p-6 relative z-10">
        <div className="flex items-center gap-6 mb-6">
          <div className="relative">
            <div className={`absolute inset-0 bg-gradient-to-br ${activeAgent.color} blur-2xl opacity-40 animate-pulse rounded-2xl`} />
            <div className={`relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl ${activeAgent.glowColor} bg-gradient-to-br ${activeAgent.color} flex items-center justify-center`}>
              <span className="text-5xl">{activeAgent.avatar}</span>
            </div>
            <div className={`absolute -bottom-2 -right-2 ${activeAgent.bgAccent} backdrop-blur-sm p-1.5 rounded-full border-2 border-white/20 shadow-lg`}>
              <Activity size={14} className={`${activeAgent.accent} animate-pulse`} />
            </div>
            <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-slate-800 border-2 border-white/20 flex items-center justify-center text-xl shadow-lg animate-bounce" style={{ animationDuration: '3s' }}>
              {activeAgent.face}
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded-md ${activeAgent.bgAccent} text-[10px] font-bold ${activeAgent.accent} uppercase tracking-widest`}>
                Live Agent Activity
              </span>
              <div className="flex gap-1">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${activeAgent.accent.replace('text-', 'bg-')} animate-ping`} style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight leading-none mb-1">
              {activeAgent.name}
            </h3>
            <p className="text-sm font-medium text-slate-400 mb-3">{activeAgent.role}</p>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Zap size={14} className={activeAgent.accent} />
                <span className="text-xs font-bold text-white">{agentMetrics[activeAgent.id]?.tasks || 0} tasks</span>
              </div>
              <div className="flex items-center gap-2">
                <Radio size={14} className="text-emerald-400" />
                <span className="text-xs font-bold text-emerald-400">{agentMetrics[activeAgent.id]?.efficiency || 92}% efficient</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 custom-scrollbar">
          {AGENTS.map((agent) => {
            const isActive = agent.id === currentAgentId
            const metrics = agentMetrics[agent.id]
            return (
              <div 
                key={agent.id}
                className={`flex-shrink-0 relative rounded-2xl border transition-all duration-500 cursor-pointer group/agent ${
                  isActive 
                    ? `border-white/30 bg-gradient-to-br ${agent.color} shadow-lg ${agent.glowColor} scale-105` 
                    : 'border-white/5 bg-slate-800/50 hover:border-white/20 hover:bg-slate-800'
                }`}
              >
                <div className="p-3 min-w-[90px]">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                      isActive ? 'bg-white/20' : 'bg-slate-700'
                    } transition-all`}>
                      {agent.avatar}
                    </div>
                    <div className="relative">
                      <span className={`text-lg ${isActive ? 'animate-pulse' : 'opacity-40 grayscale'}`}>
                        {agent.face}
                      </span>
                      {isActive && (
                        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-slate-900 animate-ping" />
                      )}
                    </div>
                  </div>
                  <p className={`text-[10px] font-bold truncate mb-1 ${isActive ? 'text-white' : 'text-slate-500'}`}>
                    {agent.name}
                  </p>
                  {isActive && (
                    <div className="w-full h-1 bg-black/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white/80 rounded-full transition-all duration-1000" 
                        style={{ width: `${metrics?.efficiency || 85}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-slate-800/50 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <Cpu size={12} className="text-blue-400" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Agents Online</span>
            </div>
            <p className="text-xl font-black text-white">{AGENTS.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/50 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={12} className="text-amber-400" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Tasks</span>
            </div>
            <p className="text-xl font-black text-white">
              {Object.values(agentMetrics).reduce((sum, m) => sum + m.tasks, 0)}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/50 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={12} className="text-emerald-400" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Avg Efficiency</span>
            </div>
            <p className="text-xl font-black text-white">
              {Math.round(Object.values(agentMetrics).reduce((sum, m) => sum + m.efficiency, 0) / AGENTS.length)}%
            </p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50" />
    </div>
  )
}
