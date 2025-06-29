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

// Use the existing revenue.json file path
const revenueDataPath = path.resolve(__dirname, '../owlban_repos/sample_repo/revenue.json');

app.get('/api/earnings', (req, res) => {
  if (!fs.existsSync(revenueDataPath)) {
    return res.status(404).json({ error: 'Earnings data not found' });
  }
  const data = JSON.parse(fs.readFileSync(revenueDataPath, 'utf-8'));
  // Adapt response to expected structure for compatibility with tests
  const response = {
    totalAnnualRevenue: data.totalRevenue,
    totalDailyRevenue: data.totalRevenue / 365,
    revenueStreams: {
      sampleRepo: {
        amount: data.totalRevenue,
        accountNumber: 'N/A',
      },
    },
  };
  res.json(response);
});
