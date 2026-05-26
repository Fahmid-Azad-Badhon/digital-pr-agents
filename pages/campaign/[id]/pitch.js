import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function PitchDrafting() {
  const router = useRouter();
  const { id } = router.query;
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/campaigns/${id}/pitch`).then(res => res.json()).then((data) => {
      setVariants(data.variants || []);
    });
  }, [id]);

  async function choose(v) {
    setSelected(v);
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${id}/pitch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantName: v.file })
      });
      const data = await res.json();
      if (data.ok) {
        // Redirect to campaign page where further steps show
        router.push('/campaign/' + id);
      } else {
        alert('Pitch selection failed: ' + (data.error || 'unknown'));
      }
    } catch (e) {
      console.error(e);
      alert('Error selecting pitch variant');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1>Pitch Drafting</h1>
      <p>Select one of the draft variants to proceed with the final pitch draft.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {variants.map((v) => (
          <div key={v.id} style={{ border: '1px solid #ccc', padding: 12, borderRadius: 6 }}>
            <div style={{ fontWeight: 'bold' }}>{v.file}</div>
            <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 180, overflow: 'auto' }}>{v.preview}</pre>
            <button onClick={() => choose(v)} disabled={loading} style={{ padding: '6px 12px' }}>
              {loading && selected === v ? 'Applying...' : 'Use This Variant'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
