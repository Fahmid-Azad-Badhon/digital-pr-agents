/**
 * Advanced Real-Time Polling & WebSocket Simulation System
 * Provides real-time campaign and workflow status updates
 * 
 * Features:
 * - Configurable polling intervals
 * - Event-driven architecture
 * - Automatic reconnection
 * - Offline detection
 * - Optimistic updates
 * - Windows-compatible
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface PollingConfig {
  /** Polling interval in milliseconds */
  intervalMs: number;
  /** Maximum retries on failure */
  maxRetries: number;
  /** Retry delay in milliseconds */
  retryDelayMs: number;
  /** Enable optimistic updates */
  optimisticUpdates: boolean;
  /** Enable offline detection */
  offlineDetection: boolean;
}

export interface PollState<T> {
  /** Current data */
  data: T | null;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Last successful update timestamp */
  lastUpdated: number | null;
  /** Number of failed attempts */
  failedAttempts: number;
  /** Is offline */
  isOffline: boolean;
}

export interface UsePollingReturn<T> extends PollState<T> {
  /** Force refresh */
  refresh: () => Promise<void>;
  /** Update data optimistically */
  updateOptimistic: (data: Partial<T>) => void;
  /** Reset error state */
  clearError: () => void;
  /** Pause polling */
  pause: () => void;
  /** Resume polling */
  resume: () => void;
  /** Is polling active */
  isPolling: boolean;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: PollingConfig = {
  intervalMs: 3000,
  maxRetries: 3,
  retryDelayMs: 1000,
  optimisticUpdates: true,
  offlineDetection: true,
};

// ============================================================================
// HOOK: Advanced Polling
// ============================================================================

/**
 * Advanced polling hook with real-time features
 */
export function useAdvancedPolling<T>(
  url: string,
  config: Partial<PollingConfig> = {},
  dependencies: unknown[] = []
): UsePollingReturn<T> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isPolling, setIsPolling] = useState<boolean>(true);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // ============================================================================
  // FETCH FUNCTION
  // ============================================================================
  
  const fetchData = useCallback(async (isRetry: boolean = false) => {
    if (!isMountedRef.current) return;
    
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    try {
      setLoading(true);
      
      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const json = await response.json() as T;
      
      if (isMountedRef.current) {
        setData(json);
        setLastUpdated(Date.now());
        setError(null);
        setFailedAttempts(0);
        setIsOffline(false);
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      
      // Ignore aborted requests
      if (err instanceof Error && err.name === 'AbortError') return;
      
      const error = err instanceof Error ? err : new Error('Unknown error');
      
      setError(error);
      setFailedAttempts(prev => prev + 1);
      
      // Check for offline
      if (mergedConfig.offlineDetection) {
        if (!navigator.onLine) {
          setIsOffline(true);
        }
      }
      
      // Handle retry logic
      if (!isRetry && failedAttempts < mergedConfig.maxRetries) {
        retryTimeoutRef.current = setTimeout(() => {
          fetchData(true);
        }, mergedConfig.retryDelayMs * (failedAttempts + 1));
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [url, failedAttempts, mergedConfig]);

  // ============================================================================
  // OPTIMISTIC UPDATE
  // ============================================================================
  
  const updateOptimistic = useCallback((updates: Partial<T>) => {
    if (mergedConfig.optimisticUpdates && data !== null) {
      setData(prev => prev ? { ...prev, ...updates } : null);
    }
  }, [data, mergedConfig.optimisticUpdates]);

  // ============================================================================
  // CLEAR ERROR
  // ============================================================================
  
  const clearError = useCallback(() => {
    setError(null);
    setFailedAttempts(0);
  }, []);

  // ============================================================================
  // PAUSE/RESUME
  // ============================================================================
  
  const pause = useCallback(() => {
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resume = useCallback(() => {
    setIsPolling(true);
    fetchData();
  }, [fetchData]);

  // ============================================================================
  // REFRESH
  // ============================================================================
  
  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // ============================================================================
  // EFFECTS
  // ============================================================================
  
  // Initial fetch
  useEffect(() => {
    isMountedRef.current = true;
    fetchData();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [url, ...dependencies]);
  
  // Polling interval
  useEffect(() => {
    if (isPolling && !isOffline) {
      intervalRef.current = setInterval(() => {
        fetchData();
      }, mergedConfig.intervalMs);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPolling, isOffline, mergedConfig.intervalMs, fetchData]);
  
  // Offline detection
  useEffect(() => {
    if (!mergedConfig.offlineDetection) return;
    
    const handleOnline = () => {
      setIsOffline(false);
      fetchData();
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [mergedConfig.offlineDetection, fetchData]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  return {
    data,
    loading,
    error,
    lastUpdated,
    failedAttempts,
    isOffline,
    refresh,
    updateOptimistic,
    clearError,
    pause,
    resume,
    isPolling,
  };
}

// ============================================================================
// HOOK: Campaign Polling (Specialized)
// ============================================================================

interface CampaignStatus {
  id: string;
  status: string;
  current_stage: number;
  progress_percentage: number;
  selected_angle: string | null;
}

export function useCampaignPolling(campaignId: string | null) {
  const url = campaignId ? `/api/campaigns/${campaignId}` : null;
  
  return useAdvancedPolling<CampaignStatus>(
    url || '',
    {
      intervalMs: 2000,
      maxRetries: 5,
      optimisticUpdates: true,
    },
    [campaignId]
  );
}

// ============================================================================
// HOOK: Dashboard Stats Polling
// ============================================================================

interface DashboardStats {
  total: number;
  active: number;
  completed: number;
  failed: number;
  draft: number;
  paused: number;
  avgDuration: number;
  stageStats: {
    completed: number;
    running: number;
    pending: number;
    failed: number;
  };
}

export function useDashboardStats(pollIntervalMs: number = 5000) {
  return useAdvancedPolling<DashboardStats>(
    '/api/campaigns/stats',
    {
      intervalMs: pollIntervalMs,
      maxRetries: 3,
      offlineDetection: true,
    },
    []
  );
}

// ============================================================================
// HOOK: Workflow Progress Polling
// ============================================================================

interface WorkflowProgress {
  currentStage: number;
  totalStages: number;
  percentage: number;
  stages: {
    name: string;
    status: string;
    duration: number | null;
  }[];
}

export function useWorkflowProgress(campaignId: string | null) {
  const url = campaignId ? `/api/workflow/progress/${campaignId}` : null;
  
  return useAdvancedPolling<WorkflowProgress>(
    url || '',
    {
      intervalMs: 1500,
      maxRetries: 10,
      optimisticUpdates: true,
    },
    [campaignId]
  );
}

// ============================================================================
// HOOK: Multi-Campaign Polling
// ============================================================================

export function useMultiCampaignPolling(campaignIds: string[]) {
  return useAdvancedPolling<Record<string, CampaignStatus>>(
    '/api/campaigns/batch',
    {
      intervalMs: 4000,
      maxRetries: 3,
    },
    [campaignIds.join(',')]
  );
}

// ============================================================================
// HOOK: Log Streaming
// ============================================================================

interface LogEntry {
  id: string;
  stage: string | null;
  agent: string | null;
  level: string;
  message: string;
  created_at: string;
}

export function useLogStream(campaignId: string | null, limit: number = 50) {
  const url = campaignId ? `/api/logs?campaignId=${campaignId}&limit=${limit}` : null;
  
  return useAdvancedPolling<LogEntry[]>(
    url || '',
    {
      intervalMs: 1000,
      maxRetries: 5,
    },
    [campaignId, limit]
  );
}

// ============================================================================
// EXPORT
// ============================================================================

export default useAdvancedPolling;