'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Sparkles, 
  ChevronRight, 
  Copy, 
  RotateCcw, 
  CheckCircle2, 
  Zap, 
  MessageSquare,
  PenTool,
  BrainCircuit,
  Eye,
  Loader2,
  Archive,
  FileText,
  Target,
  Clock,
  BarChart3,
  X
} from 'lucide-react'

interface Variant {
  id: string
  name: string
  icon: string
  desc: string
  tone: 'formal' | 'casual' | 'urgent' | 'story' | 'question'
  wordCount: number
  score: number
}

interface QualityMetrics {
  newsworthiness: number
  humanTone: number
  personalization: number
  readability: number
  actionability: number
}

const VARIANTS: Variant[] = [
  { id: '08a', name: 'Straight News', icon: '📰', desc: 'Direct, factual, and data-heavy approach.', tone: 'formal', wordCount: 0, score: 0 },
  { id: '08b', name: 'Short & Punchy', icon: '⚡', desc: 'Minimalist approach for busy editors.', tone: 'casual', wordCount: 0, score: 0 },
  { id: '08c', name: 'The Storyteller', icon: '✍️', desc: 'Narrative-driven approach with human impact.', tone: 'story', wordCount: 0, score: 0 },
  { id: '08d', name: 'Expert Q&A', icon: '🎙️', desc: 'Format focused on expert commentary.', tone: 'formal', wordCount: 0, score: 0 },
  { id: '08e', name: 'Local', icon: '📍', desc: 'Regionally targeted version.', tone: 'casual', wordCount: 0, score: 0 }
]

const MISSING_INFO = 'Information unavailable. Verification required before use.'

const INITIAL_CONTENT = `# Pitch Draft

Status: MANUAL ACTION REQUIRED

${MISSING_INFO}`

function unavailableDraft(variant: Variant): string {
  return `# ${variant.id} - ${variant.name}

Status: MANUAL ACTION REQUIRED

Selected angle: ${MISSING_INFO}
Selected journalist: ${MISSING_INFO}
Recent coverage: ${MISSING_INFO}

Draft body: ${MISSING_INFO}`
}

export default function PitchDraftingPage() {
  const [selectedVariant, setSelectedVariant] = useState<Variant>(VARIANTS[0])
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState(INITIAL_CONTENT)
  const [contentHistory, setContentHistory] = useState<string[]>([INITIAL_CONTENT])
  const [showHistory, setShowHistory] = useState(false)
  const [isSaved, setIsSaved] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics>({
    newsworthiness: 0,
    humanTone: 0,
    personalization: 0,
    readability: 0,
    actionability: 0
  })

  const generateContent = useCallback((variant: Variant) => {
    setLoading(true)
    setRegenerating(true)
    
    setTimeout(() => {
      const newContent = unavailableDraft(variant)
      setContent(newContent)
      setContentHistory(prev => [newContent, ...prev.slice(0, 9)])
      setIsSaved(true)
      setLoading(false)
      setRegenerating(false)
      
      setQualityMetrics({
        newsworthiness: 0,
        humanTone: 0,
        personalization: 0,
        readability: 0,
        actionability: 0
      })
    }, 800)
  }, [])

  useEffect(() => {
    generateContent(selectedVariant)
  }, [selectedVariant, selectedVariant.id, generateContent])

  const handleRegenerate = () => {
    generateContent(selectedVariant)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
  }

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    setIsSaved(false)
  }

  const restoreFromHistory = (index: number) => {
    const historyContent = contentHistory[index]
    setContent(historyContent)
    setShowHistory(false)
  }

  const averageScore = Math.round(
    (qualityMetrics.newsworthiness + qualityMetrics.humanTone + qualityMetrics.personalization + 
     qualityMetrics.readability + qualityMetrics.actionability) / 5 * 10
  ) / 10

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest bg-purple-500/10 px-2 py-1 rounded flex items-center gap-2">
              <PenTool size={12} />
              Creative Engine
            </span>
            {!isSaved && (
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2 py-1 rounded flex items-center gap-1">
                <Clock size={10} className="animate-pulse" /> Unsaved
              </span>
            )}
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight">Pitch Drafting</h2>
          <p className="text-slate-500 font-medium mt-1">Multi-variant AI copy generation tailored to specific journalist beats.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-xl border border-white/5">
            <BarChart3 size={14} className="text-purple-400" />
            <span className="text-sm font-bold text-white">{averageScore}</span>
            <span className="text-xs text-slate-500">/10</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4 bg-slate-900/40 border-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Newsworthiness</span>
            <Target size={14} className="text-blue-400" />
          </div>
          <p className="text-2xl font-black text-blue-400">{qualityMetrics.newsworthiness}/10</p>
        </div>
        <div className="glass-card rounded-2xl p-4 bg-slate-900/40 border-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Human Tone</span>
            <MessageSquare size={14} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">{qualityMetrics.humanTone}/10</p>
        </div>
        <div className="glass-card rounded-2xl p-4 bg-slate-900/40 border-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Personalization</span>
            <Sparkles size={14} className="text-purple-400" />
          </div>
          <p className="text-2xl font-black text-purple-400">{qualityMetrics.personalization}/10</p>
        </div>
        <div className="glass-card rounded-2xl p-4 bg-slate-900/40 border-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Readability</span>
            <FileText size={14} className="text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400">{qualityMetrics.readability}/10</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-4">
           <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
             <BrainCircuit size={16} className="text-purple-400" />
             Select Variant
             <span className="text-[10px] font-black text-slate-600 bg-slate-800 px-2 py-0.5 rounded ml-2">
               {VARIANTS.length}
             </span>
           </h3>
           <div className="space-y-3">
              {VARIANTS.map(v => (
                 <div 
                   key={v.id}
                   onClick={() => setSelectedVariant(v)}
                   className={`p-4 rounded-2xl border-2 transition-all cursor-pointer group relative overflow-hidden ${
                     selectedVariant.id === v.id 
                       ? 'bg-purple-500/10 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.15)]' 
                       : 'bg-white/5 border-transparent hover:border-white/10'
                   }`}
                 >
                    <div className="flex items-center gap-4 relative z-10">
                       <div className="text-2xl">{v.icon}</div>
                       <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-white text-sm">{v.name}</h4>
                            {selectedVariant.id === v.id && (
                              <CheckCircle2 size={14} className="text-purple-400" />
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium truncate">{v.desc}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[10px] font-black text-slate-600 uppercase">{v.wordCount} words</span>
                            <span className="text-[10px] font-black text-emerald-400">{v.score}%</span>
                          </div>
                       </div>
                       <ChevronRight size={16} className={selectedVariant.id === v.id ? 'text-purple-400' : 'text-slate-700'} />
                    </div>
                    {selectedVariant.id === v.id && (
                       <div className="absolute -right-2 -bottom-2 opacity-5 scale-150">
                          <Sparkles size={60} className="text-purple-400" />
                       </div>
                    )}
                 </div>
              ))}
           </div>

           <div className="glass-card rounded-3xl p-6 bg-slate-900/40 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Draft Quality Score</h4>
                <span className="text-lg font-black text-white">{averageScore}/10</span>
              </div>
              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Newsworthiness</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${qualityMetrics.newsworthiness * 10}%` }} />
                      </div>
                      <span className="text-xs font-black text-blue-400">{qualityMetrics.newsworthiness}</span>
                    </div>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Human Tone</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${qualityMetrics.humanTone * 10}%` }} />
                      </div>
                      <span className="text-xs font-black text-emerald-400">{qualityMetrics.humanTone}</span>
                    </div>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Personalization</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${qualityMetrics.personalization * 10}%` }} />
                      </div>
                      <span className="text-xs font-black text-purple-400">{qualityMetrics.personalization}</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="lg:col-span-8">
           <div className="glass-card rounded-3xl overflow-hidden flex flex-col h-[750px] border-0 shadow-2xl">
              <div className="bg-slate-900/80 p-6 flex justify-between items-center border-b border-white/5 flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                        <PenTool size={16} />
                     </div>
                     <div>
                        <h3 className="text-lg font-black text-white">{selectedVariant.name} Editor</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Variant ID: {selectedVariant.id} • {selectedVariant.tone}</p>
                     </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                     <button 
                       onClick={handleRegenerate}
                       disabled={regenerating}
                       className="btn px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all flex items-center gap-2 text-xs font-bold disabled:opacity-50"
                     >
                        <RotateCcw size={14} className={regenerating ? 'animate-spin' : ''} />
                        Regenerate
                     </button>
                     <button 
                       onClick={() => setShowHistory(true)}
                       className="btn px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all flex items-center gap-2 text-xs font-bold"
                     >
                        <Archive size={14} />
                        History
                     </button>
                     <button 
                       onClick={handleCopy}
                       className="btn px-4 py-2 bg-purple-500 text-white rounded-xl font-bold shadow-lg shadow-purple-500/20 flex items-center gap-2 text-xs hover:scale-105 transition-all"
                     >
                        <Copy size={14} />
                        Copy Pitch
                     </button>
                  </div>
               </div>

               <div className="flex-1 relative">
                  {loading || regenerating ? (
                     <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex flex-col items-center justify-center z-20 gap-4">
                        <div className="relative">
                           <BrainCircuit size={48} className="text-purple-500 animate-pulse" />
                           <div className="absolute -top-1 -right-1">
                              <Loader2 size={16} className="text-white animate-spin" />
                           </div>
                        </div>
                        <p className="text-sm font-bold text-white tracking-widest uppercase animate-pulse">Drafting Creative Copy...</p>
                     </div>
                  ) : null}
                  <textarea 
                    className="w-full h-full bg-[#0d1117] p-10 font-mono text-base leading-relaxed text-slate-300 outline-none focus:ring-2 focus:ring-purple-500/20 transition-all custom-scrollbar resize-none"
                    value={content}
                    onChange={(e) => handleContentChange(e.target.value)}
                  />
               </div>

               <div className="bg-slate-950 p-4 border-t border-white/5 flex justify-between items-center px-8 flex-wrap gap-4">
                  <div className="flex gap-6 flex-wrap">
                     <div className="flex items-center gap-2">
                        <MessageSquare size={14} className="text-slate-600" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{content.split(/\s+/).filter(Boolean).length} Words</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <Eye size={14} className="text-slate-600" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Ready for Audit</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <Zap size={14} className="text-slate-600" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{content.length} chars</span>
                     </div>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                     <CheckCircle2 size={14} />
                     Auto-Saved to job-folder
                  </div>
               </div>
            </div>
        </div>
      </div>

      {showHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-8" onClick={() => setShowHistory(false)}>
          <div className="glass-card rounded-3xl p-8 max-w-lg w-full border border-white/20" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Archive size={18} />
                Version History
              </h3>
              <button onClick={() => setShowHistory(false)} className="text-slate-500 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {contentHistory.map((c, i) => (
                <div 
                  key={i}
                  onClick={() => restoreFromHistory(i)}
                  className="p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white">Version {contentHistory.length - i}</span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {i === 0 ? 'Current' : `${i + 1} changes ago`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">{c.substring(0, 100)}...</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
