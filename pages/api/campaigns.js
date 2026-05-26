module.exports = function handler(req, res) {
  // This API root is a lightweight placeholder. Local operations are performed in /api/campaigns/index.js
  res.status(200).json({ ok: true, message: 'Campaigns API root. Use /api/campaigns/:id for operations.' });
};
