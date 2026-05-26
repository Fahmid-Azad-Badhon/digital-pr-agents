'use client';

import React from 'react';
import { Mail, AlertTriangle } from 'lucide-react';
import StageHeader from '@/components/StageHeader';

export default function OptimizationPage() {
  return (
    <div className="space-y-6">
      <StageHeader stageNumber={10} stageName="Email Optimization" agentId="optimizer" />
      <div>
        <h1 className="text-2xl font-bold text-white">Email Optimization</h1>
        <p className="text-[#94A3B8] mt-1">Finalize and optimize pitch emails for outreach.</p>
      </div>

      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-8 text-center">
        <Mail size={48} className="text-[#64748B] mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Awaiting Pitch Draft</h3>
        <p className="text-[#94A3B8]">
          Complete pitch drafting stage first to optimize the final email.
        </p>
      </div>
    </div>
  );
}