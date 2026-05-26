import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function LogsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/campaigns/${id}/logs`).then(r => r.json()).then((data) => {
      setLogs(data.logs || []);
    }).catch(() => {});
  }, [id]);

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1>Logs & Errors</h1>
      <pre style={{ background: '#f6f6f6', padding: 12, maxHeight: 500, overflow: 'auto' }}>
{JSON.stringify(logs, null, 2)}
      </pre>
    </div>
  );
}
