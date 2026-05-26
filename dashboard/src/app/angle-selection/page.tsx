'use client'

import StageHeader from '@/components/StageHeader'

export default function AngleSelectionPage() {
  return (
    <div className="p-6">
      <StageHeader stageNumber={5} stageName="Beat Matching" agentId="beat-matcher" />
      
      <h1 className="text-2xl font-bold text-white mb-4">Beat Matching</h1>
      <p className="text-[#94A3B8] mb-6">Stage 5: Map selected angles to journalist beats.</p>
      
      <div className="mt-8 p-4 bg-[#1E293B] border border-[#334155] rounded-xl">
        <p className="text-[#64748B] text-center py-8">No angles available for selection</p>
      </div>
    </div>
  )
}