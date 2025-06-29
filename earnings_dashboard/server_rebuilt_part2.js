app.get('/api/earnings/download', (req, res) => {
  if (!fs.existsSync(revenueDataPath)) {
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
    'async function fetchEarnings() {',
    '  const response = await fetch("/api/earnings", { headers: { "Authorization": "Basic " + btoa("admin:securepassword") } });',
    '  if (!response.ok) {',
    '    document.getElementById("earnings").innerText = "Failed to load earnings data";',
    '    return;',
    '  }',
    '  const data = await response.json();',
    '  let html = "<h2>Total Annual Revenue: $" + data.totalAnnualRevenue.toLocaleString() + "</h2>";',
    '  html += "<h3>Total Daily Revenue: $" + data.totalDailyRevenue.toFixed(2) + "</h3>";',
    '  html += "<ul>";',
    '  for (const [stream, details] of Object.entries(data.revenueStreams)) {',
    '    html += "<li>" + stream + ": $" + details.amount.toLocaleString() + " (Account: " + details.accountNumber + ")</li>";',
    '  }',
    '  html += "</ul>";',
    '  document.getElementById("earnings").innerHTML = html;',
    '}',
    'fetchEarnings();',
    '</script>',
    '</body>',
    '</html>'
  ].join("");
  res.send(html);
});

const server = app.listen(PORT, () => {
  console.log(`Earnings dashboard running at http://localhost:${PORT}`);
});

module.exports = { app, server };
