'use client';

import { useEffect, useState } from 'react';
import { apiFetch, DASHBOARD_API_TOKEN_STORAGE_KEY } from '@/lib/clientApi';

export default function SettingsPage() {
  const [tokenInput, setTokenInput] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    const existing = window.localStorage.getItem(DASHBOARD_API_TOKEN_STORAGE_KEY) || '';
    setTokenInput(existing);
  }, []);

  const saveToken = () => {
    setIsSaving(true);
    try {
      const normalized = tokenInput.trim();
      if (normalized) {
        window.localStorage.setItem(DASHBOARD_API_TOKEN_STORAGE_KEY, normalized);
        setStatus('API token saved to this browser.');
      } else {
        window.localStorage.removeItem(DASHBOARD_API_TOKEN_STORAGE_KEY);
        setStatus('API token removed from this browser.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const testAuth = async () => {
    setIsTesting(true);
    setStatus(null);
    try {
      const response = await apiFetch('/api/workflow?campaignId=default', { method: 'GET' });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || payload?.error || 'Auth test failed.');
      }
      setStatus('Auth header test passed.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
        <p className="text-[#94A3B8]">Configure dashboard authentication for protected API routes.</p>
      </div>

      <div className="p-4 bg-[#1E293B] border border-[#334155] rounded-xl space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm font-semibold text-white mb-2">Dashboard API Token</label>
          <input
            type="password"
            value={tokenInput}
            onChange={event => setTokenInput(event.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#0F172A] border border-[#334155] text-white"
            placeholder="Paste token used by DASHBOARD_API_TOKEN"
            autoComplete="off"
          />
          <p className="text-xs text-[#94A3B8] mt-2">
            Stored in browser localStorage key <code>{DASHBOARD_API_TOKEN_STORAGE_KEY}</code>.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={saveToken}
            disabled={isSaving}
            className="px-3 py-2 rounded-lg bg-primary text-white disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Token'}
          </button>
          <button
            type="button"
            onClick={testAuth}
            disabled={isTesting}
            className="px-3 py-2 rounded-lg bg-[#334155] text-white disabled:opacity-50"
          >
            {isTesting ? 'Testing...' : 'Test Auth Header'}
          </button>
        </div>

        {status && <p className="text-sm text-[#94A3B8]">{status}</p>}
      </div>
    </div>
  );
}

