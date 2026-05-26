import React from 'react';

interface AgentAvatarProps {
  agentId: string;
  name: string;
  role: string;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  status?: 'idle' | 'running' | 'completed' | 'failed' | 'paused';
}

const agentConfig: Record<string, {
  color: string;
  bgColor: string;
  svg: React.ReactNode;
}> = {
  orchestrator: {
    color: '#2563EB',
    bgColor: 'bg-blue-600',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Comic-style orchestrator - tie, suit */}
        <circle cx="20" cy="16" r="10" fill="#E5E7EB" stroke="#2563EB" strokeWidth="2"/>
        <path d="M12 28 Q20 35 28 28" fill="#2563EB" stroke="#1D4ED8" strokeWidth="1.5"/>
        <circle cx="16" cy="14" r="2" fill="#1E293B"/>
        <circle cx="24" cy="14" r="2" fill="#1E293B"/>
        <path d="M16 20 Q20 23 24 20" stroke="#1E293B" strokeWidth="1.5" fill="none"/>
        <rect x="14" y="30" width="12" height="8" rx="2" fill="#2563EB"/>
      </svg>
    )
  },
  extractor: {
    color: '#22C55E',
    bgColor: 'bg-green-600',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Comic-style data extractor - glasses, lab coat */}
        <circle cx="20" cy="16" r="10" fill="#E5E7EB" stroke="#22C55E" strokeWidth="2"/>
        <rect x="13" y="10" width="14" height="8" rx="1" fill="#22C55E" opacity="0.8"/>
        <circle cx="16" cy="14" r="2" fill="#1E293B"/>
        <circle cx="24" cy="14" r="2" fill="#1E293B"/>
        <path d="M15 21 L25 21" stroke="#1E293B" strokeWidth="1.5"/>
        <rect x="12" y="28" width="16" height="10" rx="2" fill="#22C55E"/>
        <line x1="16" y1="30" x2="16" y2="36" stroke="#E5E7EB" strokeWidth="1"/>
        <line x1="20" y1="28" x2="20" y2="36" stroke="#E5E7EB" strokeWidth="1"/>
        <line x1="24" y1="30" x2="24" y2="36" stroke="#E5E7EB" strokeWidth="1"/>
      </svg>
    )
  },
  researcher: {
    color: '#9333EA',
    bgColor: 'bg-purple-600',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Comic-style researcher - magnifying glass */}
        <circle cx="20" cy="16" r="10" fill="#E5E7EB" stroke="#9333EA" strokeWidth="2"/>
        <circle cx="16" cy="14" r="2" fill="#1E293B"/>
        <circle cx="24" cy="14" r="2" fill="#1E293B"/>
        <path d="M15 21 L25 21" stroke="#1E293B" strokeWidth="1.5"/>
        <circle cx="28" cy="24" r="6" fill="none" stroke="#9333EA" strokeWidth="2"/>
        <line x1="33" y1="29" x2="37" y2="33" stroke="#9333EA" strokeWidth="2.5"/>
        <rect x="10" y="30" width="20" height="2" rx="1" fill="#9333EA"/>
        <rect x="14" y="34" width="12" height="2" rx="1" fill="#9333EA"/>
      </svg>
    )
  },
  strategist: {
    color: '#EA580C',
    bgColor: 'bg-orange-600',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Comic-style strategist - lightbulb, tie */}
        <circle cx="20" cy="16" r="10" fill="#E5E7EB" stroke="#EA580C" strokeWidth="2"/>
        <circle cx="16" cy="14" r="2" fill="#1E293B"/>
        <circle cx="24" cy="14" r="2" fill="#1E293B"/>
        <path d="M16 20 Q20 24 24 20" stroke="#1E293B" strokeWidth="1.5" fill="none"/>
        <path d="M20 8 L22 4 L24 8" fill="#EA580C" stroke="#C2410B" strokeWidth="1"/>
        <rect x="14" y="30" width="12" height="8" rx="2" fill="#EA580C"/>
        <line x1="20" y1="30" x2="20" y2="38" stroke="#1E293B" strokeWidth="0.5"/>
      </svg>
    )
  },
  'beat-matcher': {
    color: '#EC4899',
    bgColor: 'bg-pink-600',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Comic-style beat matcher - target/bullseye */}
        <circle cx="20" cy="16" r="10" fill="#E5E7EB" stroke="#EC4899" strokeWidth="2"/>
        <circle cx="16" cy="14" r="2" fill="#1E293B"/>
        <circle cx="24" cy="14" r="2" fill="#1E293B"/>
        <path d="M15 21 L25 21" stroke="#1E293B" strokeWidth="1.5"/>
        <circle cx="20" cy="28" r="8" fill="none" stroke="#EC4899" strokeWidth="1.5" strokeDasharray="2 2"/>
        <circle cx="20" cy="28" r="4" fill="none" stroke="#EC4899" strokeWidth="1"/>
        <circle cx="20" cy="28" r="1.5" fill="#EC4899"/>
      </svg>
    )
  },
  collector: {
    color: '#06B6D4',
    bgColor: 'bg-cyan-600',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Comic-style collector - antenna/search */}
        <circle cx="20" cy="16" r="10" fill="#E5E7EB" stroke="#06B6D4" strokeWidth="2"/>
        <circle cx="16" cy="14" r="2" fill="#1E293B"/>
        <circle cx="24" cy="14" r="2" fill="#1E293B"/>
        <path d="M15 21 L25 21" stroke="#1E293B" strokeWidth="1.5"/>
        <line x1="20" y1="6" x2="20" y2="2" stroke="#06B6D4" strokeWidth="2"/>
        <circle cx="20" cy="2" r="2" fill="#06B6D4"/>
        <path d="M18 30 L18 38 L22 38 L22 30 Z" fill="#06B6D4"/>
      </svg>
    )
  },
  intelligence: {
    color: '#6366F1',
    bgColor: 'bg-indigo-600',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Comic-style intelligence - brain/document */}
        <circle cx="20" cy="16" r="10" fill="#E5E7EB" stroke="#6366F1" strokeWidth="2"/>
        <circle cx="16" cy="14" r="2" fill="#1E293B"/>
        <circle cx="24" cy="14" r="2" fill="#1E293B"/>
        <path d="M14 21 L26 21" stroke="#1E293B" strokeWidth="1.5"/>
        <path d="M16 26 L20 24 L24 26 L28 24" stroke="#6366F1" strokeWidth="1.5" fill="none"/>
        <rect x="14" y="30" width="12" height="8" rx="1" fill="#6366F1"/>
        <line x1="20" y1="30" x2="20" y2="38" stroke="#E5E7EB" strokeWidth="0.5"/>
      </svg>
    )
  },
  copywriter: {
    color: '#EAB308',
    bgColor: 'bg-amber-600',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Comic-style copywriter - pen */}
        <circle cx="20" cy="16" r="10" fill="#E5E7EB" stroke="#EAB308" strokeWidth="2"/>
        <circle cx="15" cy="14" r="2" fill="#1E293B"/>
        <circle cx="25" cy="14" r="2" fill="#1E293B"/>
        <path d="M15 20 Q20 24 25 20" stroke="#1E293B" strokeWidth="1.5" fill="none"/>
        <path d="M28 20 L34 14 L30 20 Z" fill="#EAB308"/>
        <line x1="28" y1="20" x2="28" y2="38" stroke="#EAB308" strokeWidth="1.5"/>
        <rect x="12" y="32" width="16" height="6" rx="1" fill="#EAB308"/>
      </svg>
    )
  },
  optimizer: {
    color: '#14B8A6',
    bgColor: 'bg-teal-600',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Comic-style optimizer - gear/tuning */}
        <circle cx="20" cy="16" r="10" fill="#E5E7EB" stroke="#14B8A6" strokeWidth="2"/>
        <circle cx="16" cy="14" r="2" fill="#1E293B"/>
        <circle cx="24" cy="14" r="2" fill="#1E293B"/>
        <path d="M15 21 L25 21" stroke="#1E293B" strokeWidth="1.5"/>
        <circle cx="20" cy="30" r="6" fill="none" stroke="#14B8A6" strokeWidth="2"/>
        <circle cx="20" cy="30" r="3" fill="#14B8A6" opacity="0.5"/>
        <line x1="20" y1="24" x2="20" y2="26" stroke="#14B8A6" strokeWidth="1.5"/>
        <line x1="20" y1="34" x2="20" y2="36" stroke="#14B8A6" strokeWidth="1.5"/>
        <line x1="14" y1="30" x2="16" y2="30" stroke="#14B8A6" strokeWidth="1.5"/>
        <line x1="24" y1="30" x2="26" y2="30" stroke="#14B8A6" strokeWidth="1.5"/>
      </svg>
    )
  },
  packager: {
    color: '#F43F5E',
    bgColor: 'bg-rose-600',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Comic-style packager - box/package */}
        <circle cx="20" cy="16" r="10" fill="#E5E7EB" stroke="#F43F5E" strokeWidth="2"/>
        <circle cx="15" cy="14" r="2" fill="#1E293B"/>
        <circle cx="25" cy="14" r="2" fill="#1E293B"/>
        <path d="M15 21 L25 21" stroke="#1E293B" strokeWidth="1.5"/>
        <rect x="12" y="28" width="16" height="10" rx="2" fill="#F43F5E" stroke="#E11D48" strokeWidth="1"/>
        <line x1="18" y1="28" x2="18" y2="38" stroke="#E5E7EB" strokeWidth="0.75"/>
        <line x1="22" y1="28" x2="22" y2="38" stroke="#E5E7EB" strokeWidth="0.75"/>
      </svg>
    )
  },
  validator: {
    color: '#8B5CF6',
    bgColor: 'bg-violet-600',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Comic-style validator - shield/checkmark */}
        <circle cx="20" cy="16" r="10" fill="#E5E7EB" stroke="#8B5CF6" strokeWidth="2"/>
        <circle cx="16" cy="14" r="2" fill="#1E293B"/>
        <circle cx="24" cy="14" r="2" fill="#1E293B"/>
        <path d="M15 21 L25 21" stroke="#1E293B" strokeWidth="1.5"/>
        <path d="M16 28 L19 32 L26 26" stroke="#8B5CF6" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <rect x="14" y="34" width="12" height="4" rx="1" fill="#8B5CF6"/>
      </svg>
    )
  },
  production: {
    color: '#84CC16',
    bgColor: 'bg-lime-600',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Comic-style production - rocket/launch */}
        <circle cx="20" cy="16" r="10" fill="#E5E7EB" stroke="#84CC16" strokeWidth="2"/>
        <circle cx="16" cy="14" r="2" fill="#1E293B"/>
        <circle cx="24" cy="14" r="2" fill="#1E293B"/>
        <path d="M15 21 L25 21" stroke="#1E293B" strokeWidth="1.5"/>
        <path d="M20 26 L20 38 L17 36 L23 36 Z" fill="#84CC16"/>
        <circle cx="20" cy="32" r="1.5" fill="#1E293B"/>
      </svg>
    )
  }
};

export default function AgentAvatar({ agentId, name, role, size = 'md', showStatus = false, status }: AgentAvatarProps) {
  const config = agentConfig[agentId] || agentConfig.orchestrator;
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };
  
  const statusColors = {
    idle: 'bg-gray-400',
    running: 'bg-primary animate-pulse',
    completed: 'bg-success',
    failed: 'bg-error',
    paused: 'bg-warning'
  };

  return (
    <div className="relative inline-flex flex-col items-center gap-1">
      <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center border-2 overflow-hidden bg-[#1E293B]`}
        style={{ borderColor: config.color }}
      >
        {config.svg}
      </div>
      {showStatus && status && (
        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1E293B] ${statusColors[status]}`} />
      )}
      {size !== 'sm' && (
        <div className="text-center">
          <p className="text-xs font-medium text-white truncate max-w-[80px]">{name}</p>
          <p className="text-[10px] text-[#94A3B8] truncate max-w-[80px]">{role}</p>
        </div>
      )}
    </div>
  );
}
