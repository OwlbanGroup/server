# Setup Instructions for Environment Variables and Employee IDs

This document guides you through setting up the necessary environment variables and employee IDs for the payroll data synchronization process.

## 1. Environment Variables

You need to set the following environment variables in your system or development environment:

- **DYNAMICS365_BASE_URL**: The base URL for your Dynamics365 API.
- **DYNAMICS365_ACCESS_TOKEN**: The access token for authenticating API requests.

### Setting Environment Variables on Windows

1. Open the Start menu and search for "Environment Variables".
2. Click on "Edit the system environment variables".
3. In the System Properties window, click "Environment Variables".
4. Under "User variables" or "System variables", click "New".
5. Enter the variable name and value.
6. Click OK to save.

### Setting Environment Variables in VSCode

You can create a `.env` file in your project root with the following content:

```
DYNAMICS365_BASE_URL=https://your-dynamics365-api-url
DYNAMICS365_ACCESS_TOKEN=your-access-token
```

Make sure to use a package like `dotenv` to load these variables in your Node.js application.

## 2. Employee IDs

Update the `fetch_and_sync_payroll.ts` script with the actual employee IDs you want to fetch payroll data for.

Example:

```typescript
const employeeIds = [
  "employee-id-1",
  "employee-id-2",
  "employee-id-3",
];
```

Replace the placeholder IDs with your actual employee IDs.

## 3. Running the Synchronization

After setting the environment variables and updating employee IDs:

- Run the script `fetch_and_sync_payroll.ts` to fetch and update payroll data.
- Verify the `revenue.json` file is updated with the latest payroll data.

---

If you need assistance with any of these steps, please let me know.
