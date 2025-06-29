
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const revenueStreams = {
  aiLicensing: 500000000,
  autonomousSecurity: 350000000,
  medicalDiagnostics: 250000000,
  climateModeling: 200000000,
  militaryAI: 300000000,
  dataStorage: 150000000,
  strategicConsulting: 100000000,
};

function interactiveUpdateRevenueStreams() {
  console.log('Update Revenue Streams');
  console.log('Current Revenue Streams:', JSON.stringify(revenueStreams, null, 2));

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const updatedRevenue = {};

  const keys = Object.keys(revenueStreams);
  let index = 0;

  function askNext() {
    if (index === keys.length) {
      console.log('Updated Revenue Data:');
      console.log(JSON.stringify(updatedRevenue, null, 2));
      rl.close();
      return;
    }
    const key = keys[index];
    rl.question(`Enter new value for ${key} (current: ${revenueStreams[key]}): `, (answer) => {
      const value = Number(answer);
      if (isNaN(value)) {
        console.log('Please enter a valid number.');
        askNext();
      } else {
        updatedRevenue[key] = value;
        index++;
        askNext();
      }
    });
  }

  askNext();
}

function updateRevenueData() {
  const revenueFilePath = path.resolve(__dirname, '../owlban_repos/sample_repo/revenue.json');
  if (!fs.existsSync(revenueFilePath)) {
    console.error('Revenue data file not found:', revenueFilePath);
    process.exit(1);
  }

  let revenueData;
  try {
    const fileContent = fs.readFileSync(revenueFilePath, 'utf-8');
    revenueData = JSON.parse(fileContent);
  } catch (error) {
    console.error('Error reading or parsing revenue data file:', error);
    throw error;
  }

  // Add detailed purchase data if missing
  if (!revenueData.purchases) {
    revenueData.purchases = {};
  }
  if (!Array.isArray(revenueData.purchases.autoFleetDetails)) {
    revenueData.purchases.autoFleetDetails = [
      {
        model: 'Model X',
        vin: 'VIN123456789',
        dealership: 'Main Dealership',
        cost: 50000,
        purchaseDate: '2023-01-01T00:00:00.000Z',
      },
    ];
  }
  if (!Array.isArray(revenueData.purchases.corporateHomesDetails)) {
    revenueData.purchases.corporateHomesDetails = [
      {
        address: '123 Corporate Blvd',
        city: 'Metropolis',
        state: 'CA',
        cost: 250000,
        purchaseDate: '2022-06-15T00:00:00.000Z',
      },
    ];
  }

  // Add revenueStreamsDetails if missing
  if (!revenueData.revenueStreamsDetails || typeof revenueData.revenueStreamsDetails !== 'object') {
    revenueData.revenueStreamsDetails = {};
  }
  Object.keys(revenueData.revenueStreams || {}).forEach((stream) => {
    if (!Array.isArray(revenueData.revenueStreamsDetails[stream])) {
      revenueData.revenueStreamsDetails[stream] = [
        {
          transactionId: 'TXN-000001',
          amount: revenueData.revenueStreams[stream].amount || 0,
          date: new Date().toISOString(),
          description: 'Initial transaction',
        },
      ];
    }
  });

  // Update totalRevenue by subtracting purchase costs
  const totalPurchaseCost =
    (revenueData.purchases.autoFleetDetails || []).reduce((sum, item) => sum + (item.cost || 0), 0) +
    (revenueData.purchases.corporateHomesDetails || []).reduce((sum, item) => sum + (item.cost || 0), 0);

  revenueData.totalRevenue = (revenueData.totalRevenue || 0) - totalPurchaseCost;

  // Write updated data back to file
  try {
    fs.writeFileSync(revenueFilePath, JSON.stringify(revenueData, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing updated revenue data file:', error);
    throw error;
  }
}

if (require.main === module) {
  interactiveUpdateRevenueStreams();
}

module.exports = {
  interactiveUpdateRevenueStreams,
  revenueStreams,
  updateRevenueData,
};
