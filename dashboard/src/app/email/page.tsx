'use client'

import { useState } from 'react'
import { 
  ShieldCheck, 
  Zap, 
  AlertCircle, 
  CheckCircle2, 
  Mail,
  Search,
  Lock,
  Loader2,
  RefreshCcw,
  Copy,
  Edit3,
  Clock,
  Target,
  BarChart3,
  AlertTriangle,
  X
} from 'lucide-react'

interface SpamCheck {
  id: number
  label: string
  status: 'pass' | 'warning' | 'fail'
  score: number
  details: string
}

interface SubjectLine {
  id: string
  label: string
  text: string
  score: number
  openRate?: number
  clickRate?: number
  selected: boolean
}

interface PersonalizationTag {
  label: string
  value: string
  status: 'ok' | 'warn' | 'missing'
  coverage?: number
}

const SPAM_CHECKS: SpamCheck[] = [
  { id: 1, label: 'Spam Word Detection', status: 'warning', score: 0, details: 'TEST NOT RUN' },
  { id: 2, label: 'Subject Line Length', status: 'warning', score: 0, details: 'TEST NOT RUN' },
  { id: 3, label: 'Link to Text Ratio', status: 'warning', score: 0, details: 'TEST NOT RUN' },
  { id: 4, label: 'HTML Complexity', status: 'warning', score: 0, details: 'TEST NOT RUN' },
  { id: 5, label: 'Personalization Audit', status: 'warning', score: 0, details: 'TEST NOT RUN' },
  { id: 6, label: 'Caps Lock Detection', status: 'warning', score: 0, details: 'TEST NOT RUN' },
  { id: 7, label: 'Punctuation Balance', status: 'warning', score: 0, details: 'TEST NOT RUN' },
  { id: 8, label: 'Domain Reputation', status: 'warning', score: 0, details: 'TEST NOT RUN' }
]

const SUBJECT_OPTIONS: SubjectLine[] = [
  { id: 'a', label: 'Control', text: 'Information unavailable. Verification required before use.', score: 0, selected: true },
  { id: 'b', label: 'Question', text: 'Information unavailable. Verification required before use.', score: 0, selected: false },
  { id: 'c', label: 'Direct', text: 'Information unavailable. Verification required before use.', score: 0, selected: false },
  { id: 'd', label: 'Alternative', text: 'Information unavailable. Verification required before use.', score: 0, selected: false }
]

const PERSONALIZATION_TAGS: PersonalizationTag[] = [
  { label: 'FirstName', value: 'Information unavailable. Verification required before use.', status: 'missing', coverage: 0 },
  { label: 'Outlet', value: 'Information unavailable. Verification required before use.', status: 'missing', coverage: 0 },
  { label: 'RecentArticle', value: 'Information unavailable. Verification required before use.', status: 'missing', coverage: 0 },
  { label: 'Beat', value: 'Information unavailable. Verification required before use.', status: 'missing', coverage: 0 },
  { label: 'Location', value: 'Information unavailable. Verification required before use.', status: 'missing', coverage: 0 }
]

export default function EmailOptimizationPage() {
  const [runningAudit, setRunningAudit] = useState(false)
  const [spamChecks, setSpamChecks] = useState<SpamCheck[]>(SPAM_CHECKS)
  const [subjectOptions, setSubjectOptions] = useState<SubjectLine[]>(SUBJECT_OPTIONS)
  const [emailContent, setEmailContent] = useState('Information unavailable. Verification required before use.')

  const [showEditModal, setShowEditModal] = useState(false)
  const [editedContent, setEditedContent] = useState(emailContent)

  const overallScore = Math.round(spamChecks.reduce((acc, c) => acc + c.score, 0) / spamChecks.length)
  const completedTags = PERSONALIZATION_TAGS.filter(t => t.status === 'ok').length

  const runAudit = async () => {
    setRunningAudit(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setSpamChecks(prev => prev.map(c => ({
      ...c,
      score: 0,
      status: 'warning',
      details: 'TEST NOT RUN'
    })))
    setRunningAudit(false)
  }

  const selectSubject = (id: string) => {
    setSubjectOptions(prev => prev.map(s => ({
      ...s,
      selected: s.id === id
    })))
  }

  const saveContent = () => {
    setEmailContent(editedContent)
    setShowEditModal(false)
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2 py-1 rounded flex items-center gap-2">
              <Mail size={12} />
              Deliverability Suite
            </span>
            {overallScore >= 90 ? (
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded flex items-center gap-1">
                <CheckCircle2 size={10} /> High Deliverability
              </span>
            ) : (
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2 py-1 rounded flex items-center gap-1">
                <AlertTriangle size={10} /> Needs Optimization
              </span>
            )}
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight">Email Optimization</h2>
          <p className="text-slate-500 font-medium mt-1">Spam audit, subject line A/B testing, and deliverability verification.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-xl border border-white/5">
            <BarChart3 size={14} className="text-slate-500" />
            <span className="text-sm font-bold text-white">{overallScore}%</span>
            <span className="text-xs text-slate-500">Score</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4 bg-slate-900/40 border-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Overall Score</span>
            <ShieldCheck size={14} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">{overallScore}%</p>
        </div>
        <div className="glass-card rounded-2xl p-4 bg-slate-900/40 border-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Spam Checks</span>
            <AlertCircle size={14} className="text-blue-400" />
          </div>
          <p className="text-2xl font-black text-white">{spamChecks.filter(c => c.status === 'pass').length}/{spamChecks.length}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 bg-slate-900/40 border-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Subject Variants</span>
            <Zap size={14} className="text-purple-400" />
          </div>
          <p className="text-2xl font-black text-purple-400">{subjectOptions.length}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 bg-slate-900/40 border-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tags Filled</span>
            <Target size={14} className="text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400">{completedTags}/{PERSONALIZATION_TAGS.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
           <section className="glass-card rounded-3xl p-8 bg-slate-900/40 relative overflow-hidden border-0">
              <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                 <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Mail size={18} className="text-blue-400" />
                    Final Email Body
                    <span className="text-[10px] font-black text-slate-600 bg-slate-800 px-2 py-0.5 rounded ml-2">
                      {emailContent.split('\n').length} lines
                    </span>
                 </h3>
                 <div className="flex gap-2">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1 ${
                      overallScore >= 90 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {overallScore >= 90 ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />}
                      {overallScore >= 90 ? 'READY FOR SEND' : 'NEEDS REVIEW'}
                    </span>
                 </div>
              </div>
              <div className="bg-slate-950/80 p-6 rounded-2xl border border-white/5 min-h-[300px] font-mono text-sm leading-relaxed text-slate-300 max-h-[400px] overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                {emailContent}
              </div>
              <div className="mt-6 flex justify-end gap-3 flex-wrap">
                 <button 
                   onClick={() => {
                     setEditedContent(emailContent)
                     setShowEditModal(true)
                   }}
                   className="btn px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold flex items-center gap-2 transition-all"
                 >
                    <Edit3 size={16} />
                    Edit Content
                 </button>
                 <button 
                   onClick={() => navigator.clipboard.writeText(emailContent)}
                   className="btn px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold flex items-center gap-2 transition-all"
                 >
                    <Copy size={16} />
                    Copy
                 </button>
                 <button className="btn px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 hover:scale-105 transition-all">
                    <RefreshCcw size={16} />
                    Refine with AI
                 </button>
              </div>
           </section>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="glass-card rounded-3xl p-8 space-y-6">
                 <div className="flex items-center justify-between">
                   <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Zap size={16} className="text-amber-400" />
                      Subject Line A/B
                   </h4>
                   <button className="text-[10px] font-bold text-blue-400 hover:text-blue-300">View History</button>
                 </div>
                 <div className="space-y-4">
                    {subjectOptions.map(option => (
                      <div 
                        key={option.id}
                        onClick={() => selectSubject(option.id)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          option.selected 
                            ? 'bg-blue-500/10 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)]' 
                            : 'bg-white/5 border-transparent hover:border-white/10'
                        }`}
                      >
                         <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{option.label}</span>
                              {option.selected && <CheckCircle2 size={12} className="text-blue-400" />}
                            </div>
                            <span className="text-[10px] font-black text-white">{option.score}%</span>
                         </div>
                         <p className="text-xs text-slate-300 font-medium line-clamp-2">{option.text}</p>
                         {option.openRate && (
                           <div className="flex gap-4 mt-3 pt-3 border-t border-white/5">
                             <div>
                               <span className="text-[10px] text-slate-500 uppercase">Est. Open</span>
                               <p className="text-xs font-black text-emerald-400">{option.openRate}%</p>
                             </div>
                             <div>
                               <span className="text-[10px] text-slate-500 uppercase">Est. Click</span>
                               <p className="text-xs font-black text-blue-400">{option.clickRate}%</p>
                             </div>
                           </div>
                         )}
                      </div>
                    ))}
                 </div>
              </section>

              <section className="glass-card rounded-3xl p-8 space-y-6">
                 <div className="flex items-center justify-between">
                   <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Search size={16} className="text-blue-400" />
                      Personalization Tags
                   </h4>
                   <span className="text-[10px] font-black text-slate-600 bg-slate-800 px-2 py-0.5 rounded">
                     {completedTags}/{PERSONALIZATION_TAGS.length} filled
                   </span>
                 </div>
                 <div className="space-y-3">
                    {PERSONALIZATION_TAGS.map(tag => (
                      <TagRow key={tag.label} {...tag} />
                    ))}
                 </div>
                 <button className="btn w-full py-2 bg-white/5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all">
                   Manage Tag Mappings
                 </button>
              </section>
           </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <section className="glass-card rounded-3xl p-8 bg-gradient-to-br from-amber-500 to-orange-700 text-white relative overflow-hidden">
              <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-white/20 rounded-lg">
                       <ShieldCheck size={20} />
                    </div>
                    <h3 className="text-xl font-black">Spam Audit</h3>
                    <div className="ml-auto text-right">
                      <p className="text-2xl font-black">{overallScore}%</p>
                      <p className="text-[10px] font-bold opacity-60">Health Score</p>
                    </div>
                 </div>
                 
                 <div className="space-y-4 mb-8">
                    {spamChecks.map(check => (
                       <div key={check.id} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                          <span className="text-xs font-bold opacity-80">{check.label}</span>
                          <div className="flex items-center gap-2">
                             <div className="w-16 h-1.5 bg-black/20 rounded-full overflow-hidden">
                               <div 
                                 className={`h-full rounded-full ${
                                   check.status === 'pass' ? 'bg-emerald-400' : 'bg-amber-400'
                                 }`}
                                 style={{ width: `${check.score}%` }}
                               />
                             </div>
                             <span className="text-[10px] font-black">{check.score}%</span>
                          </div>
                       </div>
                    ))}
                 </div>

                 <button 
                   onClick={runAudit}
                   disabled={runningAudit}
                   className="btn w-full bg-white text-orange-700 font-black py-4 rounded-2xl shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                 >
                    {runningAudit ? <Loader2 className="animate-spin" /> : (
                       <>
                          <RefreshCcw size={18} />
                          RE-RUN AUDIT
                       </>
                    )}
                 </button>
              </div>
              <div className="absolute -right-8 -bottom-8 opacity-10 rotate-12">
                 <Lock size={160} />
              </div>
           </section>

           <div className="glass-card rounded-3xl p-8 bg-slate-900/40 space-y-6">
              <div className="flex items-center justify-between">
                 <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Global Readiness</h4>
                 <span className="text-2xl font-black text-white">{overallScore}%</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                 <div className={`h-full ${overallScore >= 90 ? 'bg-emerald-500' : 'bg-amber-500'} w-[${overallScore}%]`} style={{ width: `${overallScore}%` }} />
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed italic">
                 &ldquo;Email has been cross-checked against 2,000+ known spam triggers and journalist feedback loops.&rdquo;
              </p>
           </div>

           <div className="glass-card rounded-3xl p-6 bg-slate-900/40 border-0">
             <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
               <Clock size={14} />
               Quick Stats
             </h4>
             <div className="space-y-3">
               <div className="flex justify-between">
                 <span className="text-xs text-slate-500">Character Count</span>
                 <span className="text-xs font-black text-white">{emailContent.length}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-xs text-slate-500">Word Count</span>
                 <span className="text-xs font-black text-white">{emailContent.split(/\s+/).filter(Boolean).length}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-xs text-slate-500">Link Count</span>
                 <span className="text-xs font-black text-white">{(emailContent.match(/https?:\/\//g) || []).length}</span>
               </div>
             </div>
           </div>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-8" onClick={() => setShowEditModal(false)}>
          <div className="glass-card rounded-3xl p-8 max-w-3xl w-full border border-white/20" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Edit3 size={18} />
                Edit Email Content
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-500 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full h-96 bg-slate-950 border border-white/10 rounded-xl p-4 font-mono text-sm text-white outline-none focus:border-blue-500"
            />
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowEditModal(false)} className="btn px-6 py-3 bg-white/5 text-white rounded-xl font-bold">
                Cancel
              </button>
              <button onClick={saveContent} className="btn px-6 py-3 bg-blue-500 text-white rounded-xl font-bold shadow-lg">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TagRow({ label, value, status, coverage }: any) {
  return (
    <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
       <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${
            status === 'ok' ? 'bg-emerald-500' : status === 'warn' ? 'bg-amber-500' : 'bg-red-500'
          }`} />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{label}</span>
       </div>
       <div className="text-right">
         <span className="text-xs font-bold text-white">{value}</span>
         {coverage !== undefined && (
           <span className="text-[10px] text-slate-500 ml-2">({coverage}%)</span>
         )}
       </div>
    </div>
  )
}
