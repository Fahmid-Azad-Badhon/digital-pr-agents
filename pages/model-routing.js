import { useEffect, useState } from 'react';

export default function ModelRouting() {
  const [routes, setRoutes] = useState([]);
  useEffect(() => {
    fetch('/api/model-routing').then(r => r.json()).then(setRoutes);
  }, []);
  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1>Model Routing</h1>
      <table border={1} cellPadding={6} cellSpacing={0} style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>Stage</th>
            <th>Owner</th>
            <th>Task</th>
            <th>Recommended</th>
            <th>Fallback</th>
            <th>Cost</th>
            <th>Speed</th>
            <th>Reason</th>
          </tr>
        </thead>
        <tbody>
          {routes.map((r, i) => (
            <tr key={i}>
              <td>{r.stageName ?? r.name}</td>
              <td>{r.owner}</td>
              <td>{r.taskType}</td>
              <td>{r.recommendedModel}</td>
              <td>{r.fallbackModel}</td>
              <td>{r.cost}</td>
              <td>{r.speed}</td>
              <td>{r.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
