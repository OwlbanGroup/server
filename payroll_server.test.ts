import request from 'supertest';
import app from './payroll_server';

describe('Payroll Server API', () => {
  let employeeId = 'emp1';

  it('should add a new employee', async () => {
    const res = await request(app)
      .post('/api/payroll/employees')
      .send({
        id: employeeId,
        name: 'John Doe',
        salary: 50000,
        taxRate: 0.2,
        deductions: 1000,
        bonuses: 500,
        accountNumber: '123456789',
        routingNumber: '987654321',
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe('Employee added/updated successfully');
  });

  it('should get all employees', async () => {
    const res = await request(app).get('/api/payroll/employees');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.find((e: any) => e.id === employeeId)).toBeDefined();
  });

  it('should update an existing employee', async () => {
    const res = await request(app)
      .post('/api/payroll/employees')
      .send({
        id: employeeId,
        name: 'John Doe Updated',
        salary: 55000,
        taxRate: 0.22,
        deductions: 1200,
        bonuses: 600,
        accountNumber: '123456789',
        routingNumber: '987654321',
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe('Employee added/updated successfully');
  });

  it('should delete an employee', async () => {
    const res = await request(app).delete(`/api/payroll/employees/${employeeId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe('Employee deleted successfully');
  });

  it('should process payroll', async () => {
    // Add employee first
    await request(app)
      .post('/api/payroll/employees')
      .send({
        id: employeeId,
        name: 'John Doe',
        salary: 50000,
        taxRate: 0.2,
        deductions: 1000,
        bonuses: 500,
        accountNumber: '123456789',
        routingNumber: '987654321',
      });

    const res = await request(app).post('/api/payroll/process');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    const payrollRecord = res.body.find((p: any) => p.employeeId === employeeId);
    expect(payrollRecord).toBeDefined();
    expect(payrollRecord.netPay).toBeCloseTo(50000 - 50000 * 0.2 - 1000 + 500);
  });
});
