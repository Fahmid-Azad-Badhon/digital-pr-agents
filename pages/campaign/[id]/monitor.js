import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function Monitor() {
  const router = useRouter();
  const { id } = router.query;
  const [progress, setProgress] = useState(null);
  useEffect(() => {
    if (!id) return;
    const t = setInterval(async () => {
      const r = await fetch(`/api/campaigns/${id}/progress`);
      const data = await r.json();
      setProgress(data);
    }, 2000);
    return () => clearInterval(t);
  }, [id]);

  if (!id) return <div>Loading monitor...</div>;
  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1>Workflow Monitor</h1>
      {progress ? (
        <div>
          <div>Current Stage: {progress.stage}</div>
          <div>Progress: {progress.progress ?? 0}%</div>
          <pre style={{ background: '#f6f6f6', padding: 12 }}>{JSON.stringify(progress, null, 2)}</pre>
        </div>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}
