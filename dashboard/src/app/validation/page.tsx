'use client';

import React, { useEffect, useState } from 'react';
import { 
  CheckCircle, XCircle, AlertTriangle, RefreshCw, 
  Terminal, Globe, BarChart3, Shield
} from 'lucide-react';
import clsx from 'clsx';
import StageHeader from '@/components/StageHeader';
import { useData } from '@/context/DataContext';
import { apiFetch } from '@/lib/clientApi';
import GovernanceDrilldownPanel from '@/components/GovernanceDrilldownPanel';

type ValidationStatus = 'passed' | 'failed' | 'warning' | 'pending';
type ValidationCategory = 'technical' | 'browser' | 'regression' | 'production';

interface ValidationCheck {
  id: string;
  category: ValidationCategory;
  name: string;
  status: ValidationStatus;
  message: string;
  checkedAt: string;
}

interface GovernanceSummary {
  stage: number;
  filePath: string | null;
  valid: boolean;
  issueCount: number;
  warningCount: number;
  issues: Array<{ code: string; severity: string; message: string; evidence?: string }>;
  warnings: Array<{ code: string; severity: string; message: string; evidence?: string }>;
}

export default function ValidationPage() {
  const { currentCampaign } = useData();
  const [running, setRunning] = useState(false);
  const [category, setCategory] = useState('all');
  const [checks, setChecks] = useState<ValidationCheck[]>([]);
  const [governance, setGovernance] = useState<{ hasBlockingIssues: boolean; summaries: GovernanceSummary[] } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadValidation = async () => {
      if (!currentCampaign?.id) {
        setChecks([]);
        return;
      }

      setIsLoading(true);
      setLoadError(null);
      try {
        const res = await apiFetch(`/api/validation?campaignId=${encodeURIComponent(currentCampaign.id)}`, { cache: 'no-store' });
        const payload = await res.json();
        if (!res.ok || !payload.success) {
          throw new Error(payload?.message || payload?.error || 'Failed to load validation data.');
        }
        setChecks(Array.isArray(payload.data?.checks) ? payload.data.checks : []);
        setGovernance(payload.data?.governance ? {
          hasBlockingIssues: Boolean(payload.data.governance.hasBlockingIssues),
          summaries: Array.isArray(payload.data.governance.summaries) ? payload.data.governance.summaries : [],
        } : null);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : String(error));
      } finally {
        setIsLoading(false);
      }
    };

    void loadValidation();
  }, [currentCampaign]);

  const filteredChecks = checks.filter(c =>
    category === 'all' || c.category === category
  );

  const passedCount = checks.filter(c => c.status === 'passed').length;
  const failedCount = checks.filter(c => c.status === 'failed').length;
  const warningCount = checks.filter(c => c.status === 'warning').length;
  const pendingCount = checks.filter(c => c.status === 'pending').length;
  const score = checks.length > 0 ? Math.round((passedCount / checks.length) * 100) : 0;

  const handleRunValidation = async () => {
    if (!currentCampaign?.id) {
      return;
    }

    const campaignId = currentCampaign.id;
    setRunning(true);
    setLoadError(null);
    try {
      const res = await apiFetch(`/api/validation?campaignId=${encodeURIComponent(campaignId)}`, { cache: 'no-store' });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload?.message || payload?.error || 'Failed to load validation data.');
      }
      setChecks(Array.isArray(payload.data?.checks) ? payload.data.checks : []);
      setGovernance(payload.data?.governance ? {
        hasBlockingIssues: Boolean(payload.data.governance.hasBlockingIssues),
        summaries: Array.isArray(payload.data.governance.summaries) ? payload.data.governance.summaries : [],
      } : null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : String(error));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stage Headers for S13, S14, S15 */}
      <div className="grid grid-cols-3 gap-4">
        <StageHeader stageNumber={13} stageName="Technical Validation" agentId="validator" />
        <StageHeader stageNumber={14} stageName="Browser Validation" agentId="collector" />
        <StageHeader stageNumber={15} stageName="Production" agentId="production" />
      </div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Validation Center</h1>
          <p className="text-[#94A3B8] mt-1">
            Live validation status from `13-validation-report.json` and downstream artifacts.
          </p>
        </div>
        <button
          onClick={handleRunValidation}
          disabled={running || !currentCampaign}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover disabled:opacity-50"
        >
          <RefreshCw size={18} className={running ? 'animate-spin' : ''} />
          {running ? 'Running...' : 'Run Validation'}
        </button>
      </div>

      {/* Score */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={clsx(
              'w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold border-4',
              score >= 80 && 'border-success text-success',
              score >= 60 && score < 80 && 'border-warning text-warning',
              score < 60 && 'border-error text-error'
            )}>
              {score}%
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Production Readiness Score</h3>
              <p className="text-sm text-[#94A3B8]">Based on {checks.length} validation checks</p>
            </div>
          </div>
          <div className="flex gap-4">
            {governance && (
              <div className="text-center">
                <p className={clsx(
                  'text-2xl font-bold',
                  governance.hasBlockingIssues ? 'text-error' : 'text-success'
                )}>
                  {governance.hasBlockingIssues ? '!' : '✓'}
                </p>
                <p className="text-xs text-[#64748B]">Governance</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-2xl font-bold text-success">{passedCount}</p>
              <p className="text-xs text-[#64748B]">Passed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-warning">{warningCount}</p>
              <p className="text-xs text-[#64748B]">Warnings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-error">{failedCount}</p>
              <p className="text-xs text-[#64748B]">Failed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#64748B]">{pendingCount}</p>
              <p className="text-xs text-[#64748B]">Pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'all', label: 'All', icon: Shield },
          { id: 'technical', label: 'Technical', icon: Terminal },
          { id: 'browser', label: 'Browser', icon: Globe },
          { id: 'regression', label: 'Regression', icon: BarChart3 },
          { id: 'production', label: 'Production', icon: CheckCircle },
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
              category === cat.id 
                ? 'bg-primary text-white' 
                : 'bg-[#273449] text-[#94A3B8] hover:text-white'
            )}
          >
            <cat.icon size={16} />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Validation Results */}
      <div className="space-y-2">
        {governance && governance.summaries.length > 0 && (
          <GovernanceDrilldownPanel
            campaignId={currentCampaign?.id}
            hasBlockingIssues={governance.hasBlockingIssues}
            results={governance.summaries}
          />
        )}
        {!currentCampaign && (
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 text-sm text-[#94A3B8]">
            Select a campaign to view validation status.
          </div>
        )}
        {loadError && (
          <div className="bg-error/10 border border-error/30 rounded-xl p-4 text-sm text-error">
            {loadError}
          </div>
        )}
        {isLoading && (
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 text-sm text-[#94A3B8]">
            Loading validation data...
          </div>
        )}
        {filteredChecks.map(check => (
          <div
            key={check.id}
            className={clsx(
              'bg-[#1E293B] border rounded-xl p-4 flex items-center gap-4',
              check.status === 'passed' && 'border-success/30',
              check.status === 'failed' && 'border-error/30',
              check.status === 'warning' && 'border-warning/30',
              check.status === 'pending' && 'border-[#334155]'
            )}
          >
            <div className={clsx(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              check.status === 'passed' && 'bg-success/20',
              check.status === 'failed' && 'bg-error/20',
              check.status === 'warning' && 'bg-warning/20',
              check.status === 'pending' && 'bg-[#273449]'
            )}>
              {check.status === 'passed' && <CheckCircle size={20} className="text-success" />}
              {check.status === 'failed' && <XCircle size={20} className="text-error" />}
              {check.status === 'warning' && <AlertTriangle size={20} className="text-warning" />}
              {check.status === 'pending' && <div className="w-3 h-3 rounded-full bg-[#64748B]" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-white font-medium">{check.name}</h4>
                <span className={clsx(
                  'text-xs px-2 py-0.5 rounded-full capitalize',
                  check.status === 'passed' && 'bg-success/20 text-success',
                  check.status === 'failed' && 'bg-error/20 text-error',
                  check.status === 'warning' && 'bg-warning/20 text-warning',
                  check.status === 'pending' && 'bg-[#273449] text-[#64748B]'
                )}>
                  {check.status}
                </span>
              </div>
              <p className="text-sm text-[#94A3B8] mt-1">{check.message}</p>
            </div>
            <span className="text-xs text-[#64748B] capitalize">{check.category}</span>
          </div>
        ))}
        {!isLoading && filteredChecks.length === 0 && currentCampaign && (
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 text-sm text-[#94A3B8]">
            No validation checks available yet for this campaign.
          </div>
        )}
      </div>
    </div>
  );
}
