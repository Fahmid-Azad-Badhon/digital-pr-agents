'use client';

import React from 'react';
import { FileText, AlertTriangle } from 'lucide-react';
import StageHeader from '@/components/StageHeader';

export default function PitchesPage() {
  return (
    <div className="space-y-6">
      <StageHeader stageNumber={9} stageName="Pitch Drafting" agentId="copywriter" />
      <div>
        <h1 className="text-2xl font-bold text-white">Pitch Drafting</h1>
        <p className="text-[#94A3B8] mt-1">Generate and manage pitch email variants.</p>
      </div>

      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-8 text-center">
        <FileText size={48} className="text-[#64748B] mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Awaiting Journalist Intelligence</h3>
        <p className="text-[#94A3B8] mb-4">
          Complete journalist collection and intelligence stages to generate pitch variants.
        </p>
      </div>
    </div>
  );
}