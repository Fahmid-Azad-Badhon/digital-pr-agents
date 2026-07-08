'use client';

import React from 'react';
import { Package } from 'lucide-react';
import StageHeader from '@/components/StageHeader';

export default function PackagePage() {
  return (
    <div className="space-y-6">
      <StageHeader stageNumber={11} stageName="Final Package" agentId="packager" />
      <div>
        <h1 className="text-2xl font-bold text-white">Final Package</h1>
        <p className="text-[#94A3B8] mt-1">Export and package the final campaign deliverables.</p>
      </div>

      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-8 text-center">
        <Package size={48} className="text-[#64748B] mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Awaiting Email Optimization</h3>
        <p className="text-[#94A3B8]">
          Complete email optimization to generate the final export package.
        </p>
      </div>
    </div>
  );
}