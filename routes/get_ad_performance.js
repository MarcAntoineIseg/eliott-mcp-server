const express = require('express');
const router = express.Router();
const { getUserTokens } = require('../services/supabaseClient');
const { getAdPerformance } = require('../services/googleAds');

// POST /get_ad_performance
router.post('/', async (req, res) => {
  const { uid, ad_group_id } = req.body;
  try {
    const tokens = await getUserTokens(uid, 'google_ads');
    const performance = await getAdPerformance(tokens, ad_group_id);
    res.json({ performance });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
