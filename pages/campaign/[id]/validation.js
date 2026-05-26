import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function ValidationCenter() {
  const router = useRouter();
  const { id } = router.query;
  const [stages, setStages] = useState([]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/campaigns/${id}/progress`).then(r => r.json()).then((data) => {
      const s = data?.stages || [];
      setStages(s);
    }).catch(() => {});
  }, [id]);

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1>Validation Center</h1>
      <p>Parallel validation track status for this campaign.</p>
      <table border={1} cellPadding={6} cellSpacing={0} style={{ borderCollapse: 'collapse', width: '100%', marginTop: 12 }}>
        <thead>
          <tr>
            <th>Stage</th>
            <th>Name</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {stages.map((st) => (
            <tr key={st.id ?? st.name}>
              <td>{st.id ?? st.number}</td>
              <td>{st.name}</td>
              <td>{st.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
