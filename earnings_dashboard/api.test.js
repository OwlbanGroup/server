const request = require('supertest');
const { app, server } = require('./server_rebuilt');

describe('API Endpoint Tests', () => {
  afterAll(() => {
    server.close();
  });

  const authHeader = 'Basic ' + Buffer.from('admin:securepassword').toString('base64');

  test('GET /api/earnings - success', async () => {
    const res = await request(app)
      .get('/api/earnings')
      .set('Authorization', authHeader);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('totalAnnualRevenue');
  });

  test('GET /api/earnings - unauthorized', async () => {
    const res = await request(app).get('/api/earnings');
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/earnings/download - success', async () => {
    const res = await request(app)
      .get('/api/earnings/download')
      .set('Authorization', authHeader);
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-disposition']).toContain('attachment');
  });

  test('GET / - dashboard page', async () => {
    const res = await request(app)
      .get('/')
      .set('Authorization', authHeader);
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('OWLban Earnings Dashboard');
  });

  // New tests for purchase endpoints
  describe('Purchase API Endpoints', () => {
    test('POST /api/purchase/home - success', async () => {
      const res = await request(app)
        .post('/api/purchase/home')
        .set('Authorization', authHeader)
        .send({ cost: 1000 });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'Corporate home purchased successfully');
      expect(res.body).toHaveProperty('remainingRevenue');
      expect(res.body.purchases).toHaveProperty('corporateHomes');
    });

    test('POST /api/purchase/home - invalid cost', async () => {
      const res = await request(app)
        .post('/api/purchase/home')
        .set('Authorization', authHeader)
        .send({ cost: -10 });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'Invalid cost value');
    });

    test('POST /api/purchase/home - insufficient revenue', async () => {
      const res = await request(app)
        .post('/api/purchase/home')
        .set('Authorization', authHeader)
        .send({ cost: 999999999999 });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'Insufficient revenue to make this purchase');
    });

    test('POST /api/purchase/auto - success', async () => {
      const carDetails = {
        cost: 2000,
        model: 'Test Model',
        vin: 'TESTVIN123456',
        dealership: 'Test Dealership'
      };
      const res = await request(app)
        .post('/api/purchase/auto')
        .set('Authorization', authHeader)
        .send(carDetails);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'Auto fleet purchased successfully');
      expect(res.body).toHaveProperty('remainingRevenue');
      expect(res.body.purchases).toHaveProperty('autoFleet');
      expect(res.body.purchases.autoFleetDetails.some(car => car.vin === carDetails.vin)).toBe(true);
    });

    test('POST /api/purchase/auto - missing details', async () => {
      const res = await request(app)
        .post('/api/purchase/auto')
        .set('Authorization', authHeader)
        .send({ cost: 1000, model: 'Model X' }); // missing vin and dealership
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'Missing required car details: model, vin, dealership');
    });

    test('POST /api/purchase/auto - invalid cost', async () => {
      const res = await request(app)
        .post('/api/purchase/auto')
        .set('Authorization', authHeader)
        .send({ cost: -100, model: 'Model X', vin: 'VIN123', dealership: 'Dealer' });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'Invalid cost value');
    });

    test('POST /api/purchase/auto - insufficient revenue', async () => {
      const res = await request(app)
        .post('/api/purchase/auto')
        .set('Authorization', authHeader)
        .send({ cost: 999999999999, model: 'Model X', vin: 'VIN123', dealership: 'Dealer' });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'Insufficient revenue to make this purchase');
    });
  });

  // New tests for delivery endpoints
  describe('Delivery API Endpoints', () => {
    test('POST /api/delivery/mark-delivered - success', async () => {
      // First purchase a car to have a VIN to mark delivered
      const carDetails = {
        cost: 1500,
        model: 'Delivery Test Model',
        vin: 'DELIVERYVIN123',
        dealership: 'Delivery Dealership'
      };
      await request(app)
        .post('/api/purchase/auto')
        .set('Authorization', authHeader)
        .send(carDetails);

      const res = await request(app)
        .post('/api/delivery/mark-delivered')
        .set('Authorization', authHeader)
        .send({ vin: carDetails.vin, deliveryDate: '2025-01-01', deliveryAddress: '123 Delivery St' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'Car marked as delivered');
      expect(res.body.car).toHaveProperty('vin', carDetails.vin);
      expect(res.body.car).toHaveProperty('deliveryStatus', 'delivered');
      expect(res.body.car).toHaveProperty('deliveryDate');
      expect(res.body.car).toHaveProperty('deliveryAddress', '123 Delivery St');
    });

    test('POST /api/delivery/mark-delivered - missing VIN', async () => {
      const res = await request(app)
        .post('/api/delivery/mark-delivered')
        .set('Authorization', authHeader)
        .send({});
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'Missing VIN for delivery update');
    });

    test('POST /api/delivery/mark-delivered - VIN not found', async () => {
      const res = await request(app)
        .post('/api/delivery/mark-delivered')
        .set('Authorization', authHeader)
        .send({ vin: 'NONEXISTENTVIN' });
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error', 'Car with specified VIN not found');
    });

    test('GET /api/delivery/status - success', async () => {
      const res = await request(app)
        .get('/api/delivery/status')
        .set('Authorization', authHeader);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('autoFleetDetails');
      expect(Array.isArray(res.body.autoFleetDetails)).toBe(true);
    });
  });

  // New tests for data synchronization endpoint
  describe('Data Synchronization API Endpoint', () => {
    test('POST /api/sync/all - success', async () => {
      const res = await request(app)
        .post('/api/sync/all')
        .set('Authorization', authHeader);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'Data synchronization completed successfully');
    });

    test('POST /api/sync/all - failure', async () => {
      // Mock syncAllData to throw error
      const originalSyncAllData = require('./sync_jobs').syncAllData;
      require('./sync_jobs').syncAllData = jest.fn(() => { throw new Error('Sync failed'); });

      const res = await request(app)
        .post('/api/sync/all')
        .set('Authorization', authHeader);

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('error', 'Data synchronization failed');

      // Restore original function
      require('./sync_jobs').syncAllData = originalSyncAllData;
    });
  });
});
