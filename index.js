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

// ✅ Middleware JSON
app.use(express.json());

// ✅ Middleware CORS complet
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// ✅ Middleware de debug
app.use((req, res, next) => {
  console.log(`📦 Contenu brut reçu dans req.body:`, req.body);
  next();
});

// ✅ Routes personnalisées
app.use('/search',                   searchRouter);
app.use('/fetch',                    fetchRouter);
app.use('/mcp',                      mcpRouter);
app.use('/list_accounts',            listAccountsRouter);
app.use('/run_gaql',                 runGAQLRouter);
app.use('/get_campaign_performance', getCampaignPerformanceRouter);
app.use('/get_ad_performance',       getAdPerformanceRouter);
app.use('/execute_gaql_query',       executeGAQLQueryRouter);
app.use('/run_ga4_query',            ga4Router);

// ✅ Tools MCP
const tools = [
  {
    name: "search_google_ads_campaigns",
    description: "Recherche des campagnes Google Ads pertinentes pour un utilisateur.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Recherche textuelle sur les campagnes." },
        uid:   { type: "string", description: "Identifiant utilisateur (Supabase UID)" }
      },
      required: ["query", "uid"],
      additionalProperties: false
    },
    run: async ({ input }) => {
      const { query, uid } = input.parameters || {};
      console.log('🔍 search_google_ads_campaigns:', { query, uid });
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
      console.log('📦 fetch_google_ads_campaign:', id);
      return {
        id,
        name: "Campagne simulée",
        impressions: 1000,
        clicks: 123,
        cpc: 0.95
      };
    }
  },
  {
    name: "list_ga4_properties",
    description: "Liste les propriétés GA4 accessibles par l'utilisateur connecté.",
    input_schema: {
      type: "object",
      properties: {
        access_token: { type: "string", description: "Access token OAuth du compte utilisateur." }
      },
      required: ["access_token"],
      additionalProperties: false
    },
    run: async ({ input }) => {
      const { access_token } = input.parameters;
      const { data } = await axios.get(
        'https://analyticsadmin.googleapis.com/v1beta/accountSummaries',
        { headers: { Authorization: `Bearer ${access_token}` } }
      );
      return data.accountSummaries || [];
    }
  },
  {
    name: "run_ga4_report",
    description: "Exécute une requête GA4 personnalisée sur une propriété Google Analytics 4 (sessions, utilisateurs, pages vues...) en fonction de dimensions, de métriques et d'une plage de dates.",
    input_schema: {
      type: "object",
      properties: {
        access_token: { type: "string" },
        property_id:  { type: "string" },
        dimensions:   { type: "array",  items: { type: "string" } },
        metrics:      { type: "array",  items: { type: "string" } },
        start_date:   { type: "string" },
        end_date:     { type: "string" }
      },
      required: ["access_token", "property_id", "dimensions", "metrics", "start_date", "end_date"],
      additionalProperties: false
    },
    run: async ({ input }) => {
      const { access_token, property_id, dimensions, metrics, start_date, end_date } = input.parameters;
      const url = `https://analyticsdata.googleapis.com/v1beta/properties/${property_id}:runReport`;
      const body = {
        dimensions: dimensions.map(name => ({ name })),
        metrics:    metrics.map(name => ({ name })),
        dateRanges: [{ startDate: start_date, endDate: end_date }]
      };
      const { data } = await axios.post(url, body, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        }
      });
      return data;
    }
  }
];

// ✅ Endpoint MCP-compatible : GET /sse
app.get('/sse', async (req, res) => {
  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  console.log('🔄 /sse hit, query:', req.query);

  // Handle client disconnect
  req.on('close', () => {
    console.log('🔌 SSE connection closed by client');
  });

  // 1) List tools
  if (req.query.metadata === 'true') {
    const payload = { tools: tools.map(({ name, description, input_schema }) => ({ name, description, input_schema })) };
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
    res.write(`data: [DONE]\n\n`);
    return res.end(); // ← close connection so N8N can proceed
  }

  try {
    // 2) Call a tool
    const toolName   = req.query.tool_name;
    const parameters = JSON.parse(req.query.parameters || '{}');
    const tool       = tools.find(t => t.name === toolName);

    if (!tool) {
      res.write(`data: ${JSON.stringify({ error: 'Tool not found' })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      return res.end();
    }

    // Acknowledge call
    res.write(`data: ${JSON.stringify({ tool_call: { name: tool.name, parameters } })}\n\n`);

    // Execute and respond
    const output = await tool.run({ input: { parameters } });
    res.write(`data: ${JSON.stringify({ tool_response: output })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    return res.end();
  } catch (err) {
    console.error('❌ Error in /sse:', err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    return res.end();
  }
});

// ✅ Healthcheck
app.get('/', (req, res) => {
  res.send('✅ Eliott MCP Server is running');
});

// ✅ Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 MCP Eliott server running on port ${PORT}`);
});
