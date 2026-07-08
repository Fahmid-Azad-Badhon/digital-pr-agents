'use client';

import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { 
  CheckCircle, AlertTriangle,
  FileCheck, TrendingUp,
  Shield, Brain, Activity
} from 'lucide-react';
import StageHeader from '@/components/StageHeader';

export default function AnalysisPage() {
  const { currentCampaign, stages } = useData();
  
  const analysisStage = stages.find(s => s.stageNumber === 4);
  const isCompleted = analysisStage?.status === 'completed';
  const isRunning = analysisStage?.status === 'running';

  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isAutoProgressing, setIsAutoProgressing] = useState(false);
  const [autoProgressNote, setAutoProgressNote] = useState<string | null>(null);

  useEffect(() => {
    if (currentCampaign) {
      loadAnalysisData(currentCampaign.id);
      void triggerAutoProgress(currentCampaign.id);
    }
  }, [currentCampaign]);

  const loadAnalysisData = async (campaignId: string) => {
    setIsLoadingData(true);
    try {
      const res = await fetch(`/api/analysis?campaignId=${campaignId}`);
      if (res.ok) {
        const data = await res.json();
        setAnalysisData(data);
      }
    } catch (err) {
      console.error('Failed to load analysis data:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const triggerAutoProgress = async (campaignId: string) => {
    setIsAutoProgressing(true);
    setAutoProgressNote('Automation active: validating and handing off to Angle Generation if passed.');
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/auto-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'pre_pitch' }),
      });
      if (!res.ok) {
        setAutoProgressNote('Auto-stage progression encountered an issue. Check Approval Queue for blockers.');
      }
    } catch {
      setAutoProgressNote('Auto-stage progression failed to trigger. Check server logs.');
    } finally {
      setIsAutoProgressing(false);
    }
  };

  if (!currentCampaign) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle size={48} className="text-warning mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No Active Campaign</h3>
        <p className="text-[#94A3B8]">Create a campaign first to access Data & Research Analysis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StageHeader 
        stageNumber={4} 
        stageName="Data & Research Analysis" 
        agentId="data-analyst"
      />

      {/* Stage 4 Architecture Explanation */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Brain className="text-emerald-400 mt-1" size={24} />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">Stage 4: Data & Research Analysis</h3>
            <p className="text-sm text-emerald-200 mt-1">
              Two internal agents working together to validate evidence and create strategy.
            </p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                <span className="text-emerald-200">4A: Data & Research Analyst</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 bg-teal-400 rounded-full"></span>
                <span className="text-teal-200">4B: Insight Analyst</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {autoProgressNote && (
        <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 px-4 py-3 text-sm text-teal-300 flex items-center justify-between">
          <span>{autoProgressNote}</span>
          {isAutoProgressing && <Activity size={16} className="animate-pulse" />}
        </div>
      )}

      {/* Two Agent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Agent 4A: Data & Research Analyst */}
        <div className="bg-[#1E293B] border border-emerald-500/30 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <FileCheck className="text-emerald-400" size={20} />
            </div>
            <div>
              <h4 className="text-white font-semibold">Data & Research Analyst</h4>
              <p className="text-xs text-emerald-400">Agent 4A • Evidence Validator</p>
            </div>
            <div className="ml-auto">
              {isCompleted ? (
                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded">Complete</span>
              ) : isRunning ? (
                <span className="px-2 py-1 bg-warning/20 text-warning text-xs rounded">Running</span>
              ) : (
                <span className="px-2 py-1 bg-slate-700 text-slate-400 text-xs rounded">Pending</span>
              )}
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="text-sm text-[#94A3B8]">
              <strong className="text-emerald-300">Core Question:</strong> Is the data true, strong, complete, properly sourced, and safe to use?
            </div>
            <ul className="text-sm text-[#64748B] space-y-1">
              <li>• Verifies statistics and claims</li>
              <li>• Checks source credibility</li>
              <li>• Identifies gaps and risks</li>
              <li>• Produces approved evidence list</li>
            </ul>
          </div>

          <div className="mt-4 pt-4 border-t border-[#334155]">
            <div className="text-xs text-[#64748B]">
              Output: Evidence Validation Report → 04-analysis.md
            </div>
          </div>
        </div>

        {/* Agent 4B: Insight Analyst */}
        <div className="bg-[#1E293B] border border-teal-500/30 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
              <TrendingUp className="text-teal-400" size={20} />
            </div>
            <div>
              <h4 className="text-white font-semibold">Insight Analyst</h4>
              <p className="text-xs text-teal-400">Agent 4B • Storyline Strategist</p>
            </div>
            <div className="ml-auto">
              {isCompleted ? (
                <span className="px-2 py-1 bg-teal-500/20 text-teal-400 text-xs rounded">Complete</span>
              ) : (
                <span className="px-2 py-1 bg-slate-700 text-slate-400 text-xs rounded">Waits for 4A</span>
              )}
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="text-sm text-[#94A3B8]">
              <strong className="text-teal-300">Core Question:</strong> How can the approved evidence become strong PR storylines?
            </div>
            <ul className="text-sm text-[#64748B] space-y-1">
              <li>• Turns verified evidence into strategy</li>
              <li>• Creates insight clusters</li>
              <li>• Maps journalist beats</li>
              <li>• Recommends angle directions</li>
            </ul>
          </div>

          <div className="mt-4 pt-4 border-t border-[#334155]">
            <div className="text-xs text-[#64748B]">
              Output: Strategic Storylines → 04-analysis.md (Section 4B)
            </div>
          </div>
        </div>
      </div>

      {/* Anti-Hallucination Warning */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Shield className="text-amber-400 mt-0.5" size={20} />
          <div>
            <h4 className="text-sm font-semibold text-amber-400">Anti-Hallucination Rules Active</h4>
            <ul className="text-sm text-amber-200 mt-2 space-y-1">
              <li>• Do not invent statistics, sources, or findings</li>
              <li>• Do not use placeholder research as real</li>
              <li>• Every angle must reference approved evidence from Stage 4</li>
              <li>• Weak claims must be flagged and avoided</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Analysis Status Summary */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Analysis Output: 04-analysis.md</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#273449] rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-emerald-400">4A</div>
            <div className="text-xs text-[#64748B]">Data Validation Layer</div>
          </div>
          <div className="bg-[#273449] rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-teal-400">4B</div>
            <div className="text-xs text-[#64748B]">Insight Strategy Layer</div>
          </div>
          <div className="bg-[#273449] rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-primary">1</div>
            <div className="text-xs text-[#64748B]">Unified Output File</div>
          </div>
          <div className="bg-[#273449] rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-warning">Source</div>
            <div className="text-xs text-[#64748B]">For Stage 5</div>
          </div>
        </div>

        {/* Agent Metrics from JSON Data */}
        {analysisData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-[#273449] rounded-lg p-3 text-center border border-emerald-500/30">
              <div className="text-2xl font-bold text-emerald-400">{analysisData.metrics?.evidenceItemsValidated || 0}</div>
              <div className="text-xs text-[#64748B]">Evidence Items</div>
            </div>
            <div className="bg-[#273449] rounded-lg p-3 text-center border border-teal-500/30">
              <div className="text-2xl font-bold text-teal-400">{analysisData.metrics?.sourcesCredibilityScore || 0}%</div>
              <div className="text-xs text-[#64748B]">Source Credibility</div>
            </div>
            <div className="bg-[#273449] rounded-lg p-3 text-center border border-amber-500/30">
              <div className="text-2xl font-bold text-amber-400">{analysisData.metrics?.riskFlags || 0}</div>
              <div className="text-xs text-[#64748B]">Risk Flags</div>
            </div>
            <div className="bg-[#273449] rounded-lg p-3 text-center border border-cyan-500/30">
              <div className="text-2xl font-bold text-cyan-400">{analysisData.metrics?.storyAnglesGenerated || 0}</div>
              <div className="text-xs text-[#64748B]">Angles Ready</div>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isLoadingData && (
          <div className="mt-4 text-center text-sm text-slate-500">
            Loading analysis data from files...
          </div>
        )}

        {/* What Stage 5 Will Receive */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-white">Stage 5 (Angle Generation) receives:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-[#94A3B8]">
              <CheckCircle size={16} className="text-emerald-400" />
              <span>Verified statistics and findings</span>
            </div>
            <div className="flex items-center gap-2 text-[#94A3B8]">
              <CheckCircle size={16} className="text-emerald-400" />
              <span>Approved evidence list</span>
            </div>
            <div className="flex items-center gap-2 text-[#94A3B8]">
              <CheckCircle size={16} className="text-emerald-400" />
              <span>Journalist beat recommendations</span>
            </div>
            <div className="flex items-center gap-2 text-[#94A3B8]">
              <CheckCircle size={16} className="text-emerald-400" />
              <span>Angle direction recommendations</span>
            </div>
            <div className="flex items-center gap-2 text-[#94A3B8]">
              <CheckCircle size={16} className="text-amber-400" />
              <span>Warnings: angles to avoid</span>
            </div>
            <div className="flex items-center gap-2 text-[#94A3B8]">
              <CheckCircle size={16} className="text-amber-400" />
              <span>Block list: weak/unverified claims</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
        Manual continue is disabled for this stage. If checks pass, the orchestrator automatically advances to Angle Generation.
      </div>
    </div>
  );
}
