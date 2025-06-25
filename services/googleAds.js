const axios = require('axios');

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_ADS_API_BASE = 'https://googleads.googleapis.com/v14';

// ✅ Rafraîchir un access_token à partir du refresh_token
async function refreshAccessToken(refresh_token) {
  const params = {
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    refresh_token,
    grant_type: 'refresh_token',
  };
  const { data } = await axios.post(GOOGLE_TOKEN_URL, null, { params });
  return data.access_token;
}

// ✅ Obtenir un access_token valide (direct ou via refresh_token)
async function getValidAccessToken(tokens) {
  if (tokens.access_token) return tokens.access_token;
  if (!tokens.refresh_token) throw new Error('Missing refresh_token');
  return await refreshAccessToken(tokens.refresh_token);
}

// ✅ Exécute une requête GAQL avec les bons headers
async function runGAQLQuery(tokens, query) {
  const access_token = await getValidAccessToken(tokens);
  const customer_id = tokens.customer_id;
  if (!customer_id) throw new Error('Missing customer_id in tokens');

  const url = `${GOOGLE_ADS_API_BASE}/customers/${customer_id}/googleAds:searchStream`;
  const body = { query };

  const headers = {
    Authorization: `Bearer ${access_token}`,
    'developer-token': tokens.developer_token || process.env.GOOGLE_DEVELOPER_TOKEN || '',
    'Content-Type': 'application/json'
    // ❌ Ne PAS inclure login-customer-id si tu n’utilises pas de MCC
  };

  const { data } = await axios.post(url, body, { headers });
  return data.results || [];
}

// ✅ Requête personnalisée (à adapter à ton usage)
async function getGoogleAdsCampaigns(tokens, textQuery) {
  const gaql = `SELECT campaign.id, campaign.name, campaign.status 
    FROM campaign 
    WHERE campaign.name LIKE '%${textQuery}%' 
    LIMIT 10`;
  return await runGAQLQuery(tokens, gaql);
}

// ✅ Simule une récupération de campagne par ID
async function fetchCampaignById(id) {
  return {
    id,
    title: `Campaign ${id}`,
    text: 'Détails de la campagne (mock)',
    url: `https://ads.google.com/campaigns/${id}`,
    metadata: {},
  };
}

// ✅ Liste des comptes accessibles (simple pour le moment)
async function listGoogleAdsAccounts(tokens) {
  if (tokens.customer_id) {
    return [{ customer_id: tokens.customer_id, name: `Account ${tokens.customer_id}` }];
  }
  return [{ customer_id: '1234567890', name: 'Demo Account' }];
}

// ✅ Détail performance campagne
async function getCampaignPerformance(tokens, campaign_id) {
  const query = `
    SELECT campaign.id, campaign.name, 
           metrics.clicks, metrics.impressions, 
           metrics.cost_micros, metrics.conversions 
    FROM campaign 
    WHERE campaign.id = ${campaign_id} 
    LIMIT 1`;
  const results = await runGAQLQuery(tokens, query);
  return results[0] || {};
}

// ✅ Détail performance ad group
async function getAdPerformance(tokens, ad_group_id) {
  const query = `
    SELECT ad_group.id, ad_group.name, 
           metrics.clicks, metrics.impressions, 
           metrics.cost_micros, metrics.conversions 
    FROM ad_group 
    WHERE ad_group.id = ${ad_group_id} 
    LIMIT 1`;
  const results = await runGAQLQuery(tokens, query);
  return results[0] || {};
}

module.exports = {
  getGoogleAdsCampaigns,
  fetchCampaignById,
  listGoogleAdsAccounts,
  runGAQLQuery,
  getCampaignPerformance,
  getAdPerformance,
};
