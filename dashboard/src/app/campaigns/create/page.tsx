'use client'

import { useState } from 'react'
import { ArrowLeft, Upload, FileText, Plus, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import StageHeader from '@/components/StageHeader'
import { apiRequest, formatApiError } from '@/lib/clientApi'

export default function CampaignCreatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    studyTitle: '',
    topic: '',
    country: '',
    beats: [''],
    goal: '',
    tone: '',
    notes: '',
    brief: '',
    rawStudy: ''
  })
  
  const [fileUpload, setFileUpload] = useState<{
    brief: File | null
    rawStudy: File | null
  }>({
    brief: null,
    rawStudy: null
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleBeatsChange = (index: number, value: string) => {
    const newBeats = [...formData.beats]
    newBeats[index] = value
    setFormData(prev => ({ ...prev, beats: newBeats }))
  }

  const addBeat = () => {
    setFormData(prev => ({ ...prev, beats: [...prev.beats, ''] }))
  }

  const removeBeat = (index: number) => {
    const newBeats = formData.beats.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, beats: newBeats }))
  }

  const handleFileChange = (type: 'brief' | 'rawStudy', file: File | null) => {
    setFileUpload(prev => ({ ...prev, [type]: file }))
  }

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string || '')
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.topic) {
      alert('Please fill in required fields')
      return
    }

    const hasRawStudyFromTextarea = String(formData.rawStudy || '').trim().length > 0
    const hasRawStudyFile = Boolean(fileUpload.rawStudy)
    if (!hasRawStudyFromTextarea && !hasRawStudyFile) {
      alert('Raw Study Copy is required. Please upload a study file or paste raw study content.')
      return
    }

    setLoading(true)
    setSubmitError(null)
    try {
      // Create campaign
      const campaignData = await apiRequest<{ campaign: { id: string } }>('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: String(formData.name ?? '').trim(),
          clientName: String(formData.client ?? '').trim(),
          studyTitle: String(formData.studyTitle ?? '').trim(),
          topic: String(formData.topic ?? '').trim(),
          targetRegion: String(formData.country ?? '').trim(),
          targetBeats: (Array.isArray(formData.beats) ? formData.beats : [])
            .map(b => String(b ?? '').trim())
            .filter(Boolean),
          goal: String(formData.goal ?? '').trim(),
          tone: String(formData.tone ?? '').trim(),
          notes: String(formData.notes ?? '').trim()
        })
      })
      const newCampaign = campaignData?.campaign
      if (!newCampaign?.id) {
        throw new Error('Campaign created response is missing campaign ID.')
      }
      console.log('Campaign created:', newCampaign)

      // Process files
      let briefContent = formData.brief
      let rawStudyContent = formData.rawStudy

      if (fileUpload.brief) {
        briefContent = await readFileContent(fileUpload.brief)
      }

      if (fileUpload.rawStudy) {
        rawStudyContent = await readFileContent(fileUpload.rawStudy)
      }

      // Save campaign files
      await apiRequest<{ saved: boolean }>(`/api/campaigns/${newCampaign.id}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief: briefContent,
          rawStudy: rawStudyContent
        })
      })

      // Kick off backend-driven automation: run automatically until Pitch Selection
      await apiRequest(`/api/campaigns/${newCampaign.id}/auto-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'pre_pitch' })
      })

      // Dispatch event so context refreshes immediately
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('campaign-created', { 
          detail: { campaignId: newCampaign.id, campaign: newCampaign } 
        }));
      }
      
      // Redirect to workflow monitor to watch auto progression
      router.push(`/workflow?id=${encodeURIComponent(newCampaign.id)}`)
    } catch (error) {
      console.error('Error creating campaign:', error)
      const message = formatApiError(error, 'Failed to create campaign')
      setSubmitError(message)
      alert(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <StageHeader stageNumber={1} stageName="Campaign Intake" agentId="orchestrator" />
      <div className="flex items-center gap-4 mb-8">
        <Link href="/" className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-3xl font-black text-white">Create Digital PR Campaign</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Campaign Details */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Plus size={20} className="text-blue-400" />
            Campaign Details
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2">Campaign Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 outline-none focus:border-blue-400 transition-all"
                placeholder="My Digital PR Campaign"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2">Client/Brand</label>
              <input
                type="text"
                value={formData.client}
                onChange={(e) => handleInputChange('client', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 outline-none focus:border-blue-400 transition-all"
                placeholder="Company Name"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2">Study Title</label>
              <input
                type="text"
                value={formData.studyTitle}
                onChange={(e) => handleInputChange('studyTitle', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 outline-none focus:border-blue-400 transition-all"
                placeholder="Research Study Title"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2">Campaign Topic *</label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => handleInputChange('topic', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 outline-none focus:border-blue-400 transition-all"
                placeholder="Industry, product, or market segment"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2">Target Country/Region</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 outline-none focus:border-blue-400 transition-all"
                placeholder="United States, Europe, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2">Target Journalist Beats</label>
              <div className="space-y-2">
                {formData.beats.map((beat, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={beat}
                      onChange={(e) => handleBeatsChange(index, e.target.value)}
                      className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 outline-none focus:border-blue-400 transition-all"
                      placeholder="Journalist beat (e.g., Technology, Finance)"
                    />
                    {formData.beats.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBeat(index)}
                        className="px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition-all"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addBeat}
                  className="px-4 py-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/20 transition-all flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Beat
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2">Campaign Goal</label>
              <textarea
                value={formData.goal}
                onChange={(e) => handleInputChange('goal', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 outline-none focus:border-blue-400 transition-all"
                placeholder="What do you want to achieve with this campaign?"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2">Desired Tone</label>
              <select
                value={formData.tone}
                onChange={(e) => handleInputChange('tone', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 outline-none focus:border-blue-400 transition-all"
              >
                <option value="">Select tone</option>
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="authoritative">Authoritative</option>
                <option value="conversational">Conversational</option>
                <option value="urgent">Urgent</option>
                <option value="breaking">Breaking News</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2">Additional Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 outline-none focus:border-blue-400 transition-all"
                placeholder="Any additional context or requirements"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Campaign Files */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText size={20} className="text-emerald-400" />
            Campaign Files
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2">Campaign Brief</label>
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-4 bg-white/5 border border-white/10 rounded-xl">
                  <Upload size={16} className="text-slate-500" />
                  <span className="text-sm text-slate-500">or write directly below</span>
                </div>

                <div className="relative">
                  <input
                    type="file"
                    accept=".md,.txt"
                    onChange={(e) => handleFileChange('brief', e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="brief-upload"
                  />
                  <label
                    htmlFor="brief-upload"
                    className="block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 outline-none focus:border-blue-400 transition-all cursor-pointer hover:bg-white/10"
                  >
                    {fileUpload.brief ? fileUpload.brief.name : 'Upload brief file (Markdown or Text)'}
                  </label>
                </div>

                <textarea
                  value={formData.brief}
                  onChange={(e) => handleInputChange('brief', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 outline-none focus:border-blue-400 transition-all"
                  placeholder="Write your campaign brief here..."
                  rows={8}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2">Raw Study Copy</label>
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-4 bg-white/5 border border-white/10 rounded-xl">
                  <Upload size={16} className="text-slate-500" />
                  <span className="text-sm text-slate-500">or paste content below</span>
                </div>

                <div className="relative">
                  <input
                    type="file"
                    accept=".md,.txt"
                    onChange={(e) => handleFileChange('rawStudy', e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="raw-study-upload"
                  />
                  <label
                    htmlFor="raw-study-upload"
                    className="block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 outline-none focus:border-blue-400 transition-all cursor-pointer hover:bg-white/10"
                  >
                    {fileUpload.rawStudy ? fileUpload.rawStudy.name : 'Upload study file (Markdown or Text)'}
                  </label>
                </div>

                <textarea
                  value={formData.rawStudy}
                  onChange={(e) => handleInputChange('rawStudy', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 outline-none focus:border-blue-400 transition-all"
                  placeholder="Paste your raw study copy here..."
                  rows={12}
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Creating Campaign...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Create Campaign & Start Workflow
                </>
              )}
            </button>
            {submitError && (
              <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
                <p className="text-xs text-red-300 break-words">
                  {submitError}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
