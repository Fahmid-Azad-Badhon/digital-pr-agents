'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/clientApi';

type ObservabilityPayload = {
  generatedAt: string;
  totals: {
    campaigns: number;
    runtimeEvents: number;
    logEntries: number;
    campaignsWithCircuitState: number;
  };
  logLevels: Record<string, number>;
  runtimeStatuses: Record<string, number>;
  runtimeStageDistribution: Record<string, number>;
  latestRuntimeEvent: string | null;
};

export default function ObservabilityPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ObservabilityPayload | null>(null);

  useEffect(() => {
    let canceled = false;
    const load = async () => {
      setLoading(true);
      try {
        const response = await apiFetch('/api/observability/summary', { cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.message || payload?.error || 'Failed to load observability summary');
        }
        if (!canceled) {
          setData(payload.data as ObservabilityPayload);
          setError(null);
        }
      } catch (loadError) {
        if (!canceled) {
          setError(loadError instanceof Error ? loadError.message : String(loadError));
          setData(null);
        }
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    void load();
    const timer = setInterval(load, 15000);
    return () => {
      canceled = true;
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Observability</h1>
        <p className="text-[#94A3B8] mt-1">
          Runtime event and system log summary for production hardening visibility.
        </p>
      </div>

      {loading && (
        <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-4 text-[#94A3B8] text-sm">
          Loading observability summary...
        </div>
      )}

      {error && (
        <div className="bg-error/10 border border-error/30 rounded-lg p-4 text-error text-sm">
          {error}
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Campaigns" value={data.totals.campaigns} />
            <MetricCard label="Runtime Events" value={data.totals.runtimeEvents} />
            <MetricCard label="System Logs" value={data.totals.logEntries} />
            <MetricCard label="Circuit States" value={data.totals.campaignsWithCircuitState} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MapCard title="Log Levels" map={data.logLevels} />
            <MapCard title="Runtime Statuses" map={data.runtimeStatuses} />
          </div>

          <MapCard title="Runtime Stage Distribution" map={data.runtimeStageDistribution} />

          <div className="text-xs text-[#64748B]">
            Latest runtime event: {data.latestRuntimeEvent ? new Date(data.latestRuntimeEvent).toLocaleString() : 'N/A'} •
            Generated: {new Date(data.generatedAt).toLocaleString()}
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-4">
      <p className="text-xs text-[#94A3B8]">{label}</p>
      <p className="text-xl font-semibold text-white mt-1">{value}</p>
    </div>
  );
}

function MapCard({ title, map }: { title: string; map: Record<string, number> }) {
  const entries = Object.entries(map || {}).sort((a, b) => b[1] - a[1]);
  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-4">
      <h3 className="text-white font-semibold mb-3">{title}</h3>
      {entries.length === 0 ? (
        <p className="text-sm text-[#94A3B8]">No data.</p>
      ) : (
        <div className="space-y-2">
          {entries.map(([key, value]) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="text-[#CBD5E1]">{key}</span>
              <span className="text-[#94A3B8]">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

