/**
 * =============================================================================
 * Model-Aware Campaign Status Dashboard
 * =============================================================================
 * 
 * Shows comprehensive campaign status including:
 * - Stage timeline with model usage
 * - Fallback events
 * - Validation results
 * - Human approval state
 * - Model usage statistics
 * - Recommended next action
 * 
 * =============================================================================
 */

'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { DashboardProvider, useDashboard } from '@/context/DashboardContext';
import { getModelForStage } from '@/lib/modelRoutingConfig';

function CampaignStatusContent() {
  const { 
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
  } = useDashboard();

  const [campaignInput, setCampaignInput] = useState('');
  const [aiResult, setAiResult] = useState<Record<string, unknown> | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  if (!campaignSlug) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Campaign Status Dashboard</h1>
          <p className="text-gray-400 mb-4">Enter a campaign slug to view its status:</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={campaignInput}
              onChange={(e) => setCampaignInput(e.target.value)}
              placeholder="campaign-slug"
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
            />
            <button
              onClick={() => campaignInput && setCampaignSlug(campaignInput)}
              className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              View
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !status) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="flex items-center justify-center">
          <div className="text-xl">Loading campaign status...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="text-red-400">Error: {error}</div>
        <button onClick={refreshStatus} className="mt-4 px-4 py-2 bg-gray-700 rounded">
          Retry
        </button>
      </div>
    );
  }

  const getStatusColor = (workflowStatus: string) => {
    switch (workflowStatus) {
      case 'ready_to_send': return 'bg-green-600';
      case 'completed': return 'bg-blue-600';
      case 'running': return 'bg-yellow-600';
      case 'waiting_for_human_approval': return 'bg-orange-600';
      case 'failed':
      case 'validation_failed': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getStageStatusColor = (stageStatus: string) => {
    switch (stageStatus) {
      case 'passed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'running': return 'bg-yellow-500';
      case 'waiting_approval': return 'bg-orange-500';
      case 'needs_revision': return 'bg-purple-500';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Campaign Status: {campaignSlug}</h1>
          <p className="text-gray-400">Current Stage: {status?.currentStage}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className={`px-4 py-2 rounded-lg ${getStatusColor(status?.workflowStatus || 'not_started')}`}>
            {status?.workflowStatus?.replace(/_/g, ' ').toUpperCase()}
          </span>
          <button
            onClick={refreshStatus}
            className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Campaign Overview */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-gray-400 text-sm">Stages Completed</div>
          <div className="text-2xl font-bold">{status?.stagesCompleted || 0} / 16</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-gray-400 text-sm">Validation Status</div>
          <div className={`text-xl font-bold ${status?.validationStatus === 'passed' ? 'text-green-400' : status?.validationStatus === 'failed' ? 'text-red-400' : 'text-gray-400'}`}>
            {status?.validationStatus?.toUpperCase() || 'NOT RUN'}
          </div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-gray-400 text-sm">Fallback Events</div>
          <div className="text-2xl font-bold text-orange-400">{status?.fallbackEvents?.length || 0}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-gray-400 text-sm">Ready to Send</div>
          <div className={`text-2xl font-bold ${status?.finalReadiness ? 'text-green-400' : 'text-gray-400'}`}>
            {status?.finalReadiness ? 'YES' : 'NO'}
          </div>
        </div>
      </div>

      {/* Stage Timeline */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-bold mb-4">Stage Timeline</h2>
        <div className="flex gap-1 overflow-x-auto pb-2">
          {status?.stages?.map((stage, idx) => (
            <div key={idx} className="flex flex-col items-center min-w-[100px]">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStageStatusColor(stage.status)}`}>
                {idx + 1}
              </div>
              <div className="text-xs mt-1 text-center">{stage.name}</div>
              <div className="text-xs text-gray-400">{stage.status}</div>
              {stage.modelUsed && (
                <div className="text-xs text-blue-400 mt-1">{stage.modelUsed}</div>
              )}
              {stage.fallbackUsed && (
                <div className="text-xs text-orange-400">Fallback</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Model Usage */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Model Usage Panel */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-lg font-bold mb-4">Model Usage</h2>
          {status?.modelUsage && Object.entries(status.modelUsage).map(([model, usage]) => (
            <div key={model} className="flex justify-between items-center py-2 border-b border-gray-700">
              <div>
                <div className="font-medium">{model}</div>
                <div className="text-xs text-gray-400">Primary: {getModelForStage(model.includes('S1') ? 'S1_CAMPAIGN_INTAKE' : 'S2_DATA_EXTRACTION')}</div>
              </div>
              <div className="text-right">
                <div className="text-sm">Calls: {usage.calls}</div>
                <div className="text-xs text-orange-400">Fallbacks: {usage.fallbackUsed}</div>
                <div className="text-xs text-red-400">Failures: {usage.failures}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Fallback Events Panel */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-lg font-bold mb-4">Fallback Events</h2>
          {status?.fallbackEvents?.length === 0 ? (
            <div className="text-gray-400">No fallback events</div>
          ) : (
            status?.fallbackEvents?.map((event, idx) => (
              <div key={idx} className="py-2 border-b border-gray-700">
                <div className="text-sm font-medium">{event.stage}</div>
                <div className="text-xs text-gray-400">
                  {event.primaryModel} → {event.fallbackModel}
                </div>
                <div className="text-xs text-orange-400">{event.reason}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Human Approval Panel */}
      {(status?.workflowStatus === 'waiting_for_human_approval' || status?.humanApproval?.status !== 'none') && (
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
            Human Approval (S7)
          </h2>
          
          <div className="mb-4">
            <div className="text-sm text-gray-400">Status: {status?.humanApproval?.status?.toUpperCase()}</div>
            {status?.humanApproval?.selectedAngle && (
              <div className="text-green-400">Selected: {status.humanApproval.selectedAngle}</div>
            )}
            {status?.humanApproval?.notes && (
              <div className="text-gray-400">Notes: {status.humanApproval.notes}</div>
            )}
          </div>

          {status?.humanApproval?.status === 'waiting' && (
            <div className="flex gap-4">
              <button
                onClick={() => approveAngle('selected', status?.selectedAngle || 'Recommended Angle')}
                className="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
              >
                Approve Selected Angle
              </button>
              <button
                onClick={() => rejectAngle('Rejected by human')}
                className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
              >
                Reject
              </button>
              <button
                onClick={() => requestRevision('Please revise')}
                className="px-4 py-2 bg-yellow-600 rounded hover:bg-yellow-700"
              >
                Request Revision
              </button>
            </div>
          )}

          {status?.humanApproval?.status === 'approved' && (
            <div className="flex gap-4">
              <button
                onClick={() => resumeWorkflow('S8_JOURNALIST_COLLECTION')}
                className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
              >
                Resume to S8 - Journalist Collection
              </button>
            </div>
          )}
        </div>
      )}

      {/* Output Files */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-bold mb-4">Output Files</h2>
        <div className="grid grid-cols-4 gap-2">
          {status?.outputFiles?.map((file, idx) => (
            <div 
              key={idx} 
              className={`p-2 rounded ${file.exists ? 'bg-green-900' : 'bg-gray-700'}`}
            >
              <div className="text-xs truncate">{file.name}</div>
              <div className={`text-xs ${file.exists ? 'text-green-400' : 'text-gray-500'}`}>
                {file.exists ? '✓' : '✗'}
              </div>
              {file.validationStatus && (
                <div className={`text-xs ${file.validationStatus === 'passed' ? 'text-green-400' : 'text-red-400'}`}>
                  {file.validationStatus}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AI Actions */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h2 className="text-lg font-bold mb-4">Dashboard AI Actions</h2>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={async () => {
              setAiLoading(true);
              const result = await runDashboardAI('recommended_next_action', {
                currentStage: status?.currentStage || 'S1',
                auditLog: [],
                errors: status?.errors || [],
                validationReport: status?.validationStatus,
                humanApprovalStatus: status?.humanApproval?.status || 'none',
                outputFiles: status?.outputFiles?.filter(f => f.exists).map(f => f.name) || []
              }) as Record<string, unknown>;
              setAiResult(result);
              setAiLoading(false);
            }}
            disabled={aiLoading}
            className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {aiLoading ? 'Loading...' : 'Get Next Action'}
          </button>

          <button
            onClick={async () => {
              setAiLoading(true);
              const result = await runDashboardAI('stage_failure_explanation', {
                failedStage: status?.errors?.[0]?.stage || 'S1',
                errorMessage: status?.errors?.[0]?.error || 'No errors',
                modelUsed: status?.stages?.[0]?.modelUsed || 'unknown'
              }) as Record<string, unknown>;
              setAiResult(result);
              setAiLoading(false);
            }}
            disabled={aiLoading}
            className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-700 disabled:opacity-50"
          >
            Explain Errors
          </button>

          <button
            onClick={async () => {
              setAiLoading(true);
              const result = await runDashboardAI('fallback_event_analysis', {
                stage: status?.fallbackEvents?.[0]?.stage || 'S1',
                primaryModel: status?.fallbackEvents?.[0]?.primaryModel || 'unknown',
                fallbackModel: status?.fallbackEvents?.[0]?.fallbackModel || 'unknown',
                reason: status?.fallbackEvents?.[0]?.reason || 'No reason'
              }) as Record<string, unknown>;
              setAiResult(result);
              setAiLoading(false);
            }}
            disabled={aiLoading || !status?.fallbackEvents?.length}
            className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-700 disabled:opacity-50"
          >
            Analyze Fallbacks
          </button>
        </div>

        {aiResult !== undefined && aiResult !== null && (
          <div className="mt-4 p-4 bg-gray-700 rounded">
            <pre className="text-xs overflow-auto">
              {JSON.stringify(aiResult, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Errors */}
      {status?.errors && status.errors.length > 0 && (
        <div className="bg-gray-800 p-4 rounded-lg mt-6">
          <h2 className="text-lg font-bold mb-4 text-red-400">Errors</h2>
          {status.errors.map((err, idx) => (
            <div key={idx} className="py-2 border-b border-gray-700">
              <div className="text-red-400">{err.stage}: {err.error}</div>
              <div className="text-xs text-gray-400">{new Date(err.timestamp).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CampaignStatusPage() {
  return (
    <DashboardProvider>
      <CampaignStatusContent />
    </DashboardProvider>
  );
}

export default CampaignStatusPage;