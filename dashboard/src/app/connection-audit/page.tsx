'use client';

import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { apiFetch } from '@/lib/clientApi';

type StageAudit = {
  stage: number;
  label: string;
  uiWired: boolean;
  apiWired: boolean;
  brainExecutable: boolean;
  modelBound: boolean;
  outputFileVerified: boolean;
  details: {
    uiRoutesFound: string[];
    apiRoutesFound: string[];
    brainFilePath: string | null;
    modelRoutingKey: string | null;
    existingOutputFiles: string[];
    missingOutputFiles: string[];
  };
};

type AuditPayload = {
  campaignId: string | null;
  generatedAt: string;
  totals: {
    stages: number;
    uiWired: number;
    apiWired: number;
    brainExecutable: number;
    modelBound: number;
    outputFileVerified: number;
    fullyConnected: number;
  };
  stages: StageAudit[];
};

function StatusCell({ value }: { value: boolean }) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
      value ? 'bg-success/20 text-success' : 'bg-error/20 text-error'
    )}>
      {value ? <CheckCircle size={12} /> : <XCircle size={12} />}
      {value ? 'Yes' : 'No'}
    </span>
  );
}

export default function ConnectionAuditPage() {
  const { currentCampaign } = useData();
  const [audit, setAudit] = useState<AuditPayload | null>(null);
  const [expandedStage, setExpandedStage] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAudit = async () => {
    setLoading(true);
    setError(null);
    try {
      const campaignQuery = currentCampaign?.id ? `?campaignId=${encodeURIComponent(currentCampaign.id)}` : '';
      const res = await apiFetch(`/api/connection-audit${campaignQuery}`, { cache: 'no-store' });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload?.message || payload?.error || 'Failed to load connection audit.');
      }
      setAudit(payload.data as AuditPayload);
    } catch (loadErr) {
      setError(loadErr instanceof Error ? loadErr.message : String(loadErr));
      setAudit(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAudit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampaign?.id]);

  const coverage = useMemo(() => {
    if (!audit?.totals?.stages) {
      return 0;
    }
    return Math.round((audit.totals.fullyConnected / audit.totals.stages) * 100);
  }, [audit]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Connection Audit</h1>
          <p className="text-[#94A3B8] mt-1">
            Per-stage wiring health across UI, API, brain, model routing, and output files.
          </p>
          {audit?.campaignId && (
            <p className="text-xs text-[#64748B] mt-2">
              Campaign context: <span className="text-[#CBD5E1]">{audit.campaignId}</span>
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => void loadAudit()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-white text-sm disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Audit
        </button>
      </div>

      {audit && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-3">
            <p className="text-xs text-[#94A3B8]">Fully Connected</p>
            <p className="text-xl font-semibold text-white mt-1">{audit.totals.fullyConnected}/{audit.totals.stages}</p>
            <p className="text-xs text-[#64748B] mt-1">{coverage}% coverage</p>
          </div>
          <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-3">
            <p className="text-xs text-[#94A3B8]">UI Wired</p>
            <p className="text-xl font-semibold text-white mt-1">{audit.totals.uiWired}</p>
          </div>
          <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-3">
            <p className="text-xs text-[#94A3B8]">API Wired</p>
            <p className="text-xl font-semibold text-white mt-1">{audit.totals.apiWired}</p>
          </div>
          <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-3">
            <p className="text-xs text-[#94A3B8]">Brain Executable</p>
            <p className="text-xl font-semibold text-white mt-1">{audit.totals.brainExecutable}</p>
          </div>
          <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-3">
            <p className="text-xs text-[#94A3B8]">Model Bound</p>
            <p className="text-xl font-semibold text-white mt-1">{audit.totals.modelBound}</p>
          </div>
          <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-3">
            <p className="text-xs text-[#94A3B8]">Outputs Verified</p>
            <p className="text-xl font-semibold text-white mt-1">{audit.totals.outputFileVerified}</p>
          </div>
          <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-3">
            <p className="text-xs text-[#94A3B8]">Generated</p>
            <p className="text-xs text-[#CBD5E1] mt-2">{new Date(audit.generatedAt).toLocaleString()}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-error/10 border border-error/30 rounded-lg p-4 text-sm text-error">
          {error}
        </div>
      )}

      {loading && (
        <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-4 text-sm text-[#94A3B8]">
          Building connection audit snapshot...
        </div>
      )}

      {!loading && audit && (
        <div className="space-y-3">
          {audit.stages.map(stage => {
            const fullyConnected =
              stage.uiWired &&
              stage.apiWired &&
              stage.brainExecutable &&
              stage.modelBound &&
              stage.outputFileVerified;
            const isOpen = expandedStage === stage.stage;
            return (
              <div key={stage.stage} className="bg-[#1E293B] border border-[#334155] rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedStage(isOpen ? null : stage.stage)}
                  className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-[#273449]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-white">S{stage.stage}</span>
                    <span className="text-sm text-[#CBD5E1]">{stage.label}</span>
                    {fullyConnected ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-success/20 text-success">
                        <CheckCircle size={12} />
                        Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-warning/20 text-warning">
                        <AlertTriangle size={12} />
                        Gaps
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[#94A3B8]">{isOpen ? 'Hide details' : 'Show details'}</span>
                </button>

                <div className="px-4 pb-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-1">
                    <StatusCell value={stage.uiWired} />
                    <StatusCell value={stage.apiWired} />
                    <StatusCell value={stage.brainExecutable} />
                    <StatusCell value={stage.modelBound} />
                    <StatusCell value={stage.outputFileVerified} />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-1 text-[11px] text-[#64748B]">
                    <span>UI wired</span>
                    <span>API wired</span>
                    <span>Brain executable</span>
                    <span>Model bound</span>
                    <span>Output verified</span>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-[#334155] px-4 py-3 text-xs space-y-2 bg-[#0F172A]">
                    <p className="text-[#94A3B8]">
                      UI routes found: <span className="text-[#CBD5E1]">{stage.details.uiRoutesFound.join(', ') || 'None'}</span>
                    </p>
                    <p className="text-[#94A3B8]">
                      API routes found: <span className="text-[#CBD5E1]">{stage.details.apiRoutesFound.join(', ') || 'None'}</span>
                    </p>
                    <p className="text-[#94A3B8]">
                      Brain path: <span className="text-[#CBD5E1]">{stage.details.brainFilePath || 'Missing/null in manifest'}</span>
                    </p>
                    <p className="text-[#94A3B8]">
                      Model routing key: <span className="text-[#CBD5E1]">{stage.details.modelRoutingKey || 'Not bound'}</span>
                    </p>
                    <p className="text-success">
                      Existing output files: {stage.details.existingOutputFiles.join(', ') || 'None'}
                    </p>
                    <p className="text-warning">
                      Missing output files: {stage.details.missingOutputFiles.join(', ') || 'None'}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
