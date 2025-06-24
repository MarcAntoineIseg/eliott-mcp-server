const express = require('express');
const router = express.Router();
const { getUserTokens } = require('../services/supabaseClient');
const { getCampaignPerformance } = require('../services/googleAds');

// POST /get_campaign_performance
router.post('/', async (req, res) => {
  const { uid, campaign_id } = req.body;
  try {
    const tokens = await getUserTokens(uid, 'google_ads');
    const performance = await getCampaignPerformance(tokens, campaign_id);
    res.json({ performance });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
