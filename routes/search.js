const express = require('express');
const router = express.Router();
const { getGoogleAdsCampaigns } = require('../services/googleAds');
const { getUserTokens } = require('../services/supabaseClient');
const { formatSearchResults } = require('../utils/formatMCPResponse');

// POST /search
router.post('/', async (req, res) => {
  const { query, uid } = req.body;
  if (!query || !uid) {
    return res.status(400).json({ error: 'Missing query or uid' });
  }
  try {
    const tokens = await getUserTokens(uid, 'google_ads');
    if (!tokens) {
      return res.status(404).json({ error: 'No Google Ads tokens found for this user' });
    }
    const campaigns = await getGoogleAdsCampaigns(tokens, query);
    const results = formatSearchResults(campaigns);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
