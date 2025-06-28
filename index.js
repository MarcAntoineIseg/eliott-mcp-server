require('dotenv').config();
const express = require('express');
const axios = require('axios');

const searchRouter                 = require('./routes/search');
const fetchRouter                  = require('./routes/fetch');
const mcpRouter                    = require('./routes/mcp');
const listAccountsRouter           = require('./routes/list_accounts');
const runGAQLRouter                = require('./routes/run_gaql');
const getCampaignPerformanceRouter = require('./routes/get_campaign_performance');
const getAdPerformanceRouter       = require('./routes/get_ad_performance');
const executeGAQLQueryRouter       = require('./routes/execute_gaql_query');
const ga4Router                    = require('./routes/ga4');

const app = express();

// JSON
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Debug body
app.use((req, res, next) => {
  console.log('📦 Body:', req.body);
  next();
});

// REST routes
app.use('/search',                   searchRouter);
app.use('/fetch',                    fetchRouter);
app.use('/mcp',                      mcpRouter);
app.use('/list_accounts',            listAccountsRouter);
app.use('/run_gaql',                 runGAQLRouter);
app.use('/get_campaign_performance', getCampaignPerformanceRouter);
app.use('/get_ad_performance',       getAdPerformanceRouter);
app.use('/execute_gaql_query',       executeGAQLQueryRouter);
app.use('/run_ga4_query',            ga4Router);

// MCP tools
const tools = [
  // ... tes définitions de tools ici, inchangées ...
];

// SSE endpoint
app.get('/sse', async (req, res) => {
  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  console.log('🔄 /sse hit, query:', req.query);

  // détecte "listTools" si metadata===true ou si aucun paramètre n'est envoyé
  const isMetadataRequest =
    req.query.metadata === 'true' ||
    (Object.keys(req.query).length === 0);

  if (isMetadataRequest) {
    const payload = {
      tools: tools.map(({ name, description, input_schema }) => ({ name, description, input_schema }))
    };
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
    res.write(`data: [DONE]\n\n`);
    return res.end();
  }

  // sinon, c'est un appel de tool
  try {
    const toolName   = req.query.tool_name;
    const parameters = JSON.parse(req.query.parameters || '{}');
    const tool       = tools.find(t => t.name === toolName);

    if (!tool) {
      res.write(`data: ${JSON.stringify({ error: 'Tool not found' })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      return res.end();
    }

    // ack
    res.write(`data: ${JSON.stringify({ tool_call: { name: tool.name, parameters } })}\n\n`);

    // run
    const output = await tool.run({ input: { parameters } });
    res.write(`data: ${JSON.stringify({ tool_response: output })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    return res.end();
  } catch (err) {
    console.error('❌ /sse error:', err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    return res.end();
  }
});

// healthcheck
app.get('/', (_, res) => {
  res.send('✅ Eliott MCP Server is running');
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 MCP server listening on ${PORT}`);
});
