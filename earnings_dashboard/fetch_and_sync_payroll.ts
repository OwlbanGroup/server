
import fs from 'fs';
import path from 'path';
import PayrollIntegration from '../payroll_integration';
import { fetchEmployeeIds } from './fetch_employee_ids';

interface PayrollData {
  employeeId: string;
  amount: number;
  date: string;
  taxRate?: number;
  deductions?: number;
  bonuses?: number;
}

const revenueDataPath = path.resolve(__dirname, '../owlban_repos/sample_repo/revenue.json');

async function fetchAndSyncPayroll(): Promise<void> {
  const baseUrl = process.env.DYNAMICS365_BASE_URL;
  const accessToken = process.env.DYNAMICS365_ACCESS_TOKEN;

  if (!baseUrl || !accessToken) {
    console.error('Dynamics365 base URL or access token is not set in environment variables.');
    process.exit(1);
  }

  // Fetch employee IDs dynamically
  const employeeIds = await fetchEmployeeIds();

  const payrollIntegration = new PayrollIntegration(baseUrl, accessToken);
  const payrollDataList: PayrollData[] = [];

  for (const employeeId of employeeIds) {
    try {
      const response = await payrollIntegration.getEmployeePayroll(employeeId);
      if (response.success && response.data) {
        payrollDataList.push({
          employeeId,
          amount: response.data.salary,
          taxRate: response.data.taxRate,
          deductions: response.data.deductions,
          bonuses: response.data.bonuses,
          date: new Date().toISOString(),
        });
      } else {
        console.warn(`Payroll data for employee ${employeeId} could not be fetched and will be skipped.`);
      }
    } catch (error) {
      console.warn(`Payroll data for employee ${employeeId} could not be fetched and will be skipped.`);
    }
  }

  if (payrollDataList.length === 0) {
    console.warn('No payroll data was fetched. Revenue data will not be updated.');
    return;
  }

  // Read existing revenue data
  let revenueData: any = {};
  try {
    const fileContent = fs.readFileSync(revenueDataPath, 'utf-8');
    revenueData = JSON.parse(fileContent);
  } catch (error) {
    console.warn('Failed to read existing revenue data, starting with empty object.');
  }

  // Update revenue data with payroll data
  revenueData.payroll = payrollDataList;

  // Write updated revenue data back to file
  try {
    fs.writeFileSync(revenueDataPath, JSON.stringify(revenueData, null, 2), 'utf-8');
    console.log('Revenue data updated successfully with payroll data.');
  } catch (error) {
    console.error('Failed to write updated revenue data:', error);
  }
}

export default fetchAndSyncPayroll;

// Run the sync only if this module is the main module
if (require.main === module) {
  fetchAndSyncPayroll();
}
