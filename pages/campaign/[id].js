import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

function fetchCampaign(id) {
  return fetch(`/api/campaigns/${id}`).then(res => res.json());
}

function startWorkflow(id) {
  return fetch(`/api/campaigns/${id}/start`, { method: 'POST' }).then(res => res.json());
}

function fetchProgress(id) {
  return fetch(`/api/campaigns/${id}/progress`).then(res => res.json());
}

export default function CampaignPage() {
  const router = useRouter();
  const { id } = router.query;
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    if (!id) return;
    fetchCampaign(id).then(setCampaign);
    fetchProgress(id).then(setProgress);
    const t = setInterval(() => {
      fetchProgress(id).then(setProgress);
    }, 2000);
    return () => clearInterval(t);
  }, [id]);

  async function handleStart() {
    setLoading(true);
    try {
      const res = await startWorkflow(id);
      console.log(res);
      // refresh progress
      const p = await fetchProgress(id);
      setProgress(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (!id) return <div>Loading campaign...</div>;
  if (!campaign) return <div>Loading campaign data...</div>;

  // Inline brief/raw upload UX (local text saves)
  const [brief, setBrief] = useState('');
  const [raw, setRaw] = useState('');
  async function saveBrief() {
    if (!id) return;
    await fetch(`/api/campaigns/${id}/brief`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: brief }) });
  }
  async function saveRaw() {
    if (!id) return;
    await fetch(`/api/campaigns/${id}/raw`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: raw }) });
  }

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1>Campaign: {campaign.name}</h1>
      <p>ID: {campaign.id}</p>
      <h2>Overview</h2>
      <p>Current Stage: {campaign.currentStage || 1}</p>
      <p>Progress: {progress?.progress ?? 0}%</p>
      <div style={{ marginTop: 12 }}>
        <button onClick={handleStart} disabled={loading} style={{ padding: '10px 14px' }}>
          {loading ? 'Starting...' : 'Start Digital PR Workflow'}
        </button>
      </div>
      <hr />
      <h2>Campaign Brief</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label>Write brief</label><br/>
          <textarea value={brief} onChange={e => setBrief(e.target.value)} style={{ width: '100%', height: 120 }} />
          <button onClick={saveBrief} style={{ marginTop: 6 }}>Save 00-brief.md</button>
        </div>
        <div>
          <label>Upload brief (markdown/text)</label><br/>
          <input type="file" onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const text = await f.text();
            setBrief(text);
            await saveBrief();
          }}/>
        </div>
      </div>
      <h2>Raw Study Copy</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <textarea value={raw} onChange={e => setRaw(e.target.value)} style={{ width: '100%', height: 120 }} />
          <button onClick={saveRaw} style={{ marginTop: 6 }}>Save raw-study-copy.md</button>
        </div>
        <div>
          <label>Upload raw study copy (markdown/text)</label><br/>
          <input type="file" onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const text = await f.text();
            setRaw(text);
            await saveRaw();
          }}/>
        </div>
      </div>
      <h2>Angle Generation</h2>
      <p>After Start, angles are generated and you must select the angle before continuing.</p>
      <p>Angles file: 04-angles.md (generated during Step 4)</p>
      <p>Angle selection will appear at the Angle Selection Studio page.</p>
    </div>
  );
}
