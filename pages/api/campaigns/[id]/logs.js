const { getCampaign } = require('../../../../lib/db');

module.exports = async function handler(req, res) {
  const { id } = req.query;
  const cam = getCampaign(id);
  if (!cam) return res.status(404).json({ error: 'Campaign not found' });
  res.status(200).json({ logs: cam.logs || [] });
};
