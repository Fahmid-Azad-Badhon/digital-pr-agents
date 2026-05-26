const db = require('../../lib/db');
const fileOps = require('../../lib/fileOps');
const { v4: uuidv4 } = require('uuid');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const payload = req.body || {};
  // Create campaign in DB and return the id
  const campaign = await db.createCampaign({
    name: payload.name,
    client: payload.client,
    studyTitle: payload.studyTitle,
    topic: payload.topic,
    region: payload.region,
    beats: payload.beats,
    goal: payload.goal,
    tone: payload.tone,
    notes: payload.notes
  });
  // Prepare root path for campaign
  const root = campaign.path;
  fileOps.ensureCampaignFolder(campaign.id);
  res.status(200).json({ id: campaign.id, name: payload.name });
}
