const express = require('express');
const router = express.Router();
const { runGAQLQuery } = require('../services/googleAds');

// POST /run_gaql
router.post('/', async (req, res) => {
  const {
    access_token,
    refresh_token,
    customer_id,
    login_customer_id,
    developer_token,
    gaql_query
  } = req.body;

  try {
    const tokens = {
      access_token,
      refresh_token,
      customer_id,
      login_customer_id,
      developer_token
    };

    const results = await runGAQLQuery(tokens, gaql_query);
    res.json({ results });
  } catch (err) {
    console.error('❌ Erreur run_gaql:', err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
