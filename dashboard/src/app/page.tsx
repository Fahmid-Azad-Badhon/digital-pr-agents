'use client';

import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  Play, Pause, AlertTriangle, CheckCircle, Clock, TrendingUp,
  Users, FileText, Target, Activity, Zap, Shield
} from 'lucide-react';
import clsx from 'clsx';
import { TOTAL_WORKFLOW_STAGES, STAGES, PHASES, AGENTS } from '@/types';

function AgentCard({ agent, currentStage, isExpanded, onClick }: { 
  agent: { id: string; name: string; role: string; color: string; stages: readonly number[] }, 
  currentStage: number, 
  isExpanded: boolean,
  onClick: () => void
}) {
  const agentStages = agent.stages || [];
  const isActive = agentStages.includes(currentStage);
  const isCompleted = agentStages.every(s => s < currentStage);
  const isWaiting = agentStages.every(s => s > currentStage);
  
  const getStatusColor = () => {
    if (isActive) return 'border-primary shadow-lg shadow-primary/30 animate-pulse';
    if (isCompleted) return 'border-success shadow-lg shadow-success/30';
    if (isWaiting) return 'border-slate-600 opacity-60';
    return 'border-slate-600';
  };
  
  const getStatusBadge = () => {
    if (isActive) return { text: 'Working', color: 'bg-primary text-white' };
    if (isCompleted) return { text: 'Done', color: 'bg-success text-white' };
    if (isWaiting) return { text: 'Waiting', color: 'bg-slate-600 text-slate-300' };
    return { text: 'Idle', color: 'bg-slate-500 text-white' };
  };
  
  const badge = getStatusBadge();
  
  // Comic-style SVG avatars based on agent role
  const getComicAvatar = () => {
    const avatars: Record<string, React.ReactNode> = {
      'orchestrator': (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="45" fill="#3B82F6"/>
          <circle cx="50" cy="40" r="20" fill="#FDE68A"/>
          <circle cx="50" cy="40" r="15" fill="#FCD34D"/>
          <circle cx="42" cy="38" r="3" fill="#1E293B"/>
          <circle cx="58" cy="38" r="3" fill="#1E293B"/>
          <path d="M45 48 Q50 53 55 48" stroke="#1E293B" strokeWidth="2" fill="none"/>
          <path d="M25 25 L40 35" stroke="#60A5FA" strokeWidth="4" strokeLinecap="round"/>
          <path d="M75 25 L60 35" stroke="#60A5FA" strokeWidth="4" strokeLinecap="round"/>
          <path d="M35 65 L65 65" stroke="#1E293B" strokeWidth="3" strokeLinecap="round"/>
          <text x="50" y="85" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">BRAIN</text>
        </svg>
      ),
      'human-reviewer': (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="45" fill="#F59E0B"/>
          <circle cx="50" cy="38" r="18" fill="#FED7AA"/>
          <circle cx="50" cy="38" r="14" fill="#FDBA74"/>
          <circle cx="44" cy="36" r="2" fill="#1E293B"/>
          <circle cx="56" cy="36" r="2" fill="#1E293B"/>
          <path d="M46 44 Q50 48 54 44" stroke="#1E293B" strokeWidth="2" fill="none"/>
          <path d="M30 20 Q40 30 50 25 Q60 30 70 20" stroke="#F59E0B" strokeWidth="5" fill="none" strokeLinecap="round"/>
          <path d="M25 55 L35 65 L45 55" stroke="#1E293B" strokeWidth="3" fill="none"/>
          <path d="M55 55 L65 65 L75 55" stroke="#1E293B" strokeWidth="3" fill="none"/>
          <path d="M35 75 L65 75" stroke="#B45309" strokeWidth="4" strokeLinecap="round"/>
          <text x="50" y="92" textAnchor="middle" fontSize="9" fill="#78350F" fontWeight="bold">REVIEWER</text>
        </svg>
      ),
      'extractor': (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="45" fill="#16A34A"/>
          <circle cx="50" cy="35" r="18" fill="#86EFAC"/>
          <circle cx="50" cy="35" r="14" fill="#4ADE80"/>
          <circle cx="45" cy="33" r="2" fill="#1E293B"/>
          <circle cx="55" cy="33" r="2" fill="#1E293B"/>
          <path d="M47 40 Q50 43 53 40" stroke="#1E293B" strokeWidth="2" fill="none"/>
          <rect x="35" y="55" width="30" height="4" rx="2" fill="#1E293B"/>
          <rect x="30" y="62" width="40" height="4" rx="2" fill="#1E293B"/>
          <rect x="35" y="69" width="30" height="4" rx="2" fill="#1E293B"/>
          <circle cx="25" cy="30" r="8" fill="#22C55E" stroke="#15803D" strokeWidth="2"/>
          <text x="50" y="90" textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">DATA</text>
        </svg>
      ),
      'researcher': (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="45" fill="#9333EA"/>
          <circle cx="50" cy="38" r="18" fill="#E9D5FF"/>
          <circle cx="50" cy="38" r="14" fill="#D8B4FE"/>
          <circle cx="45" cy="36" r="2" fill="#1E293B"/>
          <circle cx="55" cy="36" r="2" fill="#1E293B"/>
          <path d="M46 42 Q50 45 54 42" stroke="#1E293B" strokeWidth="2" fill="none"/>
          <circle cx="25" cy="25" r="10" fill="none" stroke="#A855F7" strokeWidth="3"/>
          <circle cx="25" cy="25" r="4" fill="#A855F7"/>
          <path d="M30 30 L50 38" stroke="#A855F7" strokeWidth="3"/>
          <path d="M55 60 L70 70 L80 55" stroke="#1E293B" strokeWidth="3" fill="none"/>
          <path d="M40 70 L50 75 L60 70" stroke="#1E293B" strokeWidth="3" fill="none"/>
          <text x="50" y="90" textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">SEARCH</text>
        </svg>
      ),
      'strategist': (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="45" fill="#EA580C"/>
          <circle cx="50" cy="38" r="18" fill="#FED7AA"/>
          <circle cx="50" cy="38" r="14" fill="#FDBA74"/>
          <circle cx="44" cy="36" r="3" fill="#1E293B"/>
          <circle cx="56" cy="36" r="3" fill="#1E293B"/>
          <path d="M44 44 Q50 50 56 44" stroke="#1E293B" strokeWidth="2" fill="none"/>
          <path d="M30 30 L40 40" stroke="#F97316" strokeWidth="4" strokeLinecap="round"/>
          <circle cx="30" cy="30" r="5" fill="#F97316"/>
          <path d="M70 30 L60 40" stroke="#F97316" strokeWidth="4" strokeLinecap="round"/>
          <circle cx="70" cy="30" r="5" fill="#F97316"/>
          <path d="M35 70 L65 70" stroke="#B45309" strokeWidth="4" strokeLinecap="round"/>
          <path d="M40 60 L60 60" stroke="#B45309" strokeWidth="4" strokeLinecap="round"/>
          <text x="50" y="90" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">IDEAS</text>
        </svg>
      ),
      'beat-matcher': (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="45" fill="#EC4899"/>
          <circle cx="50" cy="38" r="18" fill="#FBCFE8"/>
          <circle cx="50" cy="38" r="14" fill="#F9A8D4"/>
          <circle cx="44" cy="36" r="2" fill="#1E293B"/>
          <circle cx="56" cy="36" r="2" fill="#1E293B"/>
          <path d="M45 42 Q50 46 55 42" stroke="#1E293B" strokeWidth="2" fill="none"/>
          <rect x="25" y="55" width="15" height="25" rx="3" fill="#BE185D" transform="rotate(-10 32 67)"/>
          <rect x="40" y="55" width="15" height="25" rx="3" fill="#DB2777" transform="rotate(0 47 67)"/>
          <rect x="55" y="55" width="15" height="25" rx="3" fill="#BE185D" transform="rotate(10 62 67)"/>
          <text x="50" y="90" textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">BEATS</text>
        </svg>
      ),
      'collector': (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="45" fill="#06B6D4"/>
          <circle cx="50" cy="38" r="18" fill="#A5F3FC"/>
          <circle cx="50" cy="38" r="14" fill="#67E8F9"/>
          <circle cx="44" cy="36" r="2" fill="#1E293B"/>
          <circle cx="56" cy="36" r="2" fill="#1E293B"/>
          <path d="M46 42 Q50 46 54 42" stroke="#1E293B" strokeWidth="2" fill="none"/>
          <circle cx="25" cy="55" r="8" fill="#0891B2"/>
          <circle cx="40" cy="50" r="8" fill="#0891B2"/>
          <circle cx="55" cy="55" r="8" fill="#0891B2"/>
          <circle cx="70" cy="50" r="8" fill="#0891B2"/>
          <circle cx="45" cy="70" r="8" fill="#0891B2"/>
          <circle cx="60" cy="70" r="8" fill="#0891B2"/>
          <path d="M30 25 L50 35 L70 25" stroke="#06B6D4" strokeWidth="4" fill="none" strokeLinecap="round"/>
          <text x="50" y="90" textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">HUNT</text>
        </svg>
      ),
      'intelligence': (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="45" fill="#6366F1"/>
          <circle cx="50" cy="38" r="18" fill="#C7D2FE"/>
          <circle cx="50" cy="38" r="14" fill="#A5B4FC"/>
          <circle cx="44" cy="36" r="2" fill="#1E293B"/>
          <circle cx="56" cy="36" r="2" fill="#1E293B"/>
          <path d="M45 42 Q50 46 55 42" stroke="#1E293B" strokeWidth="2" fill="none"/>
          <circle cx="30" cy="30" r="12" fill="none" stroke="#818CF8" strokeWidth="3"/>
          <circle cx="30" cy="30" r="4" fill="#818CF8"/>
          <path d="M42 30 L70 30" stroke="#818CF8" strokeWidth="2" strokeDasharray="4 2"/>
          <path d="M30 42 L30 70" stroke="#818CF8" strokeWidth="2" strokeDasharray="4 2"/>
          <circle cx="70" cy="70" r="4" fill="#818CF8"/>
          <text x="50" y="90" textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">SCAN</text>
        </svg>
      ),
      'copywriter': (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="45" fill="#EAB308"/>
          <circle cx="50" cy="38" r="18" fill="#FEF9C3"/>
          <circle cx="50" cy="38" r="14" fill="#FDE047"/>
          <circle cx="44" cy="36" r="2" fill="#1E293B"/>
          <circle cx="56" cy="36" r="2" fill="#1E293B"/>
          <path d="M45 42 Q50 46 55 42" stroke="#1E293B" strokeWidth="2" fill="none"/>
          <rect x="20" y="55" width="25" height="25" rx="2" fill="#A16207" transform="rotate(-5 32 67)"/>
          <rect x="55" y="55" width="25" height="25" rx="2" fill="#CA8A04" transform="rotate(5 67 67)"/>
          <path d="M25 58 L45 58" stroke="#FDE047" strokeWidth="2"/>
          <path d="M25 63 L45 63" stroke="#FDE047" strokeWidth="2"/>
          <path d="M25 68 L35 68" stroke="#FDE047" strokeWidth="2"/>
          <path d="M60 58 L80 58" stroke="#FDE047" strokeWidth="2"/>
          <path d="M60 63 L80 63" stroke="#FDE047" strokeWidth="2"/>
          <text x="50" y="90" textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">WRITE</text>
        </svg>
      ),
      'optimizer': (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="45" fill="#14B8A6"/>
          <circle cx="50" cy="38" r="18" fill="#99F6E4"/>
          <circle cx="50" cy="38" r="14" fill="#5EEAD4"/>
          <circle cx="44" cy="36" r="2" fill="#1E293B"/>
          <circle cx="56" cy="36" r="2" fill="#1E293B"/>
          <path d="M45 42 Q50 46 55 42" stroke="#1E293B" strokeWidth="2" fill="none"/>
          <polygon points="50,25 55,40 45,40" fill="#0D9488"/>
          <polygon points="30,50 40,55 30,60" fill="#0D9488"/>
          <polygon points="70,50 60,55 70,60" fill="#0D9488"/>
          <circle cx="50" cy="75" r="10" fill="none" stroke="#0D9488" strokeWidth="3"/>
          <path d="M50 75 L50 70" stroke="#0D9488" strokeWidth="3"/>
          <path d="M50 75 L55 80" stroke="#0D9488" strokeWidth="3"/>
          <path d="M50 75 L45 80" stroke="#0D9488" strokeWidth="3"/>
          <text x="50" y="92" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">TUNE</text>
        </svg>
      ),
      'packager': (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="45" fill="#F43F5E"/>
          <circle cx="50" cy="38" r="18" fill="#FECDD3"/>
          <circle cx="50" cy="38" r="14" fill="#FDA4AF"/>
          <circle cx="44" cy="36" r="2" fill="#1E293B"/>
          <circle cx="56" cy="36" r="2" fill="#1E293B"/>
          <path d="M45 42 Q50 46 55 42" stroke="#1E293B" strokeWidth="2" fill="none"/>
          <rect x="25" y="55" width="50" height="30" rx="3" fill="#BE123C"/>
          <rect x="30" y="60" width="40" height="3" fill="#F43F5E"/>
          <rect x="30" y="66" width="40" height="3" fill="#F43F5E"/>
          <rect x="30" y="72" width="40" height="3" fill="#F43F5E"/>
          <circle cx="30" cy="52" r="5" fill="#BE123C" stroke="#F43F5E" strokeWidth="2"/>
          <circle cx="50" cy="52" r="5" fill="#BE123C" stroke="#F43F5E" strokeWidth="2"/>
          <circle cx="70" cy="52" r="5" fill="#BE123C" stroke="#F43F5E" strokeWidth="2"/>
          <text x="50" y="92" textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">PACK</text>
        </svg>
      ),
      'validator': (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="45" fill="#8B5CF6"/>
          <circle cx="50" cy="38" r="18" fill="#E9D5FF"/>
          <circle cx="50" cy="38" r="14" fill="#D8B4FE"/>
          <circle cx="44" cy="36" r="2" fill="#1E293B"/>
          <circle cx="56" cy="36" r="2" fill="#1E293B"/>
          <path d="M45 42 Q50 46 55 42" stroke="#1E293B" strokeWidth="2" fill="none"/>
          <path d="M30 60 L45 45 L60 60" stroke="#22C55E" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M40 70 L60 70" stroke="#22C55E" strokeWidth="4" strokeLinecap="round"/>
          <circle cx="25" cy="30" r="8" fill="none" stroke="#A855F7" strokeWidth="3"/>
          <text x="50" y="90" textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">CHECK</text>
        </svg>
      ),
      'production': (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="45" fill="#84CC16"/>
          <circle cx="50" cy="38" r="18" fill="#D9F99D"/>
          <circle cx="50" cy="38" r="14" fill="#BEF264"/>
          <circle cx="44" cy="36" r="2" fill="#1E293B"/>
          <circle cx="56" cy="36" r="2" fill="#1E293B"/>
          <path d="M45 42 Q50 46 55 42" stroke="#1E293B" strokeWidth="2" fill="none"/>
          <rect x="30" y="55" width="15" height="20" rx="2" fill="#4D7C0F"/>
          <rect x="50" y="55" width="15" height="20" rx="2" fill="#65A30D"/>
          <circle cx="38" cy="50" r="8" fill="#22C55E" stroke="#15803D" strokeWidth="2"/>
          <path d="M35 47 L40 52 L45 44" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <path d="M20 30 L30 40" stroke="#84CC16" strokeWidth="3" strokeLinecap="round"/>
          <path d="M80 30 L70 40" stroke="#84CC16" strokeWidth="3" strokeLinecap="round"/>
          <text x="50" y="90" textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">READY</text>
        </svg>
      ),
    };
    
    return avatars[agent.id] || (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="45" fill="#64748B"/>
        <circle cx="50" cy="40" r="20" fill="#94A3B8"/>
        <circle cx="50" cy="40" r="15" fill="#CBD5E1"/>
        <circle cx="45" cy="38" r="2" fill="#1E293B"/>
        <circle cx="55" cy="38" r="2" fill="#1E293B"/>
        <path d="M45 45 Q50 48 55 45" stroke="#1E293B" strokeWidth="2" fill="none"/>
      </svg>
    );
  };
  
  return (
    <div 
      onClick={onClick}
      className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-105 ${getStatusColor()} bg-[#1E293B]/80`}
    >
      {/* Status Badge */}
      <div className={`absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-bold ${badge.color}`}>
        {badge.text}
      </div>
      
      {/* Agent Comic Avatar */}
      <div className="w-20 h-20 mx-auto mb-3">
        {getComicAvatar()}
      </div>
      
      {/* Agent Info */}
      <div className="text-center">
        <h4 className="font-bold text-white text-sm">{agent.name}</h4>
        <p className="text-xs text-[#94A3B8]">{agent.role}</p>
        <p className="text-xs text-[#64748B] mt-1">Stage {agentStages.join(', ')}</p>
      </div>
      
      {/* Expand Info */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-[#334155]">
          <p className="text-xs text-[#94A3B8]">
            {isActive && 'Currently processing...'}
            {isCompleted && 'All assigned stages completed'}
            {isWaiting && 'Waiting for previous stages'}
          </p>
        </div>
      )}
    </div>
  );
}

function AgentPanel({ currentStage }: { currentStage: number }) {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {AGENTS.map(agent => (
        <AgentCard 
          key={agent.id}
          agent={agent}
          currentStage={currentStage}
          isExpanded={expandedAgent === agent.id}
          onClick={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
        />
      ))}
    </div>
  );
}

const kpiData = [
  { label: 'Active Campaigns', value: 2, change: 0, changeType: 'increase' as const, icon: Activity, color: 'text-primary' },
  { label: 'Completed Today', value: 0, change: 0, changeType: 'increase' as const, icon: CheckCircle, color: 'text-success' },
  { label: 'Pending Actions', value: 1, change: 0, changeType: 'increase' as const, icon: AlertTriangle, color: 'text-warning' },
  { label: 'Success Rate', value: '94%', change: 2, changeType: 'increase' as const, icon: TrendingUp, color: 'text-success' },
];

const progressData = [
  { date: 'Mon', completed: 4, running: 2, paused: 1, failed: 0 },
  { date: 'Tue', completed: 6, running: 1, paused: 0, failed: 1 },
  { date: 'Wed', completed: 3, running: 3, paused: 2, failed: 0 },
  { date: 'Thu', completed: 5, running: 2, paused: 0, failed: 0 },
  { date: 'Fri', completed: 7, running: 1, paused: 1, failed: 0 },
  { date: 'Sat', completed: 2, running: 0, paused: 0, failed: 0 },
  { date: 'Sun', completed: 1, running: 1, paused: 0, failed: 0 },
];

const stageDistribution = [
  { name: 'Completed', value: 35, color: '#22C55E' },
  { name: 'Running', value: 15, color: '#2563EB' },
  { name: 'Paused', value: 10, color: '#FBBF24' },
  { name: 'Waiting', value: 40, color: '#64748B' },
];

const COLORS = ['#22C55E', '#2563EB', '#FBBF24', '#64748B'];

function WorkflowTimeline() {
  const { stages, currentCampaign } = useData();
  const activeStages = stages.filter(s => s.status !== 'waiting');
  
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {stages.slice(0, 10).map((stage, idx) => (
        <React.Fragment key={stage.stageNumber}>
          <div className={clsx(
            'flex flex-col items-center gap-1 min-w-[60px]',
            stage.status === 'completed' && 'text-success',
            stage.status === 'running' && 'text-primary',
            stage.status === 'paused' && 'text-warning',
            stage.status === 'failed' && 'text-error',
            stage.status === 'waiting' && 'text-[#64748B]'
          )}>
            <div className={clsx(
              'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2',
              stage.status === 'completed' && 'bg-success/20 border-success',
              stage.status === 'running' && 'bg-primary/20 border-primary animate-pulse',
              stage.status === 'paused' && 'bg-warning/20 border-warning',
              stage.status === 'failed' && 'bg-error/20 border-error',
              stage.status === 'waiting' && 'bg-[#273449] border-[#64748B]'
            )}>
              {stage.stageNumber}
            </div>
            <span className="text-[10px] text-center text-[#94A3B8] truncate max-w-[60px]">
              {stage.name.split(' ')[0]}
            </span>
          </div>
          {idx < 9 && (
            <div className={clsx(
              'h-0.5 w-4 flex-shrink-0',
              stage.status === 'completed' ? 'bg-success' : 'bg-[#334155]'
            )} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function ActivityFeed() {
  const { logs, campaigns } = useData();
  const recentLogs = logs.slice(0, 8);
  const fallbackCampaignEvents = campaigns
    .slice()
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
    .slice(0, 8);

  return (
    <div className="space-y-2">
      {recentLogs.length > 0 ? (
        recentLogs.map(log => (
          <div key={log.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-[#273449]">
            <div className={clsx(
              'w-2 h-2 mt-1.5 rounded-full flex-shrink-0',
              log.level === 'success' && 'bg-success',
              log.level === 'error' && 'bg-error',
              log.level === 'warning' && 'bg-warning',
              log.level === 'info' && 'bg-info'
            )} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#E5E7EB]">{log.message}</p>
              <p className="text-xs text-[#64748B]">{new Date(log.timestamp).toLocaleTimeString()}</p>
            </div>
          </div>
        ))
      ) : fallbackCampaignEvents.length > 0 ? (
        fallbackCampaignEvents.map(campaign => (
          <div key={campaign.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-[#273449]">
            <div className="w-2 h-2 mt-1.5 rounded-full flex-shrink-0 bg-info" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#E5E7EB]">
                Campaign updated: {campaign.name}
              </p>
              <p className="text-xs text-[#64748B]">
                Stage {campaign.currentStage} • {campaign.status} • {new Date(campaign.updatedAt || campaign.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-[#64748B] text-center py-4">No activity yet</p>
      )}
    </div>
  );
}

function GatesStatus() {
  const { gates } = useData();

  return (
    <div className="space-y-2">
      {gates.map(gate => (
        <div key={gate.id} className="flex items-center justify-between p-2 rounded-lg bg-[#273449]">
          <div className="flex items-center gap-2">
            <div className={clsx(
              'w-2 h-2 rounded-full',
              gate.status === 'passed' && 'bg-success',
              gate.status === 'ready' && 'bg-warning',
              gate.status === 'waiting' && 'bg-info animate-pulse',
              gate.status === 'locked' && 'bg-[#64748B]',
              gate.status === 'failed' && 'bg-error'
            )} />
            <span className="text-sm text-[#E5E7EB]">{gate.name}</span>
          </div>
          <span className={clsx(
            'text-xs px-2 py-0.5 rounded-full',
            gate.status === 'passed' && 'bg-success/20 text-success',
            gate.status === 'ready' && 'bg-warning/20 text-warning',
            gate.status === 'waiting' && 'bg-info/20 text-info',
            gate.status === 'locked' && 'bg-[#64748B]/20 text-[#64748B]',
            gate.status === 'failed' && 'bg-error/20 text-error'
          )}>
            {gate.status}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function OverviewPage() {
  const { campaigns, currentCampaign, stages, needsUserSelection, setCurrentCampaign } = useData();
  
  // DO NOT load from localStorage - DataContext handles campaign loading from API (filesystem)
  // If campaign not in DataContext, let it show as null rather than restoring stale data

  const hasCampaigns = campaigns.length > 0;
  const ACTIVE_STATUSES = new Set([
    'running',
    'in_progress',
    'processing',
    'queued',
    'repairing',
  ]);
  const activeCampaigns = campaigns.filter(c => ACTIVE_STATUSES.has((c.status || '').toLowerCase()));
  const activeCampaignCount = activeCampaigns.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Digital PR Command Center</h1>
          <p className="text-[#94A3B8] mt-1">Track campaigns, workflow gates, journalist outreach, pitch quality, and final package readiness from one place.</p>
        </div>
        <div className="flex items-center gap-4">
          {!hasCampaigns && <span className="text-sm text-[#94A3B8]">No campaigns yet</span>}
          {hasCampaigns && !currentCampaign && <span className="text-sm text-[#94A3B8]">{activeCampaignCount} campaigns available - select one</span>}
          {currentCampaign && (
            <>
              <span className="text-sm font-medium text-white">{currentCampaign.name}</span>
              <span className="text-xs text-[#64748B]">Stage {currentCampaign.currentStage}/{TOTAL_WORKFLOW_STAGES}</span>
            </>
          )}
          <button 
            onClick={() => window.location.href = '/campaigns/create'}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover"
          >
            <Play size={18} />
            + New Campaign
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 hover:border-primary/50 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#94A3B8] text-sm">Active Campaigns</p>
              <p className="text-2xl font-bold text-white mt-1">{activeCampaignCount}</p>
            </div>
            <div className="p-2 rounded-lg bg-[#273449]">
              <Activity size={20} className="text-primary" />
            </div>
          </div>
          <p className="text-xs mt-2 text-success">{campaigns.length} total</p>
        </div>
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 hover:border-primary/50 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#94A3B8] text-sm">Current Stage</p>
              <p className="text-2xl font-bold text-white mt-1">{currentCampaign ? currentCampaign.currentStage : 0} / {TOTAL_WORKFLOW_STAGES}</p>
            </div>
            <div className="p-2 rounded-lg bg-[#273449]">
              <Target size={20} className="text-primary" />
            </div>
          </div>
          {currentCampaign && <p className="text-xs mt-2 text-[#94A3B8] capitalize">{stages.find(s => s.stageNumber === currentCampaign.currentStage)?.name || 'Waiting'}</p>}
        </div>
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 hover:border-primary/50 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#94A3B8] text-sm">Pending Actions</p>
              <p className="text-2xl font-bold text-white mt-1">{needsUserSelection ? 1 : 0}</p>
            </div>
            <div className="p-2 rounded-lg bg-[#273449]">
              <AlertTriangle size={20} className="text-warning" />
            </div>
          </div>
          <p className="text-xs mt-2 text-[#94A3B8]">{needsUserSelection ? 'Pitch Selection required (Stage 7)' : 'All clear'}</p>
        </div>
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 hover:border-primary/50 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#94A3B8] text-sm">Workflow Progress</p>
              <p className="text-2xl font-bold text-white mt-1">{currentCampaign ? Math.round((currentCampaign.currentStage / TOTAL_WORKFLOW_STAGES) * 100) : 0}%</p>
            </div>
            <div className="p-2 rounded-lg bg-[#273449]">
              <CheckCircle size={20} className="text-success" />
            </div>
          </div>
        </div>
      </div>

      {activeCampaignCount > 0 && (
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white">Active Campaigns</h3>
            <span className="text-xs text-[#94A3B8]">Click to open</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {activeCampaigns.map(campaign => (
              <button
                key={campaign.id}
                onClick={() => setCurrentCampaign(campaign)}
                className={clsx(
                  'text-left rounded-lg border px-3 py-2 transition-all',
                  currentCampaign?.id === campaign.id
                    ? 'border-primary bg-primary/10'
                    : 'border-[#334155] bg-[#0F172A] hover:border-primary/60 hover:bg-[#1E293B]'
                )}
              >
                <p className="text-sm font-medium text-white">{campaign.name}</p>
                <p className="text-xs text-[#94A3B8]">
                  Stage {campaign.currentStage}/16 • {campaign.status}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI Agents Panel */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Zap size={20} className="text-amber-400" />
            AI Agent Team
          </h3>
          <span className="text-sm text-[#94A3B8]">
            {currentCampaign ? `Stage ${currentCampaign.currentStage}` : 'No active campaign'}
          </span>
        </div>
        <AgentPanel currentStage={currentCampaign?.currentStage || 0} />
      </div>

      {/* Current Campaign Banner */}
      {currentCampaign && (
        <div className="bg-gradient-to-r from-primary/10 to-manual/10 border border-primary/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/20">
                <FileText size={24} className="text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{currentCampaign.name}</h2>
                <p className="text-sm text-[#94A3B8]">{currentCampaign.clientName} • {currentCampaign.topic}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-white">{Math.round((currentCampaign.currentStage / TOTAL_WORKFLOW_STAGES) * 100)}%</span>
                <span className="text-[#94A3B8]">complete</span>
              </div>
              <p className="text-sm text-[#94A3B8] mt-1">Stage {currentCampaign.currentStage} of {TOTAL_WORKFLOW_STAGES}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-2 bg-[#273449] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-manual rounded-full transition-all duration-500"
                style={{ width: `${(currentCampaign.currentStage / TOTAL_WORKFLOW_STAGES) * 100}%` }}
              />
            </div>
          </div>
          <WorkflowTimeline />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Over Time */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Workflow Progress (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} />
              <YAxis stroke="#94A3B8" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#E5E7EB' }}
              />
              <Bar dataKey="completed" stackId="a" fill="#22C55E" name="Completed" />
              <Bar dataKey="running" stackId="a" fill="#2563EB" name="Running" />
              <Bar dataKey="paused" stackId="a" fill="#FBBF24" name="Paused" />
              <Bar dataKey="failed" stackId="a" fill="#F87171" name="Failed" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stage Distribution */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Stage Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={stageDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {stageDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#E5E7EB' }}
              />
              <Legend 
                verticalAlign="middle" 
                align="right"
                layout="vertical"
                formatter={(value) => <span className="text-[#94A3B8] text-sm">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity size={18} className="text-primary" />
            Recent Activity
          </h3>
          <ActivityFeed />
        </div>

        {/* Gates Status */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield size={18} className="text-warning" />
            Gate Status
          </h3>
          <GatesStatus />
        </div>

        {/* Quick Actions */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#273449] hover:bg-[#334155] transition-all text-left">
              <Users size={18} className="text-primary" />
              <div>
                <p className="text-sm text-white">Collect Journalists</p>
                <p className="text-xs text-[#64748B]">Start Muck Rack collection</p>
              </div>
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#273449] hover:bg-[#334155] transition-all text-left">
              <Target size={18} className="text-manual" />
              <div>
                <p className="text-sm text-white">Generate Angles</p>
                <p className="text-xs text-[#64748B]">Create 40 pitch angles</p>
              </div>
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#273449] hover:bg-[#334155] transition-all text-left">
              <FileText size={18} className="text-success" />
              <div>
                <p className="text-sm text-white">Export Package</p>
                <p className="text-xs text-[#64748B]">Generate Google Doc</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {!currentCampaign && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-full bg-[#1E293B] flex items-center justify-center mb-4">
            <FileText size={32} className="text-[#64748B]" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">{hasCampaigns ? 'No Campaign Selected' : 'No Active Campaign'}</h3>
          <p className="text-[#94A3B8] mb-4">{hasCampaigns ? 'Select one of your active campaigns or create a new campaign to begin.' : 'Create your first Digital PR campaign to start the workflow.'}</p>
          <a href="/campaigns" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover">
            <Play size={18} />
            {hasCampaigns ? 'Select Campaign' : 'Create Campaign'}
          </a>
        </div>
      )}
    </div>
  );
}
