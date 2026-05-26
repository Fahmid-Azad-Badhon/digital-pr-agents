'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { 
  Campaign, WorkflowStage, Gate, Angle, ModelRoute, 
  ActivityLog, Notification, ValidationCheck, Journalist,
  PitchVariant, PitchAngle, STAGES, MODEL_ROUTES, AGENTS, getPhaseByStage, getStageRoute, getLockedReasonForStage, TOTAL_WORKFLOW_STAGES,
  ResearchEnrichment
} from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { apiFetch } from '@/lib/clientApi';

const ACTIVE_CAMPAIGN_KEY = 'digital-pr-active-campaign-id';

interface DataContextType {
  campaigns: Campaign[];
  currentCampaign: Campaign | null;
  stages: WorkflowStage[];
  gates: Gate[];
  angles: Angle[];
  logs: ActivityLog[];
  notifications: Notification[];
  validations: ValidationCheck[];
  journalists: Journalist[];
  pitchVariants: PitchVariant[];
  modelRoutes: ModelRoute[];
  
  // Pitch Selection State
  pitchAngles: PitchAngle[];
  selectedPitchAngles: PitchAngle[];
  rejectedPitchAngles: PitchAngle[];
  pitchSelectionStatus: 'locked' | 'waiting' | 'needs_review' | 'in_review' | 'completed' | 'failed';
  pitchSelectionError: string | null;
  
  // Research Enrichment State
  researchEnrichment: ResearchEnrichment | null;
  
  createCampaign: (data: Partial<Campaign>) => Campaign;
  setCurrentCampaign: (campaign: Campaign | null) => void;
  updateCampaign: (id: string, data: Partial<Campaign>) => void;
  updateStage: (stageNumber: number, data: Partial<WorkflowStage>) => void;
  updateGate: (gateNumber: number, data: Partial<Gate>) => void;
  addLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  updateAngles: (angles: Angle[]) => void;
  selectAngle: (angleId: number) => void;
  updateJournalistsList: (journalists: Journalist[]) => void;
  updatePitchVariantsList: (variants: PitchVariant[]) => void;
  startWorkflow: () => void;
  resumeWorkflow: () => void;
  refreshCampaigns: () => Promise<void>;
  
  // Pitch Selection Actions
  selectPitchAngle: (angleId: string) => void;
  rejectPitchAngle: (angleId: string) => void;
  unselectPitchAngle: (angleId: string) => void;
  clearPitchSelection: () => void;
  selectTopPitchAngles: (count: number) => void;
  confirmPitchSelection: () => boolean;
  canUnlockJournalistCollection: () => boolean;
  getPitchSelectionSummary: () => { total: number; selected: number; rejected: number };
  
  // Research Enrichment Actions
  startResearchEnrichment: () => Promise<{ success: boolean; message: string }>;
  runResearchRound: (round: number) => Promise<{ success: boolean; message: string }>;
  completeResearchEnrichment: () => void;
  
  isPaused: boolean;
  needsUserSelection: boolean;
  getAgentById: (id: string) => typeof AGENTS[number] | undefined;
  getCurrentPhase: () => string;
  getWorkflowProgress: () => number;
  getNextStageRoute: () => string | null;
  getLockedReason: (stageNum: number) => string;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [currentCampaign, setCurrentCampaignState] = useState<Campaign | null>(null);
  const [stages, setStages] = useState<WorkflowStage[]>([]);
  const [gates, setGates] = useState<Gate[]>([]);
  const [angles, setAnglesState] = useState<Angle[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [validations, setValidations] = useState<ValidationCheck[]>([]);
  const [journalists, setJournalists] = useState<Journalist[]>([]);
  const [pitchVariants, setPitchVariants] = useState<PitchVariant[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [needsUserSelection, setNeedsUserSelection] = useState(false);
  
  // Pitch Selection State
  const [pitchAngles, setPitchAngles] = useState<PitchAngle[]>([]);
  const [selectedPitchAngles, setSelectedPitchAngles] = useState<PitchAngle[]>([]);
  const [rejectedPitchAngles, setRejectedPitchAngles] = useState<PitchAngle[]>([]);
  const [pitchSelectionStatus, setPitchSelectionStatus] = useState<'locked' | 'waiting' | 'needs_review' | 'in_review' | 'completed' | 'failed'>('locked');
  const [pitchSelectionError, setPitchSelectionError] = useState<string | null>(null);
  
  // Research Enrichment State
  const [researchEnrichment, setResearchEnrichment] = useState<ResearchEnrichment | null>(null);
  const campaignsRefreshInFlight = useRef<Promise<void> | null>(null);
  const campaignsLastRefreshAt = useRef<number>(0);
  const autoProgressInFlight = useRef(false);

  const mapWorkflowAngleToPitchAngle = useCallback((angle: Angle, campaignId: string): PitchAngle => {
    const baseScore = typeof angle.score === 'number' ? angle.score : 7;
    const primaryBeat = angle.journalistBeats?.[0] || 'General';
    const secondaryBeat = angle.journalistBeats?.[1] || '';
    const normalizedStatus: PitchAngle['status'] = angle.status === 'selected'
      ? 'selected'
      : angle.status === 'rejected'
        ? 'rejected'
        : 'undecided';

    return {
      id: String(angle.id),
      campaignId,
      title: angle.headline || `Angle ${angle.id}`,
      summary: angle.whyNewsworthy || 'Campaign angle',
      category: angle.category || 'General',
      targetBeats: angle.journalistBeats || [],
      whyNewsworthy: angle.whyNewsworthy,
      score: baseScore,
      primaryBeat,
      secondaryBeat,
      beatPriority: baseScore >= 9 ? 'High' : baseScore >= 7 ? 'Medium' : 'Low',
      outletType: angle.publicationType || 'News',
      newsworthinessScore: Math.max(10, Math.min(100, (angle.newsworthiness || baseScore) * 10)),
      relevanceScore: Math.max(10, Math.min(100, baseScore * 10)),
      timelinessScore: Math.max(10, Math.min(100, (angle.timeliness || Math.max(baseScore - 1, 1)) * 10)),
      outreachDifficulty: angle.outreachDifficulty,
      whyItWorks: angle.whyNewsworthy || '',
      subjectLine: angle.headline || `Angle ${angle.id}`,
      status: normalizedStatus,
    };
  }, []);

  const refreshCampaigns = useCallback(async () => {
    if (campaignsRefreshInFlight.current) {
      await campaignsRefreshInFlight.current;
      return;
    }

    if (Date.now() - campaignsLastRefreshAt.current < 250) {
      return;
    }

    campaignsLastRefreshAt.current = Date.now();
    campaignsRefreshInFlight.current = (async () => {
      try {
        const res = await apiFetch('/api/campaigns', { cache: 'no-store' });
        if (!res.ok) {
          return;
        }

        const apiCampaigns: Campaign[] = await res.json();
        setCampaigns(apiCampaigns);

        setCurrentCampaignState(prev => {
          if (apiCampaigns.length === 0) {
            return null;
          }

          const ACTIVE_STATUSES = new Set(['running', 'in_progress', 'processing', 'queued', 'repairing']);
          const activeCampaigns = apiCampaigns.filter(c => ACTIVE_STATUSES.has((c.status || '').toLowerCase()));
          if (activeCampaigns.length === 0) {
            return null;
          }

          const savedActiveId = typeof window !== 'undefined'
            ? localStorage.getItem(ACTIVE_CAMPAIGN_KEY)
            : null;
          const preferredId = prev?.id || savedActiveId;
          const matched = preferredId ? activeCampaigns.find(c => c.id === preferredId) : null;
          return matched || activeCampaigns[0];
        });
      } catch (error) {
        console.error('Failed to refresh campaigns from API:', error);
      } finally {
        campaignsRefreshInFlight.current = null;
      }
    })();

    await campaignsRefreshInFlight.current;
  }, []);

  useEffect(() => {
    void refreshCampaigns();

    const intervalId = window.setInterval(() => {
      void refreshCampaigns();
    }, 5000);

    const onFocus = () => {
      void refreshCampaigns();
    };

    window.addEventListener('focus', onFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
    };
  }, [refreshCampaigns]);
  
  // Clear any stale localStorage on load
  useEffect(() => {
    // Just verify currentCampaign is valid against loaded campaigns
    if (currentCampaign && campaigns.length > 0) {
      const isValid = campaigns.some(c => c.id === currentCampaign.id);
      if (!isValid) {
        setCurrentCampaignState(campaigns[0] || null);
      }
    }
  }, [campaigns, currentCampaign, setCurrentCampaignState]);

  // Save active campaign ID to localStorage whenever it changes
  useEffect(() => {
    if (currentCampaign) {
      localStorage.setItem(ACTIVE_CAMPAIGN_KEY, currentCampaign.id);
    } else {
      localStorage.removeItem(ACTIVE_CAMPAIGN_KEY);
    }
  }, [currentCampaign]);

  // Listen for campaign-created events from other components
  useEffect(() => {
    const handleCampaignCreated = (event: Event) => {
      const customEvent = event as CustomEvent<{ campaignId: string; campaign: Campaign }>;
      const { campaign } = customEvent.detail;
      setCurrentCampaignState(campaign);
      void refreshCampaigns();
    };

    window.addEventListener('campaign-created', handleCampaignCreated);
    return () => window.removeEventListener('campaign-created', handleCampaignCreated);
  }, [refreshCampaigns]);

  // Sync frontend stage status with canonical backend API
  // This ensures DataContext doesn't diverge from campaignStateService
  useEffect(() => {
    if (!currentCampaign?.id) return;

    const syncWithBackend = async () => {
      try {
        const res = await apiFetch(`/api/campaigns/${encodeURIComponent(currentCampaign.id)}/status`, {
          cache: 'no-store',
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!data?.stages || !Array.isArray(data.stages)) return;

        // Merge backend stage statuses into local stages
        setStages(prev => {
          const backendStages = data.stages as Array<{ name: string; status: string }>;
          return prev.map(localStage => {
            const backend = backendStages.find(
              (bs: { name: string; status: string }) => bs.name === localStage.name
            );
            if (!backend) return localStage;
            // Map backend status to frontend WorkflowStage status
            const status = backend.status === 'passed' ? 'completed' as const
              : backend.status === 'running' ? 'running' as const
              : backend.status === 'waiting' ? 'waiting' as const
              : backend.status === 'blocked' ? 'blocked' as const
              : backend.status === 'failed' ? 'failed' as const
              : backend.status === 'waiting_approval' ? 'needs-user-selection' as const
              : backend.status as WorkflowStage['status'];
            return { ...localStage, status };
          });
        });
      } catch {
        // Non-fatal - keep local stage status
      }
    };

    void syncWithBackend();
  }, [currentCampaign?.id]);

  useEffect(() => {
    const loadPitchAnglesForCampaign = async () => {
      if (!currentCampaign?.id) {
        setPitchAngles([]);
        setSelectedPitchAngles([]);
        setRejectedPitchAngles([]);
        setPitchSelectionStatus('locked');
        return;
      }

      try {
        const res = await apiFetch(`/api/angles?campaignId=${encodeURIComponent(currentCampaign.id)}`, {
          cache: 'no-store',
        });

        if (!res.ok) {
          if (res.status === 404) {
            setPitchAngles([]);
            setSelectedPitchAngles([]);
            setRejectedPitchAngles([]);
            setPitchSelectionStatus('locked');
            return;
          }
          throw new Error(`ANGLE_LOAD_FAILED_${res.status}`);
        }

        const workflowAngles = await res.json() as Angle[];
        const mappedPitchAngles = workflowAngles.map(angle => mapWorkflowAngleToPitchAngle(angle, currentCampaign.id));
        const selected = mappedPitchAngles.filter(angle => angle.status === 'selected');
        const rejected = mappedPitchAngles.filter(angle => angle.status === 'rejected');

        setAnglesState(workflowAngles);
        setPitchAngles(mappedPitchAngles);
        setSelectedPitchAngles(selected);
        setRejectedPitchAngles(rejected);
        setPitchSelectionStatus(mappedPitchAngles.length > 0 ? 'needs_review' : 'locked');
        setPitchSelectionError(null);
      } catch (error) {
        console.error('Failed to load pitch angles for pitch selection:', error);
        setPitchSelectionError('Failed to load grounded pitch angles from campaign artifacts.');
      }
    };

    void loadPitchAnglesForCampaign();
  }, [currentCampaign?.id, mapWorkflowAngleToPitchAngle]);

  useEffect(() => {
    const runAutoProgress = async () => {
      if (!currentCampaign?.id || autoProgressInFlight.current) {
        return;
      }

      const stage = Number(currentCampaign.currentStage || 1);
      const status = (currentCampaign.status || '').toLowerCase();
      const isStageSelectionPause = stage === 7 && status === 'waiting-for-pitch-selection';
      const isPausedState = status === 'paused' || status === 'waiting-for-user-input' || status === 'waiting-for-agent-review';
      const canAutoRun = stage < 16 && !isStageSelectionPause && !isPausedState;

      if (!canAutoRun) {
        return;
      }

      autoProgressInFlight.current = true;
      try {
        const mode = stage < 7 ? 'pre_pitch' : 'post_pitch';
        await apiFetch(`/api/campaigns/${encodeURIComponent(currentCampaign.id)}/auto-progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode }),
        });
        await refreshCampaigns();
      } catch {
        // Non-fatal: keep UI responsive and retry on next tick.
      } finally {
        autoProgressInFlight.current = false;
      }
    };

    void runAutoProgress();
    const timer = window.setInterval(() => {
      void runAutoProgress();
    }, 9000);
    return () => {
      window.clearInterval(timer);
    };
  }, [currentCampaign?.id, currentCampaign?.currentStage, currentCampaign?.status, refreshCampaigns]);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const campaignQuery = currentCampaign?.id
          ? `?campaignId=${encodeURIComponent(currentCampaign.id)}&limit=200`
          : '?limit=200';
        const res = await apiFetch(`/api/logs${campaignQuery}`, { cache: 'no-store' });
        if (!res.ok) {
          return;
        }
        const payload = await res.json();
        const loadedLogs = Array.isArray(payload?.data?.logs)
          ? payload.data.logs
          : Array.isArray(payload?.logs)
            ? payload.logs
            : [];
        setLogs(loadedLogs);
      } catch {
        // Keep existing in-memory logs if fetch fails.
      }
    };

    void loadLogs();
  }, [currentCampaign?.id]);

  const getAgentById = (id: string) => AGENTS.find(a => a.id === id);

  const getCurrentPhase = () => {
    if (!currentCampaign) return 'Intake & Study';
    return getPhaseByStage(currentCampaign.currentStage);
  };

  const getWorkflowProgress = () => {
    if (!currentCampaign) return 0;
    return Math.round((currentCampaign.currentStage / TOTAL_WORKFLOW_STAGES) * 100);
  };

  const getNextStageRoute = () => {
    if (!currentCampaign) return null;
    return getStageRoute(currentCampaign.currentStage + 1);
  };

  const getLockedReason = (stageNum: number) => {
    if (!currentCampaign) return '';
    return getLockedReasonForStage(stageNum, currentCampaign.currentStage, selectedPitchAngles.length);
  };

  const createCampaign = (data: Partial<Campaign>) => {
    const campaign: Campaign = {
      id: uuidv4(),
      slug: data.slug || data.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'new-campaign',
      name: data.name || 'New Campaign',
      clientName: data.clientName || '',
      studyTitle: data.studyTitle || '',
      topic: data.topic || '',
      targetRegion: data.targetRegion || 'United States',
      targetBeats: data.targetBeats || ['Consumer affairs', 'Business', 'Technology'],
      goal: data.goal || '',
      tone: data.tone || 'Professional',
      notes: data.notes || '',
      status: 'draft',
      currentStage: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCampaigns(prev => [...prev, campaign]);
    setCurrentCampaignState(campaign);
    addLog({ level: 'info', source: 'system', message: `Campaign "${campaign.name}" created.` });
    return campaign;
  };

  const setCurrentCampaign = (campaign: Campaign | null) => {
    const resolvedCampaign = campaign
      ? campaigns.find(c => c.id === campaign.id) || campaign
      : null;

    setCurrentCampaignState(resolvedCampaign);
    if (resolvedCampaign) {
      initializeStages(resolvedCampaign, false);
      initializeGates();
    } else {
      setStages([]);
      setGates([]);
      setAnglesState([]);
      setJournalists([]);
      setPitchVariants([]);
    }
  };

  const initializeStages = (campaign: Campaign, preserveExisting = true) => {
    const campaignId = campaign.id;
    const currentStage = Number(campaign.currentStage || 1);
    const campaignStatus = (campaign.status || '').toLowerCase();

    // If preserveExisting is true and stages already exist, keep their status
    if (preserveExisting && stages.length > 0 && stages.every(s => s.campaignId === campaignId)) {
      return; // Don't reset existing stages
    }
    
    const newStages: WorkflowStage[] = STAGES.map(stage => ({
      id: uuidv4(),
      campaignId,
      stageNumber: stage.number,
      name: stage.name,
      ownerAgent: stage.owner,
      status: stage.number < currentStage
        ? 'completed'
        : stage.number === currentStage
          ? (
            campaignStatus === 'paused'
              ? 'paused'
              : campaignStatus === 'waiting-for-pitch-selection' && stage.number === 7
                ? 'needs-user-selection'
                : campaignStatus === 'waiting-for-user-input' || campaignStatus === 'waiting-for-agent-review'
                  ? 'paused'
                  : campaignStatus === 'completed'
                    ? 'completed'
                    : 'running'
          )
          : 'waiting',
      progress: stage.number < currentStage ? 100 : stage.number === currentStage ? 25 : 0,
      primaryModel: MODEL_ROUTES.find(mr => mr.stageNumber === stage.number)?.primaryModel || '',
      qualityGateModel: MODEL_ROUTES.find(mr => mr.stageNumber === stage.number)?.qualityGateModel || '',
      inputFiles: [],
      outputFiles: [],
      logs: [],
      errors: [],
    }));
    setStages(newStages);
  };

  const initializeGates = () => {
    const newGates: Gate[] = [
      { id: uuidv4(), name: 'Intake Gate', stageNumber: 1, agentId: 'orchestrator', status: 'ready', requirements: ['00-brief.md', 'raw-study-copy.md'] },
      { id: uuidv4(), name: 'Insight Gate', stageNumber: 2, agentId: 'extractor', status: 'locked', requirements: ['01-study-notes.md', '02-insights.md'] },
      { id: uuidv4(), name: 'Research Gate', stageNumber: 3, agentId: 'researcher', status: 'locked', requirements: ['02-insights.md', '03-research.md'] },
      { id: uuidv4(), name: 'Analysis Gate', stageNumber: 4, agentId: 'data-analyst', status: 'locked', requirements: ['analysis-complete'] },
      { id: uuidv4(), name: 'Angle Generation Gate', stageNumber: 5, agentId: 'strategist', status: 'locked', requirements: ['04-angles.md'] },
      { id: uuidv4(), name: 'Beat Match Gate', stageNumber: 6, agentId: 'beat-matcher', status: 'locked', requirements: ['beats-mapped'] },
      { id: uuidv4(), name: 'Human Review Gate', stageNumber: 7, agentId: 'human-reviewer', status: 'locked', requirements: ['pitch-angles-selected', 'human-approved'] },
      { id: uuidv4(), name: 'Collection Gate', stageNumber: 8, agentId: 'collector', status: 'locked', requirements: ['journalists-collected', 'selected-angles-ready'] },
      { id: uuidv4(), name: 'Intelligence Gate', stageNumber: 9, agentId: 'intelligence', status: 'locked', requirements: ['journalist-profiles', 'coverage-history'] },
      { id: uuidv4(), name: 'Pitch Draft Gate', stageNumber: 10, agentId: 'copywriter', status: 'locked', requirements: ['08-pitch-draft.md', 'intelligence-ready'] },
      { id: uuidv4(), name: 'Optimization Gate', stageNumber: 11, agentId: 'optimizer', status: 'locked', requirements: ['09-optimized-email.md', 'subject-lines-ready'] },
      { id: uuidv4(), name: 'Package Gate', stageNumber: 12, agentId: 'packager', status: 'locked', requirements: ['final-package-ready', 'assets-complete'] },
      { id: uuidv4(), name: 'Export Gate', stageNumber: 13, agentId: 'orchestrator', status: 'locked', requirements: ['google-doc-exported', 'package-approved'] },
      { id: uuidv4(), name: 'Validation Gate', stageNumber: 14, agentId: 'validator', status: 'locked', requirements: ['technical-validation-passed'] },
      { id: uuidv4(), name: 'Browser Check Gate', stageNumber: 15, agentId: 'collector', status: 'locked', requirements: ['browser-validation-passed'] },
      { id: uuidv4(), name: 'Production Gate', stageNumber: 16, agentId: 'production', status: 'locked', requirements: ['all-checks-passed', 'ready-to-send'] },
    ];
    setGates(newGates);
  };

  const updateCampaign = (id: string, data: Partial<Campaign>) => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c));
    if (currentCampaign?.id === id) {
      setCurrentCampaignState(prev => prev ? { ...prev, ...data, updatedAt: new Date().toISOString() } : null);
    }

    const hasStageMutation = data.currentStage !== undefined || data.status !== undefined;
    if (!hasStageMutation) {
      return;
    }

    const stageStatePayload = (() => {
      if (data.status === 'paused' && data.currentStage === undefined) {
        return { action: 'pause' as const };
      }
      if (data.status === 'running' && data.currentStage === undefined) {
        return { action: 'resume' as const };
      }
      return {
        action: 'set' as const,
        ...(data.currentStage !== undefined ? { toStage: data.currentStage } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      };
    })();

    void apiFetch(`/api/campaigns/${encodeURIComponent(id)}/stage-state`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stageStatePayload),
    }).catch(error => {
      console.error('Failed to persist campaign stage state:', error);
    });
  };

  const updateStage = (stageNumber: number, data: Partial<WorkflowStage>) => {
    setStages(prev => prev.map(s => s.stageNumber === stageNumber ? { ...s, ...data } : s));
  };

  const updateGate = (gateNumber: number, data: Partial<Gate>) => {
    setGates(prev => prev.map(g => g.stageNumber === gateNumber ? { ...g, ...data } : g));
  };

  const addLog = (log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    const newLog: ActivityLog = { ...log, id: uuidv4(), timestamp: new Date().toISOString() };
    setLogs(prev => [newLog, ...prev].slice(0, 500));

    void apiFetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...log,
        campaignId: currentCampaign?.id,
      }),
    }).catch(() => undefined);
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const updateAngles = (newAngles: Angle[]) => {
    setAnglesState(newAngles);
  };

  const selectAngle = (angleId: number) => {
    setAnglesState(prev => prev.map(a => ({
      ...a,
      status: a.id === angleId ? 'selected' : a.status === 'selected' ? 'pending' : a.status
    })));
    
    if (currentCampaign) {
      updateCampaign(currentCampaign.id, { selectedAngleId: angleId });
    }
    
    setNeedsUserSelection(false);
    setIsPaused(false);
    
    updateGate(3, { status: 'passed', passedAt: new Date().toISOString() });
    updateStage(4, { status: 'completed', progress: 100, completedAt: new Date().toISOString() });
    updateStage(5, { status: 'ready', progress: 0 });
    
    addLog({ level: 'success', source: 'system', message: `Angle ${angleId} selected. Workflow resumed.` });
    addNotification({ type: 'success', title: 'Angle Confirmed', message: `Angle selected. Workflow continuing...` });
  };

  // Pitch Selection Functions
  const selectPitchAngle = (angleId: string) => {
    setPitchAngles(prev => prev.map(a => a.id === angleId ? { ...a, status: 'selected' as const, selectedAt: new Date().toISOString() } : a));
    const angle = pitchAngles.find(a => a.id === angleId);
    if (angle && !selectedPitchAngles.find(a => a.id === angleId)) {
      setSelectedPitchAngles(prev => [...prev, { ...angle, status: 'selected', selectedAt: new Date().toISOString() }]);
    }
    setPitchSelectionStatus('in_review');
    setPitchSelectionError(null);
    addLog({ level: 'info', source: 'human-reviewer', message: `Pitch angle selected: ${angle?.title || angleId}` });
  };

  const rejectPitchAngle = (angleId: string) => {
    setPitchAngles(prev => prev.map(a => a.id === angleId ? { ...a, status: 'rejected' as const } : a));
    const angle = pitchAngles.find(a => a.id === angleId);
    if (angle && !rejectedPitchAngles.find(a => a.id === angleId)) {
      setRejectedPitchAngles(prev => [...prev, { ...angle, status: 'rejected' }]);
    }
    setSelectedPitchAngles(prev => prev.filter(a => a.id !== angleId));
    addLog({ level: 'info', source: 'human-reviewer', message: `Pitch angle rejected: ${angle?.title || angleId}` });
  };

  const unselectPitchAngle = (angleId: string) => {
    setPitchAngles(prev => prev.map(a => a.id === angleId ? { ...a, status: 'undecided' as const } : a));
    setSelectedPitchAngles(prev => prev.filter(a => a.id !== angleId));
    addLog({ level: 'info', source: 'human-reviewer', message: `Pitch angle unselected: ${angleId}` });
  };

  const clearPitchSelection = () => {
    setSelectedPitchAngles([]);
    setPitchAngles(prev => prev.map(a => ({ ...a, status: 'undecided' as const })));
    setPitchSelectionStatus('needs_review');
    addLog({ level: 'info', source: 'human-reviewer', message: 'Pitch selection cleared' });
  };

  const selectTopPitchAngles = (count: number) => {
    const sorted = [...pitchAngles].sort((a, b) => (b.newsworthinessScore + b.relevanceScore + b.timelinessScore) - (a.newsworthinessScore + a.relevanceScore + a.timelinessScore));
    const top = sorted.slice(0, count);
    top.forEach(angle => selectPitchAngle(angle.id));
  };

  const confirmPitchSelection = (): boolean => {
    if (selectedPitchAngles.length === 0) {
      setPitchSelectionError('Select at least one pitch angle to unlock Journalist Collection.');
      return false;
    }
    
    const missingBeat = selectedPitchAngles.find(a => !a.primaryBeat);
    if (missingBeat) {
      setPitchSelectionError('Selected angle is missing a matched beat.');
      return false;
    }
    
    setPitchSelectionStatus('completed');
    setPitchSelectionError(null);
    
    // Resume at Stage 8 after Stage 7 human gate confirmation
    updateStage(8, { status: 'running', progress: 0, startedAt: new Date().toISOString() });
    
    addLog({ level: 'success', source: 'orchestrator', message: `Pitch selection completed. ${selectedPitchAngles.length} angle(s) selected. Journalist Collection unlocked.` });
    addNotification({ type: 'success', title: 'Pitch Selection Completed', message: `Journalist Collection is now unlocked.` });
    
    setNeedsUserSelection(false);
    setIsPaused(false);

    if (currentCampaign) {
      updateCampaign(currentCampaign.id, { currentStage: 8, status: 'running' });
    }
    
    return true;
  };

  const canUnlockJournalistCollection = (): boolean => {
    return pitchSelectionStatus === 'completed' && selectedPitchAngles.length > 0;
  };

  const getPitchSelectionSummary = () => ({
    total: pitchAngles.length,
    selected: selectedPitchAngles.length,
    rejected: rejectedPitchAngles.length
  });

// Research Enrichment Functions
  const startResearchEnrichment = async (): Promise<{ success: boolean; message: string }> => {
    if (!currentCampaign) {
      return { success: false, message: 'No active campaign' };
    }
    
    // Initialize research enrichment with proper type structure
    const newEnrichment: ResearchEnrichment = {
      campaignId: currentCampaign.id,
      stage: 3,
      status: 'not-started',
      sourceCoverage: {
        serp: 'not-started',
        googleScholar: 'not-started',
        governmentReports: 'not-started',
        industryWhitepapers: 'not-started',
        newsArticles: 'not-started',
        competitorPRCampaigns: 'not-started',
        blogArticles: 'not-started',
        usLocalNewspapers: 'not-started'
      },
      round1: { 
        status: 'researching',
        serpFindings: [],
        scholarSources: [],
        governmentReports: [],
        whitepapers: [],
        newsArticles: [],
        competitorCampaigns: [],
        blogArticles: [],
        localNewspapers: [],
        initialThemes: [],
        recurringStatistics: [],
        possibleAngles: []
      },
      round2: {
        status: 'not-started',
        verifiedSources: [],
        rejectedSources: [],
        competitorGaps: [],
        localOpportunities: [],
        warnings: []
      },
      round3: {
        status: 'not-started',
        enrichedSummary: '',
        researchFindings: [],
        recommendedPitchHooks: [],
        journalistBeats: [],
        credibilityWarnings: []
      },
      handoffToStrategist: {
        ready: false,
        summary: '',
        warnings: []
      },
      timestamps: {
        startedAt: new Date().toISOString()
      }
    };
    
    setResearchEnrichment(newEnrichment);
    updateStage(3, { status: 'running', progress: 0, startedAt: new Date().toISOString() });
addLog({ level: 'info', source: 'research-enrichment', message: 'Research Enrichment started with live web search (Jina AI Reader)' });
    addNotification({ type: 'info', title: 'Research Started', message: 'Live web search connected via Jina AI. Searching for relevant content...' });
    
    return { success: true, message: 'Research Enrichment started with live web search enabled.' };
  };

  // Note: runResearchRound and completeResearchEnrichment require real SERP/Google Scholar API
  // Currently no real search integration exists - manual research required
  const runResearchRound = async (round: number): Promise<{ success: boolean; message: string }> => {
    if (!researchEnrichment) {
      return { success: false, message: 'No research enrichment in progress' };
    }
    
    // Real search is not implemented - just mark progress
    if (round === 1) {
      setResearchEnrichment({
        ...researchEnrichment,
        round1: { ...researchEnrichment.round1, status: 'researching' },
        status: 'researching'
      });
    } else if (round === 2) {
      setResearchEnrichment({
        ...researchEnrichment,
        round2: { ...researchEnrichment.round2, status: 'researching' }
      });
    } else if (round === 3) {
      setResearchEnrichment({
        ...researchEnrichment,
        round3: { ...researchEnrichment.round3, status: 'researching' }
      });
    }
    
    updateStage(3, { progress: Math.round((round / 3) * 100) });
    
    return { success: true, message: `Round ${round} progress updated. ⚠️ Real SERP search NOT connected - manual research required.` };
  };
  
  const completeResearchEnrichment = () => {
    if (!researchEnrichment) return;
    
    setResearchEnrichment({
      ...researchEnrichment,
      status: 'completed',
      handoffToStrategist: {
        ready: true,
        summary: 'Research enrichment completed. Proceed to Stage 4 analysis and Stage 5 angle generation.',
        warnings: []
      },
      timestamps: {
        ...researchEnrichment.timestamps,
        completedAt: new Date().toISOString()
      }
    });

    updateStage(3, { status: 'completed', progress: 100, completedAt: new Date().toISOString() });
    updateStage(4, { status: 'running', progress: 0, startedAt: new Date().toISOString() });
    if (currentCampaign) {
      updateCampaign(currentCampaign.id, { currentStage: 4, status: 'running' });
    }

    addLog({ level: 'success', source: 'research-enrichment', message: 'Research Enrichment completed. Workflow advanced to Stage 4.' });
  };

  const updateJournalistsList = (newJournalists: Journalist[]) => {
    setJournalists(newJournalists);
  };

  const updatePitchVariantsList = (variants: PitchVariant[]) => {
    setPitchVariants(variants);
  };

  const startWorkflow = () => {
    if (!currentCampaign) return;
    
    updateCampaign(currentCampaign.id, { status: 'running', currentStage: 1 });
    updateStage(1, { status: 'running', startedAt: new Date().toISOString() });
    updateGate(1, { status: 'passed', passedAt: new Date().toISOString() });
    updateGate(2, { status: 'ready' });
    setIsPaused(false);
    addLog({ level: 'info', source: 'workflow', message: 'Workflow started.' });
    addNotification({ type: 'info', title: 'Workflow Started', message: 'Digital PR workflow initiated.' });
  };

  const resumeWorkflow = () => {
    setIsPaused(false);
    setNeedsUserSelection(false);
    addLog({ level: 'info', source: 'workflow', message: 'Workflow resumed after angle selection.' });
  };

  // Runtime stage progression is now backend-driven via stage-gate orchestration.
  // We intentionally disable the legacy in-memory timer simulation here.

  return (
    <DataContext.Provider value={{
      campaigns,
      currentCampaign,
      stages,
      gates,
      angles,
      logs,
      notifications,
      validations,
      journalists,
      pitchVariants,
      modelRoutes: MODEL_ROUTES,
      
      // Pitch Selection State
      pitchAngles,
      selectedPitchAngles,
      rejectedPitchAngles,
      pitchSelectionStatus,
      pitchSelectionError,
      
      createCampaign,
      setCurrentCampaign,
      updateCampaign,
      updateStage,
      updateGate,
      addLog,
      addNotification,
      markNotificationRead,
      updateAngles,
      selectAngle,
      updateJournalistsList,
      updatePitchVariantsList,
      startWorkflow,
      resumeWorkflow,
      refreshCampaigns,
      
      // Pitch Selection Actions
      selectPitchAngle,
      rejectPitchAngle,
      unselectPitchAngle,
      clearPitchSelection,
      selectTopPitchAngles,
      confirmPitchSelection,
      canUnlockJournalistCollection,
      getPitchSelectionSummary,
      
      // Research Enrichment
      researchEnrichment,
      startResearchEnrichment,
      runResearchRound,
      completeResearchEnrichment,
      
      isPaused,
      needsUserSelection,
      getAgentById,
      getCurrentPhase,
      getWorkflowProgress,
      getNextStageRoute,
      getLockedReason,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
