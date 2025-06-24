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

// ✅ Autorise les requêtes CORS (important pour Railway/n8n)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// ✅ Définition des routes de l'app Eliott
app.use('/search', searchRouter);
app.use('/fetch', fetchRouter);
app.use('/mcp', mcpRouter);
app.use('/list_accounts', listAccountsRouter);
app.use('/run_gaql', runGAQLRouter);
app.use('/get_campaign_performance', getCampaignPerformanceRouter);
app.use('/get_ad_performance', getAdPerformanceRouter);
app.use('/execute_gaql_query', executeGAQLQueryRouter);

// ✅ Liste des outils disponibles pour MCP
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

// ✅ Route compatible avec n8n et OpenAI (GET SSE avec ?metadata=true)
app.get('/sse', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // 🧠 Si metadata demandée (ex: par n8n pour setup)
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

  try {
    const tool = tools.find(t => t.name === 'search_google_ads_campaigns');
    if (!tool) {
      res.write(`data: ${JSON.stringify({ error: 'Tool not found' })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      return res.end();
    }

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

  req.on('close', () => res.end());
});

// ✅ Route de test serveur
app.get('/', (req, res) => {
  res.send('✅ Eliott MCP Server is running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MCP Eliott server running on port ${PORT}`);
});
