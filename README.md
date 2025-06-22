# MCP Server for Eliott (AI Marketing)

This backend exposes two MCP-compliant endpoints for use by AI agents (OpenAI tool_call):

- `POST /search` — Search Google Ads campaigns for a user
- `POST /fetch` — Fetch a campaign's details by ID

## Tech stack
- Node.js + Express
- Supabase (OAuth2 token storage)
- Google Ads API (OAuth2)
- axios
- supabase-js

## Project structure
```
/mcp-server
├── package.json
├── index.js
├── routes/
│   └── search.js
│   └── fetch.js
├── services/
│   └── googleAds.js
│   └── supabaseClient.js
├── utils/
│   └── formatMCPResponse.js
├── .env.example
```

## Setup
1. `cp .env.example .env` and fill in your values
2. `npm install`
3. `npm start`

## Environment variables
See `.env.example` for required variables.

## Deployment
Ready for Railway deployment. The `start` script is set up for production.

---

**Endpoints:**

### POST `/search`
- Body: `{ query: string, uid: string }`
- Returns: Array of MCP results (`[{ id, title, text, url }]`)

### POST `/fetch`
- Body: `{ id: string }`
- Returns: MCP document (`{ id, title, text, url, metadata }`)

---

For any issues, see the code comments for extension points and details.
