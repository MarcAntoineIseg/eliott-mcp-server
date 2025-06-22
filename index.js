require('dotenv').config();
const express = require('express');
const searchRouter = require('./routes/search');
const fetchRouter = require('./routes/fetch');

const app = express();
app.use(express.json());

app.use('/search', searchRouter);
app.use('/fetch', fetchRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MCP Eliott server running on port ${PORT}`);
});
