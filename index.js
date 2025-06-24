require('dotenv').config();
const express = require('express');

const searchRouter = require('./routes/search');
const fetchRouter = require('./routes/fetch');
const mcpRouter = require('./routes/mcp');
const listAccountsRouter = require('./routes/list_accounts');
const runGAQLRouter = require('./routes/run_gaql');
const getCampaignPerformanceRouter = require('./routes/get_campaign_performance');
const getAdPerformanceRouter = require('./routes/get_ad_performance');
const executeGAQLQueryRouter = require('./routes/execute_gaql_query');

const app = express();
app.use(express.json());

// ✅ Autorise les requêtes CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// ✅ Routes personnalisées
app.use('/search', searchRouter);
app.use('/fetch', fetchRouter);
app.use('/mcp', mcpRouter);
app.use('/list_accounts', listAccountsRouter);
app.use('/run_gaql', runGAQLRouter);
app.use('/get_campaign_performance', getCampaignPerformanceRouter);
app.use('/get_ad_performance', getAdPerformanceRouter);
app.use('/execute_gaql_query', executeGAQLQueryRouter);

// ✅ Définition des tools MCP
const tools = [
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
    },
    run: async ({ input }) => {
      const { query, uid } = input.parameters || {};
      console.log('🔍 Appel du tool search_google_ads_campaigns avec :', { query, uid });

      // 🔁 Appelle ici ton vrai service GA plus tard
      return {
        query,
        uid,
        campaigns: [
          { id: '123', name: 'Campagne A', cpc: 1.15 },
          { id: '124', name: 'Campagne B', cpc: 0.98 }
        ]
      };
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
    },
    run: async ({ input }) => {
      const { id } = input.parameters || {};
      console.log('📦 Appel du tool fetch_google_ads_campaign avec ID :', id);

      return {
        id,
        name: "Campagne simulée",
        impressions: 1000,
        clicks: 123,
        cpc: 0.95
      };
    }
  }
];

// ✅ Endpoint MCP-compatible : GET /sse (tools metadata + exécution)
app.get('/sse', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Mode découverte
  if (req.query.metadata === 'true') {
    const metadata = {
      tools: tools.map(t => ({
        name: t.name,
        description: t.description
      }))
    };
    res.write(`data: ${JSON.stringify(metadata)}\n\n`);
    res.write(`data: [DONE]\n\n`);
    return res.end();
  }

  // Mode exécution
  try {
    const toolName = req.query.tool_name;
    const rawParams = req.query.parameters || '{}';
    const parameters = JSON.parse(rawParams);

    const tool = tools.find(t => t.name === toolName);

    if (!tool) {
      res.write(`data: ${JSON.stringify({ error: 'Tool not found' })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      return res.end();
    }

    res.write(`data: ${JSON.stringify({ tool_call: { name: tool.name, parameters } })}\n\n`);

    const output = await tool.run({ input: { parameters } });

    res.write(`data: ${JSON.stringify({ tool_response: output })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (err) {
    console.error('❌ Erreur dans /sse :', err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    res.end();
  }

  req.on('close', () => res.end());
});

// ✅ Route d’accueil
app.get('/', (req, res) => {
  res.send('✅ Eliott MCP Server is running');
});

// ✅ Lancement serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 MCP Eliott server running on port ${PORT}`);
});
