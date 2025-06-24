require('dotenv').config();
const express = require('express');

// Routes personnalisées de l'app Eliott
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

// Définition des routes de l'application
app.use('/search', searchRouter);
app.use('/fetch', fetchRouter);
app.use('/mcp', mcpRouter);
app.use('/list_accounts', listAccountsRouter);
app.use('/run_gaql', runGAQLRouter);
app.use('/get_campaign_performance', getCampaignPerformanceRouter);
app.use('/get_ad_performance', getAdPerformanceRouter);
app.use('/execute_gaql_query', executeGAQLQueryRouter);

// MCP tools mockés (à exposer au LLM via /sse)
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

// ✅ Route SSE compatible GET (pour OpenAI ou n8n MCP)
app.get('/sse', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    // Tool à appeler (fixe dans ce cas)
    const tool = tools.find(t => t.name === 'search_google_ads_campaigns');
    if (!tool) {
      res.write(`data: ${JSON.stringify({ error: 'Tool not found' })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      return res.end();
    }

    // Envoie du tool_call
    res.write(`data: ${JSON.stringify({ tool_call: { name: tool.name, parameters: {} } })}\n\n`);

    // Réponse simulée après délai
    setTimeout(async () => {
      const output = await tool.run({ input: { parameters: {} } });
      res.write(`data: ${JSON.stringify({ tool_response: output })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();
    }, 1000);
  } catch (err) {
    console.error('SSE error:', err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    res.end();
  }

  // Nettoyage à la fermeture de connexion
  req.on('close', () => {
    res.end();
  });
});

// ✅ Route d'accueil simple pour vérifier que le serveur tourne
app.get('/', (req, res) => {
  res.send('✅ Eliott MCP Server is running');
});

// Lancement serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MCP Eliott server running on port ${PORT}`);
});
