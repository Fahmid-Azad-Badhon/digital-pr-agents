const { getCampaign, saveCampaign } = require('../../../../lib/db');
const fs = require('fs');
const path = require('path');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const id = req.query.id;
  const cam = await getCampaign(id);
  if (!cam) return res.status(404).json({ error: 'Campaign not found' });

  // Simulate the rest of the workflow from Step 5 to 14 with staggered tasks
  try {
    // Step 5: Beat Matching + Outreach Gate (simulate creation of 05-beats.md)
    const beatsPath = path.join(cam.path, '05-beats.md');
    fs.writeFileSync(beatsPath, '# Beats\nTop 10 angles and selection status: confirmed required.');
    cam.stage = 5; cam.currentStage = 5; cam.updatedAt = new Date().toISOString();
    await saveCampaign(cam);

    // Step 6-14: create simple placeholders for required artifacts
    fs.writeFileSync(path.join(cam.path, '06-journalist-intel.md'), '# Journalist Intel (simulated)');
    fs.writeFileSync(path.join(cam.path, '07-journalist-coverage.md'), '# Journalist Coverage (simulated)');
    fs.writeFileSync(path.join(cam.path, '08-pitch-draft.md'), '# Pitch Draft (simulated)');
    fs.writeFileSync(path.join(cam.path, '09-optimized-email.md'), '# Optimized Email (simulated)');
    fs.writeFileSync(path.join(cam.path, '10-google-doc.md'), '# Google Doc (simulated)');

    cam.stage = 14; cam.currentStage = 14; cam.updatedAt = new Date().toISOString();
    await saveCampaign(cam);

    // Validation tracks (parallel, but we simulate sequential updates to demonstrate flow)
    fs.writeFileSync(path.join(cam.path, '12-technical-validation.md'), '# Technical Validation (simulated)');
    fs.writeFileSync(path.join(cam.path, '13-browser-validation.md'), '# Browser Validation (simulated)');
    fs.writeFileSync(path.join(cam.path, '14-production-readiness.md'), '# Production Readiness (simulated)');
    await saveCampaign(cam);

    res.status(200).json({ ok: true, message: 'Workflow continued to final stages.', campaign: cam });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Continue step failed', detail: String(e) });
  }
};
