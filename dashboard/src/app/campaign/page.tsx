'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '@/context/DataContext';
import { Save, Play, Upload, FileText, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

const targetBeatsOptions = [
  'Consumer affairs', 'Business', 'Technology', 'Health', 'Education',
  'Legal', 'Politics', 'Sports', 'Entertainment', 'Science',
  'Environment', 'Finance', 'Real Estate', 'Transportation', 'Food'
];

const tones = ['Professional', 'Casual', 'Authoritative', 'Friendly', 'Urgent', 'Data-driven'];

export default function CampaignPage() {
  const router = useRouter();
  const { createCampaign, startWorkflow, addLog, addNotification } = useData();
  const [formData, setFormData] = useState({
    name: '',
    clientName: '',
    studyTitle: '',
    topic: '',
    targetRegion: 'United States',
    targetBeats: [] as string[],
    goal: '',
    tone: 'Professional',
    notes: '',
    briefContent: '',
    studyContent: '',
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleBeatToggle = (beat: string) => {
    setFormData(prev => ({
      ...prev,
      targetBeats: prev.targetBeats.includes(beat)
        ? prev.targetBeats.filter(b => b !== beat)
        : [...prev.targetBeats, beat]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('saving');

    const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-');
    
    createCampaign({
      ...formData,
      slug,
    });

    addLog({ level: 'info', source: 'campaign', message: `Campaign "${formData.name}" created. Brief and study saved.` });
    addNotification({ type: 'success', title: 'Campaign Created', message: `"${formData.name}" is ready to start.` });

    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1000);
  };

  const handleStartWorkflow = () => {
    if (!formData.name) return;
    startWorkflow();
    router.push('/workflow');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Campaign Input</h1>
          <p className="text-[#94A3B8] mt-1">Create a new Digital PR campaign with brief and study content.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={clsx(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm',
            saveStatus === 'saved' && 'bg-success/20 text-success',
            saveStatus === 'saving' && 'bg-warning/20 text-warning',
            saveStatus === 'idle' && 'bg-[#273449] text-[#94A3B8]'
          )}>
            {saveStatus === 'saved' && <><Save size={14} /> Saved</>}
            {saveStatus === 'saving' && <><span className="animate-spin">↻</span> Saving...</>}
            {saveStatus === 'idle' && <><FileText size={14} /> Ready</>}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Campaign Details */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Campaign Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1.5">Campaign Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="input"
                placeholder="e.g., March Motorcycle Safety Laws"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1.5">Client/Brand Name *</label>
              <input
                type="text"
                value={formData.clientName}
                onChange={e => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                className="input"
                placeholder="e.g., Premier Law Group"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1.5">Study Title</label>
              <input
                type="text"
                value={formData.studyTitle}
                onChange={e => setFormData(prev => ({ ...prev, studyTitle: e.target.value }))}
                className="input"
                placeholder="e.g., US Traffic Safety Data 2024-2025"
              />
            </div>
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1.5">Campaign Topic *</label>
              <input
                type="text"
                value={formData.topic}
                onChange={e => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                className="input"
                placeholder="e.g., Motorcycle safety laws and data risks"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1.5">Target Region</label>
              <input
                type="text"
                value={formData.targetRegion}
                onChange={e => setFormData(prev => ({ ...prev, targetRegion: e.target.value }))}
                className="input"
                placeholder="e.g., United States, Texas, National"
              />
            </div>
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1.5">Tone</label>
              <select
                value={formData.tone}
                onChange={e => setFormData(prev => ({ ...prev, tone: e.target.value }))}
                className="input"
              >
                {tones.map(tone => (
                  <option key={tone} value={tone}>{tone}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-[#94A3B8] mb-1.5">Campaign Goal</label>
              <input
                type="text"
                value={formData.goal}
                onChange={e => setFormData(prev => ({ ...prev, goal: e.target.value }))}
                className="input"
                placeholder="e.g., Generate coverage in top-tier national outlets"
              />
            </div>
          </div>
        </div>

        {/* Target Beats */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Target Journalist Beats</h2>
          <p className="text-sm text-[#94A3B8] mb-4">Select at least 3 beats for your campaign.</p>
          <div className="flex flex-wrap gap-2">
            {targetBeatsOptions.map(beat => (
              <button
                key={beat}
                type="button"
                onClick={() => handleBeatToggle(beat)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                  formData.targetBeats.includes(beat)
                    ? 'bg-primary text-white'
                    : 'bg-[#273449] text-[#94A3B8] hover:bg-[#334155]'
                )}
              >
                {beat}
              </button>
            ))}
          </div>
          {formData.targetBeats.length < 3 && (
            <div className="flex items-center gap-2 mt-3 text-warning text-sm">
              <AlertCircle size={14} />
              Select at least 3 beats ({formData.targetBeats.length}/3 selected)
            </div>
          )}
        </div>

        {/* Brief Editor */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Campaign Brief</h2>
            <button type="button" className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-white">
              <Upload size={14} />
              Upload File
            </button>
          </div>
          <textarea
            value={formData.briefContent}
            onChange={e => setFormData(prev => ({ ...prev, briefContent: e.target.value }))}
            className="textarea h-48"
            placeholder="Enter your campaign brief here... Include key messages, target audiences, deadlines, and any specific requirements."
          />
          <p className="text-xs text-[#64748B] mt-2">
            This will be saved as: pitch-jobs/{formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'new-campaign'}/00-brief.md
          </p>
        </div>

        {/* Raw Study Copy */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Raw Study Copy</h2>
            <button type="button" className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-white">
              <Upload size={14} />
              Upload File
            </button>
          </div>
          <textarea
            value={formData.studyContent}
            onChange={e => setFormData(prev => ({ ...prev, studyContent: e.target.value }))}
            className="textarea h-64"
            placeholder="Paste or write your raw study copy here... Include all data, statistics, methodology notes, and source information."
          />
          <p className="text-xs text-[#64748B] mt-2">
            This will be saved as: pitch-jobs/{formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'new-campaign'}/source-files/study-inputs/raw-study-copy.md
          </p>
        </div>

        {/* Notes */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Additional Notes</h2>
          <textarea
            value={formData.notes}
            onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="textarea h-24"
            placeholder="Any additional context, off-limits topics, specific journalists to avoid, etc."
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="px-4 py-2 rounded-lg border border-[#334155] text-[#94A3B8] hover:bg-[#273449]"
          >
            Cancel
          </button>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={!formData.name || !formData.clientName || formData.targetBeats.length < 3}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#273449] text-white font-medium hover:bg-[#334155] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              Save Campaign
            </button>
            <button
              type="button"
              onClick={handleStartWorkflow}
              disabled={!formData.name || saveStatus !== 'saved'}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play size={18} />
              Start Workflow
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
