const { writeBrief, writeRawStudyCopy, createAnglesMD, writeBeatsMD } = require('./fileOps');
const { saveCampaign, getCampaign } = require('./db');
const path = require('path');
const aiBridge = require('./aiBridge');

function safeLog(campaign, message) {
  if (!campaign.logs) campaign.logs = [];
  const entry = { t: new Date().toISOString(), msg: message };
  campaign.logs.push(entry);
}

// Simple chained, simulated workflow that progresses campaigns step by step
async function runStep1To4(campaign) {
  // Step 1: Campaign Intake (read 00-brief and raw-study-copy would occur in Step 2; here we just log)
  safeLog(campaign, 'Step 1: Campaign Intake started.');
  // Step 2: Study Extraction uses AI bridge to generate notes/insights
  await delay(800);
  safeLog(campaign, 'Step 2: Study Extraction completed.');
  const baseDir = campaign.path;
  const fileOps = require('./fileOps');
  fileOps.ensureCampaignFolder(campaign.id);
  // Generate notes/insights via AI bridge
  const brief = (campaign.notes || '');
  const note01 = aiBridge.generate('01-study-notes', brief);
  const file01 = path.join(baseDir, '01-study-notes.md');
  require('fs').writeFileSync(file01, note01);
  const insights = aiBridge.generate('02-insights', note01);
  require('fs').writeFileSync(path.join(baseDir, '02-insights.md'), insights);
  campaign.stage = 2;
  campaign.currentStage = 2;
  campaign.updatedAt = new Date().toISOString();
  saveCampaign(campaign);
  // Step 3: Research Enrichment
  await delay(800);
  safeLog(campaign, 'Step 3: Research Enrichment completed.');
  const research = aiBridge.generate('03-research', insights);
  require('fs').writeFileSync(path.join(baseDir, '03-research.md'), research);
  campaign.stage = 3;
  campaign.currentStage = 3;
  campaign.updatedAt = new Date().toISOString();
  saveCampaign(campaign);
  // Step 4: Angle Generation
  await delay(800);
  safeLog(campaign, 'Step 4: Angle Generation completed.');
  const anglesContent = generateAnglesMarkdown();
  createAnglesMD(campaign.id, anglesContent);
  // Pause: for manual angle selection gate
  campaign.stage = 4;
  campaign.currentStage = 4;
  campaign.angleSelection = { required: true, selected: [], status: 'pending' };
  campaign.updatedAt = new Date().toISOString();
  saveCampaign(campaign);
}

function generateAnglesMarkdown() {
  // Build a simple multi-beat angles markdown with two angles per beat
  const beats = [ 'Beat Alpha', 'Beat Beta' ];
  let blocks = beats.map((beat, idx) => {
    const a1 = {
      headline: `Angle 1 for ${beat}`,
      dataHook: `Data hook for ${beat} - angle 1`,
      whyCares: `Why journalists care about ${beat} angle 1`,
      score: 0.88
    };
    const a2 = {
      headline: `Angle 2 for ${beat}`,
      dataHook: `Data hook for ${beat} - angle 2`,
      whyCares: `Why journalists care about ${beat} angle 2`,
      score: 0.83
    };
    return `Beat: ${beat}\n- Angle 1: ${a1.headline} | Hook: ${a1.dataHook} | Why: ${a1.whyCares} | Score: ${a1.score}\n- Angle 2: ${a2.headline} | Hook: ${a2.dataHook} | Why: ${a2.whyCares} | Score: ${a2.score}\n`;
  }).join('\n');
  return `# Angles (2 per beat)\n\n${blocks}\n`; // simple markdown container
}

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Continue after angle selection: Steps 5-14 (simulated)
async function continueFromAngle(cam) {
  const fs = require('fs');
  const path = require('path');
  const root = cam.path;
  // Step 5: Beat Matching + Outreach Gate
  const beatsPath = path.join(root, '05-beats.md');
  fs.writeFileSync(beatsPath, '# Beats\nTop 10 angles and selection status: confirmed required.');
  cam.stage = 5; cam.currentStage = 5; cam.updatedAt = new Date().toISOString();
  // Step 6-10: create placeholders for subsequent stages
  fs.writeFileSync(path.join(root, '06-journalist-intel.md'), '# Journalist Intel (simulated)');
  fs.writeFileSync(path.join(root, '07-journalist-coverage.md'), '# Journalist Coverage (simulated)');
  fs.writeFileSync(path.join(root, '08-pitch-draft.md'), '# Pitch Draft (simulated)');
  fs.writeFileSync(path.join(root, '09-optimized-email.md'), '# Optimized Email (simulated)');
  fs.writeFileSync(path.join(root, '10-google-doc.md'), '# Google Doc (simulated)');
  // 11: Google Doc Export
  fs.writeFileSync(path.join(root, '11-google-doc-export.md'), '# Google Doc Export (simulated)');
  // 12-14: Validation track
  fs.writeFileSync(path.join(root, '12-technical-validation.md'), '# Technical Validation (simulated)');
  fs.writeFileSync(path.join(root, '13-browser-validation.md'), '# Browser Validation (simulated)');
  fs.writeFileSync(path.join(root, '14-production-readiness.md'), '# Production Readiness (simulated)');
  cam.stage = 14; cam.currentStage = 14; cam.updatedAt = new Date().toISOString();
  const { saveCampaign } = require('./db');
  await saveCampaign(cam);
  return cam;
}

async function continueFromPitch(cam) {
  const fs = require('fs');
  const path = require('path');
  const root = cam.path;
  // Step 9-14 after Pitch Drafting
  // 09: Email Optimization placeholder
  fs.writeFileSync(path.join(root, '09-optimized-email.md'), '# Optimized Email (simulated)');
  // 10: Final Packaging / Google Doc
  fs.writeFileSync(path.join(root, '10-google-doc.md'), '# Google Doc (simulated)');
  // 11: Google Doc Export
  fs.writeFileSync(path.join(root, '11-google-doc-export.md'), '# Google Doc Export (simulated)');
  // 12-14 validations
  fs.writeFileSync(path.join(root, '12-technical-validation.md'), '# Technical Validation (simulated)');
  fs.writeFileSync(path.join(root, '13-browser-validation.md'), '# Browser Validation (simulated)');
  fs.writeFileSync(path.join(root, '14-production-readiness.md'), '# Production Readiness (simulated)');
  cam.stage = 14; cam.currentStage = 14; cam.updatedAt = new Date().toISOString();
  const { saveCampaign } = require('./db');
  await saveCampaign(cam);
  return cam;
}

module.exports = {
  runStep1To4,
  continueFromAngle,
  continueFromPitch
};
