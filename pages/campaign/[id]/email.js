import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function EmailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/campaigns/${id}/file?name=09-optimized-email.md`).then(r => r.json()).then((d) => {
      setContent(d.content || '');
    }).catch(() => {});
  }, [id]);

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1>Email Optimization</h1>
      <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={12} style={{ width: '100%' }} />
      <div style={{ marginTop: 8 }}>
        <button onClick={() => {
          // Save updated email to file via API
          fetch(`/api/campaigns/${id}/file?name=09-optimized-email.md`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
          }).then(() => alert('Email saved'))
        }} style={{ padding: '8px 12px' }}>Save Email</button>
      </div>
    </div>
  );
}
