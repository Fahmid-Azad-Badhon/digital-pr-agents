const db = require('../../../../lib/db');
const path = require('path');
const fs = require('fs');
const { writeBrief, writeRawStudyCopy } = require('../../../../lib/fileOps');
const { saveCampaign, getCampaign, createCampaign } = require('../../../../lib/db');
const runner = require('../../../../lib/runner');

// This endpoint supports GET (fetch campaign by id) and PUT/POST for updates
module.exports = async function handler(req, res) {
  const id = req.query.id;
  if (req.method === 'GET') {
    const cam = await db.getCampaign(id);
    if (!cam) return res.status(404).json({ error: 'Campaign not found' });
    return res.status(200).json(cam);
  }
  if (req.method === 'POST' || req.method === 'PUT') {
    const payload = req.body || {};
    // Minimal update: just save name/note fields if provided
    let cam = await db.getCampaign(id);
    if (!cam) return res.status(404).json({ error: 'Campaign not found' });
    cam = Object.assign(cam, payload, { updatedAt: new Date().toISOString() });
    await db.saveCampaign(cam);
    return res.status(200).json(cam);
  }
  res.status(405).json({ error: 'Method not allowed' });
};

function dbGetCampaign(id) {
  try {
    const db = require('../../../../lib/db');
    return db.getCampaign(id);
  } catch (e) {
    return null;
  }
}
function dbSaveCampaign(cam) {
  const db = require('../../../../lib/db');
  db.saveCampaign(cam);
}
