const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const SITE_ROOT = path.resolve(__dirname, '..');

// Serve static files from /app (the wrestling site root)
app.use(express.static(SITE_ROOT, {
  extensions: ['html'],
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// Default to index.html for root
app.get('/', (_req, res) => {
  res.sendFile(path.join(SITE_ROOT, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Static site serving ${SITE_ROOT} on port ${PORT}`);
});
