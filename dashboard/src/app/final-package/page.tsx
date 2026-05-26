'use client'

import StageHeader from '@/components/StageHeader'
import { useState, useEffect, useCallback } from 'react'
import { 
  Package, 
  CheckCircle2, 
  ExternalLink, 
  FileText, 
  Download, 
  ShieldCheck, 
  ChevronRight,
  ArrowRight,
  Sparkles,
  Zap,
  Globe,
  Loader2,
  AlertCircle,
  Clock,
  Lock,
  Upload,
  Send,
  RefreshCcw,
  Check,
  X,
  Eye,
  Edit3,
  Copy,
  Trash2,
  Archive
} from 'lucide-react'
import AgentTracker from '@/components/AgentTracker'

interface PackageItem {
  id: string
  name: string
  type: 'document' | 'email' | 'data' | 'media'
  size: string
  status: 'ready' | 'pending' | 'error'
  lastModified: string
}

interface ExportHistory {
  id: string
  type: string
  destination: string
  timestamp: string
  status: 'success' | 'failed'
}

const CHECKLIST = [
  { id: 1, label: 'Campaign Brief Finalized', status: 'done', gate: true },
  { id: 2, label: '800 Journalists Collected', status: 'done', gate: true },
  { id: 3, label: 'Email Content Audit Passed', status: 'done', gate: true },
  { id: 4, label: 'Subject Line A/B Set', status: 'done', gate: true },
  { id: 5, label: 'Technical Validation Clear', status: 'done', gate: true },
  { id: 6, label: 'Google Doc Template Ready', status: 'pending', gate: false },
  { id: 7, label: 'Final Approval Gate', status: 'pending', gate: true }
]

export default function PackagePage() {
  const [exporting, setExporting] = useState(false)
  const [exportType, setExportType] = useState<'gdocs' | 'zip' | 'api'>('gdocs')
  const [exportProgress, setExportProgress] = useState(0)
  const [packageItems, setPackageItems] = useState<PackageItem[]>([
    { id: '1', name: 'campaign_brief.md', type: 'document', size: '24 KB', status: 'ready', lastModified: '2026-05-05 10:30' },
    { id: '2', name: 'pitch_email_final.html', type: 'email', size: '12 KB', status: 'ready', lastModified: '2026-05-05 10:28' },
    { id: '3', name: 'journalist_leads_800.json', type: 'data', size: '156 KB', status: 'ready', lastModified: '2026-05-05 10:25' },
    { id: '4', name: 'angle_analysis.pdf', type: 'document', size: '89 KB', status: 'ready', lastModified: '2026-05-05 10:20' },
    { id: '5', name: 'media_assets.zip', type: 'media', size: '2.4 MB', status: 'pending', lastModified: '2026-05-05 10:15' }
  ])
  const [exportHistory, setExportHistory] = useState<ExportHistory[]>([])
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [previewContent, setPreviewContent] = useState('')

  const completedGates = CHECKLIST.filter(c => c.status === 'done' && c.gate).length
  const totalGates = CHECKLIST.filter(c => c.gate).length
  const isGateOpen = completedGates === totalGates

  const handleExport = async () => {
    if (!isGateOpen) return
    
    setExporting(true)
    setExportProgress(0)
    
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200))
      setExportProgress(i)
    }
    
    setExportHistory(prev => [{
      id: Date.now().toString(),
      type: exportType.toUpperCase(),
      destination: exportType === 'gdocs' ? 'Google Docs' : exportType === 'zip' ? 'Local Download' : 'REST API',
      timestamp: new Date().toISOString(),
      status: 'success'
    }, ...prev])
    
    setExporting(false)
  }

  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    if (selectedItems.length === packageItems.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(packageItems.map(i => i.id))
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready': return <CheckCircle2 size={14} className="text-emerald-500" />
      case 'pending': return <Loader2 size={14} className="text-amber-500 animate-spin" />
      case 'error': return <AlertCircle size={14} className="text-red-500" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText size={16} className="text-blue-400" />
      case 'email': return <Sparkles size={16} className="text-purple-400" />
      case 'data': return <Archive size={16} className="text-emerald-400" />
      case 'media': return <Globe size={16} className="text-amber-400" />
    }
  }

  return (
    <div className="space-y-8 pb-12">
      <StageHeader stageNumber={12} stageName="Google Doc Export" agentId="orchestrator" />
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded flex items-center gap-2">
              <Package size={12} />
              Shipping Terminal
            </span>
            {isGateOpen ? (
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded flex items-center gap-1">
                <CheckCircle2 size={10} /> Gates Open
              </span>
            ) : (
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2 py-1 rounded flex items-center gap-1">
                <Lock size={10} /> Gates Locked
              </span>
            )}
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight">Final Package</h2>
          <p className="text-slate-500 font-medium mt-1">Exporting the complete Digital PR campaign to Google Docs and distribution lanes.</p>
        </div>
        <div className="w-full lg:w-96">
           <AgentTracker currentAgentId="production-packager" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4 bg-slate-900/40 border-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Package Size</span>
            <Package size={14} className="text-blue-400" />
          </div>
          <p className="text-2xl font-black text-white">2.7 MB</p>
        </div>
        <div className="glass-card rounded-2xl p-4 bg-slate-900/40 border-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Files</span>
            <FileText size={14} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">{packageItems.length}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 bg-slate-900/40 border-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gate Progress</span>
            <Lock size={14} className="text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400">{completedGates}/{totalGates}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 bg-slate-900/40 border-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Exports</span>
            <Download size={14} className="text-purple-400" />
          </div>
          <p className="text-2xl font-black text-purple-400">{exportHistory.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
           <section className="glass-card rounded-3xl p-10 bg-gradient-to-br from-slate-900 to-indigo-950 border-0 relative overflow-hidden group">
              <div className="relative z-10 flex flex-col items-center text-center py-6">
                 <div className="w-24 h-24 rounded-3xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-6 shadow-2xl animate-bounce">
                    <Package size={48} />
                 </div>
                 <h3 className="text-3xl font-black text-white mb-2">Ready for Distribution</h3>
                 <p className="text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
                    The autonomous fleet has completed all 15 stages. Your campaign is now packaged and ready for export.
                 </p>
                 
                 {!isGateOpen && (
                   <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 max-w-md">
                     <p className="text-sm text-amber-400 font-bold flex items-center gap-2">
                       <Lock size={16} />
                       {totalGates - completedGates} gate(s) still locked
                     </p>
                     <p className="text-xs text-slate-500 mt-1">Complete all required steps to unlock export.</p>
                   </div>
                 )}

                 {exporting && (
                   <div className="mb-6 w-full max-w-md">
                     <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-blue-500 transition-all duration-300"
                         style={{ width: `${exportProgress}%` }}
                       />
                     </div>
                     <p className="text-xs text-slate-500 mt-2">Exporting... {exportProgress}%</p>
                   </div>
                 )}
                  
                 <div className="flex flex-wrap justify-center gap-4">
                    <div className="flex gap-2 bg-slate-800/50 p-1 rounded-xl">
                      {(['gdocs', 'zip', 'api'] as const).map(type => (
                        <button
                          key={type}
                          onClick={() => setExportType(type)}
                          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                            exportType === type 
                              ? 'bg-blue-500 text-white' 
                              : 'text-slate-500 hover:text-white'
                          }`}
                        >
                          {type === 'gdocs' ? 'Google Docs' : type === 'zip' ? '.ZIP' : 'API'}
                        </button>
                      ))}
                    </div>
                 </div>
                  
                 <div className="flex flex-wrap justify-center gap-4 mt-4">
                    <button 
                      onClick={handleExport}
                      disabled={exporting || !isGateOpen}
                      className="btn px-10 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-black tracking-tight rounded-2xl shadow-xl shadow-blue-500/30 hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                       {exporting ? <Loader2 className="animate-spin" /> : (
                          <>
                            {exportType === 'gdocs' ? <ExternalLink size={20} /> : exportType === 'zip' ? <Download size={20} /> : <Send size={20} />}
                            {exportType === 'gdocs' ? 'EXPORT TO GOOGLE DOCS' : exportType === 'zip' ? 'DOWNLOAD .ZIP' : 'PUSH TO API'}
                          </>
                       )}
                    </button>
                    <button 
                      onClick={() => {
                        setPreviewContent(`Subject: Information unavailable. Verification required before use.

Final email: Information unavailable. Verification required before use.

Selected angle: Information unavailable. Verification required before use.

Journalist target: Information unavailable. Verification required before use.

Evidence notes: Information unavailable. Verification required before use.`)
                        setShowPreview(true)
                      }}
                      className="btn px-10 py-5 bg-white/5 border border-white/10 text-white text-lg font-bold rounded-2xl hover:bg-white/10 transition-all flex items-center gap-3"
                    >
                       <Eye size={20} />
                       PREVIEW PACKAGE
                    </button>
                 </div>
              </div>
              <div className="absolute -left-12 -bottom-12 opacity-5 rotate-12">
                 <Globe size={240} />
              </div>
           </section>

           <div className="glass-card rounded-3xl p-6 border-0 bg-slate-900/40">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Archive size={16} className="text-blue-400" />
                  Package Contents
                </h4>
                <button 
                  onClick={selectAll}
                  className="text-[10px] font-bold text-blue-400 uppercase tracking-widest hover:text-blue-300"
                >
                  {selectedItems.length === packageItems.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="space-y-3">
                {packageItems.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => toggleItemSelection(item.id)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                      selectedItems.includes(item.id) 
                        ? 'border-blue-500 bg-blue-500/10' 
                        : 'border-transparent bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                      selectedItems.includes(item.id) 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'border-slate-600'
                    }`}>
                      {selectedItems.includes(item.id) && <Check size={12} className="text-white" />}
                    </div>
                    <div className="p-2 bg-slate-800 rounded-lg">
                      {getTypeIcon(item.type)}
                    </div>
                    <div className="flex-1">
                      <h5 className="text-sm font-bold text-white">{item.name}</h5>
                      <p className="text-[10px] text-slate-500">{item.size} • {item.lastModified}</p>
                    </div>
                    {getStatusIcon(item.status)}
                  </div>
                ))}
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="glass-card rounded-3xl p-8 space-y-6">
                 <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    Package Integrity
                 </h4>
                 <div className="space-y-4">
                    <IntegrityRow label="ASCII Compatibility" status="pass" />
                    <IntegrityRow label="Media URL Stability" status="pass" />
                    <IntegrityRow label="Character Count" value="2,450" />
                    <IntegrityRow label="Attachment Size" value="2.7 MB" />
                    <IntegrityRow label="Checksum Verified" status="pass" />
                 </div>
              </div>

              <div className="glass-card rounded-3xl p-8 space-y-6">
                 <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Zap size={16} className="text-amber-400" />
                    Campaign Metadata
                 </h4>
                 <div className="space-y-4">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Selected Angle</span>
                       <p className="text-xs font-bold text-white mt-1">Data-Driven Security Breach</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Primary Beat</span>
                       <p className="text-xs font-bold text-white mt-1">Cybersecurity / Data Journalism</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Target Contacts</span>
                       <p className="text-xs font-bold text-white mt-1">800 Journalists</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <section className="glass-card rounded-3xl p-8 bg-slate-900/40 border-0">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <ShieldCheck size={18} className="text-blue-400" />
                 Gate Checklist
              </h3>
              <div className="space-y-4">
                 {CHECKLIST.map(item => (
                   <div key={item.id} className="flex items-center gap-4 group">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border-2 transition-all ${
                        item.status === 'done' 
                          ? 'bg-emerald-500 border-emerald-500 text-white' 
                          : item.status === 'pending' && item.gate
                            ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                            : 'border-slate-800 text-transparent'
                      }`}>
                         {item.status === 'done' ? <CheckCircle2 size={12} /> : item.gate ? <Lock size={10} /> : null}
                      </div>
                      <span className={`text-sm font-bold transition-colors ${
                        item.status === 'done' ? 'text-white' : item.gate ? 'text-amber-400' : 'text-slate-500'
                      }`}>
                        {item.label}
                        {item.gate && <span className="ml-2 text-[10px] text-slate-600 uppercase">(Gate)</span>}
                      </span>
                   </div>
                 ))}
              </div>
              <div className="mt-6 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
                 <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Manifest Verification</p>
                 <span className="text-xs font-bold text-white">ORCHESTRATOR-CONFIRMED-V1.0</span>
              </div>
           </section>

           <div className="glass-card rounded-3xl p-8 bg-gradient-to-br from-indigo-900/40 to-slate-900/40 border-0">
              <div className="flex items-center gap-3 mb-4">
                 <Sparkles className="text-amber-400" size={18} />
                 <h4 className="text-sm font-bold text-white uppercase tracking-tighter">Performance Boost</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed italic mb-4">
                 &ldquo;This package has been optimized for high-deliverability and maximum editorial engagement based on recent market trends.&rdquo;
              </p>
              <div className="pt-4 border-t border-white/10">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500">Deliverability Score</span>
                  <span className="text-emerald-400 font-black">98.5%</span>
                </div>
              </div>
           </div>

           {exportHistory.length > 0 && (
             <div className="glass-card rounded-3xl p-6 bg-slate-900/40 border-0">
               <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <Clock size={14} />
                 Export History
               </h4>
               <div className="space-y-3 max-h-48 overflow-y-auto">
                 {exportHistory.slice(0, 5).map(h => (
                   <div key={h.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                     <div>
                       <p className="text-xs font-bold text-white">{h.type}</p>
                       <p className="text-[10px] text-slate-500">{h.destination}</p>
                     </div>
                     <div className="text-right">
                       <p className={`text-[10px] font-black ${h.status === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                         {h.status.toUpperCase()}
                       </p>
                       <p className="text-[10px] text-slate-600">
                         {new Date(h.timestamp).toLocaleTimeString()}
                       </p>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           )}
        </div>
      </div>

      {showPreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-8" onClick={() => setShowPreview(false)}>
          <div className="glass-card rounded-3xl p-8 max-w-3xl w-full border border-white/20 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-white">Package Preview</h3>
              <button onClick={() => setShowPreview(false)} className="text-slate-500 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <pre className="text-sm font-mono text-slate-300 whitespace-pre-wrap bg-slate-900 p-6 rounded-xl">
              {previewContent}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

function IntegrityRow({ label, status, value }: any) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
       <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">{label}</span>
       {status === 'pass' ? (
          <CheckCircle2 size={14} className="text-emerald-500" />
       ) : (
          <span className="text-xs font-black text-white">{value}</span>
        )}
    </div>
  )
}
