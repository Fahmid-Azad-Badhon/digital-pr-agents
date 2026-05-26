const fs = require('fs');
const path = require('path');
const { getCampaign, saveCampaign } = require('../../../../lib/db');
const docsBridge = require('../../../../lib/docsBridge');

module.exports = async function handler(req, res) {
  const { id } = req.query;
  const cam = getCampaign(id);
  if (!cam) return res.status(404).json({ error: 'Campaign not found' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  // Simulated Google Doc export: copy 10-google-doc.md content to exported file
  try {
    const src = cam.path ? path.join(cam.path, '10-google-doc.md') : null;
    if (!src || !fs.existsSync(src)) {
      return res.status(400).json({ error: 'Source Google Doc not found' });
    }
    const content = fs.readFileSync(src, 'utf8');
    // Use docsBridge to export
    const exportedPath = docsBridge.exportToGoogleDoc(cam, src);
    cam.export = { path: exportedPath, createdAt: new Date().toISOString() };
    saveCampaign(cam);
    res.status(200).json({ ok: true, exportPath: exportedPath });
  } catch (e) {
    res.status(500).json({ error: 'Export failed', detail: String(e) });
  }
};
