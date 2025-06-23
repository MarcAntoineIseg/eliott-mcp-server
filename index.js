require('dotenv').config();
const express = require('express');
const searchRouter = require('./routes/search');
const fetchRouter = require('./routes/fetch');
const mcpRouter = require('./routes/mcp');

const app = express();
app.use(express.json());

app.use('/search', searchRouter);
app.use('/fetch', fetchRouter);
app.use('/mcp', mcpRouter);

// Route SSE avec ping régulier pour N8N
app.get('/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Ping toutes les 15 secondes
  const intervalId = setInterval(() => {
    res.write(`event: ping\ndata: {}\n\n`);
  }, 15000);

  req.on('close', () => {
    clearInterval(intervalId);
    res.end();
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MCP Eliott server running on port ${PORT}`);
});
