const { readFileSync, writeFileSync } = require('fs');
const path = require('path');
const { getCampaign, saveCampaign } = require('../../../../lib/db');
const runner = require('../../../../lib/runner');
const { writeBrief, writeRawStudyCopy } = require('../../../../lib/fileOps');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const id = req.query.id;
  const cam = await getCampaign(id);
  if (!cam) return res.status(404).json({ error: 'Campaign not found' });

  // Start workflow: Step 1-4 (Campaign Intake, Study Extraction, Research Enrichment, Angle Generation)
  // For MVP, we simulate by invoking the runner which will create the required files.
  cam.stage = 1;
  cam.currentStage = 1;
  cam.updatedAt = new Date().toISOString();
  await saveCampaign(cam);
  try {
    // Kick off the in-memory simulated steps
    await runner.runStep1To4(cam);
    res.status(200).json({ ok: true, message: 'Workflow progressed to Angle Generation', campaign: cam });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Workflow start failed', detail: String(e) });
  }
};
