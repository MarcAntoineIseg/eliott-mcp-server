const express = require('express');
const router = express.Router();
const { runGA4Query } = require('../services/googleAnalytics');

router.post('/', async (req, res) => {
  const {
    access_token,
    property_id,
    query // body de la requête GA4 style dimensions/metrics/dateRanges
  } = req.body;

  if (!access_token || !property_id || !query) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const tokens = { access_token, property_id };
    const result = await runGA4Query(tokens, query);
    res.json({ result });
  } catch (err) {
    console.error('❌ GA4 Error:', err?.response?.data || err.message);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
