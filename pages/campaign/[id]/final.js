import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function FinalPackaging() {
  const router = useRouter();
  const { id } = router.query;
  const [content, setContent] = useState('');
  const [exported, setExported] = useState(null);
  useEffect(() => {
    if (!id) return;
    fetch(`/api/campaigns/${id}/file?name=10-google-doc.md`).then(r => r.json()).then((d) => {
      setContent(d.content || '');
    }).catch(() => {});
  }, [id]);
  async function exportDoc() {
    if (!id) return;
    const resp = await fetch(`/api/campaigns/${id}/export`, { method: 'POST' });
    const data = await resp.json();
    if (data.ok) {
      setExported(data.exportPath);
    }
  }
  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1>Final Packaging</h1>
      <div>
        <h2>Google Doc (10-google-doc.md)</h2>
        <pre style={{ whiteSpace: 'pre-wrap', background: '#f6f6f6', padding: 12 }}>{content}</pre>
      </div>
      <div style={{ marginTop: 8 }}>
        <button onClick={exportDoc} style={{ padding: '8px 12px' }}>Export to Google Doc (Simulated)</button>
      </div>
      {exported && (
        <div style={{ marginTop: 8 }}>Export completed: <code>{exported}</code></div>
      )}
    </div>
  );
}
