'use client';

import React, { useState, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { TOTAL_WORKFLOW_STAGES, getPhaseByStage } from '@/types';
import { 
  CheckCircle, XCircle, AlertTriangle, Search, Filter, 
  ChevronRight, ChevronDown, ChevronUp, Star, Zap,
  BarChart3, GitCompare, Keyboard, X, BookOpen, ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import StageHeader from '@/components/StageHeader';

interface AngleWithMeta {
  id: string;
  title: string;
  summary: string;
  primaryBeat: string;
  secondaryBeat: string;
  beatPriority: string;
  outletType: string;
  newsworthinessScore: number;
  relevanceScore: number;
  timelinessScore: number;
  outreachDifficulty: number;
  whyItWorks: string;
  subjectLine: string;
  status: 'selected' | 'rejected' | 'undecided';
  category?: string;
  score?: number;
  whyNewsworthy?: string;
}

export default function PitchSelectionPage() {
  const { 
    currentCampaign, 
    pitchAngles, 
    selectedPitchAngles, 
    rejectedPitchAngles,
    selectPitchAngle,
    rejectPitchAngle,
    unselectPitchAngle,
    confirmPitchSelection,
    getPitchSelectionSummary,
    updateStage,
    angles: stage4Angles,
    stages,
    addLog,
    addNotification
  } = useData();

  const [filter, setFilter] = useState<'all' | 'selected' | 'rejected' | 'undecided'>('all');
  const [sortField, setSortField] = useState<'score' | 'newsworthiness' | 'timeliness'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedForCompare, setSelectedForCompare] = useState<Set<string>>(new Set());
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  const currentPhase = getPhaseByStage(7);
  const stats = getPitchSelectionSummary();
  const angleStage = stages.find(s => s.stageNumber === 5);
  const beatMatchStage = stages.find(s => s.stageNumber === 6);

  // Get angles from workflow - prioritized: pitchAngles (S5) > stage4Angles (S4) > empty
  const angles: AngleWithMeta[] = useMemo(() => {
    // Priority 1: pitchAngles from Beat Matching (Stage 5)
    if (pitchAngles.length > 0) {
      return pitchAngles.map((a, i) => ({
        id: a.id || `pitch-angle-${i}`,
        campaignId: a.campaignId || currentCampaign?.id || '',
        title: a.title || a.subjectLine || '',
        summary: a.summary || a.whyItWorks || a.whyNewsworthy || '',
        primaryBeat: a.primaryBeat || a.targetBeats?.[0] || '',
        secondaryBeat: a.secondaryBeat || a.targetBeats?.[1] || '',
        beatPriority: a.beatPriority || (a.score && a.score >= 9 ? 'High' : a.score && a.score >= 7 ? 'Medium' : 'Low') || 'Medium',
        outletType: a.outletType || 'News',
        newsworthinessScore: (a.newsworthinessScore || a.score || 80),
        relevanceScore: (a.relevanceScore || a.score || 80),
        timelinessScore: (a.timelinessScore || a.score || 80),
        outreachDifficulty: a.outreachDifficulty || 5,
        whyItWorks: a.whyItWorks || a.whyNewsworthy || '',
        subjectLine: a.subjectLine || a.title || '',
        status: a.status as 'selected' | 'rejected' | 'undecided',
        category: a.category,
        score: a.score,
        whyNewsworthy: a.whyNewsworthy
      }));
    }
    
    // Priority 2: Stage 4 angles
    if (stage4Angles.length > 0) {
      return stage4Angles.map((a, i) => ({
        id: `angle-${i + 1}`,
        campaignId: currentCampaign?.id || '',
        title: a.headline,
        summary: a.whyNewsworthy || 'AI-generated pitch angle',
        primaryBeat: a.journalistBeats?.[0] || a.category || 'General',
        secondaryBeat: a.journalistBeats?.[1] || '',
        beatPriority: a.score >= 9 ? 'High' : a.score >= 7 ? 'Medium' : 'Low',
        outletType: a.publicationType || 'News',
        newsworthinessScore: (a.newsworthiness || a.score || 8) * 10,
        relevanceScore: (a.score || 8) * 10,
        timelinessScore: (a.timeliness || 8) * 10,
        outreachDifficulty: a.outreachDifficulty || 5,
        whyItWorks: a.whyNewsworthy || '',
        subjectLine: a.headline || '',
        status: a.status === 'selected' ? 'selected' as const : 
                a.status === 'rejected' ? 'rejected' as const : 'undecided' as const,
        category: a.category,
        score: a.score,
        whyNewsworthy: a.whyNewsworthy
      }));
    }
    
    // No angles - return empty (will show warning)
    return [];
  }, [pitchAngles, stage4Angles, currentCampaign?.id]);

  const hasGroundedAngles = angles.length > 0 && (pitchAngles.length > 0 || stage4Angles.length > 0);

  // Filter and sort angles
  const filteredAngles = angles
    .filter(a => {
      if (filter !== 'all' && a.status !== filter) return false;
      if (searchQuery && !a.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !a.category?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      const aVal = sortField === 'score' ? (a.score || 0) : 
                   sortField === 'newsworthiness' ? a.newsworthinessScore / 10 : 
                   a.timelinessScore / 10;
      const bVal = sortField === 'score' ? (b.score || 0) : 
                   sortField === 'newsworthiness' ? b.newsworthinessScore / 10 : 
                   b.timelinessScore / 10;
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

  const handleSelectAll = () => {
    filteredAngles.forEach(a => {
      if (a.status !== 'selected') selectPitchAngle(a.id);
    });
  };

  const handleRejectAll = () => {
    filteredAngles.forEach(a => {
      if (a.status !== 'rejected') rejectPitchAngle(a.id);
    });
  };

  const handleClearAll = () => {
    angles.forEach(a => {
      if (a.status === 'selected') unselectPitchAngle(a.id);
      if (a.status === 'rejected') unselectPitchAngle(a.id);
    });
  };

  const handleSelectTopByScore = (count: number) => {
    const sorted = [...angles].sort((a, b) => (b.score || 0) - (a.score || 0));
    sorted.slice(0, count).forEach(angle => {
      if (angle.status !== 'selected') selectPitchAngle(angle.id);
    });
  };

  const handleConfirmSelection = async () => {
    const success = confirmPitchSelection();
    if (!success || !currentCampaign?.id) {
      return;
    }
    setIsSubmittingApproval(true);
    try {
      const selectedPrimary = selectedPitchAngles[0];
      await fetch(`/api/campaigns/${currentCampaign.id}/human-approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          selectedAngleId: selectedPrimary?.id || null,
          selectedAngleTitle: selectedPrimary?.title || selectedPrimary?.subjectLine || 'Selected pitch direction',
          notes: `Approved ${selectedPitchAngles.length} pitch angle(s) via Pitch Selection`,
        }),
      });

      await fetch(`/api/campaigns/${currentCampaign.id}/auto-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'post_pitch' }),
      });

      updateStage(7, { status: 'completed', progress: 100, completedAt: new Date().toISOString() });
      addLog({ level: 'success', source: 'pitch-selection', message: `Pitch selection completed with ${selectedPitchAngles.length} angles selected. Auto-run resumed.` });
      addNotification({ type: 'success', title: 'Pitch Selection Complete', message: `${selectedPitchAngles.length} angle(s) selected. Workflow resumed automatically.` });
    } catch (error) {
      addLog({ level: 'error', source: 'pitch-selection', message: `Failed to submit pitch approval: ${String(error)}` });
      addNotification({ type: 'error', title: 'Pitch Selection Error', message: 'Failed to resume workflow automatically. Please retry.' });
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  if (!currentCampaign) {
    return (
      <div className="max-w-full mx-auto p-4">
        <StageHeader stageNumber={7} stageName="Pitch Selection" agentId="human-reviewer" />
        <div className="flex flex-col items-center justify-center py-16">
          <AlertTriangle size={48} className="text-warning mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Active Campaign</h3>
          <p className="text-[#94A3B8]">Create a campaign first to access pitch selection.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto p-4">
      <StageHeader stageNumber={7} stageName="Pitch Selection" agentId="human-reviewer" />
      
      {/* Data Grounding Warning */}
      {!hasGroundedAngles && angles.length === 0 && (
        <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-error mt-0.5" size={20} />
            <div>
              <h4 className="text-sm font-semibold text-error">No Grounded Pitch Angles Available</h4>
              <p className="text-sm text-red-200 mt-1">
                Stage 7 requires angles from Stage 5 (Angle Generation) and Stage 6 (Beat Matching). 
                No angles have been generated from your campaign data yet.
              </p>
              <div className="mt-3 flex gap-2">
                <Link href="/angles" className="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary rounded text-sm">
                  Go to Angle Generation
                </Link>
                <Link href="/workflow" className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm">
                  Go to Workflow
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Source Info */}
      {hasGroundedAngles && (
        <div className="mb-4 p-3 bg-success/10 border border-success/30 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-success">
            <CheckCircle size={16} />
            <span>Showing {angles.length} pitch angles from workflow (Stage 4-5)</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/workflow" className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
              <ChevronRight className="rotate-180" size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm font-medium">
                  Stage 7 of {TOTAL_WORKFLOW_STAGES}
                </span>
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                  {currentPhase}
                </span>
                <span className="px-3 py-1 bg-amber-600/20 text-amber-400 rounded-full text-sm font-medium">
                  🔒 Human Gate
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white mt-2">Pitch Selection</h1>
              <p className="text-slate-400 mt-1">
                Review beat-matched pitch angles and select the strongest ones before journalist collection begins
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search angles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm w-48"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-2 py-2 text-white text-sm"
            >
              <option value="all">All ({stats.total})</option>
              <option value="selected">Selected ({stats.selected})</option>
              <option value="rejected">Rejected ({stats.rejected})</option>
              <option value="undecided">Undecided ({stats.total - stats.selected - stats.rejected})</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowKeyboardShortcuts(true)}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-400 hover:text-white"
            title="Keyboard Shortcuts"
          >
            <Keyboard size={16} />
          </button>
          <button onClick={handleSelectAll} className="px-3 py-2 bg-success/20 hover:bg-success/30 text-success rounded-lg text-sm">
            Select All
          </button>
          <button onClick={handleRejectAll} className="px-3 py-2 bg-error/20 hover:bg-error/30 text-error rounded-lg text-sm">
            Reject All
          </button>
          <button onClick={handleClearAll} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-lg text-sm">
            Clear All
          </button>
        </div>
      </div>

      {/* Quick Selection */}
      <div className="flex items-center gap-3 mb-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
        <Zap size={16} className="text-amber-400" />
        <span className="text-sm text-slate-400">Quick Select:</span>
        <button onClick={() => handleSelectTopByScore(3)} className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded text-xs">
          Top 3
        </button>
        <button onClick={() => handleSelectTopByScore(5)} className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded text-xs">
          Top 5
        </button>
        <button onClick={() => handleSelectTopByScore(10)} className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded text-xs">
          Top 10
        </button>
        <span className="text-xs text-slate-500 ml-auto">
          Showing {filteredAngles.length} of {stats.total} angles
        </span>
      </div>

      {/* Angle Table */}
      <div className="overflow-x-auto bg-slate-800/30 rounded-xl border border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-800/50">
              <th className="text-center p-3 text-slate-400 font-medium w-10">#</th>
              <th className="text-left p-3 text-slate-400 font-medium">Category</th>
              <th className="text-left p-3 text-slate-400 font-medium">Journalist Beats</th>
              <th className="text-left p-3 text-slate-400 font-medium">Pitch Angle</th>
              <th className="text-left p-3 text-slate-400 font-medium">Why Newsworthy</th>
              <th className="text-center p-3 text-slate-400 font-medium">Score</th>
              <th className="text-center p-3 text-slate-400 font-medium">Status</th>
              <th className="text-center p-3 text-slate-400 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredAngles.map((angle, idx) => (
              <React.Fragment key={angle.id}>
                <tr 
                  className={`border-b border-slate-700/50 cursor-pointer ${
                    angle.status === 'selected' ? 'bg-success/10' : 
                    angle.status === 'rejected' ? 'bg-error/10' : 'hover:bg-slate-700/50'
                  }`}
                  onClick={() => setExpandedRow(expandedRow === angle.id ? null : angle.id)}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">{idx + 1}</span>
                      {angle.beatPriority === 'High' && <Star size={12} className="text-amber-400 fill-amber-400" />}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      angle.category === 'Pedestrian Safety' ? 'bg-blue-500/20 text-blue-400' : 'bg-primary/20 text-primary'
                    }`}>
                      {angle.category || 'General'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">{angle.primaryBeat}</span>
                      {angle.secondaryBeat && <span className="px-2 py-1 bg-slate-700 text-slate-400 rounded text-xs">{angle.secondaryBeat}</span>}
                    </div>
                  </td>
                  <td className="p-3 max-w-xs">
                    <p className="text-white line-clamp-2">{angle.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{angle.outletType}</p>
                  </td>
                  <td className="p-3 max-w-xs">
                    <p className="text-slate-400 text-xs line-clamp-2">{angle.whyItWorks || angle.whyNewsworthy}</p>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`font-bold ${
                      (angle.score || 0) >= 9 ? 'text-green-400' : 
                      (angle.score || 0) >= 7 ? 'text-yellow-400' : 'text-slate-400'
                    }`}>
                      {angle.score || Math.round(angle.newsworthinessScore / 10)}/10
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {angle.status === 'selected' ? (
                      <span className="px-2 py-1 bg-success/20 text-success rounded text-xs">Selected</span>
                    ) : angle.status === 'rejected' ? (
                      <span className="px-2 py-1 bg-error/20 text-error rounded text-xs">Rejected</span>
                    ) : (
                      <span className="px-2 py-1 bg-slate-700 text-slate-400 rounded text-xs">Undecided</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {angle.status === 'selected' ? (
                      <button onClick={(e) => { e.stopPropagation(); unselectPitchAngle(angle.id); }} className="px-3 py-1.5 bg-error/20 hover:bg-error/30 text-error rounded-lg text-xs">
                        Unselect
                      </button>
                    ) : angle.status === 'rejected' ? (
                      <button onClick={(e) => { e.stopPropagation(); selectPitchAngle(angle.id); }} className="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-xs">
                        Restore
                      </button>
                    ) : (
                      <div className="flex gap-1 justify-center">
                        <button onClick={(e) => { e.stopPropagation(); selectPitchAngle(angle.id); }} className="px-3 py-1.5 bg-success/20 hover:bg-success/30 text-success rounded-lg text-xs">
                          Select
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); rejectPitchAngle(angle.id); }} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-lg text-xs">
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredAngles.length === 0 && hasGroundedAngles && (
        <div className="text-center py-12">
          <Search size={48} className="text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No angles match your filters</p>
        </div>
      )}

      {/* Fixed Confirm Button */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <button
          onClick={() => setShowConfirmModal(true)}
          disabled={selectedPitchAngles.length === 0}
          className={`px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 shadow-lg ${
            selectedPitchAngles.length > 0 ? 'bg-success hover:bg-success/90 text-white' : 'bg-slate-700 text-slate-400 cursor-not-allowed'
          }`}
        >
          <CheckCircle size={24} />
          {selectedPitchAngles.length > 0 ? `Confirm ${selectedPitchAngles.length} Selected Angle(s)` : 'Select at least one angle to continue'}
        </button>
      </div>

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-lg w-full mx-4 border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-success/20 rounded-lg">
                <CheckCircle className="text-success" size={24} />
              </div>
              <h3 className="text-xl font-bold text-white">Confirm Pitch Selection</h3>
            </div>
            <div className="mb-6 p-4 bg-slate-700/50 rounded-xl">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-success">{selectedPitchAngles.length}</div>
                  <div className="text-xs text-slate-400">Selected</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{stats.total - selectedPitchAngles.length}</div>
                  <div className="text-xs text-slate-400">Unselected</div>
                </div>
              </div>
            </div>
            <p className="text-slate-400 mb-6">
              This will unlock Journalist Collection (Stage 8) and begin the media outreach phase.
            </p>
            <div className="flex gap-4">
              <button onClick={() => setShowConfirmModal(false)} className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl">
                Cancel
              </button>
              <button 
                onClick={async () => { setShowConfirmModal(false); await handleConfirmSelection(); }} 
                disabled={isSubmittingApproval}
                className="flex-1 px-4 py-3 bg-success hover:bg-success/90 disabled:opacity-60 text-white rounded-xl flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} /> Confirm & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showKeyboardShortcuts && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowKeyboardShortcuts(false)}>
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-slate-700" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Keyboard size={24} className="text-amber-400" /> Keyboard Shortcuts
              </h3>
              <button onClick={() => setShowKeyboardShortcuts(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between p-2 bg-slate-700/50 rounded"><span className="text-slate-400">Select Angle</span><kbd className="px-2 py-1 bg-slate-600 rounded text-white text-xs">Enter</kbd></div>
              <div className="flex justify-between p-2 bg-slate-700/50 rounded"><span className="text-slate-400">Reject Angle</span><kbd className="px-2 py-1 bg-slate-600 rounded text-white text-xs">Backspace</kbd></div>
              <div className="flex justify-between p-2 bg-slate-700/50 rounded"><span className="text-slate-400">Expand Details</span><kbd className="px-2 py-1 bg-slate-600 rounded text-white text-xs">Space</kbd></div>
              <div className="flex justify-between p-2 bg-slate-700/50 rounded"><span className="text-slate-400">Search</span><kbd className="px-2 py-1 bg-slate-600 rounded text-white text-xs">/</kbd></div>
              <div className="flex justify-between p-2 bg-slate-700/50 rounded"><span className="text-slate-400">Close Modal</span><kbd className="px-2 py-1 bg-slate-600 rounded text-white text-xs">Esc</kbd></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
