import fs from 'fs';
import path from 'path';

const revenueDataPath = path.resolve(__dirname, '../owlban_repos/sample_repo/revenue.json');

function updateRevenueData() {
  if (!fs.existsSync(revenueDataPath)) {
    console.error('Revenue data file not found at', revenueDataPath);
    return; // Changed from process.exit(1) to return to avoid abrupt exit during tests
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(revenueDataPath, 'utf-8'));
  } catch (error) {
    console.error('Failed to parse revenue data JSON:', error);
    return;
  }

  // Ensure purchases object exists
  if (!data.purchases) {
    data.purchases = {
      corporateHomes: 0,
      corporateHomesDetails: [],
      autoFleet: 0,
      autoFleetDetails: []
    };
  } else {
    // Ensure autoFleetDetails array exists
    if (!Array.isArray(data.purchases.autoFleetDetails)) {
      data.purchases.autoFleetDetails = [];
    }
    // Ensure corporateHomesDetails array exists
    if (!Array.isArray(data.purchases.corporateHomesDetails)) {
      data.purchases.corporateHomesDetails = [];
    }
  }

  // Add a sample auto fleet purchase if none exist
  if (data.purchases.autoFleetDetails.length === 0) {
    data.purchases.autoFleetDetails.push({
      model: 'Sample Model',
      vin: 'SAMPLEVIN123456789',
      dealership: 'Sample Dealership',
      cost: 50000,
      purchaseDate: new Date().toISOString()
    });
    data.purchases.autoFleet += 50000;
    data.totalRevenue -= 50000;
  }

  // Add a sample corporate home purchase if none exist
  if (data.purchases.corporateHomesDetails.length === 0) {
    data.purchases.corporateHomesDetails.push({
      address: '123 Corporate Blvd',
      city: 'Metropolis',
      state: 'CA',
      cost: 250000,
      purchaseDate: new Date().toISOString()
    });
    data.purchases.corporateHomes += 250000;
    data.totalRevenue -= 250000;
  }

  // Ensure revenueStreamsDetails object exists
  if (!data.revenueStreamsDetails) {
    data.revenueStreamsDetails = {};
  }

  // Add sample transaction details for each revenue stream if missing
  if (!data.revenueStreams) {
    data.revenueStreams = {};
  }
  for (const streamName of Object.keys(data.revenueStreams)) {
    if (!Array.isArray(data.revenueStreamsDetails[streamName])) {
      data.revenueStreamsDetails[streamName] = [];
    }
    if (data.revenueStreamsDetails[streamName].length === 0) {
      data.revenueStreamsDetails[streamName].push({
        transactionId: `TXN-${Math.floor(Math.random() * 1000000)}`,
        amount: data.revenueStreams[streamName].amount,
        date: new Date().toISOString(),
        description: `Initial transaction for ${streamName}`
      });
    }
  }

  // Integrate payroll data if present
  if (Array.isArray(data.payroll)) {
    let payrollTotal = 0;
    for (const payrollEntry of data.payroll) {
      if (typeof payrollEntry.amount === 'number') {
        payrollTotal += payrollEntry.amount;
      }
    }
    data.payrollTotal = payrollTotal;
    console.log(`Integrated payroll data total amount: ${payrollTotal}`);
  }

  fs.writeFileSync(revenueDataPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log('Revenue data updated with enhanced detailed purchase, revenue stream, and payroll information.');
}

export default updateRevenueData;
