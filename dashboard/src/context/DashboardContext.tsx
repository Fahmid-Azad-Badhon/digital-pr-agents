/**
 * =============================================================================
 * Dashboard Context - Provides campaign status and AI actions
 * =============================================================================
 */

'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiFetch, apiRequest, formatApiError } from '@/lib/clientApi';

interface StageStatus {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'waiting_approval' | 'needs_revision' | 'skipped';
  modelUsed?: string;
  primaryModel?: string;
  fallbackUsed?: boolean;
  fallbackReason?: string;
  validationStatus?: string;
  outputFile?: string;
}

interface FallbackEvent {
  stage: string;
  primaryModel: string;
  fallbackModel: string;
  reason: string;
  timestamp: string;
}

interface ModelUsage {
  calls: number;
  failures: number;
  fallbackUsed: number;
}

interface HumanApproval {
  status: 'waiting' | 'approved' | 'rejected' | 'needs_revision' | 'none';
  selectedAngle?: string;
  approvedAt?: string;
  notes?: string;
}

interface OutputFile {
  name: string;
  exists: boolean;
  lastModified?: string;
  size?: number;
  validationStatus?: string;
}

interface CampaignStatus {
  campaignName: string;
  currentStage: string;
  workflowStatus: string;
  selectedAngle?: string;
  lastUpdated: string;
  stagesCompleted: number;
  stagesRemaining: number;
  validationStatus: string;
  finalReadiness: boolean;
  stages: StageStatus[];
  fallbackEvents: FallbackEvent[];
  modelUsage: Record<string, ModelUsage>;
  humanApproval: HumanApproval;
  outputFiles: OutputFile[];
  errors: Array<{ stage: string; error: string; timestamp: string }>;
}

interface DashboardContextType {
  campaignSlug: string | null;
  setCampaignSlug: (slug: string) => void;
  status: CampaignStatus | null;
  loading: boolean;
  error: string | null;
  refreshStatus: () => Promise<void>;
  approveAngle: (angleId: string, angleTitle: string, notes?: string) => Promise<boolean>;
  rejectAngle: (notes?: string) => Promise<boolean>;
  requestRevision: (notes: string) => Promise<boolean>;
  resumeWorkflow: (targetStage: string) => Promise<boolean>;
  runDashboardAI: (featureId: string, input: Record<string, unknown>) => Promise<unknown>;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [campaignSlug, setCampaignSlug] = useState<string | null>(null);
  const [status, setStatus] = useState<CampaignStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    if (!campaignSlug) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiFetch(`/api/campaigns/${campaignSlug}/status`.replace('campaigns/', 'campaigns/'));
      if (!response.ok) {
        throw new Error('Failed to fetch campaign status');
      }
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [campaignSlug]);

  // Auto-refresh when campaign changes
  useEffect(() => {
    if (campaignSlug) {
      refreshStatus();
    }
  }, [campaignSlug, refreshStatus]);

  const approveAngle = useCallback(async (angleId: string, angleTitle: string, notes?: string): Promise<boolean> => {
    if (!campaignSlug) return false;
    
    try {
      await apiRequest(`/api/campaigns/${campaignSlug}/human-approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          selectedAngleId: angleId,
          selectedAngleTitle: angleTitle,
          notes
        })
      });
      
      await refreshStatus();
      return true;
    } catch (err) {
      setError(formatApiError(err, 'Failed to approve'));
      return false;
    }
  }, [campaignSlug, refreshStatus]);

  const rejectAngle = useCallback(async (notes?: string): Promise<boolean> => {
    if (!campaignSlug) return false;
    
    try {
      await apiRequest(`/api/campaigns/${campaignSlug}/human-approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', notes })
      });
      
      await refreshStatus();
      return true;
    } catch (err) {
      setError(formatApiError(err, 'Failed to reject'));
      return false;
    }
  }, [campaignSlug, refreshStatus]);

  const requestRevision = useCallback(async (notes: string): Promise<boolean> => {
    if (!campaignSlug) return false;
    
    try {
      await apiRequest(`/api/campaigns/${campaignSlug}/human-approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request_revision', notes })
      });
      
      await refreshStatus();
      return true;
    } catch (err) {
      setError(formatApiError(err, 'Failed to request revision'));
      return false;
    }
  }, [campaignSlug, refreshStatus]);

  const resumeWorkflow = useCallback(async (targetStage: string): Promise<boolean> => {
    if (!campaignSlug) return false;
    
    try {
      await apiRequest(`/api/campaigns/${campaignSlug}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetStage })
      });
      
      await refreshStatus();
      return true;
    } catch (err) {
      setError(formatApiError(err, 'Failed to resume'));
      return false;
    }
  }, [campaignSlug, refreshStatus]);

  const runDashboardAI = useCallback(async (featureId: string, input: Record<string, unknown>): Promise<unknown> => {
    try {
      const data = await apiRequest<{ result?: unknown }>('/api/dashboard/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignSlug,
          featureId,
          input
        })
      });
      return data.result || data;
    } catch (err) {
      setError(formatApiError(err, 'AI request failed'));
      return { error: 'AI request failed' };
    }
  }, [campaignSlug]);

  return (
    <DashboardContext.Provider
      value={{
        campaignSlug,
        setCampaignSlug,
        status,
        loading,
        error,
        refreshStatus,
        approveAngle,
        rejectAngle,
        requestRevision,
        resumeWorkflow,
        runDashboardAI
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardProvider');
  }
  return context;
}
