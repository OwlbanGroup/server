const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const basicAuth = require('express-basic-auth');

const app = express();
const PORT = 4000;

// Basic authentication setup
app.use(basicAuth({
  users: { 'admin': 'securepassword' },
  challenge: true,
}));

app.use(cors());
app.use(express.json());

// Resolve the directory name for ES module compatibility
const revenueDataPath = path.resolve(__dirname, '../owlban_repos/aggregated_revenue.json');

app.get('/api/earnings', (req, res) => {
  if (!fs.existsSync(revenueDataPath)) {
    return res.status(404).json({ error: 'Earnings data not found' });
  }
  const data = fs.readFileSync(revenueDataPath, 'utf-8');
  res.json(JSON.parse(data));
});
