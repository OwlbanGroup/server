const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const basicAuth = require('express-basic-auth');
const { syncAllData } = require('./sync_jobs.ts');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(basicAuth({
  users: { 'admin': 'securepassword' },
  challenge: true,
  unauthorizedResponse: (req) => {
    return req.auth
      ? 'Credentials rejected'
      : 'No credentials provided'
  }
}));

app.use(cors());
app.use(express.json());

// Use the existing revenue.json file path
const revenueDataPath = path.resolve(__dirname, '../owlban_repos/sample_repo/revenue.json');

function readRevenueData() {
  if (!fs.existsSync(revenueDataPath)) {
    return null;
  }
  const data = JSON.parse(fs.readFileSync(revenueDataPath, 'utf-8'));
  // Initialize purchase data if not present
  if (!data.purchases) {
    data.purchases = {
      corporateHomes: 0,
      autoFleet: 0,
      autoFleetDetails: []
    };
  }
  return data;
}

function writeRevenueData(data) {
  fs.writeFileSync(revenueDataPath, JSON.stringify(data, null, 2), 'utf-8');
}

function getEarningsData() {
  const data = readRevenueData();
  if (!data) {
    return null;
  }
  // Use real revenue streams from data
  return {
    totalAnnualRevenue: data.totalRevenue,
    totalDailyRevenue: data.totalRevenue / 365,
    revenueStreams: data.revenueStreams || {},
    purchases: data.purchases
  };
}

app.get('/api/earnings', (req, res) => {
  const earnings = getEarningsData();
  if (!earnings) {
    return res.status(404).json({ error: 'Earnings data not found' });
  }
  res.json(earnings);
});

app.post('/api/purchase/home', (req, res) => {
  const data = readRevenueData();
  if (!data) {
    return res.status(404).json({ error: 'Revenue data not found' });
  }
  const cost = req.body.cost;
  if (typeof cost !== 'number' || cost <= 0) {
    return res.status(400).json({ error: 'Invalid cost value' });
  }
  if (data.totalRevenue < cost) {
    return res.status(400).json({ error: 'Insufficient revenue to make this purchase' });
  }
  data.totalRevenue -= cost;
  data.purchases.corporateHomes += cost;
  writeRevenueData(data);
  res.json({ message: 'Corporate home purchased successfully', remainingRevenue: data.totalRevenue, purchases: data.purchases });
});

app.post('/api/purchase/auto', (req, res) => {
  const data = readRevenueData();
  if (!data) {
    return res.status(404).json({ error: 'Revenue data not found' });
  }
  const { cost, model, vin, dealership } = req.body;
  if (typeof cost !== 'number' || cost <= 0) {
    return res.status(400).json({ error: 'Invalid cost value' });
  }
  if (!model || !vin || !dealership) {
    return res.status(400).json({ error: 'Missing required car details: model, vin, dealership' });
  }
  if (data.totalRevenue < cost) {
    return res.status(400).json({ error: 'Insufficient revenue to make this purchase' });
  }
  data.totalRevenue -= cost;
  data.purchases.autoFleet += cost;
  if (!data.purchases.autoFleetDetails) {
    data.purchases.autoFleetDetails = [];
  }
  // Generate a simple receipt ID (could be improved with UUID)
  const receiptId = 'RCPT-' + Date.now();
  const purchaseDate = new Date().toISOString();
  const receipt = {
    receiptId,
    model,
    vin,
    dealership,
    cost,
    purchaseDate
  };
  data.purchases.autoFleetDetails.push({ model, vin, dealership, cost, purchaseDate, deliveryStatus: 'pending', deliveryDate: null, deliveryAddress: null, receipt });
  writeRevenueData(data);
  res.json({ message: 'Auto fleet purchased successfully', remainingRevenue: data.totalRevenue, purchases: data.purchases, receipt });
});

// New endpoint to mark a car as delivered
app.post('/api/delivery/mark-delivered', (req, res) => {
  const data = readRevenueData();
  if (!data) {
    return res.status(404).json({ error: 'Revenue data not found' });
  }
  const { vin, deliveryDate, deliveryAddress } = req.body;
  if (!vin) {
    return res.status(400).json({ error: 'Missing VIN for delivery update' });
  }
  const car = data.purchases.autoFleetDetails.find(c => c.vin === vin);
  if (!car) {
    return res.status(404).json({ error: 'Car with specified VIN not found' });
  }
  car.deliveryStatus = 'delivered';
  car.deliveryDate = deliveryDate || new Date().toISOString();
  car.deliveryAddress = deliveryAddress || car.deliveryAddress || null;
  writeRevenueData(data);
  res.json({ message: 'Car marked as delivered', car });
});

// Endpoint to get delivery status of all cars
app.get('/api/delivery/status', (req, res) => {
  const data = readRevenueData();
  if (!data) {
    return res.status(404).json({ error: 'Revenue data not found' });
  }
  res.json({ autoFleetDetails: data.purchases.autoFleetDetails });
});

app.get('/api/earnings/download', (req, res) => {
  const earnings = getEarningsData();
  if (!earnings) {
    return res.status(404).json({ error: 'Earnings data not found' });
  }
  res.setHeader('Content-Disposition', 'attachment; filename="earnings_report.json"');
  res.json(earnings);
});

// New API endpoint to get combined fleet and payroll report
app.get('/api/report/fleet-payroll', (req, res) => {
  const data = readRevenueData();
  if (!data) {
    return res.status(404).json({ error: 'Revenue data not found' });
  }
  const fleetDetails = data.purchases.autoFleetDetails || [];
  const payrollData = data.payroll || [];
  const totalFleetCost = data.purchases.autoFleet || 0;
  const totalPayrollAmount = payrollData.reduce((sum, entry) => sum + (entry.amount || 0), 0);
  const deliveredCars = fleetDetails.filter(car => car.deliveryStatus === 'delivered').length;
  const pendingCars = fleetDetails.length - deliveredCars;

  res.json({
    totalFleetCost,
    totalPayrollAmount,
    deliveredCars,
    pendingCars,
    fleetDetails,
    payrollData
  });
});

// New API endpoint to trigger synchronization of all data
app.post('/api/sync/all', async (req, res) => {
  try {
    await syncAllData();
    res.status(200).json({ message: 'Data synchronization completed successfully' });
  } catch (error) {
    console.error('Error during data synchronization:', error);
    res.status(500).json({ error: 'Data synchronization failed' });
  }
});

app.get('/', (req, res) => {
  const html = [
    '<html>',
    '<head><title>OWLban Earnings Dashboard</title></head>',
    '<body>',
    '<h1>OWLban Earnings Dashboard</h1>',
    '<div id="earnings"></div>',
    '<div id="purchases"></div>',
    '<h2>Purchase Corporate Homes</h2>',
    '<input type="number" id="homeCost" placeholder="Enter cost" min="1" />',
    '<button onclick="purchaseHome()">Purchase Home</button>',
    '<h2>Purchase Auto Fleet</h2>',
    '<input type="number" id="autoCost" placeholder="Enter cost" min="1" />',
    '<input type="text" id="autoModel" placeholder="Enter car model" />',
    '<input type="text" id="autoVIN" placeholder="Enter VIN" />',
    '<input type="text" id="autoDealership" placeholder="Enter dealership" />',
    '<button onclick="purchaseAuto()">Purchase Auto Fleet</button>',
    '<h2>Fleet Delivery Status</h2>',
    '<div id="deliveryStatus"></div>',
    '<h3>Mark Car as Delivered</h3>',
    '<input type="text" id="deliveryVIN" placeholder="Enter VIN" />',
    '<input type="date" id="deliveryDate" />',
    '<input type="text" id="deliveryAddress" placeholder="Enter delivery address" />',
    '<button onclick="markDelivered()">Mark Delivered</button>',
    '<h2>Data Synchronization</h2>',
    '<button onclick="syncAll()">Sync All Data</button>',
    '<script>',
    'async function fetchEarnings() {',
    '  const response = await fetch("/api/earnings");',
    '  if (!response.ok) {',
    '    document.getElementById("earnings").innerText = "Failed to load earnings data";',
    '    return;',
    '  }',
    '  const data = await response.json();',
    '  let html = "<h2>Total Annual Revenue: $" + data.totalAnnualRevenue.toLocaleString() + "</h2>";',
    '  html += "<h3>Total Daily Revenue: $" + data.totalDailyRevenue.toFixed(2) + "</h3>";',
    '  html += "<ul>";',
    '  for (const [stream, details] of Object.entries(data.revenueStreams)) {',
    '    html += "<li>" + stream + ": $" + details.amount.toLocaleString() + " (Account: " + (details.accountNumber || "N/A") + ", Routing Number: " + (details.routingNumber || "N/A") + ")</li>";',
    '  }',
    '  html += "</ul>";',
    '  html += "<h3>Purchases:</h3>";',
    '  html += "<ul>";',
    '  html += "<li>Corporate Homes: $" + data.purchases.corporateHomes.toLocaleString() + "</li>";',
    '  html += "<li>Auto Fleet: $" + data.purchases.autoFleet.toLocaleString() + "</li>";',
    '  html += "</ul>";',
    '  if (data.purchases.autoFleetDetails && data.purchases.autoFleetDetails.length > 0) {',
    '    html += "<h3>Purchased Cars:</h3>";',
    '    html += "<ul>";',
    '    data.purchases.autoFleetDetails.forEach(car => {',
    '      html += `<li>Model: ${car.model}, VIN: ${car.vin}, Dealership: ${car.dealership}, Cost: $${car.cost.toLocaleString()}, Purchased on: ${new Date(car.purchaseDate).toLocaleDateString()}, Delivery Status: ${car.deliveryStatus}${car.deliveryDate ? ", Delivered on: " + new Date(car.deliveryDate).toLocaleDateString() : ""}${car.deliveryAddress ? ", Delivery Address: " + car.deliveryAddress : ""}</li>`;',
    '    });',
    '    html += "</ul>";',
    '  }',
    '  document.getElementById("earnings").innerHTML = html;',
    '}',
    'async function purchaseHome() {',
    '  const cost = parseFloat(document.getElementById("homeCost").value);',
    '  if (isNaN(cost) || cost <= 0) {',
    '    alert("Please enter a valid cost for the home purchase.");',
    '    return;',
    '  }',
    '  const response = await fetch("/api/purchase/home", {',
    '    method: "POST",',
    '    headers: {',
    '      "Content-Type": "application/json"',
    '    },',
    '    body: JSON.stringify({ cost })',
    '  });',
    '  const result = await response.json();',
    '  if (response.ok) {',
    '    alert(result.message);',
    '    fetchEarnings();',
    '  } else {',
    '    alert("Error: " + result.error);',
    '  }',
    '}',
    'async function purchaseAuto() {',
    '  const cost = parseFloat(document.getElementById("autoCost").value);',
    '  const model = document.getElementById("autoModel").value.trim();',
    '  const vin = document.getElementById("autoVIN").value.trim();',
    '  const dealership = document.getElementById("autoDealership").value.trim();',
    '  if (isNaN(cost) || cost <= 0) {',
    '    alert("Please enter a valid cost for the auto fleet purchase.");',
    '    return;',
    '  }',
    '  if (!model || !vin || !dealership) {',
    '    alert("Please enter all car details: model, VIN, and dealership.");',
    '    return;',
    '  }',
    '  const response = await fetch("/api/purchase/auto", {',
    '    method: "POST",',
    '    headers: {',
    '      "Content-Type": "application/json"',
    '    },',
    '    body: JSON.stringify({ cost, model, vin, dealership })',
    '  });',
    '  const result = await response.json();',
    '  if (response.ok) {',
    '    alert(result.message);',
    '    fetchEarnings();',
    '  } else {',
    '    alert("Error: " + result.error);',
    '  }',
    '}',
    'async function fetchDeliveryStatus() {',
    '  const response = await fetch("/api/delivery/status");',
    '  if (!response.ok) {',
    '    document.getElementById("deliveryStatus").innerText = "Failed to load delivery status";',
    '    return;',
    '  }',
    '  const data = await response.json();',
    '  let html = "<h3>Fleet Delivery Status</h3><ul>";',
    '  data.autoFleetDetails.forEach(car => {',
    '    html += `<li>Model: ${car.model}, VIN: ${car.vin}, Delivery Status: ${car.deliveryStatus}${car.deliveryDate ? ", Delivered on: " + new Date(car.deliveryDate).toLocaleDateString() : ""}${car.deliveryAddress ? ", Delivery Address: " + car.deliveryAddress : ""}</li>`;',
    '  });',
    '  html += "</ul>";',
    '  document.getElementById("deliveryStatus").innerHTML = html;',
    '}',
    'async function markDelivered() {',
    '  const vin = document.getElementById("deliveryVIN").value.trim();',
    '  const deliveryDate = document.getElementById("deliveryDate").value;',
    '  const deliveryAddress = document.getElementById("deliveryAddress").value.trim();',
    '  if (!vin) {',
    '    alert("Please enter the VIN of the car to mark as delivered.");',
    '    return;',
    '  }',
    '  const response = await fetch("/api/delivery/mark-delivered", {',
    '    method: "POST",',
    '    headers: {',
    '      "Content-Type": "application/json"',
    '    },',
    '    body: JSON.stringify({ vin, deliveryDate, deliveryAddress })',
    '  });',
    '  const result = await response.json();',
    '  if (response.ok) {',
    '    alert(result.message);',
    '    fetchDeliveryStatus();',
    '    fetchEarnings();',
    '  } else {',
    '    alert("Error: " + result.error);',
    '  }',
    '}',
    'async function syncAll() {',
    '  const response = await fetch("/api/sync/all", { method: "POST" });',
    '  const result = await response.json();',
    '  if (response.ok) {',
    '    alert(result.message);',
    '    fetchEarnings();',
    '  } else {',
    '    alert("Error: " + result.error);',
    '  }',
    '}',
    'fetchEarnings();',
    'fetchDeliveryStatus();',
    '</script>',
    '</body>',
    '</html>'
  ].join("");
  res.send(html);
});

const HOST = '0.0.0.0'; // Listen on all network interfaces

const server = app.listen(PORT, HOST, () => {
  console.log(`Earnings dashboard running at http://${HOST}:${PORT}`);
});

module.exports = { app, server };
