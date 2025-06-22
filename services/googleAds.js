const axios = require('axios');
const { getUserTokens } = require('./supabaseClient');

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_ADS_API_BASE = 'https://googleads.googleapis.com/v14';

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

async function getValidAccessToken(tokens, uid) {
  const now = Math.floor(Date.now() / 1000);
  if (tokens.expires_at && tokens.expires_at > now && tokens.access_token) {
    return tokens.access_token;
  }
  // Refresh token
  const newAccessToken = await refreshAccessToken(tokens.refresh_token);
  // Optionally update Supabase with new access_token and expires_at
  // ...
  return newAccessToken;
}

async function getGoogleAdsCampaigns(tokens, query) {
  const access_token = await getValidAccessToken(tokens, tokens.uid);
  // You would need to know the customer_id (Google Ads account) from tokens or Supabase
  const customer_id = tokens.customer_id;
  if (!customer_id) throw new Error('Missing customer_id in tokens');

  // Example: search campaigns by name
  const url = `${GOOGLE_ADS_API_BASE}/customers/${customer_id}/googleAds:search`;
  const body = {
    query: `SELECT campaign.id, campaign.name, campaign.status FROM campaign WHERE campaign.name LIKE '%${query}%' LIMIT 10`,
  };
  const headers = {
    Authorization: `Bearer ${access_token}`,
    'developer-token': process.env.GOOGLE_DEVELOPER_TOKEN || '',
    'login-customer-id': customer_id,
    'Content-Type': 'application/json',
  };
  const { data } = await axios.post(url, body, { headers });
  // Map to MCP format in utils
  return data.results || [];
}

async function fetchCampaignById(id) {
  // For demo: this should fetch campaign details by id
  // In real use, you might need to pass tokens/customer_id as well
  return {
    id,
    title: `Campaign ${id}`,
    text: 'Détails de la campagne (mock)',
    url: `https://ads.google.com/campaigns/${id}`,
    metadata: {},
  };
}

module.exports = {
  getGoogleAdsCampaigns,
  fetchCampaignById,
};
