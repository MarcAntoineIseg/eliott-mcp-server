require('dotenv').config();
const express = require('express');
const app = express();

// ✅ Middleware CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

app.use(express.json());

// ✅ Routes personnalisées Eliott
const searchRouter = require('./routes/search');
const fetchRouter = require('./routes/fetch');
const mcpRouter = require('./routes/mcp');
const listAccountsRouter = require('./routes/list_accounts');
const runGAQLRouter = require('./routes/run_gaql');
const getCampaignPerformanceRouter = require('./routes/get_campaign_performance');
const getAdPerformanceRouter = require('./routes/get_ad_performance');
const executeGAQLQueryRouter = require('./routes/execute_gaql_query');

// ✅ Utilisation des routes
app.use('/search', searchRouter);
app.use('/fetch', fetchRouter);
app.use('/mcp', mcpRouter);
app.use('/list_accounts', listAccountsRouter);
app.use('/run_gaql', runGAQLRouter);
app.use('/get_campaign_performance', getCampaignPerformanceRouter);
app.use('/get_ad_performance', getAdPerformanceRouter);
app.use('/execute_gaql_query', executeGAQLQueryRouter);

// ✅ Liste des outils pour n8n MCP
const tools = [
  {
    name: 'search_google_ads_campaigns',
    description: 'Renvoie une liste fictive de campagnes Google Ads',
    run: async ({ input }) => {
      const { accountId } = input.parameters || {};
      return {
        accountId,
        campaigns: [
          { id: '123', name: 'Campagne A', cpc: 1.15 },
          { id: '124', name: 'Campagne B', cpc: 0.98 }
        ]
      };
    }
  }
];

// ✅ Endpoint SSE (utilisé par n8n)
app.get('/sse', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // 1️⃣ Si n8n demande les métadonnées
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

  // 2️⃣ Sinon, traitement de la requête tool
  try {
    const tool = tools.find(t => t.name === 'search_google_ads_campaigns');
    if (!tool) {
      res.write(`data: ${JSON.stringify({ error: 'Tool not found' })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      return res.end();
    }

    // Appel du tool simulé
    res.write(`data: ${JSON.stringify({ tool_call: { name: tool.name, parameters: {} } })}\n\n`);

    setTimeout(async () => {
      const output = await tool.run({ input: { parameters: {} } });
      res.write(`data: ${JSON.stringify({ tool_response: output })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();
    }, 1000);
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    res.end();
  }

  // Ferme proprement si l'utilisateur quitte
  req.on('close', () => res.end());
});

// ✅ Route d'accueil
app.get('/', (req, res) => {
  res.send('✅ Eliott MCP Server is running');
});

// ✅ Démarrage serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MCP Eliott server running on port ${PORT}`);
});
