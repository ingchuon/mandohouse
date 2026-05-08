// src/server.js
const express      = require('express');
const cookieParser = require('cookie-parser');
const path         = require('path');

const app    = express();
const PORT   = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'public')));

// API routes
app.use('/api', require('./routes'));

// SPA fallback — serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🏫 Mando House running on http://localhost:${PORT}`);
});
