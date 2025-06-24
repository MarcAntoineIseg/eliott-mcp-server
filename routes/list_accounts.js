const express = require('express');
const router = express.Router();
const { getUserTokens } = require('../services/supabaseClient');
const { listGoogleAdsAccounts } = require('../services/googleAds');

// POST /list_accounts
router.post('/', async (req, res) => {
  const { uid } = req.body;
  try {
    const tokens = await getUserTokens(uid, 'google_ads');
    const accounts = await listGoogleAdsAccounts(tokens);
    res.json({ accounts });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
