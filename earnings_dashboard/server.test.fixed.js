const request = require('supertest');
const express = require('express');
const { app, server } = require('./server'); // Adjust the path if necessary

afterAll(() => {
  server.close();
});

describe('Earnings Dashboard API Tests', () => {
  // Test for the /api/earnings endpoint
  describe('GET /api/earnings', () => {
    it('should return earnings data with status 200', async () => {
      const response = await request(server)
        .get('/api/earnings')
        .auth('admin', 'securepassword'); // Replace with environment variables if needed
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalAnnualRevenue');
      expect(response.body).toHaveProperty('totalDailyRevenue');
      expect(response.body).toHaveProperty('revenueStreams');
    });

    it('should return 401 if authentication fails', async () => {
      const response = await request(server)
        .get('/api/earnings')
        .auth('wronguser', 'wrongpassword');
      expect(response.status).toBe(401);
    });
  });

  // Test for the /api/earnings/download endpoint
  describe('GET /api/earnings/download', () => {
    it('should return a JSON file with earnings data', async () => {
      const response = await request(server)
        .get('/api/earnings/download')
        .auth('admin', 'securepassword'); // Replace with environment variables if needed
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/^application\/json/);
      expect(response.headers['content-disposition']).toContain('attachment; filename="earnings_report.json"');
    });
  });

  // Test for the root endpoint
  describe('GET /', () => {
    it('should return the HTML dashboard', async () => {
      const response = await request(server)
        .get('/')
        .auth('admin', 'securepassword'); // Replace with environment variables if needed
      expect(response.status).toBe(200);
      expect(response.text).toContain('<h1>OWLban Earnings Dashboard</h1>');
    });
  });

  // Test for error handling
  describe('Error Handling', () => {
    it('should return 500 for an internal server error', async () => {
      // Mock the getRevenueReport method to throw an error
      jest.spyOn(app.locals.wealthEngine, 'getRevenueReport').mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      const response = await request(server)
        .get('/api/earnings')
        .auth('admin', 'securepassword');
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Failed to fetch earnings data');

      // Restore the original implementation
      app.locals.wealthEngine.getRevenueReport.mockRestore();
    });
  });
});
