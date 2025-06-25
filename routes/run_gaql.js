const express = require('express');
const router = express.Router();
const { runGAQLQuery } = require('../services/googleAds');

// POST /run_gaql
router.post('/', async (req, res) => {
  const {
    access_token,
    refresh_token,
    customer_id,
    developer_token,
    gaql_query,
    login_customer_id
  } = req.body;

  // 🔍 Logs de debug
  console.log('📦 Contenu brut reçu dans req.body:', req.body);
  console.log('▶️ Requête reçue /run_gaql avec refresh_token :', refresh_token ? '[OK]' : '[ABSENT]');
  console.log('Détail des tokens :', {
    access_token,
    refresh_token,
    customer_id,
    developer_token
  });

  // ✅ Validation basique
  if (!gaql_query) {
    return res.status(400).json({ error: 'gaql_query is required' });
  }

  try {
    const tokens = {
      access_token,
      refresh_token,
      customer_id,
      developer_token, 
      login_customer_id
    };

    const results = await runGAQLQuery(tokens, gaql_query);
    res.json({ results });
  } catch (err) {
    console.error('❌ Erreur run_gaql:', err?.response?.data || err.message);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
