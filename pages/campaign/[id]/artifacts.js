import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function Artifacts() {
  const router = useRouter();
  const { id } = router.query;
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/campaigns/${id}/files`).then(res => res.json()).then(data => {
      setItems(data.items || []);
    });
  }, [id]);

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1>Artifact Manager</h1>
      <p>Campaign: {id}</p>
      <table border={1} cellPadding={6} cellSpacing={0} style={{ borderCollapse: 'collapse', width: '100%', marginTop: 12 }}>
        <thead>
          <tr>
            <th>File</th>
            <th>Path</th>
            <th>Last Updated</th>
            <th>Preview</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={idx}>
              <td>{it.name}</td>
              <td>{it.path}</td>
              <td>{new Date(it.lastUpdated).toLocaleString()}</td>
              <td><a href={`file://${it.path}`} download>Download</a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
