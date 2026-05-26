'use client';

import React from 'react';
import { Users, Target, Search, Database, AlertTriangle } from 'lucide-react';
import StageHeader from '@/components/StageHeader';

export default function JournalistsPage() {
  return (
    <div className="space-y-6">
      <StageHeader stageNumber={7} stageName="Journalist Collection" agentId="collector" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Journalist Collection</h1>
          <p className="text-[#94A3B8] mt-1">Collect and manage journalist profiles for outreach.</p>
        </div>
      </div>

      {/* Collection Status */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-primary" />
            <span className="text-sm text-[#94A3B8]">Total Collected</span>
          </div>
          <p className="text-2xl font-bold text-white mt-1">0</p>
        </div>
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Database size={16} className="text-success" />
            <span className="text-sm text-[#94A3B8]">Unique</span>
          </div>
          <p className="text-2xl font-bold text-white mt-1">0</p>
        </div>
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-warning" />
            <span className="text-sm text-[#94A3B8]">Target (800/beat)</span>
          </div>
          <p className="text-2xl font-bold text-white mt-1">0</p>
        </div>
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-[#64748B]" />
            <span className="text-sm text-[#94A3B8]">Sources</span>
          </div>
          <p className="text-2xl font-bold text-white mt-1">0</p>
        </div>
      </div>

      {/* Collection Prompt */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-8 text-center">
        <AlertTriangle size={48} className="text-warning mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Beat Selection Required</h3>
        <p className="text-[#94A3B8] mb-4">
          Complete angle selection first to enable journalist collection. The system needs a confirmed angle to determine target beats.
        </p>
        <a
          href="/angles"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover"
        >
          Go to Angle Selection
        </a>
      </div>
    </div>
  );
}