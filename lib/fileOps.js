const fs = require('fs');
const path = require('path');

const ROOT = "D:\\Codex Folder\\digital-pr-agents";

function campaignPath(campaignId) {
  return path.join(ROOT, 'CAMPAIGNS', campaignId);
}

function ensureCampaignFolder(campaignId) {
  const dir = campaignPath(campaignId);
  fs.mkdirSync(dir, { recursive: true });
  // create required subfolders
  fs.mkdirSync(path.join(dir, 'source-files', 'study-inputs'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'draft-variants'), { recursive: true });
  return dir;
}

function writeBrief(campaignId, content) {
  const dir = ensureCampaignFolder(campaignId);
  const briefPath = path.join(dir, '00-brief.md');
  fs.writeFileSync(briefPath, content);
  return briefPath;
}

function writeRawStudyCopy(campaignId, content) {
  const dir = ensureCampaignFolder(campaignId);
  const rawDir = path.join(dir, 'source-files', 'study-inputs');
  const rawPath = path.join(rawDir, 'raw-study-copy.md');
  fs.writeFileSync(rawPath, content);
  return rawPath;
}

function readAnglesMD(campaignId) {
  const anglesPath = path.join(campaignPath(campaignId), '04-angles.md');
  if (!fs.existsSync(anglesPath)) return null;
  return fs.readFileSync(anglesPath, 'utf8');
}

function createAnglesMD(campaignId, content) {
  const dir = ensureCampaignFolder(campaignId);
  const anglesPath = path.join(dir, '04-angles.md');
  fs.writeFileSync(anglesPath, content);
  return anglesPath;
}

function writeBeatsMD(campaignId, content) {
  const dir = ensureCampaignFolder(campaignId);
  const beatsPath = path.join(dir, '05-beats.md');
  fs.writeFileSync(beatsPath, content);
  return beatsPath;
}

function listArtifacts(campaignId) {
  const dir = path.join(ROOT, 'CAMPAIGNS', campaignId);
  if (!fs.existsSync(dir)) return [];
  // basic listing of top-level files within campaign folder
  const entries = [];
  function walk(p, base) {
    if (!fs.existsSync(p)) return;
    for (const f of fs.readdirSync(p)) {
      const full = path.join(p, f);
      const stats = fs.statSync(full);
      if (stats.isDirectory()) walk(full, base + '/' + f);
      else entries.push({ path: full, name: f, lastUpdated: stats.mtimeMs });
    }
  }
  walk(dir, '');
  return entries;
}

module.exports = {
  campaignPath,
  ensureCampaignFolder,
  writeBrief,
  writeRawStudyCopy,
  readAnglesMD,
  createAnglesMD,
  writeBeatsMD,
  listArtifacts
};
