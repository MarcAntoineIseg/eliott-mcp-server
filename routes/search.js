const express = require('express');
const router = express.Router();
const { getGoogleAdsCampaigns } = require('../services/googleAds');
const { formatSearchResults } = require('../utils/formatMCPResponse');

// POST /search
router.post('/', async (req, res) => {
  const {
    query,
    access_token,
    refresh_token,
    customer_id,
    developer_token
  } = req.body;

  if (!query || !customer_id) {
    return res.status(400).json({ error: 'Missing query or customer_id' });
  }

  try {
    const tokens = {
      access_token,
      refresh_token,
      customer_id,
      login_customer_id: customer_id,
      developer_token
    };

    const campaigns = await getGoogleAdsCampaigns(tokens, query);
    const results = formatSearchResults(campaigns);
    res.json(results);
  } catch (err) {
    console.error('❌ Erreur dans /search:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
