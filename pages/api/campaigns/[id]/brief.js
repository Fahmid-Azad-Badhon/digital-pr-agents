const { writeBrief } = require('../../../../lib/fileOps');
const { getCampaign, saveCampaign } = require('../../../../lib/db');

module.exports = async function handler(req, res) {
  const id = req.query.id;
  const cam = await getCampaign(id);
  if (!cam) return res.status(404).json({ error: 'Campaign not found' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const content = req.body?.content || '';
  const file = writeBrief(id, content);
  // Update file tracking
  cam.files = cam.files || {};
  cam.files['00-brief.md'] = { path: file, createdAt: new Date().toISOString() };
  cam.updatedAt = new Date().toISOString();
  await saveCampaign(cam);
  res.status(200).json({ ok: true, path: file });
};
