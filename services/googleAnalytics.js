const axios = require('axios');

const GA4_BASE_URL = 'https://analyticsdata.googleapis.com/v1beta';

async function runGA4Query(tokens, body) {
  const access_token = tokens.access_token;
  const property_id = tokens.property_id;
  if (!access_token || !property_id) throw new Error('Missing access_token or property_id');

  const url = `${GA4_BASE_URL}/properties/${property_id}:runReport`;

  const headers = {
    Authorization: `Bearer ${access_token}`,
    'Content-Type': 'application/json',
  };

  const { data } = await axios.post(url, body, { headers });
  return data;
}

module.exports = { runGA4Query };
