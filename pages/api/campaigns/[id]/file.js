const fs = require('fs');
const path = require('path');
const { getCampaign } = require('../../../../lib/db');

module.exports = async function handler(req, res) {
  const { id } = req.query;
  const cam = getCampaign(id);
  if (!cam) return res.status(404).json({ error: 'Campaign not found' });
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const name = req.query.name || '';
  const filePath = path.join(cam.path, name);
  try {
    if (req.method === 'GET') {
      const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
      res.status(200).json({ name, content });
    } else if (req.method === 'POST') {
      const content = req.body?.content ?? '';
      fs.writeFileSync(filePath, content);
      res.status(200).json({ ok: true, path: filePath, updatedAt: new Date().toISOString() });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Failed to read file', detail: String(e) });
  }
};
