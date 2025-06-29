const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const basicAuth = require('express-basic-auth');

const app = express();
const PORT = process.env.PORT || 4000;
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'securepassword';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Basic authentication setup
app.use(basicAuth({
  users: { [ADMIN_USER]: ADMIN_PASS },
  challenge: true,
}));

app.use(cors({
  origin: CORS_ORIGIN,
}));
app.use(express.json());

// Resolve the directory name for ES module compatibility
const revenueDataPath = path.resolve(__dirname, '../owlban_repos/aggregated_revenue.json');

app.get('/api/earnings', async (req, res) => {
  try {
    await fs.access(revenueDataPath);
  } catch {
    return res.status(404).json({ error: 'Earnings data not found' });
  }
  try {
    const data = await fs.readFile(revenueDataPath, 'utf-8');
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: 'Failed to read earnings data' });
  }
});

app.get('/api/earnings/download', async (req, res) => {
  try {
    await fs.access(revenueDataPath);
  } catch {
    return res.status(404).json({ error: 'Earnings data not found' });
  }
  res.download(revenueDataPath, 'earnings_report.json');
});

app.get('/', (req, res) => {
  const html = [
    '<html>',
    '<head><title>OWLban Earnings Dashboard</title></head>',
    '<body>',
    '<h1>OWLban Earnings Dashboard</h1>',
    '<div id="earnings"></div>',
    '<script>',
    `async function fetchEarnings() {
      const response = await fetch("/api/earnings", { headers: { "Authorization": "Basic " + btoa("${ADMIN_USER}:${ADMIN_PASS}") } });
      if (!response.ok) {
        document.getElementById("earnings").innerText = "Failed to load earnings data";
        return;
      }
      const data = await response.json();
      let html = "<h2>Total Revenue: $" + data.totalRevenue.toLocaleString() + "</h2><ul>";
      for (const [repo, revenue] of Object.entries(data.perRepository)) {
        html += "<li>" + repo + ": $" + revenue.toLocaleString() + "</li>";
      }
      html += "</ul>";
      document.getElementById("earnings").innerHTML = html;
    }
    fetchEarnings();`,
    '</script>',
    '</body>',
    '</html>'
  ].join("");
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`Earnings dashboard running at http://localhost:${PORT}`);
});
