require('dotenv').config();
const express = require('express');
const cors = require('cors');
const basicAuth = require('express-basic-auth');
const morgan = require('morgan');
const compression = require('compression');
const WealthCreationEngine = require('../FOUR-ERA-AI/src/wealth-creation-engine-new.cjs').default;
const TemporalProfitAnalyzer = require('../FOUR-ERA-AI/src/temporal-profit-analyzer.js').default;
const winston = require('winston');
const PayrollIntegration = require('../payroll_integration').default;
const PerformanceTracker = require('../FOUR-ERA-AI/performance-tracker');
const EnhancedBlackboxTrainer = require('../FOUR-ERA-AI/blackbox-trainer-complete').default;

const updateRevenueData = require('./update_revenue_data').default || require('./update_revenue_data');
const fetchAndSyncPayroll = require('./fetch_and_sync_payroll').default || require('./fetch_and_sync_payroll');

const AIAgentManager = require('../FOUR-ERA-AI/src/ai-agent-manager');

const app = express();
const PORT = process.env.PORT || 4000;

// Basic authentication setup
const users = { [process.env.ADMIN_USER || 'admin']: process.env.ADMIN_PASS || 'securepassword' };
app.use(basicAuth({
  users,
  challenge: true,
}));

// Initialize PayrollIntegration
const payrollIntegration = new PayrollIntegration(
  process.env.DYNAMICS365_BASE_URL || 'https://your-dynamics365-instance.api.crm.dynamics.com/api/data/v9.1',
  process.env.DYNAMICS365_ACCESS_TOKEN || 'your_access_token'
);

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://your-frontend-domain.com',
}));
app.use(express.json());
app.use(morgan('combined'));
app.use(express.static('public'));
app.use(compression());

// Instantiate WealthCreationEngine
const wealthEngine = new WealthCreationEngine();
app.locals.wealthEngine = wealthEngine;

// Load project revenue data and update wealthEngine revenue streams
const fs = require('fs').promises;
const path = require('path');

async function loadProjectRevenueData() {
  try {
    const dataPath = path.resolve(__dirname, '../earnings_report.json');
    const dataRaw = await fs.readFile(dataPath, 'utf-8');
    const projectRevenueData = JSON.parse(dataRaw);
    if (projectRevenueData && projectRevenueData.revenueStreams) {
      wealthEngine.updateRevenue(projectRevenueData.revenueStreams);
      console.log('Project revenue data loaded and applied to wealthEngine');
    } else {
      console.warn('Project revenue data missing or invalid');
    }
  } catch (error) {
    console.error('Error loading project revenue data:', error);
  }
}

loadProjectRevenueData();

// Instantiate PerformanceTracker
const performanceTracker = new PerformanceTracker(['efficiency', 'precision', 'stability'], {
  efficiency: 0.7,
  precision: 0.7,
  stability: 0.7,
});

// Instantiate EnhancedBlackboxTrainer
const blackboxTrainer = new EnhancedBlackboxTrainer({});

// Cache for revenue report
let cachedReport = null;
let cacheTimestamp = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes cache duration

// Account numbers mapping for revenue streams
const accountNumbers = {
  aiLicensing: "ACCT1001",
  autonomousSecurity: "ACCT1002",
  medicalDiagnostics: "ACCT1003",
  climateModeling: "ACCT1004",
  militaryAI: "ACCT1005",
  dataStorage: "ACCT1006",
  strategicConsulting: "ACCT1007",
  "David Leeper": "ACCT1008",
  "Sandra Broome Edwards": "ACCT1009",
};

/**
 * Route 1001: Get earnings report with caching and performance logging
 */
app.get('/api/earnings', async (req, res) => {
  console.log('Route 1001 accessed: GET /api/earnings');
  const startTime = Date.now();
  try {
    if (!cachedReport || (Date.now() - cacheTimestamp) > CACHE_DURATION_MS) {
      // Refresh cache
      cachedReport = await Promise.resolve(wealthEngine.getRevenueReport());
      cacheTimestamp = Date.now();
    }
    // Add account numbers to revenue streams
    const revenueStreamsWithAccounts = {};
    for (const [key, value] of Object.entries(cachedReport.revenueStreams)) {
      revenueStreamsWithAccounts[key] = {
        amount: value,
        accountNumber: accountNumbers[key] || null,
      };
    }
    const reportWithAccounts = {
      ...cachedReport,
      revenueStreams: revenueStreamsWithAccounts,
    };
    res.status(200).json(reportWithAccounts);
    const duration = Date.now() - startTime;
    console.log(`GET /api/earnings processed in ${duration}ms`);
  } catch (error) {
    console.error('Error fetching earnings:', error);
    res.status(500).json({ error: 'Failed to fetch earnings data' });
  }
});

/**
 * New Route: Microsoft Chat/Profile Authentication Redirect Handler
 */
app.get('/microsoft/chat', async (req, res) => {
  try {
    const { auth, origin, origindomain, redirectOrgId, redirectUserId } = req.query;
    console.log('Microsoft chat/profile auth redirect received:', req.query);

    // Implement a simple token exchange simulation for demonstration
    if (!auth) {
      return res.status(400).json({ error: 'Missing auth parameter' });
    }

    // Simulate token exchange or authentication flow
    const token = `token-for-${auth}`;

    res.status(200).json({
      message: 'Microsoft chat/profile authentication redirect handled successfully',
      token,
      origin,
      origindomain,
      redirectOrgId,
      redirectUserId,
    });
  } catch (error) {
    console.error('Error handling Microsoft chat/profile auth redirect:', error);
    res.status(500).json({ error: 'Failed to handle Microsoft chat/profile auth redirect' });
  }
});

/**
 * Route 1002: Download earnings report JSON
 */
app.get('/api/earnings/download', (req, res) => {
  console.log('Route 1002 accessed: GET /api/earnings/download');
  try {
    const report = wealthEngine.getRevenueReport();
    // Add account numbers to revenue streams
    const revenueStreamsWithAccounts = {};
    for (const [key, value] of Object.entries(report.revenueStreams)) {
      revenueStreamsWithAccounts[key] = {
        amount: value,
        accountNumber: accountNumbers[key] || null,
      };
    }
    const reportWithAccounts = {
      ...report,
      revenueStreams: revenueStreamsWithAccounts,
    };
    const json = JSON.stringify(reportWithAccounts, null, 2);
    res.setHeader('Content-Disposition', 'attachment; filename="earnings_report.json"');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(json);
  } catch (error) {
    console.error('Error fetching earnings for download:', error);
    res.status(500).json({ error: 'Failed to fetch earnings data for download' });
  }
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
  '  const adminUser = "' + (process.env.ADMIN_USER || "admin") + '";',
  '  const adminPass = "' + (process.env.ADMIN_PASS || "securepassword") + '";',
  '  const response = await fetch("/api/earnings", { headers: { "Authorization": "Basic " + btoa(adminUser + ":" + adminPass) } });',
  '  if (!response.ok) {',
  '    document.getElementById("earnings").innerText = "Failed to load earnings data";',
  '    return;',
  '  }',
  '  const data = await response.json();',
  '  let html = "<h2>Total Annual Revenue: $" + data.totalAnnualRevenue.toLocaleString() + "</h2>";',
  '  html += "<h3>Total Daily Revenue: $" + data.totalDailyRevenue.toLocaleString() + "</h3>";',
  '  html += "<h4>Revenue Streams:</h4><ul>";',
  '  for (const [key, value] of Object.entries(data.revenueStreams)) {',
  '    html += "<li>" + key + ": $" + value.amount.toLocaleString() + " (Account: " + value.accountNumber + ")</li>";',
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
  res.status(200).send(html);
});

/**
 * Route 1003: Get performance metrics
 */
app.get('/api/performance', (req, res) => {
  try {
    const results = performanceTracker.getResults();
    res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({ error: 'Failed to fetch performance metrics' });
  }
});

/**
 * Route 1004: Get training progress
 */
app.get('/api/training-progress', async (req, res) => {
  try {
    const trainingData = await blackboxTrainer.loadTrainingData();
    const trainResult = await blackboxTrainer.train();
    res.status(200).json(trainResult);
  } catch (error) {
    console.error('Error fetching training progress:', error);
    res.status(500).json({ error: 'Failed to fetch training progress' });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Earnings dashboard running at http://0.0.0.0:${PORT}`);
  console.log('Environment Variables:', {
    PORT,
    ADMIN_USER: process.env.ADMIN_USER,
    ADMIN_PASS: process.env.ADMIN_PASS,
    NODE_ENV: process.env.NODE_ENV,
  });

  // Initialize and sync project revenue data on server start
  try {
    const agentManager = new AIAgentManager();
    const result = await agentManager.syncProjectRevenueData();
    console.log(result);
  } catch (error) {
    console.error('Error syncing project revenue data on startup:', error);
  }
});

// New API endpoint to update revenue data
app.get('/api/update/revenue', async (req, res) => {
  try {
    await updateRevenueData();
    res.status(200).json({ message: 'Revenue data updated successfully' });
  } catch (error) {
    console.error('Error updating revenue data:', error);
    res.status(500).json({ error: 'Failed to update revenue data' });
  }
});

// New API endpoint to update payroll data
app.get('/api/update/payroll', async (req, res) => {
  try {
    await fetchAndSyncPayroll();
    res.status(200).json({ message: 'Payroll data updated successfully' });
  } catch (error) {
    console.error('Error updating payroll data:', error);
    res.status(500).json({ error: 'Failed to update payroll data' });
  }
});

// New API endpoint to update both revenue and payroll data sequentially
app.get('/api/update/all', async (req, res) => {
  try {
    await updateRevenueData();
    await fetchAndSyncPayroll();
    res.status(200).json({ message: 'Revenue and payroll data updated successfully' });
  } catch (error) {
    console.error('Error updating all data:', error);
    res.status(500).json({ error: 'Failed to update all data' });
  }
});

// New API endpoint to update project revenue data by syncing to Copilot agent
app.get('/api/update/project-revenue', async (req, res) => {
  try {
    const agentManager = new (require('../FOUR-ERA-AI/src/ai-agent-manager'))();
    const result = await agentManager.syncProjectRevenueData();
    res.status(200).json({ message: result });
  } catch (error) {
    console.error('Error updating project revenue data:', error);
    res.status(500).json({ error: 'Failed to update project revenue data' });
  }
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const NODE_ENV = process.env.NODE_ENV || 'development';
if (NODE_ENV === 'production') {
  console.log('Running in production mode');
}

module.exports = { app, server };

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.Console(),
  ],
});
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});
