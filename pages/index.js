import { useState } from 'react';
import Router from 'next/router';

export default function Home() {
  const [name, setName] = useState('Digital PR Campaign');
  const [client, setClient] = useState('Acme Corp');
  const [studyTitle, setStudyTitle] = useState('Groundbreaking Tech Study');
  const [topic, setTopic] = useState('AI in PR');
  const [region, setRegion] = useState('Global');
  const [beats, setBeats] = useState('Beat Alpha, Beat Beta');
  const [goal, setGoal] = useState('Earn top-tier coverage');
  const [tone, setTone] = useState('Authoritative');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  async function createCampaign(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, client, studyTitle, topic, region, beats, goal, tone, notes })
      });
      const data = await res.json();
      if (data && data.id) {
        Router.push('/campaign/' + data.id);
      } else {
        alert('Failed to create campaign');
      }
    } catch (e) {
      console.error(e);
      alert('Error creating campaign');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow rounded p-6">
        <h1 className="text-2xl font-semibold mb-4">Digital PR Orchestrator — Local Dashboard</h1>
        <p className="text-sm text-gray-600">Root path: D:\\Codex Folder\\digital-pr-agents</p>
        <hr className="my-4" />
        <h2 className="text-xl font-semibold mb-2">Create Campaign</h2>
        <form onSubmit={createCampaign} className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Campaign name</label>
            <input className="w-full border rounded p-2" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Client/Brand</label>
            <input className="w-full border rounded p-2" value={client} onChange={e => setClient(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Study title</label>
            <input className="w-full border rounded p-2" value={studyTitle} onChange={e => setStudyTitle(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Topic</label>
            <input className="w-full border rounded p-2" value={topic} onChange={e => setTopic(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Region</label>
            <input className="w-full border rounded p-2" value={region} onChange={e => setRegion(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Beats (comma separated)</label>
            <input className="w-full border rounded p-2" value={beats} onChange={e => setBeats(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Goal</label>
            <input className="w-full border rounded p-2" value={goal} onChange={e => setGoal(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tone</label>
            <input className="w-full border rounded p-2" value={tone} onChange={e => setTone(e.target.value)} />
          </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea className="w-full border rounded p-2" value={notes} onChange={e => setNotes(e.target.value)} rows={4} />
        </div>
        <div className="mt-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded" type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Campaign'}
          </button>
        </div>
      </form>
      </div>
      <p className="text-sm text-gray-600 mt-4">After you create a campaign, you can upload the brief and raw study copy, then start the workflow.</p>
    </div>
  );
}
