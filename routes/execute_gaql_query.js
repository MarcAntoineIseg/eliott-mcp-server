const express = require('express');
const router = express.Router();
const { getUserTokens } = require('../services/supabaseClient');
const { runGAQLQuery } = require('../services/googleAds');

// POST /execute_gaql_query
router.post('/', async (req, res) => {
  const { uid, query } = req.body;
  try {
    const tokens = await getUserTokens(uid, 'google_ads');
    const results = await runGAQLQuery(tokens, query);
    res.json({ results });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
