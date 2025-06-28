require('dotenv').config();
const express = require('express');
const axios = require('axios');

const searchRouter = require('./routes/search');
const fetchRouter = require('./routes/fetch');
// const mcpRouter = require('./routes/mcp'); // à débrancher si plus utile
const listAccountsRouter = require('./routes/list_accounts');
const runGAQLRouter = require('./routes/run_gaql');
const getCampaignPerformanceRouter = require('./routes/get_campaign_performance');
const getAdPerformanceRouter = require('./routes/get_ad_performance');
const executeGAQLQueryRouter = require('./routes/execute_gaql_query');
const ga4Router = require('./routes/ga4');

const app = express();
app.use(express.json());

// CORS & SSE headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-Client-Id');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Cache-Control', 'no-cache');
  next();
});

// Debug
app.use((req, res, next) => {
  console.log('📦 Body:', req.body);
  next();
});

// REST endpoints (debug/local)
app.use('/search', searchRouter);
app.use('/fetch', fetchRouter);
// app.use('/mcp', mcpRouter); // à débrancher si plus utile
app.use('/list_accounts', listAccountsRouter);
app.use('/run_gaql', runGAQLRouter);
app.use('/get_campaign_performance', getCampaignPerformanceRouter);
app.use('/get_ad_performance', getAdPerformanceRouter);
app.use('/execute_gaql_query', executeGAQLQueryRouter);
app.use('/run_ga4_query', ga4Router);

// MCP tools
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
      const res = await axios.post(`${process.env.INTERNAL_API_URL}/get_campaign_performance`, input);
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
      const res = await axios.post(`${process.env.INTERNAL_API_URL}/get_ad_performance`, input);
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
      const res = await axios.post(`${process.env.INTERNAL_API_URL}/run_gaql`, input);
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
      const res = await axios.post(`${process.env.INTERNAL_API_URL}/execute_gaql_query`, input);
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
      const res = await axios.post(`${process.env.INTERNAL_API_URL}/list_accounts`, input);
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
      const res = await axios.post(`${process.env.INTERNAL_API_URL}/run_ga4_query`, input);
      return res.data;
    }
  }
];

// --- MCP Tools Agent SSE/JSON-RPC ---

const clients = new Map(); // Map<clientId, {res, pingInterval}>

function getClientId(req) {
  // Utilise un header custom ou fallback sur IP (pour démo mono-utilisateur)
  return req.headers['x-client-id'] || req.ip;
}

function getManifest() {
  return {
    type: 'manifest',
    tools: tools.map(({ name, description, input_schema }) => ({ name, description, input_schema }))
  };
}

// GET /sse : ouvre le flux SSE, envoie le manifest, garde la connexion ouverte
app.get('/sse', (req, res) => {
  const clientId = getClientId(req);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Ferme l'ancienne connexion si elle existe
  if (clients.has(clientId)) {
    const old = clients.get(clientId);
    try { old.res.end(); } catch {}
    clearInterval(old.pingInterval);
  }
  // Ping toutes les 20s pour garder la connexion ouverte
  const pingInterval = setInterval(() => res.write(':\n\n'), 20000);
  clients.set(clientId, { res, pingInterval });

  // Envoie manifest MCP
  res.write(`data: ${JSON.stringify(getManifest())}\n\n`);

  req.on('close', () => {
    clearInterval(pingInterval);
    clients.delete(clientId);
  });
});

// POST /sse : reçoit JSON-RPC, exécute, push la réponse dans le flux SSE du client
app.post('/sse', async (req, res) => {
  const clientId = getClientId(req);
  const client = clients.get(clientId);
  if (!client) {
    return res.status(400).json({ error: 'No SSE connection found for client.' });
  }
  const sseRes = client.res;

  const { id, type, method, name, arguments: args } = req.body;

  // MCP handshake
  if (method === 'initialize') {
    sseRes.write(`data: ${JSON.stringify({ id, type: 'initialize_result', result: { server: 'eliott-mcp-server', protocol: 'MCP/1.0' } })}\n\n`);
    return res.sendStatus(200);
  }
  if (method === 'tools/list' || type === 'tools_list') {
    sseRes.write(`data: ${JSON.stringify({ id, type: 'tools_list', tools: getManifest().tools })}\n\n`);
    return res.sendStatus(200);
  }
  if (method === 'tools/invoke' || type === 'call') {
    const toolName = name || (args && args.tool_name) || (req.body.tool_name);
    const tool = tools.find(t => t.name === toolName);
    if (!tool) {
      sseRes.write(`data: ${JSON.stringify({ id, type: 'call_result', error: 'Tool not found' })}\n\n`);
      return res.sendStatus(200);
    }
    try {
      let input = args;
      if (typeof input === 'string') input = JSON.parse(input);
      if (input && input.parameters) input = input.parameters;
      const output = await tool.run({ input });
      sseRes.write(`data: ${JSON.stringify({ id, type: 'call_result', output })}\n\n`);
      return res.sendStatus(200);
    } catch (err) {
      sseRes.write(`data: ${JSON.stringify({ id, type: 'call_result', error: err.message })}\n\n`);
      return res.sendStatus(200);
    }
  }
  // fallback
  sseRes.write(`data: ${JSON.stringify({ id, type: 'error', error: 'Unknown method' })}\n\n`);
  res.sendStatus(200);
});

// Healthcheck
app.get('/', (_, res) => {
  res.send('✅ Eliott MCP Server is running');
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 MCP server listening on ${PORT}`);
});
