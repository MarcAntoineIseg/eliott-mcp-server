const express = require('express');
const router = express.Router();
const { getAdPerformance } = require('../services/googleAds');

// POST /get_ad_performance
router.post('/', async (req, res) => {
  const {
    ad_group_id,
    access_token,
    refresh_token,
    customer_id,
    developer_token
  } = req.body;

  if (!ad_group_id || !customer_id) {
    return res.status(400).json({ error: 'Missing ad_group_id or customer_id' });
  }

  try {
    const tokens = {
      access_token,
      refresh_token,
      customer_id,
      login_customer_id: customer_id,
      developer_token
    };

    const performance = await getAdPerformance(tokens, ad_group_id);
    res.json({ performance });
  } catch (err) {
    console.error('❌ Erreur dans /get_ad_performance:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
