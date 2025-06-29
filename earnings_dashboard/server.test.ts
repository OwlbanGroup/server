/** @jest-environment node */
import request from 'supertest';
import { app, server } from './server';

afterAll(() => {
  server.close();
});

describe('OSCAR Earnings Dashboard API Tests', () => {
  describe('GET /api/earnings', () => {
    it('should return earnings data with status 200', async () => {
      const response = await request(app)
        .get('/api/earnings')
        .auth('admin', 'securepassword');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalAnnualRevenue');
      expect(response.body).toHaveProperty('totalDailyRevenue');
      expect(response.body).toHaveProperty('revenueStreams');
      for (const stream of Object.values(response.body.revenueStreams)) {
        expect(stream).toHaveProperty('amount');
        expect(stream).toHaveProperty('accountNumber');
      }
    });

    it('should return 401 if authentication fails', async () => {
      const response = await request(app).get('/api/earnings');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/earnings/download', () => {
    it('should return a JSON file with earnings data', async () => {
      const response = await request(app)
        .get('/api/earnings/download')
        .auth('admin', 'securepassword');
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.headers['content-disposition']).toMatch(/attachment/);
      const body = JSON.parse(response.text);
      expect(body).toHaveProperty('totalAnnualRevenue');
      expect(body).toHaveProperty('totalDailyRevenue');
      expect(body).toHaveProperty('revenueStreams');
      for (const stream of Object.values(body.revenueStreams)) {
        expect(stream).toHaveProperty('amount');
        expect(stream).toHaveProperty('accountNumber');
      }
    });

    it('should return 401 if authentication fails', async () => {
      const response = await request(app).get('/api/earnings/download');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /', () => {
    it('should return the HTML dashboard', async () => {
      const response = await request(app)
        .get('/')
        .auth('admin', 'securepassword');
      expect(response.status).toBe(200);
      expect(response.text).toMatch(/OWLban Earnings Dashboard/);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 for an internal server error', async () => {
      // Simulate error by mocking getRevenueReport to throw
      const wealthEngine = app.locals.wealthEngine;
      const originalGetRevenueReport = wealthEngine.getRevenueReport;
      wealthEngine.getRevenueReport = () => { throw new Error('Test error'); };
      const response = await request(app)
        .get('/api/earnings')
        .auth('admin', 'securepassword');
      expect(response.status).toBe(500);
      wealthEngine.getRevenueReport = originalGetRevenueReport;
    });
  });

  describe('Invalid Routes', () => {
    it('should return 404 for unknown route', async () => {
      const response = await request(app)
        .get('/invalid-route')
        .auth('admin', 'securepassword');
      expect(response.status).toBe(404);
    });
  });

  describe('Unsupported Methods on /api/earnings', () => {
    it('should return 404 or 405 for POST method', async () => {
      const response = await request(app)
        .post('/api/earnings')
        .auth('admin', 'securepassword');
      expect([404, 405]).toContain(response.status);
    });
  });

  describe('Malformed Requests', () => {
    it('should return 401 if Authorization header is missing', async () => {
      const response = await request(app).get('/api/earnings');
      expect(response.status).toBe(401);
    });
  });
});
