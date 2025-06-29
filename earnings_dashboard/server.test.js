const request = require('supertest');
const { app } = require('./server');
const fs = require('fs');
const path = require('path');

jest.mock('./update_revenue_data');
jest.mock('./fetch_and_sync_payroll');

const updateRevenueData = require('./update_revenue_data').default || require('./update_revenue_data');
const fetchAndSyncPayroll = require('./fetch_and_sync_payroll').default || require('./fetch_and_sync_payroll');

describe('Update API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/update/revenue - success', async () => {
    updateRevenueData.mockResolvedValue();
    const res = await request(app).get('/api/update/revenue');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: 'Revenue data updated successfully' });
    expect(updateRevenueData).toHaveBeenCalledTimes(1);
  });

  test('GET /api/update/revenue - failure', async () => {
    updateRevenueData.mockRejectedValue(new Error('Update failed'));
    const res = await request(app).get('/api/update/revenue');
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to update revenue data' });
  });

  test('GET /api/update/payroll - success', async () => {
    fetchAndSyncPayroll.mockResolvedValue();
    const res = await request(app).get('/api/update/payroll');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: 'Payroll data updated successfully' });
    expect(fetchAndSyncPayroll).toHaveBeenCalledTimes(1);
  });

  test('GET /api/update/payroll - failure', async () => {
    fetchAndSyncPayroll.mockRejectedValue(new Error('Payroll update failed'));
    const res = await request(app).get('/api/update/payroll');
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to update payroll data' });
  });

  test('GET /api/update/all - success', async () => {
    updateRevenueData.mockResolvedValue();
    fetchAndSyncPayroll.mockResolvedValue();
    const res = await request(app).get('/api/update/all');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: 'Revenue and payroll data updated successfully' });
    expect(updateRevenueData).toHaveBeenCalledTimes(1);
    expect(fetchAndSyncPayroll).toHaveBeenCalledTimes(1);
  });

  test('GET /api/update/all - failure', async () => {
    updateRevenueData.mockRejectedValue(new Error('Update failed'));
    const res = await request(app).get('/api/update/all');
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to update all data' });
  });
});
