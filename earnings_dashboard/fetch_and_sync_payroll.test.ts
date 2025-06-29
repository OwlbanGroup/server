import fs from 'fs';
import path from 'path';
import { jest } from '@jest/globals';
import PayrollIntegration, { PayrollResponse } from '../payroll_integration';
import fetchAndSyncPayroll from './fetch_and_sync_payroll';

jest.mock('fs');

const revenueDataPath = path.resolve(__dirname, '../owlban_repos/sample_repo/revenue.json');

describe('fetch_and_sync_payroll', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should exit if environment variables are missing', async () => {
    process.env.DYNAMICS365_BASE_URL = '';
    process.env.DYNAMICS365_ACCESS_TOKEN = '';
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit'); });

    try {
      await fetchAndSyncPayroll();
    } catch (error) {
      // Fix for "Object is of type 'unknown'" error by type guard
      if (error instanceof Error) {
        expect(error.message).toBe('process.exit');
      } else {
        throw new Error(String(error));
      }
    }

    expect(consoleErrorSpy).toHaveBeenCalledWith('Dynamics365 base URL or access token is not set in environment variables.');
    expect(processExitSpy).toHaveBeenCalledWith(1);

    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it('should update revenue data with payroll information', async () => {
    process.env.DYNAMICS365_BASE_URL = 'https://fakeurl.com';
    process.env.DYNAMICS365_ACCESS_TOKEN = 'fake-token';

    const mockRevenueData = {
      totalRevenue: 1000000,
      purchases: {
        corporateHomes: 0,
        autoFleet: 0
      }
    };

    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockRevenueData));
    const writeFileSyncMock = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

    // Import the actual PayrollIntegration class
    const ActualPayrollIntegration = (jest.requireActual('../payroll_integration') as { default: typeof PayrollIntegration }).default;

    // Create a mocked instance of PayrollIntegration
    const mockGetEmployeePayroll = jest.fn(async (employeeId: string): Promise<PayrollResponse> => {
      return {
        success: true,
        message: 'Payroll data fetched',
        data: { salary: 50000 }
      };
    });

    // Fix for "Argument of type 'PayrollResponse' is not assignable to parameter of type 'never'" error
    jest.spyOn(ActualPayrollIntegration.prototype, 'getEmployeePayroll').mockImplementation(mockGetEmployeePayroll);

    await fetchAndSyncPayroll();

    expect(mockGetEmployeePayroll).toHaveBeenCalled();
    expect(writeFileSyncMock).toHaveBeenCalled();

    writeFileSyncMock.mockRestore();
  });
});
