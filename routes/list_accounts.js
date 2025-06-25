const express = require('express');
const router = express.Router();
const { listGoogleAdsAccounts } = require('../services/googleAds');

// POST /list_accounts
router.post('/', async (req, res) => {
  const {
    access_token,
    refresh_token,
    customer_id,
    developer_token
  } = req.body;

  if (!customer_id) {
    return res.status(400).json({ error: 'Missing customer_id' });
  }

  try {
    const tokens = {
      access_token,
      refresh_token,
      customer_id,
      login_customer_id: customer_id,
      developer_token
    };

    const accounts = await listGoogleAdsAccounts(tokens);
    res.json({ accounts });
  } catch (err) {
    console.error('❌ Erreur dans /list_accounts:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
