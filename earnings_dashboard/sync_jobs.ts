import fetchAndSyncPayroll from './fetch_and_sync_payroll';
import updateRevenueData from './update_revenue_data';

export async function syncAllData(): Promise<void> {
  try {
    console.log('Starting full data synchronization...');
    await fetchAndSyncPayroll();
    await updateRevenueData();
    console.log('Full data synchronization completed successfully.');
  } catch (error) {
    console.error('Error during full data synchronization:', error);
  }
}

// Optionally, you can add scheduled sync using node-cron or similar here
// Example:
// import cron from 'node-cron';
// cron.schedule('0 * * * *', () => {
//   syncAllData();
// });
