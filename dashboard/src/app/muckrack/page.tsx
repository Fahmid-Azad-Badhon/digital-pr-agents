'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  Users, 
  Search, 
  Download, 
  ExternalLink,
  Mail,
  Globe,
  Twitter,
  Linkedin,
  Loader2,
  Star,
  CheckCircle,
  RefreshCcw,
  Play,
  Settings,
  AlertCircle,
  Zap,
  Filter,
  BarChart3,
  Target
} from 'lucide-react'
import Link from 'next/link'
import StageHeader from '@/components/StageHeader'

interface MuckRackJournalist {
  id: string
  name: string
  outlet: string
  beat: string
  email: string
  twitter?: string
  linkedin?: string
  muckrack_url?: string
  relevance_score: number
  contact_status: string
}

interface CollectionStats {
  total: number
  unique_emails: number
  with_twitter: number
  with_linkedin: number
  beats: string[]
}

function MuckRackContent() {
  const searchParams = useSearchParams()
  const campaign = searchParams.get('campaign')
  
  const [journalists, setJournalists] = useState<MuckRackJournalist[]>([])
  const [stats, setStats] = useState<CollectionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [collecting, setCollecting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [beatFilter, setBeatFilter] = useState('all')
  const [selectedJournalists, setSelectedJournalists] = useState<string[]>([])

  const fetchJournalists = async () => {
    try {
      const res = await fetch('/api/journalists' + (campaign ? `?campaign=${campaign}` : ''))
      const data = await res.json()
      setJournalists(data.journalists || [])
      
      // Calculate stats
      const uniqueEmails = new Set(data.journalists?.filter((j: MuckRackJournalist) => j.email).map((j: MuckRackJournalist) => j.email)).size
      const withTwitter = data.journalists?.filter((j: MuckRackJournalist) => j.twitter).length || 0
      const withLinkedin = data.journalists?.filter((j: MuckRackJournalist) => j.linkedin).length || 0
      const beats = Array.from(new Set(data.journalists?.map((j: MuckRackJournalist) => j.beat) || [])).filter((b): b is string => typeof b === 'string')
      
      setStats({
        total: data.journalists?.length || 0,
        unique_emails: uniqueEmails,
        with_twitter: withTwitter,
        with_linkedin: withLinkedin,
        beats
      })
    } catch (error) {
      console.error('Error fetching journalists:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJournalists()
  }, [campaign])

  const handleRunCollector = async () => {
    setCollecting(true)
    try {
      // This would trigger the Muck Rack collector script
      // For now, we'll simulate the collection
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert('Muck Rack collector would run here. Set MUCKRACK_EMAIL and MUCKRACK_PASSWORD environment variables to enable.')
      fetchJournalists()
    } finally {
      setCollecting(false)
    }
  }

  const filteredJournalists = journalists.filter(j => {
    const matchesSearch = j.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         j.outlet.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesBeat = beatFilter === 'all' || j.beat === beatFilter
    return matchesSearch && matchesBeat
  })

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500'
    if (score >= 60) return 'text-amber-500'
    return 'text-slate-500'
  }

  const handleSelect = (id: string) => {
    setSelectedJournalists(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#7209B7] mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Loading Muck Rack data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <StageHeader stageNumber={8} stageName="Journalist Intelligence" agentId="intelligence" />
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <Globe className="text-[#7209B7]" />
            Muck Rack Collection
          </h2>
          <p className="text-slate-500 mt-1">Manage journalist data from Muck Rack</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRunCollector}
            disabled={collecting}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#7209B7] to-[#B5179E] text-white rounded-xl font-medium disabled:opacity-50"
          >
            {collecting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            {collecting ? 'Collecting...' : 'Run Collector'}
          </button>
          <Link href="/workflow" className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:text-[#7209B7] hover:border-[#7209B7] transition-all">
            Back to Workflow
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users size={16} className="text-[#7209B7]" />
              <span className="text-xs font-bold text-slate-500 uppercase">Total</span>
            </div>
            <p className="text-2xl font-black text-slate-800">{stats.total}</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Mail size={16} className="text-emerald-500" />
              <span className="text-xs font-bold text-slate-500 uppercase">Emails</span>
            </div>
            <p className="text-2xl font-black text-slate-800">{stats.unique_emails}</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Twitter size={16} className="text-blue-400" />
              <span className="text-xs font-bold text-slate-500 uppercase">Twitter</span>
            </div>
            <p className="text-2xl font-black text-slate-800">{stats.with_twitter}</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Linkedin size={16} className="text-blue-600" />
              <span className="text-xs font-bold text-slate-500 uppercase">LinkedIn</span>
            </div>
            <p className="text-2xl font-black text-slate-800">{stats.with_linkedin}</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target size={16} className="text-amber-500" />
              <span className="text-xs font-bold text-slate-500 uppercase">Beats</span>
            </div>
            <p className="text-2xl font-black text-slate-800">{stats.beats.length}</p>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3">
        <AlertCircle size={20} className="text-blue-500 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-700">Muck Rack Integration</p>
          <p className="text-xs text-blue-600 mt-1">
            To collect journalists automatically, set environment variables: 
            <code className="bg-blue-100 px-1 rounded ml-1">MUCKRACK_EMAIL</code> and 
            <code className="bg-blue-100 px-1 rounded ml-1">MUCKRACK_PASSWORD</code>
            <br />
            Then run: <code className="bg-blue-100 px-1 rounded">node scripts/muckrack-collector.js</code>
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search journalists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm"
            />
          </div>
          <select 
            value={beatFilter}
            onChange={(e) => setBeatFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm"
          >
            <option value="all">All Beats</option>
            {stats?.beats.map(beat => (
              <option key={beat} value={beat}>{beat}</option>
            ))}
          </select>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>{filteredJournalists.length} results</span>
            <span>•</span>
            <span>{selectedJournalists.length} selected</span>
          </div>
        </div>

        {filteredJournalists.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No journalists found</p>
            <button 
              onClick={handleRunCollector}
              className="mt-4 px-4 py-2 bg-[#7209B7] text-white rounded-xl text-sm font-medium"
            >
              <Play size={16} className="inline mr-2" /> Collect from Muck Rack
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredJournalists.slice(0, 20).map(journalist => (
              <div 
                key={journalist.id}
                onClick={() => handleSelect(journalist.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-4 ${
                  selectedJournalists.includes(journalist.id)
                    ? 'bg-purple-50 border-[#7209B7]'
                    : 'bg-white border-slate-100 hover:border-[#7209B7]'
                }`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedJournalists.includes(journalist.id)
                    ? 'bg-[#7209B7] border-[#7209B7] text-white'
                    : 'border-slate-300'
                }`}>
                  {selectedJournalists.includes(journalist.id) && <CheckCircle size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800">{journalist.name}</h4>
                  <p className="text-sm text-slate-500">{journalist.outlet} • {journalist.beat}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`text-lg font-bold ${getScoreColor(journalist.relevance_score)}`}>
                    {journalist.relevance_score}
                  </div>
                  <div className="flex gap-1">
                    {journalist.email && <Mail size={14} className="text-slate-400" />}
                    {journalist.twitter && <Twitter size={14} className="text-blue-400" />}
                    {journalist.linkedin && <Linkedin size={14} className="text-blue-600" />}
                    {journalist.muckrack_url && <ExternalLink size={14} className="text-purple-500" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export Section */}
      {selectedJournalists.length > 0 && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#7209B7] to-[#B5179E] text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">{selectedJournalists.length} Journalists Selected</h3>
              <p className="text-white/70 text-sm mt-1">Ready to export for outreach</p>
            </div>
            <button className="flex items-center gap-2 px-6 py-3 bg-white text-[#7209B7] rounded-xl font-bold hover:scale-105 transition-transform">
              <Download size={18} />
              Export CSV
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MuckRackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F7FF] flex items-center justify-center"><div className="text-center"><div className="w-8 h-8 border-4 border-[#7209B7] border-t-transparent rounded-full animate-spin mx-auto mb-2" /><p className="text-slate-500">Loading...</p></div></div>}>
      <MuckRackContent />
    </Suspense>
  )
}