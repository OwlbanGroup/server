require('dotenv').config();
const express = require('express');
const cors = require('cors');
const basicAuth = require('express-basic-auth');
const morgan = require('morgan');
const compression = require('compression');
const WealthCreationEngine = require('../FOUR-ERA-AI/src/wealth-creation-engine-new').default;
const winston = require('winston');

const app = express();
const PORT = process.env.PORT || 4000;

// Basic authentication setup
const users = { [process.env.ADMIN_USER || 'admin']: process.env.ADMIN_PASS || 'securepassword' };
app.use(basicAuth({
  users,
  challenge: true,
}));

app.use(cors({
  origin: 'https://your-frontend-domain.com',
}));
app.use(express.json());
app.use(morgan('combined'));
app.use(express.static('public'));
app.use(compression());

// Instantiate WealthCreationEngine
const wealthEngine = new WealthCreationEngine();

app.get('/api/earnings', (req, res) => {
  try {
    const report = wealthEngine.getRevenueReport();
    res.json(report);
  } catch (error) {
    console.error('Error fetching earnings:', error);
    res.status(500).json({ error: 'Failed to fetch earnings data' });
  }
});

app.get('/api/earnings/download', (req, res) => {
  const report = wealthEngine.getRevenueReport();
  const json = JSON.stringify(report, null, 2);
  res.setHeader('Content-Disposition', 'attachment; filename="earnings_report.json"');
  res.setHeader('Content-Type', 'application/json');
  res.send(json);
});

app.get('/', (req, res) => {
  const html = [
    '<html>',
    '<head><title>OWLban Earnings Dashboard</title></head>',
    '<body>',
    '<h1>OWLban Earnings Dashboard</h1>',
    '<div id="earnings"></div>',
    '<script>',
    'async function fetchEarnings() {',
    '  const response = await fetch("/api/earnings", { headers: { "Authorization": "Basic " + btoa("admin:securepassword") } });',
    '  if (!response.ok) {',
    '    document.getElementById("earnings").innerText = "Failed to load earnings data";',
    '    return;',
    '  }',
    '  const data = await response.json();',
    '  let html = "<h2>Total Annual Revenue: $" + data.totalAnnualRevenue.toLocaleString() + "</h2>";',
    '  html += "<h3>Total Daily Revenue: $" + data.totalDailyRevenue.toLocaleString() + "</h3>";',
    '  html += "<h4>Revenue Streams:</h4><ul>";',
    '  for (const [key, value] of Object.entries(data.revenueStreams)) {',
    '    html += "<li>" + key + ": $" + value.toLocaleString() + "</li>";',
    '  }',
    '  html += "</ul>";',
    '  html += "<p>Revenue Trend: " + data.revenueTrend.toFixed(4) + "</p>";',
    '  html += "<p>Anomalies Detected: " + data.anomalies.length + "</p>";',
    '  document.getElementById("earnings").innerHTML = html;',
    '}',
    'fetchEarnings();',
    '</script>',
    '</body>',
    '</html>'
  ].join("");
  res.send(html);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Earnings dashboard running at http://localhost:${PORT}`);
});

const NODE_ENV = process.env.NODE_ENV || 'development';
if (NODE_ENV === 'production') {
  console.log('Running in production mode');
});
