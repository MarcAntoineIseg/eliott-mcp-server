const express = require('express');
const router = express.Router();

// MCP tool discovery endpoint
router.get('/', (req, res) => {
  // See: https://modelcontextprotocol.io/specification/2025-03-26/server/tools#discovery
  res.json({
    type: "mcp_list_tools",
    tools: [
      {
        name: "search_google_ads_campaigns",
        description: "Recherche des campagnes Google Ads pertinentes pour un utilisateur.",
        input_schema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Recherche textuelle sur les campagnes." },
            uid: { type: "string", description: "Identifiant utilisateur (Supabase UID)" }
          },
          required: ["query", "uid"],
          additionalProperties: false
        }
      },
      {
        name: "fetch_google_ads_campaign",
        description: "Récupère les détails d'une campagne Google Ads par ID.",
        input_schema: {
          type: "object",
          properties: {
            id: { type: "string", description: "ID de la campagne Google Ads." }
          },
          required: ["id"],
          additionalProperties: false
        }
      }
    ]
  });
});

// Handler MCP tool_call minimal
router.post('/', async (req, res) => {
  const frame = req.body;

  if (frame.type === "call" && frame.name === "search_google_ads_campaigns") {
    const args = JSON.parse(frame.arguments);
    // Appelle ton service Google Ads ici
    const output = `Résultat simulé pour ${args.query}`;
    return res.json({
      id: frame.id || "generated-id-1",
      type: "call_result",
      output: output
    });
  }

  if (frame.type === "call" && frame.name === "fetch_google_ads_campaign") {
    const args = JSON.parse(frame.arguments);
    // Appelle ton fetch de campagne ici
    const output = `Campagne ID ${args.id} récupérée.`;
    return res.json({
      id: frame.id || "generated-id-2",
      type: "call_result",
      output: output
    });
  }

  // fallback
  res.status(400).json({ error: "Unsupported MCP call" });
});

module.exports = router;
