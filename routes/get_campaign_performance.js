const express = require('express');
const router = express.Router();
const { getCampaignPerformance } = require('../services/googleAds');

// POST /get_campaign_performance
router.post('/', async (req, res) => {
  const {
    campaign_id,
    access_token,
    refresh_token,
    customer_id,
    developer_token
  } = req.body;

  if (!campaign_id || !customer_id) {
    return res.status(400).json({ error: 'Missing campaign_id or customer_id' });
  }

  try {
    const tokens = {
      access_token,
      refresh_token,
      customer_id,
      login_customer_id: customer_id,
      developer_token
    };

    const performance = await getCampaignPerformance(tokens, campaign_id);
    res.json({ performance });
  } catch (err) {
    console.error('❌ Erreur dans /get_campaign_performance:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
