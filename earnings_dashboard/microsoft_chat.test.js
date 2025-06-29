const request = require('supertest');
const app = require('./server'); // Assuming server.js exports the Express app

describe('GET /microsoft/chat', () => {
  it('should return 200 and success message with valid query parameters', async () => {
    const response = await request(app)
      .get('/microsoft/chat')
      .query({
        auth: '2',
        origin: 'ProfileAboutMe',
        origindomain: 'microsoft365',
        redirectOrgId: 'dc3405c4-651b-4650-8231-78739bd4f8c6',
        redirectUserId: 'user123'
      });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('message', 'Microsoft chat/profile auth redirect received');
    expect(response.body).toHaveProperty('query');
    expect(response.body.query).toMatchObject({
      auth: '2',
      origin: 'ProfileAboutMe',
      origindomain: 'microsoft365',
      redirectOrgId: 'dc3405c4-651b-4650-8231-78739bd4f8c6',
      redirectUserId: 'user123'
    });
  });

  it('should return 400 error if required query parameters are missing', async () => {
    const response = await request(app)
      .get('/microsoft/chat')
      .query({
        auth: '2',
        origin: 'ProfileAboutMe'
        // missing other params
      });
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should handle unexpected errors gracefully', async () => {
    // Simulate error by sending invalid query param type or other means
    const response = await request(app)
      .get('/microsoft/chat')
      .query(null); // invalid query
    expect([400, 500]).toContain(response.statusCode);
  });
});
