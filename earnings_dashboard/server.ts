import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import basicAuth from 'express-basic-auth';

const app = express();
const PORT = 4000;

// Basic auth setup
app.use(basicAuth({
  users: { 'admin': 'securepassword' },
  challenge: true,
}));

app.use(cors());
app.use(express.json());

// Load aggregated revenue data from multi-repo aggregator output
const revenueDataPath = path.resolve(__dirname, '../owlban_repos/aggregated_revenue.json');

app.get('/api/earnings', (req, res) => {
  if (!fs.existsSync(revenueDataPath)) {
    return res.status(404).json({ error: 'Earnings data not found' });
  }
  const data = fs.readFileSync(revenueDataPath, 'utf-8');
  res.json(JSON.parse(data));
});

// Endpoint to download earnings report as JSON file
app.get('/api/earnings/download', (req, res) => {
  if (!fs.existsSync(revenueDataPath)) {
    return res.status(404).json({ error: 'Earnings data not found' });
  }
  res.download(revenueDataPath, 'earnings_report.json');
});

// Simple dashboard page
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>OWLban Earnings Dashboard</title></head>
      <body>
        <h1>OWLban Earnings Dashboard</h1>
        <div id="earnings"></div>
        <script>
          async function fetchEarnings() {
            const response = await fetch('/api/earnings', { headers: { 'Authorization': 'Basic ' + btoa('admin:securepassword') } });
            if (!response.ok) {
              document.getElementById('earnings').innerText = 'Failed to load earnings data';
              return;
            }
            const data = await response.json();
            let html = '<h2>Total Revenue: $' + data.totalRevenue.toLocaleString() + '</h2><ul>';
            for (const [repo, revenue] of Object.entries(data.perRepository)) {
              html += '<li>' + repo + ': $' + revenue.toLocaleString() + '</li>';
            }
            html += '</ul>';
            document.getElementById('earnings').innerHTML = html;
          }
          fetchEarnings();
        </script>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(\`Earnings dashboard running at http://localhost:\${PORT}\`);
});
