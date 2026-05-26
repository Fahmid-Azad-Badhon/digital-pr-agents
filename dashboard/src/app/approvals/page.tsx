'use client';

import { useEffect, useState } from 'react';
import { useData } from '@/context/DataContext';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

type PendingHumanQuestion = {
  questionId: string;
  threadId: string;
  askedByStageId: string;
  priority: string;
  blocking: boolean;
  question: string;
  answerType: string;
  createdAt: string;
};

export default function ApprovalsPage() {
  const { currentCampaign } = useData();
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<PendingHumanQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<Record<string, { type: 'success' | 'error'; message: string }>>({});

  const load = async () => {
    if (!currentCampaign?.id) {
      setQuestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${currentCampaign.id}/questions?action=human`, { cache: 'no-store' });
      const payload = await res.json();
      const items = payload?.data?.humanQuestions || payload?.humanQuestions || [];
      setQuestions(Array.isArray(items) ? items : []);
    } catch {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [currentCampaign?.id]);

  const submitAnswer = async (question: PendingHumanQuestion) => {
    if (!currentCampaign?.id) {
      return;
    }
    const value = (answers[question.questionId] || '').trim();
    if (!value) {
      setFeedback(prev => ({
        ...prev,
        [question.questionId]: { type: 'error', message: 'Please provide an answer before submitting.' },
      }));
      return;
    }

    setSubmitting(prev => ({ ...prev, [question.questionId]: true }));
    setFeedback(prev => ({ ...prev, [question.questionId]: { type: 'success', message: 'Submitting answer...' } }));
    try {
      const res = await fetch(
        `/api/campaigns/${encodeURIComponent(currentCampaign.id)}/questions?action=answer&questionId=${encodeURIComponent(question.questionId)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId: question.questionId,
            threadId: question.threadId,
            status: 'answered',
            answeringStageId: 'HUMAN',
            answeringAgent: 'HUMAN',
            directAnswer: value,
            structuredAnswer: { resolution: value },
            evidenceFilesUsed: [],
            sourceIdsUsed: [],
            claimIdsUsed: [],
            confidence: 'high',
            limitations: [],
            canOriginalAgentContinue: true,
            recommendedNextStage: null,
            requiresHumanReview: false,
            notes: ['Answered from Approval Queue UI'],
          }),
        }
      );
      const payload = await res.json().catch(() => null);
      if (!res.ok || payload?.success === false) {
        const message = payload?.message || 'Failed to submit answer.';
        setFeedback(prev => ({ ...prev, [question.questionId]: { type: 'error', message } }));
        return;
      }
      setFeedback(prev => ({
        ...prev,
        [question.questionId]: { type: 'success', message: 'Answer saved. Workflow auto-resume triggered.' },
      }));
      setAnswers(prev => ({ ...prev, [question.questionId]: '' }));
      await load();
    } catch {
      setFeedback(prev => ({
        ...prev,
        [question.questionId]: { type: 'error', message: 'Network error while submitting answer.' },
      }));
    } finally {
      setSubmitting(prev => ({ ...prev, [question.questionId]: false }));
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-4">Approval Queue</h1>
      <p className="text-[#94A3B8]">Agent blockers and human-required decisions appear here with exact required input.</p>
      <div className="mt-8 p-4 bg-[#1E293B] border border-[#334155] rounded-xl">
        {loading ? (
          <p className="text-[#64748B] text-center py-8">Loading Approval Queue...</p>
        ) : questions.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <CheckCircle2 className="mx-auto text-emerald-400" size={22} />
            <p className="text-[#64748B]">No pending approvals</p>
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map(item => (
              <div key={item.questionId} className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="text-amber-400" size={16} />
                    <span className="text-sm font-semibold text-amber-300">{item.priority.toUpperCase()} • {item.askedByStageId}</span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(item.createdAt).toLocaleString()}
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-200">{item.question}</p>
                <p className="mt-2 text-xs text-slate-400">Question ID: {item.questionId}</p>
                <div className="mt-3 space-y-2">
                  <textarea
                    value={answers[item.questionId] || ''}
                    onChange={event => setAnswers(prev => ({ ...prev, [item.questionId]: event.target.value }))}
                    placeholder="Provide the exact missing input to unblock this stage..."
                    className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
                    rows={3}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => void submitAnswer(item)}
                      disabled={Boolean(submitting[item.questionId])}
                      className="rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting[item.questionId] ? 'Submitting...' : 'Submit & Resume Workflow'}
                    </button>
                    {feedback[item.questionId] && (
                      <span
                        className={`text-xs ${feedback[item.questionId].type === 'success' ? 'text-emerald-300' : 'text-red-300'}`}
                      >
                        {feedback[item.questionId].message}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
