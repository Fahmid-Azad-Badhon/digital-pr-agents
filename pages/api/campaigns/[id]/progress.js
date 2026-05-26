const { getCampaign } = require('../../../../lib/db');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const id = req.query.id;
  const cam = await getCampaign(id);
  if (!cam) return res.status(404).json({ error: 'Campaign not found' });

  // Build a light-weight progress snapshot
  const stages = [
    { id: 1, name: 'Campaign Intake', status: cam.stage >= 1 ? 'completed' : 'waiting' },
    { id: 2, name: 'Study Extraction', status: cam.stage >= 2 ? 'completed' : 'waiting' },
    { id: 3, name: 'Research Enrichment', status: cam.stage >= 3 ? 'completed' : 'waiting' },
    { id: 4, name: 'Angle Generation', status: cam.stage >= 4 ? 'paused' : 'waiting' },
    { id: 5, name: 'Beat Matching + Outreach Gate', status: cam.stage >= 5 ? 'completed' : 'waiting' },
    { id: 6, name: 'Selected-Angle Journalist Collection', status: cam.stage >= 6 ? 'completed' : 'waiting' },
    { id: 7, name: 'Journalist Targeting + Intelligence', status: cam.stage >= 7 ? 'completed' : 'waiting' },
    { id: 8, name: 'Pitch Drafting', status: cam.stage >= 8 ? 'completed' : 'waiting' },
    { id: 9, name: 'Email Optimization', status: cam.stage >= 9 ? 'completed' : 'waiting' },
    { id: 10, name: 'Final Packaging', status: cam.stage >= 10 ? 'completed' : 'waiting' },
  ];

  res.status(200).json({ id: cam.id, name: cam.name, stage: cam.currentStage, progress: cam.progress || 0, stages });
};
