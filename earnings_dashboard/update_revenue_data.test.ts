const fs = require('fs');
const path = require('path');

const revenueDataPath = path.resolve(__dirname, '../owlban_repos/sample_repo/revenue.json');

describe('update_revenue_data', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should update revenue.json with detailed purchase data', () => {
    const originalData = {
      totalRevenue: 1000000,
      purchases: {
        corporateHomes: 100000,
        autoFleet: 0
      },
      revenueStreams: {
        "Sample Repo": {
          amount: 500000,
          accountNumber: "111111111",
          routingNumber: "222222222"
        }
      }
    };

    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(originalData));
    const writeFileSyncMock = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

    // Import and run the update script
    const updateRevenueData = require('./update_revenue_data').default || require('./update_revenue_data');
    updateRevenueData();

    expect(writeFileSyncMock).toHaveBeenCalled();

    const updatedData = JSON.parse((writeFileSyncMock.mock.calls[0][1] as string).toString());
    expect(updatedData.purchases.autoFleetDetails).toBeDefined();
    expect(Array.isArray(updatedData.purchases.autoFleetDetails)).toBe(true);
    expect(updatedData.purchases.autoFleetDetails.length).toBeGreaterThan(0);

    expect(updatedData.purchases.corporateHomesDetails).toBeDefined();
    expect(Array.isArray(updatedData.purchases.corporateHomesDetails)).toBe(true);
    expect(updatedData.purchases.corporateHomesDetails.length).toBeGreaterThan(0);

    expect(updatedData.revenueStreamsDetails).toBeDefined();
    expect(typeof updatedData.revenueStreamsDetails).toBe('object');
    expect(Object.keys(updatedData.revenueStreamsDetails).length).toBeGreaterThan(0);

    writeFileSyncMock.mockRestore();
  });

  it('should handle missing revenue.json file gracefully', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
    const processExitMock = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit called'); });

    try {
      const updateRevenueData = require('./update_revenue_data').default || require('./update_revenue_data');
      updateRevenueData();
    } catch (error) {
      const e = error as Error;
      expect(e.message).toBe('process.exit called');
    }

    expect(consoleErrorMock).toHaveBeenCalledWith(expect.stringContaining('Revenue data file not found'));
    expect(processExitMock).toHaveBeenCalled();

    consoleErrorMock.mockRestore();
    processExitMock.mockRestore();
  });

  it('should add multiple entries correctly', () => {
    const originalData = {
      totalRevenue: 2000000,
      purchases: {
        corporateHomes: 500000,
        corporateHomesDetails: [
          {
            address: 'Old Address',
            city: 'Old City',
            state: 'OS',
            cost: 200000,
            purchaseDate: '2020-01-01T00:00:00.000Z'
          }
        ],
        autoFleet: 100000,
        autoFleetDetails: [
          {
            model: 'Old Model',
            vin: 'OLDVIN123456789',
            dealership: 'Old Dealership',
            cost: 100000,
            purchaseDate: '2020-01-01T00:00:00.000Z'
          }
        ]
      },
      revenueStreams: {
        "Sample Repo": {
          amount: 1000000,
          accountNumber: "111111111",
          routingNumber: "222222222"
        }
      },
      revenueStreamsDetails: {
        "Sample Repo": [
          {
            transactionId: 'TXN-123456',
            amount: 1000000,
            date: '2020-01-01T00:00:00.000Z',
            description: 'Old transaction'
          }
        ]
      }
    };

    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(originalData));
    const writeFileSyncMock = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

    // Import and run the update script
    const updateRevenueData = require('./update_revenue_data').default || require('./update_revenue_data');
    updateRevenueData();

    expect(writeFileSyncMock).toHaveBeenCalled();

    const updatedData = JSON.parse((writeFileSyncMock.mock.calls[0][1] as string).toString());

    // Existing entries should remain
    expect(updatedData.purchases.corporateHomesDetails.length).toBe(1);
    expect(updatedData.purchases.autoFleetDetails.length).toBe(1);
    expect(updatedData.revenueStreamsDetails["Sample Repo"].length).toBe(1);

    writeFileSyncMock.mockRestore();
  });
});

describe('update_revenue_data edge cases', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should handle malformed revenue.json gracefully', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockReturnValue('malformed json');
    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});

    try {
      const updateRevenueData = require('./update_revenue_data').default || require('./update_revenue_data');
      updateRevenueData();
    } catch (error) {
      const e = error;
      expect(e).toBeDefined();
    }

    consoleErrorMock.mockRestore();
  });

  it('should correctly update totalRevenue with various data inputs', () => {
    const originalData = {
      totalRevenue: 1000000,
      purchases: {
        corporateHomes: 100000,
        corporateHomesDetails: [],
        autoFleet: 0,
        autoFleetDetails: []
      },
      revenueStreams: {
        "Stream A": {
          amount: 300000,
          accountNumber: "123456789",
          routingNumber: "987654321"
        }
      },
      revenueStreamsDetails: {}
    };

    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(originalData));
    const writeFileSyncMock = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

    const updateRevenueData = require('./update_revenue_data').default || require('./update_revenue_data');
    updateRevenueData();

    expect(writeFileSyncMock).toHaveBeenCalled();

    const updatedData = JSON.parse((writeFileSyncMock.mock.calls[0][1] as string).toString());

    // totalRevenue should be decreased by sum of purchases costs
    const expectedTotalRevenue = originalData.totalRevenue - 50000 - 250000;
    expect(updatedData.totalRevenue).toBe(expectedTotalRevenue);

    writeFileSyncMock.mockRestore();
  });
});
