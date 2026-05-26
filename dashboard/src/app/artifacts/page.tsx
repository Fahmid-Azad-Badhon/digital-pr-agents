'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useData } from '@/context/DataContext';
import { STAGES } from '@/types';
import { 
  FileText, Download, Eye, Edit, Search, 
  Filter, FolderOpen, File, CheckCircle, Clock, X
} from 'lucide-react';
import clsx from 'clsx';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/clientApi';

type ArtifactItem = {
  name: string;
  stage: number;
  status: 'completed' | 'pending' | 'running';
  size: string;
  sizeBytes: number;
  updatedAt: string;
};

function ArtifactsPageContent() {
  const { currentCampaign } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [artifacts, setArtifacts] = useState<ArtifactItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [previewExtension, setPreviewExtension] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [copiedPreview, setCopiedPreview] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const searchParams = useSearchParams();
  const requestedFile = searchParams.get('file') || '';
  const campaignFromQuery = searchParams.get('campaignId');
  const effectiveCampaignId = campaignFromQuery || currentCampaign?.id || '';

  const requestedFileName = useMemo(() => {
    if (!requestedFile) {
      return '';
    }
    const normalized = requestedFile.replace(/\\/g, '/');
    const parts = normalized.split('/');
    return parts[parts.length - 1] || normalized;
  }, [requestedFile]);

  useEffect(() => {
    if (requestedFileName) {
      setSearchTerm(requestedFileName);
      setViewMode('list');
    }
  }, [requestedFileName]);

  useEffect(() => {
    const loadArtifacts = async () => {
      if (!effectiveCampaignId) {
        setArtifacts([]);
        setLoadError(null);
        return;
      }

      setIsLoading(true);
      setLoadError(null);
      try {
        const res = await apiFetch(`/api/artifacts?campaignId=${encodeURIComponent(effectiveCampaignId)}`, {
          method: 'GET',
          cache: 'no-store',
        });
        const payload = await res.json();

        if (!res.ok || !payload.success) {
          throw new Error(payload?.message || payload?.error || 'Failed to load artifacts.');
        }

        const nextArtifacts = Array.isArray(payload?.data?.artifacts) ? payload.data.artifacts as ArtifactItem[] : [];
        setArtifacts(nextArtifacts);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : String(error));
        setArtifacts([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadArtifacts();
  }, [effectiveCampaignId]);

  const filteredArtifacts = artifacts.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = stageFilter === 'all' || a.stage === parseInt(stageFilter);
    return matchesSearch && matchesStage;
  });

  const previewableExtensions = useMemo(() => new Set(['.md', '.json', '.csv']), []);

  const openPreview = async (fileName: string) => {
    if (!effectiveCampaignId) {
      return;
    }

    setPreviewFile(fileName);
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewContent('');
    setPreviewExtension('');
    try {
      const res = await apiFetch(
        `/api/artifacts/content?campaignId=${encodeURIComponent(effectiveCampaignId)}&file=${encodeURIComponent(fileName)}`,
        { method: 'GET', cache: 'no-store' }
      );
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload?.message || payload?.error || 'Failed to load file preview.');
      }
      setPreviewContent(typeof payload?.data?.content === 'string' ? payload.data.content : '');
      setPreviewExtension(typeof payload?.data?.extension === 'string' ? payload.data.extension : '');
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : String(error));
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setPreviewFile(null);
    setPreviewContent('');
    setPreviewError(null);
    setPreviewExtension('');
    setPreviewLoading(false);
    setCopiedPreview(false);
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    window.setTimeout(() => {
      setToast(current => (current?.message === message ? null : current));
    }, 1600);
  };

  const handleCopyPreview = async () => {
    if (!previewContent || previewLoading || previewError) {
      return;
    }
    try {
      await navigator.clipboard.writeText(previewContent);
      setCopiedPreview(true);
      showToast('success', 'Preview content copied.');
      window.setTimeout(() => setCopiedPreview(false), 1200);
    } catch {
      setCopiedPreview(false);
      showToast('error', 'Could not copy preview content.');
    }
  };

  const handleDownloadPreview = () => {
    if (!previewFile || !previewContent || previewLoading || previewError) {
      return;
    }
    const blob = new Blob([previewContent], { type: 'text/plain;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = previewFile.split('/').pop() || 'artifact-preview.txt';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(objectUrl);
    showToast('success', 'Preview file downloaded.');
  };

  if (!effectiveCampaignId) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <FolderOpen size={48} className="text-[#64748B] mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No Active Campaign</h3>
        <p className="text-[#94A3B8]">Create a campaign first to view artifacts.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Artifact Manager</h1>
          <p className="text-[#94A3B8] mt-1">
            Track all workflow files and documents for {currentCampaign?.name || effectiveCampaignId}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={clsx(
              'p-2 rounded-lg',
              viewMode === 'grid' ? 'bg-primary text-white' : 'bg-[#273449] text-[#94A3B8]'
            )}
          >
            <FolderOpen size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={clsx(
              'p-2 rounded-lg',
              viewMode === 'list' ? 'bg-primary text-white' : 'bg-[#273449] text-[#94A3B8]'
            )}
          >
            <FileText size={18} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-[#1E293B] border border-[#334155] rounded-xl p-4">
        <div className="flex items-center gap-2 flex-1">
          <Search size={16} className="text-[#64748B]" />
          <input
            type="text"
            placeholder="Search artifacts..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-transparent text-white placeholder-[#64748B] outline-none flex-1"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-[#64748B]" />
          <select
            value={stageFilter}
            onChange={e => setStageFilter(e.target.value)}
            className="bg-[#273449] border border-[#334155] rounded-lg px-3 py-1.5 text-sm text-white"
          >
            <option value="all">All Stages</option>
            {STAGES.map(stage => (
              <option key={stage.number} value={stage.number}>
                Stage {stage.number}: {stage.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {requestedFile && (
        <div className="bg-info/10 border border-info/30 rounded-xl p-3">
          <p className="text-xs text-info">
            Focused file from governance panel: <span className="font-semibold break-all">{requestedFile}</span>
          </p>
        </div>
      )}

      {loadError && (
        <div className="bg-error/10 border border-error/30 rounded-xl p-3">
          <p className="text-xs text-error">{loadError}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-primary" />
            <span className="text-sm text-[#94A3B8]">Total Files</span>
          </div>
          <p className="text-2xl font-bold text-white mt-1">{artifacts.length}</p>
        </div>
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-success" />
            <span className="text-sm text-[#94A3B8]">Completed</span>
          </div>
          <p className="text-2xl font-bold text-success mt-1">
            {artifacts.filter(a => a.status === 'completed').length}
          </p>
        </div>
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-warning" />
            <span className="text-sm text-[#94A3B8]">Pending/Running</span>
          </div>
          <p className="text-2xl font-bold text-warning mt-1">
            {artifacts.filter(a => a.status === 'pending' || a.status === 'running').length}
          </p>
        </div>
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
          <div className="flex items-center gap-2">
            <File size={16} className="text-[#64748B]" />
            <span className="text-sm text-[#94A3B8]">Total Size</span>
          </div>
          <p className="text-2xl font-bold text-white mt-1">
            {(artifacts.reduce((acc, a) => acc + a.sizeBytes, 0) / (1024 * 1024)).toFixed(2)} MB
          </p>
        </div>
      </div>

      {/* Artifacts List/Grid */}
      {isLoading && (
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 text-sm text-[#94A3B8]">
          Loading filesystem artifacts...
        </div>
      )}

      {!isLoading && filteredArtifacts.length === 0 && (
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 text-sm text-[#94A3B8]">
          No artifacts found for this campaign/filter.
        </div>
      )}

      {viewMode === 'list' ? (
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#273449]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase">File</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase">Stage</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase">Size</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase">Updated</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredArtifacts.map(artifact => (
                <tr
                  key={artifact.name}
                  className={clsx(
                    'border-b border-[#334155] hover:bg-[#273449]',
                    requestedFileName && artifact.name.toLowerCase().includes(requestedFileName.toLowerCase()) && 'bg-info/10'
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-[#64748B]" />
                      <span className="text-sm text-white">{artifact.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-[#94A3B8]">Stage {artifact.stage}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx(
                      'inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full',
                      artifact.status === 'completed' && 'bg-success/20 text-success',
                      artifact.status === 'pending' && 'bg-warning/20 text-warning',
                      artifact.status === 'running' && 'bg-info/20 text-info'
                    )}>
                      {artifact.status === 'completed' && <CheckCircle size={12} />}
                      {(artifact.status === 'pending' || artifact.status === 'running') && <Clock size={12} />}
                      {artifact.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-[#94A3B8]">{artifact.size}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-[#64748B]">{artifact.updatedAt}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => void openPreview(artifact.name)}
                        className="p-1.5 rounded hover:bg-[#334155] text-[#64748B] hover:text-white"
                        title="View file content"
                      >
                        <Eye size={14} />
                      </button>
                      <button className="p-1.5 rounded hover:bg-[#334155] text-[#64748B] hover:text-white">
                        <Download size={14} />
                      </button>
                      <button className="p-1.5 rounded hover:bg-[#334155] text-[#64748B] hover:text-white">
                        <Edit size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredArtifacts.map(artifact => (
            <div
              key={artifact.name}
              className={clsx(
                'bg-[#1E293B] border rounded-xl p-4 hover:border-primary/50 transition-all cursor-pointer',
                artifact.status === 'completed' ? 'border-success/30' : 'border-[#334155]',
                requestedFileName && artifact.name.toLowerCase().includes(requestedFileName.toLowerCase()) && 'ring-1 ring-info/50'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <FileText size={20} className={artifact.status === 'completed' ? 'text-success' : 'text-[#64748B]'} />
                <span className={clsx(
                  'text-xs px-2 py-0.5 rounded-full',
                  artifact.status === 'completed' && 'bg-success/20 text-success',
                  artifact.status === 'pending' && 'bg-warning/20 text-warning',
                  artifact.status === 'running' && 'bg-info/20 text-info'
                )}>
                  {artifact.status}
                </span>
              </div>
              <p className="text-sm text-white line-clamp-2">{artifact.name.split('/').pop()}</p>
              <p className="text-xs text-[#64748B] mt-1">Stage {artifact.stage} • {artifact.size}</p>
            </div>
          ))}
        </div>
      )}

      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl max-h-[85vh] bg-[#0F172A] border border-[#334155] rounded-xl flex flex-col">
            <div className="px-4 py-3 border-b border-[#334155] flex items-center justify-between">
              <div>
                <p className="text-sm text-white font-semibold">File Preview</p>
                <p className="text-xs text-[#94A3B8] break-all">{previewFile}</p>
              </div>
              <button
                onClick={closePreview}
                className="p-2 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#273449]"
                aria-label="Close preview"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-4 py-3 border-b border-[#334155]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs px-2 py-1 rounded bg-[#273449] text-[#94A3B8]">
                  {previewExtension || 'loading'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleCopyPreview()}
                    disabled={previewLoading || Boolean(previewError) || !previewContent}
                    className="text-xs px-2 py-1 rounded bg-[#273449] text-[#94A3B8] hover:text-white disabled:opacity-50"
                  >
                    {copiedPreview ? 'Copied' : 'Copy file content'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadPreview}
                    disabled={previewLoading || Boolean(previewError) || !previewContent}
                    className="text-xs px-2 py-1 rounded bg-[#273449] text-[#94A3B8] hover:text-white disabled:opacity-50"
                  >
                    Download previewed file
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4 overflow-auto">
              {previewLoading && (
                <p className="text-sm text-[#94A3B8]">Loading preview...</p>
              )}
              {!previewLoading && previewError && (
                <p className="text-sm text-error">{previewError}</p>
              )}
              {!previewLoading && !previewError && (
                <pre className="text-xs leading-5 text-[#CBD5E1] whitespace-pre-wrap break-words">
                  {previewContent}
                </pre>
              )}
            </div>
            <div className="px-4 py-3 border-t border-[#334155] flex items-center justify-between">
              <p className="text-xs text-[#64748B]">
                Supported formats: .md, .json, .csv
              </p>
              {previewFile && !previewableExtensions.has(previewFile.slice(previewFile.lastIndexOf('.')).toLowerCase()) && (
                <p className="text-xs text-warning">This file type may not be previewable.</p>
              )}
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className="fixed right-4 bottom-4 z-[60]">
          <div
            className={clsx(
              'px-3 py-2 rounded-lg text-xs border shadow-lg',
              toast.type === 'success'
                ? 'bg-success/20 border-success/40 text-success'
                : 'bg-error/20 border-error/40 text-error'
            )}
          >
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ArtifactsPage() {
  return (
    <Suspense fallback={
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 text-sm text-[#94A3B8]">
        Loading artifacts...
      </div>
    }>
      <ArtifactsPageContent />
    </Suspense>
  );
}
