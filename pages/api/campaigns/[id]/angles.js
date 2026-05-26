const { readFileSync, writeFileSync, existsSync } = require('fs');
const path = require('path');
const { readAnglesMD, createAnglesMD } = require('../../../../lib/fileOps');
const { getCampaign, saveCampaign } = require('../../../../lib/db');

module.exports = async function handler(req, res) {
  const id = req.query.id;
  const cam = await getCampaign(id);
  if (!cam) return res.status(404).json({ error: 'Campaign not found' });

  if (req.method === 'GET') {
    const angles = readAnglesMD(id);
    if (!angles) return res.status(404).json({ error: 'Angles not yet generated' });
    return res.status(200).json({ anglesMd: angles });
  }

  if (req.method === 'POST') {
    // Accept selected angles from client and continue workflow
    const { selectedAngles } = req.body || {};
    if (!Array.isArray(selectedAngles) || selectedAngles.length === 0) {
      return res.status(400).json({ error: 'No angles selected' });
    }
    cam.angleSelection = cam.angleSelection || {};
    cam.angleSelection.selected = selectedAngles;
    cam.angleSelection.status = 'confirmed';
    cam.stage = 4; // 04-angles done, move to next gate when approved
    cam.currentStage = 4;
    cam.updatedAt = new Date().toISOString();
    await saveCampaign(cam);
    // Automatically continue to later steps after angle selection
    const runner = require('../../../../lib/runner');
    await runner.continueFromAngle(cam);
    return res.status(200).json({ ok: true, message: 'Angles confirmed and workflow continued', campaign: cam });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
