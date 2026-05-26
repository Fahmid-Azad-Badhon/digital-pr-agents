import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

async function fetchAngles(id) {
  const res = await fetch(`/api/campaigns/${id}/angles`);
  if (!res.ok) return null;
  return res.json();
}

async function confirmAngles(id, selected) {
  const res = await fetch(`/api/campaigns/${id}/angles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selectedAngles: selected })
  });
  return res.json();
}

export default function AnglesStudio() {
  const router = useRouter();
  const { id } = router.query;
  const [angles, setAngles] = useState(null);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchAngles(id).then((data) => {
      if (data && typeof data.anglesMd === 'string') {
        setAngles(data.anglesMd);
      } else if (typeof data === 'string') {
        setAngles(data);
      } else {
        setAngles(null);
      }
    });
  }, [id]);

  function toggleAngle(a) {
    setSelected((prev) => {
      const exists = prev.indexOf(a) >= 0;
      if (exists) return prev.filter((x) => x !== a);
      return [...prev, a];
    });
  }

  async function onConfirm() {
    if (!id || selected.length === 0) return;
    setLoading(true);
    try {
      await confirmAngles(id, selected);
      // After approval, redirect to campaign page where rest of workflow continues
      router.push('/campaign/' + id);
    } catch (e) {
      console.error(e);
      alert('Failed to confirm angles');
    } finally {
      setLoading(false);
    }
  }

  // Simple Angle Selection Studio (UI for end-to-end MVP)
  const [camState, setCamState] = useState(null);
  useEffect(() => {
    if (!id) return;
    fetch(`/api/campaigns/${id}`).then(r => r.json()).then((d) => {
      setCamState(d);
    }).catch(() => {});
  }, [id]);
  const pauseNotice = camState?.angleSelection?.status === 'confirmed' ? 'Angle Generation Complete. Please choose which pitch angle should proceed.' : '';
  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1>Angle Selection Studio</h1>
      {pauseNotice && (
        <div style={{ padding: 8, background: '#fffae6', border: '1px solid #f0e68c', borderRadius: 4, marginBottom: 12 }}>
          {pauseNotice}
        </div>
      )}
      <div>
        <strong>Angles (per beat)</strong>
      </div>
      <pre style={{ background: '#f6f6f6', padding: 12, maxHeight: 300, overflow: 'auto' }}>
{angles || 'Angles content will appear here after generation (04-angles.md).'}
      </pre>
      <div style={{ marginTop: 12 }}>
        <button onClick={onConfirm} disabled={loading || selected.length === 0} style={{ padding: '10px 14px' }}>
          {loading ? 'Confirming...' : 'Confirm Selected Angles'}
        </button>
      </div>
    </div>
  );
}
