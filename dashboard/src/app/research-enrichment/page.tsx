'use client';

import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { 
  Search, CheckCircle, AlertTriangle, 
  Globe, Database, Clock, Brain, Activity, FileText,
  TrendingUp, Users, Target, ExternalLink
} from 'lucide-react';
import StageHeader from '@/components/StageHeader';
import clsx from 'clsx';

interface ResearchData {
  campaign?: {
    name: string;
    stage: string;
    startedAt: string;
  };
  enrichment?: {
    queries: string[];
    sources: SourceData[];
    findings: FindingData[];
    timingHooks: TimingHook[];
  };
  metadata?: {
    generatedAt: string;
    agent: string;
    processingTime: string;
  };
}

interface SourceData {
  name: string;
  type: string;
  url?: string;
  credibility: number;
  lastVerified: string;
}

interface FindingData {
  id: string;
  claim: string;
  evidence: string;
  source: string;
  verified: boolean;
}

interface TimingHook {
  type: string;
  description: string;
  relevance: string;
}

export default function ResearchEnrichmentPage() {
  const { currentCampaign, campaigns, setCurrentCampaign, addLog } = useData();
  
  const [researchData, setResearchData] = useState<ResearchData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isAutoProgressing, setIsAutoProgressing] = useState(false);
  const [autoProgressNote, setAutoProgressNote] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'sources' | 'findings' | 'hooks'>('overview');

  useEffect(() => {
    if (currentCampaign?.id) {
      loadResearchData(currentCampaign.id);
      void triggerAutoProgress(currentCampaign.id);
    } else {
      setIsLoading(false);
    }
  }, [currentCampaign]);

  useEffect(() => {
    if (currentCampaign || campaigns.length === 0) {
      return;
    }
    const ACTIVE_STATUSES = new Set(['running', 'in_progress', 'processing', 'queued', 'repairing']);
    const fallbackCampaign = campaigns.find(c => ACTIVE_STATUSES.has((c.status || '').toLowerCase())) || campaigns[0];
    if (fallbackCampaign) {
      setCurrentCampaign(fallbackCampaign);
    }
  }, [campaigns, currentCampaign, setCurrentCampaign]);

  const loadResearchData = async (campaignId: string) => {
    try {
      setLoadError(null);
      const res = await fetch(`/api/research-enrichment?campaignId=${campaignId}`);
      if (res.ok) {
        const data = await res.json();
        setResearchData(data);
        addLog({ level: 'info', source: 'research-enrichment', message: 'Research enrichment data loaded successfully' });
      } else {
        const payload = await res.json().catch(() => ({}));
        const message = payload?.message || payload?.error || `Request failed (${res.status})`;
        setLoadError(message);
      }
    } catch (err) {
      console.error('Failed to load research data:', err);
      setLoadError('Failed to load research enrichment data. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerAutoProgress = async (campaignId: string) => {
    setIsAutoProgressing(true);
    setAutoProgressNote('Automation active: validating and handing off to next stage if passed.');
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
        <p className="text-[#94A3B8]">
          {campaigns.length > 0
            ? 'No campaign is selected yet. Go to Overview and click an active campaign.'
            : 'Create a campaign first to access Research Enrichment.'}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Activity size={48} className="text-cyan-400 mb-4 animate-pulse" />
        <h3 className="text-xl font-semibold text-white mb-2">Loading Research Data...</h3>
        <p className="text-[#94A3B8]">Fetching research enrichment data from agent.</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <StageHeader
          stageNumber={3}
          stageName="Research Enrichment"
          agentId="research-agent"
        />
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-5">
          <h3 className="text-lg font-semibold text-red-300 mb-2">Research Enrichment failed to load</h3>
          <p className="text-sm text-red-200 mb-4">{loadError}</p>
          <button
            onClick={() => currentCampaign?.id && loadResearchData(currentCampaign.id)}
            className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-400/40 text-red-100 hover:bg-red-500/30"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const enrichment = researchData?.enrichment;
  const metadata = researchData?.metadata;

  return (
    <div className="space-y-6">
      <StageHeader 
        stageNumber={3} 
        stageName="Research Enrichment" 
        agentId="research-agent"
      />

      {/* Agent Activity Stream */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Brain className="text-cyan-400 mt-1" size={24} />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">Stage 3: Research Enrichment Agent</h3>
            <p className="text-[#94A3B8] text-sm mt-1">
              This agent enriches raw study data with external context, timing hooks, expert quotes, and comparator data.
            </p>
          </div>
          {metadata?.agent && (
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-full">
              {metadata.agent}
            </span>
          )}
        </div>
      </div>

      {autoProgressNote && (
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3 text-sm text-cyan-300 flex items-center justify-between">
          <span>{autoProgressNote}</span>
          {isAutoProgressing && <Activity size={16} className="animate-pulse" />}
        </div>
      )}

      {/* Agent Processing Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#1E293B] rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Search className="text-cyan-400" size={18} />
            <span className="text-[#94A3B8] text-sm">Queries Executed</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {enrichment?.queries?.length || 0}
          </div>
        </div>
        <div className="bg-[#1E293B] rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Database className="text-emerald-400" size={18} />
            <span className="text-[#94A3B8] text-sm">Sources Found</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {enrichment?.sources?.length || 0}
          </div>
        </div>
        <div className="bg-[#1E293B] rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="text-purple-400" size={18} />
            <span className="text-[#94A3B8] text-sm">Findings Extracted</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {enrichment?.findings?.length || 0}
          </div>
        </div>
        <div className="bg-[#1E293B] rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="text-amber-400" size={18} />
            <span className="text-[#94A3B8] text-sm">Timing Hooks</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {enrichment?.timingHooks?.length || 0}
          </div>
        </div>
      </div>

      {/* Processing Time */}
      {metadata?.processingTime && (
        <div className="bg-[#1E293B] rounded-lg p-3 border border-slate-700 flex items-center gap-3">
          <Clock size={16} className="text-slate-400" />
          <span className="text-slate-400 text-sm">Processing time:</span>
          <span className="text-white font-mono">{metadata.processingTime}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700">
        {(['overview', 'sources', 'findings', 'hooks'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab
                ? 'text-cyan-400 border-cyan-400'
                : 'text-slate-400 border-transparent hover:text-white'
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-[#1E293B] rounded-xl p-4 border border-slate-700">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <h4 className="text-white font-semibold flex items-center gap-2">
              <Search size={18} className="text-cyan-400" />
              Research Queries Executed
            </h4>
            <div className="space-y-2">
              {enrichment?.queries?.map((q, i) => (
                <div key={i} className="bg-[#0F172A] rounded-lg p-3 border border-slate-700">
                  <code className="text-cyan-300 text-sm">{q}</code>
                </div>
              ))}
              {!enrichment?.queries?.length && (
                <p className="text-slate-500 italic">No queries executed yet</p>
              )}
            </div>

            <h4 className="text-white font-semibold flex items-center gap-2 mt-6">
              <Activity size={18} className="text-emerald-400" />
              Agent Processing Summary
            </h4>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div className="bg-[#0F172A] rounded-lg p-3 border border-slate-700">
                <div className="text-slate-400 text-xs">Status</div>
                <div className="text-emerald-400 font-medium">Processing Complete</div>
              </div>
              <div className="bg-[#0F172A] rounded-lg p-3 border border-slate-700">
                <div className="text-slate-400 text-xs">Data Quality</div>
                <div className="text-cyan-400 font-medium">High Confidence</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sources' && (
          <div className="space-y-4">
            <h4 className="text-white font-semibold flex items-center gap-2">
              <Globe size={18} className="text-emerald-400" />
              External Sources Retrieved
            </h4>
            <div className="space-y-3">
              {enrichment?.sources?.map((source, i) => (
                <div key={i} className="bg-[#0F172A] rounded-lg p-4 border border-slate-700">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-white font-medium flex items-center gap-2">
                        {source.name}
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                          {source.type}
                        </span>
                      </div>
                      {source.url && (
                        <a 
                          href={source.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-cyan-400 text-xs flex items-center gap-1 mt-1 hover:underline"
                        >
                          <ExternalLink size={12} />
                          {source.url}
                        </a>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-slate-400 text-xs">Credibility</div>
                      <div className={clsx(
                        'font-mono font-bold',
                        source.credibility >= 0.8 ? 'text-emerald-400' :
                        source.credibility >= 0.6 ? 'text-amber-400' : 'text-red-400'
                      )}>
                        {(source.credibility * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                  <div className="text-slate-500 text-xs mt-2">
                    Last verified: {source.lastVerified}
                  </div>
                </div>
              ))}
              {!enrichment?.sources?.length && (
                <p className="text-slate-500 italic">No sources retrieved yet</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'findings' && (
          <div className="space-y-4">
            <h4 className="text-white font-semibold flex items-center gap-2">
              <FileText size={18} className="text-purple-400" />
              Research Findings Extracted
            </h4>
            <div className="space-y-3">
              {enrichment?.findings?.map((finding, i) => (
                <div key={i} className="bg-[#0F172A] rounded-lg p-4 border border-slate-700">
                  <div className="flex items-start gap-3">
                    {finding.verified ? (
                      <CheckCircle size={18} className="text-emerald-400 mt-1 flex-shrink-0" />
                    ) : (
                      <AlertTriangle size={18} className="text-amber-400 mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="text-white font-medium">{finding.claim}</div>
                      <div className="text-slate-400 text-sm mt-1">{finding.evidence}</div>
                      <div className="text-slate-500 text-xs mt-2">
                        Source: {finding.source}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {!enrichment?.findings?.length && (
                <p className="text-slate-500 italic">No findings extracted yet</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'hooks' && (
          <div className="space-y-4">
            <h4 className="text-white font-semibold flex items-center gap-2">
              <Clock size={18} className="text-amber-400" />
              Timing Hooks & News Opportunities
            </h4>
            <div className="space-y-3">
              {enrichment?.timingHooks?.map((hook, i) => (
                <div key={i} className="bg-[#0F172A] rounded-lg p-4 border border-slate-700">
                  <div className="flex items-start gap-3">
                    <Target size={18} className="text-cyan-400 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-white font-medium flex items-center gap-2">
                        {hook.type}
                        <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                          {hook.relevance}
                        </span>
                      </div>
                      <div className="text-slate-400 text-sm mt-1">{hook.description}</div>
                    </div>
                  </div>
                </div>
              ))}
              {!enrichment?.timingHooks?.length && (
                <p className="text-slate-500 italic">No timing hooks identified yet</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
        Manual continue is disabled for this stage. If quality checks pass, the orchestrator auto-hands off to Analysis.
      </div>
    </div>
  );
}
