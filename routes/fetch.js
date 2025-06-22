const express = require('express');
const router = express.Router();
const { fetchCampaignById } = require('../services/googleAds');
const { formatFetchResult } = require('../utils/formatMCPResponse');

// POST /fetch
router.post('/', async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'Missing id' });
  }
  try {
    const campaign = await fetchCampaignById(id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    const result = formatFetchResult(campaign);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
