require('dotenv').config();
const express = require('express');
const axios = require('axios');

// ✅ Routes REST (pour debug/local)
const searchRouter = require('./routes/search');
const fetchRouter = require('./routes/fetch');
const mcpRouter = require('./routes/mcp');
const listAccountsRouter = require('./routes/list_accounts');
const runGAQLRouter = require('./routes/run_gaql');
const getCampaignPerformanceRouter = require('./routes/get_campaign_performance');
const getAdPerformanceRouter = require('./routes/get_ad_performance');
const executeGAQLQueryRouter = require('./routes/execute_gaql_query');
const ga4Router = require('./routes/ga4');

const app = express();

// ✅ Middleware JSON
app.use(express.json());

// ✅ Middleware CORS complet
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.setHeader('Connection', 'keep-alive'); // <= important pour SSE
  res.setHeader('Cache-Control', 'no-cache');
  next();
});

// ✅ Debug request body
app.use((req, res, next) => {
  console.log('📦 Body:', req.body);
  next();
});

// ✅ REST endpoints (pour debug/local)
app.use('/search', searchRouter);
app.use('/fetch', fetchRouter);
app.use('/mcp', mcpRouter);
app.use('/list_accounts', listAccountsRouter);
app.use('/run_gaql', runGAQLRouter);
app.use('/get_campaign_performance', getCampaignPerformanceRouter);
app.use('/get_ad_performance', getAdPerformanceRouter);
app.use('/execute_gaql_query', executeGAQLQueryRouter);
app.use('/run_ga4_query', ga4Router);

// ✅ MCP tools (déclarés pour le manifest MCP)
const tools = [
  {
    name: 'get_campaign_performance',
    description: 'Retourne les performances des campagnes Google Ads',
    input_schema: {
      type: 'object',
      properties: {
        customer_id: { type: 'string' },
        access_token: { type: 'string' }
      },
      required: ['customer_id', 'access_token']
    },
    run: async ({ input }) => {
      const res = await axios.post(`${process.env.INTERNAL_API_URL}/get_campaign_performance`, input.parameters);
      return res.data;
    }
  },
  {
    name: 'get_ad_performance',
    description: 'Retourne les performances des annonces Google Ads',
    input_schema: {
      type: 'object',
      properties: {
        customer_id: { type: 'string' },
        access_token: { type: 'string' }
      },
      required: ['customer_id', 'access_token']
    },
    run: async ({ input }) => {
      const res = await axios.post(`${process.env.INTERNAL_API_URL}/get_ad_performance`, input.parameters);
      return res.data;
    }
  },
  {
    name: 'run_gaql',
    description: 'Exécute une requête GAQL brute sur un compte Google Ads',
    input_schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' },
        customer_id: { type: 'string' },
        query: { type: 'string' }
      },
      required: ['access_token', 'customer_id', 'query']
    },
    run: async ({ input }) => {
      const res = await axios.post(`${process.env.INTERNAL_API_URL}/run_gaql`, input.parameters);
      return res.data;
    }
  },
  {
    name: 'execute_gaql_query',
    description: 'Exécute une requête GAQL préconfigurée avec logique métier',
    input_schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' },
        customer_id: { type: 'string' },
        date_range: { type: 'string' },
        dimension: { type: 'string' },
        metric: { type: 'string' }
      },
      required: ['access_token', 'customer_id', 'date_range', 'dimension', 'metric']
    },
    run: async ({ input }) => {
      const res = await axios.post(`${process.env.INTERNAL_API_URL}/execute_gaql_query`, input.parameters);
      return res.data;
    }
  },
  {
    name: 'list_accounts',
    description: 'Retourne la liste des comptes accessibles par l’utilisateur',
    input_schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' }
      },
      required: ['access_token']
    },
    run: async ({ input }) => {
      const res = await axios.post(`${process.env.INTERNAL_API_URL}/list_accounts`, input.parameters);
      return res.data;
    }
  },
  {
    name: 'run_ga4_query',
    description: 'Exécute un rapport Google Analytics 4 avec dimensions et métriques',
    input_schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' },
        property_id: { type: 'string' },
        start_date: { type: 'string' },
        end_date: { type: 'string' },
        metrics: {
          type: 'array',
          items: { type: 'string' }
        },
        dimensions: {
          type: 'array',
          items: { type: 'string' }
        }
      },
      required: ['access_token', 'property_id', 'start_date', 'end_date', 'metrics']
    },
    run: async ({ input }) => {
      const res = await axios.post(`${process.env.INTERNAL_API_URL}/run_ga4_query`, input.parameters);
      return res.data;
    }
  }
];

// ✅ MCP Tools Agent SSE endpoint (manifest + JSON-RPC)
// GET /sse : Manifest MCP (n8n/OpenAI compatible)
app.get('/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ tools: tools.map(({ name, description, input_schema }) => ({ name, description, input_schema })) })}\n\n`);
  res.write(`data: [DONE]\n\n`);
  req.on('close', () => res.end());
});

// POST /sse : JSON-RPC (tools/invoke, tools/list)
app.post('/sse', express.json(), async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const { id, method, params } = req.body;

  if (method === 'tools/invoke' && params?.tool_name) {
    const tool = tools.find(t => t.name === params.tool_name);
    if (!tool) {
      res.write(`data: ${JSON.stringify({ id, error: 'Tool not found' })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      return res.end();
    }
    try {
      const output = await tool.run({ input: { parameters: params.parameters } });
      res.write(`data: ${JSON.stringify({ id, result: output })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      return res.end();
    } catch (err) {
      res.write(`data: ${JSON.stringify({ id, error: err.message })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      return res.end();
    }
  } else if (method === 'tools/list') {
    res.write(`data: ${JSON.stringify({ id, tools: tools.map(({ name, description, input_schema }) => ({ name, description, input_schema })) })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    return res.end();
  } else {
    res.write(`data: ${JSON.stringify({ id, error: 'Unknown method' })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    return res.end();
  }
});

// ✅ Health check
app.get('/', (_, res) => {
  res.send('✅ Eliott MCP Server is running');
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 MCP server listening on ${PORT}`);
});
