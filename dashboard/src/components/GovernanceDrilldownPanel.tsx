'use client';

import React, { useMemo, useState } from 'react';
import clsx from 'clsx';
import { ChevronDown, ChevronRight, Copy, ExternalLink } from 'lucide-react';

type GovernanceItem = {
  code: string;
  severity: string;
  message: string;
  evidence?: string;
};

type GovernanceStageResult = {
  stage: number;
  filePath: string | null;
  valid: boolean;
  issues: GovernanceItem[];
  warnings: GovernanceItem[];
};

type Props = {
  campaignId?: string;
  hasBlockingIssues: boolean;
  results: GovernanceStageResult[];
  className?: string;
};

function buildArtifactUrl(campaignId: string | undefined, filePath: string | null): string {
  const params = new URLSearchParams();
  if (campaignId) {
    params.set('campaignId', campaignId);
  }
  if (filePath) {
    params.set('file', filePath);
  }
  return `/artifacts${params.toString() ? `?${params.toString()}` : ''}`;
}

function summarize(item: GovernanceItem): string {
  const evidence = item.evidence ? ` | evidence: ${item.evidence}` : '';
  return `[${item.severity}] ${item.code}: ${item.message}${evidence}`;
}

export default function GovernanceDrilldownPanel({
  campaignId,
  hasBlockingIssues,
  results,
  className,
}: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const allRows = useMemo(() => {
    return results.flatMap(result => {
      const issueRows = result.issues.map((item, index) => ({
        key: `s${result.stage}-issue-${index}`,
        type: 'issue' as const,
        stage: result.stage,
        filePath: result.filePath,
        item,
      }));
      const warningRows = result.warnings.map((item, index) => ({
        key: `s${result.stage}-warn-${index}`,
        type: 'warning' as const,
        stage: result.stage,
        filePath: result.filePath,
        item,
      }));
      return [...issueRows, ...warningRows];
    });
  }, [results]);

  const onCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(current => (current === key ? null : current)), 1200);
    } catch {
      setCopiedKey(null);
    }
  };

  return (
    <div className={clsx(
      'border rounded-xl p-4 space-y-3',
      hasBlockingIssues ? 'bg-error/10 border-error/30' : 'bg-success/10 border-success/30',
      className
    )}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Claim & Language Governance</h3>
        <span className={clsx(
          'text-xs px-2 py-1 rounded-full',
          hasBlockingIssues ? 'bg-error/20 text-error' : 'bg-success/20 text-success'
        )}>
          {hasBlockingIssues ? 'Blocking Violations' : 'Passed'}
        </span>
      </div>

      {results.map(result => (
        <div key={`governance-stage-${result.stage}`} className="bg-[#1E293B] border border-[#334155] rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-white font-medium">S{result.stage}</p>
            <div className="flex items-center gap-2">
              <span className={clsx(
                'text-xs px-2 py-0.5 rounded-full',
                result.valid ? 'bg-success/20 text-success' : 'bg-error/20 text-error'
              )}>
                {result.valid ? 'OK' : 'Failed'}
              </span>
              <a
                href={buildArtifactUrl(campaignId, result.filePath)}
                className="text-xs px-2 py-0.5 rounded-full bg-[#273449] text-[#94A3B8] hover:text-white inline-flex items-center gap-1"
                title="Open related file in Artifact Manager"
              >
                <ExternalLink size={12} />
                Open File
              </a>
            </div>
          </div>

          {result.filePath && <p className="text-xs text-[#94A3B8] break-all">{result.filePath}</p>}

          {(result.issues.length === 0 && result.warnings.length === 0) && (
            <p className="text-xs text-success">No violations detected.</p>
          )}
        </div>
      ))}

      {allRows.length > 0 && (
        <div className="space-y-2">
          {allRows.map(row => {
            const isExpanded = Boolean(expanded[row.key]);
            const severityColor = row.type === 'issue' ? 'text-error' : 'text-warning';
            return (
              <div key={row.key} className="bg-[#0F172A] border border-[#334155] rounded-lg p-2">
                <button
                  type="button"
                  onClick={() => setExpanded(prev => ({ ...prev, [row.key]: !prev[row.key] }))}
                  className="w-full flex items-start justify-between gap-2 text-left"
                >
                  <div className="flex items-start gap-2">
                    {isExpanded ? <ChevronDown size={14} className="text-[#94A3B8] mt-0.5" /> : <ChevronRight size={14} className="text-[#94A3B8] mt-0.5" />}
                    <div>
                      <p className={clsx('text-xs font-semibold', severityColor)}>
                        S{row.stage} • {row.item.code} ({row.item.severity})
                      </p>
                      <p className="text-xs text-[#CBD5E1]">{row.item.message}</p>
                    </div>
                  </div>
                  <span className={clsx(
                    'text-[10px] px-1.5 py-0.5 rounded',
                    row.type === 'issue' ? 'bg-error/20 text-error' : 'bg-warning/20 text-warning'
                  )}>
                    {row.type}
                  </span>
                </button>

                {isExpanded && (
                  <div className="mt-2 ml-6 space-y-2">
                    {row.item.evidence && (
                      <pre className="text-xs text-[#94A3B8] bg-[#1E293B] border border-[#334155] rounded p-2 whitespace-pre-wrap break-words">
                        {row.item.evidence}
                      </pre>
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void onCopy(row.key, summarize(row.item))}
                        className="text-xs px-2 py-1 rounded bg-[#273449] text-[#94A3B8] hover:text-white inline-flex items-center gap-1"
                      >
                        <Copy size={12} />
                        {copiedKey === row.key ? 'Copied' : 'Copy'}
                      </button>
                      <a
                        href={buildArtifactUrl(campaignId, row.filePath)}
                        className="text-xs px-2 py-1 rounded bg-[#273449] text-[#94A3B8] hover:text-white inline-flex items-center gap-1"
                      >
                        <ExternalLink size={12} />
                        Open Related File
                      </a>
                    </div>
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

