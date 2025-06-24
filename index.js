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

app.use('/search', searchRouter);
app.use('/fetch', fetchRouter);
app.use('/mcp', mcpRouter);
app.use('/list_accounts', listAccountsRouter);
app.use('/run_gaql', runGAQLRouter);
app.use('/get_campaign_performance', getCampaignPerformanceRouter);
app.use('/get_ad_performance', getAdPerformanceRouter);
app.use('/execute_gaql_query', executeGAQLQueryRouter);

// MCP Tools Agents (OpenAI/N8N) compatible SSE
const { createMcpHandler } = require('@microsoft/fastmcp');

const tools = [
  {
    name: "search_google_ads_campaigns",
    description: "Renvoie une liste simulée de campagnes",
    parameters: {
      type: "object",
      properties: {
        accountId: { type: "string" }
      },
      required: ["accountId"]
    },
    run: async ({ input }) => {
      return {
        campaigns: [
          { name: "Campagne 1", cpc: 1.2 },
          { name: "Campagne 2", cpc: 0.95 }
        ]
      };
    }
  }
];

app.get('/sse', createMcpHandler({ tools }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MCP Eliott server running on port ${PORT}`);
});
