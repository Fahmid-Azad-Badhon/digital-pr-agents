'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useData } from '@/context/DataContext';
import { useSearchParams } from 'next/navigation';
import { STAGES } from '@/types';
import AgentAvatar from '@/components/AgentAvatar';
import { 
  Play, Pause, CheckCircle, XCircle, Clock, AlertTriangle, 
  ChevronDown, ChevronRight, ArrowRight, Search, Radio
} from 'lucide-react';
import clsx from 'clsx';
import { apiFetch, apiRequest, ApiClientError, formatApiError } from '@/lib/clientApi';
import GovernanceDrilldownPanel from '@/components/GovernanceDrilldownPanel';
import { CAMPAIGN_STAGE_ROUTING, MODEL_CONFIG } from '@/config/model-routing.config';

const STAGE_TO_ROUTING_KEY: Record<number, string> = {
  1: 'S1_CAMPAIGN_INTAKE',
  2: 'S2_DATA_EXTRACTION',
  3: 'S3_RESEARCH_ENRICHMENT',
  4: 'S4A_DATA_RESEARCH_ANALYST',
  5: 'S5_ANGLE_GENERATION',
  6: 'S6_BEAT_MATCHING',
  7: 'S7_PITCH_SELECTION_HUMAN_GATE',
  8: 'S8_JOURNALIST_COLLECTION',
  9: 'S9_JOURNALIST_INTELLIGENCE',
  10: 'S10_PITCH_DRAFTING',
  11: 'S11_PITCH_OPTIMIZATION',
  12: 'S12_PACKAGE_ASSEMBLY',
  13: 'S13_VALIDATION',
  14: 'S14_FINAL_FORMATTING',
  15: 'S15_OUTREACH_ASSET_CREATION',
  16: 'S16_CAMPAIGN_LOG_LEARNING_LOOP',
};

type WorkflowApiStage = {
  number: number;
  name: string;
  owner: string;
  status: string;
  progress: number;
};

type WorkflowSnapshot = {
  currentStage: number;
  status: string;
  needsUserSelection?: boolean;
  stages: WorkflowApiStage[];
};

function getStageModelRoute(stageNumber: number) {
  const routeKey = STAGE_TO_ROUTING_KEY[stageNumber];
  if (!routeKey) {
    return null;
  }
  const route = CAMPAIGN_STAGE_ROUTING[routeKey];
  if (!route) {
    return null;
  }
  return {
    routeKey,
    primaryKey: route.primary,
    reviewerKey: route.mandatoryReviewer || null,
    fallbackKeys: [route.fallback1, route.fallback2].filter(Boolean),
    primaryLabel: MODEL_CONFIG[route.primary]?.displayName || route.primary,
    reviewerLabel: route.mandatoryReviewer
      ? (MODEL_CONFIG[route.mandatoryReviewer]?.displayName || route.mandatoryReviewer)
      : null,
  };
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed': return <CheckCircle size={16} className="text-success" />;
    case 'running': return <Play size={16} className="text-primary animate-pulse" />;
    case 'failed': return <XCircle size={16} className="text-error" />;
    case 'paused': return <Pause size={16} className="text-warning" />;
    case 'needs-user-selection': return <AlertTriangle size={16} className="text-manual" />;
    default: return <Clock size={16} className="text-[#64748B]" />;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed': return 'border-success bg-success/10';
    case 'running': return 'border-primary bg-primary/10';
    case 'failed': return 'border-error bg-error/10';
    case 'paused': return 'border-warning bg-warning/10';
    case 'needs-user-selection': return 'border-manual bg-manual/10';
    case 'approved': return 'border-success bg-success/10';
    default: return 'border-[#334155] bg-[#273449]';
  }
}



export default function WorkflowPage() {
  const { stages, currentCampaign: contextCampaign, gates, isPaused, needsUserSelection, setCurrentCampaign, campaigns, refreshCampaigns, startResearchEnrichment, addLog, addNotification } = useData();
  const [expandedStage, setExpandedStage] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'pipeline' | 'list'>('pipeline');
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionErrorDetails, setActionErrorDetails] = useState<Record<string, unknown> | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [stagePrechecks, setStagePrechecks] = useState<Record<number, { canExecute: boolean; reason: string | null; requiredAction: string | null; missing: string[] }>>({});
  const [liveStatus, setLiveStatus] = useState<{ currentStage: number; status: string; errors: number; warnings: number } | null>(null);
  const searchParams = useSearchParams();
  const campaignId = searchParams.get('id');
  const [isStartingResearch, setIsStartingResearch] = useState(false);
  const [backups, setBackups] = useState<Array<{ backupId: string; createdAt: string | null; path: string }>>([]);
  const [selectedBackupId, setSelectedBackupId] = useState<string>('');
  const [governanceState, setGovernanceState] = useState<{
    hasBlockingIssues: boolean;
    results: Array<{
      stage: number;
      filePath: string | null;
      valid: boolean;
      issues: Array<{ code: string; severity: string; message: string; evidence?: string }>;
      warnings: Array<{ code: string; severity: string; message: string; evidence?: string }>;
    }>;
  } | null>(null);
  const [workflowSnapshot, setWorkflowSnapshot] = useState<WorkflowSnapshot | null>(null);

  const getUiErrorMessage = useCallback((error: unknown, fallback: string) => {
    const message = formatApiError(error, fallback);
    if (error instanceof ApiClientError && error.requestId) {
      return `${message} [request-id: ${error.requestId}]`;
    }
    return message;
  }, []);

  useEffect(() => {
    if (!campaignId) {
      return;
    }

    const campaignFromList = campaigns.find(c => c.id === campaignId);
    if (campaignFromList) {
      if (!contextCampaign || contextCampaign.id !== campaignId) {
        setCurrentCampaign(campaignFromList);
      }
      return;
    }

    void refreshCampaigns();
  }, [campaignId, contextCampaign, campaigns, refreshCampaigns, setCurrentCampaign]);

  // Use the context campaign (which should now be set from URL if needed)
  const currentCampaign = contextCampaign;

  useEffect(() => {
    if (!currentCampaign?.id) {
      return;
    }

    const eventSource = new EventSource(`/api/campaigns/${encodeURIComponent(currentCampaign.id)}/stream`);
    eventSource.addEventListener('status', event => {
      try {
        const payload = JSON.parse((event as MessageEvent).data) as {
          currentStage: number;
          status: string;
          errors: number;
          warnings: number;
        };
        setLiveStatus(payload);
      } catch {
        return;
      }
    });
    eventSource.onerror = () => {
      eventSource.close();
    };
    return () => eventSource.close();
  }, [currentCampaign?.id]);

  useEffect(() => {
    if (!currentCampaign?.id) {
      setWorkflowSnapshot(null);
      return;
    }

    let cancelled = false;

    const loadWorkflowSnapshot = async () => {
      try {
        const response = await apiFetch(`/api/workflow?campaignId=${encodeURIComponent(currentCampaign.id)}`, {
          cache: 'no-store',
        });
        if (!response.ok) {
          return;
        }
        const payload = await response.json();
        const data = payload?.data || payload;
        if (!cancelled && data && Array.isArray(data.stages)) {
          setWorkflowSnapshot({
            currentStage: Number(data.currentStage || currentCampaign.currentStage || 1),
            status: String(data.status || 'running'),
            needsUserSelection: Boolean(data.needsUserSelection),
            stages: data.stages,
          });
        }
      } catch {
        // Non-fatal: keep rendering with context fallback.
      }
    };

    void loadWorkflowSnapshot();
    const timer = window.setInterval(() => {
      void loadWorkflowSnapshot();
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [currentCampaign?.id, currentCampaign?.currentStage]);

  const workflowStages = useMemo(() => {
    return STAGES.map(stage => {
      const contextStage = stages.find(s => s.stageNumber === stage.number);
      const snapshotStage = workflowSnapshot?.stages.find(s => s.number === stage.number);
      return {
        id: contextStage?.id || `stage-${stage.number}`,
        campaignId: contextStage?.campaignId || currentCampaign?.id || '',
        stageNumber: stage.number,
        name: stage.name,
        ownerAgent: stage.owner,
        status: (snapshotStage?.status || contextStage?.status || 'waiting') as string,
        progress: typeof snapshotStage?.progress === 'number'
          ? snapshotStage.progress
          : (contextStage?.progress || 0),
        primaryModel: contextStage?.primaryModel || '',
        qualityGateModel: contextStage?.qualityGateModel || '',
        inputFiles: contextStage?.inputFiles || [],
        outputFiles: contextStage?.outputFiles || [],
        logs: contextStage?.logs || [],
        errors: contextStage?.errors || [],
        startedAt: contextStage?.startedAt,
        completedAt: contextStage?.completedAt,
      };
    });
  }, [stages, workflowSnapshot, currentCampaign?.id]);

  const effectiveNeedsUserSelection = workflowSnapshot?.needsUserSelection ?? needsUserSelection;
  const effectivePaused = isPaused || workflowSnapshot?.status === 'paused';

  const loadBackups = useCallback(async () => {
    if (!currentCampaign?.id) {
      setBackups([]);
      setSelectedBackupId('');
      return;
    }

    try {
      const payload = await apiRequest<{ backups: Array<{ backupId: string; createdAt: string | null; path: string }> }>(
        `/api/campaigns/${encodeURIComponent(currentCampaign.id)}/backup`,
        { method: 'GET' }
      );
      const nextBackups = Array.isArray(payload?.backups) ? payload.backups : [];
      setBackups(nextBackups);
      setSelectedBackupId(prev => {
        if (!nextBackups.length) {
          return '';
        }
        if (prev && nextBackups.some((backup: { backupId: string }) => backup.backupId === prev)) {
          return prev;
        }
        return nextBackups[0].backupId;
      });
    } catch (error) {
      const message = getUiErrorMessage(error, 'Failed to load backups.');
      setActionError(message);
      addLog({ level: 'error', source: 'backup', message: `Failed to load backups: ${message}` });
    }
  }, [currentCampaign, addLog, getUiErrorMessage]);

  const loadGovernanceState = useCallback(async () => {
    if (!currentCampaign?.id) {
      setGovernanceState(null);
      return;
    }

    try {
      const payload = await apiRequest<{ governance?: { hasBlockingIssues?: boolean; results?: Array<{
        stage: number;
        filePath: string | null;
        valid: boolean;
        issues: Array<{ code: string; severity: string; message: string; evidence?: string }>;
        warnings: Array<{ code: string; severity: string; message: string; evidence?: string }>;
      }> } }>(`/api/campaigns/${encodeURIComponent(currentCampaign.id)}/stage-state`, { method: 'GET' });
      const governance = payload?.governance;
      if (!governance) {
        setGovernanceState(null);
        return;
      }
      setGovernanceState({
        hasBlockingIssues: Boolean(governance.hasBlockingIssues),
        results: Array.isArray(governance.results) ? governance.results : [],
      });
    } catch (error) {
      const message = getUiErrorMessage(error, 'Failed to load governance status.');
      setActionError(message);
      addLog({ level: 'error', source: 'governance', message: `Failed to load governance status: ${message}` });
    }
  }, [currentCampaign, addLog, getUiErrorMessage]);

  useEffect(() => {
    void loadBackups();
  }, [loadBackups]);

  useEffect(() => {
    void loadGovernanceState();
  }, [loadGovernanceState]);

  const runWorkflowAction = useCallback(async (action: 'start' | 'pause' | 'resume' | 'advance') => {
    if (!currentCampaign?.id) {
      return;
    }
    setActionBusy(action);
    setActionError(null);
    setActionMessage(null);

    try {
      const payload = await apiRequest<{ status?: string }>('/api/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          campaignId: currentCampaign.id,
          stage: currentCampaign.currentStage,
        }),
      });

      const message = payload?.status
        ? `Workflow ${action} completed (${payload.status}).`
        : `Workflow ${action} completed.`;
      setActionMessage(message);
      addLog({ level: 'info', source: 'workflow-ui', message });
      await Promise.all([refreshCampaigns(), loadGovernanceState()]);
    } catch (error) {
      const message = getUiErrorMessage(error, `Failed action: ${action}`);
      setActionError(message);
      addLog({ level: 'error', source: 'workflow-ui', message: `Workflow ${action} failed: ${message}` });
    } finally {
      setActionBusy(null);
    }
  }, [currentCampaign, addLog, refreshCampaigns, loadGovernanceState, getUiErrorMessage]);

  const runScriptAction = useCallback(async (
    action: 'draft_study_input' | 'import_muckrack_output' | 'draft_journalist_intel' | 'draft_pitch_draft' | 'export_google_doc'
  ) => {
    if (!currentCampaign?.id) {
      return;
    }

    setActionBusy(action);
    setActionError(null);
    setActionMessage(null);

    try {
      const payload = await apiRequest<{ stdout?: string }>(`/api/campaigns/${encodeURIComponent(currentCampaign.id)}/scripts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const stdout = payload?.stdout ? ` | ${String(payload.stdout).slice(0, 160)}` : '';
      const message = `Script ${action} finished.${stdout}`;
      setActionMessage(message);
      addLog({ level: 'success', source: 'script-runner', message });
      await Promise.all([refreshCampaigns(), loadGovernanceState()]);
    } catch (error) {
      const message = getUiErrorMessage(error, `Script failed: ${action}`);
      setActionError(message);
      addLog({ level: 'error', source: 'script-runner', message: `Script ${action} failed: ${message}` });
    } finally {
      setActionBusy(null);
    }
  }, [currentCampaign, addLog, refreshCampaigns, loadGovernanceState, getUiErrorMessage]);

  const runStageRuntimeAction = useCallback(async (stage: 12 | 13 | 14 | 15 | 16) => {
    if (!currentCampaign?.id) {
      return;
    }

    setActionBusy(`stage_${stage}`);
    setActionError(null);
    setActionErrorDetails(null);
    setActionMessage(null);

    try {
      const payload = await apiRequest<{ outputFile?: string }>(`/api/campaigns/${encodeURIComponent(currentCampaign.id)}/execute-stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      });

      const outputFile = payload?.outputFile ? ` -> ${payload.outputFile}` : '';
      const message = `Executed S${stage}${outputFile}`;
      setActionMessage(message);
      addLog({ level: 'success', source: 'stage-runtime', message });
      await Promise.all([refreshCampaigns(), loadGovernanceState()]);
      if (currentCampaign?.id) {
        const precheckRes = await apiFetch(`/api/campaigns/${encodeURIComponent(currentCampaign.id)}/execute-stage`, { cache: 'no-store' });
        const precheckPayload = await precheckRes.json();
        if (precheckRes.ok && precheckPayload?.success && Array.isArray(precheckPayload?.data?.prechecks)) {
          const nextMap: Record<number, { canExecute: boolean; reason: string | null; requiredAction: string | null; missing: string[] }> = {};
          for (const item of precheckPayload.data.prechecks) {
            if (typeof item?.stage === 'number') {
              nextMap[item.stage] = {
                canExecute: Boolean(item.canExecute),
                reason: item.reason ?? null,
                requiredAction: item.requiredAction ?? null,
                missing: Array.isArray(item.missing) ? item.missing : [],
              };
            }
          }
          setStagePrechecks(nextMap);
        }
      }
    } catch (error) {
      const message = getUiErrorMessage(error, `Stage execution failed: S${stage}`);
      const details = error instanceof ApiClientError && error.details && typeof error.details === 'object'
        ? (error.details as Record<string, unknown>)
        : null;
      setActionError(message);
      setActionErrorDetails(details);
      addLog({ level: 'error', source: 'stage-runtime', message: `S${stage} execution failed: ${message}` });
    } finally {
      setActionBusy(null);
    }
  }, [currentCampaign, addLog, refreshCampaigns, loadGovernanceState, getUiErrorMessage]);

  useEffect(() => {
    const loadPrechecks = async () => {
      if (!currentCampaign?.id) {
        setStagePrechecks({});
        return;
      }
      try {
        const res = await apiFetch(`/api/campaigns/${encodeURIComponent(currentCampaign.id)}/execute-stage`, {
          method: 'GET',
          cache: 'no-store',
        });
        const payload = await res.json();
        if (!res.ok || !payload.success || !Array.isArray(payload?.data?.prechecks)) {
          return;
        }
        const nextMap: Record<number, { canExecute: boolean; reason: string | null; requiredAction: string | null; missing: string[] }> = {};
        for (const item of payload.data.prechecks) {
          if (typeof item?.stage === 'number') {
            nextMap[item.stage] = {
              canExecute: Boolean(item.canExecute),
              reason: item.reason ?? null,
              requiredAction: item.requiredAction ?? null,
              missing: Array.isArray(item.missing) ? item.missing : [],
            };
          }
        }
        setStagePrechecks(nextMap);
      } catch {
        setStagePrechecks({});
      }
    };
    void loadPrechecks();
  }, [currentCampaign?.id]);

  const runBackupCreate = useCallback(async () => {
    if (!currentCampaign?.id) {
      return;
    }
    setActionBusy('backup_create');
    setActionError(null);
    setActionMessage(null);
    try {
      const payload = await apiRequest<{ backupId?: string }>(`/api/campaigns/${encodeURIComponent(currentCampaign.id)}/backup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', note: 'Manual backup from workflow dashboard' }),
      });
      const backupId = payload?.backupId || 'unknown';
      const message = `Backup created: ${backupId}`;
      setActionMessage(message);
      addLog({ level: 'success', source: 'backup', message });
      await loadBackups();
    } catch (error) {
      const message = getUiErrorMessage(error, 'Backup failed.');
      setActionError(message);
      addLog({ level: 'error', source: 'backup', message: `Backup creation failed: ${message}` });
    } finally {
      setActionBusy(null);
    }
  }, [currentCampaign, addLog, loadBackups, getUiErrorMessage]);

  const runBackupRestore = useCallback(async () => {
    if (!currentCampaign?.id || !selectedBackupId) {
      return;
    }
    const confirmed = window.confirm(
      `Restore campaign from backup "${selectedBackupId}"?\n\nA safety snapshot will be created before restore.`
    );
    if (!confirmed) {
      return;
    }

    setActionBusy('backup_restore');
    setActionError(null);
    setActionMessage(null);
    try {
      await apiRequest(`/api/campaigns/${encodeURIComponent(currentCampaign.id)}/backup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', backupId: selectedBackupId }),
      });
      const message = `Campaign restored from backup: ${selectedBackupId}`;
      setActionMessage(message);
      addLog({ level: 'warning', source: 'backup', message });
      await Promise.all([refreshCampaigns(), loadBackups(), loadGovernanceState()]);
    } catch (error) {
      const message = getUiErrorMessage(error, 'Restore failed.');
      setActionError(message);
      addLog({ level: 'error', source: 'backup', message: `Backup restore failed: ${message}` });
    } finally {
      setActionBusy(null);
    }
  }, [currentCampaign, selectedBackupId, addLog, refreshCampaigns, loadBackups, loadGovernanceState, getUiErrorMessage]);

  const liveStageLabel = useMemo(() => {
    if (!liveStatus) {
      return null;
    }
    return `S${liveStatus.currentStage} • ${liveStatus.status} • errors ${liveStatus.errors} • warnings ${liveStatus.warnings}`;
  }, [liveStatus]);

  // Handler to start Research Enrichment (Stage 3)
  const handleStartResearchEnrichment = async () => {
    if (!currentCampaign) {
      alert('No active campaign found. Please create a campaign first.');
      return;
    }

    const stage3Data = workflowStages.find(s => s.stageNumber === 3);
    if (stage3Data?.status === 'running' || stage3Data?.status === 'completed') {
      return;
    }

    setIsStartingResearch(true);
    try {
      // Use the context function to properly initialize research enrichment
      const result = await startResearchEnrichment();
      
      if (result.success) {
        addLog({ level: 'warning', source: 'research-enrichment', message: result.message });
        addNotification({ type: 'warning', title: 'Research Enrichment', message: result.message });
      }
    } catch (error) {
      console.error('Failed to start Research Enrichment:', error);
      alert('Could not start Research Enrichment. Please try again.');
    } finally {
      setIsStartingResearch(false);
    }
  };

  if (!currentCampaign) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle size={48} className="text-warning mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No Active Campaign</h3>
        <p className="text-[#94A3B8]">Create a campaign first to monitor its workflow.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Workflow Monitor</h1>
          <p className="text-[#94A3B8] mt-1">
            Track all 16 stages of the Digital PR workflow pipeline.
          </p>
          <div className="mt-2 inline-flex items-center rounded-full border border-info/40 bg-info/10 px-3 py-1">
            <span className="text-[11px] text-info">
              Model routing source: <span className="text-white">system/model-routing.config.json</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('pipeline')}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm',
              viewMode === 'pipeline' ? 'bg-primary text-white' : 'bg-[#273449] text-[#94A3B8]'
            )}
          >
            Pipeline
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm',
              viewMode === 'list' ? 'bg-primary text-white' : 'bg-[#273449] text-[#94A3B8]'
            )}
          >
            List
          </button>
        </div>
      </div>

      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Execution Controls</h3>
            <p className="text-xs text-[#94A3B8]">Trigger workflow actions and stage scripts from dashboard.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
            {governanceState && (
              <span
                className={clsx(
                  'px-2 py-0.5 rounded-full border',
                  governanceState.hasBlockingIssues
                    ? 'text-error border-error/40 bg-error/10'
                    : 'text-success border-success/40 bg-success/10'
                )}
              >
                {governanceState.hasBlockingIssues ? 'Governance Blocked' : 'Governance OK'}
              </span>
            )}
            <Radio size={14} className={liveStatus ? 'text-success' : 'text-[#64748B]'} />
            <span>{liveStageLabel || 'Live stream connecting...'}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => void runWorkflowAction('start')} disabled={!!actionBusy} className="px-3 py-1.5 rounded-lg text-xs bg-primary text-white disabled:opacity-50">Start</button>
          <button onClick={() => void runWorkflowAction('pause')} disabled={!!actionBusy} className="px-3 py-1.5 rounded-lg text-xs bg-warning/30 text-warning disabled:opacity-50">Pause</button>
          <button onClick={() => void runWorkflowAction('resume')} disabled={!!actionBusy} className="px-3 py-1.5 rounded-lg text-xs bg-success/30 text-success disabled:opacity-50">Resume</button>
          <button onClick={() => void runWorkflowAction('advance')} disabled={!!actionBusy} className="px-3 py-1.5 rounded-lg text-xs bg-[#334155] text-white disabled:opacity-50">Advance</button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => void runScriptAction('draft_study_input')} disabled={!!actionBusy} className="px-3 py-1.5 rounded-lg text-xs bg-[#273449] text-white disabled:opacity-50">Run S2 Extract</button>
          <button onClick={() => void runScriptAction('import_muckrack_output')} disabled={!!actionBusy} className="px-3 py-1.5 rounded-lg text-xs bg-[#273449] text-white disabled:opacity-50">Run S8 Import</button>
          <button onClick={() => void runScriptAction('draft_journalist_intel')} disabled={!!actionBusy} className="px-3 py-1.5 rounded-lg text-xs bg-[#273449] text-white disabled:opacity-50">Run S9 Intel</button>
          <button onClick={() => void runScriptAction('draft_pitch_draft')} disabled={!!actionBusy} className="px-3 py-1.5 rounded-lg text-xs bg-[#273449] text-white disabled:opacity-50">Run S10 Draft</button>
          <button onClick={() => void runScriptAction('export_google_doc')} disabled={!!actionBusy} className="px-3 py-1.5 rounded-lg text-xs bg-[#273449] text-white disabled:opacity-50">Run S13 Export</button>
          <button onClick={() => void runBackupCreate()} disabled={!!actionBusy} className="px-3 py-1.5 rounded-lg text-xs bg-[#273449] text-white disabled:opacity-50">Create Backup</button>
        </div>
        <div className="flex flex-wrap gap-3">
          {[12, 13, 14, 15, 16].map(stage => {
            const precheck = stagePrechecks[stage];
            const blocked = precheck?.canExecute === false;
            const running = actionBusy === `stage_${stage}`;
            const labelByStage: Record<number, string> = {
              12: 'Execute S12 Package',
              13: 'Execute S13 Validation',
              14: 'Execute S14 Formatting',
              15: 'Execute S15 Assets',
              16: 'Execute S16 Learning',
            };
            const buttonStateClass = running
              ? 'bg-primary text-white'
              : blocked
                ? 'bg-warning/30 text-warning border border-warning/40'
                : 'bg-success/25 text-success border border-success/40';

            return (
              <div key={`stage-runtime-${stage}`} className="flex flex-col gap-1">
                <button
                  onClick={() => void runStageRuntimeAction(stage as 12 | 13 | 14 | 15 | 16)}
                  disabled={!!actionBusy || blocked}
                  title={blocked ? `${precheck?.reason || 'Blocked'} ${precheck?.requiredAction ? `| ${precheck.requiredAction}` : ''}` : `Execute stage ${stage}`}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-50',
                    buttonStateClass
                  )}
                >
                  {running ? `Running S${stage}...` : labelByStage[stage]}
                </button>
                {blocked && (
                  <div className="max-w-[240px]">
                    <span className="inline-flex w-full rounded-md border border-warning/40 bg-warning/10 px-2 py-1 text-[10px] leading-tight text-warning">
                      {precheck?.reason || 'Blocked'}
                    </span>
                    {precheck?.requiredAction && (
                      <span className="inline-flex w-full mt-1 rounded-md border border-info/40 bg-info/10 px-2 py-1 text-[10px] leading-tight text-info">
                        {precheck.requiredAction}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedBackupId}
            onChange={event => setSelectedBackupId(event.target.value)}
            className="px-2 py-1.5 rounded-lg text-xs bg-[#0F172A] border border-[#334155] text-white min-w-[260px]"
            disabled={!backups.length || !!actionBusy}
          >
            {backups.length === 0 ? (
              <option value="">No backups available</option>
            ) : (
              backups.map(backup => (
                <option key={backup.backupId} value={backup.backupId}>
                  {backup.backupId} {backup.createdAt ? `(${new Date(backup.createdAt).toLocaleString()})` : ''}
                </option>
              ))
            )}
          </select>
          <button
            onClick={() => void runBackupRestore()}
            disabled={!selectedBackupId || !!actionBusy}
            className="px-3 py-1.5 rounded-lg text-xs bg-warning/30 text-warning disabled:opacity-50"
          >
            Restore Backup
          </button>
          <button
            onClick={() => void loadBackups()}
            disabled={!!actionBusy}
            className="px-3 py-1.5 rounded-lg text-xs bg-[#273449] text-white disabled:opacity-50"
          >
            Refresh Backups
          </button>
        </div>
        {actionBusy && <p className="text-xs text-info">Running: {actionBusy}</p>}
        {actionMessage && <p className="text-xs text-success">{actionMessage}</p>}
        {actionError && <p className="text-xs text-error">{actionError}</p>}
        {actionErrorDetails && (
          <div className="mt-2 rounded-lg border border-error/40 bg-error/10 p-2 text-xs text-[#FCA5A5]">
            {'requiredAction' in actionErrorDetails && (
              <p>
                Required action: <span className="text-white">{String(actionErrorDetails.requiredAction)}</span>
              </p>
            )}
            {'currentStage' in actionErrorDetails && 'stage' in actionErrorDetails && (
              <p>
                Current stage: <span className="text-white">S{String(actionErrorDetails.currentStage)}</span> |
                Requested stage: <span className="text-white">S{String(actionErrorDetails.stage)}</span>
              </p>
            )}
            {'missing' in actionErrorDetails && Array.isArray(actionErrorDetails.missing) && (
              <p>
                Missing dependencies: <span className="text-white">{(actionErrorDetails.missing as string[]).join(', ')}</span>
              </p>
            )}
          </div>
        )}
      </div>

      {governanceState && governanceState.results.length > 0 && (
        <GovernanceDrilldownPanel
          campaignId={currentCampaign?.id}
          hasBlockingIssues={governanceState.hasBlockingIssues}
          results={governanceState.results}
        />
      )}

      {/* Pause/Selection Banner */}
      {(effectivePaused || effectiveNeedsUserSelection) && (
        <div className="bg-manual/20 border border-manual rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle size={24} className="text-manual" />
            <div>
              <p className="text-white font-medium">
                {effectiveNeedsUserSelection 
                  ? 'Workflow Paused - Pitch Selection (Human Gate)' 
                  : 'Workflow Paused'}
              </p>
              <p className="text-sm text-[#94A3B8]">
                {effectiveNeedsUserSelection 
                  ? 'Stage 6 (Beat Matching) complete. Please select which pitch angle should proceed from Stage 7 (Pitch Selection).' 
                  : 'Waiting for manual intervention.'}
              </p>
            </div>
          </div>
          {effectiveNeedsUserSelection && (
            <a
              href="/pitch-selection"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-manual text-white font-medium hover:bg-manual/90"
            >
              Select Pitch
              <ArrowRight size={18} />
            </a>
          )}
        </div>
      )}

      {/* Gates Status */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Workflow Gates</h3>
        <div className="flex flex-wrap gap-2">
          {gates.map(gate => (
            <div
              key={gate.id}
              className={clsx(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg border',
                gate.status === 'passed' && 'border-success bg-success/10 text-success',
                gate.status === 'ready' && 'border-warning bg-warning/10 text-warning',
                gate.status === 'waiting' && 'border-info bg-info/10 text-info',
                gate.status === 'locked' && 'border-[#334155] bg-[#273449] text-[#64748B]',
                gate.status === 'failed' && 'border-error bg-error/10 text-error'
              )}
            >
              <div className={clsx(
                'w-2 h-2 rounded-full',
                gate.status === 'passed' && 'bg-success',
                gate.status === 'ready' && 'bg-warning animate-pulse',
                gate.status === 'waiting' && 'bg-info',
                gate.status === 'locked' && 'bg-[#64748B]',
                gate.status === 'failed' && 'bg-error'
              )} />
              <span className="text-sm">{gate.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pipeline View */}
      {viewMode === 'pipeline' && (
        <div className="overflow-x-auto">
          <div className="flex gap-3 pb-4 min-w-max">
            {STAGES.map((stage, idx) => {
              const stageData = workflowStages.find(s => s.stageNumber === stage.number);
              const isExpanded = expandedStage === stage.number;
              const modelRoute = getStageModelRoute(stage.number);
              
              return (
                <div key={stage.number} className="flex flex-col items-center">
                  {/* Connector */}
                  {idx > 0 && (
                    <div className={clsx(
                      'h-8 w-8 mb-2',
                      stageData?.status === 'completed' ? 'bg-success' : 'bg-[#334155]'
                    )} />
                  )}
                  
                  {/* Stage Card */}
                  <div
                    className={clsx(
                      'w-48 rounded-xl border-2 p-3 cursor-pointer transition-all hover:scale-[1.02]',
                      getStatusColor(stageData?.status || 'waiting')
                    )}
                    onClick={() => setExpandedStage(isExpanded ? null : stage.number)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[#64748B]">Stage {stage.number}</span>
                      {getStatusIcon(stageData?.status || 'waiting')}
                    </div>
                    <h4 className="text-sm font-medium text-white line-clamp-2">{stage.name}</h4>
                    <div className="flex items-center gap-1 mt-2">
                      <AgentAvatar agentId={stage.owner} name={stage.owner} role={stage.owner} size="sm" />
                    </div>
                    
                    {/* Progress bar */}
                    {(stageData?.status === 'running' || stageData?.status === 'completed') && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-[#334155] rounded-full overflow-hidden">
                          <div
                            className={clsx(
                              'h-full rounded-full transition-all',
                              stageData.status === 'completed' ? 'bg-success' : 'bg-primary'
                            )}
                            style={{ width: `${stageData.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-[#64748B]">{Math.round(stageData.progress || 0)}%</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Expanded Details */}
                  {isExpanded && stageData && (
                    <div className="mt-2 w-56 bg-[#1E293B] border border-[#334155] rounded-lg p-3 animate-scale-in">
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#64748B]">Status:</span>
                          <span className="text-white capitalize">{stageData.status}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748B]">Primary Model:</span>
                          <span className="text-white">{modelRoute?.primaryLabel || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748B]">Quality Gate/Reviewer:</span>
                          <span className="text-white">{modelRoute?.reviewerLabel || '-'}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-[#64748B]">Fallbacks:</span>
                          <span className="text-white text-right">
                            {modelRoute?.fallbackKeys?.map(key => MODEL_CONFIG[key]?.displayName || key).join(', ') || '-'}
                          </span>
                        </div>
                        {stageData.startedAt && (
                          <div className="flex justify-between">
                            <span className="text-[#64748B]">Started:</span>
                            <span className="text-white">{new Date(stageData.startedAt).toLocaleTimeString()}</span>
                          </div>
                        )}
                        {stageData.completedAt && (
                          <div className="flex justify-between">
                            <span className="text-[#64748B]">Completed:</span>
                            <span className="text-white">{new Date(stageData.completedAt).toLocaleTimeString()}</span>
                          </div>
                        )}
                        {stageData.errors.length > 0 && (
                          <div className="mt-2 p-2 bg-error/10 rounded">
                            <span className="text-error">Errors: {stageData.errors.length}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {STAGES.map(stage => {
            const stageData = workflowStages.find(s => s.stageNumber === stage.number);
            const modelRoute = getStageModelRoute(stage.number);
            
            return (
              <div
                key={stage.number}
                className={clsx(
                  'bg-[#1E293B] border rounded-xl overflow-hidden',
                  getStatusColor(stageData?.status || 'waiting').split(' ')[0]
                )}
              >
                <div 
                  className="p-4 cursor-pointer flex items-center justify-between"
                  onClick={() => setExpandedStage(expandedStage === stage.number ? null : stage.number)}
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(stageData?.status || 'waiting')}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#64748B]">Stage {stage.number}</span>
                        <span className={clsx(
                          'text-xs px-2 py-0.5 rounded-full',
                          stageData?.status === 'completed' && 'bg-success/20 text-success',
                          stageData?.status === 'running' && 'bg-primary/20 text-primary',
                          stageData?.status === 'paused' && 'bg-warning/20 text-warning',
                          stageData?.status === 'failed' && 'bg-error/20 text-error',
                          !stageData?.status || stageData.status === 'waiting' && 'bg-[#273449] text-[#64748B]'
                        )}>
                          {stageData?.status || 'waiting'}
                        </span>
                      </div>
                      <h4 className="text-white font-medium mt-1">{stage.name}</h4>
                       <div className="flex items-center gap-2 mt-1">
                         <AgentAvatar agentId={stage.owner} name={stage.owner} role={stage.owner} size="sm" />
                         <span className="text-xs text-[#64748B]">{stage.owner}</span>
                       </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {stageData?.status === 'running' && (
                      <div className="text-right">
                        <div className="text-sm text-white">{Math.round(stageData.progress || 0)}%</div>
                        <div className="h-1.5 w-24 bg-[#334155] rounded-full overflow-hidden mt-1">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${stageData.progress || 0}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {expandedStage === stage.number ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </div>
                </div>
                
                {expandedStage === stage.number && (
                  <div className="px-4 pb-4 border-t border-[#334155]">
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-[#64748B] mb-1">Primary Model</p>
                        <p className="text-sm text-white">{modelRoute?.primaryLabel || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#64748B] mb-1">Quality Gate/Reviewer</p>
                        <p className="text-sm text-white">{modelRoute?.reviewerLabel || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#64748B] mb-1">Fallback Chain</p>
                        <p className="text-sm text-white">
                          {modelRoute?.fallbackKeys?.map(key => MODEL_CONFIG[key]?.displayName || key).join(', ') || '-'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Stage 3: Research Enrichment 3-Round UI */}
                    {stage.number === 3 && (
                      <div className="mt-4 p-4 bg-[#273449] rounded-lg">
                        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                          <Search size={16} className="text-purple-400" />
                          Research Enrichment - 3 Rounds
                        </h4>
                        
                        {/* 3 Rounds */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="p-3 bg-[#1E293B] rounded-lg">
                            <p className="text-xs font-medium text-white mb-1">Round 1</p>
                            <p className="text-xs text-[#94A3B8]">Broad Discovery</p>
                            <p className="text-xs text-purple-400 mt-1">SERP, Scholar, Government, News</p>
                          </div>
                          <div className="p-3 bg-[#1E293B] rounded-lg">
                            <p className="text-xs font-medium text-white mb-1">Round 2</p>
                            <p className="text-xs text-[#94A3B8]">Filtering & Gap Analysis</p>
                            <p className="text-xs text-purple-400 mt-1">Credibility, Competitor Gaps</p>
                          </div>
                          <div className="p-3 bg-[#1E293B] rounded-lg">
                            <p className="text-xs font-medium text-white mb-1">Round 3</p>
                            <p className="text-xs text-[#94A3B8]">Final Enrichment Map</p>
                            <p className="text-xs text-purple-400 mt-1">Pitch Hooks, Beats, Handoff</p>
                          </div>
                        </div>
                        
                        {/* Source Categories */}
                        <p className="text-xs text-[#64748B] mb-2">Source Categories</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {['SERP', 'Google Scholar', 'Government', 'Whitepapers', 'News', 'Competitor PR', 'Blogs', 'Local Papers'].map(src => (
                            <span key={src} className="px-2 py-1 bg-[#1E293B] text-xs text-[#94A3B8] rounded">
                              {src}
                            </span>
                          ))}
                        </div>
                        
                        {/* Purpose */}
                        <p className="text-xs text-[#64748B] mb-1">Purpose</p>
                        <p className="text-sm text-[#94A3B8] mb-3">
                          Enrich extracted data with SERP research, source verification, trend discovery, and supporting context before angle generation.
                        </p>
                        
                        {/* Action Button */}
                        <div className="mt-4">
                          {/* Show button if stage is ready OR if currentStage is 3 but stage status isn't set */}
                          {(stageData?.status === 'ready' || (currentCampaign?.currentStage >= 3 && !stageData?.status)) && (
                            <button
                              onClick={handleStartResearchEnrichment}
                              disabled={isStartingResearch}
                              className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-all"
                            >
                              {isStartingResearch ? (
                                <>
                                  <span className="animate-spin">⟳</span>
                                  Starting...
                                </>
                              ) : (
                                <>
                                  <Play size={16} />
                                  Proceed to Research Enrichment
                                </>
                              )}
                            </button>
                          )}
                          {(stageData?.status === 'running' || (currentCampaign?.currentStage === 3 && stageData?.status === 'waiting')) && (
                            <div className="flex items-center justify-center gap-2 p-3 bg-purple-600/20 rounded-lg">
                              <Play size={16} className="text-purple-400 animate-pulse" />
                              <span className="text-sm text-purple-400">Research Enrichment in progress...</span>
                            </div>
                          )}
                          {(stageData?.status === 'completed' || currentCampaign?.currentStage > 3) && (
                            <div className="flex items-center justify-center gap-2 p-3 bg-success/20 rounded-lg">
                              <CheckCircle size={16} className="text-success" />
                              <span className="text-sm text-success">Research Enrichment completed</span>
                            </div>
                          )}
                        </div>

                        {/* Navigation CTA */}
                        <div className="flex gap-2 mt-4">
                          <a href="/data-extraction" className="text-xs text-[#94A3B8] hover:text-white">
                            ← Back to Data Extraction
                          </a>
                          {stageData?.status === 'completed' && (
                            <>
                              <span className="text-xs text-[#64748B]">|</span>
                              <a href="/angles" className="text-xs text-primary hover:text-white">
                                Continue to Angle Generation →
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {stageData && stageData.logs && stageData.logs.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs text-[#64748B] mb-2">Stage Logs</p>
                        <div className="space-y-1 max-h-32 overflow-auto">
                          {stageData.logs.slice(0, 5).map(log => (
                            <div key={log.id} className="text-xs text-[#94A3B8] flex items-center gap-2">
                              <span className={clsx(
                                'w-1.5 h-1.5 rounded-full',
                                log.level === 'success' && 'bg-success',
                                log.level === 'error' && 'bg-error',
                                log.level === 'warning' && 'bg-warning',
                                log.level === 'info' && 'bg-info'
                              )} />
                              {log.message}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
