'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CAMPAIGN_STAGE_ROUTING, MODEL_CONFIG, ROUTER_SETTINGS } from '@/config/model-routing.config';
import { 
  Cpu, Shield, Search, Zap, Code, GitBranch
} from 'lucide-react';
import clsx from 'clsx';

type AuditEvent = {
  timestamp: string;
  stageId?: string;
  primaryModel: string;
  modelUsed: string;
  reviewerModelUsed: string | null;
  reviewerApproved: boolean | null;
  fallbackUsed: boolean;
  fallbackReason: string | null;
  retryCount: number;
  status: string;
  durationMs: number;
  errorMessage: string | null;
};

type AuditStage = {
  stageId: string;
  primaryModel: string;
  fallback1: string;
  fallback2: string;
  mandatoryReviewer: string | null;
  runs: number;
  fallbackRate: number;
  reviewerPassRate: number | null;
  lastRunAt: string | null;
};

type AuditResponse = {
  generatedAt: string;
  events: AuditEvent[];
  stages: AuditStage[];
};

const modelColors: Record<string, string> = {
  nemotron_3_ultra: 'from-blue-600 to-blue-800',
  nemotron_3_super: 'from-cyan-600 to-cyan-800',
  minimax_m25: 'from-green-600 to-green-800',
  gpt_oss_120b: 'from-purple-600 to-purple-800',
  hermes_3_405b: 'from-pink-600 to-pink-800',
  qwen3_coder: 'from-yellow-600 to-yellow-800',
  gemma_4_31b: 'from-indigo-600 to-indigo-800',
  nemotron_3_nano_30b: 'from-red-600 to-red-800',
};

const stageNames: Record<string, string> = {
  'S1_CAMPAIGN_INTAKE': 'Campaign Intake',
  'S2_DATA_EXTRACTION': 'Data Extraction',
  'S3_RESEARCH_ENRICHMENT': 'Research Enrichment',
  'S4A_DATA_RESEARCH_ANALYST': 'Data Analyst',
  'S4B_INSIGHT_ANALYST': 'Insight Analyst',
  'S5_ANGLE_GENERATION': 'Angle Generation',
  'S6_BEAT_MATCHING': 'Beat Matching',
  'S7_PITCH_SELECTION_HUMAN_GATE': 'Pitch Selection (Human)',
  'S8_JOURNALIST_COLLECTION': 'Journalist Collection',
  'S9_JOURNALIST_INTELLIGENCE': 'Journalist Intelligence',
  'S10_PITCH_DRAFTING': 'Pitch Drafting',
  'S11_PITCH_OPTIMIZATION': 'Pitch Optimization',
  'S12_PACKAGE_ASSEMBLY': 'Package Assembly',
  'S13_VALIDATION': 'Validation',
  'S14_FINAL_FORMATTING': 'Final Formatting',
  'S15_OUTREACH_ASSET_CREATION': 'Asset Creation',
  'S16_CAMPAIGN_LOG_LEARNING_LOOP': 'Campaign Log',
};

export default function ModelsPage() {
  const [audit, setAudit] = useState<AuditResponse | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [selectedAuditStage, setSelectedAuditStage] = useState<string>('ALL');

  useEffect(() => {
    let cancelled = false;

    const loadAudit = async () => {
      try {
        const stageQuery = selectedAuditStage !== 'ALL' ? `&stageId=${encodeURIComponent(selectedAuditStage)}` : '';
        const res = await fetch(`/api/models/audit?limit=120${stageQuery}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`Audit API error: ${res.status}`);
        const data: AuditResponse = await res.json();
        if (!cancelled) {
          setAudit(data);
          setAuditError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setAuditError(e instanceof Error ? e.message : 'Failed to load audit stream');
        }
      }
    };

    loadAudit();
    const timer = setInterval(loadAudit, 5000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [selectedAuditStage]);

  const fallbackSpikes = useMemo(
    () => (audit?.stages || []).filter(s => s.runs >= 3 && s.fallbackRate >= 30).sort((a, b) => b.fallbackRate - a.fallbackRate),
    [audit]
  );

  const reviewerRejects = useMemo(
    () => (audit?.events || []).filter(e => e.reviewerApproved === false),
    [audit]
  );

  const recentEvents = useMemo(() => (audit?.events || []).slice(0, 20), [audit]);

  const stagesList = Object.keys(CAMPAIGN_STAGE_ROUTING);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Model Routing</h1>
          <p className="text-[#94A3B8] mt-1">
            Multi-model routing architecture with fallback chains and human gate control.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1E293B] border border-[#334155]">
          <GitBranch size={16} className="text-primary" />
          <span className="text-sm text-[#94A3B8]">
            8 Models • 16 Stages • Fallback Chains
          </span>
        </div>
      </div>

      {/* Model Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Object.values(MODEL_CONFIG).map(model => (
          <div 
            key={model.key}
            className={clsx(
              'bg-[#1E293B] border rounded-xl p-4',
              model.enabledInProductionWorkflow 
                ? 'border-[#334155] hover:border-primary/50' 
                : 'border-slate-700 opacity-60'
            )}
          >
            <div className={clsx(
              'w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center mb-3',
              modelColors[model.key] || 'from-gray-600 to-gray-800'
            )}>
              {model.role === 'flagship_orchestrator' && <Cpu size={20} className="text-white" />}
              {model.role === 'research_extraction' && <Search size={20} className="text-white" />}
              {model.role === 'production_writer' && <Zap size={20} className="text-white" />}
              {model.role === 'reasoning_judge' && <Shield size={20} className="text-white" />}
              {model.role === 'natural_writing_polish' && <Code size={20} className="text-white" />}
              {model.role === 'fast_prefilter' && <Zap size={20} className="text-white" />}
              {model.role === 'multimodal_document_understanding' && <Search size={20} className="text-white" />}
              {model.role === 'strict_formatting' && <Code size={20} className="text-white" />}
            </div>
            <h3 className="text-white font-semibold text-sm">{model.displayName}</h3>
            <p className="text-xs text-[#64748B] capitalize mt-1">{model.role.replace(/_/g, ' ')}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={clsx(
                'text-xs px-1.5 py-0.5 rounded',
                model.costLevel === 'free' ? 'bg-success/20 text-success' : 
                model.costLevel === 'low' ? 'bg-warning/20 text-warning' : 'bg-error/20 text-error'
              )}>
                {model.costLevel}
              </span>
              <span className="text-xs text-[#64748B]">{model.speedLevel}</span>
            </div>
            {!model.enabledInProductionWorkflow && (
              <span className="text-xs text-error mt-2 block">Production Disabled</span>
            )}
          </div>
        ))}
      </div>

      {/* Live Audit Stream */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#334155] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Live Routing Audit Stream</h2>
            <p className="text-xs text-[#94A3B8] mt-1">
              Tracks fallback spikes and mandatory reviewer decisions in real time.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-[#94A3B8] flex items-center gap-2">
              Stage
              <select
                value={selectedAuditStage}
                onChange={(e) => setSelectedAuditStage(e.target.value)}
                className="bg-[#0F172A] border border-[#334155] text-white text-xs rounded px-2 py-1"
              >
                <option value="ALL">All</option>
                {Object.keys(CAMPAIGN_STAGE_ROUTING).map((id) => (
                  <option key={id} value={id}>
                    {stageNames[id] || id}
                  </option>
                ))}
              </select>
            </label>
            <span className="text-xs text-[#64748B]">
              {audit?.generatedAt ? `Updated ${new Date(audit.generatedAt).toLocaleTimeString()}` : 'Loading...'}
            </span>
          </div>
        </div>

        {auditError ? (
          <div className="p-4 text-sm text-error">{auditError}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 border-b border-[#334155]">
              <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-3">
                <p className="text-xs text-[#64748B]">Logged Stage Runs</p>
                <p className="text-xl font-bold text-white mt-1">{audit?.events?.length || 0}</p>
              </div>
              <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-3">
                <p className="text-xs text-[#64748B]">Fallback Spikes</p>
                <p className={clsx('text-xl font-bold mt-1', fallbackSpikes.length > 0 ? 'text-warning' : 'text-success')}>
                  {fallbackSpikes.length}
                </p>
              </div>
              <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-3">
                <p className="text-xs text-[#64748B]">Reviewer Rejects</p>
                <p className={clsx('text-xl font-bold mt-1', reviewerRejects.length > 0 ? 'text-error' : 'text-success')}>
                  {reviewerRejects.length}
                </p>
              </div>
              <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-3">
                <p className="text-xs text-[#64748B]">Audit Health</p>
                <p className={clsx('text-xl font-bold mt-1', reviewerRejects.length === 0 && fallbackSpikes.length === 0 ? 'text-success' : 'text-warning')}>
                  {reviewerRejects.length === 0 && fallbackSpikes.length === 0 ? 'Stable' : 'Attention'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
              <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-3">
                <h3 className="text-sm font-semibold text-white mb-2">Fallback Spike Stages</h3>
                {fallbackSpikes.length === 0 ? (
                  <p className="text-xs text-success">No fallback spikes detected.</p>
                ) : (
                  <div className="space-y-2">
                    {fallbackSpikes.slice(0, 6).map(s => (
                      <div key={s.stageId} className="flex items-center justify-between text-xs">
                        <span className="text-[#E2E8F0]">{stageNames[s.stageId] || s.stageId}</span>
                        <span className="text-warning font-semibold">{s.fallbackRate}% fallback</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-3">
                <h3 className="text-sm font-semibold text-white mb-2">Reviewer Rejects (Recent)</h3>
                {reviewerRejects.length === 0 ? (
                  <p className="text-xs text-success">No reviewer rejects recorded.</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-auto pr-1">
                    {reviewerRejects.slice(0, 8).map((e, idx) => (
                      <div key={`${e.timestamp}-${idx}`} className="text-xs border border-error/30 bg-error/10 rounded p-2">
                        <div className="text-[#E2E8F0]">{stageNames[e.stageId || ''] || e.stageId || 'Unknown stage'}</div>
                        <div className="text-error">Reviewer: {e.reviewerModelUsed || '-'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-[#334155]">
              <div className="px-4 py-3 text-sm font-semibold text-white">Recent Stage Runs</div>
              <div className="max-h-72 overflow-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#273449] text-[#64748B] uppercase">
                      <th className="px-3 py-2 text-left">Time</th>
                      <th className="px-3 py-2 text-left">Stage</th>
                      <th className="px-3 py-2 text-left">Model</th>
                      <th className="px-3 py-2 text-left">Fallback</th>
                      <th className="px-3 py-2 text-left">Reviewer</th>
                      <th className="px-3 py-2 text-left">Decision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentEvents.map((e, idx) => (
                      <tr key={`${e.timestamp}-${idx}`} className="border-b border-[#334155]">
                        <td className="px-3 py-2 text-[#94A3B8]">{new Date(e.timestamp).toLocaleTimeString()}</td>
                        <td className="px-3 py-2 text-white">{stageNames[e.stageId || ''] || e.stageId || '-'}</td>
                        <td className="px-3 py-2 text-[#E2E8F0]">{MODEL_CONFIG[e.modelUsed]?.displayName || e.modelUsed}</td>
                        <td className="px-3 py-2">
                          {e.fallbackUsed ? <span className="text-warning">Yes</span> : <span className="text-success">No</span>}
                        </td>
                        <td className="px-3 py-2 text-[#94A3B8]">{e.reviewerModelUsed ? (MODEL_CONFIG[e.reviewerModelUsed]?.displayName || e.reviewerModelUsed) : '-'}</td>
                        <td className="px-3 py-2">
                          {e.reviewerApproved === null ? (
                            <span className="text-[#64748B]">-</span>
                          ) : e.reviewerApproved ? (
                            <span className="text-success">Approved</span>
                          ) : (
                            <span className="text-error">Rejected</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {recentEvents.length === 0 && (
                      <tr>
                        <td className="px-3 py-4 text-[#64748B]" colSpan={6}>No stage run events yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Stage-by-Stage Table */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#334155]">
          <h2 className="text-lg font-semibold text-white">Campaign Stage Routing</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#273449]">
                <th className="px-3 py-3 text-left text-xs font-semibold text-[#64748B] uppercase">Stage</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[#64748B] uppercase">Primary</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[#64748B] uppercase">Fallback 1</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[#64748B] uppercase">Fallback 2</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[#64748B] uppercase">Human Gate</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-[#64748B] uppercase">Restrictions</th>
              </tr>
            </thead>
            <tbody>
              {stagesList.map((stageId, idx) => {
                const routing = CAMPAIGN_STAGE_ROUTING[stageId];
                return (
                  <tr key={stageId} className="border-b border-[#334155] hover:bg-[#273449]">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#64748B] w-6">{idx + 1}.</span>
                        <span className="text-sm text-white">{stageNames[stageId] || stageId.replace('S7_PITCH_SELECTION_', 'S7: ')}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={clsx(
                        'text-xs px-2 py-1 rounded font-medium',
                        routing?.primary && modelColors[routing.primary] ? 'text-white' : 'text-[#94A3B8]'
                      )}>
                        {routing?.primary ? MODEL_CONFIG[routing.primary]?.displayName || routing.primary : '-'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs text-[#94A3B8]">
                        {routing?.fallback1 ? MODEL_CONFIG[routing.fallback1]?.displayName || routing.fallback1 : '-'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs text-[#94A3B8]">
                        {routing?.fallback2 ? MODEL_CONFIG[routing.fallback2]?.displayName || routing.fallback2 : '-'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {routing?.requiresHumanApproval ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-warning/20 text-warning">
                          <Shield size={10} />
                          Required
                        </span>
                      ) : (
                        <span className="text-xs text-[#64748B]">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs text-[#64748B] max-w-[150px] line-clamp-1">
                        {routing?.specialInstructions || '-'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dashboard Feature Routing */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#334155]">
          <h2 className="text-lg font-semibold text-white">Dashboard AI Feature Routing</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#273449]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase">Feature</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase">Primary Model</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase">Fallbacks</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: 'workflow_status_summary', desc: 'Quick status overview' },
                { feature: 'stage_failure_explanation', desc: 'Explain stage errors' },
                { feature: 'fallback_event_analysis', desc: 'Analyze fallback events' },
                { feature: 'campaign_progress_overview', desc: 'Strategic progress view' },
                { feature: 'recommended_next_action', desc: 'AI recommendation for next step' },
                { feature: 'audit_log_analysis', desc: 'Analyze audit logs' },
                { feature: 'output_quality_score', desc: 'Score output quality' },
                { feature: 'pitch_readability_preview', desc: 'Check pitch readability' },
                { feature: 'chart_image_interpretation', desc: 'Extract data from images' },
                { feature: 'dashboard_visual_asset_generation', desc: 'Generate visual content' },
              ].map(item => {
                return (
                  <tr key={item.feature} className="border-b border-[#334155] hover:bg-[#273449]">
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-sm text-white">{item.feature.replace(/_/g, ' ')}</span>
                        <p className="text-xs text-[#64748B]">{item.desc}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-[#94A3B8]">Via ModelRouter</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-[#64748B]">Configured in DASHBOARD_ROUTING</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model Restrictions Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#1E293B] border border-red-600/30 rounded-xl p-4">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Shield size={18} className="text-red-400" />
            Model Restrictions
          </h3>
            <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#64748B]">Gemma 4 31B</span>
              <span className="text-white">Multimodal only</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Nemotron 3 Nano 30B</span>
              <span className="text-white">Prefilter/utility only</span>
            </div>
          </div>
        </div>

        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <GitBranch size={18} className="text-primary" />
            Fallback Triggers
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#64748B]">API Error</span>
              <span className="text-success">{ROUTER_SETTINGS.fallbackTriggers.apiError ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Timeout</span>
              <span className="text-success">{ROUTER_SETTINGS.fallbackTriggers.timeout ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Invalid JSON</span>
              <span className="text-success">{ROUTER_SETTINGS.fallbackTriggers.invalidJson ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Validation Failed</span>
              <span className="text-success">{ROUTER_SETTINGS.fallbackTriggers.schemaValidationFailed ? 'Enabled' : 'Disabled'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
