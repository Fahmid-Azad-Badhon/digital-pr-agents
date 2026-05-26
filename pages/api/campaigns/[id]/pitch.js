const path = require('path');
const fs = require('fs');
const { saveCampaign, getCampaign } = require('../../../../lib/db');
const { continueFromPitch } = require('../../../../lib/runner');

module.exports = async function handler(req, res) {
  const id = req.query.id;
  const cam = await getCampaign(id);
  if (!cam) return res.status(404).json({ error: 'Campaign not found' });
  if (req.method === 'GET') {
    const variantsDir = path.join(cam.path, 'draft-variants');
    if (!fs.existsSync(variantsDir)) {
      return res.status(200).json({ variants: [] });
    }
    const files = fs.readdirSync(variantsDir).filter((n) => n.endsWith('.md'));
    const variants = files.map((f) => {
      const p = path.join(variantsDir, f);
      const content = fs.readFileSync(p, 'utf8');
      const firstLine = content.split('\n')[0] || '';
      return { id: f, file: f, preview: firstLine.trim(), path: p };
    });
    return res.status(200).json({ variants });
  }
  if (req.method === 'POST') {
    const { variantName } = req.body || {};
    if (!variantName) return res.status(400).json({ error: 'variantName is required' });
    const variantPath = path.join(cam.path, 'draft-variants', variantName);
    if (!fs.existsSync(variantPath)) return res.status(404).json({ error: 'Variant not found' });
    // Copy content to 08-pitch-draft.md
    const draftPath = path.join(cam.path, '08-pitch-draft.md');
    const content = fs.readFileSync(variantPath, 'utf8');
    fs.writeFileSync(draftPath, content);
    // Update campaign file map
    cam.files = cam.files || {};
    cam.files['08-pitch-draft.md'] = { path: draftPath, createdAt: new Date().toISOString() };
    cam.stage = 8;
    cam.currentStage = 8;
    cam.updatedAt = new Date().toISOString();
    await saveCampaign(cam);
    // Continue to next steps (Pitch Draft -> Email Optimization)
    await continueFromPitch(cam);
    return res.status(200).json({ ok: true, message: 'Pitch draft selected and workflow continued', campaign: cam });
  }
  res.status(405).json({ error: 'Method not allowed' });
};
