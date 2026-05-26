const { listArtifacts } = require('../../../../lib/fileOps');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const id = req.query.id;
  // In a real system we would load the campaign path; here we rely on artifacts listing
  try {
    const items = listArtifacts(id);
    res.status(200).json({ items });
  } catch (e) {
    res.status(500).json({ error: 'Failed to list artifacts', detail: String(e) });
  }
};
