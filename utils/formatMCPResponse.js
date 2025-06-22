function formatSearchResults(campaigns) {
  // MCP expects [{id, title, text, url}]
  return campaigns.map(c => ({
    id: c.campaign ? c.campaign.id : c.id,
    title: c.campaign ? c.campaign.name : c.title,
    text: c.campaign ? c.campaign.status : c.text,
    url: c.campaign ? `https://ads.google.com/campaigns/${c.campaign.id}` : c.url,
  }));
}

function formatFetchResult(campaign) {
  // MCP expects {id, title, text, url, metadata}
  return {
    id: campaign.id,
    title: campaign.title,
    text: campaign.text,
    url: campaign.url,
    metadata: campaign.metadata || {},
  };
}

module.exports = {
  formatSearchResults,
  formatFetchResult,
};
